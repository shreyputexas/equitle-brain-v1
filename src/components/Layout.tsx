import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Badge,
  Tooltip,
  Divider,
  InputBase,
  Paper,
  Button,
  ListItemIcon,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Collapse
} from '@mui/material';
import {
  AttachMoney as DealsIcon,
  TrendingUp as FundraisingIcon,
  Settings as SettingsIcon,
  Notifications as NotificationsIcon,
  Search as SearchIcon,
  Logout as LogoutIcon,
  Person as PersonIcon,
  People as RelationshipsIcon,
  AccountBalance as LimitedPartnersIcon,
  BusinessCenter as FundsIcon,
  KeyboardArrowDown as ArrowDownIcon,
  Menu as MenuIcon,
  ExpandLess,
  ExpandMore
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useBrain } from '../contexts/BrainContext';

const navigationItems = [
  {
    text: 'Deals',
    icon: <DealsIcon />,
    subItems: [
      { text: 'Relationships', path: '/deals/relationships' }
    ]
  },
  {
    text: 'Fundraising',
    icon: <FundraisingIcon />,
    subItems: [
      { text: 'Limited Partners', path: '/fundraising/limited-partners' },
      { text: 'Funds', path: '/fundraising/funds' }
    ]
  },
  {
    text: 'Settings',
    icon: <SettingsIcon />,
    path: '/settings'
  }
];

export default function Layout() {
  const [profileAnchorEl, setProfileAnchorEl] = useState<null | HTMLElement>(null);
  const [navMenuAnchors, setNavMenuAnchors] = useState<{ [key: string]: HTMLElement | null }>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [mobileExpandedMenus, setMobileExpandedMenus] = useState<{ [key: string]: boolean }>({});
  
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { askBrain } = useBrain();

  const handleNavMenuOpen = (event: React.MouseEvent<HTMLElement>, menuKey: string) => {
    setNavMenuAnchors(prev => ({
      ...prev,
      [menuKey]: event.currentTarget
    }));
  };

  const handleNavMenuClose = (menuKey: string) => {
    setNavMenuAnchors(prev => ({
      ...prev,
      [menuKey]: null
    }));
  };

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setProfileAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setProfileAnchorEl(null);
  };

  const handleLogout = () => {
    handleProfileMenuClose();
    logout();
  };

  const handleSearch = async (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      navigate('/brain');
      await askBrain(searchQuery);
      setSearchQuery('');
    }
  };

  const handleNavigation = (path: string, menuKey?: string) => {
    navigate(path);
    if (menuKey) {
      handleNavMenuClose(menuKey);
    }
    setMobileDrawerOpen(false);
  };

  const handleMobileDrawerToggle = () => {
    setMobileDrawerOpen(!mobileDrawerOpen);
  };

  const handleMobileMenuToggle = (menuKey: string) => {
    setMobileExpandedMenus(prev => ({
      ...prev,
      [menuKey]: !prev[menuKey]
    }));
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar
        position="fixed"
        sx={{
          bgcolor: 'rgba(0, 0, 0, 0.95)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 4px 32px rgba(0, 0, 0, 0.1)',
          zIndex: 1300
        }}
      >
        <Toolbar>
          {/* Mobile Menu Button */}
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleMobileDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>

          {/* Logo/Brand */}
          <Typography variant="h6" sx={{ fontWeight: 700, color: 'white', mr: 4 }}>
            Equitle
          </Typography>

          {/* Desktop Navigation Menu */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', flexGrow: 1 }}>
            {navigationItems.map((item) => (
              <Box key={item.text} sx={{ mr: 2 }}>
                {item.subItems ? (
                  <>
                    <Button
                      startIcon={item.icon}
                      endIcon={<ArrowDownIcon />}
                      onClick={(e) => handleNavMenuOpen(e, item.text)}
                      sx={{
                        color: 'white',
                        textTransform: 'none',
                        fontWeight: 500,
                        borderRadius: '8px',
                        px: 2,
                        py: 1,
                        '&:hover': {
                          bgcolor: 'rgba(255, 255, 255, 0.1)',
                          transform: 'translateY(-1px)'
                        },
                        transition: 'all 0.2s ease-in-out'
                      }}
                    >
                      {item.text}
                    </Button>
                    <Menu
                      anchorEl={navMenuAnchors[item.text]}
                      open={Boolean(navMenuAnchors[item.text])}
                      onClose={() => handleNavMenuClose(item.text)}
                      transformOrigin={{ horizontal: 'left', vertical: 'top' }}
                      anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
                      PaperProps={{
                        sx: {
                          mt: 1,
                          minWidth: 200,
                          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          bgcolor: 'rgba(0, 0, 0, 0.9)',
                          backdropFilter: 'blur(20px)',
                          borderRadius: '12px'
                        }
                      }}
                    >
                      {item.subItems.map((subItem) => (
                        <MenuItem
                          key={subItem.text}
                          onClick={() => handleNavigation(subItem.path, item.text)}
                          selected={location.pathname === subItem.path}
                          sx={{
                            color: 'white',
                            '&:hover': {
                              bgcolor: 'rgba(255, 255, 255, 0.1)'
                            },
                            '&.Mui-selected': {
                              bgcolor: 'rgba(255, 255, 255, 0.2)'
                            }
                          }}
                        >
                          {subItem.text}
                        </MenuItem>
                      ))}
                    </Menu>
                  </>
                ) : (
                  <Button
                    startIcon={item.icon}
                    onClick={() => handleNavigation(item.path!)}
                    sx={{
                      color: location.pathname === item.path ? 'primary.main' : 'text.primary',
                      textTransform: 'none',
                      fontWeight: location.pathname === item.path ? 600 : 500,
                      '&:hover': {
                        bgcolor: 'action.hover'
                      }
                    }}
                  >
                    {item.text}
                  </Button>
                )}
              </Box>
            ))}
          </Box>

          {/* Mobile spacer */}
          <Box sx={{ flexGrow: 1, display: { xs: 'block', md: 'none' } }} />

          {/* Search Bar */}
          <Paper
            sx={{
              p: '2px 4px',
              display: { xs: 'none', md: 'flex' },
              alignItems: 'center',
              width: 300,
              bgcolor: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '8px',
              mr: 2,
              '&:hover': {
                bgcolor: 'rgba(255, 255, 255, 0.15)',
                border: '1px solid rgba(255, 255, 255, 0.3)'
              },
              transition: 'all 0.2s ease-in-out'
            }}
          >
            <IconButton sx={{ p: '10px', color: 'white' }}>
              <SearchIcon />
            </IconButton>
            <InputBase
              sx={{ 
                ml: 1, 
                flex: 1,
                color: 'white',
                '&::placeholder': {
                  color: 'rgba(255, 255, 255, 0.7)'
                }
              }}
              placeholder="Ask Brain anything..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleSearch}
            />
          </Paper>

          {/* Right side - Notifications and Profile */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Tooltip title="Notifications">
              <IconButton 
                color="inherit" 
                sx={{ 
                  mr: 1,
                  color: 'white',
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 0.1)',
                    transform: 'scale(1.05)'
                  },
                  transition: 'all 0.2s ease-in-out'
                }}
              >
                <Badge badgeContent={4} color="error">
                  <NotificationsIcon />
                </Badge>
              </IconButton>
            </Tooltip>

            <Tooltip title="Profile">
              <IconButton 
                onClick={handleProfileMenuOpen} 
                sx={{ 
                  p: 0,
                  '&:hover': {
                    transform: 'scale(1.05)'
                  },
                  transition: 'all 0.2s ease-in-out'
                }}
              >
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  {user?.name?.charAt(0).toUpperCase()}
                </Avatar>
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Profile Menu */}
      <Menu
        anchorEl={profileAnchorEl}
        open={Boolean(profileAnchorEl)}
        onClose={handleProfileMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{
          sx: {
            mt: 1,
            minWidth: 200,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            bgcolor: 'rgba(0, 0, 0, 0.9)',
            backdropFilter: 'blur(20px)',
            borderRadius: '12px'
          }
        }}
      >
        <MenuItem 
          onClick={() => { handleProfileMenuClose(); navigate('/profile'); }}
          sx={{
            color: 'white',
            '&:hover': {
              bgcolor: 'rgba(255, 255, 255, 0.1)'
            }
          }}
        >
          <ListItemIcon sx={{ color: 'white' }}>
            <PersonIcon fontSize="small" />
          </ListItemIcon>
          Profile
        </MenuItem>
        <Divider sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)' }} />
        <MenuItem 
          onClick={handleLogout}
          sx={{
            color: 'white',
            '&:hover': {
              bgcolor: 'rgba(255, 255, 255, 0.1)'
            }
          }}
        >
          <ListItemIcon sx={{ color: 'white' }}>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          Logout
        </MenuItem>
      </Menu>

      {/* Mobile Navigation Drawer */}
      <Drawer
        variant="temporary"
        anchor="left"
        open={mobileDrawerOpen}
        onClose={handleMobileDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile
        }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { 
            boxSizing: 'border-box', 
            width: 280,
            bgcolor: 'background.paper',
            borderRight: '1px solid',
            borderColor: 'divider'
          }
        }}
      >
        <Box sx={{ overflow: 'auto' }}>
          <Toolbar>
            <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>
              Equitle
            </Typography>
          </Toolbar>
          <Divider />
          <List>
            {navigationItems.map((item) => (
              <Box key={item.text}>
                {item.subItems ? (
                  <>
                    <ListItem disablePadding>
                      <ListItemButton onClick={() => handleMobileMenuToggle(item.text)}>
                        <ListItemIcon>
                          {item.icon}
                        </ListItemIcon>
                        <ListItemText primary={item.text} />
                        {mobileExpandedMenus[item.text] ? <ExpandLess /> : <ExpandMore />}
                      </ListItemButton>
                    </ListItem>
                    <Collapse in={mobileExpandedMenus[item.text]} timeout="auto" unmountOnExit>
                      <List component="div" disablePadding>
                        {item.subItems.map((subItem) => (
                          <ListItemButton
                            key={subItem.text}
                            sx={{ pl: 4 }}
                            onClick={() => handleNavigation(subItem.path)}
                            selected={location.pathname === subItem.path}
                          >
                            <ListItemText primary={subItem.text} />
                          </ListItemButton>
                        ))}
                      </List>
                    </Collapse>
                  </>
                ) : (
                  <ListItem disablePadding>
                    <ListItemButton
                      onClick={() => handleNavigation(item.path!)}
                      selected={location.pathname === item.path}
                    >
                      <ListItemIcon>
                        {item.icon}
                      </ListItemIcon>
                      <ListItemText primary={item.text} />
                    </ListItemButton>
                  </ListItem>
                )}
              </Box>
            ))}
          </List>
        </Box>
      </Drawer>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          mt: 8, // Account for AppBar height
          bgcolor: 'background.default'
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}