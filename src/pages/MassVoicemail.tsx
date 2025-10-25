import React, { useState, useEffect } from 'react';
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
    const socket = io('http://localhost:4001');

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
      const response = await fetch('http://localhost:4001/api/mass-voicemail/voices');
      const data = await response.json();
      setVoiceClones(data);
    } catch (error) {
      console.error('Failed to load voice clones:', error);
    }
  };

  const loadCampaigns = async () => {
    try {
      const response = await fetch('http://localhost:4001/api/mass-voicemail/campaigns');
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
      const response = await fetch('http://localhost:4001/api/mass-voicemail/parse-contacts', {
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
      const response = await fetch('http://localhost:4001/api/mass-voicemail/clone-voice', {
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
      const response = await fetch('http://localhost:4001/api/mass-voicemail/create-campaign', {
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
        ? `http://localhost:4001/api/mass-voicemail/campaigns/${selectedCampaign.id}/send-personalized-voicemails`
        : `http://localhost:4001/api/mass-voicemail/campaigns/${selectedCampaign.id}/send-voicemails`;

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
            const failedDetails = data.results.failedDeliveries.map(f => `${f.phoneNumber}: ${f.error}`).join('\n');
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

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <RecordVoiceOver />
        Mass Voicemail System
      </Typography>

      <Paper sx={{ mt: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab label="Voice Cloning" />
          <Tab label="Create Campaign" />
          <Tab label="My Campaigns" />
        </Tabs>

        {/* Voice Cloning Tab */}
        <TabPanel value={activeTab} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Clone Your Voice
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Upload a 1-5 minute audio sample of clear speech to clone your voice.
                  </Typography>

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
                  >
                    {isUploading ? 'Cloning Voice...' : 'Clone Voice'}
                  </Button>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    My Voice Clones
                  </Typography>
                  <List>
                    {voiceClones.map((voice) => (
                      <ListItem key={voice.voice_id}>
                        <ListItemText
                          primary={voice.name}
                          secondary={`Status: ${voice.status}`}
                        />
                        <Chip
                          label={voice.status}
                          color={voice.status === 'ready' ? 'success' : voice.status === 'failed' ? 'error' : 'warning'}
                        />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Create Campaign Tab */}
        <TabPanel value={activeTab} index={1}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Create New Campaign
                  </Typography>

                  <TextField
                    fullWidth
                    label="Campaign Name"
                    value={campaignName}
                    onChange={(e) => setCampaignName(e.target.value)}
                    sx={{ mb: 2 }}
                  />

                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    label="Message Template"
                    value={messageTemplate}
                    onChange={(e) => setMessageTemplate(e.target.value)}
                    helperText="Use variables: {name}, {first_name}, {company}, {title}, {industry}, {location}"
                    sx={{ mb: 2 }}
                  />

                  <TextField
                    fullWidth
                    select
                    label="Select Voice Clone"
                    value={selectedVoiceId}
                    onChange={(e) => setSelectedVoiceId(e.target.value)}
                    SelectProps={{ native: true }}
                    sx={{ mb: 2 }}
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
                    sx={{ mb: 2 }}
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
                    <Typography variant="body2" sx={{ mb: 2 }}>
                      Uploaded: {contactsFile.name} ({parsedContacts.length} contacts)
                    </Typography>
                  )}

                  <Button
                    variant="contained"
                    fullWidth
                    startIcon={<Campaign />}
                    onClick={createCampaign}
                    disabled={!campaignName || !selectedVoiceId || !contactsFile}
                  >
                    Create Campaign
                  </Button>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Contact Preview
                  </Typography>
                  {parsedContacts.length > 0 ? (
                    <List>
                      {parsedContacts.slice(0, 3).map((contact, index) => (
                        <ListItem key={index}>
                          <ListItemText
                            primary={contact.name}
                            secondary={`${contact.company} - ${contact.phone}`}
                          />
                        </ListItem>
                      ))}
                      {parsedContacts.length > 3 && (
                        <ListItem>
                          <ListItemText secondary={`... and ${parsedContacts.length - 3} more`} />
                        </ListItem>
                      )}
                    </List>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Upload a contacts file to see preview
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* My Campaigns Tab */}
        <TabPanel value={activeTab} index={2}>
          <Typography variant="h6" gutterBottom>
            My Campaigns
          </Typography>
          <Grid container spacing={2}>
            {campaigns.map((campaign) => (
              <Grid item xs={12} md={6} lg={4} key={campaign.id}>
                <Card>
                  <CardContent>
                    <Typography variant="h6">{campaign.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Voice: {campaign.voice_clone_name}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      {campaign.completed_contacts} / {campaign.total_contacts} contacts
                    </Typography>

                    {campaign.status === 'generating' && (
                      <LinearProgress
                        variant="determinate"
                        value={campaign.progress}
                        sx={{ mb: 1 }}
                      />
                    )}

                    {campaign.status === 'failed' && campaign.error_message && (
                      <Alert severity="error" sx={{ mb: 1, fontSize: '0.8rem' }}>
                        {campaign.error_message}
                      </Alert>
                    )}

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Chip
                        label={campaign.status}
                        color={
                          campaign.status === 'completed' ? 'success' :
                          campaign.status === 'failed' ? 'error' : 'primary'
                        }
                      />

                      {campaign.status === 'generating' && (
                        <Typography variant="caption" color="text.secondary">
                          Progress: {campaign.progress}%
                        </Typography>
                      )}

                      {campaign.status === 'completed' && (
                        <>
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<FileDownload />}
                            onClick={() => {
                              // Use the existing campaigns download endpoint
                              window.open(`http://localhost:4001/api/mass-voicemail/campaigns/${campaign.id}/download`, '_blank');
                            }}
                            sx={{ mt: 1 }}
                          >
                            Download MP3
                          </Button>

                          <Button
                            variant="contained"
                            size="small"
                            startIcon={<Phone />}
                            onClick={() => openVoicemailDialog(campaign)}
                            sx={{ mt: 1 }}
                            color="success"
                          >
                            Send Voicemails
                          </Button>
                        </>
                      )}

                      {campaign.last_updated && (
                        <Typography variant="caption" color="text.secondary">
                          Last updated: {new Date(campaign.last_updated).toLocaleTimeString()}
                        </Typography>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>
      </Paper>

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