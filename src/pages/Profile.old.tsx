import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Avatar, 
  Button, 
  TextField, 
  Grid, 
  Tabs, 
  Tab, 
  Card, 
  CardContent, 
  CardActions,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  IconButton,
  Badge,
  Switch,
  FormControlLabel,
  LinearProgress
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Business as BusinessIcon,
  LocationOn as LocationIcon,
  CalendarToday as CalendarIcon,
  Security as SecurityIcon,
  Notifications as NotificationsIcon,
  Language as LanguageIcon,
  Palette as PaletteIcon,
  Google as GoogleIcon,
  VideoCall as VideoCallIcon,
  CalendarMonth as CalendarMonthIcon,
  Mail as MailIcon,
  DriveFolderUpload as DriveIcon,
  CloudSync as CloudSyncIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Add as AddIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

export default function Profile() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editingConnection, setEditingConnection] = useState<number | null>(null);
  const [connectionSettings, setConnectionSettings] = useState<{[key: string]: any}>({});

  // Mock comprehensive user data
  const profileData = {
    personalInfo: {
      name: user?.name || 'Admin User',
      email: user?.email || 'admin@equitle.com',
      phone: '+1 (555) 123-4567',
      title: 'Senior Investment Manager',
      firm: 'Equitle Capital',
      location: 'New York, NY',
      joinDate: 'January 15, 2022',
      lastActive: '2 minutes ago'
    },
    connections: [
      {
        id: 'google-meet',
        name: 'Google Meet',
        icon: <VideoCallIcon />,
        status: 'connected',
        lastSync: '2 minutes ago',
        description: 'Video conferencing and meetings',
        account: 'admin@equitle.com',
        permissions: ['Create meetings', 'Join meetings', 'Record sessions'],
        settings: {
          autoJoin: true,
          recordByDefault: false,
          notifications: true
        },
        usage: {
          meetingsThisMonth: 24,
          totalMinutes: 480,
          lastMeeting: 'Tech Corp Inc - Deal Discussion'
        }
      },
      {
        id: 'google-calendar',
        name: 'Google Calendar',
        icon: <CalendarMonthIcon />,
        status: 'connected',
        lastSync: '5 minutes ago',
        description: 'Calendar and scheduling',
        account: 'admin@equitle.com',
        permissions: ['Read calendar', 'Create events', 'Modify events'],
        settings: {
          syncFrequency: 'Real-time',
          workingHours: '9 AM - 6 PM EST',
          notifications: true
        },
        usage: {
          eventsThisMonth: 45,
          upcomingEvents: 8,
          lastEvent: 'Investor Meeting - Tomorrow 2 PM'
        }
      },
      {
        id: 'gmail',
        name: 'Gmail',
        icon: <MailIcon />,
        status: 'connected',
        lastSync: '1 minute ago',
        description: 'Email communication',
        account: 'admin@equitle.com',
        permissions: ['Read emails', 'Send emails', 'Manage labels'],
        settings: {
          autoSync: true,
          signature: 'Best regards,\nAdmin User\nEquitle Capital',
          notifications: true
        },
        usage: {
          emailsThisMonth: 156,
          unreadEmails: 12,
          lastEmail: 'Re: Q4 Fundraising Update'
        }
      },
      {
        id: 'google-drive',
        name: 'Google Drive',
        icon: <DriveIcon />,
        status: 'connected',
        lastSync: '10 minutes ago',
        description: 'Document storage and sharing',
        account: 'admin@equitle.com',
        permissions: ['Read files', 'Upload files', 'Share files'],
        settings: {
          autoBackup: true,
          sharedFolders: 8,
          notifications: true
        },
        usage: {
          filesThisMonth: 23,
          totalStorage: '2.3 GB',
          lastFile: 'Tech Corp Inc - Due Diligence Report.pdf'
        }
      },
      {
        id: 'microsoft-teams',
        name: 'Microsoft Teams',
        icon: <CloudSyncIcon />,
        status: 'disconnected',
        lastSync: '2 days ago',
        description: 'Team collaboration',
        account: 'admin@equitle.com',
        permissions: ['Join channels', 'Send messages', 'Share files'],
        settings: {
          autoJoin: false,
          notifications: false
        },
        usage: {
          messagesThisMonth: 0,
          channels: 0,
          lastActivity: '2 days ago'
        }
      },
      {
        id: 'slack',
        name: 'Slack',
        icon: <CloudSyncIcon />,
        status: 'error',
        lastSync: '1 week ago',
        description: 'Team messaging',
        account: 'admin@equitle.com',
        permissions: ['Read messages', 'Send messages', 'Join channels'],
        settings: {
          autoJoin: false,
          notifications: false
        },
        usage: {
          messagesThisMonth: 0,
          channels: 0,
          lastActivity: '1 week ago'
        }
      },
      {
        id: 'salesforce',
        name: 'Salesforce',
        icon: <BusinessIcon />,
        status: 'connected',
        lastSync: '30 minutes ago',
        description: 'CRM and deal management',
        account: 'admin@equitle.com',
        permissions: ['Read contacts', 'Update deals', 'View reports'],
        settings: {
          autoSync: true,
          syncFrequency: 'Every 15 minutes',
          notifications: true
        },
        usage: {
          contactsThisMonth: 12,
          dealsUpdated: 8,
          lastActivity: 'Updated Tech Corp Inc deal status'
        }
      },
      {
        id: 'zoom',
        name: 'Zoom',
        icon: <VideoCallIcon />,
        status: 'connected',
        lastSync: '1 hour ago',
        description: 'Video conferencing',
        account: 'admin@equitle.com',
        permissions: ['Host meetings', 'Join meetings', 'Record sessions'],
        settings: {
          autoJoin: true,
          recordByDefault: false,
          notifications: true
        },
        usage: {
          meetingsThisMonth: 18,
          totalMinutes: 360,
          lastMeeting: 'Weekly Team Standup'
        }
      }
    ],
    activity: [
      { action: 'Logged in', time: '2 minutes ago', type: 'login' },
      { action: 'Updated deal status', time: '15 minutes ago', type: 'update' },
      { action: 'Sent email to investor', time: '1 hour ago', type: 'email' },
      { action: 'Scheduled meeting', time: '2 hours ago', type: 'calendar' },
      { action: 'Uploaded document', time: '3 hours ago', type: 'upload' }
    ],
    preferences: {
      notifications: {
        email: true,
        push: true,
        sms: false,
        calendar: true,
        deals: true
      },
      privacy: {
        profileVisible: true,
        activityTracking: true,
        dataSharing: false
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return '#4CAF50';
      case 'disconnected': return '#FF9800';
      case 'error': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected': return <CheckCircleIcon sx={{ color: '#4CAF50' }} />;
      case 'disconnected': return <WarningIcon sx={{ color: '#FF9800' }} />;
      case 'error': return <ErrorIcon sx={{ color: '#F44336' }} />;
      default: return <ErrorIcon sx={{ color: '#9E9E9E' }} />;
    }
  };

  const handleConnectionToggle = (connectionId: string, currentStatus: string) => {
    // Mock connection toggle functionality
    console.log(`Toggling ${connectionId} from ${currentStatus}`);
    // In real app, this would make API calls to connect/disconnect
  };

  const handleEditConnection = (index: number) => {
    setEditingConnection(editingConnection === index ? null : index);
  };

  const handleSaveConnectionSettings = (connectionId: string, settings: any) => {
    setConnectionSettings(prev => ({
      ...prev,
      [connectionId]: settings
    }));
    setEditingConnection(null);
    // In real app, this would save to backend
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 600, mb: 4 }}>
        Profile
      </Typography>

      {/* Profile Header */}
      <Paper sx={{ p: 4, mb: 3 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item>
            <Avatar sx={{ width: 100, height: 100, bgcolor: '#000000', fontSize: 40 }}>
              {profileData.personalInfo.name.charAt(0)}
            </Avatar>
          </Grid>
          <Grid item xs>
            <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
              {profileData.personalInfo.name}
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
              {profileData.personalInfo.title}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
              {profileData.personalInfo.firm} • {profileData.personalInfo.location}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <Chip 
                label="Active" 
                sx={{ bgcolor: '#4CAF50', color: 'white' }} 
                size="small" 
              />
              <Chip 
                label={`Last active: ${profileData.personalInfo.lastActive}`} 
                sx={{ bgcolor: '#f5f5f5', color: '#000000' }} 
                size="small" 
              />
            </Box>
            <Button 
              variant="outlined" 
              startIcon={<EditIcon />}
              onClick={() => setIsEditing(!isEditing)}
            >
              {isEditing ? 'Cancel' : 'Edit Profile'}
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs 
          value={activeTab} 
          onChange={(e, newValue) => setActiveTab(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Personal Information" />
          <Tab label="Connections" />
          <Tab label="Activity" />
          <Tab label="Preferences" />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      {activeTab === 0 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
            <PersonIcon />
            Personal Information
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <List>
                <ListItem>
                  <ListItemIcon><PersonIcon /></ListItemIcon>
                  <ListItemText 
                    primary="Full Name" 
                    secondary={profileData.personalInfo.name}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><EmailIcon /></ListItemIcon>
                  <ListItemText 
                    primary="Email Address" 
                    secondary={profileData.personalInfo.email}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><PhoneIcon /></ListItemIcon>
                  <ListItemText 
                    primary="Phone Number" 
                    secondary={profileData.personalInfo.phone}
                  />
                </ListItem>
              </List>
            </Grid>
            <Grid item xs={12} md={6}>
              <List>
                <ListItem>
                  <ListItemIcon><BusinessIcon /></ListItemIcon>
                  <ListItemText 
                    primary="Job Title" 
                    secondary={profileData.personalInfo.title}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><BusinessIcon /></ListItemIcon>
                  <ListItemText 
                    primary="Firm" 
                    secondary={profileData.personalInfo.firm}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><LocationIcon /></ListItemIcon>
                  <ListItemText 
                    primary="Location" 
                    secondary={profileData.personalInfo.location}
                  />
                </ListItem>
              </List>
            </Grid>
          </Grid>
        </Paper>
      )}

      {activeTab === 1 && (
        <Paper sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CloudSyncIcon />
              Connected Services
            </Typography>
            <Button 
              variant="outlined" 
              startIcon={<AddIcon />}
              sx={{ borderColor: '#000000', color: '#000000' }}
            >
              Add Service
            </Button>
          </Box>
          
          <Grid container spacing={3}>
            {profileData.connections.map((connection, index) => (
              <Grid item xs={12} md={6} key={index}>
                <Card sx={{ height: '100%', border: '1px solid #e0e0e0' }}>
                  <CardContent>
                    {/* Header */}
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Box sx={{ 
                        p: 1.5, 
                        borderRadius: 1, 
                        bgcolor: '#f5f5f5', 
                        mr: 2,
                        display: 'flex',
                        alignItems: 'center'
                      }}>
                        {connection.icon}
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" sx={{ fontSize: '1.1rem', fontWeight: 600 }}>
                          {connection.name}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {getStatusIcon(connection.status)}
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              color: getStatusColor(connection.status),
                              textTransform: 'capitalize',
                              fontWeight: 500
                            }}
                          >
                            {connection.status}
                          </Typography>
                        </Box>
                      </Box>
                      <IconButton 
                        size="small"
                        onClick={() => handleEditConnection(index)}
                        sx={{ color: '#000000' }}
                      >
                        <EditIcon />
                      </IconButton>
                    </Box>

                    {/* Account Info */}
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                        Account
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {connection.account}
                      </Typography>
                    </Box>

                    {/* Usage Stats */}
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        Usage This Month
                      </Typography>
                      {connection.usage && (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                          {Object.entries(connection.usage).slice(0, 2).map(([key, value]) => (
                            <Chip 
                              key={key}
                              label={`${key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}: ${value}`}
                              size="small"
                              sx={{ bgcolor: '#f5f5f5', color: '#000000', fontSize: '0.75rem' }}
                            />
                          ))}
                        </Box>
                      )}
                    </Box>

                    {/* Permissions */}
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        Permissions
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {connection.permissions.slice(0, 2).map((permission, idx) => (
                          <Chip 
                            key={idx}
                            label={permission}
                            size="small"
                            sx={{ bgcolor: '#e8f5e8', color: '#2e7d32', fontSize: '0.7rem' }}
                          />
                        ))}
                        {connection.permissions.length > 2 && (
                          <Chip 
                            label={`+${connection.permissions.length - 2} more`}
                            size="small"
                            sx={{ bgcolor: '#f5f5f5', color: '#000000', fontSize: '0.7rem' }}
                          />
                        )}
                      </Box>
                    </Box>

                    {/* Last Activity */}
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" color="text.secondary">
                        Last sync: {connection.lastSync}
                      </Typography>
                      {connection.usage && connection.usage.lastMeeting && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                          Last activity: {connection.usage.lastMeeting}
                        </Typography>
                      )}
                    </Box>

                    {/* Edit Mode */}
                    {editingConnection === index && (
                      <Box sx={{ 
                        p: 2, 
                        bgcolor: '#f9f9f9', 
                        borderRadius: 1, 
                        border: '1px solid #e0e0e0',
                        mb: 2 
                      }}>
                        <Typography variant="subtitle2" sx={{ mb: 2 }}>
                          Connection Settings
                        </Typography>
                        {connection.settings && Object.entries(connection.settings).map(([key, value]) => (
                          <FormControlLabel
                            key={key}
                            control={
                              <Switch 
                                checked={typeof value === 'boolean' ? value : false}
                                size="small"
                              />
                            }
                            label={key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
                            sx={{ display: 'block', mb: 1 }}
                          />
                        ))}
                        <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                          <Button 
                            size="small" 
                            variant="contained"
                            startIcon={<SaveIcon />}
                            onClick={() => handleSaveConnectionSettings(connection.id, connection.settings)}
                            sx={{ bgcolor: '#000000', color: 'white' }}
                          >
                            Save
                          </Button>
                          <Button 
                            size="small" 
                            variant="outlined"
                            startIcon={<CancelIcon />}
                            onClick={() => setEditingConnection(null)}
                            sx={{ borderColor: '#000000', color: '#000000' }}
                          >
                            Cancel
                          </Button>
                        </Box>
                      </Box>
                    )}
                  </CardContent>
                  
                  <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
                    <Button 
                      size="small" 
                      variant="outlined"
                      sx={{ 
                        borderColor: connection.status === 'connected' ? '#F44336' : '#4CAF50',
                        color: connection.status === 'connected' ? '#F44336' : '#4CAF50',
                        textTransform: 'capitalize'
                      }}
                      onClick={() => handleConnectionToggle(connection.id, connection.status)}
                    >
                      {connection.status === 'connected' ? 'Disconnect' : 'Connect'}
                    </Button>
                    <Button 
                      size="small" 
                      sx={{ color: '#000000' }}
                    >
                      View Details
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Connection Summary */}
          <Paper sx={{ p: 3, mt: 3, bgcolor: '#f9f9f9' }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Connection Summary
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" sx={{ color: '#4CAF50', fontWeight: 600 }}>
                    {profileData.connections.filter(c => c.status === 'connected').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Connected Services
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" sx={{ color: '#FF9800', fontWeight: 600 }}>
                    {profileData.connections.filter(c => c.status === 'disconnected').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Disconnected
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" sx={{ color: '#F44336', fontWeight: 600 }}>
                    {profileData.connections.filter(c => c.status === 'error').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Errors
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Paper>
      )}

      {activeTab === 2 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
            <CalendarIcon />
            Recent Activity
          </Typography>
          <List>
            {profileData.activity.map((item, index) => (
              <ListItem key={index}>
                <ListItemIcon>
                  <CalendarIcon />
                </ListItemIcon>
                <ListItemText 
                  primary={item.action}
                  secondary={item.time}
                />
                <Chip 
                  label={item.type} 
                  size="small" 
                  sx={{ bgcolor: '#f5f5f5', color: '#000000' }}
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      )}

      {activeTab === 3 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
            <SecurityIcon />
            Preferences & Settings
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" sx={{ mb: 2 }}>Notifications</Typography>
              {Object.entries(profileData.preferences.notifications).map(([key, value]) => (
                <FormControlLabel
                  key={key}
                  control={<Switch checked={value} />}
                  label={key.charAt(0).toUpperCase() + key.slice(1)}
                  sx={{ display: 'block', mb: 1 }}
                />
              ))}
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" sx={{ mb: 2 }}>Privacy</Typography>
              {Object.entries(profileData.preferences.privacy).map(([key, value]) => (
                <FormControlLabel
                  key={key}
                  control={<Switch checked={value} />}
                  label={key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
                  sx={{ display: 'block', mb: 1 }}
                />
              ))}
            </Grid>
          </Grid>
        </Paper>
      )}
    </Box>
  );
}