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
  Divider,
  Card,
  CardContent,
  Autocomplete,
  Chip
} from '@mui/material';
import {
  Close as CloseIcon,
  Business as BusinessIcon,
  Edit as EditIcon,
  Email as EmailIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { Broker } from '../services/brokersApi';
import { getApiUrl } from '../config/api';
import EmailSelectionModal from './EmailSelectionModal';
import brokersApi from '../services/brokersApi';
import contactsApi from '../services/contactsApi';

interface EditBrokerModalProps {
  open: boolean;
  broker: Broker | null;
  onClose: () => void;
  onSuccess: () => void;
}

const brokerTypes = [
  'M&A Advisor',
  'Business Broker',
  'Investment Banker',
  'Transaction Advisor',
  'Other'
];

const statuses: Array<'active' | 'paused' | 'closed' | 'not-interested'> = [
  'active',
  'paused',
  'closed',
  'not-interested'
];

const stages: Array<'all' | 'response-received' | 'closing'> = [
  'all',
  'response-received',
  'closing'
];

const priorities = ['low', 'medium', 'high'];

export default function EditBrokerModal({ open, broker, onClose, onSuccess }: EditBrokerModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    firmName: '',
    type: '',
    dealSize: '',
    specialization: '',
    status: 'active' as 'active' | 'paused' | 'closed' | 'not-interested',
    stage: 'all' as 'all' | 'response-received' | 'closing',
    priority: 'medium',
    nextStep: '',
    notes: '',
    website: '',
    location: '',
    aum: ''
  });

  // Contact and email association state
  const [emailSelectionModalOpen, setEmailSelectionModalOpen] = useState(false);
  const [selectedEmailThreadIds, setSelectedEmailThreadIds] = useState<string[]>([]);
  const [selectedEmailSubjects, setSelectedEmailSubjects] = useState<string[]>([]);
  const [originalEmailThreadIds, setOriginalEmailThreadIds] = useState<string[]>([]); // Track original email threads for comparison
  const [allContacts, setAllContacts] = useState<any[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<any[]>([]);
  const [originalContacts, setOriginalContacts] = useState<any[]>([]); // Track original contacts for comparison
  const [loadingContacts, setLoadingContacts] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch all contacts for selection
  useEffect(() => {
    if (open) {
      fetchAllContacts();
    }
  }, [open]);

  // Update form data when broker prop changes
  useEffect(() => {
    if (broker) {
      setFormData({
        name: broker.name || '',
        firmName: broker.firmName || '',
        type: broker.type || '',
        dealSize: broker.dealSize || '',
        specialization: broker.specialization || '',
        status: broker.status || 'active',
        stage: broker.stage || 'all',
        priority: broker.priority || 'medium',
        nextStep: broker.nextStep || '',
        notes: broker.notes || '',
        website: broker.website || '',
        location: broker.location || '',
        aum: broker.aum || ''
      });

      // Set selected contacts if broker has people
      if (broker.people && broker.people.length > 0) {
        setSelectedContacts(broker.people);
        setOriginalContacts(broker.people); // Save original contacts for comparison
      } else {
        setSelectedContacts([]);
        setOriginalContacts([]);
      }

      // Pre-populate email threads if broker has communications
      if (broker.communications && broker.communications.length > 0) {
        const threadIds: string[] = [];
        const subjects: string[] = [];

        broker.communications.forEach((comm: any) => {
          if (comm.threadId || comm.id) {
            threadIds.push(comm.threadId || comm.id);
            subjects.push(comm.subject || '(No Subject)');
          }
        });

        setSelectedEmailThreadIds(threadIds);
        setSelectedEmailSubjects(subjects);
        setOriginalEmailThreadIds(threadIds); // Save original email threads for comparison
      } else {
        setSelectedEmailThreadIds([]);
        setSelectedEmailSubjects([]);
        setOriginalEmailThreadIds([]);
      }
    }
  }, [broker]);

  const fetchAllContacts = async () => {
    try {
      setLoadingContacts(true);
      const response = await contactsApi.getContacts();
      // Filter to only show contacts tagged as "broker"
      const brokerContacts = (response.contacts || []).filter((contact: any) =>
        contact.tags && Array.isArray(contact.tags) && contact.tags.includes('broker')
      );
      setAllContacts(brokerContacts);
    } catch (err) {
      console.error('Error fetching contacts:', err);
    } finally {
      setLoadingContacts(false);
    }
  };

  const handleChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | any) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  // Email selection handlers
  const handleOpenEmailSelection = () => {
    setEmailSelectionModalOpen(true);
  };

  const handleEmailSelected = (threadIds: string[], subjects: string[]) => {
    setSelectedEmailThreadIds(threadIds);
    setSelectedEmailSubjects(subjects);
  };

  const handleRemoveEmail = (threadId?: string) => {
    if (threadId) {
      setSelectedEmailThreadIds(prev => prev.filter(id => id !== threadId));
      setSelectedEmailSubjects((prev) => {
        const index = selectedEmailThreadIds.indexOf(threadId);
        return prev.filter((_, i) => i !== index);
      });
    } else {
      setSelectedEmailThreadIds([]);
      setSelectedEmailSubjects([]);
    }
  };

  const handleSubmit = async () => {
    if (!broker) return;

    try {
      setLoading(true);
      setError('');

      // Validate required fields
      if (!formData.name.trim()) {
        setError('Broker name is required');
        setLoading(false);
        return;
      }

      console.log('🔄 Starting broker update for:', broker.id);
      console.log('📝 Form data:', formData);

      const brokerData = {
        name: formData.name.trim(),
        firmName: formData.firmName.trim(),
        type: formData.type,
        dealSize: formData.dealSize.trim(),
        specialization: formData.specialization.trim(),
        status: formData.status,
        stage: formData.stage,
        priority: formData.priority as 'low' | 'medium' | 'high',
        nextStep: formData.nextStep.trim(),
        notes: formData.notes.trim(),
        website: formData.website.trim(),
        location: formData.location.trim(),
        aum: formData.aum.trim()
      };

      console.log('📤 Sending broker update request:', brokerData);

      // Update broker
      const updatedBroker = await brokersApi.updateBroker(broker.id, brokerData);
      console.log('✅ Broker updated successfully:', updatedBroker);

      // Handle contact associations
      // First, find contacts that were removed (in original but not in selected)
      const removedContacts = originalContacts.filter(
        (origContact) => !selectedContacts.some((selContact) => selContact.id === origContact.id)
      );

      // Remove brokerId from contacts that are no longer associated
      if (removedContacts.length > 0) {
        console.log(`🔓 Removing ${removedContacts.length} contacts from broker`);
        for (const contact of removedContacts) {
          try {
            // Remove brokerId from contact metadata
            const updatedMetadata = { ...contact.metadata };
            delete updatedMetadata.brokerId;

            await contactsApi.updateContact(contact.id, {
              metadata: updatedMetadata
            });
            console.log(`✅ Removed contact ${contact.id} (${contact.name}) from broker ${broker.id}`);
          } catch (contactError: any) {
            console.error(`❌ Error removing contact ${contact.id}:`, contactError);
            // Continue with other contacts even if one fails
          }
        }
      }

      // Then, add brokerId to all currently selected contacts
      if (selectedContacts.length > 0) {
        console.log(`🔗 Associating ${selectedContacts.length} contacts with broker`);
        for (const contact of selectedContacts) {
          try {
            // Update contact metadata to include brokerId
            await contactsApi.updateContact(contact.id, {
              metadata: {
                ...contact.metadata,
                brokerId: broker.id
              }
            });
            console.log(`✅ Associated contact ${contact.id} (${contact.name}) with broker ${broker.id}`);
          } catch (contactError: any) {
            console.error(`❌ Error associating contact ${contact.id}:`, contactError);
            // Continue with other contacts even if one fails
          }
        }
      }

      // Handle email thread associations
      // First, find email threads that were removed (in original but not in selected)
      const removedEmailThreadIds = originalEmailThreadIds.filter(
        (origThreadId) => !selectedEmailThreadIds.includes(origThreadId)
      );

      // Remove email threads that are no longer associated
      if (removedEmailThreadIds.length > 0) {
        console.log(`🗑️ Removing ${removedEmailThreadIds.length} email thread(s) from broker`);
        for (const threadId of removedEmailThreadIds) {
          try {
            // Find and delete the communication record with this threadId
            await brokersApi.disassociateEmailThread(broker.id, threadId);
            console.log(`✅ Removed email thread ${threadId} from broker ${broker.id}`);
          } catch (emailError: any) {
            console.error(`❌ Error removing email thread ${threadId}:`, emailError);
            // Continue with other threads even if one fails
          }
        }
      }

      // Then, add new email threads (only ones not in original)
      const newEmailThreadIds = selectedEmailThreadIds.filter(
        (threadId) => !originalEmailThreadIds.includes(threadId)
      );

      if (newEmailThreadIds.length > 0) {
        console.log(`📧 Associating ${newEmailThreadIds.length} new email thread(s) with broker`);
        for (let i = 0; i < selectedEmailThreadIds.length; i++) {
          const threadId = selectedEmailThreadIds[i];
          // Only add if it's a new thread
          if (newEmailThreadIds.includes(threadId)) {
            try {
              await brokersApi.associateEmailThread(broker.id, {
                threadId: threadId,
                subject: selectedEmailSubjects[i] || '(No Subject)'
              });
              console.log(`✅ Associated new email thread ${threadId} with broker`);
            } catch (emailError: any) {
              console.error(`❌ Error associating email thread ${threadId}:`, emailError);
              // Continue with other threads even if one fails
            }
          }
        }
      }

      console.log('🎉 Broker update completed successfully!');
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('❌ Error updating broker:', err);
      console.error('Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
      setError(err.response?.data?.message || err.message || 'Failed to update broker');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setError('');
      setSelectedEmailThreadIds([]);
      setSelectedEmailSubjects([]);
      setOriginalEmailThreadIds([]);
      setSelectedContacts([]);
      setOriginalContacts([]);
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3
        }
      }}
    >
      <DialogTitle sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        bgcolor: '#000000',
        color: 'white',
        py: 2
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <EditIcon />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Edit Broker: {broker?.name}
          </Typography>
        </Box>
        <IconButton onClick={handleClose} sx={{ color: 'white' }} disabled={loading}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 0, px: 3, maxHeight: '60vh', overflowY: 'auto', overflowX: 'hidden' }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3, mt: 4 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3} sx={{ mt: 4 }}>
          {/* Broker Name */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Broker Name"
              value={formData.name}
              onChange={handleChange('name')}
              required
              disabled={loading}
              InputLabelProps={{
                sx: { color: '#333333', fontWeight: 500 }
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonIcon color="action" />
                  </InputAdornment>
                )
              }}
            />
          </Grid>

          {/* Firm Name */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Firm Name"
              value={formData.firmName}
              onChange={handleChange('firmName')}
              disabled={loading}
              InputLabelProps={{
                sx: { color: '#333333', fontWeight: 500 }
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <BusinessIcon color="action" />
                  </InputAdornment>
                )
              }}
            />
          </Grid>

          {/* Type */}
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth disabled={loading}>
              <InputLabel sx={{ color: '#333333', fontWeight: 500 }}>Type</InputLabel>
              <Select
                value={formData.type}
                label="Type"
                onChange={handleChange('type')}
              >
                {brokerTypes.map((type) => (
                  <MenuItem key={type} value={type}>
                    {type}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Status */}
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth disabled={loading}>
              <InputLabel sx={{ color: '#333333', fontWeight: 500 }}>Status</InputLabel>
              <Select
                value={formData.status}
                label="Status"
                onChange={handleChange('status')}
              >
                {statuses.map((status) => (
                  <MenuItem key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Stage */}
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth disabled={loading}>
              <InputLabel sx={{ color: '#333333', fontWeight: 500 }}>Stage</InputLabel>
              <Select
                value={formData.stage}
                label="Stage"
                onChange={handleChange('stage')}
              >
                {stages.map((stage) => (
                  <MenuItem key={stage} value={stage}>
                    {stage === 'all' ? 'All' : stage === 'response-received' ? 'Response Received' : 'Closing'}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Priority */}
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth disabled={loading}>
              <InputLabel sx={{ color: '#333333', fontWeight: 500 }}>Priority</InputLabel>
              <Select
                value={formData.priority}
                label="Priority"
                onChange={handleChange('priority')}
              >
                {priorities.map((priority) => (
                  <MenuItem key={priority} value={priority}>
                    {priority.charAt(0).toUpperCase() + priority.slice(1)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Deal Size */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Deal Size"
              value={formData.dealSize}
              onChange={handleChange('dealSize')}
              disabled={loading}
              InputLabelProps={{
                sx: { color: '#333333', fontWeight: 500 }
              }}
              helperText="e.g., $1M-$5M"
            />
          </Grid>

          {/* Specialization */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Specialization"
              value={formData.specialization}
              onChange={handleChange('specialization')}
              disabled={loading}
              InputLabelProps={{
                sx: { color: '#333333', fontWeight: 500 }
              }}
              helperText="e.g., Technology, Healthcare"
            />
          </Grid>

          {/* Website */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Website"
              value={formData.website}
              onChange={handleChange('website')}
              disabled={loading}
              InputLabelProps={{
                sx: { color: '#333333', fontWeight: 500 }
              }}
              helperText="Optional"
            />
          </Grid>

          {/* Location */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Location"
              value={formData.location}
              onChange={handleChange('location')}
              disabled={loading}
              InputLabelProps={{
                sx: { color: '#333333', fontWeight: 500 }
              }}
              helperText="Optional"
            />
          </Grid>

          {/* AUM */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="AUM"
              value={formData.aum}
              onChange={handleChange('aum')}
              disabled={loading}
              InputLabelProps={{
                sx: { color: '#333333', fontWeight: 500 }
              }}
              helperText="Assets Under Management"
            />
          </Grid>

          {/* Next Step */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Next Step"
              value={formData.nextStep}
              onChange={handleChange('nextStep')}
              disabled={loading}
              InputLabelProps={{
                sx: { color: '#333333', fontWeight: 500 }
              }}
              helperText="Optional"
            />
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
                sx: { color: '#333333', fontWeight: 500 }
              }}
              helperText="Optional notes about this broker"
            />
          </Grid>

          {/* Contact Association */}
          <Grid item xs={12} sx={{ mt: 2 }}>
            <Divider sx={{ mb: 3 }} />
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle1" sx={{
                fontWeight: 600,
                color: '#1E293B',
                mb: 1,
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}>
                <PersonIcon sx={{ fontSize: 20 }} />
                Contact Association
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Associate contacts with this broker to track relationships
              </Typography>

              <Autocomplete
                multiple
                options={allContacts}
                value={selectedContacts}
                onChange={(event, newValue) => {
                  setSelectedContacts(newValue);
                }}
                getOptionLabel={(option) => option.name || option.email || 'Unknown'}
                loading={loadingContacts}
                disabled={loading}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Select Contacts"
                    placeholder="Search contacts..."
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {loadingContacts ? <CircularProgress color="inherit" size={20} /> : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      label={option.name || option.email}
                      {...getTagProps({ index })}
                      sx={{ bgcolor: '#F0F9FF', color: '#0C4A6E' }}
                    />
                  ))
                }
              />
            </Box>
          </Grid>

          {/* Email Association */}
          <Grid item xs={12} sx={{ mt: 2 }}>
            <Divider sx={{ mb: 3 }} />
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle1" sx={{
                fontWeight: 600,
                color: '#1E293B',
                mb: 1,
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}>
                <EmailIcon sx={{ fontSize: 20 }} />
                Email Association
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Associate email threads with this broker to track communication
              </Typography>

              {selectedEmailThreadIds.length > 0 ? (
                <>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
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
                    Add Another Email Thread
                  </Button>
                </>
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
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 3, bgcolor: 'background.default' }}>
        <Button
          onClick={handleClose}
          variant="outlined"
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading}
          sx={{
            bgcolor: '#000000',
            color: 'white',
            '&:hover': {
              bgcolor: '#333333'
            }
          }}
          startIcon={loading ? <CircularProgress size={20} /> : <EditIcon />}
        >
          {loading ? 'Updating...' : 'Update Broker'}
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
