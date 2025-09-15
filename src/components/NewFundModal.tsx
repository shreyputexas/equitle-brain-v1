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
  AccountBalance as FundIcon,
  AttachMoney as MoneyIcon,
  CalendarToday as CalendarIcon
} from '@mui/icons-material';

interface NewFundModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const fundTypes = [
  { value: 'venture', label: 'Venture Capital Fund' },
  { value: 'growth', label: 'Growth Equity Fund' },
  { value: 'buyout', label: 'Private Equity Buyout Fund' },
  { value: 'credit', label: 'Private Credit Fund' },
  { value: 'real_estate', label: 'Real Estate Fund' },
  { value: 'infrastructure', label: 'Infrastructure Fund' },
  { value: 'other', label: 'Other' }
];

const strategies = [
  'Early Stage',
  'Growth Stage',
  'Late Stage',
  'Multi-Stage',
  'Sector Focused',
  'Generalist',
  'Value Creation',
  'Turnaround',
  'Special Situations'
];

const currencies = [
  { value: 'USD', label: 'US Dollar (USD)' },
  { value: 'EUR', label: 'Euro (EUR)' },
  { value: 'GBP', label: 'British Pound (GBP)' },
  { value: 'JPY', label: 'Japanese Yen (JPY)' },
  { value: 'CAD', label: 'Canadian Dollar (CAD)' }
];

export default function NewFundModal({ open, onClose, onSuccess }: NewFundModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    strategy: '',
    targetSize: '',
    minimumCommitment: '',
    managementFee: '2',
    carriedInterest: '20',
    currency: 'USD',
    vintage: new Date().getFullYear().toString(),
    investmentPeriod: '5',
    fundTerm: '10',
    description: '',
    geoFocus: '',
    sectorFocus: ''
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
      if (!formData.name.trim()) {
        setError('Fund name is required');
        return;
      }
      if (!formData.type) {
        setError('Fund type is required');
        return;
      }
      if (!formData.targetSize || isNaN(Number(formData.targetSize))) {
        setError('Valid target size is required');
        return;
      }
      if (!formData.minimumCommitment || isNaN(Number(formData.minimumCommitment))) {
        setError('Valid minimum commitment is required');
        return;
      }

      const fundData = {
        name: formData.name.trim(),
        type: formData.type,
        strategy: formData.strategy,
        targetSize: Number(formData.targetSize),
        minimumCommitment: Number(formData.minimumCommitment),
        managementFee: Number(formData.managementFee),
        carriedInterest: Number(formData.carriedInterest),
        currency: formData.currency,
        vintage: Number(formData.vintage),
        investmentPeriod: Number(formData.investmentPeriod),
        fundTerm: Number(formData.fundTerm),
        geoFocus: formData.geoFocus.trim(),
        sectorFocus: formData.sectorFocus.trim(),
        description: formData.description.trim(),
        status: 'Pre-Launch',
        raisedAmount: 0,
        investorCount: 0
      };

      // TODO: Replace with actual API call
      const response = await fetch('http://localhost:4000/api/funds', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-token'
        },
        body: JSON.stringify(fundData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to create fund');
      }

      // Reset form
      setFormData({
        name: '',
        type: '',
        strategy: '',
        targetSize: '',
        minimumCommitment: '',
        managementFee: '2',
        carriedInterest: '20',
        currency: 'USD',
        vintage: new Date().getFullYear().toString(),
        investmentPeriod: '5',
        fundTerm: '10',
        description: '',
        geoFocus: '',
        sectorFocus: ''
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error creating fund:', err);
      setError(err.message || 'Failed to create fund');
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
          <FundIcon />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Create New Fund
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
          {/* Fund Name */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Fund Name"
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
                    <FundIcon color="action" />
                  </InputAdornment>
                )
              }}
              helperText="e.g., Equitle Venture Fund III"
            />
          </Grid>

          {/* Fund Type */}
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth required disabled={loading}>
              <InputLabel sx={{ color: '#333333', fontWeight: 500 }}>Fund Type</InputLabel>
              <Select
                value={formData.type}
                label="Fund Type"
                onChange={handleChange('type')}
              >
                {fundTypes.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Strategy */}
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth disabled={loading}>
              <InputLabel sx={{ color: '#333333', fontWeight: 500 }}>Investment Strategy</InputLabel>
              <Select
                value={formData.strategy}
                label="Investment Strategy"
                onChange={handleChange('strategy')}
              >
                {strategies.map((strategy) => (
                  <MenuItem key={strategy} value={strategy}>
                    {strategy}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Target Size */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Target Size"
              value={formData.targetSize}
              onChange={handleChange('targetSize')}
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
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    {formData.currency}
                  </InputAdornment>
                )
              }}
              helperText="Enter amount in millions"
            />
          </Grid>

          {/* Minimum Commitment */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Minimum Commitment"
              value={formData.minimumCommitment}
              onChange={handleChange('minimumCommitment')}
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
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    {formData.currency}
                  </InputAdornment>
                )
              }}
              helperText="Minimum LP commitment amount"
            />
          </Grid>

          {/* Management Fee */}
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Management Fee (%)"
              value={formData.managementFee}
              onChange={handleChange('managementFee')}
              type="number"
              disabled={loading}
              InputLabelProps={{
                sx: { color: '#333333', fontWeight: 500 }
              }}
              inputProps={{ min: 0, max: 10, step: 0.1 }}
              helperText="Annual management fee"
            />
          </Grid>

          {/* Carried Interest */}
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Carried Interest (%)"
              value={formData.carriedInterest}
              onChange={handleChange('carriedInterest')}
              type="number"
              disabled={loading}
              InputLabelProps={{
                sx: { color: '#333333', fontWeight: 500 }
              }}
              inputProps={{ min: 0, max: 50, step: 1 }}
              helperText="Performance fee"
            />
          </Grid>

          {/* Currency */}
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth disabled={loading}>
              <InputLabel sx={{ color: '#333333', fontWeight: 500 }}>Currency</InputLabel>
              <Select
                value={formData.currency}
                label="Currency"
                onChange={handleChange('currency')}
              >
                {currencies.map((currency) => (
                  <MenuItem key={currency.value} value={currency.value}>
                    {currency.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Vintage Year */}
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Vintage Year"
              value={formData.vintage}
              onChange={handleChange('vintage')}
              type="number"
              disabled={loading}
              InputLabelProps={{
                sx: { color: '#333333', fontWeight: 500 }
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <CalendarIcon color="action" />
                  </InputAdornment>
                )
              }}
              inputProps={{ min: 2020, max: 2030 }}
            />
          </Grid>

          {/* Investment Period */}
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Investment Period (Years)"
              value={formData.investmentPeriod}
              onChange={handleChange('investmentPeriod')}
              type="number"
              disabled={loading}
              InputLabelProps={{
                sx: { color: '#333333', fontWeight: 500 }
              }}
              inputProps={{ min: 1, max: 10 }}
              helperText="Active investment period"
            />
          </Grid>

          {/* Fund Term */}
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Fund Term (Years)"
              value={formData.fundTerm}
              onChange={handleChange('fundTerm')}
              type="number"
              disabled={loading}
              InputLabelProps={{
                sx: { color: '#333333', fontWeight: 500 }
              }}
              inputProps={{ min: 5, max: 20 }}
              helperText="Total fund lifecycle"
            />
          </Grid>

          {/* Geographic Focus */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Geographic Focus"
              value={formData.geoFocus}
              onChange={handleChange('geoFocus')}
              disabled={loading}
              InputLabelProps={{
                sx: { color: '#333333', fontWeight: 500 }
              }}
              helperText="e.g., North America, Europe, Global"
            />
          </Grid>

          {/* Sector Focus */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Sector Focus"
              value={formData.sectorFocus}
              onChange={handleChange('sectorFocus')}
              disabled={loading}
              InputLabelProps={{
                sx: { color: '#333333', fontWeight: 500 }
              }}
              helperText="e.g., Technology, Healthcare, Consumer"
            />
          </Grid>

          {/* Description */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Fund Description"
              value={formData.description}
              onChange={handleChange('description')}
              multiline
              rows={3}
              disabled={loading}
              InputLabelProps={{
                sx: { color: '#333333', fontWeight: 500 }
              }}
              helperText="Fund overview and investment thesis"
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
          startIcon={loading ? <CircularProgress size={20} /> : <FundIcon />}
        >
          {loading ? 'Creating...' : 'Create Fund'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}