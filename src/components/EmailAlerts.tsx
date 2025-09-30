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
  IconButton,
  Tooltip,
  Divider,
  Badge,
  Stack,
  Paper
} from '@mui/material';
import {
  Email as EmailIcon,
  Business as BusinessIcon,
  Schedule as ScheduleIcon,
  Refresh as RefreshIcon,
  Circle as CircleIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from '@mui/icons-material';
import { emailsApi, EmailAlert } from '../services/emailsApi';

interface EmailAlertsProps {
  limit?: number;
}

const EmailAlerts: React.FC<EmailAlertsProps> = ({ limit = 10 }) => {
  const [emails, setEmails] = useState<EmailAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedEmails, setExpandedEmails] = useState<Set<string>>(new Set());

  const loadEmails = async () => {
    try {
      setLoading(true);
      setError(null);
      const emailData = await emailsApi.getEmails(limit);
      setEmails(emailData);
    } catch (err) {
      // Silently handle errors - just show empty state instead of error
      console.log('Email alerts endpoint not ready yet:', err);
      setEmails([]);
      setError(null);
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
        return { color: '#10B981', bgColor: '#ECFDF5', borderColor: '#10B981' };
      case 'YELLOW':
        return { color: '#F59E0B', bgColor: '#FFFBEB', borderColor: '#F59E0B' };
      case 'RED':
        return { color: '#EF4444', bgColor: '#FEF2F2', borderColor: '#EF4444' };
      default:
        return { color: '#6B7280', bgColor: '#F9FAFB', borderColor: '#6B7280' };
    }
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'GREEN':
        return <CircleIcon sx={{ fontSize: 12, color: '#10B981' }} />;
      case 'YELLOW':
        return <CircleIcon sx={{ fontSize: 12, color: '#F59E0B' }} />;
      case 'RED':
        return <CircleIcon sx={{ fontSize: 12, color: '#EF4444' }} />;
      default:
        return <CircleIcon sx={{ fontSize: 12, color: '#6B7280' }} />;
    }
  };

  const toggleExpanded = (emailId: string) => {
    setExpandedEmails(prev => {
      const newSet = new Set(prev);
      if (newSet.has(emailId)) {
        newSet.delete(emailId);
      } else {
        newSet.add(emailId);
      }
      return newSet;
    });
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
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px" py={6}>
        <CircularProgress size={40} sx={{ color: '#6B7280' }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" action={
          <IconButton size="small" onClick={loadEmails}>
            <RefreshIcon />
          </IconButton>
        }>
          {error}
        </Alert>
      </Box>
    );
  }

  if (emails.length === 0) {
    return (
      <Box textAlign="center" py={8} px={4}>
        <Box sx={{ 
          width: 80, 
          height: 80, 
          borderRadius: '50%', 
          bgcolor: '#F3F4F6', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          mx: 'auto',
          mb: 4
        }}>
          <EmailIcon sx={{ fontSize: 40, color: '#6B7280' }} />
        </Box>
        <Typography variant="h6" sx={{ color: '#000000', fontWeight: 600, mb: 2 }}>
          No email alerts yet
        </Typography>
        <Typography variant="body2" sx={{ color: '#6B7280', maxWidth: 400, mx: 'auto' }}>
          Email alerts from your Zapier automation will appear here
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Modern Header */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 4,
        p: 3,
        bgcolor: 'white',
        borderRadius: 2,
        border: '1px solid #E5E7EB',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <Box sx={{ 
            width: 48, 
            height: 48, 
            borderRadius: '50%', 
            bgcolor: '#6B7280', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center' 
          }}>
            <EmailIcon sx={{ color: 'white', fontSize: 24 }} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ color: '#000000', fontWeight: 700, mb: 0.5 }}>
              Email Alerts
            </Typography>
            <Typography variant="body2" sx={{ color: '#6B7280' }}>
              {emails.length} alert{emails.length !== 1 ? 's' : ''}
            </Typography>
          </Box>
        </Box>
        <Tooltip title="Refresh alerts">
          <IconButton 
            onClick={loadEmails}
            sx={{ 
              bgcolor: '#F3F4F6', 
              p: 1.5,
              '&:hover': { bgcolor: '#E5E7EB' } 
            }}
          >
            <RefreshIcon sx={{ color: '#6B7280', fontSize: 20 }} />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Modern Email List */}
      <Stack spacing={2}>
        {emails.map((email) => {
          const sentimentStyle = getSentimentColor(email.sentiment);
          const isExpanded = expandedEmails.has(email.id);

          return (
            <Paper 
              key={email.id} 
              sx={{ 
                p: 0,
                borderRadius: 2,
                border: `1px solid ${sentimentStyle.borderColor}20`,
                bgcolor: 'white',
                transition: 'all 0.2s ease',
                '&:hover': {
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                  transform: 'translateY(-1px)'
                }
              }}
            >
              {/* Email Header */}
              <Box 
                sx={{ 
                  p: 2, 
                  cursor: 'pointer',
                  borderBottom: isExpanded ? '1px solid #E5E7EB' : 'none'
                }}
                onClick={() => toggleExpanded(email.id)}
              >
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                  {/* Status Indicator */}
                  <Box sx={{ 
                    width: 12, 
                    height: 12, 
                    borderRadius: '50%', 
                    bgcolor: sentimentStyle.color,
                    mt: 1,
                    flexShrink: 0
                  }} />

                  {/* Content */}
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                      <Typography variant="subtitle1" sx={{ 
                        color: '#000000', 
                        fontWeight: 600,
                        fontSize: '0.9rem'
                      }}>
                        {email.prospect_name || email.prospect_email}
                      </Typography>
                      <Chip
                        label={email.sentiment}
                        size="small"
                        sx={{
                          bgcolor: sentimentStyle.bgColor,
                          color: sentimentStyle.color,
                          fontWeight: 600,
                          fontSize: '0.7rem',
                          height: 24,
                          px: 1,
                          border: `1px solid ${sentimentStyle.borderColor}40`
                        }}
                      />
                    </Box>

                    <Typography variant="body2" sx={{ 
                      color: '#000000', 
                      fontWeight: 500,
                      mb: 1,
                      lineHeight: 1.4
                    }}>
                      {email.email_subject || 'No subject'}
                    </Typography>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <ScheduleIcon sx={{ fontSize: 16, color: '#6B7280' }} />
                        <Typography variant="caption" sx={{ color: '#6B7280', fontWeight: 500 }}>
                          {formatDate(email.received_date)}
                        </Typography>
                      </Box>

                      {email.associatedDealCompany && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <BusinessIcon sx={{ fontSize: 16, color: '#6B7280' }} />
                          <Typography variant="caption" sx={{ color: '#6B7280', fontWeight: 500 }}>
                            {email.associatedDealCompany}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </Box>

                  {/* Expand Icon */}
                  <IconButton 
                    size="small"
                    sx={{ 
                      color: '#6B7280',
                      p: 0.5,
                      transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s ease'
                    }}
                  >
                    <ExpandMoreIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </Box>
              </Box>

              {/* Expanded Content */}
              {isExpanded && (
                <Box sx={{ p: 2, bgcolor: '#F9FAFB' }}>
                  <Stack spacing={2}>
                    <Box>
                      <Typography variant="caption" sx={{ 
                        color: '#6B7280', 
                        fontWeight: 600, 
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        display: 'block',
                        mb: 0.5
                      }}>
                        From
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#000000' }}>
                        {email.prospect_email}
                      </Typography>
                    </Box>

                    {email.email_subject && (
                      <Box>
                        <Typography variant="caption" sx={{ 
                          color: '#6B7280', 
                          fontWeight: 600, 
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          display: 'block',
                          mb: 0.5
                        }}>
                          Subject
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#000000' }}>
                          {email.email_subject}
                        </Typography>
                      </Box>
                    )}

                    <Divider sx={{ my: 1 }} />

                    <Box>
                      <Typography variant="caption" sx={{ 
                        color: '#6B7280', 
                        fontWeight: 600, 
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        display: 'block',
                        mb: 1
                      }}>
                        Message
                      </Typography>
                      <Typography variant="body2" sx={{ 
                        color: '#000000', 
                        whiteSpace: 'pre-wrap',
                        lineHeight: 1.5
                      }}>
                        {email.email_body || 'No email content available'}
                      </Typography>
                    </Box>

                    {email.source && (
                      <Box sx={{ pt: 1 }}>
                        <Chip
                          label={`Source: ${email.source}`}
                          size="small"
                          variant="outlined"
                          sx={{
                            borderColor: '#6B7280',
                            color: '#6B7280',
                            fontWeight: 500,
                            px: 1.5,
                            py: 0.5
                          }}
                        />
                      </Box>
                    )}
                  </Stack>
                </Box>
              )}
            </Paper>
          );
        })}
      </Stack>
    </Box>
  );
};

export default EmailAlerts;