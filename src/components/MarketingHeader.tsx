import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  IconButton,
  Drawer,
  List,
  ListItemButton,
  ListItemText,
  Divider,
  Menu,
  MenuItem
} from '@mui/material';
import {
  Menu as MenuIcon,
  Close as CloseIcon,
  ArrowDropDown as ArrowDropDownIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

export default function MarketingHeader() {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loginAnchorEl, setLoginAnchorEl] = useState<null | HTMLElement>(null);

  const openMobile = () => setMobileOpen(true);
  const closeMobile = () => setMobileOpen(false);
  
  const handleLoginMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setLoginAnchorEl(event.currentTarget);
  };
  
  const handleLoginMenuClose = () => {
    setLoginAnchorEl(null);
  };

  const go = (path: string) => {
    closeMobile();
    navigate(path);
    window.scrollTo(0, 0);
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
        background: '#000000',
        padding: { xs: '1rem 0', md: '1.25rem 0' }
      }}
    >
      <Box
        sx={{
          width: '100%',
          paddingLeft: { xs: '1.5rem', md: '2rem' },
          paddingRight: { xs: '1.5rem', md: '2rem' },
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        {/* Logo */}
        <Box
          component="img"
          src="/assets/images/extended_logo_black_white.png"
          alt="Equitle"
          sx={{
            height: { xs: '3rem', md: '3.5rem' },
            filter: 'brightness(0) invert(1)',
            opacity: 0.95,
            objectFit: 'contain',
            mr: { xs: '2rem', md: '4rem' },
            cursor: 'pointer'
          }}
          onClick={() => {
            navigate('/');
            window.scrollTo(0, 0);
          }}
        />

        {/* Desktop nav */}
        <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' }, gap: 3, ml: 4, alignItems: 'center' }}>
          <Button 
            onClick={() => {
              navigate('/product');
              window.scrollTo(0, 0);
            }}
            disableRipple
            sx={{ 
              color: '#FFFFFF',
              fontWeight: 500,
              fontSize: '1rem',
              textTransform: 'none',
              py: 1.5,
              position: 'relative',
              alignSelf: 'center',
              '&:hover': { 
                color: '#FFFFFF',
                '&::after': {
                  width: '60%'
                }
              },
              '&::after': {
                content: '""',
                position: 'absolute',
                bottom: '6px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '0',
                height: '2px',
                background: '#10B981',
                transition: 'width 0.3s ease-in-out'
              }
            }}
          >
            Product
          </Button>
          <Button 
            onClick={() => {
              navigate('/manifesto');
              window.scrollTo(0, 0);
            }}
            disableRipple
            sx={{ 
              color: '#FFFFFF',
              fontWeight: 500,
              fontSize: '1rem',
              textTransform: 'none',
              py: 1.5,
              position: 'relative',
              alignSelf: 'center',
              '&:hover': { 
                color: '#FFFFFF',
                '&::after': {
                  width: '60%'
                }
              },
              '&::after': {
                content: '""',
                position: 'absolute',
                bottom: '6px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '0',
                height: '2px',
                background: '#10B981',
                transition: 'width 0.3s ease-in-out'
              }
            }}
          >
            Manifesto
          </Button>
          <Button 
            onClick={() => {
              navigate('/network');
              window.scrollTo(0, 0);
            }}
            disableRipple
            sx={{ 
              color: '#FFFFFF',
              fontWeight: 500,
              fontSize: '1rem',
              textTransform: 'none',
              py: 1.5,
              position: 'relative',
              alignSelf: 'center',
              '&:hover': { 
                color: '#FFFFFF',
                '&::after': {
                  width: '60%'
                }
              },
              '&::after': {
                content: '""',
                position: 'absolute',
                bottom: '6px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '0',
                height: '2px',
                background: '#10B981',
                transition: 'width 0.3s ease-in-out'
              }
            }}
          >
            Network
          </Button>
        </Box>

        {/* Right actions + mobile hamburger */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button 
            variant="text"
            onClick={handleLoginMenuOpen}
            endIcon={<ArrowDropDownIcon />}
            disableRipple
            sx={{ 
              color: '#FFFFFF',
              fontWeight: 500,
              fontSize: '1rem',
              py: 1.5,
              display: { xs: 'none', md: 'inline-flex' },
              position: 'relative',
              '&:hover': {
                backgroundColor: 'transparent',
                transform: 'none',
                boxShadow: 'none',
                '&::after': {
                  width: '100%'
                }
              },
              '&::after': {
                content: '""',
                position: 'absolute',
                bottom: '6px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '0',
                height: '2px',
                background: '#10B981',
                transition: 'width 0.3s ease-in-out'
              }
            }}
          >
            Login
          </Button>
          <Button 
            variant="contained"
            onClick={bookDemo}
            sx={{
              background: `
                linear-gradient(180deg, rgba(16, 185, 129, 0.6) 0%, rgba(5, 150, 105, 0.6) 30%, rgba(4, 120, 87, 0.6) 70%, rgba(6, 78, 59, 0.6) 100%),
                radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%),
                radial-gradient(circle at 80% 20%, rgba(255,255,255,0.05) 0%, transparent 50%),
                radial-gradient(circle at 40% 80%, rgba(0,0,0,0.1) 0%, transparent 50%)
              `,
              backdropFilter: 'blur(10px)',
              color: '#FFFFFF',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              fontWeight: 600,
              px: 3,
              py: 1.5,
              fontSize: '1rem',
              display: { xs: 'none', md: 'inline-flex' },
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: `
                  repeating-linear-gradient(
                    0deg,
                    transparent,
                    transparent 2px,
                    rgba(255,255,255,0.03) 2px,
                    rgba(255,255,255,0.03) 4px
                  ),
                  repeating-linear-gradient(
                    90deg,
                    transparent,
                    transparent 2px,
                    rgba(0,0,0,0.02) 2px,
                    rgba(0,0,0,0.02) 4px
                  )
                `,
                pointerEvents: 'none',
                zIndex: 1
              },
              '&::after': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: '-100%',
                width: '100%',
                height: '100%',
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
                animation: 'slideShine 1.5s infinite',
                zIndex: 2
              }
            }}
          >
            Book Demo
          </Button>

          {/* Login Dropdown Menu */}
          <Menu
            anchorEl={loginAnchorEl}
            open={Boolean(loginAnchorEl)}
            onClose={handleLoginMenuClose}
            PaperProps={{
              sx: {
                backgroundColor: 'rgba(0, 0, 0, 0.9)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: 0,
                backdropFilter: 'blur(10px)',
                mt: 1,
                minWidth: 'fit-content',
                width: 'auto'
              }
            }}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <MenuItem 
              onClick={() => {
                handleLoginMenuClose();
                navigate('/login');
                window.scrollTo(0, 0);
              }}
              sx={{
                color: '#FFFFFF',
                fontFamily: '"Darker Grotesque", sans-serif',
                fontWeight: 500,
                minWidth: '120px',
                px: 2,
                py: 1,
                '&:hover': {
                  backgroundColor: 'rgba(16, 185, 129, 0.2)'
                }
              }}
            >
              Sign In
            </MenuItem>
            <MenuItem 
              onClick={() => {
                handleLoginMenuClose();
                navigate('/signup');
                window.scrollTo(0, 0);
              }}
              sx={{
                color: '#FFFFFF',
                fontFamily: '"Darker Grotesque", sans-serif',
                fontWeight: 500,
                minWidth: '120px',
                px: 2,
                py: 1,
                '&:hover': {
                  backgroundColor: 'rgba(16, 185, 129, 0.2)'
                }
              }}
            >
              Sign Up
            </MenuItem>
          </Menu>

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
            pt: 1.5,
            background: '#000000',
            color: '#FFFFFF'
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
          <ListItemButton onClick={() => go('/network')}>
            <ListItemText primary="Network" />
          </ListItemButton>
        </List>

        <Divider sx={{ my: 1 }} />

        <Box sx={{ px: 2, py: 2, display: 'grid', gap: 1.5 }}>
          <Button
            variant="outlined"
            fullWidth
            onClick={handleLoginMenuOpen}
            endIcon={<ArrowDropDownIcon />}
            disableRipple
            sx={{ 
              textTransform: 'none',
              color: '#FFFFFF',
              borderColor: 'rgba(255, 255, 255, 0.3)',
              position: 'relative',
              '&:hover': {
                borderColor: '#10B981',
                backgroundColor: 'transparent',
                transform: 'none',
                boxShadow: 'none',
                '&::after': {
                  width: '100%'
                }
              },
              '&::after': {
                content: '""',
                position: 'absolute',
                bottom: '6px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '0',
                height: '2px',
                background: '#10B981',
                transition: 'width 0.3s ease-in-out'
              }
            }}
          >
            Login
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
