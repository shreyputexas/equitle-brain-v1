import React, { useState, useEffect } from 'react';
import LinkedInOutreach from '../components/LinkedInOutreach';
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
  Description as DescriptionIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useDeals } from '../hooks/useDeals';
import { Deal as ApiDeal } from '../services/dealsApi';
import dealsApi from '../services/dealsApi';
import NewDealModal from '../components/NewDealModal';
import EditDealModal from '../components/EditDealModal';
import DealPipeline from '../components/DealPipeline';
import { emailProcessingApi } from '../services/emailProcessingApi';

type ViewMode = 'grid' | 'list' | 'pipeline';

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
  const [viewMode, setViewMode] = useState<ViewMode>('pipeline');
  const [statusFilter, setStatusFilter] = useState<'prospective' | 'active'>('prospective');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null);
  const [expandedDeals, setExpandedDeals] = useState<Set<string>>(new Set());
  const [editingPerson, setEditingPerson] = useState<string | null>(null);
  const [interactionModalOpen, setInteractionModalOpen] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [newDealModalOpen, setNewDealModalOpen] = useState(false);
  const [editDealModalOpen, setEditDealModalOpen] = useState(false);
  const [dealToEdit, setDealToEdit] = useState<ApiDeal | null>(null);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [scheduledCount, setScheduledCount] = useState(0);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [schedulePickerOpen, setSchedulePickerOpen] = useState(false);
  const [schedulingItemId, setSchedulingItemId] = useState<string | null>(null);
  const [schedulingMultiple, setSchedulingMultiple] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [automatedOutreachItems, setAutomatedOutreachItems] = useState([
    {
      id: '1',
      contact: {
        name: 'Sarah Johnson',
        role: 'CEO',
        company: 'Tech Innovations Inc',
        email: 'sarah.johnson@techinnovations.com',
        phone: '+1 (555) 123-4567'
      },
      research: 'Recently closed $15M Series A. Company focuses on AI-driven analytics for healthcare. Sarah has 15+ years experience in healthtech. Previously worked at major healthcare providers.',
      message: `Hi Sarah,

I noticed Tech Innovations recently closed your Series A round - congratulations on this milestone!

Given your focus on AI-driven healthcare analytics, I wanted to reach out about a potential partnership opportunity. We work with several companies in the healthtech space and have helped them scale their analytics infrastructure.

Would you be open to a brief call next week to explore if there's a potential fit?

Best regards`,
      status: 'pending' as 'pending' | 'approved' | 'declined',
      scheduledDate: undefined as Date | undefined
    },
    {
      id: '2',
      contact: {
        name: 'Michael Chen',
        role: 'VP of Business Development',
        company: 'DataFlow Systems',
        email: 'michael.chen@dataflow.io',
        phone: '+1 (555) 234-5678'
      },
      research: 'DataFlow raised $8M seed round 6 months ago. Specializes in real-time data processing. Michael previously led BD at two successful SaaS exits. Active on LinkedIn discussing data infrastructure.',
      message: `Hi Michael,

I came across DataFlow's recent work in real-time data processing and was impressed by your team's approach to solving latency challenges.

Your background in scaling BD teams at successful SaaS companies caught my attention. I'd love to discuss how we might collaborate on expanding your enterprise customer base.

Are you available for a quick call this week?

Cheers`,
      status: 'pending' as 'pending' | 'approved' | 'declined',
      scheduledDate: undefined as Date | undefined
    },
    {
      id: '3',
      contact: {
        name: 'Emily Rodriguez',
        role: 'Head of Partnerships',
        company: 'CloudSecure Pro',
        email: 'emily@cloudsecurepro.com',
        phone: '+1 (555) 345-6789'
      },
      research: 'CloudSecure recently expanded to European markets. Emily joined 3 months ago from a major cloud security provider. Company has 200+ enterprise clients and growing rapidly. Strong presence at industry conferences.',
      message: `Hi Emily,

Welcome to CloudSecure! I saw your recent move from your previous role and wanted to connect.

With CloudSecure's expansion into Europe and your experience in enterprise partnerships, I believe there could be strong synergies with our network of European security-conscious enterprises.

Would you be interested in exploring potential collaboration opportunities?

Best`,
      status: 'pending' as 'pending' | 'approved' | 'declined',
      scheduledDate: undefined as Date | undefined
    },
    {
      id: '4',
      contact: {
        name: 'David Park',
        role: 'Founder & CTO',
        company: 'QuantumLabs',
        email: 'david@quantumlabs.tech',
        phone: '+1 (555) 456-7890'
      },
      research: 'QuantumLabs developing quantum computing solutions for financial modeling. David has PhD in quantum physics from MIT. Company bootstrapped but seeking Series A investors. Strong technical team of 15 engineers.',
      message: `Hi David,

Your work on quantum computing applications for financial modeling is fascinating. The technical depth of your team and your MIT background suggest you're building something truly innovative.

I'd love to learn more about QuantumLabs' roadmap and discuss potential investment opportunities as you prepare for your Series A.

Would you have time for a conversation?

Regards`,
      status: 'pending' as 'pending' | 'approved' | 'declined',
      scheduledDate: undefined as Date | undefined
    }
  ]);

  // Use real API for deals data
  const { deals: apiDeals, loading, error, total, refreshDeals } = useDeals();

  // Transform API deals to include mock people data for now
  const deals: DealWithContacts[] = apiDeals.map(deal => ({
    ...deal,
    people: mockPeople // This will be replaced with real contact data later
  }));

  // Debug: Log deals data to see what we're working with
  console.log('Deals loading:', loading);
  console.log('Deals error:', error);
  console.log('All deals:', deals);
  console.log('Active deals:', deals.filter(d => d.status === 'active'));
  console.log('Prospective deals:', deals.filter(d => d.status !== 'active' && d.status !== 'closed'));
  console.log('Current activeTab:', activeTab);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, dealId: string) => {
    setAnchorEl(event.currentTarget);
    setSelectedDealId(dealId);
  };


  const handleOpenSchedulePicker = (itemId: string | null, isMultiple: boolean = false) => {
    setSchedulingItemId(itemId);
    setSchedulingMultiple(isMultiple);
    
    // Set default to tomorrow at 9 AM
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    
    const dateStr = tomorrow.toISOString().split('T')[0];
    const timeStr = '09:00';
    
    setScheduleDate(dateStr);
    setScheduleTime(timeStr);
    setSchedulePickerOpen(true);
  };

  const handleConfirmSchedule = () => {
    if (!scheduleDate || !scheduleTime) {
      alert('Please select both date and time');
      return;
    }

    const scheduledDateTime = new Date(`${scheduleDate}T${scheduleTime}`);

    if (schedulingMultiple) {
      // Approve all pending items
      const approvedCount = automatedOutreachItems.filter(item => item.status === 'pending').length;
      setAutomatedOutreachItems(prev => prev.map(item => 
        item.status === 'pending' ? { ...item, status: 'approved', scheduledDate: scheduledDateTime } : item
      ));
      setScheduledCount(approvedCount);
    } else if (schedulingItemId) {
      // Approve single item
      setAutomatedOutreachItems(prev => prev.map(item => 
        item.id === schedulingItemId ? { ...item, status: 'approved', scheduledDate: scheduledDateTime } : item
      ));
      setScheduledCount(1);
    }

    setSchedulePickerOpen(false);
    setScheduleDialogOpen(true);
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
        refreshDeals();
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

  const handleStatusChange = async (dealId: string, newStatus: 'prospective' | 'active') => {
    try {
      await dealsApi.updateDeal(dealId, { status: newStatus });
      refreshDeals();
    } catch (error) {
      console.error('Error updating deal status:', error);
    }
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
          {params.row.people?.slice(0, 2).map((person: Person) => (
            <Box key={person.id} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Avatar sx={{ width: 24, height: 24, fontSize: 10 }}>
                {person.name?.split(' ').map((n: string) => n[0]).join('') || 'N/A'}
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
          <Avatar>{params.row.leadPartner?.split(' ').map((n: string) => n[0]).join('') || 'N/A'}</Avatar>
          {params.value?.map((member: string, index: number) => (
            <Avatar key={index}>{member.split(' ').map((n: string) => n[0]).join('')}</Avatar>
          )) || []}
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
      width: 150,
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          {params.row.status !== 'active' && (
            <Tooltip title="Move to Active">
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  handleStatusChange(params.row.id, 'active');
                }}
                sx={{ 
                  bgcolor: '#000000', 
                  color: 'white',
                  '&:hover': { bgcolor: '#333333' }
                }}
              >
                <TrendingUpIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
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

    // Filter by status (prospective vs active)
    if (activeTab === 0) {
      // Active tab - show deals that are active
      return deal.status === 'active';
    } else if (activeTab === 1) {
      // Prospective tab - show deals that are not yet active
      return deal.status !== 'active' && deal.status !== 'closed';
    }
    
    return true;
  });

  // Debug: Log filtered deals after they're calculated
  console.log('Filtered deals:', filteredDeals);

  // Calculate summary statistics from real data
  const totalPipelineValue = deals.reduce((sum, deal) => sum + (deal.value || 0), 0);
  const avgProbability = deals.length > 0 ? Math.round(deals.reduce((sum, deal) => sum + (deal.probability || 0), 0) / deals.length) : 0;
  const activeDealCount = deals.filter(d => d.status === 'active').length;
  const prospectiveDealCount = deals.filter(d => d.status !== 'active' && d.status !== 'closed').length;

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
              <Avatar key={index}>{member?.split(' ').map(n => n[0]).join('') || 'N/A'}</Avatar>
            ))}
          </AvatarGroup>
          {deal.status !== 'active' && (
            <Tooltip title="Move to Active">
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  handleStatusChange(deal.id, 'active');
                }}
                sx={{ 
                  bgcolor: '#000000', 
                  color: 'white',
                  mr: 1,
                  '&:hover': { bgcolor: '#333333' }
                }}
              >
                <TrendingUpIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleMenuOpen(e, deal.id); }}>
            <MoreVertIcon fontSize="small" />
          </IconButton>
        </CardActions>
      </Card>
    );
  };

  return (
    <Box>
      {(viewMode as string) !== 'pipeline' && (
        <Box sx={{
          position: 'relative',
          bgcolor: 'white',
          borderRadius: '0 0 32px 32px',
          overflow: 'hidden',
          mb: 6,
          boxShadow: '0 8px 32px rgba(15, 23, 42, 0.08)'
        }}>
          {/* Background Pattern */}
          <Box sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.02) 0%, rgba(234, 88, 12, 0.05) 100%)',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: -50,
              right: -50,
              width: 100,
              height: 100,
              background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
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
              background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
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
                    Deals
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
                    Manage your investment opportunities from initial outreach to closing
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
                    Track and organize your network of deal contacts, investors, and brokers all in one place.
                  </Typography>

                  {/* Action Buttons */}
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <Button
                      variant="text"
                      size="large"
                      startIcon={<AddIcon />}
                      onClick={() => {
                        setNewDealModalOpen(true);
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
                      New Deal
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
                    background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 8px 32px rgba(249, 115, 22, 0.3)'
                  }}>
                    <BusinessCenterIcon sx={{ fontSize: 64, color: 'white' }} />
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </Box>
      )}

      {(viewMode as string) !== 'pipeline' && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar sx={{ bgcolor: 'primary.main', mr: 1.5, width: 32, height: 32 }}>
                  <MoneyIcon fontSize="small" />
                </Avatar>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.1rem', color: 'text.primary' }}>
                    ${(totalPipelineValue / 1000000).toFixed(1)}M
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                    Total Pipeline Value
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar sx={{ bgcolor: 'primary.main', mr: 1.5, width: 32, height: 32 }}>
                  <TrendingUpIcon fontSize="small" />
                </Avatar>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.1rem', color: 'text.primary' }}>
                    {avgProbability}%
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                    Avg. Probability
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar sx={{ bgcolor: 'primary.main', mr: 1.5, width: 32, height: 32 }}>
                  <ScheduleIcon fontSize="small" />
                </Avatar>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.1rem', color: 'text.primary' }}>
                    45 days
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                    Avg. Deal Cycle
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar sx={{ bgcolor: 'primary.main', mr: 1.5, width: 32, height: 32 }}>
                  <BusinessIcon fontSize="small" />
                </Avatar>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.1rem', color: 'text.primary' }}>
                    {activeDealCount}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                    Active Deals
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      )}

      {viewMode === 'pipeline' ? (
        <>
          {/* Pipeline Banner */}
          <Box sx={{
            position: 'relative',
            bgcolor: 'white',
            borderRadius: '0 0 32px 32px',
            overflow: 'hidden',
            mb: 6,
            boxShadow: '0 8px 32px rgba(15, 23, 42, 0.08)'
          }}>
            {/* Background Pattern */}
            <Box sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.02) 0%, rgba(234, 88, 12, 0.05) 100%)',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: -50,
                right: -50,
                width: 100,
                height: 100,
                background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
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
                background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
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
                      DEAL OUTREACH
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
                      Track and manage your deal flow from initial outreach to closing
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
                      Track your deals, send tailored emails, and get notified when new responses come in.
                    </Typography>

                    {/* Action Buttons */}
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                      <Button
                        variant="text"
                        size="large"
                        startIcon={<AddIcon />}
                        onClick={() => {
                          setNewDealModalOpen(true);
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
                        New Deal
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
                      background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 8px 32px rgba(249, 115, 22, 0.3)'
                    }}>
                      <TrendingUpIcon sx={{ fontSize: 64, color: 'white' }} />
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </Box>

          <Box sx={{ position: 'relative' }}>
            <DealPipeline
              deals={filteredDeals}
              loading={loading}
              error={error}
              onRefresh={refreshDeals}
              onEditDeal={handleEditDeal}
              onDeleteDeal={handleDeleteDeal}
            />
          </Box>

        {/* LinkedIn Outreach Section */}
        <LinkedInOutreach />

        </>
      ) : (
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
          </Box>

        {(viewMode as string) !== 'pipeline' && (
          <Tabs
            value={activeTab}
            onChange={(_, newValue) => setActiveTab(newValue)}
            sx={{ mb: 3, borderBottom: '1px solid', borderColor: 'divider' }}
          >
            <Tab label={`Active (${activeDealCount})`} />
            <Tab label={`Prospective (${prospectiveDealCount})`} />
          </Tabs>
        )}

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
      )}

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
        <MenuItem onClick={handleDeleteDeal} sx={{ color: 'error.main' }}>
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          Delete Deal
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
              {selectedPerson?.name?.split(' ').map(n => n[0]).join('') || 'N/A'}
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

      {/* Schedule Picker Dialog */}
      <Dialog
        open={schedulePickerOpen}
        onClose={() => setSchedulePickerOpen(false)}
        maxWidth="sm"
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)'
          }
        }}
      >
        <DialogTitle sx={{ pb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
            Schedule Email{schedulingMultiple ? 's' : ''}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Select when you want {schedulingMultiple ? 'these emails' : 'this email'} to be sent
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <CalendarIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                Date
              </Typography>
              <TextField
                type="date"
                fullWidth
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
                InputLabelProps={{
                  shrink: true
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: 'white',
                    borderRadius: 1.5,
                    border: '1px solid',
                    borderColor: 'divider',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    transition: 'all 0.15s ease',
                    '& fieldset': {
                      border: 'none'
                    },
                    '&:hover': {
                      bgcolor: '#F9FAFB',
                      borderColor: '#D1D5DB'
                    },
                    '&.Mui-focused': {
                      bgcolor: 'white',
                      borderColor: '#000000',
                      boxShadow: '0 0 0 1px #000000'
                    }
                  },
                  '& .MuiOutlinedInput-input': {
                    padding: '14px 16px',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    color: 'text.primary',
                    '&::-webkit-calendar-picker-indicator': {
                      cursor: 'pointer',
                      filter: 'invert(0)',
                      opacity: 0.6,
                      transition: 'opacity 0.15s ease',
                      '&:hover': {
                        opacity: 1
                      }
                    }
                  }
                }}
              />
            </Box>
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <TimeIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                Time
              </Typography>
              <TextField
                type="time"
                fullWidth
                value={scheduleTime}
                onChange={(e) => setScheduleTime(e.target.value)}
                InputLabelProps={{
                  shrink: true
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: 'white',
                    borderRadius: 1.5,
                    border: '1px solid',
                    borderColor: 'divider',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    transition: 'all 0.15s ease',
                    '& fieldset': {
                      border: 'none'
                    },
                    '&:hover': {
                      bgcolor: '#F9FAFB',
                      borderColor: '#D1D5DB'
                    },
                    '&.Mui-focused': {
                      bgcolor: 'white',
                      borderColor: '#000000',
                      boxShadow: '0 0 0 1px #000000'
                    }
                  },
                  '& .MuiOutlinedInput-input': {
                    padding: '14px 16px',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    color: 'text.primary',
                    '&::-webkit-calendar-picker-indicator': {
                      cursor: 'pointer',
                      filter: 'invert(0)',
                      opacity: 0.6,
                      transition: 'opacity 0.15s ease',
                      '&:hover': {
                        opacity: 1
                      }
                    }
                  }
                }}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 1.5 }}>
          <Button
            onClick={() => setSchedulePickerOpen(false)}
            sx={{ color: 'text.secondary' }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleConfirmSchedule}
            sx={{ px: 3 }}
          >
            Schedule {schedulingMultiple ? `${automatedOutreachItems.filter(item => item.status === 'pending').length} Emails` : 'Email'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Schedule Confirmation Dialog */}
      <Dialog
        open={scheduleDialogOpen}
        onClose={() => setScheduleDialogOpen(false)}
        maxWidth="sm"
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)'
          }
        }}
      >
        <DialogContent sx={{ p: 4, textAlign: 'center' }}>
          <Box
            sx={{
              width: 60,
              height: 60,
              borderRadius: '50%',
              bgcolor: '#DCFCE7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px'
            }}
          >
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                bgcolor: 'success.main',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <EmailIcon sx={{ color: 'white', fontSize: 24 }} />
            </Box>
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 1, fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
            Email{scheduledCount > 1 ? 's' : ''} Scheduled!
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            {scheduledCount} {scheduledCount === 1 ? 'email has' : 'emails have'} been scheduled for delivery
          </Typography>
          <Box
            sx={{
              p: 2.5,
              bgcolor: '#F9FAFB',
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
              mb: 3
            }}
          >
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
              Send Time
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 700, fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
              {scheduleDate && scheduleTime ? (
                `${new Date(`${scheduleDate}T${scheduleTime}`).toLocaleDateString('en-US', { 
                  weekday: 'long',
                  month: 'short', 
                  day: 'numeric'
                })} at ${new Date(`${scheduleDate}T${scheduleTime}`).toLocaleTimeString('en-US', { 
                  hour: 'numeric', 
                  minute: '2-digit',
                  hour12: true
                })}`
              ) : (
                'Not scheduled'
              )}
            </Typography>
          </Box>
          <Button
            variant="contained"
            fullWidth
            onClick={() => setScheduleDialogOpen(false)}
            sx={{ py: 1.5 }}
          >
            Got it
          </Button>
        </DialogContent>
      </Dialog>

    </Box>
  );
}