import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
  Collapse,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useTheme,
  Chip,
  Stack,
  alpha
} from '@mui/material';
import {
  AttachMoney as DealsIcon,
  TrendingUp as FundraisingIcon,
  Settings as SettingsIcon,
  Notifications as NotificationsIcon,
  Search as SearchIcon,
  Logout as LogoutIcon,
  People as RelationshipsIcon,
  Person as PersonIcon,
  AccountBalance as LimitedPartnersIcon,
  BusinessCenter as FundsIcon,
  KeyboardArrowDown as ArrowDownIcon,
  Menu as MenuIcon,
  ExpandLess,
  ExpandMore,
  Mic as MicIcon,
  Close as CloseIcon,
  Stop as StopIcon,
  Send as SendIcon,
  VolumeUp as VolumeUpIcon,
  RadioButtonUnchecked as RadioButtonUncheckedIcon,
  Psychology as BrainIcon,
  QuestionAnswer as AskIcon,
  FollowTheSigns as FollowUpIcon,
  Analytics as AnalyticsIcon,
  Assessment as ReportIcon,
  Phone as PhoneIcon,
  DataUsage as DataEnrichmentIcon,
  Contacts as ContactsIcon,
  Assignment as ThesisIcon,
  Dashboard as DashboardIcon,
  Business as BusinessIcon,
  Timeline as TimelineIcon,
  Help as HelpIcon,
  KeyboardArrowRight as ArrowRightIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  MoreVert as MoreVertIcon,
  Add as AddIcon,
  FilterList as FilterIcon,
  ViewList as ViewListIcon,
  GridView as GridViewIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  sources?: Array<{
    type: string;
    title: string;
    description: string;
  }>;
}

const navigationItems = [
  {
    text: 'My Thesis',
    icon: <ThesisIcon />,
    path: '/my-thesis',
    badge: null
  },
  {
    text: 'Data',
    icon: <AnalyticsIcon />,
    path: '/data-enrichment',
    badge: null
  },
  {
    text: 'Contacts',
    icon: <ContactsIcon />,
    path: '/contacts',
    badge: '12'
  },
  {
    text: 'Outreach',
    icon: <DealsIcon />,
    badge: '3',
    subItems: [
      { text: 'Deals', path: '/outreach/deals', icon: <DealsIcon /> },
      { text: 'Investors', path: '/outreach/investors', icon: <FundraisingIcon /> },
      { text: 'Brokers', path: '/outreach/brokers', icon: <BusinessIcon /> }
    ]
  },
  {
    text: 'Voice Calls',
    icon: <PhoneIcon />,
    badge: null,
    subItems: [
      { text: 'Live Calling', path: '/voice-calls', icon: <PhoneIcon /> },
      { text: 'Voicemails', path: '/mass-voicemail', icon: <MicIcon /> }
    ]
  },
  {
    text: 'Investors',
    icon: <FundraisingIcon />,
    badge: null,
    subItems: [
      { text: 'Limited Partners', path: '/fundraising/limited-partners', icon: <LimitedPartnersIcon /> },
      { text: 'Funds', path: '/fundraising/funds', icon: <FundsIcon /> }
    ]
  },
  {
    text: 'Brain',
    icon: <BrainIcon />,
    path: '/brain',
    badge: null
  }
];

const recentItems = [
  { text: 'Acme Corp Deal', type: 'Deal', path: '/outreach/deals/acme-corp' },
  { text: 'John Smith Contact', type: 'Contact', path: '/contacts/john-smith' },
  { text: 'Q4 Fundraising Report', type: 'Report', path: '/reports/q4-fundraising' }
];

const pinnedItems = [
  { text: 'My Pipeline', type: 'View', path: '/outreach/pipeline' },
  { text: 'Hot Leads', type: 'View', path: '/contacts/hot-leads' }
];

export default function ProfessionalNavbar() {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  
  // State management
  const [navMenuAnchors, setNavMenuAnchors] = useState<{ [key: string]: HTMLElement | null }>({});
  const [profileMenuAnchor, setProfileMenuAnchor] = useState<null | HTMLElement>(null);
  const [notificationsMenuAnchor, setNotificationsMenuAnchor] = useState<null | HTMLElement>(null);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Navigation handlers
  const handleNavigation = (path: string, parentItem?: string) => {
    navigate(path);
    if (parentItem) {
      handleNavMenuClose(parentItem);
    }
    setMobileDrawerOpen(false);
  };

  const handleNavMenuOpen = (event: React.MouseEvent<HTMLElement>, itemText: string) => {
    setNavMenuAnchors(prev => ({ ...prev, [itemText]: event.currentTarget }));
  };

  const handleNavMenuClose = (itemText: string) => {
    setNavMenuAnchors(prev => ({ ...prev, [itemText]: null }));
  };

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setProfileMenuAnchor(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setProfileMenuAnchor(null);
  };

  const handleNotificationsMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationsMenuAnchor(event.currentTarget);
  };

  const handleNotificationsMenuClose = () => {
    setNotificationsMenuAnchor(null);
  };

  const toggleExpanded = (itemText: string) => {
    setExpandedItems(prev => 
      prev.includes(itemText) 
        ? prev.filter(item => item !== itemText)
        : [...prev, itemText]
    );
  };

  const handleLogout = () => {
    logout();
    handleProfileMenuClose();
  };

  const isActive = (path: string, parentText?: string) => {
    if (location.pathname === path) return true;
    if (parentText === 'Outreach' && location.pathname.startsWith('/outreach')) return true;
    if (parentText === 'Investors' && location.pathname.startsWith('/fundraising')) return true;
    if (parentText === 'Voice Calls' && location.pathname.startsWith('/voice-calls')) return true;
    return false;
  };

  const NavItem = ({ item, level = 0 }: { item: any, level?: number }) => {
    const hasSubItems = item.subItems && item.subItems.length > 0;
    const isExpanded = expandedItems.includes(item.text);
    const active = isActive(item.path, item.text);

    return (
      <Box>
        <ListItemButton
          onClick={() => {
            if (hasSubItems) {
              toggleExpanded(item.text);
            } else {
              handleNavigation(item.path);
            }
          }}
          sx={{
            borderRadius: 1,
            mb: 0.5,
            mx: 1,
            pl: level === 0 ? 2 : 4,
            pr: 2,
            py: 1,
            minHeight: 44,
            backgroundColor: active ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
            border: active ? `1px solid ${alpha(theme.palette.primary.main, 0.3)}` : '1px solid transparent',
            '&:hover': {
              backgroundColor: alpha(theme.palette.primary.main, 0.05),
              border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`
            },
            transition: 'all 0.2s ease-in-out'
          }}
        >
          <ListItemIcon sx={{ minWidth: 40, color: active ? theme.palette.primary.main : theme.palette.text.primary }}>
            {item.icon}
          </ListItemIcon>
          {!sidebarCollapsed && (
            <>
              <ListItemText 
                primary={item.text}
                primaryTypographyProps={{
                  fontSize: '0.875rem',
                  fontWeight: active ? 600 : 500,
                  color: active ? theme.palette.primary.main : theme.palette.text.primary
                }}
              />
              {item.badge && (
                <Chip
                  label={item.badge}
                  size="small"
                  sx={{
                    height: 20,
                    fontSize: '0.75rem',
                    backgroundColor: theme.palette.error.main,
                    color: 'white',
                    fontWeight: 600
                  }}
                />
              )}
              {hasSubItems && (
                <IconButton size="small" sx={{ ml: 1, p: 0.5 }}>
                  {isExpanded ? <ExpandLess /> : <ArrowRightIcon />}
                </IconButton>
              )}
            </>
          )}
        </ListItemButton>
        
        {hasSubItems && isExpanded && !sidebarCollapsed && (
          <Box sx={{ ml: 2 }}>
            {item.subItems.map((subItem: any) => (
              <NavItem key={subItem.text} item={subItem} level={1} />
            ))}
          </Box>
        )}
      </Box>
    );
  };

  const SidebarContent = () => (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Logo Section */}
      <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
        <Box
          component="img"
          src="/assets/images/extended_logo_black_white.png"
          alt="Equitle"
          sx={{
            height: sidebarCollapsed ? 32 : 40,
            filter: theme.palette.mode === 'dark' ? 'brightness(0) invert(1)' : 'brightness(0)',
            objectFit: 'contain',
            cursor: 'pointer',
            transition: 'height 0.2s ease-in-out'
          }}
          onClick={() => navigate('/')}
        />
      </Box>

      {/* Global Search */}
      <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
        <Paper
          component="form"
          sx={{
            p: '2px 4px',
            display: 'flex',
            alignItems: 'center',
            backgroundColor: theme.palette.background.default,
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 2,
            '&:hover': {
              borderColor: theme.palette.primary.main
            },
            '&:focus-within': {
              borderColor: theme.palette.primary.main,
              boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.2)}`
            }
          }}
        >
          <IconButton sx={{ p: '10px' }} aria-label="search">
            <SearchIcon />
          </IconButton>
          {!sidebarCollapsed && (
            <InputBase
              sx={{ ml: 1, flex: 1, fontSize: '0.875rem' }}
              placeholder="Search anything..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          )}
        </Paper>
      </Box>

      {/* Navigation Items */}
      <Box sx={{ flex: 1, overflow: 'auto', py: 1 }}>
        <List disablePadding>
          {navigationItems.map((item) => (
            <NavItem key={item.text} item={item} />
          ))}
        </List>
      </Box>

      {/* Recent & Pinned Items */}
      {!sidebarCollapsed && (
        <Box sx={{ borderTop: `1px solid ${theme.palette.divider}`, p: 2 }}>
          <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontWeight: 600, mb: 1, display: 'block' }}>
            RECENT
          </Typography>
          {recentItems.map((item, index) => (
            <ListItemButton
              key={index}
              onClick={() => handleNavigation(item.path)}
              sx={{
                borderRadius: 1,
                mb: 0.5,
                py: 0.5,
                px: 1,
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.05)
                }
              }}
            >
              <ListItemText
                primary={item.text}
                secondary={item.type}
                primaryTypographyProps={{ fontSize: '0.8rem' }}
                secondaryTypographyProps={{ fontSize: '0.7rem' }}
              />
            </ListItemButton>
          ))}
          
          <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontWeight: 600, mb: 1, display: 'block', mt: 2 }}>
            PINNED
          </Typography>
          {pinnedItems.map((item, index) => (
            <ListItemButton
              key={index}
              onClick={() => handleNavigation(item.path)}
              sx={{
                borderRadius: 1,
                mb: 0.5,
                py: 0.5,
                px: 1,
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.05)
                }
              }}
            >
              <ListItemText
                primary={item.text}
                secondary={item.type}
                primaryTypographyProps={{ fontSize: '0.8rem' }}
                secondaryTypographyProps={{ fontSize: '0.7rem' }}
              />
            </ListItemButton>
          ))}
        </Box>
      )}

      {/* User Profile Section */}
      <Box sx={{ borderTop: `1px solid ${theme.palette.divider}`, p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Badge
            overlap="circular"
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            badgeContent={
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  backgroundColor: '#4CAF50',
                  border: `2px solid ${theme.palette.background.paper}`
                }}
              />
            }
          >
            <Avatar
              sx={{
                width: sidebarCollapsed ? 32 : 40,
                height: sidebarCollapsed ? 32 : 40,
                backgroundColor: '#000000',
                cursor: 'pointer',
                transition: 'all 0.2s ease-in-out'
              }}
              onClick={handleProfileMenuOpen}
            >
              {user?.name?.charAt(0).toUpperCase()}
            </Avatar>
          </Badge>
          
          {!sidebarCollapsed && (
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
                {user?.name || 'User'}
              </Typography>
              <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                Online
              </Typography>
            </Box>
          )}
          
          {!sidebarCollapsed && (
            <IconButton size="small" onClick={handleProfileMenuOpen}>
              <MoreVertIcon fontSize="small" />
            </IconButton>
          )}
        </Box>
      </Box>
    </Box>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          '& .MuiDrawer-paper': {
            width: sidebarCollapsed ? 80 : 280,
            transition: 'width 0.2s ease-in-out',
            backgroundColor: theme.palette.background.paper,
            borderRight: `1px solid ${theme.palette.divider}`,
            boxShadow: 'none'
          }
        }}
      >
        <SidebarContent />
      </Drawer>

      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        open={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            width: 280,
            backgroundColor: theme.palette.background.paper
          }
        }}
      >
        <SidebarContent />
      </Drawer>

      {/* Top App Bar for Mobile */}
      <AppBar
        position="fixed"
        sx={{
          display: { xs: 'block', md: 'none' },
          backgroundColor: theme.palette.background.paper,
          borderBottom: `1px solid ${theme.palette.divider}`,
          boxShadow: 'none'
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between', minHeight: '64px !important' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton
              edge="start"
              color="inherit"
              aria-label="menu"
              onClick={() => setMobileDrawerOpen(true)}
            >
              <MenuIcon />
            </IconButton>
            <Box
              component="img"
              src="/assets/images/extended_logo_black_white.png"
              alt="Equitle"
              sx={{
                height: 32,
                filter: theme.palette.mode === 'dark' ? 'brightness(0) invert(1)' : 'brightness(0)',
                objectFit: 'contain'
              }}
              onClick={() => navigate('/')}
            />
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton onClick={handleNotificationsMenuOpen}>
              <Badge badgeContent={4} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>
            <IconButton onClick={handleProfileMenuOpen}>
              <Avatar sx={{ width: 32, height: 32, backgroundColor: '#000000' }}>
                {user?.name?.charAt(0).toUpperCase()}
              </Avatar>
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Profile Menu */}
      <Menu
        anchorEl={profileMenuAnchor}
        open={Boolean(profileMenuAnchor)}
        onClose={handleProfileMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{
          sx: {
            minWidth: 200,
            mt: 1,
            borderRadius: 2,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
          }
        }}
      >
        <MenuItem onClick={handleProfileMenuClose}>
          <ListItemIcon>
            <PersonIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Profile" />
        </MenuItem>
        <MenuItem onClick={handleProfileMenuClose}>
          <ListItemIcon>
            <SettingsIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Settings" />
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Logout" />
        </MenuItem>
      </Menu>

      {/* Notifications Menu */}
      <Menu
        anchorEl={notificationsMenuAnchor}
        open={Boolean(notificationsMenuAnchor)}
        onClose={handleNotificationsMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{
          sx: {
            minWidth: 300,
            mt: 1,
            borderRadius: 2,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
          }
        }}
      >
        <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Notifications
          </Typography>
        </Box>
        <MenuItem onClick={handleNotificationsMenuClose}>
          <ListItemText
            primary="New deal added"
            secondary="Acme Corp deal was created"
          />
        </MenuItem>
        <MenuItem onClick={handleNotificationsMenuClose}>
          <ListItemText
            primary="Contact updated"
            secondary="John Smith's information was updated"
          />
        </MenuItem>
        <MenuItem onClick={handleNotificationsMenuClose}>
          <ListItemText
            primary="Report ready"
            secondary="Q4 Fundraising report is available"
          />
        </MenuItem>
      </Menu>
    </>
  );
}
