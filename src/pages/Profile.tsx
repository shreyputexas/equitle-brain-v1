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
  IconButton,
  MenuItem
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
  School as SchoolIcon,
  Work as WorkIcon,
  Description as DescriptionIcon,
  Add as AddIcon,
  Delete as DeleteIcon
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
  background?: {
    education?: Array<{
      id: string;
      institution: string;
      degree: string;
      field: string;
      graduationYear: string;
      gpa?: string;
    }>;
    experience?: Array<{
      id: string;
      company: string;
      position: string;
      startDate: string;
      endDate?: string;
      current: boolean;
      description: string;
      achievements?: string;
    }>;
    skills?: Array<{
      id: string;
      skill: string;
      level: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
      category: string;
    }>;
    certifications?: Array<{
      id: string;
      name: string;
      issuer: string;
      date: string;
      expiryDate?: string;
    }>;
  };
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

  const [backgroundData, setBackgroundData] = useState({
    education: [] as Array<{
      id: string;
      institution: string;
      degree: string;
      field: string;
      graduationYear: string;
      gpa?: string;
    }>,
    experience: [] as Array<{
      id: string;
      company: string;
      position: string;
      startDate: string;
      endDate?: string;
      current: boolean;
      description: string;
      achievements?: string;
    }>,
    skills: [] as Array<{
      id: string;
      skill: string;
      level: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
      category: string;
    }>,
    certifications: [] as Array<{
      id: string;
      name: string;
      issuer: string;
      date: string;
      expiryDate?: string;
    }>
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


      setLoading(false);
    }
  }, [user]);

  const handleSavePersonal = async () => {
    try {
      setSaving(true);
      setError('');

      // Configure axios for this request
      const response = await axios.put<ProfileResponse>('http://localhost:4001/api/auth/profile', {
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

      const response = await axios.put<ProfileResponse>('http://localhost:4001/api/auth/profile', {
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


  const handleInputChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditData(prev => ({
      ...prev,
      [field]: e.target.value
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
        <Tab label="Background & Experience" icon={<SchoolIcon />} />
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

      {/* Background & Experience Tab */}
      {activeTab === 2 && (
        <Paper sx={{ p: 4 }}>
          <Typography variant="h6" sx={{ mb: 3 }}>
            Background & Experience
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
            Tell us about your educational background, professional experience, and skills to help personalize your search fund profile.
          </Typography>

          {/* Education Section */}
          <Box sx={{ mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                <SchoolIcon sx={{ mr: 1 }} />
                Education
              </Typography>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={() => {
                  const newEducation = {
                    id: Date.now().toString(),
                    institution: '',
                    degree: '',
                    field: '',
                    graduationYear: '',
                    gpa: ''
                  };
                  setBackgroundData(prev => ({
                    ...prev,
                    education: [...prev.education, newEducation]
                  }));
                }}
              >
                Add Education
              </Button>
            </Box>
            
            {backgroundData.education.map((edu, index) => (
              <Card key={edu.id} sx={{ mb: 2, p: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Institution"
                      value={edu.institution}
                      onChange={(e) => {
                        const updatedEducation = backgroundData.education.map(item =>
                          item.id === edu.id ? { ...item, institution: e.target.value } : item
                        );
                        setBackgroundData(prev => ({ ...prev, education: updatedEducation }));
                      }}
                      InputProps={{
                        startAdornment: <SchoolIcon sx={{ mr: 1, color: 'text.secondary' }} />
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Degree"
                      value={edu.degree}
                      onChange={(e) => {
                        const updatedEducation = backgroundData.education.map(item =>
                          item.id === edu.id ? { ...item, degree: e.target.value } : item
                        );
                        setBackgroundData(prev => ({ ...prev, education: updatedEducation }));
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Field of Study"
                      value={edu.field}
                      onChange={(e) => {
                        const updatedEducation = backgroundData.education.map(item =>
                          item.id === edu.id ? { ...item, field: e.target.value } : item
                        );
                        setBackgroundData(prev => ({ ...prev, education: updatedEducation }));
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <TextField
                      fullWidth
                      label="Graduation Year"
                      value={edu.graduationYear}
                      onChange={(e) => {
                        const updatedEducation = backgroundData.education.map(item =>
                          item.id === edu.id ? { ...item, graduationYear: e.target.value } : item
                        );
                        setBackgroundData(prev => ({ ...prev, education: updatedEducation }));
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <TextField
                      fullWidth
                      label="GPA (Optional)"
                      value={edu.gpa || ''}
                      onChange={(e) => {
                        const updatedEducation = backgroundData.education.map(item =>
                          item.id === edu.id ? { ...item, gpa: e.target.value } : item
                        );
                        setBackgroundData(prev => ({ ...prev, education: updatedEducation }));
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <IconButton
                      color="error"
                      onClick={() => {
                        setBackgroundData(prev => ({
                          ...prev,
                          education: prev.education.filter(item => item.id !== edu.id)
                        }));
                      }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Grid>
                </Grid>
              </Card>
            ))}
          </Box>

          {/* Professional Experience Section */}
          <Box sx={{ mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                <WorkIcon sx={{ mr: 1 }} />
                Professional Experience
              </Typography>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={() => {
                  const newExperience = {
                    id: Date.now().toString(),
                    company: '',
                    position: '',
                    startDate: '',
                    endDate: '',
                    current: false,
                    description: '',
                    achievements: ''
                  };
                  setBackgroundData(prev => ({
                    ...prev,
                    experience: [...prev.experience, newExperience]
                  }));
                }}
              >
                Add Experience
              </Button>
            </Box>
            
            {backgroundData.experience.map((exp, index) => (
              <Card key={exp.id} sx={{ mb: 2, p: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Company"
                      value={exp.company}
                      onChange={(e) => {
                        const updatedExperience = backgroundData.experience.map(item =>
                          item.id === exp.id ? { ...item, company: e.target.value } : item
                        );
                        setBackgroundData(prev => ({ ...prev, experience: updatedExperience }));
                      }}
                      InputProps={{
                        startAdornment: <BusinessIcon sx={{ mr: 1, color: 'text.secondary' }} />
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Position"
                      value={exp.position}
                      onChange={(e) => {
                        const updatedExperience = backgroundData.experience.map(item =>
                          item.id === exp.id ? { ...item, position: e.target.value } : item
                        );
                        setBackgroundData(prev => ({ ...prev, experience: updatedExperience }));
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <TextField
                      fullWidth
                      label="Start Date"
                      value={exp.startDate}
                      onChange={(e) => {
                        const updatedExperience = backgroundData.experience.map(item =>
                          item.id === exp.id ? { ...item, startDate: e.target.value } : item
                        );
                        setBackgroundData(prev => ({ ...prev, experience: updatedExperience }));
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <TextField
                      fullWidth
                      label="End Date"
                      value={exp.endDate || ''}
                      onChange={(e) => {
                        const updatedExperience = backgroundData.experience.map(item =>
                          item.id === exp.id ? { ...item, endDate: e.target.value } : item
                        );
                        setBackgroundData(prev => ({ ...prev, experience: updatedExperience }));
                      }}
                      disabled={exp.current}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={exp.current}
                          onChange={(e) => {
                            const updatedExperience = backgroundData.experience.map(item =>
                              item.id === exp.id ? { ...item, current: e.target.checked } : item
                            );
                            setBackgroundData(prev => ({ ...prev, experience: updatedExperience }));
                          }}
                        />
                      }
                      label="Current Position"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Description"
                      multiline
                      rows={3}
                      value={exp.description}
                      onChange={(e) => {
                        const updatedExperience = backgroundData.experience.map(item =>
                          item.id === exp.id ? { ...item, description: e.target.value } : item
                        );
                        setBackgroundData(prev => ({ ...prev, experience: updatedExperience }));
                      }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Key Achievements (Optional)"
                      multiline
                      rows={2}
                      value={exp.achievements || ''}
                      onChange={(e) => {
                        const updatedExperience = backgroundData.experience.map(item =>
                          item.id === exp.id ? { ...item, achievements: e.target.value } : item
                        );
                        setBackgroundData(prev => ({ ...prev, experience: updatedExperience }));
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <IconButton
                      color="error"
                      onClick={() => {
                        setBackgroundData(prev => ({
                          ...prev,
                          experience: prev.experience.filter(item => item.id !== exp.id)
                        }));
                      }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Grid>
                </Grid>
              </Card>
            ))}
          </Box>

          {/* Skills Section */}
          <Box sx={{ mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                <DescriptionIcon sx={{ mr: 1 }} />
                Skills & Expertise
              </Typography>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={() => {
                  const newSkill = {
                    id: Date.now().toString(),
                    skill: '',
                    level: 'Intermediate' as const,
                    category: ''
                  };
                  setBackgroundData(prev => ({
                    ...prev,
                    skills: [...prev.skills, newSkill]
                  }));
                }}
              >
                Add Skill
              </Button>
            </Box>
            
            {backgroundData.skills.map((skill, index) => (
              <Card key={skill.id} sx={{ mb: 2, p: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      label="Skill"
                      value={skill.skill}
                      onChange={(e) => {
                        const updatedSkills = backgroundData.skills.map(item =>
                          item.id === skill.id ? { ...item, skill: e.target.value } : item
                        );
                        setBackgroundData(prev => ({ ...prev, skills: updatedSkills }));
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      select
                      label="Level"
                      value={skill.level}
                      onChange={(e) => {
                        const updatedSkills = backgroundData.skills.map(item =>
                          item.id === skill.id ? { ...item, level: e.target.value as any } : item
                        );
                        setBackgroundData(prev => ({ ...prev, skills: updatedSkills }));
                      }}
                    >
                      <MenuItem value="Beginner">Beginner</MenuItem>
                      <MenuItem value="Intermediate">Intermediate</MenuItem>
                      <MenuItem value="Advanced">Advanced</MenuItem>
                      <MenuItem value="Expert">Expert</MenuItem>
                    </TextField>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      label="Category"
                      value={skill.category}
                      onChange={(e) => {
                        const updatedSkills = backgroundData.skills.map(item =>
                          item.id === skill.id ? { ...item, category: e.target.value } : item
                        );
                        setBackgroundData(prev => ({ ...prev, skills: updatedSkills }));
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <IconButton
                      color="error"
                      onClick={() => {
                        setBackgroundData(prev => ({
                          ...prev,
                          skills: prev.skills.filter(item => item.id !== skill.id)
                        }));
                      }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Grid>
                </Grid>
              </Card>
            ))}
          </Box>

          {/* Save Button */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4 }}>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={async () => {
                try {
                  setSaving(true);
                  setError('');
                  
                  await axios.put('http://localhost:4001/api/auth/background', backgroundData, {
                    headers: {
                      'Authorization': 'Bearer mock-token'
                    }
                  });
                  
                  setSuccess('Background information updated successfully');
                } catch (err: any) {
                  setError(err.response?.data?.message || 'Failed to update background information');
                } finally {
                  setSaving(false);
                }
              }}
              disabled={saving}
            >
              Save Background Information
            </Button>
          </Box>
        </Paper>
      )}

    </Box>
  );
}