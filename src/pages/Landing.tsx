import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  IconButton,
  Fade,
  Modal,
  TextField,
  MenuItem,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Avatar,
  AvatarGroup,
  Divider
} from '@mui/material';
import {
  ArrowForward as ArrowForwardIcon,
  TrendingUp as TrendingUpIcon,
  Speed as SpeedIcon,
  Security as SecurityIcon,
  Analytics as AnalyticsIcon,
  AutoGraph as AutoGraphIcon,
  Groups as GroupsIcon,
  Close as CloseIcon,
  Check as CheckIcon,
  Star as StarIcon,
  KeyboardArrowDown as ArrowDownIcon,
  Menu as MenuIcon,
  PlayArrow as PlayIcon,
  Dashboard as DashboardIcon,
  Assessment as AssessmentIcon,
  Business as BusinessIcon,
  IntegrationInstructions as IntegrationIcon,
  CloudUpload as CloudUploadIcon,
  Psychology as AIIcon,
  Lightbulb as InsightIcon,
  Timeline as TimelineIcon,
  WorkspacePremium as PremiumIcon,
  EmojiEvents as TrophyIcon,
  Rocket as RocketIcon,
  AccountBalance as FundraisingIcon,
  Search as SourcingIcon,
  Assessment as PortfolioIcon,
  PersonAdd as LeadGenerationIcon,
  Email as EmailIcon,
  Storage as StorageIcon,
  Cloud as CloudIcon,
  Api as ApiIcon,
  Webhook as WebhookIcon,
  Link as LinkIcon,
  Sync as SyncIcon,
  Settings as SettingsIcon,
  Extension as ExtensionIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import MarketingHeader from '../components/MarketingHeader';
import Footer from '../components/Footer';


export default function Landing() {
  const navigate = useNavigate();
  const [openDemo, setOpenDemo] = useState(false);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [fade, setFade] = useState(true);
  
  const cyclingWords = [
    'Voicemails',
    'Investor Communication',
    'Lead Generation',
    'Outreach',
    'Data Population',
    'Deal Tracking'
  ];

  useEffect(() => {
    document.title = 'Home - Equitle';
  }, []);

  // Cycle through words with fade animation
  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setCurrentWordIndex((prevIndex) => (prevIndex + 1) % cyclingWords.length);
        setFade(true);
      }, 500);
    }, 3000);

    return () => clearInterval(interval);
  }, [cyclingWords.length]);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    company: '',
    role: '',
    fundSize: '',
    message: ''
  });


  const handleOpenDemo = () => setOpenDemo(true);
  const handleCloseDemo = () => setOpenDemo(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmitDemo = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Demo request:', formData);
    handleCloseDemo();
  };

  const features = [
    {
      icon: <AIIcon sx={{ fontSize: 40 }} />,
      title: 'The Brain',
      description: 'A central LLM that knows your entire pipeline and information, providing intelligent insights and recommendations.',
      benefits: ['Centralized intelligence', 'Pipeline awareness', 'Smart recommendations']
    },
    {
      icon: <SecurityIcon sx={{ fontSize: 40 }} />,
      title: 'Enterprise Security',
      description: 'Bank-grade security with SOC 2 compliance and end-to-end encryption.',
      benefits: ['Data encryption', 'Access controls', 'Audit trails']
    },
    {
      icon: <IntegrationIcon sx={{ fontSize: 40 }} />,
      title: 'Seamless Integrations',
      description: 'Connect with your existing tools and data sources for a truly unified workflow.',
      benefits: ['CRM integration', 'Data room sync', 'API access']
    }
  ];


  const useCases = [
    {
      title: 'Lead Generation',
      icon: <LeadGenerationIcon />,
      description: 'The software finds private market contacts for you and finds missing data',
      features: ['Finds contacts', 'Data enrichment', 'Missing data discovery']
    },
    {
      title: 'Sourcing',
      icon: <SourcingIcon />,
      description: 'Outreach, agentic voicemails, and relationship management',
      features: ['Outreach automation', 'Agentic voicemails', 'Relationship management']
    },
    {
      title: 'Fundraising',
      icon: <FundraisingIcon />,
      description: 'Manage LPs, quarterly reports, and communication',
      features: ['LP management', 'Quarterly reports', 'Communication management']
    }
  ];


  return (
    <>
      <MarketingHeader />

      {/* Hero Section */}
      <Box
        sx={{
          minHeight: '120vh',
          display: 'flex',
          alignItems: 'center',
          position: 'relative',
          overflow: 'hidden',
          background: 'linear-gradient(180deg, #000000 0%, #434343 100%)',
          color: '#FFFFFF',
          pt: { xs: 12, md: 14 }
        }}
      >
        <Container maxWidth={false} sx={{ px: { xs: 2, md: 4 } }}>
          <Box sx={{ textAlign: 'center' }}>
            <Fade in timeout={1000}>
              <Box>
                <Typography 
                  variant="h1" 
                  sx={{ 
                    fontFamily: "'Darker Grotesque', 'Outfit', 'Inter', 'Poppins', 'Roboto', 'Helvetica', 'Arial', sans-serif",
                    fontWeight: 600,
                    fontSize: { xs: '2.5rem', md: '4rem' },
                    lineHeight: 1.1,
                    mb: 3,
                    color: '#FFFFFF'
                  }}
                >
                   Close Faster with Automated
                    <Box 
                      component="span" 
                      sx={{ 
                        display: 'block',
                        background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        minHeight: { xs: '3rem', md: '4.5rem' },
                        opacity: fade ? 1 : 0,
                        transform: fade ? 'translateY(0)' : 'translateY(-10px)',
                        transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
                      }}
                    >
                      {cyclingWords[currentWordIndex]}
                    </Box>
                </Typography>
                <Typography variant="h5" sx={{ color: 'rgba(255, 255, 255, 0.8)', mb: 4, lineHeight: 1.6, maxWidth: 800, mx: 'auto' }}>
                  AI-native software designed to automate your search, helping you acquire great companies.
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
                  <Button 
                    variant="contained" 
                    size="large"
                    endIcon={<ArrowForwardIcon />}
                    onClick={() => window.open('https://calendly.com/contact-equitle/pe-firm-partnership-meeting-equitle', '_blank')}
                    sx={{
                      background: `
                        linear-gradient(180deg, rgba(16, 185, 129, 0.6) 0%, rgba(5, 150, 105, 0.6) 30%, rgba(4, 120, 87, 0.6) 70%, rgba(6, 78, 59, 0.6) 100%),
                        radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%),
                        radial-gradient(circle at 80% 20%, rgba(255,255,255,0.05) 0%, transparent 50%),
                        radial-gradient(circle at 40% 80%, rgba(0,0,0,0.1) 0%, transparent 50%)
                      `,
                      backdropFilter: 'blur(10px)',
                      color: '#FFFFFF',
                      py: 1.8,
                      px: 6,
                      border: '1px solid rgba(16, 185, 129, 0.4)',
                      position: 'relative',
                      overflow: 'hidden',
                      '&:hover': {
                        background: `
                          linear-gradient(180deg, rgba(16, 185, 129, 0.8) 0%, rgba(5, 150, 105, 0.8) 30%, rgba(4, 120, 87, 0.8) 70%, rgba(6, 78, 59, 0.8) 100%),
                          radial-gradient(circle at 20% 50%, rgba(255,255,255,0.15) 0%, transparent 50%),
                          radial-gradient(circle at 80% 20%, rgba(255,255,255,0.08) 0%, transparent 50%),
                          radial-gradient(circle at 40% 80%, rgba(0,0,0,0.15) 0%, transparent 50%)
                        `
                      },
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
                      },
                      fontSize: '1.1rem',
                      fontWeight: 600
                    }}
                  >
                    Book Demo
                  </Button>
                </Box>
              </Box>
            </Fade>
          </Box>
          
          {/* Demo Section - Below Text in Hero */}
          <Box
            sx={{
              position: 'relative',
              width: '100%',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              mt: 6,
              mb: 8
            }}
          >
            {/* Green Backdrop Rectangle - Behind and Below */}
            <Box
              sx={{
                position: 'absolute',
                left: '50%',
                top: '70%',
                transform: 'translate(-50%, -50%)',
                width: { xs: '90%', md: '80%' },
                height: { xs: '400px', md: '550px' },
                background: `
                  linear-gradient(180deg, rgba(16, 185, 129, 0.6) 0%, rgba(5, 150, 105, 0.6) 30%, rgba(4, 120, 87, 0.6) 70%, rgba(6, 78, 59, 0.6) 100%),
                  radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%),
                  radial-gradient(circle at 80% 20%, rgba(255,255,255,0.05) 0%, transparent 50%),
                  radial-gradient(circle at 40% 80%, rgba(0,0,0,0.1) 0%, transparent 50%)
                `,
                backdropFilter: 'blur(10px)',
                borderRadius: '20px',
                zIndex: 1,
                border: '1px solid rgba(16, 185, 129, 0.4)',
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
                  zIndex: 1,
                  borderRadius: '20px'
                }
              }}
            />
            
            {/* Main Black Demo Rectangle - On Top */}
            <Box
              sx={{
                position: 'relative',
                width: { xs: '90%', md: '75%' },
                height: { xs: '400px', md: '550px' },
                backgroundColor: '#000000',
                borderRadius: '12px 12px 0 0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 2
              }}
            >
              <Typography variant="h6" sx={{ color: '#FFFFFF', textAlign: 'center' }}>
                Demo Video Placeholder
              </Typography>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Use Cases Section */}
      <Box sx={{ py: 12, background: 'linear-gradient(180deg, #000000 0%, #434343 100%)', color: '#FFFFFF' }}>
        <Container maxWidth={false} sx={{ px: { xs: 2, md: 4 } }}>
          <Box sx={{ textAlign: 'center', mb: 8 }}>
            <Typography 
              variant="h2" 
              sx={{ 
                fontFamily: "'Darker Grotesque', 'Outfit', 'Inter', 'Poppins', 'Roboto', 'Helvetica', 'Arial', sans-serif",
                fontWeight: 700,
                mb: 2,
                color: '#FFFFFF'
              }}
            >
              Built for Every Stage of Your Deal
            </Typography>
            <Typography variant="h6" sx={{ color: 'rgba(255, 255, 255, 0.8)', maxWidth: 700, mx: 'auto' }}>
              From sourcing to management, Equitle provides the tools and intelligence you need at every step
            </Typography>
          </Box>

          <Grid container spacing={4} justifyContent="center">
            {useCases.map((useCase, index) => (
              <Grid item xs={12} md={3} key={index}>
                <Card
                  sx={{
                    height: '100%',
                    p: 4,
                    textAlign: 'center',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '2px solid #000000',
                    borderRadius: 0,
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    position: 'relative',
                    '&:hover': {
                      background: `
                        linear-gradient(180deg, rgba(16, 185, 129, 0.6) 0%, rgba(5, 150, 105, 0.6) 30%, rgba(4, 120, 87, 0.6) 70%, rgba(6, 78, 59, 0.6) 100%),
                        radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%),
                        radial-gradient(circle at 80% 20%, rgba(255,255,255,0.05) 0%, transparent 50%),
                        radial-gradient(circle at 40% 80%, rgba(0,0,0,0.1) 0%, transparent 50%)
                      `,
                      backdropFilter: 'blur(10px)',
                      transform: 'none',
                      boxShadow: 'none',
                      opacity: 0.8,
                      '& svg': {
                        color: '#FFFFFF'
                      },
                      '& button .MuiSvgIcon-root': {
                        color: '#000000 !important'
                      },
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
                      }
                    }
                  }}
                >
                  <Box
                    sx={{
                      width: 80,
                      height: 80,
                      borderRadius: '50%',
                      background: 'rgba(16, 185, 129, 0.1)',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mx: 'auto',
                      mb: 3,
                      '& svg': {
                        color: '#10B981',
                        transition: 'color 0.3s ease'
                      }
                    }}
                  >
                    {useCase.icon}
                  </Box>
                  
                  <Typography 
                    variant="h5" 
                    sx={{ 
                      fontWeight: 600, 
                      mb: 2,
                      color: '#FFFFFF'
                    }}
                  >
                    {useCase.title}
                  </Typography>
                  
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      color: 'rgba(255, 255, 255, 0.8)', 
                      mb: 3,
                      lineHeight: 1.6
                    }}
                  >
                    {useCase.description}
                  </Typography>
                  
                  <List sx={{ mb: 3, textAlign: 'left' }}>
                    {useCase.features.map((feature, idx) => (
                      <ListItem key={idx} sx={{ px: 0, py: 0.5 }}>
                        <ListItemIcon sx={{ minWidth: 32 }}>
                          <CheckIcon sx={{ color: '#10B981', fontSize: 20 }} />
                        </ListItemIcon>
                        <ListItemText 
                          primary={feature}
                          sx={{ 
                            '& .MuiListItemText-primary': {
                              fontSize: '0.95rem',
                              fontWeight: 500,
                              color: 'rgba(255, 255, 255, 0.8)'
                            }
                          }}
                        />
                      </ListItem>
                    ))}
                  </List>
                  
                  <Button 
                    variant="outlined"
                    endIcon={<ArrowForwardIcon />}
                    sx={{ 
                      mt: 2,
                      backgroundColor: '#FFFFFF',
                      color: '#000000',
                      borderColor: '#FFFFFF',
                      '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        borderColor: '#FFFFFF'
                      },
                      '& .MuiSvgIcon-root': {
                        color: '#000000'
                      }
                    }}
                    onClick={() => navigate('/product')}
                  >
                    Learn More
                  </Button>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Integration Section */}
      <Box sx={{ py: 16, background: 'linear-gradient(180deg, #000000 0%, #434343 100%)', color: '#FFFFFF' }}>
        <Container maxWidth={false} sx={{ px: { xs: 2, md: 4 } }}>
          <Grid container spacing={6} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography 
                variant="h2" 
                sx={{ 
                  fontFamily: "'Darker Grotesque', 'Outfit', 'Inter', 'Poppins', 'Roboto', 'Helvetica', 'Arial', sans-serif",
                  fontWeight: 700,
                  mb: 3
                }}
              >
                Integrate Your Stack
              </Typography>
              <Typography variant="h6" sx={{ color: '#FFFFFF', mb: 4, lineHeight: 1.6 }}>
                Connect with your existing tools effortlessly. Our platform makes integration simple and straightforward, so you can focus on what matters most.
              </Typography>
              <List>
                {['Data Providers', 'Google Suite', 'Microsoft 365', 'Financial & Reporting Systems'].map((integration, index) => (
                  <ListItem key={index} sx={{ px: 0 }}>
                    <ListItemIcon>
                      <CheckIcon sx={{ color: '#10B981' }} />
                    </ListItemIcon>
                    <ListItemText primary={integration} />
                  </ListItem>
                ))}
              </List>
              <Button 
                variant="outlined" 
                endIcon={<ArrowForwardIcon />}
                sx={{ 
                  mt: 2,
                  backgroundColor: '#FFFFFF',
                  color: '#000000',
                  borderColor: '#FFFFFF',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    borderColor: '#FFFFFF'
                  },
                  '& .MuiSvgIcon-root': {
                    color: '#000000'
                  }
                }}
                onClick={() => navigate('/product')}
              >
                Learn More About Integrations
              </Button>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: 3
                }}
              >
                {[
                  <EmailIcon />,
                  <StorageIcon />,
                  <CloudIcon />,
                  <ApiIcon />,
                  <WebhookIcon />,
                  <LinkIcon />,
                  <SyncIcon />,
                  <SettingsIcon />,
                  <ExtensionIcon />
                ].map((icon, index) => (
                  <Box
                    key={index}
                    sx={{
                      height: 100,
                      borderRadius: 0,
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '2px solid #000000',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      position: 'relative',
                      '&:hover': {
                        background: `
                          linear-gradient(180deg, rgba(16, 185, 129, 0.6) 0%, rgba(5, 150, 105, 0.6) 30%, rgba(4, 120, 87, 0.6) 70%, rgba(6, 78, 59, 0.6) 100%),
                          radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%),
                          radial-gradient(circle at 80% 20%, rgba(255,255,255,0.05) 0%, transparent 50%),
                          radial-gradient(circle at 40% 80%, rgba(0,0,0,0.1) 0%, transparent 50%)
                        `,
                        backdropFilter: 'blur(10px)',
                        transform: 'none',
                        boxShadow: 'none',
                        opacity: 0.8,
                        '& .integration-icon': {
                          color: '#FFFFFF'
                        },
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
                        }
                      }
                    }}
                  >
                    <Box
                      className="integration-icon"
                      sx={{
                        fontSize: 40,
                        color: 'rgba(255, 255, 255, 0.8)',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      {icon}
                    </Box>
                  </Box>
                ))}
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* CTA Section */}
      <Box 
        sx={{ 
          py: 16, 
          background: '#000000',
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
              linear-gradient(180deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.1) 30%, rgba(4, 120, 87, 0.1) 70%, rgba(6, 78, 59, 0.1) 100%),
              radial-gradient(circle at 20% 50%, rgba(16, 185, 129, 0.05) 0%, transparent 50%),
              radial-gradient(circle at 80% 20%, rgba(5, 150, 105, 0.03) 0%, transparent 50%),
              radial-gradient(circle at 40% 80%, rgba(4, 120, 87, 0.02) 0%, transparent 50%)
            `,
            pointerEvents: 'none',
            zIndex: 0
          },
          '&::after': {
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
                rgba(16, 185, 129, 0.02) 2px,
                rgba(16, 185, 129, 0.02) 4px
              ),
              repeating-linear-gradient(
                90deg,
                transparent,
                transparent 2px,
                rgba(5, 150, 105, 0.01) 2px,
                rgba(5, 150, 105, 0.01) 4px
              )
            `,
            pointerEvents: 'none',
            zIndex: 0
          }
        }}
      >
        <Container maxWidth="md">
          <Box sx={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
            <Typography 
              variant="h2" 
              sx={{ 
                fontFamily: "'Darker Grotesque', 'Outfit', 'Inter', 'Poppins', 'Roboto', 'Helvetica', 'Arial', sans-serif",
                fontWeight: 700,
                color: '#FFFFFF',
                mb: 2
              }}
            >
              Ready to Accelerate Your Sourcing?
            </Typography>
            <Typography variant="h6" sx={{ color: 'rgba(255, 255, 255, 0.8)', mb: 4 }}>
              Join a community of searchers and discover how Equitle can transform your deal process
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
              <Button 
                variant="contained" 
                size="large"
                onClick={() => window.open('https://calendly.com/contact-equitle/pe-firm-partnership-meeting-equitle', '_blank')}
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
                  py: 2,
                  px: 5,
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  position: 'relative',
                  overflow: 'hidden',
                  '&:hover': {
                    background: `
                      linear-gradient(180deg, rgba(16, 185, 129, 0.8) 0%, rgba(5, 150, 105, 0.8) 30%, rgba(4, 120, 87, 0.8) 70%, rgba(6, 78, 59, 0.8) 100%),
                      radial-gradient(circle at 20% 50%, rgba(255,255,255,0.15) 0%, transparent 50%),
                      radial-gradient(circle at 80% 20%, rgba(255,255,255,0.08) 0%, transparent 50%),
                      radial-gradient(circle at 40% 80%, rgba(0,0,0,0.15) 0%, transparent 50%)
                    `
                  },
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
            </Box>
          </Box>
        </Container>
      </Box>

      <Footer />

      {/* Demo Modal */}
      <Modal
        open={openDemo}
        onClose={handleCloseDemo}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Box
          sx={{
            background: 'white',
            borderRadius: 3,
            width: { xs: '90%', md: 600 },
            maxHeight: '90vh',
            overflow: 'auto',
            p: 4,
            position: 'relative'
          }}
        >
          <IconButton
            onClick={handleCloseDemo}
            sx={{
              position: 'absolute',
              top: 16,
              right: 16
            }}
          >
            <CloseIcon />
          </IconButton>

          <Typography variant="h4" sx={{ fontFamily: '"Space Grotesk", sans-serif', fontWeight: 700, mb: 1 }}>
            Book Your Demo
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            See how Equitle can transform your investment process.
          </Typography>

          <form onSubmit={handleSubmitDemo}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  name="firstName"
                  label="First Name"
                  value={formData.firstName}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  name="lastName"
                  label="Last Name"
                  value={formData.lastName}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  required
                  type="email"
                  name="email"
                  label="Work Email"
                  value={formData.email}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  required
                  name="company"
                  label="Company"
                  value={formData.company}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  select
                  name="role"
                  label="Role"
                  value={formData.role}
                  onChange={handleInputChange}
                >
                  <MenuItem value="partner">Partner</MenuItem>
                  <MenuItem value="principal">Principal</MenuItem>
                  <MenuItem value="associate">Associate</MenuItem>
                  <MenuItem value="analyst">Analyst</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  select
                  name="fundSize"
                  label="Fund Size"
                  value={formData.fundSize}
                  onChange={handleInputChange}
                >
                  <MenuItem value="<100M">&lt; $100M</MenuItem>
                  <MenuItem value="100M-500M">$100M - $500M</MenuItem>
                  <MenuItem value="500M-1B">$500M - $1B</MenuItem>
                  <MenuItem value="1B-5B">$1B - $5B</MenuItem>
                  <MenuItem value=">5B">&gt; $5B</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  name="message"
                  label="How can we help you? (Optional)"
                  value={formData.message}
                  onChange={handleInputChange}
                />
              </Grid>
            </Grid>

            <Button
              type="submit"
              variant="contained"
              fullWidth
              size="large"
              sx={{
                mt: 3,
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                py: 1.5,
                fontWeight: 600,
                fontSize: '1.05rem'
              }}
            >
              Submit Request
            </Button>
          </form>
        </Box>
      </Modal>

      <style>
        {`
          @keyframes float {
            0%, 100% {
              transform: translateY(0);
            }
            50% {
              transform: translateY(-30px);
            }
          }
        `}
      </style>
    </>
  );
}