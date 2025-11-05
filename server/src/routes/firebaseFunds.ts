import express from 'express';
import Joi from 'joi';
import { firebaseAuthMiddleware } from '../middleware/firebaseAuth';
import { FundsFirestoreService } from '../services/funds.firestore.service';
import logger from '../utils/logger';

const router = express.Router();

// Validation schema for creating a fund
const createFundSchema = Joi.object({
  name: Joi.string().required(),
  type: Joi.string().required(),
  strategy: Joi.string().optional(),
  targetSize: Joi.number().required(),
  minimumCommitment: Joi.number().optional(),
  managementFee: Joi.number().optional(),
  carriedInterest: Joi.number().optional(),
  currency: Joi.string().default('USD'),
  vintage: Joi.number().optional(),
  investmentPeriod: Joi.number().optional(),
  fundTerm: Joi.number().optional(),
  geoFocus: Joi.string().optional(),
  sectorFocus: Joi.string().optional(),
  description: Joi.string().optional(),
  status: Joi.string().default('Pre-Launch'),
});

// Validation schema for updating a fund
const updateFundSchema = Joi.object({
  name: Joi.string().optional(),
  type: Joi.string().optional(),
  strategy: Joi.string().optional(),
  targetSize: Joi.number().optional(),
  minimumCommitment: Joi.number().optional(),
  managementFee: Joi.number().optional(),
  carriedInterest: Joi.number().optional(),
  currency: Joi.string().optional(),
  vintage: Joi.number().optional(),
  investmentPeriod: Joi.number().optional(),
  fundTerm: Joi.number().optional(),
  geoFocus: Joi.string().optional(),
  sectorFocus: Joi.string().optional(),
  description: Joi.string().optional(),
  status: Joi.string().optional(),
  raisedAmount: Joi.number().optional(),
  investorCount: Joi.number().optional(),
});

// @route   GET /api/firebase-funds
// @desc    Get all funds for the authenticated user
// @access  Private
router.get('/', firebaseAuthMiddleware, async (req, res) => {
  try {
    const userId = req.userId!;
    const result = await FundsFirestoreService.getAllFunds(userId);

    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    logger.error('Get funds error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/firebase-funds/stats
// @desc    Get funds statistics
// @access  Private
router.get('/stats', firebaseAuthMiddleware, async (req, res) => {
  try {
    const userId = req.userId!;
    const stats = await FundsFirestoreService.getFundsStats(userId);

    res.json({
      success: true,
      data: stats
    });
  } catch (error: any) {
    logger.error('Get funds stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/firebase-funds/search
// @desc    Search funds
// @access  Private
router.get('/search', firebaseAuthMiddleware, async (req, res) => {
  try {
    const userId = req.userId!;
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const funds = await FundsFirestoreService.searchFunds(userId, q as string);

    res.json({
      success: true,
      data: funds
    });
  } catch (error: any) {
    logger.error('Search funds error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/firebase-funds/by-status/:status
// @desc    Get funds by status
// @access  Private
router.get('/by-status/:status', firebaseAuthMiddleware, async (req, res) => {
  try {
    const userId = req.userId!;
    const { status } = req.params;

    const funds = await FundsFirestoreService.getFundsByStatus(userId, status);

    res.json({
      success: true,
      data: funds
    });
  } catch (error: any) {
    logger.error('Get funds by status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/firebase-funds/by-type/:type
// @desc    Get funds by type
// @access  Private
router.get('/by-type/:type', firebaseAuthMiddleware, async (req, res) => {
  try {
    const userId = req.userId!;
    const { type } = req.params;

    const funds = await FundsFirestoreService.getFundsByType(userId, type);

    res.json({
      success: true,
      data: funds
    });
  } catch (error: any) {
    logger.error('Get funds by type error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/firebase-funds/:id
// @desc    Get single fund by ID
// @access  Private
router.get('/:id', firebaseAuthMiddleware, async (req, res) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    const result = await FundsFirestoreService.getFundById(userId, id);

    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    logger.error('Get fund error:', error);

    if (error.message === 'Fund not found') {
      return res.status(404).json({
        success: false,
        message: 'Fund not found'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/firebase-funds
// @desc    Create new fund
// @access  Private
router.post('/', firebaseAuthMiddleware, async (req, res) => {
  try {
    const userId = req.userId!;

    // Validate input
    const { error, value } = createFundSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        details: error.details.map(d => d.message)
      });
    }

    const result = await FundsFirestoreService.createFund(userId, value);

    res.status(201).json({
      success: true,
      message: 'Fund created successfully',
      data: result
    });
  } catch (error: any) {
    logger.error('Create fund error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating fund'
    });
  }
});

// @route   PUT /api/firebase-funds/:id
// @desc    Update fund
// @access  Private
router.put('/:id', firebaseAuthMiddleware, async (req, res) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    // Validate input
    const { error, value } = updateFundSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        details: error.details.map(d => d.message)
      });
    }

    const result = await FundsFirestoreService.updateFund(userId, id, value);

    res.json({
      success: true,
      message: 'Fund updated successfully',
      data: result
    });
  } catch (error: any) {
    logger.error('Update fund error:', error);

    if (error.message === 'Fund not found') {
      return res.status(404).json({
        success: false,
        message: 'Fund not found'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error updating fund'
    });
  }
});

// @route   PUT /api/firebase-funds/:id/progress
// @desc    Update fund progress (raised amount and investor count)
// @access  Private
router.put('/:id/progress', firebaseAuthMiddleware, async (req, res) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;
    const { raisedAmount, investorCount } = req.body;

    if (raisedAmount === undefined || investorCount === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Both raisedAmount and investorCount are required'
      });
    }

    const result = await FundsFirestoreService.updateFundProgress(userId, id, raisedAmount, investorCount);

    res.json({
      success: true,
      message: 'Fund progress updated successfully',
      data: result
    });
  } catch (error: any) {
    logger.error('Update fund progress error:', error);

    if (error.message === 'Fund not found') {
      return res.status(404).json({
        success: false,
        message: 'Fund not found'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error updating fund progress'
    });
  }
});

// @route   DELETE /api/firebase-funds/:id
// @desc    Delete fund
// @access  Private
router.delete('/:id', firebaseAuthMiddleware, async (req, res) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    const result = await FundsFirestoreService.deleteFund(userId, id);

    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    logger.error('Delete fund error:', error);

    if (error.message === 'Fund not found') {
      return res.status(404).json({
        success: false,
        message: 'Fund not found'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error deleting fund'
    });
  }
});

export default router;