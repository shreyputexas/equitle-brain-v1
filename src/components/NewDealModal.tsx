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
  InputAdornment,
  Alert,
  CircularProgress,
  IconButton
} from '@mui/material';
import {
  Close as CloseIcon,
  AttachMoney as MoneyIcon,
  Business as BusinessIcon
} from '@mui/icons-material';

interface NewDealModalProps {
  open: boolean;
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

export default function NewDealModal({ open, onClose, onSuccess }: NewDealModalProps) {
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

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | any) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
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

      // For now, we'll use a simple POST to the deals API
      const response = await fetch('http://localhost:4000/api/deals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-token'
        },
        body: JSON.stringify(dealData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to create deal');
      }

      // Reset form
      setFormData({
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
          <BusinessIcon />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Create New Deal
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
          startIcon={loading ? <CircularProgress size={20} /> : <BusinessIcon />}
        >
          {loading ? 'Creating...' : 'Create Deal'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}