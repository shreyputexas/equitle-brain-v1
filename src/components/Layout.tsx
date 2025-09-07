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
  ExpandMore,
  Mic as MicIcon,
  Close as CloseIcon
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
  const [brainChatOpen, setBrainChatOpen] = useState(false);
  
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

  const handleBrainChatToggle = () => {
    setBrainChatOpen(!brainChatOpen);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar
        position="fixed"
        sx={{
          bgcolor: 'background.paper',
          boxShadow: 'none',
          borderBottom: '1px solid',
          borderColor: 'divider'
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
          <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main', mr: 4 }}>
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
                        color: 'text.primary',
                        textTransform: 'none',
                        fontWeight: 500,
                        '&:hover': {
                          bgcolor: 'action.hover'
                        }
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
                    >
                      {item.subItems.map((subItem) => (
                        <MenuItem
                          key={subItem.text}
                          onClick={() => handleNavigation(subItem.path, item.text)}
                          selected={location.pathname === subItem.path}
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
              bgcolor: 'background.default',
              border: '1px solid',
              borderColor: 'divider',
              mr: 2
            }}
          >
            <IconButton sx={{ p: '10px' }}>
              <SearchIcon />
            </IconButton>
            <InputBase
              sx={{ ml: 1, flex: 1 }}
              placeholder="Ask Brain anything..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleSearch}
            />
          </Paper>

          {/* Right side - Notifications and Profile */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Tooltip title="Notifications">
              <IconButton color="inherit" sx={{ mr: 1 }}>
                <Badge badgeContent={4} color="error">
                  <NotificationsIcon />
                </Badge>
              </IconButton>
            </Tooltip>

            <Tooltip title="Profile">
              <IconButton onClick={handleProfileMenuOpen} sx={{ p: 0 }}>
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
      >
        <MenuItem onClick={() => { handleProfileMenuClose(); navigate('/profile'); }}>
          <ListItemIcon>
            <PersonIcon fontSize="small" />
          </ListItemIcon>
          Profile
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
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

      {/* Floating Brain Chat Button */}
      <Box
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 1000
        }}
      >
        {!brainChatOpen ? (
          <Tooltip title="Ask Brain anything" placement="left">
            <IconButton
              onClick={handleBrainChatToggle}
              sx={{
                width: 64,
                height: 64,
                bgcolor: 'primary.main',
                color: 'white',
                boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                '&:hover': {
                  bgcolor: 'primary.dark',
                  transform: 'scale(1.1)',
                  boxShadow: '0 12px 40px rgba(0,0,0,0.4)'
                },
                transition: 'all 0.3s ease'
              }}
            >
              <MicIcon sx={{ fontSize: 28 }} />
            </IconButton>
          </Tooltip>
        ) : (
          <Paper
            sx={{
              width: 400,
              height: 500,
              borderRadius: 3,
              boxShadow: '0 16px 64px rgba(0,0,0,0.3)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}
          >
            {/* Chat Header */}
            <Box
              sx={{
                p: 2,
                bgcolor: 'primary.main',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', mr: 2, width: 32, height: 32 }}>
                  <MicIcon fontSize="small" />
                </Avatar>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Brain Assistant
                </Typography>
              </Box>
              <IconButton
                onClick={handleBrainChatToggle}
                sx={{ color: 'white' }}
                size="small"
              >
                <CloseIcon />
              </IconButton>
            </Box>

            {/* Chat Messages */}
            <Box
              sx={{
                flex: 1,
                p: 2,
                overflow: 'auto',
                bgcolor: 'background.default'
              }}
            >
              <Box
                sx={{
                  p: 2,
                  mb: 2,
                  bgcolor: 'primary.light',
                  borderRadius: 2,
                  color: 'primary.contrastText'
                }}
              >
                <Typography variant="body2">
                  👋 Hi! I'm your Brain assistant. Ask me anything about your deals, relationships, or portfolio companies.
                </Typography>
              </Box>
              
              {/* Example suggestions */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                  Try asking:
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {[
                    "Show me deals in due diligence",
                    "What's the status of TechCorp?",
                    "Who are my key contacts at HealthTech?",
                    "Generate a portfolio report"
                  ].map((suggestion, index) => (
                    <Button
                      key={index}
                      variant="outlined"
                      size="small"
                      onClick={() => {
                        setSearchQuery(suggestion);
                        handleSearch({ key: 'Enter' } as React.KeyboardEvent);
                        setBrainChatOpen(false);
                      }}
                      sx={{
                        textAlign: 'left',
                        justifyContent: 'flex-start',
                        textTransform: 'none',
                        fontSize: '0.75rem'
                      }}
                    >
                      {suggestion}
                    </Button>
                  ))}
                </Box>
              </Box>
            </Box>

            {/* Chat Input */}
            <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
              <Paper
                sx={{
                  p: '2px 4px',
                  display: 'flex',
                  alignItems: 'center',
                  bgcolor: 'background.paper'
                }}
              >
                <IconButton sx={{ p: '10px' }}>
                  <SearchIcon />
                </IconButton>
                <InputBase
                  sx={{ ml: 1, flex: 1 }}
                  placeholder="Ask Brain anything..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && searchQuery.trim()) {
                      handleSearch(e);
                      setBrainChatOpen(false);
                    }
                  }}
                />
                <IconButton
                  onClick={() => {
                    if (searchQuery.trim()) {
                      handleSearch({ key: 'Enter' } as React.KeyboardEvent);
                      setBrainChatOpen(false);
                    }
                  }}
                  sx={{ p: '10px' }}
                >
                  <MicIcon />
                </IconButton>
              </Paper>
            </Box>
          </Paper>
        )}
      </Box>
    </Box>
  );
}