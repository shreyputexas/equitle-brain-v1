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
  Add as AddIcon,
  FilterList as FilterIcon,
  ViewList as ViewListIcon,
  GridView as GridViewIcon,
  Call as CallIcon,
  Voicemail as VoicemailIcon,
  Campaign as CampaignIcon,
  VolumeUp as SpeakerIcon,
  Handshake as HandshakeIcon
  , Logout as LogoutIcon
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
    badge: null
  },
  {
    text: 'Outreach',
    icon: <CampaignIcon />,
    badge: null,
    subItems: [
      { text: 'Deals', path: '/outreach/deals', icon: <DealsIcon /> },
      // ARCHIVED: Investors page - hidden from menu but code preserved
      // { text: 'Investors', path: '/outreach/investors', icon: <FundraisingIcon /> },
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
  // ARCHIVED: Investors main menu item - hidden from menu but code preserved
  // {
  //   text: 'Investors',
  //   icon: <FundraisingIcon />,
  //   badge: null,
  //   subItems: [
  //     { text: 'Limited Partners', path: '/fundraising/limited-partners', icon: <LimitedPartnersIcon /> },
  //     { text: 'Funds', path: '/fundraising/funds', icon: <FundsIcon /> }
  //   ]
  // },
  // ARCHIVED: Brain page - hidden from menu but code preserved
  // {
  //   text: 'Brain',
  //   icon: <BrainIcon />,
  //   path: '/brain',
  //   badge: null
  // }
];

const recentItems = [
  { text: 'Acme Corp Deal', type: 'Deal', path: '/outreach/deals/acme-corp' },
  { text: 'John Smith Contact', type: 'Contact', path: '/contacts/john-smith' }
];

const pinnedItems = [
  { text: 'My Pipeline', type: 'View', path: '/outreach/pipeline' },
  { text: 'Hot Leads', type: 'View', path: '/contacts/hot-leads' }
];

interface ProfessionalNavbarProps {
  onSidebarCollapsedChange?: (collapsed: boolean) => void;
}

export default function ProfessionalNavbar({ onSidebarCollapsedChange }: ProfessionalNavbarProps = {}) {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  
  // State management
  const [navMenuAnchors, setNavMenuAnchors] = useState<{ [key: string]: HTMLElement | null }>({});
  const [profileMenuAnchor, setProfileMenuAnchor] = useState<null | HTMLElement>(null);
  const [notificationsMenuAnchor, setNotificationsMenuAnchor] = useState<null | HTMLElement>(null);
  const [settingsMenuAnchor, setSettingsMenuAnchor] = useState<null | HTMLElement>(null);
  const [settingsMenuPosition, setSettingsMenuPosition] = useState<{ top: number; left: number } | null>(null);
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

  const handleSettingsMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    console.log('Settings menu opening, anchor element:', event.currentTarget);
    const rect = event.currentTarget.getBoundingClientRect();
    console.log('Anchor rect:', rect);
    
    // Calculate position with safety checks
    const top = Math.max(8, rect.top - 8);
    const left = rect.right + 8;
    
    console.log('Calculated position:', { top, left });
    
    setSettingsMenuAnchor(event.currentTarget);
    setSettingsMenuPosition({ top, left });
  };

  const handleSettingsMenuClose = () => {
    setSettingsMenuAnchor(null);
    setSettingsMenuPosition(null);
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
    navigate('/');
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
    const [dropdownAnchor, setDropdownAnchor] = useState<null | HTMLElement>(null);
    const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null);

    const handleDropdownOpen = (event: React.MouseEvent<HTMLElement>) => {
      event.preventDefault();
      event.stopPropagation();
      if (hoverTimeout) {
        clearTimeout(hoverTimeout);
        setHoverTimeout(null);
      }
      setDropdownAnchor(event.currentTarget);
    };

    const handleDropdownClose = () => {
      if (hoverTimeout) {
        clearTimeout(hoverTimeout);
        setHoverTimeout(null);
      }
      setDropdownAnchor(null);
    };

    const handleMouseEnter = (event: React.MouseEvent<HTMLElement>) => {
      if (hasSubItems && sidebarCollapsed) {
        if (hoverTimeout) {
          clearTimeout(hoverTimeout);
        }
        setHoverTimeout(setTimeout(() => {
          handleDropdownOpen(event);
        }, 200)); // 200ms delay
      }
    };

    const handleMouseLeave = () => {
      if (hasSubItems && sidebarCollapsed) {
        if (hoverTimeout) {
          clearTimeout(hoverTimeout);
          setHoverTimeout(null);
        }
        setHoverTimeout(setTimeout(() => {
          handleDropdownClose();
        }, 300)); // 300ms delay before closing
      }
    };

    // Cleanup timeout on unmount
    React.useEffect(() => {
      return () => {
        if (hoverTimeout) {
          clearTimeout(hoverTimeout);
        }
      };
    }, [hoverTimeout]);

    return (
      <Box>
        <ListItemButton
          onClick={(event) => {
            if (hasSubItems) {
              if (sidebarCollapsed) {
                // In collapsed mode, show dropdown menu
                handleDropdownOpen(event);
              } else {
                // In expanded mode, toggle the sub-items
                toggleExpanded(item.text);
              }
            } else {
              handleNavigation(item.path);
            }
          }}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          sx={{
            borderRadius: 1,
            mb: 0.5,
            mx: sidebarCollapsed ? 0.5 : 1,
            pl: sidebarCollapsed ? 1 : (level === 0 ? 2 : 4),
            pr: sidebarCollapsed ? 1 : 2,
            py: sidebarCollapsed ? 1.5 : 1,
            minHeight: sidebarCollapsed ? 48 : 44,
            justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
            backgroundColor: active ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
            border: active ? '1px solid rgba(255, 255, 255, 0.3)' : '1px solid transparent',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            },
            transition: 'all 0.2s ease-in-out',
            position: 'relative'
          }}
        >
          <ListItemIcon sx={{ 
            minWidth: sidebarCollapsed ? 24 : 40, 
            color: active ? 'white' : 'rgba(255, 255, 255, 0.8)',
            justifyContent: sidebarCollapsed ? 'center' : 'flex-start'
          }}>
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
              {sidebarCollapsed && hasSubItems && (
                <Box
                  component="img"
                  src="/assets/images/transparent_shortened.png"
                  alt="Sub-items"
                  sx={{
                    position: 'absolute',
                    top: 4,
                    right: 4,
                    width: 16,
                    height: 16,
                    filter: 'brightness(0) invert(1)',
                    objectFit: 'contain'
                  }}
                />
              )}
            </>
          )}
          {sidebarCollapsed && item.badge && (
            <Box
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: '#ef4444',
                border: '2px solid #1a1a1a'
              }}
            />
          )}
        </ListItemButton>
        
        {/* Dropdown menu for collapsed mode */}
        {hasSubItems && sidebarCollapsed && (
          <Box
            onMouseEnter={() => {
              if (hoverTimeout) {
                clearTimeout(hoverTimeout);
                setHoverTimeout(null);
              }
            }}
            onMouseLeave={handleMouseLeave}
            sx={{
              position: 'fixed',
              top: dropdownAnchor ? dropdownAnchor.getBoundingClientRect().bottom - 48 : 0,
              left: dropdownAnchor ? dropdownAnchor.getBoundingClientRect().right + 8 : 0,
              bgcolor: '#1a1a1a',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: 2,
              minWidth: 200,
              p: 1,
              zIndex: 9999,
              display: Boolean(dropdownAnchor) ? 'block' : 'none',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
              maxHeight: '300px',
              overflowY: 'auto'
            }}
          >
            {item.subItems.map((subItem: any) => (
              <Box
                key={subItem.text}
                onClick={() => {
                  handleNavigation(subItem.path);
                  handleDropdownClose();
                }}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  p: 1.5,
                  cursor: 'pointer',
                  color: 'rgba(255, 255, 255, 0.9)',
                  borderRadius: 1,
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 0.1)',
                  }
                }}
              >
                <Box sx={{ mr: 1.5, color: 'rgba(255, 255, 255, 0.8)', display: 'flex', alignItems: 'center' }}>
                  {subItem.icon}
                </Box>
                <Typography sx={{ fontSize: '0.875rem', fontWeight: 500 }}>{subItem.text}</Typography>
              </Box>
            ))}
          </Box>
        )}
        
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
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box
            component="img"
            src="/assets/images/extended_logo_black_white.png"
            alt="Equitle"
            sx={{
              height: 40,
              filter: 'brightness(0) invert(1)',
              objectFit: 'contain',
              cursor: 'pointer',
              transition: 'height 0.2s ease-in-out',
              opacity: sidebarCollapsed ? 0 : 1,
              width: sidebarCollapsed ? 0 : 'auto',
              overflow: 'hidden'
            }}
            onClick={() => navigate('/')}
          />
          <IconButton
            onClick={() => {
              const newCollapsed = !sidebarCollapsed;
              setSidebarCollapsed(newCollapsed);
              onSidebarCollapsedChange?.(newCollapsed);
            }}
            sx={{
              p: 1,
              borderRadius: 2,
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)'
              },
              transition: 'all 0.2s ease-in-out'
            }}
          >
            {sidebarCollapsed ? (
              <Box
                component="img"
                src="/assets/images/transparent_shortened.png"
                alt="Toggle"
                sx={{
                  width: 32,
                  height: 32,
                  filter: 'brightness(0) invert(1)',
                  objectFit: 'contain',
                  '&:hover': {
                    opacity: 1
                  }
                }}
              />
            ) : (
              <Box
                sx={{
                  width: 16,
                  height: 16,
                  color: 'rgba(255, 255, 255, 0.8)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  '&:hover': {
                    color: 'white'
                  }
                }}
              >
                <ArrowRightIcon sx={{ transform: 'rotate(180deg)' }} />
              </Box>
            )}
          </IconButton>
        </Box>
      </Box>


      {/* Navigation Items */}
      <Box sx={{ flex: 1, overflow: 'auto', py: 1 }}>
        <List disablePadding>
          {navigationItems.map((item) => (
            <NavItem key={item.text} item={item} />
          ))}
        </List>
      </Box>


      {/* Mini Settings Bar */}
      <Box sx={{ 
        borderTop: '1px solid rgba(255, 255, 255, 0.1)', 
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        p: sidebarCollapsed ? 1 : 2,
        mb: 1
      }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: sidebarCollapsed ? 0 : 2,
          justifyContent: sidebarCollapsed ? 'center' : 'flex-start'
        }}>
          <Tooltip title="Settings" placement="right">
            <IconButton
              onClick={sidebarCollapsed ? handleSettingsMenuOpen : () => navigate('/settings')}
              sx={{
                width: sidebarCollapsed ? 40 : 'auto',
                height: 40,
                borderRadius: 2,
                color: 'rgba(255, 255, 255, 0.8)',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  color: 'white'
                },
                transition: 'all 0.2s ease-in-out'
              }}
            >
              <SettingsIcon />
            </IconButton>
          </Tooltip>
          
          {!sidebarCollapsed && (
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              <Typography 
                variant="body2" 
                sx={{ 
                  fontWeight: 600, 
                  color: 'white',
                  cursor: 'pointer',
                  '&:hover': {
                    color: 'rgba(255, 255, 255, 0.8)'
                  }
                }}
                onClick={() => navigate('/settings')}
              >
                Settings
              </Typography>
              <Typography 
                variant="caption" 
                sx={{ 
                  color: 'rgba(255, 255, 255, 0.7)',
                  cursor: 'pointer',
                  '&:hover': {
                    color: 'rgba(255, 255, 255, 0.9)'
                  }
                }}
                onClick={() => navigate('/profile')}
              >
                My Profile
              </Typography>
            </Box>
          )}
        </Box>
      </Box>

      {/* User Profile Section */}
      <Box sx={{ p: sidebarCollapsed ? 1 : 2 }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: sidebarCollapsed ? 0 : 2,
          justifyContent: sidebarCollapsed ? 'center' : 'flex-start'
        }}>
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
          
        </Box>
        {/* Logout control */}
        {sidebarCollapsed ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
            <Tooltip title="Logout">
              <IconButton
                onClick={handleLogout}
                sx={{
                  color: 'rgba(255, 255, 255, 0.9)',
                  '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' }
                }}
              >
                <LogoutIcon />
              </IconButton>
            </Tooltip>
          </Box>
        ) : (
          <Button
            onClick={handleLogout}
            variant="outlined"
            startIcon={<LogoutIcon />}
            fullWidth
            sx={{
              mt: 1,
              color: 'white',
              borderColor: 'rgba(255, 255, 255, 0.3)',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                borderColor: 'rgba(255, 255, 255, 0.5)'
              }
            }}
          >
            Logout
          </Button>
        )}
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
            color: 'white',
            borderRadius: 0
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
            color: 'white',
            borderRadius: 0
          }
        }}
      >
        <SidebarContent />
      </Drawer>

      {/* Top App Bar for Mobile */}
      {!sidebarCollapsed && (
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
              src="/assets/images/transparent_shortened.png"
              alt="Equitle"
              sx={{
                height: 32,
                filter: 'brightness(0) invert(1)',
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
      )}


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
        <MenuItem onClick={() => { navigate('/profile'); handleProfileMenuClose(); }}>
          <ListItemIcon>
            <PersonIcon fontSize="small" />
          </ListItemIcon>
          Profile
        </MenuItem>
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          Logout
        </MenuItem>
      </Menu>

      {/* Settings Menu (collapsed style dropdown) */}
      {sidebarCollapsed && settingsMenuPosition && (
        <Box
          onMouseLeave={handleSettingsMenuClose}
          sx={{
            position: 'fixed',
            top: settingsMenuPosition.top,
            left: settingsMenuPosition.left,
            bgcolor: '#1a1a1a',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: 2,
            minWidth: 220,
            p: 1,
            zIndex: 9999,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
          }}
        >
          <Box
            onClick={() => {
              navigate('/settings');
              handleSettingsMenuClose();
            }}
            sx={{
              display: 'flex',
              alignItems: 'center',
              p: 1.5,
              cursor: 'pointer',
              color: 'rgba(255, 255, 255, 0.9)',
              borderRadius: 1,
              '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.1)' }
            }}
          >
            <Box sx={{ mr: 1.5, color: 'rgba(255, 255, 255, 0.8)', display: 'flex', alignItems: 'center' }}>
              <SettingsIcon />
            </Box>
            <Typography sx={{ fontSize: '0.875rem', fontWeight: 500 }}>Settings</Typography>
          </Box>
          <Box
            onClick={() => {
              navigate('/profile');
              handleSettingsMenuClose();
            }}
            sx={{
              display: 'flex',
              alignItems: 'center',
              p: 1.5,
              cursor: 'pointer',
              color: 'rgba(255, 255, 255, 0.9)',
              borderRadius: 1,
              '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.1)' }
            }}
          >
            <Box sx={{ mr: 1.5, color: 'rgba(255, 255, 255, 0.8)', display: 'flex', alignItems: 'center' }}>
              <PersonIcon />
            </Box>
            <Typography sx={{ fontSize: '0.875rem', fontWeight: 500 }}>My Profile</Typography>
          </Box>
        </Box>
      )}
    </>
  );
}
