import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  AccountTree as ApolloIcon,
  Person as ProfileIcon,
  CheckCircle as CheckIcon
} from '@mui/icons-material';
import integrationService from '../../services/integrationService';

interface ApolloConnectDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const ApolloConnectDialog: React.FC<ApolloConnectDialogProps> = ({
  open,
  onClose,
  onSuccess
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async () => {
    try {
      setLoading(true);
      setError(null);

      const { authUrl } = await integrationService.connectApollo();
      
      // Redirect the current window to Apollo OAuth
      window.location.href = authUrl;

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect to Apollo');
      setLoading(false);
    }
  };

  const resetDialog = () => {
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
        <ApolloIcon sx={{ color: '#6366f1' }} />
        Connect to Apollo
      </DialogTitle>
      
      <DialogContent>
        <Typography variant="body1" sx={{ mb: 3, color: 'text.secondary' }}>
          Connect your Apollo account to enable data enrichment and contact search features in Equitle.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
            This will allow Equitle to:
          </Typography>
          <List dense>
            <ListItem sx={{ py: 0.25, pl: 0 }}>
              <ListItemIcon sx={{ minWidth: 20 }}>
                <CheckIcon sx={{ fontSize: 16, color: 'success.main' }} />
              </ListItemIcon>
              <ListItemText 
                primary="Search for contacts and people"
                primaryTypographyProps={{ variant: 'body2' }}
              />
            </ListItem>
            <ListItem sx={{ py: 0.25, pl: 0 }}>
              <ListItemIcon sx={{ minWidth: 20 }}>
                <CheckIcon sx={{ fontSize: 16, color: 'success.main' }} />
              </ListItemIcon>
              <ListItemText 
                primary="Enrich contact data with email and phone numbers"
                primaryTypographyProps={{ variant: 'body2' }}
              />
            </ListItem>
            <ListItem sx={{ py: 0.25, pl: 0 }}>
              <ListItemIcon sx={{ minWidth: 20 }}>
                <CheckIcon sx={{ fontSize: 16, color: 'success.main' }} />
              </ListItemIcon>
              <ListItemText 
                primary="Access organization information"
                primaryTypographyProps={{ variant: 'body2' }}
              />
            </ListItem>
            <ListItem sx={{ py: 0.25, pl: 0 }}>
              <ListItemIcon sx={{ minWidth: 20 }}>
                <CheckIcon sx={{ fontSize: 16, color: 'success.main' }} />
              </ListItemIcon>
              <ListItemText 
                primary="View your basic Apollo profile"
                primaryTypographyProps={{ variant: 'body2' }}
              />
            </ListItem>
          </List>
        </Box>

        <Alert severity="info" sx={{ mt: 2 }}>
          You can disconnect Apollo at any time from your settings page.
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
          disabled={loading}
          startIcon={<ApolloIcon />}
          sx={{
            bgcolor: '#6366f1',
            '&:hover': { bgcolor: '#4f46e5' }
          }}
        >
          {loading ? 'Redirecting to Apollo...' : 'Connect to Apollo'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ApolloConnectDialog;

