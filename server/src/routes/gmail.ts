import express from 'express';
import Joi from 'joi';
import { authMiddleware } from '../middleware/auth';
import { GmailService } from '../services/gmail';
import prisma from '../lib/database';
import logger from '../utils/logger';

const router = express.Router();

// Validation schemas
const sendEmailSchema = Joi.object({
  to: Joi.alternatives().try(
    Joi.string().email(),
    Joi.array().items(Joi.string().email())
  ).required(),
  cc: Joi.alternatives().try(
    Joi.string().email(),
    Joi.array().items(Joi.string().email())
  ).optional(),
  bcc: Joi.alternatives().try(
    Joi.string().email(),
    Joi.array().items(Joi.string().email())
  ).optional(),
  subject: Joi.string().required(),
  body: Joi.string().required(),
  isHtml: Joi.boolean().default(false),
  replyTo: Joi.string().email().optional(),
  threadId: Joi.string().optional(),
  dealId: Joi.string().optional(),
  contactId: Joi.string().optional(),
});

// Helper function to get user's Gmail access token
async function getUserGmailToken(userId: string): Promise<string> {
  const integration = await prisma.integration.findFirst({
    where: {
      userId,
      provider: 'google',
      type: 'gmail',
      isActive: true,
    }
  });

  if (!integration || !integration.accessToken) {
    throw new Error('Gmail integration not found or not configured');
  }

  return integration.accessToken;
}

// @route   GET /api/gmail/messages
// @desc    Get Gmail messages
// @access  Private
router.get('/messages', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.id;
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

// @route   GET /api/gmail/messages/:messageId
// @desc    Get specific Gmail message
// @access  Private
router.get('/messages/:messageId', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.id;
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

// @route   POST /api/gmail/send
// @desc    Send email through Gmail
// @access  Private
router.post('/send', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.id;

    // Validate input
    const { error, value } = sendEmailSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        message: 'Validation error',
        details: error.details.map(d => d.message)
      });
    }

    const accessToken = await getUserGmailToken(userId);

    // Send email through Gmail
    const sentMessage = await GmailService.sendEmail(accessToken, value);

    // Store communication record in database
    const toEmails = Array.isArray(value.to) ? value.to : [value.to];
    const ccEmails = value.cc ? (Array.isArray(value.cc) ? value.cc : [value.cc]) : [];
    const bccEmails = value.bcc ? (Array.isArray(value.bcc) ? value.bcc : [value.bcc]) : [];

    const communication = await prisma.communication.create({
      data: {
        userId,
        dealId: value.dealId || null,
        contactId: value.contactId || null,
        type: 'email',
        subject: value.subject,
        content: value.body,
        htmlContent: value.isHtml ? value.body : null,
        toEmails,
        ccEmails,
        bccEmails,
        threadId: sentMessage.threadId || null,
        messageId: sentMessage.id,
        status: 'sent',
        direction: 'outbound',
        sentAt: new Date(),
      }
    });

    // If this email is associated with a contact, update their last contact date
    if (value.contactId) {
      await prisma.contact.update({
        where: { id: value.contactId },
        data: { lastContact: new Date() }
      });
    }

    // If this email is associated with a deal, update the deal's last activity
    if (value.dealId) {
      await prisma.deal.update({
        where: { id: value.dealId },
        data: { lastActivity: new Date() }
      });
    }

    logger.info(`Email sent by user ${userId} to ${toEmails.join(', ')}: ${value.subject}`);
    res.status(201).json({
      message: 'Email sent successfully',
      messageId: sentMessage.id,
      threadId: sentMessage.threadId,
      communication
    });
  } catch (error: any) {
    logger.error('Send Gmail email error:', error);

    if (error.message.includes('Gmail integration not found')) {
      return res.status(400).json({ message: 'Gmail integration required. Please connect your Gmail account in settings.' });
    }

    res.status(500).json({ message: 'Failed to send email' });
  }
});

// @route   POST /api/gmail/reply/:messageId
// @desc    Reply to email through Gmail
// @access  Private
router.post('/reply/:messageId', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { messageId } = req.params;
    const { subject, body, isHtml = false, dealId, contactId } = req.body;

    if (!subject || !body) {
      return res.status(400).json({ message: 'Subject and body are required' });
    }

    const accessToken = await getUserGmailToken(userId);

    // Reply to email through Gmail
    const sentMessage = await GmailService.replyToEmail(accessToken, messageId, {
      subject,
      body,
      isHtml,
      to: '', // Will be filled by replyToEmail method
    });

    // Store communication record in database
    const communication = await prisma.communication.create({
      data: {
        userId,
        dealId: dealId || null,
        contactId: contactId || null,
        type: 'email',
        subject,
        content: body,
        htmlContent: isHtml ? body : null,
        toEmails: [], // Will be populated from the original message
        ccEmails: [],
        bccEmails: [],
        threadId: sentMessage.threadId || null,
        messageId: sentMessage.id,
        status: 'sent',
        direction: 'outbound',
        sentAt: new Date(),
      }
    });

    logger.info(`Email reply sent by user ${userId}: ${subject}`);
    res.status(201).json({
      message: 'Reply sent successfully',
      messageId: sentMessage.id,
      threadId: sentMessage.threadId,
      communication
    });
  } catch (error: any) {
    logger.error('Reply Gmail email error:', error);

    if (error.message.includes('Gmail integration not found')) {
      return res.status(400).json({ message: 'Gmail integration required. Please connect your Gmail account in settings.' });
    }

    res.status(500).json({ message: 'Failed to send reply' });
  }
});

// @route   GET /api/gmail/threads
// @desc    Get Gmail threads
// @access  Private
router.get('/threads', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { q, labelIds, maxResults = 10, pageToken } = req.query;

    const accessToken = await getUserGmailToken(userId);

    const options: any = {};
    if (q) options.q = q as string;
    if (labelIds) options.labelIds = Array.isArray(labelIds) ? labelIds : [labelIds];
    if (maxResults) options.maxResults = Number(maxResults);
    if (pageToken) options.pageToken = pageToken as string;

    const result = await GmailService.listThreads(accessToken, options);

    res.json(result);
  } catch (error: any) {
    logger.error('Get Gmail threads error:', error);

    if (error.message.includes('Gmail integration not found')) {
      return res.status(400).json({ message: 'Gmail integration required. Please connect your Gmail account in settings.' });
    }

    res.status(500).json({ message: 'Failed to fetch Gmail threads' });
  }
});

// @route   GET /api/gmail/labels
// @desc    Get Gmail labels
// @access  Private
router.get('/labels', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.id;

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

// @route   POST /api/gmail/messages/:messageId/read
// @desc    Mark Gmail message as read
// @access  Private
router.post('/messages/:messageId/read', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { messageId } = req.params;

    const accessToken = await getUserGmailToken(userId);
    await GmailService.markAsRead(accessToken, messageId);

    res.json({ message: 'Message marked as read' });
  } catch (error: any) {
    logger.error('Mark Gmail message as read error:', error);

    if (error.message.includes('Gmail integration not found')) {
      return res.status(400).json({ message: 'Gmail integration required. Please connect your Gmail account in settings.' });
    }

    res.status(500).json({ message: 'Failed to mark message as read' });
  }
});

// @route   DELETE /api/gmail/messages/:messageId
// @desc    Delete Gmail message
// @access  Private
router.delete('/messages/:messageId', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { messageId } = req.params;

    const accessToken = await getUserGmailToken(userId);
    await GmailService.deleteMessage(accessToken, messageId);

    res.json({ message: 'Message deleted' });
  } catch (error: any) {
    logger.error('Delete Gmail message error:', error);

    if (error.message.includes('Gmail integration not found')) {
      return res.status(400).json({ message: 'Gmail integration required. Please connect your Gmail account in settings.' });
    }

    res.status(500).json({ message: 'Failed to delete message' });
  }
});

export default router;