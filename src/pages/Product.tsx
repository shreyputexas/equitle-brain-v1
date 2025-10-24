import React, { useState, useEffect } from 'react';
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
  LockOutlined as LockIcon,
  Web as ScrapingIcon,
  Voicemail as VoicemailIcon,
  Contacts as ContactsIcon,
  Email as EmailIcon,
  Search as SearchIcon,
  Link as LinkIcon,
  PersonAdd as PersonAddIcon,
  Business as BusinessIcon2,
  AttachMoney as AttachMoneyIcon,
  Store as StoreIcon,
  Description as DescriptionIcon,
  TrendingUp as TrendingUpIcon,
  Assessment as AssessmentIcon2,
  Score as ScoreIcon,
  Psychology as PsychologyIcon,
  Lightbulb as LightbulbIcon,
  AutoAwesome as AutoAwesomeIcon,
  TrackChanges as TrackChangesIcon,
  Timeline as TimelineIcon2,
  SentimentSatisfied as SentimentIcon,
  Analytics as AnalyticsIcon2,
  Label as LabelIcon,
  Search as SearchIcon2,
  Person as PersonIcon,
  Schedule as ScheduleIcon,
  Autorenew as AutorenewIcon,
  BarChart as BarChartIcon,
  Psychology as PsychologyIcon2,
  RecordVoiceOver as RecordVoiceOverIcon,
  ContentCopy as ContentCopyIcon,
  Campaign as CampaignIcon,
  SentimentSatisfied as SentimentSatisfiedIcon,
  Analytics as AnalyticsIcon3,
  HeadsetMic as HeadsetMicIcon,
  LibraryBooks as LibraryBooksIcon,
  Tune as TuneIcon,
  Psychology as PsychologyIcon3,
  Speed as SpeedIcon2,
  Message as MessageIcon,
  TrendingUp as TrendingUpIcon2,
  AutoAwesome as AutoAwesomeIcon2,
  Group as GroupIcon,
  AccountBalance as AccountBalanceIcon,
  Schedule as ScheduleIcon2,
  Analytics as AnalyticsIcon4,
  Timeline as TimelineIcon3
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
  const [currentFeatureIndex, setCurrentFeatureIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    document.title = 'Product - Equitle';
  }, []);

  useEffect(() => {
    // Handle hash navigation
    const hash = window.location.hash;
    if (hash === '#integrations') {
      setTimeout(() => {
        const element = document.getElementById('integrations');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
  }, []);

  const handleNextFeature = () => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    const totalFeatures = features.reduce((total, category) => total + category.items.length, 0);
    setCurrentFeatureIndex((prev) => (prev + 1) % totalFeatures);
    
    // Reset animation state after animation completes
    setTimeout(() => {
      setIsAnimating(false);
    }, 800);
  };

  const handlePrevFeature = () => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    const totalFeatures = features.reduce((total, category) => total + category.items.length, 0);
    setCurrentFeatureIndex((prev) => (prev - 1 + totalFeatures) % totalFeatures);
    
    // Reset animation state after animation completes
    setTimeout(() => {
      setIsAnimating(false);
    }, 800);
  };

  const features = [
    {
      category: 'Lead Management',
      icon: <ContactsIcon sx={{ fontSize: 40 }} />,
      color: '#9CA3AF',
      items: [
        {
          title: 'Lead Management',
          description: 'Find new leads by integrating your data providers, enrich existing contacts, and discover brokers, investors, and target companies.',
          benefits: [
            { text: 'Find new leads', icon: <SearchIcon sx={{ fontSize: 16 }} /> },
            { text: 'Data provider integration', icon: <LinkIcon sx={{ fontSize: 16 }} /> },
            { text: 'Enrich existing contacts', icon: <PersonAddIcon sx={{ fontSize: 16 }} /> },
            { text: 'Discover brokers', icon: <BusinessIcon2 sx={{ fontSize: 16 }} /> },
            { text: 'Find investors', icon: <AttachMoneyIcon sx={{ fontSize: 16 }} /> },
            { text: 'Target companies', icon: <StoreIcon sx={{ fontSize: 16 }} /> }
          ]
        }
      ]
    },
    {
      category: 'Thesis Management',
      icon: <AssessmentIcon sx={{ fontSize: 40 }} />,
      color: '#9CA3AF',
      items: [
        {
          title: 'Thesis Management',
          description: 'Develop your investment thesis to power the central knowledge base of Equitle. It will be used as context for industry reports, outreach, and more.',
          benefits: [
            { text: 'Industry Report Creation', icon: <DescriptionIcon sx={{ fontSize: 16 }} /> },
            { text: 'Market Analysis', icon: <TrendingUpIcon sx={{ fontSize: 16 }} /> },
            { text: 'One Pager Generation', icon: <AssessmentIcon2 sx={{ fontSize: 16 }} /> },
            { text: 'Weightage', icon: <ScoreIcon sx={{ fontSize: 16 }} /> },
            { text: 'Scorecards', icon: <ScoreIcon sx={{ fontSize: 16 }} /> },
            { text: 'Deal Intelligence', icon: <LightbulbIcon sx={{ fontSize: 16 }} /> }
          ]
        }
      ]
    },
    {
      category: 'Pipeline Autopopulation',
      icon: <TimelineIcon sx={{ fontSize: 40 }} />,
      color: '#9CA3AF',
      items: [
        {
          title: 'Pipeline Autopopulation',
          description: 'Visual pipeline management to track deals from initial contact to closing with automated workflows and comprehensive analytics.',
          benefits: [
            { text: 'Autopopulation', icon: <AutoAwesomeIcon sx={{ fontSize: 16 }} /> },
            { text: 'Deal Tracking', icon: <TrackChangesIcon sx={{ fontSize: 16 }} /> },
            { text: 'Stage Management', icon: <TimelineIcon2 sx={{ fontSize: 16 }} /> },
            { text: 'Sentiment Analysis', icon: <SentimentIcon sx={{ fontSize: 16 }} /> },
            { text: 'Campaign Analytics', icon: <AnalyticsIcon2 sx={{ fontSize: 16 }} /> },
            { text: 'Document Tagging', icon: <LabelIcon sx={{ fontSize: 16 }} /> }
          ]
        }
      ]
    },
    {
      category: 'Automated Email Campaigns',
      icon: <EmailIcon sx={{ fontSize: 40 }} />,
      color: '#9CA3AF',
      items: [
        {
          title: 'Automated Email Campaigns',
          description: 'AI-powered email generation and sequencing for personalized outreach campaigns based on detailed analysis and research on target companies, brokers, and investors.',
          benefits: [
            { text: 'Comprehensive Research', icon: <SearchIcon2 sx={{ fontSize: 16 }} /> },
            { text: 'Personalization', icon: <PersonIcon sx={{ fontSize: 16 }} /> },
            { text: 'Schedule Emails', icon: <ScheduleIcon sx={{ fontSize: 16 }} /> },
            { text: 'Automated Follow Ups', icon: <AutorenewIcon sx={{ fontSize: 16 }} /> },
            { text: 'Performance Analytics', icon: <BarChartIcon sx={{ fontSize: 16 }} /> },
            { text: 'Sentiment Analysis', icon: <PsychologyIcon2 sx={{ fontSize: 16 }} /> }
          ]
        }
      ]
    },
    {
      category: 'Automated Calls',
      icon: <PhoneAndroid sx={{ fontSize: 40 }} />,
      color: '#9CA3AF',
      items: [
        {
          title: 'Automated Calls & Voicemails',
          description: 'Agentic voice calls in your voice, with personalized messages based on the prospect\'s data and interaction history. Send automated voicemails in your voice to prospects to book a follow up call.',
          benefits: [
            { text: 'Agentic Voice Calls', icon: <RecordVoiceOverIcon sx={{ fontSize: 16 }} /> },
            { text: 'Voice Cloning', icon: <ContentCopyIcon sx={{ fontSize: 16 }} /> },
            { text: 'Voicemail Campaigns', icon: <CampaignIcon sx={{ fontSize: 16 }} /> },
            { text: 'Sentiment Analysis', icon: <SentimentSatisfiedIcon sx={{ fontSize: 16 }} /> },
            { text: 'Call Analytics', icon: <AnalyticsIcon3 sx={{ fontSize: 16 }} /> },
            { text: 'Hands-Free Experience', icon: <HeadsetMicIcon sx={{ fontSize: 16 }} /> }
          ]
        }
      ]
    },
    {
      category: 'One Pager Generation',
      icon: <AssessmentIcon sx={{ fontSize: 40 }} />,
      color: '#9CA3AF',
      items: [
        {
          title: 'One Pager Generation',
          description: 'Autogenerate one pagers for investment opportunities and firm pitch with template management and engagement analytics, using context from your investment thesis and profile.',
          benefits: [
            { text: 'Template Library', icon: <LibraryBooksIcon sx={{ fontSize: 16 }} /> },
            { text: 'Content Optimization', icon: <TuneIcon sx={{ fontSize: 16 }} /> },
            { text: 'Contextual Understanding', icon: <PsychologyIcon3 sx={{ fontSize: 16 }} /> },
            { text: '20 Second Generation', icon: <SpeedIcon2 sx={{ fontSize: 16 }} /> },
            { text: 'Personalized Messaging', icon: <MessageIcon sx={{ fontSize: 16 }} /> },
            { text: 'Latest Industry Insights', icon: <TrendingUpIcon2 sx={{ fontSize: 16 }} /> }
          ]
        }
      ]
    },
    {
      category: 'Investor Reporting',
      icon: <BusinessIcon sx={{ fontSize: 40 }} />,
      color: '#9CA3AF',
      items: [
        {
          title: 'Investor Reporting',
          description: 'Automated investor reporting to keep your investors updated on your progress, spending, and pipeline. Send reports on progress and potential acquisitions to keep them in the loop.',
          benefits: [
            { text: 'Automated Reports', icon: <AutoAwesomeIcon2 sx={{ fontSize: 16 }} /> },
            { text: 'LP Updates', icon: <GroupIcon sx={{ fontSize: 16 }} /> },
            { text: 'Budget Reports', icon: <AccountBalanceIcon sx={{ fontSize: 16 }} /> },
            { text: 'Custom Update Frequency', icon: <ScheduleIcon2 sx={{ fontSize: 16 }} /> },
            { text: 'Engagement Analytics', icon: <AnalyticsIcon4 sx={{ fontSize: 16 }} /> },
            { text: 'Pipeline Updates', icon: <TimelineIcon3 sx={{ fontSize: 16 }} /> }
          ]
        }
      ]
    }
  ];

  const integrations = [
    {
      category: 'Data Providers',
      items: ['Grata', 'ZoomInfo', 'Apollo', 'LinkedIn Sales Navigator'],
      icon: <ScrapingIcon />
    },
    {
      category: 'Suite',
      items: ['Google Workspace', 'Microsoft 365', 'Google Drive', 'OneDrive'],
      icon: <IntegrationIcon />
    },
    {
      category: 'Financial Data',
      items: ['PitchBook', 'Preqin', 'Bloomberg', 'FactSet'],
      icon: <DataIcon />
    }
  ];


  const faqs = [
    {
      question: 'How does Equitle\'s AI work?',
      answer: 'Equitle stores your deal pipeline history so our fine-tuned large language model can answer questions accurately and provide proper insights.'
    },
    {
      question: 'How do the automated voicemails work?',
      answer: 'Equitle sends automated voicemails to your prospects in your voice, with a personalized message based on the prospect\'s data and interaction history. The main goal is to book a follow up call with the prospect.'
    },
    {
      question: 'What integrations are available?',
      answer: 'Equitle integrates with data providers (Apollo, Grata, ZoomInfo), your productivity tools (Microsoft 365, Google Workspace), and your financial data providers (PitchBook, Preqin, Bloomberg, FactSet).'
    },
    {
      question: 'Why not use existing softwares to source deals?',
      answer: 'Equitle is built specifically for private equity firms to source deals and manage the entire deal pipeline. It is 1 platform that consolidates your entire tech stack so you can focus on closing isntead of administrativie work.'
    },
    {
      question: 'How does investor communication work?',
      answer: 'Operators have a hard time dealing with investor relations while sourcing a deal. Equitle updates your investors on your progress, spending, and pipeline on a frequency decided by you.'
    }
  ];

  return (
    <>
      <MarketingHeader />
      

      {/* Feature Categories */}
      <Box sx={{ pt: 24, pb: 12, background: 'linear-gradient(180deg, #000000 0%, #434343 100%)', color: '#FFFFFF' }}>
        <Box sx={{ textAlign: 'center', mb: 12, px: { xs: 2, md: 4 } }}>
          <Box sx={{ textAlign: 'center', mb: 2 }}>
            <Typography 
              variant="h2" 
              sx={{ 
                fontFamily: "'Poppins', 'Inter', 'Roboto', 'Helvetica', 'Arial', sans-serif",
                fontWeight: 700,
                color: '#FFFFFF'
              }}
            >
              Our Feature Set
            </Typography>
          </Box>
          <Typography variant="h6" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
            Everything you need to manage your sourcing operations
            </Typography>
          </Box>

        <Box sx={{ position: 'relative', height: '450px', overflow: 'hidden', px: { xs: 2, md: 4 } }}>
          {/* Left Arrow */}
          <Button
            onClick={handlePrevFeature}
            sx={{
              position: 'absolute',
              left: { xs: '10px', md: '20px' },
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#FFFFFF',
              fontSize: '2rem',
              fontWeight: 'bold',
              minWidth: 'auto',
              width: '40px',
              height: '40px',
              zIndex: 10,
              backgroundColor: 'transparent'
            }}
          >
            &lt;
          </Button>

          {/* Right Arrow */}
          <Button
            onClick={handleNextFeature}
                sx={{ 
              position: 'absolute',
              right: { xs: '10px', md: '20px' },
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#FFFFFF',
              fontSize: '2rem',
              fontWeight: 'bold',
              minWidth: 'auto',
              width: '40px',
              height: '40px',
              zIndex: 10,
              backgroundColor: 'transparent'
            }}
          >
            &gt;
          </Button>

          <Box sx={{ 
            position: 'relative', 
            width: '100%', 
            maxWidth: '1000px', 
            height: '100%',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
                {features.flatMap((category, categoryIdx) => 
                  category.items.map((item, itemIdx) => {
                    const globalIndex = features.slice(0, categoryIdx).reduce((acc, cat) => acc + cat.items.length, 0) + itemIdx;
                    return (
                      <Box
                        key={`${categoryIdx}-${itemIdx}`}
                        sx={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          width: '100%',
                          height: '100%',
                          zIndex: globalIndex === currentFeatureIndex ? 2 : 1,
                          transform: globalIndex === currentFeatureIndex 
                            ? 'translateX(0)' 
                            : globalIndex < currentFeatureIndex 
                              ? 'translateX(-100%)' 
                              : 'translateX(100%)',
                          opacity: globalIndex === currentFeatureIndex ? 1 : 0,
                          transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                          willChange: 'transform, opacity'
                        }}
                      >
                        <Card
                          sx={{
                            p: 4,
                            height: '100%',
                            background: `
                              linear-gradient(180deg, rgba(16, 185, 129, 0.6) 0%, rgba(5, 150, 105, 0.6) 30%, rgba(4, 120, 87, 0.6) 70%, rgba(6, 78, 59, 0.6) 100%),
                              radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%),
                              radial-gradient(circle at 80% 20%, rgba(255,255,255,0.05) 0%, transparent 50%),
                              radial-gradient(circle at 40% 80%, rgba(0,0,0,0.1) 0%, transparent 50%)
                            `,
                            backdropFilter: 'blur(10px)',
                            border: '2px solid rgba(16, 185, 129, 0.3)',
                            borderRadius: 0,
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
                          <Box sx={{ position: 'relative', zIndex: 2, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                            <Box>
                              <Typography 
                                variant="h4" 
                                sx={{ 
                                  fontFamily: "'Poppins', 'Inter', 'Roboto', 'Helvetica', 'Arial', sans-serif",
                                  fontWeight: 600,
                                  mb: 2,
                                  color: '#FFFFFF'
                                }}
                              >
                          {item.title}
                        </Typography>
                              
                              <Typography 
                                variant="body1" 
                                sx={{ 
                                  color: 'rgba(255, 255, 255, 0.9)', 
                                  mb: 0,
                                  lineHeight: 1.6,
                                  fontSize: '1.1rem'
                                }}
                              >
                          {item.description}
                        </Typography>
                            </Box>
                            
                            <Box>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <List dense>
                          {item.benefits.slice(0, 3).map((benefit, benefitIdx) => (
                            <ListItem key={benefitIdx} sx={{ px: 0, py: 0.25 }}>
                              <ListItemIcon sx={{ minWidth: 28 }}>
                                {typeof benefit === 'string' ? (
                                  <CheckIcon sx={{ fontSize: 16, color: '#FFFFFF' }} />
                                ) : (
                                  benefit.icon
                                )}
                              </ListItemIcon>
                              <ListItemText
                                primary={typeof benefit === 'string' ? benefit : benefit.text}
                                sx={{
                                  '& .MuiListItemText-primary': {
                                    fontSize: '1rem',
                                    color: 'rgba(255, 255, 255, 0.95)'
                                  }
                                }}
                              />
                            </ListItem>
                          ))}
                        </List>
                      </Grid>
                      <Grid item xs={6}>
                        <List dense>
                          {item.benefits.slice(3, 6).map((benefit, benefitIdx) => (
                            <ListItem key={benefitIdx + 3} sx={{ px: 0, py: 0.25 }}>
                              <ListItemIcon sx={{ minWidth: 28 }}>
                                {typeof benefit === 'string' ? (
                                  <CheckIcon sx={{ fontSize: 16, color: '#FFFFFF' }} />
                                ) : (
                                  benefit.icon
                                )}
                              </ListItemIcon>
                              <ListItemText 
                                primary={typeof benefit === 'string' ? benefit : benefit.text}
                                sx={{
                                  '& .MuiListItemText-primary': {
                                    fontSize: '1rem',
                                    color: 'rgba(255, 255, 255, 0.95)'
                                  }
                                }}
                              />
                            </ListItem>
                          ))}
                        </List>
                      </Grid>
                    </Grid>
                            </Box>
                          </Box>
                        </Card>
                      </Box>
                    );
                  })
                )}
                
            {/* Feature Counter */}
            <Box sx={{ 
              position: 'absolute', 
              bottom: 20, 
              right: 20, 
              background: 'rgba(0, 0, 0, 0.3)',
              backdropFilter: 'blur(10px)',
              borderRadius: '20px',
              px: 2,
              py: 1,
              zIndex: 3
            }}>
              <Typography variant="body2" sx={{ color: '#FFFFFF', fontSize: '0.875rem' }}>
                {currentFeatureIndex + 1} of {features.reduce((total, category) => total + category.items.length, 0)}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Integrations */}
      <Box id="integrations" sx={{ py: 12, background: 'linear-gradient(180deg, #000000 0%, #434343 100%)', color: '#FFFFFF' }}>
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
              Seamless Integrations
            </Typography>
            <Typography variant="h6" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
              Connect with the tools you already use
            </Typography>
          </Box>

          <Grid container spacing={4} justifyContent="center">
            {integrations.map((integration, index) => (
              <Grid item xs={12} md={6} lg={4} key={index}>
                <Card
                  sx={{
                    p: 3,
                    height: '100%',
                    textAlign: 'center',
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
                  <Box sx={{ mb: 2, color: '#10B981', position: 'relative', zIndex: 2 }}>
                    {integration.icon}
                  </Box>
                  <Box sx={{ position: 'relative', zIndex: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#FFFFFF' }}>
                      {integration.category}
                    </Typography>
                    <List dense>
                      {integration.items.map((item, idx) => (
                        <ListItem key={idx} sx={{ px: 0, justifyContent: 'center' }}>
                          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                            {item}
                          </Typography>
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Box sx={{ textAlign: 'center', mt: 6 }}>
            <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
              Don't see your tool? We offer custom integrations and API access.
            </Typography>
          </Box>
        </Container>
      </Box>



      {/* FAQs */}
      <Box sx={{ py: 12, background: 'linear-gradient(180deg, #000000 0%, #434343 100%)', color: '#FFFFFF' }}>
        <Container maxWidth="md">
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
              Frequently Asked Questions
            </Typography>
            <Typography variant="h6" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
              Everything you need to know about Equitle
            </Typography>
          </Box>

          {faqs.map((faq, index) => (
            <Accordion 
              key={index}
              sx={{ 
                mb: 2, 
                background: 'rgba(255, 255, 255, 0.05)',
                border: '2px solid #000000',
                borderRadius: 0,
                '&:before': { display: 'none' },
                '&.Mui-expanded': {
                  background: 'rgba(16, 185, 129, 0.1)'
                }
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon sx={{ color: '#10B981' }} />}
                sx={{ 
                  '& .MuiAccordionSummary-content': {
                    my: 2
                  }
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#FFFFFF' }}>
                  {faq.question}
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body1" sx={{ lineHeight: 1.7, color: 'rgba(255, 255, 255, 0.8)' }}>
                  {faq.answer}
                </Typography>
              </AccordionDetails>
            </Accordion>
          ))}
        </Container>
      </Box>

      {/* CTA */}
      <Footer />
    </>
  );
}