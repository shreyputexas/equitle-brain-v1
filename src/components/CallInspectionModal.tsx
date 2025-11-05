import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Chip,
  Grid,
  Card,
  CardContent,
  Divider,
  IconButton,
  Tooltip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Paper,
  CircularProgress,
  Alert,
  Tab,
  Tabs,
  LinearProgress
} from '@mui/material';
import {
  Close as CloseIcon,
  Phone as PhoneIcon,
  AccessTime as AccessTimeIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  PlayArrow as PlayArrowIcon,
  Pause as PauseIcon,
  Download as DownloadIcon,
  Assignment as AssignmentIcon,
  TrendingUp as TrendingUpIcon,
  SentimentVerySatisfied,
  SentimentNeutral,
  SentimentVeryDissatisfied
} from '@mui/icons-material';
import { getApiUrl } from '../config/api';

interface CallInspectionModalProps {
  open: boolean;
  onClose: () => void;
  callId: string | null;
}

interface EnhancedCallData {
  id: string;
  phoneNumber: string;
  contactName?: string;
  companyName?: string;
  duration?: number;
  startTime: Date;
  endTime?: Date;
  status: string;
  callType: 'live' | 'voicemail';
  transcript: string[];
  recordingUrl?: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
  sentimentScore?: number;
  outcome?: string;
  keyPoints?: string[];
  actionItems?: string[];
  summary?: string;
  analytics?: {
    talkRatio?: number;
    interruptions?: number;
    avgResponseTime?: number;
    wordCount?: number;
  };
}

const CallInspectionModal: React.FC<CallInspectionModalProps> = ({ open, onClose, callId }) => {
  const [callData, setCallData] = useState<EnhancedCallData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentTab, setCurrentTab] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (open && callId) {
      fetchCallData();
    }
    return () => {
      if (audioElement) {
        audioElement.pause();
        setIsPlaying(false);
      }
    };
  }, [open, callId]);

  const fetchCallData = async () => {
    if (!callId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(getApiUrl(`voice-agent/calls/${callId}/enhanced`), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch call data');
      }

      const data = await response.json();
      setCallData(data.call);
    } catch (error) {
      console.error('Error fetching call data:', error);
      setError('Failed to load call details');
    } finally {
      setLoading(false);
    }
  };

  const handlePlayRecording = () => {
    if (!callData?.recordingUrl) return;

    if (isPlaying && audioElement) {
      audioElement.pause();
      setIsPlaying(false);
    } else {
      const audio = new Audio(callData.recordingUrl);
      audio.onended = () => setIsPlaying(false);
      audio.onpause = () => setIsPlaying(false);
      audio.play();
      setAudioElement(audio);
      setIsPlaying(true);
    }
  };

  const handleDownloadRecording = () => {
    if (!callData?.recordingUrl) return;

    const link = document.createElement('a');
    link.href = callData.recordingUrl;
    link.download = `call-recording-${callData.id}.mp3`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatPhoneNumber = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
    }
    return phone;
  };

  const getSentimentIcon = (sentiment?: string) => {
    switch (sentiment) {
      case 'positive': return <SentimentVerySatisfied sx={{ color: '#10b981' }} />;
      case 'negative': return <SentimentVeryDissatisfied sx={{ color: '#ef4444' }} />;
      default: return <SentimentNeutral sx={{ color: '#6b7280' }} />;
    }
  };

  const getSentimentColor = (sentiment?: string) => {
    switch (sentiment) {
      case 'positive': return '#10b981';
      case 'negative': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getOutcomeColor = (outcome?: string) => {
    switch (outcome) {
      case 'interested': return 'success';
      case 'callback_requested': return 'info';
      case 'more_info_needed': return 'warning';
      case 'not_interested': return 'error';
      default: return 'default';
    }
  };

  if (!open) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          maxHeight: '90vh'
        }
      }}
    >
      <DialogTitle sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        pb: 2
      }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#1e293b' }}>
            Call Details
          </Typography>
          {callData && (
            <Typography variant="body2" color="text.secondary">
              {formatPhoneNumber(callData.phoneNumber)} • {new Date(callData.startTime).toLocaleString()}
            </Typography>
          )}
        </Box>
        <IconButton onClick={onClose} sx={{ color: '#64748b' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ px: 3 }}>
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {callData && (
          <Box>
            {/* Overview Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} md={3}>
                <Card sx={{ p: 2, textAlign: 'center', border: '1px solid #e2e8f0' }}>
                  <PhoneIcon sx={{ fontSize: 32, color: '#10b981', mb: 1 }} />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {formatDuration(callData.duration || 0)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Call Duration
                  </Typography>
                </Card>
              </Grid>

              <Grid item xs={12} md={3}>
                <Card sx={{ p: 2, textAlign: 'center', border: '1px solid #e2e8f0' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
                    {getSentimentIcon(callData.sentiment)}
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, textTransform: 'capitalize' }}>
                    {callData.sentiment || 'Unknown'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Sentiment
                  </Typography>
                </Card>
              </Grid>

              <Grid item xs={12} md={3}>
                <Card sx={{ p: 2, textAlign: 'center', border: '1px solid #e2e8f0' }}>
                  <TrendingUpIcon sx={{ fontSize: 32, color: '#3b82f6', mb: 1 }} />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {callData.analytics?.wordCount || 0}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Words Spoken
                  </Typography>
                </Card>
              </Grid>

              <Grid item xs={12} md={3}>
                <Card sx={{ p: 2, textAlign: 'center', border: '1px solid #e2e8f0' }}>
                  <AssignmentIcon sx={{ fontSize: 32, color: '#f59e0b', mb: 1 }} />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {callData.transcript?.length || 0}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Exchanges
                  </Typography>
                </Card>
              </Grid>
            </Grid>

            {/* Outcome */}
            <Box sx={{ display: 'flex', gap: 2, mb: 4, flexWrap: 'wrap' }}>
              {callData.outcome && (
                <Chip
                  label={`Outcome: ${callData.outcome.replace('_', ' ')}`}
                  color={getOutcomeColor(callData.outcome) as any}
                  variant="outlined"
                />
              )}
              <Chip
                label={`Type: ${callData.callType}`}
                variant="outlined"
              />
              {callData.sentimentScore && (
                <Chip
                  label={`Sentiment Score: ${(callData.sentimentScore * 100).toFixed(0)}%`}
                  sx={{
                    color: getSentimentColor(callData.sentiment),
                    borderColor: getSentimentColor(callData.sentiment)
                  }}
                  variant="outlined"
                />
              )}
            </Box>

            {/* Recording Controls */}
            {callData.recordingUrl && (
              <Paper sx={{ p: 3, mb: 4, bgcolor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  Call Recording
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                  <Button
                    variant="contained"
                    startIcon={isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
                    onClick={handlePlayRecording}
                    sx={{
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #059669 0%, #047857 100%)'
                      }
                    }}
                  >
                    {isPlaying ? 'Pause' : 'Play'} Recording
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<DownloadIcon />}
                    onClick={handleDownloadRecording}
                  >
                    Download
                  </Button>
                </Box>
              </Paper>
            )}

            {/* Tabs for detailed content */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
              <Tabs value={currentTab} onChange={(_, newValue) => setCurrentTab(newValue)}>
                <Tab label="Transcript" />
                <Tab label="Summary & Analysis" />
                <Tab label="Contact Info" />
                <Tab label="Analytics" />
              </Tabs>
            </Box>

            {/* Tab Content */}
            {currentTab === 0 && (
              <Box>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  Call Transcript
                </Typography>
                {callData.transcript && callData.transcript.length > 0 ? (
                  <Paper sx={{ p: 3, maxHeight: 400, overflowY: 'auto', bgcolor: '#f8fafc' }}>
                    {callData.transcript.map((line, index) => (
                      <Box key={index} sx={{ mb: 2 }}>
                        <Typography
                          variant="body1"
                          sx={{
                            color: line.startsWith('AI:') ? '#3b82f6' : '#1e293b',
                            fontWeight: line.startsWith('AI:') ? 600 : 400
                          }}
                        >
                          {line}
                        </Typography>
                      </Box>
                    ))}
                  </Paper>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No transcript available for this call.
                  </Typography>
                )}
              </Box>
            )}

            {currentTab === 1 && (
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    Call Summary
                  </Typography>
                  <Paper sx={{ p: 3, mb: 3, bgcolor: '#f8fafc' }}>
                    <Typography variant="body1">
                      {callData.summary || 'No summary available for this call.'}
                    </Typography>
                  </Paper>

                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    Key Points
                  </Typography>
                  {callData.keyPoints && callData.keyPoints.length > 0 ? (
                    <List>
                      {callData.keyPoints.map((point, index) => (
                        <ListItem key={index}>
                          <ListItemIcon>
                            <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#10b981' }} />
                          </ListItemIcon>
                          <ListItemText primary={point} />
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No key points identified.
                    </Typography>
                  )}
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    Action Items
                  </Typography>
                  {callData.actionItems && callData.actionItems.length > 0 ? (
                    <List>
                      {callData.actionItems.map((item, index) => (
                        <ListItem key={index}>
                          <ListItemIcon>
                            <AssignmentIcon sx={{ color: '#f59e0b' }} />
                          </ListItemIcon>
                          <ListItemText primary={item} />
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No action items identified.
                    </Typography>
                  )}
                </Grid>
              </Grid>
            )}

            {currentTab === 2 && (
              <Box>
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                  Contact Information
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <List>
                      <ListItem>
                        <ListItemIcon>
                          <PersonIcon sx={{ color: '#10b981' }} />
                        </ListItemIcon>
                        <ListItemText
                          primary="Contact Name"
                          secondary={callData.contactName || 'Not provided'}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon>
                          <PhoneIcon sx={{ color: '#3b82f6' }} />
                        </ListItemIcon>
                        <ListItemText
                          primary="Phone Number"
                          secondary={formatPhoneNumber(callData.phoneNumber)}
                        />
                      </ListItem>
                    </List>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <List>
                      <ListItem>
                        <ListItemIcon>
                          <BusinessIcon sx={{ color: '#f59e0b' }} />
                        </ListItemIcon>
                        <ListItemText
                          primary="Company"
                          secondary={callData.companyName || 'Not provided'}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon>
                          <AccessTimeIcon sx={{ color: '#8b5cf6' }} />
                        </ListItemIcon>
                        <ListItemText
                          primary="Call Time"
                          secondary={new Date(callData.startTime).toLocaleString()}
                        />
                      </ListItem>
                    </List>
                  </Grid>
                </Grid>
              </Box>
            )}

            {currentTab === 3 && (
              <Box>
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                  Call Analytics
                </Typography>
                <Grid container spacing={3}>
                  {callData.analytics?.talkRatio && (
                    <Grid item xs={12} md={6}>
                      <Paper sx={{ p: 3, border: '1px solid #e2e8f0' }}>
                        <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                          Talk Ratio
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={callData.analytics.talkRatio * 100}
                          sx={{ mb: 1, height: 8, borderRadius: 4 }}
                        />
                        <Typography variant="caption" color="text.secondary">
                          Agent: {(callData.analytics.talkRatio * 100).toFixed(1)}% | User: {((1 - callData.analytics.talkRatio) * 100).toFixed(1)}%
                        </Typography>
                      </Paper>
                    </Grid>
                  )}

                  {callData.analytics?.interruptions !== undefined && (
                    <Grid item xs={12} md={6}>
                      <Paper sx={{ p: 3, border: '1px solid #e2e8f0', textAlign: 'center' }}>
                        <Typography variant="h4" sx={{ fontWeight: 700, color: '#ef4444' }}>
                          {callData.analytics.interruptions}
                        </Typography>
                        <Typography variant="subtitle1" color="text.secondary">
                          Interruptions
                        </Typography>
                      </Paper>
                    </Grid>
                  )}

                  {callData.analytics?.avgResponseTime && (
                    <Grid item xs={12} md={6}>
                      <Paper sx={{ p: 3, border: '1px solid #e2e8f0', textAlign: 'center' }}>
                        <Typography variant="h4" sx={{ fontWeight: 700, color: '#3b82f6' }}>
                          {callData.analytics.avgResponseTime.toFixed(1)}s
                        </Typography>
                        <Typography variant="subtitle1" color="text.secondary">
                          Avg Response Time
                        </Typography>
                      </Paper>
                    </Grid>
                  )}
                </Grid>
              </Box>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} variant="outlined">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CallInspectionModal;