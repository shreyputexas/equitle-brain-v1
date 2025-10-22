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
  Microsoft as MicrosoftIcon,
  CloudQueue as OneDriveIcon,
  Event as CalendarIcon,
  Person as ProfileIcon,
  Email as EmailIcon,
  CheckCircle as CheckIcon,
  Business as TeamsIcon
} from '@mui/icons-material';
import integrationService from '../../services/integrationService';

interface MicrosoftConnectDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const MicrosoftConnectDialog: React.FC<MicrosoftConnectDialogProps> = ({
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
      label: 'Microsoft Profile',
      description: 'Access your basic profile information',
      icon: <ProfileIcon />,
      permissions: ['View your email address', 'View your basic profile info'],
      required: true
    },
    {
      type: 'onedrive',
      label: 'OneDrive',
      description: 'Access and manage your OneDrive files',
      icon: <OneDriveIcon />,
      permissions: ['View and download your OneDrive files', 'Create new files in your OneDrive'],
      required: false
    },
    {
      type: 'calendar',
      label: 'Outlook Calendar',
      description: 'Access and manage your calendar events',
      icon: <CalendarIcon />,
      permissions: ['View your calendar events', 'Create and edit calendar events'],
      required: false
    },
    {
      type: 'outlook',
      label: 'Outlook Mail',
      description: 'Access and manage your Outlook messages',
      icon: <EmailIcon />,
      permissions: ['Read and send emails', 'View email threads', 'Manage email folders'],
      required: false
    },
    {
      type: 'teams',
      label: 'Microsoft Teams',
      description: 'Access Teams meetings and conversations',
      icon: <TeamsIcon />,
      permissions: ['View Teams meetings', 'Access Teams conversations', 'Create Teams meetings'],
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

      const { authUrl } = await integrationService.connectMicrosoft(selectedTypes);
      
      // Redirect the current window to Microsoft OAuth
      window.location.href = authUrl;

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect to Microsoft');
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
        <MicrosoftIcon sx={{ color: '#00a4ef' }} />
        Connect to Microsoft
      </DialogTitle>
      
      <DialogContent>
        <Typography variant="body1" sx={{ mb: 3, color: 'text.secondary' }}>
          Choose which Microsoft services you'd like to connect to your Equitle account.
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
          startIcon={<MicrosoftIcon />}
          sx={{
            bgcolor: '#00a4ef',
            '&:hover': { bgcolor: '#0078d4' }
          }}
        >
          {loading ? 'Redirecting to Microsoft...' : 'Connect to Microsoft'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MicrosoftConnectDialog;
