import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  CircularProgress,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Chip,
  InputAdornment,
  Alert,
  Avatar,
  Divider,
  Radio,
  Checkbox,
  Collapse
} from '@mui/material';
import {
  Close as CloseIcon,
  Email as EmailIcon,
  Search as SearchIcon,
  CheckCircle as CheckCircleIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Inbox as InboxIcon,
  Send as SendIcon,
  AllInbox as AllInboxIcon
} from '@mui/icons-material';
import gmailApi, { GmailThread } from '../services/gmailApi';

interface EmailSelectionModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (threadIds: string[], threadSubjects: string[]) => void;
  selectedThreadIds?: string[];
  multiSelect?: boolean; // Enable multi-select mode
}

interface EmailThreadDisplay {
  id: string;
  subject: string;
  from: string;
  date: string;
  snippet: string;
  fullContent?: string;
  messageId?: string;
}

type EmailFilter = 'all' | 'inbox' | 'sent';

export default function EmailSelectionModal({
  open,
  onClose,
  onSelect,
  selectedThreadIds = [],
  multiSelect = true
}: EmailSelectionModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [emailFilter, setEmailFilter] = useState<EmailFilter>('all');
  const [threads, setThreads] = useState<EmailThreadDisplay[]>([]);
  const [selectedThreads, setSelectedThreads] = useState<string[]>(selectedThreadIds);
  const [expandedThreads, setExpandedThreads] = useState<Set<string>>(new Set());
  const [loadingContent, setLoadingContent] = useState<Set<string>>(new Set());

  // Fetch recent emails when modal opens or filter changes
  useEffect(() => {
    if (open) {
      fetchRecentEmails();
    }
  }, [open, emailFilter]);

  // Update selected threads when prop changes
  useEffect(() => {
    setSelectedThreads(selectedThreadIds);
  }, [selectedThreadIds]);

  const fetchRecentEmails = async () => {
    try {
      setLoading(true);
      setError('');

      // Determine label IDs based on filter
      let labelIds: string[] | undefined;
      if (emailFilter === 'inbox') {
        labelIds = ['INBOX'];
      } else if (emailFilter === 'sent') {
        labelIds = ['SENT'];
      }
      // 'all' filter uses no labelIds to get all emails

      const requestParams = {
        maxResults: 100, // Increased to fetch more emails (approximately 30 days worth)
        q: searchQuery || undefined,
        labelIds
      };
      
      console.log('📧 Requesting Gmail threads with params:', requestParams);
      
      const response = await gmailApi.getThreads(requestParams);
      
      console.log('📧 ===== GMAIL API RESPONSE =====');
      console.log('📧 Threads received from API:', response.threads?.length || 0);
      console.log('📧 Result size estimate:', response.resultSizeEstimate);
      console.log('📧 Has next page token:', !!response.nextPageToken);
      console.log('📧 First thread IDs:', response.threads?.slice(0, 10).map(t => t.id));
      console.log('📧 ==============================');

      if (!response.threads || response.threads.length === 0) {
        console.error('❌ NO THREADS RECEIVED FROM API!');
        setThreads([]);
        return;
      }

      // Transform threads to display format
      console.log('🔄 Starting transformation of', response.threads.length, 'threads...');
      const displayThreads: EmailThreadDisplay[] = response.threads.map((thread: GmailThread, idx: number) => {
        try {
          const latestMessage = thread.messages[thread.messages.length - 1];
          const headers = latestMessage?.payload?.headers || [];

          const getHeader = (name: string) => {
            const header = headers.find(h => h.name.toLowerCase() === name.toLowerCase());
            return header?.value || '';
          };

          const subject = getHeader('Subject') || '(No Subject)';
          const from = getHeader('From') || 'Unknown';
          const date = getHeader('Date') || '';

          const transformed = {
            id: thread.id,
            subject,
            from,
            date,
            snippet: latestMessage?.snippet || '',
            messageId: latestMessage?.id
          };
          
          if (idx < 3) {
            console.log(`   Thread ${idx + 1}:`, subject.substring(0, 50));
          }
          
          return transformed;
        } catch (error) {
          console.error(`❌ Error transforming thread ${idx}:`, error);
          return {
            id: thread.id || `error-${idx}`,
            subject: '(Error loading)',
            from: 'Unknown',
            date: '',
            snippet: '',
            messageId: undefined
          };
        }
      });
      console.log('🔄 Transformation complete');

      console.log(`✅ TRANSFORMED ${displayThreads.length} EMAIL THREADS FOR DISPLAY`);
      console.log('✅ Setting threads state with', displayThreads.length, 'threads');
      setThreads(displayThreads);
      console.log('✅ Threads state set successfully');
    } catch (err: any) {
      console.error('Error fetching emails:', err);

      // Extract error type from response if available
      const errorType = err.response?.data?.errorType;
      const errorMessage = err.response?.data?.message || err.message;

      // Handle different error types with specific messages
      if (errorType === 'INTEGRATION_NOT_FOUND' || errorMessage?.includes('Gmail integration required') || errorMessage?.includes('select Gmail permissions')) {
        setError(errorMessage || 'Please connect your Gmail account in settings to use this feature.');
      } else if (errorType === 'AUTH_EXPIRED' || errorMessage?.includes('authorization expired') || errorMessage?.includes('re-authenticate')) {
        setError('Your Gmail session has expired. Please reconnect your Gmail account in settings.');
      } else if (errorType === 'PERMISSION_DENIED' || err.response?.status === 403) {
        setError('Gmail permission denied. Please grant the required permissions in settings.');
      } else if (errorType === 'RATE_LIMIT' || err.response?.status === 429) {
        setError('Gmail API quota exceeded. Please try again in a few minutes.');
      } else if (err.response?.status === 401) {
        setError('Gmail authorization failed. Please reconnect your account in settings.');
      } else {
        setError('Failed to load emails. Please try again or check your Gmail connection in settings.');
      }
      setThreads([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchRecentEmails();
  };

  const handleToggleThread = (threadId: string) => {
    if (multiSelect) {
      setSelectedThreads(prev => {
        if (prev.includes(threadId)) {
          return prev.filter(id => id !== threadId);
        } else {
          return [...prev, threadId];
        }
      });
    } else {
      setSelectedThreads([threadId]);
    }
  };

  const handleClose = () => {
    setSearchQuery('');
    onClose();
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateString;
    }
  };

  const extractEmailName = (fromString: string) => {
    // Extract name from "Name <email@domain.com>" format
    const match = fromString.match(/^([^<]+)/);
    if (match) {
      return match[1].trim().replace(/"/g, '');
    }
    return fromString;
  };

  // Helper function to decode base64 email content
  const base64Decode = (str: string): string => {
    try {
      // Browser-compatible base64 decoding
      // Gmail uses URL-safe base64, so we need to handle padding
      let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
      // Add padding if needed
      while (base64.length % 4) {
        base64 += '=';
      }
      return atob(base64);
    } catch (e) {
      console.error('Error decoding base64:', e);
      return '';
    }
  };

  // Helper function to recursively extract body content from email payload
  const extractBodyContent = (payload: any): string => {
    let content = '';

    console.log('📧 Extracting body from payload:', {
      hasBody: !!payload.body,
      bodySize: payload.body?.size,
      hasBodyData: !!payload.body?.data,
      hasParts: !!payload.parts,
      partsCount: payload.parts?.length,
      mimeType: payload.mimeType
    });

    // First try to get content from direct body
    if (payload.body?.data) {
      try {
        const decoded = base64Decode(payload.body.data);
        console.log('📧 Decoded body data, length:', decoded.length);
        content += decoded;
      } catch (e) {
        console.error('❌ Error decoding body:', e);
      }
    }

    // Then check parts
    if (payload.parts && Array.isArray(payload.parts)) {
      console.log('📧 Processing', payload.parts.length, 'parts');
      for (let i = 0; i < payload.parts.length; i++) {
        const part = payload.parts[i];
        console.log(`📧 Part ${i}:`, {
          mimeType: part.mimeType,
          hasBody: !!part.body,
          hasBodyData: !!part.body?.data,
          bodySize: part.body?.size,
          hasParts: !!part.parts
        });

        // Prefer text/plain content
        if (part.mimeType === 'text/plain' && part.body?.data) {
          try {
            const decoded = base64Decode(part.body.data);
            console.log('📧 Decoded text/plain part, length:', decoded.length);
            content += decoded;
          } catch (e) {
            console.error('❌ Error decoding text/plain part:', e);
          }
        }
        // Use text/html as fallback if no plain text found yet
        else if (part.mimeType === 'text/html' && part.body?.data && !content) {
          try {
            const htmlContent = base64Decode(part.body.data);
            console.log('📧 Decoded text/html part, length:', htmlContent.length);
            // Strip HTML tags for plain display
            content = stripHtml(htmlContent);
          } catch (e) {
            console.error('❌ Error decoding text/html part:', e);
          }
        }
        // Recursively check multipart sections
        else if (part.mimeType?.startsWith('multipart/') && part.parts) {
          console.log('📧 Recursing into multipart section');
          const nestedContent = extractBodyContent(part);
          if (nestedContent) {
            content += nestedContent;
          }
        }
      }
    }

    console.log('📧 Total content extracted, length:', content.length);
    return content;
  };

  const handleToggleExpand = async (threadId: string, messageId?: string) => {
    const isExpanded = expandedThreads.has(threadId);

    if (isExpanded) {
      // Collapse
      setExpandedThreads(prev => {
        const newSet = new Set(prev);
        newSet.delete(threadId);
        return newSet;
      });
    } else {
      // Expand - fetch full content if not already loaded
      setExpandedThreads(prev => new Set(prev).add(threadId));

      const currentThread = threads.find(t => t.id === threadId);

      if (messageId && !currentThread?.fullContent) {
        setLoadingContent(prev => new Set(prev).add(threadId));
        try {
          console.log('📧 ===== FETCHING EMAIL CONTENT =====');
          console.log('📧 Message ID:', messageId);
          console.log('📧 Thread ID:', threadId);

          const response = await gmailApi.getMessage(messageId);
          const message = response.message;

          console.log('📧 ===== RAW API RESPONSE =====');
          console.log('📧 Full response:', JSON.stringify(response, null, 2));
          console.log('📧 Message object:', message);
          console.log('📧 Message ID:', message.id);
          console.log('📧 Thread ID:', message.threadId);
          console.log('📧 Snippet:', message.snippet);
          console.log('📧 Has payload:', !!message.payload);

          if (message.payload) {
            console.log('📧 ===== PAYLOAD STRUCTURE =====');
            console.log('📧 Payload mimeType:', message.payload.mimeType);
            console.log('📧 Payload has body:', !!message.payload.body);
            console.log('📧 Payload body:', message.payload.body);
            console.log('📧 Payload has parts:', !!message.payload.parts);
            console.log('📧 Payload parts count:', message.payload.parts?.length);
            console.log('📧 Full payload:', JSON.stringify(message.payload, null, 2));
          }

          let fullContent = '';

          if (message.payload) {
            fullContent = extractBodyContent(message.payload);
          }

          // If we still don't have content, use snippet as fallback
          if (!fullContent || fullContent.trim().length === 0) {
            console.warn('⚠️ ===== NO CONTENT EXTRACTED =====');
            console.warn('⚠️ Extracted content length:', fullContent.length);
            console.warn('⚠️ Extracted content:', fullContent);
            console.warn('⚠️ Using snippet as fallback');
            console.warn('⚠️ Snippet:', message.snippet);
            fullContent = message.snippet || 'No content available';
          }

          console.log('✅ ===== FINAL RESULT =====');
          console.log('✅ Final content length:', fullContent.length);
          console.log('✅ Final content preview:', fullContent.substring(0, 200));

          // Update thread with full content
          setThreads(prev => prev.map(t =>
            t.id === threadId ? { ...t, fullContent } : t
          ));
        } catch (err: any) {
          console.error('❌ ===== ERROR FETCHING EMAIL =====');
          console.error('❌ Error object:', err);
          console.error('❌ Error message:', err.message);
          console.error('❌ Error response:', err.response);
          console.error('❌ Full error:', JSON.stringify(err, null, 2));

          // Fallback to snippet if fetch fails
          setThreads(prev => prev.map(t =>
            t.id === threadId ? { ...t, fullContent: t.snippet || 'Failed to load email content' } : t
          ));
        } finally {
          setLoadingContent(prev => {
            const newSet = new Set(prev);
            newSet.delete(threadId);
            return newSet;
          });
        }
      }
    }
  };

  const stripHtml = (html: string) => {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          minHeight: '75vh',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column'
        }
      }}
    >
      {/* Header */}
      <Box sx={{
        background: 'linear-gradient(180deg, #2c2c2c 0%, #1a1a1a 100%)',
        color: 'white',
        py: 3,
        px: 4,
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <EmailIcon />
            <Typography variant="h6" sx={{
              fontWeight: 400,
              fontSize: '1.25rem',
              fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            }}>
              Select Email Thread
            </Typography>
          </Box>
          <IconButton onClick={handleClose} sx={{ color: 'white' }}>
            <CloseIcon />
          </IconButton>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body2" sx={{
            fontSize: '0.9rem',
            color: 'rgba(255, 255, 255, 0.8)',
            lineHeight: 1.5,
          }}>
            Choose an email thread to associate with this deal
          </Typography>
          {!loading && threads.length > 0 && (
            <Typography variant="body2" sx={{
              fontSize: '0.9rem',
              color: 'rgba(255, 255, 255, 0.8)',
              ml: 2
            }}>
              {threads.length} email{threads.length !== 1 ? 's' : ''}
            </Typography>
          )}
        </Box>
      </Box>

      {/* Content */}
      <DialogContent sx={{
        p: 3,
        bgcolor: '#F8FAFC',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        minHeight: 0
      }}>
        {/* Email Filter Buttons */}
        <Box sx={{ mb: 3, display: 'flex', gap: 1, justifyContent: 'center' }}>
          <Button
            variant={emailFilter === 'all' ? 'contained' : 'outlined'}
            startIcon={<AllInboxIcon />}
            onClick={() => setEmailFilter('all')}
            sx={{
              textTransform: 'none',
              borderRadius: 2,
              px: 3,
              ...(emailFilter === 'all' ? {
                background: 'linear-gradient(135deg, #6B7280 0%, #000000 100%)',
                color: 'white',
                '&:hover': {
                  background: 'linear-gradient(135deg, #4B5563 0%, #000000 100%)',
                }
              } : {
                borderColor: '#E2E8F0',
                color: '#64748B',
                '&:hover': {
                  borderColor: '#94A3B8',
                  bgcolor: '#F8FAFC',
                }
              })
            }}
          >
            All
          </Button>
          <Button
            variant={emailFilter === 'inbox' ? 'contained' : 'outlined'}
            startIcon={<InboxIcon />}
            onClick={() => setEmailFilter('inbox')}
            sx={{
              textTransform: 'none',
              borderRadius: 2,
              px: 3,
              ...(emailFilter === 'inbox' ? {
                background: 'linear-gradient(135deg, #6B7280 0%, #000000 100%)',
                color: 'white',
                '&:hover': {
                  background: 'linear-gradient(135deg, #4B5563 0%, #000000 100%)',
                }
              } : {
                borderColor: '#E2E8F0',
                color: '#64748B',
                '&:hover': {
                  borderColor: '#94A3B8',
                  bgcolor: '#F8FAFC',
                }
              })
            }}
          >
            Received
          </Button>
          <Button
            variant={emailFilter === 'sent' ? 'contained' : 'outlined'}
            startIcon={<SendIcon />}
            onClick={() => setEmailFilter('sent')}
            sx={{
              textTransform: 'none',
              borderRadius: 2,
              px: 3,
              ...(emailFilter === 'sent' ? {
                background: 'linear-gradient(135deg, #6B7280 0%, #000000 100%)',
                color: 'white',
                '&:hover': {
                  background: 'linear-gradient(135deg, #4B5563 0%, #000000 100%)',
                }
              } : {
                borderColor: '#E2E8F0',
                color: '#64748B',
                '&:hover': {
                  borderColor: '#94A3B8',
                  bgcolor: '#F8FAFC',
                }
              })
            }}
          >
            Sent
          </Button>
        </Box>

        {/* Search Box */}
        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            placeholder="Search emails by subject, sender, or content..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleSearch();
              }
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
              endAdornment: searchQuery && (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => { setSearchQuery(''); fetchRecentEmails(); }}>
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              )
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                backgroundColor: 'white',
              }
            }}
          />
          <Button
            onClick={handleSearch}
            variant="outlined"
            sx={{ mt: 2 }}
            disabled={loading}
          >
            Search
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {/* Email List */}
        <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
              <CircularProgress />
            </Box>
          ) : threads.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <EmailIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No emails found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {searchQuery ? 'Try adjusting your search query' : 'Connect your Gmail account to view emails'}
              </Typography>
            </Box>
          ) : (
            <>
              {(() => {
                console.log('🎨 RENDERING', threads.length, 'threads in the UI');
                return null;
              })()}
              <List sx={{
                flex: 1,
                overflowY: 'auto',
                overflowX: 'hidden',
                bgcolor: 'white',
                borderRadius: 2,
                border: '1px solid #E2E8F0',
                minHeight: 0,
                '&::-webkit-scrollbar': {
                  width: '8px',
                },
                '&::-webkit-scrollbar-track': {
                  background: '#F1F5F9',
                },
                '&::-webkit-scrollbar-thumb': {
                  background: '#CBD5E1',
                  borderRadius: '4px',
                  '&:hover': {
                    background: '#94A3B8',
                  },
                },
              }}>
              {threads.map((thread, index) => (
              <React.Fragment key={thread.id}>
                {index > 0 && <Divider />}
                <ListItem disablePadding>
                  <Box sx={{ width: '100%' }}>
                    <ListItemButton
                      onClick={() => handleToggleThread(thread.id)}
                      selected={selectedThreads.includes(thread.id)}
                      sx={{
                        py: 2,
                        '&.Mui-selected': {
                          bgcolor: '#F0F9FF',
                          '&:hover': {
                            bgcolor: '#E0F2FE'
                          }
                        }
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', width: '100%', gap: 2 }}>
                        {multiSelect ? (
                          <Checkbox
                            checked={selectedThreads.includes(thread.id)}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleThread(thread.id);
                            }}
                            sx={{ mt: 0.5 }}
                          />
                        ) : (
                          <Radio
                            checked={selectedThreads.includes(thread.id)}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleThread(thread.id);
                            }}
                            sx={{ mt: 0.5 }}
                          />
                        )}
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                            <Typography 
                              variant="subtitle2" 
                              sx={{ 
                                fontWeight: 600, 
                                color: '#1E293B',
                                cursor: 'pointer',
                                '&:hover': { textDecoration: 'underline' }
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleExpand(thread.id, thread.messageId);
                              }}
                            >
                              {thread.subject}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>
                                {formatDate(thread.date)}
                              </Typography>
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleExpand(thread.id, thread.messageId);
                                }}
                                sx={{ p: 0.5 }}
                              >
                                {expandedThreads.has(thread.id) ? (
                                  <ExpandLessIcon fontSize="small" />
                                ) : (
                                  <ExpandMoreIcon fontSize="small" />
                                )}
                              </IconButton>
                            </Box>
                          </Box>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            From: {extractEmailName(thread.from)}
                          </Typography>
                          {!expandedThreads.has(thread.id) && (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                lineHeight: 1.4
                              }}
                            >
                              {thread.snippet}
                            </Typography>
                          )}
                        </Box>
                        {selectedThreads.includes(thread.id) && (
                          <CheckCircleIcon sx={{ color: 'primary.main', flexShrink: 0 }} />
                        )}
                      </Box>
                    </ListItemButton>
                    <Collapse in={expandedThreads.has(thread.id)} timeout="auto" unmountOnExit>
                      <Box sx={{ px: 4, py: 2, bgcolor: '#FAFBFC', borderTop: '1px solid #E2E8F0' }}>
                        {loadingContent.has(thread.id) ? (
                          <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                            <CircularProgress size={24} />
                          </Box>
                        ) : (
                          <Typography
                            variant="body2"
                            sx={{
                              whiteSpace: 'pre-wrap',
                              wordBreak: 'break-word',
                              color: '#1E293B',
                              lineHeight: 1.6,
                              maxHeight: '400px',
                              overflow: 'auto',
                              '&::-webkit-scrollbar': {
                                width: '8px',
                              },
                              '&::-webkit-scrollbar-track': {
                                background: '#F1F5F9',
                              },
                              '&::-webkit-scrollbar-thumb': {
                                background: '#CBD5E1',
                                borderRadius: '4px',
                                '&:hover': {
                                  background: '#94A3B8',
                                },
                              },
                            }}
                          >
                            {thread.fullContent || thread.snippet || 'No content available'}
                          </Typography>
                        )}
                      </Box>
                    </Collapse>
                  </Box>
                </ListItem>
              </React.Fragment>
              ))}
              </List>
            </>
          )}
        </Box>
      </DialogContent>

      {/* Actions */}
      <DialogActions sx={{
        p: 3,
        bgcolor: '#F8FAFC',
        borderTop: '1px solid #E2E8F0',
        gap: 2
      }}>
        <Button
          onClick={handleClose}
          variant="outlined"
          sx={{
            borderColor: '#E2E8F0',
            color: '#64748B',
            fontWeight: 600,
            px: 3,
            py: 1.5,
            borderRadius: 2,
            textTransform: 'none',
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={() => {
            if (selectedThreads.length > 0) {
              const selectedThreadObjects = threads.filter(t => selectedThreads.includes(t.id));
              const threadIds = selectedThreadObjects.map(t => t.id);
              const threadSubjects = selectedThreadObjects.map(t => t.subject);
              onSelect(threadIds, threadSubjects);
              handleClose();
            }
          }}
          variant="contained"
          disabled={selectedThreads.length === 0}
          sx={{
            background: 'linear-gradient(135deg, #6B7280 0%, #000000 100%)',
            color: 'white',
            px: 3,
            py: 1.5,
            borderRadius: 2,
            fontWeight: 600,
            textTransform: 'none',
            '&:disabled': {
              background: '#9CA3AF',
            },
          }}
        >
          {multiSelect && selectedThreads.length > 0
            ? `Confirm ${selectedThreads.length} Selection${selectedThreads.length > 1 ? 's' : ''}`
            : 'Confirm Selection'
          }
        </Button>
      </DialogActions>
    </Dialog>
  );
}
