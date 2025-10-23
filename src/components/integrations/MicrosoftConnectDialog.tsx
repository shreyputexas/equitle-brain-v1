import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  FormControl,
  FormLabel,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Alert,
  CircularProgress,
  IconButton
} from '@mui/material';
import {
  Close as CloseIcon,
  Microsoft as MicrosoftIcon,
  CloudUpload as OneDriveIcon,
  Email as EmailIcon,
  VideoCall as TeamsIcon,
  Person as ProfileIcon
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

  const serviceOptions = [
    {
      id: 'profile',
      label: 'Profile',
      description: 'Basic profile information',
      icon: <ProfileIcon />,
      required: true
    },
    {
      id: 'onedrive',
      label: 'OneDrive',
      description: 'File storage and management',
      icon: <OneDriveIcon />,
      required: false
    },
    {
      id: 'outlook',
      label: 'Outlook Mail',
      description: 'Email management',
      icon: <EmailIcon />,
      required: false
    },
    {
      id: 'teams',
      label: 'Microsoft Teams',
      description: 'Meeting management',
      icon: <TeamsIcon />,
      required: false
    }
  ];

  const handleTypeChange = (type: string) => {
    if (type === 'profile') {
      // Profile is always required
      return;
    }

    setSelectedTypes(prev => {
      if (prev.includes(type)) {
        return prev.filter(t => t !== type);
      } else {
        return [...prev, type];
      }
    });
  };

  const handleConnect = async () => {
    if (selectedTypes.length === 0) {
      setError('Please select at least one service');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { authUrl } = await integrationService.connectMicrosoft(selectedTypes);
      
      // Redirect directly to Microsoft OAuth (same window)
      window.location.href = authUrl;

    } catch (err) {
      console.error('Microsoft connection error:', err);
      setError(err instanceof Error ? err.message : 'Failed to connect to Microsoft');
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setError(null);
      onClose();
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        pb: 1
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <MicrosoftIcon color="primary" />
          <Typography variant="h6">
            Connect Microsoft Services
          </Typography>
        </Box>
        <IconButton 
          onClick={handleClose} 
          disabled={loading}
          size="small"
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Choose which Microsoft services you'd like to connect to your account.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <FormControl component="fieldset" fullWidth>
          <FormLabel component="legend">Available Services</FormLabel>
          <FormGroup>
            {serviceOptions.map((service) => (
              <FormControlLabel
                key={service.id}
                control={
                  <Checkbox
                    checked={selectedTypes.includes(service.id)}
                    onChange={() => handleTypeChange(service.id)}
                    disabled={service.required || loading}
                    color="primary"
                  />
                }
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 1 }}>
                    {service.icon}
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {service.label}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {service.description}
                      </Typography>
                    </Box>
                  </Box>
                }
                sx={{ 
                  alignItems: 'flex-start',
                  '& .MuiFormControlLabel-label': { width: '100%' }
                }}
              />
            ))}
          </FormGroup>
        </FormControl>

        <Alert severity="info" sx={{ mt: 2 }}>
          <Typography variant="body2">
            <strong>Note:</strong> You'll be redirected to Microsoft to authorize access to your account. 
            Make sure you're signed in to the Microsoft account you want to connect.
          </Typography>
        </Alert>
      </DialogContent>
      
      <DialogActions sx={{ p: 2, pt: 0 }}>
        <Button 
          onClick={handleClose}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          onClick={handleConnect}
          variant="contained"
          disabled={loading || selectedTypes.length === 0}
          startIcon={loading ? <CircularProgress size={16} /> : <MicrosoftIcon />}
          sx={{ bgcolor: '#0078d4' }}
        >
          {loading ? 'Connecting...' : 'Connect to Microsoft'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MicrosoftConnectDialog;
