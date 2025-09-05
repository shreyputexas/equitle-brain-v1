import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  Tabs,
  Tab,
  Grid,
  Card,
  CardContent,
  Chip,
  Avatar,
  AvatarGroup,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  IconButton,
  LinearProgress,
  Divider
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Share as ShareIcon,
  MoreVert as MoreVertIcon,
  AttachFile as AttachFileIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Event as EventIcon,
  CheckCircle as CheckCircleIcon,
  Psychology as BrainIcon
} from '@mui/icons-material';
import { useBrain } from '../contexts/BrainContext';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div hidden={value !== index} {...other}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

export default function DealDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tabValue, setTabValue] = React.useState(0);
  const { getInsights } = useBrain();

  const deal = {
    id: '1',
    company: 'TechCorp Inc.',
    sector: 'Technology',
    stage: 'Due Diligence',
    value: 12500000,
    probability: 65,
    leadPartner: 'John Smith',
    team: ['Alice Johnson', 'Bob Williams'],
    description: 'Leading SaaS platform for enterprise resource planning with AI-driven analytics.',
    founded: '2018',
    headquarters: 'San Francisco, CA',
    employees: '250-500',
    revenue: '$45M ARR',
    growth: '+85% YoY'
  };

  const activities = [
    { date: '2024-01-16', type: 'meeting', title: 'Management Presentation', description: 'CEO and CFO presented Q4 results' },
    { date: '2024-01-14', type: 'document', title: 'Financial Statements Received', description: 'Q4 2023 audited financials' },
    { date: '2024-01-10', type: 'call', title: 'Initial Call with Founder', description: 'Discussed investment thesis and terms' },
    { date: '2024-01-08', type: 'email', title: 'NDA Executed', description: 'Mutual NDA signed by both parties' }
  ];

  const documents = [
    { name: 'Pitch Deck v3.pdf', size: '4.2 MB', date: '2024-01-14', type: 'presentation' },
    { name: 'Financial Model.xlsx', size: '1.8 MB', date: '2024-01-12', type: 'spreadsheet' },
    { name: 'Due Diligence Checklist.docx', size: '245 KB', date: '2024-01-10', type: 'document' },
    { name: 'Market Analysis.pdf', size: '2.1 MB', date: '2024-01-08', type: 'report' }
  ];

  const contacts = [
    { name: 'Michael Chen', role: 'CEO & Founder', email: 'michael@techcorp.com', phone: '+1 (555) 123-4567' },
    { name: 'Sarah Johnson', role: 'CFO', email: 'sarah@techcorp.com', phone: '+1 (555) 234-5678' },
    { name: 'David Lee', role: 'VP Sales', email: 'david@techcorp.com', phone: '+1 (555) 345-6789' }
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate('/deals')} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h4" sx={{ fontWeight: 600 }}>
            {deal.company}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
            <Chip label={deal.sector} size="small" />
            <Chip 
              label={deal.stage} 
              size="small"
              color="primary"
            />
            <Typography variant="body2" color="text.secondary">
              Deal ID: #{deal.id}
            </Typography>
          </Box>
        </Box>
        <Button startIcon={<BrainIcon />} sx={{ mr: 2 }}>
          Get AI Insights
        </Button>
        <Button startIcon={<ShareIcon />} sx={{ mr: 2 }}>
          Share
        </Button>
        <Button variant="contained" startIcon={<EditIcon />}>
          Edit Deal
        </Button>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
              Deal Overview
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Deal Value
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
                  ${(deal.value / 1000000).toFixed(1)}M
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Probability
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h5" sx={{ fontWeight: 600, mr: 2 }}>
                    {deal.probability}%
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={deal.probability}
                    sx={{
                      flexGrow: 1,
                      height: 8,
                      borderRadius: 4,
                      bgcolor: 'rgba(255,255,255,0.05)',
                      '& .MuiLinearProgress-bar': {
                        borderRadius: 4,
                        bgcolor: 'success.main'
                      }
                    }}
                  />
                </Box>
              </Grid>
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Founded
                </Typography>
                <Typography variant="body1">{deal.founded}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Headquarters
                </Typography>
                <Typography variant="body1">{deal.headquarters}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Employees
                </Typography>
                <Typography variant="body1">{deal.employees}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Revenue
                </Typography>
                <Typography variant="body1">{deal.revenue}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Description
                </Typography>
                <Typography variant="body1">{deal.description}</Typography>
              </Grid>
            </Grid>
          </Paper>

          <Paper sx={{ p: 3 }}>
            <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
              <Tab label="Activity" />
              <Tab label="Documents" />
              <Tab label="Contacts" />
              <Tab label="Analysis" />
            </Tabs>

            <TabPanel value={tabValue} index={0}>
              <List>
                {activities.map((activity, index) => (
                  <ListItem key={index}>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'primary.main' }}>
                        {activity.type === 'meeting' && <EventIcon />}
                        {activity.type === 'document' && <AttachFileIcon />}
                        {activity.type === 'call' && <PhoneIcon />}
                        {activity.type === 'email' && <EmailIcon />}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={activity.title}
                      secondary={`${activity.date} - ${activity.description}`}
                    />
                  </ListItem>
                ))}
              </List>
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
              <List>
                {documents.map((doc, index) => (
                  <ListItem key={index} sx={{ px: 0 }}>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'primary.main' }}>
                        <AttachFileIcon />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={doc.name}
                      secondary={`${doc.size} • ${doc.date}`}
                    />
                    <Button size="small">Download</Button>
                  </ListItem>
                ))}
              </List>
            </TabPanel>

            <TabPanel value={tabValue} index={2}>
              <List>
                {contacts.map((contact, index) => (
                  <ListItem key={index} sx={{ px: 0 }}>
                    <ListItemAvatar>
                      <Avatar>{contact.name.split(' ').map(n => n[0]).join('')}</Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={contact.name}
                      secondary={
                        <Box>
                          <Typography variant="caption">{contact.role}</Typography>
                          <br />
                          <Typography variant="caption">{contact.email}</Typography>
                        </Box>
                      }
                    />
                    <IconButton>
                      <EmailIcon />
                    </IconButton>
                    <IconButton>
                      <PhoneIcon />
                    </IconButton>
                  </ListItem>
                ))}
              </List>
            </TabPanel>

            <TabPanel value={tabValue} index={3}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>Market Analysis</Typography>
                      <Typography variant="body2" color="text.secondary">
                        SaaS ERP market growing at 11% CAGR. TechCorp positioned in high-growth segment.
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>Competitive Position</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Top 5 player in mid-market segment with strong differentiation in AI capabilities.
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </TabPanel>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
              Deal Team
            </Typography>
            
            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Lead Partner
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <Avatar sx={{ mr: 2 }}>JS</Avatar>
                <Typography variant="body1">{deal.leadPartner}</Typography>
              </Box>
            </Box>

            <Typography variant="body2" color="text.secondary" gutterBottom>
              Team Members
            </Typography>
            <AvatarGroup max={4} sx={{ justifyContent: 'flex-start', mt: 1 }}>
              {deal.team.map((member, index) => (
                <Avatar key={index}>{member.split(' ').map(n => n[0]).join('')}</Avatar>
              ))}
            </AvatarGroup>
          </Paper>

          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
              Key Metrics
            </Typography>
            
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Revenue Growth
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {deal.growth}
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={85}
                sx={{
                  height: 6,
                  borderRadius: 3,
                  bgcolor: 'rgba(255,255,255,0.05)',
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 3,
                    bgcolor: 'success.main'
                  }
                }}
              />
            </Box>

            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Market Share
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  12%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={12}
                sx={{
                  height: 6,
                  borderRadius: 3,
                  bgcolor: 'rgba(255,255,255,0.05)',
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 3,
                    bgcolor: 'info.main'
                  }
                }}
              />
            </Box>

            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Customer Retention
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  94%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={94}
                sx={{
                  height: 6,
                  borderRadius: 3,
                  bgcolor: 'rgba(255,255,255,0.05)',
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 3,
                    bgcolor: 'primary.main'
                  }
                }}
              />
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}