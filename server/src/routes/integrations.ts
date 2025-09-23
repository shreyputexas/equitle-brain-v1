import express from 'express';
import GoogleAuthService from '../services/googleAuth';
import GoogleDriveService from '../services/googleDrive';
import GoogleCalendarService from '../services/googleCalendar';
import GmailService from '../services/gmail';
import { firebaseAuthMiddleware as auth } from '../middleware/firebaseAuth';
import logger from '../utils/logger';
import prisma from '../lib/database.legacy';

const router = express.Router();

// Helper function to ensure valid access token
async function ensureValidAccessToken(integration: { expiresAt: Date | null; refreshToken: string | null; accessToken: string | null; id: string }) {
  if (!integration.accessToken) {
    throw new Error('No access token available');
  }
  
  if (!integration.expiresAt || !integration.refreshToken) {
    return integration.accessToken;
  }

  const now = new Date();
  const expiryDate = new Date(integration.expiresAt);

  // If token expires within 5 minutes, refresh it
  if (expiryDate <= new Date(now.getTime() + 5 * 60 * 1000)) {
    try {
      logger.info(`Refreshing access token for integration ${integration.id}`);
      const refreshedTokens = await GoogleAuthService.refreshAccessToken(integration.refreshToken);

      // Update the integration with new tokens
      await prisma.integration.update({
        where: { id: integration.id },
        data: {
          accessToken: refreshedTokens.access_token,
          refreshToken: refreshedTokens.refresh_token,
          expiresAt: new Date(Date.now() + refreshedTokens.expires_in * 1000)
        }
      });

      return refreshedTokens.access_token;
    } catch (error) {
      logger.error('Failed to refresh access token:', error);
      throw new Error('Failed to refresh access token');
    }
  }

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

// Get user's integrations (requires auth)
router.get('/', auth, async (req, res) => {
  try {
    const userId = (req.user as any)?.id;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    logger.info('Fetching integrations for user', { userId, userEmail: (req.user as any)?.email });

    const userIntegrations = await prisma.integration.findMany({
      where: { userId }
    });

    logger.info('Found integrations', { 
      userId, 
      count: userIntegrations.length,
      integrationIds: userIntegrations.map((i: any) => i.id)
    });

    res.json({
      success: true,
      data: userIntegrations.map((integration: any) => ({
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
router.post('/google/connect', async (req, res) => {
  try {
    const { types } = req.body; // ['profile', 'drive', 'calendar', 'gmail']
    const userId = (req.user as any)?.id || 'default-user-id';

    if (!types || !Array.isArray(types)) {
      return res.status(400).json({
        success: false,
        error: 'Types array is required'
      });
    }

    const scopes = GoogleAuthService.getScopes(types);
    const authUrl = GoogleAuthService.getAuthUrl(scopes, userId!);

    res.json({
      success: true,
      data: {
        authUrl,
        scopes,
        types
      }
    });
  } catch (error) {
    logger.error('Error initiating Google OAuth:', error);
    res.status(500).json({ success: false, error: 'Failed to initiate OAuth flow' });
  }
});

// Handle Google OAuth callback (NO AUTH REQUIRED - this is the callback)
router.get('/google/callback', async (req, res) => {
  try {
    const { code, state, error: oauthError } = req.query;

    // Handle OAuth errors from Google
    if (oauthError) {
      logger.error('OAuth error from Google:', { error: oauthError, description: req.query.error_description });
      return res.redirect(`http://localhost:3000/settings?integration=error&reason=${encodeURIComponent(oauthError as string)}`);
    }

    if (!code || !state) {
      logger.error('Missing authorization code or state in OAuth callback', { code: !!code, state: !!state });
      return res.redirect('http://localhost:3000/settings?integration=error&reason=missing_parameters');
    }

    // Extract userId from state (format: userId:timestamp)
    const [userId, timestamp] = (state as string).split(':');

    if (!userId) {
      logger.error('Invalid state parameter format', { state });
      return res.redirect('http://localhost:3000/settings?integration=error&reason=invalid_state');
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
      return res.redirect('http://localhost:3000/settings?integration=error&reason=expired_state');
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
      return res.redirect('http://localhost:3000/settings?integration=error&reason=invalid_scopes');
    }

    // Create integrations for each type
    const createdIntegrations = [];
    for (const type of types) {
      // Remove existing integration of same type
      const deleted = await prisma.integration.deleteMany({
        where: {
          userId: userId as string,
          provider: 'google',
          type: type
        }
      });

      if (deleted.count > 0) {
        logger.info(`Removed ${deleted.count} existing ${type} integration(s) for user ${userId}`);
      }

      // Create new integration
      const integration = await prisma.integration.create({
        data: {
          userId: userId as string,
          provider: 'google',
          type: type,
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
        }
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
    res.redirect(`http://localhost:3000/settings?integration=success&types=${encodeURIComponent(types.join(','))}&userId=${userId}`);
  } catch (error) {
    logger.error('Error handling Google OAuth callback:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      userId: req.query.state,
      hasCode: !!req.query.code
    });
    res.redirect(`http://localhost:3000/settings?integration=error&reason=server_error`);
  }
});

// Disconnect integration (requires auth)
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = (req.user as any)?.id || 'default-user-id';

    const integration = await prisma.integration.findFirst({
      where: {
        id: id,
        userId: userId
      }
    });

    if (!integration) {
      return res.status(404).json({
        success: false,
        error: 'Integration not found'
      });
    }

    await prisma.integration.delete({
      where: {
        id: id
      }
    });

    res.json({
      success: true,
      message: 'Integration disconnected successfully'
    });
  } catch (error) {
    logger.error('Error disconnecting integration:', error);
    res.status(500).json({ success: false, error: 'Failed to disconnect integration' });
  }
});

// Get Google Drive files (requires auth)
router.get('/google/drive/files', auth, async (req, res) => {
  try {
    const userId = (req.user as any)?.id || 'default-user-id';
    const driveIntegration = await prisma.integration.findFirst({
      where: {
        userId: userId,
        provider: 'google',
        type: 'drive',
        isActive: true
      }
    });

    if (!driveIntegration) {
      return res.status(404).json({
        success: false,
        error: 'Google Drive integration not found'
      });
    }

    const validAccessToken = await ensureValidAccessToken(driveIntegration);
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

// Get Google Calendar events (requires auth)
router.get('/google/calendar/events', auth, async (req, res) => {
  try {
    const userId = (req.user as any)?.id || 'default-user-id';
    const { timeMin, timeMax } = req.query;

    const calendarIntegration = await prisma.integration.findFirst({
      where: {
        userId: userId,
        provider: 'google',
        type: 'calendar',
        isActive: true
      }
    });

    if (!calendarIntegration) {
      return res.status(404).json({
        success: false,
        error: 'Google Calendar integration not found'
      });
    }

    const validAccessToken = await ensureValidAccessToken(calendarIntegration);
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
    const userId = (req.user as any)?.id || 'default-user-id';
    const eventData = req.body;

    const calendarIntegration = await prisma.integration.findFirst({
      where: {
        userId: userId,
        provider: 'google',
        type: 'calendar',
        isActive: true
      }
    });

    if (!calendarIntegration) {
      return res.status(404).json({
        success: false,
        error: 'Google Calendar integration not found'
      });
    }

    const validAccessToken = await ensureValidAccessToken(calendarIntegration);
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
    const userId = (req.user as any)?.id || 'default-user-id';
    const { q, labelIds, maxResults = 50, pageToken, includeSpamTrash } = req.query;

    const gmailIntegration = await prisma.integration.findFirst({
      where: {
        userId: userId,
        provider: 'google',
        type: 'gmail',
        isActive: true
      }
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

    const validAccessToken = await ensureValidAccessToken(gmailIntegration);
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
    const userId = (req.user as any)?.id || 'default-user-id';
    const emailData = req.body;

    const gmailIntegration = await prisma.integration.findFirst({
      where: {
        userId: userId,
        provider: 'google',
        type: 'gmail',
        isActive: true
      }
    });

    if (!gmailIntegration) {
      return res.status(404).json({
        success: false,
        error: 'Gmail integration not found'
      });
    }

    const validAccessToken = await ensureValidAccessToken(gmailIntegration);
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
    const userId = (req.user as any)?.id || 'default-user-id';
    const { messageId } = req.params;
    const replyData = req.body;

    const gmailIntegration = await prisma.integration.findFirst({
      where: {
        userId: userId,
        provider: 'google',
        type: 'gmail',
        isActive: true
      }
    });

    if (!gmailIntegration) {
      return res.status(404).json({
        success: false,
        error: 'Gmail integration not found'
      });
    }

    const validAccessToken = await ensureValidAccessToken(gmailIntegration);
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
    const userId = (req.user as any)?.id || 'default-user-id';
    const { q, labelIds, maxResults = 20, pageToken, includeSpamTrash } = req.query;

    const gmailIntegration = await prisma.integration.findFirst({
      where: {
        userId: userId,
        provider: 'google',
        type: 'gmail',
        isActive: true
      }
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

    const validAccessToken = await ensureValidAccessToken(gmailIntegration);
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
    const userId = (req.user as any)?.id || 'default-user-id';

    const gmailIntegration = await prisma.integration.findFirst({
      where: {
        userId: userId,
        provider: 'google',
        type: 'gmail',
        isActive: true
      }
    });

    if (!gmailIntegration) {
      return res.status(404).json({
        success: false,
        error: 'Gmail integration not found'
      });
    }

    const validAccessToken = await ensureValidAccessToken(gmailIntegration);
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

export default router;