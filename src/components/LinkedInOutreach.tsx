import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
  Divider,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Collapse,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  Tooltip
} from '@mui/material';
import {
  Person as PersonIcon,
  LocationOn as LocationIcon,
  Schedule as ScheduleIcon,
  Business as BusinessIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  LinkedIn as LinkedInIcon,
  Group as GroupIcon,
  Send as SendIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  ContentCopy as ContentCopyIcon,
  Close as CloseIcon
} from '@mui/icons-material';

interface LinkedInData {
  interest: string;
  aboutMe: string;
  experience: string;
  latestPost: string;
  education: string;
  location: string;
  callPreference: string;
  outreachType: string;
}

interface LinkedInProfileData {
  rawLinkedInText: string;
  websiteUrl: string;
  callPreference: string;
  outreachType: string;
}

interface BulkLinkedInProfile {
  id: number;
  rawLinkedInText: string;
  websiteUrl: string;
  generatedMessage?: any;
  status: 'pending' | 'generating' | 'success' | 'error';
  error?: string;
}

interface LinkedInOutreachProps {
  onMessageGenerated?: (message: any) => void;
}

const LinkedInOutreach: React.FC<LinkedInOutreachProps> = ({ onMessageGenerated }) => {
  // Bulk processing state
  const [bulkProfiles, setBulkProfiles] = useState<BulkLinkedInProfile[]>(
    Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      rawLinkedInText: '',
      websiteUrl: '',
      status: 'pending' as const
    }))
  );
  
  const [globalCallPreference, setGlobalCallPreference] = useState('');
  const [globalOutreachType, setGlobalOutreachType] = useState('');
  const [isBulkGenerating, setIsBulkGenerating] = useState(false);
  const [bulkMessage, setBulkMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [expanded, setExpanded] = useState(false);

  const handleProfileInputChange = (profileId: number, field: 'rawLinkedInText' | 'websiteUrl') => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setBulkProfiles(prev => prev.map(profile => 
      profile.id === profileId 
        ? { ...profile, [field]: event.target.value }
        : profile
    ));
  };

  const handleGlobalCallPreferenceChange = (event: any) => {
    setGlobalCallPreference(event.target.value);
  };

  const handleGlobalOutreachTypeChange = (event: any) => {
    setGlobalOutreachType(event.target.value);
  };

  const handleBulkGenerate = async () => {
    // Validate global settings
    if (!globalCallPreference) {
      setBulkMessage({
        type: 'error',
        text: 'Please select a call preference for all messages.'
      });
      return;
    }

    if (!globalOutreachType) {
      setBulkMessage({
        type: 'error',
        text: 'Please select an outreach type for all messages.'
      });
      return;
    }

    // Get profiles with LinkedIn data
    const profilesWithData = bulkProfiles.filter(profile => profile.rawLinkedInText.trim());
    
    if (profilesWithData.length === 0) {
      setBulkMessage({
        type: 'error',
        text: 'Please paste LinkedIn profile data for at least one person.'
      });
      return;
    }

    setIsBulkGenerating(true);
    setBulkMessage(null);

    // Reset all profiles to pending
    setBulkProfiles(prev => prev.map(profile => ({ ...profile, status: 'pending' as const })));

    // Process each profile
    for (const profile of profilesWithData) {
      try {
        // Update status to generating
        setBulkProfiles(prev => prev.map(p => 
          p.id === profile.id ? { ...p, status: 'generating' as const } : p
        ));

        const response = await fetch('/api/linkedin-outreach/generate-message', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            linkedinProfileData: {
              rawLinkedInText: profile.rawLinkedInText,
              websiteUrl: profile.websiteUrl,
              callPreference: globalCallPreference,
              outreachType: globalOutreachType
            }
          })
        });

        const result = await response.json();

        if (result.success) {
          setBulkProfiles(prev => prev.map(p => 
            p.id === profile.id 
              ? { ...p, status: 'success' as const, generatedMessage: result.data }
              : p
          ));
        } else {
          setBulkProfiles(prev => prev.map(p => 
            p.id === profile.id 
              ? { ...p, status: 'error' as const, error: result.error || 'Failed to generate message' }
              : p
          ));
        }
      } catch (error) {
        console.error(`❌ Error generating message for profile ${profile.id}:`, error);
        setBulkProfiles(prev => prev.map(p => 
          p.id === profile.id 
            ? { ...p, status: 'error' as const, error: 'Network error' }
            : p
        ));
      }
    }

    // Show completion message
    const successCount = bulkProfiles.filter(p => p.status === 'success').length;
    const errorCount = bulkProfiles.filter(p => p.status === 'error').length;
    
    if (successCount > 0) {
      setBulkMessage({
        type: 'success',
        text: `Successfully generated ${successCount} messages${errorCount > 0 ? `, ${errorCount} failed` : ''}.`
      });
    } else {
      setBulkMessage({
        type: 'error',
        text: 'Failed to generate any messages. Please check your inputs and try again.'
      });
    }

    setIsBulkGenerating(false);
  };

  const callPreferenceOptions = [
    'Monday morning',
    'Monday afternoon', 
    'Tuesday morning',
    'Tuesday afternoon',
    'Wednesday morning',
    'Wednesday afternoon',
    'Thursday morning',
    'Thursday afternoon',
    'Friday morning',
    'Friday afternoon',
    'Next week',
    'Flexible'
  ];

  const outreachTypeOptions = [
    'Interest in Acquisition',
    'Interest in Entrepreneurial Journey'
  ];

  return (
    <Paper sx={{ mt: 2, overflow: 'hidden' }}>
      {/* Header Section */}
      <Box sx={{ p: 2.5, bgcolor: '#000000', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <GroupIcon sx={{ fontSize: 24 }} />
          <Typography variant="h6" sx={{ fontWeight: 600, fontFamily: '"Space Grotesk", sans-serif', color: 'white', fontSize: '1.125rem' }}>
            Bulk LinkedIn Outreach Generator
          </Typography>
        </Box>
        <IconButton
          onClick={() => setExpanded(!expanded)}
          sx={{ color: 'white' }}
        >
          {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>
      </Box>

      {/* Collapsible Content */}
      <Collapse in={expanded}>
        <Box sx={{ p: 2.5, bgcolor: 'background.paper' }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Generate personalized LinkedIn messages for up to 10 people at once. Paste LinkedIn profiles and optionally add company research.
          </Typography>

          {bulkMessage && (
            <Alert severity={bulkMessage.type} sx={{ mb: 3 }}>
              {bulkMessage.text}
            </Alert>
          )}

          {/* Spreadsheet-style Profile Input */}
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <PersonIcon />
            LinkedIn Profiles (1-10)
          </Typography>

          <Paper sx={{ overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
            {/* Header Row */}
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: '60px 1fr 300px 200px 100px', 
              bgcolor: '#f5f5f5',
              borderBottom: '1px solid',
              borderColor: 'divider'
            }}>
              <Box sx={{ p: 2, borderRight: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  #
                </Typography>
              </Box>
              <Box sx={{ p: 2, borderRight: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  LinkedIn Profile Data
                </Typography>
              </Box>
              <Box sx={{ p: 2, borderRight: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  Website URL (Optional)
                </Typography>
              </Box>
              <Box sx={{ p: 2, borderRight: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  Status
                </Typography>
              </Box>
              <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  Message
                </Typography>
              </Box>
            </Box>

            {/* Data Rows */}
            {bulkProfiles.map((profile, index) => (
              <Box key={profile.id} sx={{ 
                display: 'grid', 
                gridTemplateColumns: '60px 1fr 300px 200px 100px',
                borderBottom: index < bulkProfiles.length - 1 ? '1px solid' : 'none',
                borderColor: 'divider',
                '&:hover': {
                  bgcolor: '#fafafa'
                }
              }}>
                {/* Row Number */}
                <Box sx={{ 
                  p: 2, 
                  borderRight: '1px solid', 
                  borderColor: 'divider', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  bgcolor: '#f9f9f9'
                }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {profile.id}
                  </Typography>
                </Box>

                {/* LinkedIn Profile Data */}
                <Box sx={{ p: 1, borderRight: '1px solid', borderColor: 'divider' }}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    value={profile.rawLinkedInText}
                    onChange={handleProfileInputChange(profile.id, 'rawLinkedInText')}
                    placeholder="Paste LinkedIn profile content here..."
                    variant="outlined"
                    size="small"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        fontSize: '0.875rem'
                      }
                    }}
                  />
                </Box>

                {/* Website URL */}
                <Box sx={{ p: 1, borderRight: '1px solid', borderColor: 'divider' }}>
                  <TextField
                    fullWidth
                    value={profile.websiteUrl}
                    onChange={handleProfileInputChange(profile.id, 'websiteUrl')}
                    placeholder="https://example.com"
                    variant="outlined"
                    size="small"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        fontSize: '0.875rem'
                      }
                    }}
                  />
                </Box>

                {/* Status */}
                <Box sx={{ p: 2, borderRight: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {profile.status === 'generating' && (
                    <CircularProgress size={20} />
                  )}
                  
                  {profile.status === 'success' && (
                    <CheckCircleIcon sx={{ color: 'success.main', fontSize: 24 }} />
                  )}
                  
                  {profile.status === 'error' && (
                    <ErrorIcon sx={{ color: 'error.main', fontSize: 24 }} />
                  )}
                  
                  {profile.status === 'pending' && (
                    <Typography variant="caption" color="text.secondary">
                      Pending
                    </Typography>
                  )}
                </Box>

                {/* Message Status */}
                <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {profile.generatedMessage ? (
                    <Chip 
                      label="Ready" 
                      size="small" 
                      color="success" 
                      variant="outlined"
                    />
                  ) : profile.status === 'generating' ? (
                    <CircularProgress size={16} />
                  ) : profile.status === 'error' ? (
                    <Chip 
                      label="Error" 
                      size="small" 
                      color="error" 
                      variant="outlined"
                    />
                  ) : (
                    <Typography variant="caption" color="text.secondary">
                      -
                    </Typography>
                  )}
                </Box>
              </Box>
            ))}
          </Paper>

          {/* Global Settings */}
          <Card sx={{ mt: 3, mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <SendIcon />
                Global Settings (Applied to All Messages)
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Call Preference *</InputLabel>
                    <Select
                      value={globalCallPreference}
                      onChange={handleGlobalCallPreferenceChange}
                      label="Call Preference *"
                    >
                      {callPreferenceOptions.map((option) => (
                        <MenuItem key={option} value={option}>
                          {option}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Outreach Type *</InputLabel>
                    <Select
                      value={globalOutreachType}
                      onChange={handleGlobalOutreachTypeChange}
                      label="Outreach Type *"
                    >
                      {outreachTypeOptions.map((option) => (
                        <MenuItem key={option} value={option}>
                          {option}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Automated Outreach Section - Generated Messages */}
          {(
            <Paper sx={{ mt: 3, overflow: 'hidden' }}>
              {/* Black Header Section */}
              <Box sx={{ p: 2.5, bgcolor: '#000000', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, fontFamily: '"Space Grotesk", sans-serif', color: 'white', fontSize: '1.125rem' }}>
                    Generated Outreach Messages
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                    AI-generated personalized messages ready for review and approval
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  {bulkProfiles.some(p => p.generatedMessage) && (
                    <>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => {
                          // Reset all generated messages
                          setBulkProfiles(prev => prev.map(profile => ({ ...profile, generatedMessage: undefined, status: 'pending' as const })));
                        }}
                        sx={{ 
                          borderColor: 'rgba(255, 255, 255, 0.3)', 
                          color: 'white',
                          '&:hover': {
                            borderColor: 'rgba(255, 255, 255, 0.5)',
                            bgcolor: 'rgba(255, 255, 255, 0.05)'
                          }
                        }}
                      >
                        Clear All
                      </Button>
                      <Button
                        variant="contained"
                        size="small"
                        onClick={() => {
                          // You could add functionality to export or send all messages
                          console.log('Export/Send all messages');
                        }}
                        sx={{
                          bgcolor: 'white',
                          color: '#000000',
                          '&:hover': {
                            bgcolor: '#F3F4F6'
                          }
                        }}
                      >
                        Export All ({bulkProfiles.filter(p => p.generatedMessage).length})
                      </Button>
                    </>
                  )}
                  {!bulkProfiles.some(p => p.generatedMessage) && (
                    <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                      Messages will appear here after generation
                    </Typography>
                  )}
                </Box>
              </Box>

              {/* White Content Section */}
              <Box sx={{ p: 2.5, maxHeight: '600px', overflowY: 'auto', bgcolor: 'background.paper' }}>
                {bulkProfiles.some(p => p.generatedMessage) ? (
                  bulkProfiles
                    .filter(p => p.generatedMessage)
                    .map((profile) => (
                    <Box
                      key={profile.id}
                      sx={{
                        p: 2,
                        mb: 1.5,
                        border: '1px solid',
                        borderColor: 'success.main',
                        borderRadius: 1.5,
                        bgcolor: '#F0FDF4',
                        transition: 'all 0.15s ease',
                        '&:hover': {
                          borderColor: '#22C55E',
                          bgcolor: '#F0FDF4'
                        }
                      }}
                    >
                      <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                        {/* Contact Info */}
                        <Avatar sx={{ bgcolor: '#000000', width: 36, height: 36, flexShrink: 0 }}>
                          {profile.id}
                        </Avatar>
                        
                        {/* Content */}
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                              Person {profile.id}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              • AI-Generated Message
                            </Typography>
                            <Chip
                              label="Generated"
                              size="small"
                              sx={{
                                height: 20,
                                fontSize: '0.6875rem',
                                bgcolor: 'success.main',
                                color: 'white',
                                fontWeight: 600,
                                ml: 'auto'
                              }}
                            />
                          </Box>
                          
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1, lineHeight: 1.4 }}>
                            Personalized message generated using LinkedIn profile data
                            {profile.websiteUrl && ' and company research'}
                          </Typography>
                          
                          {/* Generated Message Display */}
                          <Box sx={{ 
                            p: 1.5, 
                            bgcolor: '#FFFFFF', 
                            borderRadius: 1, 
                            border: '1px solid', 
                            borderColor: 'divider',
                            mb: 1
                          }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                              Subject: {profile.generatedMessage?.message.subject}
                            </Typography>
                            <Typography variant="body2" sx={{ lineHeight: 1.5, fontSize: '0.8125rem', whiteSpace: 'pre-line', mb: 1 }}>
                              {profile.generatedMessage?.message.body}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                              Approach: {profile.generatedMessage?.message.approach}
                            </Typography>
                          </Box>
                        </Box>

                        {/* Action Buttons */}
                        <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }}>
                          <Tooltip title="Copy Message">
                            <IconButton
                              size="small"
                              onClick={() => {
                                const messageText = `${profile.generatedMessage?.message.subject}\n\n${profile.generatedMessage?.message.body}`;
                                navigator.clipboard.writeText(messageText);
                              }}
                              sx={{ 
                                color: 'primary.main',
                                border: '1px solid',
                                borderColor: 'primary.main',
                                width: 32,
                                height: 32,
                                '&:hover': {
                                  bgcolor: '#E3F2FD'
                                }
                              }}
                            >
                              <ContentCopyIcon sx={{ fontSize: '1rem' }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Reject Message">
                            <IconButton
                              size="small"
                              onClick={() => {
                                // Remove the generated message for this profile
                                setBulkProfiles(prev => prev.map(p => 
                                  p.id === profile.id 
                                    ? { ...p, generatedMessage: undefined, status: 'pending' as const }
                                    : p
                                ));
                              }}
                              sx={{ 
                                color: 'error.main',
                                border: '1px solid',
                                borderColor: 'error.main',
                                width: 32,
                                height: 32,
                                '&:hover': {
                                  bgcolor: '#FEE2E2'
                                }
                              }}
                            >
                              <CloseIcon sx={{ fontSize: '1rem' }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Approve & Schedule">
                            <IconButton
                              size="small"
                              onClick={() => {
                                // You could add scheduling functionality here
                                console.log('Schedule message for profile', profile.id);
                              }}
                              sx={{ 
                                color: 'white',
                                bgcolor: 'success.main',
                                width: 32,
                                height: 32,
                                '&:hover': {
                                  bgcolor: 'success.dark'
                                }
                              }}
                            >
                              <Box sx={{ fontSize: '1.2rem', fontWeight: 'bold' }}>✓</Box>
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </Box>
                    </Box>
                  ))
                ) : (
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    py: 6,
                    textAlign: 'center'
                  }}>
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                      No Generated Messages Yet
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                      Fill in the LinkedIn profiles above and click "Generate All Messages" to create personalized outreach messages.
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                      <Typography variant="caption" color="text.secondary">
                        Paste LinkedIn profiles in the spreadsheet above
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        →
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Set global preferences
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        →
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Generate messages
                      </Typography>
                    </Box>
                  </Box>
                )}
              </Box>
            </Paper>
          )}

          {/* Error Messages Display */}
          {bulkProfiles.some(p => p.status === 'error') && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6" gutterBottom color="error">
                Generation Errors
              </Typography>
              {bulkProfiles
                .filter(p => p.status === 'error')
                .map((profile) => (
                  <Alert key={profile.id} severity="error" sx={{ mb: 1 }}>
                    <Typography variant="subtitle2">
                      Person {profile.id}: {profile.error}
                    </Typography>
                  </Alert>
                ))}
            </Box>
          )}

          {/* Generate All Button */}
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
            <Button
              variant="contained"
              size="large"
              onClick={handleBulkGenerate}
              disabled={isBulkGenerating}
              sx={{
                px: 4,
                py: 1.5,
                backgroundColor: '#000',
                color: '#fff',
                '&:hover': {
                  backgroundColor: '#333',
                },
                '&:disabled': {
                  backgroundColor: '#ccc',
                }
              }}
            >
              {isBulkGenerating ? (
                <>
                  <CircularProgress size={20} sx={{ mr: 1, color: '#fff' }} />
                  Generating Messages...
                </>
              ) : (
                <>
                  <SendIcon sx={{ mr: 1 }} />
                  Generate All Messages
                </>
              )}
            </Button>
          </Box>
        </Box>
      </Collapse>
    </Paper>
  );
};

export default LinkedInOutreach;
