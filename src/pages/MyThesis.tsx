import React, { useState, useEffect } from 'react';
import axios from '../lib/axios';
import integrationService from '../services/integrationService';
import { db } from '../lib/firebase';
import { collection, doc, getDocs, addDoc, updateDoc, deleteDoc, query, orderBy, Timestamp, getDoc } from 'firebase/firestore';
import { onePagerApi } from '../services/onePagerApi';
import type { OnePagerRequest } from '../services/onePagerApi';
import { searcherProfilesApi } from '../services/searcherProfilesApi';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
  Chip,
  Divider,
  LinearProgress,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Slider,
  InputAdornment
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Download as DownloadIcon,
  Share as ShareIcon,
  AutoAwesome as AutoAwesomeIcon,
  TrendingUp as TrendingUpIcon,
  Assessment as AssessmentIcon,
  Business as BusinessIcon,
  AttachMoney as AttachMoneyIcon,
  Timeline as TimelineIcon,
  LocationOn as LocationIcon,
  People as PeopleIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Close as CloseIcon,
  Check as CheckIcon,
  CloudUpload as CloudUploadIcon,
  Folder as FolderIcon,
  AttachFile as AttachFileIcon
} from '@mui/icons-material';

interface InvestmentCriteria {
  id: string;
  category: string;
  field: string;
  value: string | number;
  operator: string;
  weight: number;
  valuationType?: 'enterprise' | 'equity';
}

interface InvestmentThesis {
  id: string;
  name: string;
  criteria: InvestmentCriteria[];
  createdAt: Date;
  updatedAt: Date;
}

interface OnePagerData {
  companyName: string;
  industry: string;
  pros: string[];
  cons: string[];
  scorecard: {
    financial: number;
    market: number;
    team: number;
    technology: number;
    overall: number;
  };
  sources: Array<{
    type: string;
    title: string;
    url: string;
    relevance: number;
  }>;
  keyMetrics: {
    revenue: string;
    ebitda: string;
    employees: string;
    founded: string;
    location: string;
  };
  investmentThesis: string;
  risks: string[];
  opportunities: string[];
}

const MyThesis: React.FC = () => {
  // Force white text for Active Thesis dropdown
  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .active-thesis-select .MuiSelect-select,
      .active-thesis-select .MuiInputBase-input,
      .active-thesis-select input,
      .active-thesis-select .MuiSelect-root {
        color: white !important;
      }
    `;
    document.head.appendChild(style);
    return () => {
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
    };
  }, []);

  const [theses, setTheses] = useState<InvestmentThesis[]>([]);
  const [currentThesisId, setCurrentThesisId] = useState<string>('');
  const [criteria, setCriteria] = useState<InvestmentCriteria[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [newCriteria, setNewCriteria] = useState<Partial<InvestmentCriteria>>({
    category: 'Financial',
    field: '',
    value: '',
    operator: '>=',
    weight: 10
  });

  const [showAddCriteria, setShowAddCriteria] = useState(false);
  const [editingCriteria, setEditingCriteria] = useState<string | null>(null);
  const [editingWeight, setEditingWeight] = useState<string | null>(null);
  const [showTraditionalView, setShowTraditionalView] = useState(false);
  const [showThesisManager, setShowThesisManager] = useState(false);
  const [showNewThesisDialog, setShowNewThesisDialog] = useState(false);
  const [newThesisName, setNewThesisName] = useState('');
  const [templateThesisId, setTemplateThesisId] = useState<string>('');
  const [editingThesisName, setEditingThesisName] = useState<string | null>(null);
  const [editingThesisNameValue, setEditingThesisNameValue] = useState('');
  const [generatedOnePager, setGeneratedOnePager] = useState<OnePagerData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Personal Pitch One Pager Generator state
  const [selectedThesisForPitch, setSelectedThesisForPitch] = useState('');
  const [selectedSearchers, setSelectedSearchers] = useState<string[]>([]);
  const [isGeneratingPitch, setIsGeneratingPitch] = useState(false);
  const [searcherProfiles, setSearcherProfiles] = useState<any[]>([]);

  // Debug: Log searcherProfiles state changes
  useEffect(() => {
    console.log('🔄 SearcherProfiles state changed:', searcherProfiles);
    console.log('📊 SearcherProfiles length:', searcherProfiles.length);
  }, [searcherProfiles]);
  const [selectedTemplate, setSelectedTemplate] = useState('basic');
  const [showTemplatePreview, setShowTemplatePreview] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<string>('');
  const [showDataSourceDialog, setShowDataSourceDialog] = useState(false);
  const [selectedGoogleDriveFolder, setSelectedGoogleDriveFolder] = useState<string>('');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [googleDriveFolders, setGoogleDriveFolders] = useState<string[]>([]);
  const [loadingFolders, setLoadingFolders] = useState(false);

  // Industry Overview One Pager Generator state
  const [selectedThesisForIndustry, setSelectedThesisForIndustry] = useState('');
  const [isGeneratingIndustry, setIsGeneratingIndustry] = useState(false);
  const [selectedIndustryTemplate, setSelectedIndustryTemplate] = useState('basic');
  const [showIndustryTemplatePreview, setShowIndustryTemplatePreview] = useState(false);
  const [availableIndustries, setAvailableIndustries] = useState<string[]>([]);
  const [selectedIndustry, setSelectedIndustry] = useState('');

  const categories = ['Financial', 'Market', 'Geographic', 'Team', 'Technology', 'Operational', 'Valuation', 'Subindustry', 'Growth Rate'];
  const operators = ['>=', '<=', '=', '!=', 'contains', 'not contains'];
  const valuationTypes = ['Enterprise Value', 'Equity Value'];

  // Green shade mapping for bars (index-based) - single gradient reference for all elements
  const getGreenShade = (index: number) => {
    const greenShades = [
      { color: '#10b981', gradient: 'linear-gradient(135deg, #10b981 0%, #10b981dd 100%)' },
      { color: '#059669', gradient: 'linear-gradient(135deg, #059669 0%, #059669dd 100%)' },
      { color: '#047857', gradient: 'linear-gradient(135deg, #047857 0%, #047857dd 100%)' },
      { color: '#065f46', gradient: 'linear-gradient(135deg, #065f46 0%, #065f46dd 100%)' },
      { color: '#064e3b', gradient: 'linear-gradient(135deg, #064e3b 0%, #064e3bdd 100%)' }
    ];
    return greenShades[index % greenShades.length];
  };

  // Load theses on component mount
  useEffect(() => {
    const loadTheses = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('🔄 Loading investment theses...');

        const userId = localStorage.getItem('userId') || 'dev-user-123';
        console.log('📋 Using userId:', userId);
        
        const thesesRef = collection(db, 'users', userId, 'investmentTheses');
        const q = query(thesesRef, orderBy('createdAt', 'asc'));
        const snapshot = await getDocs(q);
        
        console.log('📊 Found', snapshot.docs.length, 'theses in database');
        
        const loadedTheses = snapshot.docs.map(d => {
          const data = d.data();
          console.log('📋 Thesis data:', { id: d.id, name: data.name, criteriaCount: data.criteria?.length || 0 });
          return {
            id: d.id,
            name: data.name,
            criteria: data.criteria || [],
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date()
          } as InvestmentThesis;
        });

        // If no theses exist, create a default one
        if (loadedTheses.length === 0) {
          console.log('📝 No theses found, creating default thesis...');
          const now = Timestamp.now();
          const docRef = await addDoc(thesesRef, {
            name: 'Tech Growth Thesis',
            criteria: [],
            createdAt: now,
            updatedAt: now
          });
          const defaultThesis = {
            id: docRef.id,
            name: 'Tech Growth Thesis',
            criteria: [],
            createdAt: now.toDate(),
            updatedAt: now.toDate()
          };
          console.log('✅ Created default thesis:', defaultThesis);
          setTheses([defaultThesis]);
          setCurrentThesisId(defaultThesis.id);
          setCriteria([]);
        } else {
          console.log('✅ Loaded', loadedTheses.length, 'theses:', loadedTheses.map(t => t.name));
          setTheses(loadedTheses);
          setCurrentThesisId(loadedTheses[0].id);
          setCriteria(loadedTheses[0].criteria);
        }
      } catch (error: any) {
        console.error('❌ Error loading theses:', error);
        setError('Failed to load investment theses');
      } finally {
        setLoading(false);
      }
    };

    loadTheses();
  }, []);

  // Load searcher profiles
  useEffect(() => {
    const loadSearcherProfiles = async () => {
      try {
        console.log('🔍 Loading searcher profiles via API...');
        const profiles = await searcherProfilesApi.getSearcherProfiles();
        console.log('📋 Loaded searcher profiles:', profiles);
        console.log('📊 Number of searcher profiles:', profiles.length);
        setSearcherProfiles(profiles);
      } catch (error) {
        console.error('❌ Error loading searcher profiles:', error);
      }
    };

    loadSearcherProfiles();
  }, []);

  // Refresh searcher profiles when page regains focus (user returns from profile page)
  useEffect(() => {
    const handleFocus = () => {
      const loadSearcherProfiles = async () => {
        try {
          console.log('🔄 Refreshing searcher profiles on focus via API...');
          const profiles = await searcherProfilesApi.getSearcherProfiles();
          console.log('📋 Refreshed searcher profiles:', profiles);
          console.log('📊 Number of refreshed searcher profiles:', profiles.length);
          setSearcherProfiles(profiles);
        } catch (error) {
          console.error('❌ Error refreshing searcher profiles:', error);
        }
      };
      loadSearcherProfiles();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const getTotalWeight = () => {
    return criteria.reduce((sum, criterion) => sum + criterion.weight, 0);
  };

  const getRemainingWeight = () => {
    return 100 - getTotalWeight();
  };

  const handleAddCriteria = async () => {
    if (newCriteria.field && newCriteria.value !== '') {
      const newWeight = newCriteria.weight || 10;
      const currentTotal = getTotalWeight();

      let updatedCriteria: InvestmentCriteria[];

      if (editingCriteria) {
        // Update existing criteria
        const existingCriterion = criteria.find(c => c.id === editingCriteria);
        const weightDifference = newWeight - (existingCriterion?.weight || 0);
        const newTotal = currentTotal + weightDifference;

        if (newTotal > 100) {
          alert(`Total weight cannot exceed 100%. Current total would be ${newTotal}%. Please reduce the weight.`);
          return;
        }

        updatedCriteria = criteria.map(c =>
          c.id === editingCriteria
            ? {
                ...c,
                category: newCriteria.category || 'Financial',
                field: newCriteria.field || '',
                value: newCriteria.value || '',
                operator: newCriteria.operator || '>=',
                weight: newWeight,
                valuationType: newCriteria.valuationType
              }
            : c
        );
        setEditingCriteria(null);
      } else {
        // Add new criteria
        if (currentTotal + newWeight > 100) {
          alert(`Total weight cannot exceed 100%. Current total is ${currentTotal}%. Please reduce the weight to ${100 - currentTotal}% or less.`);
          return;
        }

        const newCriterion: InvestmentCriteria = {
          id: Date.now().toString(),
          category: newCriteria.category || 'Financial',
          field: newCriteria.field || '',
          value: newCriteria.value || '',
          operator: newCriteria.operator || '>=',
          weight: newWeight,
          valuationType: newCriteria.valuationType
        };
        updatedCriteria = [...criteria, newCriterion];
      }

      // Update state
      setCriteria(updatedCriteria);

      // Reset form
      setNewCriteria({
        category: 'Financial',
        field: '',
        value: '',
        operator: '>=',
        weight: 10,
        valuationType: undefined
      });
      setShowAddCriteria(false);

      // Save immediately to Firebase
      await handleUpdateThesisWithCriteria(updatedCriteria);
    }
  };

  const handleEditCriteria = (criterion: InvestmentCriteria) => {
    setNewCriteria({
      category: criterion.category,
      field: criterion.field,
      value: criterion.value,
      operator: criterion.operator,
      weight: criterion.weight,
      valuationType: criterion.valuationType
    });
    setEditingCriteria(criterion.id);
    setShowAddCriteria(true);
  };

  const handleOpenAddCriteria = () => {
    // Reset form to defaults when opening for new criteria
    setNewCriteria({
      category: 'Financial',
      field: '',
      value: '',
      operator: '>=',
      weight: 10,
      valuationType: undefined
    });
    setEditingCriteria(null);
    setShowAddCriteria(true);
  };

  const handleDeleteCriteria = async (id: string) => {
    const updatedCriteria = criteria.filter(c => c.id !== id);
    setCriteria(updatedCriteria);

    // Save immediately with updated criteria
    await handleUpdateThesisWithCriteria(updatedCriteria);
  };

  const handleWeightEdit = (criterionId: string, currentWeight: number) => {
    setEditingWeight(criterionId);
  };

  const handleWeightChange = async (criterionId: string, newWeight: number) => {
    const currentTotal = getTotalWeight();
    const existingCriterion = criteria.find(c => c.id === criterionId);
    const weightDifference = newWeight - (existingCriterion?.weight || 0);
    const newTotal = currentTotal + weightDifference;

    if (newTotal > 100) {
      alert(`Total weight cannot exceed 100%. Current total would be ${newTotal}%. Please reduce the weight.`);
      return;
    }

    if (newWeight < 0) {
      alert('Weight cannot be negative.');
      return;
    }

    const updatedCriteria = criteria.map(c =>
      c.id === criterionId
        ? { ...c, weight: newWeight }
        : c
    );
    setCriteria(updatedCriteria);
    setEditingWeight(null);

    // Save immediately with updated criteria
    await handleUpdateThesisWithCriteria(updatedCriteria);
  };

  const handleWeightKeyPress = (e: React.KeyboardEvent, criterionId: string) => {
    if (e.key === 'Enter') {
      const target = e.target as HTMLInputElement;
      const newWeight = parseInt(target.value);
      if (!isNaN(newWeight)) {
        handleWeightChange(criterionId, newWeight);
      }
    } else if (e.key === 'Escape') {
      setEditingWeight(null);
    }
  };

  const getRemainingWeightForEdit = (criterionId: string) => {
    const currentTotal = getTotalWeight();
    const existingCriterion = criteria.find(c => c.id === criterionId);
    return 100 - currentTotal + (existingCriterion?.weight || 0);
  };

  const getCurrentThesis = () => {
    return theses.find(t => t.id === currentThesisId);
  };

  const handleThesisChange = (thesisId: string) => {
    setCurrentThesisId(thesisId);
    const thesis = theses.find(t => t.id === thesisId);
    if (thesis) {
      setCriteria([...thesis.criteria]);
    }
  };

  const handleCreateNewThesis = async () => {
    if (newThesisName.trim()) {
      try {
        const templateCriteria = templateThesisId ?
          [...theses.find(t => t.id === templateThesisId)?.criteria || []] :
          [];

        const userId = localStorage.getItem('userId') || 'dev-user-123';
        const now = Timestamp.now();
        const thesesRef = collection(db, 'users', userId, 'investmentTheses');
        const docRef = await addDoc(thesesRef, {
          name: newThesisName.trim(),
          criteria: templateCriteria,
          createdAt: now,
          updatedAt: now
        });
        const newThesis = {
          id: docRef.id,
          name: newThesisName.trim(),
          criteria: templateCriteria,
          createdAt: now.toDate(),
          updatedAt: now.toDate()
        };

        setTheses([...theses, newThesis]);
        setCurrentThesisId(newThesis.id);
        setCriteria([...newThesis.criteria]);
        setNewThesisName('');
        setTemplateThesisId('');
        setShowNewThesisDialog(false);
      } catch (error) {
        console.error('Error creating thesis:', error);
        alert('Failed to create thesis. Please try again.');
      }
    }
  };

  const handleDeleteThesis = async (thesisId: string) => {
    const confirmMessage = theses.length === 1 
      ? 'This is your last thesis. Are you sure you want to delete it? You can always create a new one later.'
      : 'Are you sure you want to delete this thesis? This action cannot be undone.';
    
    if (window.confirm(confirmMessage)) {
      try {
        const userId = localStorage.getItem('userId') || 'dev-user-123';
        const thesisRef = doc(db, 'users', userId, 'investmentTheses', thesisId);
        await deleteDoc(thesisRef);

        const updatedTheses = theses.filter(t => t.id !== thesisId);
        setTheses(updatedTheses);
        
        if (updatedTheses.length > 0) {
          setCurrentThesisId(updatedTheses[0].id);
          setCriteria([...updatedTheses[0].criteria]);
        } else {
          // If no theses left, reset to empty state
          setCurrentThesisId('');
          setCriteria([]);
        }
      } catch (error) {
        console.error('Error deleting thesis:', error);
        alert('Failed to delete thesis. Please try again.');
      }
    }
  };

  const handleStartEditThesisName = (thesisId: string, currentName: string) => {
    console.log('Starting edit for thesis:', thesisId, 'with name:', currentName);
    setEditingThesisName(thesisId);
    setEditingThesisNameValue(currentName);
  };

  const handleSaveThesisName = async (thesisId: string) => {
    if (editingThesisNameValue.trim()) {
      try {
        const userId = localStorage.getItem('userId') || 'dev-user-123';
        const now = Timestamp.now();
        const thesisRef = doc(db, 'users', userId, 'investmentTheses', thesisId);
        await updateDoc(thesisRef, {
          name: editingThesisNameValue.trim(),
          updatedAt: now
        });

        setTheses(theses.map(t =>
          t.id === thesisId
            ? { ...t, name: editingThesisNameValue.trim(), updatedAt: now.toDate() }
            : t
        ));
        setEditingThesisName(null);
        setEditingThesisNameValue('');
      } catch (error) {
        console.error('Error updating thesis name:', error);
        alert('Failed to update thesis name. Please try again.');
      }
    }
  };

  const handleCancelEditThesisName = () => {
    setEditingThesisName(null);
    setEditingThesisNameValue('');
  };

  const handleThesisNameKeyPress = (e: React.KeyboardEvent, thesisId: string) => {
    if (e.key === 'Enter') {
      handleSaveThesisName(thesisId);
    } else if (e.key === 'Escape') {
      handleCancelEditThesisName();
    }
  };

  const handleUpdateThesis = async () => {
    try {
      console.log('Auto-saving thesis with criteria:', criteria);
      // Update the thesis in Firebase
      const userId = localStorage.getItem('userId') || 'dev-user-123';
      const now = Timestamp.now();
      const thesisRef = doc(db, 'users', userId, 'investmentTheses', currentThesisId);
      await updateDoc(thesisRef, {
        criteria: [...criteria],
        updatedAt: now
      });

      console.log('Successfully auto-saved thesis in Firebase');

      // Update local state
      setTheses(theses.map(t =>
        t.id === currentThesisId
          ? { ...t, criteria: [...criteria], updatedAt: now.toDate() }
          : t
      ));
    } catch (error) {
      console.error('Error auto-saving thesis:', error);
      // Still update local state even if save fails
      setTheses(theses.map(t =>
        t.id === currentThesisId
          ? { ...t, criteria: [...criteria], updatedAt: new Date() }
          : t
      ));
    }
  };

  const handleUpdateThesisWithCriteria = async (criteriaToSave: InvestmentCriteria[]) => {
    if (!currentThesisId) {
      console.error('❌ Cannot save: no thesis selected');
      alert('Error: No thesis selected. Please select a thesis first.');
      return;
    }

    try {
      const userId = localStorage.getItem('userId') || 'dev-user-123';
      const now = Timestamp.now();
      const thesisRef = doc(db, 'users', userId, 'investmentTheses', currentThesisId);

      // Clean criteria to remove undefined values (Firebase doesn't support undefined)
      const cleanedCriteria = criteriaToSave.map(criterion => {
        const cleaned: any = {
          id: criterion.id,
          category: criterion.category,
          field: criterion.field,
          value: criterion.value,
          operator: criterion.operator,
          weight: criterion.weight
        };

        // Only add valuationType if it's defined
        if (criterion.valuationType !== undefined) {
          cleaned.valuationType = criterion.valuationType;
        }

        return cleaned;
      });

      console.log('💾 Saving to Firebase:', {
        userId,
        thesisId: currentThesisId,
        criteriaCount: cleanedCriteria.length,
        criteria: cleanedCriteria
      });

      await updateDoc(thesisRef, {
        criteria: cleanedCriteria,
        updatedAt: now
      });

      console.log('✅ Successfully saved thesis to Firebase');

      // Update local state
      setTheses(theses.map(t =>
        t.id === currentThesisId
          ? { ...t, criteria: criteriaToSave, updatedAt: now.toDate() }
          : t
      ));
    } catch (error: any) {
      console.error('❌ Error saving thesis to Firebase:', error);
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        name: error.name,
        stack: error.stack
      });
      alert(`Failed to save changes to Firebase: ${error.message || 'Unknown error'}. Please check the console for details.`);
      // Still update local state even if save fails
      setTheses(theses.map(t =>
        t.id === currentThesisId
          ? { ...t, criteria: criteriaToSave, updatedAt: new Date() }
          : t
      ));
    }
  };

  // Auto-save is now handled directly in the functions above

  const handleGenerateOnePager = async () => {
    if (!selectedCompany.trim()) {
      alert('Please enter a company name');
      return;
    }

    // Show data source selection dialog first
    setShowDataSourceDialog(true);
  };

  const handleGeneratePersonalPitch = async () => {
    if (!selectedThesisForPitch) {
      alert('Please select a thesis to base the pitch on');
      return;
    }
    if (selectedSearchers.length === 0) {
      alert('Please select at least one searcher profile');
      return;
    }

    setIsGeneratingPitch(true);
    try {
      // Get the selected thesis data
      const selectedThesis = theses.find(t => t.id === selectedThesisForPitch);
      if (!selectedThesis) {
        alert('Selected thesis not found');
        return;
      }

      // Get the selected searcher profiles
      const selectedSearcherProfiles = searcherProfiles.filter(profile => 
        selectedSearchers.includes(profile.id)
      );

      // Get team connection from Firebase
      let teamConnection = '';
      try {
        const userId = localStorage.getItem('userId') || 'dev-user-123';
        const teamConnectionRef = doc(db, 'users', userId, 'teamConnection', 'connection');
        const teamConnectionDoc = await getDoc(teamConnectionRef);
        if (teamConnectionDoc.exists()) {
          teamConnection = teamConnectionDoc.data().connection || '';
        }
      } catch (error) {
        console.warn('Could not load team connection:', error);
      }

      // Prepare the request
      const request: OnePagerRequest = {
        searcherProfiles: selectedSearcherProfiles,
        thesisData: {
          name: selectedThesis.name,
          criteria: selectedThesis.criteria.map(c => ({
            ...c,
            value: c.value.toString()
          }))
        },
        teamConnection: teamConnection || undefined,
        template: selectedTemplate
      };

      console.log('Generating personal pitch with:', request);

      // Generate and download the DOCX file
      const docxBlob = await onePagerApi.generateDocx(request);
      
      // Create download link
      const url = window.URL.createObjectURL(docxBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `search-fund-pitch-${Date.now()}.docx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      alert('Personal pitch generated and downloaded successfully!');
    } catch (error) {
      console.error('Error generating personal pitch:', error);
      alert('Failed to generate personal pitch. Please try again.');
    } finally {
      setIsGeneratingPitch(false);
    }
  };

  const handleGenerateIndustryOverview = async () => {
    if (!selectedThesisForIndustry) {
      alert('Please select a thesis to base the industry overview on');
      return;
    }

    // Ensure we have an industry selected
    const industryToUse = selectedIndustry || (availableIndustries.length === 1 ? availableIndustries[0] : '');

    if (!industryToUse && availableIndustries.length > 1) {
      alert('Please select an industry to generate the overview for');
      return;
    }

    if (!industryToUse && availableIndustries.length === 0) {
      alert('No industries found in the selected thesis. Please add industry criteria to your thesis.');
      return;
    }

    setIsGeneratingIndustry(true);
    try {
      // Get the selected thesis data
      const selectedThesis = theses.find(t => t.id === selectedThesisForIndustry);
      if (!selectedThesis) {
        alert('Selected thesis not found');
        return;
      }

      console.log('Generating industry research with thesis:', selectedThesis.name);
      console.log('Focused on industry:', industryToUse);

      // Prepare the thesis data for the API
      // If a specific industry is selected, filter criteria to only include that industry
      let filteredCriteria = selectedThesis.criteria;
      if (industryToUse) {
        filteredCriteria = selectedThesis.criteria.filter(c => {
          // Keep all non-subindustry criteria
          if (c.category !== 'Subindustry') {
            return true;
          }
          // For subindustry criteria, only keep the selected industry
          return c.value.toString().toLowerCase().includes(industryToUse.toLowerCase());
        });
      }

      const thesisData = {
        name: selectedThesis.name,
        criteria: filteredCriteria.map(c => ({
          ...c,
          value: c.value.toString()
        }))
      };

      // Map frontend template value to backend template value
      // Frontend: 'basic' or 'industry_navy'
      // Backend: 'basic' or 'navy'
      const templateValue = selectedIndustryTemplate === 'industry_navy' ? 'navy' : selectedIndustryTemplate;

      console.log('Using template:', templateValue, '(frontend value:', selectedIndustryTemplate, ')');

      // Call the basic document generation API
      const response = await axios.post('/api/one-pager/generate-basic-document', {
        thesisData,
        selectedIndustry: industryToUse,
        template: templateValue
      }, {
        responseType: 'blob'
      });

      // Get the file blob
      const blob = response.data;
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `industry-research-${selectedThesis.name.replace(/[^a-zA-Z0-9]/g, '-')}-${Date.now()}.docx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      alert('Industry research report generated and downloaded successfully!');
      
    } catch (error) {
      console.error('Error generating industry overview:', error);
      alert(`Error generating industry overview: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsGeneratingIndustry(false);
    }
  };

  const handlePreviewTemplate = () => {
    setShowTemplatePreview(true);
  };

  const handlePreviewIndustryTemplate = () => {
    setShowIndustryTemplatePreview(true);
  };

  // Extract industries/subindustries from thesis criteria
  const extractIndustriesFromThesis = (thesis: any) => {
    const industries = new Set<string>();
    
    thesis.criteria.forEach((criteria: any) => {
      if (criteria.category === 'Subindustry') {
        // Extract industry from criteria value
        const industryValue = criteria.value.toString();
        if (industryValue && industryValue !== '') {
          industries.add(industryValue);
        }
      }
    });
    
    return Array.from(industries);
  };

  // Handle thesis selection for industry research
  const handleThesisSelectionForIndustry = (thesisId: string) => {
    setSelectedThesisForIndustry(thesisId);
    
    const thesis = theses.find(t => t.id === thesisId);
    if (thesis) {
      const industries = extractIndustriesFromThesis(thesis);
      setAvailableIndustries(industries);
      
      // If only one industry, auto-select it
      if (industries.length === 1) {
        setSelectedIndustry(industries[0]);
      } else if (industries.length > 1) {
        setSelectedIndustry(''); // Reset selection for user to choose
      } else {
        setSelectedIndustry(''); // No specific industry found
      }
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setUploadedFiles(prev => [...prev, ...files]);
  };

  const handleRemoveFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleLoadGoogleDriveFolders = async () => {
    setLoadingFolders(true);
    try {
      const folders = await integrationService.getDriveFolders();
      setGoogleDriveFolders(folders.map(folder => folder.name));
    } catch (error) {
      console.error('Error loading Google Drive folders:', error);
      alert('Failed to load Google Drive folders. Please make sure you have connected your Google Drive account.');
    } finally {
      setLoadingFolders(false);
    }
  };

  const handleConfirmDataSource = async () => {
    if (!selectedGoogleDriveFolder && uploadedFiles.length === 0) {
      alert('Please select a Google Drive folder or upload files');
      return;
    }

    setShowDataSourceDialog(false);
    setIsGenerating(true);
    
    try {
      // Simulate API call with data sources
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const mockOnePager: OnePagerData = {
        companyName: selectedCompany || 'TechCorp Solutions',
        industry: 'Enterprise Software',
        pros: [
          'Strong recurring revenue model with 95% retention rate',
          'Experienced management team with successful exits',
          'Large addressable market with growing demand',
          'Proven product-market fit with enterprise customers',
          'Strong competitive moat through network effects'
        ],
        cons: [
          'High customer acquisition costs',
          'Dependency on key personnel',
          'Regulatory risks in target markets',
          'Intense competition from established players',
          'Technology obsolescence risk'
        ],
        scorecard: {
          financial: 85,
          market: 78,
          team: 92,
          technology: 88,
          overall: 86
        },
        sources: [
          {
            type: 'Financial Report',
            title: 'Q3 2024 Financial Results',
            url: 'https://example.com/financial-report',
            relevance: 95
          },
          {
            type: 'Industry Report',
            title: 'Enterprise Software Market Analysis 2024',
            url: 'https://example.com/industry-report',
            relevance: 88
          },
          {
            type: 'News Article',
            title: 'TechCorp Secures $50M Series B Funding',
            url: 'https://example.com/news-article',
            relevance: 82
          },
          {
            type: 'Company Website',
            title: 'About TechCorp Solutions',
            url: 'https://techcorp.com/about',
            relevance: 75
          },
          ...(selectedGoogleDriveFolder ? [{
            type: 'Google Drive',
            title: `Data from ${selectedGoogleDriveFolder} folder`,
            url: `https://drive.google.com/folder/${selectedGoogleDriveFolder}`,
            relevance: 90
          }] : []),
          ...uploadedFiles.map(file => ({
            type: 'Uploaded File',
            title: file.name,
            url: `local://${file.name}`,
            relevance: 85
          }))
        ],
        keyMetrics: {
          revenue: '$25M ARR',
          ebitda: '$8M (32% margin)',
          employees: '120',
          founded: '2019',
          location: 'San Francisco, CA'
        },
        investmentThesis: 'TechCorp represents an attractive investment opportunity in the growing enterprise software market. The company has demonstrated strong product-market fit with a proven business model, experienced team, and significant market opportunity. With 95% customer retention and 40% year-over-year growth, the company is well-positioned for continued expansion.',
        risks: [
          'Market saturation in core verticals',
          'Key person dependency on CEO',
          'Regulatory changes in target markets',
          'Economic downturn impact on enterprise spending'
        ],
        opportunities: [
          'International expansion into European markets',
          'Product line extension into adjacent verticals',
          'Strategic partnerships with system integrators',
          'AI/ML capabilities integration'
        ]
      };
      
      setGeneratedOnePager(mockOnePager);
    } catch (error) {
      console.error('Error generating one-pager:', error);
      alert('Failed to generate one-pager. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return '#10B981';
    if (score >= 80) return '#3B82F6';
    if (score >= 70) return '#F59E0B';
    return '#EF4444';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Excellent';
    if (score >= 80) return 'Good';
    if (score >= 70) return 'Fair';
    return 'Poor';
  };

  // Show loading state
  if (loading) {
    return (
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress sx={{ mb: 2, color: '#10B981' }} />
          <Typography variant="body1" color="text.secondary">
            Loading investment theses...
          </Typography>
        </Box>
      </Box>
    );
  }

  // Show error state
  if (error) {
    const handleRetry = async () => {
      try {
        setLoading(true);
        setError(null);

        const userId = localStorage.getItem('userId') || 'dev-user-123';
        const thesesRef = collection(db, 'users', userId, 'investmentTheses');
        const q = query(thesesRef, orderBy('createdAt', 'asc'));
        const snapshot = await getDocs(q);
        const loadedTheses = snapshot.docs.map(d => {
          const data = d.data();
          return {
            id: d.id,
            name: data.name,
            criteria: data.criteria || [],
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date()
          } as InvestmentThesis;
        });

        if (loadedTheses.length === 0) {
          const now = Timestamp.now();
          const docRef = await addDoc(thesesRef, {
            name: 'Tech Growth Thesis',
            criteria: [],
            createdAt: now,
            updatedAt: now
          });
          const defaultThesis = {
            id: docRef.id,
            name: 'Tech Growth Thesis',
            criteria: [],
            createdAt: now.toDate(),
            updatedAt: now.toDate()
          };
          setTheses([defaultThesis]);
          setCurrentThesisId(defaultThesis.id);
          setCriteria([]);
        } else {
          setTheses(loadedTheses);
          setCurrentThesisId(loadedTheses[0].id);
          setCriteria(loadedTheses[0].criteria);
        }
      } catch (error: any) {
        console.error('Error loading theses:', error);
        setError('Failed to load investment theses. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button
          variant="contained"
          onClick={handleRetry}
          sx={{ bgcolor: '#000000', color: 'white', '&:hover': { bgcolor: '#333333' } }}
        >
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, minHeight: '100vh', bgcolor: '#FAFAFA' }}>
      {/* Modern Hero Section */}
      <Box sx={{
        position: 'relative',
        bgcolor: 'white',
        borderRadius: '0 0 32px 32px',
        overflow: 'hidden',
        mb: 6,
        boxShadow: '0 8px 32px rgba(15, 23, 42, 0.08)'
      }}>
        {/* Background Pattern */}
        <Box sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.02) 0%, rgba(5, 150, 105, 0.05) 100%)',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: -50,
            right: -50,
            width: 100,
            height: 100,
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            borderRadius: '50%',
            opacity: 0.1
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            bottom: -30,
            left: -30,
            width: 60,
            height: 60,
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            borderRadius: 2,
            opacity: 0.1,
            transform: 'rotate(15deg)'
          }
        }} />

        <Box sx={{ position: 'relative', zIndex: 2, px: 4, py: 6 }}>

          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={8}>
              <Box sx={{ position: 'relative', zIndex: 2 }}>
                <Typography 
                  variant="h3" 
                  sx={{ 
                    fontWeight: 700, 
                    mb: 2, 
                    color: '#1e293b',
                    fontSize: { xs: '2.2rem', md: '3rem' },
                    lineHeight: 1.1,
                    letterSpacing: '-0.02em',
                    fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    textTransform: 'uppercase',
                    background: 'linear-gradient(135deg, #1e293b 0%, #475569 100%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}
                >
                  Investment Thesis
                </Typography>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontWeight: 500, 
                    mb: 3, 
                    color: '#475569',
                    fontSize: '1.1rem',
                    lineHeight: 1.5
                  }}
                >
                  Define your investment criteria and generate comprehensive one-pagers for stakeholders and target companies.
                </Typography>
                <Typography 
                  variant="body1" 
                  sx={{ 
                    color: '#64748b',
                    mb: 4,
                    maxWidth: '600px',
                    lineHeight: 1.6
                  }}
                >
                  Allows Equitle to have context on your investment thesis and target companies, so messages, calls, and other functions are more relevant and effective. 
                </Typography>
                
                {/* Action Buttons */}
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Button
                    variant="outlined"
                    size="large"
                    startIcon={<AddIcon />}
                    onClick={() => setShowNewThesisDialog(true)}
                    sx={{
                      borderColor: '#cbd5e1',
                      color: '#475569',
                      px: 4,
                      py: 1.5,
                      borderRadius: 2,
                      fontSize: '1rem',
                      fontWeight: 600,
                      textTransform: 'none',
                      '&:hover': {
                        borderColor: '#94a3b8',
                        bgcolor: '#f8fafc',
                        transform: 'translateY(-1px)'
                      },
                      transition: 'all 0.3s ease'
                    }}
                  >
                    Create New Thesis
                  </Button>
                  <Button
                    variant="outlined"
                    size="large"
                    startIcon={<EditIcon />}
                    onClick={() => setShowThesisManager(true)}
                    sx={{
                      borderColor: '#cbd5e1',
                      color: '#475569',
                      px: 4,
                      py: 1.5,
                      borderRadius: 2,
                      fontSize: '1rem',
                      fontWeight: 600,
                      textTransform: 'none',
                      '&:hover': {
                        borderColor: '#94a3b8',
                        bgcolor: '#f8fafc',
                        transform: 'translateY(-1px)'
                      },
                      transition: 'all 0.3s ease'
                    }}
                  >
                    Manage Theses
                  </Button>
                </Box>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Box sx={{ position: 'relative', zIndex: 2 }}>
                {/* Isometric Device Illustration */}
                <Box
                  sx={{
                    width: '100%',
                    maxWidth: 300,
                    height: 200,
                    position: 'relative',
                    mx: 'auto'
                  }}
                >
                  {/* Device Base */}
                  <Box
                    sx={{
                      width: '80%',
                      height: '60%',
                      background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
                      borderRadius: 3,
                      position: 'absolute',
                      bottom: 0,
                      left: '10%',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                      transform: 'perspective(1000px) rotateX(15deg) rotateY(-5deg)',
                      border: '1px solid #cbd5e1'
                    }}
                  >
                    {/* Screen Content */}
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 8,
                        left: 8,
                        right: 8,
                        bottom: 8,
                        background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                        borderRadius: 2,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 1
                      }}
                    >
                      {/* Chart Elements */}
                      <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'end' }}>
                        <Box sx={{ width: 8, height: 12, background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', borderRadius: 0.5 }} />
                        <Box sx={{ width: 8, height: 16, background: 'linear-gradient(135deg, #059669 0%, #047857 100%)', borderRadius: 0.5 }} />
                        <Box sx={{ width: 8, height: 8, background: 'linear-gradient(135deg, #047857 0%, #065f46 100%)', borderRadius: 0.5 }} />
                        <Box sx={{ width: 8, height: 20, background: 'linear-gradient(135deg, #065f46 0%, #064e3b 100%)', borderRadius: 0.5 }} />
                      </Box>
                      <Box sx={{ width: 20, height: 20, borderRadius: '50%', bgcolor: '#e2e8f0', position: 'relative' }}>
                        <Box sx={{ position: 'absolute', top: 2, left: 2, right: 2, bottom: 2, borderRadius: '50%', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }} />
                      </Box>
                    </Box>
                  </Box>
                  
                  {/* Floating Elements */}
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 20,
                      right: 20,
                      width: 24,
                      height: 24,
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      borderRadius: 2,
                      transform: 'rotate(15deg)',
                      boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                    }}
                  />
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 40,
                      left: 10,
                      width: 16,
                      height: 16,
                      background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                      borderRadius: '50%',
                      transform: 'rotate(-15deg)',
                      boxShadow: '0 4px 12px rgba(5, 150, 105, 0.3)'
                    }}
                  />
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 60,
                      right: 10,
                      width: 20,
                      height: 20,
                      background: 'linear-gradient(135deg, #047857 0%, #065f46 100%)',
                      borderRadius: 1,
                      transform: 'rotate(30deg)',
                      boxShadow: '0 4px 12px rgba(4, 120, 87, 0.3)'
                    }}
                  />
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Box>


      {/* Investment Criteria Section - Full Width */}
      <Card 
        elevation={0}
        sx={{ 
          mb: 4, 
          borderRadius: 3,
          border: '1px solid #e2e8f0',
          overflow: 'hidden'
        }}
      >
        {/* Gradient Header */}
        <Box sx={{
          background: 'linear-gradient(180deg, #2c2c2c 0%, #1a1a1a 100%)',
          color: 'white',
          py: 3,
          px: 4,
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="h6" sx={{ 
                fontWeight: 400, 
                fontSize: '1.25rem', 
                color: 'white',
                fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                letterSpacing: '-0.01em'
              }}>
                Investment Criteria
            </Typography>
          </Box>
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel sx={{ 
                color: '#10B981', 
                fontWeight: 700, 
                fontSize: '0.9rem',
                '&.Mui-focused': {
                  color: 'white'
                }
              }}>Active Thesis:</InputLabel>
              <Select
                value={currentThesisId}
                onChange={(e) => handleThesisChange(e.target.value)}
                label="Active Thesis:"
                style={{ color: 'white !important' }}
                inputProps={{ style: { color: 'white !important' } }}
                className="active-thesis-select"
                MenuProps={{
                  PaperProps: {
                    sx: {
                      borderRadius: 2,
                      mt: 1,
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                      border: '1px solid #E2E8F0',
                      backgroundColor: 'white',
                      zIndex: 9999,
                      '& .MuiMenuItem-root': {
                        px: 2,
                        py: 1.5,
                        fontSize: '0.9rem',
                        color: '#1E293B',
                        fontWeight: 500,
                        backgroundColor: 'white',
                        borderBottom: '1px solid #F1F5F9',
                        '&:last-child': {
                          borderBottom: 'none'
                        },
                        '&:hover': {
                          bgcolor: '#F8FAFC'
                        },
                        '&.Mui-selected': {
                          bgcolor: '#10B981',
                          color: 'white',
                          '&:hover': {
                            bgcolor: '#10B981'
                          }
                        },
                        '&.Mui-focusVisible': {
                          bgcolor: '#F8FAFC'
                        },
                        '&:active': {
                          bgcolor: '#F1F5F9'
                        }
                      }
                    }
                  }
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    border: '2px solid #10B981',
                    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.4) 0%, rgba(5, 150, 105, 0.4) 100%)',
                    minHeight: '48px',
                    boxShadow: '0 0 0 2px rgba(16, 185, 129, 0.2), 0 4px 12px rgba(16, 185, 129, 0.3)',
                    '&:hover': {
                      borderColor: '#059669',
                      background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.5) 0%, rgba(5, 150, 105, 0.5) 100%)',
                      boxShadow: '0 0 0 2px rgba(16, 185, 129, 0.3), 0 6px 16px rgba(16, 185, 129, 0.4)'
                    },
                    '&.Mui-focused': {
                      borderColor: 'white',
                      background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.5) 0%, rgba(5, 150, 105, 0.5) 100%)',
                      boxShadow: '0 0 0 3px rgba(255, 255, 255, 0.4), 0 8px 20px rgba(16, 185, 129, 0.5)',
                      '& fieldset': {
                        borderColor: 'white'
                      }
                    }
                  },
                  '& .MuiSelect-select': {
                    py: 1.5,
                    fontSize: '0.9rem',
                    color: 'white !important',
                    fontWeight: 600,
                    minHeight: '48px',
                    display: 'flex',
                    alignItems: 'center',
                    '&:focus': {
                      color: 'white !important'
                    },
                    '&[aria-expanded="true"]': {
                      color: 'white !important'
                    }
                  },
                  '& .MuiInputBase-input': {
                    color: 'white !important',
                    '&:focus': {
                      color: 'white !important'
                    },
                    '&[aria-expanded="true"]': {
                      color: 'white !important'
                    }
                  },
                  '& input': {
                    color: 'white !important'
                  },
                  '& .MuiSelect-root': {
                    color: 'white !important'
                  },
                  '& .MuiSelect-select.MuiSelect-select': {
                    color: 'white !important'
                  },
                  '& .MuiSvgIcon-root': {
                    color: 'white'
                  }
                }}
              >
                {theses.map((thesis) => (
                  <MenuItem key={thesis.id} value={thesis.id}>
                    {thesis.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          <Typography variant="body2" sx={{ 
            fontSize: '0.9rem', 
            color: 'rgba(255, 255, 255, 0.8)',
            lineHeight: 1.5,
            fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            letterSpacing: '-0.01em'
          }}>
                Total Weight: {getTotalWeight()}% {getTotalWeight() < 100 && `(${getRemainingWeight()}% remaining)`}
              </Typography>
            </Box>

        {/* Content Area */}
        <CardContent sx={{ 
          p: 4, 
          bgcolor: '#F8FAFC',
          color: '#1E293B'
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', mb: 3 }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleOpenAddCriteria}
              disabled={getTotalWeight() >= 100}
              sx={{
                background: 'linear-gradient(135deg, #6B7280 0%, #000000 100%)',
                color: 'white',
                px: 3,
                py: 1.5,
                borderRadius: 2,
                fontSize: '0.95rem',
                fontWeight: 600,
                textTransform: 'none',
                boxShadow: '0 4px 14px rgba(0, 0, 0, 0.2)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #4B5563 0%, #000000 100%)',
                  boxShadow: '0 6px 20px rgba(0, 0, 0, 0.3)',
                  transform: 'translateY(-2px)'
                },
                '&:disabled': { 
                  background: '#9CA3AF',
                  boxShadow: 'none',
                  transform: 'none'
                },
                transition: 'all 0.3s ease'
              }}
            >
              Add Criteria
            </Button>
          </Box>

          {/* Investment Criteria Visualization */}
          {criteria.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" sx={{ 
                fontWeight: 400, 
                fontSize: '1.1rem', 
                color: '#1e293b', 
                mb: 2,
                fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                letterSpacing: '-0.01em'
              }}>
                Investment Criteria Breakdown
              </Typography>
              
              
              {/* Weighted Bar Visualization */}
              <Paper sx={{ p: 3, bgcolor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 3 }}>
                <Box 
                  sx={{ 
                    display: 'flex', 
                    height: 80, 
                    borderRadius: 2, 
                    overflow: 'hidden',
                    border: '1px solid #D1D5DB',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }
                  }}
                >
                  {criteria.map((criterion, index) => {
                    const greenShade = getGreenShade(index);
                    const width = criterion.weight;
                    const isSmallSegment = width < 12; // Hide text for segments smaller than 12%

                    return (
                      <Tooltip 
                        key={criterion.id}
                        title={`${criterion.field} - ${criterion.weight}%`}
                        arrow
                        placement="top"
                      >
                        <Box
                          onClick={() => handleEditCriteria(criterion)}
                          sx={{
                            width: `${width}%`,
                            height: '100%',
                            background: greenShade.gradient,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            position: 'relative',
                            transition: 'all 0.2s ease',
                            minWidth: isSmallSegment ? 'auto' : '60px', // Ensure minimum width for text visibility
                            '&:hover': {
                              opacity: 0.8,
                              transform: 'scaleY(1.05)'
                            }
                          }}
                        >
                          {/* Only show text label if segment is wide enough */}
                          {!isSmallSegment && (
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                color: 'white', 
                                fontWeight: 500,
                                fontSize: '0.8rem',
                                textAlign: 'center',
                                textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                                lineHeight: 1.2,
                                fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                                letterSpacing: '-0.01em',
                                px: 0.5,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                maxWidth: '100%'
                              }}
                            >
                              {criterion.field}
                            </Typography>
                          )}
                          
                          {/* Weight percentage overlay - always visible */}
                          <Box
                            sx={{
                              position: 'absolute',
                              top: 4,
                              right: 4,
                              bgcolor: 'rgba(255,255,255,0.2)',
                              borderRadius: 1,
                              px: 0.75,
                              py: 0.5,
                              cursor: 'pointer',
                              '&:hover': {
                                bgcolor: 'rgba(255,255,255,0.3)'
                              }
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleWeightEdit(criterion.id, criterion.weight);
                            }}
                          >
                            <Typography variant="caption" sx={{ 
                              color: 'white', 
                              fontWeight: 500, 
                              fontSize: '0.7rem',
                              fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                              letterSpacing: '-0.01em',
                              whiteSpace: 'nowrap'
                            }}>
                              {criterion.weight}%
                            </Typography>
                          </Box>
                        </Box>
                      </Tooltip>
                    );
                  })}
                </Box>
                
                {/* Legend - Only show in detailed view - REMOVED */}
                {/* {showDetailedView && (
                  <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {console.log('Rendering detailed view, showDetailedView:', showDetailedView)}
                  {criteria.map((criterion, index) => {
                    const colors = [
                      '#10b981', // Green
                      '#059669', // Darker Green
                      '#047857', // Even Darker Green
                      '#065f46', // Very Dark Green
                      '#064e3b', // Darkest Green
                      '#10b981'  // Back to Green
                    ];
                    const color = colors[index % colors.length];
                    
                    return (
                      <Box
                        key={criterion.id}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 2,
                          p: 2.5,
                          bgcolor: '#FFFFFF',
                          borderRadius: 3,
                          border: '1px solid #E5E7EB',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          width: '100%',
                          '&:hover': {
                            bgcolor: '#F9FAFB',
                            borderColor: '#D1D5DB',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                            transform: 'translateY(-1px)'
                          }
                        }}
                        onClick={() => handleEditCriteria(criterion)}
                      >
                        <Box
                          sx={{
                            width: 16,
                            height: 16,
                            bgcolor: color,
                            borderRadius: 1,
                            flexShrink: 0
                          }}
                        />
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', minWidth: 0, flex: 1 }}>
                          <Typography variant="body1" sx={{ fontWeight: 600, color: '#000000', fontSize: '0.9rem', mb: 0.5 }}>
                          {criterion.field} 
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 500, color: '#6B7280', fontSize: '0.8rem' }}>
                            {criterion.operator} {criterion.value}
                          </Typography>
                        </Box>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: '#10b981', fontSize: '1rem', ml: 2 }}>
                          {criterion.weight}%
                        </Typography>
                        {editingWeight === criterion.id ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <TextField
                              size="small"
                              type="text"
                              defaultValue={criterion.weight}
                              onKeyPress={(e) => handleWeightKeyPress(e, criterion.id)}
                              onBlur={(e) => {
                                const newWeight = parseInt(e.target.value);
                                if (!isNaN(newWeight)) {
                                  handleWeightChange(criterion.id, newWeight);
                                }
                              }}
                              onChange={(e) => {
                                // Only allow numbers
                                const value = e.target.value.replace(/[^0-9]/g, '');
                                e.target.value = value;
                              }}
                              inputProps={{
                                style: { 
                                  fontSize: '0.75rem',
                                  padding: '2px 4px',
                                  width: '40px',
                                  textAlign: 'center',
                                  MozAppearance: 'textfield',
                                  WebkitAppearance: 'none',
                                  appearance: 'none'
                                }
                              }}
                              sx={{
                                '& .MuiOutlinedInput-root': {
                                  height: '20px',
                                  '& fieldset': {
                                    borderColor: '#000000'
                                  },
                                  '& input[type=number]': {
                                    MozAppearance: 'textfield',
                                    WebkitAppearance: 'none',
                                    appearance: 'none'
                                  },
                                  '& input[type=number]::-webkit-outer-spin-button': {
                                    WebkitAppearance: 'none',
                                    margin: 0
                                  },
                                  '& input[type=number]::-webkit-inner-spin-button': {
                                    WebkitAppearance: 'none',
                                    margin: 0
                                  }
                                }
                              }}
                            />
                            <Typography variant="caption" sx={{ color: '#6B7280', fontSize: '0.7rem' }}>
                              /{getRemainingWeightForEdit(criterion.id)}%
                            </Typography>
                          </Box>
                        ) : (
                          <Box />
                        )}
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteCriteria(criterion.id);
                          }}
                          sx={{ 
                            color: '#EF4444',
                            p: 0.5,
                            '&:hover': { bgcolor: '#FEE2E2' }
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    );
                  })}
                </Box>
                )} */}
              </Paper>
            </Box>
          )}

          {/* Traditional View Toggle Button */}
          {criteria.length > 0 && (
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
              <Box
                onClick={() => {
                  console.log('Toggle clicked, current state:', showTraditionalView);
                  setShowTraditionalView(!showTraditionalView);
                  console.log('New state:', !showTraditionalView);
                }}
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 1,
                  px: 2,
                  py: 1,
                  borderRadius: 2,
                  border: '1px solid #D1D5DB',
                  color: '#6B7280',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    borderColor: '#10b981',
                    color: '#10b981',
                    bgcolor: '#f0fdf4'
                  }
                }}
              >
                {showTraditionalView ? <ExpandLessIcon /> : <AddIcon />}
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {showTraditionalView ? 'Hide Detailed View' : 'Show Detailed View'}
                </Typography>
              </Box>
            </Box>
          )}

          {/* Traditional Detailed View */}
          {showTraditionalView && criteria.length > 0 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Typography variant="h6" sx={{ fontWeight: 400, fontSize: '1.1rem', color: '#1e293b', mb: 2 }}>
                Detailed Investment Criteria
              </Typography>
              {criteria.map((criterion, index) => (
                <Paper 
                  key={criterion.id} 
                  sx={{ 
                    p: 3, 
                    bgcolor: '#FFFFFF', 
                    border: '1px solid #E5E7EB',
                    borderRadius: 3,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      borderColor: '#D1D5DB',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                        <Chip
                          label={criterion.category}
                          size="small"
                          sx={{
                            bgcolor: getGreenShade(index).color,
                            color: '#FFFFFF',
                            fontWeight: 600,
                            fontSize: '0.75rem',
                            height: 28,
                            px: 1
                          }}
                        />
                        <Typography variant="h6" sx={{ fontWeight: 600, color: '#000000' }}>
                          {criterion.field}
                        </Typography>
                        <Typography variant="body1" sx={{ color: '#6B7280', fontWeight: 500 }}>
                          {criterion.operator}
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: '#000000' }}>
                          {criterion.value}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ minWidth: 'fit-content', fontWeight: 500 }}>
                          Weight: 
                        </Typography>
                        {editingWeight === criterion.id ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <TextField
                              size="small"
                              type="text"
                              defaultValue={criterion.weight}
                              onKeyPress={(e) => handleWeightKeyPress(e, criterion.id)}
                              onBlur={(e) => {
                                const newWeight = parseInt(e.target.value);
                                if (!isNaN(newWeight)) {
                                  handleWeightChange(criterion.id, newWeight);
                                }
                              }}
                              onChange={(e) => {
                                const value = e.target.value.replace(/[^0-9]/g, '');
                                e.target.value = value;
                              }}
                              inputProps={{
                                style: { 
                                  fontSize: '0.875rem',
                                  padding: '6px 12px',
                                  width: '60px',
                                  textAlign: 'center',
                                  MozAppearance: 'textfield',
                                  WebkitAppearance: 'none',
                                  appearance: 'none'
                                }
                              }}
                              sx={{
                                '& .MuiOutlinedInput-root': {
                                  height: '32px',
                                  '& fieldset': {
                                    borderColor: '#000000'
                                  }
                                }
                              }}
                            />
                            <Typography variant="body2" sx={{ color: '#6B7280' }}>
                              /{getRemainingWeightForEdit(criterion.id)}%
                            </Typography>
                          </Box>
                        ) : (
                          <Typography 
                            variant="body1" 
                            sx={{ 
                              fontWeight: 600, 
                              color: '#000000',
                              cursor: 'pointer',
                              px: 2,
                              py: 1,
                              borderRadius: 2,
                              minWidth: 'fit-content',
                              bgcolor: '#F3F4F6',
                              '&:hover': {
                                bgcolor: '#E5E7EB'
                              }
                            }}
                            onClick={() => handleWeightEdit(criterion.id, criterion.weight)}
                          >
                            {criterion.weight}%
                          </Typography>
                        )}
                        <LinearProgress
                          variant="determinate"
                          value={criterion.weight}
                          sx={{
                            flex: 1,
                            height: 8,
                            borderRadius: 4,
                            bgcolor: '#F3F4F6',
                            '& .MuiLinearProgress-bar': {
                              background: getGreenShade(index).gradient,
                              borderRadius: 4
                            }
                          }}
                        />
                      </Box>
                    </Box>
                    
                    <Box sx={{ display: 'flex', gap: 0.5, ml: 2 }}>
                      <IconButton
                        onClick={() => handleEditCriteria(criterion)}
                        size="small"
                        sx={{ 
                          color: '#6B7280',
                          bgcolor: '#F9FAFB',
                          border: '1px solid #E5E7EB',
                          '&:hover': {
                            bgcolor: '#F3F4F6',
                            color: '#000000',
                            borderColor: '#D1D5DB'
                          }
                        }} //s3P_jl0bcIF1TSurEZF0sA
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        onClick={() => handleDeleteCriteria(criterion.id)}
                        size="small"
                        sx={{ 
                          color: '#EF4444',
                          bgcolor: '#FEF2F2',
                          border: '1px solid #FECACA',
                          '&:hover': {
                            bgcolor: '#FEE2E2',
                            borderColor: '#FCA5A5'
                          }
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                </Paper>
              ))}
            </Box>
          )}

          {criteria.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <AssessmentIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="body1" color="text.secondary" gutterBottom>
                No investment criteria defined
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Add criteria to start building your investment thesis
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>


      {/* Personal Pitch One Pager Generator */}
      <Card sx={{ 
        mt: 4, 
        borderRadius: 3,
        border: '1px solid #e2e8f0',
        overflow: 'hidden'
      }}>
        {/* Gradient Header */}
        <Box sx={{
          background: 'linear-gradient(180deg, #2c2c2c 0%, #1a1a1a 100%)',
                color: 'white',
          py: 3,
                px: 4,
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 400, fontSize: '1.25rem', color: 'white' }}>
              Personal Pitch One-Pager Generator
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ 
            mt: 1, 
            fontSize: '0.9rem', 
            color: 'rgba(255, 255, 255, 0.8)',
            lineHeight: 1.5
          }}>
            Generate personalized pitch one-pagers for your investment thesis
              </Typography>
            </Box>

        {/* Content Area */}
        <CardContent sx={{ 
          p: 4, 
          bgcolor: '#F8FAFC',
          color: '#1E293B'
        }}>

          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Select Thesis</InputLabel>
                <Select
                  value={selectedThesisForPitch}
                  onChange={(e) => setSelectedThesisForPitch(e.target.value)}
                  label="Select Thesis"
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        borderRadius: 2,
                        mt: 1,
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                        border: '1px solid #E2E8F0',
                        '& .MuiMenuItem-root': {
                          px: 2,
                          py: 1.5,
                          fontSize: '0.9rem',
                          color: '#1E293B',
                          fontWeight: 500,
                          borderBottom: '1px solid #F1F5F9',
                          '&:last-child': {
                            borderBottom: 'none'
                          },
                          '&:hover': {
                            bgcolor: 'transparent'
                          },
                          '&.Mui-selected': {
                            bgcolor: '#10B981',
                            color: 'white',
                            '&:hover': {
                              bgcolor: '#10B981'
                            }
                          },
                          '&.Mui-focusVisible': {
                            bgcolor: 'transparent'
                          },
                          '&:active': {
                            bgcolor: 'transparent'
                          }
                        }
                      }
                    }
                  }}
                >
                  {theses.map((thesis) => (
                    <MenuItem key={thesis.id} value={thesis.id}>
                      {thesis.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Select Searcher Profiles</InputLabel>
                <Select
                  multiple
                  value={selectedSearchers}
                  onChange={(e) => setSelectedSearchers(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)}
                  label="Select Searcher Profiles"
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        borderRadius: 2,
                        mt: 1,
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                        border: '1px solid #E2E8F0',
                        '& .MuiMenuItem-root': {
                          px: 2,
                          py: 1.5,
                          fontSize: '0.9rem',
                          color: '#1E293B',
                          fontWeight: 500,
                          borderBottom: '1px solid #F1F5F9',
                          '&:last-child': {
                            borderBottom: 'none'
                          },
                          '&:hover': {
                            bgcolor: 'transparent'
                          },
                          '&.Mui-selected': {
                            bgcolor: '#10B981',
                            color: 'white',
                            '&:hover': {
                              bgcolor: '#10B981'
                            }
                          },
                          '&.Mui-focusVisible': {
                            bgcolor: 'transparent'
                          },
                          '&:active': {
                            bgcolor: 'transparent'
                          }
                        }
                      }
                    }
                  }}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => {
                        const profile = searcherProfiles.find(p => p.id === value);
                        return <Chip key={value} label={profile?.name || value} size="small" />;
                      })}
                    </Box>
                  )}
                >
                  {searcherProfiles.length > 0 ? (
                    searcherProfiles.map((profile) => (
                      <MenuItem key={profile.id} value={profile.id}>
                        {profile.name}
                      </MenuItem>
                    ))
                  ) : (
                    <MenuItem disabled>No searcher profiles found. Create one in My Profile.</MenuItem>
                  )}
                </Select>
                {/* Debug info */}
                {process.env.NODE_ENV === 'development' && (
                  <Box sx={{ mt: 1, p: 1, bgcolor: 'grey.100', borderRadius: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      Debug: {searcherProfiles.length} profiles loaded
                    </Typography>
                  </Box>
                )}
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Select Template</InputLabel>
                <Select
                  value={selectedTemplate}
                  onChange={(e) => setSelectedTemplate(e.target.value)}
                  label="Select Template"
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        borderRadius: 2,
                        mt: 1,
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                        border: '1px solid #E2E8F0',
                        '& .MuiMenuItem-root': {
                          px: 2,
                          py: 1.5,
                          fontSize: '0.9rem',
                          color: '#1E293B',
                          fontWeight: 500,
                          borderBottom: '1px solid #F1F5F9',
                          '&:last-child': {
                            borderBottom: 'none'
                          },
                          '&:hover': {
                            bgcolor: 'transparent'
                          },
                          '&.Mui-selected': {
                            bgcolor: '#10B981',
                            color: 'white',
                            '&:hover': {
                              bgcolor: '#10B981'
                            }
                          },
                          '&.Mui-focusVisible': {
                            bgcolor: 'transparent'
                          },
                          '&:active': {
                            bgcolor: 'transparent'
                          }
                        }
                      }
                    }
                  }}
                >
                  <MenuItem value="basic">Basic Template</MenuItem>
                  <MenuItem value="industry_navy">Industry Navy</MenuItem>
                  <MenuItem value="personal_navy">Personal Navy</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          {/* Template Preview Section */}
          <Box sx={{ mt: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Preview template before generating:
              </Typography>
              <Button
                variant="outlined"
                size="small"
                onClick={handlePreviewTemplate}
                sx={{
                  borderColor: '#000000',
                  color: '#000000',
                  '&:hover': {
                    borderColor: '#333333',
                    bgcolor: '#F5F5F5'
                  }
                }}
              >
                Preview Template
              </Button>
            </Box>
          </Box>


          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
            <Button
              variant="contained"
              startIcon={<AutoAwesomeIcon />}
              onClick={handleGeneratePersonalPitch}
              disabled={
                isGeneratingPitch || 
                !selectedThesisForPitch || 
                selectedSearchers.length === 0
              }
              size="large"
              sx={{
                bgcolor: '#10B981',
                color: 'white',
                px: 4,
                py: 1.5,
                '&:hover': { bgcolor: '#059669' },
                '&:disabled': { bgcolor: '#9CA3AF' }
              }}
            >
              {isGeneratingPitch ? 'Generating...' : 'Generate One-Pager'}
            </Button>
          </Box>

          {isGeneratingPitch && (
            <Box sx={{ mt: 3 }}>
              <LinearProgress sx={{ mb: 1 }} />
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                Generating your personal pitch one-pager...
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Industry Overview One Pager Generator */}
      <Card sx={{ 
        mt: 4, 
        borderRadius: 3,
        border: '1px solid #e2e8f0',
        overflow: 'hidden'
      }}>
        {/* Gradient Header */}
        <Box sx={{
          background: 'linear-gradient(180deg, #2c2c2c 0%, #1a1a1a 100%)',
          color: 'white',
          py: 3,
          px: 4,
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 400, fontSize: '1.25rem', color: 'white' }}>
            Industry Overview One-Pager Generator
          </Typography>
          </Box>
          <Typography variant="body2" sx={{ 
            mt: 1, 
            fontSize: '0.9rem', 
            color: 'rgba(255, 255, 255, 0.8)',
            lineHeight: 1.5
          }}>
            Generate industry overview one-pagers for your investment thesis
          </Typography>
        </Box>

        {/* Content Area */}
        <CardContent sx={{ 
          p: 4, 
          bgcolor: '#F8FAFC',
          color: '#1E293B'
        }}>

          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Select Thesis</InputLabel>
                      <Select
                        value={selectedThesisForIndustry}
                        onChange={(e) => handleThesisSelectionForIndustry(e.target.value)}
                        label="Select Thesis"
                  sx={{
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#000000',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#333333',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#000000',
                    },
                  }}
                >
                  {theses.map((thesis) => (
                    <MenuItem key={thesis.id} value={thesis.id}>
                      {thesis.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
                  <Grid item xs={12} md={4}>
                    <FormControl fullWidth>
                      <InputLabel>Select Template</InputLabel>
                      <Select
                        value={selectedIndustryTemplate}
                        onChange={(e) => setSelectedIndustryTemplate(e.target.value)}
                        label="Select Template"
                        sx={{
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#000000',
                          },
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#333333',
                          },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#000000',
                          },
                        }}
                      >
                        <MenuItem value="basic">Basic Template</MenuItem>
                        <MenuItem value="industry_navy">Navy Blue</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  {availableIndustries.length > 1 && (
                    <Grid item xs={12} md={4}>
                      <FormControl fullWidth>
                        <InputLabel>Select Industry</InputLabel>
                        <Select
                          value={selectedIndustry}
                          onChange={(e) => setSelectedIndustry(e.target.value)}
                          label="Select Industry"
                          sx={{
                            '& .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#000000',
                            },
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#333333',
                            },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#000000',
                            },
                          }}
                        >
                          {availableIndustries.map((industry) => (
                            <MenuItem key={industry} value={industry}>
                              {industry}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                  )}
                  <Grid item xs={12} md={availableIndustries.length > 1 ? 12 : 4}>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      {availableIndustries.length > 1 
                        ? `Generate an industry overview one-pager for the selected industry based on your investment thesis criteria.`
                        : `Generate an industry overview one-pager based on your selected investment thesis criteria and market analysis.`
                      }
                    </Typography>
                  </Grid>
          </Grid>

          {/* Template Preview Section */}
          <Box sx={{ mt: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Preview template before generating:
              </Typography>
              <Button
                variant="outlined"
                size="small"
                onClick={handlePreviewIndustryTemplate}
                sx={{
                  borderColor: '#000000',
                  color: '#000000',
                  '&:hover': {
                    borderColor: '#333333',
                    bgcolor: '#F5F5F5'
                  }
                }}
              >
                Preview Template
              </Button>
            </Box>
          </Box>

          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
                  <Button
                    variant="contained"
                    startIcon={<AutoAwesomeIcon />}
                    onClick={handleGenerateIndustryOverview}
                    disabled={isGeneratingIndustry || !selectedThesisForIndustry || (availableIndustries.length > 1 && !selectedIndustry)}
                    size="large"
                    sx={{
                      bgcolor: '#10B981',
                      color: 'white',
                      px: 4,
                      py: 1.5,
                      '&:hover': { bgcolor: '#059669' },
                      '&:disabled': { bgcolor: '#9CA3AF' }
                    }}
                  >
                    {isGeneratingIndustry ? 'Generating...' : 'Generate Industry Overview'}
                  </Button>
          </Box>

          {isGeneratingIndustry && (
            <Box sx={{ mt: 3 }}>
              <LinearProgress sx={{ mb: 1 }} />
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                Generating your industry overview one-pager...
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Generated One-Pager */}
      {generatedOnePager && (
        <Box sx={{ mt: 4 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" sx={{ fontWeight: 600, color: '#000000' }}>
                  {generatedOnePager!.companyName} - Investment Analysis
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    startIcon={<DownloadIcon />}
                    variant="outlined"
                    size="small"
                  >
                    Download PDF
                  </Button>
                  <Button
                    startIcon={<ShareIcon />}
                    variant="outlined"
                    size="small"
                  >
                    Share
                  </Button>
                </Box>
              </Box>

              {/* Key Metrics */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6} md={2.4}>
                  <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#F9FAFB' }}>
                    <AttachMoneyIcon sx={{ color: '#000000', mb: 1 }} />
                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#000000' }}>
                      {generatedOnePager.keyMetrics.revenue}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Revenue
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6} md={2.4}>
                  <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#F9FAFB' }}>
                    <TrendingUpIcon sx={{ color: '#000000', mb: 1 }} />
                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#000000' }}>
                      {generatedOnePager.keyMetrics.ebitda}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      EBITDA
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6} md={2.4}>
                  <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#F9FAFB' }}>
                    <PeopleIcon sx={{ color: '#000000', mb: 1 }} />
                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#000000' }}>
                      {generatedOnePager.keyMetrics.employees}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Employees
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6} md={2.4}>
                  <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#F9FAFB' }}>
                    <TimelineIcon sx={{ color: '#000000', mb: 1 }} />
                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#000000' }}>
                      {generatedOnePager.keyMetrics.founded}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Founded
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6} md={2.4}>
                  <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#F9FAFB' }}>
                    <LocationIcon sx={{ color: '#000000', mb: 1 }} />
                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#000000' }}>
                      {generatedOnePager.keyMetrics.location}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Location
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>

              {/* Scorecard */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#000000' }}>
                  Investment Scorecard
                </Typography>
                <Grid container spacing={2}>
                  {Object.entries(generatedOnePager.scorecard).map(([key, score]) => (
                    <Grid item xs={12} sm={6} md={2.4} key={key}>
                      <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          {key.charAt(0).toUpperCase() + key.slice(1)}
                        </Typography>
                        <Typography 
                          variant="h4" 
                          sx={{ 
                            fontWeight: 600, 
                            color: getScoreColor(score),
                            mb: 1 
                          }}
                        >
                          {score}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {getScoreLabel(score)}
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={score}
                          sx={{
                            mt: 1,
                            height: 4,
                            borderRadius: 2,
                            bgcolor: '#E5E7EB',
                            '& .MuiLinearProgress-bar': {
                              background: `linear-gradient(90deg, #6B7280 0%, ${getScoreColor(score)} 100%)`
                            }
                          }}
                        />
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </Box>

              {/* Investment Thesis */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#000000' }}>
                  Investment Thesis
                </Typography>
                <Paper sx={{ p: 3, bgcolor: '#F9FAFB' }}>
                  <Typography variant="body1">
                    {generatedOnePager.investmentThesis}
                  </Typography>
                </Paper>
              </Box>

              {/* Pros and Cons */}
              <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#10B981' }}>
                    Strengths
                  </Typography>
                  <List>
                    {generatedOnePager.pros.map((pro, index) => (
                      <ListItem key={index} sx={{ px: 0, py: 0.5 }}>
                        <ListItemIcon sx={{ minWidth: 32 }}>
                          <CheckCircleIcon sx={{ color: '#10B981', fontSize: 20 }} />
                        </ListItemIcon>
                        <ListItemText 
                          primary={pro}
                          primaryTypographyProps={{ variant: 'body2' }}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#EF4444' }}>
                    Risks & Concerns
                  </Typography>
                  <List>
                    {generatedOnePager.cons.map((con, index) => (
                      <ListItem key={index} sx={{ px: 0, py: 0.5 }}>
                        <ListItemIcon sx={{ minWidth: 32 }}>
                          <WarningIcon sx={{ color: '#EF4444', fontSize: 20 }} />
                        </ListItemIcon>
                        <ListItemText 
                          primary={con}
                          primaryTypographyProps={{ variant: 'body2' }}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Grid>
              </Grid>

              {/* Sources */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#000000' }}>
                  Sources & References
                </Typography>
                <TableContainer component={Paper} sx={{ bgcolor: '#F9FAFB' }}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Title</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Relevance</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Action</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {generatedOnePager.sources.map((source, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Chip 
                              label={source.type} 
                              size="small"
                              sx={{ 
                                bgcolor: '#E5E7EB', 
                                color: '#000000',
                                fontWeight: 500
                              }}
                            />
                          </TableCell>
                          <TableCell>{source.title}</TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <LinearProgress
                                variant="determinate"
                                value={source.relevance}
                                sx={{
                                  width: 60,
                                  height: 4,
                                  borderRadius: 2,
                                  bgcolor: '#E5E7EB',
                                  '& .MuiLinearProgress-bar': {
                                    background: 'linear-gradient(90deg, #6B7280 0%, #000000 100%)'
                                  }
                                }}
                              />
                              <Typography variant="caption">
                                {source.relevance}%
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Button size="small" variant="outlined">
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Add Criteria Dialog */}
      <Dialog 
        open={showAddCriteria} 
        onClose={() => {
          setShowAddCriteria(false);
          setEditingCriteria(null);
          // Reset form when closing
          setNewCriteria({
            category: 'Financial',
            field: '',
            value: '',
            operator: '>=',
            weight: 10,
            valuationType: undefined
          });
        }} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: '0 1px 3px rgba(60,64,67,0.3), 0 4px 8px 3px rgba(60,64,67,0.15)',
            maxHeight: '90vh',
            overflow: 'hidden'
          }
        }}
      >
        <DialogTitle sx={{ 
          background: 'linear-gradient(180deg, #2c2c2c 0%, #1a1a1a 100%)', 
          color: 'white',
          py: 2,
          px: 3,
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          borderTopLeftRadius: 8,
          borderTopRightRadius: 8
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ 
              width: 24, 
              height: 24, 
              borderRadius: '50%', 
              bgcolor: 'white', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}>
              <AddIcon sx={{ color: '#2c2c2c', fontSize: '1rem' }} />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 400, fontSize: '1.25rem', color: 'white' }}>
              {editingCriteria ? 'Edit Investment Criteria' : 'Add Investment Criteria'}
            </Typography>
          </Box>
        </DialogTitle>
        
        <DialogContent sx={{ 
          p: 4, 
          pt: 5,
          pb: 5,
          bgcolor: '#F8FAFC',
          color: '#1E293B',
          position: 'relative'
        }}>
          <Typography variant="body2" sx={{ 
            mb: 4, 
            fontSize: '0.9rem', 
            lineHeight: 1.5,
            color: '#64748B',
            textAlign: 'center'
          }}>
            {editingCriteria 
              ? ''
              : 'Define a new investment criterion to add to your thesis. Each criterion will be weighted and used in the one-pager generation process.'
            }
          </Typography>
          
          <Grid container spacing={3}>
            {/* Row 1: Category and Field Name */}
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <Box sx={{ width: '100%', maxWidth: 280 }}>
              <FormControl fullWidth>
                    <InputLabel sx={{ color: '#64748B', fontWeight: 500, fontSize: '0.875rem' }}>Category</InputLabel>
                <Select
                  value={newCriteria.category}
                  onChange={(e) => setNewCriteria({ ...newCriteria, category: e.target.value })}
                  label="Category"
                      MenuProps={{
                        PaperProps: {
                          sx: {
                            borderRadius: 2,
                            mt: 1,
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                            border: '1px solid #E2E8F0',
                            '& .MuiMenuItem-root': {
                              px: 2,
                              py: 1.5,
                              fontSize: '0.9rem',
                              color: '#1E293B',
                              fontWeight: 500,
                              borderBottom: '1px solid #F1F5F9',
                              '&:last-child': {
                                borderBottom: 'none'
                              },
                              '&:hover': {
                                bgcolor: 'transparent'
                              },
                              '&.Mui-selected': {
                                bgcolor: '#10B981',
                                color: 'white',
                                '&:hover': {
                                  bgcolor: '#10B981'
                                }
                              },
                              '&.Mui-focusVisible': {
                                bgcolor: 'transparent'
                              },
                              '&:active': {
                                bgcolor: 'transparent'
                              }
                            }
                          }
                        }
                      }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                          borderRadius: 0,
                          borderBottom: '1px solid #DADCE0',
                          borderTop: 'none',
                          borderLeft: 'none',
                          borderRight: 'none',
                          minHeight: '48px',
                          '&:hover': {
                            borderBottom: '2px solid #10B981'
                          },
                          '&.Mui-focused': {
                            borderBottom: '2px solid #10B981',
                            '& fieldset': {
                              border: 'none'
                            }
                          },
                          '& fieldset': {
                            border: 'none'
                          }
                        },
                        '& .MuiSelect-select': {
                          py: 1.5,
                          fontSize: '0.9rem',
                          color: '#1E293B',
                          fontWeight: 500,
                          minHeight: '48px',
                          display: 'flex',
                          alignItems: 'center'
                    }
                  }}
                >
                  {categories.map((category) => (
                        <MenuItem key={category} value={category} sx={{ fontSize: '0.875rem' }}>
                      {category}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
                </Box>
              </Box>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <Box sx={{ width: '100%', maxWidth: 280 }}>
              <TextField
                fullWidth
                label="Field Name"
                value={newCriteria.field}
                onChange={(e) => setNewCriteria({ ...newCriteria, field: e.target.value })}
                placeholder="e.g., Revenue, EBITDA, Industry"
                    variant="standard"
                sx={{
                      '& .MuiInputLabel-root': {
                        color: '#64748B',
                        fontWeight: 500,
                        fontSize: '0.875rem'
                      },
                      '& .MuiInput-underline': {
                        '&:before': {
                          borderBottom: '2px solid #E2E8F0'
                        },
                        '&:hover:not(.Mui-disabled):before': {
                          borderBottom: '2px solid #10B981'
                        },
                        '&:after': {
                          borderBottom: '2px solid #10B981'
                        }
                      },
                      '& .MuiInputBase-input': {
                        py: 1.5,
                        fontSize: '0.9rem',
                        color: '#1E293B',
                        fontWeight: 500,
                        minHeight: '48px',
                        display: 'flex',
                        alignItems: 'center'
                  }
                }}
              />
                </Box>
              </Box>
            </Grid>
            
            {/* Row 2: Operator and Value */}
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <Box sx={{ width: '100%', maxWidth: 280 }}>
              <FormControl fullWidth>
                    <InputLabel sx={{ color: '#64748B', fontWeight: 500, fontSize: '0.875rem' }}>Operator</InputLabel>
                <Select
                  value={newCriteria.operator}
                  onChange={(e) => setNewCriteria({ ...newCriteria, operator: e.target.value })}
                  label="Operator"
                      MenuProps={{
                        PaperProps: {
                          sx: {
                            borderRadius: 2,
                            mt: 1,
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                            border: '1px solid #E2E8F0',
                            '& .MuiMenuItem-root': {
                              px: 2,
                              py: 1.5,
                              fontSize: '0.9rem',
                              color: '#1E293B',
                              fontWeight: 500,
                              borderBottom: '1px solid #F1F5F9',
                              '&:last-child': {
                                borderBottom: 'none'
                              },
                              '&:hover': {
                                bgcolor: 'transparent'
                              },
                              '&.Mui-selected': {
                                bgcolor: '#10B981',
                                color: 'white',
                                '&:hover': {
                                  bgcolor: '#10B981'
                                }
                              },
                              '&.Mui-focusVisible': {
                                bgcolor: 'transparent'
                              },
                              '&:active': {
                                bgcolor: 'transparent'
                              }
                            }
                          }
                        }
                      }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                          borderRadius: 0,
                          borderBottom: '1px solid #DADCE0',
                          borderTop: 'none',
                          borderLeft: 'none',
                          borderRight: 'none',
                          minHeight: '48px',
                          '&:hover': {
                            borderBottom: '2px solid #10B981'
                          },
                          '&.Mui-focused': {
                            borderBottom: '2px solid #10B981',
                            '& fieldset': {
                              border: 'none'
                            }
                          },
                          '& fieldset': {
                            border: 'none'
                          }
                        },
                        '& .MuiSelect-select': {
                          py: 1.5,
                          fontSize: '0.9rem',
                          color: '#1E293B',
                          fontWeight: 500,
                          minHeight: '48px',
                          display: 'flex',
                          alignItems: 'center'
                    }
                  }}
                >
                  {operators.map((op) => (
                        <MenuItem key={op} value={op} sx={{ fontSize: '0.875rem' }}>
                      {op}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
                </Box>
              </Box>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <Box sx={{ width: '100%', maxWidth: 280 }}>
              <TextField
                fullWidth
                label="Value"
                value={newCriteria.value}
                onChange={(e) => setNewCriteria({ ...newCriteria, value: e.target.value })}
                placeholder="e.g., 1000000, Technology, North America"
                    variant="standard"
                sx={{
                      '& .MuiInputLabel-root': {
                        color: '#64748B',
                        fontWeight: 500,
                        fontSize: '0.875rem'
                      },
                      '& .MuiInput-underline': {
                        '&:before': {
                          borderBottom: '2px solid #E2E8F0'
                        },
                        '&:hover:not(.Mui-disabled):before': {
                          borderBottom: '2px solid #10B981'
                        },
                        '&:after': {
                          borderBottom: '2px solid #10B981'
                        }
                      },
                      '& .MuiInputBase-input': {
                        py: 1.5,
                        fontSize: '0.9rem',
                        color: '#1E293B',
                        fontWeight: 500,
                        minHeight: '48px',
                        display: 'flex',
                        alignItems: 'center'
                  }
                }}
              />
                </Box>
              </Box>
            </Grid>
            
            {/* Row 3: Weight and Valuation Type (if applicable) */}
              <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <Box sx={{ width: '100%', maxWidth: 280 }}>
              <TextField
                fullWidth
                label="Weight (%)"
                type="text"
                value={newCriteria.weight}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9]/g, '');
                  setNewCriteria({ ...newCriteria, weight: parseInt(value) || 0 });
                }}
                error={editingCriteria ? false : (newCriteria.weight || 0) > getRemainingWeight()}
                    variant="standard"
                sx={{
                      '& .MuiInputLabel-root': {
                        color: '#64748B',
                        fontWeight: 500,
                        fontSize: '0.875rem'
                      },
                      '& .MuiInput-underline': {
                        '&:before': {
                          borderBottom: '2px solid #E2E8F0'
                        },
                        '&:hover:not(.Mui-disabled):before': {
                          borderBottom: '2px solid #10B981'
                        },
                        '&:after': {
                          borderBottom: '2px solid #10B981'
                        }
                      },
                      '& .MuiInputBase-input': {
                        py: 2,
                        fontSize: '1.5rem',
                        color: '#1E293B',
                        fontWeight: 600,
                        minHeight: '56px',
                        display: 'flex',
                        alignItems: 'center',
                        textAlign: 'center'
                    },
                    '& input[type=number]': {
                      MozAppearance: 'textfield',
                      WebkitAppearance: 'none',
                      appearance: 'none'
                    },
                    '& input[type=number]::-webkit-outer-spin-button': {
                      WebkitAppearance: 'none',
                      margin: 0
                    },
                    '& input[type=number]::-webkit-inner-spin-button': {
                      WebkitAppearance: 'none',
                      margin: 0
                  }
                }}
              />
                  
                  {/* Status Indicators - Integrated */}
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 2 }}>
                    {editingCriteria && (
                      <Box sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        px: 1
                      }}>
                        <Typography sx={{ color: '#64748B', fontSize: '0.75rem', fontWeight: 500 }}>
                          Current
                        </Typography>
                        <Typography sx={{ color: '#1E293B', fontSize: '0.8rem', fontWeight: 600 }}>
                          {criteria.find(c => c.id === editingCriteria)?.weight || 0}%
                        </Typography>
                      </Box>
                    )}
                    
                    <Box sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      px: 1
                    }}>
                      <Typography sx={{ color: '#DC2626', fontSize: '0.75rem', fontWeight: 500 }}>
                        Remaining
                      </Typography>
                      <Typography sx={{ color: '#DC2626', fontSize: '0.8rem', fontWeight: 600 }}>
                        {editingCriteria ? getRemainingWeightForEdit(editingCriteria) : getRemainingWeight()}%
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>
            </Grid>
            
            {newCriteria.category === 'Valuation' && (
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                  <Box sx={{ width: '100%', maxWidth: 280 }}>
                    <FormControl fullWidth>
                      <InputLabel sx={{ color: '#64748B', fontWeight: 500, fontSize: '0.875rem' }}>Valuation Type</InputLabel>
                      <Select
                        value={newCriteria.valuationType || ''}
                        onChange={(e) => setNewCriteria({ ...newCriteria, valuationType: e.target.value as 'enterprise' | 'equity' })}
                        label="Valuation Type"
                        MenuProps={{
                          PaperProps: {
                            sx: {
                              borderRadius: 2,
                              mt: 1,
                              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                              border: '1px solid #E2E8F0',
                              '& .MuiMenuItem-root': {
                                px: 2,
                                py: 1.5,
                                fontSize: '0.9rem',
                                color: '#1E293B',
                                fontWeight: 500,
                                borderBottom: '1px solid #F1F5F9',
                                '&:last-child': {
                                  borderBottom: 'none'
                                },
                                '&:hover': {
                                  bgcolor: '#F8FAFC'
                                },
                                '&.Mui-selected': {
                                  bgcolor: '#10B981',
                                  color: 'white',
                                  '&:hover': {
                                    bgcolor: '#059669'
                                  }
                                }
                              }
                            }
                          }
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 0,
                            borderBottom: '1px solid #DADCE0',
                            borderTop: 'none',
                            borderLeft: 'none',
                            borderRight: 'none',
                            minHeight: '56px',
                            '&:hover': {
                              borderBottom: '2px solid #1A73E8'
                            },
                            '&.Mui-focused': {
                              borderBottom: '2px solid #1A73E8',
                              '& fieldset': {
                                border: 'none'
                              }
                            },
                            '& fieldset': {
                              border: 'none'
                            }
                          },
                          '& .MuiSelect-select': {
                            py: 2,
                            fontSize: '1rem',
                            color: '#202124',
                            minHeight: '56px',
                            display: 'flex',
                            alignItems: 'center'
                          }
                        }}
                      >
                        <MenuItem value="enterprise" sx={{ fontSize: '0.875rem' }}>Enterprise Value</MenuItem>
                        <MenuItem value="equity" sx={{ fontSize: '0.875rem' }}>Equity Value</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                </Box>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        
        <DialogActions sx={{ 
          p: 3, 
          background: 'linear-gradient(180deg, #2c2c2c 0%, #1a1a1a 100%)',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)', 
          justifyContent: 'flex-end', 
          gap: 2 
        }}>
          <Button 
            onClick={() => setShowAddCriteria(false)} 
            variant="text"
            sx={{
              color: 'rgba(255, 255, 255, 0.8)',
              textTransform: 'none',
              fontSize: '0.875rem',
              fontWeight: 500,
              px: 3,
              py: 1,
              '&:hover': {
                bgcolor: 'rgba(255, 255, 255, 0.1)',
                color: 'white'
              }
            }}
          >
            Cancel
          </Button>
            <Button
              onClick={handleAddCriteria}
              variant="contained"
              disabled={!newCriteria.field || newCriteria.value === ''}
              sx={{
                bgcolor: '#10B981',
                color: 'white',
                px: 3,
                py: 1,
                textTransform: 'none',
                fontSize: '0.875rem',
                fontWeight: 500,
                borderRadius: 1,
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)',
                '&:hover': { 
                  bgcolor: '#059669',
                  boxShadow: '0 6px 20px rgba(16, 185, 129, 0.4)'
                },
                '&:disabled': {
                  bgcolor: 'rgba(255, 255, 255, 0.2)',
                  color: 'rgba(255, 255, 255, 0.5)'
                }
              }}
            >
              {editingCriteria ? 'Update Criteria' : 'Add Criteria'}
            </Button>
        </DialogActions>
      </Dialog>

      {/* New Thesis Dialog */}
      <Dialog 
        open={showNewThesisDialog} 
        onClose={() => setShowNewThesisDialog(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }
        }}
      >
        <DialogTitle sx={{ 
          background: 'linear-gradient(180deg, #2c2c2c 0%, #1a1a1a 100%)', 
          color: 'white',
          py: 3,
          px: 4,
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          borderTopLeftRadius: 12,
          borderTopRightRadius: 12
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ 
              width: 24, 
              height: 24, 
              borderRadius: '50%', 
              bgcolor: 'white', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}>
              <AddIcon sx={{ color: '#2c2c2c', fontSize: '1rem' }} />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 400, fontSize: '1.25rem', color: 'white' }}>
              Create New Thesis
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ 
            mt: 1, 
            fontSize: '0.9rem', 
            color: 'rgba(255, 255, 255, 0.8)',
            lineHeight: 1.5
          }}>
            Create a new investment thesis. You can start from scratch or duplicate an existing thesis as a template.
          </Typography>
        </DialogTitle>
        
        <DialogContent sx={{ 
          p: 6, 
          bgcolor: '#F8FAFC',
          color: '#1E293B'
        }}>
          <Box sx={{ height: 40 }} />
          
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Thesis Name"
                value={newThesisName}
                onChange={(e) => setNewThesisName(e.target.value)}
                placeholder="e.g., SaaS Growth Thesis, Healthcare Focus"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': {
                      borderColor: '#9CA3AF'
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#000000'
                    }
                  }
                }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel sx={{ color: '#6B7280' }}>Template (Optional)</InputLabel>
                <Select
                  value={templateThesisId}
                  onChange={(e) => setTemplateThesisId(e.target.value)}
                  label="Template (Optional)"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '&:hover fieldset': {
                        borderColor: '#9CA3AF'
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#000000'
                      }
                    }
                  }}
                >
                  <MenuItem value="">Start from scratch</MenuItem>
                  {theses.map((thesis) => (
                    <MenuItem key={thesis.id} value={thesis.id}>
                      {thesis.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        
        <DialogActions sx={{ 
          p: 1, 
          background: 'linear-gradient(180deg, #2c2c2c 0%, #1a1a1a 100%)',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)', 
          justifyContent: 'flex-end', 
          gap: 1,
          borderRadius: '0 0 12px 12px',
          minHeight: 'auto'
        }}>
          <Button 
            onClick={() => setShowNewThesisDialog(false)} 
            variant="text"
            sx={{
              color: 'white',
              px: 3,
              py: 1,
              fontSize: '0.9rem',
              fontWeight: 500,
              '&:hover': {
                bgcolor: 'rgba(255, 255, 255, 0.1)'
              }
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreateNewThesis}
            disabled={!newThesisName.trim()}
            variant="contained"
            sx={{
              bgcolor: '#10B981 !important',
              color: 'white !important',
              px: 3,
              py: 1,
              fontSize: '0.9rem',
              fontWeight: 600,
              borderRadius: 2,
              '&:hover': {
                bgcolor: '#059669 !important'
              },
              '&:disabled': {
                bgcolor: '#9CA3AF !important',
                color: '#FFFFFF !important'
              },
              '&.MuiButton-contained': {
                bgcolor: '#10B981 !important'
              }
            }}
          >
            Create Thesis
          </Button>
        </DialogActions>
      </Dialog>

      {/* Thesis Manager Dialog */}
      <Dialog 
        open={showThesisManager} 
        onClose={() => setShowThesisManager(false)} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }
        }}
      >
        <DialogTitle sx={{ 
          background: 'linear-gradient(180deg, #2c2c2c 0%, #1a1a1a 100%)', 
          color: 'white',
          py: 3,
          px: 4,
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          borderTopLeftRadius: 12,
          borderTopRightRadius: 12
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ 
              width: 24, 
              height: 24, 
              borderRadius: '50%', 
              bgcolor: 'white', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}>
              <EditIcon sx={{ color: '#2c2c2c', fontSize: '1rem' }} />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 400, fontSize: '1.25rem', color: 'white' }}>
              Manage Theses
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ 
            mt: 1, 
            fontSize: '0.9rem', 
            color: 'rgba(255, 255, 255, 0.8)',
            lineHeight: 1.5
          }}>
            Manage your investment theses. You can rename, duplicate, or delete theses.
          </Typography>
        </DialogTitle>
        
        <DialogContent sx={{ 
          p: 6, 
          bgcolor: '#F8FAFC',
          color: '#1E293B'
        }}>
          <Box sx={{ height: 40 }} />
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {theses.map((thesis) => (
              <Paper 
                key={thesis.id} 
                sx={{ 
                  p: 4, 
                  bgcolor: currentThesisId === thesis.id ? '#F1F5F9' : '#FFFFFF', 
                  border: currentThesisId === thesis.id ? '2px solid #10B981' : '1px solid #E2E8F0',
                  borderRadius: 2,
                  transition: 'all 0.2s ease',
                  boxShadow: currentThesisId === thesis.id ? '0 4px 12px rgba(16, 185, 129, 0.15)' : '0 2px 8px rgba(0, 0, 0, 0.1)',
                  '&:hover': {
                    borderColor: currentThesisId === thesis.id ? '#10B981' : '#CBD5E1',
                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)'
                  }
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box sx={{ flex: 1 }}>
                    {editingThesisName === thesis.id ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <TextField
                          size="small"
                          value={editingThesisNameValue}
                          onChange={(e) => setEditingThesisNameValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleSaveThesisName(thesis.id);
                            } else if (e.key === 'Escape') {
                              handleCancelEditThesisName();
                            }
                          }}
                          onBlur={() => handleSaveThesisName(thesis.id)}
                          autoFocus
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              '&:hover fieldset': {
                                borderColor: '#9CA3AF'
                              },
                              '&.Mui-focused fieldset': {
                                borderColor: '#000000'
                              }
                            }
                          }}
                        />
                        <Button
                          size="small"
                          onClick={() => handleSaveThesisName(thesis.id)}
                          sx={{
                            bgcolor: '#000000',
                            color: 'white',
                            minWidth: 'auto',
                            px: 1,
                            '&:hover': { bgcolor: '#333333' }
                          }}
                        >
                          <CheckIcon sx={{ fontSize: '0.8rem' }} />
                        </Button>
                        <Button
                          size="small"
                          onClick={handleCancelEditThesisName}
                          sx={{
                            color: '#EF4444',
                            minWidth: 'auto',
                            px: 1,
                            '&:hover': { bgcolor: '#FEF2F2' }
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </Button>
                      </Box>
                    ) : (
                      <Box
                        sx={{
                          cursor: 'pointer',
                          p: 1,
                          borderRadius: 1,
                          '&:hover': {
                            bgcolor: '#F3F4F6'
                          }
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          console.log('Clicked on thesis name:', thesis.name);
                          handleStartEditThesisName(thesis.id, thesis.name);
                        }}
                      >
                        <Typography 
                          variant="h6" 
                          sx={{ 
                            fontWeight: 600, 
                            color: '#1E293B',
                            fontSize: '1.1rem',
                            mb: 1
                          }}
                        >
                          {thesis.name}
                        </Typography>
                        <Typography variant="caption" sx={{ 
                          color: '#64748B',
                          fontSize: '0.75rem',
                          fontWeight: 500,
                          mb: 1,
                          display: 'block'
                        }}>
                          Click to edit name
                        </Typography>
                      </Box>
                    )}
                    <Typography variant="body2" sx={{ 
                      color: '#64748B',
                      fontSize: '0.8rem',
                      fontWeight: 500,
                      mt: 2
                    }}>
                      {thesis.criteria.length} criteria • Updated {thesis.updatedAt.toLocaleDateString()}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', pt: 1 }}>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => {
                        setTemplateThesisId(thesis.id);
                        setNewThesisName(`${thesis.name} Copy`);
                        setShowThesisManager(false);
                        setShowNewThesisDialog(true);
                      }}
                      sx={{
                        borderColor: '#D1D5DB',
                        color: '#374151',
                        '&:hover': {
                          borderColor: '#9CA3AF',
                          bgcolor: '#F9FAFB'
                        }
                      }}
                    >
                      Duplicate
                    </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => handleDeleteThesis(thesis.id)}
                        sx={{
                          borderColor: '#EF4444',
                          color: '#EF4444',
                        minWidth: 'auto',
                        px: 1,
                          '&:hover': {
                            borderColor: '#DC2626',
                            bgcolor: '#FEF2F2'
                          }
                        }}
                      >
                      <DeleteIcon sx={{ fontSize: '0.8rem' }} />
                      </Button>
                  </Box>
                </Box>
              </Paper>
            ))}
          </Box>
        </DialogContent>
        
        <DialogActions sx={{ 
          p: 1, 
          background: 'linear-gradient(180deg, #2c2c2c 0%, #1a1a1a 100%)',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)', 
          justifyContent: 'flex-end', 
          gap: 1,
          borderRadius: '0 0 12px 12px',
          minHeight: 'auto'
        }}>
          <Button 
            onClick={() => setShowThesisManager(false)} 
            variant="text"
            sx={{
              color: 'rgba(255, 255, 255, 0.8)',
              textTransform: 'none',
              fontSize: '0.8rem',
              fontWeight: 500,
              px: 2,
              py: 0.5,
              minHeight: 'auto',
              '&:hover': {
                bgcolor: 'rgba(255, 255, 255, 0.1)',
                color: 'white'
              }
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Data Source Selection Dialog */}
      <Dialog 
        open={showDataSourceDialog} 
        onClose={() => setShowDataSourceDialog(false)} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle sx={{ 
          bgcolor: '#000000', 
          color: 'white',
          py: 3,
          display: 'flex',
          alignItems: 'center',
          gap: 2
        }}>
          <CloudUploadIcon />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Select Data Sources
            </Typography>
            <Typography variant="body2" sx={{ color: '#D1D5DB', mt: 0.5 }}>
              Choose data sources for generating the one-pager for {selectedCompany}
            </Typography>
          </Box>
        </DialogTitle>
        
        <DialogContent sx={{ p: 4 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Select which data sources you want to use for generating the one-pager. You can choose from your Google Drive folders and/or upload additional files.
          </Typography>
          
          {/* Google Drive Section */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#000000' }}>
              Google Drive Folders
            </Typography>
            
            {googleDriveFolders.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 3 }}>
                <FolderIcon sx={{ fontSize: 48, color: '#9CA3AF', mb: 2 }} />
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {loadingFolders ? 'Loading your Google Drive folders...' : 'No Google Drive folders loaded yet'}
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={loadingFolders ? <RefreshIcon className="animate-spin" /> : <FolderIcon />}
                  onClick={handleLoadGoogleDriveFolders}
                  disabled={loadingFolders}
                  sx={{
                    borderColor: '#000000',
                    color: '#000000',
                    '&:hover': {
                      borderColor: '#333333',
                      bgcolor: '#F9FAFB'
                    },
                    '&:disabled': {
                      borderColor: '#9CA3AF',
                      color: '#9CA3AF'
                    }
                  }}
                >
                  {loadingFolders ? 'Loading...' : 'Load Google Drive Folders'}
                </Button>
              </Box>
            ) : (
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ color: '#000000' }}>
                    {googleDriveFolders.length} folder(s) found
                  </Typography>
                  <Button
                    size="small"
                    startIcon={<RefreshIcon />}
                    onClick={handleLoadGoogleDriveFolders}
                    disabled={loadingFolders}
                    sx={{
                      color: '#000000',
                      '&:hover': { bgcolor: '#F3F4F6' },
                      '&:disabled': { color: '#9CA3AF' }
                    }}
                  >
                    Refresh
                  </Button>
                </Box>
                <FormControl fullWidth>
                  <InputLabel>Select Google Drive Folder</InputLabel>
                  <Select
                    value={selectedGoogleDriveFolder}
                    onChange={(e) => setSelectedGoogleDriveFolder(e.target.value)}
                    label="Select Google Drive Folder"
                  >
                    <MenuItem value="">
                      <em>None</em>
                    </MenuItem>
                    {googleDriveFolders.map((folder) => (
                      <MenuItem key={folder} value={folder}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <FolderIcon fontSize="small" />
                          {folder}
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            )}
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* File Upload Section */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#000000' }}>
              Upload Additional Files
            </Typography>
            
            <Box sx={{ mb: 2 }}>
              <input
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
                style={{ display: 'none' }}
                id="file-upload"
                multiple
                type="file"
                onChange={handleFileUpload}
              />
              <label htmlFor="file-upload">
                <Button
                  variant="outlined"
                  component="span"
                  startIcon={<CloudUploadIcon />}
                  sx={{
                    borderColor: '#000000',
                    color: '#000000',
                    '&:hover': {
                      borderColor: '#333333',
                      bgcolor: '#F9FAFB'
                    }
                  }}
                >
                  Choose Files
                </Button>
              </label>
              <Typography variant="caption" sx={{ color: '#6B7280', ml: 2 }}>
                Supported formats: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT
              </Typography>
            </Box>

            {uploadedFiles.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: '#000000' }}>
                  Uploaded Files:
                </Typography>
                {uploadedFiles.map((file, index) => (
                  <Box
                    key={index}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      p: 2,
                      border: '1px solid #E5E7EB',
                      borderRadius: 1,
                      mb: 1,
                      bgcolor: '#F9FAFB'
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <AttachFileIcon fontSize="small" color="action" />
                      <Typography variant="body2" sx={{ color: '#000000' }}>
                        {file.name}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#6B7280' }}>
                        ({(file.size / 1024 / 1024).toFixed(2)} MB)
                      </Typography>
                    </Box>
                    <IconButton
                      size="small"
                      onClick={() => handleRemoveFile(index)}
                      sx={{ color: '#EF4444' }}
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </Box>
                ))}
              </Box>
            )}
          </Box>

          {/* Summary */}
          <Box sx={{ 
            p: 3, 
            bgcolor: '#F3F4F6', 
            borderRadius: 2,
            border: '1px solid #E5E7EB'
          }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: '#000000' }}>
              Data Sources Summary:
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {selectedGoogleDriveFolder && `• Google Drive: ${selectedGoogleDriveFolder}`}
              {selectedGoogleDriveFolder && uploadedFiles.length > 0 && <br />}
              {uploadedFiles.length > 0 && `• ${uploadedFiles.length} uploaded file(s)`}
              {!selectedGoogleDriveFolder && uploadedFiles.length === 0 && 'No data sources selected'}
            </Typography>
          </Box>
        </DialogContent>
        
        <DialogActions sx={{ p: 4, bgcolor: '#F9FAFB', borderTop: '1px solid #E5E7EB' }}>
          <Button 
            onClick={() => setShowDataSourceDialog(false)} 
            variant="outlined"
            sx={{
              borderColor: '#D1D5DB',
              color: '#374151',
              '&:hover': {
                borderColor: '#9CA3AF',
                bgcolor: '#F9FAFB'
              }
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleConfirmDataSource}
            variant="contained"
            disabled={!selectedGoogleDriveFolder && uploadedFiles.length === 0}
            sx={{
              bgcolor: '#10B981',
              color: 'white',
              '&:hover': { bgcolor: '#059669' },
              '&:disabled': { bgcolor: '#9CA3AF' }
            }}
          >
            Generate One-Pager
          </Button>
        </DialogActions>
      </Dialog>

      {/* Template Preview Dialog */}
      <Dialog
        open={showTemplatePreview}
        onClose={() => setShowTemplatePreview(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: { height: '90vh' }
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Template Preview - {selectedTemplate === 'basic' ? 'Basic Template' : selectedTemplate === 'industry_navy' ? 'Industry Navy' : selectedTemplate === 'personal_navy' ? 'Personal Navy' : selectedTemplate}
          </Typography>
          <IconButton onClick={() => setShowTemplatePreview(false)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          <Box sx={{ height: '100%', width: '100%' }}>
            <iframe
              src={`/.claude/one_pager_templates/${selectedTemplate}.pdf`}
              width="100%"
              height="100%"
              style={{ border: 'none' }}
              title="Template Preview"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setShowTemplatePreview(false)}
            variant="outlined"
            sx={{
              borderColor: '#000000',
              color: '#000000',
              '&:hover': {
                borderColor: '#333333',
                bgcolor: '#F5F5F5'
              }
            }}
          >
            Close Preview
          </Button>
        </DialogActions>
      </Dialog>

      {/* Industry Template Preview Dialog */}
      <Dialog
        open={showIndustryTemplatePreview}
        onClose={() => setShowIndustryTemplatePreview(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: { height: '90vh' }
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Industry Template Preview - {selectedIndustryTemplate === 'basic' ? 'Basic Template' : selectedIndustryTemplate === 'industry_navy' ? 'Navy Blue' : selectedIndustryTemplate}
          </Typography>
          <IconButton onClick={() => setShowIndustryTemplatePreview(false)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          <Box sx={{ height: '100%', width: '100%' }}>
            <iframe
              src={`/.claude/one_pager_templates/${selectedIndustryTemplate === 'industry_navy' ? 'industry_navy' : selectedIndustryTemplate}.pdf`}
              width="100%"
              height="100%"
              style={{ border: 'none' }}
              title="Industry Template Preview"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setShowIndustryTemplatePreview(false)}
            variant="outlined"
            sx={{
              borderColor: '#000000',
              color: '#000000',
              '&:hover': {
                borderColor: '#333333',
                bgcolor: '#F5F5F5'
              }
            }}
          >
            Close Preview
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MyThesis;
