import React, { useState, useEffect } from 'react';
import {
  Box,
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
        padding: 0,
        pointerEvents: 'none',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
      }}
    >
      <Box
        sx={{
          pointerEvents: 'auto',
          width: '100%',
          padding: scrolled 
            ? { xs: '0.75rem 1.25rem', md: '1rem 2rem' }
            : { xs: '1rem 2rem', md: '1.5rem 3rem' },
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: scrolled ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'saturate(180%) blur(20px)',
          border: scrolled ? '1px solid rgba(0, 0, 0, 0.08)' : 'none',
          borderRadius: scrolled ? { xs: '12px', md: '14px' } : 0,
          boxShadow: scrolled 
            ? '0 8px 32px rgba(0, 0, 0, 0.12)' 
            : '0 4px 24px rgba(0, 0, 0, 0.08)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          maxWidth: scrolled ? '1200px' : '100%',
          margin: scrolled ? '0 auto' : '0'
        }}
      >
          <Box
            component="img"
            src="/assets/images/extended_logo_black_white.png"
            alt="Equitle"
            sx={{
              height: scrolled 
                ? { xs: '2rem', md: '2.25rem' }
                : { xs: '2.5rem', md: '3rem' },
              filter: 'brightness(0)',
              opacity: 0.95,
              objectFit: 'contain',
              mr: { xs: '2rem', md: '4rem' },
              cursor: 'pointer',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
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
                  color: 'text.primary',
                  bgcolor: 'rgba(0, 0, 0, 0.04)'
                }
              }}
            >
              Product
            </Button>
            <Button 
              onClick={() => navigate('/manifesto')}
              sx={{ 
                color: 'text.primary',
                fontWeight: 500,
                fontSize: '0.9rem',
                textTransform: 'none',
                '&:hover': {
                  color: 'text.primary',
                  bgcolor: 'rgba(0, 0, 0, 0.04)'
                }
              }}
            >
              Manifesto
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
              onClick={() => window.open('https://calendly.com/contact-equitle/pe-firm-partnership-meeting-equitle', '_blank')}
              sx={{
                background: 'linear-gradient(135deg, #9CA3AF 0%, #374151 100%)',
                boxShadow: '0 4px 14px rgba(0, 0, 0, 0.2)',
                fontWeight: 600,
                px: scrolled ? 2.5 : 3,
                py: scrolled ? 0.75 : 1,
                fontSize: scrolled ? '0.875rem' : '0.9rem',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            >
              Book Demo
            </Button>
            <IconButton sx={{ display: { xs: 'flex', md: 'none' } }}>
              <MenuIcon />
            </IconButton>
          </Box>
        </Box>
    </Box>
  );
}
