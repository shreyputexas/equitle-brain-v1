import React, { useState, useEffect } from 'react';
import integrationService from '../services/integrationService';
import { db } from '../lib/firebase';
import { collection, doc, getDocs, addDoc, updateDoc, deleteDoc, query, orderBy, Timestamp, getDoc } from 'firebase/firestore';
import { onePagerApi } from '../services/onePagerApi';
import type { OnePagerRequest } from '../services/onePagerApi';
import { searcherProfilesApi } from '../services/searcherProfilesApi';
import { getUserId } from '../utils/auth';
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

  // Load theses on component mount
  useEffect(() => {
    const loadTheses = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('🔄 Loading investment theses...');

        const userId = getUserId();
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

        const userId = getUserId();
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
    if (theses.length > 1) {
      try {
        const userId = getUserId();
        const thesisRef = doc(db, 'users', userId, 'investmentTheses', thesisId);
        await deleteDoc(thesisRef);

        const updatedTheses = theses.filter(t => t.id !== thesisId);
        setTheses(updatedTheses);
        if (currentThesisId === thesisId) {
          setCurrentThesisId(updatedTheses[0].id);
          setCriteria([...updatedTheses[0].criteria]);
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
        const userId = getUserId();
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
      const userId = getUserId();
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
      const userId = getUserId();
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
        const userId = getUserId();
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
      const response = await fetch('/api/one-pager/generate-basic-document', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          thesisData,
          selectedIndustry: industryToUse,
          template: templateValue
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to generate industry research');
      }

      // Get the file blob
      const blob = await response.blob();
      
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
          <LinearProgress sx={{ mb: 2, width: 300 }} />
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

        const userId = getUserId();
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
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 600, mb: 1, color: '#000000' }}>
              My Investment Thesis
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Define your investment criteria and generate comprehensive one-pagers for potential acquisitions
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Thesis</InputLabel>
              <Select
                value={currentThesisId}
                onChange={(e) => handleThesisChange(e.target.value)}
                label="Thesis"
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
                {theses.map((thesis) => (
                  <MenuItem key={thesis.id} value={thesis.id}>
                    {thesis.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => setShowNewThesisDialog(true)}
              sx={{
                borderColor: '#D1D5DB',
                color: '#374151',
                '&:hover': {
                  borderColor: '#9CA3AF',
                  bgcolor: '#F9FAFB'
                }
              }}
            >
              New Thesis
            </Button>
            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={() => setShowThesisManager(true)}
              sx={{
                borderColor: '#D1D5DB',
                color: '#374151',
                '&:hover': {
                  borderColor: '#9CA3AF',
                  bgcolor: '#F9FAFB'
                }
              }}
            >
              Manage
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Investment Criteria Section - Full Width */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#000000' }}>
                Investment Criteria
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Weight: {getTotalWeight()}% {getTotalWeight() < 100 && `(${getRemainingWeight()}% remaining)`}
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleOpenAddCriteria}
              disabled={getTotalWeight() >= 100}
              sx={{
                bgcolor: '#000000',
                color: 'white',
                '&:hover': { bgcolor: '#333333' },
                '&:disabled': { bgcolor: '#9CA3AF' }
              }}
            >
              Add Criteria
            </Button>
          </Box>

          {/* Investment Criteria Visualization */}
          {criteria.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#000000' }}>
                Investment Criteria Breakdown
              </Typography>
              
              {/* Weighted Bar Visualization */}
              <Paper sx={{ p: 3, bgcolor: '#F9FAFB', border: '1px solid #E5E7EB' }}>
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
                    const colors = [
                      '#000000', // Black
                      '#6B7280', // Gray
                      '#374151', // Dark Gray
                      '#4B5563', // Medium Gray
                      '#1F2937', // Very Dark Gray
                      '#111827'  // Almost Black
                    ];
                    const color = colors[index % colors.length];
                    const width = criterion.weight;
                    
                    return (
                      <Box
                        key={criterion.id}
                        onClick={() => handleEditCriteria(criterion)}
                        sx={{
                          width: `${width}%`,
                          height: '100%',
                          bgcolor: color,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          position: 'relative',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            opacity: 0.8,
                            transform: 'scaleY(1.05)'
                          }
                        }}
                      >
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: 'white', 
                            fontWeight: 600,
                            textAlign: 'center',
                            px: 1,
                            textShadow: '0 1px 2px rgba(0,0,0,0.5)'
                          }}
                        >
                          {criterion.field}
                        </Typography>
                        
                        {/* Weight percentage overlay */}
                        <Box
                          sx={{
                            position: 'absolute',
                            top: 4,
                            right: 4,
                            bgcolor: 'rgba(255,255,255,0.2)',
                            borderRadius: 1,
                            px: 1,
                            py: 0.5,
                            cursor: 'pointer',
                            '&:hover': {
                              bgcolor: 'rgba(255,255,255,0.3)'
                            }
                          }}
                          onClick={() => handleWeightEdit(criterion.id, criterion.weight)}
                        >
                          <Typography variant="caption" sx={{ color: 'white', fontWeight: 600, fontSize: '0.7rem' }}>
                            {criterion.weight}%
                          </Typography>
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
                
                {/* Legend */}
                <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {criteria.map((criterion, index) => {
                    const colors = [
                      '#000000', '#6B7280', '#374151', '#4B5563', '#1F2937', '#111827'
                    ];
                    const color = colors[index % colors.length];
                    
                    return (
                      <Box
                        key={criterion.id}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          p: 1,
                          bgcolor: '#FFFFFF',
                          borderRadius: 1,
                          border: '1px solid #E5E7EB',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            bgcolor: '#F9FAFB',
                            borderColor: '#D1D5DB'
                          }
                        }}
                        onClick={() => handleEditCriteria(criterion)}
                      >
                        <Box
                          sx={{
                            width: 12,
                            height: 12,
                            bgcolor: color,
                            borderRadius: 0.5
                          }}
                        />
                        <Typography variant="caption" sx={{ fontWeight: 500, color: '#000000' }}>
                          {criterion.field} 
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
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              fontWeight: 500, 
                              color: '#000000',
                              cursor: 'pointer',
                              px: 1,
                              py: 0.5,
                              borderRadius: 1,
                              '&:hover': {
                                bgcolor: '#F3F4F6'
                              }
                            }}
                            onClick={() => handleWeightEdit(criterion.id, criterion.weight)}
                          >
                            ({criterion.weight}%)
                          </Typography>
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
              </Paper>
            </Box>
          )}

          {/* Traditional List View (Collapsible) */}
          <Box sx={{ mb: 2 }}>
            <Button
              onClick={() => setShowTraditionalView(!showTraditionalView)}
              variant="outlined"
              size="small"
              sx={{
                borderColor: '#D1D5DB',
                color: '#6B7280',
                '&:hover': {
                  borderColor: '#9CA3AF',
                  bgcolor: '#F9FAFB'
                }
              }}
            >
              {showTraditionalView ? 'Hide' : 'Show'} Traditional View
            </Button>
          </Box>

          {showTraditionalView && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {criteria.map((criterion, index) => (
                <Paper 
                  key={criterion.id} 
                  sx={{ 
                    p: 2, 
                    bgcolor: '#FFFFFF', 
                    border: '1px solid #E5E7EB',
                    borderRadius: 2,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      borderColor: '#D1D5DB',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                        <Chip 
                          label={criterion.category} 
                          size="small" 
                          sx={{ 
                            bgcolor: '#E5E7EB', 
                            color: '#000000',
                            fontWeight: 600,
                            fontSize: '0.75rem',
                            height: 24
                          }} 
                        />
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#000000' }}>
                          {criterion.field}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#6B7280' }}>
                          {criterion.operator}
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 500, color: '#000000' }}>
                          {criterion.value}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ minWidth: 'fit-content' }}>
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
                                // Only allow numbers
                                const value = e.target.value.replace(/[^0-9]/g, '');
                                e.target.value = value;
                              }}
                              inputProps={{
                                style: { 
                                  fontSize: '0.75rem',
                                  padding: '4px 8px',
                                  width: '50px',
                                  textAlign: 'center',
                                  MozAppearance: 'textfield',
                                  WebkitAppearance: 'none',
                                  appearance: 'none'
                                }
                              }}
                              sx={{
                                '& .MuiOutlinedInput-root': {
                                  height: '24px',
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
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              fontWeight: 500, 
                              color: '#000000',
                              cursor: 'pointer',
                              px: 1,
                              py: 0.5,
                              borderRadius: 1,
                              minWidth: 'fit-content',
                              '&:hover': {
                                bgcolor: '#F3F4F6'
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
                            height: 4,
                            borderRadius: 2,
                            bgcolor: '#F3F4F6',
                            '& .MuiLinearProgress-bar': {
                              background: 'linear-gradient(90deg, #6B7280 0%, #000000 100%)',
                              borderRadius: 2
                            }
                          }}
                        />
                      </Box>
                    </Box>
                    
                    <Box sx={{ display: 'flex', gap: 0.5, ml: 1 }}>
                      <IconButton
                        onClick={() => handleEditCriteria(criterion)}
                        size="small"
                        sx={{ 
                          color: '#6B7280',
                          bgcolor: '#F9FAFB',
                          '&:hover': {
                            bgcolor: '#F3F4F6',
                            color: '#000000'
                          }
                        }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        onClick={() => handleDeleteCriteria(criterion.id)}
                        size="small"
                        sx={{ 
                          color: '#EF4444',
                          bgcolor: '#FEF2F2',
                          '&:hover': {
                            bgcolor: '#FEE2E2'
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

      {/* One-Pager Generation Section */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: '#000000' }}>
            Generate One-Pager
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Search for Company"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Select Company</InputLabel>
                <Select
                  value={selectedCompany}
                  onChange={(e) => setSelectedCompany(e.target.value)}
                  label="Select Company"
                >
                  <MenuItem value="TechCorp Solutions">TechCorp Solutions</MenuItem>
                  <MenuItem value="DataFlow Inc">DataFlow Inc</MenuItem>
                  <MenuItem value="CloudScale Systems">CloudScale Systems</MenuItem>
                  <MenuItem value="AI Dynamics">AI Dynamics</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
            <Button
              variant="contained"
              startIcon={<AutoAwesomeIcon />}
              onClick={handleGenerateOnePager}
              disabled={isGenerating || !selectedCompany}
              size="large"
              sx={{
                bgcolor: '#000000',
                color: 'white',
                px: 4,
                py: 1.5,
                '&:hover': { bgcolor: '#333333' },
                '&:disabled': { bgcolor: '#9CA3AF' }
              }}
            >
              {isGenerating ? 'Generating...' : 'Generate One-Pager'}
            </Button>
          </Box>

          {isGenerating && (
            <Box sx={{ mt: 3 }}>
              <LinearProgress sx={{ mb: 1 }} />
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                Analyzing company data and generating comprehensive report...
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Personal Pitch One Pager Generator */}
      <Card sx={{ mt: 4 }}>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: '#000000' }}>
            Personal Pitch One-Pager Generator
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Select Thesis</InputLabel>
                <Select
                  value={selectedThesisForPitch}
                  onChange={(e) => setSelectedThesisForPitch(e.target.value)}
                  label="Select Thesis"
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
                bgcolor: '#000000',
                color: 'white',
                px: 4,
                py: 1.5,
                '&:hover': { bgcolor: '#333333' },
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
      <Card sx={{ mt: 4 }}>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: '#000000' }}>
            Industry Overview One-Pager Generator
          </Typography>

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
                      bgcolor: '#000000',
                      color: 'white',
                      px: 4,
                      py: 1.5,
                      '&:hover': { bgcolor: '#333333' },
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
                  {generatedOnePager.companyName} - Investment Analysis
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
            borderRadius: 3,
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }
        }}
      >
        <DialogTitle sx={{ 
          bgcolor: '#000000', 
          color: 'white',
          py: 3,
          px: 4,
          borderTopLeftRadius: 12,
          borderTopRightRadius: 12
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <AddIcon />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {editingCriteria ? 'Edit Investment Criteria' : 'Add Investment Criteria'}
            </Typography>
          </Box>
        </DialogTitle>
        
        <DialogContent sx={{ p: 4 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {editingCriteria 
              ? 'Modify the selected investment criterion. Changes will be applied immediately.'
              : 'Define a new investment criterion to add to your thesis. Each criterion will be weighted and used in the one-pager generation process.'
            }
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel sx={{ color: '#6B7280' }}>Category</InputLabel>
                <Select
                  value={newCriteria.category}
                  onChange={(e) => setNewCriteria({ ...newCriteria, category: e.target.value })}
                  label="Category"
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
                  {categories.map((category) => (
                    <MenuItem key={category} value={category}>
                      {category}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Field Name"
                value={newCriteria.field}
                onChange={(e) => setNewCriteria({ ...newCriteria, field: e.target.value })}
                placeholder="e.g., Revenue, EBITDA, Industry"
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
            
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel sx={{ color: '#6B7280' }}>Operator</InputLabel>
                <Select
                  value={newCriteria.operator}
                  onChange={(e) => setNewCriteria({ ...newCriteria, operator: e.target.value })}
                  label="Operator"
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
                  {operators.map((op) => (
                    <MenuItem key={op} value={op}>
                      {op}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Value"
                value={newCriteria.value}
                onChange={(e) => setNewCriteria({ ...newCriteria, value: e.target.value })}
                placeholder="e.g., 1000000, Technology, North America"
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
            
            {newCriteria.category === 'Valuation' && (
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel sx={{ color: '#6B7280' }}>Valuation Type</InputLabel>
                  <Select
                    value={newCriteria.valuationType || ''}
                    onChange={(e) => setNewCriteria({ ...newCriteria, valuationType: e.target.value as 'enterprise' | 'equity' })}
                    label="Valuation Type"
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
                    <MenuItem value="enterprise">Enterprise Value</MenuItem>
                    <MenuItem value="equity">Equity Value</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            )}
            
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Weight (%)"
                type="text"
                value={newCriteria.weight}
                onChange={(e) => {
                  // Only allow numbers
                  const value = e.target.value.replace(/[^0-9]/g, '');
                  setNewCriteria({ ...newCriteria, weight: parseInt(value) || 0 });
                }}
                helperText={
                  editingCriteria 
                    ? `How important is this criterion (0-100%). Current: ${criteria.find(c => c.id === editingCriteria)?.weight || 0}%, Remaining: ${getRemainingWeightForEdit(editingCriteria)}%`
                    : `Max: ${getRemainingWeight()}% (${getTotalWeight()}% already allocated)`
                }
                error={editingCriteria ? false : (newCriteria.weight || 0) > getRemainingWeight()}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': {
                      borderColor: '#9CA3AF'
                    },
                    '&.Mui-focused fieldset': {
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
            </Grid>
          </Grid>
        </DialogContent>
        
        <DialogActions sx={{ p: 4, bgcolor: '#F9FAFB', borderTop: '1px solid #E5E7EB' }}>
          <Button 
            onClick={() => setShowAddCriteria(false)} 
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
              onClick={handleAddCriteria}
              variant="contained"
              disabled={!newCriteria.field || newCriteria.value === ''}
              sx={{
                bgcolor: '#000000',
                color: 'white',
                px: 3,
                '&:hover': { 
                  bgcolor: '#333333' 
                },
                '&:disabled': {
                  bgcolor: '#9CA3AF',
                  color: '#FFFFFF'
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
          bgcolor: '#000000', 
          color: 'white',
          py: 3,
          px: 4,
          borderTopLeftRadius: 12,
          borderTopRightRadius: 12
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <AddIcon />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Create New Thesis
            </Typography>
          </Box>
        </DialogTitle>
        
        <DialogContent sx={{ p: 4 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Create a new investment thesis. You can start from scratch or duplicate an existing thesis as a template.
          </Typography>
          
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
        
        <DialogActions sx={{ p: 4, bgcolor: '#F9FAFB', borderTop: '1px solid #E5E7EB' }}>
          <Button 
            onClick={() => setShowNewThesisDialog(false)} 
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
            onClick={handleCreateNewThesis}
            variant="contained"
            disabled={!newThesisName.trim()}
            sx={{
              bgcolor: '#000000',
              color: 'white',
              px: 3,
              '&:hover': { 
                bgcolor: '#333333' 
              },
              '&:disabled': {
                bgcolor: '#9CA3AF',
                color: '#FFFFFF'
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
          bgcolor: '#000000', 
          color: 'white',
          py: 3,
          px: 4,
          borderTopLeftRadius: 12,
          borderTopRightRadius: 12
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <EditIcon />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Manage Theses
            </Typography>
          </Box>
        </DialogTitle>
        
        <DialogContent sx={{ p: 4 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Manage your investment theses. You can rename, duplicate, or delete theses.
          </Typography>
          
          {/* Debug info */}
          <Typography variant="caption" sx={{ color: '#6B7280', mb: 2, display: 'block' }}>
            Debug: editingThesisName = {editingThesisName || 'null'}, editingThesisNameValue = {editingThesisNameValue || 'empty'}
          </Typography>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {theses.map((thesis) => (
              <Paper 
                key={thesis.id} 
                sx={{ 
                  p: 3, 
                  bgcolor: currentThesisId === thesis.id ? '#F9FAFB' : '#FFFFFF', 
                  border: currentThesisId === thesis.id ? '2px solid #000000' : '1px solid #E5E7EB',
                  borderRadius: 2,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    borderColor: '#D1D5DB'
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
                          onKeyPress={(e) => handleThesisNameKeyPress(e, thesis.id)}
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
                          <CheckIcon fontSize="small" />
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
                            color: '#000000',
                            mb: 0
                          }}
                        >
                          {thesis.name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#6B7280' }}>
                          Click to edit name
                        </Typography>
                      </Box>
                    )}
                    <Typography variant="body2" color="text.secondary">
                      {thesis.criteria.length} criteria • Updated {thesis.updatedAt.toLocaleDateString()}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', gap: 1 }}>
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
                    {theses.length > 1 && (
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => handleDeleteThesis(thesis.id)}
                        sx={{
                          borderColor: '#EF4444',
                          color: '#EF4444',
                          '&:hover': {
                            borderColor: '#DC2626',
                            bgcolor: '#FEF2F2'
                          }
                        }}
                      >
                        Delete
                      </Button>
                    )}
                  </Box>
                </Box>
              </Paper>
            ))}
          </Box>
        </DialogContent>
        
        <DialogActions sx={{ p: 4, bgcolor: '#F9FAFB', borderTop: '1px solid #E5E7EB' }}>
          <Button 
            onClick={() => setShowThesisManager(false)} 
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
              bgcolor: '#000000',
              color: 'white',
              '&:hover': { bgcolor: '#333333' },
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
