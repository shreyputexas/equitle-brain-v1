import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Box,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  InputAdornment,
  Alert,
  CircularProgress,
  IconButton,
  Chip,
  Avatar,
  Divider,
  Card,
  CardContent,
  Tooltip,
  Checkbox,
  Autocomplete
} from '@mui/material';
import contactsApi from '../services/contactsApi';
import brokersApi from '../services/brokersApi';
import EmailSelectionModal from './EmailSelectionModal';
import {
  Close as CloseIcon,
  Business as BusinessIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  AttachMoney as MoneyIcon,
  TrendingUp as TrendingUpIcon,
  Group as GroupIcon,
  Email as EmailIcon,
} from '@mui/icons-material';

interface NewBrokerModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface Contact {
  id: string;
  name: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  title: string;
  company: string;
  type: 'deal' | 'investor' | 'broker';
  isPrimary: boolean;
}

const brokerTypes = [
  { value: 'investment-bank', label: 'Investment Bank' },
  { value: 'merchant-bank', label: 'Merchant Bank' },
  { value: 'boutique-bank', label: 'Boutique Bank' },
  { value: 'commercial-bank', label: 'Commercial Bank' },
  { value: 'real-estate-broker', label: 'Real Estate Broker' },
  { value: 'business-broker', label: 'Business Broker' },
  { value: 'm-a-advisor', label: 'M&A Advisor' },
  { value: 'financial-advisor', label: 'Financial Advisor' },
  { value: 'other', label: 'Other' }
];

const dealSizes = [
  { value: 'under-1m', label: 'Under $1M' },
  { value: '1m-5m', label: '$1M - $5M' },
  { value: '5m-10m', label: '$5M - $10M' },
  { value: '10m-25m', label: '$10M - $25M' },
  { value: '25m-50m', label: '$25M - $50M' },
  { value: '50m-100m', label: '$50M - $100M' },
  { value: '100m-plus', label: '$100M+' }
];

const specializations = [
  { value: 'technology', label: 'Technology' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'manufacturing', label: 'Manufacturing' },
  { value: 'retail', label: 'Retail' },
  { value: 'financial-services', label: 'Financial Services' },
  { value: 'real-estate', label: 'Real Estate' },
  { value: 'energy', label: 'Energy' },
  { value: 'consumer-goods', label: 'Consumer Goods' },
  { value: 'other', label: 'Other' }
];

const statuses = [
  { value: 'active', label: 'Active' },
  { value: 'paused', label: 'Paused' },
  { value: 'closed', label: 'Closed' },
  { value: 'not-interested', label: 'Not Interested' }
];

const brokerStages = [
  { value: 'all', label: 'All' },
  { value: 'response-received', label: 'Response Received' },
  { value: 'closing', label: 'Closing' }
];

export default function NewBrokerModal({ open, onClose, onSuccess }: NewBrokerModalProps) {
  const ACCENT_MAROON = '#800020';
  const ACCENT_MAROON_DARK = '#660018';

  const [formData, setFormData] = useState({
    name: '',
    type: '',
    dealSize: '',
    specialization: '',
    status: 'active',
    notes: '',
    website: '',
    location: '',
    aum: '', // Assets Under Management
    firmName: '',
    brokerType: 'firm' // 'firm' or 'individual'
  });

  const [selectedContacts, setSelectedContacts] = useState<Contact[]>([]);
  const [availableContacts, setAvailableContacts] = useState<Contact[]>([]);
  const [existingBrokers, setExistingBrokers] = useState<any[]>([]);
  const [selectedExistingBroker, setSelectedExistingBroker] = useState<any>(null);
  const [selectedStage, setSelectedStage] = useState<string>('');
  const [emailSelectionModalOpen, setEmailSelectionModalOpen] = useState(false);
  const [selectedEmailThreadIds, setSelectedEmailThreadIds] = useState<string[]>([]);
  const [selectedEmailSubjects, setSelectedEmailSubjects] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isCreatingNew, setIsCreatingNew] = useState(true);

  // Load contacts and brokers when modal opens
  useEffect(() => {
    if (open) {
      loadContacts();
      loadExistingBrokers();
    }
  }, [open]);

  const loadContacts = async () => {
    try {
      const response = await contactsApi.getContacts();
      const contacts = response.contacts || [];
      setAvailableContacts(contacts);
    } catch (err) {
      console.error('Error loading contacts:', err);
    }
  };

  const loadExistingBrokers = async () => {
    try {
      // Pull brokers from contacts with tags 'broker' or 'brokers'
      const response = await contactsApi.getContacts();
      const contacts = response.contacts || [];
      const brokerContacts = contacts.filter((contact: any) => {
        const tags = contact.tags || [];
        return tags.some((tag: string) => {
          const lowerTag = tag.toLowerCase();
          return lowerTag === 'broker' || lowerTag === 'brokers';
        });
      });
      setExistingBrokers(brokerContacts);
    } catch (err) {
      console.error('Error loading existing brokers:', err);
    }
  };

  const handleInputChange = (field: string) => (event: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  const handleContactSelect = (contact: Contact) => {
    if (!selectedContacts.find(c => c.id === contact.id)) {
      setSelectedContacts(prev => [...prev, contact]);
    }
  };

  const handleContactRemove = (contactId: string) => {
    setSelectedContacts(prev => prev.filter(c => c.id !== contactId));
  };

  // Email selection handlers
  const handleOpenEmailSelection = () => {
    setEmailSelectionModalOpen(true);
  };

  const handleEmailSelected = (threadIds: string[], subjects: string[]) => {
    setSelectedEmailThreadIds(threadIds);
    setSelectedEmailSubjects(subjects);
  };

  const handleRemoveEmail = (threadId: string) => {
    setSelectedEmailThreadIds(prev => prev.filter(id => id !== threadId));
    setSelectedEmailSubjects((prev) => {
      const index = selectedEmailThreadIds.indexOf(threadId);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSubmit = async () => {
    console.log('=== handleSubmit called ===');
    console.log('isCreatingNew:', isCreatingNew);
    console.log('selectedExistingBroker:', selectedExistingBroker);
    console.log('selectedStage:', selectedStage);
    console.log('formData:', formData);

    if (isCreatingNew) {
      if (!formData.name || !formData.type) {
        const missingFields = [];
        if (!formData.name) missingFields.push('Name');
        if (!formData.type) missingFields.push('Broker Category');
        setError(`Please fill in required fields: ${missingFields.join(', ')}`);
        return;
      }
    } else {
      if (!selectedExistingBroker) {
        setError('Please select a broker from the dropdown');
        return;
      }
      if (!selectedStage) {
        setError('Please select a pipeline stage for this broker');
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      if (isCreatingNew) {
        // Create new broker record with full details
        console.log('=== Creating new broker ===');
        const brokerData: any = {
          name: formData.name,
          status: (formData.status || 'active') as 'active' | 'paused' | 'closed' | 'not-interested',
          stage: 'all' as 'all' | 'response-received' | 'closing',
          priority: 'medium' as 'low' | 'medium' | 'high',
        };

        // Only add optional fields if they have values
        if (formData.type) brokerData.type = formData.type;
        if (formData.dealSize) brokerData.dealSize = formData.dealSize;
        if (formData.specialization) brokerData.specialization = formData.specialization;
        if (formData.notes) brokerData.notes = formData.notes;
        if (formData.website) brokerData.website = formData.website;
        if (formData.location) brokerData.location = formData.location;
        if (formData.aum) brokerData.aum = formData.aum;
        if (formData.firmName) brokerData.firmName = formData.firmName;
        if (formData.brokerType) brokerData.brokerType = formData.brokerType as 'firm' | 'individual';
        if (selectedContacts.length > 0) brokerData.contactIds = selectedContacts.map(c => c.id);

        console.log('Creating broker with data:', brokerData);
        const createdBroker = await brokersApi.createBroker(brokerData);
        console.log('Broker created successfully:', createdBroker);

        // Associate selected contacts with the broker
        if (selectedContacts.length > 0) {
          console.log(`Associating ${selectedContacts.length} contacts with broker...`);
          for (const contact of selectedContacts) {
            try {
              await brokersApi.associateContact(createdBroker.id, contact.id);
              console.log(`Associated contact ${contact.id} with broker`);
            } catch (contactError: any) {
              console.error(`Error associating contact ${contact.id}:`, contactError);
            }
          }
        }
      } else {
        // Create broker from existing contact
        console.log('=== Creating broker from existing contact ===');
        console.log('Contact ID:', selectedExistingBroker.id);
        console.log('Contact Name:', selectedExistingBroker.name);
        console.log('Selected Stage:', selectedStage);

        const brokerData: any = {
          name: selectedExistingBroker.name,
          status: 'active' as const,
          stage: selectedStage as 'all' | 'response-received' | 'closing',
          priority: 'medium' as const,
          brokerType: 'individual' as const,
          contactIds: [selectedExistingBroker.id]
        };

        // Only add optional fields if they have values
        if (selectedExistingBroker.title) brokerData.type = selectedExistingBroker.title;
        if (selectedExistingBroker.company) brokerData.firmName = selectedExistingBroker.company;
        if (selectedExistingBroker.website) brokerData.website = selectedExistingBroker.website;
        if (selectedExistingBroker.notes) brokerData.notes = selectedExistingBroker.notes;

        console.log('Creating broker with data:', brokerData);
        const createdBroker = await brokersApi.createBroker(brokerData);
        console.log('Broker created successfully:', createdBroker);

        // Associate the contact with the broker
        console.log('Associating contact with broker...');
        await brokersApi.associateContact(createdBroker.id, selectedExistingBroker.id);
        console.log('Contact associated with broker');

        // Associate email threads with broker if any were selected
        if (selectedEmailThreadIds.length > 0) {
          console.log(`Associating ${selectedEmailThreadIds.length} email threads...`);

          // First, create communication records for each email thread
          for (let i = 0; i < selectedEmailThreadIds.length; i++) {
            try {
              console.log(`Creating communication for email thread ${i + 1}/${selectedEmailThreadIds.length}...`);

              // Associate the email thread with the contact first (creates communication record)
              const result = await contactsApi.associateEmailThread(selectedExistingBroker.id, {
                threadId: selectedEmailThreadIds[i],
                subject: selectedEmailSubjects[i] || '(No Subject)'
              });
              console.log(`Email thread ${selectedEmailThreadIds[i]} associated with contact, communicationId:`, result.communicationId);

              // Now associate the communication with the broker
              if (result.communicationId) {
                console.log(`Associating communication ${result.communicationId} with broker ${createdBroker.id}...`);
                await brokersApi.associateCommunication(createdBroker.id, result.communicationId);
                console.log(`Communication ${result.communicationId} successfully linked to broker`);
              }
            } catch (emailError: any) {
              console.error(`Error associating email thread ${selectedEmailThreadIds[i]}:`, emailError);
              console.error('Email error details:', emailError.response?.data || emailError.message);
              // Don't fail the entire operation if email association fails
            }
          }
        }

        console.log('=== Broker creation complete ===');
      }

      setSuccess(true);
      // Immediately trigger the parent callback to reload and close
      onSuccess();

    } catch (err: any) {
      console.error('=== Error in handleSubmit ===');
      console.error('Error object:', err);
      console.error('Error message:', err.message);
      console.error('Error response:', err.response);
      console.error('Error response data:', err.response?.data);

      // Show detailed validation errors if available
      let errorMessage = err.response?.data?.message || err.message || 'Failed to create broker';
      if (err.response?.data?.details && Array.isArray(err.response.data.details)) {
        errorMessage = `${errorMessage}: ${err.response.data.details.join(', ')}`;
      }
      console.error('Final error message:', errorMessage);
      setError(errorMessage);
      setLoading(false);
    }
    console.log('=== handleSubmit finished ===');
  };

  const handleClose = () => {
    setFormData({
      name: '',
      type: '',
      dealSize: '',
      specialization: '',
      status: 'active',
      notes: '',
      website: '',
      location: '',
      aum: '',
      firmName: '',
      brokerType: 'firm'
    });
    setSelectedContacts([]);
    setSelectedExistingBroker(null);
    setSelectedStage('');
    setSelectedEmailThreadIds([]);
    setSelectedEmailSubjects([]);
    setIsCreatingNew(true);
    setError(null);
    setSuccess(false);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      disableEscapeKeyDown={false}
      PaperProps={{
        sx: {
          borderRadius: 3,
          minHeight: '50vh',
          border: '1px solid #e2e8f0',
          overflow: 'hidden'
        }
      }}
    >
      {/* Gradient Header */}
      <Box sx={{
        background: 'linear-gradient(180deg, #2c2c2c 0%, #1a1a1a 100%)',
        color: 'white',
        py: 3,
        px: 4,
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="h6" sx={{ 
              fontWeight: 400, 
              fontSize: '1.25rem', 
              color: 'white',
              fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              letterSpacing: '-0.01em'
            }}>
            Create New Broker
          </Typography>
        </Box>
        <IconButton onClick={handleClose} sx={{ color: 'white' }} disabled={loading}>
          <CloseIcon />
        </IconButton>
        </Box>
        <Typography variant="body2" sx={{ 
          fontSize: '0.9rem', 
          color: 'rgba(255, 255, 255, 0.8)',
          lineHeight: 1.5,
          fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          letterSpacing: '-0.01em'
        }}>
          Fill in the broker details below to create a new investment partner
        </Typography>
      </Box>

      {/* Content Area */}
      <DialogContent sx={{ 
        p: 4, 
        bgcolor: '#F8FAFC',
        color: '#1E293B',
        overflowY: 'auto',
        maxHeight: 'calc(100vh - 280px)'
      }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            Broker created successfully!
          </Alert>
        )}

        {/* OR Section */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Button
              variant={isCreatingNew ? 'contained' : 'outlined'}
              onClick={() => setIsCreatingNew(true)}
              sx={{
                mr: 2,
                background: isCreatingNew ? 'linear-gradient(180deg, #2c2c2c 0%, #1a1a1a 100%)' : 'transparent',
                color: isCreatingNew ? 'white' : '#2c2c2c',
                border: '1px solid #2c2c2c',
                '&:hover': {
                  background: isCreatingNew ? 'linear-gradient(180deg, #1a1a1a 0%, #0a0a0a 100%)' : 'rgba(44, 44, 44, 0.1)'
                }
              }}
            >
              Create New Broker
            </Button>
            <Typography variant="body2" sx={{ mx: 2, color: '#6b7280', fontWeight: 500 }}>
              OR
            </Typography>
            <Button
              variant={!isCreatingNew ? 'contained' : 'outlined'}
              onClick={() => setIsCreatingNew(false)}
              sx={{
                background: !isCreatingNew ? 'linear-gradient(180deg, #2c2c2c 0%, #1a1a1a 100%)' : 'transparent',
                color: !isCreatingNew ? 'white' : '#2c2c2c',
                border: '1px solid #2c2c2c',
                '&:hover': {
                  background: !isCreatingNew ? 'linear-gradient(180deg, #1a1a1a 0%, #0a0a0a 100%)' : 'rgba(44, 44, 44, 0.1)'
                }
              }}
            >
              Select Existing Broker
            </Button>
          </Box>
        </Box>

        {isCreatingNew ? (
          <Grid container spacing={3}>
            {/* Broker Type (Firm/Individual) */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Broker Type *</InputLabel>
                <Select
                  value={formData.brokerType}
                  onChange={handleInputChange('brokerType')}
                  label="Broker Type *"
                >
                  <MenuItem value="firm">Firm</MenuItem>
                  <MenuItem value="individual">Individual</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Firm Name / Individual Name */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label={formData.brokerType === 'firm' ? 'Firm Name *' : 'Individual Name *'}
                value={formData.name}
                onChange={handleInputChange('name')}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      {formData.brokerType === 'firm' ? <BusinessIcon sx={{ color: '#6b7280' }} /> : <PersonIcon sx={{ color: '#6b7280' }} />}
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            {/* Broker Category */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Broker Category *</InputLabel>
                <Select
                  value={formData.type}
                  onChange={handleInputChange('type')}
                  label="Broker Category *"
                >
                  {brokerTypes.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Deal Size */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Deal Size Range</InputLabel>
                <Select
                  value={formData.dealSize}
                  onChange={handleInputChange('dealSize')}
                  label="Deal Size Range"
                >
                  {dealSizes.map((size) => (
                    <MenuItem key={size.value} value={size.value}>
                      {size.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Specialization */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Specialization</InputLabel>
                <Select
                  value={formData.specialization}
                  onChange={handleInputChange('specialization')}
                  label="Specialization"
                >
                  {specializations.map((spec) => (
                    <MenuItem key={spec.value} value={spec.value}>
                      {spec.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Website */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Website"
                value={formData.website}
                onChange={handleInputChange('website')}
                placeholder="https://example.com"
              />
            </Grid>

            {/* Location */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Location"
                value={formData.location}
                onChange={handleInputChange('location')}
                placeholder="City, State/Country"
              />
            </Grid>

            {/* AUM */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Assets Under Management"
                value={formData.aum}
                onChange={handleInputChange('aum')}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <MoneyIcon sx={{ color: '#6b7280' }} />
                    </InputAdornment>
                  ),
                }}
                placeholder="e.g., $500M"
              />
            </Grid>

            {/* Status */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={formData.status}
                  onChange={handleInputChange('status')}
                  label="Status"
                >
                  {statuses.map((status) => (
                    <MenuItem key={status.value} value={status.value}>
                      {status.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Notes */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Notes"
                value={formData.notes}
                onChange={handleInputChange('notes')}
                placeholder="Optional broker notes or description"
              />
            </Grid>

            {/* Broker Contacts */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                Broker Contacts
              </Typography>
              
              {/* Selected Contacts */}
              {selectedContacts.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ mb: 1, color: '#64748b' }}>
                    Selected Contacts ({selectedContacts.length})
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {selectedContacts.map((contact) => (
                      <Chip
                        key={contact.id}
                        label={`${contact.name} (${contact.company})`}
                        onDelete={() => handleContactRemove(contact.id)}
                        avatar={<Avatar sx={{ bgcolor: ACCENT_MAROON }}>{contact.name.charAt(0)}</Avatar>}
                        sx={{
                          bgcolor: '#fdf2f8',
                          color: ACCENT_MAROON,
                          border: `1px solid ${ACCENT_MAROON}`
                        }}
                      />
                    ))}
                  </Box>
                </Box>
              )}

              {/* Contact Search */}
              <Autocomplete
                options={availableContacts.filter(contact => 
                  !selectedContacts.find(c => c.id === contact.id)
                )}
                getOptionLabel={(option) => `${option.name} - ${option.company}`}
                onChange={(_, value) => value && handleContactSelect(value)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Search and select contacts for this broker"
                    placeholder="Type to search contacts..."
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <InputAdornment position="start">
                          <PersonIcon sx={{ color: '#6b7280' }} />
                        </InputAdornment>
                      ),
                    }}
                  />
                )}
                renderOption={(props, option) => (
                  <Box component="li" {...props}>
                    <Avatar sx={{ mr: 2, bgcolor: ACCENT_MAROON, width: 32, height: 32 }}>
                      {option.name.charAt(0)}
                    </Avatar>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {option.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {option.title} at {option.company}
                      </Typography>
                    </Box>
                  </Box>
                )}
              />
            </Grid>
          </Grid>
        ) : (
          /* Existing Broker Selection */
          <Box>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, color: '#1e293b' }}>
              Select Existing Broker
            </Typography>
            <Autocomplete
              options={existingBrokers}
              getOptionLabel={(option) => `${option.name} - ${option.company || 'No Company'}`}
              onChange={(_, value) => {
                setSelectedExistingBroker(value);
                setSelectedStage('');
              }}
              value={selectedExistingBroker}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Search existing brokers"
                  placeholder="Type to search brokers..."
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                      <InputAdornment position="start">
                        <BusinessIcon sx={{ color: '#6b7280' }} />
                      </InputAdornment>
                    ),
                  }}
                />
              )}
              renderOption={(props, option) => (
                <Box component="li" {...props}>
                  <Avatar sx={{ mr: 2, bgcolor: ACCENT_MAROON, width: 32, height: 32 }}>
                    {option.name.charAt(0)}
                  </Avatar>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {option.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {option.title || 'Broker'} • {option.company || 'No Company'}
                    </Typography>
                  </Box>
                </Box>
              )}
            />
            {selectedExistingBroker && (
              <>
                <Box sx={{ mt: 3, p: 2, bgcolor: '#fdf2f8', borderRadius: 2, border: `1px solid ${ACCENT_MAROON}` }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: ACCENT_MAROON, mb: 1 }}>
                    Selected Broker
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#1e293b' }}>
                    {selectedExistingBroker.name} • {selectedExistingBroker.title || 'Broker'}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748b' }}>
                    {selectedExistingBroker.company || 'No Company'} • {selectedExistingBroker.email}
                  </Typography>
                </Box>
                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#1e293b', mb: 2 }}>
                    Assign to Pipeline Stage
                  </Typography>
                  <FormControl fullWidth required>
                    <InputLabel>Select Stage *</InputLabel>
                    <Select
                      value={selectedStage}
                      onChange={(e) => setSelectedStage(e.target.value)}
                      label="Select Stage *"
                    >
                      {brokerStages.map((stage) => (
                        <MenuItem key={stage.value} value={stage.value}>
                          {stage.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <Typography variant="caption" sx={{ color: '#64748b', mt: 1, display: 'block' }}>
                    Choose which stage to assign this broker to in your pipeline
                  </Typography>
                </Box>
                <Box sx={{ mt: 3 }}>
                  <Divider sx={{ mb: 3 }} />
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" sx={{
                      fontWeight: 600,
                      color: '#1e293b',
                      mb: 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1
                    }}>
                      <EmailIcon sx={{ fontSize: 20 }} />
                      Email Association
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Associate an email thread with this broker to track communication
                    </Typography>

                    {selectedEmailThreadIds.length > 0 ? (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {selectedEmailThreadIds.map((threadId, index) => (
                          <Card key={threadId} sx={{
                            bgcolor: '#F0F9FF',
                            border: '1px solid #BAE6FD',
                            borderRadius: 2
                          }}>
                            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#0C4A6E', mb: 0.5 }}>
                                    Email Thread {selectedEmailThreadIds.length > 1 ? `${index + 1}` : ''}
                                  </Typography>
                                  <Typography variant="body2" sx={{ color: '#075985' }}>
                                    {selectedEmailSubjects[index] || 'Email thread selected'}
                                  </Typography>
                                </Box>
                                <IconButton
                                  size="small"
                                  onClick={() => handleRemoveEmail(threadId)}
                                  sx={{ color: '#64748B' }}
                                >
                                  <CloseIcon fontSize="small" />
                                </IconButton>
                              </Box>
                            </CardContent>
                          </Card>
                        ))}
                      </Box>
                    ) : (
                      <Button
                        variant="outlined"
                        onClick={handleOpenEmailSelection}
                        disabled={loading}
                        startIcon={<EmailIcon />}
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
                            backgroundColor: '#F1F5F9',
                          }
                        }}
                      >
                        Select Email Thread
                      </Button>
                    )}
                  </Box>
                </Box>
              </>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ 
        p: 4, 
        pt: 2, 
        bgcolor: '#F8FAFC',
        borderTop: '1px solid #E2E8F0',
        justifyContent: 'flex-end',
        gap: 2
      }}>
        <Button 
          onClick={handleClose}
          disabled={loading}
          sx={{ 
            color: '#6b7280',
            fontWeight: 500,
            px: 3,
            py: 1.5,
            borderRadius: 2,
            textTransform: 'none',
            '&:hover': {
              backgroundColor: '#F1F5F9'
            }
          }}
        >
          Cancel
        </Button>
        <Button
          type="button"
          onClick={(e) => {
            console.log('=== Button clicked ===');
            console.log('Button disabled?', loading || (isCreatingNew ? (!formData.name || !formData.type) : (!selectedExistingBroker || !selectedStage)));
            e.preventDefault();
            e.stopPropagation();
            handleSubmit();
          }}
          disabled={loading || (isCreatingNew ? (!formData.name || !formData.type) : (!selectedExistingBroker || !selectedStage))}
          variant="contained"
          startIcon={loading ? <CircularProgress size={20} /> : <GroupIcon />}
          sx={{
            background: 'linear-gradient(180deg, #2c2c2c 0%, #1a1a1a 100%)',
            color: 'white',
            px: 3,
            py: 1.5,
            borderRadius: 2,
            fontWeight: 600,
            textTransform: 'none',
            fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            '&:hover': {
              background: 'linear-gradient(180deg, #1a1a1a 0%, #0a0a0a 100%)',
            },
            '&:disabled': {
              backgroundColor: '#9ca3af',
              color: 'white'
            }
          }}
        >
          {loading ? 'Processing...' : (isCreatingNew ? 'Create Broker' : 'Confirm & Add Broker')}
        </Button>
      </DialogActions>

      {/* Email Selection Modal */}
      <EmailSelectionModal
        open={emailSelectionModalOpen}
        onClose={() => setEmailSelectionModalOpen(false)}
        onSelect={handleEmailSelected}
        selectedThreadIds={selectedEmailThreadIds}
        multiSelect={true}
      />
    </Dialog>
  );
}
