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
  Tab,
  Tabs,
  Fade,
  Zoom,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Paper,
  Avatar
} from '@mui/material';
import MarketingHeader from '../components/MarketingHeader';
import Footer from '../components/Footer';
import {
  ArrowForward as ArrowForwardIcon,
  Check as CheckIcon,
  ExpandMore as ExpandMoreIcon,
  Speed as SpeedIcon,
  Analytics as AnalyticsIcon,
  AutoGraph as AutoGraphIcon,
  Groups as GroupsIcon,
  Psychology as AIIcon,
  Dashboard as DashboardIcon,
  IntegrationInstructions as IntegrationIcon,
  CloudUpload as CloudIcon,
  Timeline as TimelineIcon,
  Assessment as AssessmentIcon,
  Business as BusinessIcon,
  Insights as InsightIcon,
  DataUsage as DataIcon,
  Api as ApiIcon,
  PhoneAndroid as MobileIcon,
  PhoneAndroid,
  LockOutlined as LockIcon
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

export default function Product() {
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);

  const features = [
    {
      category: 'Automated Note Taking',
      icon: <AIIcon sx={{ fontSize: 40 }} />,
      color: '#9CA3AF',
      items: [
        {
          title: 'Meeting Intelligence',
          description: 'AI automatically captures and transcribes meeting notes, extracting key insights and action items',
          benefits: ['Real-time transcription', 'Action item extraction', 'Key insight identification']
        },
        {
          title: 'Smart Note Organization',
          description: 'Automatically categorizes and tags notes for easy retrieval and analysis',
          benefits: ['Auto-categorization', 'Smart tagging', 'Searchable database']
        },
        {
          title: 'Intelligence Integration',
          description: 'Meeting insights are automatically added to your deal intelligence and relationship profiles',
          benefits: ['Deal context updates', 'Relationship scoring', 'Pipeline intelligence']
        }
      ]
    },
    {
      category: 'Automated Calling',
      icon: <PhoneAndroid sx={{ fontSize: 40 }} />,
      color: '#9CA3AF',
      items: [
        {
          title: 'Prospect Outreach Automation',
          description: 'AI automatically calls POCs at prospective businesses based on your criteria and timing',
          benefits: ['Automated dialing', 'Smart scheduling', 'Call outcome tracking']
        },
        {
          title: 'Intelligent Conversation Flow',
          description: 'AI conducts initial conversations to qualify prospects and gather key information',
          benefits: ['Natural conversation', 'Qualification questions', 'Information capture']
        },
        {
          title: 'Follow-up Management',
          description: 'Automatically schedules follow-ups and tracks conversation history with prospects',
          benefits: ['Auto-scheduling', 'Conversation tracking', 'Relationship building']
        }
      ]
    },
    {
      category: 'Deal Management',
      icon: <BusinessIcon sx={{ fontSize: 40 }} />,
      color: '#10B981',
      items: [
        {
          title: 'Pipeline Management',
          description: 'Complete deal lifecycle management from sourcing to exit',
          benefits: ['Visual pipeline', 'Stage tracking', 'Milestone alerts']
        },
        {
          title: 'Document Management',
          description: 'Centralized document storage with version control and security',
          benefits: ['Secure storage', 'Version control', 'Access permissions']
        },
        {
          title: 'Due Diligence Workflows',
          description: 'Streamlined DD processes with automated checklists and reviews',
          benefits: ['Automated workflows', 'Progress tracking', 'Collaboration tools']
        }
      ]
    },
    {
      category: 'Brain',
      icon: <AIIcon sx={{ fontSize: 40 }} />,
      color: '#9CA3AF',
      items: [
        {
          title: 'Central LLM Intelligence',
          description: 'A central large language model that serves as your AI-powered knowledge base and advisor',
          benefits: ['Natural language queries', 'Contextual responses', 'Intelligent insights']
        },
        {
          title: 'Knowledge Base Integration',
          description: 'Connects all your data sources to create a comprehensive knowledge base for informed decision making',
          benefits: ['Unified data access', 'Cross-reference insights', 'Historical context']
        },
        {
          title: 'Intelligent Recommendations',
          description: 'AI-powered suggestions based on your deal history, market data, and investment patterns',
          benefits: ['Deal recommendations', 'Risk assessments', 'Strategic guidance']
        }
      ]
    },
    {
      category: 'Collaboration',
      icon: <GroupsIcon sx={{ fontSize: 40 }} />,
      color: '#3B82F6',
      items: [
        {
          title: 'Team Workspace',
          description: 'Collaborative environment for deal teams and stakeholders',
          benefits: ['Real-time collaboration', 'Task management', 'Communication hub']
        },
        {
          title: 'Workflow Automation',
          description: 'Automated workflows for repetitive tasks and approvals',
          benefits: ['Process automation', 'Approval workflows', 'Notifications']
        },
        {
          title: 'Stakeholder Portal',
          description: 'Secure portal for external stakeholders and LPs',
          benefits: ['External access', 'Branded portal', 'Controlled sharing']
        }
      ]
    }
  ];

  const integrations = [
    {
      category: 'CRM Systems',
      items: ['Salesforce', 'HubSpot', 'Microsoft Dynamics', 'Pipedrive'],
      icon: <BusinessIcon />
    },
    {
      category: 'Data Rooms',
      items: ['Datasite', 'Intralinks', 'DealRoom', 'SecureDocs'],
      icon: <LockIcon />
    },
    {
      category: 'Financial Data',
      items: ['PitchBook', 'Preqin', 'Bloomberg', 'FactSet'],
      icon: <DataIcon />
    },
    {
      category: 'Productivity',
      items: ['Microsoft 365', 'Google Workspace', 'Slack', 'Zoom'],
      icon: <IntegrationIcon />
    }
  ];


  const faqs = [
    {
      question: 'How does Equitle\'s AI work?',
      answer: 'Equitle uses advanced machine learning algorithms trained on private equity data to identify patterns, assess risks, and predict outcomes. Our AI continuously learns from your firm\'s investment patterns and market data to provide increasingly accurate insights.'
    },
    {
      question: 'What integrations are available?',
      answer: 'Equitle integrates with leading CRMs (Salesforce, HubSpot), data rooms (Datasite, Intralinks), financial data providers (PitchBook, Preqin), and productivity tools (Microsoft 365, Google Workspace). We also offer API access for custom integrations.'
    },
    {
      question: 'How secure is my data?',
      answer: 'Your data security is our top priority. We use bank-grade encryption, maintain SOC 2 Type II compliance, and offer data residency options. All data is encrypted in transit and at rest, with comprehensive audit trails and access controls.'
    },
    {
      question: 'Can I customize workflows?',
      answer: 'Yes, Equitle is highly customizable. You can create custom workflows, fields, reports, and dashboards tailored to your firm\'s specific processes. Our workflow automation engine can be configured to match your existing procedures.'
    },
    {
      question: 'What support is included?',
      answer: 'All plans include comprehensive onboarding, training, and ongoing support. Our customer success team provides dedicated support, regular check-ins, and best practice guidance to ensure you get maximum value from the platform.'
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
          <Grid container spacing={6} alignItems="center">
            <Grid item xs={12} md={8}>
              <Chip 
                label="PRODUCT OVERVIEW" 
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
                  fontWeight: 700,
                  fontSize: { xs: '2.5rem', md: '3.5rem' },
                  lineHeight: 1.2,
                  mb: 3
                }}
              >
                The Complete Platform for 
                <Box 
                  component="span" 
                  sx={{ 
                    background: 'linear-gradient(135deg, #9CA3AF 0%, #374151 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}
                >
                  {' '}Searchers
                </Box>
              </Typography>
              <Typography variant="h5" sx={{ color: 'text.secondary', mb: 4, lineHeight: 1.6 }}>
                From deal sourcing to portfolio management, Equitle provides the AI-powered tools and insights you need to succeed in your search.
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
                <Button 
                  variant="contained" 
                  size="large"
                  endIcon={<ArrowForwardIcon />}
                  sx={{
                    background: 'linear-gradient(135deg, #9CA3AF 0%, #374151 100%)',
                    py: 1.5,
                    px: 4
                  }}
                >
                  Start Free Trial
                </Button>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box
                sx={{
                  height: 400,
                  borderRadius: 3,
                  background: 'linear-gradient(135deg, rgba(94, 92, 230, 0.05) 0%, rgba(124, 122, 237, 0.05) 100%)',
                  border: '1px solid rgba(94, 92, 230, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                <DashboardIcon sx={{ fontSize: 120, color: '#9CA3AF', opacity: 0.3 }} />
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Feature Categories */}
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
              Comprehensive Feature Set
            </Typography>
            <Typography variant="h6" color="text.secondary">
              Everything you need to manage your search fund operations
            </Typography>
          </Box>

          <Tabs 
            value={tabValue} 
            onChange={(e, v) => setTabValue(v)} 
            variant="scrollable"
            scrollButtons="auto"
            sx={{ mb: 6, '& .MuiTab-root': { minWidth: 200 } }}
          >
            {features.map((feature, index) => (
              <Tab 
                key={index}
                label={feature.category} 
                icon={React.cloneElement(feature.icon, { 
                  sx: { fontSize: 24, color: '#9CA3AF' } 
                })}
                iconPosition="start"
                sx={{ 
                  textTransform: 'none',
                  fontSize: '1rem',
                  fontWeight: 500,
                  minHeight: 64
                }}
              />
            ))}
          </Tabs>

          {features.map((feature, index) => (
            <TabPanel key={index} value={tabValue} index={index}>
              <Fade in timeout={500}>
                <Grid container spacing={4}>
                  {feature.items.map((item, idx) => (
                    <Grid item xs={12} md={4} key={idx}>
                      <Card
                        sx={{
                          p: 3,
                          height: '100%',
                          border: '1px solid rgba(94, 92, 230, 0.08)',
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          '&:hover': {
                            transform: 'translateY(-4px)',
                            boxShadow: '0 12px 32px rgba(94, 92, 230, 0.15)',
                            border: '1px solid rgba(156, 163, 175, 0.2)'
                          }
                        }}
                      >
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                          {item.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3, lineHeight: 1.7 }}>
                          {item.description}
                        </Typography>
                        <List dense>
                          {item.benefits.map((benefit, benefitIdx) => (
                            <ListItem key={benefitIdx} sx={{ px: 0, py: 0.5 }}>
                              <ListItemIcon sx={{ minWidth: 28 }}>
                                <CheckIcon sx={{ fontSize: 16, color: '#9CA3AF' }} />
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
              </Fade>
            </TabPanel>
          ))}
        </Container>
      </Box>

      {/* Integrations */}
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
              Seamless Integrations
            </Typography>
            <Typography variant="h6" color="text.secondary">
              Connect with the tools you already use
            </Typography>
          </Box>

          <Grid container spacing={4}>
            {integrations.map((integration, index) => (
              <Grid item xs={12} md={6} lg={3} key={index}>
                <Card
                  sx={{
                    p: 3,
                    height: '100%',
                    textAlign: 'center',
                    border: '1px solid rgba(94, 92, 230, 0.08)',
                    '&:hover': {
                      boxShadow: '0 8px 24px rgba(94, 92, 230, 0.1)'
                    }
                  }}
                >
                  <Box sx={{ mb: 2, color: '#9CA3AF' }}>
                    {integration.icon}
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                    {integration.category}
                  </Typography>
                  <List dense>
                    {integration.items.map((item, idx) => (
                      <ListItem key={idx} sx={{ px: 0, justifyContent: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                          {item}
                        </Typography>
                      </ListItem>
                    ))}
                  </List>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Box sx={{ textAlign: 'center', mt: 6 }}>
            <Typography variant="body1" color="text.secondary">
              Don't see your tool? We offer custom integrations and API access.
            </Typography>
          </Box>
        </Container>
      </Box>


      {/* Platform Architecture */}
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
              Built for Scale
            </Typography>
            <Typography variant="h6" color="text.secondary">
              Modern architecture designed to grow with your firm
            </Typography>
          </Box>

          <Grid container spacing={4}>
            <Grid item xs={12} md={4}>
              <Card sx={{ p: 3, textAlign: 'center', height: '100%' }}>
                <CloudIcon sx={{ fontSize: 48, color: '#9CA3AF', mb: 2 }} />
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                  Cloud-Native
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Built on modern cloud infrastructure for reliability, scalability, and performance
                </Typography>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card sx={{ p: 3, textAlign: 'center', height: '100%' }}>
                <MobileIcon sx={{ fontSize: 48, color: '#9CA3AF', mb: 2 }} />
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                  Mobile Ready
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Access your deals and portfolio data from anywhere with our responsive design
                </Typography>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card sx={{ p: 3, textAlign: 'center', height: '100%' }}>
                <ApiIcon sx={{ fontSize: 48, color: '#9CA3AF', mb: 2 }} />
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                  API-First
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Comprehensive APIs enable custom integrations and workflow automation
                </Typography>
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
              Everything you need to know about Equitle
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
              Ready to Transform Your Deal Flow?
            </Typography>
            <Typography variant="h6" sx={{ mb: 4, opacity: 0.9 }}>
              Join a community of searchers using Equitle to make smarter investment decisions
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