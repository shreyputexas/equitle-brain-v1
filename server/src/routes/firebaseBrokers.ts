import express from 'express';
import Joi from 'joi';
import { firebaseAuthMiddleware } from '../middleware/firebaseAuth';
import { BrokersFirestoreService } from '../services/brokers.firestore.service';
import logger from '../utils/logger';

const router = express.Router();

// Validation schemas
const createBrokerSchema = Joi.object({
  name: Joi.string().required(),
  type: Joi.string().allow('').optional(),
  dealSize: Joi.string().allow('').optional(),
  specialization: Joi.string().allow('').optional(),
  status: Joi.string().valid('active', 'paused', 'closed', 'not-interested').default('active'),
  stage: Joi.string().valid('all', 'response-received', 'closing').default('all'),
  notes: Joi.string().allow('').optional(),
  website: Joi.string().allow('').optional(),
  location: Joi.string().allow('').optional(),
  aum: Joi.string().allow('').optional(),
  firmName: Joi.string().allow('').optional(),
  brokerType: Joi.string().valid('firm', 'individual').allow('').optional(),
  priority: Joi.string().valid('low', 'medium', 'high').default('medium'),
  nextStep: Joi.string().allow('').optional(),
  contactIds: Joi.array().items(Joi.string()).optional(),
});

const updateBrokerSchema = Joi.object({
  name: Joi.string().allow('').optional(),
  type: Joi.string().allow('').optional(),
  dealSize: Joi.string().allow('').optional(),
  specialization: Joi.string().allow('').optional(),
  status: Joi.string().valid('active', 'paused', 'closed', 'not-interested').optional(),
  stage: Joi.string().valid('all', 'response-received', 'closing').optional(),
  notes: Joi.string().allow('').optional(),
  website: Joi.string().allow('').optional(),
  location: Joi.string().allow('').optional(),
  aum: Joi.string().allow('').optional(),
  firmName: Joi.string().allow('').optional(),
  brokerType: Joi.string().valid('firm', 'individual').allow('').optional(),
  priority: Joi.string().valid('low', 'medium', 'high').optional(),
  nextStep: Joi.string().allow('').optional(),
  contactIds: Joi.array().items(Joi.string()).optional(),
});

// @route   GET /api/firebase/brokers
// @desc    Get all brokers for the authenticated user
// @access  Private
router.get('/brokers', firebaseAuthMiddleware, async (req, res) => {
  try {
    const userId = req.userId!;
    const { search, stage, status, limit = 50, offset = 0, include } = req.query;

    const result = await BrokersFirestoreService.getAllBrokers(userId, {
      search: search as string,
      stage: stage as string,
      status: status as string,
      limit: Number(limit),
      offset: Number(offset),
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    logger.error('Get brokers error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/firebase/brokers/:id
// @desc    Get single broker by ID
// @access  Private
router.get('/brokers/:id', firebaseAuthMiddleware, async (req, res) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;
    const { include } = req.query;

    const result = await BrokersFirestoreService.getBrokerById(userId, id, {
      include: include as string
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    logger.error('Get broker error:', error);

    if (error.message === 'Broker not found') {
      return res.status(404).json({
        success: false,
        message: 'Broker not found'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/firebase/brokers
// @desc    Create new broker
// @access  Private
router.post('/brokers', firebaseAuthMiddleware, async (req, res) => {
  try {
    const userId = req.userId!;

    // Validate input
    const { error, value } = createBrokerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        details: error.details.map(d => d.message)
      });
    }

    const result = await BrokersFirestoreService.createBroker(userId, value);

    res.status(201).json({
      success: true,
      message: 'Broker created successfully',
      data: result
    });
  } catch (error: any) {
    logger.error('Create broker error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/firebase/brokers/:id
// @desc    Update broker
// @access  Private
router.put('/brokers/:id', firebaseAuthMiddleware, async (req, res) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    // Validate input
    const { error, value } = updateBrokerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        details: error.details.map(d => d.message)
      });
    }

    const result = await BrokersFirestoreService.updateBroker(userId, id, value);

    res.json({
      success: true,
      message: 'Broker updated successfully',
      data: result
    });
  } catch (error: any) {
    logger.error('Update broker error:', error);

    if (error.message === 'Broker not found') {
      return res.status(404).json({
        success: false,
        message: 'Broker not found'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/firebase/brokers/:id
// @desc    Delete broker
// @access  Private
router.delete('/brokers/:id', firebaseAuthMiddleware, async (req, res) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    logger.info(`Deleting broker ${id} for user ${userId}`);
    const result = await BrokersFirestoreService.deleteBroker(userId, id);
    logger.info(`Successfully deleted broker ${id}`);

    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    logger.error('Delete broker error:', error);

    if (error.message === 'Broker not found') {
      return res.status(404).json({
        success: false,
        message: 'Broker not found'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   POST /api/firebase/brokers/:id/contacts/:contactId
// @desc    Associate contact with broker
// @access  Private
router.post('/brokers/:id/contacts/:contactId', firebaseAuthMiddleware, async (req, res) => {
  try {
    const userId = req.userId!;
    const { id: brokerId, contactId } = req.params;

    const result = await BrokersFirestoreService.associateContact(userId, brokerId, contactId);

    res.json({
      success: true,
      message: 'Contact associated with broker successfully',
      data: result
    });
  } catch (error: any) {
    logger.error('Associate contact with broker error:', error);

    if (error.message === 'Broker not found' || error.message === 'Contact not found') {
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

// @route   POST /api/firebase/brokers/:id/communications/:communicationId
// @desc    Associate communication with broker
// @access  Private
router.post('/brokers/:id/communications/:communicationId', firebaseAuthMiddleware, async (req, res) => {
  try {
    const userId = req.userId!;
    const { id: brokerId, communicationId } = req.params;

    const result = await BrokersFirestoreService.associateCommunication(userId, brokerId, communicationId);

    res.json({
      success: true,
      message: 'Communication associated with broker successfully',
      data: result
    });
  } catch (error: any) {
    logger.error('Associate communication with broker error:', error);

    if (error.message === 'Broker not found' || error.message === 'Communication not found') {
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
