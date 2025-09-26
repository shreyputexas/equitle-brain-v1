import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Avatar,
  Grid,
  Card,
  CardContent,
  Divider,
  IconButton,
  Tooltip,
  InputAdornment,
  Alert,
  Chip
} from '@mui/material';
import {
  Phone as PhoneIcon,
  Call as CallIcon,
  History as HistoryIcon,
  Settings as SettingsIcon,
  Person as PersonIcon,
  Timer as TimerIcon,
  VolumeUp as VolumeUpIcon,
  Mic as MicIcon
} from '@mui/icons-material';

interface CallHistory {
  id: string;
  phoneNumber: string;
  contactName: string;
  duration: string;
  timestamp: Date;
  status: 'completed' | 'missed' | 'failed';
}

const mockCallHistory: CallHistory[] = [
  {
    id: '1',
    phoneNumber: '+1 (555) 123-4567',
    contactName: 'Sarah Johnson',
    duration: '5:23',
    timestamp: new Date('2024-03-15T14:30:00'),
    status: 'completed'
  },
  {
    id: '2',
    phoneNumber: '+1 (555) 987-6543',
    contactName: 'Mike Davis',
    duration: '2:15',
    timestamp: new Date('2024-03-14T09:15:00'),
    status: 'completed'
  },
  {
    id: '3',
    phoneNumber: '+1 (555) 456-7890',
    contactName: 'Tech Corp Inc',
    duration: '--',
    timestamp: new Date('2024-03-13T16:45:00'),
    status: 'missed'
  }
];

export default function VoiceCalls() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isValidNumber, setIsValidNumber] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const formatPhoneNumber = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');

    // Format as (XXX) XXX-XXXX
    if (digits.length <= 3) {
      return digits;
    } else if (digits.length <= 6) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    } else {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
    }
  };

  const handlePhoneNumberChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    const formatted = formatPhoneNumber(value);
    setPhoneNumber(formatted);

    // Validate phone number (10 digits)
    const digits = value.replace(/\D/g, '');
    setIsValidNumber(digits.length === 10);
  };

  const handleStartCall = () => {
    if (isValidNumber) {
      // Show success message
      setShowSuccess(true);

      // Hide success message after 3 seconds
      setTimeout(() => {
        setShowSuccess(false);
        setPhoneNumber('');
        setIsValidNumber(false);
      }, 3000);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success.main';
      case 'missed': return 'warning.main';
      case 'failed': return 'error.main';
      default: return 'text.secondary';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Completed';
      case 'missed': return 'Missed';
      case 'failed': return 'Failed';
      default: return 'Unknown';
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
          <Tooltip title="Call Settings">
            <IconButton sx={{ border: '1px solid', borderColor: 'divider' }}>
              <SettingsIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Success Alert */}
      {showSuccess && (
        <Alert
          severity="success"
          sx={{ mb: 3 }}
          onClose={() => setShowSuccess(false)}
        >
          Call initiated successfully! This feature will be available soon.
        </Alert>
      )}

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
                <PhoneIcon sx={{ fontSize: 40 }} />
              </Avatar>

              <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
                Start AI Voice Call
              </Typography>

              <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                Enter a phone number to initiate an AI-assisted voice call
              </Typography>

              {/* Phone Number Input */}
              <Box sx={{ maxWidth: 400, mx: 'auto', mb: 4 }}>
                <TextField
                  fullWidth
                  label="Phone Number"
                  placeholder="(555) 123-4567"
                  value={phoneNumber}
                  onChange={handlePhoneNumberChange}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PhoneIcon color="action" />
                      </InputAdornment>
                    ),
                    style: { fontSize: '1.2rem', textAlign: 'center' }
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      '&.Mui-focused fieldset': {
                        borderColor: '#000000'
                      }
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: '#000000'
                    }
                  }}
                />
              </Box>

              {/* Call Button */}
              <Button
                variant="contained"
                size="large"
                startIcon={<CallIcon />}
                onClick={handleStartCall}
                disabled={!isValidNumber}
                sx={{
                  bgcolor: '#000000',
                  color: 'white',
                  px: 4,
                  py: 1.5,
                  borderRadius: 2,
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  '&:hover': {
                    bgcolor: '#333333'
                  },
                  '&:disabled': {
                    bgcolor: '#cccccc'
                  }
                }}
              >
                Start AI Call
              </Button>

              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
                Future implementation: AI agent will handle conversation flow
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
              {mockCallHistory.map((call) => (
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
                        {call.contactName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {call.phoneNumber}
                      </Typography>
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
                      {call.timestamp.toLocaleDateString()} {call.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight: 500 }}>
                      {call.duration}
                    </Typography>
                  </Box>
                </Box>
              ))}

              {mockCallHistory.length === 0 && (
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
    </Box>
  );
}