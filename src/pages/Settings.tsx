import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  List, 
  ListItem, 
  ListItemText, 
  Switch,
  Button,
  Grid,
  Alert,
  CircularProgress,
  Divider
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { useLocation } from 'react-router-dom';
import integrationService, { Integration } from '../services/integrationService';
import GoogleConnectDialog from '../components/integrations/GoogleConnectDialog';
import MicrosoftConnectDialog from '../components/integrations/MicrosoftConnectDialog';
import IntegrationCard from '../components/integrations/IntegrationCard';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

export default function Settings() {
  const { isDarkMode, toggleDarkMode } = useTheme();
  const { user } = useAuth();
  const location = useLocation();
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectDialogOpen, setConnectDialogOpen] = useState(false);
  const [microsoftDialogOpen, setMicrosoftDialogOpen] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

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

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 600, mb: 4 }}>
        Settings
      </Typography>

      {/* Success/Error Messages */}
      {success && (
        <Alert 
          severity="success" 
          sx={{ mb: 3 }} 
          onClose={clearMessages}
        >
          {success}
        </Alert>
      )}

      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 3 }} 
          onClose={clearMessages}
        >
          {error}
        </Alert>
      )}


      {/* Integrations Section */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h6" gutterBottom>
              Connected Services
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Connect external services to enhance your workflow
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setConnectDialogOpen(true)}
              sx={{ bgcolor: '#4285f4' }}
            >
              Connect Google
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setMicrosoftDialogOpen(true)}
              sx={{ bgcolor: '#0078d4' }}
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
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No integrations connected
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Connect Google or Microsoft services to access your files, calendar, and more
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={() => setConnectDialogOpen(true)}
              >
                Connect Google
              </Button>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={() => setMicrosoftDialogOpen(true)}
                sx={{ borderColor: '#0078d4', color: '#0078d4' }}
              >
                Connect Microsoft
              </Button>
            </Box>
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
      </Paper>

      <Divider sx={{ my: 4 }} />

      {/* Preferences Section */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Preferences
        </Typography>
        <List>
          <ListItem>
            <ListItemText 
              primary="Email Notifications" 
              secondary="Receive email updates about deals and activities"
            />
            <Switch defaultChecked />
          </ListItem>
          <ListItem>
            <ListItemText 
              primary="Dark Mode" 
              secondary="Use dark theme for the interface"
            />
            <Switch 
              checked={isDarkMode}
              onChange={toggleDarkMode}
            />
          </ListItem>
          <ListItem>
            <ListItemText 
              primary="Auto-save" 
              secondary="Automatically save changes as you work"
            />
            <Switch defaultChecked />
          </ListItem>
        </List>
      </Paper>

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