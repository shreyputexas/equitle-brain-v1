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
  GridView as GridViewIcon,
  Call as CallIcon,
  Voicemail as VoicemailIcon,
  Campaign as CampaignIcon,
  VolumeUp as SpeakerIcon,
  Handshake as HandshakeIcon
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
    icon: <SpeakerIcon />,
    badge: '3',
    subItems: [
      { text: 'Deals', path: '/outreach/deals', icon: <DealsIcon /> },
      { text: 'Investors', path: '/outreach/investors', icon: <FundraisingIcon /> },
      { text: 'Brokers', path: '/outreach/brokers', icon: <HandshakeIcon /> }
    ]
  },
  {
    text: 'Voice Calls',
    icon: <PhoneIcon />,
    badge: null,
    subItems: [
      { text: 'Live Calling', path: '/voice-calls', icon: <MicIcon /> },
      { text: 'Voicemails', path: '/mass-voicemail', icon: <VoicemailIcon /> }
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
  { text: 'John Smith Contact', type: 'Contact', path: '/contacts/john-smith' }
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
  const [threeDotsMenuAnchor, setThreeDotsMenuAnchor] = useState<null | HTMLElement>(null);
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

  const handleThreeDotsMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    console.log('Three dots clicked!', event.currentTarget);
    setThreeDotsMenuAnchor(event.currentTarget);
  };

  const handleThreeDotsMenuClose = () => {
    setThreeDotsMenuAnchor(null);
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
            backgroundColor: active ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
            border: active ? '1px solid rgba(255, 255, 255, 0.3)' : '1px solid transparent',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            },
            transition: 'all 0.2s ease-in-out'
          }}
        >
          <ListItemIcon sx={{ minWidth: 40, color: active ? 'white' : 'rgba(255, 255, 255, 0.8)' }}>
            {item.icon}
          </ListItemIcon>
          {!sidebarCollapsed && (
            <>
              <ListItemText 
                primary={item.text}
                primaryTypographyProps={{
                  fontSize: '0.875rem',
                  fontWeight: active ? 600 : 500,
                  color: active ? 'white' : 'rgba(255, 255, 255, 0.9)'
                }}
              />
              {item.badge && (
                <Chip
                  label={item.badge}
                  size="small"
                  sx={{
                    height: 20,
                    fontSize: '0.75rem',
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    color: 'white',
                    fontWeight: 600,
                    border: '1px solid rgba(255, 255, 255, 0.3)'
                  }}
                />
              )}
              {hasSubItems && (
                <IconButton 
                  size="small" 
                  sx={{ 
                    ml: 1, 
                    p: 0.5,
                    color: 'rgba(255, 255, 255, 0.8)',
                    transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                >
                  <ArrowRightIcon />
                </IconButton>
              )}
            </>
          )}
        </ListItemButton>
        
        {hasSubItems && !sidebarCollapsed && (
          <Collapse 
            in={isExpanded} 
            timeout={300}
            unmountOnExit
            sx={{
              '& .MuiCollapse-wrapper': {
                overflow: 'visible'
              },
              '& .MuiCollapse-wrapperInner': {
                overflow: 'visible',
                transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
              }
            }}
          >
            <Box sx={{ ml: 2, mt: 0.5 }}>
              {item.subItems.map((subItem: any, index: number) => (
                <Box
                  key={subItem.text}
                  sx={{
                    opacity: isExpanded ? 1 : 0,
                    transform: isExpanded ? 'translateY(0) scale(1)' : 'translateY(-12px) scale(0.95)',
                    transition: `all 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94)`,
                    transitionDelay: isExpanded ? `${0.15 + index * 0.05}s` : '0s',
                    transformOrigin: 'top left'
                  }}
                >
                  <NavItem item={subItem} level={1} />
                </Box>
              ))}
            </Box>
          </Collapse>
        )}
      </Box>
    );
  };

  const SidebarContent = () => (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', color: 'white' }}>
      {/* Logo Section */}
      <Box sx={{ p: 2, borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
        <Box
          component="img"
          src="/assets/images/extended_logo_black_white.png"
          alt="Equitle"
          sx={{
            height: sidebarCollapsed ? 32 : 40,
            filter: 'brightness(0) invert(1)',
            objectFit: 'contain',
            cursor: 'pointer',
            transition: 'height 0.2s ease-in-out'
          }}
          onClick={() => navigate('/')}
        />
      </Box>


      {/* Navigation Items */}
      <Box sx={{ flex: 1, overflow: 'auto', py: 1 }}>
        <List disablePadding>
          {navigationItems.map((item) => (
            <NavItem key={item.text} item={item} />
          ))}
        </List>
      </Box>


      {/* User Profile Section */}
      <Box sx={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', p: 2 }}>
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
                  border: '2px solid #1a1a1a'
                }}
              />
            }
          >
            <Avatar
              sx={{
                width: sidebarCollapsed ? 32 : 40,
                height: sidebarCollapsed ? 32 : 40,
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                color: 'white',
                cursor: 'pointer',
                transition: 'all 0.2s ease-in-out',
                border: '1px solid rgba(255, 255, 255, 0.3)'
              }}
              onClick={handleProfileMenuOpen}
            >
              {user?.name?.charAt(0).toUpperCase()}
            </Avatar>
          </Badge>
          
          {!sidebarCollapsed && (
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, color: 'white' }}>
                {user?.name || 'User'}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                Online
              </Typography>
            </Box>
          )}
          
          {!sidebarCollapsed && (
            <IconButton size="small" onClick={handleThreeDotsMenuOpen} sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
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
            background: 'linear-gradient(180deg, #2c2c2c 0%, #1a1a1a 100%)',
            borderRight: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '2px 0 8px rgba(0, 0, 0, 0.15)',
            color: 'white'
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
            background: 'linear-gradient(180deg, #2c2c2c 0%, #1a1a1a 100%)',
            borderRight: '1px solid rgba(255, 255, 255, 0.1)',
            color: 'white'
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
            <IconButton>
              <Avatar sx={{ width: 32, height: 32, backgroundColor: '#000000' }}>
                {user?.name?.charAt(0).toUpperCase()}
              </Avatar>
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>


      {/* Three Dots Menu */}
      <Menu
        anchorEl={threeDotsMenuAnchor}
        open={Boolean(threeDotsMenuAnchor)}
        onClose={handleThreeDotsMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        slotProps={{
          paper: {
            sx: {
              mt: 1,
              minWidth: 200,
              borderRadius: 2,
              boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
              '& .MuiMenuItem-root': {
                px: 2,
                py: 1,
              },
            },
          },
        }}
      >
        <MenuItem onClick={handleThreeDotsMenuClose}>
          <PersonIcon fontSize="small" sx={{ mr: 1 }} />
          Profile
        </MenuItem>
        <MenuItem onClick={handleThreeDotsMenuClose}>
          <SettingsIcon fontSize="small" sx={{ mr: 1 }} />
          Settings
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleLogout}>
          <LogoutIcon fontSize="small" sx={{ mr: 1 }} />
          Logout
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
