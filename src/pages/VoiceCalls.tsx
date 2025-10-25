import React, { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { getApiUrl, getSocketUrl } from '../config/api';
import {
  Box,
  Paper,
  Typography,
  Button,
  Avatar,
  Grid,
  Card,
  CardContent,
  Divider,
  IconButton,
  Tooltip,
  Alert,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormLabel,
  TextField,
  CircularProgress,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Switch,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  Stack
} from '@mui/material';
import {
  Phone as PhoneIcon,
  Call as CallIcon,
  History as HistoryIcon,
  Settings as SettingsIcon,
  Person as PersonIcon,
  Timer as TimerIcon,
  VolumeUp as VolumeUpIcon,
  Mic as MicIcon,
  Groups as GroupsIcon,
  Voicemail as VoicemailIcon,
  AddIcCall as AddIcCallIcon,
  CloudUpload as CloudUploadIcon,
  RecordVoiceOver as RecordVoiceOverIcon,
  Delete as DeleteIcon,
  Campaign as CampaignIcon,
  Upload as UploadIcon,
  PlayArrow as PlayArrowIcon,
  Pause as PauseIcon,
  Stop as StopIcon,
  Assignment as AssignmentIcon
} from '@mui/icons-material';

interface VoiceProfile {
  id: string;
  name: string;
  description: string;
  elevenLabsVoiceId: string;
  isDefault: boolean;
  createdAt: Date;
}

interface CallHistory {
  id: string;
  phoneNumber: string;
  duration?: number;
  startTime: Date;
  endTime?: Date;
  status: 'initiated' | 'connecting' | 'in_progress' | 'completed' | 'failed';
  callType: 'live' | 'voicemail';
  transcript: string[];
}

interface Campaign {
  id: string;
  name: string;
  description?: string;
  messageTemplate: string;
  status: 'draft' | 'running' | 'paused' | 'completed' | 'failed';
  totalContacts: number;
  completedContacts: number;
  failedContacts: number;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

interface CampaignContact {
  name: string;
  phoneNumber: string;
  companyName?: string;
  status: 'pending' | 'calling' | 'completed' | 'failed';
}

interface MessageTemplate {
  id: string;
  name: string;
  description: string;
  template: string;
}

const DEFAULT_AI_PROMPT = `You are a professional searcher working for Equitle, a deal management platform.

Your role:
- You help identify and connect with potential investors for our clients' deals
- You conduct professional outreach calls to assess investment interest
- You gather information about investment criteria and preferences
- You maintain a professional, friendly, and knowledgeable tone

Conversation guidelines:
- Introduce yourself as calling from Equitle
- Briefly explain you're conducting research on investment opportunities
- Ask about their investment focus and criteria
- Keep the conversation under 5 minutes
- Always ask for permission before continuing the conversation
- End with next steps if there's interest

Be natural, conversational, and respectful of their time.`;


export default function VoiceCalls() {
  // Existing individual call state
  const [phoneNumber, setPhoneNumber] = useState('');
  const [callType, setCallType] = useState('live');
  const [contactName, setContactName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [dealType, setDealType] = useState('');
  const [investmentRange, setInvestmentRange] = useState('');
  const [industryFocus, setIndustryFocus] = useState('');
  const [customInstructions, setCustomInstructions] = useState('');
  const [selectedVoice, setSelectedVoice] = useState('');
  const [voiceProfiles, setVoiceProfiles] = useState<VoiceProfile[]>([]);
  const [callHistory, setCallHistory] = useState<CallHistory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [message, setMessage] = useState('');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [activeCall, setActiveCall] = useState<string | null>(null);
  const [realTimeTranscript, setRealTimeTranscript] = useState<string[]>([]);
  const [showVoiceDialog, setShowVoiceDialog] = useState(false);
  const [voiceFile, setVoiceFile] = useState<File | null>(null);
  const [voiceName, setVoiceName] = useState('');
  const [voiceDescription, setVoiceDescription] = useState('');
  const [uploadingVoice, setUploadingVoice] = useState(false);

  // Tab management
  const [currentTab, setCurrentTab] = useState(0);

  // Campaign state
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [campaignName, setCampaignName] = useState('');
  const [campaignDescription, setCampaignDescription] = useState('');
  const [messageTemplate, setMessageTemplate] = useState('');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvContacts, setCsvContacts] = useState<CampaignContact[]>([]);
  const [showCsvPreview, setShowCsvPreview] = useState(false);
  const [creatingCampaign, setCreatingCampaign] = useState(false);
  const [loadingCampaigns, setLoadingCampaigns] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [showCampaignDetail, setShowCampaignDetail] = useState(false);
  const [showCampaignDialog, setShowCampaignDialog] = useState(false);
  const [messageTemplates, setMessageTemplates] = useState<MessageTemplate[]>([]);

  const handlePhoneNumberChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPhoneNumber(event.target.value);
  };

  const handleVoiceChange = (event: any) => {
    setSelectedVoice(event.target.value);
  };

  const handleCallTypeChange = (event: any) => {
    setCallType(event.target.value);
  };

  const handleStartCall = async () => {
    if (!phoneNumber.trim()) {
      setMessage('Please enter a phone number');
      setShowError(true);
      return;
    }

    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };

      // Add auth header if token exists
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(getApiUrl('voice-agent/create-call'), {
        method: 'POST',
        headers,
        body: JSON.stringify({
          phoneNumber: phoneNumber.trim(),
          callType,
          contactName: contactName.trim(),
          companyName: companyName.trim(),
          dealType,
          investmentRange,
          industryFocus: industryFocus.trim(),
          customInstructions: customInstructions.trim(),
          voiceId: selectedVoice || undefined
        })
      });

      const data = await response.json();

      if (data.success) {
        setMessage(`Call initiated successfully! Call ID: ${data.callId}`);
        setShowSuccess(true);
        setPhoneNumber('');
        setContactName('');
        setCompanyName('');
        setDealType('');
        setInvestmentRange('');
        setIndustryFocus('');
        setCustomInstructions('');
        loadCallHistory(); // Refresh call history
      } else {
        setMessage(data.error || 'Failed to initiate call');
        setShowError(true);
      }
    } catch (error) {
      setMessage('Network error. Please try again.');
      setShowError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const loadVoiceProfiles = async () => {
    try {
      const response = await fetch(getApiUrl('voice-agent/voices'), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        console.error('Voice profiles API response not ok:', response.status);
        setVoiceProfiles([]);
        return;
      }

      const data = await response.json();
      console.log('Voice profiles API response:', data);

      // Handle direct array response (new format from mass voicemail endpoint)
      if (Array.isArray(data)) {
        // Convert mass voicemail format to VoiceProfile format
        const convertedVoices = data.map(voice => ({
          id: voice.voice_id,
          name: voice.name,
          description: voice.name, // Use name as description
          elevenLabsVoiceId: voice.voice_id,
          isDefault: false,
          userId: 'current-user',
          createdAt: new Date(),
          updatedAt: new Date()
        }));
        setVoiceProfiles(convertedVoices);
      } else if (data && data.voices && Array.isArray(data.voices)) {
        // Handle old format if it still exists
        setVoiceProfiles(data.voices);
      } else {
        console.warn('Unexpected voice profiles response format:', data);
        setVoiceProfiles([]);
      }
    } catch (error) {
      console.error('Failed to load voice profiles:', error);
      setVoiceProfiles([]);
    }
  };

  const loadCallHistory = async () => {
    try {
      const response = await fetch(getApiUrl('voice-agent/calls?limit=10'), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        console.error('Call history API response not ok:', response.status);
        setCallHistory([]);
        return;
      }

      const data = await response.json();
      if (data && data.calls && Array.isArray(data.calls)) {
        setCallHistory(data.calls);
      } else {
        console.warn('Unexpected call history response format:', data);
        setCallHistory([]);
      }
    } catch (error) {
      console.error('Failed to load call history:', error);
      setCallHistory([]);
    }
  };

  const loadCampaigns = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(getApiUrl('campaigns'), {
        headers
      });

      if (!response.ok) {
        console.error('Campaigns API response not ok:', response.status);
        setCampaigns([]);
        return;
      }

      const data = await response.json();
      if (data && data.success && Array.isArray(data.campaigns)) {
        setCampaigns(data.campaigns);
      } else {
        console.warn('Unexpected campaigns response format:', data);
        setCampaigns([]);
      }
    } catch (error) {
      console.error('Failed to load campaigns:', error);
      setCampaigns([]);
    }
  };

  useEffect(() => {
    const initializeData = async () => {
      try {
        await Promise.all([
          loadVoiceProfiles(),
          loadCallHistory(),
          loadCampaigns()
        ]);
      } catch (error) {
        console.error('Error initializing voice calls page:', error);
      } finally {
        setInitialLoading(false);
      }
    };

    initializeData();

    // Initialize WebSocket connection
    const socketConnection = io(getSocketUrl(), {
      auth: {
        token: localStorage.getItem('token')
      }
    });

    setSocket(socketConnection);

    // Join user room for real-time updates
    const userId = 'dev-user-123'; // Replace with actual user ID from auth
    socketConnection.emit('join-room', `user-${userId}`);

    // Listen for call events
    socketConnection.on('call_initiated', (data) => {
      setActiveCall(data.callId);
      setMessage(`Call initiated to ${formatPhoneNumber(data.phoneNumber)}`);
      setShowSuccess(true);
      loadCallHistory(); // Refresh call history
    });

    socketConnection.on('call_started', (data) => {
      setMessage('Call connected and in progress');
      setShowSuccess(true);
      loadCallHistory();
    });

    socketConnection.on('call_transcript_update', (data) => {
      if (data.callId === activeCall) {
        setRealTimeTranscript(prev => [
          ...prev,
          `${data.transcript.role === 'agent' ? 'AI' : 'User'}: ${data.transcript.content}`
        ]);
      }
    });

    socketConnection.on('call_ended', (data) => {
      if (data.callId === activeCall) {
        setActiveCall(null);
        setRealTimeTranscript([]);
        setMessage(`Call completed. Summary: ${data.summary?.summary || 'Call finished successfully'}`);
        setShowSuccess(true);
        loadCallHistory();
      }
    });

    socketConnection.on('call_failed', (data) => {
      if (data.callId === activeCall) {
        setActiveCall(null);
        setRealTimeTranscript([]);
        setMessage(`Call failed: ${data.error}`);
        setShowError(true);
        loadCallHistory();
      }
    });

    return () => {
      socketConnection.disconnect();
    };
  }, [activeCall]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success.main';
      case 'failed': return 'error.main';
      case 'in_progress': return 'info.main';
      case 'connecting': return 'warning.main';
      case 'initiated': return 'text.secondary';
      default: return 'text.secondary';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Completed';
      case 'failed': return 'Failed';
      case 'in_progress': return 'In Progress';
      case 'connecting': return 'Connecting';
      case 'initiated': return 'Initiated';
      default: return 'Unknown';
    }
  };

  const formatDuration = (duration?: number) => {
    if (!duration) return '--';
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatPhoneNumber = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
    }
    return phone;
  };

  const handleVoiceFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setVoiceFile(event.target.files[0]);
    }
  };

  const handleUploadVoice = async () => {
    if (!voiceFile || !voiceName.trim()) {
      setMessage('Please provide a voice name and audio file');
      setShowError(true);
      return;
    }

    setUploadingVoice(true);
    try {
      const formData = new FormData();
      formData.append('audio', voiceFile);
      formData.append('name', voiceName.trim());
      formData.append('description', voiceDescription.trim());
      formData.append('isDefault', 'false');

      const response = await fetch(getApiUrl('voice-agent/voice-clone'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        setMessage('Voice cloned successfully!');
        setShowSuccess(true);
        setShowVoiceDialog(false);
        setVoiceFile(null);
        setVoiceName('');
        setVoiceDescription('');
        loadVoiceProfiles(); // Refresh voice profiles
      } else {
        setMessage(data.error || 'Failed to clone voice');
        setShowError(true);
      }
    } catch (error) {
      setMessage('Network error. Please try again.');
      setShowError(true);
    } finally {
      setUploadingVoice(false);
    }
  };

  const handleSetDefaultVoice = async (voiceId: string) => {
    try {
      // Update voice profiles locally for immediate feedback
      setVoiceProfiles(prev => prev.map(voice => ({
        ...voice,
        isDefault: voice.elevenLabsVoiceId === voiceId
      })));

      setMessage('Default voice updated successfully!');
      setShowSuccess(true);
    } catch (error) {
      setMessage('Failed to update default voice');
      setShowError(true);
    }
  };

  const handlePreviewContacts = async () => {
    if (!csvFile) return;

    setShowCsvPreview(true);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('csv', csvFile);

      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(getApiUrl('campaigns/parse-csv'), {
        method: 'POST',
        headers,
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        setCsvContacts(data.contacts);
        setMessage(`Loaded ${data.totalCount} contacts from CSV`);
        setShowSuccess(true);
      } else {
        setMessage(data.error || 'Error parsing CSV file');
        setShowError(true);
      }
    } catch (error) {
      setMessage('Error parsing CSV file');
      setShowError(true);
    }
  };

  const handleCreateCampaign = async () => {
    if (!campaignName.trim() || !messageTemplate.trim() || !csvFile) return;

    setCreatingCampaign(true);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('csv', csvFile);
      formData.append('name', campaignName);
      formData.append('description', campaignDescription);
      formData.append('messageTemplate', messageTemplate);
      if (selectedVoice) {
        formData.append('voiceId', selectedVoice);
      }
      formData.append('dealType', dealType);
      formData.append('investmentRange', investmentRange);
      formData.append('industryFocus', industryFocus);
      formData.append('customInstructions', customInstructions);

      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(getApiUrl('campaigns'), {
        method: 'POST',
        headers,
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        setMessage(`Campaign "${campaignName}" created successfully with ${data.campaign.totalContacts} contacts!`);
        setShowSuccess(true);

        // Reset form
        setCampaignName('');
        setCampaignDescription('');
        setMessageTemplate('');
        setCsvFile(null);
        setCsvContacts([]);
        setShowCsvPreview(false);

        // Load campaigns to update dashboard
        loadCampaigns();
      } else {
        setMessage(data.error || 'Error creating campaign');
        setShowError(true);
      }
    } catch (error) {
      setMessage('Error creating campaign');
      setShowError(true);
    } finally {
      setCreatingCampaign(false);
    }
  };

  const handleIndividualCall = async (contact: CampaignContact) => {
    try {
      const token = localStorage.getItem('token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Personalize message template
      let personalizedMessage = messageTemplate;
      personalizedMessage = personalizedMessage.replace(/\{\{contact_name\}\}/g, contact.name);
      personalizedMessage = personalizedMessage.replace(/\{\{company_name\}\}/g, contact.companyName || 'your company');
      personalizedMessage = personalizedMessage.replace(/\{\{first_name\}\}/g, contact.name.split(' ')[0]);

      const response = await fetch(getApiUrl('voice-agent/create-call'), {
        method: 'POST',
        headers,
        body: JSON.stringify({
          phoneNumber: contact.phoneNumber,
          callType: 'voicemail',
          contactName: contact.name,
          companyName: contact.companyName,
          dealType,
          investmentRange,
          industryFocus,
          customInstructions: personalizedMessage,
          voiceId: selectedVoice || undefined
        })
      });

      const data = await response.json();
      if (data.success) {
        console.log(`Call initiated for ${contact.name}: ${data.callId}`);
      }
    } catch (error) {
      console.error(`Error calling ${contact.name}:`, error);
    }
  };

  // Show loading screen while initializing
  if (initialLoading) {
    return (
      <Box sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '400px',
        textAlign: 'center'
      }}>
        <CircularProgress size={60} sx={{ mb: 3 }} />
        <Typography variant="h6" sx={{ mb: 1 }}>
          Loading Voice Interface...
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Initializing voice profiles and call history
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
            AI Voice Calls
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Make intelligent voice calls with AI-powered conversation assistance
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Tooltip title="Manage Voices">
            <IconButton
              sx={{ border: '1px solid', borderColor: 'divider' }}
              onClick={() => setShowVoiceDialog(true)}
            >
              <RecordVoiceOverIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Call Settings">
            <IconButton sx={{ border: '1px solid', borderColor: 'divider' }}>
              <SettingsIcon />
            </IconButton>
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

      {/* Tab Navigation */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={currentTab} onChange={(e, newValue) => setCurrentTab(newValue)}>
          <Tab
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CallIcon />
                Individual Calls
              </Box>
            }
          />
          <Tab
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CampaignIcon />
                Mass Voicemail
              </Box>
            }
          />
        </Tabs>
      </Box>

      {/* Tab Content */}
      {currentTab === 0 && (
        <Grid container spacing={3}>
          {/* Call Interface */}
          <Grid item xs={12} md={8}>
          <Paper sx={{ p: 4, mb: 3 }}>
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Avatar
                sx={{
                  width: 80,
                  height: 80,
                  bgcolor: '#000000',
                  mx: 'auto',
                  mb: 3
                }}
              >
                <AddIcCallIcon sx={{ fontSize: 40 }} />
              </Avatar>

              <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
                Start AI Voice Call
              </Typography>

              <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                Enter a phone number and configure your AI voice agent to make a call
              </Typography>

              {/* Phone Number Input */}
              <Box sx={{ maxWidth: 500, mx: 'auto', mb: 4 }}>
                <TextField
                  fullWidth
                  label="Phone Number"
                  placeholder="+1 (555) 123-4567"
                  value={phoneNumber}
                  onChange={handlePhoneNumberChange}
                  sx={{ mb: 3 }}
                  helperText="Enter the phone number to call (include country code)"
                />

                {/* Voice Selection */}
                <FormControl fullWidth sx={{ mb: 3 }}>
                  <InputLabel>Voice Profile (Optional)</InputLabel>
                  <Select
                    value={selectedVoice}
                    onChange={handleVoiceChange}
                    label="Voice Profile (Optional)"
                  >
                    <MenuItem value="">
                      <em>Default Voice</em>
                    </MenuItem>
                    {voiceProfiles.map((voice) => (
                      <MenuItem key={voice.id} value={voice.elevenLabsVoiceId}>
                        <Box>
                          <Typography variant="body1" sx={{ fontWeight: 600 }}>
                            {voice.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {voice.description}
                          </Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {/* Call Type Selection */}
                <FormControl component="fieldset">
                  <FormLabel component="legend" sx={{ color: 'white', '&.Mui-focused': { color: 'white' }, fontWeight: 600 }}>
                    Call Type
                  </FormLabel>
                  <RadioGroup
                    row
                    value={callType}
                    onChange={handleCallTypeChange}
                    sx={{ justifyContent: 'center', mt: 1 }}
                  >
                    <FormControlLabel
                      value="live"
                      control={<Radio sx={{ color: '#000000', '&.Mui-checked': { color: '#000000' } }} />}
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#000000' }}>
                          <CallIcon sx={{ fontSize: 18, color: '#000000' }} />
                          <Typography variant="body2" sx={{ color: '#000000', fontWeight: 500 }}>Live Call</Typography>
                        </Box>
                      }
                    />
                    <FormControlLabel
                      value="voicemail"
                      control={<Radio sx={{ color: '#000000', '&.Mui-checked': { color: '#000000' } }} />}
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#000000' }}>
                          <VoicemailIcon sx={{ fontSize: 18, color: '#000000' }} />
                          <Typography variant="body2" sx={{ color: '#000000', fontWeight: 500 }}>Voicemail</Typography>
                        </Box>
                      }
                    />
                  </RadioGroup>
                </FormControl>

                {/* Contact Information */}
                <Typography variant="h6" sx={{ mt: 3, mb: 2, color: '#000000', fontWeight: 600 }}>
                  Contact Information
                </Typography>

                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Contact Name"
                      placeholder="John Smith"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      helperText="Person you're calling"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Company Name"
                      placeholder="Acme Corp"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      helperText="Their company"
                    />
                  </Grid>
                </Grid>

                {/* Deal Information */}
                <Typography variant="h6" sx={{ mb: 2, color: '#000000', fontWeight: 600 }}>
                  Deal Information
                </Typography>

                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>Deal Type</InputLabel>
                      <Select
                        value={dealType}
                        onChange={(e) => setDealType(e.target.value)}
                        label="Deal Type"
                      >
                        <MenuItem value="growth-investment">Growth Investment</MenuItem>
                        <MenuItem value="acquisition">Acquisition</MenuItem>
                        <MenuItem value="merger">Merger</MenuItem>
                        <MenuItem value="buyout">Buyout</MenuItem>
                        <MenuItem value="series-funding">Series Funding</MenuItem>
                        <MenuItem value="other">Other</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>Investment Range</InputLabel>
                      <Select
                        value={investmentRange}
                        onChange={(e) => setInvestmentRange(e.target.value)}
                        label="Investment Range"
                      >
                        <MenuItem value="under-1m">Under $1M</MenuItem>
                        <MenuItem value="1m-5m">$1M - $5M</MenuItem>
                        <MenuItem value="5m-10m">$5M - $10M</MenuItem>
                        <MenuItem value="10m-25m">$10M - $25M</MenuItem>
                        <MenuItem value="25m-50m">$25M - $50M</MenuItem>
                        <MenuItem value="50m-plus">$50M+</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Industry Focus"
                      placeholder="Healthcare Technology, SaaS, Manufacturing"
                      value={industryFocus}
                      onChange={(e) => setIndustryFocus(e.target.value)}
                      helperText="Target industry or sector"
                    />
                  </Grid>
                </Grid>

                {/* Custom Instructions */}
                <Typography variant="h6" sx={{ mb: 2, color: '#000000', fontWeight: 600 }}>
                  Additional Instructions (Optional)
                </Typography>

                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Custom Instructions"
                  placeholder="Any specific talking points, questions to ask, or custom instructions..."
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value)}
                  helperText="Optional: Add any specific instructions for this call"
                  sx={{ mb: 2 }}
                />
              </Box>

              {/* Call Button */}
              <Button
                variant="contained"
                size="large"
                startIcon={isLoading ? <CircularProgress size={20} /> : (callType === 'live' ? <CallIcon /> : <VoicemailIcon />)}
                onClick={handleStartCall}
                disabled={!phoneNumber.trim() || isLoading}
                sx={{
                  bgcolor: 'white',
                  color: '#000000',
                  border: '2px solid #000000',
                  px: 4,
                  py: 1.5,
                  borderRadius: 2,
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  '&:hover': {
                    bgcolor: '#f5f5f5'
                  },
                  '&:disabled': {
                    bgcolor: '#cccccc',
                    color: '#666666'
                  }
                }}
              >
                {isLoading ? 'Initiating...' : `Start ${callType === 'live' ? 'Live Call' : 'Voicemail'}`}
              </Button>

              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
                AI agent will {callType === 'live' ? 'handle live conversations with prospects' : 'leave personalized voicemails'}
              </Typography>
            </Box>
          </Paper>

          {/* AI Features Preview */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
              AI Voice Features (Coming Soon)
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Card sx={{ p: 2, border: '1px solid', borderColor: 'divider' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ width: 40, height: 40, bgcolor: 'primary.main', mr: 2 }}>
                      <MicIcon />
                    </Avatar>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      Smart Conversation
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    AI agent handles natural conversation flow and responds intelligently to prospect questions
                  </Typography>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Card sx={{ p: 2, border: '1px solid', borderColor: 'divider' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ width: 40, height: 40, bgcolor: 'secondary.main', mr: 2 }}>
                      <VolumeUpIcon />
                    </Avatar>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      Real-time Transcription
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Live transcription of conversations with automatic note-taking and key point extraction
                  </Typography>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Card sx={{ p: 2, border: '1px solid', borderColor: 'divider' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ width: 40, height: 40, bgcolor: 'info.main', mr: 2 }}>
                      <PersonIcon />
                    </Avatar>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      Context Awareness
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    AI has full context of deal history, previous conversations, and relevant documents
                  </Typography>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Card sx={{ p: 2, border: '1px solid', borderColor: 'divider' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ width: 40, height: 40, bgcolor: 'success.main', mr: 2 }}>
                      <TimerIcon />
                    </Avatar>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      Automated Follow-up
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Automatic summary generation and follow-up task creation based on call outcomes
                  </Typography>
                </Card>
              </Grid>
            </Grid>
          </Paper>

          {/* Real-time Call Monitor */}
          {activeCall && (
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Active Call Monitor
              </Typography>

              <Box sx={{ mb: 2 }}>
                <Chip
                  label="Call In Progress"
                  color="primary"
                  sx={{ mb: 1 }}
                />
                <Typography variant="body2" color="text.secondary">
                  Call ID: {activeCall}
                </Typography>
              </Box>

              {realTimeTranscript.length > 0 && (
                <Box sx={{
                  maxHeight: 200,
                  overflowY: 'auto',
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                  p: 2,
                  bgcolor: '#f8f9fa'
                }}>
                  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                    Live Transcript:
                  </Typography>
                  {realTimeTranscript.map((line, index) => (
                    <Typography
                      key={index}
                      variant="caption"
                      sx={{
                        display: 'block',
                        mb: 0.5,
                        color: line.startsWith('AI:') ? 'primary.main' : 'text.primary',
                        fontWeight: line.startsWith('AI:') ? 600 : 400
                      }}
                    >
                      {line}
                    </Typography>
                  ))}
                </Box>
              )}
            </Paper>
          )}
        </Grid>

        {/* Audio Player Section */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 4, mb: 3 }}>
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Avatar
                sx={{
                  width: 60,
                  height: 60,
                  bgcolor: 'primary.main',
                  mx: 'auto',
                  mb: 2
                }}
              >
                <VolumeUpIcon sx={{ fontSize: 30 }} />
              </Avatar>

              <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                Recording Playback
              </Typography>

              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Play back recorded conversations and audio files
              </Typography>

              {/* Audio Player */}
              <Box sx={{ maxWidth: 500, mx: 'auto' }}>
                <audio
                  controls
                  style={{
                    width: '100%',
                    height: '40px',
                    borderRadius: '8px',
                    backgroundColor: '#f5f5f5'
                  }}
                >
                  <source src="/recording.wav" type="audio/wav" />
                  <source src="/recording.mp3" type="audio/mpeg" />
                  Your browser does not support the audio element.
                </audio>
                
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  Supported formats: WAV, MP3, FLAC
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* Call History Sidebar */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <HistoryIcon sx={{ mr: 1 }} />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Recent Calls
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {callHistory.map((call) => (
                <Box
                  key={call.id}
                  sx={{
                    p: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 2,
                    cursor: 'pointer',
                    '&:hover': {
                      bgcolor: 'action.hover'
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        {formatPhoneNumber(call.phoneNumber)}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                        {call.callType === 'live' ? <CallIcon sx={{ fontSize: 12 }} /> : <VoicemailIcon sx={{ fontSize: 12 }} />}
                        <Typography variant="caption" color="text.secondary">
                          {call.callType === 'live' ? 'Live Call' : 'Voicemail'}
                        </Typography>
                      </Box>
                      {call.transcript && call.transcript.length > 0 && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                          {call.transcript.length} messages exchanged
                        </Typography>
                      )}
                    </Box>
                    <Chip
                      label={getStatusText(call.status)}
                      size="small"
                      sx={{
                        bgcolor: `${getStatusColor(call.status)}20`,
                        color: getStatusColor(call.status),
                        border: `1px solid ${getStatusColor(call.status)}`,
                        fontSize: '0.7rem'
                      }}
                    />
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(call.startTime).toLocaleDateString()} {new Date(call.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight: 500 }}>
                      {formatDuration(call.duration)}
                    </Typography>
                  </Box>
                </Box>
              ))}

              {callHistory.length === 0 && (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <PhoneIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="body2" color="text.secondary">
                    No call history yet
                  </Typography>
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>
        </Grid>
      )}

      {/* Mass Voicemail Tab */}
      {currentTab === 1 && (
        <Grid container spacing={3}>
          {/* Campaign Creation */}
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 4, mb: 3 }}>
              <Box sx={{ textAlign: 'center', mb: 4 }}>
                <Avatar
                  sx={{
                    width: 80,
                    height: 80,
                    bgcolor: 'primary.main',
                    mx: 'auto',
                    mb: 3
                  }}
                >
                  <CampaignIcon sx={{ fontSize: 40 }} />
                </Avatar>

                <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
                  Mass Voicemail Campaign
                </Typography>

                <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                  Upload a CSV file and create personalized voicemail campaigns at scale
                </Typography>

                {/* Campaign Form */}
                <Grid container spacing={3} sx={{ textAlign: 'left' }}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Campaign Name"
                      placeholder="Q4 Investor Outreach"
                      value={campaignName}
                      onChange={(e) => setCampaignName(e.target.value)}
                      sx={{ mb: 2 }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth sx={{ mb: 2 }}>
                      <InputLabel>Voice Profile</InputLabel>
                      <Select
                        value={selectedVoice}
                        onChange={handleVoiceChange}
                        label="Voice Profile"
                      >
                        <MenuItem value="">Default Voice</MenuItem>
                        {voiceProfiles.map((voice) => (
                          <MenuItem key={voice.id} value={voice.elevenLabsVoiceId}>
                            {voice.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Campaign Description"
                      placeholder="Outreach to potential investors for our Series A round"
                      value={campaignDescription}
                      onChange={(e) => setCampaignDescription(e.target.value)}
                      multiline
                      rows={2}
                      sx={{ mb: 2 }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Message Template"
                      placeholder="Hi {{contact_name}}, this is calling from Equitle about investment opportunities at {{company_name}}..."
                      value={messageTemplate}
                      onChange={(e) => setMessageTemplate(e.target.value)}
                      multiline
                      rows={4}
                      sx={{ mb: 2 }}
                      helperText="Use {{contact_name}}, {{company_name}}, {{first_name}} for personalization"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Box sx={{ mb: 2 }}>
                      <Button
                        variant="outlined"
                        component="label"
                        startIcon={<UploadIcon />}
                        fullWidth
                        sx={{ mb: 1 }}
                      >
                        {csvFile ? csvFile.name : 'Upload CSV Contact List'}
                        <input
                          type="file"
                          hidden
                          accept=".csv"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              setCsvFile(e.target.files[0]);
                            }
                          }}
                        />
                      </Button>
                      <Typography variant="caption" color="text.secondary">
                        CSV should include columns: name, phone_number, company_name (optional)
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>

                {/* Action Buttons */}
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 3 }}>
                  <Button
                    variant="outlined"
                    disabled={!csvFile}
                    onClick={handlePreviewContacts}
                  >
                    Preview Contacts
                  </Button>
                  <Button
                    variant="contained"
                    disabled={!campaignName.trim() || !messageTemplate.trim() || !csvFile}
                    startIcon={<CampaignIcon />}
                    onClick={handleCreateCampaign}
                  >
                    Create Campaign
                  </Button>
                </Box>
              </Box>
            </Paper>

            {/* Quick Templates */}
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Quick Message Templates
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Card
                    sx={{
                      p: 2,
                      cursor: 'pointer',
                      border: '1px solid',
                      borderColor: 'divider',
                      '&:hover': { bgcolor: 'action.hover' }
                    }}
                    onClick={() => setMessageTemplate("Hi {{contact_name}}, this is calling from Equitle regarding investment opportunities at {{company_name}}. We specialize in connecting businesses with qualified investors. I'd love to discuss how we might be able to help you with your funding goals. Please give me a call back at your convenience. Thank you and have a great day.")}
                  >
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                      Professional Outreach
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Professional voicemail for business development
                    </Typography>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Card
                    sx={{
                      p: 2,
                      cursor: 'pointer',
                      border: '1px solid',
                      borderColor: 'divider',
                      '&:hover': { bgcolor: 'action.hover' }
                    }}
                    onClick={() => setMessageTemplate("Hello {{first_name}}, this is calling from Equitle. We're currently working with some exciting investment opportunities in your area of interest. I'd like to learn more about your investment criteria and see if we have any deals that might be a good fit. When you have a moment, please give me a call back. Looking forward to connecting with you.")}
                  >
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                      Investor Qualification
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Voicemail to qualify potential investors
                    </Typography>
                  </Card>
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Campaign Dashboard */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Campaign Status ({campaigns.length})
              </Typography>
              {campaigns.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <CampaignIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="body2" color="text.secondary">
                    No campaigns created yet
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                    Create your first campaign to get started
                  </Typography>
                </Box>
              ) : (
                <List>
                  {campaigns.slice(0, 3).map((campaign) => (
                    <ListItem
                      key={campaign.id}
                      button
                      onClick={() => {
                        setSelectedCampaign(campaign);
                        setShowCampaignDetail(true);
                      }}
                      sx={{
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 1,
                        mb: 1,
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                        cursor: 'pointer',
                        '&:hover': {
                          backgroundColor: 'action.hover'
                        }
                      }}
                    >
                      <Box sx={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                          {campaign.name}
                        </Typography>
                        <Chip
                          label={campaign.status}
                          size="small"
                          color={campaign.status === 'completed' ? 'success' : campaign.status === 'running' ? 'primary' : 'default'}
                        />
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        {campaign.completedContacts}/{campaign.totalContacts} contacts completed
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={(campaign.completedContacts / campaign.totalContacts) * 100}
                        sx={{ width: '100%', mt: 1 }}
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </Paper>

            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Campaign Features
              </Typography>
              <Stack spacing={2}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <UploadIcon sx={{ color: 'primary.main' }} />
                  <Typography variant="body2">CSV Contact Import</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <RecordVoiceOverIcon sx={{ color: 'primary.main' }} />
                  <Typography variant="body2">Custom Voice Profiles</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AssignmentIcon sx={{ color: 'primary.main' }} />
                  <Typography variant="body2">Message Templates</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PlayArrowIcon sx={{ color: 'primary.main' }} />
                  <Typography variant="body2">Automated Execution</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TimerIcon sx={{ color: 'primary.main' }} />
                  <Typography variant="body2">Rate Limiting</Typography>
                </Box>
              </Stack>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Voice Management Dialog */}
      <Dialog
        open={showVoiceDialog}
        onClose={() => setShowVoiceDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Voice Management
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3}>
            {/* Upload New Voice */}
            <Grid item xs={12} md={6}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Clone New Voice
              </Typography>

              <TextField
                fullWidth
                label="Voice Name"
                value={voiceName}
                onChange={(e) => setVoiceName(e.target.value)}
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                label="Description (Optional)"
                multiline
                rows={2}
                value={voiceDescription}
                onChange={(e) => setVoiceDescription(e.target.value)}
                sx={{ mb: 2 }}
              />

              <Button
                variant="outlined"
                component="label"
                startIcon={<CloudUploadIcon />}
                fullWidth
                sx={{ mb: 2 }}
              >
                {voiceFile ? voiceFile.name : 'Upload Audio Sample'}
                <input
                  type="file"
                  hidden
                  accept="audio/*"
                  onChange={handleVoiceFileChange}
                />
              </Button>

              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                Upload a clear audio sample (WAV, MP3, or FLAC) of the voice you want to clone.
                Best results with 30-60 seconds of clear speech.
              </Typography>

              <Button
                variant="contained"
                onClick={handleUploadVoice}
                disabled={!voiceFile || !voiceName.trim() || uploadingVoice}
                startIcon={uploadingVoice ? <CircularProgress size={16} /> : <RecordVoiceOverIcon />}
                fullWidth
              >
                {uploadingVoice ? 'Cloning Voice...' : 'Clone Voice'}
              </Button>
            </Grid>

            {/* Existing Voices */}
            <Grid item xs={12} md={6}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Your Voice Profiles
              </Typography>

              {voiceProfiles.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No custom voices yet. Clone your first voice to get started.
                </Typography>
              ) : (
                <List>
                  {voiceProfiles.map((voice) => (
                    <ListItem
                      key={voice.id}
                      sx={{
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 1,
                        mb: 1
                      }}
                    >
                      <ListItemText
                        primary={voice.name}
                        secondary={voice.description || 'No description'}
                      />
                      <ListItemSecondaryAction>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="caption">
                            Default
                          </Typography>
                          <Switch
                            edge="end"
                            checked={voice.isDefault}
                            onChange={() => handleSetDefaultVoice(voice.elevenLabsVoiceId)}
                          />
                        </Box>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              )}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowVoiceDialog(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* CSV Preview Dialog */}
      <Dialog
        open={showCsvPreview}
        onClose={() => setShowCsvPreview(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          CSV Contact Preview ({csvContacts.length} contacts)
        </DialogTitle>
        <DialogContent>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Phone Number</TableCell>
                  <TableCell>Company</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {csvContacts.slice(0, 10).map((contact, index) => (
                  <TableRow key={index}>
                    <TableCell>{contact.name}</TableCell>
                    <TableCell>{contact.phoneNumber}</TableCell>
                    <TableCell>{contact.companyName || 'N/A'}</TableCell>
                    <TableCell>
                      <Chip
                        label={contact.status}
                        size="small"
                        color={contact.status === 'pending' ? 'default' : 'primary'}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          {csvContacts.length > 10 && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
              Showing first 10 contacts. Total: {csvContacts.length}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCsvPreview(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Campaign Detail Dialog */}
      <Dialog
        open={showCampaignDetail}
        onClose={() => setShowCampaignDetail(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Campaign Details: {selectedCampaign?.name}
        </DialogTitle>
        <DialogContent>
          {selectedCampaign && (
            <Box>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Campaign Information
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    <strong>Name:</strong> {selectedCampaign.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    <strong>Description:</strong> {selectedCampaign.description || 'No description'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    <strong>Status:</strong>{' '}
                    <Chip
                      label={selectedCampaign.status}
                      size="small"
                      color={
                        selectedCampaign.status === 'completed'
                          ? 'success'
                          : selectedCampaign.status === 'running'
                          ? 'primary'
                          : 'default'
                      }
                    />
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    <strong>Created:</strong> {new Date(selectedCampaign.createdAt).toLocaleString()}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Progress
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    <strong>Total Contacts:</strong> {selectedCampaign.totalContacts}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    <strong>Completed:</strong> {selectedCampaign.completedContacts}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    <strong>Failed:</strong> {selectedCampaign.failedContacts}
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={(selectedCampaign.completedContacts / selectedCampaign.totalContacts) * 100}
                    sx={{ mt: 2, mb: 1 }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    {Math.round((selectedCampaign.completedContacts / selectedCampaign.totalContacts) * 100)}% Complete
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          {selectedCampaign?.status === 'draft' && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<PlayArrowIcon />}
              onClick={async () => {
                try {
                  const token = localStorage.getItem('token');
                  const headers: Record<string, string> = {
                    'Content-Type': 'application/json'
                  };
                  if (token) {
                    headers['Authorization'] = `Bearer ${token}`;
                  }
                  const response = await fetch(getApiUrl(`campaigns/${selectedCampaign.id}/start`), {
                    method: 'POST',
                    headers: headers
                  });

                  if (response.ok) {
                    setMessage('Campaign started successfully!');
                    setShowSuccess(true);
                    loadCampaigns(); // Refresh campaign list
                    setShowCampaignDetail(false);
                  } else {
                    const errorData = await response.json();
                    setMessage(errorData.error || 'Failed to start campaign');
                    setShowError(true);
                  }
                } catch (error) {
                  setMessage('Failed to start campaign');
                  setShowError(true);
                }
              }}
            >
              Start Campaign
            </Button>
          )}
          {selectedCampaign?.status === 'running' && (
            <Button
              variant="outlined"
              color="warning"
              onClick={async () => {
                try {
                  const token = localStorage.getItem('token');
                  const headers: Record<string, string> = {
                    'Content-Type': 'application/json'
                  };
                  if (token) {
                    headers['Authorization'] = `Bearer ${token}`;
                  }
                  const response = await fetch(getApiUrl(`campaigns/${selectedCampaign.id}/pause`), {
                    method: 'POST',
                    headers: headers
                  });

                  if (response.ok) {
                    setMessage('Campaign paused successfully!');
                    setShowSuccess(true);
                    loadCampaigns(); // Refresh campaign list
                    setShowCampaignDetail(false);
                  } else {
                    const errorData = await response.json();
                    setMessage(errorData.error || 'Failed to pause campaign');
                    setShowError(true);
                  }
                } catch (error) {
                  setMessage('Failed to pause campaign');
                  setShowError(true);
                }
              }}
            >
              Pause Campaign
            </Button>
          )}
          <Button onClick={() => setShowCampaignDetail(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}