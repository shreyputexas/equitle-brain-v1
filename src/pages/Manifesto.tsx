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
      title: 'Relationships Over Administration',
      description: 'Build meaningful connections with business owners, not manage spreadsheets.',
      icon: <HandshakeIcon sx={{ fontSize: 40 }} />,
      color: '#9CA3AF',
      details: [
        'Focus on business owner\'s vision and goals',
        'Build trust through genuine conversations',
        'Develop deep industry expertise'
      ]
    },
    {
      title: 'Financial Analysis Over Data Entry',
      description: 'Analyze financials and identify opportunities, not process data manually.',
      icon: <MoneyIcon sx={{ fontSize: 40 }} />,
      color: '#9CA3AF',
      details: [
        'Deep dive into financial models',
        'Identify growth opportunities',
        'Focus on due diligence and risk assessment'
      ]
    },
    {
      title: 'Strategic Thinking Over Task Management',
      description: 'Focus on deal sourcing and execution, not administrative tasks.',
      icon: <LightbulbIcon sx={{ fontSize: 40 }} />,
      color: '#9CA3AF',
      details: [
        'Develop investment theses',
        'Build industry networks',
        'Focus on fundraising and investor relations'
      ]
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
          pt: { xs: 16, md: 20 },
          py: 8,
          background: 'linear-gradient(135deg, #FFFFFF 0%, #F8F8FF 100%)',
          borderBottom: '1px solid rgba(0, 0, 0, 0.05)'
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 8 }}>
            <Chip 
              label="OUR MANIFESTO" 
              sx={{ 
                mb: 3,
                background: 'linear-gradient(135deg, rgba(156, 163, 175, 0.1) 0%, rgba(55, 65, 81, 0.1) 100%)',
                border: '1px solid rgba(156, 163, 175, 0.2)',
                fontWeight: 600
              }}
            />
            <Typography 
              variant="h1" 
              sx={{ 
                fontFamily: '"Space Grotesk", sans-serif',
                fontWeight: 700,
                fontSize: { xs: '2.5rem', md: '3.5rem' },
                lineHeight: 1.2,
                mb: 3
              }}
            >
              Search Funders Deserve Better
            </Typography>
            <Typography variant="h5" sx={{ color: 'text.secondary', mb: 4, lineHeight: 1.6, maxWidth: 800, mx: 'auto' }}>
              You're building the next generation of great companies. You shouldn't be spending your time managing spreadsheets and tracking emails.
            </Typography>
          </Box>
        </Container>
      </Box>

      {/* Manifesto Points */}
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
              Our Core Beliefs
            </Typography>
            <Typography variant="h6" color="text.secondary">
              What search funders should focus on vs. what they're actually doing
            </Typography>
          </Box>

          <Grid container spacing={6}>
            {manifestoPoints.map((point, index) => (
              <Grid item xs={12} md={4} key={index}>
                <Card
                  sx={{
                    p: 4,
                    height: '100%',
                    border: '1px solid rgba(156, 163, 175, 0.08)',
                    '&:hover': {
                      boxShadow: '0 12px 32px rgba(156, 163, 175, 0.15)',
                      transform: 'translateY(-4px)'
                    },
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                >
                  <Box sx={{ textAlign: 'center', mb: 3 }}>
                    <Avatar sx={{ bgcolor: point.color, width: 80, height: 80, mx: 'auto', mb: 2 }}>
                      {point.icon}
                    </Avatar>
                    <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
                      {point.title}
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                      {point.description}
                    </Typography>
                  </Box>
                  
                  <List>
                    {point.details.map((detail, idx) => (
                      <ListItem key={idx} sx={{ px: 0 }}>
                        <ListItemIcon sx={{ minWidth: 28 }}>
                          <CheckIcon sx={{ fontSize: 16, color: point.color }} />
                        </ListItemIcon>
                        <ListItemText 
                          primary={detail}
                          primaryTypographyProps={{
                            fontSize: '0.875rem'
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

      {/* Problems Section */}
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
              The Current Reality
            </Typography>
            <Typography variant="h6" color="text.secondary">
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
                    border: '1px solid rgba(156, 163, 175, 0.08)',
                    '&:hover': {
                      boxShadow: '0 8px 24px rgba(156, 163, 175, 0.1)'
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 2 }}>
                    <Avatar sx={{ bgcolor: '#9CA3AF' }}>
                      {problem.icon}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                        {problem.problem}
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 700, color: '#9CA3AF' }}>
                        {problem.percentage}
                      </Typography>
                    </Box>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {problem.description}
                  </Typography>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Solutions Section */}
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
              The Equitle Solution
            </Typography>
            <Typography variant="h6" color="text.secondary">
              How we're changing the game for search funders
            </Typography>
          </Box>

          <Grid container spacing={6}>
            {solutions.map((solution, index) => (
              <Grid item xs={12} md={4} key={index}>
                <Card
                  sx={{
                    p: 4,
                    height: '100%',
                    border: '1px solid rgba(156, 163, 175, 0.08)',
                    '&:hover': {
                      boxShadow: '0 12px 32px rgba(156, 163, 175, 0.15)'
                    }
                  }}
                >
                  <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
                    {solution.title}
                  </Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                    {solution.description}
                  </Typography>
                  
                  <List>
                    {solution.benefits.map((benefit, idx) => (
                      <ListItem key={idx} sx={{ px: 0 }}>
                        <ListItemIcon sx={{ minWidth: 28 }}>
                          <CheckIcon sx={{ fontSize: 16, color: '#9CA3AF' }} />
                        </ListItemIcon>
                        <ListItemText 
                          primary={benefit}
                          primaryTypographyProps={{
                            fontSize: '0.875rem'
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


      {/* Call to Action */}
      <Box 
        sx={{ 
          py: 12, 
          background: 'linear-gradient(135deg, #9CA3AF 0%, #374151 100%)',
          color: 'white'
        }}
      >
        <Container maxWidth="md">
          <Box sx={{ textAlign: 'center' }}>
            <Typography 
              variant="h2" 
              sx={{ 
                fontFamily: '"Space Grotesk", sans-serif',
                fontWeight: 700,
                mb: 2
              }}
            >
              Ready to Focus on What Matters?
            </Typography>
            <Typography variant="h6" sx={{ mb: 4, opacity: 0.9 }}>
              Join the search funders who've already made the switch to relationship-focused deal sourcing
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <Button 
                variant="contained" 
                size="large"
                onClick={() => window.open('https://calendly.com/contact-equitle/pe-firm-partnership-meeting-equitle', '_blank')}
                sx={{
                  background: 'white',
                  color: '#374151',
                  py: 1.5,
                  px: 4,
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
    </>
  );
}
