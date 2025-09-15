import express from 'express';
import Joi from 'joi';
import { authMiddleware } from '../middleware/auth';
import { AuthService } from '../services/auth.service';
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

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().min(8).required(),
});

// @route   POST /api/auth/register
// @desc    Register new user
// @access  Public
router.post('/register', async (req, res) => {
  try {
    // Validate input
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ 
        message: 'Validation error', 
        details: error.details.map(d => d.message) 
      });
    }

    const result = await AuthService.register(value);
    
    res.status(201).json({
      message: 'User registered successfully',
      ...result
    });
  } catch (error: any) {
    logger.error('Registration error:', error);
    
    if (error.message === 'User with this email already exists') {
      return res.status(409).json({ message: error.message });
    }
    
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', async (req, res) => {
  try {
    // Validate input
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ 
        message: 'Validation error', 
        details: error.details.map(d => d.message) 
      });
    }

    const { email, password } = value;
    const result = await AuthService.login(email, password);

    res.json(result);
  } catch (error: any) {
    logger.error('Login error:', error);
    
    if (error.message === 'Invalid credentials') {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const user = await AuthService.getUserById(userId);

    res.json({ user });
  } catch (error: any) {
    logger.error('Get user error:', error);
    
    if (error.message === 'User not found') {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const user = await AuthService.updateProfile(userId, req.body);

    res.json({ 
      message: 'Profile updated successfully',
      user 
    });
  } catch (error: any) {
    logger.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/auth/preferences
// @desc    Update user preferences
// @access  Private
router.put('/preferences', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const preferences = await AuthService.updatePreferences(userId, req.body);

    res.json({ 
      message: 'Preferences updated successfully',
      preferences 
    });
  } catch (error: any) {
    logger.error('Update preferences error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/auth/change-password
// @desc    Change user password
// @access  Private
router.post('/change-password', authMiddleware, async (req, res) => {
  try {
    // Validate input
    const { error, value } = changePasswordSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ 
        message: 'Validation error', 
        details: error.details.map(d => d.message) 
      });
    }

    const userId = (req as any).user.id;
    const { currentPassword, newPassword } = value;
    
    await AuthService.changePassword(userId, currentPassword, newPassword);

    res.json({ message: 'Password changed successfully' });
  } catch (error: any) {
    logger.error('Change password error:', error);
    
    if (error.message === 'Current password is incorrect') {
      return res.status(400).json({ message: error.message });
    }
    
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/auth/refresh
// @desc    Refresh JWT token
// @access  Public
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({ message: 'Refresh token is required' });
    }

    const tokens = await AuthService.refreshToken(refreshToken);

    res.json(tokens);
  } catch (error: any) {
    logger.error('Token refresh error:', error);
    res.status(401).json({ message: 'Invalid refresh token' });
  }
});

// @route   DELETE /api/auth/account
// @desc    Delete user account
// @access  Private
router.delete('/account', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { password } = req.body;
    
    if (!password) {
      return res.status(400).json({ message: 'Password is required' });
    }

    await AuthService.deleteAccount(userId, password);

    res.json({ message: 'Account deleted successfully' });
  } catch (error: any) {
    logger.error('Delete account error:', error);
    
    if (error.message === 'Password is incorrect') {
      return res.status(400).json({ message: error.message });
    }
    
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;