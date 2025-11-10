import express from 'express';
import { authMiddleware } from '../middleware/auth';
import { ContactSearchThesisFirestoreService } from '../services/contactSearchThesis.firestore.service';
import logger from '../utils/logger';

const router = express.Router();

// @route   GET /api/contact-search-theses
// @desc    Get all contact search theses for the authenticated user
// @access  Private
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    const { contactType } = req.query;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const theses = await ContactSearchThesisFirestoreService.getTheses(
      userId,
      contactType as 'people' | 'brokers' | 'investors' | undefined
    );

    res.json({
      success: true,
      data: { theses }
    });
  } catch (error: any) {
    logger.error('Get contact search theses error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load contact search theses'
    });
  }
});

// @route   GET /api/contact-search-theses/:id
// @desc    Get single contact search thesis by ID
// @access  Private
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const thesis = await ContactSearchThesisFirestoreService.getThesis(userId, id);

    if (!thesis) {
      return res.status(404).json({
        success: false,
        error: 'Contact search thesis not found'
      });
    }

    res.json({
      success: true,
      data: { thesis }
    });
  } catch (error: any) {
    logger.error('Get contact search thesis error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load contact search thesis'
    });
  }
});

// @route   POST /api/contact-search-theses
// @desc    Create new contact search thesis
// @access  Private
router.post('/', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { name, contactType, peopleCriteria, brokerCriteria, investorCriteria } = req.body;

    // Validate required fields
    if (!name || !contactType) {
      return res.status(400).json({
        success: false,
        error: 'Name and contact type are required'
      });
    }

    // Validate that the appropriate criteria is provided based on contact type
    if (contactType === 'people' && !peopleCriteria) {
      return res.status(400).json({
        success: false,
        error: 'People criteria is required for people contact type'
      });
    }

    if (contactType === 'brokers' && !brokerCriteria) {
      return res.status(400).json({
        success: false,
        error: 'Broker criteria is required for brokers contact type'
      });
    }

    if (contactType === 'investors' && !investorCriteria) {
      return res.status(400).json({
        success: false,
        error: 'Investor criteria is required for investors contact type'
      });
    }

    const thesis = await ContactSearchThesisFirestoreService.createThesis(userId, {
      name,
      contactType,
      peopleCriteria,
      brokerCriteria,
      investorCriteria
    });

    logger.info(`Contact search thesis created: ${thesis.name} by user ${userId}`);
    res.status(201).json({
      success: true,
      data: { thesis }
    });
  } catch (error: any) {
    logger.error('Create contact search thesis error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create contact search thesis'
    });
  }
});

// @route   PUT /api/contact-search-theses/:id
// @desc    Update contact search thesis
// @access  Private
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if thesis exists
    const existingThesis = await ContactSearchThesisFirestoreService.getThesis(userId, id);

    if (!existingThesis) {
      return res.status(404).json({
        success: false,
        error: 'Contact search thesis not found'
      });
    }

    const { name, contactType, peopleCriteria, brokerCriteria, investorCriteria } = req.body;

    const thesis = await ContactSearchThesisFirestoreService.updateThesis(userId, id, {
      name,
      contactType,
      peopleCriteria,
      brokerCriteria,
      investorCriteria
    });

    logger.info(`Contact search thesis updated: ${thesis.name} by user ${userId}`);
    res.json({
      success: true,
      data: { thesis }
    });
  } catch (error: any) {
    logger.error('Update contact search thesis error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update contact search thesis'
    });
  }
});

// @route   DELETE /api/contact-search-theses/:id
// @desc    Delete contact search thesis
// @access  Private
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if thesis exists
    const existingThesis = await ContactSearchThesisFirestoreService.getThesis(userId, id);

    if (!existingThesis) {
      return res.status(404).json({
        success: false,
        error: 'Contact search thesis not found'
      });
    }

    await ContactSearchThesisFirestoreService.deleteThesis(userId, id);

    logger.info(`Contact search thesis deleted: ${existingThesis.name} by user ${userId}`);
    res.json({
      success: true,
      message: 'Contact search thesis deleted successfully'
    });
  } catch (error: any) {
    logger.error('Delete contact search thesis error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete contact search thesis'
    });
  }
});

export default router;
