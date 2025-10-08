import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  Avatar,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Divider,
  Alert
} from '@mui/material';
import {
  Google as GoogleIcon,
  DriveEta as DriveIcon,
  Event as CalendarIcon,
  Person as ProfileIcon,
  MoreVert as MoreIcon,
  CheckCircle as ConnectedIcon,
  Cancel as DisconnectedIcon
} from '@mui/icons-material';
import { Integration } from '../../services/integrationService';

interface IntegrationCardProps {
  integration: Integration;
  onDisconnect: (integrationId: string) => void;
  onReconnect: () => void;
}

const IntegrationCard: React.FC<IntegrationCardProps> = ({
  integration,
  onDisconnect,
  onReconnect
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [loading, setLoading] = useState(false);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'profile': return <ProfileIcon />;
      case 'drive': return <DriveIcon />;
      case 'calendar': return <CalendarIcon />;
      default: return <GoogleIcon />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'profile': return 'Profile';
      case 'drive': return 'Drive';
      case 'calendar': return 'Calendar';
      default: return type;
    }
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleDisconnect = async () => {
    setLoading(true);
    try {
      await onDisconnect(integration.id);
    } catch (error) {
      console.error('Failed to disconnect:', error);
    } finally {
      setLoading(false);
      handleMenuClose();
    }
  };

  const handleReconnect = () => {
    onReconnect();
    handleMenuClose();
  };

  return (
    <Card 
      sx={{ 
        height: '100%',
        border: integration.isActive 
          ? '2px solid #4caf50' 
          : '2px solid #f44336',
        '&:hover': {
          transform: 'translateY(-2px)',
          transition: 'transform 0.2s'
        }
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: '#4285f4' }}>
              <GoogleIcon />
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                Google {getTypeLabel(integration.type)}
                {integration.isActive ? (
                  <ConnectedIcon sx={{ color: 'success.main', fontSize: 20 }} />
                ) : (
                  <DisconnectedIcon sx={{ color: 'error.main', fontSize: 20 }} />
                )}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {integration.profile.email}
              </Typography>
            </Box>
          </Box>

          <IconButton onClick={handleMenuClick} size="small">
            <MoreIcon />
          </IconButton>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          {getTypeIcon(integration.type)}
          <Typography variant="body2">
            {integration.type === 'profile' && 'Basic profile information'}
            {integration.type === 'drive' && 'File storage and management'}
            {integration.type === 'calendar' && 'Calendar events and scheduling'}
          </Typography>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
            Status:
          </Typography>
          <Chip
            label={integration.isActive ? 'Connected' : 'Disconnected'}
            color={integration.isActive ? 'success' : 'error'}
            size="small"
            icon={integration.isActive ? <ConnectedIcon /> : <DisconnectedIcon />}
          />
        </Box>

        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
            Permissions:
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {(Array.isArray(integration.scope) ? integration.scope : integration.scope.split(',')).slice(0, 2).map((scope: string, index: number) => (
              <Chip
                key={index}
                label={scope.split('/').pop()?.replace('auth.', '') || scope}
                size="small"
                variant="outlined"
                sx={{ fontSize: '0.75rem' }}
              />
            ))}
            {(Array.isArray(integration.scope) ? integration.scope : integration.scope.split(',')).length > 2 && (
              <Chip
                label={`+${(Array.isArray(integration.scope) ? integration.scope : integration.scope.split(',')).length - 2} more`}
                size="small"
                variant="outlined"
                sx={{ fontSize: '0.75rem' }}
              />
            )}
          </Box>
        </Box>

        <Typography variant="caption" color="text.secondary">
          Connected: {new Date(integration.createdAt).toLocaleDateString()}
        </Typography>

        {!integration.isActive && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            This integration needs to be reconnected.
          </Alert>
        )}

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          {!integration.isActive && (
            <MenuItem onClick={handleReconnect}>
              Reconnect
            </MenuItem>
          )}
          <MenuItem onClick={handleDisconnect} disabled={loading}>
            Disconnect
          </MenuItem>
        </Menu>
      </CardContent>
    </Card>
  );
};

export default IntegrationCard;