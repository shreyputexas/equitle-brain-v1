import React from 'react';
import {
  Box,
  Container,
  Grid,
  Typography,
  Divider,
  IconButton
} from '@mui/material';
import { LinkedIn as LinkedInIcon, Email as EmailIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

export default function Footer() {
  const navigate = useNavigate();

  const handleNavigation = (path: string) => {
    navigate(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <Box sx={{ py: 8, background: '#0A0A0A', color: 'white' }}>
      <Container maxWidth={false} sx={{ px: { xs: 2, md: 4 } }}>
        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Box sx={{ mb: 2 }}>
              <img 
                src="/assets/images/extended_logo_black_white.png" 
                alt="Equitle Logo" 
                style={{ 
                  height: '8rem',
                  filter: 'brightness(0) invert(1)',
                  display: 'block'
                }} 
              />
            </Box>
            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
              <IconButton
                onClick={() => window.open('https://www.linkedin.com/company/equitle/?viewAsMember=true', '_blank')}
                sx={{
                  color: '#10B981',
                  '&:hover': {
                    color: '#059669',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)'
                  }
                }}
              >
                <LinkedInIcon />
              </IconButton>
              <IconButton
                onClick={() => window.open('mailto:contact@equitle.com', '_blank')}
                sx={{
                  color: '#10B981',
                  '&:hover': {
                    color: '#059669',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)'
                  }
                }}
              >
                <EmailIcon />
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
                onClick={() => handleNavigation(item.path)}
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
                onClick={() => handleNavigation(item.path)}
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
            © 2025 Equitle. All rights reserved. | contact@equitle.com
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}
