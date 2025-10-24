import express from 'express';
import GoogleAuthService from '../services/googleAuth';
import GoogleDriveService from '../services/googleDrive';
import GoogleCalendarService from '../services/googleCalendar';
import GmailService from '../services/gmail';
import { MicrosoftAuthService } from '../services/microsoftAuth';
import IntegrationsFirestoreService from '../services/integrations.firestore.service';
import { EmailsFirestoreService } from '../services/emails.firestore.service';
import { firebaseAuthMiddleware as auth, FirebaseAuthRequest } from '../middleware/firebaseAuth';
import logger from '../utils/logger';

const router = express.Router();

// Helper function to ensure valid access token for Google integrations
async function ensureValidGoogleAccessToken(integration: { expiresAt?: Date | null; refreshToken?: string; accessToken: string; id: string }) {
  if (!integration.accessToken) {
    throw new Error('No access token available');
  }

  if (!integration.expiresAt || !integration.refreshToken) {
    return integration.accessToken;
  }

  // If token expires within 5 minutes, refresh it
  if (IntegrationsFirestoreService.isTokenExpiringSoon(integration.expiresAt)) {
    try {
      logger.info(`Refreshing Google access token for integration ${integration.id}`);
      const refreshedTokens = await GoogleAuthService.refreshAccessToken(integration.refreshToken);

      // Update the integration with new tokens
      await IntegrationsFirestoreService.refreshToken(integration.id, refreshedTokens);

      return refreshedTokens.access_token;
    } catch (error) {
      logger.error('Failed to refresh Google access token:', error);
      throw new Error('Failed to refresh Google access token');
    }
  }

  return integration.accessToken;
}

// Helper function to ensure valid access token for Microsoft integrations
async function ensureValidMicrosoftAccessToken(integration: { expiresAt?: Date | null; refreshToken?: string; accessToken: string; id: string }) {
  if (!integration.accessToken) {
    throw new Error('No access token available');
  }

  // Check if token is expired
  const isExpired = integration.expiresAt && integration.expiresAt.getTime() < Date.now();
  
  if (isExpired) {
    logger.warn(`Microsoft access token is expired for integration ${integration.id}`, {
      expiresAt: integration.expiresAt,
      timeSinceExpiry: integration.expiresAt ? (Date.now() - integration.expiresAt.getTime()) / 1000 : 'unknown'
    });
    
    // For now, still try to use the expired token - this will help us see the exact error
    logger.info('Attempting to use expired token to get detailed error information');
  }

  logger.info(`Using Microsoft access token for integration ${integration.id}`, {
    hasRefreshToken: !!integration.refreshToken,
    expiresAt: integration.expiresAt,
    isExpired: isExpired,
    timeUntilExpiry: integration.expiresAt ? (integration.expiresAt.getTime() - Date.now()) / 1000 : 'unknown'
  });

  return integration.accessToken;
}

// Test endpoint to verify Google integration setup (NO AUTH REQUIRED - debug endpoint)
router.get('/test', async (req, res) => {
  try {
    const hasClientId = !!process.env.GOOGLE_CLIENT_ID;
    const hasClientSecret = !!process.env.GOOGLE_CLIENT_SECRET;
    const hasRedirectUri = !!process.env.GOOGLE_REDIRECT_URI;

    // Generate a test OAuth URL to debug
    let testAuthUrl = null;
    if (hasClientId && hasClientSecret && hasRedirectUri) {
      const testScopes = GoogleAuthService.getScopes(['profile']);
      testAuthUrl = GoogleAuthService.getAuthUrl(testScopes, 'test-user');
    }

    res.json({
      success: true,
      data: {
        googleSetup: {
          hasClientId,
          hasClientSecret,
          hasRedirectUri,
          clientId: process.env.GOOGLE_CLIENT_ID,
          redirectUri: process.env.GOOGLE_REDIRECT_URI,
          isConfigured: hasClientId && hasClientSecret && hasRedirectUri
        },
        testAuthUrl,
        message: hasClientId && hasClientSecret && hasRedirectUri
          ? 'Google integration is properly configured'
          : 'Google integration is missing required environment variables'
      }
    });
  } catch (error) {
    logger.error('Error testing Google integration setup:', error);
    res.status(500).json({ success: false, error: 'Failed to test Google integration setup' });
  }
});

// Test endpoint to check Microsoft integration status (NO AUTH REQUIRED - debug endpoint)
router.get('/microsoft/test', async (req, res) => {
  try {
    // Get all Microsoft integrations
    const integrations = await IntegrationsFirestoreService.findMany({
      userId: 'all', // Get all users' Microsoft integrations for testing
      provider: 'microsoft',
      isActive: true
    });

    res.json({
      success: true,
      integrations: integrations.map(integration => ({
        id: integration.id,
        userId: integration.userId,
        type: integration.type,
        hasAccessToken: !!integration.accessToken,
        hasRefreshToken: !!integration.refreshToken,
        expiresAt: integration.expiresAt,
        services: (integration as any).services,
        isExpired: integration.expiresAt ? integration.expiresAt.getTime() < Date.now() : 'unknown'
      }))
    });
  } catch (error) {
    logger.error('Microsoft integration test error:', error);
    res.status(500).json({ success: false, error: 'Microsoft integration test failed' });
  }
});

// Get user's integrations (requires auth)
router.get('/', auth, async (req, res) => {
  try {
    const userId = (req as FirebaseAuthRequest).userId;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    logger.info('Fetching integrations for user', { userId, userEmail: (req as FirebaseAuthRequest).user?.email });

    const userIntegrations = await IntegrationsFirestoreService.findMany({
      userId
    });

    logger.info('Found integrations', {
      userId,
      count: userIntegrations.length,
      integrationIds: userIntegrations.map((i) => i.id)
    });

    res.json({
      success: true,
      data: userIntegrations.map((integration) => ({
        id: integration.id,
        provider: integration.provider,
        type: integration.type,
        isActive: integration.isActive,
        profile: integration.profile,
        scope: integration.scope,
        createdAt: integration.createdAt,
        updatedAt: integration.updatedAt
      }))
    });
  } catch (error) {
    logger.error('Error fetching integrations:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch integrations' });
  }
});

// Initiate Google OAuth flow (requires auth)
router.post('/google/connect', auth, async (req, res) => {
  const { types } = req.body; // ['profile', 'drive', 'calendar', 'gmail']
  const userId = (req as FirebaseAuthRequest).userId;

  try {

    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    if (!types || !Array.isArray(types)) {
      return res.status(400).json({
        success: false,
        error: 'Types array is required'
      });
    }

    logger.info('Google OAuth connect request', { userId, types });
    
    const scopes = GoogleAuthService.getScopes(types);
    logger.info('Generated scopes', { scopes });
    
    const authUrl = GoogleAuthService.getAuthUrl(types, userId);
    logger.info('Generated auth URL', { authUrl });

    res.json({
      success: true,
      data: {
        authUrl,
        scopes,
        types
      }
    });
  } catch (error) {
    logger.error('Error initiating Google OAuth:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      userId,
      types
    });
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to initiate OAuth flow' 
    });
  }
});

// Handle Google OAuth callback (NO AUTH REQUIRED - this is the callback)
router.get('/google/callback', async (req, res) => {
  try {
    const { code, state, error: oauthError } = req.query;

    // Handle OAuth errors from Google
    if (oauthError) {
      logger.error('OAuth error from Google:', { error: oauthError, description: req.query.error_description });
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3001'}/settings?integration=error&reason=${encodeURIComponent(oauthError as string)}`);
    }

    if (!code || !state) {
      logger.error('Missing authorization code or state in OAuth callback', { code: !!code, state: !!state });
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3001'}/settings?integration=error&reason=missing_parameters`);
    }

    // Extract userId from state (format: userId:timestamp)
    const [userId, timestamp] = (state as string).split(':');

    if (!userId) {
      logger.error('Invalid state parameter format', { state });
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3001'}/settings?integration=error&reason=invalid_state`);
    }

    // Validate timestamp (should be within last 10 minutes for security)
    const stateTimestamp = parseInt(timestamp);
    const now = Date.now();
    const maxAge = 10 * 60 * 1000; // 10 minutes

    if (!timestamp || isNaN(stateTimestamp) || (now - stateTimestamp) > maxAge) {
      logger.error('Expired or invalid state timestamp', {
        timestamp,
        stateTimestamp,
        age: now - stateTimestamp,
        maxAge
      });
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3001'}/settings?integration=error&reason=expired_state`);
    }

    logger.info('Processing Google OAuth callback', { userId, codeLength: (code as string).length, stateAge: now - stateTimestamp });

    // Exchange code for tokens
    const tokens = await GoogleAuthService.exchangeCodeForTokens(code as string);
    logger.info('Successfully exchanged code for tokens', { hasAccessToken: !!tokens.access_token, hasRefreshToken: !!tokens.refresh_token });

    // Get user profile
    const profile = await GoogleAuthService.getUserProfile(tokens.access_token);
    logger.info('Retrieved user profile', { email: profile.email, name: profile.name });

    // Determine integration types based on scopes
    const scopeList = tokens.scope.split(' ');
    const types: string[] = [];

    if (scopeList.some((s: string) => s.includes('userinfo'))) types.push('profile');
    if (scopeList.some((s: string) => s.includes('drive'))) types.push('drive');
    if (scopeList.some((s: string) => s.includes('calendar'))) types.push('calendar');
    if (scopeList.some((s: string) => s.includes('gmail'))) types.push('gmail');

    logger.info('Determined integration types from scopes', { types, scopeCount: scopeList.length });

    if (types.length === 0) {
      logger.error('No valid integration types found in scopes', { scopes: scopeList });
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3001'}/settings?integration=error&reason=invalid_scopes`);
    }

    // Create integrations for each type
    const createdIntegrations = [];
    for (const type of types) {
      // Remove existing integration of same type
      const deleted = await IntegrationsFirestoreService.deleteMany({
        userId: userId as string,
        provider: 'google',
        type: type
      });

      if (deleted.count > 0) {
        logger.info(`Removed ${deleted.count} existing ${type} integration(s) for user ${userId}`);
      }

      // Create new integration
      const integration = await IntegrationsFirestoreService.create({
        userId: userId as string,
        provider: 'google',
        type: type as any,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
        scope: scopeList,
        profile: {
          email: profile.email,
          name: profile.name,
          picture: profile.picture as string | undefined
        },
        isActive: true
      });

      createdIntegrations.push(integration);
      logger.info(`Created ${type} integration`, { integrationId: integration.id });
    }

    logger.info('Google OAuth callback completed successfully', {
      userId,
      integrationsCreated: createdIntegrations.length,
      types: types,
      integrationIds: createdIntegrations.map(i => i.id)
    });

    // Redirect to settings page with success status
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3001'}/settings?integration=success&types=${encodeURIComponent(types.join(','))}&userId=${userId}`);
  } catch (error) {
    logger.error('Error handling Google OAuth callback:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      userId: req.query.state,
      hasCode: !!req.query.code
    });
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3001'}/settings?integration=error&reason=server_error`);
  }
});

// Fix Microsoft integration - add services array if missing (requires auth)
router.post('/:id/fix-outlook', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = (req as FirebaseAuthRequest).userId;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    const integration = await IntegrationsFirestoreService.findById(id, userId);

    if (!integration) {
      return res.status(404).json({
        success: false,
        error: 'Integration not found'
      });
    }

    if (integration.provider !== 'microsoft') {
      return res.status(400).json({
        success: false,
        error: 'This endpoint only works for Microsoft integrations'
      });
    }

    logger.info('Fixing Microsoft integration - adding services array', { integrationId: id, userId });

    // Update the integration to add services array with outlook
    await IntegrationsFirestoreService.update(id, {
      services: ['outlook', 'onedrive', 'teams'] // Add all common services
    });

    logger.info('Successfully added services array to Microsoft integration', { integrationId: id });

    res.json({
      success: true,
      message: 'Microsoft integration fixed - Outlook service enabled'
    });
  } catch (error) {
    logger.error('Error fixing Microsoft integration:', error);
    res.status(500).json({ success: false, error: 'Failed to fix integration' });
  }
});

// Disconnect integration (requires auth)
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = (req as FirebaseAuthRequest).userId;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    const integration = await IntegrationsFirestoreService.findById(id, userId);

    if (!integration) {
      return res.status(404).json({
        success: false,
        error: 'Integration not found'
      });
    }

    logger.info('Disconnecting integration and cleaning up emails', { integrationId: id, userId });

    // Delete all emails associated with this integration
    const deletedEmailCount = await EmailsFirestoreService.deleteEmailsByIntegration(userId, id);
    logger.info('Deleted emails for disconnected integration', { integrationId: id, deletedCount: deletedEmailCount });

    // Delete the integration
    await IntegrationsFirestoreService.delete(id);

    res.json({
      success: true,
      message: 'Integration disconnected successfully',
      deletedEmailCount
    });
  } catch (error) {
    logger.error('Error disconnecting integration:', error);
    res.status(500).json({ success: false, error: 'Failed to disconnect integration' });
  }
});

// Get Google Drive files (requires auth)
router.get('/google/drive/files', auth, async (req, res) => {
  try {
    const userId = (req as FirebaseAuthRequest).userId;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    const driveIntegration = await IntegrationsFirestoreService.findFirst({
      userId,
      provider: 'google',
      type: 'drive',
      isActive: true
    });

    if (!driveIntegration) {
      return res.status(404).json({
        success: false,
        error: 'Google Drive integration not found'
      });
    }

    const validAccessToken = await ensureValidGoogleAccessToken(driveIntegration);
    const files = await GoogleDriveService.listFiles(validAccessToken);

    res.json({
      success: true,
      data: files
    });
  } catch (error) {
    logger.error('Error fetching Drive files:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch Drive files' });
  }
});

// Get Google Drive folders (requires auth)
router.get('/google/drive/folders', auth, async (req, res) => {
  try {
    const userId = (req as FirebaseAuthRequest).userId;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    const driveIntegration = await IntegrationsFirestoreService.findFirst({
      userId,
      provider: 'google',
      type: 'drive',
      isActive: true
    });

    if (!driveIntegration) {
      return res.status(404).json({
        success: false,
        error: 'Google Drive integration not found. Please connect your Google Drive account first.'
      });
    }

    const validAccessToken = await ensureValidGoogleAccessToken(driveIntegration);
    const folders = await GoogleDriveService.getFolders(validAccessToken);

    res.json({
      success: true,
      data: folders
    });
  } catch (error) {
    logger.error('Error fetching Drive folders:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch Google Drive folders',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get Google Calendar events (requires auth)
router.get('/google/calendar/events', auth, async (req, res) => {
  try {
    const userId = (req as FirebaseAuthRequest).userId;
    const { timeMin, timeMax } = req.query;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    const calendarIntegration = await IntegrationsFirestoreService.findFirst({
      userId,
      provider: 'google',
      type: 'calendar',
      isActive: true
    });

    if (!calendarIntegration) {
      return res.status(404).json({
        success: false,
        error: 'Google Calendar integration not found'
      });
    }

    const validAccessToken = await ensureValidGoogleAccessToken(calendarIntegration);
    const events = await GoogleCalendarService.listEvents(
      validAccessToken,
      {
        timeMin: timeMin as string,
        timeMax: timeMax as string
      }
    );

    res.json({
      success: true,
      data: events
    });
  } catch (error) {
    logger.error('Error fetching Calendar events:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch Calendar events' });
  }
});

// Create Google Calendar event (requires auth)
router.post('/google/calendar/events', auth, async (req, res) => {
  try {
    const userId = (req as FirebaseAuthRequest).userId;
    const eventData = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    const calendarIntegration = await IntegrationsFirestoreService.findFirst({
      userId,
      provider: 'google',
      type: 'calendar',
      isActive: true
    });

    if (!calendarIntegration) {
      return res.status(404).json({
        success: false,
        error: 'Google Calendar integration not found'
      });
    }

    const validAccessToken = await ensureValidGoogleAccessToken(calendarIntegration);
    const event = await GoogleCalendarService.createEvent(
      validAccessToken,
      eventData
    );

    res.json({
      success: true,
      data: event
    });
  } catch (error) {
    logger.error('Error creating Calendar event:', error);
    res.status(500).json({ success: false, error: 'Failed to create Calendar event' });
  }
});

// Get Gmail messages (requires auth)
router.get('/google/gmail/messages', auth, async (req, res) => {
  try {
    const userId = (req as FirebaseAuthRequest).userId;
    const { q, labelIds, maxResults = 50, pageToken, includeSpamTrash } = req.query;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    const gmailIntegration = await IntegrationsFirestoreService.findFirst({
      userId,
      provider: 'google',
      type: 'gmail',
      isActive: true
    });

    if (!gmailIntegration) {
      return res.status(404).json({
        success: false,
        error: 'Gmail integration not found'
      });
    }

    const options: any = {};
    if (q) options.q = q as string;
    if (labelIds) options.labelIds = (labelIds as string).split(',');
    if (maxResults) options.maxResults = parseInt(maxResults as string, 10);
    if (pageToken) options.pageToken = pageToken as string;
    if (includeSpamTrash) options.includeSpamTrash = includeSpamTrash === 'true';

    const validAccessToken = await ensureValidGoogleAccessToken(gmailIntegration);
    const messages = await GmailService.listMessages(validAccessToken, options);

    res.json({
      success: true,
      data: messages
    });
  } catch (error) {
    logger.error('Error fetching Gmail messages:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch Gmail messages' });
  }
});

// Send Gmail email (requires auth)
router.post('/google/gmail/send', auth, async (req, res) => {
  try {
    const userId = (req as FirebaseAuthRequest).userId;
    const emailData = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    const gmailIntegration = await IntegrationsFirestoreService.findFirst({
      userId,
      provider: 'google',
      type: 'gmail',
      isActive: true
    });

    if (!gmailIntegration) {
      return res.status(404).json({
        success: false,
        error: 'Gmail integration not found'
      });
    }

    const validAccessToken = await ensureValidGoogleAccessToken(gmailIntegration);
    const sentMessage = await GmailService.sendEmail(validAccessToken, emailData);

    res.json({
      success: true,
      data: sentMessage
    });
  } catch (error) {
    logger.error('Error sending Gmail email:', error);
    res.status(500).json({ success: false, error: 'Failed to send Gmail email' });
  }
});

// Reply to Gmail email (requires auth)
router.post('/google/gmail/messages/:messageId/reply', auth, async (req, res) => {
  try {
    const userId = (req as FirebaseAuthRequest).userId;
    const { messageId } = req.params;
    const replyData = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    const gmailIntegration = await IntegrationsFirestoreService.findFirst({
      userId,
      provider: 'google',
      type: 'gmail',
      isActive: true
    });

    if (!gmailIntegration) {
      return res.status(404).json({
        success: false,
        error: 'Gmail integration not found'
      });
    }

    const validAccessToken = await ensureValidGoogleAccessToken(gmailIntegration);
    const reply = await GmailService.replyToEmail(
      validAccessToken,
      messageId,
      replyData
    );

    res.json({
      success: true,
      data: reply
    });
  } catch (error) {
    logger.error('Error replying to Gmail email:', error);
    res.status(500).json({ success: false, error: 'Failed to reply to Gmail email' });
  }
});

// Get Gmail threads (requires auth)
router.get('/google/gmail/threads', auth, async (req, res) => {
  try {
    const userId = (req as FirebaseAuthRequest).userId;
    const { q, labelIds, maxResults = 20, pageToken, includeSpamTrash } = req.query;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    const gmailIntegration = await IntegrationsFirestoreService.findFirst({
      userId,
      provider: 'google',
      type: 'gmail',
      isActive: true
    });

    if (!gmailIntegration) {
      return res.status(404).json({
        success: false,
        error: 'Gmail integration not found'
      });
    }

    const options: any = {};
    if (q) options.q = q as string;
    if (labelIds) options.labelIds = (labelIds as string).split(',');
    if (maxResults) options.maxResults = parseInt(maxResults as string, 10);
    if (pageToken) options.pageToken = pageToken as string;
    if (includeSpamTrash) options.includeSpamTrash = includeSpamTrash === 'true';

    const validAccessToken = await ensureValidGoogleAccessToken(gmailIntegration);
    const threads = await GmailService.listThreads(validAccessToken, options);

    res.json({
      success: true,
      data: threads
    });
  } catch (error) {
    logger.error('Error fetching Gmail threads:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch Gmail threads' });
  }
});

// Get Gmail labels (requires auth)
router.get('/google/gmail/labels', auth, async (req, res) => {
  try {
    const userId = (req as FirebaseAuthRequest).userId;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    const gmailIntegration = await IntegrationsFirestoreService.findFirst({
      userId,
      provider: 'google',
      type: 'gmail',
      isActive: true
    });

    if (!gmailIntegration) {
      return res.status(404).json({
        success: false,
        error: 'Gmail integration not found'
      });
    }

    const validAccessToken = await ensureValidGoogleAccessToken(gmailIntegration);
    const labels = await GmailService.listLabels(validAccessToken);

    res.json({
      success: true,
      data: labels
    });
  } catch (error) {
    logger.error('Error fetching Gmail labels:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch Gmail labels' });
  }
});

// MICROSOFT INTEGRATION ENDPOINTS

// Initiate Microsoft OAuth flow (requires auth)
router.post('/microsoft/connect', auth, async (req, res) => {
  try {
    const { types } = req.body; // ['profile', 'onedrive', 'outlook', 'teams']
    const userId = (req as FirebaseAuthRequest).userId;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    if (!types || !Array.isArray(types)) {
      return res.status(400).json({
        success: false,
        error: 'Types array is required'
      });
    }

    logger.info('Microsoft OAuth connect request', { userId, types });
    
    const scopes = MicrosoftAuthService.getScopes(types);
    logger.info('Generated Microsoft scopes', { scopes });
    
    const authUrl = MicrosoftAuthService.getAuthUrl(types, userId);
    logger.info('Generated Microsoft auth URL', { authUrl });

    res.json({
      success: true,
      data: {
        authUrl,
        scopes,
        types
      }
    });
  } catch (error) {
    logger.error('Error initiating Microsoft OAuth:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      userId: (req as FirebaseAuthRequest).userId,
      types: req.body?.types
    });
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to initiate Microsoft OAuth flow' 
    });
  }
});

// Handle Microsoft OAuth callback (NO AUTH REQUIRED - this is the callback)
router.get('/microsoft/callback', async (req, res) => {
  try {
    const { code, state, error: oauthError } = req.query;

    // Handle OAuth errors from Microsoft
    if (oauthError) {
      logger.error('OAuth error from Microsoft:', { error: oauthError, description: req.query.error_description });
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3001'}/settings?integration=error&provider=microsoft&reason=${encodeURIComponent(oauthError as string)}`);
    }

    if (!code || !state) {
      logger.error('Missing authorization code or state in Microsoft OAuth callback', { code: !!code, state: !!state });
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3001'}/settings?integration=error&provider=microsoft&reason=missing_parameters`);
    }

    // Extract userId from state (format: userId:timestamp)
    const [userId, timestamp] = (state as string).split(':');

    if (!userId) {
      logger.error('Invalid state parameter format', { state });
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3001'}/settings?integration=error&provider=microsoft&reason=invalid_state`);
    }

    // Validate timestamp (should be within last 10 minutes for security)
    const stateTimestamp = parseInt(timestamp);
    const now = Date.now();
    const maxAge = 10 * 60 * 1000; // 10 minutes

    if (!timestamp || isNaN(stateTimestamp) || (now - stateTimestamp) > maxAge) {
      logger.error('Expired or invalid state timestamp', {
        timestamp,
        stateTimestamp,
        age: now - stateTimestamp,
        maxAge
      });
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3001'}/settings?integration=error&provider=microsoft&reason=expired_state`);
    }

    logger.info('Processing Microsoft OAuth callback', { userId, codeLength: (code as string).length, stateAge: now - stateTimestamp });

    // Get the scopes that were requested (we need to reconstruct them)
    const requestedTypes = ['profile', 'onedrive', 'outlook', 'teams']; // Default to all types
    const requestedScopes = MicrosoftAuthService.getScopes(requestedTypes);
    logger.info('Using scopes for token exchange:', { requestedScopes });

    // Exchange code for tokens
    const tokens = await MicrosoftAuthService.exchangeCodeForTokens(code as string, requestedScopes);
    logger.info('Successfully exchanged code for Microsoft tokens', { hasAccessToken: !!tokens.access_token, hasRefreshToken: !!tokens.refresh_token });

    // Get user profile
    const profile = await MicrosoftAuthService.getUserProfile(tokens.access_token);
    logger.info('Retrieved Microsoft user profile', { email: profile.userPrincipalName, name: profile.displayName });

    // Determine integration types based on scopes
    const scopeList = tokens.scope.split(' ');
    const types: string[] = [];

    if (scopeList.some((s: string) => s.includes('User.Read'))) types.push('profile');
    if (scopeList.some((s: string) => s.includes('Files.ReadWrite'))) types.push('onedrive');
    if (scopeList.some((s: string) => s.includes('Mail.ReadWrite'))) types.push('outlook');
    if (scopeList.some((s: string) => s.includes('OnlineMeetings.ReadWrite'))) types.push('teams');

    logger.info('Determined Microsoft integration types from scopes', { types, scopeCount: scopeList.length });

    if (types.length === 0) {
      logger.error('No valid Microsoft integration types found in scopes', { scopes: scopeList });
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3001'}/settings?integration=error&provider=microsoft&reason=invalid_scopes`);
    }

    // Remove existing Microsoft integrations for this user
    const deleted = await IntegrationsFirestoreService.deleteMany({
      userId: userId as string,
      provider: 'microsoft'
    });

    if (deleted.count > 0) {
      logger.info(`Removed ${deleted.count} existing Microsoft integration(s) for user ${userId}`);
    }

    // Create single Microsoft Profile integration with services array
    const integrationData: any = {
      userId: userId as string,
      provider: 'microsoft',
      type: 'profile',
      accessToken: tokens.access_token,
      expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
      scope: scopeList,
      profile: {
        email: profile.userPrincipalName,
        name: profile.displayName
      },
      isActive: true,
      services: types.filter(t => t !== 'profile')
    };
    
    if (tokens.refresh_token) {
      integrationData.refreshToken = tokens.refresh_token;
    }
    
    const integration = await IntegrationsFirestoreService.create(integrationData);

    logger.info('Microsoft OAuth callback completed successfully', {
      userId,
      integrationId: integration.id,
      types: types,
      services: types.filter(t => t !== 'profile')
    });

    // Redirect to settings page with success status
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3001'}/settings?integration=success&provider=microsoft&types=${encodeURIComponent(types.join(','))}&userId=${userId}`);
  } catch (error) {
    logger.error('Error handling Microsoft OAuth callback:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      userId: req.query.state,
      hasCode: !!req.query.code
    });
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3001'}/settings?integration=error&provider=microsoft&reason=server_error`);
  }
});

// Get OneDrive files (requires auth)
router.get('/microsoft/onedrive/files', auth, async (req, res) => {
  try {
    const userId = (req as FirebaseAuthRequest).userId;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    const microsoftIntegration = await IntegrationsFirestoreService.findFirst({
      userId,
      provider: 'microsoft',
      type: 'profile',
      isActive: true
    });

    if (!microsoftIntegration) {
      return res.status(404).json({
        success: false,
        error: 'Microsoft integration not found'
      });
    }

    // Check if OneDrive service is enabled
    if (!(microsoftIntegration as any).services || !(microsoftIntegration as any).services.includes('onedrive')) {
      return res.status(404).json({
        success: false,
        error: 'OneDrive service not enabled for this Microsoft integration'
      });
    }

    const validAccessToken = await ensureValidMicrosoftAccessToken(microsoftIntegration);
    
    // Use Microsoft Graph API to fetch OneDrive files
    const response = await fetch('https://graph.microsoft.com/v1.0/me/drive/root/children', {
      headers: {
        'Authorization': `Bearer ${validAccessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Microsoft Graph API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as { value?: any[] };
    const files = data.value || [];

    res.json({
      success: true,
      data: files
    });
  } catch (error) {
    logger.error('Error fetching OneDrive files:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch OneDrive files' });
  }
});

// Get OneDrive folders (requires auth)
router.get('/microsoft/onedrive/folders', auth, async (req, res) => {
  try {
    const userId = (req as FirebaseAuthRequest).userId;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    const microsoftIntegration = await IntegrationsFirestoreService.findFirst({
      userId,
      provider: 'microsoft',
      type: 'profile',
      isActive: true
    });

    if (!microsoftIntegration) {
      return res.status(404).json({
        success: false,
        error: 'Microsoft integration not found'
      });
    }

    // Check if OneDrive service is enabled
    if (!(microsoftIntegration as any).services || !(microsoftIntegration as any).services.includes('onedrive')) {
      return res.status(404).json({
        success: false,
        error: 'OneDrive service not enabled for this Microsoft integration'
      });
    }

    const validAccessToken = await ensureValidMicrosoftAccessToken(microsoftIntegration);
    
    // Use Microsoft Graph API to fetch OneDrive folders
    const response = await fetch('https://graph.microsoft.com/v1.0/me/drive/root/children?$filter=folder ne null', {
      headers: {
        'Authorization': `Bearer ${validAccessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Microsoft Graph API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as { value?: any[] };
    const folders = data.value || [];

    res.json({
      success: true,
      data: folders
    });
  } catch (error) {
    logger.error('Error fetching OneDrive folders:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch OneDrive folders' });
  }
});

// Get Outlook messages (requires auth)
router.get('/microsoft/outlook/messages', auth, async (req, res) => {
  try {
    const userId = (req as FirebaseAuthRequest).userId;
    const { maxResults = 50, filter } = req.query;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    const microsoftIntegration = await IntegrationsFirestoreService.findFirst({
      userId,
      provider: 'microsoft',
      type: 'profile',
      isActive: true
    });

    if (!microsoftIntegration) {
      return res.status(404).json({
        success: false,
        error: 'Microsoft integration not found'
      });
    }

    // Check if Outlook service is enabled
    if (!(microsoftIntegration as any).services || !(microsoftIntegration as any).services.includes('outlook')) {
      return res.status(404).json({
        success: false,
        error: 'Outlook service not enabled for this Microsoft integration'
      });
    }

    const validAccessToken = await ensureValidMicrosoftAccessToken(microsoftIntegration);
    
    // Use Microsoft Graph API to fetch Outlook messages
    let url = `https://graph.microsoft.com/v1.0/me/messages?$top=${maxResults}&$orderby=receivedDateTime desc`;
    if (filter) {
      url += `&$filter=${filter}`;
    }

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${validAccessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Microsoft Graph API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as { value?: any[] };
    const messages = data.value || [];

    res.json({
      success: true,
      data: messages
    });
  } catch (error) {
    logger.error('Error fetching Outlook messages:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch Outlook messages' });
  }
});

// Send Outlook email (requires auth)
router.post('/microsoft/outlook/send', auth, async (req, res) => {
  try {
    const userId = (req as FirebaseAuthRequest).userId;
    const emailData = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    const microsoftIntegration = await IntegrationsFirestoreService.findFirst({
      userId,
      provider: 'microsoft',
      type: 'profile',
      isActive: true
    });

    if (!microsoftIntegration) {
      return res.status(404).json({
        success: false,
        error: 'Microsoft integration not found'
      });
    }

    // Check if Outlook service is enabled
    if (!(microsoftIntegration as any).services || !(microsoftIntegration as any).services.includes('outlook')) {
      return res.status(404).json({
        success: false,
        error: 'Outlook service not enabled for this Microsoft integration'
      });
    }

    const validAccessToken = await ensureValidMicrosoftAccessToken(microsoftIntegration);
    
    // Use Microsoft Graph API to send email
    const response = await fetch('https://graph.microsoft.com/v1.0/me/sendMail', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${validAccessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: {
          subject: emailData.subject,
          body: {
            contentType: emailData.isHtml ? 'HTML' : 'Text',
            content: emailData.body
          },
          toRecipients: Array.isArray(emailData.to) ? emailData.to.map((email: string) => ({ emailAddress: { address: email } })) : [{ emailAddress: { address: emailData.to } }]
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Microsoft Graph API error: ${response.status} ${response.statusText}`);
    }

    res.json({
      success: true,
      data: { message: 'Email sent successfully' }
    });
  } catch (error) {
    logger.error('Error sending Outlook email:', error);
    res.status(500).json({ success: false, error: 'Failed to send Outlook email' });
  }
});

// Get Teams meetings (requires auth)
router.get('/microsoft/teams/meetings', auth, async (req, res) => {
  try {
    const userId = (req as FirebaseAuthRequest).userId;
    const { startTime, endTime } = req.query;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    const microsoftIntegration = await IntegrationsFirestoreService.findFirst({
      userId,
      provider: 'microsoft',
      type: 'profile',
      isActive: true
    });

    if (!microsoftIntegration) {
      return res.status(404).json({
        success: false,
        error: 'Microsoft integration not found'
      });
    }

    // Check if Teams service is enabled
    if (!(microsoftIntegration as any).services || !(microsoftIntegration as any).services.includes('teams')) {
      return res.status(404).json({
        success: false,
        error: 'Teams service not enabled for this Microsoft integration'
      });
    }

    const validAccessToken = await ensureValidMicrosoftAccessToken(microsoftIntegration);
    
    // Use Microsoft Graph API to fetch Teams meetings
    let url = 'https://graph.microsoft.com/v1.0/me/onlineMeetings';
    if (startTime && endTime) {
      url += `?$filter=startDateTime ge ${startTime} and endDateTime le ${endTime}`;
    }

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${validAccessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Microsoft Graph API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as { value?: any[] };
    const meetings = data.value || [];

    res.json({
      success: true,
      data: meetings
    });
  } catch (error) {
    logger.error('Error fetching Teams meetings:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch Teams meetings' });
  }
});

// Create Teams meeting (requires auth)
router.post('/microsoft/teams/meetings', auth, async (req, res) => {
  try {
    const userId = (req as FirebaseAuthRequest).userId;
    const meetingData = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    const microsoftIntegration = await IntegrationsFirestoreService.findFirst({
      userId,
      provider: 'microsoft',
      type: 'profile',
      isActive: true
    });

    if (!microsoftIntegration) {
      return res.status(404).json({
        success: false,
        error: 'Microsoft integration not found'
      });
    }

    // Check if Teams service is enabled
    if (!(microsoftIntegration as any).services || !(microsoftIntegration as any).services.includes('teams')) {
      return res.status(404).json({
        success: false,
        error: 'Teams service not enabled for this Microsoft integration'
      });
    }

    const validAccessToken = await ensureValidMicrosoftAccessToken(microsoftIntegration);
    
    // Use Microsoft Graph API to create Teams meeting
    const response = await fetch('https://graph.microsoft.com/v1.0/me/onlineMeetings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${validAccessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        subject: meetingData.subject,
        startDateTime: meetingData.start.dateTime,
        endDateTime: meetingData.end.dateTime,
        attendees: meetingData.attendees || []
      })
    });

    if (!response.ok) {
      throw new Error(`Microsoft Graph API error: ${response.status} ${response.statusText}`);
    }

    const meeting = await response.json();

    res.json({
      success: true,
      data: meeting
    });
  } catch (error) {
    logger.error('Error creating Teams meeting:', error);
    res.status(500).json({ success: false, error: 'Failed to create Teams meeting' });
  }
});

// Get deal-related Outlook emails (requires auth)
router.get('/microsoft/outlook/deals', auth, async (req, res) => {
  try {
    const userId = (req as FirebaseAuthRequest).userId;
    const { maxResults = 50 } = req.query;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    const microsoftIntegration = await IntegrationsFirestoreService.findFirst({
      userId,
      provider: 'microsoft',
      type: 'profile',
      isActive: true
    });

    if (!microsoftIntegration) {
      return res.status(404).json({
        success: false,
        error: 'Microsoft integration not found'
      });
    }

    // Check if Outlook service is enabled
    if (!(microsoftIntegration as any).services || !(microsoftIntegration as any).services.includes('outlook')) {
      return res.status(404).json({
        success: false,
        error: 'Outlook service not enabled for this Microsoft integration'
      });
    }

    const validAccessToken = await ensureValidMicrosoftAccessToken(microsoftIntegration);
    
    // Use Microsoft Graph API to fetch recent emails
    const response = await fetch(`https://graph.microsoft.com/v1.0/me/messages?$top=${maxResults}&$orderby=receivedDateTime desc`, {
      headers: {
        'Authorization': `Bearer ${validAccessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Microsoft Graph API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as { value?: any[] };
    const emails = data.value || [];

    res.json({
      success: true,
      data: { emails }
    });
  } catch (error) {
    logger.error('Error fetching deal-related Outlook emails:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch deal-related Outlook emails' });
  }
});

export default router;