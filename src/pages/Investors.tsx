import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Card,
  CardContent,
  Avatar,
  Chip,
  IconButton,
  Tooltip,
  Button,
  TextField,
  InputAdornment,
  Badge,
  CircularProgress,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider
} from '@mui/material';
import {
  People as PeopleIcon,
  Search as SearchIcon,
  Add as AddIcon,
  Business as BusinessIcon,
  TrendingUp as TrendingUpIcon,
  Schedule as ScheduleIcon,
  AttachMoney as MoneyIcon,
  ExpandMore as ExpandMoreIcon,
  Email as EmailIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { emailProcessingApi, ProcessedEmail } from '../services/emailProcessingApi';

// Mock data for investors - empty for now
const mockInvestors: any[] = [];

const stages = [
  { value: 'all', label: 'All', color: '#000000' },
  { value: 'response-received', label: 'Response Received', color: '#1976d2' },
  { value: 'closing', label: 'Closing', color: '#388e3c' }
];

export default function Investors() {
  const [searchTerm, setSearchTerm] = useState('');
  const [emails, setEmails] = useState<ProcessedEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load investor emails on component mount
  useEffect(() => {
    loadInvestorEmails();
  }, []);

  const loadInvestorEmails = async () => {
    try {
      setLoading(true);
      setError(null);
      const investorEmails = await emailProcessingApi.getEmailsByCategory('investor');
      setEmails(investorEmails);
    } catch (err) {
      console.error('Error loading investor emails:', err);
      setError('Failed to load investor emails');
    } finally {
      setLoading(false);
    }
  };

  const getEmailsForStage = (stageValue: string) => {
    if (stageValue === 'all') {
      return emails;
    }
    return emails.filter(email => email.subCategory === stageValue);
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'GREEN': return { color: '#4caf50', bgColor: '#e8f5e8' };
      case 'RED': return { color: '#f44336', bgColor: '#ffeaea' };
      case 'YELLOW': return { color: '#ff9800', bgColor: '#fff8e1' };
      default: return { color: '#9e9e9e', bgColor: '#f5f5f5' };
    }
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'GREEN': return '🟢';
      case 'YELLOW': return '🟡';
      case 'RED': return '🔴';
      default: return '⚪';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown date';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Invalid date';
    }
  };

  const EmailCard = ({ email }: { email: ProcessedEmail }) => {
    const sentimentStyle = getSentimentColor(email.sentiment);
    
    return (
      <Card
        sx={{
          mb: 2,
          transition: 'all 0.3s ease',
          cursor: 'pointer',
          bgcolor: 'white',
          border: '1px solid #d0d0d0',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.1)'
          }
        }}
      >
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box display="flex" alignItems="center" width="100%">
              <Avatar sx={{
                bgcolor: sentimentStyle.bgColor,
                color: sentimentStyle.color,
                mr: 2,
                width: 40,
                height: 40
              }}>
                {getSentimentIcon(email.sentiment)}
              </Avatar>

              <Box flex={1}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography variant="subtitle1" fontWeight="medium" color="#000000">
                    {email.prospect_name || email.prospect_email}
                  </Typography>
                  <Chip
                    label={email.sentiment}
                    size="small"
                    sx={{
                      bgcolor: sentimentStyle.bgColor,
                      color: sentimentStyle.color,
                      fontWeight: 'bold'
                    }}
                  />
                </Box>

                <Typography variant="body2" color="text.secondary" noWrap>
                  {email.email_subject || 'No subject'}
                </Typography>

                <Box display="flex" alignItems="center" gap={2} mt={1}>
                  <Typography variant="caption" color="text.secondary">
                    {formatDate(email.received_date)}
                  </Typography>
                  {email.source && (
                    <Chip
                      label={email.source}
                      size="small"
                      variant="outlined"
                      sx={{ fontSize: '0.7rem' }}
                    />
                  )}
                </Box>
              </Box>
            </Box>
          </AccordionSummary>

          <AccordionDetails>
            <Box>
              <Typography variant="body2" color="text.secondary" mb={1}>
                <strong>From:</strong> {email.prospect_email}
              </Typography>

              {email.email_subject && (
                <Typography variant="body2" color="text.secondary" mb={1}>
                  <strong>Subject:</strong> {email.email_subject}
                </Typography>
              )}

              <Divider sx={{ my: 1 }} />

              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                {email.email_body || 'No email content available'}
              </Typography>

              {email.confidence && (
                <Box mt={2}>
                  <Typography variant="caption" color="text.secondary">
                    Confidence: {(email.confidence * 100).toFixed(0)}%
                  </Typography>
                </Box>
              )}
            </Box>
          </AccordionDetails>
        </Accordion>
      </Card>
    );
  };

  const InvestorCard = ({ investor }: { investor: any }) => (
    <Card
      sx={{
        mb: 2,
        transition: 'all 0.3s ease',
        cursor: 'pointer',
        bgcolor: 'white',
        border: '1px solid #d0d0d0',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.1)'
        }
      }}
    >
      <CardContent sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Avatar sx={{ bgcolor: '#000000' }}>
              {investor.name.charAt(0)}
            </Avatar>
            <Box
              sx={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                bgcolor: getSentimentColor(investor.sentiment)
              }}
            />
          </Box>
        </Box>
        
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, color: '#000000' }}>
          {investor.name}
        </Typography>
        
        <Typography variant="body2" sx={{ mb: 2, color: '#000000' }}>
          {investor.type}
        </Typography>
        
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#000000' }}>
            ${((investor.value || 0) / 1000000).toFixed(1)}M
          </Typography>
          <Typography variant="caption" sx={{ color: '#000000' }}>
            Investment Value
          </Typography>
        </Box>
        
        <Box sx={{ mb: 2 }}>
          <Typography variant="caption" sx={{ color: '#000000' }}>
            Lead Partner
          </Typography>
          <Typography variant="body2" sx={{ color: '#000000' }}>
            {investor.leadPartner}
          </Typography>
        </Box>
        
        <Box>
          <Typography variant="caption" sx={{ color: '#000000' }}>
            Next Step
          </Typography>
          <Typography variant="body2" sx={{ color: '#000000' }}>
            {investor.nextStep}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ bgcolor: '#f8f9fa', minHeight: '100vh' }}>
      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: 2,
        bgcolor: 'black',
        color: 'white',
        p: 1.5,
        borderRadius: 0
      }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 600, color: 'white' }}>
            Investors Pipeline
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="contained"
            startIcon={<RefreshIcon />}
            onClick={loadInvestorEmails}
            sx={{
              bgcolor: 'white',
              color: 'black',
              '&:hover': {
                bgcolor: 'rgba(255,255,255,0.9)'
              }
            }}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            sx={{
              bgcolor: 'white',
              color: 'black',
              '&:hover': {
                bgcolor: 'rgba(255,255,255,0.9)'
              }
            }}
          >
            New Investor
          </Button>
        </Box>
      </Box>

      {/* Search Bar */}
      <Box sx={{ mb: 3, px: 3 }}>
        <TextField
          placeholder="Search investors..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          fullWidth
          sx={{
            '& .MuiOutlinedInput-root': {
              bgcolor: '#ffffff',
              border: '2px solid #d0d0d0',
              borderRadius: 2,
              '&:hover': {
                borderColor: '#000000',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                bgcolor: '#ffffff'
              },
              '&.Mui-focused': {
                borderColor: '#000000',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                bgcolor: '#ffffff'
              }
            },
            '& .MuiInputBase-input': {
              color: '#000000',
              fontWeight: 500
            }
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: '#666666' }} />
              </InputAdornment>
            )
          }}
        />
      </Box>

      {/* Loading State */}
      {loading && (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress size={40} />
        </Box>
      )}

      {/* Error State */}
      {error && (
        <Box sx={{ px: 3, mb: 3 }}>
          <Alert severity="error" action={
            <Button color="inherit" size="small" onClick={loadInvestorEmails}>
              Retry
            </Button>
          }>
            {error}
          </Alert>
        </Box>
      )}

      {/* Pipeline Columns */}
      {!loading && !error && (
        <Box sx={{ 
          display: 'flex', 
          gap: 1.5, 
          pb: 2, 
          minHeight: '60vh', 
          px: 3,
          width: '100%',
          overflowX: 'hidden',
          bgcolor: '#f8f9fa'
        }}>
          {stages.map((stage) => {
            const stageEmails = getEmailsForStage(stage.value).filter(email => 
              searchTerm === '' || 
              email.prospect_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
              email.prospect_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
              email.email_subject?.toLowerCase().includes(searchTerm.toLowerCase())
            );
            
            return (
              <Paper
                key={stage.value}
                sx={{
                  flex: 1,
                  minWidth: 0,
                  maxWidth: '33.33%',
                  p: 1.5,
                  borderRadius: 2,
                  border: '1px solid #d0d0d0',
                  bgcolor: '#f5f5f5',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}
              >
                {/* Stage Header */}
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#333333' }}>
                      {stage.label}
                    </Typography>
                    <Chip
                      label={`${stageEmails.length} email${stageEmails.length !== 1 ? 's' : ''}`}
                      size="small"
                      sx={{
                        bgcolor: '#333333',
                        color: 'white',
                        fontSize: '0.75rem'
                      }}
                    />
                  </Box>
                  <Typography variant="body2" sx={{ color: '#666666' }}>
                    Investor communications
                  </Typography>
                </Box>

                {/* Stage Emails */}
                <Box sx={{ minHeight: 400 }}>
                  {stageEmails.length === 0 ? (
                    <Box sx={{ 
                      textAlign: 'center', 
                      py: 8,
                      border: '2px dashed',
                      borderColor: 'divider',
                      borderRadius: 2,
                      bgcolor: 'background.default'
                    }}>
                      <EmailIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                      <Typography variant="body2" color="text.secondary">
                        No investor emails in this stage
                      </Typography>
                    </Box>
                  ) : (
                    stageEmails.map((email) => (
                      <EmailCard key={email.id} email={email} />
                    ))
                  )}
                </Box>
              </Paper>
            );
          })}
        </Box>
      )}
    </Box>
  );
}
