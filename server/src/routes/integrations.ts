import express from 'express';
import GoogleAuthService from '../services/googleAuth';
import GoogleDriveService from '../services/googleDrive';
import GoogleCalendarService from '../services/googleCalendar';
import GmailService from '../services/gmail';
import { authMiddleware as auth } from '../middleware/auth';
import logger from '../utils/logger';
import prisma from '../lib/database';

const router = express.Router();

// Get user's integrations
router.get('/', auth, async (req, res) => {
  try {
    const userId = (req.user as any)?.id;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    const userIntegrations = await prisma.integration.findMany({
      where: { userId }
    });

    res.json({
      success: true,
      data: userIntegrations.map(integration => ({
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

// Initiate Google OAuth flow
router.post('/google/connect', auth, async (req, res) => {
  try {
    const { types } = req.body; // ['profile', 'drive', 'calendar', 'gmail']
    const userId = (req.user as any)?.id || 'demo-user';

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

// Handle Google OAuth callback
router.get('/google/callback', async (req, res) => {
  try {
    const { code, state: userId } = req.query;

    if (!code || !userId) {
      return res.status(400).json({
        success: false,
        error: 'Authorization code and state are required'
      });
    }

    // Exchange code for tokens
    const tokens = await GoogleAuthService.exchangeCodeForTokens(code as string);

    // Get user profile
    const profile = await GoogleAuthService.getUserProfile(tokens.access_token);

    // Determine integration types based on scopes
    const scopes = tokens.scope.split(' ');
    const types = [];

    if (scopes.some(s => s.includes('userinfo'))) types.push('profile');
    if (scopes.some(s => s.includes('drive'))) types.push('drive');
    if (scopes.some(s => s.includes('calendar'))) types.push('calendar');
    if (scopes.some(s => s.includes('gmail'))) types.push('gmail');

    // Create integrations for each type
    for (const type of types) {
      // Remove existing integration of same type
      await prisma.integration.deleteMany({
        where: {
          userId: userId as string,
          provider: 'google',
          type: type
        }
      });

      // Create new integration
      await prisma.integration.create({
        data: {
          userId: userId as string,
          provider: 'google',
          type: type,
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
          scope: scopes.join(' '),
          profile: {
            email: profile.email,
            name: profile.name,
            picture: profile.picture as string | undefined
          },
          isActive: true
        }
      });
    }

    // Redirect to OAuth callback page
    res.redirect('http://localhost:3000/app/oauth/callback?integration=success');
  } catch (error) {
    logger.error('Error handling Google OAuth callback:', error);
    res.redirect('http://localhost:3000/app/oauth/callback?integration=error');
  }
});

// Disconnect integration
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = (req.user as any)?.id || 'demo-user';

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

// Get Google Drive files
router.get('/google/drive/files', auth, async (req, res) => {
  try {
    const userId = (req.user as any)?.id || 'demo-user';
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

    const files = await GoogleDriveService.listFiles(driveIntegration.accessToken!);

    res.json({
      success: true,
      data: files
    });
  } catch (error) {
    logger.error('Error fetching Drive files:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch Drive files' });
  }
});

// Get Google Calendar events
router.get('/google/calendar/events', auth, async (req, res) => {
  try {
    const userId = (req.user as any)?.id || 'demo-user';
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

    const events = await GoogleCalendarService.listEvents(
      calendarIntegration.accessToken!,
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

// Create Google Calendar event
router.post('/google/calendar/events', auth, async (req, res) => {
  try {
    const userId = (req.user as any)?.id || 'demo-user';
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

    const event = await GoogleCalendarService.createEvent(
      calendarIntegration.accessToken!,
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

// Get Gmail messages
router.get('/google/gmail/messages', auth, async (req, res) => {
  try {
    const userId = (req.user as any)?.id || 'demo-user';
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

    const messages = await GmailService.listMessages(gmailIntegration.accessToken!, options);

    res.json({
      success: true,
      data: messages
    });
  } catch (error) {
    logger.error('Error fetching Gmail messages:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch Gmail messages' });
  }
});

// Send Gmail email
router.post('/google/gmail/send', auth, async (req, res) => {
  try {
    const userId = (req.user as any)?.id || 'demo-user';
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

    const sentMessage = await GmailService.sendEmail(gmailIntegration.accessToken!, emailData);

    res.json({
      success: true,
      data: sentMessage
    });
  } catch (error) {
    logger.error('Error sending Gmail email:', error);
    res.status(500).json({ success: false, error: 'Failed to send Gmail email' });
  }
});

// Reply to Gmail email
router.post('/google/gmail/messages/:messageId/reply', auth, async (req, res) => {
  try {
    const userId = (req.user as any)?.id || 'demo-user';
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

    const reply = await GmailService.replyToEmail(
      gmailIntegration.accessToken!,
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

// Get Gmail threads
router.get('/google/gmail/threads', auth, async (req, res) => {
  try {
    const userId = (req.user as any)?.id || 'demo-user';
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

    const threads = await GmailService.listThreads(gmailIntegration.accessToken!, options);

    res.json({
      success: true,
      data: threads
    });
  } catch (error) {
    logger.error('Error fetching Gmail threads:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch Gmail threads' });
  }
});

// Get Gmail labels
router.get('/google/gmail/labels', auth, async (req, res) => {
  try {
    const userId = (req.user as any)?.id || 'demo-user';

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

    const labels = await GmailService.listLabels(gmailIntegration.accessToken!);

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