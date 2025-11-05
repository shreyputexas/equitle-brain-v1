import React, { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { getApiUrl, getSocketUrl } from '../config/api';
import VoiceCallAnalytics from '../components/VoiceCallAnalytics';
import CallInspectionModal from '../components/CallInspectionModal';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
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
  Stack,
  Collapse,
  ToggleButton,
  ToggleButtonGroup
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
  Assignment as AssignmentIcon,
  ExpandMore as ExpandMoreIcon,
  Business as BusinessIcon,
  Analytics as AnalyticsIcon,
  CheckCircle as CheckCircleIcon,
  Info as InfoIcon
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

interface CallTemplateDefaults {
  callObjective?: string;
  referralSource?: string;
  customInstructions?: string;
}

interface CallTemplate {
  name: string;
  description: string;
  defaults: CallTemplateDefaults;
  showFields: string[];
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

// Template definitions
const CALL_TEMPLATES: Record<string, CallTemplate> = {
  'cold-outreach': {
    name: 'Cold Outreach',
    description: 'Professional introduction and initial qualification',
    defaults: {
      callObjective: 'introduction and qualification',
      referralSource: 'research and prospecting',
      customInstructions: 'Make a professional introduction, explain how you found them, and assess their interest in hearing about investment opportunities.'
    },
    showFields: ['callerName', 'callObjective', 'referralSource', 'callingCompany']
  },
  'warm-followup': {
    name: 'Warm Follow-up',
    description: 'Follow-up on previous conversation or interaction',
    defaults: {
      callObjective: 'follow up on previous conversation',
      referralSource: 'previous interaction',
      customInstructions: 'Reference your previous conversation and continue building the relationship. Ask about their current investment focus.'
    },
    showFields: ['callerName', 'callObjective', 'referralSource', 'callingCompany']
  },
  'investor-qualification': {
    name: 'Investor Qualification',
    description: 'Detailed assessment of investment criteria',
    defaults: {
      callObjective: 'assess investment criteria and interest',
      referralSource: 'qualified lead',
      customInstructions: 'Focus on understanding their investment thesis, ticket sizes, industry preferences, and current portfolio gaps.'
    },
    showFields: ['callerName', 'callObjective', 'dealType', 'investmentRange', 'industryFocus', 'callingCompany']
  },
  'custom': {
    name: 'Custom',
    description: 'Fully customizable call configuration',
    defaults: {},
    showFields: ['callerName', 'callObjective', 'referralSource', 'dealType', 'investmentRange', 'industryFocus', 'callingCompany']
  }
};


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

  // New dynamic variables
  const [callerName, setCallerName] = useState('');
  const [callObjective, setCallObjective] = useState('');
  const [referralSource, setReferralSource] = useState('');
  const [callingCompany, setCallingCompany] = useState('');

  // Template and UI state
  const [selectedTemplate, setSelectedTemplate] = useState('custom');
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
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
  
  // Custom voice request state
  const [showCustomVoiceDialog, setShowCustomVoiceDialog] = useState(false);
  const [customVoiceEmail, setCustomVoiceEmail] = useState('');
  const [customVoiceLoading, setCustomVoiceLoading] = useState(false);
  const [showCustomVoiceSuccess, setShowCustomVoiceSuccess] = useState(false);
  const [showCustomVoiceDuplicate, setShowCustomVoiceDuplicate] = useState(false);

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

  // Call history management state
  const [callHistoryLimit, setCallHistoryLimit] = useState(10);
  const [showingAllCalls, setShowingAllCalls] = useState(false);
  const [loadingCallHistory, setLoadingCallHistory] = useState(false);

  // Call inspection modal state
  const [showCallInspection, setShowCallInspection] = useState(false);
  const [selectedCallId, setSelectedCallId] = useState<string | null>(null);

  const handlePhoneNumberChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPhoneNumber(event.target.value);
  };

  const handleVoiceChange = (event: any) => {
    setSelectedVoice(event.target.value);
  };

  const handleCustomVoiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCustomVoiceLoading(true);

    try {
      console.log('Checking for duplicate email:', customVoiceEmail);

      // Check if email already exists
      const collectionRef = collection(db, 'custom-voice-requests');
      const q = query(collectionRef, where('email', '==', customVoiceEmail));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        console.log('Email already exists in database');
        setShowCustomVoiceDuplicate(true);
        setCustomVoiceLoading(false);
        return;
      }

      console.log('Email is unique, submitting to Firebase...');

      // Email doesn't exist, proceed with submission
      const docRef = await addDoc(collectionRef, {
        email: customVoiceEmail,
        timestamp: new Date().toISOString(),
        status: 'pending',
        createdAt: new Date()
      });

      console.log('Successfully submitted with ID:', docRef.id);
      setShowCustomVoiceSuccess(true);
      setCustomVoiceEmail('');
      setShowCustomVoiceDialog(false);
    } catch (error: any) {
      console.error('Error submitting email:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      alert('Failed to submit request. Please try again.');
    } finally {
      setCustomVoiceLoading(false);
    }
  };


  const handleTemplateChange = (event: any) => {
    const templateKey = event.target.value;
    setSelectedTemplate(templateKey);

    const template = CALL_TEMPLATES[templateKey];
    if (template && template.defaults) {
      // Apply template defaults
      if (template.defaults.callObjective) setCallObjective(template.defaults.callObjective);
      if (template.defaults.referralSource) setReferralSource(template.defaults.referralSource);
      if (template.defaults.customInstructions) setCustomInstructions(template.defaults.customInstructions);
    }

    // Show advanced options for templates that need them
    if (templateKey !== 'custom') {
      setShowAdvancedOptions(true);
    }
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
          voiceId: selectedVoice || undefined,
          callerName: callerName.trim(),
          callObjective: callObjective.trim(),
          referralSource: referralSource.trim(),
          callingCompany: callingCompany.trim()
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
        setCallerName('');
        setCallObjective('');
        setReferralSource('');
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

  const loadCallHistory = async (limit?: number) => {
    const requestLimit = limit || callHistoryLimit;
    setLoadingCallHistory(true);
    try {
      const response = await fetch(getApiUrl(`voice-agent/calls?limit=${requestLimit}`), {
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
    } finally {
      setLoadingCallHistory(false);
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

  const scrollToContent = () => {
    const element = document.getElementById('voice-calls-content');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleToggleCallHistory = async () => {
    const newShowingAll = !showingAllCalls;
    const newLimit = newShowingAll ? 50 : 10;

    setShowingAllCalls(newShowingAll);
    setCallHistoryLimit(newLimit);
    await loadCallHistory(newLimit);
  };

  const handleOpenCallInspection = (callId: string) => {
    setSelectedCallId(callId);
    setShowCallInspection(true);
  };

  const handleCloseCallInspection = () => {
    setShowCallInspection(false);
    setSelectedCallId(null);
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
          voiceId: selectedVoice || undefined,
          callerName: callerName.trim(),
          callObjective: callObjective.trim() || 'campaign outreach',
          referralSource: referralSource.trim() || 'marketing campaign',
          callingCompany: callingCompany.trim()
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
                AI Voice Assistant
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
                Deploy intelligent voice agents to make professional calls and connect with prospects automatically.
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
                Create structured voice campaigns that align with your outreach goals and market opportunities.
              </Typography>

              <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<AddIcCallIcon />}
                  sx={{
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: 'white',
                    px: 4,
                    py: 1.5,
                    borderRadius: 3,
                    fontSize: '1rem',
                    fontWeight: 600,
                    textTransform: 'none',
                    boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                      boxShadow: '0 6px 20px rgba(16, 185, 129, 0.4)',
                      transform: 'translateY(-2px)'
                    },
                    transition: 'all 0.3s ease'
                  }}
                  onClick={() => {
                    setCurrentTab(0);
                    setTimeout(scrollToContent, 100);
                  }}
                >
                  Start New Call
                </Button>

                <Button
                  variant="outlined"
                  size="large"
                  startIcon={<CampaignIcon />}
                  onClick={() => {
                    setCurrentTab(1);
                    setTimeout(scrollToContent, 100);
                  }}
                  sx={{
                    borderColor: '#cbd5e1',
                    color: '#475569',
                    px: 4,
                    py: 1.5,
                    borderRadius: 3,
                    fontSize: '1rem',
                    fontWeight: 600,
                    textTransform: 'none',
                    '&:hover': {
                      borderColor: '#10b981',
                      color: '#10b981',
                      bgcolor: '#f0fdf4'
                    }
                  }}
                >
                  Mass Campaigns
                </Button>
              </Box>
            </Grid>

            <Grid item xs={12} md={4}>
              <Box sx={{
                position: 'relative',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: 300
              }}>
                {/* Decorative Chart Elements */}
                <Box sx={{
                  position: 'relative',
                  width: 200,
                  height: 200,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 1
                }}>
                  {/* Chart Elements */}
                  <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'end' }}>
                    <Box sx={{ width: 12, height: 20, background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', borderRadius: 0.5 }} />
                    <Box sx={{ width: 12, height: 32, background: 'linear-gradient(135deg, #059669 0%, #047857 100%)', borderRadius: 0.5 }} />
                    <Box sx={{ width: 12, height: 16, background: 'linear-gradient(135deg, #047857 0%, #065f46 100%)', borderRadius: 0.5 }} />
                    <Box sx={{ width: 12, height: 40, background: 'linear-gradient(135deg, #065f46 0%, #064e3b 100%)', borderRadius: 0.5 }} />
                  </Box>
                  <Box sx={{ width: 40, height: 40, borderRadius: '50%', bgcolor: '#e2e8f0', position: 'relative' }}>
                    <Box sx={{ position: 'absolute', top: 4, left: 4, right: 4, bottom: 4, borderRadius: '50%', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }} />
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
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    borderRadius: 2,
                    transform: 'rotate(15deg)',
                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
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
                    background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                    boxShadow: '0 4px 12px rgba(5, 150, 105, 0.3)'
                  }}
                />
              </Box>
            </Grid>
          </Grid>

          {/* Action Icons */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 4 }}>
            <Tooltip title="Manage Voice Profiles">
              <IconButton
                sx={{
                  bgcolor: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: 2,
                  boxShadow: '0 2px 8px rgba(15, 23, 42, 0.08)',
                  '&:hover': {
                    bgcolor: '#f8fafc',
                    borderColor: '#10b981'
                  }
                }}
                onClick={() => setShowVoiceDialog(true)}
              >
                <RecordVoiceOverIcon sx={{ color: '#475569' }} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Call Settings">
              <IconButton
                sx={{
                  bgcolor: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: 2,
                  boxShadow: '0 2px 8px rgba(15, 23, 42, 0.08)',
                  '&:hover': {
                    bgcolor: '#f8fafc',
                    borderColor: '#10b981'
                  }
                }}
              >
                <SettingsIcon sx={{ color: '#475569' }} />
              </IconButton>
            </Tooltip>
          </Box>
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

      {/* Modern Tab Navigation */}
      <Box id="voice-calls-content" sx={{ px: 4, mb: 4 }}>
        <Box sx={{
          bgcolor: 'white',
          borderRadius: 3,
          p: 1,
          boxShadow: '0 2px 8px rgba(15, 23, 42, 0.08)',
          display: 'inline-flex',
          border: '1px solid #e2e8f0'
        }}>
          <Button
            onClick={() => setCurrentTab(0)}
            sx={{
              px: 3,
              py: 1.5,
              borderRadius: 2,
              color: currentTab === 0 ? 'white' : '#64748b',
              bgcolor: currentTab === 0 ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'transparent',
              background: currentTab === 0 ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'transparent',
              fontWeight: 600,
              textTransform: 'none',
              minWidth: 'auto',
              boxShadow: currentTab === 0 ? '0 2px 8px rgba(16, 185, 129, 0.3)' : 'none',
              '&:hover': {
                bgcolor: currentTab === 0 ? undefined : '#f8fafc',
                color: currentTab === 0 ? 'white' : '#10b981'
              },
              transition: 'all 0.2s ease'
            }}
          >
            <CallIcon sx={{ mr: 1, fontSize: 20 }} />
            Individual Calls
          </Button>
          <Button
            onClick={() => setCurrentTab(1)}
            sx={{
              px: 3,
              py: 1.5,
              borderRadius: 2,
              color: currentTab === 1 ? 'white' : '#64748b',
              bgcolor: currentTab === 1 ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'transparent',
              background: currentTab === 1 ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'transparent',
              fontWeight: 600,
              textTransform: 'none',
              minWidth: 'auto',
              boxShadow: currentTab === 1 ? '0 2px 8px rgba(16, 185, 129, 0.3)' : 'none',
              '&:hover': {
                bgcolor: currentTab === 1 ? undefined : '#f8fafc',
                color: currentTab === 1 ? 'white' : '#10b981'
              },
              transition: 'all 0.2s ease'
            }}
          >
            <CampaignIcon sx={{ mr: 1, fontSize: 20 }} />
            Mass Campaigns
          </Button>
          <Button
            onClick={() => setCurrentTab(2)}
            sx={{
              px: 3,
              py: 1.5,
              borderRadius: 2,
              color: currentTab === 2 ? 'white' : '#64748b',
              bgcolor: currentTab === 2 ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'transparent',
              background: currentTab === 2 ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'transparent',
              fontWeight: 600,
              textTransform: 'none',
              minWidth: 'auto',
              boxShadow: currentTab === 2 ? '0 2px 8px rgba(16, 185, 129, 0.3)' : 'none',
              '&:hover': {
                bgcolor: currentTab === 2 ? undefined : '#f8fafc',
                color: currentTab === 2 ? 'white' : '#10b981'
              },
              transition: 'all 0.2s ease'
            }}
          >
            <AnalyticsIcon sx={{ mr: 1, fontSize: 20 }} />
            Analytics
          </Button>
        </Box>
      </Box>

      {/* Tab Content */}
      {currentTab === 0 && (
        <Box sx={{ px: 4 }}>
          <Grid container spacing={4}>
            {/* Call Interface */}
            <Grid item xs={12} md={8}>
              <Paper sx={{
                p: 6,
                mb: 4,
                borderRadius: 4,
                boxShadow: '0 4px 20px rgba(15, 23, 42, 0.08)',
                border: '1px solid #f1f5f9'
              }}>
                <Box sx={{ textAlign: 'center', mb: 6 }}>
                  <Box sx={{
                    width: 120,
                    height: 120,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mx: 'auto',
                    mb: 4,
                    boxShadow: '0 8px 32px rgba(16, 185, 129, 0.3)'
                  }}>
                    <AddIcCallIcon sx={{ fontSize: 48, color: 'white' }} />
                  </Box>

                  <Typography
                    variant="h4"
                    sx={{
                      fontWeight: 700,
                      mb: 2,
                      color: '#1e293b',
                      fontSize: { xs: '1.8rem', md: '2.2rem' }
                    }}
                  >
                    Start AI Voice Call
                  </Typography>

                  <Typography
                    variant="h6"
                    sx={{
                      color: '#64748b',
                      mb: 6,
                      fontWeight: 400,
                      maxWidth: '500px',
                      mx: 'auto'
                    }}
                  >
                    Configure your AI agent and initiate intelligent voice conversations with prospects
                  </Typography>

              {/* Template Selection */}
              <Box sx={{ maxWidth: 500, mx: 'auto', mb: 4 }}>
                <FormControl fullWidth sx={{ mb: 3 }}>
                  <InputLabel>Call Template</InputLabel>
                  <Select
                    value={selectedTemplate}
                    onChange={handleTemplateChange}
                    label="Call Template"
                  >
                    {Object.entries(CALL_TEMPLATES).map(([key, template]) => (
                      <MenuItem key={key} value={key}>
                        <Box>
                          <Typography variant="body1" sx={{ fontWeight: 600 }}>
                            {template.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {template.description}
                          </Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

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
                <FormControl fullWidth sx={{ mb: 2 }}>
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
                
                {/* Custom Voice Request Button */}
                <Box sx={{ mb: 3, textAlign: 'center' }}>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => setShowCustomVoiceDialog(true)}
                    sx={{
                      color: 'text.secondary',
                      borderColor: 'divider',
                      '&:hover': {
                        borderColor: 'primary.main',
                        color: 'primary.main'
                      }
                    }}
                  >
                    Contact us to get your custom voice built in
                  </Button>
                </Box>


                {/* Advanced Options Toggle */}
                <Box sx={{ textAlign: 'center', mt: 3, mb: 2 }}>
                  <Button
                    variant="outlined"
                    onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                    endIcon={
                      <ExpandMoreIcon
                        sx={{
                          transform: showAdvancedOptions ? 'rotate(180deg)' : 'rotate(0deg)',
                          transition: 'transform 0.3s ease'
                        }}
                      />
                    }
                    sx={{ color: '#000000', borderColor: '#000000' }}
                  >
                    {showAdvancedOptions ? 'Hide Advanced Options' : 'Show Advanced Options'}
                  </Button>
                </Box>

                {/* Advanced Options Section */}
                <Collapse in={showAdvancedOptions}>
                  <Box sx={{ mb: 3, p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                    <Typography variant="h6" sx={{ mb: 2, color: '#000000', fontWeight: 600 }}>
                      Call Configuration
                    </Typography>

                    <Grid container spacing={2} sx={{ mb: 2 }}>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Caller Name"
                          placeholder="Your name"
                          value={callerName}
                          onChange={(e) => setCallerName(e.target.value)}
                          helperText="Your name for introductions"
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Call Objective"
                          placeholder="introduction and qualification"
                          value={callObjective}
                          onChange={(e) => setCallObjective(e.target.value)}
                          helperText="Main purpose of this call"
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Referral Source"
                          placeholder="How you found this contact"
                          value={referralSource}
                          onChange={(e) => setReferralSource(e.target.value)}
                          helperText="How you found or were referred to this contact"
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Calling Company"
                          placeholder="Your company name"
                          value={callingCompany}
                          onChange={(e) => setCallingCompany(e.target.value)}
                          helperText="The company you are calling from"
                        />
                      </Grid>
                    </Grid>
                  </Box>
                </Collapse>

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
                startIcon={isLoading ? <CircularProgress size={20} sx={{ color: 'white' }} /> : <CallIcon />}
                onClick={handleStartCall}
                disabled={!phoneNumber.trim() || isLoading}
                sx={{
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: 'white',
                  px: 6,
                  py: 2,
                  borderRadius: 3,
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  textTransform: 'none',
                  boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                    boxShadow: '0 6px 20px rgba(16, 185, 129, 0.4)',
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
                {isLoading ? 'Initiating Call...' : 'Start Live Call'}
              </Button>

              <Typography variant="body2" sx={{
                display: 'block',
                mt: 3,
                color: '#64748b',
                fontWeight: 500
              }}>
                🤖 AI agent will handle live conversations with prospects automatically
              </Typography>
            </Box>
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


            {/* Call History Sidebar */}
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
                    background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mr: 2
                  }}>
                    <HistoryIcon sx={{ color: '#10b981', fontSize: 20 }} />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" sx={{
                      fontWeight: 700,
                      color: '#1e293b'
                    }}>
                      {showingAllCalls ? 'All Calls' : 'Recent Calls'}
                    </Typography>
                    {callHistory.length > 0 && (
                      <Typography variant="caption" sx={{ color: '#64748b' }}>
                        Showing {callHistory.length} call{callHistory.length !== 1 ? 's' : ''}
                      </Typography>
                    )}
                  </Box>
                </Box>

                {loadingCallHistory && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                    <CircularProgress size={24} />
                  </Box>
                )}

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {callHistory.map((call) => (
                    <Box
                      key={call.id}
                      onClick={() => handleOpenCallInspection(call.id)}
                      sx={{
                        p: 3,
                        border: '1px solid #f1f5f9',
                        borderRadius: 3,
                        cursor: 'pointer',
                        bgcolor: 'white',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          borderColor: '#10b981',
                          bgcolor: '#f0fdf4',
                          transform: 'translateY(-2px)',
                          boxShadow: '0 4px 12px rgba(16, 185, 129, 0.15)'
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
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="caption" color="text.secondary">
                      {call.startTime ? (() => {
                        try {
                          const date = new Date(call.startTime);
                          return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
                        } catch (error) {
                          return 'Invalid Date';
                        }
                      })() : '--'}
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight: 500 }}>
                      {formatDuration(call.duration)}
                    </Typography>
                  </Box>
                </Box>
              ))}

                  {callHistory.length === 0 && (
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
                        <PhoneIcon sx={{ fontSize: 32, color: '#94a3b8' }} />
                      </Box>
                      <Typography variant="h6" sx={{ fontWeight: 600, color: '#475569', mb: 1 }}>
                        No calls yet
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#64748b' }}>
                        Your recent call history will appear here
                      </Typography>
                    </Box>
                  )}

                  {/* Toggle button for showing all calls */}
                  {callHistory.length > 0 && !loadingCallHistory && (
                    <Box sx={{ mt: 3, textAlign: 'center' }}>
                      <Button
                        variant="outlined"
                        onClick={handleToggleCallHistory}
                        disabled={loadingCallHistory}
                        sx={{
                          borderColor: '#cbd5e1',
                          color: '#475569',
                          px: 3,
                          py: 1,
                          borderRadius: 2,
                          fontSize: '0.875rem',
                          fontWeight: 500,
                          textTransform: 'none',
                          '&:hover': {
                            borderColor: '#10b981',
                            color: '#10b981',
                            bgcolor: '#f0fdf4'
                          }
                        }}
                      >
                        {showingAllCalls ? 'Show Recent Only' : 'Show All Calls'}
                      </Button>
                    </Box>
                  )}
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* Mass Campaign Tab */}
      {currentTab === 1 && (
        <Box sx={{ px: 4 }}>
          <Grid container spacing={4}>
            {/* Campaign Creation */}
            <Grid item xs={12} md={8}>
              <Paper sx={{
                p: 6,
                mb: 4,
                borderRadius: 4,
                boxShadow: '0 4px 20px rgba(15, 23, 42, 0.08)',
                border: '1px solid #f1f5f9'
              }}>
                <Box sx={{ textAlign: 'center', mb: 6 }}>
                  <Box sx={{
                    width: 120,
                    height: 120,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mx: 'auto',
                    mb: 4,
                    boxShadow: '0 8px 32px rgba(99, 102, 241, 0.3)'
                  }}>
                    <CampaignIcon sx={{ fontSize: 48, color: 'white' }} />
                  </Box>

                  <Typography
                    variant="h4"
                    sx={{
                      fontWeight: 700,
                      mb: 2,
                      color: '#1e293b',
                      fontSize: { xs: '1.8rem', md: '2.2rem' }
                    }}
                  >
                    Mass Calling Campaign
                  </Typography>

                  <Typography
                    variant="h6"
                    sx={{
                      color: '#64748b',
                      mb: 6,
                      fontWeight: 400,
                      maxWidth: '500px',
                      mx: 'auto'
                    }}
                  >
                    Upload CSV contacts and launch personalized voice campaigns at scale
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
                      Professional call for business development
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
                      Call to qualify potential investors
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
        </Box>
      )}

      {/* Analytics Tab */}
      {currentTab === 2 && (
        <Box sx={{ px: 4 }}>
          <VoiceCallAnalytics />
        </Box>
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

      {/* Call Inspection Modal */}
      <CallInspectionModal
        open={showCallInspection}
        onClose={handleCloseCallInspection}
        callId={selectedCallId}
      />

      {/* Custom Voice Request Dialog */}
      <Dialog
        open={showCustomVoiceDialog}
        onClose={() => {
          setShowCustomVoiceDialog(false);
          setCustomVoiceEmail('');
        }}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '16px',
            background: 'linear-gradient(180deg, #000000 0%, #1a1a1a 100%)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)'
          }
        }}
        sx={{
          '& .MuiBackdrop-root': {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(4px)'
          }
        }}
      >
        <DialogTitle sx={{ color: 'white', pb: 2 }}>
          Request Custom Voice
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: '#888', mb: 3 }}>
            Enter your email address and we'll contact you about building your custom voice profile.
          </Typography>
          <form onSubmit={handleCustomVoiceSubmit}>
            <TextField
              fullWidth
              placeholder="your@email.com"
              type="email"
              value={customVoiceEmail}
              onChange={(e) => setCustomVoiceEmail(e.target.value)}
              required
              disabled={customVoiceLoading}
              sx={{
                '& .MuiOutlinedInput-root': {
                  color: '#000000',
                  borderRadius: 0,
                  px: 2,
                  backgroundColor: '#FFFFFF',
                  '& fieldset': {
                    borderColor: '#000000',
                    borderWidth: '1px',
                  },
                  '&:hover fieldset': {
                    borderColor: '#000000',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#000000',
                  },
                },
                '& .MuiInputBase-input::placeholder': {
                  color: 'rgba(0, 0, 0, 0.6)',
                  opacity: 1,
                  textAlign: 'center',
                },
                '& .MuiInputBase-input': {
                  textAlign: 'center',
                },
              }}
            />
            <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button
                onClick={() => {
                  setShowCustomVoiceDialog(false);
                  setCustomVoiceEmail('');
                }}
                disabled={customVoiceLoading}
                sx={{ color: '#888' }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={customVoiceLoading || !customVoiceEmail.trim()}
                sx={{
                  background: `
                    linear-gradient(180deg, rgba(16, 185, 129, 0.6) 0%, rgba(5, 150, 105, 0.6) 30%, rgba(4, 120, 87, 0.6) 70%, rgba(6, 78, 59, 0.6) 100%),
                    radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%),
                    radial-gradient(circle at 80% 20%, rgba(255,255,255,0.05) 0%, transparent 50%),
                    radial-gradient(circle at 40% 80%, rgba(0,0,0,0.1) 0%, transparent 50%)
                  `,
                  backdropFilter: 'blur(10px)',
                  color: '#FFFFFF',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                  py: 1.5,
                  px: 4,
                  fontSize: '1rem',
                  fontWeight: 600,
                  borderRadius: '8px',
                  textTransform: 'none',
                  '&:disabled': {
                    opacity: 0.6
                  }
                }}
              >
                {customVoiceLoading ? 'Sending...' : 'Submit Request'}
              </Button>
            </Box>
          </form>
        </DialogContent>
      </Dialog>

      {/* Success Confirmation Modal */}
      <Dialog
        open={showCustomVoiceSuccess}
        onClose={() => setShowCustomVoiceSuccess(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '16px',
            background: 'linear-gradient(180deg, #000000 0%, #1a1a1a 100%)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)'
          }
        }}
        sx={{
          '& .MuiBackdrop-root': {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(4px)'
          }
        }}
      >
        <DialogContent sx={{ 
          p: 6, 
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 3,
              border: '2px solid rgba(16, 185, 129, 0.3)'
            }}
          >
            <CheckCircleIcon 
              sx={{ 
                fontSize: 50, 
                color: '#10B981',
                animation: 'scaleIn 0.3s ease-out'
              }} 
            />
          </Box>
          <Typography
            variant="h4"
            sx={{
              fontFamily: "'Darker Grotesque', 'Outfit', 'Inter', 'Poppins', 'Roboto', 'Helvetica', 'Arial', sans-serif",
              fontWeight: 700,
              color: '#FFFFFF',
              mb: 2
            }}
          >
            Request Submitted
          </Typography>
          <Typography
            variant="body1"
            sx={{
              fontFamily: "'Poppins', 'Inter', 'Roboto', 'Helvetica', 'Arial', sans-serif",
              color: 'rgba(255, 255, 255, 0.8)',
              mb: 4,
              lineHeight: 1.6
            }}
          >
            Thank you for your request! We'll contact you soon about building your custom voice profile.
          </Typography>
          <Button
            onClick={() => setShowCustomVoiceSuccess(false)}
            variant="contained"
            sx={{
              background: `
                linear-gradient(180deg, rgba(16, 185, 129, 0.6) 0%, rgba(5, 150, 105, 0.6) 30%, rgba(4, 120, 87, 0.6) 70%, rgba(6, 78, 59, 0.6) 100%),
                radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%),
                radial-gradient(circle at 80% 20%, rgba(255,255,255,0.05) 0%, transparent 50%),
                radial-gradient(circle at 40% 80%, rgba(0,0,0,0.1) 0%, transparent 50%)
              `,
              backdropFilter: 'blur(10px)',
              color: '#FFFFFF',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              py: 1.5,
              px: 6,
              fontSize: '1rem',
              fontWeight: 600,
              borderRadius: '8px',
              textTransform: 'none',
              '&:hover': {
                background: `
                  linear-gradient(180deg, rgba(16, 185, 129, 0.8) 0%, rgba(5, 150, 105, 0.8) 30%, rgba(4, 120, 87, 0.8) 70%, rgba(6, 78, 59, 0.8) 100%)
                `,
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
              },
              transition: 'all 0.3s ease'
            }}
          >
            Close
          </Button>
        </DialogContent>
      </Dialog>

      {/* Duplicate Email Modal */}
      <Dialog
        open={showCustomVoiceDuplicate}
        onClose={() => setShowCustomVoiceDuplicate(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '16px',
            background: 'linear-gradient(180deg, #000000 0%, #1a1a1a 100%)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)'
          }
        }}
        sx={{
          '& .MuiBackdrop-root': {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(4px)'
          }
        }}
      >
        <DialogContent sx={{
          p: 6,
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              backgroundColor: 'rgba(251, 191, 36, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 3,
              border: '2px solid rgba(251, 191, 36, 0.3)'
            }}
          >
            <InfoIcon
              sx={{
                fontSize: 50,
                color: '#FBB020',
                animation: 'scaleIn 0.3s ease-out'
              }}
            />
          </Box>
          <Typography
            variant="h4"
            sx={{
              fontFamily: "'Darker Grotesque', 'Outfit', 'Inter', 'Poppins', 'Roboto', 'Helvetica', 'Arial', sans-serif",
              fontWeight: 700,
              color: '#FFFFFF',
              mb: 2
            }}
          >
            Already Requested
          </Typography>
          <Typography
            variant="body1"
            sx={{
              fontFamily: "'Poppins', 'Inter', 'Roboto', 'Helvetica', 'Arial', sans-serif",
              color: 'rgba(255, 255, 255, 0.8)',
              mb: 4,
              lineHeight: 1.6
            }}
          >
            This email has already been submitted. We'll contact you soon about building your custom voice profile!
          </Typography>
          <Button
            onClick={() => setShowCustomVoiceDuplicate(false)}
            variant="contained"
            sx={{
              background: `
                linear-gradient(180deg, rgba(251, 191, 36, 0.6) 0%, rgba(245, 158, 11, 0.6) 30%, rgba(217, 119, 6, 0.6) 70%, rgba(180, 83, 9, 0.6) 100%),
                radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%),
                radial-gradient(circle at 80% 20%, rgba(255,255,255,0.05) 0%, transparent 50%),
                radial-gradient(circle at 40% 80%, rgba(0,0,0,0.1) 0%, transparent 50%)
              `,
              backdropFilter: 'blur(10px)',
              color: '#FFFFFF',
              border: '1px solid rgba(251, 191, 36, 0.4)',
              py: 1.5,
              px: 6,
              fontSize: '1rem',
              fontWeight: 600,
              borderRadius: '8px',
              textTransform: 'none',
              '&:hover': {
                background: `
                  linear-gradient(180deg, rgba(251, 191, 36, 0.8) 0%, rgba(245, 158, 11, 0.8) 30%, rgba(217, 119, 6, 0.8) 70%, rgba(180, 83, 9, 0.8) 100%)
                `,
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 12px rgba(251, 191, 36, 0.3)'
              },
              transition: 'all 0.3s ease'
            }}
          >
            Close
          </Button>
        </DialogContent>
      </Dialog>
    </Box>
  );
}