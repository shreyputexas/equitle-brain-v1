import React, { useState } from 'react';
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
  Tab
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
    sentiment: 'good' // good, bad, neutral
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
    sentiment: 'neutral'
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
    sentiment: 'bad'
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
    sentiment: 'good'
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

  // Transform API deals to include mock people data for now
  const dealsWithContacts: DealWithContacts[] = deals.map(deal => ({
    ...deal,
    people: mockPeople // This will be replaced with real contact data later
  }));

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
          
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, color: '#000000' }}>
            {deal.company}
          </Typography>
          
          <Typography variant="body2" sx={{ mb: 2, color: '#000000' }}>
            {deal.sector}
          </Typography>
          
          <Box sx={{ mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#000000' }}>
              ${((deal.value || 0) / 1000000).toFixed(1)}M
            </Typography>
            <Typography variant="caption" sx={{ color: '#000000' }}>
              Deal Value
            </Typography>
          </Box>
          
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" sx={{ color: '#000000' }}>
              Lead Partner
            </Typography>
            <Typography variant="body2" sx={{ color: '#000000' }}>
              {deal.leadPartner}
            </Typography>
          </Box>
          
          <Box>
            <Typography variant="caption" sx={{ color: '#000000' }}>
              Next Step
            </Typography>
            <Typography variant="body2" sx={{ color: '#000000' }}>
              {deal.nextStep}
            </Typography>
          </Box>

          {/* Contact Count Indicator */}
          {!isExpanded && deal.people.length > 0 && (
            <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <PersonIcon fontSize="small" sx={{ color: '#000000' }} />
              <Typography variant="caption" sx={{ color: '#000000' }}>
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
      {/* Pipeline Header */}
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
            Deal Pipeline
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Box sx={{ display: 'flex', border: '1px solid white', borderRadius: 1 }}>
            <Button
              size="small"
              onClick={() => setViewMode('pipeline')}
              sx={{
                bgcolor: viewMode === 'pipeline' ? 'white' : 'transparent',
                color: viewMode === 'pipeline' ? 'black' : 'white',
                minWidth: 'auto',
                px: 1.5,
                py: 0.5,
                fontSize: '0.75rem',
                '&:hover': {
                  bgcolor: viewMode === 'pipeline' ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.1)'
                }
              }}
            >
              Pipeline
            </Button>
            <Button
              size="small"
              onClick={() => setViewMode('tabs')}
              sx={{
                bgcolor: viewMode === 'tabs' ? 'white' : 'transparent',
                color: viewMode === 'tabs' ? 'black' : 'white',
                minWidth: 'auto',
                px: 1.5,
                py: 0.5,
                fontSize: '0.75rem',
                '&:hover': {
                  bgcolor: viewMode === 'tabs' ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.1)'
                }
              }}
            >
              Tabs
            </Button>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {/* Handle new deal */}}
            sx={{
              bgcolor: 'white',
              color: 'black',
              '&:hover': {
                bgcolor: 'rgba(255,255,255,0.9)'
              }
            }}
          >
            New Deal
          </Button>
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
              border: '2px solid #d0d0d0',
              borderRadius: 2,
              '&:hover': {
                borderColor: '#000000',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              },
              '&.Mui-focused': {
                borderColor: '#000000',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
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
                sx={{
                  flex: 1,
                  minWidth: 0,
                  maxWidth: '25%',
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
                      label={`${stageDeals.length} deal${stageDeals.length !== 1 ? 's' : ''}`}
                      size="small"
                      sx={{
                        bgcolor: '#333333',
                        color: 'white',
                        fontSize: '0.75rem'
                      }}
                    />
                  </Box>
                  <Typography variant="body2" sx={{ color: '#666666' }}>
                    ${(totalValue / 1000000).toFixed(1)}M total value
                  </Typography>
                </Box>

                {/* Stage Deals */}
                <Box sx={{ minHeight: 400 }}>
                  {stageDeals.length === 0 ? (
                    <Box sx={{ 
                      textAlign: 'center', 
                      py: 8,
                      border: '2px dashed',
                      borderColor: 'divider',
                      borderRadius: 2,
                      bgcolor: 'background.default'
                    }}>
                      <BusinessIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                      <Typography variant="body2" color="text.secondary">
                        No deals in this stage
                      </Typography>
                    </Box>
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
                    <Typography variant="body1">{selectedCompany.lastActivity.toLocaleDateString()}</Typography>
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
    </Box>
  );
}
