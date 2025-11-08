import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Alert,
  Avatar,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Tooltip,
  Divider
} from '@mui/material';
import { Stack } from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Email as EmailIcon,
  Business as BusinessIcon,
  Schedule as ScheduleIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { emailsApi, EmailAlert } from '../services/emailsApi';

interface EmailAlertsProps {
  limit?: number;
}

const EmailAlerts: React.FC<EmailAlertsProps> = ({ limit = 100 }) => {
  const [emails, setEmails] = useState<EmailAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadEmails = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Loading emails with limit:', limit);
      const emailData = await emailsApi.getEmails(limit);
      console.log('Received email data:', emailData);
      setEmails(emailData);
    } catch (err) {
      // Show error instead of silently handling
      console.error('Error loading emails:', err);
      setEmails([]);
      setError(err instanceof Error ? err.message : 'Failed to load emails');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmails();
  }, [limit]);

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'GREEN':
        return { color: '#4caf50', bgColor: '#e8f5e8' };
      case 'YELLOW':
        return { color: '#ff9800', bgColor: '#fff8e1' };
      case 'RED':
        return { color: '#f44336', bgColor: '#ffeaea' };
      default:
        return { color: '#757575', bgColor: '#f5f5f5' };
    }
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'GREEN':
        return '🟢';
      case 'YELLOW':
        return '🟡';
      case 'RED':
        return '🔴';
      default:
        return '⚪';
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

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress size={40} />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" action={
        <IconButton size="small" onClick={loadEmails}>
          <RefreshIcon />
        </IconButton>
      }>
        {error}
      </Alert>
    );
  }

  if (emails.length === 0) {
    return (
      <Box textAlign="center" py={4}>
        <EmailIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h6" color="text.secondary">
          No email alerts yet
        </Typography>
        <Typography variant="body2" color="text.secondary" mt={1}>
          Email alerts from your Zapier automation will appear here
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6" fontWeight="bold">
          Email Alerts ({emails.length})
        </Typography>
        <Tooltip title="Refresh alerts">
          <IconButton size="small" onClick={loadEmails}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      <Box sx={{
        maxHeight: '70vh',
        overflowY: 'auto',
        overflowX: 'hidden',
        '&::-webkit-scrollbar': {
          width: '8px',
        },
        '&::-webkit-scrollbar-track': {
          backgroundColor: '#f1f1f1',
        },
        '&::-webkit-scrollbar-thumb': {
          backgroundColor: '#888',
          borderRadius: '4px',
        },
        '&::-webkit-scrollbar-thumb:hover': {
          backgroundColor: '#555',
        }
      }}>
        <Stack spacing={2}>
        {emails.map((email) => {
          const sentimentStyle = getSentimentColor(email.sentiment);

          return (
            <Card key={email.id} sx={{ mb: 2, border: '1px solid #e0e0e0' }}>
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
                        <Typography variant="subtitle1" fontWeight="medium">
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

                      <Box display="flex" alignItems="center" gap={2} mt={0.5}>
                        <Box display="flex" alignItems="center" gap={0.5}>
                          <ScheduleIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                          <Typography variant="caption" color="text.secondary">
                            {formatDate(email.received_date)}
                          </Typography>
                        </Box>

                        {email.associatedDealCompany && (
                          <Box display="flex" alignItems="center" gap={0.5}>
                            <BusinessIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                            <Typography variant="caption" color="text.secondary">
                              {email.associatedDealCompany}
                            </Typography>
                          </Box>
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

                    {email.source && (
                      <Box mt={2}>
                        <Chip
                          label={`Source: ${email.source}`}
                          size="small"
                          variant="outlined"
                        />
                      </Box>
                    )}
                  </Box>
                </AccordionDetails>
              </Accordion>
            </Card>
          );
        })}
        </Stack>
      </Box>
    </Box>
  );
};

export default EmailAlerts;