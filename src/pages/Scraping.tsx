import React, { useState, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Description as FileIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Close as CloseIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  Analytics as AnalyticsIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Language as WebsiteIcon
} from '@mui/icons-material';

interface ScrapedContact {
  id: string;
  name: string;
  company: string;
  email?: string;
  phone?: string;
  website?: string;
  linkedin?: string;
  title?: string;
  status: 'found' | 'not_found' | 'processing' | 'error';
  confidence: number;
  source: string;
}

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  uploadDate: Date;
  status: 'uploaded' | 'processing' | 'completed' | 'error';
  progress: number;
  totalContacts: number;
  foundContacts: number;
  scrapedContacts: ScrapedContact[];
}

export default function Scraping() {
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<UploadedFile | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  }, []);

  const handleFiles = (files: FileList) => {
    Array.from(files).forEach((file) => {
      if (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
          file.type === 'application/vnd.ms-excel' ||
          file.name.endsWith('.xlsx') || 
          file.name.endsWith('.xls')) {
        
        const newFile: UploadedFile = {
          id: Date.now().toString(),
          name: file.name,
          size: file.size,
          uploadDate: new Date(),
          status: 'uploaded',
          progress: 0,
          totalContacts: 0,
          foundContacts: 0,
          scrapedContacts: []
        };

        setUploadedFiles(prev => [...prev, newFile]);
        simulateProcessing(newFile.id);
      } else {
        alert('Please upload only Excel files (.xlsx or .xls)');
      }
    });
  };

  const simulateProcessing = (fileId: string) => {
    setIsProcessing(true);
    const interval = setInterval(() => {
      setUploadedFiles(prev => prev.map(file => {
        if (file.id === fileId) {
          const newProgress = Math.min(file.progress + Math.random() * 20, 100);
          const newStatus = newProgress >= 100 ? 'completed' : 'processing';
          
          if (newStatus === 'completed') {
            // Generate mock scraped data
            const mockContacts: ScrapedContact[] = [
              {
                id: '1',
                name: 'John Smith',
                company: 'TechCorp Inc',
                email: 'john.smith@techcorp.com',
                phone: '+1-555-0123',
                website: 'www.techcorp.com',
                linkedin: 'linkedin.com/in/johnsmith',
                title: 'CEO',
                status: 'found',
                confidence: 95,
                source: 'LinkedIn + Company Website'
              },
              {
                id: '2',
                name: 'Sarah Johnson',
                company: 'Innovate Labs',
                email: 'sarah.j@innovatelabs.com',
                phone: '+1-555-0456',
                website: 'www.innovatelabs.com',
                linkedin: 'linkedin.com/in/sarahjohnson',
                title: 'CTO',
                status: 'found',
                confidence: 88,
                source: 'Company Website + Social Media'
              },
              {
                id: '3',
                name: 'Mike Wilson',
                company: 'StartupXYZ',
                email: undefined,
                phone: undefined,
                website: 'www.startupxyz.com',
                linkedin: 'linkedin.com/in/mikewilson',
                title: 'Founder',
                status: 'not_found',
                confidence: 0,
                source: 'Limited public information'
              }
            ];

            return {
              ...file,
              progress: 100,
              status: 'completed',
              totalContacts: 3,
              foundContacts: 2,
              scrapedContacts: mockContacts
            };
          }
          
          return {
            ...file,
            progress: newProgress,
            status: newStatus
          };
        }
        return file;
      }));
    }, 1000);

    setTimeout(() => {
      clearInterval(interval);
      setIsProcessing(false);
    }, 5000);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  const openDetailsModal = (file: UploadedFile) => {
    setSelectedFile(file);
    setDetailsModalOpen(true);
  };

  const closeDetailsModal = () => {
    setDetailsModalOpen(false);
    setSelectedFile(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'uploaded': return 'info';
      case 'processing': return 'warning';
      case 'completed': return 'success';
      case 'error': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'uploaded': return <InfoIcon />;
      case 'processing': return <RefreshIcon />;
      case 'completed': return <CheckIcon />;
      case 'error': return <ErrorIcon />;
      default: return <InfoIcon />;
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <AnalyticsIcon sx={{ mr: 2, fontSize: 32, color: 'primary.main' }} />
        <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
          AI Contact Scraping
        </Typography>
      </Box>

      {/* Description */}
      <Alert severity="info" sx={{ mb: 3 }}>
        Upload Excel files with incomplete contact information. Our AI will automatically find missing details like emails, phone numbers, and social profiles.
      </Alert>

      {/* Upload Area */}
      <Paper
        sx={{
          p: 4,
          textAlign: 'center',
          border: '2px dashed',
          borderColor: dragActive ? 'primary.main' : 'divider',
          bgcolor: dragActive ? 'action.hover' : 'background.paper',
          transition: 'all 0.3s ease',
          cursor: 'pointer',
          '&:hover': {
            borderColor: 'primary.main',
            bgcolor: 'action.hover'
          }
        }}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => document.getElementById('file-upload')?.click()}
      >
        <UploadIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          {dragActive ? 'Drop your Excel file here' : 'Drag & drop Excel files here'}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Supported formats: .xlsx, .xls
        </Typography>
        <Button
          variant="contained"
          startIcon={<UploadIcon sx={{ color: 'grey' }} />}
          sx={{
            backgroundColor: '#000000',
            color: 'grey',
            '&:hover': {
              backgroundColor: '#333333',
              color: 'grey'
            },
            '&:focus': {
              backgroundColor: '#000000',
              color: 'grey'
            },
            '&:active': {
              backgroundColor: '#000000',
              color: 'grey'
            }
          }}
        >
          Choose Files
        </Button>
        <input
          id="file-upload"
          type="file"
          multiple
          accept=".xlsx,.xls"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
      </Paper>

      {/* Processing Status */}
      {isProcessing && (
        <Alert severity="info" sx={{ mt: 2 }}>
          <Typography variant="body2">
            AI is analyzing your file and searching for contact information...
          </Typography>
        </Alert>
      )}

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            Uploaded Files ({uploadedFiles.length})
          </Typography>
          
          {uploadedFiles.map((file) => (
            <Card key={file.id} sx={{ mb: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <FileIcon sx={{ color: 'primary.main' }} />
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {file.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {(file.size / 1024).toFixed(1)} KB • {file.uploadDate.toLocaleString()}
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Chip
                      icon={getStatusIcon(file.status)}
                      label={file.status.charAt(0).toUpperCase() + file.status.slice(1)}
                      color={getStatusColor(file.status) as any}
                      size="small"
                    />
                    
                    {file.status === 'completed' && (
                      <Tooltip title="View Details">
                        <IconButton onClick={() => openDetailsModal(file)}>
                          <AnalyticsIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                </Box>

                {file.status === 'processing' && (
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Processing...</Typography>
                      <Typography variant="body2">{Math.round(file.progress)}%</Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={file.progress}
                      sx={{
                        height: 6,
                        borderRadius: 3,
                        bgcolor: 'rgba(0,0,0,0.1)',
                        '& .MuiLinearProgress-bar': {
                          borderRadius: 3,
                          background: 'linear-gradient(90deg, #9e9e9e 0%, #000000 100%)'
                        }
                      }}
                    />
                  </Box>
                )}

                {file.status === 'completed' && (
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <Chip
                      icon={<PersonIcon />}
                      label={`${file.foundContacts}/${file.totalContacts} contacts found`}
                      color="success"
                      variant="outlined"
                    />
                    <Chip
                      icon={<CheckIcon />}
                      label={`${Math.round((file.foundContacts / file.totalContacts) * 100)}% success rate`}
                      color="primary"
                      variant="outlined"
                    />
                  </Box>
                )}
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      {/* Details Modal */}
      <Dialog
        open={detailsModalOpen}
        onClose={closeDetailsModal}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            maxHeight: '80vh'
          }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          bgcolor: '#000000',
          color: 'white',
          py: 2
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <FileIcon />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {selectedFile?.name} - Scraping Results
            </Typography>
          </Box>
          <IconButton onClick={closeDetailsModal} sx={{ color: 'white' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 0 }}>
          {selectedFile && (
            <Box>
              {/* Summary Stats */}
              <Box sx={{ p: 3, bgcolor: 'background.default', borderBottom: '1px solid', borderColor: 'divider' }}>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main' }}>
                      {selectedFile.foundContacts}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">Contacts Found</Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
                      {selectedFile.totalContacts}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">Total Contacts</Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: 'info.main' }}>
                      {Math.round((selectedFile.foundContacts / selectedFile.totalContacts) * 100)}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">Success Rate</Typography>
                  </Box>
                </Box>
              </Box>

              {/* Contact Details */}
              <Box sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  Scraped Contact Information
                </Typography>
                
                <List>
                  {selectedFile.scrapedContacts.map((contact, index) => (
                    <React.Fragment key={contact.id}>
                      <ListItem sx={{ px: 0 }}>
                        <ListItemIcon>
                          {contact.status === 'found' ? (
                            <CheckIcon color="success" />
                          ) : (
                            <ErrorIcon color="error" />
                          )}
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                {contact.name}
                              </Typography>
                              <Chip
                                label={contact.status === 'found' ? 'Found' : 'Not Found'}
                                size="small"
                                color={contact.status === 'found' ? 'success' : 'error'}
                                variant="outlined"
                              />
                              {contact.status === 'found' && (
                                <Chip
                                  label={`${contact.confidence}% confidence`}
                                  size="small"
                                  color="primary"
                                  variant="outlined"
                                />
                              )}
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                {contact.company} • {contact.title}
                              </Typography>
                              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                                {contact.email && (
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <EmailIcon fontSize="small" color="action" />
                                    <Typography variant="caption">{contact.email}</Typography>
                                  </Box>
                                )}
                                {contact.phone && (
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <PhoneIcon fontSize="small" color="action" />
                                    <Typography variant="caption">{contact.phone}</Typography>
                                  </Box>
                                )}
                                {contact.website && (
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <WebsiteIcon fontSize="small" color="action" />
                                    <Typography variant="caption">{contact.website}</Typography>
                                  </Box>
                                )}
                              </Box>
                              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                                Source: {contact.source}
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItem>
                      {index < selectedFile.scrapedContacts.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              </Box>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 3, bgcolor: 'background.default' }}>
          <Button onClick={closeDetailsModal} variant="outlined">
            Close
          </Button>
          <Button
            variant="contained"
            startIcon={<DownloadIcon sx={{ color: 'white' }} />}
            sx={{
              backgroundColor: '#000000',
              color: 'white',
              '&:hover': {
                backgroundColor: '#333333',
                color: 'white'
              },
              '&:focus': {
                backgroundColor: '#000000',
                color: 'white'
              },
              '&:active': {
                backgroundColor: '#000000',
                color: 'white'
              }
            }}
          >
            Download Results
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
