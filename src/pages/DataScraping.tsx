import React, { useState, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Grid,
  Card,
  CardContent,
  CardActions,
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
  Badge
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
  DataUsage as DataUsageIcon
} from '@mui/icons-material';

interface EnrichedContact {
  id: string;
  original: {
    first_name?: string;
    last_name?: string;
    organization_name?: string;
    email?: string;
    phone?: string;
    domain?: string;
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

export default function DataScraping() {
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleApiKeySubmit = async () => {
    if (!apolloApiKey.trim()) {
      setMessage('Please enter your Apollo API key');
      setShowError(true);
      return;
    }

    setIsValidatingKey(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4001'}/api/apollo/validate-key`, {
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
        setMessage('Invalid Apollo API key. Please check and try again.');
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

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setResults(null);
      setShowResults(false);
    }
  };

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

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4001'}/api/apollo/upload-and-enrich`, {
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

  const handleDownloadResults = () => {
    if (!results) return;

    // Create CSV content
    const csvContent = [
      // Header
      ['Original Name', 'Original Company', 'Original Email', 'Enriched Name', 'Enriched Email', 'Enriched Phone', 'Enriched Title', 'Enriched Company', 'LinkedIn', 'Location', 'Status'].join(','),
      // Data rows
      ...results.results.map(result => [
        `"${result.original.first_name || ''} ${result.original.last_name || ''}"`,
        `"${result.original.organization_name || ''}"`,
        `"${result.original.email || ''}"`,
        `"${result.enriched?.name || ''}"`,
        `"${result.enriched?.email || ''}"`,
        `"${result.enriched?.phone || ''}"`,
        `"${result.enriched?.title || ''}"`,
        `"${result.enriched?.company || ''}"`,
        `"${result.enriched?.linkedin || ''}"`,
        `"${result.enriched?.location || ''}"`,
        `"${result.success ? 'Success' : 'Failed'}"`
      ].join(','))
    ].join('\n');

    // Download file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `apollo-enriched-contacts-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const getStatusIcon = (success: boolean) => {
    return success ? (
      <CheckCircleIcon sx={{ color: 'success.main', fontSize: 20 }} />
    ) : (
      <ErrorIcon sx={{ color: 'error.main', fontSize: 20 }} />
    );
  };

  const getStatusColor = (success: boolean) => {
    return success ? 'success.main' : 'error.main';
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
            Data Scraping & Contact Enrichment
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

            {/* File Upload */}
            <Box sx={{ mb: 3 }}>
              <Button
                variant="outlined"
                component="label"
                startIcon={<CloudUploadIcon />}
                fullWidth
                sx={{ 
                  py: 2,
                  borderStyle: 'dashed',
                  borderWidth: 2,
                  '&:hover': {
                    borderStyle: 'dashed',
                    borderWidth: 2
                  }
                }}
              >
                {selectedFile ? selectedFile.name : 'Choose Excel File (.xlsx, .xls, .csv)'}
                <input
                  ref={fileInputRef}
                  type="file"
                  hidden
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileSelect}
                />
              </Button>
              
              {selectedFile && (
                <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                  </Typography>
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
              )}
            </Box>

            {/* File Format Instructions */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                Expected Excel Format:
              </Typography>
              <List dense>
                <ListItem sx={{ py: 0 }}>
                  <ListItemText 
                    primary="Columns: first_name, last_name, company, email, phone, domain"
                    secondary="Any combination of these columns will work"
                  />
                </ListItem>
                <ListItem sx={{ py: 0 }}>
                  <ListItemText 
                    primary="File types: .xlsx, .xls, .csv"
                    secondary="Maximum file size: 10MB"
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
              {isProcessing ? 'Processing...' : 'Enrich Contacts'}
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
                                {result.enriched?.name || `${result.original.first_name} ${result.original.last_name}`}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {result.enriched?.company || result.original.organization_name}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {result.enriched?.email || result.original.email}
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
