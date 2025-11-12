import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Avatar,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  ListItemButton,
  List,
  ListItem
} from '@mui/material';
import {
  Person as PersonIcon,
  Business as BusinessIcon,
  Send as SendIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  ContentCopy as ContentCopyIcon,
  Close as CloseIcon,
  Email as EmailIcon,
  LinkedIn as LinkedInIcon
} from '@mui/icons-material';
import axios from '../lib/axios';
import { thesisApi, InvestmentThesis } from '../services/thesisApi';
import { searcherProfilesApi, SearcherProfile } from '../services/searcherProfilesApi';

interface Contact {
  id: string;
  name: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  linkedin_url: string;
  title: string;
  company: string;
  website?: string;
  type: 'deal' | 'investor' | 'broker';
  city?: string;
  state?: string;
  country?: string;
  tags?: string[];
  originalTags?: string[];
}

interface BulkBrokerProfile {
  id: number;
  rawLinkedInText: string;
  websiteUrl: string;
  contactName: string;
  contactEmail: string;
  linkedinUrl: string;
  generatedMessage?: any;
  status: 'pending' | 'generating' | 'success' | 'error';
  error?: string;
}

const BrokerOutreach: React.FC = () => {
  const ACCENT_BLACK = '#1a1a1a';
  const ACCENT_GREY = '#2c2c2c';
  const ACCENT_LIGHT = '#f8f9fa';
  const ACCENT_BORDER = '#e5e7eb';

  // Data state
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [theses, setTheses] = useState<InvestmentThesis[]>([]);
  const [searcherProfiles, setSearcherProfiles] = useState<SearcherProfile[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [loadingTheses, setLoadingTheses] = useState(false);
  const [loadingProfiles, setLoadingProfiles] = useState(false);

  // Selection state
  const [selectedContacts, setSelectedContacts] = useState<Contact[]>([]);
  const [contactSelectionOpen, setContactSelectionOpen] = useState(false);
  const [selectedThesisId, setSelectedThesisId] = useState('');
  const [selectedProfileId, setSelectedProfileId] = useState('');

  // Bulk processing state
  const [bulkProfiles, setBulkProfiles] = useState<BulkBrokerProfile[]>(
    Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      rawLinkedInText: '',
      websiteUrl: '',
      contactName: '',
      contactEmail: '',
      linkedinUrl: '',
      status: 'pending' as const
    }))
  );

  const [globalCallPreference, setGlobalCallPreference] = useState('');
  const [isBulkGenerating, setIsBulkGenerating] = useState(false);
  const [bulkMessage, setBulkMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Edit state
  const [editingMessageId, setEditingMessageId] = useState<number | null>(null);
  const [schedulingMessageId, setSchedulingMessageId] = useState<number | null>(null);

  // Fetch data on component mount
  useEffect(() => {
    fetchContacts();
    fetchTheses();
    fetchSearcherProfiles();
  }, []);

  const fetchContacts = async () => {
    setLoadingContacts(true);
    try {
      const response = await axios.get<any>('/api/firebase/contacts');
      const contactsList = response.data?.data?.contacts || response.data?.data || [];

      const contactsWithTypes = contactsList.map((contact: any) => {
        let contactType: 'deal' | 'investor' | 'broker' = 'deal';
        const tags = contact.tags || [];
        const originalTags = [...tags]; // Preserve original tags for filtering

        if (tags.includes('investor') || tags.includes('investors')) {
          contactType = 'investor';
        } else if (tags.includes('broker') || tags.includes('brokers')) {
          contactType = 'broker';
        } else if (tags.includes('people') || tags.includes('deal')) {
          contactType = 'deal';
        }

        return {
          ...contact,
          linkedin_url: contact.linkedinUrl || contact.linkedin_url || '',
          first_name: contact.firstName || contact.first_name || '',
          last_name: contact.lastName || contact.last_name || '',
          type: contactType,
          status: contact.status || 'active',
          originalTags: originalTags, // Preserve original tags for filtering
          tags: tags.filter((tag: string) => !['people', 'broker', 'investor', 'brokers', 'investors', 'deal'].includes(tag))
        };
      });

      setContacts(contactsWithTypes);
    } catch (error) {
      console.error('Error fetching contacts:', error);
    } finally {
      setLoadingContacts(false);
    }
  };

  const fetchTheses = async () => {
    setLoadingTheses(true);
    try {
      const thesesData = await thesisApi.getTheses();
      console.log('📚 Loaded theses:', thesesData);
      setTheses(thesesData);
      // Auto-select first thesis if available
      if (thesesData.length > 0) {
        setSelectedThesisId(thesesData[0].id || '');
        console.log('✅ Auto-selected thesis:', thesesData[0].id, thesesData[0].name);
      } else {
        console.warn('⚠️ No theses found! Please create a thesis first.');
      }
    } catch (error) {
      console.error('❌ Error fetching theses:', error);
    } finally {
      setLoadingTheses(false);
    }
  };

  const fetchSearcherProfiles = async () => {
    setLoadingProfiles(true);
    try {
      const profiles = await searcherProfilesApi.getSearcherProfiles();
      console.log('👤 Loaded searcher profiles:', profiles);
      setSearcherProfiles(profiles);
      // Auto-select first profile if available
      if (profiles.length > 0) {
        setSelectedProfileId(profiles[0].id);
        console.log('✅ Auto-selected profile:', profiles[0].id, profiles[0].name);
      } else {
        console.warn('⚠️ No searcher profiles found! Please create a profile first.');
      }
    } catch (error) {
      console.error('❌ Error fetching searcher profiles:', error);
    } finally {
      setLoadingProfiles(false);
    }
  };

  const handleSelectContacts = () => {
    setContactSelectionOpen(true);
  };

  const handleContactSelection = (selectedContacts: Contact[]) => {
    setSelectedContacts(selectedContacts);

    const updatedProfiles = bulkProfiles.map((profile, index) => {
      if (index < selectedContacts.length) {
        const contact = selectedContacts[index];
        return {
          ...profile,
          contactName: contact.name,
          contactEmail: contact.email || '',
          linkedinUrl: contact.linkedin_url || '',
          rawLinkedInText: '',
          websiteUrl: contact.website || ''
        };
      }
      return profile;
    });

    setBulkProfiles(updatedProfiles);
    setContactSelectionOpen(false);
  };

  const handleProfileInputChange = (profileId: number, field: 'rawLinkedInText' | 'websiteUrl' | 'contactName' | 'contactEmail') => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setBulkProfiles(prev => prev.map(profile =>
      profile.id === profileId
        ? { ...profile, [field]: event.target.value }
        : profile
    ));
  };

  const handleBulkGenerate = async () => {
    // Validate required selections
    if (!selectedThesisId) {
      setBulkMessage({
        type: 'error',
        text: 'Please select an investment thesis.'
      });
      return;
    }

    if (!selectedProfileId) {
      setBulkMessage({
        type: 'error',
        text: 'Please select a searcher profile.'
      });
      return;
    }

    if (!globalCallPreference) {
      setBulkMessage({
        type: 'error',
        text: 'Please select a call preference.'
      });
      return;
    }

    // Get profiles with LinkedIn data
    const profilesWithData = bulkProfiles.filter(profile => profile.rawLinkedInText.trim());

    if (profilesWithData.length === 0) {
      setBulkMessage({
        type: 'error',
        text: 'Please paste LinkedIn profile data for at least one broker.'
      });
      return;
    }

    setIsBulkGenerating(true);
    setBulkMessage(null);

    // Reset all profiles to pending
    setBulkProfiles(prev => prev.map(profile => ({ ...profile, status: 'pending' as const })));

    // Get selected thesis and profile
    const selectedThesis = theses.find(t => t.id === selectedThesisId);
    const selectedProfile = searcherProfiles.find(p => p.id === selectedProfileId);

    console.log('🎯 Broker Outreach Debug:', {
      selectedThesisId,
      selectedProfileId,
      selectedThesis,
      selectedProfile,
      profilesWithData: profilesWithData.length,
      thesesCount: theses.length,
      profilesCount: searcherProfiles.length
    });

    // Track counts as we process (can't rely on state due to async updates)
    let successCount = 0;
    let errorCount = 0;

    // Process each profile
    for (const profile of profilesWithData) {
      try {
        // Update status to generating
        setBulkProfiles(prev => prev.map(p =>
          p.id === profile.id ? { ...p, status: 'generating' as const } : p
        ));

        console.log(`🚀 Generating message for broker ${profile.id}:`, {
          hasThesis: !!selectedThesis,
          hasProfile: !!selectedProfile,
          callPreference: globalCallPreference
        });

        const response = await axios.post('/api/broker-outreach/generate-message', {
          brokerData: {
            rawLinkedInText: profile.rawLinkedInText,
            websiteUrl: profile.websiteUrl,
            callPreference: globalCallPreference
          },
          thesis: selectedThesis,
          searcherProfile: selectedProfile
        });

        console.log(`📡 Response status for broker ${profile.id}:`, response.status);

        const result = response.data;

        console.log(`📦 Response data for broker ${profile.id}:`, result);

        if (result.success) {
          setBulkProfiles(prev => prev.map(p =>
            p.id === profile.id
              ? { ...p, status: 'success' as const, generatedMessage: result.data }
              : p
          ));
          successCount++;
          console.log(`✅ Success for broker ${profile.id}. Total successes: ${successCount}`);
        } else {
          setBulkProfiles(prev => prev.map(p =>
            p.id === profile.id
              ? { ...p, status: 'error' as const, error: result.error || 'Failed to generate message' }
              : p
          ));
          errorCount++;
          console.log(`❌ Error for broker ${profile.id}: ${result.error}`);
        }
      } catch (error) {
        console.error(`❌ Network error for broker ${profile.id}:`, error);
        setBulkProfiles(prev => prev.map(p =>
          p.id === profile.id
            ? { ...p, status: 'error' as const, error: 'Network error' }
            : p
        ));
        errorCount++;
      }
    }

    // Show completion message
    console.log(`📊 Final counts - Success: ${successCount}, Error: ${errorCount}`);

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

  const handleMessageEdit = (profileId: number, field: 'subject' | 'body', value: string) => {
    setBulkProfiles(prev => prev.map(p => {
      if (p.id === profileId && p.generatedMessage) {
        return {
          ...p,
          generatedMessage: {
            ...p.generatedMessage,
            message: {
              ...p.generatedMessage.message,
              [field]: value
            }
          }
        };
      }
      return p;
    }));
  };

  const handleApproveAndSchedule = async (profile: BulkBrokerProfile) => {
    if (!profile.generatedMessage || !profile.contactEmail) {
      alert('Missing email or message content');
      return;
    }

    setSchedulingMessageId(profile.id);

    try {
      const response = await axios.post<{ success: boolean; data?: { provider: string }; error?: string }>('/api/email-drafts/create', {
        to: profile.contactEmail,
        subject: profile.generatedMessage.message.subject,
        body: profile.generatedMessage.message.body,
        contactName: profile.contactName
      });

      if (response.data.success) {
        alert(`Draft created successfully in ${response.data.data?.provider || 'email'}!`);

        setBulkProfiles(prev => prev.map(p =>
          p.id === profile.id
            ? { ...p, status: 'success' as const }
            : p
        ));
      } else {
        alert('Failed to create draft: ' + (response.data.error || 'Unknown error'));
      }
    } catch (error: any) {
      console.error('Error creating draft:', error);
      alert('Error creating draft: ' + (error.response?.data?.error || error.message));
    } finally {
      setSchedulingMessageId(null);
    }
  };

  return (
    <Box sx={{ mt: 2 }}>
      {/* Banner Header */}
      <Box sx={{
        background: 'linear-gradient(180deg, #2c2c2c 0%, #1a1a1a 100%)',
        borderRadius: '12px 12px 0 0',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
        mb: 4,
        p: 4,
        position: 'relative',
        overflow: 'hidden'
      }}>
        <Box sx={{ position: 'relative', zIndex: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Box>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 400,
                  color: 'white',
                  fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                  letterSpacing: '-0.02em',
                  mb: 1
                }}
              >
                Broker Outreach Generator
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  color: 'rgba(255, 255, 255, 0.8)',
                  fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                  fontWeight: 400,
                  letterSpacing: '-0.01em'
                }}
              >
                Generate personalized acquisition outreach messages for business brokers
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>

      <Paper sx={{ overflow: 'hidden' }}>
        <Box sx={{ p: 3, bgcolor: 'background.paper' }}>
          <Typography
            variant="body2"
            sx={{
              mb: 3,
              color: '#6b7280',
              fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              fontWeight: 400,
              lineHeight: 1.6
            }}
          >
            Generate professional acquisition outreach emails for brokers. Select your thesis and profile to automatically include your credentials and acquisition criteria.
          </Typography>

          {/* Contact Selection Section */}
          <Card sx={{ mb: 3, border: '1px solid', borderColor: '#e5e7eb', borderRadius: 3, boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography
                  variant="h6"
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    fontWeight: 600,
                    color: '#1f2937',
                    letterSpacing: '-0.01em'
                  }}
                >
                  <PersonIcon sx={{ color: ACCENT_BLACK }} />
                  Broker Contact Selection
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<PersonIcon />}
                  onClick={handleSelectContacts}
                  disabled={loadingContacts}
                  sx={{
                    background: 'linear-gradient(180deg, #2c2c2c 0%, #1a1a1a 100%)',
                    color: 'white',
                    fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    fontWeight: 600,
                    borderRadius: 2,
                    px: 3,
                    py: 1,
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
                    '&:hover': {
                      background: 'linear-gradient(180deg, #1a1a1a 0%, #0a0a0a 100%)',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
                      transform: 'translateY(-1px)'
                    }
                  }}
                >
                  {loadingContacts ? 'Loading...' : 'Select Brokers'}
                </Button>
              </Box>

              {selectedContacts.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography
                    variant="subtitle2"
                    sx={{
                      mb: 1,
                      fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                      fontWeight: 600,
                      color: '#1f2937'
                    }}
                  >
                    Selected Brokers ({selectedContacts.length}):
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {selectedContacts.map((contact) => (
                      <Chip
                        key={contact.id}
                        label={`${contact.name} (${contact.company || 'No Company'})`}
                        onDelete={() => {
                          const updated = selectedContacts.filter(c => c.id !== contact.id);
                          setSelectedContacts(updated);
                        }}
                        sx={{
                          bgcolor: ACCENT_LIGHT,
                          color: ACCENT_BLACK,
                          border: `1px solid ${ACCENT_BORDER}`,
                          fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                          fontWeight: 500
                        }}
                      />
                    ))}
                  </Box>
                </Box>
              )}

              <Typography
                variant="caption"
                sx={{
                  color: '#6b7280',
                  fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                  fontWeight: 400
                }}
              >
                {contacts.filter(contact => contact.type === 'broker').length} broker contacts available.
              </Typography>
            </CardContent>
          </Card>

          {bulkMessage && (
            <Alert severity={bulkMessage.type} sx={{ mb: 3 }}>
              {bulkMessage.text}
            </Alert>
          )}

          {/* Spreadsheet-style Profile Input */}
          <Paper sx={{ overflow: 'hidden', border: '1px solid', borderColor: '#e5e7eb', borderRadius: 3, boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)' }}>
            <Box sx={{ p: 3, borderBottom: '1px solid', borderColor: '#e5e7eb', bgcolor: '#f8f9fa' }}>
              <Typography
                variant="h6"
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                  fontWeight: 600,
                  color: '#1f2937',
                  letterSpacing: '-0.01em',
                  m: 0
                }}
              >
                <BusinessIcon sx={{ color: ACCENT_BLACK }} />
                Broker Profiles (1-10)
              </Typography>
            </Box>

            {/* Header Row */}
            <Box sx={{
              display: 'grid',
              gridTemplateColumns: '60px 200px 1fr 300px 200px',
              borderBottom: '1px solid',
              borderColor: '#e5e7eb',
              bgcolor: '#f9fafb'
            }}>
              <Box sx={{ p: 2, borderRight: '1px solid', borderColor: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  #
                </Typography>
              </Box>
              <Box sx={{ p: 2, borderRight: '1px solid', borderColor: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  Broker
                </Typography>
              </Box>
              <Box sx={{ p: 2, borderRight: '1px solid', borderColor: '#e5e7eb', display: 'flex', alignItems: 'center' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  LinkedIn Profile Data
                </Typography>
              </Box>
              <Box sx={{ p: 2, borderRight: '1px solid', borderColor: '#e5e7eb', display: 'flex', alignItems: 'center' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  Website URL (Optional)
                </Typography>
              </Box>
              <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  Status
                </Typography>
              </Box>
            </Box>

            {/* Data Rows */}
            {bulkProfiles.map((profile, index) => (
              <Box key={profile.id} sx={{
                display: 'grid',
                gridTemplateColumns: '60px 200px 1fr 300px 200px',
                borderBottom: index < bulkProfiles.length - 1 ? '1px solid' : 'none',
                borderColor: 'divider',
                '&:hover': {
                  bgcolor: '#fafafa'
                }
              }}>
                <Box sx={{ p: 2, borderRight: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {profile.id}
                  </Typography>
                </Box>

                <Box sx={{ p: 1, borderRight: '1px solid', borderColor: 'divider', display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  <TextField
                    fullWidth
                    placeholder="Broker Name"
                    value={profile.contactName}
                    onChange={handleProfileInputChange(profile.id, 'contactName')}
                    variant="outlined"
                    size="small"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        fontSize: '0.75rem',
                        height: '28px'
                      },
                      '& .MuiInputBase-input': {
                        padding: '4px 8px'
                      }
                    }}
                  />
                  <TextField
                    fullWidth
                    placeholder="Broker Email"
                    value={profile.contactEmail}
                    onChange={handleProfileInputChange(profile.id, 'contactEmail')}
                    variant="outlined"
                    size="small"
                    type="email"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        fontSize: '0.75rem',
                        height: '28px'
                      },
                      '& .MuiInputBase-input': {
                        padding: '4px 8px'
                      }
                    }}
                  />
                  {profile.contactName && profile.linkedinUrl && (
                    <Tooltip title="Open LinkedIn profile">
                      <IconButton
                        size="small"
                        onClick={() => window.open(profile.linkedinUrl, '_blank')}
                        sx={{
                          width: 24,
                          height: 24,
                          p: 0.5,
                          border: '1px solid #0077B5',
                          borderRadius: 1,
                          '&:hover': {
                            bgcolor: 'rgba(0, 119, 181, 0.1)'
                          }
                        }}
                      >
                        <LinkedInIcon sx={{ fontSize: 16, color: '#0077B5' }} />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>

                <Box sx={{ p: 1, borderRight: '1px solid', borderColor: 'divider' }}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    value={profile.rawLinkedInText}
                    onChange={handleProfileInputChange(profile.id, 'rawLinkedInText')}
                    placeholder="Paste broker LinkedIn profile content here..."
                    variant="outlined"
                    size="small"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        fontSize: '0.875rem'
                      }
                    }}
                  />
                </Box>

                <Box sx={{ p: 1, borderRight: '1px solid', borderColor: 'divider' }}>
                  <TextField
                    fullWidth
                    value={profile.websiteUrl}
                    onChange={handleProfileInputChange(profile.id, 'websiteUrl')}
                    placeholder="https://brokerage-firm.com"
                    variant="outlined"
                    size="small"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        fontSize: '0.875rem'
                      }
                    }}
                  />
                </Box>

                <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {profile.status === 'generating' && <CircularProgress size={20} />}
                  {profile.status === 'success' && <CheckCircleIcon sx={{ color: 'success.main', fontSize: 24 }} />}
                  {profile.status === 'error' && <ErrorIcon sx={{ color: 'error.main', fontSize: 24 }} />}
                  {profile.status === 'pending' && (
                    <Typography variant="caption" color="text.secondary">
                      Pending
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
                Outreach Settings
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth required>
                    <InputLabel>Investment Thesis *</InputLabel>
                    <Select
                      value={selectedThesisId}
                      onChange={(e) => setSelectedThesisId(e.target.value)}
                      label="Investment Thesis *"
                      disabled={loadingTheses}
                    >
                      {theses.map((thesis) => (
                        <MenuItem key={thesis.id} value={thesis.id}>
                          {thesis.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={4}>
                  <FormControl fullWidth required>
                    <InputLabel>Searcher Profile *</InputLabel>
                    <Select
                      value={selectedProfileId}
                      onChange={(e) => setSelectedProfileId(e.target.value)}
                      label="Searcher Profile *"
                      disabled={loadingProfiles}
                    >
                      {searcherProfiles.map((profile) => (
                        <MenuItem key={profile.id} value={profile.id}>
                          {profile.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={4}>
                  <FormControl fullWidth required>
                    <InputLabel>Call Preference *</InputLabel>
                    <Select
                      value={globalCallPreference}
                      onChange={(e) => setGlobalCallPreference(e.target.value)}
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
              </Grid>
            </CardContent>
          </Card>

          {/* Generated Messages Section */}
          {bulkProfiles.some(p => p.generatedMessage) && (
            <Paper sx={{ mt: 3, overflow: 'hidden' }}>
              <Box sx={{
                p: 2.5,
                background: 'linear-gradient(180deg, #2c2c2c 0%, #1a1a1a 100%)',
                color: 'white'
              }}>
                <Typography variant="h6" sx={{ fontWeight: 400 }}>
                  Generated Outreach Messages
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                  AI-generated broker outreach messages ready for review
                </Typography>
              </Box>

              <Box sx={{ p: 2.5, maxHeight: '600px', overflowY: 'auto', bgcolor: 'background.paper' }}>
                {bulkProfiles
                  .filter(p => p.generatedMessage)
                  .map((profile) => (
                  <Box
                    key={profile.id}
                    sx={{
                      p: 2,
                      mb: 1.5,
                      border: '1px solid',
                      borderColor: ACCENT_BORDER,
                      borderRadius: 1.5,
                      bgcolor: ACCENT_LIGHT
                    }}
                  >
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                      <Avatar sx={{ bgcolor: '#000000', width: 36, height: 36 }}>
                        {profile.id}
                      </Avatar>

                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                            {profile.contactName || `Broker ${profile.id}`}
                          </Typography>
                          <Chip label="Generated" size="small" sx={{ height: 20, fontSize: '0.6875rem', bgcolor: 'success.main', color: 'white', fontWeight: 600 }} />
                        </Box>

                        <Box sx={{
                          p: 1.5,
                          bgcolor: '#FFFFFF',
                          borderRadius: 1,
                          border: '1px solid',
                          borderColor: editingMessageId === profile.id ? 'primary.main' : 'divider',
                          mb: 1
                        }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                              Subject:
                            </Typography>
                            <TextField
                              fullWidth
                              value={profile.generatedMessage?.message.subject || ''}
                              onChange={(e) => handleMessageEdit(profile.id, 'subject', e.target.value)}
                              variant="standard"
                              size="small"
                              sx={{
                                '& .MuiInput-root': {
                                  fontSize: '0.875rem',
                                  fontWeight: 600
                                }
                              }}
                            />
                          </Box>
                          <TextField
                            fullWidth
                            multiline
                            rows={8}
                            value={profile.generatedMessage?.message.body || ''}
                            onChange={(e) => handleMessageEdit(profile.id, 'body', e.target.value)}
                            variant="outlined"
                            size="small"
                            sx={{
                              mb: 1,
                              '& .MuiOutlinedInput-root': {
                                fontSize: '0.8125rem',
                                lineHeight: 1.5
                              }
                            }}
                          />
                        </Box>
                      </Box>

                      <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }}>
                        <Tooltip title="Copy Message">
                          <IconButton
                            size="small"
                            onClick={() => {
                              const messageText = `${profile.generatedMessage?.message.subject}\n\n${profile.generatedMessage?.message.body}`;
                              navigator.clipboard.writeText(messageText);
                            }}
                            sx={{ color: 'primary.main', border: '1px solid', borderColor: 'primary.main', width: 32, height: 32 }}
                          >
                            <ContentCopyIcon sx={{ fontSize: '1rem' }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Reject Message">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setBulkProfiles(prev => prev.map(p =>
                                p.id === profile.id
                                  ? { ...p, generatedMessage: undefined, status: 'pending' as const }
                                  : p
                              ));
                            }}
                            sx={{ color: 'error.main', border: '1px solid', borderColor: 'error.main', width: 32, height: 32 }}
                          >
                            <CloseIcon sx={{ fontSize: '1rem' }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={!profile.contactEmail ? "Add broker email to enable scheduling" : "Approve & Schedule as Draft"}>
                          <span>
                            <IconButton
                              size="small"
                              onClick={() => handleApproveAndSchedule(profile)}
                              disabled={schedulingMessageId === profile.id || !profile.contactEmail}
                              sx={{
                                color: 'white',
                                bgcolor: 'success.main',
                                width: 32,
                                height: 32,
                                '&:hover': {
                                  bgcolor: 'success.dark'
                                },
                                '&:disabled': {
                                  bgcolor: '#9ca3af',
                                  color: 'white'
                                }
                              }}
                            >
                              {schedulingMessageId === profile.id ? (
                                <CircularProgress size={16} sx={{ color: 'white' }} />
                              ) : (
                                <Box sx={{ fontSize: '1.2rem', fontWeight: 'bold' }}>✓</Box>
                              )}
                            </IconButton>
                          </span>
                        </Tooltip>
                      </Box>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Paper>
          )}

          {/* Generate Button */}
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
            <Button
              variant="contained"
              size="large"
              onClick={handleBulkGenerate}
              disabled={isBulkGenerating}
              sx={{
                px: 4,
                py: 1.5,
                background: 'linear-gradient(180deg, #2c2c2c 0%, #1a1a1a 100%)',
                color: '#fff',
                fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                fontWeight: 600,
                borderRadius: 3,
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                '&:hover': {
                  background: 'linear-gradient(180deg, #1a1a1a 0%, #0a0a0a 100%)',
                  boxShadow: '0 6px 16px rgba(0, 0, 0, 0.4)',
                  transform: 'translateY(-1px)'
                },
                '&:disabled': {
                  backgroundColor: '#9ca3af',
                  boxShadow: 'none'
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
      </Paper>

      {/* Broker Selection Dialog */}
      <Dialog
        open={contactSelectionOpen}
        onClose={() => setContactSelectionOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '12px',
            maxHeight: '80vh'
          }
        }}
      >
        <Box sx={{
          background: 'linear-gradient(180deg, #2c2c2c 0%, #1a1a1a 100%)',
          color: 'white',
          p: 3
        }}>
          <Typography variant="h6" sx={{ fontWeight: 400, mb: 1 }}>
            Select Broker Contacts
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
            Choose up to 10 brokers for outreach
          </Typography>
        </Box>
        <DialogContent sx={{ p: 0 }}>
          <Box sx={{ maxHeight: '50vh', overflowY: 'auto' }}>
            <List>
              {contacts
                .filter(contact => contact.type === 'broker')
                .map((contact) => (
                <ListItem key={contact.id} disablePadding>
                  <ListItemButton
                    onClick={() => {
                      const isSelected = selectedContacts.some(c => c.id === contact.id);
                      if (isSelected) {
                        setSelectedContacts(prev => prev.filter(c => c.id !== contact.id));
                      } else if (selectedContacts.length < 10) {
                        setSelectedContacts(prev => [...prev, contact]);
                      }
                    }}
                    disabled={!selectedContacts.some(c => c.id === contact.id) && selectedContacts.length >= 10}
                    sx={{ py: 1.5, px: 2 }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                      <Box sx={{ mr: 2 }}>
                        <input
                          type="checkbox"
                          checked={selectedContacts.some(c => c.id === contact.id)}
                          onChange={() => {}}
                        />
                      </Box>
                      <Avatar sx={{ width: 40, height: 40, bgcolor: '#000000', mr: 2 }}>
                        {contact.first_name?.[0]}{contact.last_name?.[0]}
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                          {contact.name}
                        </Typography>
                        {contact.company && (
                          <Typography variant="body2" color="text.secondary">
                            {contact.company}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 4 }}>
          <Button onClick={() => setContactSelectionOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => handleContactSelection(selectedContacts)}
            disabled={selectedContacts.length === 0}
            sx={{
              background: 'linear-gradient(180deg, #2c2c2c 0%, #1a1a1a 100%)',
              color: 'white !important'
            }}
          >
            Use Selected ({selectedContacts.length})
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BrokerOutreach;
