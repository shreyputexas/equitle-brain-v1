import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  IconButton
} from '@mui/material';
import {
  Menu as MenuIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

export default function MarketingHeader() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1300,
        padding: { xs: '1rem 12px', md: '12px 16px' },
        pointerEvents: 'none'
      }}
    >
      <Container maxWidth="lg">
        <Box
          sx={{
            pointerEvents: 'auto',
            margin: '0 auto',
            maxWidth: '1200px',
            padding: { xs: '1rem 1.25rem', md: '1.25rem 1.5rem' },
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: scrolled ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'saturate(180%) blur(20px)',
            border: '1px solid rgba(94, 92, 230, 0.08)',
            borderRadius: { xs: '12px', md: '14px' },
            boxShadow: scrolled 
              ? '0 8px 32px rgba(0, 0, 0, 0.12)' 
              : '0 4px 24px rgba(0, 0, 0, 0.08)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        >
          <Box
            component="img"
            src="/assets/images/extended_logo_black_white.png"
            alt="Equitle"
            sx={{
              height: { xs: '2.25rem', md: '2.75rem' },
              filter: 'brightness(0)',
              opacity: 0.95,
              objectFit: 'contain',
              mr: { xs: '2rem', md: '4rem' },
              cursor: 'pointer'
            }}
            onClick={() => navigate('/')}
          />
          
          <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' }, gap: 3, ml: 4 }}>
            <Button 
              onClick={() => navigate('/product')}
              sx={{ 
                color: 'text.primary',
                fontWeight: 500,
                fontSize: '0.9rem',
                textTransform: 'none',
                '&:hover': {
                  color: 'secondary.main',
                  bgcolor: 'rgba(94, 92, 230, 0.04)'
                }
              }}
            >
              Product
            </Button>
            <Button 
              onClick={() => navigate('/solutions')}
              sx={{ 
                color: 'text.primary',
                fontWeight: 500,
                fontSize: '0.9rem',
                textTransform: 'none',
                '&:hover': {
                  color: 'secondary.main',
                  bgcolor: 'rgba(94, 92, 230, 0.04)'
                }
              }}
            >
              Solutions
            </Button>
            <Button 
              onClick={() => navigate('/pricing')}
              sx={{ 
                color: 'text.primary',
                fontWeight: 500,
                fontSize: '0.9rem',
                textTransform: 'none',
                '&:hover': {
                  color: 'secondary.main',
                  bgcolor: 'rgba(94, 92, 230, 0.04)'
                }
              }}
            >
              Pricing
            </Button>
            <Button 
              onClick={() => navigate('/resources')}
              sx={{ 
                color: 'text.primary',
                fontWeight: 500,
                fontSize: '0.9rem',
                textTransform: 'none',
                '&:hover': {
                  color: 'secondary.main',
                  bgcolor: 'rgba(94, 92, 230, 0.04)'
                }
              }}
            >
              Resources
            </Button>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button 
              variant="text"
              onClick={() => navigate('/login')}
              sx={{ 
                color: 'text.primary',
                fontWeight: 500,
                display: { xs: 'none', md: 'inline-flex' }
              }}
            >
              Sign In
            </Button>
            <Button 
              variant="contained"
              onClick={() => navigate('/login')}
              sx={{
                background: 'linear-gradient(135deg, #5E5CE6 0%, #7C7AED 100%)',
                boxShadow: '0 4px 14px rgba(94, 92, 230, 0.3)',
                fontWeight: 600,
                px: 3
              }}
            >
              Book Demo
            </Button>
            <IconButton sx={{ display: { xs: 'flex', md: 'none' } }}>
              <MenuIcon />
            </IconButton>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
