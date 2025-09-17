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
  Switch,
  FormControlLabel,
  Divider,
  Paper,
  Avatar,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import MarketingHeader from '../components/MarketingHeader';
import {
  ArrowForward as ArrowForwardIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Star as StarIcon,
  ExpandMore as ExpandMoreIcon,
  Speed as SpeedIcon,
  Business as BusinessIcon,
  Rocket as RocketIcon,
  Security as SecurityIcon,
  Support as SupportIcon,
  Api as ApiIcon,
  Analytics as AnalyticsIcon,
  Groups as GroupsIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Chat as ChatIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

export default function Pricing() {
  const navigate = useNavigate();
  const [annualBilling, setAnnualBilling] = useState(true);

  const plans = [
    {
      name: 'Searcher',
      description: 'Perfect for individual search funders and small teams',
      icon: <SpeedIcon />,
      monthlyPrice: 1500,
      annualPrice: 1200,
      popular: false,
      color: '#6B7280',
      features: [
        { name: 'Up to 100 target companies', included: true },
        { name: 'Basic relationship tracking', included: true },
        { name: 'Email automation & templates', included: true },
        { name: 'Email & chat support', included: true },
        { name: 'Basic deal pipeline management', included: true },
        { name: 'Up to 2 team members', included: true },
        { name: 'Data export capabilities', included: true },
        { name: 'Mobile app access', included: true },
        { name: 'AI-powered deal scoring', included: false },
        { name: 'Advanced relationship analytics', included: false },
        { name: 'Custom outreach campaigns', included: false },
        { name: 'API access', included: false },
        { name: 'Investor reporting tools', included: false },
        { name: 'Dedicated support', included: false }
      ]
    },
    {
      name: 'Search Fund',
      description: 'Ideal for established search funds with multiple team members',
      icon: <BusinessIcon />,
      monthlyPrice: 3000,
      annualPrice: 2400,
      popular: true,
      color: '#9CA3AF',
      features: [
        { name: 'Up to 500 target companies', included: true },
        { name: 'Advanced relationship management', included: true },
        { name: 'Custom deal pipeline dashboards', included: true },
        { name: 'Priority support + phone', included: true },
        { name: 'Custom investor reporting', included: true },
        { name: 'Up to 5 team members', included: true },
        { name: 'Advanced data integration', included: true },
        { name: 'Mobile app + offline access', included: true },
        { name: 'AI-powered deal scoring & insights', included: true },
        { name: 'Custom outreach campaigns', included: true },
        { name: 'Advanced relationship analytics', included: true },
        { name: 'Standard API access', included: true },
        { name: 'White-label investor reports', included: true },
        { name: 'Dedicated success manager', included: false }
      ]
    },
    {
      name: 'Enterprise',
      description: 'For large search funds and multi-fund platforms',
      icon: <RocketIcon />,
      monthlyPrice: null,
      annualPrice: null,
      popular: false,
      color: '#10B981',
      features: [
        { name: 'Unlimited target companies', included: true },
        { name: 'Full-featured relationship & deal management', included: true },
        { name: 'Unlimited custom dashboards', included: true },
        { name: '24/7 dedicated support', included: true },
        { name: 'Unlimited custom investor reports', included: true },
        { name: 'Unlimited team members', included: true },
        { name: 'Enterprise integrations', included: true },
        { name: 'White-label mobile apps', included: true },
        { name: 'Advanced AI & machine learning', included: true },
        { name: 'Enterprise workflow automation', included: true },
        { name: 'Predictive analytics & modeling', included: true },
        { name: 'Full API access & webhooks', included: true },
        { name: 'Fully branded platform', included: true },
        { name: 'Dedicated success manager', included: true }
      ]
    }
  ];

  const addOns = [
    {
      name: 'Additional Users',
      price: 150,
      description: 'Per user per month beyond plan limits',
      icon: <GroupsIcon />
    },
    {
      name: 'Premium Integrations',
      price: 500,
      description: 'Advanced CRM and data provider integrations',
      icon: <ApiIcon />
    },
    {
      name: 'Custom Development',
      price: 2500,
      description: 'Custom features and workflows built for your firm',
      icon: <SpeedIcon />
    },
    {
      name: 'Training & Onboarding',
      price: 1500,
      description: 'Comprehensive team training and setup assistance',
      icon: <SupportIcon />
    }
  ];

  const faqs = [
    {
      question: 'How is pricing determined?',
      answer: 'Pricing is based on your fund size, number of users, and feature requirements. We offer flexible plans that scale with your firm\'s growth and can customize packages for specific needs.'
    },
    {
      question: 'Is there a free trial?',
      answer: 'Yes! We offer a 14-day free trial with full access to all Professional plan features. No credit card required to start.'
    },
    {
      question: 'Can I change plans later?',
      answer: 'Absolutely. You can upgrade or downgrade your plan at any time. Changes take effect at your next billing cycle, and we\'ll prorate any differences.'
    },
    {
      question: 'What\'s included in implementation?',
      answer: 'All plans include data migration, system setup, and basic training. Professional and Enterprise plans include dedicated onboarding and advanced training sessions.'
    },
    {
      question: 'Do you offer volume discounts?',
      answer: 'Yes, we offer volume discounts for large teams and multi-year commitments. Contact our sales team for custom pricing based on your specific requirements.'
    },
    {
      question: 'What integrations are available?',
      answer: 'We integrate with leading CRMs (Salesforce, HubSpot), data rooms (Datasite, Intralinks), financial data providers (PitchBook, Preqin), and productivity tools. Custom integrations available for Enterprise clients.'
    }
  ];

  const comparisonFeatures = [
    { category: 'Deal Management', features: [
      'Deal pipeline tracking',
      'Due diligence workflows',
      'Document management',
      'Team collaboration',
      'Automated notifications'
    ]},
    { category: 'Portfolio Management', features: [
      'Portfolio dashboard',
      'KPI tracking',
      'Performance analytics',
      'Board package automation',
      'Value creation tracking'
    ]},
    { category: 'Reporting & Analytics', features: [
      'Standard reports',
      'Custom report builder',
      'White-label reports',
      'Advanced analytics',
      'Predictive modeling'
    ]},
    { category: 'Integrations & API', features: [
      'Basic integrations',
      'Premium integrations',
      'API access',
      'Webhook support',
      'Custom development'
    ]},
    { category: 'Support & Services', features: [
      'Email support',
      'Phone support',
      'Dedicated success manager',
      'Custom training',
      'Implementation services'
    ]}
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
          <Box sx={{ textAlign: 'center' }}>
            <Chip 
              label="TRANSPARENT PRICING" 
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
              Simple, Transparent
              <Box 
                component="span" 
                sx={{ 
                  background: 'linear-gradient(135deg, #9CA3AF 0%, #374151 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}
              >
                {' '}Pricing
              </Box>
            </Typography>
            <Typography variant="h5" sx={{ color: 'text.secondary', mb: 4, lineHeight: 1.6 }}>
              Choose the plan that fits your firm. Upgrade anytime as you grow.
            </Typography>
            
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2, mb: 4 }}>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                Monthly
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={annualBilling}
                    onChange={(e) => setAnnualBilling(e.target.checked)}
                    color="secondary"
                  />
                }
                label=""
              />
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                Annual
              </Typography>
              <Chip 
                label="Save 20%" 
                size="small"
                sx={{ 
                  bgcolor: 'success.main',
                  color: 'white',
                  fontWeight: 600
                }}
              />
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Pricing Cards */}
      <Box sx={{ py: 12, background: 'white' }}>
        <Container maxWidth="lg">
          <Grid container spacing={4} justifyContent="center">
            {plans.map((plan, index) => (
              <Grid item xs={12} md={4} key={index}>
                <Card
                  sx={{
                    p: 4,
                    height: '100%',
                    position: 'relative',
                    border: plan.popular ? `2px solid ${plan.color}` : '1px solid rgba(156, 163, 175, 0.08)',
                    transform: plan.popular ? 'scale(1.05)' : 'scale(1)',
                    '&:hover': {
                      boxShadow: `0 12px 32px ${plan.color}20`
                    },
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                >
                  {plan.popular && (
                    <Chip 
                      label="MOST POPULAR" 
                      size="small"
                      sx={{ 
                        position: 'absolute',
                        top: -10,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        bgcolor: plan.color,
                        color: 'white',
                        fontWeight: 600
                      }}
                    />
                  )}
                  
                  <Box sx={{ textAlign: 'center', mb: 4 }}>
                    <Avatar sx={{ bgcolor: plan.color, width: 56, height: 56, mx: 'auto', mb: 2 }}>
                      {plan.icon}
                    </Avatar>
                    <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                      {plan.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                      {plan.description}
                    </Typography>
                    
                    {plan.monthlyPrice ? (
                      <Box>
                        <Typography 
                          variant="h2" 
                          sx={{ 
                            fontFamily: '"Space Grotesk", sans-serif',
                            fontWeight: 700,
                            color: plan.color
                          }}
                        >
                          ${annualBilling ? plan.annualPrice!.toLocaleString() : plan.monthlyPrice.toLocaleString()}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          per month{annualBilling && ', billed annually'}
                        </Typography>
                        {annualBilling && (
                          <Typography variant="caption" sx={{ color: 'success.main', fontWeight: 600 }}>
                            Save ${((plan.monthlyPrice - plan.annualPrice!) * 12).toLocaleString()} per year
                          </Typography>
                        )}
                      </Box>
                    ) : (
                      <Box>
                        <Typography 
                          variant="h2" 
                          sx={{ 
                            fontFamily: '"Space Grotesk", sans-serif',
                            fontWeight: 700,
                            color: plan.color
                          }}
                        >
                          Custom
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Contact us for pricing
                        </Typography>
                      </Box>
                    )}
                  </Box>

                  <Button
                    variant={plan.popular ? "contained" : "outlined"}
                    fullWidth
                    size="large"
                    sx={{
                      mb: 3,
                      bgcolor: plan.popular ? plan.color : 'transparent',
                      borderColor: plan.color,
                      color: plan.popular ? 'white' : plan.color,
                      '&:hover': {
                        bgcolor: plan.popular ? `${plan.color}dd` : `${plan.color}08`,
                        borderColor: plan.color
                      }
                    }}
                  >
                    {plan.monthlyPrice ? 'Start Free Trial' : 'Contact Sales'}
                  </Button>

                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 2 }}>
                    What's included:
                  </Typography>
                  <List dense>
                    {plan.features.slice(0, 8).map((feature, idx) => (
                      <ListItem key={idx} sx={{ px: 0, py: 0.5 }}>
                        <ListItemIcon sx={{ minWidth: 28 }}>
                          {feature.included ? (
                            <CheckIcon sx={{ fontSize: 16, color: 'success.main' }} />
                          ) : (
                            <CloseIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
                          )}
                        </ListItemIcon>
                        <ListItemText 
                          primary={feature.name}
                          primaryTypographyProps={{
                            fontSize: '0.875rem',
                            color: feature.included ? 'text.primary' : 'text.disabled'
                          }}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Box sx={{ textAlign: 'center', mt: 6 }}>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
              All plans include 14-day free trial • No setup fees • Cancel anytime
            </Typography>
            <Button 
              variant="text"
              endIcon={<ArrowForwardIcon />}
              onClick={() => navigate('/solutions')}
            >
              Compare all features
            </Button>
          </Box>
        </Container>
      </Box>

      {/* Add-ons */}
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
              Add-ons & Services
            </Typography>
            <Typography variant="h6" color="text.secondary">
              Enhance your plan with additional features and services
            </Typography>
          </Box>

          <Grid container spacing={4}>
            {addOns.map((addOn, index) => (
              <Grid item xs={12} md={6} key={index}>
                <Card
                  sx={{
                    p: 3,
                    height: '100%',
                    border: '1px solid rgba(156, 163, 175, 0.08)',
                    '&:hover': {
                      boxShadow: '0 8px 24px rgba(94, 92, 230, 0.1)'
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Avatar sx={{ bgcolor: '#9CA3AF' }}>
                      {addOn.icon}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {addOn.name}
                      </Typography>
                      <Typography variant="h5" sx={{ fontWeight: 700, color: '#374151' }}>
                        ${addOn.price}/month
                      </Typography>
                    </Box>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {addOn.description}
                  </Typography>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Feature Comparison */}
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
              Feature Comparison
            </Typography>
            <Typography variant="h6" color="text.secondary">
              Compare features across all plans
            </Typography>
          </Box>

          <TableContainer component={Paper} sx={{ border: '1px solid rgba(94, 92, 230, 0.08)' }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, fontSize: '1rem' }}>Features</TableCell>
                  {plans.map((plan) => (
                    <TableCell key={plan.name} align="center" sx={{ fontWeight: 600, fontSize: '1rem', color: plan.color }}>
                      {plan.name}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {comparisonFeatures.map((category) => (
                  <React.Fragment key={category.category}>
                    <TableRow>
                      <TableCell 
                        colSpan={4} 
                        sx={{ 
                          bgcolor: 'rgba(94, 92, 230, 0.05)',
                          fontWeight: 600,
                          fontSize: '0.9rem'
                        }}
                      >
                        {category.category}
                      </TableCell>
                    </TableRow>
                    {category.features.map((feature, idx) => (
                      <TableRow key={feature}>
                        <TableCell>{feature}</TableCell>
                        {plans.map((plan) => {
                          const planFeature = plan.features.find(f => f.name.toLowerCase().includes(feature.toLowerCase()));
                          const included = planFeature?.included ?? (idx === 0 || plan.name === 'Enterprise' || (plan.name === 'Professional' && idx <= 2));
                          return (
                            <TableCell key={plan.name} align="center">
                              {included ? (
                                <CheckIcon sx={{ color: 'success.main', fontSize: 20 }} />
                              ) : (
                                <CloseIcon sx={{ color: 'text.disabled', fontSize: 20 }} />
                              )}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))}
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Container>
      </Box>

      {/* Support Options */}
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
              Support & Services
            </Typography>
            <Typography variant="h6" color="text.secondary">
              We're here to help you succeed
            </Typography>
          </Box>

          <Grid container spacing={4}>
            <Grid item xs={12} md={4}>
              <Card sx={{ p: 3, textAlign: 'center', height: '100%' }}>
                <Avatar sx={{ bgcolor: '#10B981', width: 56, height: 56, mx: 'auto', mb: 2 }}>
                  <ChatIcon />
                </Avatar>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                  24/7 Chat Support
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Instant help when you need it with our intelligent chat system
                </Typography>
                <Chip label="All Plans" size="small" sx={{ bgcolor: 'success.main', color: 'white' }} />
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card sx={{ p: 3, textAlign: 'center', height: '100%' }}>
                <Avatar sx={{ bgcolor: '#F59E0B', width: 56, height: 56, mx: 'auto', mb: 2 }}>
                  <PhoneIcon />
                </Avatar>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                  Priority Phone Support
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Direct phone access to our expert support team
                </Typography>
                <Chip label="Pro & Enterprise" size="small" sx={{ bgcolor: 'warning.main', color: 'white' }} />
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card sx={{ p: 3, textAlign: 'center', height: '100%' }}>
                <Avatar sx={{ bgcolor: '#9CA3AF', width: 56, height: 56, mx: 'auto', mb: 2 }}>
                  <SupportIcon />
                </Avatar>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                  Dedicated Success Manager
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Personal advisor to help optimize your investment process
                </Typography>
                <Chip label="Enterprise Only" size="small" sx={{ bgcolor: '#9CA3AF', color: 'white' }} />
              </Card>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* FAQs */}
      <Box sx={{ py: 12, background: 'white' }}>
        <Container maxWidth="md">
          <Box sx={{ textAlign: 'center', mb: 8 }}>
            <Typography 
              variant="h2" 
              sx={{ 
                fontFamily: '"Space Grotesk", sans-serif',
                fontWeight: 700,
                mb: 2
              }}
            >
              Frequently Asked Questions
            </Typography>
            <Typography variant="h6" color="text.secondary">
              Everything you need to know about our pricing
            </Typography>
          </Box>

          {faqs.map((faq, index) => (
            <Accordion 
              key={index}
              sx={{ 
                mb: 2, 
                border: '1px solid rgba(94, 92, 230, 0.08)',
                '&:before': { display: 'none' },
                '&.Mui-expanded': {
                  boxShadow: '0 4px 12px rgba(94, 92, 230, 0.1)'
                }
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                sx={{ 
                  '& .MuiAccordionSummary-content': {
                    my: 2
                  }
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {faq.question}
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                  {faq.answer}
                </Typography>
              </AccordionDetails>
            </Accordion>
          ))}

          <Box sx={{ textAlign: 'center', mt: 6 }}>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
              Still have questions? We're here to help.
            </Typography>
            <Button 
              variant="outlined"
              endIcon={<EmailIcon />}
            >
              Contact Sales Team
            </Button>
          </Box>
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
              Start your 14-day free trial today. No credit card required.
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
                Start Free Trial
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
              >
                Schedule Demo
              </Button>
            </Box>
          </Box>
        </Container>
      </Box>
    </>
  );
}