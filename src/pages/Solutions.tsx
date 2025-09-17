import React, { useState } from 'react';
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
  Fade,
  Zoom,
  Tab,
  Tabs
} from '@mui/material';
import MarketingHeader from '../components/MarketingHeader';
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
  ShowChart as ShowChartIcon
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

export default function Solutions() {
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);

  const solutions = [
    {
      title: 'Search Fund Sourcing',
      icon: <SearchIcon sx={{ fontSize: 40 }} />,
      description: 'Find and connect with business owners who are ready to sell their companies',
      color: '#9CA3AF',
      features: [
        'AI-powered identification of potential acquisition targets',
        'Automated outreach to business owners',
        'Relationship tracking and nurturing tools',
        'Integration with industry databases and networks',
        'Predictive scoring for acquisition likelihood'
      ],
      benefits: [
        '5x faster target identification',
        '60% higher response rates',
        '40% reduction in sourcing time'
      ],
      useCase: {
        title: 'Tech Services Search Fund',
        challenge: 'Spending 80% of time on administrative tasks instead of relationship building',
        solution: 'Equitle automates outreach and relationship management, freeing time for strategic work',
        result: 'Reduced admin time to 20% and increased meaningful owner conversations by 400%'
      }
    },
    {
      title: 'Owner Relationship Management',
      icon: <GavelIcon sx={{ fontSize: 40 }} />,
      description: 'Build and maintain strong relationships with business owners throughout the acquisition process',
      color: '#10B981',
      features: [
        'Automated relationship tracking and follow-up reminders',
        'Communication history and preference management',
        'Meeting scheduling and preparation tools',
        'Personalized outreach templates and messaging',
        'Relationship scoring and engagement analytics'
      ],
      benefits: [
        '70% better relationship outcomes',
        '50% reduction in missed follow-ups',
        '3x more meaningful conversations'
      ],
      useCase: {
        title: 'Manufacturing Search Fund',
        challenge: 'Losing track of owner conversations and missing critical follow-up opportunities',
        solution: 'Automated relationship management ensures consistent, personalized communication',
        result: 'Improved owner engagement by 200% and closed 3 deals that were previously stalled'
      }
    },
    {
      title: 'Post-Acquisition Management',
      icon: <TimelineIcon sx={{ fontSize: 40 }} />,
      description: 'Manage and grow your acquired companies with comprehensive operational tools',
      color: '#F59E0B',
      features: [
        'Real-time performance tracking and KPI monitoring',
        'Value creation plan execution and milestone tracking',
        'Board package automation and investor reporting',
        'Operational improvement identification and tracking',
        'Exit planning and readiness assessment'
      ],
      benefits: [
        '40% better operational visibility',
        '60% reduction in reporting time',
        '25% higher portfolio returns'
      ],
      useCase: {
        title: 'Services Search Fund',
        challenge: 'Manual tracking of portfolio company performance and value creation initiatives',
        solution: 'Automated dashboards and tracking tools provide real-time insights into operations',
        result: 'Improved portfolio performance by 30% and accelerated value creation timeline by 18 months'
      }
    },
    {
      title: 'Investor Relations',
      icon: <BarChartIcon sx={{ fontSize: 40 }} />,
      description: 'Manage relationships with your search fund investors and provide transparent reporting',
      color: '#3B82F6',
      features: [
        'Automated investor report generation and distribution',
        'Interactive investor portal with real-time fund performance',
        'Custom reporting templates and branding',
        'Performance benchmarking and peer analysis',
        'Fundraising support and investor communication tracking'
      ],
      benefits: [
        '80% faster report creation',
        '95% investor satisfaction rate',
        '60% reduction in investor queries'
      ],
      useCase: {
        title: 'Technology Search Fund',
        challenge: 'Manual investor reporting taking weeks and lacking transparency',
        solution: 'Automated reporting and investor portal provide real-time transparency',
        result: 'Reduced reporting time to 1 day and improved investor confidence by 40%'
      }
    }
  ];

  const industries = [
    {
      name: 'Technology',
      icon: <AutoGraphIcon />,
      description: 'SaaS, fintech, AI/ML, and enterprise software investments',
      specializations: ['Growth metrics tracking', 'Product-market fit analysis', 'Competitive intelligence']
    },
    {
      name: 'Healthcare',
      icon: <SecurityIcon />,
      description: 'MedTech, biotech, healthcare services, and digital health',
      specializations: ['Regulatory compliance', 'Clinical trial tracking', 'Market access analysis']
    },
    {
      name: 'Financial Services',
      icon: <FundIcon />,
      description: 'Banking, insurance, asset management, and payments',
      specializations: ['Regulatory reporting', 'Risk assessment', 'Performance analytics']
    },
    {
      name: 'Industrial',
      icon: <BusinessIcon />,
      description: 'Manufacturing, logistics, energy, and infrastructure',
      specializations: ['Operational metrics', 'ESG reporting', 'Supply chain analysis']
    }
  ];

  const firmSizes = [
    {
      size: 'Emerging Managers',
      range: '<$250M AUM',
      icon: <TrendingUpIcon />,
      features: ['Essential deal tools', 'Basic portfolio tracking', 'Standard reporting'],
      benefits: 'Get started quickly with core functionality at an accessible price point'
    },
    {
      size: 'Mid-Market Funds',
      range: '$250M - $2B AUM',
      icon: <ShowChartIcon />,
      features: ['Advanced analytics', 'Custom workflows', 'API integrations'],
      benefits: 'Scale your operations with sophisticated tools and automation'
    },
    {
      size: 'Large-Cap Funds',
      range: '$2B+ AUM',
      icon: <PieChartIcon />,
      features: ['Enterprise features', 'Custom development', 'Dedicated support'],
      benefits: 'Comprehensive platform with white-glove service and customization'
    }
  ];

  const testimonials = [
    {
      quote: "Equitle transformed our deal sourcing process. We're now seeing 3x more qualified opportunities.",
      author: "David Kim",
      role: "Managing Partner",
      company: "Meridian Capital",
      solution: "Deal Sourcing",
      avatar: "DK"
    },
    {
      quote: "Our due diligence timeline went from 12 weeks to 6 weeks while improving our risk identification.",
      author: "Sarah Martinez",
      role: "Investment Director",
      company: "Alpine Growth Partners",
      solution: "Due Diligence",
      avatar: "SM"
    },
    {
      quote: "Portfolio reporting that used to take weeks now takes hours. Our LPs love the transparency.",
      author: "Michael Chen",
      role: "CFO",
      company: "Summit Equity",
      solution: "LP Reporting",
      avatar: "MC"
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
              label="SOLUTIONS OVERVIEW" 
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
              Solutions for Every Stage of
              <Box 
                component="span" 
                sx={{ 
                  background: 'linear-gradient(135deg, #9CA3AF 0%, #374151 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}
              >
                {' '}Your Investment Process
              </Box>
            </Typography>
            <Typography variant="h5" sx={{ color: 'text.secondary', mb: 4, lineHeight: 1.6, maxWidth: 800, mx: 'auto' }}>
              From deal sourcing to portfolio management, Equitle provides specialized solutions tailored to your firm's needs and investment strategy.
            </Typography>
          </Box>
        </Container>
      </Box>

      {/* Solutions Overview */}
      <Box sx={{ py: 12, background: 'white' }}>
        <Container maxWidth="lg">
          <Tabs 
            value={tabValue} 
            onChange={(e, v) => setTabValue(v)} 
            variant="scrollable"
            scrollButtons="auto"
            sx={{ mb: 6 }}
          >
            {solutions.map((solution, index) => (
              <Tab 
                key={index}
                label={solution.title} 
                icon={React.cloneElement(solution.icon, { 
                  sx: { fontSize: 24, color: solution.color } 
                })}
                iconPosition="start"
                sx={{ 
                  textTransform: 'none',
                  fontSize: '1rem',
                  fontWeight: 500,
                  minHeight: 64,
                  minWidth: 250
                }}
              />
            ))}
          </Tabs>

          {solutions.map((solution, index) => (
            <TabPanel key={index} value={tabValue} index={index}>
              <Fade in timeout={500}>
                <Grid container spacing={6} alignItems="center">
                  <Grid item xs={12} lg={6}>
                    <Typography variant="h3" sx={{ fontWeight: 700, mb: 3 }}>
                      {solution.description}
                    </Typography>
                    
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                      Key Features:
                    </Typography>
                    <List>
                      {solution.features.map((feature, idx) => (
                        <ListItem key={idx} sx={{ px: 0 }}>
                          <ListItemIcon>
                            <CheckIcon sx={{ color: solution.color }} />
                          </ListItemIcon>
                          <ListItemText 
                            primary={feature}
                            sx={{ 
                              '& .MuiListItemText-primary': {
                                fontSize: '1rem',
                                fontWeight: 500
                              }
                            }}
                          />
                        </ListItem>
                      ))}
                    </List>

                    <Paper sx={{ p: 3, mt: 4, background: `${solution.color}08`, border: `1px solid ${solution.color}20` }}>
                      <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                        Proven Results:
                      </Typography>
                      <Grid container spacing={3}>
                        {solution.benefits.map((benefit, idx) => (
                          <Grid item xs={12} sm={4} key={idx}>
                            <Box sx={{ textAlign: 'center' }}>
                              <Typography variant="h4" sx={{ fontWeight: 700, color: solution.color, mb: 1 }}>
                                {benefit.split(' ')[0]}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {benefit.split(' ').slice(1).join(' ')}
                              </Typography>
                            </Box>
                          </Grid>
                        ))}
                      </Grid>
                    </Paper>

                    <Box sx={{ mt: 4 }}>
                      <Button 
                        variant="contained"
                        size="large"
                        endIcon={<ArrowForwardIcon />}
                        sx={{
                          background: `linear-gradient(135deg, ${solution.color} 0%, ${solution.color}dd 100%)`,
                          mr: 2
                        }}
                      >
                        Learn More
                      </Button>
                      <Button 
                        variant="outlined"
                        size="large"
                        onClick={() => navigate('/product')}
                      >
                        View Features
                      </Button>
                    </Box>
                  </Grid>

                  <Grid item xs={12} lg={6}>
                    <Card
                      sx={{
                        p: 4,
                        background: 'linear-gradient(135deg, #FAFAFA 0%, #FFFFFF 100%)',
                        border: '1px solid rgba(0, 0, 0, 0.05)'
                      }}
                    >
                      <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                        Customer Success Story
                      </Typography>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600, color: solution.color, mb: 2 }}>
                        {solution.useCase.title}
                      </Typography>
                      
                      <Box sx={{ mb: 3 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, mb: 1, color: 'text.secondary' }}>
                          Challenge:
                        </Typography>
                        <Typography variant="body1" sx={{ mb: 2 }}>
                          {solution.useCase.challenge}
                        </Typography>
                        
                        <Typography variant="body2" sx={{ fontWeight: 600, mb: 1, color: 'text.secondary' }}>
                          Solution:
                        </Typography>
                        <Typography variant="body1" sx={{ mb: 2 }}>
                          {solution.useCase.solution}
                        </Typography>
                        
                        <Typography variant="body2" sx={{ fontWeight: 600, mb: 1, color: 'text.secondary' }}>
                          Result:
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 600, color: solution.color }}>
                          {solution.useCase.result}
                        </Typography>
                      </Box>
                    </Card>
                  </Grid>
                </Grid>
              </Fade>
            </TabPanel>
          ))}
        </Container>
      </Box>

      {/* Industry Specializations */}
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
              Industry Specializations
            </Typography>
            <Typography variant="h6" color="text.secondary">
              Tailored solutions for your sector focus
            </Typography>
          </Box>

          <Grid container spacing={4}>
            {industries.map((industry, index) => (
              <Grid item xs={12} md={6} key={index}>
                <Zoom in timeout={1000 + index * 100}>
                  <Card
                    sx={{
                      p: 4,
                      height: '100%',
                      border: '1px solid rgba(156, 163, 175, 0.08)',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: '0 12px 32px rgba(156, 163, 175, 0.15)'
                      },
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                      <Avatar sx={{ bgcolor: '#9CA3AF', mr: 2 }}>
                        {industry.icon}
                      </Avatar>
                      <Typography variant="h5" sx={{ fontWeight: 600 }}>
                        {industry.name}
                      </Typography>
                    </Box>
                    <Typography variant="body1" sx={{ mb: 3, color: 'text.secondary' }}>
                      {industry.description}
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                      Specialized Features:
                    </Typography>
                    <List dense>
                      {industry.specializations.map((spec, idx) => (
                        <ListItem key={idx} sx={{ px: 0 }}>
                          <ListItemIcon sx={{ minWidth: 28 }}>
                            <CheckIcon sx={{ fontSize: 16, color: '#9CA3AF' }} />
                          </ListItemIcon>
                          <ListItemText 
                            primary={spec}
                            primaryTypographyProps={{
                              fontSize: '0.875rem'
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

      {/* Firm Size Solutions */}
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
              Solutions by Firm Size
            </Typography>
            <Typography variant="h6" color="text.secondary">
              Scalable solutions that grow with your firm
            </Typography>
          </Box>

          <Grid container spacing={4}>
            {firmSizes.map((firm, index) => (
              <Grid item xs={12} md={4} key={index}>
                <Card
                  sx={{
                    p: 4,
                    height: '100%',
                    textAlign: 'center',
                    border: index === 1 ? '2px solid #9CA3AF' : '1px solid rgba(156, 163, 175, 0.08)',
                    position: 'relative',
                    '&:hover': {
                      boxShadow: '0 12px 32px rgba(156, 163, 175, 0.15)'
                    }
                  }}
                >
                  {index === 1 && (
                    <Chip 
                      label="MOST POPULAR" 
                      size="small"
                      sx={{ 
                        position: 'absolute',
                        top: -10,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        bgcolor: '#9CA3AF',
                        color: 'white',
                        fontWeight: 600
                      }}
                    />
                  )}
                  <Avatar sx={{ bgcolor: '#9CA3AF', width: 64, height: 64, mx: 'auto', mb: 2 }}>
                    {firm.icon}
                  </Avatar>
                  <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
                    {firm.size}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    {firm.range}
                  </Typography>
                  <List>
                    {firm.features.map((feature, idx) => (
                      <ListItem key={idx} sx={{ px: 0, justifyContent: 'center' }}>
                        <ListItemIcon sx={{ minWidth: 28, justifyContent: 'center' }}>
                          <CheckIcon sx={{ fontSize: 16, color: '#9CA3AF' }} />
                        </ListItemIcon>
                        <ListItemText 
                          primary={feature}
                          primaryTypographyProps={{
                            fontSize: '0.875rem',
                            textAlign: 'center'
                          }}
                        />
                      </ListItem>
                    ))}
                  </List>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 3, fontStyle: 'italic' }}>
                    {firm.benefits}
                  </Typography>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Customer Testimonials */}
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
              Success Stories
            </Typography>
            <Typography variant="h6" color="text.secondary">
              See how leading firms are transforming their operations
            </Typography>
          </Box>

          <Grid container spacing={4}>
            {testimonials.map((testimonial, index) => (
              <Grid item xs={12} md={4} key={index}>
                <Card
                  sx={{
                    p: 4,
                    height: '100%',
                    border: '1px solid rgba(156, 163, 175, 0.08)',
                    '&:hover': {
                      boxShadow: '0 12px 32px rgba(94, 92, 230, 0.1)'
                    }
                  }}
                >
                  <Chip 
                    label={testimonial.solution}
                    size="small"
                    sx={{ 
                      mb: 2,
                      bgcolor: '#9CA3AF',
                      color: 'white',
                      fontWeight: 500
                    }}
                  />
                  <Typography variant="body1" sx={{ mb: 3, lineHeight: 1.7, fontStyle: 'italic' }}>
                    "{testimonial.quote}"
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ bgcolor: '#9CA3AF' }}>
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
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Implementation Process */}
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
              Implementation Process
            </Typography>
            <Typography variant="h6" color="text.secondary">
              Get up and running in weeks, not months
            </Typography>
          </Box>

          <Grid container spacing={4}>
            {[
              {
                step: '01',
                title: 'Discovery & Planning',
                description: 'We analyze your current processes and design a customized implementation plan',
                duration: 'Week 1-2'
              },
              {
                step: '02',
                title: 'Data Migration & Setup',
                description: 'Secure migration of your existing data and initial system configuration',
                duration: 'Week 2-4'
              },
              {
                step: '03',
                title: 'Training & Go-Live',
                description: 'Comprehensive team training and supported launch with ongoing assistance',
                duration: 'Week 4-6'
              },
              {
                step: '04',
                title: 'Optimization & Scale',
                description: 'Continuous optimization and expansion of features based on your needs',
                duration: 'Ongoing'
              }
            ].map((phase, index) => (
              <Grid item xs={12} md={3} key={index}>
                <Card
                  sx={{
                    p: 3,
                    textAlign: 'center',
                    height: '100%',
                    border: '1px solid rgba(156, 163, 175, 0.08)',
                    position: 'relative'
                  }}
                >
                  <Typography 
                    variant="h3" 
                    sx={{ 
                      fontFamily: '"Space Grotesk", sans-serif',
                      fontWeight: 700,
                      color: '#374151',
                      mb: 2
                    }}
                  >
                    {phase.step}
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                    {phase.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {phase.description}
                  </Typography>
                  <Chip 
                    label={phase.duration}
                    size="small"
                    sx={{
                      bgcolor: 'rgba(94, 92, 230, 0.1)',
                      color: '#374151',
                      fontWeight: 500
                    }}
                  />
                  {index < 3 && (
                    <Box
                      sx={{
                        position: 'absolute',
                        right: -2,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: 4,
                        height: 4,
                        borderRadius: '50%',
                        bgcolor: '#9CA3AF',
                        display: { xs: 'none', md: 'block' }
                      }}
                    />
                  )}
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* CTA */}
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
              Ready to Get Started?
            </Typography>
            <Typography variant="h6" sx={{ mb: 4, opacity: 0.9 }}>
              Schedule a personalized demo to see how Equitle can transform your investment process
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
              <Button 
                variant="contained" 
                size="large"
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
                Schedule Demo
              </Button>
              <Button 
                variant="outlined" 
                size="large"
                sx={{
                  borderColor: 'white',
                  color: 'white',
                  py: 1.5,
                  px: 4,
                  '&:hover': {
                    borderColor: 'white',
                    background: 'rgba(255, 255, 255, 0.1)'
                  }
                }}
                onClick={() => navigate('/pricing')}
              >
                View Pricing
              </Button>
            </Box>
          </Box>
        </Container>
      </Box>
    </>
  );
}