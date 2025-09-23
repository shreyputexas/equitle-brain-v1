import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  IconButton,
  Drawer,
  List,
  ListItemButton,
  ListItemText,
  Divider
} from '@mui/material';
import {
  Menu as MenuIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

export default function MarketingHeader() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const openMobile = () => setMobileOpen(true);
  const closeMobile = () => setMobileOpen(false);

  const go = (path: string) => {
    closeMobile();
    navigate(path);
  };

  const bookDemo = () => {
    closeMobile();
    window.open('https://calendly.com/contact-equitle/pe-firm-partnership-meeting-equitle', '_blank');
  };

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
        {/* Logo */}
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

        {/* Desktop nav */}
        <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' }, gap: 3, ml: 4 }}>
          <Button 
            onClick={() => navigate('/product')}
            sx={{ 
              color: 'text.primary',
              fontWeight: 500,
              fontSize: '0.9rem',
              textTransform: 'none',
              '&:hover': { color: 'text.primary', bgcolor: 'rgba(0, 0, 0, 0.04)' }
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
              '&:hover': { color: 'text.primary', bgcolor: 'rgba(0, 0, 0, 0.04)' }
            }}
          >
            Manifesto
          </Button>
        </Box>

        {/* Right actions + mobile hamburger */}
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
            onClick={bookDemo}
            sx={{
              background: 'linear-gradient(135deg, #9CA3AF 0%, #374151 100%)',
              boxShadow: '0 4px 14px rgba(0, 0, 0, 0.2)',
              fontWeight: 600,
              px: scrolled ? 2.5 : 3,
              py: scrolled ? 0.75 : 1,
              fontSize: scrolled ? '0.875rem' : '0.9rem',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              display: { xs: 'none', md: 'inline-flex' }
            }}
          >
            Book Demo
          </Button>

          {/* Mobile hamburger */}
          <IconButton
            aria-label="Open menu"
            onClick={openMobile}
            sx={{ display: { xs: 'flex', md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Mobile Drawer Menu */}
      <Drawer
        anchor="right"
        open={mobileOpen}
        onClose={closeMobile}
        keepMounted
        PaperProps={{
          sx: {
            width: '80vw',
            maxWidth: 360,
            pt: 1.5
          }
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', px: 2, pb: 1 }}>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Menu</Typography>
          </Box>
          <IconButton aria-label="Close menu" onClick={closeMobile}>
            <CloseIcon />
          </IconButton>
        </Box>

        <Divider />

        <List sx={{ py: 0 }}>
          <ListItemButton onClick={() => go('/product')}>
            <ListItemText primary="Product" />
          </ListItemButton>
          <ListItemButton onClick={() => go('/manifesto')}>
            <ListItemText primary="Manifesto" />
          </ListItemButton>
        </List>

        <Divider sx={{ my: 1 }} />

        <Box sx={{ px: 2, py: 2, display: 'grid', gap: 1.5 }}>
          <Button
            variant="outlined"
            fullWidth
            onClick={() => go('/login')}
            sx={{ textTransform: 'none' }}
          >
            Sign In
          </Button>
          <Button
            variant="contained"
            fullWidth
            onClick={bookDemo}
            sx={{
              textTransform: 'none',
              background: 'linear-gradient(135deg, #9CA3AF 0%, #374151 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #6B7280 0%, #1F2937 100%)'
              }
            }}
          >
            Book Demo
          </Button>
        </Box>
      </Drawer>
    </Box>
  );
}
