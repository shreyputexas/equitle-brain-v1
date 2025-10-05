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

  useEffect(() => {
    document.title = 'Home - Equitle';
  }, []);
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
      description: 'The software scrapes private market contacts for you and finds missing data',
      features: ['Contact scraping', 'Data enrichment', 'Missing data discovery']
    },
    {
      title: 'Sourcing',
      icon: <SourcingIcon />,
      description: 'Outreach, agentic calls, and relationship management',
      features: ['Outreach automation', 'Agentic calls', 'Relationship management']
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
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          position: 'relative',
          overflow: 'hidden',
          background: 'linear-gradient(135deg, #FFFFFF 0%, #F8F8FF 100%)',
          pt: { xs: 12, md: 14 }
        }}
      >
        <Container maxWidth="md">
          <Box sx={{ textAlign: 'center' }}>
            <Fade in timeout={1000}>
              <Box>
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
                  AI-Native Software Built for
                  <Box 
                    component="span" 
                    sx={{ 
                      background: 'linear-gradient(135deg, #9CA3AF 0%, #374151 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent'
                    }}
                  >
                    {' '}Sourcing
                  </Box>
                </Typography>
                <Typography variant="h5" sx={{ color: 'text.secondary', mb: 4, lineHeight: 1.6, maxWidth: 800, mx: 'auto' }}>
                  Focus on relationships and deal analysis, not administrative tasks. The only CRM designed specifically for sourcing, helping you acquire great companies.
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
                  <Button 
                    variant="contained" 
                    size="large"
                    endIcon={<ArrowForwardIcon />}
                    onClick={() => window.open('https://calendly.com/contact-equitle/pe-firm-partnership-meeting-equitle', '_blank')}
                    sx={{
                      background: 'linear-gradient(135deg, #9CA3AF 0%, #374151 100%)',
                      py: 1.8,
                      px: 6,
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
              From sourcing to management, Equitle provides the tools and intelligence you need at every step
            </Typography>
          </Box>

          <Grid container spacing={4}>
            {useCases.map((useCase, index) => (
              <Grid item xs={12} md={4} key={index}>
                <Card
                  sx={{
                    height: '100%',
                    p: 4,
                    textAlign: 'center',
                    border: '1px solid rgba(94, 92, 230, 0.08)',
                    borderRadius: 3,
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)',
                      border: '1px solid rgba(94, 92, 230, 0.2)'
                    }
                  }}
                >
                  <Box
                    sx={{
                      width: 80,
                      height: 80,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, rgba(94, 92, 230, 0.1) 0%, rgba(124, 122, 237, 0.1) 100%)',
                      border: '1px solid rgba(94, 92, 230, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mx: 'auto',
                      mb: 3
                    }}
                  >
                    {useCase.icon}
                  </Box>
                  
                  <Typography 
                    variant="h5" 
                    sx={{ 
                      fontWeight: 600, 
                      mb: 2,
                      color: '#374151'
                    }}
                  >
                    {useCase.title}
                  </Typography>
                  
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      color: 'text.secondary', 
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
                          <CheckIcon sx={{ color: 'success.main', fontSize: 20 }} />
                        </ListItemIcon>
                        <ListItemText 
                          primary={feature}
                          sx={{ 
                            '& .MuiListItemText-primary': {
                              fontSize: '0.95rem',
                              fontWeight: 500,
                              color: '#374151'
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
                      borderColor: '#374151',
                      color: '#374151',
                      '&:hover': {
                        borderColor: '#1F2937',
                        backgroundColor: 'rgba(55, 65, 81, 0.04)'
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
              Comprehensive tools designed by searchers, for searchers
            </Typography>
          </Box>

          <Grid container spacing={4}>
            {features.map((feature, index) => (
              <Grid item xs={12} md={6} lg={4} key={index}>
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
                          color: '#9CA3AF'
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
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>


      {/* Integration Section */}
      <Box sx={{ py: 16, background: 'white' }}>
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
                Connect with your existing tools effortlessly. Our platform makes integration simple and straightforward, so you can focus on what matters most.
              </Typography>
              <List>
                {['CRM & Sales Tools', 'Data & Analytics Platforms', 'Communication & Collaboration', 'Financial & Reporting Systems'].map((integration, index) => (
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
                sx={{ mt: 2 }}
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
                      borderRadius: 2,
                      background: 'linear-gradient(135deg, rgba(94, 92, 230, 0.05) 0%, rgba(124, 122, 237, 0.05) 100%)',
                      border: '1px solid rgba(94, 92, 230, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'scale(1.05)',
                        boxShadow: '0 8px 24px rgba(94, 92, 230, 0.15)',
                        '& .integration-icon': {
                          color: '#9CA3AF',
                          transform: 'scale(1.1)'
                        }
                      }
                    }}
                  >
                    <Box
                      className="integration-icon"
                      sx={{
                        fontSize: 40,
                        color: 'text.secondary',
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
          background: 'linear-gradient(135deg, #9CA3AF 0%, #374151 100%)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <Container maxWidth="md">
          <Box sx={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
            <Typography 
              variant="h2" 
              sx={{ 
                fontFamily: '"Space Grotesk", sans-serif',
                fontWeight: 700,
                color: 'white',
                mb: 2
              }}
            >
              Join a Community of Searchers
            </Typography>
            <Typography variant="h6" sx={{ color: 'rgba(255, 255, 255, 0.9)', mb: 4 }}>
              Connect with fellow search funders and discover how Equitle can transform your deal process
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
              <Button 
                variant="contained" 
                size="large"
                onClick={() => window.open('https://calendly.com/contact-equitle/pe-firm-partnership-meeting-equitle', '_blank')}
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
                background: 'linear-gradient(135deg, #9CA3AF 0%, #374151 100%)',
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