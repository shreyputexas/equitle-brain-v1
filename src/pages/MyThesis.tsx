import React, { useState } from 'react';
import integrationService from '../services/integrationService';
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
  Check as CheckIcon,
  CloudUpload as CloudUploadIcon,
  Folder as FolderIcon,
  AttachFile as AttachFileIcon,
  Close as CloseIcon
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
  const [theses, setTheses] = useState<InvestmentThesis[]>([
    {
      id: '1',
      name: 'Tech Growth Thesis',
      criteria: [
        {
          id: '1',
          category: 'Financial',
          field: 'Revenue',
          value: 10000000,
          operator: '>=',
          weight: 30
        },
        {
          id: '2',
          category: 'Financial',
          field: 'EBITDA',
          value: 2000000,
          operator: '>=',
          weight: 25
        },
        {
          id: '3',
          category: 'Market',
          field: 'Industry',
          value: 'Technology',
          operator: '=',
          weight: 20
        },
        {
          id: '4',
          category: 'Geographic',
          field: 'Location',
          value: 'North America',
          operator: '=',
          weight: 15
        },
        {
          id: '5',
          category: 'Team',
          field: 'Employee Count',
          value: 50,
          operator: '>=',
          weight: 10
        }
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ]);

  const [currentThesisId, setCurrentThesisId] = useState<string>('1');
  const [criteria, setCriteria] = useState<InvestmentCriteria[]>([]);

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
  const [selectedCompany, setSelectedCompany] = useState<string>('');
  const [showDataSourceDialog, setShowDataSourceDialog] = useState(false);
  const [selectedGoogleDriveFolder, setSelectedGoogleDriveFolder] = useState<string>('');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [googleDriveFolders, setGoogleDriveFolders] = useState<string[]>([]);
  const [loadingFolders, setLoadingFolders] = useState(false);

  const categories = ['Financial', 'Market', 'Geographic', 'Team', 'Technology', 'Operational', 'Valuation', 'Subindustry', 'Growth Rate'];
  const operators = ['>=', '<=', '=', '!=', 'contains', 'not contains'];
  const valuationTypes = ['Enterprise Value', 'Equity Value'];

  const getTotalWeight = () => {
    return criteria.reduce((sum, criterion) => sum + criterion.weight, 0);
  };

  const getRemainingWeight = () => {
    return 100 - getTotalWeight();
  };

  const handleAddCriteria = () => {
    if (newCriteria.field && newCriteria.value !== '') {
      const newWeight = newCriteria.weight || 10;
      const currentTotal = getTotalWeight();
      
      if (editingCriteria) {
        // Update existing criteria
        const existingCriterion = criteria.find(c => c.id === editingCriteria);
        const weightDifference = newWeight - (existingCriterion?.weight || 0);
        const newTotal = currentTotal + weightDifference;
        
        if (newTotal > 100) {
          alert(`Total weight cannot exceed 100%. Current total would be ${newTotal}%. Please reduce the weight.`);
          return;
        }
        
        setCriteria(criteria.map(c => 
          c.id === editingCriteria 
            ? {
                ...c,
                category: newCriteria.category || 'Financial',
                field: newCriteria.field,
                value: newCriteria.value,
                operator: newCriteria.operator || '>=',
                weight: newWeight,
                valuationType: newCriteria.valuationType
              }
            : c
        ));
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
          field: newCriteria.field,
          value: newCriteria.value,
          operator: newCriteria.operator || '>=',
          weight: newWeight,
          valuationType: newCriteria.valuationType
        };
        setCriteria([...criteria, newCriterion]);
      }
      
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

  const handleDeleteCriteria = (id: string) => {
    setCriteria(criteria.filter(c => c.id !== id));
  };

  const handleWeightEdit = (criterionId: string, currentWeight: number) => {
    setEditingWeight(criterionId);
  };

  const handleWeightChange = (criterionId: string, newWeight: number) => {
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

    setCriteria(criteria.map(c => 
      c.id === criterionId 
        ? { ...c, weight: newWeight }
        : c
    ));
    setEditingWeight(null);
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

  const handleCreateNewThesis = () => {
    if (newThesisName.trim()) {
      const newThesis: InvestmentThesis = {
        id: Date.now().toString(),
        name: newThesisName.trim(),
        criteria: templateThesisId ? 
          [...theses.find(t => t.id === templateThesisId)?.criteria || []] : 
          [],
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      setTheses([...theses, newThesis]);
      setCurrentThesisId(newThesis.id);
      setCriteria([...newThesis.criteria]);
      setNewThesisName('');
      setTemplateThesisId('');
      setShowNewThesisDialog(false);
    }
  };

  const handleDeleteThesis = (thesisId: string) => {
    if (theses.length > 1) {
      const updatedTheses = theses.filter(t => t.id !== thesisId);
      setTheses(updatedTheses);
      if (currentThesisId === thesisId) {
        setCurrentThesisId(updatedTheses[0].id);
        setCriteria([...updatedTheses[0].criteria]);
      }
    }
  };

  const handleStartEditThesisName = (thesisId: string, currentName: string) => {
    console.log('Starting edit for thesis:', thesisId, 'with name:', currentName);
    setEditingThesisName(thesisId);
    setEditingThesisNameValue(currentName);
  };

  const handleSaveThesisName = (thesisId: string) => {
    if (editingThesisNameValue.trim()) {
      setTheses(theses.map(t => 
        t.id === thesisId 
          ? { ...t, name: editingThesisNameValue.trim(), updatedAt: new Date() }
          : t
      ));
      setEditingThesisName(null);
      setEditingThesisNameValue('');
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

  const handleUpdateThesis = () => {
    setTheses(theses.map(t => 
      t.id === currentThesisId 
        ? { ...t, criteria: [...criteria], updatedAt: new Date() }
        : t
    ));
  };

  // Update criteria when it changes
  React.useEffect(() => {
    handleUpdateThesis();
  }, [criteria]);

  const handleGenerateOnePager = async () => {
    if (!selectedCompany.trim()) {
      alert('Please enter a company name');
      return;
    }

    // Show data source selection dialog first
    setShowDataSourceDialog(true);
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
    </Box>
  );
};

export default MyThesis;
