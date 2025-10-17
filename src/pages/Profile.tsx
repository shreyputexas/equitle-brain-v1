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
  Alert,
  CircularProgress,
  Divider,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Switch,
  FormControlLabel,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Fab
} from '@mui/material';
import {
  Person as PersonIcon,
  School as SchoolIcon,
  Work as WorkIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { searcherProfilesApi, SearcherProfile, Education, Experience } from '../services/searcherProfilesApi';


export default function Profile() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Searcher profiles state
  const [searchers, setSearchers] = useState<SearcherProfile[]>([]);
  const [selectedSearcher, setSelectedSearcher] = useState<string | null>(null);
  const [isAddingSearcher, setIsAddingSearcher] = useState(false);
  const [isEditingSearcher, setIsEditingSearcher] = useState(false);
  const [editingSearcher, setEditingSearcher] = useState<SearcherProfile | null>(null);

  // Form state for new/editing searcher
  const [searcherForm, setSearcherForm] = useState<Partial<SearcherProfile>>({
    name: '',
    title: '',
    bio: '',
    why: '',
    education: [],
    experience: []
  });

  // Education form state
  const [educationForm, setEducationForm] = useState<Partial<Education>>({
    institution: '',
    degree: '',
    field: '',
    startDate: '',
    endDate: '',
    current: false,
    description: ''
  });
  const [isAddingEducation, setIsAddingEducation] = useState(false);

  // Experience form state
  const [experienceForm, setExperienceForm] = useState<Partial<Experience>>({
    company: '',
    position: '',
    startDate: '',
    endDate: '',
    current: false,
    description: '',
    achievements: ''
  });
  const [isAddingExperience, setIsAddingExperience] = useState(false);

  const handleAddSearcher = async () => {
    if (searcherForm.name && searcherForm.title && searcherForm.bio) {
      try {
        setLoading(true);
        setError('');
        
        const newSearcher = await searcherProfilesApi.createSearcherProfile({
          name: searcherForm.name,
          title: searcherForm.title,
          bio: searcherForm.bio,
          why: searcherForm.why || '',
          education: searcherForm.education || [],
          experience: searcherForm.experience || [],
          avatar: searcherForm.avatar
        });
        
        setSearchers([...searchers, newSearcher]);
        setIsAddingSearcher(false);
        resetSearcherForm();
        setSuccess('Searcher profile created successfully!');
      } catch (error: any) {
        console.error('Error creating searcher profile:', error);
        setError(error.response?.data?.message || 'Failed to create searcher profile');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleEditSearcher = (searcher: SearcherProfile) => {
    setEditingSearcher(searcher);
    setSearcherForm(searcher);
    setIsEditingSearcher(true);
  };

  const handleUpdateSearcher = async () => {
    if (editingSearcher && searcherForm.name && searcherForm.title && searcherForm.bio) {
      try {
        setLoading(true);
        setError('');
        
        const updatedSearcher = await searcherProfilesApi.updateSearcherProfile(editingSearcher.id, {
          name: searcherForm.name,
          title: searcherForm.title,
          bio: searcherForm.bio,
          why: searcherForm.why || '',
          education: searcherForm.education || [],
          experience: searcherForm.experience || [],
          avatar: searcherForm.avatar
        });
        
        setSearchers(searchers.map(s => s.id === editingSearcher.id ? updatedSearcher : s));
        setIsEditingSearcher(false);
        setEditingSearcher(null);
        resetSearcherForm();
        setSuccess('Searcher profile updated successfully!');
      } catch (error: any) {
        console.error('Error updating searcher profile:', error);
        setError(error.response?.data?.message || 'Failed to update searcher profile');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDeleteSearcher = async (id: string) => {
    try {
      setLoading(true);
      setError('');
      
      await searcherProfilesApi.deleteSearcherProfile(id);
      setSearchers(searchers.filter(s => s.id !== id));
      setSuccess('Searcher profile deleted successfully!');
    } catch (error: any) {
      console.error('Error deleting searcher profile:', error);
      setError(error.response?.data?.message || 'Failed to delete searcher profile');
    } finally {
      setLoading(false);
    }
  };

  const handleAddEducation = () => {
    if (educationForm.institution && educationForm.degree && educationForm.field) {
        const newEducation: Education = {
          id: Date.now().toString(),
          institution: educationForm.institution!,
          degree: educationForm.degree!,
          field: educationForm.field!,
          startDate: educationForm.startDate || '',
          endDate: educationForm.endDate || '',
          current: educationForm.current || false,
          description: educationForm.description
        };
      
      if (isEditingSearcher && editingSearcher) {
        const updatedEducation = [...(editingSearcher.education || []), newEducation];
        setSearcherForm({ ...searcherForm, education: updatedEducation });
      } else {
        setSearcherForm({ ...searcherForm, education: [...(searcherForm.education || []), newEducation] });
      }
      
      setIsAddingEducation(false);
      resetEducationForm();
    }
  };

  const handleAddExperience = () => {
    if (experienceForm.company && experienceForm.position) {
        const newExperience: Experience = {
          id: Date.now().toString(),
          company: experienceForm.company!,
          position: experienceForm.position!,
          startDate: experienceForm.startDate || '',
          endDate: experienceForm.endDate || '',
          current: experienceForm.current || false,
          description: experienceForm.description || '',
          achievements: experienceForm.achievements
        };
      
      if (isEditingSearcher && editingSearcher) {
        const updatedExperience = [...(editingSearcher.experience || []), newExperience];
        setSearcherForm({ ...searcherForm, experience: updatedExperience });
      } else {
        setSearcherForm({ ...searcherForm, experience: [...(searcherForm.experience || []), newExperience] });
      }
      
      setIsAddingExperience(false);
      resetExperienceForm();
    }
  };

  const resetSearcherForm = () => {
    setSearcherForm({
      name: '',
      title: '',
      bio: '',
      why: '',
      education: [],
      experience: []
    });
  };

  const resetEducationForm = () => {
    setEducationForm({
      institution: '',
      degree: '',
      field: '',
      startDate: '',
      endDate: '',
      current: false,
      description: ''
    });
  };

  const resetExperienceForm = () => {
    setExperienceForm({
      company: '',
      position: '',
      startDate: '',
      endDate: '',
      current: false,
      description: '',
      achievements: ''
    });
  };

  const handleCancelAdd = () => {
    setIsAddingSearcher(false);
    setIsEditingSearcher(false);
    setEditingSearcher(null);
    resetSearcherForm();
  };

  // Load searcher profiles on component mount
  useEffect(() => {
    const loadSearcherProfiles = async () => {
      try {
        setLoading(true);
        const profiles = await searcherProfilesApi.getSearcherProfiles();
        setSearchers(profiles);
      } catch (error: any) {
        console.error('Error loading searcher profiles:', error);
        setError(error.response?.data?.message || 'Failed to load searcher profiles');
      } finally {
        setLoading(false);
      }
    };

    loadSearcherProfiles();
  }, []);

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" sx={{ fontWeight: 600, mb: 1, color: '#000000' }}>
        My Profile
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Manage your searcher profile and background information for personalized pitch generation
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Searcher Profiles */}
      <Paper sx={{ p: 4, position: 'relative' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 600, color: '#000000', mb: 1 }}>
              Searcher Profiles
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage searcher profiles for personalized pitch generation
            </Typography>
          </Box>
          {searchers.length > 0 && (
            <Typography variant="body2" color="text.secondary">
              {searchers.length} profile{searchers.length !== 1 ? 's' : ''}
            </Typography>
          )}
        </Box>
        {searchers.length === 0 ? (
          <Card 
            variant="outlined" 
            sx={{ 
              textAlign: 'center', 
              py: 6,
              border: '2px dashed #e0e0e0',
              bgcolor: '#fafafa'
            }}
          >
            <CardContent>
              <PersonIcon sx={{ fontSize: 64, color: '#9e9e9e', mb: 3 }} />
              <Typography variant="h5" color="text.secondary" gutterBottom sx={{ fontWeight: 600 }}>
                No searcher profiles yet
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3, maxWidth: 400, mx: 'auto' }}>
                Create your first searcher profile to start generating personalized pitches
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setIsAddingSearcher(true)}
                size="large"
                sx={{ 
                  bgcolor: '#000000', 
                  '&:hover': { bgcolor: '#333333' },
                  px: 4,
                  py: 1.5
                }}
              >
                Add First Searcher
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Grid container spacing={3}>
            {searchers.map((searcher) => (
              <Grid item xs={12} md={6} key={searcher.id}>
                <Card 
                  variant="outlined" 
                  sx={{ 
                    height: '100%',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      boxShadow: 4,
                      transform: 'translateY(-2px)'
                    }
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                      <Avatar 
                        sx={{ 
                          mr: 2, 
                          bgcolor: '#000000', 
                          width: 56, 
                          height: 56,
                          fontSize: '1.25rem',
                          fontWeight: 600
                        }}
                      >
                        {searcher.name.charAt(0).toUpperCase()}
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                          {searcher.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                          {searcher.title}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <IconButton 
                          size="small" 
                          onClick={() => handleEditSearcher(searcher)}
                          sx={{ 
                            '&:hover': { bgcolor: '#f5f5f5' }
                          }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton 
                          size="small" 
                          onClick={() => handleDeleteSearcher(searcher.id)}
                          sx={{ 
                            '&:hover': { bgcolor: '#ffebee' }
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>
                    
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        mb: 2, 
                        lineHeight: 1.6,
                        color: 'text.primary'
                      }}
                    >
                      {searcher.bio}
                    </Typography>
                    
                    {searcher.why && (
                      <Box sx={{ mb: 3, p: 2, bgcolor: '#f8f9fa', borderRadius: 1 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, mb: 1 }}>
                          Why:
                        </Typography>
                        <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                          "{searcher.why}"
                        </Typography>
                      </Box>
                    )}
                    
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Chip
                        icon={<SchoolIcon />}
                        label={`${searcher.education.length} Education`}
                        size="small"
                        sx={{ 
                          bgcolor: '#e3f2fd', 
                          color: '#1976d2',
                          fontWeight: 500
                        }}
                      />
                      <Chip
                        icon={<WorkIcon />}
                        label={`${searcher.experience.length} Experience`}
                        size="small"
                        sx={{ 
                          bgcolor: '#e8f5e8', 
                          color: '#2e7d32',
                          fontWeight: 500
                        }}
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Floating Action Button */}
        <Fab
          color="primary"
          aria-label="add searcher"
          onClick={() => setIsAddingSearcher(true)}
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            bgcolor: '#000000',
            '&:hover': { bgcolor: '#333333' }
          }}
        >
          <AddIcon />
        </Fab>
      </Paper>

      {/* Add/Edit Searcher Dialog */}
      <Dialog 
        open={isAddingSearcher || isEditingSearcher} 
        onClose={handleCancelAdd} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: { minHeight: '80vh' }
        }}
      >
        <DialogTitle>
          {isEditingSearcher ? 'Edit Searcher Profile' : 'Add New Searcher Profile'}
        </DialogTitle>
        <DialogContent>

          <Grid container spacing={3}>
            {/* Basic Information */}
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mb: 2, color: '#000000' }}>
                Basic Information
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Full Name"
                value={searcherForm.name || ''}
                onChange={(e) => setSearcherForm({ ...searcherForm, name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Title/Position"
                value={searcherForm.title || ''}
                onChange={(e) => setSearcherForm({ ...searcherForm, title: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Bio/Background"
                multiline
                rows={3}
                value={searcherForm.bio || ''}
                onChange={(e) => setSearcherForm({ ...searcherForm, bio: e.target.value })}
                required
                placeholder="Tell us about your background and experience..."
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="What is your why?"
                multiline
                rows={2}
                value={searcherForm.why || ''}
                onChange={(e) => setSearcherForm({ ...searcherForm, why: e.target.value })}
                placeholder="What drives you? What's your mission? Why are you doing this?"
              />
            </Grid>

            {/* Education Section */}
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ color: '#000000' }}>
                  Education
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={() => setIsAddingEducation(true)}
                  size="small"
                >
                  Add Education
                </Button>
              </Box>
              
              {searcherForm.education && searcherForm.education.length > 0 ? (
                <List>
                  {searcherForm.education.map((edu) => (
                    <ListItem key={edu.id} sx={{ border: '1px solid #e0e0e0', borderRadius: 1, mb: 1 }}>
                      <ListItemText
                        primary={`${edu.degree} in ${edu.field}`}
                        secondary={`${edu.institution} • ${edu.startDate} - ${edu.current ? 'Present' : edu.endDate}`}
                      />
                      <ListItemSecondaryAction>
                        <IconButton size="small">
                          <DeleteIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                  No education entries yet. Click "Add Education" to get started.
                </Typography>
              )}
            </Grid>

            {/* Experience Section */}
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ color: '#000000' }}>
                  Industry Experience
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={() => setIsAddingExperience(true)}
                  size="small"
                >
                  Add Experience
                </Button>
              </Box>
              
              {searcherForm.experience && searcherForm.experience.length > 0 ? (
                <List>
                  {searcherForm.experience.map((exp) => (
                    <ListItem key={exp.id} sx={{ border: '1px solid #e0e0e0', borderRadius: 1, mb: 1 }}>
                      <ListItemText
                        primary={exp.position}
                        secondary={`${exp.company} • ${exp.startDate} - ${exp.current ? 'Present' : exp.endDate}`}
                      />
                      <ListItemSecondaryAction>
                        <IconButton size="small">
                          <DeleteIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                  No experience entries yet. Click "Add Experience" to get started.
                </Typography>
              )}
            </Grid>

          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button
            variant="outlined"
            onClick={handleCancelAdd}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={isEditingSearcher ? handleUpdateSearcher : handleAddSearcher}
            sx={{ bgcolor: '#000000', '&:hover': { bgcolor: '#333333' } }}
            disabled={loading}
          >
            {loading ? 'Saving...' : (isEditingSearcher ? 'Update Searcher' : 'Add Searcher')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Education Dialog */}
      <Dialog open={isAddingEducation} onClose={() => setIsAddingEducation(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Education</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Institution"
                value={educationForm.institution || ''}
                onChange={(e) => setEducationForm({ ...educationForm, institution: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Degree"
                value={educationForm.degree || ''}
                onChange={(e) => setEducationForm({ ...educationForm, degree: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Field of Study"
                value={educationForm.field || ''}
                onChange={(e) => setEducationForm({ ...educationForm, field: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Start Date"
                type="month"
                value={educationForm.startDate || ''}
                onChange={(e) => setEducationForm({ ...educationForm, startDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="End Date"
                type="month"
                value={educationForm.endDate || ''}
                onChange={(e) => setEducationForm({ ...educationForm, endDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
                disabled={educationForm.current}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={educationForm.current || false}
                    onChange={(e) => setEducationForm({ ...educationForm, current: e.target.checked })}
                  />
                }
                label="Currently studying"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description (Optional)"
                multiline
                rows={2}
                value={educationForm.description || ''}
                onChange={(e) => setEducationForm({ ...educationForm, description: e.target.value })}
                placeholder="Any additional details about your education..."
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsAddingEducation(false)}>Cancel</Button>
          <Button onClick={handleAddEducation} variant="contained" sx={{ bgcolor: '#000000', '&:hover': { bgcolor: '#333333' } }}>
            Add Education
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Experience Dialog */}
      <Dialog open={isAddingExperience} onClose={() => setIsAddingExperience(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Experience</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Company"
                value={experienceForm.company || ''}
                onChange={(e) => setExperienceForm({ ...experienceForm, company: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Position"
                value={experienceForm.position || ''}
                onChange={(e) => setExperienceForm({ ...experienceForm, position: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Start Date"
                type="month"
                value={experienceForm.startDate || ''}
                onChange={(e) => setExperienceForm({ ...experienceForm, startDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="End Date"
                type="month"
                value={experienceForm.endDate || ''}
                onChange={(e) => setExperienceForm({ ...experienceForm, endDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
                disabled={experienceForm.current}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={experienceForm.current || false}
                    onChange={(e) => setExperienceForm({ ...experienceForm, current: e.target.checked })}
                  />
                }
                label="Currently working here"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="What you did"
                multiline
                rows={3}
                value={experienceForm.description || ''}
                onChange={(e) => setExperienceForm({ ...experienceForm, description: e.target.value })}
                placeholder="Describe your role and responsibilities..."
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Key Achievements (Optional)"
                multiline
                rows={2}
                value={experienceForm.achievements || ''}
                onChange={(e) => setExperienceForm({ ...experienceForm, achievements: e.target.value })}
                placeholder="Any notable achievements or accomplishments..."
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsAddingExperience(false)}>Cancel</Button>
          <Button onClick={handleAddExperience} variant="contained" sx={{ bgcolor: '#000000', '&:hover': { bgcolor: '#333333' } }}>
            Add Experience
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}