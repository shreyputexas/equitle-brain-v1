import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Box, Typography, CircularProgress, Alert, Button } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';

export default function OAuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processing OAuth callback...');

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const reason = urlParams.get('reason');

    // Check if this is a success or error callback based on the current path
    if (location.pathname.includes('/integrations/success')) {
      setStatus('success');
      setMessage('Google integration connected successfully!');

      // Redirect to settings after 2 seconds
      setTimeout(() => {
        navigate('/settings?integration=success', { replace: true });
      }, 2000);

    } else if (location.pathname.includes('/integrations/error')) {
      setStatus('error');

      // Set specific error messages based on the reason
      switch (reason) {
        case 'access_denied':
          setMessage('Authorization was cancelled. Please try again to connect your Google account.');
          break;
        case 'invalid_state':
          setMessage('Security validation failed. Please try connecting again.');
          break;
        case 'invalid_request':
          setMessage('Invalid OAuth request. Please check your configuration and try again.');
          break;
        case 'server_error':
          setMessage('A server error occurred while processing your request. Please try again.');
          break;
        default:
          setMessage(`OAuth error: ${reason || 'Unknown error occurred'}`);
      }

    } else {
      // Legacy callback handling for existing integrations
      const integrationStatus = urlParams.get('integration');

      if (integrationStatus === 'success') {
        setStatus('success');
        setMessage('Integration connected successfully!');
        setTimeout(() => {
          navigate('/settings?integration=success', { replace: true });
        }, 2000);
      } else if (integrationStatus === 'error') {
        setStatus('error');
        setMessage('Failed to connect integration. Please try again.');
      } else {
        // No clear status, redirect to settings
        navigate('/settings', { replace: true });
      }
    }
  }, [navigate, location]);

  const handleRetry = () => {
    navigate('/settings', { replace: true });
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        bgcolor: 'background.default',
        px: 3
      }}
    >
      {status === 'loading' && (
        <>
          <CircularProgress size={40} sx={{ mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            {message}
          </Typography>
        </>
      )}

      {status === 'success' && (
        <>
          <CheckCircleIcon sx={{ fontSize: 60, color: 'success.main', mb: 2 }} />
          <Typography variant="h5" color="success.main" sx={{ mb: 1, textAlign: 'center' }}>
            Success!
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
            {message}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Redirecting to settings...
          </Typography>
        </>
      )}

      {status === 'error' && (
        <>
          <ErrorIcon sx={{ fontSize: 60, color: 'error.main', mb: 2 }} />
          <Typography variant="h5" color="error.main" sx={{ mb: 1, textAlign: 'center' }}>
            Connection Failed
          </Typography>
          <Alert severity="error" sx={{ mb: 3, maxWidth: 500 }}>
            {message}
          </Alert>
          <Button
            variant="contained"
            onClick={handleRetry}
            sx={{ mt: 2 }}
          >
            Return to Settings
          </Button>
        </>
      )}
    </Box>
  );
}
