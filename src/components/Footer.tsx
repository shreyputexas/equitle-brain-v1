import React from 'react';
import {
  Box,
  Container,
  Grid,
  Typography,
  Divider,
  IconButton
} from '@mui/material';
import { LinkedIn as LinkedInIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

export default function Footer() {
  const navigate = useNavigate();

  return (
    <Box sx={{ py: 8, background: '#0A0A0A', color: 'white' }}>
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Typography 
              variant="h5" 
              sx={{ 
                fontFamily: '"Space Grotesk", sans-serif',
                fontWeight: 700,
                mb: 2
              }}
            >
              Equitle
            </Typography>
            <Typography variant="body2" sx={{ mb: 3, color: 'rgba(255, 255, 255, 0.7)' }}>
              The AI-powered platform transforming private equity deal management.
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <IconButton
                onClick={() => window.open('https://www.linkedin.com/company/equitle/?viewAsMember=true', '_blank')}
                sx={{
                  color: 'rgba(255, 255, 255, 0.7)',
                  '&:hover': {
                    color: 'white',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)'
                  }
                }}
              >
                <LinkedInIcon />
              </IconButton>
            </Box>
          </Grid>
          <Grid item xs={6} md={3}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
              Account
            </Typography>
            {[
              { name: 'Sign Up', path: '/signup' },
              { name: 'Sign In', path: '/login' }
            ].map((item) => (
              <Typography
                key={item.name}
                variant="body2"
                onClick={() => navigate(item.path)}
                sx={{
                  color: 'rgba(255, 255, 255, 0.7)',
                  mb: 1,
                  cursor: 'pointer',
                  '&:hover': {
                    color: 'white'
                  }
                }}
              >
                {item.name}
              </Typography>
            ))}
          </Grid>
          <Grid item xs={6} md={3}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
              Company
            </Typography>
            {[
              { name: 'Product', path: '/product' },
              { name: 'Manifesto', path: '/manifesto' },
              { name: 'Landing', path: '/' }
            ].map((item) => (
              <Typography
                key={item.name}
                variant="body2"
                onClick={() => navigate(item.path)}
                sx={{
                  color: 'rgba(255, 255, 255, 0.7)',
                  mb: 1,
                  cursor: 'pointer',
                  '&:hover': {
                    color: 'white'
                  }
                }}
              >
                {item.name}
              </Typography>
            ))}
          </Grid>
        </Grid>
        <Divider sx={{ my: 4, borderColor: 'rgba(255, 255, 255, 0.1)' }} />
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
            © 2025 Equitle. All rights reserved.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}
