import React, { useState } from 'react';
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
  Chip,
  Alert,
  CircularProgress,
  IconButton,
  Card,
  CardContent,
  Switch,
  FormControlLabel,
  Divider
} from '@mui/material';
import {
  Close as CloseIcon,
  Email as EmailIcon,
  Send as SendIcon,
  Attachment as AttachmentIcon,
  Group as GroupIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';

interface EmailUpdateModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const updateTypes = [
  { value: 'quarterly', label: 'Quarterly Update', description: 'Regular quarterly performance and business update' },
  { value: 'performance', label: 'Performance Update', description: 'Portfolio performance and investment highlights' },
  { value: 'market', label: 'Market Commentary', description: 'Market analysis and outlook commentary' },
  { value: 'capital_call', label: 'Capital Call Notice', description: 'Upcoming capital call notification' },
  { value: 'custom', label: 'Custom Update', description: 'Custom message to limited partners' }
];

const recipientGroups = [
  { value: 'all_lps', label: 'All Limited Partners', count: 45 },
  { value: 'institutional', label: 'Institutional Investors', count: 15 },
  { value: 'family_offices', label: 'Family Offices', count: 12 },
  { value: 'fund_of_funds', label: 'Fund of Funds', count: 8 },
  { value: 'custom', label: 'Custom Selection', count: 0 }
];

export default function EmailUpdateModal({ open, onClose, onSuccess }: EmailUpdateModalProps) {
  const [formData, setFormData] = useState({
    type: '',
    subject: '',
    recipientGroup: 'all_lps',
    customRecipients: [] as string[],
    message: '',
    includeAttachments: false,
    scheduleDelivery: false,
    deliveryDate: '',
    priority: 'normal'
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [recipientInput, setRecipientInput] = useState('');

  const handleChange = (field: string) => (event: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  const handleSwitchChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.checked
    }));
  };

  const handleAddRecipient = () => {
    if (recipientInput.trim() && !formData.customRecipients.includes(recipientInput.trim())) {
      setFormData(prev => ({
        ...prev,
        customRecipients: [...prev.customRecipients, recipientInput.trim()]
      }));
      setRecipientInput('');
    }
  };

  const handleRemoveRecipient = (recipient: string) => {
    setFormData(prev => ({
      ...prev,
      customRecipients: prev.customRecipients.filter(r => r !== recipient)
    }));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError('');

      // Validate required fields
      if (!formData.type) {
        setError('Update type is required');
        return;
      }
      if (!formData.subject.trim()) {
        setError('Subject is required');
        return;
      }
      if (!formData.message.trim()) {
        setError('Message content is required');
        return;
      }
      if (formData.recipientGroup === 'custom' && formData.customRecipients.length === 0) {
        setError('Please add at least one recipient for custom selection');
        return;
      }

      const emailData = {
        type: formData.type,
        subject: formData.subject.trim(),
        recipientGroup: formData.recipientGroup,
        customRecipients: formData.customRecipients,
        message: formData.message.trim(),
        includeAttachments: formData.includeAttachments,
        scheduleDelivery: formData.scheduleDelivery,
        deliveryDate: formData.deliveryDate,
        priority: formData.priority
      };

      // TODO: Replace with actual Gmail API integration
      const response = await fetch('http://localhost:4001/api/emails/send-update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-token'
        },
        body: JSON.stringify(emailData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to send email update');
      }

      // Reset form
      setFormData({
        type: '',
        subject: '',
        recipientGroup: 'all_lps',
        customRecipients: [],
        message: '',
        includeAttachments: false,
        scheduleDelivery: false,
        deliveryDate: '',
        priority: 'normal'
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error sending email update:', err);
      setError(err.message || 'Failed to send email update');
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

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && recipientInput.trim()) {
      event.preventDefault();
      handleAddRecipient();
    }
  };

  const selectedGroup = recipientGroups.find(group => group.value === formData.recipientGroup);

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
          <EmailIcon />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Send LP Update
          </Typography>
        </Box>
        <IconButton onClick={handleClose} sx={{ color: 'white' }} disabled={loading}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 0, px: 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3, mt: 4 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3} sx={{ mt: 4 }}>
          {/* Update Type */}
          <Grid item xs={12}>
            <FormControl fullWidth required disabled={loading}>
              <InputLabel sx={{ color: '#333333', fontWeight: 500 }}>Update Type</InputLabel>
              <Select
                value={formData.type}
                label="Update Type"
                onChange={handleChange('type')}
              >
                {updateTypes.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {type.label}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {type.description}
                      </Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Subject */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Subject"
              value={formData.subject}
              onChange={handleChange('subject')}
              required
              disabled={loading}
              InputLabelProps={{
                sx: { color: '#333333', fontWeight: 500 }
              }}
              helperText="Enter a clear and descriptive subject line"
            />
          </Grid>

          {/* Recipients */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
              Recipients
            </Typography>
            <FormControl fullWidth disabled={loading}>
              <InputLabel sx={{ color: '#333333', fontWeight: 500 }}>Recipient Group</InputLabel>
              <Select
                value={formData.recipientGroup}
                label="Recipient Group"
                onChange={handleChange('recipientGroup')}
              >
                {recipientGroups.map((group) => (
                  <MenuItem key={group.value} value={group.value}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <GroupIcon fontSize="small" />
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {group.label}
                        </Typography>
                        {group.count > 0 && (
                          <Typography variant="caption" color="text.secondary">
                            {group.count} recipients
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {selectedGroup && selectedGroup.count > 0 && (
              <Box sx={{ mt: 1, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  This update will be sent to <strong>{selectedGroup.count}</strong> recipients in the "{selectedGroup.label}" group.
                </Typography>
              </Box>
            )}
          </Grid>

          {/* Custom Recipients (if custom group selected) */}
          {formData.recipientGroup === 'custom' && (
            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                Custom Recipients
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Add recipient email"
                  value={recipientInput}
                  onChange={(e) => setRecipientInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={loading}
                />
                <Button
                  variant="outlined"
                  onClick={handleAddRecipient}
                  disabled={!recipientInput.trim() || loading}
                >
                  Add
                </Button>
              </Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {formData.customRecipients.map((recipient, index) => (
                  <Chip
                    key={index}
                    label={recipient}
                    onDelete={() => handleRemoveRecipient(recipient)}
                    disabled={loading}
                  />
                ))}
              </Box>
            </Grid>
          )}

          {/* Message Content */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Message Content"
              value={formData.message}
              onChange={handleChange('message')}
              multiline
              rows={8}
              required
              disabled={loading}
              InputLabelProps={{
                sx: { color: '#333333', fontWeight: 500 }
              }}
              helperText="Write your message to limited partners"
            />
          </Grid>

          {/* Options */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
              Delivery Options
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.includeAttachments}
                    onChange={handleSwitchChange('includeAttachments')}
                    disabled={loading}
                  />
                }
                label="Include quarterly report attachment"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.scheduleDelivery}
                    onChange={handleSwitchChange('scheduleDelivery')}
                    disabled={loading}
                  />
                }
                label="Schedule delivery for later"
              />
            </Box>

            {formData.scheduleDelivery && (
              <Box sx={{ mt: 2 }}>
                <TextField
                  type="datetime-local"
                  label="Delivery Date & Time"
                  value={formData.deliveryDate}
                  onChange={handleChange('deliveryDate')}
                  disabled={loading}
                  InputLabelProps={{
                    shrink: true,
                    sx: { color: '#333333', fontWeight: 500 }
                  }}
                />
              </Box>
            )}
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
                <MenuItem value="low">Low Priority</MenuItem>
                <MenuItem value="normal">Normal Priority</MenuItem>
                <MenuItem value="high">High Priority</MenuItem>
              </Select>
            </FormControl>
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
          startIcon={loading ? <CircularProgress size={20} /> : <SendIcon />}
        >
          {loading ? 'Sending...' : formData.scheduleDelivery ? 'Schedule Send' : 'Send Now'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}