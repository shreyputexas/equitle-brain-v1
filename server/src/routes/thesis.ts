import express from 'express';
import { ThesisFirestoreService } from '../services/thesis.firestore.service';
import { firebaseAuthMiddleware } from '../middleware/firebaseAuth';
import logger from '../utils/logger';

const router = express.Router();

// Get all investment theses for a user
router.get('/', firebaseAuthMiddleware, async (req, res) => {
  try {
    const userId = req.userId!;
    const theses = await ThesisFirestoreService.getTheses(userId);
    res.status(200).json({
      success: true,
      data: {
        theses,
        total: theses.length
      }
    });
  } catch (error) {
    logger.error('Error getting investment theses:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get investment theses'
    });
  }
});

// Get a single investment thesis by ID
router.get('/:id', firebaseAuthMiddleware, async (req, res) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;
    const thesis = await ThesisFirestoreService.getThesis(userId, id);

    if (!thesis) {
      return res.status(404).json({ success: false, message: 'Investment thesis not found' });
    }

    res.status(200).json({ success: true, data: { thesis } });
  } catch (error) {
    logger.error(`Error getting investment thesis ${req.params.id}:`, error);
    res.status(500).json({ success: false, message: 'Failed to get investment thesis' });
  }
});

// Create a new investment thesis
router.post('/', firebaseAuthMiddleware, async (req, res) => {
  try {
    const userId = req.userId!;
    const thesisData = req.body;
    
    // Basic validation
    if (!thesisData.name) {
      return res.status(400).json({ success: false, message: 'Name is required' });
    }
    
    const newThesis = await ThesisFirestoreService.createThesis(userId, thesisData);
    res.status(201).json({ success: true, data: { thesis: newThesis } });
  } catch (error) {
    logger.error('Error creating investment thesis:', error);
    res.status(500).json({ success: false, message: 'Failed to create investment thesis' });
  }
});

// Update an existing investment thesis
router.put('/:id', firebaseAuthMiddleware, async (req, res) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;
    const updateData = req.body;
    const updatedThesis = await ThesisFirestoreService.updateThesis(userId, id, updateData);
    res.status(200).json({ success: true, data: { thesis: updatedThesis } });
  } catch (error) {
    logger.error(`Error updating investment thesis ${req.params.id}:`, error);
    res.status(500).json({ success: false, message: 'Failed to update investment thesis' });
  }
});

// Delete an investment thesis
router.delete('/:id', firebaseAuthMiddleware, async (req, res) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;
    await ThesisFirestoreService.deleteThesis(userId, id);
    res.status(200).json({ success: true, message: 'Investment thesis deleted successfully' });
  } catch (error) {
    logger.error(`Error deleting investment thesis ${req.params.id}:`, error);
    res.status(500).json({ success: false, message: 'Failed to delete investment thesis' });
  }
});

export default router;
