import express from 'express';
import { firebaseAuthMiddleware } from '../middleware/firebaseAuth';
import { EmailsFirestoreService } from '../services/emails.firestore.service';
import { IntegrationsFirestoreService } from '../services/integrations.firestore.service';
import logger from '../utils/logger';

const router = express.Router();

// Cleanup orphaned emails (emails without integrationId)
router.delete('/cleanup', firebaseAuthMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user?.uid;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    logger.info('Cleaning up orphaned emails', { userId });

    const deletedCount = await EmailsFirestoreService.cleanupOrphanedEmails(userId);

    res.json({
      success: true,
      message: `Deleted ${deletedCount} orphaned emails`,
      deletedCount
    });
  } catch (error) {
    logger.error('Error cleaning up orphaned emails:', error);
    res.status(500).json({ success: false, error: 'Failed to cleanup emails' });
  }
});

// Delete ALL emails (nuclear option - for testing/debugging)
router.delete('/all', firebaseAuthMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user?.uid;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    logger.info('Deleting ALL emails for user', { userId });

    const deletedCount = await EmailsFirestoreService.deleteAllEmails(userId);

    res.json({
      success: true,
      message: `Deleted ALL ${deletedCount} emails`,
      deletedCount
    });
  } catch (error) {
    logger.error('Error deleting all emails:', error);
    res.status(500).json({ success: false, error: 'Failed to delete all emails' });
  }
});

router.get('/', firebaseAuthMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user?.uid;
    const limit = parseInt(req.query.limit as string) || 20;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    logger.info('Fetching emails', { userId, limit });

    // Get active integrations to filter emails
    const integrations = await IntegrationsFirestoreService.findMany({
      userId,
      isActive: true
    });
    const activeIntegrationIds = integrations.map((i: any) => i.id).filter((id: any) => id);
    
    logger.info('Active integrations for email filtering', { 
      userId, 
      count: activeIntegrationIds.length,
      integrationIds: activeIntegrationIds 
    });

    // Fetch emails filtered by active integrations
    const emails = await EmailsFirestoreService.getEmailsByIntegrations(
      userId, 
      activeIntegrationIds, 
      limit
    );

    logger.info('Fetched filtered emails', { userId, count: emails.length });

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