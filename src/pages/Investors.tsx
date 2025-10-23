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
  Divider,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
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
  Refresh as RefreshIcon,
  Visibility as VisibilityIcon,
  Reply as ReplyIcon,
  Forward as ForwardIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { emailProcessingApi, ProcessedEmail } from '../services/emailProcessingApi';
import emailCategorizationService, { CategorizedEmail } from '../services/emailCategorizationService';

// Mock data for investors - empty for now
const mockInvestors: any[] = [];

const stages = [
  { value: 'all', label: 'All', color: '#000000' },
  { value: 'response-received', label: 'Response Received', color: '#1976d2' },
  { value: 'closing', label: 'Closing', color: '#388e3c' }
];

export default function Investors() {
  const [searchTerm, setSearchTerm] = useState('');
  const [emails, setEmails] = useState<CategorizedEmail[]>([]);
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
      
      // Use the same Outlook integration as Deals page
      const investorEmails = await emailCategorizationService.getEmailsByCategory('investor', 50);
      setEmails(investorEmails);
    } catch (err) {
      console.error('Error loading investor emails:', err);
      // Silently handle errors - show empty state instead of error
      setEmails([]);
      setError(null);
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

  const stripHtml = (html: string) => {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || '';
  };

  const EmailCard = ({ email }: { email: CategorizedEmail }) => {
    const sentimentStyle = getSentimentColor(email.categorization.extractedData.sentiment?.toUpperCase() || 'NEUTRAL');
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [previewOpen, setPreviewOpen] = useState(false);

    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
      setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
      setAnchorEl(null);
    };

    const handlePreview = () => {
      setPreviewOpen(true);
      handleMenuClose();
    };

    const handleReply = () => {
      console.log('Reply to email:', email);
      handleMenuClose();
    };

    const handleForward = () => {
      console.log('Forward email:', email);
      handleMenuClose();
    };

    const handleCreateDeal = () => {
      console.log('Create deal from email:', email);
    };

    const handleStar = () => {
      console.log('Star email:', email.id);
      handleMenuClose();
    };

    const handleDelete = () => {
      console.log('Delete email:', email.id);
      handleMenuClose();
    };
    
    return (
      <Card
        sx={{
          mb: 2,
          transition: 'all 0.3s ease',
          bgcolor: 'white',
          border: '1px solid #d0d0d0',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.1)'
          }
        }}
      >
        <Box sx={{ p: 2 }}>
          <Box display="flex" alignItems="center" mb={2}>
            <Avatar sx={{
              bgcolor: sentimentStyle.bgColor,
              color: sentimentStyle.color,
              mr: 2,
              width: 40,
              height: 40
            }}>
              {getSentimentIcon(email.categorization.extractedData.sentiment?.toUpperCase() || 'NEUTRAL')}
            </Avatar>

            <Box flex={1}>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <Typography variant="subtitle1" fontWeight="medium" color="#000000">
                  {email.from.emailAddress.name}
                </Typography>
                <Chip
                  label={email.categorization.extractedData.sentiment || 'neutral'}
                  size="small"
                  sx={{
                    bgcolor: sentimentStyle.bgColor,
                    color: sentimentStyle.color,
                    fontWeight: 'bold'
                  }}
                />
              </Box>

              <Typography variant="body2" color="text.secondary" noWrap mb={1}>
                {email.subject || 'No subject'}
              </Typography>

              <Box display="flex" alignItems="center" gap={2}>
                <Typography variant="caption" color="text.secondary">
                  {formatDate(email.receivedDateTime)}
                </Typography>
                {email.categorization.category && (
                  <Chip
                    label={email.categorization.category.toUpperCase()}
                    size="small"
                    variant="outlined"
                    sx={{ fontSize: '0.7rem' }}
                  />
                )}
              </Box>
            </Box>
          </Box>

          {/* Three Button Layout */}
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button
              size="small"
              startIcon={<VisibilityIcon />}
              onClick={handlePreview}
              variant="outlined"
              sx={{ flex: 1, minWidth: 'fit-content' }}
            >
              View
            </Button>
            
            <Button
              size="small"
              startIcon={<BusinessIcon />}
              onClick={handleCreateDeal}
              color="primary"
              variant="contained"
              sx={{ flex: 1, minWidth: 'fit-content' }}
            >
              Make Deal
            </Button>
            
            <Button
              size="small"
              endIcon={<ExpandMoreIcon />}
              onClick={handleMenuOpen}
              variant="outlined"
              sx={{ flex: 1, minWidth: 'fit-content' }}
            >
              More Actions
            </Button>
          </Box>
        </Box>

        {/* More Actions Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={handleReply}>
            <ListItemIcon>
              <ReplyIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Reply</ListItemText>
          </MenuItem>
          <MenuItem onClick={handleForward}>
            <ListItemIcon>
              <ForwardIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Forward</ListItemText>
          </MenuItem>
          <MenuItem onClick={handleStar}>
            <ListItemIcon>
              <StarBorderIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Add Star</ListItemText>
          </MenuItem>
          <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
            <ListItemIcon>
              <DeleteIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Delete</ListItemText>
          </MenuItem>
        </Menu>

        {/* Email Preview Dialog */}
        <Dialog
          open={previewOpen}
          onClose={() => setPreviewOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <EmailIcon />
              <Typography variant="h6">{email.subject || '(No Subject)'}</Typography>
            </Box>
          </DialogTitle>
          <DialogContent>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                <strong>From:</strong> {email.from.emailAddress.address}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>Received:</strong> {formatDate(email.receivedDateTime)}
              </Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
              {email.body.content ? stripHtml(email.body.content) : 'No email content available'}
            </Typography>
            {email.categorization.confidence && (
              <Box mt={2}>
                <Typography variant="caption" color="text.secondary">
                  Confidence: {(email.categorization.confidence * 100).toFixed(0)}%
                </Typography>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setPreviewOpen(false)}>Close</Button>
            <Button onClick={handleReply} variant="contained" startIcon={<ReplyIcon />}>
              Reply
            </Button>
            <Button onClick={handleCreateDeal} variant="outlined" startIcon={<BusinessIcon />}>
              Make Deal
            </Button>
          </DialogActions>
        </Dialog>
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

      {/* Pipeline Columns */}
      {!loading && (
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
