import express from 'express';
import { SearcherProfilesFirestoreService } from '../services/searcherProfiles.firestore.service';
import { firebaseAuthMiddleware, FirebaseAuthRequest } from '../middleware/firebaseAuth';
import logger from '../utils/logger';

const router = express.Router();

// Get all searcher profiles for a user
router.get('/', firebaseAuthMiddleware, async (req: FirebaseAuthRequest, res) => {
  try {
    const userId = req.userId!;
    const searcherProfiles = await SearcherProfilesFirestoreService.getSearcherProfiles(userId);
    
    res.json({
      success: true,
      data: {
        searcherProfiles,
        total: searcherProfiles.length
      }
    });
  } catch (error) {
    logger.error('Error getting searcher profiles:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get searcher profiles'
    });
  }
});

// Get a specific searcher profile
router.get('/:searcherId', firebaseAuthMiddleware, async (req: FirebaseAuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { searcherId } = req.params;
    
    const searcherProfile = await SearcherProfilesFirestoreService.getSearcherProfile(userId, searcherId);
    
    if (!searcherProfile) {
      return res.status(404).json({
        success: false,
        message: 'Searcher profile not found'
      });
    }
    
    res.json({
      success: true,
      data: {
        searcherProfile
      }
    });
  } catch (error) {
    logger.error('Error getting searcher profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get searcher profile'
    });
  }
});

// Create a new searcher profile
router.post('/', firebaseAuthMiddleware, async (req: FirebaseAuthRequest, res) => {
  try {
    const userId = req.userId!;
    const searcherData = req.body;
    
    // Validate required fields
    if (!searcherData.name || !searcherData.title || !searcherData.bio) {
      return res.status(400).json({
        success: false,
        message: 'Name, title, and bio are required'
      });
    }
    
    const searcherProfile = await SearcherProfilesFirestoreService.createSearcherProfile(userId, searcherData);
    
    res.status(201).json({
      success: true,
      data: {
        searcherProfile
      }
    });
  } catch (error) {
    logger.error('Error creating searcher profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create searcher profile'
    });
  }
});

// Update a searcher profile
router.put('/:searcherId', firebaseAuthMiddleware, async (req: FirebaseAuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { searcherId } = req.params;
    const updateData = req.body;
    
    // Check if searcher profile exists
    const existingProfile = await SearcherProfilesFirestoreService.getSearcherProfile(userId, searcherId);
    if (!existingProfile) {
      return res.status(404).json({
        success: false,
        message: 'Searcher profile not found'
      });
    }
    
    const updatedProfile = await SearcherProfilesFirestoreService.updateSearcherProfile(userId, searcherId, updateData);
    
    res.json({
      success: true,
      data: {
        searcherProfile: updatedProfile
      }
    });
  } catch (error) {
    logger.error('Error updating searcher profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update searcher profile'
    });
  }
});

// Delete a searcher profile
router.delete('/:searcherId', firebaseAuthMiddleware, async (req: FirebaseAuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { searcherId } = req.params;
    
    // Check if searcher profile exists
    const existingProfile = await SearcherProfilesFirestoreService.getSearcherProfile(userId, searcherId);
    if (!existingProfile) {
      return res.status(404).json({
        success: false,
        message: 'Searcher profile not found'
      });
    }
    
    await SearcherProfilesFirestoreService.deleteSearcherProfile(userId, searcherId);
    
    res.json({
      success: true,
      message: 'Searcher profile deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting searcher profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete searcher profile'
    });
  }
});

export default router;
