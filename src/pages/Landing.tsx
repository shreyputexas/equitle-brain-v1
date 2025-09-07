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
  useScrollTrigger,
  Slide,
  AppBar,
  Toolbar
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
  Menu as MenuIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

interface HideOnScrollProps {
  children: React.ReactElement;
}

function HideOnScroll(props: HideOnScrollProps) {
  const { children } = props;
  const trigger = useScrollTrigger();

  return (
    <Slide appear={false} direction="down" in={!trigger}>
      {children}
    </Slide>
  );
}

export default function Landing() {
  const navigate = useNavigate();
  const [openDemo, setOpenDemo] = useState(false);
  const [scrolled, setScrolled] = useState(false);
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
    // TODO: Implement backend submission
  };

  const features = [
    {
      icon: <AutoGraphIcon sx={{ fontSize: 40 }} />,
      title: 'AI-Powered Insights',
      description: 'Leverage advanced AI to analyze deals, predict outcomes, and identify opportunities faster than ever before.'
    },
    {
      icon: <SpeedIcon sx={{ fontSize: 40 }} />,
      title: 'Lightning Fast',
      description: 'Process and analyze thousands of data points in seconds, giving you the edge in competitive deal environments.'
    },
    {
      icon: <SecurityIcon sx={{ fontSize: 40 }} />,
      title: 'Bank-Grade Security',
      description: 'Your data is protected with enterprise-level encryption and compliance with global security standards.'
    },
    {
      icon: <AnalyticsIcon sx={{ fontSize: 40 }} />,
      title: 'Real-Time Analytics',
      description: 'Monitor portfolio performance with live dashboards and customizable reports that update in real-time.'
    },
    {
      icon: <GroupsIcon sx={{ fontSize: 40 }} />,
      title: 'Team Collaboration',
      description: 'Work seamlessly with your team with built-in collaboration tools and intelligent workflow automation.'
    },
    {
      icon: <TrendingUpIcon sx={{ fontSize: 40 }} />,
      title: 'Predictive Modeling',
      description: 'Use sophisticated models to forecast returns, assess risks, and optimize your investment strategies.'
    }
  ];

  const stats = [
    { value: '$2.4T', label: 'Assets Analyzed' },
    { value: '150+', label: 'PE Firms' },
    { value: '10,000+', label: 'Deals Processed' },
    { value: '99.9%', label: 'Uptime' }
  ];

  return (
    <>
      {/* Floating Header */}
      <AppBar 
        position="fixed" 
        elevation={scrolled ? 2 : 0}
        sx={{
          background: scrolled 
            ? 'rgba(255, 255, 255, 0.95)' 
            : 'transparent',
          backdropFilter: scrolled ? 'blur(20px)' : 'none',
          borderBottom: scrolled ? '1px solid rgba(0, 0, 0, 0.05)' : 'none',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          py: scrolled ? 0 : 1
        }}
      >
        <Container maxWidth="lg">
          <Toolbar disableGutters>
            <Typography 
              variant="h5" 
              sx={{ 
                flexGrow: 0,
                fontFamily: '"Space Grotesk", sans-serif',
                fontWeight: 700,
                background: 'linear-gradient(135deg, #0A0A0A 0%, #5E5CE6 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mr: 6
              }}
            >
              Equitle
            </Typography>
            
            <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' }, gap: 4, ml: 4 }}>
              <Button sx={{ color: scrolled ? 'text.primary' : '#0A0A0A', fontWeight: 600 }}>
                Product
              </Button>
              <Button sx={{ color: scrolled ? 'text.primary' : '#0A0A0A', fontWeight: 600 }}>
                Solutions
              </Button>
              <Button sx={{ color: scrolled ? 'text.primary' : '#0A0A0A', fontWeight: 600 }}>
                Pricing
              </Button>
              <Button sx={{ color: scrolled ? 'text.primary' : '#0A0A0A', fontWeight: 600 }}>
                Resources
              </Button>
            </Box>

            <Box sx={{ flexGrow: 0, display: 'flex', gap: 2 }}>
              <Button 
                variant="text"
                onClick={() => navigate('/login')}
                sx={{ 
                  color: scrolled ? 'text.primary' : '#0A0A0A',
                  fontWeight: 600,
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
                  px: 3,
                  '&:hover': {
                    background: 'linear-gradient(135deg, #4A48C7 0%, #5E5CE6 100%)',
                    boxShadow: '0 6px 20px rgba(94, 92, 230, 0.4)'
                  }
                }}
              >
                Book Demo
              </Button>
              <IconButton sx={{ display: { xs: 'flex', md: 'none' } }}>
                <MenuIcon />
              </IconButton>
            </Box>
          </Toolbar>
        </Container>
      </AppBar>

      {/* Hero Section */}
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          position: 'relative',
          overflow: 'hidden',
          background: 'linear-gradient(135deg, #FFFFFF 0%, #F8F8FF 100%)',
          pt: 10
        }}
      >
        {/* Animated Background Elements */}
        <Box
          sx={{
            position: 'absolute',
            top: '10%',
            right: '10%',
            width: 400,
            height: 400,
            background: 'radial-gradient(circle, rgba(94, 92, 230, 0.1) 0%, transparent 70%)',
            borderRadius: '50%',
            animation: 'float 6s ease-in-out infinite'
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: '10%',
            left: '5%',
            width: 300,
            height: 300,
            background: 'radial-gradient(circle, rgba(124, 122, 237, 0.1) 0%, transparent 70%)',
            borderRadius: '50%',
            animation: 'float 8s ease-in-out infinite reverse'
          }}
        />

        <Container maxWidth="lg">
          <Grid container spacing={6} alignItems="center">
            <Grid item xs={12} md={6}>
              <Fade in timeout={1000}>
                <Box>
                  <Chip 
                    label="🚀 Backed by Y Combinator" 
                    sx={{ 
                      mb: 3,
                      background: 'linear-gradient(135deg, rgba(94, 92, 230, 0.1) 0%, rgba(124, 122, 237, 0.1) 100%)',
                      border: '1px solid rgba(94, 92, 230, 0.2)',
                      fontWeight: 600,
                      py: 2.5,
                      px: 1
                    }}
                  />
                  <Typography 
                    variant="h1" 
                    sx={{ 
                      fontFamily: '"Space Grotesk", sans-serif',
                      fontWeight: 800,
                      fontSize: { xs: '3rem', md: '4.5rem' },
                      lineHeight: 1.1,
                      mb: 3,
                      background: 'linear-gradient(135deg, #0A0A0A 0%, #2C2C2C 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent'
                    }}
                  >
                    Private Equity Intelligence, Reimagined
                  </Typography>
                  <Typography 
                    variant="h5" 
                    sx={{ 
                      color: 'text.secondary',
                      mb: 4,
                      fontWeight: 400,
                      lineHeight: 1.6
                    }}
                  >
                    Transform your deal flow with AI-powered insights. Equitle Brain helps PE firms make smarter, faster investment decisions.
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
                    <Button 
                      variant="contained" 
                      size="large"
                      endIcon={<ArrowForwardIcon />}
                      onClick={handleOpenDemo}
                      sx={{
                        background: 'linear-gradient(135deg, #5E5CE6 0%, #7C7AED 100%)',
                        boxShadow: '0 8px 24px rgba(94, 92, 230, 0.3)',
                        py: 1.8,
                        px: 4,
                        fontSize: '1.1rem',
                        fontWeight: 600,
                        '&:hover': {
                          background: 'linear-gradient(135deg, #4A48C7 0%, #5E5CE6 100%)',
                          boxShadow: '0 12px 32px rgba(94, 92, 230, 0.4)',
                          transform: 'translateY(-2px)'
                        }
                      }}
                    >
                      Get Started
                    </Button>
                    <Button 
                      variant="outlined" 
                      size="large"
                      sx={{
                        borderWidth: 2,
                        borderColor: 'rgba(10, 10, 10, 0.2)',
                        color: '#0A0A0A',
                        py: 1.8,
                        px: 4,
                        fontSize: '1.1rem',
                        fontWeight: 600,
                        '&:hover': {
                          borderWidth: 2,
                          borderColor: '#5E5CE6',
                          background: 'rgba(94, 92, 230, 0.05)'
                        }
                      }}
                    >
                      Watch Demo
                    </Button>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 4 }}>
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
                    height: 500,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {/* Dashboard Preview */}
                  <Box
                    sx={{
                      width: '100%',
                      height: '100%',
                      borderRadius: 4,
                      overflow: 'hidden',
                      boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
                      border: '1px solid rgba(0, 0, 0, 0.05)',
                      background: 'linear-gradient(135deg, #FFFFFF 0%, #FAFAFA 100%)',
                      position: 'relative',
                      transform: 'perspective(1000px) rotateY(-5deg)',
                      transition: 'transform 0.3s ease'
                    }}
                  >
                    <Box sx={{ p: 3 }}>
                      <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
                        <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#FF5F57' }} />
                        <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#FFBD2E' }} />
                        <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#28CA42' }} />
                      </Box>
                      <Grid container spacing={2}>
                        {[1, 2, 3, 4].map((item) => (
                          <Grid item xs={6} key={item}>
                            <Box
                              sx={{
                                height: 100,
                                borderRadius: 2,
                                background: `linear-gradient(135deg, rgba(94, 92, 230, ${0.05 * item}) 0%, rgba(124, 122, 237, ${0.05 * item}) 100%)`,
                                border: '1px solid rgba(94, 92, 230, 0.1)',
                                p: 2
                              }}
                            >
                              <Box sx={{ width: '60%', height: 8, borderRadius: 4, bgcolor: 'rgba(94, 92, 230, 0.2)', mb: 1 }} />
                              <Box sx={{ width: '40%', height: 6, borderRadius: 4, bgcolor: 'rgba(0, 0, 0, 0.1)' }} />
                            </Box>
                          </Grid>
                        ))}
                      </Grid>
                      <Box sx={{ mt: 3 }}>
                        <Box sx={{ height: 150, borderRadius: 2, background: 'linear-gradient(90deg, rgba(94, 92, 230, 0.05) 0%, rgba(124, 122, 237, 0.05) 100%)', border: '1px solid rgba(94, 92, 230, 0.1)' }} />
                      </Box>
                    </Box>
                  </Box>
                </Box>
              </Zoom>
            </Grid>
          </Grid>
        </Container>

        {/* Scroll Indicator */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 40,
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 1,
            cursor: 'pointer',
            animation: 'bounce 2s infinite'
          }}
          onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })}
        >
          <Typography variant="caption" color="text.secondary">
            Scroll to explore
          </Typography>
          <ArrowDownIcon sx={{ color: 'text.secondary' }} />
        </Box>
      </Box>

      {/* Stats Section */}
      <Box sx={{ py: 12, background: 'linear-gradient(180deg, #F8F8FF 0%, #FFFFFF 100%)' }}>
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

      {/* Features Section */}
      <Box sx={{ py: 12, background: '#FFFFFF' }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 8 }}>
            <Fade in timeout={1000}>
              <Typography 
                variant="h2" 
                sx={{ 
                  fontFamily: '"Space Grotesk", sans-serif',
                  fontWeight: 700,
                  mb: 2
                }}
              >
                Everything you need to win
              </Typography>
            </Fade>
            <Fade in timeout={1200}>
              <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
                Built by PE professionals, for PE professionals. Every feature designed to accelerate your deal flow.
              </Typography>
            </Fade>
          </Box>

          <Grid container spacing={4}>
            {features.map((feature, index) => (
              <Grid item xs={12} md={4} key={index}>
                <Zoom in timeout={1000 + index * 100}>
                  <Card
                    className="hover-lift"
                    sx={{
                      p: 4,
                      height: '100%',
                      background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(250, 250, 250, 0.9) 100%)',
                      border: '1px solid rgba(94, 92, 230, 0.08)',
                      borderRadius: 3,
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': {
                        border: '1px solid rgba(94, 92, 230, 0.2)',
                        background: 'linear-gradient(135deg, rgba(94, 92, 230, 0.02) 0%, rgba(124, 122, 237, 0.02) 100%)',
                        '& .feature-icon': {
                          transform: 'scale(1.1) rotate(5deg)',
                          color: '#5E5CE6'
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
                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                      {feature.description}
                    </Typography>
                  </Card>
                </Zoom>
              </Grid>
            ))}
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
        <Box
          sx={{
            position: 'absolute',
            top: '-50%',
            right: '-10%',
            width: 600,
            height: 600,
            background: 'radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%)',
            borderRadius: '50%'
          }}
        />
        <Container maxWidth="md">
          <Box sx={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
            <Typography 
              variant="h3" 
              sx={{ 
                fontFamily: '"Space Grotesk", sans-serif',
                fontWeight: 700,
                color: 'white',
                mb: 2
              }}
            >
              Ready to transform your deal flow?
            </Typography>
            <Typography variant="h6" sx={{ color: 'rgba(255, 255, 255, 0.9)', mb: 4 }}>
              Join leading PE firms using Equitle to make smarter investment decisions.
            </Typography>
            <Button 
              variant="contained" 
              size="large"
              onClick={handleOpenDemo}
              sx={{
                background: 'white',
                color: '#5E5CE6',
                py: 2,
                px: 5,
                fontSize: '1.1rem',
                fontWeight: 600,
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
                '&:hover': {
                  background: 'rgba(255, 255, 255, 0.95)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 12px 32px rgba(0, 0, 0, 0.3)'
                }
              }}
            >
              Book Your Demo Today
            </Button>
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
                fontSize: '1.05rem',
                '&:hover': {
                  background: 'linear-gradient(135deg, #4A48C7 0%, #5E5CE6 100%)'
                }
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
          
          @keyframes bounce {
            0%, 20%, 50%, 80%, 100% {
              transform: translateY(0);
            }
            40% {
              transform: translateY(-10px);
            }
            60% {
              transform: translateY(-5px);
            }
          }
        `}
      </style>
    </>
  );
}