import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Card,
  CardContent,
  CardActions,
  Avatar,
  AvatarGroup,
  Chip,
  IconButton,
  Tooltip,
  LinearProgress,
  Button,
  Divider,
  Badge,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  TextField,
  InputAdornment,
  Tabs,
  Tab,
  Alert,
  Snackbar,
  CircularProgress
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  Edit as EditIcon,
  MoreVert as MoreVertIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  AttachFile as AttachFileIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  AttachMoney as MoneyIcon,
  Business as BusinessIcon,
  Schedule as ScheduleIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Add as AddIcon,
  Search as SearchIcon,
  SentimentVerySatisfied as SentimentGoodIcon,
  SentimentDissatisfied as SentimentBadIcon,
  SentimentNeutral as SentimentNeutralIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { Deal as ApiDeal } from '../services/dealsApi';
import dealsApi from '../services/dealsApi';
import integrationService from '../services/integrationService';
import emailCategorizationService from '../services/emailCategorizationService';
import OutlookEmailCard from './OutlookEmailCard';

interface Person {
  id: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  relationshipScore: number;
  lastContact: Date;
  status: 'hot' | 'warm' | 'cold';
  summary: string;
  citations: {
    emails: number;
    calls: number;
    meetings: number;
    documents: number;
  };
}

interface DealWithContacts extends ApiDeal {
  people: Person[];
  sentiment?: 'good' | 'bad' | 'neutral';
}

interface OutlookEmail {
  id: string;
  subject: string;
  from: {
    emailAddress: {
      address: string;
      name: string;
    };
  };
  receivedDateTime: string;
  isRead: boolean;
  hasAttachments: boolean;
  body: {
    content: string;
    contentType: string;
  };
  importance?: 'low' | 'normal' | 'high';
  categories?: string[];
}

interface DealPipelineProps {
  deals: DealWithContacts[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  onEditDeal: (deal: ApiDeal) => void;
  onDeleteDeal: (dealId: string) => void;
}

const stages = [
  { value: 'all', label: 'All', color: '#000000' },
  { value: 'response-received', label: 'Response Received', color: '#1976d2' },
  { value: 'initial-diligence', label: 'Initial Diligence', color: '#f57c00' },
  { value: 'ioi-loi', label: 'IOI/LOI', color: '#388e3c' }
];

const mockPeople: Person[] = [
  {
    id: '1',
    name: 'Contact Person',
    role: 'To be updated',
    email: 'contact@company.com',
    phone: '',
    relationshipScore: 0,
    lastContact: new Date(),
    status: 'cold',
    summary: 'No interaction history available. Connect to view relationship details.',
    citations: { emails: 0, calls: 0, meetings: 0, documents: 0 }
  }
];

// Sample deals for demonstration
const sampleDeals: DealWithContacts[] = [
  {
    id: '1',
    company: 'Company 1',
    sector: 'Technology',
    stage: 'prospect',
    value: 5000000,
    probability: 75,
    leadPartner: 'John Smith',
    team: ['John Smith', 'Jane Doe'],
    lastActivity: new Date(),
    nextStep: 'Initial meeting scheduled',
    status: 'active',
    people: mockPeople,
    sentiment: 'good', // good, bad, neutral
    priority: 'high',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '2',
    company: 'Company 2',
    sector: 'Healthcare',
    stage: 'due-diligence',
    value: 3000000,
    probability: 60,
    leadPartner: 'Sarah Johnson',
    team: ['Sarah Johnson', 'Mike Wilson'],
    lastActivity: new Date(),
    nextStep: 'Due diligence review',
    status: 'active',
    people: mockPeople,
    sentiment: 'neutral',
    priority: 'medium',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '3',
    company: 'Company 3',
    sector: 'Finance',
    stage: 'term-sheet',
    value: 8000000,
    probability: 40,
    leadPartner: 'David Brown',
    team: ['David Brown'],
    lastActivity: new Date(),
    nextStep: 'Term sheet negotiation',
    status: 'active',
    people: mockPeople,
    sentiment: 'bad',
    priority: 'low',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '4',
    company: 'Company 4',
    sector: 'Manufacturing',
    stage: 'closing',
    value: 2000000,
    probability: 90,
    leadPartner: 'Lisa Davis',
    team: ['Lisa Davis', 'Tom Anderson'],
    lastActivity: new Date(),
    nextStep: 'Final closing documents',
    status: 'active',
    people: mockPeople,
    sentiment: 'good',
    priority: 'high',
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

export default function DealPipeline({ 
  deals, 
  loading, 
  error, 
  onRefresh, 
  onEditDeal, 
  onDeleteDeal 
}: DealPipelineProps) {
  const navigate = useNavigate();
  const [expandedDeals, setExpandedDeals] = useState<Set<string>>(new Set());
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'pipeline' | 'tabs'>('pipeline');
  const [companyModalOpen, setCompanyModalOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<DealWithContacts | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Drag and drop state
  const [draggedDeal, setDraggedDeal] = useState<DealWithContacts | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  
  // Email state management
  const [outlookEmails, setOutlookEmails] = useState<OutlookEmail[]>([]);
  const [emailsLoading, setEmailsLoading] = useState(false);
  const [emailsError, setEmailsError] = useState<string | null>(null);

  // Transform API deals to include mock people data for now
  const dealsWithContacts: DealWithContacts[] = deals.map(deal => ({
    ...deal,
    people: mockPeople // This will be replaced with real contact data later
  }));

  // Fetch Outlook emails on component mount
  useEffect(() => {
    fetchOutlookEmails();
  }, []);

  const fetchOutlookEmails = async () => {
    try {
      setEmailsLoading(true);
      setEmailsError(null);
      // Get deal-related emails with categorization
      const categorizedEmails = await emailCategorizationService.getDealRelatedEmails(50);
      setOutlookEmails(categorizedEmails);
    } catch (error: any) {
      console.error('Error fetching emails:', error);
      
      // Provide more specific error messages
      if (error.message?.includes('No email integration connected')) {
        setEmailsError('Please connect Gmail or Microsoft Outlook in Settings to view deal emails');
      } else if (error.response?.status === 401 || error.response?.status === 404) {
        setEmailsError('Please connect an email account (Gmail or Outlook) in Settings to view deal emails');
      } else if (error.message?.includes('No active Microsoft integration')) {
        setEmailsError('No email integration found. Please connect Gmail or Outlook in Settings');
      } else {
        setEmailsError('Failed to fetch emails. Please connect Gmail or Outlook in Settings');
      }
    } finally {
      setEmailsLoading(false);
    }
  };

  const handleEmailReply = (email: OutlookEmail) => {
    // TODO: Implement email reply functionality
    console.log('Reply to email:', email);
  };

  const handleEmailForward = (email: OutlookEmail) => {
    // TODO: Implement email forward functionality
    console.log('Forward email:', email);
  };

  const handleEmailMarkAsRead = async (emailId: string) => {
    try {
      await integrationService.markOutlookAsRead(emailId);
      setOutlookEmails(prev => 
        prev.map(email => 
          email.id === emailId ? { ...email, isRead: !email.isRead } : email
        )
      );
    } catch (error) {
      console.error('Error marking email as read:', error);
    }
  };

  const handleEmailStar = (emailId: string) => {
    // TODO: Implement email starring functionality
    console.log('Star email:', emailId);
  };

  const handleEmailDelete = (emailId: string) => {
    // TODO: Implement email deletion functionality
    console.log('Delete email:', emailId);
  };

  const handleCreateDealFromEmail = (email: OutlookEmail) => {
    // TODO: Implement create deal from email functionality
    console.log('Create deal from email:', email);
  };

  const getDealsForStage = (stageValue: string) => {
    // Use only real Firebase deals
    const allDeals = dealsWithContacts;

    if (stageValue === 'all') {
      return allDeals.filter(deal => deal.status === 'active');
    }
    // For now, we'll use the existing stage field to map to our new stages
    // This is a simplified mapping - you may want to update your data model
    return allDeals.filter(deal => {
      switch (stageValue) {
        case 'response-received':
          return deal.stage === 'prospect' || deal.stage === 'due-diligence';
        case 'initial-diligence':
          return deal.stage === 'due-diligence' || deal.stage === 'term-sheet';
        case 'ioi-loi':
          return deal.stage === 'term-sheet' || deal.stage === 'closing';
        default:
          return false;
      }
    });
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'good':
        return <SentimentGoodIcon sx={{ color: '#4caf50', fontSize: 20 }} />;
      case 'bad':
        return <SentimentBadIcon sx={{ color: '#f44336', fontSize: 20 }} />;
      case 'neutral':
        return <SentimentNeutralIcon sx={{ color: '#ff9800', fontSize: 20 }} />;
      default:
        return <SentimentNeutralIcon sx={{ color: '#9e9e9e', fontSize: 20 }} />;
    }
  };

  // Drag and drop handlers
  const handleDragStart = (event: React.DragEvent, deal: DealWithContacts) => {
    setDraggedDeal(deal);
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', deal.id);
  };

  const handleDragEnd = () => {
    setDraggedDeal(null);
    setDragOverStage(null);
  };

  const handleDragOver = (event: React.DragEvent, stageValue: string) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    setDragOverStage(stageValue);
  };

  const handleDragLeave = () => {
    setDragOverStage(null);
  };

  const handleDrop = async (event: React.DragEvent, targetStage: string) => {
    event.preventDefault();
    setDragOverStage(null);

    if (!draggedDeal) return;

    try {
      // Map our pipeline stages to the API stage values
      let newStage = draggedDeal.stage;
      switch (targetStage) {
        case 'response-received':
          newStage = 'prospect';
          break;
        case 'initial-diligence':
          newStage = 'due-diligence';
          break;
        case 'ioi-loi':
          newStage = 'term-sheet';
          break;
        default:
          return;
      }

      // Update the deal stage via API
      await dealsApi.updateDeal(draggedDeal.id, { stage: newStage });
      
      setSnackbarMessage(`Deal moved to ${stages.find(s => s.value === targetStage)?.label}`);
      setSnackbarOpen(true);
      
      // Refresh the deals list
      onRefresh();
    } catch (error) {
      console.error('Error updating deal stage:', error);
      setSnackbarMessage('Failed to move deal');
      setSnackbarOpen(true);
    }
  };

  const handleCompanyClick = (deal: DealWithContacts) => {
    setSelectedCompany(deal);
    setCompanyModalOpen(true);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, dealId: string) => {
    setAnchorEl(event.currentTarget);
    setSelectedDealId(dealId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedDealId(null);
  };

  const handleDeleteDeal = () => {
    setDeleteConfirmOpen(true);
    handleMenuClose();
  };

  const handleConfirmDelete = async () => {
    if (selectedDealId) {
      try {
        await dealsApi.deleteDeal(selectedDealId);
        onRefresh();
        setDeleteConfirmOpen(false);
      } catch (error) {
        console.error('Error deleting deal:', error);
      }
    }
  };

  const handleCancelDelete = () => {
    setDeleteConfirmOpen(false);
  };

  const toggleDealExpansion = (dealId: string) => {
    setExpandedDeals(prev => {
      const newSet = new Set(prev);
      if (newSet.has(dealId)) {
        newSet.delete(dealId);
      } else {
        newSet.add(dealId);
      }
      return newSet;
    });
  };

  const getRelationshipScoreColor = (score: number) => {
    if (score >= 80) return 'success.main';
    if (score >= 60) return 'warning.main';
    return 'error.main';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'hot': return 'error.main';
      case 'warm': return 'warning.main';
      case 'cold': return 'info.main';
      default: return 'text.secondary';
    }
  };

  const DealCard = ({ deal }: { deal: DealWithContacts }) => {
    const isExpanded = expandedDeals.has(deal.id);

    return (
      <Card
        draggable
        onDragStart={(e) => handleDragStart(e, deal)}
        onDragEnd={handleDragEnd}
        sx={{
          mb: 2,
          transition: 'all 0.3s ease',
          cursor: 'grab',
          bgcolor: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: 3,
          opacity: draggedDeal?.id === deal.id ? 0.5 : 1,
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
            borderColor: '#10b981'
          },
          '&:active': {
            cursor: 'grabbing'
          }
        }}
        onClick={() => handleCompanyClick(deal)}
      >
        <CardContent sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Avatar sx={{ bgcolor: '#000000' }}>
                {deal.company.charAt(0)}
              </Avatar>
              {getSentimentIcon(deal.sentiment || 'neutral')}
            </Box>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <Tooltip title={isExpanded ? "Hide contacts" : "Show contacts"}>
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleDealExpansion(deal.id);
                  }}
                  sx={{ 
                    bgcolor: isExpanded ? '#000000' : 'transparent',
                    color: isExpanded ? 'white' : 'text.secondary',
                    '&:hover': {
                      bgcolor: isExpanded ? '#333333' : 'action.hover'
                    }
                  }}
                >
                  {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
          
          <Typography 
            variant="h6" 
            sx={{ 
              fontWeight: 600, 
              mb: 1, 
              color: '#1f2937',
              fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              letterSpacing: '-0.01em'
            }}
          >
            {deal.company}
          </Typography>
          
          <Typography 
            variant="body2" 
            sx={{ 
              mb: 2, 
              color: '#6b7280',
              fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              fontWeight: 500
            }}
          >
            {deal.sector}
          </Typography>
          
          <Box sx={{ mb: 2 }}>
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 700, 
                color: '#10b981',
                fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                letterSpacing: '-0.01em'
              }}
            >
              ${((deal.value || 0) / 1000000).toFixed(1)}M
            </Typography>
            <Typography 
              variant="caption" 
              sx={{ 
                color: '#6b7280',
                fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                fontWeight: 500
              }}
            >
              Deal Value
            </Typography>
          </Box>
          
          <Box sx={{ mb: 2 }}>
            <Typography 
              variant="caption" 
              sx={{ 
                color: '#6b7280',
                fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                fontWeight: 500
              }}
            >
              Lead Partner
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                color: '#1f2937',
                fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                fontWeight: 500
              }}
            >
              {deal.leadPartner}
            </Typography>
          </Box>
          
          <Box>
            <Typography 
              variant="caption" 
              sx={{ 
                color: '#6b7280',
                fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                fontWeight: 500
              }}
            >
              Next Step
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                color: '#1f2937',
                fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                fontWeight: 500
              }}
            >
              {deal.nextStep}
            </Typography>
          </Box>

          {/* Contact Count Indicator */}
          {!isExpanded && deal.people.length > 0 && (
            <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <PersonIcon fontSize="small" sx={{ color: '#6b7280' }} />
              <Typography 
                variant="caption" 
                sx={{ 
                  color: '#6b7280',
                  fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                  fontWeight: 500
                }}
              >
                {deal.people.length} contact{deal.people.length !== 1 ? 's' : ''} - Click expand to view details
              </Typography>
            </Box>
          )}

          {/* Expanded People Section */}
          {isExpanded && (
            <Box sx={{ 
              mt: 3, 
              p: 2, 
              bgcolor: '#f5f5f5', 
              borderRadius: 2,
              border: '1px solid',
              borderColor: '#e0e0e0'
            }}>
              <Typography variant="subtitle1" sx={{ 
                fontWeight: 600, 
                mb: 2, 
                display: 'flex', 
                alignItems: 'center',
                color: 'primary.contrastText'
              }}>
                <PersonIcon sx={{ mr: 1, fontSize: 20 }} />
                Key Contacts ({deal.people.length})
              </Typography>
              
              {deal.people.map((person) => (
                <Box
                  key={person.id}
                  sx={{
                    p: 2,
                    mb: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 2,
                    bgcolor: 'background.paper',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                      transform: 'translateY(-1px)'
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        {person.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {person.role}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      <Chip
                        label={person.status}
                        size="small"
                        sx={{
                          bgcolor: `${getStatusColor(person.status)}20`,
                          color: getStatusColor(person.status),
                          border: `1px solid ${getStatusColor(person.status)}`
                        }}
                      />
                    </Box>
                  </Box>

                  {/* Relationship Score */}
                  <Box sx={{ mb: 2, p: 1.5, bgcolor: 'background.default', borderRadius: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        Relationship Score
                      </Typography>
                      <Chip
                        label={`${person.relationshipScore}/100`}
                        size="small"
                        sx={{
                          bgcolor: `${getRelationshipScoreColor(person.relationshipScore)}20`,
                          color: getRelationshipScoreColor(person.relationshipScore),
                          border: `1px solid ${getRelationshipScoreColor(person.relationshipScore)}`,
                          fontWeight: 600
                        }}
                      />
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={person.relationshipScore}
                      sx={{
                        height: 6,
                        borderRadius: 3,
                        bgcolor: 'rgba(255,255,255,0.1)',
                        '& .MuiLinearProgress-bar': {
                          borderRadius: 3,
                          bgcolor: getRelationshipScoreColor(person.relationshipScore)
                        }
                      }}
                    />
                  </Box>

                  {/* Contact Info */}
                  <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <EmailIcon fontSize="small" color="action" />
                      <Typography variant="caption">{person.email}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <PhoneIcon fontSize="small" color="action" />
                      <Typography variant="caption">{person.phone}</Typography>
                    </Box>
                  </Box>

                  {/* Summary */}
                  <Box sx={{ mb: 2, p: 1.5, bgcolor: 'background.default', borderRadius: 1 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block', fontWeight: 600 }}>
                      Relationship Summary:
                    </Typography>
                    <Typography variant="body2" sx={{ fontStyle: 'italic', lineHeight: 1.5 }}>
                      {person.summary}
                    </Typography>
                  </Box>

                  {/* Citations */}
                  <Box sx={{ p: 1.5, bgcolor: 'background.default', borderRadius: 1 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block', fontWeight: 600 }}>
                      Interaction History:
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Chip
                        icon={<EmailIcon />}
                        label={`${person.citations.emails} emails`}
                        size="small"
                        variant="outlined"
                        sx={{ 
                          bgcolor: '#f5f5f5', 
                          color: '#000000',
                          cursor: 'pointer',
                          '&:hover': { bgcolor: '#e0e0e0' }
                        }}
                      />
                      <Chip
                        icon={<PhoneIcon />}
                        label={`${person.citations.calls} calls`}
                        size="small"
                        variant="outlined"
                        sx={{ 
                          bgcolor: '#f5f5f5', 
                          color: '#000000',
                          cursor: 'pointer',
                          '&:hover': { bgcolor: '#e0e0e0' }
                        }}
                      />
                      <Chip
                        icon={<PersonIcon />}
                        label={`${person.citations.meetings} meetings`}
                        size="small"
                        variant="outlined"
                        sx={{ 
                          bgcolor: '#f5f5f5', 
                          color: '#000000',
                          cursor: 'pointer',
                          '&:hover': { bgcolor: '#e0e0e0' }
                        }}
                      />
                      <Chip
                        icon={<AttachFileIcon />}
                        label={`${person.citations.documents} docs`}
                        size="small"
                        variant="outlined"
                        sx={{ 
                          bgcolor: 'info.light', 
                          color: 'info.contrastText',
                          cursor: 'pointer',
                          '&:hover': { bgcolor: 'info.main' }
                        }}
                      />
                    </Box>
                  </Box>
                </Box>
              ))}
            </Box>
          )}
        </CardContent>
        
        <CardActions sx={{ px: 2, pb: 2 }}>
          <AvatarGroup max={3} sx={{ flexGrow: 1, '& .MuiAvatar-root': { width: 24, height: 24, fontSize: 10 } }}>
            {deal.team?.map((member, index) => (
              <Avatar key={index}>{member?.split(' ').map(n => n[0]).join('') || 'N/A'}</Avatar>
            ))}
          </AvatarGroup>
          <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleMenuOpen(e, deal.id); }}>
            <MoreVertIcon fontSize="small" />
          </IconButton>
        </CardActions>
      </Card>
    );
  };

  return (
    <Box sx={{ bgcolor: '#f8f9fa', minHeight: '100vh' }}>
      {/* Pipeline Header with Black/Grey Gradient */}
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
                Deal Pipeline
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
                Track and manage your deal flow
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Search Bar */}
      <Box sx={{ mb: 3, px: 3 }}>
        <TextField
          placeholder="Search deals..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          fullWidth
          sx={{
            '& .MuiOutlinedInput-root': {
              bgcolor: '#ffffff',
              border: '2px solid #e5e7eb',
              borderRadius: 3,
              fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              '&:hover': {
                borderColor: '#9CA3AF'
              },
              '&.Mui-focused': {
                borderColor: '#000000',
                boxShadow: '0 0 0 3px rgba(0, 0, 0, 0.1)'
              }
            },
            '& .MuiInputBase-input': {
              fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              fontWeight: 400
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

      {/* Conditional Views */}
      {viewMode === 'pipeline' ? (
        /* Pipeline Columns View */
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
            const stageDeals = getDealsForStage(stage.value).filter(deal => 
              searchTerm === '' || deal.company.toLowerCase().includes(searchTerm.toLowerCase())
            );
            const totalValue = stageDeals.reduce((sum, deal) => sum + (deal.value || 0), 0);
            
            return (
              <Paper
                key={stage.value}
                onDragOver={(e) => handleDragOver(e, stage.value)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, stage.value)}
                sx={{
                  flex: 1,
                  minWidth: 0,
                  maxWidth: '25%',
                  p: 0,
                  borderRadius: '12px',
                  border: '1px solid #e5e7eb',
                  bgcolor: dragOverStage === stage.value ? '#f0fdf4' : '#ffffff',
                  boxShadow: dragOverStage === stage.value 
                    ? '0 4px 12px rgba(16, 185, 129, 0.2)' 
                    : '0 2px 8px rgba(0,0,0,0.05)',
                  transition: 'all 0.2s ease',
                  cursor: dragOverStage === stage.value ? 'pointer' : 'default',
                  overflow: 'hidden'
                }}
              >
                {/* Stage Header */}
                <Box sx={{
                  background: 'linear-gradient(180deg, #2c2c2c 0%, #1a1a1a 100%)',
                  color: 'white',
                  py: 2,
                  px: 2,
                  borderRadius: '12px 12px 0 0',
                  mb: 2,
                  borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        fontWeight: 400, 
                        fontSize: '1.25rem',
                        color: 'white',
                        fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                        letterSpacing: '-0.01em'
                      }}
                    >
                      {stage.label}
                    </Typography>
                    <Chip
                      label={`${stageDeals.length} deal${stageDeals.length !== 1 ? 's' : ''}`}
                      size="small"
                      sx={{
                        bgcolor: '#f97316',
                        color: 'white',
                        fontSize: '0.75rem',
                        fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                        fontWeight: 500
                      }}
                    />
                  </Box>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      fontSize: '0.9rem', 
                      color: 'rgba(255, 255, 255, 0.8)',
                      lineHeight: 1.5,
                      fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                      letterSpacing: '-0.01em'
                    }}
                  >
                    ${(totalValue / 1000000).toFixed(1)}M total value
                  </Typography>
                </Box>

                {/* Stage Deals */}
                <Box sx={{ minHeight: 400, p: 1.5 }}>
                  {stageDeals.length === 0 ? (
                    stage.value === 'all' && outlookEmails.length > 0 ? (
                      <Box>
                        {emailsLoading ? (
                          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                            <CircularProgress />
                          </Box>
                        ) : emailsError ? (
                          <Alert severity="error">
                            {emailsError}
                          </Alert>
                        ) : (
                          <Box>
                            {outlookEmails.slice(0, 10).map((email) => (
                              <OutlookEmailCard
                                key={email.id}
                                email={email}
                                onReply={handleEmailReply}
                                onForward={handleEmailForward}
                                onMarkAsRead={handleEmailMarkAsRead}
                                onStar={handleEmailStar}
                                onDelete={handleEmailDelete}
                                onCreateDeal={handleCreateDealFromEmail}
                              />
                            ))}
                          </Box>
                        )}
                      </Box>
                    ) : (
                      <Box sx={{ 
                        textAlign: 'center', 
                        py: 8,
                        border: '2px dashed',
                        borderColor: 'divider',
                        borderRadius: 2,
                        bgcolor: 'background.default'
                      }}>
                        <BusinessIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: '#6b7280',
                            fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                            fontWeight: 500
                          }}
                        >
                          No deals in this stage
                        </Typography>
                      </Box>
                    )
                  ) : (
                    stageDeals.map((deal) => (
                      <DealCard key={deal.id} deal={deal} />
                    ))
                  )}
                </Box>
              </Paper>
            );
          })}
        </Box>
      ) : (
        /* Tabs View */
        <Box>
          <Tabs value={0} sx={{ mb: 3, borderBottom: '1px solid #e0e0e0' }}>
            <Tab label="All Deals" />
            <Tab label="Response Received" />
            <Tab label="Initial Diligence" />
            <Tab label="IOI/LOI" />
          </Tabs>
          
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 2 }}>
            {sampleDeals.filter(deal => 
              searchTerm === '' || deal.company.toLowerCase().includes(searchTerm.toLowerCase())
            ).map((deal) => (
              <DealCard key={deal.id} deal={deal} />
            ))}
          </Box>
        </Box>
      )}

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => { navigate(`/deals/${selectedDealId}`); handleMenuClose(); }}>
          <ListItemIcon>
            <VisibilityIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>View Details</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => {
          const deal = deals.find(d => d.id === selectedDealId);
          if (deal) onEditDeal(deal);
          handleMenuClose();
        }}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit Deal</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <ListItemIcon>
            <PersonIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Add Contact</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <ListItemIcon>
            <AttachFileIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Add Activity</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <ListItemIcon>
            <TrendingUpIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Generate Report</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleDeleteDeal} sx={{ color: 'error.main' }}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Delete Deal</ListItemText>
        </MenuItem>
      </Menu>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={handleCancelDelete}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this deal? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDelete}>Cancel</Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Company Details Modal */}
      <Dialog
        open={companyModalOpen}
        onClose={() => setCompanyModalOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            maxHeight: '80vh'
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
            <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}>
              {selectedCompany?.company?.charAt(0)}
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {selectedCompany?.company}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                {selectedCompany?.sector} • ${((selectedCompany?.value || 0) / 1000000).toFixed(1)}M
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={() => setCompanyModalOpen(false)} sx={{ color: 'white' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 0 }}>
          {selectedCompany && (
            <Box>
              <Tabs value={0} sx={{ borderBottom: '1px solid #e0e0e0' }}>
                <Tab label="Emails" />
                <Tab label="Sentiment" />
                <Tab label="Contacts" />
                <Tab label="Documents" />
              </Tabs>
              
              <Box sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Company Details
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2, mb: 3 }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Lead Partner</Typography>
                    <Typography variant="body1">{selectedCompany.leadPartner}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Probability</Typography>
                    <Typography variant="body1">{selectedCompany.probability}%</Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Next Step</Typography>
                    <Typography variant="body1">{selectedCompany.nextStep}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Last Activity</Typography>
                    <Typography variant="body1">{selectedCompany.lastActivity?.toLocaleDateString() || 'N/A'}</Typography>
                  </Box>
                </Box>
                
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Team Members
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {selectedCompany.team?.map((member, index) => (
                    <Chip key={index} label={member} size="small" />
                  ))}
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
      </Dialog>

      {/* Snackbar for drag and drop feedback */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setSnackbarOpen(false)} 
          severity="success" 
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}
