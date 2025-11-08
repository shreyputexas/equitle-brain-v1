// @ts-nocheck
import express from 'express';
import { SearcherProfilesFirestoreService } from '../services/searcherProfiles.firestore.service';
import { firebaseAuthMiddleware } from '../middleware/firebaseAuth';
import logger from '../utils/logger';

const router = express.Router();

// DEBUG: Test endpoint to check searcher profiles
router.get('/debug', firebaseAuthMiddleware, async (req, res) => {
  try {
    const userId = req.userId!;
    
    // Get REAL searcher profiles from database
    const searcherProfiles = await SearcherProfilesFirestoreService.getSearcherProfiles(userId);
    
    console.log('=== DEBUG SEARCHER PROFILES (REAL DATA) ===');
    console.log('Found profiles:', searcherProfiles.length);
    searcherProfiles.forEach((profile, index) => {
      console.log(`Profile ${index + 1}:`, {
        id: profile.id,
        name: profile.name,
        title: profile.title,
        headshotUrl: profile.headshotUrl
      });
    });
    console.log('=== END DEBUG ===');
    
    res.json({
      success: true,
      data: {
        searcherProfiles,
        total: searcherProfiles.length
      }
    });
  } catch (error) {
    console.error('Error getting searcher profiles:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get searcher profiles',
      error: error.message
    });
  }
});

// DEBUG: Update searcher profiles with test headshot URLs
router.post('/debug/update-headshots', firebaseAuthMiddleware, async (req, res) => {
  try {
    const userId = req.userId!;
    const searcherProfiles = await SearcherProfilesFirestoreService.getSearcherProfiles(userId);
    
    console.log('=== UPDATING SEARCHER PROFILES WITH HEADSHOTS ===');
    
    for (let i = 0; i < searcherProfiles.length; i++) {
      const profile = searcherProfiles[i];
      const headshotUrl = `uploads/headshots/test-headshot-${i + 1}.jpg`;
      
      console.log(`Updating profile ${i + 1} (${profile.name}) with headshot: ${headshotUrl}`);
      
      // Update the profile with the headshot URL
      await SearcherProfilesFirestoreService.updateSearcherProfile(userId, profile.id, {
        headshotUrl: headshotUrl
      });
    }
    
    console.log('=== HEADSHOT UPDATE COMPLETED ===');
    
    res.json({
      success: true,
      message: `Updated ${searcherProfiles.length} searcher profiles with headshot URLs`
    });
  } catch (error) {
    console.error('Error updating searcher profiles:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update searcher profiles',
      error: error.message
    });
  }
});

// DEBUG: Test image URLs
router.get('/debug/test-images', firebaseAuthMiddleware, async (req, res) => {
  try {
    const userId = req.userId!;
    const searcherProfiles = await SearcherProfilesFirestoreService.getSearcherProfiles(userId);
    
    console.log('=== TESTING IMAGE URLS ===');
    
    const testResults = [];
    
    for (const profile of searcherProfiles) {
      const relativeUrl = profile.headshotUrl;
      const baseUrl = process.env.BACKEND_URL || 'http://localhost:4001';
      const absoluteUrl = `${baseUrl}/${relativeUrl}`;
      
      console.log(`Testing image for ${profile.name}:`);
      console.log(`  Relative URL: ${relativeUrl}`);
      console.log(`  Absolute URL: ${absoluteUrl}`);
      
      // Test if the image is accessible
      try {
        const fs = require('fs');
        const path = require('path');
        const fullPath = path.join(process.cwd(), relativeUrl);
        
        if (fs.existsSync(fullPath)) {
          console.log(`  ✅ File exists at: ${fullPath}`);
          testResults.push({
            name: profile.name,
            relativeUrl,
            absoluteUrl,
            fileExists: true,
            filePath: fullPath
          });
        } else {
          console.log(`  ❌ File does not exist at: ${fullPath}`);
          testResults.push({
            name: profile.name,
            relativeUrl,
            absoluteUrl,
            fileExists: false,
            filePath: fullPath
          });
        }
      } catch (error) {
        console.log(`  ❌ Error checking file: ${error.message}`);
        testResults.push({
          name: profile.name,
          relativeUrl,
          absoluteUrl,
          fileExists: false,
          error: error.message
        });
      }
    }
    
    console.log('=== IMAGE URL TEST COMPLETE ===');
    
    res.json({
      success: true,
      testResults,
      message: 'Image URL test completed'
    });
  } catch (error) {
    console.error('Error testing image URLs:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Get all searcher profiles for a user
router.get('/', firebaseAuthMiddleware, async (req, res) => {
  try {
    const userId = req.userId!;

    // DEBUG: Log which user is fetching profiles
    console.log('🔍 GET /api/searcher-profiles - userId:', userId);

    const searcherProfiles = await SearcherProfilesFirestoreService.getSearcherProfiles(userId);

    console.log(`✅ Found ${searcherProfiles.length} profiles for user ${userId}:`,
      searcherProfiles.map(p => ({ id: p.id, name: p.name })));

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
router.get('/:searcherId', firebaseAuthMiddleware, async (req, res) => {
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
router.post('/', firebaseAuthMiddleware, async (req, res) => {
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
router.put('/:searcherId', firebaseAuthMiddleware, async (req, res) => {
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
router.delete('/:searcherId', firebaseAuthMiddleware, async (req, res) => {
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
