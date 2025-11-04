import express from 'express';
import { upload, imageUploadService } from '../services/imageUpload.service';
import { firebaseAuthMiddleware } from '../middleware/firebaseAuth';
import { db, FirestoreHelpers } from '../lib/firebase';
import logger from '../utils/logger';

const router = express.Router();

// Upload headshot for a searcher profile
router.post('/upload/:searcherId', firebaseAuthMiddleware, upload.single('headshot'), async (req, res) => {
  try {
    const { searcherId } = req.params;
    const userId = req.user?.uid;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    // Upload the image
    const imageUrl = await imageUploadService.uploadHeadshot(req.file, searcherId);

    // Update the searcher profile in Firebase with the new headshot URL
    const searcherRef = db.collection('users').doc(userId).collection('searcherProfiles').doc(searcherId);
    await searcherRef.update({
      headshotUrl: imageUrl,
      updatedAt: FirestoreHelpers.serverTimestamp()
    });

    logger.info('Headshot uploaded and profile updated', {
      userId,
      searcherId,
      imageUrl
    });

    res.json({
      success: true,
      imageUrl,
      message: 'Headshot uploaded successfully'
    });

  } catch (error: any) {
    logger.error('Error uploading headshot', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.uid,
      searcherId: req.params.searcherId
    });

    res.status(500).json({
      success: false,
      message: 'Failed to upload headshot',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Delete headshot for a searcher profile
router.delete('/:searcherId', firebaseAuthMiddleware, async (req, res) => {
  try {
    const { searcherId } = req.params;
    const userId = req.user?.uid;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    // Get the current headshot URL from the profile
    const searcherRef = db.collection('users').doc(userId).collection('searcherProfiles').doc(searcherId);
    const searcherDoc = await searcherRef.get();

    if (!searcherDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Searcher profile not found'
      });
    }

    const searcherData = searcherDoc.data();
    const currentHeadshotUrl = searcherData?.headshotUrl;

    // Delete the image file if it exists
    if (currentHeadshotUrl) {
      await imageUploadService.deleteHeadshot(currentHeadshotUrl);
    }

    // Remove the headshot URL from the profile
    await searcherRef.update({
      headshotUrl: null,
      updatedAt: FirestoreHelpers.serverTimestamp()
    });

    logger.info('Headshot deleted and profile updated', {
      userId,
      searcherId
    });

    res.json({
      success: true,
      message: 'Headshot deleted successfully'
    });

  } catch (error: any) {
    logger.error('Error deleting headshot', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.uid,
      searcherId: req.params.searcherId
    });

    res.status(500).json({
      success: false,
      message: 'Failed to delete headshot',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

export default router;
