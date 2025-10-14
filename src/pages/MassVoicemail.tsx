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
  Chip
} from '@mui/material';
import {
  CloudUpload,
  PlayArrow,
  Delete,
  FileDownload,
  Campaign,
  RecordVoiceOver
} from '@mui/icons-material';

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

  useEffect(() => {
    loadVoiceClones();
    loadCampaigns();
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
    </Box>
  );
};

export default MassVoicemail;