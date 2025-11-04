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
  FormControlLabel,
  Switch
} from '@mui/material';
import {
  Close as CloseIcon,
  Edit as EditIcon,
  AttachMoney as MoneyIcon,
  Business as BusinessIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon
} from '@mui/icons-material';
import InvestorsApiService, { Investor } from '../services/investorsApi';

interface EditLPModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  investor: Investor | null;
}

const investorTypes = [
  { value: 'institutional', label: 'Institutional Investor' },
  { value: 'family_office', label: 'Family Office' },
  { value: 'fund_of_funds', label: 'Fund of Funds' },
  { value: 'corporate', label: 'Corporate Investor' },
  { value: 'sovereign_wealth', label: 'Sovereign Wealth Fund' },
  { value: 'pension_fund', label: 'Pension Fund' },
  { value: 'insurance', label: 'Insurance Company' },
  { value: 'endowment', label: 'Endowment' },
  { value: 'foundation', label: 'Foundation' },
  { value: 'high_net_worth', label: 'High Net Worth Individual' },
  { value: 'other', label: 'Other' }
];

const regions = [
  'North America',
  'Europe',
  'Asia Pacific',
  'Middle East',
  'Latin America',
  'Africa',
  'Global'
];

const currencies = [
  { value: 'USD', label: 'US Dollar (USD)' },
  { value: 'EUR', label: 'Euro (EUR)' },
  { value: 'GBP', label: 'British Pound (GBP)' },
  { value: 'JPY', label: 'Japanese Yen (JPY)' },
  { value: 'CAD', label: 'Canadian Dollar (CAD)' }
];

export default function EditLPModal({ open, onClose, onSuccess, investor }: EditLPModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    region: '',
    commitment: '',
    currency: 'USD',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    address: '',
    website: '',
    description: '',
    investmentPreferences: [] as string[],
    isQualifiedInvestor: true,
    requiresReporting: true,
    taxExempt: false
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [preferenceInput, setPreferenceInput] = useState('');

  useEffect(() => {
    if (investor && open) {
      setFormData({
        name: investor.name || '',
        type: investor.type || '',
        region: investor.location || '',
        commitment: investor.totalCommitment?.toString() || '',
        currency: investor.metadata?.currency || 'USD',
        contactName: investor.metadata?.contactName || '',
        contactEmail: investor.metadata?.contactEmail || '',
        contactPhone: investor.metadata?.contactPhone || '',
        address: investor.metadata?.address || '',
        website: investor.website || '',
        description: investor.description || '',
        investmentPreferences: investor.tags || [],
        isQualifiedInvestor: investor.metadata?.isQualifiedInvestor ?? true,
        requiresReporting: investor.metadata?.requiresReporting ?? true,
        taxExempt: investor.metadata?.taxExempt ?? false
      });
    }
  }, [investor, open]);

  const handleChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | any) => {
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

  const handleAddPreference = () => {
    if (preferenceInput.trim() && !formData.investmentPreferences.includes(preferenceInput.trim())) {
      setFormData(prev => ({
        ...prev,
        investmentPreferences: [...prev.investmentPreferences, preferenceInput.trim()]
      }));
      setPreferenceInput('');
    }
  };

  const handleRemovePreference = (preference: string) => {
    setFormData(prev => ({
      ...prev,
      investmentPreferences: prev.investmentPreferences.filter(p => p !== preference)
    }));
  };

  const handleSubmit = async () => {
    if (!investor) return;

    try {
      setLoading(true);
      setError('');

      if (!formData.name.trim()) {
        setError('Investor name is required');
        return;
      }
      if (!formData.type) {
        setError('Investor type is required');
        return;
      }
      if (!formData.commitment || isNaN(Number(formData.commitment))) {
        setError('Valid commitment amount is required');
        return;
      }
      if (!formData.contactName.trim()) {
        setError('Contact name is required');
        return;
      }
      if (!formData.contactEmail.trim()) {
        setError('Contact email is required');
        return;
      }

      const updateData = {
        name: formData.name.trim(),
        type: formData.type,
        location: formData.region,
        totalCommitment: Number(formData.commitment),
        ...(formData.website.trim() && { website: formData.website.trim() }),
        ...(formData.description.trim() && { description: formData.description.trim() }),
        ...(formData.investmentPreferences && formData.investmentPreferences.length > 0 && { tags: formData.investmentPreferences }),
        metadata: {
          currency: formData.currency,
          contactName: formData.contactName.trim(),
          contactEmail: formData.contactEmail.trim(),
          ...(formData.contactPhone.trim() && { contactPhone: formData.contactPhone.trim() }),
          ...(formData.address.trim() && { address: formData.address.trim() }),
          isQualifiedInvestor: formData.isQualifiedInvestor,
          requiresReporting: formData.requiresReporting,
          taxExempt: formData.taxExempt
        }
      };

      await InvestorsApiService.updateInvestor(investor.id, updateData);

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error updating investor:', err);
      setError(err.message || 'Failed to update investor');
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
    if (event.key === 'Enter' && preferenceInput.trim()) {
      event.preventDefault();
      handleAddPreference();
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
            Edit Limited Partner
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
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Investor Name"
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
                    <BusinessIcon color="action" />
                  </InputAdornment>
                )
              }}
              helperText="Full legal name of the investing entity"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth required disabled={loading}>
              <InputLabel sx={{ color: '#333333', fontWeight: 500 }}>Investor Type</InputLabel>
              <Select
                value={formData.type}
                label="Investor Type"
                onChange={handleChange('type')}
              >
                {investorTypes.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth disabled={loading}>
              <InputLabel sx={{ color: '#333333', fontWeight: 500 }}>Region</InputLabel>
              <Select
                value={formData.region}
                label="Region"
                onChange={handleChange('region')}
              >
                {regions.map((region) => (
                  <MenuItem key={region} value={region}>
                    {region}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={8}>
            <TextField
              fullWidth
              label="Commitment Amount"
              value={formData.commitment}
              onChange={handleChange('commitment')}
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
              helperText="Total commitment amount to the fund"
            />
          </Grid>

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

          <Grid item xs={12}>
            <Typography variant="h6" sx={{ fontWeight: 600, mt: 2, mb: 1 }}>
              Primary Contact Information
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Contact Name"
              value={formData.contactName}
              onChange={handleChange('contactName')}
              required
              disabled={loading}
              InputLabelProps={{
                sx: { color: '#333333', fontWeight: 500 }
              }}
              helperText="Primary contact person"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Contact Email"
              value={formData.contactEmail}
              onChange={handleChange('contactEmail')}
              required
              type="email"
              disabled={loading}
              InputLabelProps={{
                sx: { color: '#333333', fontWeight: 500 }
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailIcon color="action" />
                  </InputAdornment>
                )
              }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Contact Phone"
              value={formData.contactPhone}
              onChange={handleChange('contactPhone')}
              disabled={loading}
              InputLabelProps={{
                sx: { color: '#333333', fontWeight: 500 }
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PhoneIcon color="action" />
                  </InputAdornment>
                )
              }}
            />
          </Grid>

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
              helperText="Organization website"
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Address"
              value={formData.address}
              onChange={handleChange('address')}
              disabled={loading}
              InputLabelProps={{
                sx: { color: '#333333', fontWeight: 500 }
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LocationIcon color="action" />
                  </InputAdornment>
                )
              }}
              helperText="Full business address"
            />
          </Grid>

          <Grid item xs={12}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
              Investment Preferences
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <TextField
                fullWidth
                size="small"
                label="Add investment preference"
                value={preferenceInput}
                onChange={(e) => setPreferenceInput(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={loading}
                helperText="e.g., Technology, Healthcare, Early Stage"
              />
              <Button
                variant="outlined"
                onClick={handleAddPreference}
                disabled={!preferenceInput.trim() || loading}
              >
                Add
              </Button>
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {formData.investmentPreferences.map((preference, index) => (
                <Chip
                  key={index}
                  label={preference}
                  onDelete={() => handleRemovePreference(preference)}
                  disabled={loading}
                />
              ))}
            </Box>
          </Grid>

          <Grid item xs={12}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
              LP Characteristics
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isQualifiedInvestor}
                    onChange={handleSwitchChange('isQualifiedInvestor')}
                    disabled={loading}
                  />
                }
                label="Qualified Investor"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.requiresReporting}
                    onChange={handleSwitchChange('requiresReporting')}
                    disabled={loading}
                  />
                }
                label="Requires Regular Reporting"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.taxExempt}
                    onChange={handleSwitchChange('taxExempt')}
                    disabled={loading}
                  />
                }
                label="Tax Exempt Entity"
              />
            </Box>
          </Grid>

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
              helperText="Additional notes about this limited partner"
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
          startIcon={loading ? <CircularProgress size={20} /> : <EditIcon />}
        >
          {loading ? 'Updating...' : 'Update Limited Partner'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}