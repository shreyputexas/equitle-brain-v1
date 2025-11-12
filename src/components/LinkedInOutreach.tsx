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
  Divider,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  ListItemButton,
  InputAdornment
} from '@mui/material';
import {
  Person as PersonIcon,
  LocationOn as LocationIcon,
  Schedule as ScheduleIcon,
  Business as BusinessIcon,
  LinkedIn as LinkedInIcon,
  Group as GroupIcon,
  Send as SendIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  ContentCopy as ContentCopyIcon,
  Close as CloseIcon,
  Email as EmailIcon
} from '@mui/icons-material';
import { useLocation } from 'react-router-dom';
import axios from '../lib/axios';

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
}

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
  contactName: string;
  contactEmail: string;
  linkedinUrl: string;
  generatedMessage?: any;
  status: 'pending' | 'generating' | 'success' | 'error';
  error?: string;
}

interface LinkedInOutreachProps {
  onMessageGenerated?: (message: any) => void;
}

const LinkedInOutreach: React.FC<LinkedInOutreachProps> = ({ onMessageGenerated }) => {
  const location = useLocation();
  
  // Determine context based on current route
  const isBrokerPage = location.pathname.includes('/outreach/brokers');
  const isDealPage = location.pathname.includes('/outreach/deals');
  
  // Black accent colors for consistency across all pages
  const ACCENT_BLACK = '#1a1a1a';
  const ACCENT_GREY = '#2c2c2c';
  const ACCENT_LIGHT = '#f8f9fa';
  const ACCENT_BORDER = '#e5e7eb';

  // Contact data state
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [selectedContacts, setSelectedContacts] = useState<Contact[]>([]);
  const [contactSelectionOpen, setContactSelectionOpen] = useState(false);
  const [contactFilter, setContactFilter] = useState<'all' | 'deal' | 'investor' | 'broker'>('all');

  // Bulk processing state
  const [bulkProfiles, setBulkProfiles] = useState<BulkLinkedInProfile[]>(
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
  const [globalOutreachType, setGlobalOutreachType] = useState('');
  const [isBulkGenerating, setIsBulkGenerating] = useState(false);
  const [bulkMessage, setBulkMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [expanded, setExpanded] = useState(true);

  // Edit state for messages
  const [editingMessageId, setEditingMessageId] = useState<number | null>(null);
  const [schedulingMessageId, setSchedulingMessageId] = useState<number | null>(null);

  // Fetch contacts on component mount
  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    setLoadingContacts(true);
    try {
      const response = await axios.get<any>('/api/firebase/contacts');
      const contactsList = response.data?.data?.contacts || response.data?.data || [];
      
      // Apply the same type determination logic as Contacts.tsx
      const contactsWithTypes = contactsList.map((contact: any) => {
        // Determine contact type from tags
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
          // Map backend camelCase to frontend snake_case
          linkedin_url: contact.linkedinUrl || contact.linkedin_url || '',
          first_name: contact.firstName || contact.first_name || '',
          last_name: contact.lastName || contact.last_name || '',
          type: contactType,
          status: contact.status || 'active',
          originalTags: originalTags, // Preserve original tags for filtering
          tags: tags.filter((tag: string) => !['people', 'broker', 'investor', 'brokers', 'investors', 'deal'].includes(tag))
        };
      });
      
      console.log('Fetched contacts with types:', contactsWithTypes);
      setContacts(contactsWithTypes);
    } catch (error) {
      console.error('Error fetching contacts:', error);
    } finally {
      setLoadingContacts(false);
    }
  };

  const handleSelectContacts = () => {
    setContactSelectionOpen(true);
  };

  const handleContactSelection = (selectedContacts: Contact[]) => {
    setSelectedContacts(selectedContacts);

    console.log('=== SELECTED CONTACTS DEBUG ===');
    console.log('Selected contacts:', selectedContacts);
    console.log('Number of contacts:', selectedContacts.length);

    // Auto-populate contact name, URLs for icon functionality, and website URL
    const updatedProfiles = bulkProfiles.map((profile, index) => {
      if (index < selectedContacts.length) {
        const contact = selectedContacts[index];

        console.log(`Contact ${index + 1}:`, {
          name: contact.name,
          linkedin_url: contact.linkedin_url,
          email: contact.email,
          website: contact.website,
          hasLinkedIn: !!contact.linkedin_url
        });

        return {
          ...profile,
          contactName: contact.name,
          contactEmail: contact.email || '',
          linkedinUrl: contact.linkedin_url || '',
          // Auto-fill website URL from contact data
          rawLinkedInText: '',
          websiteUrl: contact.website || ''
        };
      }
      return profile;
    });

    console.log('Updated profiles:', updatedProfiles);
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

  // Handle message editing
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

  // Handle approve & schedule - create email draft
  const handleApproveAndSchedule = async (profile: BulkLinkedInProfile) => {
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

        // Mark as scheduled
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
      {/* Banner Header with Black/Grey Gradient */}
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
                {isBrokerPage ? 'Broker Outreach' : isDealPage ? 'Deal Outreach' : 'Bulk Outreach Generator'}
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
                {isBrokerPage 
                  ? 'Generate personalized messages and emails for your broker contacts'
                  : isDealPage
                  ? 'Generate personalized messages and emails for your deal contacts'
                  : 'Generate personalized messages and/or emails for multiple contacts at once'}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>

      <Paper sx={{ overflow: 'hidden' }}>

      {/* Content */}
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
            Generate personalized LinkedIn messages for up to 10 people at once. Select contacts from your database or manually paste LinkedIn profiles.
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
                  Contact Selection
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
                    },
                    '&:disabled': {
                      backgroundColor: '#9ca3af',
                      boxShadow: 'none',
                      transform: 'none'
                    }
                  }}
                >
                  {loadingContacts ? 'Loading...' : 'Select Contacts'}
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
                    Selected Contacts ({selectedContacts.length}):
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
                {contacts.filter(contact => {
                  const originalTags = (contact as any).originalTags || [];
                  if (isDealPage) {
                    return originalTags.includes('deal');
                  } else {
                    return originalTags.includes('broker') || originalTags.includes('brokers');
                  }
                }).length} contacts available. 
                Selected contacts will auto-populate the contact names and enable LinkedIn/Email icons.
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
            {/* Section Header */}
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
                <PersonIcon sx={{ color: ACCENT_BLACK }} />
                LinkedIn Profiles (1-10)
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
                <Typography 
                  variant="subtitle2" 
                  sx={{ 
                    fontWeight: 600,
                    fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    color: '#1f2937'
                  }}
                >
                  #
                </Typography>
              </Box>
              <Box sx={{ p: 2, borderRight: '1px solid', borderColor: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography 
                  variant="subtitle2" 
                  sx={{ 
                    fontWeight: 600,
                    fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    color: '#1f2937'
                  }}
                >
                  Profile
                </Typography>
              </Box>
              <Box sx={{ p: 2, borderRight: '1px solid', borderColor: '#e5e7eb', display: 'flex', alignItems: 'center' }}>
                <Typography 
                  variant="subtitle2" 
                  sx={{ 
                    fontWeight: 600,
                    fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    color: '#1f2937'
                  }}
                >
                  LinkedIn Profile Data
                </Typography>
              </Box>
              <Box sx={{ p: 2, borderRight: '1px solid', borderColor: '#e5e7eb', display: 'flex', alignItems: 'center' }}>
                <Typography 
                  variant="subtitle2" 
                  sx={{ 
                    fontWeight: 600,
                    fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    color: '#1f2937'
                  }}
                >
                  Website URL (Optional)
                </Typography>
              </Box>
              <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography 
                  variant="subtitle2" 
                  sx={{ 
                    fontWeight: 600,
                    fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    color: '#1f2937'
                  }}
                >
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
                {/* Row Number */}
                <Box sx={{ 
                  p: 2, 
                  borderRight: '1px solid', 
                  borderColor: 'divider', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center'
                }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {profile.id}
                  </Typography>
                </Box>

                {/* Profile Column with Name and Contact Info */}
                <Box sx={{ 
                  p: 1, 
                  borderRight: '1px solid', 
                  borderColor: 'divider', 
                  display: 'flex', 
                  flexDirection: 'column',
                  gap: 0.5
                }}>
                  <TextField
                    fullWidth
                    placeholder="Contact Name"
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
                    placeholder="Contact Email"
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
                  {profile.contactName && (
                    <Box sx={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      gap: 0.25,
                      mt: 0.5
                    }}>
                      {(() => {
                        const selectedContact = selectedContacts.find(c => c.name === profile.contactName);
                        console.log('=== BUTTON RENDER DEBUG ===');
                        console.log('Profile contact name:', profile.contactName);
                        console.log('Selected contacts:', selectedContacts);
                        console.log('Found contact:', selectedContact);
                        if (selectedContact) {
                          console.log('Contact LinkedIn URL:', selectedContact.linkedin_url);
                          console.log('Has LinkedIn URL:', !!selectedContact.linkedin_url);
                          return (
                            <>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Typography variant="caption" sx={{ 
                                  fontSize: '0.625rem', 
                                  fontWeight: 600, 
                                  color: selectedContact.type === 'investor' ? '#1E40AF' : 
                                         selectedContact.type === 'broker' ? '#92400E' : ACCENT_BLACK,
                                  textTransform: 'uppercase',
                                  bgcolor: selectedContact.type === 'investor' ? '#DBEAFE' : 
                                           selectedContact.type === 'broker' ? '#FEF3C7' : ACCENT_LIGHT,
                                  px: 0.5,
                                  py: 0.125,
                                  borderRadius: 0.25
                                }}>
                                  {selectedContact.type}
                                </Typography>
                                {/* LinkedIn button - opens profile in new tab */}
                                {selectedContact.linkedin_url ? (
                                  <Tooltip title={`Open ${selectedContact.name}'s LinkedIn profile`}>
                                    <IconButton
                                      size="small"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        console.log('Opening LinkedIn:', selectedContact.linkedin_url);
                                        window.open(selectedContact.linkedin_url, '_blank', 'noopener,noreferrer');
                                      }}
                                      sx={{
                                        width: 24,
                                        height: 24,
                                        p: 0.5,
                                        border: '1px solid #0077B5',
                                        borderRadius: 1,
                                        cursor: 'pointer',
                                        '&:hover': {
                                          bgcolor: 'rgba(0, 119, 181, 0.1)',
                                          borderColor: '#005885'
                                        }
                                      }}
                                    >
                                      <LinkedInIcon sx={{
                                        fontSize: 16,
                                        color: '#0077B5'
                                      }} />
                                    </IconButton>
                                  </Tooltip>
                                ) : (
                                  <Tooltip title={`${selectedContact.name} doesn't have a LinkedIn profile`}>
                                    <span>
                                      <IconButton
                                        size="small"
                                        disabled
                                        sx={{
                                          width: 24,
                                          height: 24,
                                          p: 0.5,
                                          border: '1px solid #D1D5DB',
                                          borderRadius: 1,
                                          '&.Mui-disabled': {
                                            borderColor: '#D1D5DB',
                                            bgcolor: '#F9FAFB'
                                          }
                                        }}
                                      >
                                        <LinkedInIcon sx={{
                                          fontSize: 16,
                                          color: '#9CA3AF'
                                        }} />
                                      </IconButton>
                                    </span>
                                  </Tooltip>
                                )}
                              </Box>
                              {selectedContact.title && (
                                <Typography variant="caption" sx={{ fontSize: '0.625rem', fontWeight: 600, color: '#333333' }}>
                                  {selectedContact.title}
                                </Typography>
                              )}
                              {selectedContact.company && (
                                <Typography variant="caption" sx={{ fontSize: '0.625rem', fontWeight: 600, color: '#333333' }}>
                                  {selectedContact.company}
                                </Typography>
                              )}
                            </>
                          );
                        }
                        return null;
                      })()}
                    </Box>
                  )}
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
                <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
              {/* Black/Grey Gradient Header Section */}
              <Box sx={{ 
                p: 2.5, 
                background: 'linear-gradient(180deg, #2c2c2c 0%, #1a1a1a 100%)',
                color: 'white', 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                borderRadius: '12px 12px 0 0',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)'
              }}>
                <Box>
                  <Typography variant="h6" sx={{ 
                    fontWeight: 400, 
                    fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', 
                    color: 'white', 
                    fontSize: '1.125rem',
                    letterSpacing: '-0.02em',
                    mb: 0.5
                  }}>
                    Generated Outreach Messages
                  </Typography>
                  <Typography variant="caption" sx={{ 
                    color: 'rgba(255, 255, 255, 0.8)',
                    fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    fontWeight: 400,
                    letterSpacing: '-0.01em'
                  }}>
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
                    <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
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
                        borderColor: ACCENT_BORDER,
                        borderRadius: 1.5,
                        bgcolor: ACCENT_LIGHT,
                        transition: 'all 0.15s ease',
                        '&:hover': {
                          borderColor: ACCENT_BLACK,
                          bgcolor: ACCENT_LIGHT
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
                          
                          {/* Generated Message Display - Editable */}
                          <Box sx={{
                            p: 1.5,
                            bgcolor: '#FFFFFF',
                            borderRadius: 1,
                            border: '1px solid',
                            borderColor: editingMessageId === profile.id ? 'primary.main' : 'divider',
                            mb: 1,
                            cursor: 'pointer',
                            '&:hover': {
                              borderColor: 'primary.light'
                            }
                          }}
                          onClick={() => setEditingMessageId(profile.id)}
                          >
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
                                onClick={(e) => e.stopPropagation()}
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
                              onClick={(e) => e.stopPropagation()}
                              sx={{
                                mb: 1,
                                '& .MuiOutlinedInput-root': {
                                  fontSize: '0.8125rem',
                                  lineHeight: 1.5
                                }
                              }}
                            />
                            <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                              Approach: {profile.generatedMessage?.message.approach}
                            </Typography>
                            {editingMessageId === profile.id && (
                              <Typography variant="caption" color="primary.main" sx={{ display: 'block', mt: 1 }}>
                                ✏️ Click outside or on action buttons when done editing
                              </Typography>
                            )}
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
                          <Tooltip title={
                            !profile.contactEmail
                              ? "Add contact email to enable scheduling"
                              : schedulingMessageId === profile.id
                                ? "Creating draft..."
                                : "Approve & Schedule as Draft"
                          }>
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
                    <Typography variant="body2" color="text.secondary">
                      Fill in the LinkedIn profiles above and click "Generate All Messages" to create personalized outreach messages.
                    </Typography>
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
                  boxShadow: 'none',
                  transform: 'none'
                },
                transition: 'all 0.2s ease'
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

      {/* Contact Selection Dialog */}
      <Dialog
        open={contactSelectionOpen}
        onClose={() => setContactSelectionOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '12px',
            maxHeight: '80vh',
            overflow: 'hidden'
          }
        }}
      >
        {/* Black/Grey Gradient Header */}
        <Box sx={{
          background: 'linear-gradient(180deg, #2c2c2c 0%, #1a1a1a 100%)',
          color: 'white',
          p: 3,
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box>
              <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: 400, 
                  fontSize: '1.25rem',
                  color: 'white',
                  fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                  letterSpacing: '-0.01em',
                  mb: 1
                }}
              >
                {isDealPage ? 'Select Deal Contacts for Outreach' : 'Select Broker Contacts for Outreach'}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  fontSize: '0.9rem',
                  color: 'rgba(255, 255, 255, 0.8)',
                  lineHeight: 1.5,
                  fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                  letterSpacing: '-0.01em'
                }}
              >
                Choose up to 10 {isDealPage ? 'deal' : 'broker'} contacts to auto-populate contact names and enable LinkedIn/Email functionality
              </Typography>
            </Box>
            <Button
              onClick={() => setContactSelectionOpen(false)}
              sx={{
                color: 'rgba(255, 255, 255, 0.8)',
                minWidth: 'auto',
                p: 1,
                '&:hover': {
                  color: 'white',
                  bgcolor: 'rgba(255, 255, 255, 0.1)'
                }
              }}
            >
              <CloseIcon />
            </Button>
          </Box>
        </Box>
        <DialogContent sx={{ p: 0 }}>
          <Box sx={{ maxHeight: '50vh', overflowY: 'auto' }}>
            {contacts.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <PersonIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No contacts found
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  No contacts available.
                </Typography>
              </Box>
            ) : (
              <List>
                {contacts
                  .filter(contact => {
                    const originalTags = (contact as any).originalTags || [];
                    if (isDealPage) {
                      return originalTags.includes('deal');
                    } else {
                      return originalTags.includes('broker') || originalTags.includes('brokers');
                    }
                  })
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
                      sx={{
                        py: 1.5,
                        px: 2,
                        '&:hover': {
                          bgcolor: 'action.hover'
                        }
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                        <Box sx={{ mr: 2 }}>
                          <input
                            type="checkbox"
                            checked={selectedContacts.some(c => c.id === contact.id)}
                            onChange={() => {}}
                            style={{ margin: 0 }}
                          />
                        </Box>
                        <Avatar
                          sx={{
                            width: 40,
                            height: 40,
                            bgcolor: '#000000',
                            color: 'white',
                            mr: 2,
                            fontSize: '0.875rem'
                          }}
                        >
                          {contact.first_name?.[0]}{contact.last_name?.[0]}
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                              {contact.name}
                            </Typography>
                            {contact.type && (
                              <Typography variant="caption" sx={{ 
                                fontWeight: 600, 
                                color: contact.type === 'investor' ? '#1E40AF' : 
                                       contact.type === 'broker' ? '#92400E' : ACCENT_BLACK,
                                textTransform: 'uppercase',
                                fontSize: '0.6875rem',
                                bgcolor: contact.type === 'investor' ? '#DBEAFE' : 
                                         contact.type === 'broker' ? '#FEF3C7' : ACCENT_LIGHT,
                                px: 1,
                                py: 0.25,
                                borderRadius: 0.5
                              }}>
                                {contact.type}
                              </Typography>
                            )}
                          </Box>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                            {contact.title && contact.company && (
                              <Typography variant="body2" color="text.secondary">
                                {contact.title} at {contact.company}
                              </Typography>
                            )}
                            <Box sx={{ display: 'flex', gap: 2 }}>
                              {contact.email && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  <EmailIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                                  <Typography variant="caption" color="text.secondary">
                                    {contact.email}
                                  </Typography>
                                </Box>
                              )}
                              {contact.phone && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  <Typography variant="caption" color="text.secondary">
                                    📞 {contact.phone}
                                  </Typography>
                                </Box>
                              )}
                              {contact.linkedin_url && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  <LinkedInIcon sx={{ fontSize: 14, color: '#0077B5' }} />
                                  <Typography variant="caption" color="text.secondary">
                                    LinkedIn
                                  </Typography>
                                </Box>
                              )}
                            </Box>
                          </Box>
                        </Box>
                      </Box>
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ 
          p: 4, 
          bgcolor: '#F8FAFC', 
          borderTop: '1px solid #E2E8F0', 
          justifyContent: 'flex-end', 
          gap: 2 
        }}>
          <Button 
            onClick={() => setContactSelectionOpen(false)} 
            sx={{ 
              borderColor: '#E2E8F0', 
              color: '#64748B', 
              fontWeight: 600, 
              px: 3, 
              py: 1.5, 
              borderRadius: 2, 
              textTransform: 'none',
              '&:hover': {
                borderColor: '#9CA3AF',
                bgcolor: '#F1F5F9'
              }
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => handleContactSelection(selectedContacts)}
            disabled={selectedContacts.length === 0}
            sx={{ 
              background: 'linear-gradient(180deg, #2c2c2c 0%, #1a1a1a 100%)',
              color: 'white !important',
              px: 3, 
              py: 1.5, 
              borderRadius: 2, 
              fontSize: '0.95rem', 
              fontWeight: 600, 
              textTransform: 'none',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
              '&:hover': {
                background: 'linear-gradient(180deg, #1a1a1a 0%, #0a0a0a 100%)',
                color: 'white !important',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
                transform: 'translateY(-1px)'
              },
              '&:disabled': {
                backgroundColor: '#9ca3af',
                color: 'white !important',
                boxShadow: 'none',
                transform: 'none'
              }
            }}
          >
            Use Selected Contacts ({selectedContacts.length})
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LinkedInOutreach;
