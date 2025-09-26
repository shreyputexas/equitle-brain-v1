import React, { useState, useEffect } from 'react';
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
  Switch,
  FormControlLabel,
  Alert,
  CircularProgress,
  Divider,
  IconButton
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Business as BusinessIcon,
  LocationOn as LocationIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Settings as SettingsIcon,
  Notifications as NotificationsIcon,
  Google as GoogleIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

interface ProfileResponse {
  user: UserProfile;
}

interface UserProfile {
  id: string;
  email: string;
  name: string;
  firm?: string;
  role?: 'admin' | 'manager' | 'analyst' | 'viewer';
  phone?: string;
  location?: string;
  avatar?: string;
  profile?: {
    title?: string;
    bio?: string;
    timezone?: string;
    language?: string;
  };
  preferences?: {
    emailNotify: boolean;
    pushNotify: boolean;
    calendarNotify: boolean;
    dealNotify: boolean;
    autoSave: boolean;
    darkMode: boolean;
  };
  integrations?: Array<{
    id: string;
    provider: string;
    type: string;
    isActive: boolean;
    profile?: any;
  }>;
}

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [isEditingPersonal, setIsEditingPersonal] = useState(false);
  const [isEditingWork, setIsEditingWork] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [editData, setEditData] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
    firm: '',
    role: '',
    title: '',
    bio: ''
  });

  const [preferences, setPreferences] = useState({
    emailNotify: true,
    pushNotify: true,
    calendarNotify: true,
    dealNotify: true,
    autoSave: true,
    darkMode: false
  });

  useEffect(() => {
    if (user) {
      setUserProfile(user as any);

      // Initialize edit data from AuthContext user
      setEditData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        location: user.location || '',
        firm: user.firm || '',
        role: user.role || '',
        title: user.profile?.title || '',
        bio: user.profile?.bio || ''
      });

      // Initialize preferences from AuthContext user
      if (user.preferences) {
        setPreferences(user.preferences);
      }

      setLoading(false);
    }
  }, [user]);

  const handleSavePersonal = async () => {
    try {
      setSaving(true);
      setError('');

      // Configure axios for this request
      const response = await axios.put<ProfileResponse>('http://localhost:4000/api/auth/profile', {
        name: editData.name,
        phone: editData.phone,
        location: editData.location
      }, {
        headers: {
          'Authorization': 'Bearer mock-token'
        }
      });

      setUserProfile(response.data.user);
      updateUser(response.data.user);
      setIsEditingPersonal(false);
      setSuccess('Personal information updated successfully');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveWork = async () => {
    try {
      setSaving(true);
      setError('');

      const response = await axios.put<ProfileResponse>('http://localhost:4000/api/auth/profile', {
        firm: editData.firm,
        role: editData.role
      }, {
        headers: {
          'Authorization': 'Bearer mock-token'
        }
      });

      setUserProfile(response.data.user);
      updateUser(response.data.user);
      setIsEditingWork(false);
      setSuccess('Work information updated successfully');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleSavePreferences = async () => {
    try {
      setSaving(true);
      setError('');

      await axios.put('http://localhost:4000/api/auth/preferences', preferences, {
        headers: {
          'Authorization': 'Bearer mock-token'
        }
      });
      setSuccess('Preferences updated successfully');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update preferences');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditData(prev => ({
      ...prev,
      [field]: e.target.value
    }));
  };

  const handlePreferenceChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setPreferences(prev => ({
      ...prev,
      [field]: e.target.checked
    }));
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 600, mb: 4 }}>
        Profile Settings
      </Typography>

      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)} sx={{ mb: 3 }}>
        <Tab label="Personal Info" icon={<PersonIcon />} />
        <Tab label="Work Info" icon={<BusinessIcon />} />
        <Tab label="Preferences" icon={<SettingsIcon />} />
        <Tab label="Integrations" icon={<GoogleIcon />} />
      </Tabs>

      {/* Personal Information Tab */}
      {activeTab === 0 && (
        <Paper sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6">Personal Information</Typography>
            {!isEditingPersonal ? (
              <Button
                variant="outlined"
                startIcon={<EditIcon />}
                onClick={() => setIsEditingPersonal(true)}
              >
                Edit
              </Button>
            ) : (
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleSavePersonal}
                  disabled={saving}
                >
                  Save
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<CancelIcon />}
                  onClick={() => {
                    setIsEditingPersonal(false);
                    // Reset edit data
                    setEditData(prev => ({
                      ...prev,
                      name: userProfile?.name || '',
                      phone: userProfile?.phone || '',
                      location: userProfile?.location || ''
                    }));
                  }}
                >
                  Cancel
                </Button>
              </Box>
            )}
          </Box>

          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Full Name"
                value={editData.name}
                onChange={handleInputChange('name')}
                disabled={!isEditingPersonal}
                InputProps={{
                  startAdornment: <PersonIcon sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                value={editData.email}
                disabled
                InputProps={{
                  startAdornment: <EmailIcon sx={{ mr: 1, color: 'text.secondary' }} />
                }}
                helperText="Email cannot be changed"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Phone Number"
                value={editData.phone}
                onChange={handleInputChange('phone')}
                disabled={!isEditingPersonal}
                InputProps={{
                  startAdornment: <PhoneIcon sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Location"
                value={editData.location}
                onChange={handleInputChange('location')}
                disabled={!isEditingPersonal}
                InputProps={{
                  startAdornment: <LocationIcon sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Work Information Tab */}
      {activeTab === 1 && (
        <Paper sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6">Work Information</Typography>
            {!isEditingWork ? (
              <Button
                variant="outlined"
                startIcon={<EditIcon />}
                onClick={() => setIsEditingWork(true)}
              >
                Edit
              </Button>
            ) : (
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleSaveWork}
                  disabled={saving}
                >
                  Save
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<CancelIcon />}
                  onClick={() => {
                    setIsEditingWork(false);
                    setEditData(prev => ({
                      ...prev,
                      firm: userProfile?.firm || '',
                      role: userProfile?.role || ''
                    }));
                  }}
                >
                  Cancel
                </Button>
              </Box>
            )}
          </Box>

          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Company/Firm"
                value={editData.firm}
                onChange={handleInputChange('firm')}
                disabled={!isEditingWork}
                InputProps={{
                  startAdornment: <BusinessIcon sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Role/Title"
                value={editData.role}
                onChange={handleInputChange('role')}
                disabled={!isEditingWork}
                InputProps={{
                  startAdornment: <PersonIcon sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Preferences Tab */}
      {activeTab === 2 && (
        <Paper sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6">Notification Preferences</Typography>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSavePreferences}
              disabled={saving}
            >
              Save Preferences
            </Button>
          </Box>

          <Grid container spacing={3}>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={preferences.emailNotify}
                    onChange={handlePreferenceChange('emailNotify')}
                  />
                }
                label="Email Notifications"
              />
              <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
                Receive email updates about deals and activities
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={preferences.pushNotify}
                    onChange={handlePreferenceChange('pushNotify')}
                  />
                }
                label="Push Notifications"
              />
              <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
                Receive push notifications in the app
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={preferences.calendarNotify}
                    onChange={handlePreferenceChange('calendarNotify')}
                  />
                }
                label="Calendar Notifications"
              />
              <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
                Get notified about upcoming meetings and events
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={preferences.dealNotify}
                    onChange={handlePreferenceChange('dealNotify')}
                  />
                }
                label="Deal Notifications"
              />
              <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
                Receive updates about deal progress and changes
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle1" sx={{ mb: 2 }}>
                App Settings
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={preferences.autoSave}
                    onChange={handlePreferenceChange('autoSave')}
                  />
                }
                label="Auto-save"
              />
              <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
                Automatically save changes as you work
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={preferences.darkMode}
                    onChange={handlePreferenceChange('darkMode')}
                  />
                }
                label="Dark Mode"
              />
              <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
                Use dark theme for the interface
              </Typography>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Integrations Tab */}
      {activeTab === 3 && (
        <Paper sx={{ p: 4 }}>
          <Typography variant="h6" sx={{ mb: 3 }}>
            Connected Services
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Manage your connected services and integrations. Visit the Settings page to add new integrations.
          </Typography>

          {userProfile?.integrations && userProfile.integrations.length > 0 ? (
            <Grid container spacing={2}>
              {userProfile.integrations.map((integration) => (
                <Grid item xs={12} md={6} key={integration.id}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <GoogleIcon sx={{ mr: 2, color: 'primary.main' }} />
                        <Box>
                          <Typography variant="h6">
                            {integration.provider} {integration.type}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Status: {integration.isActive ? 'Connected' : 'Disconnected'}
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Card variant="outlined">
              <CardContent sx={{ textAlign: 'center', py: 4 }}>
                <GoogleIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No integrations connected
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Connect your accounts in Settings to access more features
                </Typography>
              </CardContent>
            </Card>
          )}
        </Paper>
      )}
    </Box>
  );
}