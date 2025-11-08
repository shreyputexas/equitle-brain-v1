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
import {
  DndContext,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
  closestCenter,
  useDraggable,
  useDroppable
} from '@dnd-kit/core';
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

// Add global CSS animation for pulse effect
const pulseAnimation = `
  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.7;
    }
  }
`;

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
  // Track deals that should appear only in "All" column (not in specific columns)
  const [dealsInAllOnly, setDealsInAllOnly] = useState<Set<string>>(new Set());
  // Track optimistic stage updates for instant UI feedback
  const [optimisticStageUpdates, setOptimisticStageUpdates] = useState<Map<string, string>>(new Map());
  // Track pending drag operations to prevent race conditions
  const pendingDragsRef = React.useRef<Set<string>>(new Set());
  
  // Drag and drop state
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  
  // Configure sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px of movement before starting drag
      },
    }),
    useSensor(KeyboardSensor)
  );
  
  // Email state management
  const [outlookEmails, setOutlookEmails] = useState<OutlookEmail[]>([]);
  const [emailsLoading, setEmailsLoading] = useState(false);
  const [emailsError, setEmailsError] = useState<string | null>(null);

  // Debug: Log deals prop received by DealPipeline
  console.log('DealPipeline: Component render - deals prop received:', deals);
  console.log('DealPipeline: Component render - deals prop length:', deals?.length);
  console.log('DealPipeline: Component render - loading:', loading);
  console.log('DealPipeline: Component render - error:', error);
  console.log('DealPipeline: Component render - deals prop type:', typeof deals);
  console.log('DealPipeline: Component render - deals is array?', Array.isArray(deals));
  console.log('DealPipeline: Component render - First deal sample:', deals?.[0]);

  // Transform API deals to include mock people data for now
  // Guard against empty or undefined deals array
  const dealsArray = Array.isArray(deals) ? deals : [];
  console.log('DealPipeline: Component render - dealsArray length:', dealsArray.length);
  
  // Apply optimistic stage updates to deals for instant UI feedback
  // CRITICAL: Optimistic updates ALWAYS take precedence over props to prevent snap-back
  const dealsWithContacts: DealWithContacts[] = dealsArray.map(deal => {
    const optimisticStage = optimisticStageUpdates.get(deal.id);
    // Always use optimistic stage if it exists - this prevents snap-back when props refresh
    const finalStage = optimisticStage || deal.stage;
    if (optimisticStage && optimisticStage !== deal.stage) {
      console.log(`Applying optimistic update: Deal ${deal.id} (${deal.company}) stage: ${deal.stage} -> ${optimisticStage}`);
    }
    return {
      ...deal,
      stage: finalStage, // Optimistic stage always wins - prevents snap-back
      people: mockPeople // This will be replaced with real contact data later
    };
  });
  
  console.log('DealPipeline: Component render - dealsWithContacts length:', dealsWithContacts.length);
  console.log('DealPipeline: Component render - dealsWithContacts:', dealsWithContacts);

  // Debug: Log when deals prop changes
  useEffect(() => {
    console.log('DealPipeline: useEffect - deals prop changed:', deals);
    console.log('DealPipeline: useEffect - deals length:', deals?.length);
    console.log('DealPipeline: useEffect - loading:', loading);
    
    // Only clear optimistic updates when server CONFIRMS them
    // This means the server stage must match the optimistic stage
    // We do NOT clear just because deals prop changed - that would cause snap-back
    if (!loading && deals && deals.length > 0) {
      setOptimisticStageUpdates(prev => {
        const newMap = new Map();
        prev.forEach((optimisticStage, dealId) => {
          const deal = deals.find(d => d.id === dealId);
          if (deal) {
            // Only clear optimistic update if server stage MATCHES optimistic stage
            // This means server has confirmed the update
            if (deal.stage === optimisticStage) {
              console.log(`Server confirmed: Deal ${dealId} stage is now ${optimisticStage}, clearing optimistic update`);
              // Don't add to newMap - this clears the optimistic update
            } else {
              // Server stage doesn't match yet - keep optimistic update
              // This prevents snap-back when deals prop refreshes with old stage
              console.log(`Keeping optimistic update: Deal ${dealId} server stage (${deal.stage}) != optimistic (${optimisticStage})`);
              newMap.set(dealId, optimisticStage);
            }
          } else {
            // Deal not found in props, keep optimistic update
            newMap.set(dealId, optimisticStage);
          }
        });
        return newMap;
      });
    }
  }, [deals, loading]);

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

    // Debug logging - log BEFORE any filtering
    console.log('DealPipeline.getDealsForStage - Input dealsWithContacts:', allDeals);
    console.log('DealPipeline.getDealsForStage - dealsWithContacts length:', allDeals.length);
    console.log('DealPipeline.getDealsForStage - Stage value:', stageValue);
    
    if (allDeals.length === 0) {
      console.warn('DealPipeline.getDealsForStage - WARNING: No deals received!');
      console.log('DealPipeline.getDealsForStage - deals prop:', deals);
      return [];
    }

    // Log deal statuses to see what we're working with
    const statusCounts = allDeals.reduce((acc, deal) => {
      acc[deal.status || 'undefined'] = (acc[deal.status || 'undefined'] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    console.log('DealPipeline.getDealsForStage - Deal status counts:', statusCounts);
    
    // Log deal stages
    const stageCounts = allDeals.reduce((acc, deal) => {
      acc[deal.stage || 'undefined'] = (acc[deal.stage || 'undefined'] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    console.log('DealPipeline.getDealsForStage - Deal stage counts:', stageCounts);

    // Filter to show deals that are not explicitly closed or lost
    // This includes deals with status: 'active', 'paused', or undefined/missing status
    const activeDeals = allDeals.filter(deal => {
      const isShowable = !deal.status || deal.status === 'active' || deal.status === 'paused';
      if (!isShowable) {
        console.log(`DealPipeline.getDealsForStage - Filtered out deal (status: ${deal.status}):`, deal.company);
      }
      return isShowable;
    });
    console.log('DealPipeline.getDealsForStage - Active deals:', activeDeals);
    console.log('DealPipeline.getDealsForStage - Active deals length:', activeDeals.length);

    // Map backend stage values to frontend stage columns
    // Backend stages: 'prospect', 'due-diligence', 'term-sheet', 'closing', 'closed'
    // Frontend columns: 'all', 'response-received', 'initial-diligence', 'ioi-loi'

    if (stageValue === 'all') {
      // "All" column shows all active deals
      return activeDeals;
    }

    const filtered = activeDeals.filter(deal => {
      let matches = false;
      // If deal has no stage, default to showing it in 'response-received' (prospect) column
      const dealStage = deal.stage || 'prospect';

      switch (stageValue) {
        case 'response-received':
          matches = dealStage === 'prospect';
          break;
        case 'initial-diligence':
          matches = dealStage === 'due-diligence';
          break;
        case 'ioi-loi':
          matches = dealStage === 'term-sheet' || dealStage === 'closing';
          break;
        default:
          matches = false;
      }
      if (!matches) {
        console.log(`DealPipeline.getDealsForStage - Deal ${deal.company} (stage: ${dealStage}) doesn't match ${stageValue}`);
      }
      return matches;
    });
    console.log(`DealPipeline.getDealsForStage - Filtered deals for ${stageValue}:`, filtered);
    console.log(`DealPipeline.getDealsForStage - Filtered deals length for ${stageValue}:`, filtered.length);
    return filtered;
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

  // @dnd-kit drag and drop handlers
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event;
    setOverId(over?.id as string | null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    setActiveId(null);
    setOverId(null);

    if (!over) {
      return;
    }

    const dealId = active.id as string;
    const targetStage = over.id as string;

    // Prevent multiple simultaneous drags of the same deal
    if (pendingDragsRef.current.has(dealId)) {
      console.log(`Deal ${dealId} is already being moved, ignoring duplicate drag`);
      return;
    }

    // Find the deal being moved
    const dealToMove = dealsWithContacts.find(d => d.id === dealId);
    if (!dealToMove) {
      console.error('Deal not found:', dealId);
      return;
    }

    // Mark this drag as pending
    pendingDragsRef.current.add(dealId);

    const currentBackendStage = dealToMove.stage || 'prospect';
    const currentFrontendStage = mapBackendStageToFrontend(currentBackendStage);

    // Handle dropping into "All" column
    // Mark this deal to appear only in "All" column, not in specific columns
    if (targetStage === 'all') {
      console.log(`Deal "${dealToMove.company}" dropped into "All" column - marking to appear only in "All"`);
      
      // Add deal to the set of deals that should appear only in "All"
      // This updates the UI immediately without any loading
      setDealsInAllOnly(prev => {
        const newSet = new Set(prev);
        newSet.add(dealToMove.id);
        return newSet;
      });
      
      const stageName = stages.find(s => s.value === targetStage)?.label || targetStage;
      setSnackbarMessage(`✓ ${dealToMove.company} moved to ${stageName}`);
      setSnackbarOpen(true);
      
      // No backend update needed for "All" - it's just a view filter
      // The deal's stage remains unchanged, it just appears in "All" column
      
      // Remove from pending drags
      pendingDragsRef.current.delete(dealToMove.id);
      
      return;
    }

    // Map our pipeline stages to the API stage values
    let newStage: string;
    switch (targetStage) {
      case 'response-received':
        newStage = 'prospect';
        break;
      case 'initial-diligence':
        newStage = 'due-diligence';
        break;
      case 'ioi-loi':
        // For 'ioi-loi', we need to check the current stage
        // If it's already 'term-sheet' or 'closing', we might want to keep it
        // But for consistency, let's set it to 'term-sheet' if it's 'closing'
        if (currentBackendStage === 'closing') {
        newStage = 'term-sheet';
        } else {
          newStage = 'term-sheet';
        }
        break;
      default:
        console.error('Unknown target stage:', targetStage);
        return;
    }

    // Don't update if the backend stage is already the target stage
    // This prevents unnecessary API calls when the stage is already correct
    if (currentBackendStage === newStage) {
      console.log(`Deal "${dealToMove.company}" is already in stage "${newStage}", skipping update`);
      return;
    }

    // Remove deal from "All only" set when moving to a specific column
    setDealsInAllOnly(prev => {
      const newSet = new Set(prev);
      newSet.delete(dealToMove.id);
      return newSet;
    });

    // Optimistically update the stage immediately for instant UI feedback
    // This must happen BEFORE any other state updates to ensure UI updates correctly
    // CRITICAL: This update persists until server confirms, preventing snap-back
    setOptimisticStageUpdates(prev => {
      const newMap = new Map(prev);
      newMap.set(dealToMove.id, newStage);
      console.log(`Optimistic update: Deal ${dealToMove.id} (${dealToMove.company}) stage set to ${newStage}`);
      console.log(`Optimistic updates map:`, Array.from(newMap.entries()));
      // Force a re-render to ensure the UI updates immediately
      return newMap;
    });

    // Allow updates even if frontend stage matches, as long as backend stage is different
    // This handles cases like 'closing' -> 'ioi-loi' (which maps to 'term-sheet')
    // Both 'closing' and 'term-sheet' map to 'ioi-loi' frontend column, but we want to allow the update

    console.log(`Updating deal "${dealToMove.company}" (ID: ${dealToMove.id}) from stage "${currentBackendStage}" to "${newStage}"`);

      const stageName = stages.find(s => s.value === targetStage)?.label || targetStage;
      setSnackbarMessage(`✓ ${dealToMove.company} moved to ${stageName}`);
      setSnackbarOpen(true);

    // Update backend silently in the background without blocking UI
    // No refresh needed - optimistic update is already reflected in UI
    dealsApi.updateDeal(dealToMove.id, { stage: newStage })
      .then(() => {
        console.log('Deal updated successfully in background');
        // Don't clear optimistic update immediately - let the useEffect handle it
        // when the deals prop refreshes with the new stage from server
        // This prevents race conditions and ensures smooth transitions
        // Remove from pending drags
        pendingDragsRef.current.delete(dealToMove.id);
        // No refresh needed - optimistic updates handle UI, server sync happens naturally
        // The optimistic update will be cleared automatically when deals prop updates with confirmed stage
      })
      .catch((error: any) => {
        console.error('Error updating deal stage in background:', error);
        console.error('Error details:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status,
          stack: error.stack
        });
        
        // Revert the optimistic update on error - this is the only time we should clear it
        setOptimisticStageUpdates(prev => {
          const newMap = new Map(prev);
          newMap.delete(dealToMove.id); // Remove optimistic update to revert to original stage
          console.log(`Reverting optimistic update for deal ${dealToMove.id} due to error`);
          return newMap;
        });
        
        setDealsInAllOnly(prev => {
          const newSet = new Set(prev);
          if (targetStage === 'all') {
            newSet.delete(dealToMove.id);
          }
          return newSet;
        });
        
        // Provide more specific error messages
        let errorMessage = 'Unknown error';
        if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        } else if (error.message) {
          errorMessage = error.message;
        } else if (error.response?.status === 404) {
          errorMessage = 'Deal not found';
        } else if (error.response?.status === 400) {
          errorMessage = 'Invalid request - please check the deal data';
        } else if (error.response?.status === 500) {
          errorMessage = 'Server error - please try again';
        }
        
        setSnackbarMessage(`✗ Failed to move deal: ${errorMessage}`);
        setSnackbarOpen(true);
        // Remove from pending drags on error
        pendingDragsRef.current.delete(dealToMove.id);
      });
  };

  // Helper function to map backend stage to frontend stage
  const mapBackendStageToFrontend = (backendStage: string): string => {
    switch (backendStage) {
      case 'prospect':
        return 'response-received';
      case 'due-diligence':
        return 'initial-diligence';
      case 'term-sheet':
      case 'closing':
        return 'ioi-loi';
      default:
        return 'response-received';
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
        // Remove from optimistic updates if present
        setOptimisticStageUpdates(prev => {
          const newMap = new Map(prev);
          newMap.delete(selectedDealId);
          return newMap;
        });
        setDealsInAllOnly(prev => {
          const newSet = new Set(prev);
          newSet.delete(selectedDealId);
          return newSet;
        });
        // Refresh to remove deleted deal
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

  // Draggable Deal Card Component
  const DraggableDealCard = ({ deal }: { deal: DealWithContacts }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      isDragging,
    } = useDraggable({
      id: deal.id,
      data: {
        type: 'deal',
        deal,
      },
    });

    const style = transform
      ? {
          transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        }
      : undefined;

    const isExpanded = expandedDeals.has(deal.id);

    return (
      <Card
        ref={setNodeRef}
        {...listeners}
        {...attributes}
        sx={{
          mb: 2,
          cursor: isDragging ? 'grabbing' : 'grab',
          bgcolor: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: 3,
          opacity: isDragging ? 0.6 : 1,
          transform: style?.transform || 'scale(1)',
          // Smooth transitions when not dragging - Google Docs style
          transition: isDragging 
            ? 'none' 
            : 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: isDragging 
            ? '0 20px 40px rgba(0,0,0,0.3), 0 0 0 1px rgba(0,0,0,0.1)' 
            : '0 2px 8px rgba(0,0,0,0.05)',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          position: 'relative',
          willChange: isDragging ? 'transform' : 'auto',
          // Smooth hover effect
          '&:hover': {
            transform: isDragging 
              ? style?.transform || 'scale(1)' 
              : 'translateY(-2px) scale(1.005)',
            boxShadow: isDragging 
              ? '0 20px 40px rgba(0,0,0,0.3), 0 0 0 1px rgba(0,0,0,0.1)' 
              : '0 8px 16px rgba(0,0,0,0.1)',
            borderColor: '#10b981',
            transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
          },
          '&:active': {
            cursor: 'grabbing',
          },
        }}
        onClick={(e) => {
          // Prevent click when dragging
          if (!isDragging) {
            handleCompanyClick(deal);
          }
        }}
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
                  onMouseDown={(e) => {
                    e.stopPropagation();
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
          <IconButton 
            size="small" 
            onClick={(e) => { 
              e.stopPropagation(); 
              handleMenuOpen(e, deal.id); 
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
            }}
          >
            <MoreVertIcon fontSize="small" />
          </IconButton>
        </CardActions>
      </Card>
    );
  };

  // Droppable Stage Component
  const DroppableStage = ({ stage, children }: { stage: { value: string; label: string }; children: React.ReactNode }) => {
    const { setNodeRef, isOver } = useDroppable({
      id: stage.value,
      data: {
        type: 'stage',
        stage: stage.value,
      },
    });

    return (
      <Paper
        ref={setNodeRef}
        sx={{
          flex: 1,
          minWidth: 0,
          maxWidth: '25%',
          p: 0,
          borderRadius: '12px',
          border: isOver ? '2px solid #10b981' : '1px solid #e5e7eb',
          bgcolor: isOver ? '#f0fdf4' : '#ffffff',
          boxShadow: isOver
            ? '0 8px 24px rgba(16, 185, 129, 0.25)'
            : '0 2px 8px rgba(0,0,0,0.05)',
          transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
          transform: isOver ? 'scale(1.005)' : 'scale(1)',
          overflow: 'visible',
          position: 'relative',
          zIndex: isOver ? 100 : 1,
          willChange: isOver ? 'transform, box-shadow' : 'auto',
        }}
      >
        {children}
      </Paper>
    );
  };

  // Get active deal for drag overlay
  const activeDeal = activeId ? dealsWithContacts.find(d => d.id === activeId) : null;

  // Show loading state
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', bgcolor: '#f8f9fa' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Show error state
  if (error) {
    return (
      <Box sx={{ p: 4, bgcolor: '#f8f9fa', minHeight: '100vh' }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
        <Button onClick={onRefresh} variant="contained">
          Retry
        </Button>
      </Box>
    );
  }

  // Ensure sensors are properly initialized
  // Sensors must be initialized before use in DndContext
  if (!sensors) {
    console.error('Sensors not initialized properly');
    return (
      <Box sx={{ p: 4, bgcolor: '#f8f9fa', minHeight: '100vh' }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          Error initializing drag and drop sensors
        </Alert>
        <Button onClick={onRefresh} variant="contained">
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <Box sx={{ bgcolor: '#f8f9fa', minHeight: '100vh', position: 'relative', width: '100%' }}>
        {/* Inject pulse animation */}
        <style>{pulseAnimation}</style>

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
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Typography 
                variant="h4" 
                sx={{ 
                  fontWeight: 400, 
                  color: 'white', 
                  fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                  letterSpacing: '-0.02em'
                }}
              >
                Deal Pipeline
              </Typography>
              <Chip
                size="small"
                label={`${dealsWithContacts.length} Deal${dealsWithContacts.length !== 1 ? 's' : ''}`}
                sx={{
                  bgcolor: '#f97316',
                  color: 'white',
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                  boxShadow: '0 2px 8px rgba(249, 115, 22, 0.3)',
                  cursor: 'default',
                  '&:hover': {
                    bgcolor: '#f97316',
                    color: 'white'
                  },
                  '& .MuiChip-label': {
                    px: 1.5,
                    py: 0.25
                  }
                }}
              />
            </Box>
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
          {(() => {
            // First, process all stages to determine which deals belong to specific columns
            // This prevents duplicates - deals will appear in their specific column, not in "All"
            const dealsInSpecificColumns = new Set<string>();
            
            // Process non-"All" stages first to track which deals are in specific columns
            // Exclude deals that are marked to appear only in "All"
            stages.forEach(stage => {
              if (stage.value !== 'all') {
                const rawStageDeals = getDealsForStage(stage.value);
                rawStageDeals.forEach(deal => {
                  if (deal.id && !dealsInAllOnly.has(deal.id)) {
                    dealsInSpecificColumns.add(deal.id);
                  }
                });
              }
            });
            
            // Now render all stages
            return stages.map((stage) => {
            const rawStageDeals = getDealsForStage(stage.value);
            console.log(`DealPipeline.render: Stage "${stage.value}" - rawStageDeals:`, rawStageDeals);
            console.log(`DealPipeline.render: Stage "${stage.value}" - rawStageDeals length:`, rawStageDeals.length);
            
              // Filter deals based on whether they're in specific columns
              let filteredDeals = rawStageDeals;
              if (stage.value === 'all') {
                // For "All" column, show deals that aren't in specific columns OR are marked to appear only in "All"
                filteredDeals = rawStageDeals.filter(deal => {
                  return !dealsInSpecificColumns.has(deal.id) || dealsInAllOnly.has(deal.id);
                });
              } else {
                // For specific columns, exclude deals that are marked to appear only in "All"
                filteredDeals = rawStageDeals.filter(deal => {
                  return !dealsInAllOnly.has(deal.id);
                });
              }
              
              const stageDeals = filteredDeals.filter(deal => 
              searchTerm === '' || deal.company.toLowerCase().includes(searchTerm.toLowerCase())
            );
              
            console.log(`DealPipeline.render: Stage "${stage.value}" - stageDeals after search filter:`, stageDeals);
            console.log(`DealPipeline.render: Stage "${stage.value}" - stageDeals length after filter:`, stageDeals.length);
            
            const totalValue = stageDeals.reduce((sum, deal) => sum + (deal.value || 0), 0);
            
            return (
              <DroppableStage key={stage.value} stage={stage}>
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
                <Box 
                  sx={{
                    minHeight: 400,
                    p: 1.5,
                    position: 'relative',
                    zIndex: 2,
                    // Smooth transitions for cards appearing/disappearing
                    '& > *': {
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    }
                  }}
                >
                  {(() => {
                    console.log(`DealPipeline.render: Rendering stage "${stage.value}" with ${stageDeals.length} deals`);
                    console.log(`DealPipeline.render: stageDeals array:`, stageDeals);
                    return null;
                  })()}
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
                    (() => {
                      console.log(`DealPipeline.render: About to map ${stageDeals.length} deals for stage "${stage.value}"`);
                      console.log(`DealPipeline.render: Deals to map:`, stageDeals);
                      return stageDeals.map((deal, index) => {
                        console.log(`DealPipeline.render: Mapping deal ${index + 1}/${stageDeals.length}:`, deal.company, deal.id);
                        if (!deal.id) {
                          console.error(`DealPipeline.render: Deal missing id!`, deal);
                          return null;
                        }
                        if (!deal.company) {
                          console.error(`DealPipeline.render: Deal missing company!`, deal);
                          return null;
                        }
                        return <DraggableDealCard key={deal.id} deal={deal} />;
                      });
                    })()
                  )}
                </Box>
              </DroppableStage>
            );
            });
          })()}
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
                <DraggableDealCard key={deal.id} deal={deal} />
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
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          sx={{
            '& .MuiSnackbar-root': {
              bottom: '24px !important'
            }
          }}
        >
          <Alert
            onClose={() => setSnackbarOpen(false)}
            severity={snackbarMessage.startsWith('✗') ? 'error' : 'success'}
            variant="filled"
            sx={{
              width: '100%',
              minWidth: '300px',
              fontSize: '0.95rem',
              fontWeight: 500,
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
              borderRadius: 2,
              '& .MuiAlert-icon': {
                fontSize: '24px'
              },
              '& .MuiAlert-message': {
                fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                display: 'flex',
                alignItems: 'center'
              }
            }}
          >
          {snackbarMessage}
          </Alert>
        </Snackbar>

        {/* Drag Overlay - Google Docs style smooth animation */}
        <DragOverlay
          dropAnimation={{
            duration: 200,
            easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          {activeDeal ? (
            <Card
              sx={{
                width: 300,
                bgcolor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: 3,
                boxShadow: '0 20px 40px rgba(0,0,0,0.3), 0 0 0 1px rgba(0,0,0,0.1)',
                transform: 'rotate(1deg) scale(1.03)',
                opacity: 0.95,
                transition: 'all 0.1s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              <CardContent sx={{ pb: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar sx={{ bgcolor: '#000000' }}>
                      {activeDeal.company.charAt(0)}
                    </Avatar>
                    {getSentimentIcon(activeDeal.sentiment || 'neutral')}
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
                {activeDeal.company}
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
                {activeDeal.sector}
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
                  ${((activeDeal.value || 0) / 1000000).toFixed(1)}M
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
                  {activeDeal.leadPartner}
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
                  {activeDeal.nextStep}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          ) : null}
        </DragOverlay>
      </Box>
    </DndContext>
  );
}
