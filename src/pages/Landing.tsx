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
  Zoom,
  Modal,
  TextField,
  MenuItem,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Tab,
  Tabs,
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
  CloudUpload as CloudIcon,
  Psychology as AIIcon,
  Lightbulb as InsightIcon,
  Timeline as TimelineIcon,
  WorkspacePremium as PremiumIcon,
  EmojiEvents as TrophyIcon,
  Rocket as RocketIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box>{children}</Box>}
    </div>
  );
}

export default function Landing() {
  const navigate = useNavigate();
  const [openDemo, setOpenDemo] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    company: '',
    role: '',
    fundSize: '',
    message: ''
  });

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 50;
      setScrolled(isScrolled);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
      title: 'AI-Powered Deal Intelligence',
      description: 'Leverage advanced AI to analyze deals, predict outcomes, and identify opportunities faster than ever before.',
      benefits: ['Automated due diligence', 'Risk assessment', 'Market analysis']
    },
    {
      icon: <DashboardIcon sx={{ fontSize: 40 }} />,
      title: 'Unified Deal Platform',
      description: 'Manage your entire deal lifecycle in one integrated platform designed specifically for private equity.',
      benefits: ['Pipeline management', 'Document management', 'Collaboration tools']
    },
    {
      icon: <AnalyticsIcon sx={{ fontSize: 40 }} />,
      title: 'Advanced Analytics',
      description: 'Get deep insights into portfolio performance with real-time analytics and customizable dashboards.',
      benefits: ['Performance tracking', 'Custom reports', 'Predictive analytics']
    },
    {
      icon: <IntegrationIcon sx={{ fontSize: 40 }} />,
      title: 'Seamless Integrations',
      description: 'Connect with your existing tools and data sources for a truly unified workflow.',
      benefits: ['CRM integration', 'Data room sync', 'API access']
    },
    {
      icon: <SecurityIcon sx={{ fontSize: 40 }} />,
      title: 'Enterprise Security',
      description: 'Bank-grade security with SOC 2 compliance and end-to-end encryption.',
      benefits: ['Data encryption', 'Access controls', 'Audit trails']
    },
    {
      icon: <GroupsIcon sx={{ fontSize: 40 }} />,
      title: 'Team Collaboration',
      description: 'Work seamlessly with your team with built-in collaboration tools and workflow automation.',
      benefits: ['Real-time collaboration', 'Task management', 'Communication hub']
    }
  ];

  const stats = [
    { value: '$2.4T', label: 'Assets Analyzed' },
    { value: '150+', label: 'PE Firms' },
    { value: '10,000+', label: 'Deals Processed' },
    { value: '99.9%', label: 'Uptime' }
  ];

  const useCases = [
    {
      title: 'Deal Sourcing',
      icon: <BusinessIcon />,
      description: 'Find and evaluate the best opportunities faster',
      features: ['AI-powered deal matching', 'Market intelligence', 'Competitor analysis']
    },
    {
      title: 'Due Diligence',
      icon: <AssessmentIcon />,
      description: 'Streamline your diligence process with AI assistance',
      features: ['Automated document review', 'Risk identification', 'Data room management']
    },
    {
      title: 'Portfolio Management',
      icon: <TimelineIcon />,
      description: 'Monitor and optimize portfolio performance',
      features: ['KPI tracking', 'Value creation planning', 'Exit planning']
    }
  ];

  const testimonials = [
    {
      quote: "Equitle has transformed how we manage our deal flow. The AI insights have helped us identify opportunities we would have missed.",
      author: "Sarah Chen",
      role: "Managing Partner",
      company: "Apex Capital Partners",
      avatar: "SC"
    },
    {
      quote: "The platform's integration capabilities saved us hundreds of hours in data management and reporting.",
      author: "Michael Roberts",
      role: "Principal",
      company: "Venture Growth Fund",
      avatar: "MR"
    },
    {
      quote: "Best-in-class security and compliance features gave us the confidence to fully digitize our deal process.",
      author: "Elena Martinez",
      role: "COO",
      company: "Global PE Advisors",
      avatar: "EM"
    }
  ];

  return (
    <>
      {/* Floating Glass Header */}
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1300,
          padding: { xs: '1rem 12px', md: '12px 16px' },
          pointerEvents: 'none'
        }}
      >
        <Container maxWidth="lg">
          <Box
            sx={{
              pointerEvents: 'auto',
              margin: '0 auto',
              width: '100%',
              padding: { xs: '1rem 1.25rem', md: '1.25rem 1.5rem' },
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: scrolled ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'saturate(180%) blur(20px)',
              border: '1px solid rgba(94, 92, 230, 0.08)',
              borderRadius: { xs: '12px', md: '14px' },
              boxShadow: scrolled 
                ? '0 8px 32px rgba(0, 0, 0, 0.12)' 
                : '0 4px 24px rgba(0, 0, 0, 0.08)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          >
             <Box
               component="img"
               src="/assets/images/extended_logo_black_white.png"
               alt="Equitle"
               sx={{
                 height: { xs: '2.25rem', md: '2.75rem' },
                 filter: 'brightness(0)',
                 opacity: 0.95,
                 objectFit: 'contain',
                 mr: { xs: '2rem', md: '4rem' },
                 cursor: 'pointer'
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
                    color: 'secondary.main',
                    bgcolor: 'rgba(94, 92, 230, 0.04)'
                  }
                }}
              >
                Product
              </Button>
              <Button 
                onClick={() => navigate('/solutions')}
                sx={{ 
                  color: 'text.primary',
                  fontWeight: 500,
                  fontSize: '0.9rem',
                  textTransform: 'none',
                  '&:hover': {
                    color: 'secondary.main',
                    bgcolor: 'rgba(94, 92, 230, 0.04)'
                  }
                }}
              >
                Solutions
              </Button>
              <Button 
                onClick={() => navigate('/pricing')}
                sx={{ 
                  color: 'text.primary',
                  fontWeight: 500,
                  fontSize: '0.9rem',
                  textTransform: 'none',
                  '&:hover': {
                    color: 'secondary.main',
                    bgcolor: 'rgba(94, 92, 230, 0.04)'
                  }
                }}
              >
                Pricing
              </Button>
              <Button 
                onClick={() => navigate('/resources')}
                sx={{ 
                  color: 'text.primary',
                  fontWeight: 500,
                  fontSize: '0.9rem',
                  textTransform: 'none',
                  '&:hover': {
                    color: 'secondary.main',
                    bgcolor: 'rgba(94, 92, 230, 0.04)'
                  }
                }}
              >
                Resources
              </Button>
            </Box>

            <Box sx={{ flexGrow: 0, display: 'flex', gap: 2 }}>
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
                onClick={handleOpenDemo}
                sx={{
                  background: 'linear-gradient(135deg, #5E5CE6 0%, #7C7AED 100%)',
                  boxShadow: '0 4px 14px rgba(94, 92, 230, 0.3)',
                  fontWeight: 600,
                  px: 3
                }}
              >
                Book Demo
              </Button>
              <IconButton sx={{ display: { xs: 'flex', md: 'none' } }}>
                <MenuIcon />
              </IconButton>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Hero Section */}
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          position: 'relative',
          overflow: 'hidden',
          background: 'linear-gradient(135deg, #FFFFFF 0%, #F8F8FF 100%)',
          pt: { xs: 12, md: 14 }
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={6} alignItems="center">
            <Grid item xs={12} md={6}>
              <Fade in timeout={1000}>
                <Box>
                  <Chip 
                    icon={<RocketIcon sx={{ fontSize: 16 }} />}
                    label="Backed by Y Combinator" 
                    sx={{ 
                      mb: 3,
                      background: 'linear-gradient(135deg, rgba(94, 92, 230, 0.1) 0%, rgba(124, 122, 237, 0.1) 100%)',
                      border: '1px solid rgba(94, 92, 230, 0.2)',
                      fontWeight: 600
                    }}
                  />
                  <Typography 
                    variant="h1" 
                    sx={{ 
                      fontFamily: '"Space Grotesk", sans-serif',
                      fontWeight: 800,
                      fontSize: { xs: '2.5rem', md: '4rem' },
                      lineHeight: 1.1,
                      mb: 3
                    }}
                  >
                    The AI-Powered Platform for
                    <Box 
                      component="span" 
                      sx={{ 
                        background: 'linear-gradient(135deg, #5E5CE6 0%, #7C7AED 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                      }}
                    >
                      {' '}Private Equity Excellence
                    </Box>
                  </Typography>
                  <Typography variant="h5" sx={{ color: 'text.secondary', mb: 4, lineHeight: 1.6 }}>
                    Transform your deal flow with intelligent automation. From sourcing to exit, Equitle delivers the insights and efficiency you need to win.
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
                    <Button 
                      variant="contained" 
                      size="large"
                      endIcon={<ArrowForwardIcon />}
                      onClick={handleOpenDemo}
                      sx={{
                        background: 'linear-gradient(135deg, #5E5CE6 0%, #7C7AED 100%)',
                        py: 1.8,
                        px: 4,
                        fontSize: '1.1rem'
                      }}
                    >
                      Start Free Trial
                    </Button>
                    <Button 
                      variant="outlined" 
                      size="large"
                      startIcon={<PlayIcon />}
                      sx={{
                        borderWidth: 2,
                        py: 1.8,
                        px: 4,
                        fontSize: '1.1rem'
                      }}
                    >
                      Watch Demo
                    </Button>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {['No credit card required', '14-day free trial', 'Cancel anytime'].map((text, index) => (
                      <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CheckIcon sx={{ color: 'success.main', fontSize: 20 }} />
                        <Typography variant="body2" color="text.secondary">
                          {text}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>
              </Fade>
            </Grid>
            <Grid item xs={12} md={6}>
              <Zoom in timeout={1200}>
                <Box
                  sx={{
                    position: 'relative',
                    height: { xs: 400, md: 500 },
                    transform: 'perspective(1000px) rotateY(-5deg)',
                    '&:hover': {
                      transform: 'perspective(1000px) rotateY(0deg)'
                    },
                    transition: 'transform 0.6s ease'
                  }}
                >
                  <Box
                    component="img"
                    src="/assets/images/dashboard-preview.png"
                    alt="Dashboard Preview"
                    sx={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      borderRadius: 3,
                      boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)'
                    }}
                    onError={(e) => {
                      // Fallback to placeholder if image doesn't exist
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.parentElement!.style.background = 'linear-gradient(135deg, #F0F0FF 0%, #FFFFFF 100%)';
                      e.currentTarget.parentElement!.style.border = '1px solid rgba(94, 92, 230, 0.1)';
                    }}
                  />
                </Box>
              </Zoom>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Trusted By Section */}
      <Box sx={{ py: 8, background: '#FAFAFA', borderTop: '1px solid rgba(0, 0, 0, 0.05)' }}>
        <Container maxWidth="lg">
          <Typography 
            variant="body1" 
            align="center" 
            sx={{ mb: 4, color: 'text.secondary', fontWeight: 500 }}
          >
            TRUSTED BY LEADING PRIVATE EQUITY FIRMS
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            {['KKR', 'Blackstone', 'Apollo', 'Carlyle', 'TPG'].map((firm) => (
              <Typography 
                key={firm} 
                variant="h5" 
                sx={{ 
                  fontWeight: 600, 
                  color: 'text.secondary',
                  opacity: 0.6,
                  '&:hover': {
                    opacity: 1,
                    color: 'secondary.main'
                  },
                  transition: 'all 0.3s ease'
                }}
              >
                {firm}
              </Typography>
            ))}
          </Box>
        </Container>
      </Box>

      {/* Stats Section */}
      <Box sx={{ py: 12, background: 'white' }}>
        <Container maxWidth="lg">
          <Grid container spacing={4}>
            {stats.map((stat, index) => (
              <Grid item xs={6} md={3} key={index}>
                <Fade in timeout={1000 + index * 200}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography 
                      variant="h2" 
                      sx={{ 
                        fontFamily: '"Space Grotesk", sans-serif',
                        fontWeight: 700,
                        background: 'linear-gradient(135deg, #5E5CE6 0%, #7C7AED 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        mb: 1
                      }}
                    >
                      {stat.value}
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
                      {stat.label}
                    </Typography>
                  </Box>
                </Fade>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Use Cases Section */}
      <Box sx={{ py: 12, background: '#FAFAFA' }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 8 }}>
            <Typography 
              variant="h2" 
              sx={{ 
                fontFamily: '"Space Grotesk", sans-serif',
                fontWeight: 700,
                mb: 2
              }}
            >
              Built for Every Stage of Your Deal
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 700, mx: 'auto' }}>
              From sourcing to exit, Equitle provides the tools and intelligence you need at every step
            </Typography>
          </Box>

          <Tabs 
            value={tabValue} 
            onChange={(e, v) => setTabValue(v)} 
            centered
            sx={{ mb: 6 }}
          >
            {useCases.map((useCase, index) => (
              <Tab 
                key={index}
                label={useCase.title} 
                icon={useCase.icon}
                iconPosition="start"
                sx={{ 
                  textTransform: 'none',
                  fontSize: '1rem',
                  fontWeight: 500,
                  minHeight: 64,
                  px: 3
                }}
              />
            ))}
          </Tabs>

          {useCases.map((useCase, index) => (
            <TabPanel key={index} value={tabValue} index={index}>
              <Fade in timeout={500}>
                <Grid container spacing={6} alignItems="center">
                  <Grid item xs={12} md={6}>
                    <Typography variant="h4" sx={{ fontWeight: 600, mb: 3 }}>
                      {useCase.description}
                    </Typography>
                    <List>
                      {useCase.features.map((feature, idx) => (
                        <ListItem key={idx} sx={{ px: 0 }}>
                          <ListItemIcon>
                            <CheckIcon sx={{ color: 'success.main' }} />
                          </ListItemIcon>
                          <ListItemText 
                            primary={feature}
                            sx={{ 
                              '& .MuiListItemText-primary': {
                                fontSize: '1.1rem',
                                fontWeight: 500
                              }
                            }}
                          />
                        </ListItem>
                      ))}
                    </List>
                    <Button 
                      variant="contained"
                      endIcon={<ArrowForwardIcon />}
                      sx={{ mt: 3 }}
                      onClick={() => navigate('/product')}
                    >
                      Learn More
                    </Button>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Box
                      sx={{
                        height: 400,
                        borderRadius: 3,
                        background: 'linear-gradient(135deg, rgba(94, 92, 230, 0.05) 0%, rgba(124, 122, 237, 0.05) 100%)',
                        border: '1px solid rgba(94, 92, 230, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      {useCase.icon}
                    </Box>
                  </Grid>
                </Grid>
              </Fade>
            </TabPanel>
          ))}
        </Container>
      </Box>

      {/* Features Grid */}
      <Box sx={{ py: 12, background: 'white' }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 8 }}>
            <Typography 
              variant="h2" 
              sx={{ 
                fontFamily: '"Space Grotesk", sans-serif',
                fontWeight: 700,
                mb: 2
              }}
            >
              Everything You Need to Win
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
              Comprehensive tools designed by PE professionals, for PE professionals
            </Typography>
          </Box>

          <Grid container spacing={4}>
            {features.map((feature, index) => (
              <Grid item xs={12} md={6} lg={4} key={index}>
                <Zoom in timeout={1000 + index * 100}>
                  <Card
                    sx={{
                      p: 4,
                      height: '100%',
                      border: '1px solid rgba(94, 92, 230, 0.08)',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': {
                        transform: 'translateY(-8px)',
                        boxShadow: '0 20px 40px rgba(94, 92, 230, 0.15)',
                        border: '1px solid rgba(94, 92, 230, 0.2)',
                        '& .feature-icon': {
                          transform: 'scale(1.1) rotate(5deg)',
                          color: 'secondary.main'
                        }
                      }
                    }}
                  >
                    <Box
                      className="feature-icon"
                      sx={{
                        color: 'text.secondary',
                        mb: 3,
                        transition: 'all 0.3s ease'
                      }}
                    >
                      {feature.icon}
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                      {feature.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3, lineHeight: 1.7 }}>
                      {feature.description}
                    </Typography>
                    <List dense>
                      {feature.benefits.map((benefit, idx) => (
                        <ListItem key={idx} sx={{ px: 0, py: 0.5 }}>
                          <ListItemIcon sx={{ minWidth: 32 }}>
                            <CheckIcon sx={{ fontSize: 18, color: 'success.main' }} />
                          </ListItemIcon>
                          <ListItemText 
                            primary={benefit}
                            primaryTypographyProps={{
                              fontSize: '0.875rem',
                              color: 'text.secondary'
                            }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Card>
                </Zoom>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Testimonials */}
      <Box sx={{ py: 12, background: '#FAFAFA' }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 8 }}>
            <Typography 
              variant="h2" 
              sx={{ 
                fontFamily: '"Space Grotesk", sans-serif',
                fontWeight: 700,
                mb: 2
              }}
            >
              Loved by PE Professionals
            </Typography>
            <Typography variant="h6" color="text.secondary">
              See what industry leaders are saying about Equitle
            </Typography>
          </Box>

          <Grid container spacing={4}>
            {testimonials.map((testimonial, index) => (
              <Grid item xs={12} md={4} key={index}>
                <Fade in timeout={1000 + index * 200}>
                  <Card
                    sx={{
                      p: 4,
                      height: '100%',
                      position: 'relative',
                      border: '1px solid rgba(94, 92, 230, 0.08)',
                      '&:hover': {
                        boxShadow: '0 12px 32px rgba(94, 92, 230, 0.1)'
                      }
                    }}
                  >
                    <Box sx={{ display: 'flex', mb: 2 }}>
                      {[...Array(5)].map((_, i) => (
                        <StarIcon key={i} sx={{ fontSize: 20, color: '#FFB800' }} />
                      ))}
                    </Box>
                    <Typography variant="body1" sx={{ mb: 3, lineHeight: 1.8, fontStyle: 'italic' }}>
                      "{testimonial.quote}"
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ bgcolor: 'secondary.main' }}>
                        {testimonial.avatar}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                          {testimonial.author}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {testimonial.role}, {testimonial.company}
                        </Typography>
                      </Box>
                    </Box>
                  </Card>
                </Fade>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Integration Section */}
      <Box sx={{ py: 12, background: 'white' }}>
        <Container maxWidth="lg">
          <Grid container spacing={6} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography 
                variant="h2" 
                sx={{ 
                  fontFamily: '"Space Grotesk", sans-serif',
                  fontWeight: 700,
                  mb: 3
                }}
              >
                Seamlessly Integrates with Your Stack
              </Typography>
              <Typography variant="h6" color="text.secondary" sx={{ mb: 4, lineHeight: 1.6 }}>
                Connect Equitle with your existing tools and data sources for a unified workflow. Our platform integrates with leading CRMs, data rooms, and financial systems.
              </Typography>
              <List>
                {['Salesforce & HubSpot CRM', 'Datasite & Intralinks', 'PitchBook & Preqin', 'Microsoft 365 & Google Workspace'].map((integration, index) => (
                  <ListItem key={index} sx={{ px: 0 }}>
                    <ListItemIcon>
                      <IntegrationIcon sx={{ color: 'secondary.main' }} />
                    </ListItemIcon>
                    <ListItemText primary={integration} />
                  </ListItem>
                ))}
              </List>
              <Button 
                variant="outlined" 
                endIcon={<ArrowForwardIcon />}
                sx={{ mt: 2 }}
                onClick={() => navigate('/product')}
              >
                View All Integrations
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
                {[...Array(9)].map((_, index) => (
                  <Box
                    key={index}
                    sx={{
                      height: 100,
                      borderRadius: 2,
                      background: 'linear-gradient(135deg, rgba(94, 92, 230, 0.05) 0%, rgba(124, 122, 237, 0.05) 100%)',
                      border: '1px solid rgba(94, 92, 230, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'scale(1.05)',
                        boxShadow: '0 8px 24px rgba(94, 92, 230, 0.15)'
                      }
                    }}
                  >
                    <IntegrationIcon sx={{ color: 'text.secondary' }} />
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
          py: 12, 
          background: 'linear-gradient(135deg, #5E5CE6 0%, #7C7AED 100%)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <Container maxWidth="md">
          <Box sx={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
            <Chip 
              icon={<TrophyIcon sx={{ fontSize: 16 }} />}
              label="LIMITED TIME OFFER" 
              sx={{ 
                mb: 3,
                background: 'rgba(255, 255, 255, 0.2)',
                color: 'white',
                fontWeight: 600,
                border: '1px solid rgba(255, 255, 255, 0.3)'
              }}
            />
            <Typography 
              variant="h2" 
              sx={{ 
                fontFamily: '"Space Grotesk", sans-serif',
                fontWeight: 700,
                color: 'white',
                mb: 2
              }}
            >
              Start Your 14-Day Free Trial
            </Typography>
            <Typography variant="h6" sx={{ color: 'rgba(255, 255, 255, 0.9)', mb: 4 }}>
              Join 150+ PE firms already using Equitle to transform their deal process
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mb: 4 }}>
              <Button 
                variant="contained" 
                size="large"
                onClick={handleOpenDemo}
                sx={{
                  background: 'white',
                  color: 'secondary.main',
                  py: 2,
                  px: 5,
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  '&:hover': {
                    background: 'rgba(255, 255, 255, 0.95)'
                  }
                }}
              >
                Get Started Now
              </Button>
              <Button 
                variant="outlined" 
                size="large"
                sx={{
                  borderColor: 'white',
                  color: 'white',
                  py: 2,
                  px: 5,
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  '&:hover': {
                    borderColor: 'white',
                    background: 'rgba(255, 255, 255, 0.1)'
                  }
                }}
              >
                Schedule Demo
              </Button>
            </Box>
            <AvatarGroup max={5} sx={{ justifyContent: 'center', mb: 2 }}>
              {[...Array(8)].map((_, i) => (
                <Avatar key={i} sx={{ bgcolor: 'white', color: 'secondary.main' }}>
                  {String.fromCharCode(65 + i)}
                </Avatar>
              ))}
            </AvatarGroup>
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
              Join 1,284+ professionals already using Equitle
            </Typography>
          </Box>
        </Container>
      </Box>

      {/* Footer */}
      <Box sx={{ py: 8, background: '#0A0A0A', color: 'white' }}>
        <Container maxWidth="lg">
          <Grid container spacing={4}>
            <Grid item xs={12} md={4}>
              <Typography 
                variant="h5" 
                sx={{ 
                  fontFamily: '"Space Grotesk", sans-serif',
                  fontWeight: 700,
                  mb: 2
                }}
              >
                Equitle
              </Typography>
              <Typography variant="body2" sx={{ mb: 3, color: 'rgba(255, 255, 255, 0.7)' }}>
                The AI-powered platform transforming private equity deal management.
              </Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                {['LinkedIn', 'Twitter', 'GitHub'].map((social) => (
                  <Typography
                    key={social}
                    variant="body2"
                    sx={{
                      color: 'rgba(255, 255, 255, 0.7)',
                      cursor: 'pointer',
                      '&:hover': {
                        color: 'white'
                      }
                    }}
                  >
                    {social}
                  </Typography>
                ))}
              </Box>
            </Grid>
            <Grid item xs={6} md={2}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                Product
              </Typography>
              {['Features', 'Integrations', 'Security', 'Pricing'].map((item) => (
                <Typography
                  key={item}
                  variant="body2"
                  sx={{
                    color: 'rgba(255, 255, 255, 0.7)',
                    mb: 1,
                    cursor: 'pointer',
                    '&:hover': {
                      color: 'white'
                    }
                  }}
                >
                  {item}
                </Typography>
              ))}
            </Grid>
            <Grid item xs={6} md={2}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                Solutions
              </Typography>
              {['Deal Sourcing', 'Due Diligence', 'Portfolio Management', 'LP Reporting'].map((item) => (
                <Typography
                  key={item}
                  variant="body2"
                  sx={{
                    color: 'rgba(255, 255, 255, 0.7)',
                    mb: 1,
                    cursor: 'pointer',
                    '&:hover': {
                      color: 'white'
                    }
                  }}
                >
                  {item}
                </Typography>
              ))}
            </Grid>
            <Grid item xs={6} md={2}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                Company
              </Typography>
              {['About', 'Careers', 'Blog', 'Contact'].map((item) => (
                <Typography
                  key={item}
                  variant="body2"
                  sx={{
                    color: 'rgba(255, 255, 255, 0.7)',
                    mb: 1,
                    cursor: 'pointer',
                    '&:hover': {
                      color: 'white'
                    }
                  }}
                >
                  {item}
                </Typography>
              ))}
            </Grid>
            <Grid item xs={6} md={2}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                Resources
              </Typography>
              {['Documentation', 'API', 'Support', 'Status'].map((item) => (
                <Typography
                  key={item}
                  variant="body2"
                  sx={{
                    color: 'rgba(255, 255, 255, 0.7)',
                    mb: 1,
                    cursor: 'pointer',
                    '&:hover': {
                      color: 'white'
                    }
                  }}
                >
                  {item}
                </Typography>
              ))}
            </Grid>
          </Grid>
          <Divider sx={{ my: 4, borderColor: 'rgba(255, 255, 255, 0.1)' }} />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
              © 2024 Equitle. All rights reserved.
            </Typography>
            <Box sx={{ display: 'flex', gap: 3 }}>
              {['Privacy Policy', 'Terms of Service', 'Cookie Policy'].map((item) => (
                <Typography
                  key={item}
                  variant="body2"
                  sx={{
                    color: 'rgba(255, 255, 255, 0.5)',
                    cursor: 'pointer',
                    '&:hover': {
                      color: 'white'
                    }
                  }}
                >
                  {item}
                </Typography>
              ))}
            </Box>
          </Box>
        </Container>
      </Box>

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
                background: 'linear-gradient(135deg, #5E5CE6 0%, #7C7AED 100%)',
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