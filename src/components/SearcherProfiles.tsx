import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  Card,
  CardContent,
  Avatar,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  School as SchoolIcon,
  Work as WorkIcon,
  Description as DescriptionIcon
} from '@mui/icons-material';

interface SearcherProfile {
  id: string;
  name: string;
  title: string;
  bio: string;
  avatar?: string;
  education: Array<{
    id: string;
    institution: string;
    degree: string;
    field: string;
    graduationYear: string;
    gpa?: string;
  }>;
  experience: Array<{
    id: string;
    company: string;
    position: string;
    startDate: string;
    endDate?: string;
    current: boolean;
    description: string;
    achievements?: string;
  }>;
  skills: Array<{
    id: string;
    skill: string;
    level: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
    category: string;
  }>;
  certifications: Array<{
    id: string;
    name: string;
    issuer: string;
    date: string;
    expiryDate?: string;
  }>;
  investmentFocus: {
    industries: string[];
    companySize: string;
    geographicFocus: string[];
    dealTypes: string[];
  };
  personalValues: string[];
  contactInfo: {
    email: string;
    phone: string;
    linkedin?: string;
    location: string;
  };
}

interface SearcherProfilesProps {
  searchers: SearcherProfile[];
  onAddSearcher: (searcher: SearcherProfile) => void;
  onUpdateSearcher: (id: string, searcher: SearcherProfile) => void;
  onDeleteSearcher: (id: string) => void;
}

export default function SearcherProfiles({ 
  searchers, 
  onAddSearcher, 
  onUpdateSearcher, 
  onDeleteSearcher 
}: SearcherProfilesProps) {
  const [isAddingSearcher, setIsAddingSearcher] = useState(false);
  const [editingSearcher, setEditingSearcher] = useState<SearcherProfile | null>(null);
  const [newSearcher, setNewSearcher] = useState<Partial<SearcherProfile>>({
    name: '',
    title: '',
    bio: '',
    education: [],
    experience: [],
    skills: [],
    certifications: [],
    investmentFocus: {
      industries: [],
      companySize: '',
      geographicFocus: [],
      dealTypes: []
    },
    personalValues: [],
    contactInfo: {
      email: '',
      phone: '',
      location: ''
    }
  });

  const handleAddSearcher = () => {
    if (newSearcher.name && newSearcher.title && newSearcher.bio) {
      const searcher: SearcherProfile = {
        id: Date.now().toString(),
        name: newSearcher.name,
        title: newSearcher.title,
        bio: newSearcher.bio,
        education: newSearcher.education || [],
        experience: newSearcher.experience || [],
        skills: newSearcher.skills || [],
        certifications: newSearcher.certifications || [],
        investmentFocus: newSearcher.investmentFocus || {
          industries: [],
          companySize: '',
          geographicFocus: [],
          dealTypes: []
        },
        personalValues: newSearcher.personalValues || [],
        contactInfo: newSearcher.contactInfo || {
          email: '',
          phone: '',
          location: ''
        }
      };
      onAddSearcher(searcher);
      setIsAddingSearcher(false);
      setNewSearcher({
        name: '',
        title: '',
        bio: '',
        education: [],
        experience: [],
        skills: [],
        certifications: [],
        investmentFocus: {
          industries: [],
          companySize: '',
          geographicFocus: [],
          dealTypes: []
        },
        personalValues: [],
        contactInfo: {
          email: '',
          phone: '',
          location: ''
        }
      });
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">Searcher Profiles</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setIsAddingSearcher(true)}
          sx={{ bgcolor: '#000000', '&:hover': { bgcolor: '#333333' } }}
        >
          Add Searcher
        </Button>
      </Box>
      
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Manage searcher profiles for personalized pitch generation. Each searcher profile contains comprehensive background information.
      </Typography>

      {searchers.length === 0 ? (
        <Card variant="outlined">
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <PersonIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No searcher profiles
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Add searcher profiles to enable personalized pitch generation
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setIsAddingSearcher(true)}
              sx={{ bgcolor: '#000000', '&:hover': { bgcolor: '#333333' } }}
            >
              Add First Searcher
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {searchers.map((searcher) => (
            <Grid item xs={12} md={6} key={searcher.id}>
              <Card variant="outlined">
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                      {searcher.name.charAt(0)}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6">{searcher.name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {searcher.title}
                      </Typography>
                    </Box>
                    <IconButton size="small" onClick={() => setEditingSearcher(searcher)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton size="small" onClick={() => onDeleteSearcher(searcher.id)}>
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    {searcher.bio}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {searcher.investmentFocus.industries.slice(0, 3).map((industry) => (
                      <Chip
                        key={industry}
                        label={industry}
                        size="small"
                        sx={{ bgcolor: '#f0f0f0', color: '#000' }}
                      />
                    ))}
                    {searcher.investmentFocus.industries.length > 3 && (
                      <Chip
                        label={`+${searcher.investmentFocus.industries.length - 3} more`}
                        size="small"
                        sx={{ bgcolor: '#f0f0f0', color: '#000' }}
                      />
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Add Searcher Dialog */}
      <Dialog open={isAddingSearcher} onClose={() => setIsAddingSearcher(false)} maxWidth="md" fullWidth>
        <DialogTitle>Add New Searcher</DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Full Name"
                value={newSearcher.name || ''}
                onChange={(e) => setNewSearcher({ ...newSearcher, name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Title/Position"
                value={newSearcher.title || ''}
                onChange={(e) => setNewSearcher({ ...newSearcher, title: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Bio/Background"
                multiline
                rows={3}
                value={newSearcher.bio || ''}
                onChange={(e) => setNewSearcher({ ...newSearcher, bio: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email"
                value={newSearcher.contactInfo?.email || ''}
                onChange={(e) => setNewSearcher({ 
                  ...newSearcher, 
                  contactInfo: { ...newSearcher.contactInfo, email: e.target.value }
                })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Phone"
                value={newSearcher.contactInfo?.phone || ''}
                onChange={(e) => setNewSearcher({ 
                  ...newSearcher, 
                  contactInfo: { ...newSearcher.contactInfo, phone: e.target.value }
                })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Location"
                value={newSearcher.contactInfo?.location || ''}
                onChange={(e) => setNewSearcher({ 
                  ...newSearcher, 
                  contactInfo: { ...newSearcher.contactInfo, location: e.target.value }
                })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsAddingSearcher(false)}>Cancel</Button>
          <Button 
            onClick={handleAddSearcher}
            variant="contained"
            sx={{ bgcolor: '#000000', '&:hover': { bgcolor: '#333333' } }}
          >
            Add Searcher
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
