import express from 'express';
import Joi from 'joi';
import { firebaseAuthMiddleware, FirebaseAuthRequest } from '../middleware/firebaseAuth';
import { FirebaseAuthService } from '../services/firebaseAuth.service';
import logger from '../utils/logger';

const router = express.Router();

// Validation schemas
const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  name: Joi.string().min(2).required(),
  firm: Joi.string().optional(),
  role: Joi.string().optional(),
  phone: Joi.string().optional(),
  location: Joi.string().optional(),
});

const changePasswordSchema = Joi.object({
  newPassword: Joi.string().min(8).required(),
});

// @route   POST /api/auth/register
// @desc    Register new user in Firebase
// @access  Public
router.post('/register', async (req, res) => {
  try {
    // Validate input
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        details: error.details.map(d => d.message)
      });
    }

    const { email, password, ...userData } = value;
    const result = await FirebaseAuthService.createUser(email, password, userData);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        uid: result.uid,
        email: result.email,
        user: result.user
      }
    });
  } catch (error: any) {
    logger.error('Registration error:', error);

    if (error.message === 'User with this email already exists') {
      return res.status(409).json({
        success: false,
        message: error.message
      });
    }

    if (error.message === 'Password is too weak') {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    if (error.message === 'Invalid email address') {
      return res.status(400).json({
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

// @route   GET /api/auth/me
// @desc    Get current user data
// @access  Private
router.get('/me', firebaseAuthMiddleware, async (req: FirebaseAuthRequest, res) => {
  try {
    const uid = req.userId!;
    const userData = await FirebaseAuthService.getUserData(uid);

    res.json({
      success: true,
      data: {
        uid,
        email: req.user!.email,
        emailVerified: req.user!.emailVerified,
        displayName: req.user!.displayName,
        photoURL: req.user!.photoURL,
        ...userData
      }
    });
  } catch (error: any) {
    logger.error('Get user error:', error);

    if (error.message === 'User data not found') {
      return res.status(404).json({
        success: false,
        message: 'User data not found'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', firebaseAuthMiddleware, async (req: FirebaseAuthRequest, res) => {
  try {
    const uid = req.userId!;
    const user = await FirebaseAuthService.updateProfile(uid, req.body);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: user
    });
  } catch (error: any) {
    logger.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/auth/preferences
// @desc    Update user preferences
// @access  Private
router.put('/preferences', firebaseAuthMiddleware, async (req: FirebaseAuthRequest, res) => {
  try {
    const uid = req.userId!;
    const preferences = await FirebaseAuthService.updatePreferences(uid, req.body);

    res.json({
      success: true,
      message: 'Preferences updated successfully',
      data: preferences
    });
  } catch (error: any) {
    logger.error('Update preferences error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/auth/change-password
// @desc    Change user password
// @access  Private
router.post('/change-password', firebaseAuthMiddleware, async (req: FirebaseAuthRequest, res) => {
  try {
    // Validate input
    const { error, value } = changePasswordSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        details: error.details.map(d => d.message)
      });
    }

    const uid = req.userId!;
    const { newPassword } = value;

    await FirebaseAuthService.changePassword(uid, newPassword);

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error: any) {
    logger.error('Change password error:', error);

    if (error.message === 'New password is too weak') {
      return res.status(400).json({
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

// @route   DELETE /api/auth/account
// @desc    Delete user account
// @access  Private
router.delete('/account', firebaseAuthMiddleware, async (req: FirebaseAuthRequest, res) => {
  try {
    const uid = req.userId!;

    await FirebaseAuthService.deleteAccount(uid);

    res.json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error: any) {
    logger.error('Delete account error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/auth/send-email-verification
// @desc    Send email verification link
// @access  Private
router.post('/send-email-verification', firebaseAuthMiddleware, async (req: FirebaseAuthRequest, res) => {
  try {
    const uid = req.userId!;
    const link = await FirebaseAuthService.sendEmailVerification(uid);

    res.json({
      success: true,
      message: 'Email verification link sent',
      data: { link }
    });
  } catch (error: any) {
    logger.error('Send email verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send email verification'
    });
  }
});

// @route   POST /api/auth/send-password-reset
// @desc    Send password reset email
// @access  Public
router.post('/send-password-reset', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const link = await FirebaseAuthService.sendPasswordResetEmail(email);

    res.json({
      success: true,
      message: 'Password reset link sent',
      data: { link }
    });
  } catch (error: any) {
    logger.error('Send password reset error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send password reset email'
    });
  }
});

// @route   POST /api/auth/verify-token
// @desc    Verify Firebase ID token
// @access  Public
router.post('/verify-token', async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({
        success: false,
        message: 'ID token is required'
      });
    }

    const decodedToken = await FirebaseAuthService.verifyIdToken(idToken);

    res.json({
      success: true,
      message: 'Token is valid',
      data: decodedToken
    });
  } catch (error: any) {
    logger.error('Verify token error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
});

// @route   POST /api/auth/set-role
// @desc    Set user role (admin only)
// @access  Private (Admin)
router.post('/set-role', firebaseAuthMiddleware, async (req: FirebaseAuthRequest, res) => {
  try {
    // Check if current user is admin
    const currentUserRole = req.user!.customClaims?.role;
    if (currentUserRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can set user roles'
      });
    }

    const { uid, role } = req.body;

    if (!uid || !role) {
      return res.status(400).json({
        success: false,
        message: 'User ID and role are required'
      });
    }

    await FirebaseAuthService.setUserRole(uid, role);

    res.json({
      success: true,
      message: 'User role updated successfully'
    });
  } catch (error: any) {
    logger.error('Set role error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to set user role'
    });
  }
});

export default router;