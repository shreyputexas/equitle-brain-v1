import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  InputAdornment,
  Tabs,
  Tab,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  AvatarGroup,
  Tooltip,
  LinearProgress,
  Grid,
  Card,
  CardContent,
  CardActions,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Badge,
  CircularProgress,
  Alert
} from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import {
  Add as AddIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  MoreVert as MoreVertIcon,
  AttachMoney as MoneyIcon,
  TrendingUp as TrendingUpIcon,
  Schedule as ScheduleIcon,
  Business as BusinessIcon,
  ViewKanban as KanbanIcon,
  ViewList as ListView,
  Edit as EditIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  AttachFile as AttachFileIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Folder as FolderIcon,
  Visibility as VisibilityIcon,
  Download as DownloadIcon,
  CalendarToday as CalendarIcon,
  AccessTime as TimeIcon,
  Close as CloseIcon,
  Reply as ReplyIcon,
  Forward as ForwardIcon,
  VideoCall as VideoCallIcon,
  Description as DescriptionIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useDeals } from '../hooks/useDeals';
import { Deal as ApiDeal } from '../services/dealsApi';
import NewDealModal from '../components/NewDealModal';
import EditDealModal from '../components/EditDealModal';

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

interface Deal {
  id: string;
  company: string;
  sector?: string;
  stage: string;
  value?: number;
  probability?: number;
  leadPartner: string;
  team: string[];
  lastActivity: Date;
  nextStep: string;
  status: 'active' | 'paused' | 'closed' | 'lost';
  people: Person[];
}

interface DealWithContacts extends ApiDeal {
  people: Person[];
}

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

const stages = [
  { value: 'prospect', label: 'Initial Review' },
  { value: 'due-diligence', label: 'Due Diligence' },
  { value: 'term-sheet', label: 'Term Sheet' },
  { value: 'closing', label: 'Closing' },
  { value: 'closed', label: 'Closed' }
];
const stageColors: Record<string, string> = {
  'prospect': '#000000',
  'due-diligence': '#000000',
  'term-sheet': '#000000',
  'closing': '#000000',
  'closed': '#000000'
};

export default function Deals() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null);
  const [expandedDeals, setExpandedDeals] = useState<Set<string>>(new Set());
  const [editingPerson, setEditingPerson] = useState<string | null>(null);
  const [interactionModalOpen, setInteractionModalOpen] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [newDealModalOpen, setNewDealModalOpen] = useState(false);
  const [editDealModalOpen, setEditDealModalOpen] = useState(false);
  const [dealToEdit, setDealToEdit] = useState<ApiDeal | null>(null);

  // Use real API for deals data
  const { deals: apiDeals, loading, error, total, refreshDeals } = useDeals();

  // Transform API deals to include mock people data for now
  const deals: DealWithContacts[] = apiDeals.map(deal => ({
    ...deal,
    people: mockPeople // This will be replaced with real contact data later
  }));

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, dealId: string) => {
    setAnchorEl(event.currentTarget);
    setSelectedDealId(dealId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedDealId(null);
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

  const handleOpenInteractionModal = (person: Person, deal: Deal) => {
    setSelectedPerson(person);
    setSelectedDeal(deal);
    setInteractionModalOpen(true);
  };

  const handleCloseInteractionModal = () => {
    setInteractionModalOpen(false);
    setSelectedPerson(null);
    setSelectedDeal(null);
  };

  const handleEditDeal = (deal: ApiDeal) => {
    setDealToEdit(deal);
    setEditDealModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setEditDealModalOpen(false);
    setDealToEdit(null);
  };

  const columns: GridColDef[] = [
    {
      field: 'company',
      headerName: 'Company',
      width: 200,
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Avatar sx={{ width: 32, height: 32, mr: 2, bgcolor: '#000000' }}>
            {params.value.charAt(0)}
          </Avatar>
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {params.value}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {params.row.people.length} contact{params.row.people.length !== 1 ? 's' : ''}
            </Typography>
          </Box>
        </Box>
      )
    },
    {
      field: 'sector',
      headerName: 'Sector',
      width: 130,
      renderCell: (params: GridRenderCellParams) => (
        <Chip 
          label={params.value} 
          size="small" 
          sx={{ 
            bgcolor: '#f5f5f5', 
            color: '#000000',
            border: '1px solid #e0e0e0'
          }} 
        />
      )
    },
    {
      field: 'stage',
      headerName: 'Stage',
      width: 140,
      renderCell: (params: GridRenderCellParams) => {
        const stage = stages.find(s => s.value === params.value);
        return (
          <Chip
            label={stage?.label || params.value}
            size="small"
            sx={{
              bgcolor: '#f5f5f5',
              color: '#000000',
              border: '1px solid #e0e0e0'
            }}
          />
        );
      }
    },
    {
      field: 'value',
      headerName: 'Value',
      width: 130,
      renderCell: (params: GridRenderCellParams) => (
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          ${(params.value / 1000000).toFixed(1)}M
        </Typography>
      )
    },
    {
      field: 'probability',
      headerName: 'Probability',
      width: 130,
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ width: '100%' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="caption">{params.value}%</Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={params.value}
            sx={{
              height: 4,
              borderRadius: 2,
              bgcolor: 'rgba(255,255,255,0.05)',
              '& .MuiLinearProgress-bar': {
                borderRadius: 2,
                background: 'linear-gradient(90deg, #9e9e9e 0%, #000000 100%)'
              }
            }}
          />
        </Box>
      )
    },
    {
      field: 'keyContacts',
      headerName: 'Key Contacts',
      width: 300,
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {params.row.people.slice(0, 2).map((person: Person) => (
            <Box key={person.id} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Avatar sx={{ width: 24, height: 24, fontSize: 10 }}>
                {person.name.split(' ').map((n: string) => n[0]).join('')}
              </Avatar>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="caption" sx={{ fontWeight: 600, display: 'block' }}>
                  {person.name}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                  {person.role}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Chip
                  label={person.status}
                  size="small"
                  sx={{
                    bgcolor: `${getStatusColor(person.status)}20`,
                    color: getStatusColor(person.status),
                    border: `1px solid ${getStatusColor(person.status)}`,
                    fontSize: '0.6rem',
                    height: 16
                  }}
                />
                <Typography variant="caption" sx={{ 
                  color: getRelationshipScoreColor(person.relationshipScore),
                  fontWeight: 600,
                  minWidth: 35
                }}>
                  {person.relationshipScore}
                </Typography>
              </Box>
            </Box>
          ))}
          {params.row.people.length > 2 && (
            <Typography variant="caption" color="text.secondary">
              +{params.row.people.length - 2} more contacts
            </Typography>
          )}
        </Box>
      )
    },
    {
      field: 'team',
      headerName: 'Team',
      width: 150,
      renderCell: (params: GridRenderCellParams) => (
        <AvatarGroup max={3} sx={{ '& .MuiAvatar-root': { width: 28, height: 28, fontSize: 12 } }}>
          <Avatar>{params.row.leadPartner.split(' ').map((n: string) => n[0]).join('')}</Avatar>
          {params.value.map((member: string, index: number) => (
            <Avatar key={index}>{member.split(' ').map((n: string) => n[0]).join('')}</Avatar>
          ))}
        </AvatarGroup>
      )
    },
    {
      field: 'relationshipSummary',
      headerName: 'Relationship Summary',
      width: 250,
      renderCell: (params: GridRenderCellParams) => {
        const topContact = params.row.people.reduce((top: Person, person: Person) => 
          person.relationshipScore > top.relationshipScore ? person : top, params.row.people[0]
        );
        
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            <Typography variant="caption" sx={{ fontWeight: 600, color: '#000000' }}>
              {topContact.name} ({topContact.relationshipScore}/100)
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ 
              lineHeight: 1.3,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}>
              {topContact.summary}
            </Typography>
          </Box>
        );
      }
    },
    {
      field: 'interactionHistory',
      headerName: 'Interaction History',
      width: 200,
      renderCell: (params: GridRenderCellParams) => {
        const totalEmails = params.row.people.reduce((sum: number, person: Person) => sum + person.citations.emails, 0);
        const totalCalls = params.row.people.reduce((sum: number, person: Person) => sum + person.citations.calls, 0);
        const totalMeetings = params.row.people.reduce((sum: number, person: Person) => sum + person.citations.meetings, 0);
        const totalDocs = params.row.people.reduce((sum: number, person: Person) => sum + person.citations.documents, 0);
        
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Chip
                icon={<EmailIcon />}
                label={totalEmails}
                size="small"
                variant="outlined"
                clickable
                onClick={(e) => {
                  e.stopPropagation();
                  const topContact = params.row.people.reduce((top: Person, person: Person) => 
                    person.citations.emails > top.citations.emails ? person : top, params.row.people[0]
                  );
                  handleOpenInteractionModal(topContact, params.row);
                }}
                sx={{ fontSize: '0.6rem', height: 20, cursor: 'pointer' }}
              />
              <Chip
                icon={<PhoneIcon />}
                label={totalCalls}
                size="small"
                variant="outlined"
                clickable
                onClick={(e) => {
                  e.stopPropagation();
                  const topContact = params.row.people.reduce((top: Person, person: Person) => 
                    person.citations.calls > top.citations.calls ? person : top, params.row.people[0]
                  );
                  handleOpenInteractionModal(topContact, params.row);
                }}
                sx={{ fontSize: '0.6rem', height: 20, cursor: 'pointer' }}
              />
            </Box>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Chip
                icon={<PersonIcon />}
                label={totalMeetings}
                size="small"
                variant="outlined"
                clickable
                onClick={(e) => {
                  e.stopPropagation();
                  const topContact = params.row.people.reduce((top: Person, person: Person) => 
                    person.citations.meetings > top.citations.meetings ? person : top, params.row.people[0]
                  );
                  handleOpenInteractionModal(topContact, params.row);
                }}
                sx={{ fontSize: '0.6rem', height: 20, cursor: 'pointer' }}
              />
              <Chip
                icon={<AttachFileIcon />}
                label={totalDocs}
                size="small"
                variant="outlined"
                clickable
                onClick={(e) => {
                  e.stopPropagation();
                  const topContact = params.row.people.reduce((top: Person, person: Person) => 
                    person.citations.documents > top.citations.documents ? person : top, params.row.people[0]
                  );
                  handleOpenInteractionModal(topContact, params.row);
                }}
                sx={{ fontSize: '0.6rem', height: 20, cursor: 'pointer' }}
              />
            </Box>
          </Box>
        );
      }
    },
    {
      field: 'lastActivity',
      headerName: 'Last Activity',
      width: 130,
      renderCell: (params: GridRenderCellParams) => (
        <Typography variant="caption" color="text.secondary">
          {new Date(params.value).toLocaleDateString()}
        </Typography>
      )
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 100,
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Tooltip title="Edit Deal">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                handleEditDeal(params.row);
              }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="More Options">
            <IconButton
              size="small"
              onClick={(e) => handleMenuOpen(e, params.row.id)}
            >
              <MoreVertIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      )
    }
  ];

  const filteredDeals = deals.filter(deal => {
    const matchesSearch = searchTerm === '' ||
      deal.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (deal.sector && deal.sector.toLowerCase().includes(searchTerm.toLowerCase())) ||
      deal.stage.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (activeTab === 1) return deal.status === 'active';
    if (activeTab === 2) return deal.stage === 'due-diligence';
    if (activeTab === 3) return deal.status === 'closed';
    return true;
  });

  // Calculate summary statistics from real data
  const totalPipelineValue = deals.reduce((sum, deal) => sum + (deal.value || 0), 0);
  const avgProbability = deals.length > 0 ? Math.round(deals.reduce((sum, deal) => sum + (deal.probability || 0), 0) / deals.length) : 0;
  const activeDealCount = deals.filter(d => d.status === 'active').length;

  const DealCard = ({ deal }: { deal: DealWithContacts }) => {
    const isExpanded = expandedDeals.has(deal.id);
    
    return (
      <Card
        sx={{
          height: '100%',
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 12px 24px rgba(0,0,0,0.2)'
          }
        }}
      >
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Avatar sx={{ bgcolor: '#000000' }}>
              {deal.company.charAt(0)}
            </Avatar>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <Chip
                label={stages.find(s => s.value === deal.stage)?.label || deal.stage}
                size="small"
                sx={{
                  bgcolor: '#f5f5f5',
                  color: '#000000',
                  border: '1px solid #e0e0e0'
                }}
              />
              <Tooltip title={isExpanded ? "Hide contacts" : "Show contacts"}>
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleDealExpansion(deal.id);
                  }}
                  sx={{ 
                    ml: 1,
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
          
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
            {deal.company}
          </Typography>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {deal.sector}
          </Typography>
          
          <Box sx={{ mb: 2 }}>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              ${((deal.value || 0) / 1000000).toFixed(1)}M
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Deal Value
            </Typography>
          </Box>
          
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="caption">Probability</Typography>
              <Typography variant="caption">{deal.probability}%</Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={deal.probability}
              sx={{
                height: 6,
                borderRadius: 3,
                bgcolor: 'rgba(255,255,255,0.05)',
                '& .MuiLinearProgress-bar': {
                  borderRadius: 3,
                  background: 'linear-gradient(90deg, #9e9e9e 0%, #000000 100%)'
                }
              }}
            />
          </Box>
          
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" color="text.secondary">
              Lead Partner
            </Typography>
            <Typography variant="body2">
              {deal.leadPartner}
            </Typography>
          </Box>
          
          <Divider sx={{ my: 2 }} />
          
          <Box>
            <Typography variant="caption" color="text.secondary">
              Next Step
            </Typography>
            <Typography variant="body2">
              {deal.nextStep}
            </Typography>
          </Box>

          {/* Contact Count Indicator */}
          {!isExpanded && deal.people.length > 0 && (
            <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <PersonIcon fontSize="small" color="action" />
              <Typography variant="caption" color="text.secondary">
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
                      <IconButton
                        size="small"
                        onClick={() => setEditingPerson(editingPerson === person.id ? null : person.id)}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
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
                        clickable
                        onClick={() => handleOpenInteractionModal(person, deal as Deal)}
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
                        clickable
                        onClick={() => handleOpenInteractionModal(person, deal as Deal)}
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
                        clickable
                        onClick={() => handleOpenInteractionModal(person, deal as Deal)}
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
                        clickable
                        onClick={() => handleOpenInteractionModal(person, deal as Deal)}
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
              <Avatar key={index}>{member.split(' ').map(n => n[0]).join('')}</Avatar>
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
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
            Deal Pipeline
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
            Track and manage all your investment opportunities
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ 
            fontStyle: 'italic',
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}>
            List view shows contact details, relationship scores, and interaction history. Card view: click expand for full details.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setNewDealModalOpen(true)}
          sx={{
            bgcolor: '#000000',
            color: 'white',
            '&:hover': {
              bgcolor: '#333333'
            }
          }}
        >
          New Deal
        </Button>
      </Box>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Avatar sx={{ bgcolor: '#000000', mr: 2 }}>
                <MoneyIcon />
              </Avatar>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 600 }}>
                  ${(totalPipelineValue / 1000000).toFixed(1)}M
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Total Pipeline Value
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Avatar sx={{ bgcolor: '#000000', mr: 2 }}>
                <TrendingUpIcon />
              </Avatar>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 600 }}>
                  {avgProbability}%
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Avg. Probability
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Avatar sx={{ bgcolor: '#000000', mr: 2 }}>
                <ScheduleIcon />
              </Avatar>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 600 }}>
                  45 days
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Avg. Deal Cycle
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Avatar sx={{ bgcolor: 'info.main', mr: 2 }}>
                <BusinessIcon />
              </Avatar>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 600 }}>
                  {activeDealCount}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Active Deals
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <TextField
            placeholder="Search deals..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ flexGrow: 1, mr: 2 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              )
            }}
          />
          <Button startIcon={<FilterIcon />} sx={{ mr: 2 }}>
            Filters
          </Button>
          <Box sx={{ display: 'flex', border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
            <IconButton
              size="small"
              onClick={() => setViewMode('list')}
              sx={{
                borderRadius: 1,
                bgcolor: viewMode === 'list' ? '#000000' : 'transparent',
                color: viewMode === 'list' ? 'white' : 'text.secondary'
              }}
            >
              <ListView />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => setViewMode('grid')}
              sx={{
                borderRadius: 1,
                bgcolor: viewMode === 'grid' ? '#000000' : 'transparent',
                color: viewMode === 'grid' ? 'white' : 'text.secondary'
              }}
            >
              <KanbanIcon />
            </IconButton>
          </Box>
        </Box>

        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          sx={{ mb: 3, borderBottom: '1px solid', borderColor: 'divider' }}
        >
          <Tab label={`All Deals (${deals.length})`} />
          <Tab label={`Active (${activeDealCount})`} />
          <Tab label={`Due Diligence (${deals.filter(d => d.stage === 'due-diligence').length})`} />
          <Tab label={`Closed Won (${deals.filter(d => d.status === 'closed').length})`} />
        </Tabs>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        ) : filteredDeals.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <BusinessIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No deals found
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {searchTerm ? 'Try adjusting your search criteria' : 'Create your first deal to get started'}
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setNewDealModalOpen(true)}
              sx={{
                bgcolor: '#000000',
                color: 'white',
                '&:hover': {
                  bgcolor: '#333333'
                }
              }}
            >
              New Deal
            </Button>
          </Box>
        ) : viewMode === 'list' ? (
          <DataGrid
            rows={filteredDeals}
            columns={columns}
            initialState={{
              pagination: {
                paginationModel: { page: 0, pageSize: 10 }
              }
            }}
            pageSizeOptions={[10, 25, 50]}
            checkboxSelection
            disableRowSelectionOnClick
            onRowClick={(params) => navigate(`/deals/${params.row.id}`)}
            sx={{
              border: 'none',
              '& .MuiDataGrid-cell': {
                borderColor: 'divider',
                padding: '8px 16px'
              },
              '& .MuiDataGrid-row': {
                cursor: 'pointer',
                '&:hover': {
                  bgcolor: 'action.hover'
                }
              },
              '& .MuiDataGrid-columnHeaders': {
                bgcolor: 'background.paper',
                borderBottom: '2px solid',
                borderColor: '#e0e0e0'
              },
              '& .MuiDataGrid-columnHeaderTitle': {
                fontWeight: 600
              }
            }}
            getRowHeight={() => 'auto'}
            autoHeight
          />
        ) : (
          <Grid container spacing={3}>
            {filteredDeals.map((deal) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={deal.id}>
                <DealCard deal={deal} />
              </Grid>
            ))}
          </Grid>
        )}
      </Paper>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => { navigate(`/deals/${selectedDealId}`); handleMenuClose(); }}>
          View Details
        </MenuItem>
        <MenuItem onClick={() => {
          const deal = deals.find(d => d.id === selectedDealId);
          if (deal) handleEditDeal(deal);
          handleMenuClose();
        }}>
          <EditIcon fontSize="small" sx={{ mr: 1 }} />
          Edit Deal
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <PersonIcon fontSize="small" sx={{ mr: 1 }} />
          Add Contact
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <AttachFileIcon fontSize="small" sx={{ mr: 1 }} />
          Add Activity
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <TrendingUpIcon fontSize="small" sx={{ mr: 1 }} />
          Generate Report
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleMenuClose}>Archive Deal</MenuItem>
      </Menu>

      {/* Interaction Details Modal */}
      <Dialog
        open={interactionModalOpen}
        onClose={handleCloseInteractionModal}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            minHeight: '80vh'
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
              {selectedPerson?.name.split(' ').map(n => n[0]).join('')}
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {selectedPerson?.name}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                {selectedDeal?.company} • {selectedPerson?.role}
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={handleCloseInteractionModal} sx={{ color: 'white' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 0 }}>
          {selectedPerson && selectedDeal && (
            <Box>
              {/* Contact Summary */}
              <Box sx={{ p: 3, bgcolor: 'background.default', borderBottom: '1px solid', borderColor: 'divider' }}>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PersonIcon sx={{ color: '#000000' }} />
                      Contact Information
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <EmailIcon fontSize="small" color="action" />
                        <Typography variant="body2">{selectedPerson.email}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PhoneIcon fontSize="small" color="action" />
                        <Typography variant="body2">{selectedPerson.phone}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CalendarIcon fontSize="small" color="action" />
                        <Typography variant="body2">
                          Last Contact: {selectedPerson.lastContact.toLocaleDateString()}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <StarIcon sx={{ color: '#000000' }} />
                      Relationship Status
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2">Relationship Score</Typography>
                          <Typography variant="body2" sx={{ color: getRelationshipScoreColor(selectedPerson.relationshipScore), fontWeight: 600 }}>
                            {selectedPerson.relationshipScore}/100
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={selectedPerson.relationshipScore}
                          sx={{
                            height: 8,
                            borderRadius: 4,
                            bgcolor: 'rgba(0,0,0,0.1)',
                            '& .MuiLinearProgress-bar': {
                              borderRadius: 4,
                              bgcolor: getRelationshipScoreColor(selectedPerson.relationshipScore)
                            }
                          }}
                        />
                      </Box>
                      <Chip
                        label={selectedPerson.status}
                        sx={{
                          bgcolor: `${getStatusColor(selectedPerson.status)}20`,
                          color: getStatusColor(selectedPerson.status),
                          border: `1px solid ${getStatusColor(selectedPerson.status)}`,
                          alignSelf: 'flex-start'
                        }}
                      />
                    </Box>
                  </Grid>
                </Grid>
              </Box>

              {/* Interaction History - Real Data Only */}
              <Box sx={{ p: 3 }}>
                <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
                  Interaction History
                </Typography>

                {/* Email Threads - Empty State */}
                <Accordion defaultExpanded>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Badge badgeContent={0} sx={{ '& .MuiBadge-badge': { bgcolor: '#000000' } }}>
                        <EmailIcon sx={{ color: '#000000' }} />
                      </Badge>
                      <Typography variant="h6">Email Threads</Typography>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <EmailIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                      <Typography variant="h6" color="text.secondary" gutterBottom>
                        No email history found
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        Email history will appear here once Gmail integration is connected and synchronized.
                      </Typography>
                      <Button
                        variant="contained"
                        startIcon={<EmailIcon />}
                        onClick={() => {
                          if (selectedPerson) {
                            window.open(`mailto:${selectedPerson.email}?subject=Follow-up regarding ${selectedDeal?.company}`, '_blank');
                          }
                        }}
                        sx={{
                          bgcolor: '#000000',
                          color: 'white',
                          '&:hover': {
                            bgcolor: '#333333'
                          }
                        }}
                      >
                        Send Email
                      </Button>
                    </Box>
                  </AccordionDetails>
                </Accordion>

                {/* Meeting Notes - Empty State */}
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Badge badgeContent={0} sx={{ '& .MuiBadge-badge': { bgcolor: '#000000' } }}>
                        <VideoCallIcon sx={{ color: '#000000' }} />
                      </Badge>
                      <Typography variant="h6">Meeting Notes</Typography>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <VideoCallIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                      <Typography variant="h6" color="text.secondary" gutterBottom>
                        No meeting notes found
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        Meeting notes will appear here once calendar integration is connected or manually uploaded.
                      </Typography>
                      <Button
                        variant="outlined"
                        startIcon={<VideoCallIcon />}
                        sx={{
                          borderColor: '#000000',
                          color: '#000000',
                          '&:hover': {
                            borderColor: '#333333',
                            bgcolor: 'rgba(0,0,0,0.04)'
                          }
                        }}
                      >
                        Schedule Meeting
                      </Button>
                    </Box>
                  </AccordionDetails>
                </Accordion>

                {/* Documents - Empty State */}
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Badge badgeContent={0} color="info">
                        <DescriptionIcon color="info" />
                      </Badge>
                      <Typography variant="h6">Documents</Typography>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <DescriptionIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                      <Typography variant="h6" color="text.secondary" gutterBottom>
                        No documents uploaded
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        Upload documents related to this contact to keep all information organized.
                      </Typography>
                      <Button
                        variant="outlined"
                        startIcon={<AttachFileIcon />}
                        sx={{
                          borderColor: '#000000',
                          color: '#000000',
                          '&:hover': {
                            borderColor: '#333333',
                            bgcolor: 'rgba(0,0,0,0.04)'
                          }
                        }}
                      >
                        Upload Document
                      </Button>
                    </Box>
                  </AccordionDetails>
                </Accordion>
              </Box>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 3, bgcolor: 'background.default' }}>
          <Button onClick={handleCloseInteractionModal} variant="outlined">
            Close
          </Button>
          <Button
            variant="contained"
            startIcon={<EmailIcon />}
            onClick={() => {
              if (selectedPerson) {
                window.open(`mailto:${selectedPerson.email}?subject=Follow-up regarding ${selectedDeal?.company}`, '_blank');
              }
            }}
            sx={{
              bgcolor: '#000000',
              color: 'white',
              '&:hover': {
                bgcolor: '#333333'
              }
            }}
          >
            Send Email
          </Button>
        </DialogActions>
      </Dialog>

      {/* New Deal Modal */}
      <NewDealModal
        open={newDealModalOpen}
        onClose={() => setNewDealModalOpen(false)}
        onSuccess={refreshDeals}
      />

      {/* Edit Deal Modal */}
      <EditDealModal
        open={editDealModalOpen}
        deal={dealToEdit}
        onClose={handleCloseEditModal}
        onSuccess={() => {
          refreshDeals();
          handleCloseEditModal();
        }}
      />
    </Box>
  );
}