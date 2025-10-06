import React, { useState, useRef, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Grid,
  Card,
  CardContent,
  LinearProgress,
  Alert,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
  Snackbar,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  Badge,
  CardActions,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  Search as SearchIcon,
  Download as DownloadIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LinkedIn as LinkedInIcon,
  LocationOn as LocationIcon,
  Photo as PhotoIcon,
  Close as CloseIcon,
  Refresh as RefreshIcon,
  FileDownload as FileDownloadIcon,
  DataUsage as DataUsageIcon,
  Info as InfoIcon,
  GetApp as GetAppIcon
} from '@mui/icons-material';

interface EnrichedContact {
  id: string;
  original: {
    given: string;
    company: string;
    website: string;
    phone: string;
    email: string;
  };
  enriched: {
    name: string;
    email?: string;
    phone?: string;
    title?: string;
    company?: string;
    linkedin?: string;
    location?: string;
    photo?: string;
    organization?: any;
    website?: string;
  } | null;
  success: boolean;
  error?: string;
}

interface ScrapingResults {
  results: EnrichedContact[];
  summary: {
    total: number;
    successful: number;
    failed: number;
    successRate: number;
  };
}

interface ThesisCriteria {
  ebitda: string;
  revenue: string;
  industries: string;
  subindustries: string;
  location: string;
  growth: string;
}

interface DiscoveredContact {
  id: string;
  name: string;
  first_name: string;
  last_name: string;
  title: string;
  email: string;
  phone: string;
  linkedin_url: string;
  company: string;
  company_domain: string;
  company_industry: string;
  company_size: string;
  location: string;
  match_quality: string;
  apollo_confidence: number;
  email_status: string;
  email_unlocked: boolean;
}

export default function DataEnrichment() {
  const [apolloApiKey, setApolloApiKey] = useState('');
  const [isValidatingKey, setIsValidatingKey] = useState(false);
  const [isKeyValid, setIsKeyValid] = useState<boolean | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<ScrapingResults | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [message, setMessage] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Thesis-related state
  const [activeTab, setActiveTab] = useState(0);
  const [thesisCriteria, setThesisCriteria] = useState<ThesisCriteria>(() => {
    // Load from localStorage on component mount
    const saved = localStorage.getItem('thesisCriteria');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (error) {
        console.error('Failed to parse saved thesis criteria:', error);
      }
    }
    return {
      ebitda: '',
      revenue: '',
      industries: '',
      subindustries: '',
      location: '',
      growth: ''
    };
  });
  const [discoveredContacts, setDiscoveredContacts] = useState<DiscoveredContact[]>([]);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [discoveryResults, setDiscoveryResults] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [contactsToFind, setContactsToFind] = useState<number>(10);

  const handleContactSearch = async () => {
    if (!thesisCriteria.industries.trim() && !thesisCriteria.subindustries.trim()) {
      setMessage('Please enter at least Industries or Subindustries');
      setShowError(true);
      return;
    }

    if (!apolloApiKey.trim()) {
      setMessage('Please configure your Apollo API key first');
      setShowError(true);
      return;
    }

    setIsDiscovering(true);
    try {
      const response = await fetch('http://localhost:4001/api/data-enrichment/search-contacts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          thesisCriteria,
          contactsToFind,
          apolloApiKey
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setDiscoveredContacts(data.contacts || []);
        setDiscoveryResults(data);
        setMessage(`Found ${data.contacts?.length || 0} contacts matching your thesis criteria`);
        setShowSuccess(true);
      } else {
        setMessage(data.error || 'Failed to discover contacts');
        setShowError(true);
      }
    } catch (error) {
      setMessage('Failed to discover contacts. Please try again.');
      setShowError(true);
    } finally {
      setIsDiscovering(false);
    }
  };

  const handleDownloadSearchResults = async () => {
    if (!discoveredContacts.length) {
      setMessage('No contacts to download');
      setShowError(true);
      return;
    }

    try {
      const response = await fetch('http://localhost:4001/api/data-enrichment/download-search-results', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contacts: discoveredContacts,
          thesisCriteria
        })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `apollo-contacts-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        setMessage('Contacts downloaded successfully!');
        setShowSuccess(true);
      } else {
        setMessage('Failed to download contacts');
        setShowError(true);
      }
    } catch (error) {
      console.error('Download error:', error);
      setMessage('Failed to download contacts');
      setShowError(true);
    }
  };

  const handleThesisCriteriaChange = (field: keyof ThesisCriteria, value: string) => {
    const newCriteria = {
      ...thesisCriteria,
      [field]: value
    };
    setThesisCriteria(newCriteria);
    
    // Auto-save to localStorage as user types
    localStorage.setItem('thesisCriteria', JSON.stringify(newCriteria));
  };

  const handleSaveThesis = async () => {
    setIsSaving(true);
    try {
      // Save to localStorage
      localStorage.setItem('thesisCriteria', JSON.stringify(thesisCriteria));
      
      // Also save to backend for persistence across devices
      const response = await fetch('http://localhost:4001/api/data-enrichment/save-thesis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          thesisCriteria,
          userId: 'current-user' // You can replace this with actual user ID
        })
      });

      if (response.ok) {
        setMessage('Thesis criteria saved successfully!');
        setShowSuccess(true);
      } else {
        setMessage('Thesis criteria saved locally, but failed to sync to server');
        setShowSuccess(true);
      }
    } catch (error) {
      // Still save locally even if server fails
      localStorage.setItem('thesisCriteria', JSON.stringify(thesisCriteria));
      setMessage('Thesis criteria saved locally');
      setShowSuccess(true);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLoadThesis = () => {
    const saved = localStorage.getItem('thesisCriteria');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setThesisCriteria(parsed);
        setMessage('Thesis criteria loaded from saved data');
        setShowSuccess(true);
      } catch (error) {
        setMessage('Failed to load saved thesis criteria');
        setShowError(true);
      }
    } else {
      setMessage('No saved thesis criteria found');
      setShowError(true);
    }
  };

  const handleApiKeySubmit = async () => {
    if (!apolloApiKey.trim()) {
      setMessage('Please enter your Apollo API key');
      setShowError(true);
      return;
    }

    setIsValidatingKey(true);
    try {
      const response = await fetch('http://localhost:4001/api/data-enrichment/validate-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ apiKey: apolloApiKey })
      });

      const data = await response.json();
      
      if (data.success && data.valid) {
        setIsKeyValid(true);
        setMessage('Apollo API key is valid!');
        setShowSuccess(true);
        setShowApiKeyDialog(false);
      } else {
        setIsKeyValid(false);
        setMessage('Apollo API key validation failed. This usually means: 1) The key is not activated in your Apollo dashboard, 2) The key lacks the required permissions, or 3) Your account doesn\'t have API access enabled. Please check your Apollo dashboard.');
        setShowError(true);
      }
    } catch (error) {
      setIsKeyValid(false);
      setMessage('Failed to validate API key. Please try again.');
      setShowError(true);
    } finally {
      setIsValidatingKey(false);
    }
  };

  const handleFileSelect = (file: File) => {
    if (file) {
      setSelectedFile(file);
      setResults(null);
      setShowResults(false);
    }
  };

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const file = files[0];
    
    if (file && (file.type.includes('sheet') || file.type.includes('csv') || file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.name.endsWith('.csv'))) {
      handleFileSelect(file);
    } else {
      setMessage('Please upload an Excel file (.xlsx, .xls) or CSV file');
      setShowError(true);
    }
  }, []);

  const handleFileUpload = async () => {
    if (!selectedFile) {
      setMessage('Please select a file to upload');
      setShowError(true);
      return;
    }

    if (!apolloApiKey.trim()) {
      setMessage('Please configure your Apollo API key first');
      setShowError(true);
      return;
    }

    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('apiKey', apolloApiKey);

      const response = await fetch('http://localhost:4001/api/data-enrichment/upload-and-enrich', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        setResults(data);
        setShowResults(true);
        setMessage(`Successfully processed ${data.summary.total} contacts with ${data.summary.successRate}% success rate`);
        setShowSuccess(true);
      } else {
        setMessage(data.error || 'Failed to process file');
        setShowError(true);
      }
    } catch (error) {
      setMessage('Network error. Please try again.');
      setShowError(true);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadResults = async () => {
    if (!results) return;

    try {
      setIsProcessing(true);
      
      // Generate enriched CSV in original format
      const response = await fetch('http://localhost:4001/api/data-enrichment/generate-csv', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          results: results.results,
          originalHeaders: ['Given', 'Company', 'To be populated', 'To be populated_1', 'To be populated_2']
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate CSV');
      }

      // Download the file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `apollo-enriched-contacts-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      setMessage('Enriched CSV file downloaded successfully!');
      setShowSuccess(true);
    } catch (error) {
      console.error('Download error:', error);
      setMessage('Failed to download enriched CSV file');
      setShowError(true);
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusIcon = (success: boolean) => {
    return success ? (
      <CheckCircleIcon sx={{ color: 'success.main', fontSize: 20 }} />
    ) : (
      <ErrorIcon sx={{ color: 'error.main', fontSize: 20 }} />
    );
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
        <Box>
        <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
            Data Enrichment with Apollo
        </Typography>
        <Typography variant="body1" color="text.secondary">
            Upload Excel files and enrich contact data using Apollo API
        </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Tooltip title="Configure Apollo API">
            <Button
              variant="outlined"
              startIcon={<DataUsageIcon />}
              onClick={() => setShowApiKeyDialog(true)}
              sx={{ borderColor: 'divider' }}
            >
              {isKeyValid ? 'API Configured' : 'Configure API'}
            </Button>
          </Tooltip>
        </Box>
      </Box>

          {/* Tabs */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
              <Tab label="File Enrichment" />
              <Tab label="Contact Search" />
            </Tabs>
          </Box>

      {/* Success/Error Alerts */}
      <Snackbar
        open={showSuccess}
        autoHideDuration={6000}
        onClose={() => setShowSuccess(false)}
      >
        <Alert severity="success" onClose={() => setShowSuccess(false)}>
          {message}
        </Alert>
      </Snackbar>

      <Snackbar
        open={showError}
        autoHideDuration={6000}
        onClose={() => setShowError(false)}
      >
        <Alert severity="error" onClose={() => setShowError(false)}>
          {message}
        </Alert>
      </Snackbar>

      {/* Tab Panel Content */}
      {activeTab === 0 && (
        <Grid container spacing={3}>
          {/* Upload Section */}
          <Grid item xs={12} md={6}>
          <Paper sx={{ p: 4 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
              Upload Excel File
            </Typography>

            {/* API Key Status */}
            <Box sx={{ mb: 3 }}>
              {isKeyValid === null && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  Please configure your Apollo API key to start enriching contacts
                </Alert>
              )}
              {isKeyValid === false && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  Invalid API key. Please check your Apollo API key and try again.
              </Alert>
            )}
              {isKeyValid === true && (
                <Alert severity="success" sx={{ mb: 2 }}>
                  Apollo API key is configured and valid
                </Alert>
              )}
            </Box>

            {/* Drag and Drop File Upload */}
            <Box 
                  sx={{
                mb: 3,
                border: '2px dashed',
                borderColor: isDragOver ? 'primary.main' : 'divider',
                borderRadius: 2,
                p: 4,
                textAlign: 'center',
                bgcolor: isDragOver ? 'action.hover' : 'background.paper',
                cursor: 'pointer',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  borderColor: 'primary.main',
                  bgcolor: 'action.hover'
                }
              }}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <CloudUploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                {selectedFile ? selectedFile.name : 'Drag & Drop CSV File Here'}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                or click to browse files
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Supports any CSV format with flexible column names (max 10MB)
              </Typography>
              
              <input
                ref={fileInputRef}
                type="file"
                hidden
                accept=".csv,.xlsx,.xls"
                onChange={handleFileInputChange}
              />
            </Box>

            {selectedFile && (
              <Box sx={{ mb: 3, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {selectedFile.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {(selectedFile.size / 1024).toFixed(1)} KB
                    </Typography>
                  </Box>
                  <IconButton
                    size="small"
                    onClick={() => {
                      setSelectedFile(null);
                      if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                      }
                    }}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Box>
            )}

            {/* File Format Instructions */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                Supported File Formats:
              </Typography>
              <List dense>
                <ListItem sx={{ py: 0 }}>
                  <ListItemIcon>
                    <InfoIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Any CSV format with flexible column names"
                    secondary="We automatically detect: Name, Company, Email, Phone, Website columns"
                  />
                </ListItem>
                <ListItem sx={{ py: 0 }}>
                  <ListItemIcon>
                    <GetAppIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary="File types: .csv, .xlsx, .xls"
                    secondary="Maximum file size: 10MB"
                  />
                </ListItem>
                <ListItem sx={{ py: 0 }}>
                  <ListItemIcon>
                    <CheckCircleIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Smart column detection"
                    secondary="Works with any column names like: 'Full Name', 'Contact', 'Business', 'E-mail', etc."
                  />
                </ListItem>
              </List>
            </Box>

            {/* Process Button */}
              <Button
              variant="contained"
              size="large"
              startIcon={isProcessing ? <CircularProgress size={20} /> : <SearchIcon />}
              onClick={handleFileUpload}
              disabled={!selectedFile || !apolloApiKey.trim() || isProcessing}
                fullWidth
                sx={{
                bgcolor: 'white',
                  color: '#000000',
                border: '2px solid #000000',
                py: 1.5,
                  '&:hover': {
                  bgcolor: '#f5f5f5'
                },
                '&:disabled': {
                  bgcolor: '#cccccc',
                  color: '#666666'
                }
              }}
            >
              {isProcessing ? 'Processing...' : 'Enrich Contacts with Apollo'}
              </Button>

            {isProcessing && (
              <Box sx={{ mt: 2 }}>
                <LinearProgress />
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  Processing contacts with Apollo API...
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Results Section */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 4 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
              Enrichment Results
            </Typography>

            {!showResults ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <DataUsageIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="body1" color="text.secondary">
                  Upload and process a file to see enrichment results
                </Typography>
              </Box>
            ) : (
              <Box>
                {/* Summary Stats */}
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={6}>
                    <Card sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="h4" sx={{ fontWeight: 600, color: 'primary.main' }}>
                        {results?.summary.total}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Total Contacts
                      </Typography>
          </Card>
                  </Grid>
                  <Grid item xs={6}>
                    <Card sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="h4" sx={{ fontWeight: 600, color: 'success.main' }}>
                        {results?.summary.successful}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Enriched
              </Typography>
                    </Card>
                  </Grid>
                </Grid>

                {/* Success Rate */}
                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Success Rate</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {results?.summary.successRate}%
              </Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={results?.summary.successRate || 0}
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                </Box>

                {/* Download Button */}
                <Button
                  variant="outlined"
                  startIcon={<FileDownloadIcon />}
                  onClick={handleDownloadResults}
                  fullWidth
                  sx={{ mb: 3 }}
                >
                  Download Enriched Data (CSV)
                </Button>

                {/* Sample Results Preview */}
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                  Sample Results:
                </Typography>
                <TableContainer sx={{ maxHeight: 300 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Name</TableCell>
                        <TableCell>Company</TableCell>
                        <TableCell>Email</TableCell>
                        <TableCell>Phone</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {results?.results.slice(0, 5).map((result, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              {result.enriched?.photo && (
                                <Avatar src={result.enriched.photo} sx={{ width: 24, height: 24 }} />
                              )}
                              <Typography variant="body2">
                                {result.enriched?.name || result.original.given}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {result.enriched?.company || result.original.company}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {result.enriched?.email || result.original.email}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {result.enriched?.phone || result.original.phone}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {getStatusIcon(result.success)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                {results && results.results.length > 5 && (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    Showing first 5 results. Download CSV for complete data.
                  </Typography>
                )}
              </Box>
            )}
          </Paper>
        </Grid>
        </Grid>
      )}

          {/* Contact Search Tab */}
          {activeTab === 1 && (
        <Grid container spacing={3}>
          {/* Thesis Criteria Form */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 4 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Contact Search Criteria
                </Typography>
                <Chip 
                  label="Auto-saved locally" 
                  color="success" 
                  size="small" 
                  variant="outlined"
                />
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Enter your search criteria to find relevant contacts using Apollo's Search API. 
                Your criteria will be automatically saved locally and can be loaded later.
              </Typography>

              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="EBITDA"
                    placeholder="e.g., $3M+, $5M+, $10M+"
                    value={thesisCriteria.ebitda}
                    onChange={(e) => handleThesisCriteriaChange('ebitda', e.target.value)}
                    helperText="Minimum EBITDA requirements"
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Revenue"
                    placeholder="e.g., $10M-$20M, $20M-$50M, $50M+"
                    value={thesisCriteria.revenue}
                    onChange={(e) => handleThesisCriteriaChange('revenue', e.target.value)}
                    helperText="Revenue range criteria"
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Industries"
                    placeholder="e.g., Healthcare, Technology, Finance"
                    value={thesisCriteria.industries}
                    onChange={(e) => handleThesisCriteriaChange('industries', e.target.value)}
                    helperText="Target industries (comma-separated)"
                    required
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Subindustries"
                    placeholder="e.g., Compliance, Revenue Cycle Management, Training"
                    value={thesisCriteria.subindustries}
                    onChange={(e) => handleThesisCriteriaChange('subindustries', e.target.value)}
                    helperText="Specific subindustries or focus areas"
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Location"
                    placeholder="e.g., U.S.-based, California, New York"
                    value={thesisCriteria.location}
                    onChange={(e) => handleThesisCriteriaChange('location', e.target.value)}
                    helperText="Geographic location criteria"
                  />
                </Grid>

                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Growth Rate</InputLabel>
                    <Select
                      value={thesisCriteria.growth}
                      onChange={(e) => handleThesisCriteriaChange('growth', e.target.value)}
                      label="Growth Rate"
                    >
                      <MenuItem value="">Any</MenuItem>
                      <MenuItem value="single">Single-digit growth</MenuItem>
                      <MenuItem value="double">Double-digit growth</MenuItem>
                      <MenuItem value="high">High growth (20%+)</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Number of Contacts to Find"
                    type="number"
                    value={contactsToFind}
                    onChange={(e) => setContactsToFind(parseInt(e.target.value) || 10)}
                    helperText="How many contacts should Apollo search for? (1-50)"
                    inputProps={{ min: 1, max: 50 }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                    <Button
                      variant="outlined"
                      onClick={handleSaveThesis}
                      disabled={isSaving}
                      startIcon={isSaving ? <CircularProgress size={16} /> : <GetAppIcon />}
                      sx={{ flex: 1 }}
                    >
                      {isSaving ? 'Saving...' : 'Save Criteria'}
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={handleLoadThesis}
                      startIcon={<RefreshIcon />}
                      sx={{ flex: 1 }}
                    >
                      Load Saved
                    </Button>
                  </Box>
                  
                  <Button
                    fullWidth
                    variant="contained"
                    size="large"
                    onClick={handleContactSearch}
                    disabled={isDiscovering || !isKeyValid}
                    startIcon={isDiscovering ? <CircularProgress size={20} /> : <SearchIcon />}
                    sx={{ mt: 1 }}
                  >
                    {isDiscovering ? `Searching for ${contactsToFind} Contacts...` : `Search for ${contactsToFind} Contacts`}
                  </Button>
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Search Results */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 4 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                Search Results
              </Typography>

                  {discoveryResults && (
                    <Box sx={{ mb: 3 }}>
                      <Alert severity="success" sx={{ mb: 2 }}>
                        Found {discoveryResults.summary?.found || 0} contacts matching your search criteria
                        {contactsToFind > 0 && ` (requested ${contactsToFind})`}
                      </Alert>

                      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                        <Chip
                          label={`Total: ${discoveryResults.summary?.total || 0}`}
                          color="primary"
                          variant="outlined"
                        />
                        <Chip
                          label={`Success Rate: ${discoveryResults.summary?.successRate || 0}%`}
                          color="success"
                          variant="outlined"
                        />
                        {contactsToFind > 0 && (
                          <Chip
                            label={`Requested: ${contactsToFind}`}
                            color="info"
                            variant="outlined"
                          />
                        )}
                      </Box>
                      
                      {discoveredContacts.length > 0 && (
                        <Box sx={{ mb: 2 }}>
                          <Button
                            variant="contained"
                            color="success"
                            startIcon={<GetAppIcon />}
                            onClick={handleDownloadSearchResults}
                            sx={{ mr: 2 }}
                          >
                            Download CSV ({discoveredContacts.length} contacts)
                          </Button>
                        </Box>
                      )}
                    </Box>
                  )}

              {discoveredContacts.length > 0 ? (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Name</TableCell>
                        <TableCell>Title</TableCell>
                        <TableCell>Company</TableCell>
                        <TableCell>Email</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {discoveredContacts.slice(0, 10).map((contact, index) => (
                        <TableRow key={contact.id || index}>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                                {contact.first_name?.[0] || contact.name?.[0] || '?'}
                              </Avatar>
                              <Box>
                                <Typography variant="body2" fontWeight={500}>
                                  {contact.name || `${contact.first_name} ${contact.last_name}`}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {contact.title}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>{contact.title}</TableCell>
                          <TableCell>{contact.company}</TableCell>
                          <TableCell>
                            {contact.email ? (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <EmailIcon sx={{ fontSize: 16, color: 'success.main' }} />
                                <Typography variant="body2">{contact.email}</Typography>
                              </Box>
                            ) : (
                              <Typography variant="body2" color="text.secondary">
                                No email
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={contact.email_unlocked ? 'Unlocked' : 'Locked'}
                              color={contact.email_unlocked ? 'success' : 'warning'}
                              size="small"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <SearchIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                      <Typography variant="body1" color="text.secondary">
                        Enter your search criteria and click "Search for Contacts" to find relevant contacts
                      </Typography>
                    </Box>
              )}
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* API Key Configuration Dialog */}
      <Dialog
        open={showApiKeyDialog}
        onClose={() => setShowApiKeyDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Configure Apollo API Key
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Enter your Apollo API key to enable contact enrichment. You can get your API key from your Apollo account settings.
          </Typography>
          
          <TextField
            fullWidth
            label="Apollo API Key"
            type="password"
            value={apolloApiKey}
            onChange={(e) => setApolloApiKey(e.target.value)}
            placeholder="Enter your Apollo API key"
            sx={{ mb: 2 }}
          />

          <Alert severity="info" sx={{ mb: 2 }}>
            Your API key is stored locally and only used for this session. It's not saved to our servers.
          </Alert>

          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
              API Key Validation Issues?
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              1. Log into Apollo.io → Settings → API Keys
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              2. Click "Activate" on your API key if it's not already active
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              3. Ensure your $99/month plan includes API access
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              4. Check that you have remaining API credits
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              5. Verify the key has "People Search" and "Organization Lookup" permissions
            </Typography>
            <Typography variant="body2">
              6. Contact Apollo support if the issue persists
            </Typography>
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowApiKeyDialog(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleApiKeySubmit}
            disabled={!apolloApiKey.trim() || isValidatingKey}
            startIcon={isValidatingKey ? <CircularProgress size={16} /> : <CheckCircleIcon />}
          >
            {isValidatingKey ? 'Validating...' : 'Validate & Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}