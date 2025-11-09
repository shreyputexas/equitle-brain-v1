import express from 'express';
import { firebaseAuthMiddleware } from '../middleware/firebaseAuth';
import { GmailService } from '../services/gmail';
import { FirestoreHelpers } from '../lib/firebase';
import { GoogleAuthService } from '../services/googleAuth';
import logger from '../utils/logger';

const router = express.Router();

// Helper function to get user's Gmail access token from Firestore
// Automatically refreshes if expired
async function getUserGmailToken(userId: string): Promise<string> {
  try {
    logger.info('Getting Gmail token for user', { userId });

    // Import db from firebase lib
    const { db } = await import('../lib/firebase');

    // Query root-level integrations collection, not user subcollection
    const allGoogleIntegrations = await db.collection('integrations')
      .where('userId', '==', userId)
      .where('provider', '==', 'google')
      .get();

    logger.info('Found Google integrations', {
      userId,
      count: allGoogleIntegrations.size,
      types: allGoogleIntegrations.docs.map(doc => ({
        type: doc.data().type,
        isActive: doc.data().isActive,
        hasAccessToken: !!doc.data().accessToken
      }))
    });

    const integrationsSnapshot = await db.collection('integrations')
      .where('userId', '==', userId)
      .where('provider', '==', 'google')
      .where('type', '==', 'gmail')
      .where('isActive', '==', true)
      .limit(1)
      .get();

    if (integrationsSnapshot.empty) {
      logger.warn('No Gmail integration found for user', {
        userId,
        availableTypes: allGoogleIntegrations.docs.map(doc => doc.data().type)
      });
      throw new Error('Gmail integration not found. Please reconnect Google and select Gmail permissions.');
    }

    const integrationDoc = integrationsSnapshot.docs[0];
    const integrationData = integrationDoc.data();

    if (!integrationData.accessToken) {
      throw new Error('Gmail integration not found or not configured');
    }

    // Check if token is expired or expiring soon (within 5 minutes)
    const now = Date.now();
    const expiresAt = integrationData.expiresAt?.toMillis?.() || integrationData.expiresAt;
    const isExpired = expiresAt && expiresAt < now + 5 * 60 * 1000;

    if (isExpired && integrationData.refreshToken) {
      logger.info('Access token expired or expiring soon, refreshing...', {
        userId,
        expiresAt: new Date(expiresAt).toISOString(),
        now: new Date(now).toISOString()
      });

      try {
        // Refresh the token
        const refreshedTokens = await GoogleAuthService.refreshAccessToken(integrationData.refreshToken);

        // Calculate new expiry time
        const newExpiresAt = new Date(Date.now() + refreshedTokens.expires_in * 1000);

        // Update Firestore with new tokens
        await integrationDoc.ref.update({
          accessToken: refreshedTokens.access_token,
          refreshToken: refreshedTokens.refresh_token,
          expiresAt: newExpiresAt,
          updatedAt: FirestoreHelpers.serverTimestamp()
        });

        logger.info('Successfully refreshed Gmail access token', {
          userId,
          newExpiresAt: newExpiresAt.toISOString()
        });

        return refreshedTokens.access_token;
      } catch (refreshError: any) {
        logger.error('Failed to refresh Gmail access token', {
          userId,
          error: refreshError.message
        });
        throw new Error('Gmail authorization expired. Please reconnect your Gmail account.');
      }
    }

    return integrationData.accessToken;
  } catch (error: any) {
    logger.error('Error getting Gmail token from Firestore:', error);

    if (error.message.includes('Gmail authorization expired')) {
      throw error;
    }

    throw new Error('Gmail integration not found. Please reconnect Google and select Gmail permissions.');
  }
}

// @route   GET /api/firebase-gmail/threads
// @desc    Get Gmail threads
// @access  Private
router.get('/threads', firebaseAuthMiddleware, async (req, res) => {
  try {
    const userId = req.userId!;
    const { q, labelIds, maxResults = 100, pageToken } = req.query;

    const accessToken = await getUserGmailToken(userId);

    const maxResultsNum = Number(maxResults) || 100;
    const options: any = {
      maxResults: maxResultsNum
    };
    if (q) options.q = q as string;
    if (labelIds) {
      options.labelIds = Array.isArray(labelIds) ? labelIds : [labelIds];
    }
    if (pageToken) options.pageToken = pageToken as string;

    logger.info('Fetching Gmail threads', { 
      userId, 
      maxResults: maxResultsNum, 
      labelIds: options.labelIds, 
      q: options.q,
      actualMaxResults: options.maxResults
    });
    const result = await GmailService.listThreads(accessToken, options);
    logger.info('Fetched Gmail threads', { userId, threadCount: result.threads.length, requestedMax: maxResultsNum });

    res.json(result);
  } catch (error: any) {
    logger.error('Get Gmail threads error:', {
      userId: req.userId,
      error: error.message,
      stack: error.stack
    });

    // Handle Gmail integration not found/configured
    if (error.message.includes('Gmail integration not found') || error.message.includes('not configured') || error.message.includes('select Gmail permissions')) {
      return res.status(400).json({
        message: error.message.includes('select Gmail permissions')
          ? 'Gmail integration not found. Please go to Settings → Connect Google → and select Gmail permissions.'
          : 'Gmail integration required. Please connect your Gmail account in settings.',
        errorType: 'INTEGRATION_NOT_FOUND'
      });
    }

    // Handle expired/invalid authorization
    if (error.message.includes('Gmail authorization expired') || error.message.includes('re-authenticate')) {
      return res.status(401).json({
        message: 'Gmail authorization expired. Please reconnect your Gmail account in settings.',
        errorType: 'AUTH_EXPIRED'
      });
    }

    // Handle Google API errors
    if (error.response?.status === 401 || error.code === 401) {
      return res.status(401).json({
        message: 'Gmail authorization expired. Please reconnect your Gmail account.',
        errorType: 'AUTH_EXPIRED'
      });
    }

    if (error.response?.status === 403 || error.code === 403) {
      return res.status(403).json({
        message: 'Gmail permission denied. Please grant required permissions.',
        errorType: 'PERMISSION_DENIED'
      });
    }

    if (error.response?.status === 429 || error.code === 429) {
      return res.status(429).json({
        message: 'Gmail API quota exceeded. Please try again later.',
        errorType: 'RATE_LIMIT'
      });
    }

    // Generic server error
    res.status(500).json({
      message: 'Failed to fetch Gmail threads. Please try again.',
      errorType: 'SERVER_ERROR'
    });
  }
});

// @route   GET /api/firebase-gmail/messages
// @desc    Get Gmail messages
// @access  Private
router.get('/messages', firebaseAuthMiddleware, async (req, res) => {
  try {
    const userId = req.userId!;
    const { q, labelIds, maxResults = 20, pageToken } = req.query;

    const accessToken = await getUserGmailToken(userId);

    const options: any = {};
    if (q) options.q = q as string;
    if (labelIds) options.labelIds = Array.isArray(labelIds) ? labelIds : [labelIds];
    if (maxResults) options.maxResults = Number(maxResults);
    if (pageToken) options.pageToken = pageToken as string;

    const result = await GmailService.listMessages(accessToken, options);

    res.json(result);
  } catch (error: any) {
    logger.error('Get Gmail messages error:', error);

    if (error.message.includes('Gmail integration not found')) {
      return res.status(400).json({ message: 'Gmail integration required. Please connect your Gmail account in settings.' });
    }

    res.status(500).json({ message: 'Failed to fetch Gmail messages' });
  }
});

// @route   GET /api/firebase-gmail/messages/:messageId
// @desc    Get specific Gmail message
// @access  Private
router.get('/messages/:messageId', firebaseAuthMiddleware, async (req, res) => {
  try {
    const userId = req.userId!;
    const { messageId } = req.params;

    const accessToken = await getUserGmailToken(userId);
    const message = await GmailService.getMessage(accessToken, messageId);

    res.json({ message });
  } catch (error: any) {
    logger.error('Get Gmail message error:', error);

    if (error.message.includes('Gmail integration not found')) {
      return res.status(400).json({ message: 'Gmail integration required. Please connect your Gmail account in settings.' });
    }

    res.status(500).json({ message: 'Failed to fetch Gmail message' });
  }
});

// @route   GET /api/firebase-gmail/threads/:threadId
// @desc    Get specific Gmail thread
// @access  Private
router.get('/threads/:threadId', firebaseAuthMiddleware, async (req, res) => {
  try {
    const userId = req.userId!;
    const { threadId } = req.params;

    const accessToken = await getUserGmailToken(userId);

    // Use the Gmail API to get the thread
    const { google } = await import('googleapis');
    const auth = (await import('../services/googleAuth')).default.createAuthenticatedClient(accessToken);
    const gmail = google.gmail({ version: 'v1', auth });

    const response = await gmail.users.threads.get({
      userId: 'me',
      id: threadId,
      format: 'full'
    });

    res.json({ thread: response.data });
  } catch (error: any) {
    logger.error('Get Gmail thread error:', error);

    if (error.message.includes('Gmail integration not found')) {
      return res.status(400).json({ message: 'Gmail integration required. Please connect your Gmail account in settings.' });
    }

    res.status(500).json({ message: 'Failed to fetch Gmail thread' });
  }
});

// @route   GET /api/firebase-gmail/labels
// @desc    Get Gmail labels
// @access  Private
router.get('/labels', firebaseAuthMiddleware, async (req, res) => {
  try {
    const userId = req.userId!;

    const accessToken = await getUserGmailToken(userId);
    const labels = await GmailService.listLabels(accessToken);

    res.json({ labels });
  } catch (error: any) {
    logger.error('Get Gmail labels error:', error);

    if (error.message.includes('Gmail integration not found')) {
      return res.status(400).json({ message: 'Gmail integration required. Please connect your Gmail account in settings.' });
    }

    res.status(500).json({ message: 'Failed to fetch Gmail labels' });
  }
});

export default router;
