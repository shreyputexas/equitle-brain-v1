import React from 'react';
import { Box, Typography, Button } from '@mui/material';

export default function VoiceCallsTest() {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 2 }}>
        Voice Calls Test
      </Typography>
      <Typography variant="body1" sx={{ mb: 2 }}>
        This is a test component to verify the page loads correctly.
      </Typography>
      <Button variant="contained" sx={{ bgcolor: '#000000', '&:hover': { bgcolor: '#333333' } }}>
        Test Button
      </Button>
    </Box>
  );
}
