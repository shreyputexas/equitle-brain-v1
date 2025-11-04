import express from 'express';
import Joi from 'joi';
import { firebaseAuthMiddleware, FirebaseAuthRequest } from '../middleware/firebaseAuth';
import { LPGroupsFirestoreService } from '../services/lpGroups.firestore.service';
import logger from '../utils/logger';

const router = express.Router();

// Validation schema for creating an LP group
const createLPGroupSchema = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().optional(),
  criteria: Joi.object().optional(),
  autoAssign: Joi.boolean().default(false),
  emailPreferences: Joi.object().optional(),
});

// Validation schema for updating an LP group
const updateLPGroupSchema = Joi.object({
  name: Joi.string().optional(),
  description: Joi.string().optional(),
  criteria: Joi.object().optional(),
  autoAssign: Joi.boolean().optional(),
  emailPreferences: Joi.object().optional(),
});

// @route   GET /api/firebase-lp-groups
// @desc    Get all LP groups for the authenticated user
// @access  Private
router.get('/', firebaseAuthMiddleware, async (req: FirebaseAuthRequest, res) => {
  try {
    const userId = req.userId!;
    const result = await LPGroupsFirestoreService.getAllLPGroups(userId);

    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    logger.error('Get LP groups error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/firebase-lp-groups/:id
// @desc    Get single LP group by ID
// @access  Private
router.get('/:id', firebaseAuthMiddleware, async (req: FirebaseAuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    const result = await LPGroupsFirestoreService.getLPGroupById(userId, id);

    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    logger.error('Get LP group error:', error);

    if (error.message === 'LP group not found') {
      return res.status(404).json({
        success: false,
        message: 'LP group not found'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/firebase-lp-groups
// @desc    Create new LP group
// @access  Private
router.post('/', firebaseAuthMiddleware, async (req: FirebaseAuthRequest, res) => {
  try {
    const userId = req.userId!;

    // Validate input
    const { error, value } = createLPGroupSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        details: error.details.map(d => d.message)
      });
    }

    // Validate required fields
    if (!value.name || !value.name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Group name is required'
      });
    }

    // Sanitize input
    const groupData = {
      name: value.name.trim(),
      description: value.description?.trim() || null,
      criteria: value.criteria || null,
      autoAssign: value.autoAssign || false,
      emailPreferences: value.emailPreferences || null
    };

    const result = await LPGroupsFirestoreService.createLPGroup(userId, groupData);

    res.status(201).json({
      success: true,
      message: 'LP group created successfully',
      data: result
    });
  } catch (error: any) {
    logger.error('Create LP group error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating LP group'
    });
  }
});

// @route   PUT /api/firebase-lp-groups/:id
// @desc    Update LP group
// @access  Private
router.put('/:id', firebaseAuthMiddleware, async (req: FirebaseAuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    // Validate input
    const { error, value } = updateLPGroupSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        details: error.details.map(d => d.message)
      });
    }

    // Sanitize input
    const updates: any = {};
    if (value.name !== undefined) updates.name = value.name.trim();
    if (value.description !== undefined) updates.description = value.description?.trim() || null;
    if (value.criteria !== undefined) updates.criteria = value.criteria;
    if (value.autoAssign !== undefined) updates.autoAssign = value.autoAssign;
    if (value.emailPreferences !== undefined) updates.emailPreferences = value.emailPreferences;

    const result = await LPGroupsFirestoreService.updateLPGroup(userId, id, updates);

    res.json({
      success: true,
      message: 'LP group updated successfully',
      data: result
    });
  } catch (error: any) {
    logger.error('Update LP group error:', error);

    if (error.message === 'LP group not found') {
      return res.status(404).json({
        success: false,
        message: 'LP group not found'
      });
    }

    if (error.message === 'Cannot modify system groups') {
      return res.status(403).json({
        success: false,
        message: 'Cannot modify system groups'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error updating LP group'
    });
  }
});

// @route   DELETE /api/firebase-lp-groups/:id
// @desc    Delete LP group
// @access  Private
router.delete('/:id', firebaseAuthMiddleware, async (req: FirebaseAuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    const result = await LPGroupsFirestoreService.deleteLPGroup(userId, id);

    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    logger.error('Delete LP group error:', error);

    if (error.message === 'LP group not found') {
      return res.status(404).json({
        success: false,
        message: 'LP group not found'
      });
    }

    if (error.message === 'Cannot delete system groups') {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete system groups'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error deleting LP group'
    });
  }
});

// @route   POST /api/firebase-lp-groups/:id/members
// @desc    Add investor to group
// @access  Private
router.post('/:id/members', firebaseAuthMiddleware, async (req: FirebaseAuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;
    const { investorId } = req.body;

    if (!investorId) {
      return res.status(400).json({
        success: false,
        message: 'Investor ID is required'
      });
    }

    const result = await LPGroupsFirestoreService.addInvestorToGroup(userId, id, investorId);

    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    logger.error('Add investor to group error:', error);

    if (error.message === 'LP group not found' || error.message === 'Investor not found') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    if (error.message === 'Investor is already in this group') {
      return res.status(409).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error adding investor to group'
    });
  }
});

// @route   DELETE /api/firebase-lp-groups/:id/members/:investorId
// @desc    Remove investor from group
// @access  Private
router.delete('/:id/members/:investorId', firebaseAuthMiddleware, async (req: FirebaseAuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { id, investorId } = req.params;

    const result = await LPGroupsFirestoreService.removeInvestorFromGroup(userId, id, investorId);

    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    logger.error('Remove investor from group error:', error);

    if (error.message === 'LP group not found') {
      return res.status(404).json({
        success: false,
        message: 'LP group not found'
      });
    }

    if (error.message === 'Cannot remove investors from the default group') {
      return res.status(403).json({
        success: false,
        message: 'Cannot remove investors from the default group'
      });
    }

    if (error.message === 'Investor not found in this group') {
      return res.status(404).json({
        success: false,
        message: 'Investor not found in this group'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error removing investor from group'
    });
  }
});

export default router;