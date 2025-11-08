import express from 'express';
import Joi from 'joi';
import { firebaseAuthMiddleware } from '../middleware/firebaseAuth';
import { DealsFirestoreService } from '../services/deals.firestore.service';
import logger from '../utils/logger';

const router = express.Router();

// Validation schemas
const createDealSchema = Joi.object({
  company: Joi.string().required(),
  description: Joi.string().optional(),
  sector: Joi.string().optional(),
  stage: Joi.string().valid('prospect', 'due-diligence', 'term-sheet', 'closing', 'closed').default('prospect'),
  status: Joi.string().valid('active', 'paused', 'closed', 'lost').default('active'),
  value: Joi.number().optional(),
  probability: Joi.number().min(0).max(100).optional(),
  leadPartner: Joi.string().optional(),
  team: Joi.array().items(Joi.string()).optional(),
  tags: Joi.array().items(Joi.string()).optional(),
  priority: Joi.string().valid('low', 'medium', 'high', 'critical').default('medium'),
  targetClose: Joi.date().optional(),
  nextStep: Joi.string().optional(),
  source: Joi.string().optional(),
  geography: Joi.string().optional(),
  dealSize: Joi.string().optional(),
});

const updateDealSchema = Joi.object({
  company: Joi.string().optional(),
  description: Joi.string().optional(),
  sector: Joi.string().optional(),
  stage: Joi.string().valid('prospect', 'due-diligence', 'term-sheet', 'closing', 'closed').optional(),
  status: Joi.string().valid('active', 'paused', 'closed', 'lost').optional(),
  value: Joi.number().optional(),
  probability: Joi.number().min(0).max(100).optional(),
  leadPartner: Joi.string().optional(),
  team: Joi.array().items(Joi.string()).optional(),
  tags: Joi.array().items(Joi.string()).optional(),
  priority: Joi.string().valid('low', 'medium', 'high', 'critical').optional(),
  targetClose: Joi.date().optional(),
  nextStep: Joi.string().optional(),
  source: Joi.string().optional(),
  geography: Joi.string().optional(),
  dealSize: Joi.string().optional(),
});

// @route   GET /api/firebase-deals
// @desc    Get all deals for the authenticated user
// @access  Private
router.get('/', firebaseAuthMiddleware, async (req, res) => {
  try {
    const userId = req.userId!;
    const { search, sector, stage, status, limit = 50, offset = 0 } = req.query;

    logger.info('Get deals request', { userId, search, sector, stage, status, limit, offset });

    const result = await DealsFirestoreService.getAllDeals(userId, {
      search: search as string,
      sector: sector as string,
      stage: stage as string,
      status: status as string,
      limit: Number(limit),
      offset: Number(offset),
    });

    logger.info('Get deals result', { userId, dealsCount: result.deals?.length || 0, total: result.total });

    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    logger.error('Get deals error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/firebase-deals/stats
// @desc    Get deals statistics
// @access  Private
router.get('/stats', firebaseAuthMiddleware, async (req, res) => {
  try {
    const userId = req.userId!;
    const stats = await DealsFirestoreService.getDealsStats(userId);

    res.json({
      success: true,
      data: stats
    });
  } catch (error: any) {
    logger.error('Get deals stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/firebase-deals/by-stage/:stage
// @desc    Get deals by stage
// @access  Private
router.get('/by-stage/:stage', firebaseAuthMiddleware, async (req, res) => {
  try {
    const userId = req.userId!;
    const { stage } = req.params;

    const deals = await DealsFirestoreService.getDealsByStage(userId, stage);

    res.json({
      success: true,
      data: deals
    });
  } catch (error: any) {
    logger.error('Get deals by stage error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/firebase-deals/:id
// @desc    Get single deal by ID
// @access  Private
router.get('/:id', firebaseAuthMiddleware, async (req, res) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    const result = await DealsFirestoreService.getDealById(userId, id);

    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    logger.error('Get deal error:', error);

    if (error.message === 'Deal not found') {
      return res.status(404).json({
        success: false,
        message: 'Deal not found'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/firebase-deals
// @desc    Create new deal
// @access  Private
router.post('/', firebaseAuthMiddleware, async (req, res) => {
  try {
    const userId = req.userId!;

    // Validate input
    const { error, value } = createDealSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        details: error.details.map(d => d.message)
      });
    }

    const result = await DealsFirestoreService.createDeal(userId, value);

    res.status(201).json({
      success: true,
      message: 'Deal created successfully',
      data: result
    });
  } catch (error: any) {
    logger.error('Create deal error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/firebase-deals/:id
// @desc    Update deal
// @access  Private
router.put('/:id', firebaseAuthMiddleware, async (req, res) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    // Validate input
    const { error, value } = updateDealSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        details: error.details.map(d => d.message)
      });
    }

    const result = await DealsFirestoreService.updateDeal(userId, id, value);

    res.json({
      success: true,
      message: 'Deal updated successfully',
      data: result
    });
  } catch (error: any) {
    logger.error('Update deal error:', error);

    if (error.message === 'Deal not found') {
      return res.status(404).json({
        success: false,
        message: 'Deal not found'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/firebase-deals/:id
// @desc    Delete (archive) deal
// @access  Private
router.delete('/:id', firebaseAuthMiddleware, async (req, res) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    const result = await DealsFirestoreService.deleteDeal(userId, id);

    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    logger.error('Delete deal error:', error);

    if (error.message === 'Deal not found') {
      return res.status(404).json({
        success: false,
        message: 'Deal not found'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/firebase-deals/:id/contacts
// @desc    Add contact to deal
// @access  Private
router.post('/:id/contacts', firebaseAuthMiddleware, async (req, res) => {
  try {
    const userId = req.userId!;
    const { id: dealId } = req.params;
    const { contactId } = req.body;

    if (!contactId) {
      return res.status(400).json({
        success: false,
        message: 'Contact ID is required'
      });
    }

    const result = await DealsFirestoreService.addContactToDeal(userId, dealId, contactId);

    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    logger.error('Add contact to deal error:', error);

    if (error.message === 'Deal not found' || error.message === 'Contact not found') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

export default router;