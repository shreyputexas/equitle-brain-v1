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
  CardContent
} from '@mui/material';
import {
  Close as CloseIcon,
  AttachMoney as MoneyIcon,
  Business as BusinessIcon,
  Edit as EditIcon,
  Email as EmailIcon
} from '@mui/icons-material';
import { Deal } from '../services/dealsApi';
import { getApiUrl, getSocketUrl } from '../config/api';
import EmailSelectionModal from './EmailSelectionModal';
import dealsApi from '../services/dealsApi';

interface EditDealModalProps {
  open: boolean;
  deal: Deal | null;
  onClose: () => void;
  onSuccess: () => void;
}

const stages = [
  { value: 'prospect', label: 'Initial Review' },
  { value: 'due-diligence', label: 'Due Diligence' },
  { value: 'term-sheet', label: 'Term Sheet' },
  { value: 'closing', label: 'Closing' },
  { value: 'closed', label: 'Closed' }
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

export default function EditDealModal({ open, deal, onClose, onSuccess }: EditDealModalProps) {
  const [formData, setFormData] = useState({
    company: '',
    sector: '',
    stage: 'prospect',
    value: '',
    probability: '',
    leadPartner: '',
    status: 'active',
    nextStep: '',
    description: ''
  });

  // Email association state
  const [emailSelectionModalOpen, setEmailSelectionModalOpen] = useState(false);
  const [selectedEmailThreadIds, setSelectedEmailThreadIds] = useState<string[]>([]);
  const [selectedEmailSubjects, setSelectedEmailSubjects] = useState<string[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Update form data when deal prop changes
  useEffect(() => {
    if (deal) {
      setFormData({
        company: deal.company || '',
        sector: deal.sector || '',
        stage: deal.stage || 'prospect',
        value: deal.value?.toString() || '',
        probability: deal.probability?.toString() || '',
        leadPartner: deal.leadPartner || '',
        status: deal.status || 'active',
        nextStep: deal.nextStep || '',
        description: deal.description || ''
      });
    }
  }, [deal]);

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
    if (!deal) return;

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
      if (!formData.value || isNaN(Number(formData.value))) {
        setError('Valid deal value is required');
        return;
      }
      if (!formData.probability || isNaN(Number(formData.probability)) || Number(formData.probability) < 0 || Number(formData.probability) > 100) {
        setError('Probability must be between 0 and 100');
        return;
      }

      const dealData = {
        company: formData.company.trim(),
        sector: formData.sector,
        stage: formData.stage,
        value: Number(formData.value),
        probability: Number(formData.probability),
        leadPartner: formData.leadPartner.trim() || 'Unassigned',
        status: formData.status,
        nextStep: formData.nextStep.trim() || 'To be determined',
        ...(formData.description.trim() && { description: formData.description.trim() })
      };

      const response = await fetch(getApiUrl(`firebase-deals/${deal.id}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-token'
        },
        body: JSON.stringify(dealData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to update deal');
      }

      // Associate email threads with deal if any were selected
      if (selectedEmailThreadIds.length > 0 && deal.id) {
        for (let i = 0; i < selectedEmailThreadIds.length; i++) {
          try {
            await dealsApi.associateEmailThread(deal.id, {
              threadId: selectedEmailThreadIds[i],
              subject: selectedEmailSubjects[i] || '(No Subject)'
            });
            console.log(`Associated email thread ${selectedEmailThreadIds[i]} with deal`);
          } catch (emailError: any) {
            console.error(`Error associating email thread ${selectedEmailThreadIds[i]} with deal:`, emailError);
            // Don't fail the entire operation if email association fails
          }
        }
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error updating deal:', err);
      setError(err.message || 'Failed to update deal');
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
            Edit Deal: {deal?.company}
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

          {/* Sector */}
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth required disabled={loading}>
              <InputLabel sx={{ color: '#333333', fontWeight: 500 }}>Sector</InputLabel>
              <Select
                value={formData.sector}
                label="Sector"
                onChange={handleChange('sector')}
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
            <FormControl fullWidth disabled={loading}>
              <InputLabel sx={{ color: '#333333', fontWeight: 500 }}>Stage</InputLabel>
              <Select
                value={formData.stage}
                label="Stage"
                onChange={handleChange('stage')}
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
              <InputLabel sx={{ color: '#333333', fontWeight: 500 }}>Status</InputLabel>
              <Select
                value={formData.status}
                label="Status"
                onChange={handleChange('status')}
              >
                {statuses.map((status) => (
                  <MenuItem key={status.value} value={status.value}>
                    {status.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Deal Value */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Deal Value ($)"
              value={formData.value}
              onChange={handleChange('value')}
              required
              type="number"
              disabled={loading}
              InputLabelProps={{
                sx: { color: '#333333', fontWeight: 500 }
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <MoneyIcon color="action" />
                  </InputAdornment>
                )
              }}
              helperText="Enter amount in USD"
            />
          </Grid>

          {/* Probability */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Probability (%)"
              value={formData.probability}
              onChange={handleChange('probability')}
              required
              type="number"
              disabled={loading}
              InputLabelProps={{
                sx: { color: '#333333', fontWeight: 500 }
              }}
              inputProps={{ min: 0, max: 100 }}
              helperText="0-100%"
            />
          </Grid>

          {/* Lead Partner */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Lead Partner"
              value={formData.leadPartner}
              onChange={handleChange('leadPartner')}
              disabled={loading}
              InputLabelProps={{
                sx: { color: '#333333', fontWeight: 500 }
              }}
              helperText="Optional"
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

          {/* Description */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Description"
              value={formData.description}
              onChange={handleChange('description')}
              multiline
              rows={3}
              disabled={loading}
              InputLabelProps={{
                sx: { color: '#333333', fontWeight: 500 }
              }}
              helperText="Optional deal description or notes"
            />
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
                Associate an email thread with this deal to track communication
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
          {loading ? 'Updating...' : 'Update Deal'}
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