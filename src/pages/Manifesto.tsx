import React, { useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Avatar,
  Paper,
  Divider
} from '@mui/material';
import MarketingHeader from '../components/MarketingHeader';
import Footer from '../components/Footer';
import {
  ArrowForward as ArrowForwardIcon,
  Check as CheckIcon,
  Business as BusinessIcon,
  Assessment as AssessmentIcon,
  Timeline as TimelineIcon,
  TrendingUp as TrendingUpIcon,
  Search as SearchIcon,
  Gavel as GavelIcon,
  AccountBalance as FundIcon,
  Speed as SpeedIcon,
  Psychology as AIIcon,
  Analytics as AnalyticsIcon,
  Groups as GroupsIcon,
  Security as SecurityIcon,
  AutoGraph as AutoGraphIcon,
  Insights as InsightIcon,
  PieChart as PieChartIcon,
  BarChart as BarChartIcon,
  ShowChart as ShowChartIcon,
  Lightbulb as LightbulbIcon,
  Handshake as HandshakeIcon,
  AttachMoney as MoneyIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  CalendarToday as CalendarIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

export default function Manifesto() {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'Manifesto - Equitle';
  }, []);

  const manifestoPoints = [
    {
      title: 'Relationships',
      description: 'Not Administration',
      icon: <HandshakeIcon sx={{ fontSize: 32 }} />,
      color: '#10B981'
    },
    {
      title: 'Analysis',
      description: 'Not Data Entry',
      icon: <MoneyIcon sx={{ fontSize: 32 }} />,
      color: '#10B981'
    },
    {
      title: 'Strategy',
      description: 'Not Task Management',
      icon: <LightbulbIcon sx={{ fontSize: 32 }} />,
      color: '#10B981'
    }
  ];

  const problems = [
    {
      problem: 'Time Spent on CRM Management',
      percentage: '40%',
      description: 'Search funders spend nearly half their time on administrative tasks instead of relationship building',
      icon: <ScheduleIcon />
    },
    {
      problem: 'Manual Data Entry',
      percentage: '25%',
      description: 'Hours wasted on updating contact information and tracking communication history',
      icon: <PersonIcon />
    },
    {
      problem: 'Email Overload',
      percentage: '20%',
      description: 'Managing hundreds of emails and follow-ups instead of focusing on deal flow',
      icon: <EmailIcon />
    },
    {
      problem: 'Spreadsheet Chaos',
      percentage: '15%',
      description: 'Maintaining complex Excel files for deal tracking and pipeline management',
      icon: <AssessmentIcon />
    }
  ];

  const solutions = [
    {
      title: 'Automated Relationship Management',
      description: 'AI-powered CRM that automatically tracks interactions, schedules follow-ups, and maintains relationship history.',
      benefits: ['Save 20+ hours per week', 'Never miss a follow-up', 'Automated relationship scoring', 'Intelligent conversation insights']
    },
    {
      title: 'Intelligent Deal Pipeline',
      description: 'Smart pipeline management that prioritizes deals based on your investment criteria and relationship strength.',
      benefits: ['Focus on high-probability deals', 'Automated deal scoring', 'Real-time pipeline analytics', 'Predictive deal outcomes']
    },
    {
      title: 'Financial Analysis Tools',
      description: 'Built-in financial modeling and analysis tools that help you evaluate deals faster and more accurately.',
      benefits: ['Automated financial models', 'Industry benchmarking', 'Risk assessment tools', 'Value creation planning']
    }
  ];


  return (
    <>
      <MarketingHeader />
      
      {/* Header */}
      <Box
        sx={{
          pt: { xs: 20, md: 24 },
          py: 12,
          background: 'linear-gradient(180deg, #000000 0%, #434343 100%)',
          color: '#FFFFFF'
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 8 }}>
            <Chip 
              label="OUR MANIFESTO" 
              sx={{ 
                mb: 3,
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                color: '#10B981',
                fontWeight: 600
              }}
            />
            <Typography 
              variant="h1" 
              sx={{ 
                fontFamily: "'Poppins', 'Inter', 'Roboto', 'Helvetica', 'Arial', sans-serif",
                fontWeight: 700,
                fontSize: { xs: '2.5rem', md: '3.5rem' },
                lineHeight: 1.2,
                mb: 3,
                color: '#FFFFFF'
              }}
            >
              You Deserve Better
            </Typography>
            <Typography variant="h5" sx={{ color: 'rgba(255, 255, 255, 0.8)', mb: 4, lineHeight: 1.6, maxWidth: 800, mx: 'auto' }}>
              You're building the next generation of great companies. You shouldn't be spending your time managing spreadsheets and tracking emails.
            </Typography>
          </Box>
        </Container>
      </Box>

      {/* Manifesto Points */}
      <Box sx={{ py: 12, background: 'linear-gradient(180deg, #000000 0%, #434343 100%)', color: '#FFFFFF' }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 8 }}>
            <Typography 
              variant="h2" 
              sx={{ 
                fontFamily: "'Poppins', 'Inter', 'Roboto', 'Helvetica', 'Arial', sans-serif",
                fontWeight: 700,
                mb: 2,
                color: '#FFFFFF'
              }}
            >
              Our Core Beliefs
            </Typography>
            <Typography variant="h6" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
              What you should focus on vs. what you're actually doing
            </Typography>
          </Box>

          <Grid container spacing={8} justifyContent="center">
            {manifestoPoints.map((point, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Box
                  sx={{
                    textAlign: 'center',
                    p: 4,
                    transition: 'all 0.3s ease'
                  }}
                >
                  <Box
                    className="circle"
                    sx={{
                      width: 120,
                      height: 120,
                      borderRadius: '50%',
                      background: 'rgba(16, 185, 129, 0.1)',
                      border: '2px solid rgba(16, 185, 129, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mx: 'auto',
                      mb: 3,
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <Box 
                      className="icon"
                      sx={{ 
                        color: '#10B981',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      {point.icon}
                    </Box>
                  </Box>
                  
                  <Typography 
                    variant="h4" 
                    sx={{ 
                      fontWeight: 700, 
                      mb: 1, 
                      color: '#FFFFFF',
                      fontFamily: "'Poppins', 'Inter', 'Roboto', 'Helvetica', 'Arial', sans-serif"
                    }}
                  >
                    {point.title}
                  </Typography>
                  
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      color: 'rgba(255, 255, 255, 0.6)',
                      fontWeight: 400,
                      fontStyle: 'italic'
                    }}
                  >
                    {point.description}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Problems Section */}
      <Box sx={{ py: 12, background: 'linear-gradient(180deg, #000000 0%, #434343 100%)', color: '#FFFFFF' }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 8 }}>
            <Typography 
              variant="h2" 
              sx={{ 
                fontFamily: "'Poppins', 'Inter', 'Roboto', 'Helvetica', 'Arial', sans-serif",
                fontWeight: 700,
                mb: 2,
                color: '#FFFFFF'
              }}
            >
              The Current Reality
            </Typography>
            <Typography variant="h6" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
              How search funders are spending their time today
            </Typography>
          </Box>

          <Grid container spacing={4}>
            {problems.map((problem, index) => (
              <Grid item xs={12} md={6} key={index}>
                <Card
                  sx={{
                    p: 4,
                    height: '100%',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '2px solid #000000',
                    borderRadius: 0,
                    position: 'relative',
                    overflow: 'hidden',
                    '&:hover': {
                      background: `
                        linear-gradient(180deg, rgba(16, 185, 129, 0.6) 0%, rgba(5, 150, 105, 0.6) 30%, rgba(4, 120, 87, 0.6) 70%, rgba(6, 78, 59, 0.6) 100%),
                        radial-gradient(circle at 20% 50%, rgba(255,255,255,0.15) 0%, transparent 50%),
                        radial-gradient(circle at 80% 20%, rgba(255,255,255,0.08) 0%, transparent 50%),
                        radial-gradient(circle at 40% 80%, rgba(0,0,0,0.15) 0%, transparent 50%)
                      `,
                      backdropFilter: 'blur(10px)',
                      opacity: 0.8,
                      '& .MuiSvgIcon-root': {
                        color: '#FFFFFF !important'
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
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 2 }}>
                    <Avatar sx={{ bgcolor: '#065F46' }}>
                      <Box sx={{ color: '#10B981' }}>
                        {problem.icon}
                      </Box>
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, color: '#FFFFFF' }}>
                        {problem.problem}
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 700, color: '#10B981' }}>
                        {problem.percentage}
                      </Typography>
                    </Box>
                  </Box>
                  <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                    {problem.description}
                  </Typography>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Solutions Section */}
      <Box sx={{ py: 12, background: 'linear-gradient(180deg, #000000 0%, #434343 100%)', color: '#FFFFFF' }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 8 }}>
            <Typography 
              variant="h2" 
              sx={{ 
                fontFamily: "'Poppins', 'Inter', 'Roboto', 'Helvetica', 'Arial', sans-serif",
                fontWeight: 700,
                mb: 2,
                color: '#FFFFFF'
              }}
            >
              The Equitle Solution
            </Typography>
            <Typography variant="h6" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
              One Software. Manage everything.
            </Typography>
          </Box>

          <Box sx={{ position: 'relative', py: 12 }}>
            {/* Pipeline Line */}
            <Box
              sx={{
                position: 'absolute',
                top: 'calc(50% - 50px)', // Move line lower
                left: '60px', // Start at first circle center
                right: '60px', // End at last circle center
                height: '8px',
                background: `
                  linear-gradient(180deg, rgba(16, 185, 129, 0.6) 0%, rgba(5, 150, 105, 0.6) 30%, rgba(4, 120, 87, 0.6) 70%, rgba(6, 78, 59, 0.6) 100%),
                  radial-gradient(circle at 20% 50%, rgba(255,255,255,0.15) 0%, transparent 50%),
                  radial-gradient(circle at 80% 20%, rgba(255,255,255,0.08) 0%, transparent 50%),
                  radial-gradient(circle at 40% 80%, rgba(0,0,0,0.15) 0%, transparent 50%)
                `,
                backdropFilter: 'blur(10px)',
                opacity: 0.8,
                transform: 'translateY(-50%)',
                zIndex: 1,
                borderRadius: '4px'
              }}
            />
            
            {/* Pipeline Stages */}
            <Grid container spacing={8} sx={{ position: 'relative', zIndex: 2 }}>
              {[
                {
                  title: 'Investment Thesis',
                  description: 'Define your investment criteria and target markets',
                  icon: <LightbulbIcon />
                },
                {
                  title: 'Fundraising',
                  description: 'Raise capital from investors and LPs',
                  icon: <MoneyIcon />
                },
                {
                  title: 'Outreach',
                  description: 'Source and connect with potential deals',
                  icon: <SearchIcon />
                },
                {
                  title: 'Due Diligence',
                  description: 'Evaluate and analyze investment opportunities',
                  icon: <AssessmentIcon />
                },
                {
                  title: 'Closing',
                  description: 'Finalize deals and complete transactions',
                  icon: <HandshakeIcon />
                }
              ].map((stage, index) => (
                <Grid item xs={12} sm={6} md={2.4} key={index}>
                  {/* Circle Container - Completely Separate */}
                  <Box
                    sx={{
                      textAlign: 'center',
                      position: 'relative',
                      mb: 4,
                    }}
                  >
                    <Box
                      className="stage-circle"
                      sx={{
                        width: 120,
                        height: 120,
                        borderRadius: '50%',
                        background: `
                          linear-gradient(180deg, #10B981 0%, #059669 30%, #047857 70%, #065F46 100%),
                          radial-gradient(circle at 20% 50%, rgba(255,255,255,0.15) 0%, transparent 50%),
                          radial-gradient(circle at 80% 20%, rgba(255,255,255,0.08) 0%, transparent 50%),
                          radial-gradient(circle at 40% 80%, rgba(0,0,0,0.15) 0%, transparent 50%)
                        `,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mx: 'auto',
                        transition: 'all 0.3s ease',
                        position: 'relative',
                        zIndex: 3
                      }}
                    >
                      <Box
                        className="stage-icon"
                        sx={{
                          color: '#FFFFFF',
                          transition: 'all 0.3s ease',
                          '& .MuiSvgIcon-root': {
                            fontSize: '2.5rem'
                          }
                        }}
                      >
                        {stage.icon}
                      </Box>
                    </Box>
                  </Box>
                  
                  {/* Text Container - Completely Separate */}
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography 
                      variant="h5" 
                      sx={{ 
                        fontWeight: 700, 
                        mb: 2, 
                        color: '#FFFFFF',
                        fontFamily: "'Poppins', 'Inter', 'Roboto', 'Helvetica', 'Arial', sans-serif",
                        fontSize: '1.25rem'
                      }}
                    >
                      {stage.title}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Box>
        </Container>
      </Box>


      {/* Call to Action */}
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
              Ready to Focus on What Matters?
            </Typography>
            <Typography variant="h6" sx={{ color: 'rgba(255, 255, 255, 0.8)', mb: 4 }}>
              Join the search funders who've already made the switch to relationship-focused deal sourcing
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
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
                  '&::before': {
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
                }}
              >
                Book Demo
              </Button>
            </Box>
          </Box>
        </Container>
      </Box>
      <Footer />
    </>
  );
}
