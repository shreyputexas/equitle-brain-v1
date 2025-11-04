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
} from '@mui/icons-material';

interface NewInvestorModalProps {
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

const investorTypes = [
  { value: 'venture-capital', label: 'Venture Capital' },
  { value: 'private-equity', label: 'Private Equity' },
  { value: 'angel-investor', label: 'Angel Investor' },
  { value: 'family-office', label: 'Family Office' },
  { value: 'sovereign-wealth', label: 'Sovereign Wealth Fund' },
  { value: 'pension-fund', label: 'Pension Fund' },
  { value: 'hedge-fund', label: 'Hedge Fund' },
  { value: 'corporate-venture', label: 'Corporate Venture Capital' },
  { value: 'other', label: 'Other' }
];

const investmentStages = [
  { value: 'seed', label: 'Seed' },
  { value: 'series-a', label: 'Series A' },
  { value: 'series-b', label: 'Series B' },
  { value: 'series-c', label: 'Series C' },
  { value: 'growth', label: 'Growth' },
  { value: 'late-stage', label: 'Late Stage' },
  { value: 'pre-ipo', label: 'Pre-IPO' },
  { value: 'all-stages', label: 'All Stages' }
];

const checkSizeRanges = [
  { value: 'under-1m', label: 'Under $1M' },
  { value: '1m-5m', label: '$1M - $5M' },
  { value: '5m-10m', label: '$5M - $10M' },
  { value: '10m-25m', label: '$10M - $25M' },
  { value: '25m-50m', label: '$25M - $50M' },
  { value: '50m-100m', label: '$50M - $100M' },
  { value: '100m-plus', label: '$100M+' }
];

const statuses = [
  { value: 'active', label: 'Active' },
  { value: 'paused', label: 'Paused' },
  { value: 'closed', label: 'Closed' },
  { value: 'not-interested', label: 'Not Interested' }
];

export default function NewInvestorModal({ open, onClose, onSuccess }: NewInvestorModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    investmentStage: '',
    checkSize: '',
    status: 'active',
    notes: '',
    website: '',
    location: '',
    aum: '', // Assets Under Management
    firmName: '',
    investorType: 'firm' // 'firm' or 'individual'
  });

  const [selectedContacts, setSelectedContacts] = useState<Contact[]>([]);
  const [availableContacts, setAvailableContacts] = useState<Contact[]>([]);
  const [existingInvestors, setExistingInvestors] = useState<any[]>([]);
  const [selectedExistingInvestor, setSelectedExistingInvestor] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isCreatingNew, setIsCreatingNew] = useState(true);

  // Load contacts and investors when modal opens
  useEffect(() => {
    if (open) {
      loadContacts();
      loadExistingInvestors();
    }
  }, [open]);

  const loadContacts = async () => {
    try {
      const response = await contactsApi.getContacts();
      const contacts = response.data?.contacts || response.data || [];
      setAvailableContacts(contacts);
    } catch (err) {
      console.error('Error loading contacts:', err);
    }
  };

  const loadExistingInvestors = async () => {
    try {
      // Pull investors from contacts with type 'investor'
      const response = await contactsApi.getContacts();
      const contacts = response.data?.contacts || response.data || [];
      const investorContacts = contacts.filter((contact: any) => contact.type === 'investor');
      setExistingInvestors(investorContacts);
    } catch (err) {
      console.error('Error loading existing investors:', err);
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

  const handleSubmit = async () => {
    if (!formData.name || !formData.type) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Create investor data
      const investorData = {
        name: formData.name,
        type: formData.type,
        investment_stage: formData.investmentStage,
        check_size: formData.checkSize,
        status: formData.status,
        notes: formData.notes,
        website: formData.website,
        location: formData.location,
        aum: formData.aum,
        contacts: selectedContacts.map(c => c.id)
      };

      // TODO: Replace with actual investor API call
      console.log('Creating investor:', investorData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        handleClose();
      }, 1500);

    } catch (err: any) {
      setError(err.message || 'Failed to create investor');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      type: '',
      investmentStage: '',
      checkSize: '',
      status: 'active',
      notes: '',
      website: '',
      location: '',
      aum: '',
      firmName: '',
      investorType: 'firm'
    });
    setSelectedContacts([]);
    setSelectedExistingInvestor(null);
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
            Create New Investor
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
          Fill in the investor details below to create a new investment partner
        </Typography>
      </Box>

      {/* Content Area */}
      <Box sx={{ 
        p: 4, 
        bgcolor: '#F8FAFC',
        color: '#1E293B'
      }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            Investor created successfully!
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
              Create New Investor
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
              Select Existing Investor
            </Button>
          </Box>
        </Box>

        {isCreatingNew ? (
          <Grid container spacing={3}>
            {/* Investor Type (Firm/Individual) */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Investor Type *</InputLabel>
                <Select
                  value={formData.investorType}
                  onChange={handleInputChange('investorType')}
                  label="Investor Type *"
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
                label={formData.investorType === 'firm' ? 'Firm Name *' : 'Individual Name *'}
                value={formData.name}
                onChange={handleInputChange('name')}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      {formData.investorType === 'firm' ? <BusinessIcon sx={{ color: '#6b7280' }} /> : <PersonIcon sx={{ color: '#6b7280' }} />}
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            {/* Investment Category */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Investment Category *</InputLabel>
                <Select
                  value={formData.type}
                  onChange={handleInputChange('type')}
                  label="Investment Category *"
                >
                  {investorTypes.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

          {/* Investment Stage */}
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Investment Stage</InputLabel>
              <Select
                value={formData.investmentStage}
                onChange={handleInputChange('investmentStage')}
                label="Investment Stage"
              >
                {investmentStages.map((stage) => (
                  <MenuItem key={stage.value} value={stage.value}>
                    {stage.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Check Size */}
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Check Size Range</InputLabel>
              <Select
                value={formData.checkSize}
                onChange={handleInputChange('checkSize')}
                label="Check Size Range"
              >
                {checkSizeRanges.map((range) => (
                  <MenuItem key={range.value} value={range.value}>
                    {range.label}
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
              placeholder="Optional investor notes or description"
            />
          </Grid>

          {/* Investor Contacts */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
              Investor Contacts
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
                      avatar={<Avatar sx={{ bgcolor: '#1E3A8A' }}>{contact.name.charAt(0)}</Avatar>}
                      sx={{
                        bgcolor: '#f0f4ff',
                        color: '#1E3A8A',
                        border: '1px solid #1E3A8A'
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
                  label="Search and select contacts for this investor"
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
                  <Avatar sx={{ mr: 2, bgcolor: '#1E3A8A', width: 32, height: 32 }}>
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
          /* Existing Investor Selection */
          <Box>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, color: '#1e293b' }}>
              Select Existing Investor
            </Typography>
            <Autocomplete
              options={existingInvestors}
              getOptionLabel={(option) => `${option.name} - ${option.company || 'No Company'}`}
              onChange={(_, value) => setSelectedExistingInvestor(value)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Search existing investors"
                  placeholder="Type to search investors..."
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
                  <Avatar sx={{ mr: 2, bgcolor: '#1E3A8A', width: 32, height: 32 }}>
                    {option.name.charAt(0)}
                  </Avatar>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {option.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {option.title || 'Investor'} • {option.company || 'No Company'}
                    </Typography>
                  </Box>
                </Box>
              )}
            />
            {selectedExistingInvestor && (
              <Box sx={{ mt: 3, p: 2, bgcolor: '#f0f4ff', borderRadius: 2, border: '1px solid #1E3A8A' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#1E3A8A', mb: 1 }}>
                  Selected Investor
                </Typography>
                <Typography variant="body2" sx={{ color: '#1e293b' }}>
                  {selectedExistingInvestor.name} • {selectedExistingInvestor.title || 'Investor'}
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b' }}>
                  {selectedExistingInvestor.company || 'No Company'} • {selectedExistingInvestor.email}
                </Typography>
              </Box>
            )}
          </Box>
        )}
      </Box>

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
          onClick={handleSubmit}
          disabled={loading || (isCreatingNew ? (!formData.name || !formData.type) : !selectedExistingInvestor)}
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
          {loading ? 'Processing...' : (isCreatingNew ? 'Create Investor' : 'Add Selected Investor')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
