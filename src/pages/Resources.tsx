import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  Chip,
  Avatar,
  TextField,
  InputAdornment,
  Tab,
  Tabs,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Divider,
  Link
} from '@mui/material';
import MarketingHeader from '../components/MarketingHeader';
import {
  ArrowForward as ArrowForwardIcon,
  Search as SearchIcon,
  Article as ArticleIcon,
  VideoLibrary as VideoIcon,
  GetApp as DownloadIcon,
  Code as CodeIcon,
  School as SchoolIcon,
  Event as EventIcon,
  Support as SupportIcon,
  MenuBook as GuideIcon,
  Assessment as ReportIcon,
  Insights as InsightIcon,
  Api as ApiIcon,
  IntegrationInstructions as IntegrationIcon,
  Security as SecurityIcon,
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  Business as BusinessIcon,
  Psychology as AIIcon,
  Timeline as TimelineIcon,
  CalendarToday as CalendarIcon,
  PlayArrow as PlayIcon,
  FileDownload as FileIcon
} from '@mui/icons-material';

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

export default function Resources() {
  const [tabValue, setTabValue] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  const resourceCategories = [
    { label: 'All Resources', value: 0, icon: <GuideIcon /> },
    { label: 'Documentation', value: 1, icon: <CodeIcon /> },
    { label: 'Guides & Tutorials', value: 2, icon: <SchoolIcon /> },
    { label: 'Videos & Webinars', value: 3, icon: <VideoIcon /> },
    { label: 'Industry Reports', value: 4, icon: <ReportIcon /> },
    { label: 'API & Integrations', value: 5, icon: <ApiIcon /> }
  ];

  const featuredResources = [
    {
      type: 'Guide',
      title: 'The Complete Guide to PE Deal Management',
      description: 'A comprehensive guide covering best practices for managing private equity deals from sourcing to exit.',
      category: 'Deal Management',
      readTime: '25 min read',
      downloadCount: '2.4k',
      icon: <GuideIcon />,
      featured: true
    },
    {
      type: 'Report',
      title: '2024 Private Equity Technology Report',
      description: 'Annual report on technology adoption trends in private equity and the impact on deal performance.',
      category: 'Industry Insights',
      readTime: '40 min read',
      downloadCount: '1.8k',
      icon: <ReportIcon />,
      featured: true
    },
    {
      type: 'Video',
      title: 'AI in Private Equity: Transforming Deal Flow',
      description: 'Watch our panel discussion on how AI is revolutionizing private equity operations.',
      category: 'AI & Technology',
      readTime: '45 min watch',
      downloadCount: '3.2k',
      icon: <VideoIcon />,
      featured: true
    }
  ];

  const documentation = [
    {
      title: 'Getting Started Guide',
      description: 'Learn the basics of setting up and using Equitle for your firm',
      type: 'Documentation',
      icon: <SchoolIcon />,
      category: 'Setup'
    },
    {
      title: 'API Reference',
      description: 'Complete API documentation with examples and best practices',
      type: 'API',
      icon: <ApiIcon />,
      category: 'Development'
    },
    {
      title: 'Integration Guides',
      description: 'Step-by-step guides for connecting your existing tools',
      type: 'Integration',
      icon: <IntegrationIcon />,
      category: 'Setup'
    },
    {
      title: 'Security & Compliance',
      description: 'Security features, compliance certifications, and best practices',
      type: 'Security',
      icon: <SecurityIcon />,
      category: 'Security'
    }
  ];

  const guides = [
    {
      title: 'Deal Sourcing Best Practices',
      description: 'How to build an effective deal sourcing strategy using modern tools and AI',
      type: 'Guide',
      readTime: '15 min read',
      category: 'Deal Sourcing',
      icon: <BusinessIcon />
    },
    {
      title: 'Due Diligence Automation',
      description: 'Streamline your DD process with automated workflows and checklists',
      type: 'Tutorial',
      readTime: '20 min read',
      category: 'Due Diligence',
      icon: <ReportIcon />
    },
    {
      title: 'Portfolio Performance Tracking',
      description: 'Set up KPIs and dashboards to monitor your portfolio companies',
      type: 'Guide',
      readTime: '12 min read',
      category: 'Portfolio Management',
      icon: <TimelineIcon />
    },
    {
      title: 'LP Reporting Excellence',
      description: 'Create professional investor reports that impress your LPs',
      type: 'Tutorial',
      readTime: '18 min read',
      category: 'Reporting',
      icon: <InsightIcon />
    }
  ];

  const videos = [
    {
      title: 'Platform Demo: Complete Walkthrough',
      description: 'Full product demonstration covering all major features',
      type: 'Demo',
      duration: '35 min',
      views: '12.4k',
      category: 'Product Demo',
      icon: <PlayIcon />
    },
    {
      title: 'Webinar: Future of PE Technology',
      description: 'Industry leaders discuss technology trends in private equity',
      type: 'Webinar',
      duration: '60 min',
      views: '8.9k',
      category: 'Industry Trends',
      icon: <PeopleIcon />
    },
    {
      title: 'Customer Success: Meridian Capital',
      description: 'How Meridian Capital transformed their deal flow with Equitle',
      type: 'Case Study',
      duration: '25 min',
      views: '6.3k',
      category: 'Success Story',
      icon: <TrendingUpIcon />
    },
    {
      title: 'AI Insights Deep Dive',
      description: 'Learn how our AI engine analyzes deals and predicts outcomes',
      type: 'Technical',
      duration: '40 min',
      views: '5.1k',
      category: 'AI & Technology',
      icon: <AIIcon />
    }
  ];

  const reports = [
    {
      title: '2024 PE Technology Benchmark Report',
      description: 'Annual survey of 150+ PE firms on technology adoption and ROI',
      type: 'Industry Report',
      pages: '42 pages',
      downloads: '4.2k',
      category: 'Industry Research',
      icon: <ReportIcon />
    },
    {
      title: 'ESG in Private Equity: 2024 Update',
      description: 'Latest trends in ESG investing and reporting requirements',
      type: 'Research',
      pages: '28 pages',
      downloads: '3.8k',
      category: 'ESG',
      icon: <InsightIcon />
    },
    {
      title: 'Mid-Market PE Deal Activity Q4 2024',
      description: 'Quarterly analysis of deal activity, valuations, and market trends',
      type: 'Market Report',
      pages: '35 pages',
      downloads: '5.6k',
      category: 'Market Data',
      icon: <TrendingUpIcon />
    }
  ];

  const apiResources = [
    {
      title: 'REST API Documentation',
      description: 'Complete REST API reference with authentication and endpoints',
      type: 'API Docs',
      category: 'Development',
      icon: <CodeIcon />
    },
    {
      title: 'Webhook Integration Guide',
      description: 'Set up real-time notifications and data synchronization',
      type: 'Integration',
      category: 'Development',
      icon: <IntegrationIcon />
    },
    {
      title: 'Python SDK',
      description: 'Official Python SDK with examples and best practices',
      type: 'SDK',
      category: 'Development',
      icon: <CodeIcon />
    },
    {
      title: 'Postman Collection',
      description: 'Ready-to-use Postman collection for testing our APIs',
      type: 'Tools',
      category: 'Development',
      icon: <ApiIcon />
    }
  ];

  const upcomingEvents = [
    {
      title: 'Equitle User Conference 2024',
      date: 'March 15-16, 2024',
      location: 'New York, NY',
      type: 'Conference',
      description: 'Annual user conference with product updates, networking, and best practices'
    },
    {
      title: 'Webinar: AI in Due Diligence',
      date: 'February 28, 2024',
      location: 'Virtual',
      type: 'Webinar',
      description: 'Learn how AI is transforming due diligence processes'
    },
    {
      title: 'Product Demo Session',
      date: 'Every Thursday',
      location: 'Virtual',
      type: 'Demo',
      description: 'Weekly product demonstrations and Q&A sessions'
    }
  ];

  const supportOptions = [
    {
      title: 'Help Center',
      description: 'Search our knowledge base for answers to common questions',
      icon: <SupportIcon />,
      action: 'Browse Articles'
    },
    {
      title: 'Community Forum',
      description: 'Connect with other users and share best practices',
      icon: <PeopleIcon />,
      action: 'Join Community'
    },
    {
      title: 'Contact Support',
      description: 'Get help from our expert support team',
      icon: <SupportIcon />,
      action: 'Get Help'
    }
  ];

  const renderResourceCard = (resource: any, showCategory = true) => (
    <Card
      key={resource.title}
      sx={{
        p: 3,
        height: '100%',
        border: '1px solid rgba(94, 92, 230, 0.08)',
        '&:hover': {
          boxShadow: '0 8px 24px rgba(94, 92, 230, 0.12)',
          transform: 'translateY(-2px)'
        },
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        cursor: 'pointer'
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
        <Avatar sx={{ bgcolor: '#9CA3AF' }}>
          {resource.icon}
        </Avatar>
        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Chip 
              label={resource.type} 
              size="small"
              sx={{ 
                bgcolor: 'rgba(156, 163, 175, 0.1)',
                  color: '#374151',
                fontWeight: 500
              }}
            />
            {resource.featured && (
              <Chip 
                label="Featured" 
                size="small"
                sx={{ bgcolor: 'warning.main', color: 'white' }}
              />
            )}
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
            {resource.title}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.6 }}>
            {resource.description}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            {showCategory && resource.category && (
              <Typography variant="caption" color="text.secondary">
                {resource.category}
              </Typography>
            )}
            {resource.readTime && (
              <Typography variant="caption" color="text.secondary">
                {resource.readTime}
              </Typography>
            )}
            {resource.duration && (
              <Typography variant="caption" color="text.secondary">
                {resource.duration}
              </Typography>
            )}
            {resource.pages && (
              <Typography variant="caption" color="text.secondary">
                {resource.pages}
              </Typography>
            )}
            {resource.downloadCount && (
              <Typography variant="caption" color="text.secondary">
                {resource.downloadCount} downloads
              </Typography>
            )}
            {resource.downloads && (
              <Typography variant="caption" color="text.secondary">
                {resource.downloads} downloads
              </Typography>
            )}
            {resource.views && (
              <Typography variant="caption" color="text.secondary">
                {resource.views} views
              </Typography>
            )}
          </Box>
        </Box>
        <Button
          variant="text"
          size="small"
          endIcon={<ArrowForwardIcon sx={{ fontSize: 16 }} />}
        >
          {resource.type === 'Video' || resource.type === 'Demo' || resource.type === 'Webinar' ? 'Watch' : 
           resource.type === 'API Docs' || resource.type === 'Integration' ? 'View' : 'Read'}
        </Button>
      </Box>
    </Card>
  );

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
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Chip 
              label="RESOURCE CENTER" 
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
              Resources to Help You
              <Box 
                component="span" 
                sx={{ 
                  background: 'linear-gradient(135deg, #9CA3AF 0%, #374151 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}
              >
                {' '}Succeed
              </Box>
            </Typography>
            <Typography variant="h5" sx={{ color: 'text.secondary', mb: 4, lineHeight: 1.6 }}>
              Guides, documentation, videos, and insights to help you get the most out of Equitle
            </Typography>
          </Box>

          <Box sx={{ maxWidth: 600, mx: 'auto' }}>
            <TextField
              fullWidth
              placeholder="Search resources..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 4 }}
            />
          </Box>
        </Container>
      </Box>

      {/* Featured Resources */}
      <Box sx={{ py: 12, background: 'white' }}>
        <Container maxWidth="lg">
          <Typography 
            variant="h2" 
            sx={{ 
              fontFamily: '"Space Grotesk", sans-serif',
              fontWeight: 700,
              mb: 6,
              textAlign: 'center'
            }}
          >
            Featured Resources
          </Typography>
          
          <Grid container spacing={4}>
            {featuredResources.map((resource) => (
              <Grid item xs={12} md={4} key={resource.title}>
                {renderResourceCard(resource)}
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Resource Categories */}
      <Box sx={{ py: 12, background: '#FAFAFA' }}>
        <Container maxWidth="lg">
          <Tabs 
            value={tabValue} 
            onChange={(e, v) => setTabValue(v)} 
            variant="scrollable"
            scrollButtons="auto"
            sx={{ mb: 6 }}
          >
            {resourceCategories.map((category) => (
              <Tab 
                key={category.value}
                label={category.label}
                icon={category.icon}
                iconPosition="start"
                sx={{ 
                  textTransform: 'none',
                  fontSize: '1rem',
                  fontWeight: 500,
                  minHeight: 64,
                  minWidth: 180
                }}
              />
            ))}
          </Tabs>

          {/* All Resources */}
          <TabPanel value={tabValue} index={0}>
            <Grid container spacing={4}>
              {[...featuredResources, ...guides.slice(0, 3), ...videos.slice(0, 2), ...reports.slice(0, 1)].map((resource) => (
                <Grid item xs={12} md={6} lg={4} key={resource.title}>
                  {renderResourceCard(resource)}
                </Grid>
              ))}
            </Grid>
          </TabPanel>

          {/* Documentation */}
          <TabPanel value={tabValue} index={1}>
            <Grid container spacing={4}>
              {documentation.map((doc) => (
                <Grid item xs={12} md={6} key={doc.title}>
                  {renderResourceCard(doc)}
                </Grid>
              ))}
            </Grid>
          </TabPanel>

          {/* Guides */}
          <TabPanel value={tabValue} index={2}>
            <Grid container spacing={4}>
              {guides.map((guide) => (
                <Grid item xs={12} md={6} key={guide.title}>
                  {renderResourceCard(guide)}
                </Grid>
              ))}
            </Grid>
          </TabPanel>

          {/* Videos */}
          <TabPanel value={tabValue} index={3}>
            <Grid container spacing={4}>
              {videos.map((video) => (
                <Grid item xs={12} md={6} key={video.title}>
                  {renderResourceCard(video)}
                </Grid>
              ))}
            </Grid>
          </TabPanel>

          {/* Reports */}
          <TabPanel value={tabValue} index={4}>
            <Grid container spacing={4}>
              {reports.map((report) => (
                <Grid item xs={12} md={6} key={report.title}>
                  {renderResourceCard(report)}
                </Grid>
              ))}
            </Grid>
          </TabPanel>

          {/* API Resources */}
          <TabPanel value={tabValue} index={5}>
            <Grid container spacing={4}>
              {apiResources.map((resource) => (
                <Grid item xs={12} md={6} key={resource.title}>
                  {renderResourceCard(resource, false)}
                </Grid>
              ))}
            </Grid>
          </TabPanel>
        </Container>
      </Box>

      {/* Upcoming Events */}
      <Box sx={{ py: 12, background: 'white' }}>
        <Container maxWidth="lg">
          <Typography 
            variant="h2" 
            sx={{ 
              fontFamily: '"Space Grotesk", sans-serif',
              fontWeight: 700,
              mb: 6,
              textAlign: 'center'
            }}
          >
            Upcoming Events
          </Typography>

          <Grid container spacing={4}>
            {upcomingEvents.map((event, index) => (
              <Grid item xs={12} md={4} key={index}>
                <Card
                  sx={{
                    p: 3,
                    height: '100%',
                    border: '1px solid rgba(94, 92, 230, 0.08)',
                    '&:hover': {
                      boxShadow: '0 8px 24px rgba(94, 92, 230, 0.12)'
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Avatar sx={{ bgcolor: '#9CA3AF' }}>
                      <CalendarIcon />
                    </Avatar>
                    <Chip 
                      label={event.type}
                      size="small"
                      sx={{
                        bgcolor: 'rgba(156, 163, 175, 0.1)',
                        color: '#374151'
                      }}
                    />
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                    {event.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {event.description}
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      📅 {event.date}
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      📍 {event.location}
                    </Typography>
                  </Box>
                  <Button
                    variant="outlined"
                    size="small"
                    sx={{ mt: 2 }}
                  >
                    {event.type === 'Conference' ? 'Register' : event.type === 'Webinar' ? 'Sign Up' : 'Join'}
                  </Button>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Support Options */}
      <Box sx={{ py: 12, background: '#FAFAFA' }}>
        <Container maxWidth="lg">
          <Typography 
            variant="h2" 
            sx={{ 
              fontFamily: '"Space Grotesk", sans-serif',
              fontWeight: 700,
              mb: 6,
              textAlign: 'center'
            }}
          >
            Need Help?
          </Typography>

          <Grid container spacing={4}>
            {supportOptions.map((option, index) => (
              <Grid item xs={12} md={4} key={index}>
                <Card
                  sx={{
                    p: 4,
                    height: '100%',
                    textAlign: 'center',
                    border: '1px solid rgba(94, 92, 230, 0.08)',
                    '&:hover': {
                      boxShadow: '0 8px 24px rgba(94, 92, 230, 0.12)',
                      transform: 'translateY(-4px)'
                    },
                    transition: 'all 0.3s ease'
                  }}
                >
                  <Avatar sx={{ bgcolor: '#9CA3AF', width: 56, height: 56, mx: 'auto', mb: 2 }}>
                    {option.icon}
                  </Avatar>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                    {option.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    {option.description}
                  </Typography>
                  <Button
                    variant="contained"
                    sx={{
                      background: 'linear-gradient(135deg, #9CA3AF 0%, #374151 100%)'
                    }}
                  >
                    {option.action}
                  </Button>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Newsletter Signup */}
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
              Stay Updated
            </Typography>
            <Typography variant="h6" sx={{ mb: 4, opacity: 0.9 }}>
              Get the latest insights, guides, and product updates delivered to your inbox
            </Typography>
            <Box 
              sx={{ 
                display: 'flex', 
                gap: 2, 
                maxWidth: 500, 
                mx: 'auto',
                flexDirection: { xs: 'column', sm: 'row' }
              }}
            >
              <TextField
                placeholder="Enter your email"
                variant="outlined"
                size="medium"
                sx={{
                  flex: 1,
                  '& .MuiOutlinedInput-root': {
                    bgcolor: 'white',
                    '& fieldset': {
                      borderColor: 'transparent'
                    }
                  }
                }}
              />
              <Button 
                variant="contained"
                size="large"
                sx={{
                  background: 'rgba(0, 0, 0, 0.2)',
                  color: 'white',
                  px: 4,
                  '&:hover': {
                    background: 'rgba(0, 0, 0, 0.3)'
                  }
                }}
              >
                Subscribe
              </Button>
            </Box>
          </Box>
        </Container>
      </Box>
    </>
  );
}