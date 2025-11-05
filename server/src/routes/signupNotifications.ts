import express from 'express';
import { sendSignupNotification } from '../services/email.service';
import logger from '../utils/logger';

const router = express.Router();

/**
 * POST /api/signup-notifications
 * Send email notification when a new signup request is received
 * Public endpoint - no auth required since users aren't logged in yet
 */
router.post('/', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format'
      });
    }

    // Send notification email (non-blocking - don't wait for it)
    sendSignupNotification(email, new Date().toISOString())
      .catch(error => {
        logger.error('Background email notification failed', {
          email,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      });

    // Return success immediately (don't wait for email)
    res.json({
      success: true,
      message: 'Signup notification sent'
    });

  } catch (error) {
    logger.error('Error processing signup notification request', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;

