import express from 'express';
import { firebaseAuthMiddleware } from '../middleware/firebaseAuth';
import { EmailsFirestoreService } from '../services/emails.firestore.service';
import logger from '../utils/logger';

const router = express.Router();

router.get('/', firebaseAuthMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user?.uid;
    const limit = parseInt(req.query.limit as string) || 20;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    logger.info('Fetching emails', { userId, limit });

    const emails = await EmailsFirestoreService.getEmails(userId, limit);

    res.json({
      success: true,
      data: emails
    });
  } catch (error) {
    logger.error('Error fetching emails:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch emails' });
  }
});

export default router;