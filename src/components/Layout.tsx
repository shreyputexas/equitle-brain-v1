import React, { useState, useRef, useEffect } from 'react';
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
  Collapse,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useTheme
} from '@mui/material';
import {
  AttachMoney as DealsIcon,
  TrendingUp as FundraisingIcon,
  Settings as SettingsIcon,
  Notifications as NotificationsIcon,
  Search as SearchIcon,
  Logout as LogoutIcon,
  People as RelationshipsIcon,
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
  Contacts as ContactsIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useBrain } from '../contexts/BrainContext';

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
    text: 'Scraping',
    icon: <AnalyticsIcon />,
    path: '/data-enrichment'
  },
  {
    text: 'Contacts',
    icon: <ContactsIcon />,
    path: '/contacts'
  },
  {
    text: 'Outreach',
    icon: <DealsIcon />,
    subItems: [
      { text: 'Deals', path: '/outreach/deals' },
      { text: 'Investors', path: '/outreach/investors' },
      { text: 'Brokers', path: '/outreach/brokers' }
    ]
  },
  {
    text: 'Investors',
    icon: <FundraisingIcon />,
    subItems: [
      { text: 'Limited Partners', path: '/fundraising/limited-partners' },
      { text: 'Funds', path: '/fundraising/funds' }
    ]
  },
  {
    text: 'Voice Calls',
    icon: <PhoneIcon />,
    path: '/mass-voicemail'
  },
  {
    text: 'Brain',
    icon: <BrainIcon />,
    subItems: [
      { text: 'Ask About Deal', path: '/brain', action: 'ask-deal' },
      { text: 'Follow Up', path: '/brain', action: 'follow-up' },
      { text: 'Analytics', path: '/brain', action: 'analytics' },
      { text: 'Generate Report', path: '/brain', action: 'report' }
    ]
  }
];

export default function Layout() {
  const theme = useTheme();
  const [profileAnchorEl, setProfileAnchorEl] = useState<null | HTMLElement>(null);
  const [navMenuAnchors, setNavMenuAnchors] = useState<{ [key: string]: HTMLElement | null }>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [mobileExpandedMenus, setMobileExpandedMenus] = useState<{ [key: string]: boolean }>({});
  const [brainChatOpen, setBrainChatOpen] = useState(false);
  const [quickLookupOpen, setQuickLookupOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [showChatbot, setShowChatbot] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [navPosition, setNavPosition] = useState<'top' | 'left'>('top');
  
  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  
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
      // Quick lookup functionality - search for documents, emails, transcripts, etc.
      console.log('Quick lookup search:', searchQuery);
      // TODO: Implement quick lookup search functionality
      setSearchQuery('');
    }
  };

  const handleNavigation = (path: string, menuKey?: string, action?: string) => {
    navigate(path);
    if (menuKey) {
      handleNavMenuClose(menuKey);
    }
    setMobileDrawerOpen(false);
    
    // Handle Brain quick actions
    if (action) {
      // You can add specific logic here for different actions
      // For now, we'll just navigate to the brain page
      console.log(`Brain action: ${action}`);
    }
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
    if (!brainChatOpen) {
      // Opening - start recording immediately
      setBrainChatOpen(true);
      setShowChatbot(false);
      setTranscript('');
      setMessages([]);
      // Start recording after a brief delay to allow UI to render
      setTimeout(() => {
        startRecording();
      }, 100);
    } else {
      // Closing - stop recording and reset
      if (isRecording) {
        stopRecording();
      }
      setBrainChatOpen(false);
      setShowChatbot(false);
      setTranscript('');
      setMessages([]);
      setIsProcessing(false);
      setIsSpeaking(false);
    }
  };

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        if (finalTranscript) {
          setTranscript(prev => prev + finalTranscript);
          setIsTranscribing(false);
        } else if (interimTranscript) {
          setTranscript(prev => {
            // Remove any previous interim text and add new interim text
            const withoutInterim = prev.replace(/[^.!?]*$/, '');
            return withoutInterim + interimTranscript;
          });
          setIsTranscribing(true);
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
        setIsTranscribing(false);
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
        setIsTranscribing(false);
      };
    }
  }, []);

  const startRecording = () => {
    if (recognitionRef.current) {
      setTranscript('');
      setIsRecording(true);
      setIsTranscribing(true);
      recognitionRef.current.start();
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
      setIsTranscribing(false);
      
      // Auto-process the transcript after a brief delay
      setTimeout(() => {
        if (transcript.trim()) {
          handleSendMessage();
        }
      }, 500);
    }
  };

  const handleSendMessage = () => {
    if (transcript.trim()) {
      // Clean the transcript to remove the repetitive prefix
      const cleanTranscript = transcript
        .replace(/^what's the update with sarah johnson from tech corp inc\s*/gi, '')
        .replace(/^what's the update with sarah johnson from tech corp inc\s*/gi, '')
        .trim();
      
      const newMessage = {
        id: Date.now().toString(),
        text: cleanTranscript || "What's the update with Sarah Johnson from Tech Corp Inc?",
        isUser: true,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, newMessage]);
      setIsProcessing(true);
      setTranscript(''); // Clear transcript immediately when processing starts
      
      // Simulate AI response with voice
      setTimeout(() => {
        const aiResponseText = "Here's the update on Tech Corp Inc with Sarah Johnson: The NDA was signed by Sarah Johnson on March 15th, 2024. The technical due diligence is scheduled for next week, and we're waiting for their financial statements. Sarah mentioned they're looking to close the Series A round by end of Q2. Next steps are to schedule the technical due diligence meeting and review their cap table.";
        
        const aiResponse = {
          id: (Date.now() + 1).toString(),
          text: aiResponseText,
          isUser: false,
          timestamp: new Date(),
          sources: [
            { type: 'call', title: 'Call transcription - March 14, 2024', description: 'Initial discussion with Sarah Johnson' },
            { type: 'email', title: 'Email thread from March 12, 2024', description: 'NDA negotiation and signing' },
            { type: 'document', title: 'Due diligence checklist', description: 'Technical review requirements' },
            { type: 'meeting', title: 'Meeting notes - March 10, 2024', description: 'Series A timeline discussion' }
          ]
        };
        setMessages(prev => [...prev, aiResponse]);
        setIsProcessing(false);
        
        // Show chatbot interface after processing
        setShowChatbot(true);
      }, 2000);
    }
  };

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      setIsSpeaking(true);
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 0.8;
      
      utterance.onend = () => {
        setIsSpeaking(false);
      };
      
      utterance.onerror = () => {
        setIsSpeaking(false);
      };
      
      speechSynthesis.speak(utterance);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: navPosition === 'left' ? 'row' : 'column', minHeight: '100vh' }}>
      {/* Navigation Bar - Top or Left */}
      <Box sx={{
        bgcolor: 'background.paper',
        ...(navPosition === 'left' ? {
          width: 80,
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          borderRight: '1px solid',
          borderColor: 'divider',
          position: 'fixed',
          left: 0,
          top: 0,
          zIndex: 1200,
          p: 1
        } : {
          width: '100%',
          position: 'fixed',
          top: 0,
          zIndex: 1200,
          boxShadow: 'none',
          borderBottom: '1px solid',
          borderColor: 'divider'
        })
      }}>
        {navPosition === 'left' ? (
          /* Left Mode - Compact Icons */
          <>
            {/* Equitle Logo Icon */}
            <Tooltip title="Equitle" placement="right">
              <IconButton
                onClick={() => navigate('/')}
                sx={{
                  width: 56,
                  height: 56,
                  bgcolor: '#FFFFFF',
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2,
                  mb: 3,
                  p: 1,
                  '&:hover': {
                    bgcolor: '#F9FAFB',
                    borderColor: '#D1D5DB'
                  }
                }}
              >
                <Box
                  component="img"
                  src="/assets/images/extended_logo_black_white.png"
                  alt="Equitle"
                  sx={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    filter: 'brightness(0)'
                  }}
                />
              </IconButton>
            </Tooltip>

            {/* Navigation Icons */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, alignItems: 'center', flex: 1 }}>
              {navigationItems.map((item) => (
                <Box key={item.text} sx={{ position: 'relative' }}>
                  <Tooltip title={item.text} placement="right">
                    <IconButton
                      onClick={() => {
                        if (item.subItems) {
                          // For items with submenus, open the dropdown menu
                          handleNavMenuOpen({ currentTarget: document.querySelector(`[data-menu-trigger="${item.text}"]`) } as any, item.text);
                        } else {
                          handleNavigation(item.path || '#');
                        }
                      }}
                      data-menu-trigger={item.text}
                      sx={{
                        bgcolor: 'transparent',
                        color: location.pathname === item.path || 
                               (item.text === 'Outreach' && location.pathname.startsWith('/outreach')) ||
                               (item.text === 'Investors' && location.pathname.startsWith('/fundraising')) ||
                               (item.text === 'Brain' && location.pathname.startsWith('/brain')) ? 'primary.main' : 'text.primary',
                        width: 48,
                        height: 48,
                        border: '1px solid',
                        borderColor: location.pathname === item.path || 
                                     (item.text === 'Outreach' && location.pathname.startsWith('/outreach')) ||
                                     (item.text === 'Investors' && location.pathname.startsWith('/fundraising')) ||
                                     (item.text === 'Brain' && location.pathname.startsWith('/brain')) ? 'primary.main' : 'transparent',
                        '&:hover': {
                          bgcolor: 'action.hover'
                        }
                      }}
                    >
                      {item.icon}
                    </IconButton>
                  </Tooltip>
                  
                  {/* Submenu for left navigation */}
                  {item.subItems && (
                    <Menu
                      anchorEl={navMenuAnchors[item.text]}
                      open={Boolean(navMenuAnchors[item.text])}
                      onClose={() => handleNavMenuClose(item.text)}
                      transformOrigin={{ horizontal: 'left', vertical: 'top' }}
                      anchorOrigin={{ horizontal: 'right', vertical: 'top' }}
                      PaperProps={{
                        sx: {
                          ml: 1,
                          minWidth: 200,
                          bgcolor: 'background.paper',
                          border: '1px solid',
                          borderColor: 'divider',
                          boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
                        }
                      }}
                    >
                      {item.subItems.map((subItem) => (
                        <MenuItem
                          key={subItem.text}
                          onClick={() => handleNavigation(subItem.path, item.text, (subItem as any).action)}
                          selected={false}
                          sx={{
                            py: 1.5,
                            px: 2,
                            '&:hover': {
                              bgcolor: 'action.hover'
                            }
                          }}
                        >
                          <ListItemText 
                            primary={subItem.text}
                            primaryTypographyProps={{
                              variant: 'body2',
                              fontWeight: 500
                            }}
                          />
                        </MenuItem>
                      ))}
                    </Menu>
                  )}
                </Box>
              ))}
            </Box>

            {/* Search Bar */}
            <Box sx={{ mb: 2, width: '100%', px: 1 }}>
              <Tooltip title="Quick Search" placement="right">
                <IconButton
                  onClick={() => setQuickLookupOpen(true)}
                  sx={{
                    width: 48,
                    height: 48,
                    bgcolor: 'background.default',
                    border: '1px solid',
                    borderColor: 'divider',
                    '&:hover': {
                      bgcolor: 'action.hover'
                    }
                  }}
                >
                  <SearchIcon />
                </IconButton>
              </Tooltip>
            </Box>

            {/* Profile Section */}
            <Box sx={{ mb: 2 }}>
              <Tooltip title="Profile" placement="right">
                <IconButton 
                  onClick={handleProfileMenuOpen}
                  sx={{ 
                    p: 0, 
                    position: 'relative',
                    width: 48,
                    height: 48
                  }}
                >
                  <Badge 
                    badgeContent={4} 
                    sx={{ 
                      '& .MuiBadge-badge': { 
                        bgcolor: '#ff0000',
                        color: 'white',
                        right: 2,
                        top: 2,
                        minWidth: '18px',
                        height: '18px',
                        fontSize: '12px'
                      } 
                    }}
                  >
                    <Avatar sx={{ bgcolor: '#000000', width: 48, height: 48 }}>
                      {user?.name?.charAt(0).toUpperCase()}
                    </Avatar>
                  </Badge>
                </IconButton>
              </Tooltip>
            </Box>

            {/* Layout Toggle */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, alignItems: 'center' }}>
              <Tooltip title="Top Layout" placement="right">
                <IconButton
                  onClick={() => setNavPosition('top')}
                  sx={{
                    bgcolor: 'transparent',
                    color: (navPosition as string) === 'top' ? 'primary.main' : 'text.primary',
                    width: 32,
                    height: 32,
                    fontSize: '0.7rem',
                    border: '1px solid',
                    borderColor: (navPosition as string) === 'top' ? 'primary.main' : 'divider',
                    '&:hover': {
                      bgcolor: 'action.hover'
                    }
                  }}
                >
                  T
                </IconButton>
              </Tooltip>
              <Tooltip title="Left Layout" placement="right">
                <IconButton
                  onClick={() => setNavPosition('left')}
                  sx={{
                    bgcolor: 'transparent',
                    color: (navPosition as string) === 'left' ? 'primary.main' : 'text.primary',
                    width: 32,
                    height: 32,
                    fontSize: '0.7rem',
                    border: '1px solid',
                    borderColor: (navPosition as string) === 'left' ? 'primary.main' : 'divider',
                    '&:hover': {
                      bgcolor: 'action.hover'
                    }
                  }}
                >
                  L
                </IconButton>
              </Tooltip>
            </Box>
          </>
        ) : (
          /* Top Mode - Traditional */
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
            <Box
              component="img"
              src="/assets/images/extended_logo_black_white.png"
              alt="Equitle"
              sx={{
                height: { xs: '2rem', md: '2.5rem' },
                filter: theme.palette.mode === 'dark' ? 'brightness(0) invert(1)' : 'brightness(0)',
                opacity: 0.95,
                objectFit: 'contain',
                mr: 4,
                cursor: 'pointer'
              }}
              onClick={() => navigate('/')}
            />

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
                            onClick={() => handleNavigation(subItem.path, item.text, (subItem as any).action)}
                            selected={false}
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

            {/* Layout Toggle */}
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mr: 2 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Layout:
              </Typography>
              <Button
                size="small"
                onClick={() => setNavPosition('top')}
                sx={{
                  bgcolor: 'transparent',
                  color: navPosition === 'top' ? 'primary.main' : 'text.primary',
                  fontSize: '0.75rem',
                  minWidth: 'auto',
                  px: 1.5,
                  border: '1px solid',
                  borderColor: navPosition === 'top' ? 'primary.main' : 'divider',
                  '&:hover': {
                    bgcolor: 'action.hover'
                  }
                }}
              >
                Top
              </Button>
              <Button
                size="small"
                onClick={() => setNavPosition('left')}
                sx={{
                  bgcolor: 'transparent',
                  color: (navPosition as string) === 'left' ? 'primary.main' : 'text.primary',
                  fontSize: '0.75rem',
                  minWidth: 'auto',
                  px: 1.5,
                  border: '1px solid',
                  borderColor: (navPosition as string) === 'left' ? 'primary.main' : 'divider',
                  '&:hover': {
                    bgcolor: 'action.hover'
                  }
                }}
              >
                Left
              </Button>
            </Box>

            {/* Quick Lookup Icon */}
            <Tooltip title="Quick Lookup">
              <IconButton
                onClick={() => setQuickLookupOpen(true)}
                sx={{
                  display: { xs: 'none', md: 'flex' },
                  mr: 2,
                  bgcolor: 'background.default',
                  border: '1px solid',
                  borderColor: 'divider',
                  '&:hover': {
                    bgcolor: 'action.hover'
                  }
                }}
              >
                <SearchIcon />
              </IconButton>
            </Tooltip>

            {/* Right side - Profile with Notifications */}
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Tooltip title="Profile">
                <IconButton onClick={handleProfileMenuOpen} sx={{ p: 0, position: 'relative' }}>
                  <Badge 
                    badgeContent={4} 
                    sx={{ 
                      '& .MuiBadge-badge': { 
                        bgcolor: '#ff0000',
                        color: 'white',
                        right: 2,
                        top: 2,
                        minWidth: '18px',
                        height: '18px',
                        fontSize: '12px'
                      } 
                    }}
                  >
                    <Avatar sx={{ bgcolor: '#000000' }}>
                      {user?.name?.charAt(0).toUpperCase()}
                    </Avatar>
                  </Badge>
                </IconButton>
              </Tooltip>
            </Box>
          </Toolbar>
        )}
      </Box>

      {/* Profile Menu */}
      <Menu
        anchorEl={profileAnchorEl}
        open={Boolean(profileAnchorEl)}
        onClose={handleProfileMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={() => { handleProfileMenuClose(); navigate('/settings'); }}>
          <ListItemIcon>
            <SettingsIcon fontSize="small" />
          </ListItemIcon>
          Settings
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
            <Box
              component="img"
              src="/assets/images/extended_logo_black_white.png"
              alt="Equitle"
              sx={{
                height: '2rem',
                filter: theme.palette.mode === 'dark' ? 'brightness(0) invert(1)' : 'brightness(0)',
                opacity: 0.95,
                objectFit: 'contain',
                cursor: 'pointer'
              }}
              onClick={() => navigate('/')}
            />
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
                            onClick={() => handleNavigation(subItem.path, undefined, (subItem as any).action)}
                            selected={false}
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
            
            {/* Mobile Profile Section */}
            <Divider sx={{ my: 2 }} />
            <List>
              <ListItem disablePadding>
                <ListItemButton onClick={() => { setMobileDrawerOpen(false); navigate('/settings'); }}>
                  <ListItemIcon>
                    <SettingsIcon />
                  </ListItemIcon>
                  <ListItemText primary="Settings" />
                </ListItemButton>
              </ListItem>
              <ListItem disablePadding>
                <ListItemButton onClick={handleLogout}>
                  <ListItemIcon>
                    <LogoutIcon />
                  </ListItemIcon>
                  <ListItemText primary="Logout" />
                </ListItemButton>
              </ListItem>
            </List>
          </List>
        </Box>
        </Drawer>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          mt: navPosition === 'top' ? 8 : 0, // Account for AppBar height only in top mode
          ml: navPosition === 'left' ? 10 : 0, // Account for left nav width (80px + padding)
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
          <Tooltip title="Voice Assistant" placement="left">
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
              width: 420,
              height: showChatbot ? 600 : 300,
              borderRadius: 3,
              boxShadow: '0 16px 64px rgba(0,0,0,0.3)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              transition: 'all 0.3s ease'
            }}
          >
            {!showChatbot ? (
              // Voice Recording Interface
              <>
                {/* Minimal Header */}
                <Box
                  sx={{
                    p: 2,
                    display: 'flex',
                    justifyContent: 'flex-end',
                    bgcolor: 'transparent'
                  }}
                >
                  <IconButton
                    onClick={handleBrainChatToggle}
                    sx={{ color: 'text.secondary' }}
                    size="small"
                  >
                    <CloseIcon />
                  </IconButton>
                </Box>

                {/* Voice Interface */}
                <Box
                  sx={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    p: 4,
                    bgcolor: 'transparent'
                  }}
                >
                  {/* Recording Button */}
                  <Box sx={{ mb: 4 }}>
                    <IconButton
                      onClick={isRecording ? stopRecording : startRecording}
                      disabled={isProcessing}
                      sx={{
                        width: 100,
                        height: 100,
                        bgcolor: isRecording ? '#000000' : isProcessing ? '#666666' : 'rgba(0,0,0,0.1)',
                        color: isRecording || isProcessing ? 'white' : 'text.primary',
                        border: '2px solid',
                        borderColor: isRecording ? '#000000' : isProcessing ? '#666666' : 'rgba(0,0,0,0.2)',
                        '&:hover': {
                          bgcolor: isRecording ? '#333333' : isProcessing ? '#888888' : 'rgba(0,0,0,0.15)',
                          transform: 'scale(1.05)'
                        },
                        transition: 'all 0.3s ease',
                        animation: (isRecording || isProcessing) ? 'pulse 1.5s infinite' : 'none',
                        '@keyframes pulse': {
                          '0%': { boxShadow: '0 0 0 0 rgba(0, 0, 0, 0.7)' },
                          '70%': { boxShadow: '0 0 0 20px rgba(0, 0, 0, 0.3), 0 0 0 40px rgba(0, 0, 0, 0.1)' },
                          '100%': { boxShadow: '0 0 0 0 rgba(0, 0, 0, 0)' }
                        }
                      }}
                    >
                      {isProcessing ? (
                        <Box sx={{ 
                          width: 32, 
                          height: 32, 
                          border: '3px solid rgba(255,255,255,0.3)',
                          borderTop: '3px solid white',
                          borderRadius: '50%',
                          animation: 'spin 1s linear infinite',
                          '@keyframes spin': {
                            '0%': { transform: 'rotate(0deg)' },
                            '100%': { transform: 'rotate(360deg)' }
                          }
                        }} />
                      ) : isRecording ? (
                        <StopIcon sx={{ fontSize: 32 }} />
                      ) : (
                        <MicIcon sx={{ fontSize: 32 }} />
                      )}
                    </IconButton>
                  </Box>

                  {/* Status Text */}
                  {isRecording && (
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        mb: 2,
                        color: '#000000',
                        fontWeight: 500
                      }}
                    >
                      Click to stop recording
                    </Typography>
                  )}
                  {isProcessing && (
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        mb: 2,
                        color: '#000000',
                        fontWeight: 500
                      }}
                    >
                      Processing your request...
                    </Typography>
                  )}

                  {/* Transcript Display */}
                  {transcript && (
                    <Box
                      sx={{
                        width: '100%',
                        maxWidth: '100%',
                        p: 2,
                        bgcolor: 'rgba(0,0,0,0.05)',
                        borderRadius: 2,
                        mb: 3,
                        minHeight: 60,
                        maxHeight: 150,
                        overflowY: 'auto',
                        overflowX: 'hidden',
                        display: 'block'
                      }}
                    >
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          textAlign: 'left',
                          color: 'text.primary',
                          fontStyle: isTranscribing ? 'italic' : 'normal',
                          wordBreak: 'break-word',
                          lineHeight: 1.4,
                          width: '100%',
                          whiteSpace: 'pre-wrap'
                        }}
                      >
                        {transcript}
                        {isTranscribing && <span style={{ animation: 'blink 1s infinite' }}>|</span>}
                      </Typography>
                    </Box>
                  )}

                  {/* Auto-processing indicator */}
                  {transcript && !isTranscribing && !isProcessing && !isSpeaking && (
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: 'text.secondary',
                        fontStyle: 'italic'
                      }}
                    >
                      Processing automatically...
                    </Typography>
                  )}
                </Box>
              </>
            ) : (
              // Chatbot Interface
              <>
                {/* Minimal Chat Header */}
                <Box
                  sx={{
                    p: 2,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    bgcolor: 'transparent'
                  }}
                >
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <IconButton
                      onClick={() => setShowChatbot(false)}
                      sx={{ color: 'text.secondary' }}
                      size="small"
                    >
                      <MicIcon />
                    </IconButton>
                  </Box>
                  <IconButton
                    onClick={handleBrainChatToggle}
                    sx={{ color: 'text.secondary' }}
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
                    bgcolor: 'transparent',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2
                  }}
                >
                  {messages.map((message) => (
                    <Box
                      key={message.id}
                      sx={{
                        display: 'flex',
                        justifyContent: message.isUser ? 'flex-end' : 'flex-start',
                        mb: 1
                      }}
                    >
                      <Box
                        sx={{
                          maxWidth: '80%',
                          p: 2,
                          borderRadius: 2,
                          bgcolor: message.isUser ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.05)',
                          color: 'text.primary',
                          position: 'relative'
                        }}
                      >
                        <Typography variant="body2" sx={{ mb: message.sources ? 2 : 0 }}>
                          {message.text}
                        </Typography>
                        
                        {/* Sources */}
                        {message.sources && (
                          <Box sx={{ mt: 2 }}>
                            <Typography variant="caption" sx={{ color: 'text.secondary', mb: 1, display: 'block' }}>
                              Sources:
                            </Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                              {message.sources.map((source, index) => (
                                <Box
                                  key={index}
                                  sx={{
                                    p: 1,
                                    borderRadius: 1,
                                    bgcolor: 'rgba(0,0,0,0.05)',
                                    border: '1px solid rgba(0,0,0,0.1)',
                                    cursor: 'pointer',
                                    '&:hover': {
                                      bgcolor: 'rgba(0,0,0,0.1)'
                                    }
                                  }}
                                >
                                  <Typography variant="caption" sx={{ fontWeight: 500, display: 'block' }}>
                                    {source.title}
                                  </Typography>
                                  <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
                                    {source.description}
                                  </Typography>
                                </Box>
                              ))}
                            </Box>
                          </Box>
                        )}
                        
                        {!message.isUser && (
                          <IconButton
                            onClick={() => speakText(message.text)}
                            disabled={isSpeaking}
                            sx={{
                              position: 'absolute',
                              top: 4,
                              right: 4,
                              width: 24,
                              height: 24,
                              bgcolor: 'rgba(0,0,0,0.1)',
                              '&:hover': {
                                bgcolor: 'rgba(0,0,0,0.2)'
                              }
                            }}
                            size="small"
                          >
                            <VolumeUpIcon sx={{ fontSize: 14 }} />
                          </IconButton>
                        )}
                      </Box>
                    </Box>
                  ))}
                </Box>

                {/* Chat Input */}
                <Box sx={{ p: 2 }}>
                  <Paper
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      p: 1,
                      bgcolor: 'rgba(0,0,0,0.05)',
                      border: '1px solid',
                      borderColor: 'rgba(0,0,0,0.1)'
                    }}
                  >
                    <InputBase
                      placeholder="Type your message..."
                      value={transcript}
                      onChange={(e) => setTranscript(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleSendMessage();
                        }
                      }}
                      sx={{ flex: 1, ml: 1 }}
                    />
                    <IconButton
                      onClick={handleSendMessage}
                      disabled={!transcript.trim()}
                      sx={{ color: 'text.secondary' }}
                    >
                      <SendIcon />
                    </IconButton>
                  </Paper>
                </Box>
              </>
            )}
          </Paper>
        )}

        {/* Quick Lookup Dialog */}
        <Dialog
          open={quickLookupOpen}
          onClose={() => setQuickLookupOpen(false)}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 3,
              minHeight: '60vh',
              maxHeight: '80vh'
            }
          }}
        >
          <DialogTitle sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            bgcolor: '#000000',
            color: 'white',
            py: 2
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <SearchIcon />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Quick Lookup
              </Typography>
            </Box>
            <IconButton onClick={() => setQuickLookupOpen(false)} sx={{ color: 'white' }}>
              <CloseIcon />
            </IconButton>
          </DialogTitle>

          <DialogContent sx={{ p: 0 }}>
            <Box sx={{ p: 3 }}>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Search across documents, emails, transcripts, and other integrated data sources.
              </Typography>

              {/* Search Input */}
              <Paper
                component="form"
                sx={{
                  p: '2px 4px',
                  display: 'flex',
                  alignItems: 'center',
                  width: '100%',
                  mb: 3,
                  bgcolor: 'background.default',
                  border: '1px solid',
                  borderColor: 'divider'
                }}
              >
                <IconButton sx={{ p: '10px' }}>
                  <SearchIcon />
                </IconButton>
                <InputBase
                  sx={{ ml: 1, flex: 1 }}
                  placeholder="Search documents, emails, transcripts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={handleSearch}
                />
              </Paper>

              {/* Search Results Placeholder */}
              <Box sx={{ 
                minHeight: 200, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                border: '1px dashed',
                borderColor: 'divider',
                borderRadius: 2,
                bgcolor: 'background.default'
              }}>
                <Box sx={{ textAlign: 'center' }}>
                  <SearchIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    Start searching to find content
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Search across all your integrated data sources
                  </Typography>
                </Box>
              </Box>
            </Box>
          </DialogContent>

          <DialogActions sx={{ p: 3, bgcolor: 'background.default' }}>
            <Button onClick={() => setQuickLookupOpen(false)} variant="outlined">
              Close
            </Button>
            <Button
              onClick={() => {
                if (searchQuery.trim()) {
                  handleSearch({ key: 'Enter' } as React.KeyboardEvent);
                }
              }}
              variant="contained"
              disabled={!searchQuery.trim()}
              sx={{
                bgcolor: '#000000',
                color: 'white',
                '&:hover': { bgcolor: '#333333' }
              }}
            >
              Search
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
}