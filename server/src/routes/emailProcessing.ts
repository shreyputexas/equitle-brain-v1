import express from 'express';
import { firebaseAuthMiddleware } from '../middleware/firebaseAuth';
import { EmailAutoProcessor } from '../services/emailAutoProcessor';
import { EmailSyncService } from '../services/emailSync';
import { FirestoreHelpers } from '../lib/firebase';
import logger from '../utils/logger';

const router = express.Router();

// @route   GET /api/email-processing/status
// @desc    Get email processing status
// @access  Private
router.get('/status', firebaseAuthMiddleware, async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        isRunning: EmailSyncService.isRunning,
        message: 'Email processing service status'
      }
    });
  } catch (error) {
    logger.error('Get email processing status error:', error);
    res.status(500).json({ success: false, error: 'Failed to get status' });
  }
});

// @route   POST /api/email-processing/process-now
// @desc    Manually trigger email processing
// @access  Private
router.post('/process-now', firebaseAuthMiddleware, async (req, res) => {
  try {
    const userId = (req as any).userId;
    
    await EmailAutoProcessor.processAllEmails(userId);
    
    res.json({
      success: true,
      message: 'Email processing completed'
    });
  } catch (error) {
    logger.error('Manual email processing error:', error);
    res.status(500).json({ success: false, error: 'Failed to process emails' });
  }
});

// @route   GET /api/email-processing/processed-emails
// @desc    Get processed emails for user
// @access  Private
router.get('/processed-emails', firebaseAuthMiddleware, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const { limit = 50, offset = 0 } = req.query;
    
    // Get processed emails from Firebase
    const emailsSnapshot = await FirestoreHelpers.getUserCollection(userId, 'emails')
      .orderBy('createdAt', 'desc')
      .limit(Number(limit))
      .offset(Number(offset))
      .get();
    
    const emails = emailsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    res.json({
      success: true,
      data: { emails, total: emails.length }
    });
  } catch (error) {
    logger.error('Get processed emails error:', error);
    res.status(500).json({ success: false, error: 'Failed to get processed emails' });
  }
});
// @route   POST /api/email-processing/test-ai-public
// @desc    Test OpenAI email analysis with sample email (no auth required)
// @access  Public
router.post('/test-ai-public', async (req, res) => {
  try {
    const { subject, content, sender } = req.body;
    
    if (!subject || !content) {
      return res.status(400).json({ 
        success: false, 
        error: 'Subject and content are required' 
      });
    }

    // Create a mock email object for testing
    const mockEmail = {
      id: 'test-email-' + Date.now(),
      subject: subject,
      content: content,
      sender: sender || 'test@example.com',
      timestamp: new Date(),
      source: 'test'
    };

    // Test the AI analysis
    const analysis = await EmailAutoProcessor['analyzeEmailContent'](mockEmail);
    
    res.json({
      success: true,
      data: {
        email: mockEmail,
        analysis: analysis,
        message: 'AI analysis completed successfully'
      }
    });
  } catch (error) {
    logger.error('Test AI analysis error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to test AI analysis',
      details: error.message 
    });
  }
});
export default router;
