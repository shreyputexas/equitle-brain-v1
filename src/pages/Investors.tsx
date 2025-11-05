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
  DialogActions,
  Grid
} from '@mui/material';
import LinkedInOutreach from '../components/LinkedInOutreach';
import NewInvestorModal from '../components/NewInvestorModal';
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
  const ACCENT_NAVY = '#1E3A8A';
  const ACCENT_NAVY_DARK = '#1E40AF';
  const [searchTerm, setSearchTerm] = useState('');
  const [emails, setEmails] = useState<CategorizedEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newInvestorModalOpen, setNewInvestorModalOpen] = useState(false);

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
    } catch (err: any) {
      console.error('Error loading investor emails:', err);
      
      // Provide more specific error messages
      if (err.message?.includes('No email integration connected')) {
        setError('Please connect Gmail or Microsoft Outlook in Settings to view investor emails');
      } else if (err.response?.status === 401 || err.response?.status === 404) {
        setError('Please connect an email account (Gmail or Outlook) in Settings to view investor emails');
      } else if (err.message?.includes('No active Microsoft integration')) {
        setError('No email integration found. Please connect Gmail or Outlook in Settings');
      } else {
        setError('Failed to load investor emails. Please connect Gmail or Outlook in Settings');
      }
    } finally {
      setLoading(false);
    }
  };

  const getEmailsForStage = (stageValue: string) => {
    // Currently no sub-category on CategorizedEmail; show all per stage buckets
    return emails;
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
      {/* Banner - match Deals style exactly with Navy accents */}
      <Box sx={{
        position: 'relative',
        bgcolor: 'white',
        borderRadius: '0 0 32px 32px',
        overflow: 'hidden',
        mb: 6,
        boxShadow: '0 8px 32px rgba(15, 23, 42, 0.08)'
      }}>
        {/* Background Pattern (navy version) */}
        <Box sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(135deg, rgba(30, 58, 138, 0.02) 0%, rgba(30, 64, 175, 0.05) 100%)',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: -50,
            right: -50,
            width: 100,
            height: 100,
            background: `linear-gradient(135deg, ${ACCENT_NAVY} 0%, ${ACCENT_NAVY_DARK} 100%)`,
            borderRadius: '50%',
            opacity: 0.1
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            bottom: -30,
            left: -30,
            width: 60,
            height: 60,
            background: `linear-gradient(135deg, ${ACCENT_NAVY} 0%, ${ACCENT_NAVY_DARK} 100%)`,
            borderRadius: 2,
            opacity: 0.1,
            transform: 'rotate(15deg)'
          }
        }} />

        <Box sx={{ position: 'relative', zIndex: 2, px: 4, py: 6 }}>
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={8}>
              <Box sx={{ position: 'relative', zIndex: 2 }}>
                <Typography
                  variant="h3"
                  sx={{
                    fontWeight: 700,
                    mb: 2,
                    color: '#1e293b',
                    fontSize: { xs: '2.2rem', md: '3rem' },
                    lineHeight: 1.1,
                    letterSpacing: '-0.02em',
                    fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    textTransform: 'uppercase',
                    background: 'linear-gradient(135deg, #1e293b 0%, #475569 100%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}
                >
                  INVESTOR OUTREACH
                </Typography>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 500,
                    mb: 3,
                    color: '#475569',
                    fontSize: '1.1rem',
                    lineHeight: 1.5
                  }}
                >
                  Track and manage your investor communications from initial outreach to closing
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    color: '#64748b',
                    mb: 4,
                    maxWidth: '600px',
                    lineHeight: 1.6
                  }}
                >
                  Track your investors, send tailored emails, and get notified when new responses come in.
                </Typography>

                {/* Action Buttons */}
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Button
                    variant="text"
                    size="large"
                    startIcon={<AddIcon />}
                    onClick={() => {
                      setNewInvestorModalOpen(true);
                    }}
                    sx={{
                      background: 'transparent',
                      color: '#6b7280',
                      border: 'none',
                      boxShadow: 'none',
                      px: 3,
                      py: 1.5,
                      borderRadius: 2,
                      fontSize: '1rem',
                      fontWeight: 500,
                      textTransform: 'none',
                      fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                      '&:hover': {
                        background: '#f9fafb',
                        color: '#374151',
                        transform: 'translateY(-1px)'
                      },
                      '& .MuiButton-startIcon': {
                        color: '#6b7280'
                      },
                      '&:hover .MuiButton-startIcon': {
                        color: '#374151'
                      },
                      transition: 'all 0.3s ease'
                    }}
                  >
                    New Investor
                  </Button>
                </Box>
              </Box>
            </Grid>

            <Grid item xs={12} md={4}>
              <Box sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                position: 'relative',
                zIndex: 2
              }}>
                <Box sx={{
                  width: 120,
                  height: 120,
                  borderRadius: 3,
                  background: `linear-gradient(135deg, ${ACCENT_NAVY} 0%, ${ACCENT_NAVY_DARK} 100%)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: `0 8px 32px rgba(30, 58, 138, 0.3)`
                }}>
                  <PeopleIcon sx={{ fontSize: 64, color: 'white' }} />
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Box>

      {/* Small Pipeline Banner - match Deals style exactly */}
      <Box sx={{ 
        background: 'linear-gradient(180deg, #2c2c2c 0%, #1a1a1a 100%)',
        borderRadius: '12px 12px 0 0',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
        mb: 4,
        p: 4,
        position: 'relative',
        overflow: 'hidden'
      }}>
        <Box sx={{ position: 'relative', zIndex: 2 }}>
          <Box sx={{ mb: 2 }}>
            <Box>
              <Typography 
                variant="h4" 
                sx={{ 
                  fontWeight: 400, 
                  color: 'white', 
                  fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                  letterSpacing: '-0.02em',
                  mb: 1
                }}
              >
                Investor Pipeline
              </Typography>
              <Typography 
                variant="body1" 
                sx={{ 
                  color: 'rgba(255, 255, 255, 0.8)', 
                  fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                  fontWeight: 400,
                  letterSpacing: '-0.01em'
                }}
              >
                Track and manage your investor communications
              </Typography>
            </Box>
          </Box>
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
                borderColor: ACCENT_NAVY,
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                bgcolor: '#ffffff'
              },
              '&.Mui-focused': {
                borderColor: ACCENT_NAVY,
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
                <SearchIcon sx={{ color: ACCENT_NAVY_DARK }} />
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
              email.from.emailAddress.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
              email.from.emailAddress.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
              email.subject?.toLowerCase().includes(searchTerm.toLowerCase())
            );
            
            return (
              <Paper
                key={stage.value}
                sx={{
                  flex: 1,
                  minWidth: 0,
                  maxWidth: '33.33%',
                  borderRadius: 2,
                  overflow: 'hidden',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}
              >
                {/* Mini Top Banner - Black/Grey Gradient */}
                <Box sx={{
                  background: 'linear-gradient(180deg, #2c2c2c 0%, #1a1a1a 100%)',
                  color: 'white',
                  p: 2,
                  position: 'relative'
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="h6" sx={{ 
                      fontWeight: 600, 
                      color: 'white',
                      fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                      letterSpacing: '-0.01em'
                    }}>
                      {stage.label}
                    </Typography>
                    <Box sx={{
                      bgcolor: ACCENT_NAVY,
                      color: 'white',
                      px: 1.5,
                      py: 0.5,
                      borderRadius: 1,
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                    }}>
                      {stageEmails.length} investor{stageEmails.length !== 1 ? 's' : ''}
                    </Box>
                  </Box>
                  <Typography variant="caption" sx={{ 
                    color: 'rgba(255, 255, 255, 0.8)',
                    fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                  }}>
                    Investor communications
                  </Typography>
                </Box>

                {/* Stage Content */}
                <Box sx={{ 
                  minHeight: 400, 
                  bgcolor: 'white',
                  p: 2
                }}>
                  {stageEmails.length === 0 ? (
                    <Box sx={{ 
                      textAlign: 'center', 
                      py: 8,
                      border: '2px dashed',
                      borderColor: '#d1d5db',
                      borderRadius: 2,
                      bgcolor: '#f9fafb'
                    }}>
                      <EmailIcon sx={{ fontSize: 48, color: '#9ca3af', mb: 2 }} />
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

      {/* LinkedIn Outreach Section */}
      <LinkedInOutreach />

      {/* New Investor Modal */}
      <NewInvestorModal
        open={newInvestorModalOpen}
        onClose={() => setNewInvestorModalOpen(false)}
        onSuccess={() => {
          // Refresh investor data or show success message
          console.log('Investor created successfully');
        }}
      />
    </Box>
  );
}
