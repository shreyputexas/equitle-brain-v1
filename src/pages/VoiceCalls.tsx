import React, { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
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
  Switch
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
  Delete as DeleteIcon
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
  const [phoneNumber, setPhoneNumber] = useState('');
  const [callType, setCallType] = useState('live');
  const [aiPrompt, setAiPrompt] = useState(DEFAULT_AI_PROMPT);
  const [selectedVoice, setSelectedVoice] = useState('');
  const [voiceProfiles, setVoiceProfiles] = useState<VoiceProfile[]>([]);
  const [callHistory, setCallHistory] = useState<CallHistory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
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

      const response = await fetch('http://localhost:4001/api/voice-agent/create-call', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          phoneNumber: phoneNumber.trim(),
          callType,
          aiPrompt,
          voiceId: selectedVoice || undefined
        })
      });

      const data = await response.json();

      if (data.success) {
        setMessage(`Call initiated successfully! Call ID: ${data.callId}`);
        setShowSuccess(true);
        setPhoneNumber('');
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
      const response = await fetch('http://localhost:4001/api/voice-agent/voices', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.voices) {
        setVoiceProfiles(data.voices);
      }
    } catch (error) {
      console.error('Failed to load voice profiles:', error);
    }
  };

  const loadCallHistory = async () => {
    try {
      const response = await fetch('http://localhost:4001/api/voice-agent/calls?limit=10', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.calls) {
        setCallHistory(data.calls);
      }
    } catch (error) {
      console.error('Failed to load call history:', error);
    }
  };

  useEffect(() => {
    loadVoiceProfiles();
    loadCallHistory();

    // Initialize WebSocket connection
    const socketConnection = io('http://localhost:4001', {
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

      const response = await fetch('http://localhost:4001/api/voice-agent/voice-clone', {
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

                {/* AI Prompt Configuration */}
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="AI Agent Prompt"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  sx={{ mt: 2 }}
                  helperText="Customize what your AI agent should say and how it should behave"
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
    </Box>
  );
}