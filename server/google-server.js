const express = require('express');
const cors = require('cors');
const { google } = require('googleapis');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// In-memory storage for demo
const integrations = [];

// Mock auth middleware
const auth = (req, res, next) => {
  req.user = { id: 'demo-user' };
  next();
};

// Get user's integrations
app.get('/api/integrations', auth, (req, res) => {
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
});

// Initiate Google OAuth flow
app.post('/api/integrations/google/connect', auth, (req, res) => {
  try {
    const { types } = req.body;
    const userId = req.user?.id || 'demo-user';
    
    if (!types || !Array.isArray(types)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Types array is required' 
      });
    }

    const scopeMap = {
      'profile': [
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile'
      ],
      'drive': [
        'https://www.googleapis.com/auth/drive.readonly',
        'https://www.googleapis.com/auth/drive.file'
      ],
      'calendar': [
        'https://www.googleapis.com/auth/calendar.readonly',
        'https://www.googleapis.com/auth/calendar.events'
      ]
    };

    const scopes = types.reduce((allScopes, type) => {
      return [...allScopes, ...(scopeMap[type] || [])];
    }, []);

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      state: userId,
      prompt: 'consent'
    });
    
    res.json({
      success: true,
      data: {
        authUrl,
        scopes,
        types
      }
    });
  } catch (error) {
    console.error('Error initiating Google OAuth:', error);
    res.status(500).json({ success: false, error: 'Failed to initiate OAuth flow' });
  }
});

// Handle Google OAuth callback
app.get('/api/integrations/google/callback', async (req, res) => {
  try {
    const { code, state: userId } = req.query;
    
    if (!code || !userId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Authorization code and state are required' 
      });
    }

    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    
    // Get user profile
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const { data: profile } = await oauth2.userinfo.get();
    
    // Determine integration types based on scopes
    const scopes = tokens.scope.split(' ');
    const types = [];
    
    if (scopes.some(s => s.includes('userinfo'))) types.push('profile');
    if (scopes.some(s => s.includes('drive'))) types.push('drive');
    if (scopes.some(s => s.includes('calendar'))) types.push('calendar');

    // Create integrations for each type
    for (const type of types) {
      const integration = {
        id: `${userId}-google-${type}-${Date.now()}`,
        userId: userId,
        provider: 'google',
        type: type,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt: new Date(Date.now() + (tokens.expiry_date - Date.now())),
        scope: scopes,
        profile: {
          email: profile.email,
          name: profile.name,
          picture: profile.picture
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
    res.redirect('http://localhost:3000/app/settings?integration=success');
  } catch (error) {
    console.error('Error handling Google OAuth callback:', error);
    res.redirect('http://localhost:3000/app/settings?integration=error');
  }
});

// Disconnect integration
app.delete('/api/integrations/:id', auth, (req, res) => {
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
    console.error('Error disconnecting integration:', error);
    res.status(500).json({ success: false, error: 'Failed to disconnect integration' });
  }
});

const PORT = 4001;
app.listen(PORT, () => {
  console.log(`🚀 Google integration server running on port ${PORT}`);
});