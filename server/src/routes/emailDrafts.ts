import express from 'express';
import { firebaseAuthMiddleware } from '../middleware/firebaseAuth';
import { IntegrationsFirestoreService } from '../services/integrations.firestore.service';
import { GmailService } from '../services/gmail';
import { GoogleAuthService } from '../services/googleAuth';
import axios from 'axios';
import logger from '../utils/logger';

const router = express.Router();

// @route   POST /api/email-drafts/create
// @desc    Create email draft in user's connected email (Gmail or Outlook)
// @access  Private
router.post('/create', firebaseAuthMiddleware, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const { to, subject, body, contactName } = req.body;

    if (!to || !subject || !body) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: to, subject, body'
      });
    }

    logger.info('Creating email draft', { userId, to, contactName });

    // Try Gmail first
    const gmailIntegration = await IntegrationsFirestoreService.findFirst({
      userId,
      provider: 'google',
      type: 'gmail',
      isActive: true
    });

    if (gmailIntegration?.accessToken) {
      try {
        logger.info('Creating Gmail draft');

        // Create draft using Gmail API
        let accessToken = gmailIntegration.accessToken;
        let draft;

        try {
          draft = await createGmailDraft(accessToken, to, subject, body);
        } catch (error: any) {
          // If 401, try to refresh token
          if (error.response?.status === 401 && gmailIntegration.refreshToken) {
            logger.info('Access token expired, refreshing...');

            try {
              // Refresh the token
              const newTokens = await GoogleAuthService.refreshAccessToken(gmailIntegration.refreshToken);

              // Update the integration with new tokens
              await IntegrationsFirestoreService.update(gmailIntegration.id, {
                accessToken: newTokens.access_token,
                refreshToken: newTokens.refresh_token || gmailIntegration.refreshToken
              });

              logger.info('Token refreshed successfully, retrying draft creation');

              // Retry with new token
              draft = await createGmailDraft(newTokens.access_token, to, subject, body);
            } catch (refreshError) {
              logger.error('Token refresh failed', refreshError);
              throw refreshError;
            }
          } else {
            throw error;
          }
        }

        return res.json({
          success: true,
          data: {
            provider: 'Gmail',
            draftId: draft.id,
            message: 'Draft created successfully in Gmail'
          }
        });
      } catch (gmailError: any) {
        logger.error('Gmail draft creation failed', gmailError);
        // Continue to try Outlook
      }
    }

    // Try Outlook/Microsoft
    const microsoftIntegration = await IntegrationsFirestoreService.findFirst({
      userId,
      provider: 'microsoft',
      type: 'profile',
      isActive: true
    });

    if (microsoftIntegration?.accessToken &&
        (microsoftIntegration as any).services?.includes('outlook')) {
      try {
        logger.info('Creating Outlook draft');

        const draft = await createOutlookDraft(
          microsoftIntegration.accessToken,
          to,
          subject,
          body
        );

        return res.json({
          success: true,
          data: {
            provider: 'Outlook',
            draftId: draft.id,
            message: 'Draft created successfully in Outlook'
          }
        });
      } catch (outlookError: any) {
        logger.error('Outlook draft creation failed', outlookError);
        return res.status(500).json({
          success: false,
          error: 'Failed to create Outlook draft: ' + outlookError.message
        });
      }
    }

    // No email integration found
    return res.status(400).json({
      success: false,
      error: 'No active email integration found. Please connect Gmail or Outlook first.'
    });

  } catch (error) {
    logger.error('Error creating email draft', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Helper function to create Gmail draft
async function createGmailDraft(
  accessToken: string,
  to: string,
  subject: string,
  body: string
): Promise<any> {
  // Construct RFC 2822 formatted email
  const emailLines = [
    `To: ${to}`,
    `Subject: ${subject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=utf-8',
    '',
    body.replace(/\n/g, '<br>')
  ];

  const email = emailLines.join('\r\n');

  // Encode to base64url
  const encodedMessage = Buffer.from(email)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  // Create draft via Gmail API
  const response = await axios.post(
    'https://gmail.googleapis.com/gmail/v1/users/me/drafts',
    {
      message: {
        raw: encodedMessage
      }
    },
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    }
  );

  logger.info('Gmail draft created successfully', { draftId: response.data.id });
  return response.data;
}

// Helper function to create Outlook draft
async function createOutlookDraft(
  accessToken: string,
  to: string,
  subject: string,
  body: string
): Promise<any> {
  const response = await axios.post(
    'https://graph.microsoft.com/v1.0/me/messages',
    {
      subject: subject,
      body: {
        contentType: 'HTML',
        content: body.replace(/\n/g, '<br>')
      },
      toRecipients: [
        {
          emailAddress: {
            address: to
          }
        }
      ]
    },
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    }
  );

  logger.info('Outlook draft created successfully', { draftId: response.data.id });
  return response.data;
}

export default router;
