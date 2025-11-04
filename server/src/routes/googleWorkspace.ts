import express from 'express';
import GoogleAuthService from '../services/googleAuth';
import GmailService from '../services/gmail';
import GoogleDriveService from '../services/googleDrive';
import IntegrationsFirestoreService from '../services/integrations.firestore.service';
import DataNormalizationService from '../services/dataNormalization.service';
import { firebaseAuthMiddleware as auth, FirebaseAuthRequest } from '../middleware/firebaseAuth';
import logger from '../utils/logger';

const router = express.Router();

// Helper function to ensure valid access token
async function ensureValidAccessToken(integration: { expiresAt: Date | null; refreshToken?: string; accessToken: string; id: string }) {
  if (!integration.accessToken) {
    throw new Error('No access token available');
  }

  if (!integration.expiresAt || !integration.refreshToken) {
    return integration.accessToken;
  }

  // If token expires within 5 minutes, refresh it
  if (IntegrationsFirestoreService.isTokenExpiringSoon(integration.expiresAt)) {
    try {
      logger.info(`Refreshing access token for integration ${integration.id}`);
      const refreshedTokens = await GoogleAuthService.refreshAccessToken(integration.refreshToken);

      // Update the integration with new tokens
      await IntegrationsFirestoreService.refreshToken(integration.id, refreshedTokens);

      return refreshedTokens.access_token;
    } catch (error) {
      logger.error('Failed to refresh access token:', error);
      throw new Error('Failed to refresh access token');
    }
  }

  return integration.accessToken;
}

/**
 * Get normalized email data for LLM processing
 */
router.get('/emails/normalized', auth, async (req, res) => {
  try {
    const userId = (req as FirebaseAuthRequest).userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    const { q, maxResults = 50, includeBody = true } = req.query;

    // Get Gmail integration
    const gmailIntegration = await IntegrationsFirestoreService.findFirst({
      userId,
      provider: 'google',
      type: 'gmail',
      isActive: true
    });

    if (!gmailIntegration) {
      return res.status(404).json({
        success: false,
        error: 'Gmail integration not found. Please connect your Gmail account first.'
      });
    }

    // Get valid access token
    const validAccessToken = await ensureValidAccessToken(gmailIntegration);

    // Fetch messages from Gmail
    const gmailResponse = await GmailService.listMessages(validAccessToken, {
      q: q as string,
      maxResults: parseInt(maxResults as string, 10)
    });

    // Normalize the email data
    const normalizedEmails = DataNormalizationService.normalizeEmails(
      gmailResponse.messages,
      userId
    );

    // Filter out email bodies if not requested (for privacy/performance)
    const responseData = includeBody === 'false'
      ? normalizedEmails.map(email => ({ ...email, body: { text: '[Body hidden]' } }))
      : normalizedEmails;

    res.json({
      success: true,
      data: {
        emails: responseData,
        totalCount: normalizedEmails.length,
        nextPageToken: gmailResponse.nextPageToken,
        resultSizeEstimate: gmailResponse.resultSizeEstimate
      }
    });

  } catch (error) {
    logger.error('Error fetching normalized emails:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch normalized email data',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get CRM-relevant emails only
 */
router.get('/emails/crm-relevant', auth, async (req, res) => {
  try {
    const userId = (req as FirebaseAuthRequest).userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    const { maxResults = 50 } = req.query;

    // Get Gmail integration
    const gmailIntegration = await IntegrationsFirestoreService.findFirst({
      userId,
      provider: 'google',
      type: 'gmail',
      isActive: true
    });

    if (!gmailIntegration) {
      return res.status(404).json({
        success: false,
        error: 'Gmail integration not found. Please connect your Gmail account first.'
      });
    }

    // Get valid access token
    const validAccessToken = await ensureValidAccessToken(gmailIntegration);

    // Search for business-related emails
    const businessQuery = 'meeting OR proposal OR contract OR deal OR investment OR client OR customer';
    const gmailResponse = await GmailService.listMessages(validAccessToken, {
      q: businessQuery,
      maxResults: parseInt(maxResults as string, 10)
    });

    // Normalize and filter for CRM relevance
    const normalizedEmails = DataNormalizationService.normalizeEmails(
      gmailResponse.messages,
      userId
    );

    const crmRelevantEmails = normalizedEmails.filter(email => email.crmRelevant);

    res.json({
      success: true,
      data: {
        emails: crmRelevantEmails,
        totalCount: crmRelevantEmails.length,
        totalProcessed: normalizedEmails.length
      }
    });

  } catch (error) {
    logger.error('Error fetching CRM-relevant emails:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch CRM-relevant emails',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Extract contacts from user's emails
 */
router.get('/contacts/extracted', auth, async (req, res) => {
  try {
    const userId = (req as FirebaseAuthRequest).userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    const { maxEmails = 100 } = req.query;

    // Get Gmail integration
    const gmailIntegration = await IntegrationsFirestoreService.findFirst({
      userId,
      provider: 'google',
      type: 'gmail',
      isActive: true
    });

    if (!gmailIntegration) {
      return res.status(404).json({
        success: false,
        error: 'Gmail integration not found. Please connect your Gmail account first.'
      });
    }

    // Get valid access token
    const validAccessToken = await ensureValidAccessToken(gmailIntegration);

    // Fetch recent emails
    const gmailResponse = await GmailService.listMessages(validAccessToken, {
      maxResults: parseInt(maxEmails as string, 10)
    });

    // Normalize emails
    const normalizedEmails = DataNormalizationService.normalizeEmails(
      gmailResponse.messages,
      userId
    );

    // Extract contacts
    const extractedContacts = DataNormalizationService.extractContacts(normalizedEmails);

    // Sort by interaction count and importance
    extractedContacts.sort((a, b) => {
      const importanceWeight = { high: 3, medium: 2, low: 1 };
      const scoreA = a.interactionCount + importanceWeight[a.importance];
      const scoreB = b.interactionCount + importanceWeight[b.importance];
      return scoreB - scoreA;
    });

    res.json({
      success: true,
      data: {
        contacts: extractedContacts,
        totalCount: extractedContacts.length,
        emailsProcessed: normalizedEmails.length
      }
    });

  } catch (error) {
    logger.error('Error extracting contacts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to extract contacts from emails',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get deal-related emails for investment tracking
 */
router.get('/emails/deals', auth, async (req, res) => {
  try {
    const userId = (req as FirebaseAuthRequest).userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    const { maxResults = 50 } = req.query;

    // Get Gmail integration
    const gmailIntegration = await IntegrationsFirestoreService.findFirst({
      userId,
      provider: 'google',
      type: 'gmail',
      isActive: true
    });

    if (!gmailIntegration) {
      return res.status(404).json({
        success: false,
        error: 'Gmail integration not found. Please connect your Gmail account first.'
      });
    }

    // Get valid access token
    const validAccessToken = await ensureValidAccessToken(gmailIntegration);

    // Search for deal-related emails
    const dealQuery = 'deal OR investment OR funding OR valuation OR "term sheet" OR "due diligence" OR acquisition OR merger OR equity OR venture';
    const gmailResponse = await GmailService.listMessages(validAccessToken, {
      q: dealQuery,
      maxResults: parseInt(maxResults as string, 10)
    });

    // Normalize and filter for deal relevance
    const normalizedEmails = DataNormalizationService.normalizeEmails(
      gmailResponse.messages,
      userId
    );

    const dealRelevantEmails = normalizedEmails.filter(email => email.dealRelated);

    res.json({
      success: true,
      data: {
        emails: dealRelevantEmails,
        totalCount: dealRelevantEmails.length,
        totalProcessed: normalizedEmails.length
      }
    });

  } catch (error) {
    logger.error('Error fetching deal-related emails:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch deal-related emails',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get user's Google Drive files with metadata
 */
router.get('/drive/files', auth, async (req, res) => {
  try {
    const userId = (req as FirebaseAuthRequest).userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    // Get Drive integration
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

    // Get valid access token
    const validAccessToken = await ensureValidAccessToken(driveIntegration);

    // Fetch files from Google Drive
    const files = await GoogleDriveService.listFiles(validAccessToken);

    res.json({
      success: true,
      data: files
    });

  } catch (error) {
    logger.error('Error fetching Google Drive files:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch Google Drive files',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Health check endpoint for Google Workspace integration
 */
router.get('/health', auth, async (req, res) => {
  try {
    const userId = (req as FirebaseAuthRequest).userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    // Check all Google integrations
    const integrations = await IntegrationsFirestoreService.findMany({
      userId,
      provider: 'google',
      isActive: true
    });

    const status = {
      gmail: integrations.some(i => i.type === 'gmail'),
      drive: integrations.some(i => i.type === 'drive'),
      calendar: integrations.some(i => i.type === 'calendar'),
      profile: integrations.some(i => i.type === 'profile')
    };

    res.json({
      success: true,
      data: {
        userId,
        integrations: status,
        totalActiveIntegrations: integrations.length,
        lastChecked: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Error checking Google Workspace health:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check integration health',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;