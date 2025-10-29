import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemIcon,
  Switch,
  Button,
  Grid,
  Alert,
  CircularProgress,
  Divider,
  Card,
  CardContent,
  IconButton
} from '@mui/material';
import { 
  Add as AddIcon,
  Settings as SettingsIcon,
  Notifications as NotificationsIcon,
  Save as SaveIcon,
  Google as GoogleIcon,
  Microsoft as MicrosoftIcon
} from '@mui/icons-material';
import { useLocation } from 'react-router-dom';
import integrationService, { Integration } from '../services/integrationService';
import GoogleConnectDialog from '../components/integrations/GoogleConnectDialog';
import MicrosoftConnectDialog from '../components/integrations/MicrosoftConnectDialog';
import IntegrationCard from '../components/integrations/IntegrationCard';
import { useAuth } from '../contexts/AuthContext';

export default function Settings() {
  const { user } = useAuth();
  const location = useLocation();
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectDialogOpen, setConnectDialogOpen] = useState(false);
  const [microsoftDialogOpen, setMicrosoftDialogOpen] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [autoSave, setAutoSave] = useState(true);

  useEffect(() => {
    // Only load integrations if user is authenticated
    if (!user) {
      setLoading(false);
      return;
    }

    // Check for integration callback status first
    const urlParams = new URLSearchParams(window.location.search);
    const integrationStatus = urlParams.get('integration');
    const provider = urlParams.get('provider');
    
    if (integrationStatus === 'success') {
      const providerName = provider === 'microsoft' ? 'Microsoft' : 'Google';
      setSuccess(`${providerName} integration connected successfully!`);
      setConnectDialogOpen(false); // Close the dialog
      setMicrosoftDialogOpen(false); // Close Microsoft dialog
      // Remove query param
      window.history.replaceState({}, document.title, window.location.pathname);
      setTimeout(() => {
        loadIntegrations();
      }, 1000);
    } else if (integrationStatus === 'error') {
      const providerName = provider === 'microsoft' ? 'Microsoft' : 'Google';
      setError(`Failed to connect ${providerName} integration. Please try again.`);
      setConnectDialogOpen(false); // Close the dialog
      setMicrosoftDialogOpen(false); // Close Microsoft dialog
      window.history.replaceState({}, document.title, window.location.pathname);
    } else {
      // Only load integrations if we're not handling a callback
      loadIntegrations();
    }
  }, [user]);

  const loadIntegrations = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Check if token is available
      const token = localStorage.getItem('token');
      if (!token) {
        console.warn('No authentication token available');
        setIntegrations([]);
        return;
      }
      
      const data = await integrationService.getIntegrations();
      setIntegrations(data);
    } catch (err) {
      console.error('Failed to load integrations:', err);
      setError(err instanceof Error ? err.message : 'Failed to load integrations');
      // Don't let API errors break the page - just show empty state
      setIntegrations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async (integrationId: string) => {
    try {
      await integrationService.disconnectIntegration(integrationId);
      setSuccess('Integration disconnected successfully');
      await loadIntegrations();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disconnect integration');
    }
  };

  const handleConnectSuccess = () => {
    setConnectDialogOpen(false);
    setSuccess('Integration connected successfully!');
    setTimeout(() => {
      loadIntegrations();
    }, 500);
  };

  const handleMicrosoftConnectSuccess = () => {
    setMicrosoftDialogOpen(false);
    setSuccess('Microsoft integration connected successfully!');
    setTimeout(() => {
      loadIntegrations();
    }, 500);
  };

  const clearMessages = () => {
    setSuccess(null);
    setError(null);
  };

  // Simple fallback to test if the page renders
  if (!user) {
    return (
      <Box sx={{ mt: 2, p: 4 }}>
        <Typography variant="h4">Settings</Typography>
        <Typography variant="body1">Please log in to access settings.</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 2 }}>
      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Typography 
          variant="h3" 
          sx={{ 
            fontWeight: 400, 
            color: '#1f2937',
            fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            letterSpacing: '-0.02em',
            mb: 1
          }}
        >
          Settings
        </Typography>
        <Typography 
          variant="body1" 
          sx={{ 
            color: '#6b7280',
            fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            fontWeight: 400,
            letterSpacing: '-0.01em'
          }}
        >
          Manage your account settings and integrations
        </Typography>
      </Box>

      {/* Success/Error Messages */}
      {success && (
        <Alert 
          severity="success" 
          sx={{ mb: 3, borderRadius: 2 }} 
          onClose={clearMessages}
        >
          {success}
        </Alert>
      )}

      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 3, borderRadius: 2 }} 
          onClose={clearMessages}
        >
          {error}
        </Alert>
      )}

      {/* Connected Services Section */}
      <Card sx={{ mb: 4, borderRadius: 3, boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)', border: '1px solid #e5e7eb' }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box>
              <Typography 
                variant="h6" 
                sx={{ 
                  fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                  fontWeight: 600,
                  color: '#1f2937',
                  letterSpacing: '-0.01em',
                  mb: 1
                }}
              >
                Connected Services
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: '#6b7280',
                  fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                  fontWeight: 400
                }}
              >
                Connect external services to enhance your workflow
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                startIcon={<GoogleIcon />}
                onClick={() => setConnectDialogOpen(true)}
                sx={{
                  background: 'linear-gradient(180deg, #2c2c2c 0%, #1a1a1a 100%)',
                  color: 'white',
                  fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                  fontWeight: 600,
                  borderRadius: 2,
                  px: 3,
                  py: 1,
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
                  '&:hover': {
                    background: 'linear-gradient(180deg, #1a1a1a 0%, #0a0a0a 100%)',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
                    transform: 'translateY(-1px)'
                  },
                  transition: 'all 0.2s ease'
                }}
              >
                Connect Google
              </Button>
              <Button
                variant="contained"
                startIcon={<MicrosoftIcon />}
                onClick={() => setMicrosoftDialogOpen(true)}
                sx={{
                  background: 'linear-gradient(180deg, #2c2c2c 0%, #1a1a1a 100%)',
                  color: 'white',
                  fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                  fontWeight: 600,
                  borderRadius: 2,
                  px: 3,
                  py: 1,
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
                  '&:hover': {
                    background: 'linear-gradient(180deg, #1a1a1a 0%, #0a0a0a 100%)',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
                    transform: 'translateY(-1px)'
                  },
                  transition: 'all 0.2s ease'
                }}
              >
                Connect Microsoft
              </Button>
            </Box>
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : integrations.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <Box sx={{ 
                width: 80, 
                height: 80, 
                borderRadius: '50%', 
                bgcolor: '#f3f4f6', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                mx: 'auto', 
                mb: 3 
              }}>
                <SettingsIcon sx={{ fontSize: 40, color: '#9ca3af' }} />
              </Box>
              <Typography 
                variant="h6" 
                sx={{ 
                  color: '#1f2937',
                  fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                  fontWeight: 600,
                  mb: 1
                }}
              >
                No integrations connected
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: '#6b7280',
                  fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                  mb: 4
                }}
              >
                Connect Google or Microsoft services to access your files, calendar, and more
              </Typography>
            </Box>
          ) : (
            <Grid container spacing={3}>
              {integrations.map((integration) => (
                <Grid item xs={12} md={6} lg={4} key={integration.id}>
                  <IntegrationCard
                    integration={integration}
                    onDisconnect={handleDisconnect}
                    onReconnect={() => setConnectDialogOpen(true)}
                  />
                </Grid>
              ))}
            </Grid>
          )}
        </CardContent>
      </Card>

      {/* Preferences Section */}
      <Card sx={{ borderRadius: 3, boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)', border: '1px solid #e5e7eb' }}>
        <CardContent sx={{ p: 4 }}>
          <Typography 
            variant="h6" 
            sx={{ 
              fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              fontWeight: 600,
              color: '#1f2937',
              letterSpacing: '-0.01em',
              mb: 3
            }}
          >
            Preferences
          </Typography>
          <List sx={{ '& .MuiListItem-root': { px: 0, py: 2 } }}>
            <ListItem>
              <ListItemIcon sx={{ minWidth: 40 }}>
                <NotificationsIcon sx={{ color: '#6b7280' }} />
              </ListItemIcon>
              <ListItemText 
                primary={
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                      fontWeight: 500,
                      color: '#1f2937'
                    }}
                  >
                    Email Notifications
                  </Typography>
                }
                secondary={
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: '#6b7280',
                      fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                    }}
                  >
                    Receive email updates about deals and activities
                  </Typography>
                }
              />
              <Switch 
                checked={emailNotifications}
                onChange={(e) => setEmailNotifications(e.target.checked)}
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': {
                    color: '#1f2937',
                  },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                    backgroundColor: '#1f2937',
                  },
                }}
              />
            </ListItem>
            <ListItem>
              <ListItemIcon sx={{ minWidth: 40 }}>
                <SaveIcon sx={{ color: '#6b7280' }} />
              </ListItemIcon>
              <ListItemText 
                primary={
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                      fontWeight: 500,
                      color: '#1f2937'
                    }}
                  >
                    Auto-save
                  </Typography>
                }
                secondary={
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: '#6b7280',
                      fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                    }}
                  >
                    Automatically save changes as you work
                  </Typography>
                }
              />
              <Switch 
                checked={autoSave}
                onChange={(e) => setAutoSave(e.target.checked)}
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': {
                    color: '#1f2937',
                  },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                    backgroundColor: '#1f2937',
                  },
                }}
              />
            </ListItem>
          </List>
        </CardContent>
      </Card>

      {/* Google Connect Dialog */}
      <GoogleConnectDialog
        open={connectDialogOpen}
        onClose={() => setConnectDialogOpen(false)}
        onSuccess={handleConnectSuccess}
      />

      {/* Microsoft Connect Dialog */}
      <MicrosoftConnectDialog
        open={microsoftDialogOpen}
        onClose={() => setMicrosoftDialogOpen(false)}
        onSuccess={handleMicrosoftConnectSuccess}
      />
    </Box>
  );
}