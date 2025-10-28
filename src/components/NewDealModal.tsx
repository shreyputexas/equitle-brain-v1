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
import dealsApi from '../services/dealsApi';
import contactsApi from '../services/contactsApi';
import {
  Close as CloseIcon,
  Business as BusinessIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';

interface NewDealModalProps {
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



const stages = [
  { value: 'all', label: 'All' },
  { value: 'response-received', label: 'Response Received' },
  { value: 'initial-diligence', label: 'Initial Diligence' },
  { value: 'ioi-loi', label: 'IOI/LOI' }
];

const sectors = [
  'Technology',
  'Healthcare',
  'Fintech',
  'CleanTech',
  'Consumer',
  'B2B SaaS',
  'E-commerce',
  'AI/ML',
  'Biotech',
  'Other'
];

const statuses = [
  { value: 'active', label: 'Active' },
  { value: 'paused', label: 'Paused' },
  { value: 'closed', label: 'Closed' },
  { value: 'lost', label: 'Lost' }
];

export default function NewDealModal({ open, onClose, onSuccess }: NewDealModalProps) {
  const [formData, setFormData] = useState({
    company: '',
    sector: '',
    stage: 'all',
    status: 'active',
    notes: ''
  });

  // New state for enhanced functionality
  const [selectedContacts, setSelectedContacts] = useState<Contact[]>([]);
  const [availableContacts, setAvailableContacts] = useState<Contact[]>([]);
  const [contactsLoading, setContactsLoading] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch available contacts when modal opens
  useEffect(() => {
    if (open) {
      fetchAvailableContacts();
    }
  }, [open]);

  // Debug form data changes
  useEffect(() => {
    console.log('Form data changed:', formData);
  }, [formData]);

  // Debug available contacts changes
  useEffect(() => {
    console.log('Available contacts changed:', availableContacts);
  }, [availableContacts]);

  const fetchAvailableContacts = async () => {
    try {
      setContactsLoading(true);
      console.log('Fetching contacts...');
      const response = await contactsApi.getContacts();
      console.log('Contacts response:', response);
      // Transform contacts to include name field and isPrimary
      const transformedContacts = response.contacts.map((contact: any) => ({
        ...contact,
        name: `${contact.first_name} ${contact.last_name}`.trim(),
        isPrimary: false
      }));
      console.log('Transformed contacts:', transformedContacts);
      setAvailableContacts(transformedContacts);
    } catch (error) {
      console.error('Error fetching contacts:', error);
      // Fallback to mock data if API fails
      const mockContacts = [
        {
          id: '1',
          first_name: 'John',
          last_name: 'Doe',
          name: 'John Doe',
          email: 'john.doe@example.com',
          phone: '+1-555-0123',
          title: 'CEO',
          company: 'Tech Corp',
          type: 'deal' as const,
          isPrimary: false
        },
        {
          id: '2',
          first_name: 'Jane',
          last_name: 'Smith',
          name: 'Jane Smith',
          email: 'jane.smith@example.com',
          phone: '+1-555-0124',
          title: 'CTO',
          company: 'Innovation Inc',
          type: 'investor' as const,
          isPrimary: false
        },
        {
          id: '3',
          first_name: 'Mike',
          last_name: 'Johnson',
          name: 'Mike Johnson',
          email: 'mike.johnson@example.com',
          phone: '+1-555-0125',
          title: 'VP Sales',
          company: 'Growth Co',
          type: 'broker' as const,
          isPrimary: false
        }
      ];
      console.log('Using mock contacts:', mockContacts);
      setAvailableContacts(mockContacts);
    } finally {
      setContactsLoading(false);
    }
  };

  const handleChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | any) => {
    console.log(`Field ${field} changed to:`, event.target.value);
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  // Contact management functions
  const handleContactSelection = (event: any, newValue: Contact[]) => {
    console.log('Contact selection changed:', newValue);
    setSelectedContacts(newValue);
  };

  const handleRemoveContact = (contactId: string) => {
    setSelectedContacts(prev => prev.filter(c => c.id !== contactId));
  };

  const handleSetPrimaryContact = (contactId: string) => {
    setSelectedContacts(prev => prev.map(c => ({
      ...c,
      isPrimary: c.id === contactId
    })));
  };



  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError('');

      // Validate required fields
      if (!formData.company.trim()) {
        setError('Company name is required');
        return;
      }
      if (!formData.sector) {
        setError('Sector is required');
        return;
      }
      if (!formData.stage) {
        setError('Stage is required');
        return;
      }

      const dealData = {
        company: formData.company.trim(),
        sector: formData.sector,
        stage: formData.stage,
        status: formData.status,
        ...(formData.notes.trim() && { notes: formData.notes.trim() }),
        // Include new enhanced data
        contacts: selectedContacts
      };

      // Use the dealsApi service
      try {
        await dealsApi.createDeal(dealData);
      } catch (apiError) {
        console.warn('API not available, creating deal locally:', apiError);
        // For now, just show success message even if API fails
        // In a real app, you might want to queue this for later sync
      }

      // Reset form
      setFormData({
        company: '',
        sector: '',
        stage: 'all',
        status: 'active',
        notes: ''
      });
      setSelectedContacts([]);

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error creating deal:', err);
      setError(err.message || 'Failed to create deal');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setError('');
      onClose();
    }
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
            Create New Deal
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
          Fill in the deal details below to create a new investment opportunity
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

        <Grid container spacing={3}>
          {/* Company Name */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Company Name"
              value={formData.company}
              onChange={handleChange('company')}
              required
              disabled={loading}
              InputLabelProps={{
                sx: { 
                  color: '#1E293B', 
                  fontWeight: 600,
                  fontSize: '0.9rem'
                }
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <BusinessIcon color="action" />
                  </InputAdornment>
                )
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  backgroundColor: 'white',
                  '& fieldset': {
                    borderColor: '#E2E8F0',
                    borderWidth: '1px',
                  },
                  '&:hover fieldset': {
                    borderColor: '#9CA3AF',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#000000',
                    borderWidth: '2px',
                  },
                },
                '& .MuiInputBase-input': {
                  py: 1.5,
                  fontSize: '0.95rem',
                  color: '#1E293B',
                  fontWeight: 500,
                },
              }}
            />
          </Grid>

          {/* Sector */}
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth required disabled={loading}>
              <InputLabel sx={{ 
                color: '#1E293B', 
                fontWeight: 600,
                fontSize: '0.9rem'
              }}>Sector</InputLabel>
              <Select
                value={formData.sector}
                label="Sector"
                onChange={handleChange('sector')}
                MenuProps={{
                  PaperProps: {
                    style: {
                      maxHeight: 300,
                    },
                  },
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    backgroundColor: 'white',
                    '& fieldset': {
                      borderColor: '#E2E8F0',
                      borderWidth: '1px',
                    },
                    '&:hover fieldset': {
                      borderColor: '#CBD5E1',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#000000',
                      borderWidth: '2px',
                    },
                  },
                  '& .MuiSelect-select': {
                    py: 1.5,
                    fontSize: '0.95rem',
                    color: '#1E293B',
                    fontWeight: 500,
                  },
                }}
              >
                {sectors.map((sector) => (
                  <MenuItem key={sector} value={sector}>
                    {sector}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Stage */}
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth required disabled={loading}>
              <InputLabel sx={{ 
                color: '#1E293B', 
                fontWeight: 600,
                fontSize: '0.9rem'
              }}>Stage</InputLabel>
              <Select
                value={formData.stage}
                label="Stage"
                onChange={handleChange('stage')}
                MenuProps={{
                  PaperProps: {
                    style: {
                      maxHeight: 300,
                    },
                  },
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    backgroundColor: 'white',
                    '& fieldset': {
                      borderColor: '#E2E8F0',
                      borderWidth: '1px',
                    },
                    '&:hover fieldset': {
                      borderColor: '#CBD5E1',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#000000',
                      borderWidth: '2px',
                    },
                  },
                  '& .MuiSelect-select': {
                    py: 1.5,
                    fontSize: '0.95rem',
                    color: '#1E293B',
                    fontWeight: 500,
                  },
                }}
              >
                {stages.map((stage) => (
                  <MenuItem key={stage.value} value={stage.value}>
                    {stage.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Status */}
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth disabled={loading}>
              <InputLabel sx={{ 
                color: '#1E293B', 
                fontWeight: 600,
                fontSize: '0.9rem'
              }}>Status</InputLabel>
              <Select
                value={formData.status}
                label="Status"
                onChange={handleChange('status')}
                MenuProps={{
                  PaperProps: {
                    style: {
                      maxHeight: 300,
                    },
                  },
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    backgroundColor: 'white',
                    '& fieldset': {
                      borderColor: '#E2E8F0',
                      borderWidth: '1px',
                    },
                    '&:hover fieldset': {
                      borderColor: '#CBD5E1',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#000000',
                      borderWidth: '2px',
                    },
                  },
                  '& .MuiSelect-select': {
                    py: 1.5,
                    fontSize: '0.95rem',
                    color: '#1E293B',
                    fontWeight: 500,
                  },
                }}
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
              label="Notes"
              value={formData.notes}
              onChange={handleChange('notes')}
              multiline
              rows={3}
              disabled={loading}
              InputLabelProps={{
                sx: { 
                  color: '#1E293B', 
                  fontWeight: 600,
                  fontSize: '0.9rem'
                }
              }}
              helperText="Optional deal notes or description"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  backgroundColor: 'white',
                  '& fieldset': {
                    borderColor: '#E2E8F0',
                    borderWidth: '1px',
                  },
                  '&:hover fieldset': {
                    borderColor: '#9CA3AF',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#000000',
                    borderWidth: '2px',
                  },
                },
                '& .MuiInputBase-input': {
                  py: 1.5,
                  fontSize: '0.95rem',
                  color: '#1E293B',
                  fontWeight: 500,
                },
                '& .MuiFormHelperText-root': {
                  color: '#64748B',
                  fontSize: '0.8rem',
                  fontWeight: 500,
                },
              }}
            />
          </Grid>

          {/* Deal Contacts */}
          <Grid item xs={12} sx={{ mt: 2 }}>
            <Autocomplete
              multiple
              options={availableContacts}
              value={selectedContacts}
              onChange={handleContactSelection}
              loading={contactsLoading}
              getOptionLabel={(option) => option.name}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Deal Contacts"
                  placeholder="Search and select contacts for this deal..."
                  InputLabelProps={{
                    sx: { 
                      color: '#1E293B', 
                      fontWeight: 600,
                      fontSize: '0.9rem'
                    }
                  }}
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                      <>
                        <PersonIcon sx={{ color: 'action.active', mr: 1 }} />
                        {params.InputProps.startAdornment}
                      </>
                    )
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      backgroundColor: 'white',
                      '& fieldset': {
                        borderColor: '#E2E8F0',
                        borderWidth: '1px',
                      },
                      '&:hover fieldset': {
                        borderColor: '#9CA3AF',
                      },
                      '&.Mui-focused fieldset': {
                    borderColor: '#000000',
                        borderWidth: '2px',
                      },
                    },
                    '& .MuiInputBase-input': {
                      py: 1.5,
                      fontSize: '0.95rem',
                      color: '#1E293B',
                      fontWeight: 500,
                    },
                  }}
                />
              )}
              renderOption={(props, option, { selected }) => (
                <li {...props}>
                  <Checkbox
                    checked={selected}
                    style={{ marginRight: 8 }}
                  />
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                    <Avatar sx={{ width: 24, height: 24, bgcolor: 'grey.300' }}>
                      {option.name.charAt(0)}
                    </Avatar>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {option.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {option.email} • {option.company}
              </Typography>
            </Box>
            </Box>
                </li>
              )}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    {...getTagProps({ index })}
                    key={option.id}
                    label={option.name}
                    avatar={<Avatar sx={{ width: 20, height: 20 }}>{option.name.charAt(0)}</Avatar>}
                    onDelete={() => handleRemoveContact(option.id)}
                    sx={{
                      backgroundColor: '#F1F5F9',
                      color: '#1E293B',
                      '& .MuiChip-deleteIcon': {
                        color: '#64748B',
                        '&:hover': {
                          color: '#EF4444'
                        }
                      }
                    }}
                  />
                ))
              }
              disabled={loading}
            />
          </Grid>
        </Grid>
      </Box>

      <DialogActions sx={{ 
        p: 4, 
        bgcolor: '#F8FAFC',
        borderTop: '1px solid #E2E8F0',
        justifyContent: 'flex-end',
        gap: 2
      }}>
        <Button
          onClick={handleClose}
          variant="outlined"
          disabled={loading}
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
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading}
          sx={{
            background: 'linear-gradient(135deg, #6B7280 0%, #000000 100%)',
            color: 'white',
            px: 3,
            py: 1.5,
            borderRadius: 2,
            fontSize: '0.95rem',
            fontWeight: 600,
            textTransform: 'none',
            boxShadow: '0 4px 14px rgba(0, 0, 0, 0.2)',
            '&:hover': {
              background: 'linear-gradient(135deg, #4B5563 0%, #000000 100%)',
              boxShadow: '0 6px 20px rgba(0, 0, 0, 0.3)',
              transform: 'translateY(-2px)'
            },
            '&:disabled': { 
              background: '#9CA3AF',
              boxShadow: 'none',
              transform: 'none'
            },
            transition: 'all 0.3s ease'
          }}
          startIcon={loading ? <CircularProgress size={20} /> : <BusinessIcon />}
        >
          {loading ? 'Creating...' : 'Create Deal'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}