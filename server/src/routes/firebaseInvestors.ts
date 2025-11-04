import express from 'express';
import Joi from 'joi';
import { firebaseAuthMiddleware, FirebaseAuthRequest } from '../middleware/firebaseAuth';
import { InvestorsFirestoreService } from '../services/investors.firestore.service';
import logger from '../utils/logger';

const router = express.Router();

// Validation schema for creating an investor
const createInvestorSchema = Joi.object({
  name: Joi.string().required(),
  type: Joi.string().required(),
  region: Joi.string().optional(),
  commitment: Joi.number().required(),
  called: Joi.number().default(0),
  currency: Joi.string().optional(),
  contactName: Joi.string().required(),
  contactEmail: Joi.string().email().required(),
  contactPhone: Joi.string().optional(),
  address: Joi.string().optional(),
  website: Joi.string().optional(),
  description: Joi.string().optional(),
  investmentPreferences: Joi.array().items(Joi.string()).optional(),
  isQualifiedInvestor: Joi.boolean().optional(),
  requiresReporting: Joi.boolean().optional(),
  taxExempt: Joi.boolean().optional(),
  status: Joi.string().default('active'),
  onboardingDate: Joi.date().optional(),
  entities: Joi.array().optional(),
});

// Validation schema for updating an investor
const updateInvestorSchema = Joi.object({
  name: Joi.string().optional(),
  type: Joi.string().optional(),
  status: Joi.string().optional(),
  totalCommitment: Joi.number().optional(),
  totalCalled: Joi.number().optional(),
  description: Joi.string().optional(),
  website: Joi.string().optional(),
  location: Joi.string().optional(),
  founded: Joi.date().optional(),
  aum: Joi.number().optional(),
  tags: Joi.array().items(Joi.string()).optional(),
  metadata: Joi.object().optional(),
});

// Validation schema for adding an entity
const addEntitySchema = Joi.object({
  name: Joi.string().required(),
  type: Joi.string().required(),
  investmentType: Joi.string().required(),
  commitment: Joi.number().optional(),
  called: Joi.number().default(0),
  status: Joi.string().default('active'),
  documents: Joi.object().optional(),
  fundInvestments: Joi.object().optional(),
});

// @route   GET /api/firebase-investors
// @desc    Get all investors for the authenticated user
// @access  Private
router.get('/', firebaseAuthMiddleware, async (req: FirebaseAuthRequest, res) => {
  try {
    const userId = req.userId!;
    const result = await InvestorsFirestoreService.getAllInvestors(userId);

    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    logger.error('Get investors error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/firebase-investors/stats
// @desc    Get investor statistics
// @access  Private
router.get('/stats', firebaseAuthMiddleware, async (req: FirebaseAuthRequest, res) => {
  try {
    const userId = req.userId!;
    const stats = await InvestorsFirestoreService.getInvestorsStats(userId);

    res.json({
      success: true,
      data: stats
    });
  } catch (error: any) {
    logger.error('Get investor stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/firebase-investors/search
// @desc    Search investors
// @access  Private
router.get('/search', firebaseAuthMiddleware, async (req: FirebaseAuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const investors = await InvestorsFirestoreService.searchInvestors(userId, q as string);

    res.json({
      success: true,
      data: investors
    });
  } catch (error: any) {
    logger.error('Search investors error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/firebase-investors/by-type/:type
// @desc    Get investors by type
// @access  Private
router.get('/by-type/:type', firebaseAuthMiddleware, async (req: FirebaseAuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { type } = req.params;

    const investors = await InvestorsFirestoreService.getInvestorsByType(userId, type);

    res.json({
      success: true,
      data: investors
    });
  } catch (error: any) {
    logger.error('Get investors by type error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/firebase-investors/:id
// @desc    Get single investor by ID
// @access  Private
router.get('/:id', firebaseAuthMiddleware, async (req: FirebaseAuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    const result = await InvestorsFirestoreService.getInvestorById(userId, id);

    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    logger.error('Get investor error:', error);

    if (error.message === 'Investor not found') {
      return res.status(404).json({
        success: false,
        message: 'Investor not found'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/firebase-investors
// @desc    Create new investor
// @access  Private
router.post('/', firebaseAuthMiddleware, async (req: FirebaseAuthRequest, res) => {
  try {
    const userId = req.userId!;

    // Validate input
    const { error, value } = createInvestorSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        details: error.details.map(d => d.message)
      });
    }

    // Transform input to match Firestore service expectations
    const {
      commitment,
      called = 0,
      region,
      contactName,
      contactEmail,
      contactPhone,
      address,
      currency,
      isQualifiedInvestor,
      requiresReporting,
      taxExempt,
      onboardingDate,
      investmentPreferences,
      entities,
      ...otherFields
    } = value;

    const investorData = {
      ...otherFields,
      totalCommitment: Number(commitment),
      totalCalled: Number(called),
      location: region,
      tags: investmentPreferences || [],
      metadata: {
        contactName,
        contactEmail,
        ...(contactPhone && { contactPhone }),
        ...(address && { address }),
        ...(currency && { currency }),
        isQualifiedInvestor: isQualifiedInvestor || false,
        requiresReporting: requiresReporting || false,
        taxExempt: taxExempt || false,
        ...(onboardingDate && { onboardingDate: onboardingDate || new Date().toISOString() })
      }
    };

    const result = await InvestorsFirestoreService.createInvestor(userId, investorData);

    res.status(201).json({
      success: true,
      message: 'Investor added successfully',
      data: result
    });
  } catch (error: any) {
    logger.error('Create investor error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error adding investor'
    });
  }
});

// @route   PUT /api/firebase-investors/:id
// @desc    Update investor
// @access  Private
router.put('/:id', firebaseAuthMiddleware, async (req: FirebaseAuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    // Validate input
    const { error, value } = updateInvestorSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        details: error.details.map(d => d.message)
      });
    }

    const result = await InvestorsFirestoreService.updateInvestor(userId, id, value);

    res.json({
      success: true,
      message: 'Investor updated successfully',
      data: result
    });
  } catch (error: any) {
    logger.error('Update investor error:', error);

    if (error.message === 'Investor not found') {
      return res.status(404).json({
        success: false,
        message: 'Investor not found'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error updating investor'
    });
  }
});

// @route   DELETE /api/firebase-investors/:id
// @desc    Delete investor
// @access  Private
router.delete('/:id', firebaseAuthMiddleware, async (req: FirebaseAuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    const result = await InvestorsFirestoreService.deleteInvestor(userId, id);

    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    logger.error('Delete investor error:', error);

    if (error.message === 'Investor not found') {
      return res.status(404).json({
        success: false,
        message: 'Investor not found'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error deleting investor'
    });
  }
});

// @route   POST /api/firebase-investors/:id/entities
// @desc    Add entity to investor
// @access  Private
router.post('/:id/entities', firebaseAuthMiddleware, async (req: FirebaseAuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { id: investorId } = req.params;

    // Validate input
    const { error, value } = addEntitySchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        details: error.details.map(d => d.message)
      });
    }

    const result = await InvestorsFirestoreService.addEntityToInvestor(userId, investorId, value);

    res.status(201).json({
      success: true,
      message: 'Entity added successfully',
      data: result
    });
  } catch (error: any) {
    logger.error('Add entity to investor error:', error);

    if (error.message === 'Investor not found') {
      return res.status(404).json({
        success: false,
        message: 'Investor not found'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error adding entity'
    });
  }
});

export default router;