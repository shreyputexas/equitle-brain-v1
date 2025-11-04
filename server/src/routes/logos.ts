import express from 'express';
import { logoUpload, imageUploadService } from '../services/imageUpload.service';
import { firebaseAuthMiddleware } from '../middleware/firebaseAuth';
import { db, FirestoreHelpers } from '../lib/firebase';
import logger from '../utils/logger';

const router = express.Router();

// Upload logo for the search fund
router.post('/upload', firebaseAuthMiddleware, logoUpload.single('logo'), async (req, res) => {
  try {
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

    // Upload the logo
    const imageUrl = await imageUploadService.uploadLogo(req.file, userId);

    // Update the user's search fund profile with the new logo URL
    const userRef = db.collection('users').doc(userId);
    await userRef.update({
      searchFundLogo: imageUrl,
      updatedAt: FirestoreHelpers.serverTimestamp()
    });

    logger.info('Logo uploaded and profile updated', {
      userId,
      imageUrl
    });

    res.json({
      success: true,
      imageUrl,
      message: 'Logo uploaded successfully'
    });

  } catch (error: any) {
    logger.error('Error uploading logo', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.uid
    });

    res.status(500).json({
      success: false,
      message: 'Failed to upload logo',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Delete logo for the search fund
router.delete('/', firebaseAuthMiddleware, async (req, res) => {
  try {
    const userId = req.user?.uid;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    // Get the current logo URL from the user profile
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found'
      });
    }

    const userData = userDoc.data();
    const currentLogoUrl = userData?.searchFundLogo;

    // Delete the logo file if it exists
    if (currentLogoUrl) {
      await imageUploadService.deleteLogo(currentLogoUrl);
    }

    // Remove the logo URL from the user profile
    await userRef.update({
      searchFundLogo: null,
      updatedAt: FirestoreHelpers.serverTimestamp()
    });

    logger.info('Logo deleted and profile updated', {
      userId
    });

    res.json({
      success: true,
      message: 'Logo deleted successfully'
    });

  } catch (error: any) {
    logger.error('Error deleting logo', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.uid
    });

    res.status(500).json({
      success: false,
      message: 'Failed to delete logo',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

export default router;
