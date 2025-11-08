import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { headshotsApi } from '../services/headshotsApi';
import { logosApi } from '../services/logosApi';
import { HeadshotCropper } from '../components/HeadshotCropper';
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
  Fab,
  Tooltip,
  Stack,
  InputAdornment
} from '@mui/material';
import {
  Person as PersonIcon,
  School as SchoolIcon,
  Work as WorkIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  PhotoCamera as PhotoCameraIcon,
  Business as BusinessIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  Language as LanguageIcon,
  Upload as UploadIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { searcherProfilesApi, SearcherProfile, Education, Experience } from '../services/searcherProfilesApi';
import { getUserId } from '../utils/auth';
import { getApiUrl, getSocketUrl } from '../config/api';


// BULLETPROOF Helper function to ensure headshot URL is absolute
const getAbsoluteHeadshotUrl = (url: string | undefined): string | undefined => {
  if (!url) {
    console.log('❌ No headshot URL provided');
    return undefined;
  }

  console.log('🔍 Original headshot URL:', url);

  // If URL is already absolute, return as-is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    console.log('✅ URL is already absolute:', url);
    return url;
  }

  // If URL is relative, prepend the base URL
  const baseUrl = getSocketUrl();
  
  // Ensure URL starts with / if it doesn't already
  let finalUrl = url;
  if (!url.startsWith('/')) {
    finalUrl = `/${url}`;
  }
  
  const absoluteUrl = `${baseUrl}${finalUrl}`;
  console.log('✅ Converted to absolute URL:', absoluteUrl);
  
  return absoluteUrl;
};

export default function Profile() {
  const { user, refreshUser, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Investor profiles state
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
  const [editingEducation, setEditingEducation] = useState<Education | null>(null);

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
  const [editingExperience, setEditingExperience] = useState<Experience | null>(null);

  // Team connection state
  const [teamConnection, setTeamConnection] = useState('');

  // Headshot upload state
  const [uploadingHeadshot, setUploadingHeadshot] = useState<string | null>(null);
  const [croppingImage, setCroppingImage] = useState<{
    searcherId: string;
    searcherName: string;
    imageSrc: string;
  } | null>(null);

  // Logo upload state
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [searchFundLogo, setSearchFundLogo] = useState<string | null>(null);
  const [searchFundName, setSearchFundName] = useState('');
  const [searchFundWebsite, setSearchFundWebsite] = useState('');
  const [searchFundAddress, setSearchFundAddress] = useState('');
  const [searchFundEmail, setSearchFundEmail] = useState('');
  const [primaryProfileId, setPrimaryProfileId] = useState<string | null>(null);

  // Load team connection from Firebase
  useEffect(() => {
    const loadTeamConnection = async () => {
      try {
        const userId = getUserId();
        const teamConnectionRef = doc(db, 'users', userId, 'teamConnection', 'connection');
        const docSnap = await getDoc(teamConnectionRef);

        if (docSnap.exists()) {
          setTeamConnection(docSnap.data().connection || '');
        }
      } catch (error) {
        console.error('Error loading team connection:', error);
      }
    };

    loadTeamConnection();
  }, []);

  // Load search fund logo and name from Firebase
  useEffect(() => {
    const loadSearchFundData = async () => {
      try {
        const userId = getUserId();
        const userRef = doc(db, 'users', userId);
        const docSnap = await getDoc(userRef);

        if (docSnap.exists()) {
          const userData = docSnap.data();
          setSearchFundLogo(userData.searchFundLogo || null);
          setSearchFundName(userData.searchFundName || '');
          setSearchFundWebsite(userData.searchFundWebsite || '');
          setSearchFundAddress(userData.searchFundAddress || '');
          setSearchFundEmail(userData.searchFundEmail || '');
        }
      } catch (error) {
        console.error('Error loading search fund data:', error);
      }
    };

    loadSearchFundData();
  }, []);

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

        console.log('🔄 Updating searcher profile:', {
          searcherId: editingSearcher.id,
          updateData: {
            name: searcherForm.name,
            title: searcherForm.title,
            bio: searcherForm.bio,
            why: searcherForm.why || '',
            education: searcherForm.education || [],
            experience: searcherForm.experience || [],
            avatar: searcherForm.avatar
          }
        });

        const updatedSearcher = await searcherProfilesApi.updateSearcherProfile(editingSearcher.id, {
          name: searcherForm.name,
          title: searcherForm.title,
          bio: searcherForm.bio,
          why: searcherForm.why || '',
          education: searcherForm.education || [],
          experience: searcherForm.experience || [],
          avatar: searcherForm.avatar
        });
        
        console.log('✅ Updated searcher profile response:', updatedSearcher);
        
        // Reload profiles to ensure we have the latest data
        console.log('🔄 Reloading profiles after update...');
        await loadSearcherProfiles();
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
      if (editingEducation) {
        // Update existing education
        const updatedEducation: Education = {
          ...editingEducation,
          institution: educationForm.institution!,
          degree: educationForm.degree!,
          field: educationForm.field!,
          startDate: educationForm.startDate || '',
          endDate: educationForm.endDate || '',
          current: educationForm.current || false,
          description: educationForm.description
        };

        // Always use searcherForm.education as the source of truth
        const updatedEducationList = (searcherForm.education || []).map(edu =>
          edu.id === editingEducation.id ? updatedEducation : edu
        );
        setSearcherForm({ ...searcherForm, education: updatedEducationList });

        setEditingEducation(null);
      } else {
        // Add new education
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

        // Always use searcherForm.education as the source of truth
        setSearcherForm({ ...searcherForm, education: [...(searcherForm.education || []), newEducation] });
      }

      setIsAddingEducation(false);
      resetEducationForm();
    }
  };

  const handleAddExperience = () => {
    if (experienceForm.company && experienceForm.position) {
      if (editingExperience) {
        // Update existing experience
        const updatedExperience: Experience = {
          ...editingExperience,
          company: experienceForm.company!,
          position: experienceForm.position!,
          startDate: experienceForm.startDate || '',
          endDate: experienceForm.endDate || '',
          current: experienceForm.current || false,
          description: experienceForm.description || '',
          achievements: experienceForm.achievements
        };

        // Always use searcherForm.experience as the source of truth
        const updatedExperienceList = (searcherForm.experience || []).map(exp =>
          exp.id === editingExperience.id ? updatedExperience : exp
        );
        setSearcherForm({ ...searcherForm, experience: updatedExperienceList });

        setEditingExperience(null);
      } else {
        // Add new experience
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

        // Always use searcherForm.experience as the source of truth
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

  const handleEditEducation = (education: Education) => {
    setEditingEducation(education);
    setEducationForm({
      institution: education.institution,
      degree: education.degree,
      field: education.field,
      startDate: education.startDate,
      endDate: education.endDate,
      current: education.current,
      description: education.description
    });
    setIsAddingEducation(true);
  };

  const handleDeleteEducation = (id: string) => {
    // Always use searcherForm.education as the source of truth
    const updatedEducation = (searcherForm.education || []).filter(edu => edu.id !== id);
    setSearcherForm({ ...searcherForm, education: updatedEducation });
  };

  const handleEditExperience = (experience: Experience) => {
    setEditingExperience(experience);
    setExperienceForm({
      company: experience.company,
      position: experience.position,
      startDate: experience.startDate,
      endDate: experience.endDate,
      current: experience.current,
      description: experience.description,
      achievements: experience.achievements
    });
    setIsAddingExperience(true);
  };

  const handleDeleteExperience = (id: string) => {
    // Always use searcherForm.experience as the source of truth
    const updatedExperience = (searcherForm.experience || []).filter(exp => exp.id !== id);
    setSearcherForm({ ...searcherForm, experience: updatedExperience });
  };

  const handleSaveTeamConnection = async () => {
    try {
      setLoading(true);
      const userId = getUserId();

      // Save team connection to Firebase
      const teamConnectionRef = doc(db, 'users', userId, 'teamConnection', 'connection');
      await setDoc(teamConnectionRef, {
        connection: teamConnection,
        updatedAt: new Date()
      });

      setSuccess('Team connection saved successfully!');
    } catch (error: any) {
      console.error('Error saving team connection:', error);
      setError('Failed to save team connection');
    } finally {
      setLoading(false);
    }
  };

  const handleHeadshotFileSelect = (searcherId: string, file: File) => {
    const searcher = searchers.find(s => s.id === searcherId);
    if (!searcher) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const imageSrc = e.target?.result as string;
      setCroppingImage({
        searcherId,
        searcherName: searcher.name,
        imageSrc
      });
    };
    reader.readAsDataURL(file);
  };

  const handleCropComplete = async (croppedImageBlob: Blob) => {
    if (!croppingImage) return;

    try {
      setUploadingHeadshot(croppingImage.searcherId);
      setError('');

      // Create a File object from the blob
      const croppedFile = new File([croppedImageBlob], 'headshot.jpg', {
        type: 'image/jpeg'
      });

      const response = await headshotsApi.uploadHeadshot(croppingImage.searcherId, croppedFile);
      console.log('📤 Upload response:', response);
      
      if (response.success) {
        // Update the local searcher data with the new headshot URL
        console.log('🔄 Updating searcher with headshot URL:', response.imageUrl);
        setSearchers(searchers.map(searcher => 
          searcher.id === croppingImage.searcherId 
            ? { ...searcher, headshotUrl: response.imageUrl }
            : searcher
        ));
        
        setSuccess('Headshot uploaded successfully!');
        
        // Reload investor profiles to get the updated data from the database
        try {
          const profiles = await searcherProfilesApi.getSearcherProfiles();
          console.log('🔄 Reloaded investor profiles after upload:', profiles);
          setSearchers(profiles);
        } catch (reloadError) {
          console.error('Error reloading investor profiles:', reloadError);
        }
      } else {
        setError(response.message || 'Failed to upload headshot');
      }
    } catch (error: any) {
      console.error('Error uploading headshot:', error);
      setError(error.message || 'Failed to upload headshot');
    } finally {
      setUploadingHeadshot(null);
      setCroppingImage(null);
    }
  };

  const handleHeadshotDelete = async (searcherId: string) => {
    try {
      setLoading(true);
      setError('');

      const response = await headshotsApi.deleteHeadshot(searcherId);
      
      if (response.success) {
        // Update the local searcher data to remove the headshot URL
        setSearchers(searchers.map(searcher => 
          searcher.id === searcherId 
            ? { ...searcher, headshotUrl: undefined }
            : searcher
        ));
        
        setSuccess('Headshot deleted successfully!');
      } else {
        setError(response.message || 'Failed to delete headshot');
      }
    } catch (error: any) {
      console.error('Error deleting headshot:', error);
      setError(error.message || 'Failed to delete headshot');
    } finally {
      setLoading(false);
    }
  };

  // Logo upload handlers
  const handleLogoFileSelect = async (file: File) => {
    try {
      setUploadingLogo(true);
      setError('');

      const response = await logosApi.uploadLogo(file);
      
      if (response.success) {
        // Update the local logo state
        setSearchFundLogo(response.imageUrl);
        
        setSuccess('Logo uploaded successfully!');
      } else {
        setError(response.message || 'Failed to upload logo');
      }
    } catch (error: any) {
      console.error('Error uploading logo:', error);
      setError(error.message || 'Failed to upload logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleLogoDelete = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await logosApi.deleteLogo();
      
      if (response.success) {
        setSearchFundLogo(null);
        setSuccess('Logo deleted successfully!');
      } else {
        setError(response.message || 'Failed to delete logo');
      }
    } catch (error: any) {
      console.error('Error deleting logo:', error);
      setError(error.message || 'Failed to delete logo');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchFundNameSave = async () => {
    try {
      setLoading(true);
      setError('');

      const userId = getUserId();
      const userRef = doc(db, 'users', userId);
      await setDoc(userRef, {
        searchFundName: searchFundName,
        updatedAt: new Date()
      }, { merge: true });

      setSuccess('Search fund name saved successfully!');
    } catch (error: any) {
      console.error('Error saving search fund name:', error);
      setError('Failed to save search fund name');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchFundWebsiteSave = async () => {
    try {
      setLoading(true);
      setError('');

      const userId = getUserId();
      const userRef = doc(db, 'users', userId);
      await setDoc(userRef, {
        searchFundWebsite: searchFundWebsite,
        updatedAt: new Date()
      }, { merge: true });

      setSuccess('Search fund website saved successfully!');
    } catch (error: any) {
      console.error('Error saving search fund website:', error);
      setError('Failed to save search fund website');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchFundAddressSave = async () => {
    try {
      setLoading(true);
      setError('');

      const userId = getUserId();
      const userRef = doc(db, 'users', userId);
      await setDoc(userRef, {
        searchFundAddress: searchFundAddress,
        updatedAt: new Date()
      }, { merge: true });

      setSuccess('Search fund address saved successfully!');
    } catch (error: any) {
      console.error('Error saving search fund address:', error);
      setError('Failed to save search fund address');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchFundEmailSave = async () => {
    try {
      setLoading(true);
      setError('');

      const userId = getUserId();
      const userRef = doc(db, 'users', userId);
      await setDoc(userRef, {
        searchFundEmail: searchFundEmail,
        updatedAt: new Date()
      }, { merge: true });

      setSuccess('Search fund email saved successfully!');
    } catch (error: any) {
      console.error('Error saving search fund email:', error);
      setError('Failed to save search fund email');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAllFirmInfo = async () => {
    try {
      setLoading(true);
      setError('');

      const userId = getUserId();
      const userRef = doc(db, 'users', userId);
      await setDoc(userRef, {
        searchFundName: searchFundName,
        searchFundWebsite: searchFundWebsite,
        searchFundAddress: searchFundAddress,
        searchFundEmail: searchFundEmail,
        updatedAt: new Date()
      }, { merge: true });

      setSuccess('All firm information saved successfully!');
    } catch (error: any) {
      console.error('Error saving firm information:', error);
      setError('Failed to save firm information');
    } finally {
      setLoading(false);
    }
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
    setEditingEducation(null);
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
    setEditingExperience(null);
  };

  const handleCancelAdd = () => {
    setIsAddingSearcher(false);
    setIsEditingSearcher(false);
    setEditingSearcher(null);
    resetSearcherForm();
  };

  // Load investor profiles function
  const loadSearcherProfiles = async (forceRefresh = false) => {
    try {
      setLoading(true);
      setError(''); // Clear any previous errors
      console.log('🔄 Loading investor profiles...', forceRefresh ? '(Force Refresh)' : '');
      console.log('🔑 Current auth state:', {
        hasToken: !!localStorage.getItem('token'),
        userId: localStorage.getItem('userId'),
        token: localStorage.getItem('token') === 'mock-token' ? 'mock-token' : 'real-token'
      });

      const profiles = await searcherProfilesApi.getSearcherProfiles();
      console.log('📋 Loaded investor profiles:', profiles);
      console.log(`📊 Total profiles loaded: ${profiles.length}`);

      if (profiles.length === 0) {
        console.warn('⚠️ No profiles returned from API - this might indicate an error');
        console.warn('⚠️ Check the console for API errors above');
      }

      profiles.forEach(profile => {
        console.log(`🔍 Profile ${profile.name}:`, {
          id: profile.id,
          name: profile.name,
          title: profile.title,
          bio: profile.bio?.substring(0, 50) + '...',
          headshotUrl: profile.headshotUrl,
          hasHeadshot: !!profile.headshotUrl,
          educationCount: profile.education?.length || 0,
          experienceCount: profile.experience?.length || 0
        });

        // Test if the image URL is accessible
        if (profile.headshotUrl) {
          const testImg = new Image();
          const absoluteUrl = getAbsoluteHeadshotUrl(profile.headshotUrl);
          testImg.onload = () => console.log(`✅ Test image loaded: ${absoluteUrl}`);
          testImg.onerror = () => console.log(`❌ Test image failed: ${absoluteUrl}`);
          testImg.src = absoluteUrl || '';
        }
      });
      setSearchers(profiles);
      console.log('✅ Searchers state updated with', profiles.length, 'profiles');

      if (forceRefresh) {
        setSuccess('Profiles refreshed successfully!');
      }
    } catch (error: any) {
      console.error('❌ Error loading investor profiles:', error);
      setError(error.response?.data?.message || 'Failed to load investor profiles. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  // Load search fund information and primary profile ID on component mount
  useEffect(() => {
    const loadSearchFundInfo = async () => {
      try {
        const userId = getUserId();
        const userRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
          const userData = userDoc.data();
          console.log('📋 Loaded user data:', userData);

          if (userData.searchFundName) {
            setSearchFundName(userData.searchFundName);
            console.log('✅ Loaded search fund name:', userData.searchFundName);
          }
          if (userData.searchFundWebsite) {
            setSearchFundWebsite(userData.searchFundWebsite);
            console.log('✅ Loaded search fund website:', userData.searchFundWebsite);
          }
          if (userData.searchFundEmail) {
            setSearchFundEmail(userData.searchFundEmail);
            console.log('✅ Loaded search fund email:', userData.searchFundEmail);
          }
          if (userData.searchFundAddress) {
            setSearchFundAddress(userData.searchFundAddress);
            console.log('✅ Loaded search fund address:', userData.searchFundAddress);
          }
          if (userData.primaryProfileId) {
            setPrimaryProfileId(userData.primaryProfileId);
            console.log('✅ Loaded primary profile ID:', userData.primaryProfileId);
          }
        }
      } catch (error) {
        console.error('Error loading search fund info:', error);
      }
    };

    loadSearchFundInfo();
  }, []);

  // Load investor profiles on component mount
  useEffect(() => {
    loadSearcherProfiles();
  }, []);

  // Auto-select primary profile if only one exists and none is selected
  useEffect(() => {
    if (searchers.length === 1 && !primaryProfileId) {
      const userId = getUserId();
      const userRef = doc(db, 'users', userId);
      setDoc(userRef, { primaryProfileId: searchers[0].id }, { merge: true }).then(() => {
        setPrimaryProfileId(searchers[0].id);
        console.log('✅ Auto-selected single profile as primary:', searchers[0].id);
      }).catch((error) => {
        console.error('Error auto-selecting primary profile:', error);
      });
    }
  }, [searchers, primaryProfileId]);

  // Function to set primary profile
  const handleSetPrimaryProfile = async (profileId: string) => {
    try {
      const userId = getUserId();
      const userRef = doc(db, 'users', userId);
      await setDoc(userRef, { primaryProfileId: profileId }, { merge: true });
      setPrimaryProfileId(profileId);
      
      // Find the selected profile
      const selectedProfile = searchers.find(s => s.id === profileId);
      const profileName = selectedProfile?.name;
      
      if (profileName) {
        setSuccess(`"${profileName}" is now your display profile`);
        console.log('✅ Set primary profile:', profileId);
        
        // Update the user's display name immediately with the profile name we already have
        if (updateUser) {
          updateUser({ name: profileName });
          console.log('✅ Updated display name to:', profileName);
        }
        
        // Also refresh to ensure everything is in sync (async, doesn't block)
        if (refreshUser) {
          refreshUser().catch(err => {
            console.warn('Background refresh failed, but name already updated:', err);
          });
        }
      }
    } catch (error) {
      console.error('Error setting primary profile:', error);
      setError('Failed to set primary profile');
    }
  };

  // Refresh investor profiles when page regains focus
  useEffect(() => {
    const handleFocus = () => {
      loadSearcherProfiles();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  return (
    <Box sx={{ mt: 2 }}>
      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Typography 
          variant="h3" 
          sx={{ 
            fontWeight: 400, 
            color: '#1f2937',
            fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            letterSpacing: '-0.02em',
            mb: 1
          }}
        >
          My Profile
        </Typography>
        <Typography 
          variant="body1" 
          sx={{ 
            color: '#6b7280',
            fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            fontWeight: 400,
            letterSpacing: '-0.01em'
          }}
        >
          Manage your investor profile and background information for personalized pitch generation
        </Typography>
      </Box>

      {/* Success/Error Messages */}
      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 3, borderRadius: 2 }} 
          onClose={() => setError('')}
        >
          {error}
        </Alert>
      )}

      {success && (
        <Alert 
          severity="success" 
          sx={{ mb: 3, borderRadius: 2 }} 
          onClose={() => setSuccess('')}
        >
          {success}
        </Alert>
      )}

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Firm Information */}
      <Card sx={{ mb: 4, borderRadius: 3, boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)', border: '1px solid #e5e7eb' }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ mb: 4 }}>
            <Typography 
              variant="h6" 
              sx={{ 
                fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                fontWeight: 600,
                color: '#1f2937',
                letterSpacing: '-0.01em',
                mb: 1
              }}
            >
              Firm Information
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                color: '#6b7280',
                fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                fontWeight: 400
              }}
            >
              Set your firm name and upload logo for context
            </Typography>
          </Box>

          {/* Two-column layout for better space utilization */}
          <Grid container spacing={4}>
            {/* Left Column - Basic Information */}
            <Grid item xs={12} md={6}>
              <Stack spacing={3}>
                {/* Firm Name */}
                <Box>
                  <Typography 
                    variant="subtitle1" 
                    sx={{ 
                      fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                      fontWeight: 600,
                      color: '#1f2937',
                      mb: 1
                    }}
                  >
                    Firm Name
                  </Typography>
                  <TextField
                    fullWidth
                    variant="outlined"
                    placeholder="Enter your firm name"
                    value={searchFundName}
                    onChange={(e) => setSearchFundName(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <BusinessIcon sx={{ color: '#6b7280' }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#1f2937',
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#1f2937',
                        },
                      }
                    }}
                  />
                </Box>

                {/* Firm Website */}
                <Box>
                  <Typography 
                    variant="subtitle1" 
                    sx={{ 
                      fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                      fontWeight: 600,
                      color: '#1f2937',
                      mb: 1
                    }}
                  >
                    Firm Website
                  </Typography>
                  <TextField
                    fullWidth
                    variant="outlined"
                    placeholder="Enter your firm website (e.g., https://example.com)"
                    value={searchFundWebsite}
                    onChange={(e) => setSearchFundWebsite(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LanguageIcon sx={{ color: '#6b7280' }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#1f2937',
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#1f2937',
                        },
                      }
                    }}
                  />
                </Box>
              </Stack>
            </Grid>

            {/* Right Column - Contact Information */}
            <Grid item xs={12} md={6}>
              <Stack spacing={3}>
                {/* Office Address */}
                <Box>
                  <Typography 
                    variant="subtitle1" 
                    sx={{ 
                      fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                      fontWeight: 600,
                      color: '#1f2937',
                      mb: 1
                    }}
                  >
                    Office Address
                  </Typography>
                  <TextField
                    fullWidth
                    variant="outlined"
                    placeholder="Enter your office address"
                    value={searchFundAddress}
                    onChange={(e) => setSearchFundAddress(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LocationIcon sx={{ color: '#6b7280' }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#1f2937',
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#1f2937',
                        },
                      }
                    }}
                  />
                </Box>

                {/* Contact Email */}
                <Box>
                  <Typography 
                    variant="subtitle1" 
                    sx={{ 
                      fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                      fontWeight: 600,
                      color: '#1f2937',
                      mb: 1
                    }}
                  >
                    Contact Email
                  </Typography>
                  <TextField
                    fullWidth
                    variant="outlined"
                    placeholder="Enter your contact email"
                    value={searchFundEmail}
                    onChange={(e) => setSearchFundEmail(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <EmailIcon sx={{ color: '#6b7280' }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#1f2937',
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#1f2937',
                        },
                      }
                    }}
                  />
                </Box>
              </Stack>
            </Grid>
          </Grid>

          {/* Single Save Button for All Firm Information */}
          <Box sx={{ mt: 4, pt: 4, borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'center' }}>
            <Button
              variant="contained"
              onClick={handleSaveAllFirmInfo}
              disabled={loading}
              sx={{
                background: 'linear-gradient(180deg, #2c2c2c 0%, #1a1a1a 100%)',
                color: 'white',
                fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                fontWeight: 600,
                borderRadius: 2,
                px: 6,
                py: 1.5,
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
                '&:hover': {
                  background: 'linear-gradient(180deg, #1a1a1a 0%, #0a0a0a 100%)',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
                  transform: 'translateY(-1px)'
                },
                '&:disabled': {
                  backgroundColor: '#9ca3af',
                  boxShadow: 'none',
                  transform: 'none'
                },
                transition: 'all 0.2s ease'
              }}
            >
              {loading ? 'Saving...' : 'Save All Firm Information'}
            </Button>
          </Box>

          {/* Logo Section - Full Width */}
          <Box sx={{ mt: 4, pt: 4, borderTop: '1px solid #e5e7eb' }}>
            <Typography 
              variant="subtitle1" 
              sx={{ 
                fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                fontWeight: 600,
                color: '#1f2937',
                mb: 3
              }}
            >
              Firm Logo
            </Typography>
            <Grid container spacing={4} alignItems="center">
              <Grid item xs={12} md={4}>
                <Box sx={{ 
                  width: 120, 
                  height: 120, 
                  border: '2px dashed #d1d5db', 
                  borderRadius: 2, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  bgcolor: '#f9fafb'
                }}>
                  {searchFundLogo ? (
                    <img 
                      src={searchFundLogo} 
                      alt="Firm Logo" 
                      style={{ 
                        maxWidth: '100%', 
                        maxHeight: '100%', 
                        objectFit: 'contain',
                        borderRadius: 4
                      }} 
                    />
                  ) : (
                    <Box sx={{ textAlign: 'center' }}>
                      <PhotoCameraIcon sx={{ fontSize: 40, color: '#9ca3af', mb: 1 }} />
                      <Typography variant="caption" sx={{ color: '#6b7280' }}>
                        No Logo
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Grid>
              <Grid item xs={12} md={8}>
                <Stack spacing={2}>
                  <Button
                    variant="outlined"
                    startIcon={<UploadIcon />}
                    onClick={() => document.getElementById('logo-upload')?.click()}
                    sx={{
                      borderColor: '#d1d5db',
                      color: '#374151',
                      fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                      fontWeight: 500,
                      borderRadius: 2,
                      px: 3,
                      py: 1,
                      '&:hover': {
                        borderColor: '#9ca3af',
                        backgroundColor: '#f9fafb'
                      }
                    }}
                  >
                    Upload Logo
                  </Button>
                  {searchFundLogo && (
                    <Button
                      variant="outlined"
                      startIcon={<DeleteIcon />}
                      onClick={handleLogoDelete}
                      sx={{
                        borderColor: '#fca5a5',
                        color: '#dc2626',
                        fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                        fontWeight: 500,
                        borderRadius: 2,
                        px: 3,
                        py: 1,
                        '&:hover': {
                          borderColor: '#f87171',
                          backgroundColor: '#fef2f2'
                        }
                      }}
                    >
                      Delete Logo
                    </Button>
                  )}
                  <input
                    id="logo-upload"
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleLogoFileSelect(file);
                      }
                    }}
                  />
                </Stack>
              </Grid>
            </Grid>
          </Box>
        </CardContent>
      </Card>

      {/* Investor Profiles */}
      <Paper sx={{ p: 4, position: 'relative' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 600, color: '#000000', mb: 1 }}>
              Investor Profiles
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage investor profiles for personalized pitch generation
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {searchers.length > 0 && (
              <Typography variant="body2" color="text.secondary">
                {searchers.length} profile{searchers.length !== 1 ? 's' : ''}
              </Typography>
            )}
            <Tooltip title="Refresh profiles">
              <IconButton
                onClick={() => loadSearcherProfiles(true)}
                disabled={loading}
                sx={{
                  '&:hover': { bgcolor: '#f5f5f5' }
                }}
              >
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Box>
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
                No investor profiles yet
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3, maxWidth: 400, mx: 'auto' }}>
                Create your first investor profile to start generating personalized pitches
              </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setIsAddingSearcher(true)}
                  size="large"
                  sx={{
                    background: 'linear-gradient(180deg, #2c2c2c 0%, #1a1a1a 100%)',
                    color: 'white',
                    fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    fontWeight: 600,
                    borderRadius: 2,
                    px: 6,
                    py: 1.5,
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
                    '&:hover': {
                      background: 'linear-gradient(180deg, #1a1a1a 0%, #0a0a0a 100%)',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
                      transform: 'translateY(-1px)'
                    },
                    transition: 'all 0.2s ease'
                  }}
                >
                  Add First Investor
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
                      <Box sx={{ position: 'relative', mr: 2 }}>
                        {/* BULLETPROOF Image Display - Multiple fallbacks */}
                        {searcher.headshotUrl ? (
                          <Box sx={{ position: 'relative' }}>
                            {/* Primary: Avatar with image */}
                            <Avatar
                              src={getAbsoluteHeadshotUrl(searcher.headshotUrl)}
                              sx={{
                                bgcolor: '#000000',
                                width: 56,
                                height: 56,
                                fontSize: '1.25rem',
                                fontWeight: 600
                              }}
                              onLoad={() => {
                                console.log('✅ Avatar image loaded successfully:', getAbsoluteHeadshotUrl(searcher.headshotUrl));
                              }}
                              onError={(e) => {
                                console.log('❌ Avatar image failed to load:', getAbsoluteHeadshotUrl(searcher.headshotUrl));
                                console.log('❌ Error details:', e);
                              }}
                            >
                              {searcher.name.charAt(0).toUpperCase()}
                            </Avatar>
                            
                            {/* Fallback: Direct img element */}
                            <img
                              src={getAbsoluteHeadshotUrl(searcher.headshotUrl)}
                              alt={`${searcher.name} headshot`}
                              style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '56px',
                                height: '56px',
                                borderRadius: '50%',
                                objectFit: 'cover',
                                display: 'none' // Hidden by default, shown if Avatar fails
                              }}
                              onLoad={() => {
                                console.log('✅ Fallback img loaded successfully');
                              }}
                              onError={() => {
                                console.log('❌ Fallback img also failed');
                              }}
                            />
                          </Box>
                        ) : (
                          <Avatar
                            sx={{
                              bgcolor: '#000000',
                              width: 56,
                              height: 56,
                              fontSize: '1.25rem',
                              fontWeight: 600
                            }}
                          >
                            {searcher.name.charAt(0).toUpperCase()}
                          </Avatar>
                        )}
                        <input
                          accept="image/*"
                          style={{ display: 'none' }}
                          id={`headshot-upload-${searcher.id}`}
                          type="file"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleHeadshotFileSelect(searcher.id, file);
                            }
                          }}
                        />
                        <label htmlFor={`headshot-upload-${searcher.id}`}>
                          <IconButton
                            component="span"
                            size="small"
                            sx={{
                              position: 'absolute',
                              bottom: -5,
                              right: -5,
                              bgcolor: '#000000',
                              color: 'white',
                              '&:hover': {
                                bgcolor: '#333333'
                              },
                              width: 24,
                              height: 24
                            }}
                            disabled={uploadingHeadshot === searcher.id}
                          >
                            {uploadingHeadshot === searcher.id ? (
                              <CircularProgress size={16} color="inherit" />
                            ) : (
                              <PhotoCameraIcon fontSize="small" />
                            )}
                          </IconButton>
                        </label>
                        {searcher.headshotUrl && (
                          <IconButton
                            size="small"
                            onClick={() => handleHeadshotDelete(searcher.id)}
                            sx={{
                              position: 'absolute',
                              top: -5,
                              right: -5,
                              bgcolor: 'error.main',
                              color: 'white',
                              '&:hover': {
                                bgcolor: 'error.dark'
                              },
                              width: 20,
                              height: 20
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        )}
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            {searcher.name}
                          </Typography>
                          {primaryProfileId === searcher.id && (
                            <Chip 
                              label="You" 
                              size="small" 
                              sx={{ 
                                bgcolor: '#10b981', 
                                color: 'white',
                                fontWeight: 600,
                                fontSize: '0.7rem',
                                height: 20
                              }} 
                            />
                          )}
                        </Box>
                        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                          {searcher.title}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        {primaryProfileId !== searcher.id && searchers.length > 1 && (
                          <Tooltip title="Set as your display profile">
                            <IconButton 
                              size="small" 
                              onClick={() => handleSetPrimaryProfile(searcher.id)}
                              sx={{ 
                                '&:hover': { bgcolor: '#f0fdf4' },
                                color: '#10b981'
                              }}
                            >
                              <PersonIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
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
        

        {/* Team Connection Section - Only show if multiple searchers */}
        {searchers.length > 1 && (
          <Card sx={{ mt: 4 }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: '#000000' }}>
                Team Connection
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Describe how the searchers met and their commonalities. This information will be used when generating personalized pitches for multiple searchers.
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={4}
                value={teamConnection}
                onChange={(e) => setTeamConnection(e.target.value)}
                placeholder="e.g., Met at Stanford Business School, both worked at McKinsey, share passion for healthcare technology..."
                variant="outlined"
                sx={{
                  mb: 3,
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      borderColor: '#D1D5DB',
                    },
                    '&:hover fieldset': {
                      borderColor: '#000000',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#000000',
                    },
                  },
                }}
              />
              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="contained"
                  onClick={handleSaveTeamConnection}
                  disabled={loading}
                  sx={{
                    bgcolor: '#000000',
                    color: 'white',
                    px: 3,
                    '&:hover': { bgcolor: '#333333' },
                    '&:disabled': { bgcolor: '#9CA3AF' }
                  }}
                >
                  {loading ? 'Saving...' : 'Save Team Connection'}
                </Button>
          </Box>
            </CardContent>
          </Card>
        )}

        {/* Floating Action Button */}
        <Tooltip title="Add Investor Profile" placement="left">
          <Fab
            color="primary"
            aria-label="add investor"
            onClick={() => setIsAddingSearcher(true)}
            sx={{
              position: 'fixed',
              bottom: 24,
              right: 24,
              bgcolor: '#000000',
              color: 'white',
              zIndex: 1000,
              '&:hover': { 
                bgcolor: '#333333',
                transform: 'scale(1.05)'
              },
              transition: 'all 0.2s ease-in-out'
            }}
          >
            <AddIcon />
          </Fab>
        </Tooltip>
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
          {isEditingSearcher ? 'Edit Investor Profile' : 'Add New Investor Profile'}
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
                        <IconButton 
                          size="small" 
                          onClick={() => handleEditEducation(edu)}
                          sx={{ mr: 1 }}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton 
                          size="small"
                          onClick={() => handleDeleteEducation(edu.id)}
                        >
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
                        <IconButton 
                          size="small" 
                          onClick={() => handleEditExperience(exp)}
                          sx={{ mr: 1 }}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton 
                          size="small"
                          onClick={() => handleDeleteExperience(exp.id)}
                        >
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
            {loading ? 'Saving...' : (isEditingSearcher ? 'Update Investor' : 'Add Investor')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Education Dialog */}
      <Dialog open={isAddingEducation} onClose={() => setIsAddingEducation(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingEducation ? 'Edit Education' : 'Add Education'}</DialogTitle>
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
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Start Date"
                type="date"
                value={educationForm.startDate || ''}
                onChange={(e) => setEducationForm({ ...educationForm, startDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
                sx={{
                  '& .MuiInputBase-input': {
                    fontSize: '0.875rem'
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="End Date"
                type="date"
                value={educationForm.endDate || ''}
                onChange={(e) => setEducationForm({ ...educationForm, endDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
                disabled={educationForm.current}
                sx={{
                  '& .MuiInputBase-input': {
                    fontSize: '0.875rem'
                  }
                }}
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
            {editingEducation ? 'Update Education' : 'Add Education'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Experience Dialog */}
      <Dialog open={isAddingExperience} onClose={() => setIsAddingExperience(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingExperience ? 'Edit Experience' : 'Add Experience'}</DialogTitle>
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
                type="date"
                value={experienceForm.startDate || ''}
                onChange={(e) => setExperienceForm({ ...experienceForm, startDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
                sx={{
                  '& .MuiInputBase-input': {
                    fontSize: '0.875rem'
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="End Date"
                type="date"
                value={experienceForm.endDate || ''}
                onChange={(e) => setExperienceForm({ ...experienceForm, endDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
                disabled={experienceForm.current}
                sx={{
                  '& .MuiInputBase-input': {
                    fontSize: '0.875rem'
                  }
                }}
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
            {editingExperience ? 'Update Experience' : 'Add Experience'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Headshot Cropper Dialog */}
      {croppingImage && (
        <HeadshotCropper
          open={!!croppingImage}
          onClose={() => setCroppingImage(null)}
          imageSrc={croppingImage.imageSrc}
          onCropFinish={handleCropComplete}
          searcherName={croppingImage.searcherName}
        />
      )}

    </Box>
  );
}