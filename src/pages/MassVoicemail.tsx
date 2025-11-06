import React, { useState, useEffect } from 'react';
import { getApiUrl, getSocketUrl } from '../config/api';
import {
  Box,
  Paper,
  Typography,
  Tabs,
  Tab,
  Button,
  Card,
  CardContent,
  Grid,
  TextField,
  Alert,
  List,
  ListItem,
  ListItemText,
  IconButton,
  LinearProgress,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar
} from '@mui/material';
import {
  CloudUpload,
  PlayArrow,
  Delete,
  FileDownload,
  Campaign,
  RecordVoiceOver,
  Phone
} from '@mui/icons-material';
import io from 'socket.io-client';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`mass-voicemail-tabpanel-${index}`}
      aria-labelledby={`mass-voicemail-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

interface VoiceClone {
  voice_id: string;
  name: string;
  status: 'cloning' | 'ready' | 'failed';
  created_at: string;
}

interface Campaign {
  id: string;
  name: string;
  status: 'creating' | 'generating' | 'completed' | 'failed';
  progress: number;
  total_contacts: number;
  completed_contacts: number;
  voice_clone_name: string;
  created_at: string;
  error_message?: string;
  last_updated?: string;
}

const MassVoicemail: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [voiceClones, setVoiceClones] = useState<VoiceClone[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Voice Cloning State
  const [cloneName, setCloneName] = useState('');
  const [selectedAudioFile, setSelectedAudioFile] = useState<File | null>(null);

  // Campaign Creation State
  const [campaignName, setCampaignName] = useState('');
  const [messageTemplate, setMessageTemplate] = useState('Hi {first_name}, this is calling from Equitle regarding investment opportunities for {company}. Please give me a call back!');
  const [selectedVoiceId, setSelectedVoiceId] = useState('');
  const [contactsFile, setContactsFile] = useState<File | null>(null);
  const [parsedContacts, setParsedContacts] = useState<any[]>([]);

  // Voicemail sending state
  const [voicemailDialog, setVoicemailDialog] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [callerIdNumber, setCallerIdNumber] = useState('');
  const [callerIdName, setCallerIdName] = useState('');
  const [isSendingVoicemails, setIsSendingVoicemails] = useState(false);

  // Real-time notifications
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');

  useEffect(() => {
    loadVoiceClones();
    loadCampaigns();

    // Initialize Socket.io connection
    const socket = io(getSocketUrl());

    // Listen for campaign progress updates
    socket.on('campaign-progress', (data) => {
      console.log('Campaign progress update:', data);

      // Update the campaign in the list
      setCampaigns(prev => prev.map(campaign =>
        campaign.id === data.campaignId
          ? {
              ...campaign,
              progress: data.progress,
              completed_contacts: data.completed,
              status: data.status,
              last_updated: new Date().toISOString()
            }
          : campaign
      ));

      // Show notification for significant progress
      if (data.progress % 25 === 0 || data.progress === 100) {
        setNotificationMessage(`Campaign ${data.progress}% complete - Processing ${data.currentContact}`);
        setNotificationOpen(true);
      }
    });

    // Listen for campaign completion
    socket.on('campaign-completed', (data) => {
      console.log('Campaign completed:', data);

      setCampaigns(prev => prev.map(campaign =>
        campaign.id === data.campaignId
          ? {
              ...campaign,
              status: data.status,
              progress: 100,
              completed_contacts: data.completed,
              last_updated: new Date().toISOString()
            }
          : campaign
      ));

      setNotificationMessage(`Campaign completed! Generated ${data.generatedFiles} audio files.`);
      setNotificationOpen(true);
    });

    // Listen for voicemail delivery completion
    socket.on('voicemail-delivery-completed', (data) => {
      console.log('Voicemail delivery completed:', data);

      setNotificationMessage(`Voicemails sent! ${data.successful} successful, ${data.failed} failed.`);
      setNotificationOpen(true);
    });

    // Cleanup on unmount
    return () => {
      socket.disconnect();
    };
  }, []);

  const loadVoiceClones = async () => {
    try {
      const response = await fetch(getApiUrl('mass-voicemail/voices'));
      const data = await response.json();
      setVoiceClones(data);
    } catch (error) {
      console.error('Failed to load voice clones:', error);
    }
  };

  const loadCampaigns = async () => {
    try {
      const response = await fetch(getApiUrl('mass-voicemail/campaigns'));
      const data = await response.json();
      setCampaigns(data);
    } catch (error) {
      console.error('Failed to load campaigns:', error);
    }
  };

  const handleAudioUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedAudioFile(file);
      setUploadError(null);
    }
  };

  const handleContactsUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setContactsFile(file);
      parseContacts(file);
    }
  };

  const parseContacts = async (file: File) => {
    const formData = new FormData();
    formData.append('contacts', file);

    try {
      const response = await fetch(getApiUrl('mass-voicemail/parse-contacts'), {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      setParsedContacts(data.contacts);
    } catch (error) {
      console.error('Failed to parse contacts:', error);
    }
  };

  const createVoiceClone = async () => {
    if (!selectedAudioFile || !cloneName) return;

    setIsUploading(true);
    setUploadError(null);

    const formData = new FormData();
    formData.append('audio', selectedAudioFile);
    formData.append('name', cloneName);

    try {
      const response = await fetch(getApiUrl('mass-voicemail/clone-voice'), {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        setCloneName('');
        setSelectedAudioFile(null);
        loadVoiceClones();
      } else {
        const error = await response.json();
        setUploadError(error.message);
      }
    } catch (error) {
      setUploadError('Failed to clone voice');
    } finally {
      setIsUploading(false);
    }
  };

  const createCampaign = async () => {
    if (!campaignName || !messageTemplate || !selectedVoiceId || !contactsFile) return;

    const formData = new FormData();
    formData.append('name', campaignName);
    formData.append('template', messageTemplate);
    formData.append('voice_id', selectedVoiceId);
    formData.append('contacts', contactsFile);

    try {
      const response = await fetch(getApiUrl('mass-voicemail/create-campaign'), {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        setCampaignName('');
        setContactsFile(null);
        setParsedContacts([]);
        loadCampaigns();
        setActiveTab(2); // Switch to campaigns tab
      }
    } catch (error) {
      console.error('Failed to create campaign:', error);
    }
  };

  const sendVoicemails = async (personalized = true) => {
    if (!selectedCampaign) return;

    // Validate caller ID is provided
    if (!callerIdNumber || callerIdNumber.trim().length === 0) {
      alert('Caller ID Number is required for Slybroadcast delivery.');
      return;
    }

    // Validate caller ID format (10 digits)
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(callerIdNumber.replace(/\D/g, ''))) {
      alert('Please enter a valid 10-digit phone number for Caller ID (e.g., 5551234567).');
      return;
    }

    setIsSendingVoicemails(true);

    try {
      const endpoint = personalized
        ? getApiUrl(`mass-voicemail/campaigns/${selectedCampaign.id}/send-personalized-voicemails`)
        : getApiUrl(`mass-voicemail/campaigns/${selectedCampaign.id}/send-voicemails`);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          callerIdNumber,
          callerIdName,
        }),
      });

      const data = await response.json();

      if (data.success) {
        if (personalized) {
          const successMsg = `Personalized voicemails sent!\nSuccessful: ${data.results.successful}\nFailed: ${data.results.failed}\nTotal: ${data.results.total}`;

          // Show failed deliveries if any
          if (data.results.failed > 0 && data.results.failedDeliveries) {
            const failedDetails = data.results.failedDeliveries.map((f: any) => `${f.phoneNumber}: ${f.error}`).join('\n');
            alert(`${successMsg}\n\nFailed deliveries:\n${failedDetails}`);
          } else {
            alert(successMsg);
          }
        } else {
          alert(`Voicemails sent successfully! Broadcast ID: ${data.broadcastId}\nSent to ${data.sentTo} numbers.`);
        }
        setVoicemailDialog(false);
        setCallerIdNumber('');
        setCallerIdName('');
        loadCampaigns(); // Refresh campaigns to show updated status
      } else {
        alert(`Failed to send voicemails: ${data.error}`);
      }
    } catch (error) {
      console.error('Failed to send voicemails:', error);
      alert('Failed to send voicemails. Please try again.');
    } finally {
      setIsSendingVoicemails(false);
    }
  };

  const openVoicemailDialog = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setVoicemailDialog(true);
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <Box sx={{
      background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
      minHeight: '100vh',
      pb: 6
    }}>
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
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.02) 0%, rgba(79, 70, 229, 0.05) 100%)',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: -50,
            right: -50,
            width: 100,
            height: 100,
            background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
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
            background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
            borderRadius: 2,
            opacity: 0.1,
            transform: 'rotate(15deg)'
          }
        }} />

        <Box sx={{ position: 'relative', zIndex: 2, px: 4, py: 6 }}>
          <Grid container spacing={6} alignItems="center">
            <Grid item xs={12} md={8}>
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
                Mass Voicemail System
              </Typography>

              <Typography
                variant="h6"
                sx={{
                  color: '#64748b',
                  mb: 4,
                  fontWeight: 400,
                  lineHeight: 1.6,
                  fontSize: { xs: '1.1rem', md: '1.25rem' }
                }}
              >
                Clone voices, create personalized campaigns, and reach thousands with authentic voice messages.
              </Typography>

              <Typography
                variant="body1"
                sx={{
                  color: '#475569',
                  mb: 6,
                  fontSize: '1rem',
                  lineHeight: 1.7,
                  maxWidth: '600px'
                }}
              >
                Upload audio samples to clone voices, create targeted campaigns, and automate mass voice messaging at scale.
              </Typography>
            </Grid>

            <Grid item xs={12} md={4}>
              <Box sx={{
                position: 'relative',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: 300
              }}>
                {/* Decorative Voicemail Elements */}
                <Box sx={{
                  position: 'relative',
                  width: 200,
                  height: 200,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 1
                }}>
                  {/* Voice Waves */}
                  <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                    <Box sx={{ width: 8, height: 24, background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', borderRadius: 4 }} />
                    <Box sx={{ width: 8, height: 40, background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)', borderRadius: 4 }} />
                    <Box sx={{ width: 8, height: 16, background: 'linear-gradient(135deg, #7c3aed 0%, #9333ea 100%)', borderRadius: 4 }} />
                    <Box sx={{ width: 8, height: 32, background: 'linear-gradient(135deg, #9333ea 0%, #a855f7 100%)', borderRadius: 4 }} />
                    <Box sx={{ width: 8, height: 20, background: 'linear-gradient(135deg, #a855f7 0%, #c084fc 100%)', borderRadius: 4 }} />
                  </Box>
                  <Box sx={{ width: 60, height: 60, borderRadius: '50%', bgcolor: '#e2e8f0', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <RecordVoiceOver sx={{ fontSize: 28, color: '#6366f1' }} />
                  </Box>
                </Box>

                {/* Floating Elements */}
                <Box
                  sx={{
                    position: 'absolute',
                    top: 40,
                    right: 40,
                    width: 32,
                    height: 32,
                    background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                    borderRadius: 2,
                    transform: 'rotate(15deg)',
                    boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
                  }}
                />
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: 60,
                    left: 20,
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #7c3aed 0%, #9333ea 100%)',
                    boxShadow: '0 4px 12px rgba(124, 58, 237, 0.3)'
                  }}
                />
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Box>

      {/* Modern Tab Navigation */}
      <Box sx={{ px: 4, mb: 4 }}>
        <Box sx={{
          bgcolor: 'white',
          borderRadius: 3,
          p: 1,
          boxShadow: '0 2px 8px rgba(15, 23, 42, 0.08)',
          display: 'inline-flex',
          border: '1px solid #e2e8f0'
        }}>
          <Button
            onClick={() => setActiveTab(0)}
            sx={{
              px: 3,
              py: 1.5,
              borderRadius: 2,
              color: activeTab === 0 ? 'white' : '#64748b',
              bgcolor: activeTab === 0 ? 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' : 'transparent',
              background: activeTab === 0 ? 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' : 'transparent',
              fontWeight: 600,
              textTransform: 'none',
              minWidth: 'auto',
              boxShadow: activeTab === 0 ? '0 2px 8px rgba(99, 102, 241, 0.3)' : 'none',
              '&:hover': {
                bgcolor: activeTab === 0 ? undefined : '#f8fafc',
                color: activeTab === 0 ? 'white' : '#6366f1'
              },
              transition: 'all 0.2s ease'
            }}
          >
            <RecordVoiceOver sx={{ mr: 1, fontSize: 20 }} />
            Voice Cloning
          </Button>
          <Button
            onClick={() => setActiveTab(1)}
            sx={{
              px: 3,
              py: 1.5,
              borderRadius: 2,
              color: activeTab === 1 ? 'white' : '#64748b',
              bgcolor: activeTab === 1 ? 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' : 'transparent',
              background: activeTab === 1 ? 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' : 'transparent',
              fontWeight: 600,
              textTransform: 'none',
              minWidth: 'auto',
              boxShadow: activeTab === 1 ? '0 2px 8px rgba(99, 102, 241, 0.3)' : 'none',
              '&:hover': {
                bgcolor: activeTab === 1 ? undefined : '#f8fafc',
                color: activeTab === 1 ? 'white' : '#6366f1'
              },
              transition: 'all 0.2s ease'
            }}
          >
            <Campaign sx={{ mr: 1, fontSize: 20 }} />
            Create Campaign
          </Button>
          <Button
            onClick={() => setActiveTab(2)}
            sx={{
              px: 3,
              py: 1.5,
              borderRadius: 2,
              color: activeTab === 2 ? 'white' : '#64748b',
              bgcolor: activeTab === 2 ? 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' : 'transparent',
              background: activeTab === 2 ? 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' : 'transparent',
              fontWeight: 600,
              textTransform: 'none',
              minWidth: 'auto',
              boxShadow: activeTab === 2 ? '0 2px 8px rgba(99, 102, 241, 0.3)' : 'none',
              '&:hover': {
                bgcolor: activeTab === 2 ? undefined : '#f8fafc',
                color: activeTab === 2 ? 'white' : '#6366f1'
              },
              transition: 'all 0.2s ease'
            }}
          >
            <Phone sx={{ mr: 1, fontSize: 20 }} />
            My Campaigns
          </Button>
        </Box>
      </Box>

      <Box sx={{ px: 4 }}>

        {/* Voice Cloning Tab */}
        <TabPanel value={activeTab} index={0}>
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Paper sx={{
                p: 6,
                borderRadius: 4,
                boxShadow: '0 4px 20px rgba(15, 23, 42, 0.08)',
                border: '1px solid #f1f5f9'
              }}>
                <Box sx={{ textAlign: 'center', mb: 4 }}>
                  <Box sx={{
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mx: 'auto',
                    mb: 3,
                    boxShadow: '0 8px 32px rgba(99, 102, 241, 0.3)'
                  }}>
                    <RecordVoiceOver sx={{ fontSize: 32, color: 'white' }} />
                  </Box>

                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: 700,
                      mb: 2,
                      color: '#1e293b'
                    }}
                  >
                    Clone Your Voice
                  </Typography>

                  <Typography
                    variant="body1"
                    sx={{
                      color: '#64748b',
                      mb: 4,
                      lineHeight: 1.6
                    }}
                  >
                    Upload a 1-5 minute audio sample of clear speech to clone your voice.
                  </Typography>
                </Box>

                  <TextField
                    fullWidth
                    label="Voice Clone Name"
                    value={cloneName}
                    onChange={(e) => setCloneName(e.target.value)}
                    sx={{ mb: 2 }}
                  />

                  <Button
                    variant="outlined"
                    component="label"
                    fullWidth
                    startIcon={<CloudUpload />}
                    sx={{ mb: 2 }}
                  >
                    Upload Audio File (WAV/MP3)
                    <input
                      type="file"
                      hidden
                      accept=".wav,.mp3,.flac"
                      onChange={handleAudioUpload}
                    />
                  </Button>

                  {selectedAudioFile && (
                    <Typography variant="body2" sx={{ mb: 2 }}>
                      Selected: {selectedAudioFile.name}
                    </Typography>
                  )}

                  {uploadError && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                      {uploadError}
                    </Alert>
                  )}

                  <Button
                    variant="contained"
                    fullWidth
                    onClick={createVoiceClone}
                    disabled={!selectedAudioFile || !cloneName || isUploading}
                    sx={{
                      background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                      color: 'white',
                      py: 1.5,
                      borderRadius: 3,
                      fontSize: '1rem',
                      fontWeight: 600,
                      textTransform: 'none',
                      boxShadow: '0 4px 14px rgba(99, 102, 241, 0.3)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                        boxShadow: '0 6px 20px rgba(99, 102, 241, 0.4)',
                        transform: 'translateY(-2px)'
                      },
                      '&:disabled': {
                        background: '#cbd5e1',
                        color: '#64748b',
                        boxShadow: 'none',
                        transform: 'none'
                      },
                      transition: 'all 0.3s ease'
                    }}
                  >
                    {isUploading ? 'Cloning Voice...' : 'Clone Voice'}
                  </Button>
                </Paper>
            </Grid>

            <Grid item xs={12} md={6}>
              <Paper sx={{
                p: 4,
                borderRadius: 4,
                boxShadow: '0 4px 20px rgba(15, 23, 42, 0.08)',
                border: '1px solid #f1f5f9',
                height: 'fit-content'
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
                  <Box sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 2,
                    background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mr: 2
                  }}>
                    <RecordVoiceOver sx={{ color: '#6366f1', fontSize: 20 }} />
                  </Box>
                  <Typography variant="h6" sx={{
                    fontWeight: 700,
                    color: '#1e293b'
                  }}>
                    My Voice Clones
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {voiceClones.map((voice) => (
                    <Box
                      key={voice.voice_id}
                      sx={{
                        p: 3,
                        border: '1px solid #f1f5f9',
                        borderRadius: 3,
                        bgcolor: 'white',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          borderColor: '#6366f1',
                          bgcolor: '#f8fafc',
                          transform: 'translateY(-2px)',
                          boxShadow: '0 4px 12px rgba(99, 102, 241, 0.15)'
                        }
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1e293b', mb: 0.5 }}>
                            {voice.name}
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#64748b' }}>
                            Created: {new Date(voice.created_at).toLocaleDateString()}
                          </Typography>
                        </Box>
                        <Chip
                          label={voice.status}
                          color={voice.status === 'ready' ? 'success' : voice.status === 'failed' ? 'error' : 'warning'}
                          sx={{ fontWeight: 600 }}
                        />
                      </Box>
                    </Box>
                  ))}

                  {voiceClones.length === 0 && (
                    <Box sx={{ textAlign: 'center', py: 6 }}>
                      <Box sx={{
                        width: 80,
                        height: 80,
                        borderRadius: '50%',
                        bgcolor: '#f8fafc',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mx: 'auto',
                        mb: 3
                      }}>
                        <RecordVoiceOver sx={{ fontSize: 32, color: '#94a3b8' }} />
                      </Box>
                      <Typography variant="h6" sx={{ fontWeight: 600, color: '#475569', mb: 1 }}>
                        No voice clones yet
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#64748b' }}>
                        Upload an audio sample to create your first voice clone
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Create Campaign Tab */}
        <TabPanel value={activeTab} index={1}>
          <Grid container spacing={4}>
            <Grid item xs={12} md={8}>
              <Paper sx={{
                p: 6,
                borderRadius: 4,
                boxShadow: '0 4px 20px rgba(15, 23, 42, 0.08)',
                border: '1px solid #f1f5f9'
              }}>
                <Box sx={{ textAlign: 'center', mb: 4 }}>
                  <Box sx={{
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mx: 'auto',
                    mb: 3,
                    boxShadow: '0 8px 32px rgba(99, 102, 241, 0.3)'
                  }}>
                    <Campaign sx={{ fontSize: 32, color: 'white' }} />
                  </Box>

                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: 700,
                      mb: 2,
                      color: '#1e293b'
                    }}
                  >
                    Create New Campaign
                  </Typography>

                  <Typography
                    variant="body1"
                    sx={{
                      color: '#64748b',
                      mb: 4,
                      lineHeight: 1.6
                    }}
                  >
                    Set up a personalized voicemail campaign for your contacts.
                  </Typography>
                </Box>

                <TextField
                  fullWidth
                  label="Campaign Name"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  sx={{
                    mb: 3,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 3,
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#6366f1'
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#6366f1'
                      }
                    }
                  }}
                />

                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Message Template"
                  value={messageTemplate}
                  onChange={(e) => setMessageTemplate(e.target.value)}
                  helperText="Use variables: {name}, {first_name}, {company}, {title}, {industry}, {location}"
                  sx={{
                    mb: 3,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 3,
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#6366f1'
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#6366f1'
                      }
                    }
                  }}
                />

                <TextField
                  fullWidth
                  select
                  label="Select Voice Clone"
                  value={selectedVoiceId}
                  onChange={(e) => setSelectedVoiceId(e.target.value)}
                  SelectProps={{ native: true }}
                  sx={{
                    mb: 3,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 3,
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#6366f1'
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#6366f1'
                      }
                    }
                  }}
                >
                  <option value="">Choose a voice...</option>
                  {voiceClones.filter(v => v.status === 'ready').map((voice) => (
                    <option key={voice.voice_id} value={voice.voice_id}>
                      {voice.name}
                    </option>
                  ))}
                </TextField>

                <Button
                  variant="outlined"
                  component="label"
                  fullWidth
                  startIcon={<CloudUpload />}
                  sx={{
                    mb: 3,
                    py: 1.5,
                    borderRadius: 3,
                    borderColor: '#6366f1',
                    color: '#6366f1',
                    fontSize: '1rem',
                    fontWeight: 600,
                    textTransform: 'none',
                    '&:hover': {
                      borderColor: '#4f46e5',
                      bgcolor: '#f8fafc',
                      color: '#4f46e5'
                    }
                  }}
                >
                  Upload Contacts (Excel/CSV)
                  <input
                    type="file"
                    hidden
                    accept=".csv,.xlsx,.xls"
                    onChange={handleContactsUpload}
                  />
                </Button>

                {contactsFile && (
                  <Alert severity="success" sx={{ mb: 3, borderRadius: 3 }}>
                    <Typography variant="body2">
                      <strong>Uploaded:</strong> {contactsFile.name} ({parsedContacts.length} contacts)
                    </Typography>
                  </Alert>
                )}

                <Button
                  variant="contained"
                  fullWidth
                  startIcon={<Campaign />}
                  onClick={createCampaign}
                  disabled={!campaignName || !selectedVoiceId || !contactsFile}
                  sx={{
                    background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                    color: 'white',
                    py: 1.5,
                    borderRadius: 3,
                    fontSize: '1rem',
                    fontWeight: 600,
                    textTransform: 'none',
                    boxShadow: '0 4px 14px rgba(99, 102, 241, 0.3)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                      boxShadow: '0 6px 20px rgba(99, 102, 241, 0.4)',
                      transform: 'translateY(-2px)'
                    },
                    '&:disabled': {
                      background: '#cbd5e1',
                      color: '#64748b',
                      boxShadow: 'none',
                      transform: 'none'
                    },
                    transition: 'all 0.3s ease'
                  }}
                >
                  Create Campaign
                </Button>
              </Paper>
            </Grid>

            <Grid item xs={12} md={4}>
              <Paper sx={{
                p: 4,
                borderRadius: 4,
                boxShadow: '0 4px 20px rgba(15, 23, 42, 0.08)',
                border: '1px solid #f1f5f9',
                height: 'fit-content'
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
                  <Box sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 2,
                    background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mr: 2
                  }}>
                    <Phone sx={{ color: '#6366f1', fontSize: 20 }} />
                  </Box>
                  <Typography variant="h6" sx={{
                    fontWeight: 700,
                    color: '#1e293b'
                  }}>
                    Contact Preview
                  </Typography>
                </Box>

                {parsedContacts.length > 0 ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {parsedContacts.slice(0, 3).map((contact, index) => (
                      <Box
                        key={index}
                        sx={{
                          p: 3,
                          border: '1px solid #f1f5f9',
                          borderRadius: 3,
                          bgcolor: 'white',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            borderColor: '#6366f1',
                            bgcolor: '#f8fafc',
                            transform: 'translateY(-1px)',
                            boxShadow: '0 2px 8px rgba(99, 102, 241, 0.1)'
                          }
                        }}
                      >
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#1e293b', mb: 0.5 }}>
                          {contact.name}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#64748b' }}>
                          {contact.company} - {contact.phone}
                        </Typography>
                      </Box>
                    ))}

                    {parsedContacts.length > 3 && (
                      <Box sx={{ textAlign: 'center', py: 2 }}>
                        <Typography variant="body2" sx={{ color: '#64748b', fontStyle: 'italic' }}>
                          ... and {parsedContacts.length - 3} more contacts
                        </Typography>
                      </Box>
                    )}
                  </Box>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 6 }}>
                    <Box sx={{
                      width: 60,
                      height: 60,
                      borderRadius: '50%',
                      bgcolor: '#f8fafc',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mx: 'auto',
                      mb: 2
                    }}>
                      <Phone sx={{ fontSize: 24, color: '#94a3b8' }} />
                    </Box>
                    <Typography variant="body2" sx={{ color: '#64748b' }}>
                      Upload a contacts file to see preview
                    </Typography>
                  </Box>
                )}
              </Paper>
            </Grid>
          </Grid>
        </TabPanel>

        {/* My Campaigns Tab */}
        <TabPanel value={activeTab} index={2}>
          <Box sx={{ mb: 4 }}>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                color: '#1e293b',
                mb: 2,
                fontSize: { xs: '1.8rem', md: '2.2rem' }
              }}
            >
              My Campaigns
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: '#64748b',
                fontSize: '1rem',
                lineHeight: 1.6
              }}
            >
              Manage and track your voice messaging campaigns
            </Typography>
          </Box>

          {campaigns.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Paper sx={{
                p: 6,
                borderRadius: 4,
                boxShadow: '0 4px 20px rgba(15, 23, 42, 0.08)',
                border: '1px solid #f1f5f9',
                maxWidth: 400,
                mx: 'auto'
              }}>
                <Box sx={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  bgcolor: '#f8fafc',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 3
                }}>
                  <Campaign sx={{ fontSize: 32, color: '#94a3b8' }} />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#475569', mb: 1 }}>
                  No campaigns yet
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748b', mb: 3 }}>
                  Create your first campaign to get started with mass voicemail
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<Campaign />}
                  onClick={() => setActiveTab(1)}
                  sx={{
                    background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                    color: 'white',
                    py: 1.5,
                    px: 3,
                    borderRadius: 3,
                    fontSize: '1rem',
                    fontWeight: 600,
                    textTransform: 'none',
                    boxShadow: '0 4px 14px rgba(99, 102, 241, 0.3)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                      boxShadow: '0 6px 20px rgba(99, 102, 241, 0.4)',
                      transform: 'translateY(-2px)'
                    },
                    transition: 'all 0.3s ease'
                  }}
                >
                  Create Campaign
                </Button>
              </Paper>
            </Box>
          ) : (
            <Grid container spacing={4}>
              {campaigns.map((campaign) => (
                <Grid item xs={12} md={6} lg={4} key={campaign.id}>
                  <Paper sx={{
                    p: 4,
                    borderRadius: 4,
                    boxShadow: '0 4px 20px rgba(15, 23, 42, 0.08)',
                    border: '1px solid #f1f5f9',
                    height: '100%',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 8px 32px rgba(15, 23, 42, 0.12)'
                    }
                  }}>
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b', mb: 1 }}>
                        {campaign.name}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#64748b', mb: 2 }}>
                        Voice: {campaign.voice_clone_name}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#475569', mb: 2 }}>
                        {campaign.completed_contacts} / {campaign.total_contacts} contacts
                      </Typography>

                      <Chip
                        label={campaign.status.toUpperCase()}
                        size="small"
                        sx={{
                          fontWeight: 600,
                          fontSize: '0.75rem',
                          bgcolor: campaign.status === 'completed' ? '#10b981' :
                                  campaign.status === 'failed' ? '#ef4444' :
                                  campaign.status === 'generating' ? '#f59e0b' : '#6366f1',
                          color: 'white',
                          '& .MuiChip-label': {
                            px: 2
                          }
                        }}
                      />
                    </Box>

                    {campaign.status === 'generating' && (
                      <Box sx={{ mb: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Typography variant="body2" sx={{ color: '#475569', fontWeight: 600 }}>
                            Progress
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#6366f1', fontWeight: 600 }}>
                            {campaign.progress}%
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={campaign.progress}
                          sx={{
                            height: 8,
                            borderRadius: 4,
                            bgcolor: '#f1f5f9',
                            '& .MuiLinearProgress-bar': {
                              bgcolor: '#6366f1',
                              borderRadius: 4
                            }
                          }}
                        />
                      </Box>
                    )}

                    {campaign.status === 'failed' && campaign.error_message && (
                      <Alert
                        severity="error"
                        sx={{
                          mb: 3,
                          borderRadius: 3,
                          fontSize: '0.875rem',
                          '& .MuiAlert-message': {
                            fontSize: '0.875rem'
                          }
                        }}
                      >
                        {campaign.error_message}
                      </Alert>
                    )}

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 'auto' }}>
                      {campaign.status === 'completed' && (
                        <>
                          <Button
                            variant="outlined"
                            startIcon={<FileDownload />}
                            onClick={() => {
                              window.open(getApiUrl(`mass-voicemail/campaigns/${campaign.id}/download`), '_blank');
                            }}
                            sx={{
                              borderRadius: 3,
                              borderColor: '#6366f1',
                              color: '#6366f1',
                              fontWeight: 600,
                              textTransform: 'none',
                              py: 1,
                              '&:hover': {
                                borderColor: '#4f46e5',
                                bgcolor: '#f8fafc',
                                color: '#4f46e5'
                              }
                            }}
                          >
                            Download MP3
                          </Button>

                          <Button
                            variant="contained"
                            startIcon={<Phone />}
                            onClick={() => openVoicemailDialog(campaign)}
                            sx={{
                              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                              color: 'white',
                              py: 1,
                              borderRadius: 3,
                              fontWeight: 600,
                              textTransform: 'none',
                              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)',
                              '&:hover': {
                                background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                                boxShadow: '0 6px 20px rgba(16, 185, 129, 0.4)',
                                transform: 'translateY(-1px)'
                              },
                              transition: 'all 0.3s ease'
                            }}
                          >
                            Send Voicemails
                          </Button>
                        </>
                      )}

                      {campaign.last_updated && (
                        <Typography variant="caption" sx={{ color: '#94a3b8', textAlign: 'center', mt: 2 }}>
                          Last updated: {new Date(campaign.last_updated).toLocaleTimeString()}
                        </Typography>
                      )}
                    </Box>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          )}
        </TabPanel>
      </Box>

      {/* Voicemail Sending Dialog */}
      <Dialog open={voicemailDialog} onClose={() => setVoicemailDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Send Voicemails - {selectedCampaign?.name}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            This will send personalized voicemails to {selectedCampaign?.total_contacts} contacts using Slybroadcast.
          </Typography>

          <TextField
            fullWidth
            label="Caller ID Number (Required)"
            value={callerIdNumber}
            onChange={(e) => setCallerIdNumber(e.target.value)}
            placeholder="e.g. 5551234567"
            helperText="10-digit US phone number that will appear as the caller (required by Slybroadcast)"
            required
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            label="Caller ID Name (Optional)"
            value={callerIdName}
            onChange={(e) => setCallerIdName(e.target.value)}
            placeholder="e.g. Your Company Name"
            helperText="Name that will appear on the recipient's phone"
            sx={{ mb: 2 }}
          />

          <Alert severity="info">
            <strong>Important:</strong> Make sure you have valid Slybroadcast credentials configured.
            This will charge your Slybroadcast account approximately $0.06-$0.12 per voicemail.
          </Alert>

          <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
            Delivery Method
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Choose how to deliver your voicemails:
          </Typography>
        </DialogContent>
        <DialogActions sx={{ flexDirection: 'column', gap: 1, alignItems: 'stretch', p: 3 }}>
          <Button
            variant="contained"
            onClick={() => sendVoicemails(true)}
            disabled={isSendingVoicemails}
            startIcon={<Phone />}
            color="primary"
            fullWidth
          >
            {isSendingVoicemails ? 'Sending...' : 'Send Personalized Voicemails (Recommended)'}
          </Button>
          <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center', px: 2 }}>
            Each contact receives their personalized message
          </Typography>

          <Button
            variant="outlined"
            onClick={() => sendVoicemails(false)}
            disabled={isSendingVoicemails}
            startIcon={<Phone />}
            fullWidth
          >
            {isSendingVoicemails ? 'Sending...' : 'Send Bulk Voicemail (Single Message)'}
          </Button>
          <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center', px: 2 }}>
            All contacts receive the same message
          </Typography>

          <Button onClick={() => setVoicemailDialog(false)} sx={{ mt: 2 }}>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>

      {/* Real-time notifications */}
      <Snackbar
        open={notificationOpen}
        autoHideDuration={6000}
        onClose={() => setNotificationOpen(false)}
        message={notificationMessage}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      />
    </Box>
  );
};

export default MassVoicemail;