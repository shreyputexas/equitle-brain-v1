import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, CircularProgress } from '@mui/material';

export default function OAuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    console.log('OAuthCallback mounted, current URL:', window.location.href);
    
    // Get URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const integrationStatus = urlParams.get('integration');
    
    console.log('Integration status:', integrationStatus);
    
    if (integrationStatus === 'success') {
      console.log('Redirecting to settings with success');
      // Redirect to settings with success message
      navigate('/app/settings?integration=success', { replace: true });
    } else if (integrationStatus === 'error') {
      console.log('Redirecting to settings with error');
      // Redirect to settings with error message
      navigate('/app/settings?integration=error', { replace: true });
    } else {
      console.log('No integration parameter, redirecting to settings');
      // No integration parameter, just go to settings
      navigate('/app/settings', { replace: true });
    }
  }, [navigate]);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        bgcolor: 'background.default'
      }}
    >
      <CircularProgress size={40} sx={{ mb: 2 }} />
      <Typography variant="h6" color="text.secondary">
        Processing OAuth callback...
      </Typography>
    </Box>
  );
}
