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
  Divider
} from '@mui/material';
import { getApiUrl, getSocketUrl } from '../config/api';
import {
  Close as CloseIcon,
  Assessment as ReportIcon,
  FileDownload as DownloadIcon,
  CalendarToday as CalendarIcon,
  Business as FundIcon,
  PictureAsPdf as PdfIcon
} from '@mui/icons-material';

interface ReportModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const reportTypes = [
  { value: 'quarterly', label: 'Quarterly Report', description: 'Comprehensive quarterly performance and activity report' },
  { value: 'annual', label: 'Annual Report', description: 'Year-end summary with full financial statements' },
  { value: 'capital_call', label: 'Capital Call Notice', description: 'Notice for upcoming capital calls and distributions' },
  { value: 'performance', label: 'Performance Summary', description: 'Investment performance and portfolio updates' },
  { value: 'custom', label: 'Custom Report', description: 'Customizable report with selected metrics' }
];

const reportFormats = [
  { value: 'pdf', label: 'PDF Document', icon: <PdfIcon /> },
  { value: 'excel', label: 'Excel Spreadsheet', icon: <DownloadIcon /> }
];

export default function ReportModal({ open, onClose, onSuccess }: ReportModalProps) {
  const [formData, setFormData] = useState({
    type: '',
    title: '',
    period: '',
    format: 'pdf',
    recipients: [] as string[],
    includePerformance: true,
    includePortfolio: true,
    includeFinancials: true,
    customNotes: ''
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

  const handleAddRecipient = () => {
    if (recipientInput.trim() && !formData.recipients.includes(recipientInput.trim())) {
      setFormData(prev => ({
        ...prev,
        recipients: [...prev.recipients, recipientInput.trim()]
      }));
      setRecipientInput('');
    }
  };

  const handleRemoveRecipient = (recipient: string) => {
    setFormData(prev => ({
      ...prev,
      recipients: prev.recipients.filter(r => r !== recipient)
    }));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError('');

      // Validate required fields
      if (!formData.type) {
        setError('Report type is required');
        return;
      }
      if (!formData.title.trim()) {
        setError('Report title is required');
        return;
      }
      if (!formData.period) {
        setError('Report period is required');
        return;
      }

      const reportData = {
        type: formData.type,
        title: formData.title.trim(),
        period: formData.period,
        format: formData.format,
        recipients: formData.recipients,
        sections: {
          performance: formData.includePerformance,
          portfolio: formData.includePortfolio,
          financials: formData.includeFinancials
        },
        customNotes: formData.customNotes.trim()
      };

      // TODO: Replace with actual API call
      const response = await fetch(getApiUrl('reports'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-token'
        },
        body: JSON.stringify(reportData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to generate report');
      }

      // Reset form
      setFormData({
        type: '',
        title: '',
        period: '',
        format: 'pdf',
        recipients: [],
        includePerformance: true,
        includePortfolio: true,
        includeFinancials: true,
        customNotes: ''
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error generating report:', err);
      setError(err.message || 'Failed to generate report');
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
          <ReportIcon />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Generate New Report
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
          {/* Report Type */}
          <Grid item xs={12}>
            <FormControl fullWidth required disabled={loading}>
              <InputLabel sx={{ color: '#333333', fontWeight: 500 }}>Report Type</InputLabel>
              <Select
                value={formData.type}
                label="Report Type"
                onChange={handleChange('type')}
              >
                {reportTypes.map((type) => (
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

          {/* Report Title */}
          <Grid item xs={12} sm={8}>
            <TextField
              fullWidth
              label="Report Title"
              value={formData.title}
              onChange={handleChange('title')}
              required
              disabled={loading}
              InputLabelProps={{
                sx: { color: '#333333', fontWeight: 500 }
              }}
              helperText="Enter a descriptive title for this report"
            />
          </Grid>

          {/* Report Period */}
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth required disabled={loading}>
              <InputLabel sx={{ color: '#333333', fontWeight: 500 }}>Period</InputLabel>
              <Select
                value={formData.period}
                label="Period"
                onChange={handleChange('period')}
              >
                <MenuItem value="Q1-2024">Q1 2024</MenuItem>
                <MenuItem value="Q2-2024">Q2 2024</MenuItem>
                <MenuItem value="Q3-2024">Q3 2024</MenuItem>
                <MenuItem value="Q4-2024">Q4 2024</MenuItem>
                <MenuItem value="2024">Year 2024</MenuItem>
                <MenuItem value="2023">Year 2023</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Format Selection */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
              Report Format
            </Typography>
            <Grid container spacing={2}>
              {reportFormats.map((format) => (
                <Grid item xs={6} key={format.value}>
                  <Card
                    sx={{
                      cursor: 'pointer',
                      border: formData.format === format.value ? '2px solid #000000' : '1px solid #e0e0e0',
                      '&:hover': { borderColor: '#000000' }
                    }}
                    onClick={() => setFormData(prev => ({ ...prev, format: format.value }))}
                  >
                    <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 2 }}>
                      {format.icon}
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {format.label}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Grid>

          {/* Recipients */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
              Recipients
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
              {formData.recipients.map((recipient, index) => (
                <Chip
                  key={index}
                  label={recipient}
                  onDelete={() => handleRemoveRecipient(recipient)}
                  disabled={loading}
                />
              ))}
            </Box>
          </Grid>

          {/* Custom Notes */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Custom Notes"
              value={formData.customNotes}
              onChange={handleChange('customNotes')}
              multiline
              rows={3}
              disabled={loading}
              InputLabelProps={{
                sx: { color: '#333333', fontWeight: 500 }
              }}
              helperText="Optional notes to include in the report"
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
          startIcon={loading ? <CircularProgress size={20} /> : <ReportIcon />}
        >
          {loading ? 'Generating...' : 'Generate Report'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}