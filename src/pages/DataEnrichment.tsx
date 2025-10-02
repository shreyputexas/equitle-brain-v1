import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Grid,
  Divider,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Download as DownloadIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Description as FileIcon,
} from '@mui/icons-material';
import FileUploadZone from '../components/FileUploadZone';

interface UploadState {
  uploading: boolean;
  success: boolean;
  error: string | null;
  downloadUrl: string | null;
  filename: string | null;
}

export default function DataEnrichment() {
  const [uploadState, setUploadState] = useState<UploadState>({
    uploading: false,
    success: false,
    error: null,
    downloadUrl: null,
    filename: null,
  });

  const handleFileUpload = async (file: File) => {
    setUploadState({
      uploading: true,
      success: false,
      error: null,
      downloadUrl: null,
      filename: null,
    });

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/data-enrichment/upload', {
        method: 'POST',
        body: formData,
        // Skip auth for now - will be added later when needed
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Upload failed' }));
        throw new Error(errorData.error || `Upload failed with status ${response.status}`);
      }

      // Get the enriched file as blob
      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);

      // Extract filename from Content-Disposition header
      const contentDisposition = response.headers.get('Content-Disposition');
      const filename = contentDisposition
        ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
        : `enriched_${file.name}`;

      setUploadState({
        uploading: false,
        success: true,
        error: null,
        downloadUrl,
        filename,
      });
    } catch (error: any) {
      console.error('Upload error:', error);
      setUploadState({
        uploading: false,
        success: false,
        error: error.message || 'Upload failed',
        downloadUrl: null,
        filename: null,
      });
    }
  };

  const handleDownloadSample = async () => {
    try {
      const response = await fetch('/api/data-enrichment/sample');
      if (!response.ok) {
        throw new Error('Failed to download sample');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'company_template.xlsx';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error('Sample download error:', error);
    }
  };

  const handleDownloadResult = () => {
    if (uploadState.downloadUrl && uploadState.filename) {
      const a = document.createElement('a');
      a.href = uploadState.downloadUrl;
      a.download = uploadState.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
          Data Enrichment
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Upload an Excel file with company information to automatically find missing contact details
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Upload Section */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
              <UploadIcon sx={{ mr: 1 }} />
              Upload Company Data
            </Typography>

            {/* File Upload Zone */}
            <FileUploadZone
              onFileSelect={handleFileUpload}
              disabled={uploadState.uploading}
              accept=".xlsx,.xls"
              maxSize={10 * 1024 * 1024} // 10MB
            />

            {/* Upload Status */}
            {uploadState.uploading && (
              <Box sx={{ mt: 3, textAlign: 'center' }}>
                <CircularProgress sx={{ mb: 2 }} />
                <Typography variant="body2" color="text.secondary">
                  Processing your file... This may take a few minutes.
                </Typography>
              </Box>
            )}

            {uploadState.error && (
              <Alert severity="error" sx={{ mt: 3 }}>
                {uploadState.error}
              </Alert>
            )}

            {uploadState.success && (
              <Box sx={{ mt: 3 }}>
                <Alert severity="success" sx={{ mb: 2 }}>
                  File processed successfully! Your enriched data is ready for download.
                </Alert>
                <Button
                  variant="contained"
                  startIcon={<DownloadIcon />}
                  onClick={handleDownloadResult}
                  sx={{
                    bgcolor: '#000000',
                    color: 'white',
                    '&:hover': { bgcolor: '#333333' }
                  }}
                >
                  Download Enriched File
                </Button>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Information Panel */}
        <Grid item xs={12} md={4}>
          {/* How It Works */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                <InfoIcon sx={{ mr: 1 }} />
                How It Works
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <Chip label="1" size="small" sx={{ minWidth: 24 }} />
                  </ListItemIcon>
                  <ListItemText
                    primary="Upload Excel File"
                    secondary="Include company names, domains, or websites"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <Chip label="2" size="small" sx={{ minWidth: 24 }} />
                  </ListItemIcon>
                  <ListItemText
                    primary="AI Processing"
                    secondary="Our system finds missing contact information"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <Chip label="3" size="small" sx={{ minWidth: 24 }} />
                  </ListItemIcon>
                  <ListItemText
                    primary="Download Results"
                    secondary="Get enriched data with emails, phones, and more"
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>

          {/* Sample Template */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                <FileIcon sx={{ mr: 1 }} />
                Sample Template
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Download our template to see the expected format for your data.
              </Typography>
              <Button
                variant="outlined"
                size="small"
                startIcon={<DownloadIcon />}
                onClick={handleDownloadSample}
                fullWidth
                sx={{
                  borderColor: '#000000',
                  color: '#000000',
                  '&:hover': {
                    borderColor: '#333333',
                    bgcolor: 'rgba(0,0,0,0.04)'
                  }
                }}
              >
                Download Template
              </Button>
            </CardContent>
          </Card>

          {/* Data Sources */}
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                <CheckIcon sx={{ mr: 1 }} />
                Data Sources
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                We enrich your data using:
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Chip
                  label="Apollo.io Database"
                  size="small"
                  sx={{ bgcolor: '#f5f5f5', alignSelf: 'flex-start' }}
                />
                <Chip
                  label="280M+ Professional Contacts"
                  size="small"
                  sx={{ bgcolor: '#f5f5f5', alignSelf: 'flex-start' }}
                />
                <Chip
                  label="Company Information"
                  size="small"
                  sx={{ bgcolor: '#f5f5f5', alignSelf: 'flex-start' }}
                />
                <Chip
                  label="Email Verification"
                  size="small"
                  sx={{ bgcolor: '#f5f5f5', alignSelf: 'flex-start' }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}