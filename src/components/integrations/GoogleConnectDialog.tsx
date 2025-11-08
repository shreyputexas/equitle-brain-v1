import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Box,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider
} from '@mui/material';
import {
  Google as GoogleIcon,
  DriveEta as DriveIcon,
  Event as CalendarIcon,
  Person as ProfileIcon,
  Email as EmailIcon,
  CheckCircle as CheckIcon
} from '@mui/icons-material';
import integrationService from '../../services/integrationService';

interface GoogleConnectDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const GoogleConnectDialog: React.FC<GoogleConnectDialogProps> = ({
  open,
  onClose,
  onSuccess
}) => {
  const [selectedTypes, setSelectedTypes] = useState<string[]>(['profile']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);


  const integrationOptions = [
    {
      type: 'profile',
      label: 'Google Profile',
      description: 'Access your basic profile information',
      icon: <ProfileIcon />,
      permissions: ['View your email address', 'View your basic profile info'],
      required: true
    },
    {
      type: 'drive',
      label: 'Google Drive',
      description: 'Access and manage your Google Drive files',
      icon: <DriveIcon />,
      permissions: ['View and download your Drive files', 'Create new files in your Drive'],
      required: false
    },
    {
      type: 'calendar',
      label: 'Google Calendar',
      description: 'Access and manage your calendar events',
      icon: <CalendarIcon />,
      permissions: ['View your calendar events', 'Create and edit calendar events'],
      required: false
    },
    {
      type: 'gmail',
      label: 'Gmail',
      description: 'Access and manage your Gmail messages',
      icon: <EmailIcon />,
      permissions: ['Read and send emails', 'View email threads', 'Manage email labels'],
      required: false
    }
  ];

  const handleTypeChange = (type: string, checked: boolean) => {
    if (type === 'profile') return; // Profile is always required

    setSelectedTypes(prev => 
      checked 
        ? [...prev, type]
        : prev.filter(t => t !== type)
    );
  };

  const handleConnect = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get the auth URL from the backend
      const response = await integrationService.connectGoogle(selectedTypes);

      // Check if we got a valid auth URL
      if (!response || !response.authUrl) {
        throw new Error('Failed to get authorization URL from server');
      }

      console.log('Redirecting to Google OAuth:', response.authUrl);

      // Redirect the current window to Google OAuth
      window.location.href = response.authUrl;

    } catch (err) {
      console.error('Google OAuth connection error:', err);
      setError(err instanceof Error ? err.message : 'Failed to connect to Google');
      setLoading(false);
    }
  };

  const resetDialog = () => {
    setSelectedTypes(['profile']);
    setError(null);
    setLoading(false);
  };

  return (
    <Dialog 
      open={open} 
      onClose={() => { onClose(); resetDialog(); }}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <GoogleIcon sx={{ color: '#4285f4' }} />
        Connect to Google
      </DialogTitle>
      
      <DialogContent>
        <Typography variant="body1" sx={{ mb: 3, color: 'text.secondary' }}>
          Choose which Google services you'd like to connect to your Equitle account.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <FormGroup>
          {integrationOptions.map((option) => (
            <Box key={option.type} sx={{ mb: 3 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={selectedTypes.includes(option.type)}
                    onChange={(e) => handleTypeChange(option.type, e.target.checked)}
                    disabled={option.required || loading}
                  />
                }
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {option.icon}
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        {option.label}
                        {option.required && (
                          <Typography component="span" sx={{ color: 'text.secondary', ml: 1, fontSize: '0.75rem' }}>
                            (Required)
                          </Typography>
                        )}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {option.description}
                      </Typography>
                    </Box>
                  </Box>
                }
              />
              
              {selectedTypes.includes(option.type) && (
                <Box sx={{ ml: 5, mt: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                    This will allow Equitle to:
                  </Typography>
                  <List dense>
                    {option.permissions.map((permission, index) => (
                      <ListItem key={index} sx={{ py: 0.25, pl: 0 }}>
                        <ListItemIcon sx={{ minWidth: 20 }}>
                          <CheckIcon sx={{ fontSize: 16, color: 'success.main' }} />
                        </ListItemIcon>
                        <ListItemText 
                          primary={permission}
                          primaryTypographyProps={{ variant: 'body2' }}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}
              
              {option !== integrationOptions[integrationOptions.length - 1] && (
                <Divider sx={{ mt: 2 }} />
              )}
            </Box>
          ))}
        </FormGroup>

        <Alert severity="info" sx={{ mt: 2 }}>
          You can disconnect these services at any time from your settings page.
        </Alert>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button 
          onClick={() => { onClose(); resetDialog(); }}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button 
          variant="contained"
          onClick={handleConnect}
          disabled={loading || selectedTypes.length === 0}
          startIcon={<GoogleIcon />}
          sx={{
            bgcolor: '#4285f4',
            '&:hover': { bgcolor: '#3367d6' }
          }}
        >
          {loading ? 'Redirecting to Google...' : 'Connect to Google'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default GoogleConnectDialog;