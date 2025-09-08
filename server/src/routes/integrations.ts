import express from 'express';
import { Integration } from '../models/Integration';
import GoogleAuthService from '../services/googleAuth';
import GoogleDriveService from '../services/googleDrive';
import GoogleCalendarService from '../services/googleCalendar';
import { authMiddleware as auth } from '../middleware/auth';
import logger from '../utils/logger';

const router = express.Router();

// In-memory storage for demo - replace with database
const integrations: Integration[] = [];

// Get user's integrations
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user?.id || 'demo-user';
    const userIntegrations = integrations.filter(i => i.userId === userId);
    
    res.json({
      success: true,
      data: userIntegrations.map(integration => ({
        id: integration.id,
        provider: integration.provider,
        type: integration.type,
        isActive: integration.isActive,
        profile: integration.profile,
        scope: integration.scope,
        createdAt: integration.createdAt,
        updatedAt: integration.updatedAt
      }))
    });
  } catch (error) {
    logger.error('Error fetching integrations:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch integrations' });
  }
});

// Initiate Google OAuth flow
router.post('/google/connect', auth, async (req, res) => {
  try {
    const { types } = req.body; // ['profile', 'drive', 'calendar']
    const userId = req.user?.id || 'demo-user';
    
    if (!types || !Array.isArray(types)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Types array is required' 
      });
    }

    const scopes = GoogleAuthService.getScopes(types);
    const authUrl = GoogleAuthService.getAuthUrl(scopes, userId!);
    
    res.json({
      success: true,
      data: {
        authUrl,
        scopes,
        types
      }
    });
  } catch (error) {
    logger.error('Error initiating Google OAuth:', error);
    res.status(500).json({ success: false, error: 'Failed to initiate OAuth flow' });
  }
});

// Handle Google OAuth callback
router.get('/google/callback', async (req, res) => {
  try {
    const { code, state: userId } = req.query;
    
    if (!code || !userId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Authorization code and state are required' 
      });
    }

    // Exchange code for tokens
    const tokens = await GoogleAuthService.exchangeCodeForTokens(code as string);
    
    // Get user profile
    const profile = await GoogleAuthService.getUserProfile(tokens.access_token);
    
    // Determine integration types based on scopes
    const scopes = tokens.scope.split(' ');
    const types = [];
    
    if (scopes.some(s => s.includes('userinfo'))) types.push('profile');
    if (scopes.some(s => s.includes('drive'))) types.push('drive');
    if (scopes.some(s => s.includes('calendar'))) types.push('calendar');

    // Create integrations for each type
    for (const type of types) {
      const integration: Integration = {
        id: `${userId}-google-${type}-${Date.now()}`,
        userId: userId as string,
        provider: 'google',
        type: type as 'drive' | 'calendar' | 'profile',
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt: new Date(Date.now() + tokens.expires_in),
        scope: scopes,
        profile: {
          email: profile.email,
          name: profile.name,
          picture: profile.picture as string | undefined
        },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Remove existing integration of same type
      const existingIndex = integrations.findIndex(
        i => i.userId === userId && i.provider === 'google' && i.type === type
      );
      
      if (existingIndex >= 0) {
        integrations.splice(existingIndex, 1);
      }
      
      integrations.push(integration);
    }
    
    // Redirect to OAuth callback page
    res.redirect('http://localhost:3000/app/oauth/callback?integration=success');
  } catch (error) {
    logger.error('Error handling Google OAuth callback:', error);
    res.redirect('http://localhost:3000/app/oauth/callback?integration=error');
  }
});

// Disconnect integration
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || 'demo-user';
    
    const index = integrations.findIndex(i => i.id === id && i.userId === userId);
    
    if (index === -1) {
      return res.status(404).json({ 
        success: false, 
        error: 'Integration not found' 
      });
    }
    
    integrations.splice(index, 1);
    
    res.json({
      success: true,
      message: 'Integration disconnected successfully'
    });
  } catch (error) {
    logger.error('Error disconnecting integration:', error);
    res.status(500).json({ success: false, error: 'Failed to disconnect integration' });
  }
});

// Get Google Drive files
router.get('/google/drive/files', auth, async (req, res) => {
  try {
    const userId = req.user?.id || 'demo-user';
    const driveIntegration = integrations.find(
      i => i.userId === userId && i.provider === 'google' && i.type === 'drive' && i.isActive
    );
    
    if (!driveIntegration) {
      return res.status(404).json({ 
        success: false, 
        error: 'Google Drive integration not found' 
      });
    }

    const files = await GoogleDriveService.listFiles(driveIntegration.accessToken);
    
    res.json({
      success: true,
      data: files
    });
  } catch (error) {
    logger.error('Error fetching Drive files:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch Drive files' });
  }
});

// Get Google Calendar events
router.get('/google/calendar/events', auth, async (req, res) => {
  try {
    const userId = req.user?.id || 'demo-user';
    const { timeMin, timeMax } = req.query;
    
    const calendarIntegration = integrations.find(
      i => i.userId === userId && i.provider === 'google' && i.type === 'calendar' && i.isActive
    );
    
    if (!calendarIntegration) {
      return res.status(404).json({ 
        success: false, 
        error: 'Google Calendar integration not found' 
      });
    }

    const events = await GoogleCalendarService.listEvents(
      calendarIntegration.accessToken,
      {
        timeMin: timeMin as string,
        timeMax: timeMax as string
      }
    );
    
    res.json({
      success: true,
      data: events
    });
  } catch (error) {
    logger.error('Error fetching Calendar events:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch Calendar events' });
  }
});

// Create Google Calendar event
router.post('/google/calendar/events', auth, async (req, res) => {
  try {
    const userId = req.user?.id || 'demo-user';
    const eventData = req.body;
    
    const calendarIntegration = integrations.find(
      i => i.userId === userId && i.provider === 'google' && i.type === 'calendar' && i.isActive
    );
    
    if (!calendarIntegration) {
      return res.status(404).json({ 
        success: false, 
        error: 'Google Calendar integration not found' 
      });
    }

    const event = await GoogleCalendarService.createEvent(
      calendarIntegration.accessToken,
      eventData
    );
    
    res.json({
      success: true,
      data: event
    });
  } catch (error) {
    logger.error('Error creating Calendar event:', error);
    res.status(500).json({ success: false, error: 'Failed to create Calendar event' });
  }
});

export default router;