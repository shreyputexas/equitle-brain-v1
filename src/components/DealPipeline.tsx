import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Collapse,
  Card,
  CardContent,
  CardActions,
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
  TextField,
  InputAdornment,
  Select,
  FormControl,
  InputLabel,
  MenuItem,
  Tabs,
  Tab,
  Alert,
  Snackbar,
  CircularProgress
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  Edit as EditIcon,
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
  Check as CheckIcon,
  SentimentVerySatisfied as SentimentGoodIcon,
  SentimentDissatisfied as SentimentBadIcon,
  SentimentNeutral as SentimentNeutralIcon,
  Close as CloseIcon
} from '@mui/icons-material';
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
import contactsApi from '../services/contactsApi';
import integrationService from '../services/integrationService';
import emailCategorizationService from '../services/emailCategorizationService';
import OutlookEmailCard from './OutlookEmailCard';
import communicationsApi, { Communication } from '../services/communicationsApi';
import gmailApi, { GmailMessage } from '../services/gmailApi';

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
  const [expandedDeals, setExpandedDeals] = useState<Set<string>>(new Set());
  const [editingDealId, setEditingDealId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<{
    company: string;
    sector: string;
    value: string;
    leadPartner: string;
    nextStep: string;
  } | null>(null);
  const [selectContactsOpen, setSelectContactsOpen] = useState(false);
  const [availableContacts, setAvailableContacts] = useState<any[]>([]);
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);
  const [originalContactIds, setOriginalContactIds] = useState<string[]>([]); // Track original selection
  const [contactsLoading, setContactsLoading] = useState(false);
  const [savingDeal, setSavingDeal] = useState(false);
  // Track updated contacts for deals to show immediately after adding
  const [updatedDealContacts, setUpdatedDealContacts] = useState<Map<string, Person[]>>(new Map());
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
  
  // Communications state for Key Interactions
  const [dealCommunications, setDealCommunications] = useState<Record<string, Communication[]>>({});
  // Email thread modal state
  const [openEmailThreadModal, setOpenEmailThreadModal] = useState(false);
  const [selectedEmailThread, setSelectedEmailThread] = useState<Communication | null>(null);
  const [emailFullContent, setEmailFullContent] = useState<Record<string, string>>({});
  const [loadingEmailContent, setLoadingEmailContent] = useState<Set<string>>(new Set());
  
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

  // Transform API deals to include mock people data for now
  // Guard against empty or undefined deals array
  const dealsArray = Array.isArray(deals) ? deals : [];

  // Filter out invalid deals AND closed/lost deals before processing
  // This matches the filtering logic in getDealsForStage
  const validDeals = dealsArray.filter(deal => {
    // Must have id and company
    if (!deal.id || !deal.company) return false;

    // Filter out closed and lost deals (same logic as getDealsForStage)
    const isShowable = !deal.status || deal.status === 'active' || deal.status === 'paused';
    return isShowable;
  });

  const filteredOutDeals = dealsArray.filter(deal => {
    if (!deal.id || !deal.company) return true;
    const isShowable = !deal.status || deal.status === 'active' || deal.status === 'paused';
    return !isShowable;
  });

  // Apply optimistic stage updates to deals for instant UI feedback
  // CRITICAL: Optimistic updates ALWAYS take precedence over props to prevent snap-back
  const dealsWithContacts: DealWithContacts[] = validDeals
    .map(deal => {
      const optimisticStage = optimisticStageUpdates.get(deal.id);
      // Always use optimistic stage if it exists - this prevents snap-back when props refresh
      const finalStage = optimisticStage || deal.stage;
      if (optimisticStage && optimisticStage !== deal.stage) {
        console.log(`Applying optimistic update: Deal ${deal.id} (${deal.company}) stage: ${deal.stage} -> ${optimisticStage}`);
      }
      // Use updated contacts if available, otherwise use mockPeople
      const people = updatedDealContacts.get(deal.id) || mockPeople;
      return {
        ...deal,
        stage: finalStage, // Optimistic stage always wins - prevents snap-back
        people: people
      };
    });
  
  // Use communications from deals prop (already included from API)
  // Update communications whenever deals change
  useEffect(() => {
    if (dealsWithContacts.length > 0) {
      // Populate dealCommunications from the deals prop
      const commsMap: Record<string, Communication[]> = {};
      deals.forEach(deal => {
        // Cast to any to access communications property
        const dealWithComms = deal as any;
        commsMap[deal.id] = dealWithComms.communications || [];
      });
      setDealCommunications(commsMap);

      console.log('📧 [DealPipeline] Updated communications map:', {
        dealsCount: deals.length,
        commsMapKeys: Object.keys(commsMap),
        commsPerDeal: Object.entries(commsMap).map(([dealId, comms]) => ({
          dealId,
          commsCount: comms.length,
          comms: comms.map(c => ({ id: c.id, subject: c.subject, hasMessageId: !!c.messageId, hasSnippet: !!c.snippet }))
        }))
      });
    }
  }, [deals]);

  useEffect(() => {
    
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
              // Don't add to newMap - this clears the optimistic update
            } else {
              // Server stage doesn't match yet - keep optimistic update
              // This prevents snap-back when deals prop refreshes with old stage
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
  };

  const handleEmailForward = (email: OutlookEmail) => {
    // TODO: Implement email forward functionality
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
  };

  const handleEmailDelete = (emailId: string) => {
    // TODO: Implement email deletion functionality
  };

  const handleCreateDealFromEmail = (email: OutlookEmail) => {
    // TODO: Implement create deal from email functionality
  };

  const getDealsForStage = (stageValue: string) => {
    // Use only real Firebase deals
    const allDeals = dealsWithContacts;

    if (allDeals.length === 0) {
      return [];
    }

    // Filter to show deals that are not explicitly closed or lost
    // This includes deals with status: 'active', 'paused', or undefined/missing status
    const activeDeals = allDeals.filter(deal => {
      const isShowable = !deal.status || deal.status === 'active' || deal.status === 'paused';
      return isShowable;
    });

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
      return matches;
    });
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
      // Force a re-render to ensure the UI updates immediately
      return newMap;
    });

    // Allow updates even if frontend stage matches, as long as backend stage is different
    // This handles cases like 'closing' -> 'ioi-loi' (which maps to 'term-sheet')
    // Both 'closing' and 'term-sheet' map to 'ioi-loi' frontend column, but we want to allow the update

      const stageName = stages.find(s => s.value === targetStage)?.label || targetStage;
      setSnackbarMessage(`✓ ${dealToMove.company} moved to ${stageName}`);
      setSnackbarOpen(true);

    // Update backend silently in the background without blocking UI
    // No refresh needed - optimistic update is already reflected in UI
    dealsApi.updateDeal(dealToMove.id, { stage: newStage })
      .then(() => {
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
          return newMap;
        });
        
        setDealsInAllOnly(prev => {
          const newSet = new Set(prev);
          if ((targetStage as string) === 'all') {
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

  const handleEditDeal = async (e: React.MouseEvent<HTMLButtonElement>, dealId: string) => {
    e.stopPropagation();
    const deal = dealsWithContacts.find(d => d.id === dealId);
    if (!deal) return;
    
    setEditingDealId(dealId);
    
    // Fetch contacts for this deal if not already loaded
    if (!updatedDealContacts.has(dealId)) {
      try {
        const contactsResponse = await contactsApi.getContacts({ dealId });
        const fetchedPeople = contactsResponse.contacts.map((contact: any) => ({
          id: contact.id,
          name: contact.name,
          role: contact.title || contact.role || 'To be updated',
          email: contact.email || '',
          phone: contact.phone || '',
          relationshipScore: contact.relationshipScore || 0,
          lastContact: contact.lastContact ? new Date(contact.lastContact) : new Date(),
          status: (contact.status === 'hot' || contact.status === 'warm' || contact.status === 'cold') 
            ? contact.status 
            : 'cold' as 'hot' | 'warm' | 'cold',
          summary: contact.notes || contact.summary || 'No interaction history available. Connect to view relationship details.',
          citations: {
            emails: 0,
            calls: 0,
            meetings: 0,
            documents: 0
          }
        }));
        
        setUpdatedDealContacts(prev => {
          const newMap = new Map(prev);
          newMap.set(dealId, fetchedPeople);
          return newMap;
        });
      } catch (error) {
        console.error('Error fetching contacts for deal:', error);
      }
    }
    
    // Get the current deal with updated contacts
    const currentPeople = updatedDealContacts.get(dealId) || deal.people || [];
    
    // Determine the lead partner/contact to pre-select
    // First check if leadPartner is set, otherwise use the first contact from people array
    let defaultLeadPartner = deal.leadPartner || '';
    if (!defaultLeadPartner && currentPeople.length > 0) {
      // Use the first contact's name as the default
      defaultLeadPartner = currentPeople[0].name;
    }
    
    setEditFormData({
      company: deal.company || '',
      sector: deal.sector || '',
      value: deal.value ? String(deal.value / 1000000) : '',
      leadPartner: defaultLeadPartner,
      nextStep: deal.nextStep || ''
    });
  };

  const handleCloseEdit = () => {
    setEditingDealId(null);
    setEditFormData(null);
    setSelectContactsOpen(false);
    setSelectedContactIds([]);
    setSavingDeal(false); // Reset saving state
  };

  const handleOpenSelectContacts = async () => {
    if (!editingDealId) return;
    const dealToEdit = dealsWithContacts.find(d => d.id === editingDealId);
    if (!dealToEdit) return;

    setSelectContactsOpen(true);
    setContactsLoading(true);
    try {
      // Fetch all available contacts
      const response = await contactsApi.getContacts({ limit: 1000 });
      setAvailableContacts(response.contacts || []);

      // Fetch the latest contacts for THIS specific deal
      // Use updatedDealContacts if available, otherwise fetch fresh from backend
      let currentDealContacts = updatedDealContacts.get(editingDealId);

      if (!currentDealContacts) {
        // Fetch fresh contacts for this deal
        const dealContactsResponse = await contactsApi.getContacts({ dealId: editingDealId });
        currentDealContacts = dealContactsResponse.contacts.map((contact: any) => ({
          id: contact.id,
          name: contact.name,
          role: contact.title || contact.role || 'To be updated',
          email: contact.email || '',
          phone: contact.phone || '',
          relationshipScore: contact.relationshipScore || 0,
          lastContact: contact.lastContact ? new Date(contact.lastContact) : new Date(),
          status: (contact.status === 'hot' || contact.status === 'warm' || contact.status === 'cold')
            ? contact.status
            : 'cold' as 'hot' | 'warm' | 'cold',
          summary: contact.notes || contact.summary || 'No interaction history available.',
          citations: {
            emails: 0,
            calls: 0,
            meetings: 0,
            documents: 0
          }
        }));

        // Update the cache
        setUpdatedDealContacts(prev => {
          const newMap = new Map(prev);
          if (currentDealContacts) {
            newMap.set(editingDealId, currentDealContacts);
          }
          return newMap;
        });
      }

      // Pre-select contacts that are already associated with this deal
      // Use the FRESH contact data, not stale dealToEdit.people
      const existingContactIds = currentDealContacts?.map(p => p.id) || [];
      setSelectedContactIds(existingContactIds);
      setOriginalContactIds(existingContactIds); // Save original selection
    } catch (error) {
      console.error('Error fetching contacts:', error);
    } finally {
      setContactsLoading(false);
    }
  };

  const handleCloseSelectContacts = () => {
    setSelectContactsOpen(false);
    setSelectedContactIds([]);
    setOriginalContactIds([]); // Clear original selection
    // Reset the leadPartner if it was set to '__select_more__'
    if (editFormData && editFormData.leadPartner === '__select_more__') {
      setEditFormData({
        ...editFormData,
        leadPartner: ''
      });
    }
  };

  const handleToggleContact = (contactId: string) => {
    setSelectedContactIds(prev => 
      prev.includes(contactId) 
        ? prev.filter(id => id !== contactId)
        : [...prev, contactId]
    );
  };

  const handleAddContactsToDeal = async () => {
    if (!editingDealId) return;

    try {
      setContactsLoading(true);

      // Determine which contacts to add and which to remove
      const contactsToAdd = selectedContactIds.filter(id => !originalContactIds.includes(id));
      const contactsToRemove = originalContactIds.filter(id => !selectedContactIds.includes(id));

      // Optimistically update the UI immediately with selected contacts
      // This provides instant feedback while API calls are in progress
      const currentPeople = updatedDealContacts.get(editingDealId) || [];
      const availableContactsMap = new Map(availableContacts.map(c => [c.id, c]));
      
      // Build optimistic people list
      const optimisticPeople = selectedContactIds
        .map(contactId => {
          // Check if contact already exists in current people
          const existing = currentPeople.find(p => p.id === contactId);
          if (existing) return existing;
          
          // Otherwise, create from available contacts
          const contact = availableContactsMap.get(contactId);
          if (contact) {
            return {
              id: contact.id,
              name: contact.name,
              role: contact.title || contact.role || 'To be updated',
              email: contact.email || '',
              phone: contact.phone || '',
              relationshipScore: contact.relationshipScore || 0,
              lastContact: contact.lastContact ? new Date(contact.lastContact) : new Date(),
              status: (contact.status === 'hot' || contact.status === 'warm' || contact.status === 'cold')
                ? contact.status
                : 'cold' as 'hot' | 'warm' | 'cold',
              summary: contact.notes || contact.summary || 'No interaction history available. Connect to view relationship details.',
              citations: {
                emails: 0,
                calls: 0,
                meetings: 0,
                documents: 0
              }
            };
          }
          return null;
        })
        .filter((p): p is Person => p !== null);

      // Apply optimistic update immediately
      setUpdatedDealContacts(prev => {
        const newMap = new Map(prev);
        newMap.set(editingDealId, optimisticPeople);
        return newMap;
      });

      let addedCount = 0;
      let removedCount = 0;
      let failCount = 0;

      // Add newly selected contacts
      for (const contactId of contactsToAdd) {
        try {
          await dealsApi.addContactToDeal(editingDealId, contactId);
          addedCount++;
        } catch (error: any) {
          console.error(`Error adding contact ${contactId} to deal:`, error);
          failCount++;
        }
      }

      // Remove deselected contacts
      for (const contactId of contactsToRemove) {
        try {
          await dealsApi.removeContactFromDeal(editingDealId, contactId);
          removedCount++;
        } catch (error: any) {
          console.error(`Error removing contact ${contactId} from deal:`, error);
          failCount++;
        }
      }

      // Fetch the final updated contacts to ensure consistency
      const updatedContacts = await contactsApi.getContacts({ dealId: editingDealId });

      // Update with final data from backend
      const finalPeople = updatedContacts.contacts.map((contact: any) => ({
        id: contact.id,
        name: contact.name,
        role: contact.title || contact.role || 'To be updated',
        email: contact.email || '',
        phone: contact.phone || '',
        relationshipScore: contact.relationshipScore || 0,
        lastContact: contact.lastContact ? new Date(contact.lastContact) : new Date(),
        status: (contact.status === 'hot' || contact.status === 'warm' || contact.status === 'cold')
          ? contact.status
          : 'cold' as 'hot' | 'warm' | 'cold',
        summary: contact.notes || contact.summary || 'No interaction history available. Connect to view relationship details.',
        citations: {
          emails: 0,
          calls: 0,
          meetings: 0,
          documents: 0
        }
      }));

      // Update with final data
      setUpdatedDealContacts(prev => {
        const newMap = new Map(prev);
        newMap.set(editingDealId, finalPeople);
        return newMap;
      });

      // Show success message
      let message = '';
      if (addedCount > 0 && removedCount > 0) {
        message = `${addedCount} contact(s) added, ${removedCount} removed`;
      } else if (addedCount > 0) {
        message = `${addedCount} contact(s) added`;
      } else if (removedCount > 0) {
        message = `${removedCount} contact(s) removed`;
      } else {
        message = 'No changes made';
      }
      if (failCount > 0) {
        message += `, ${failCount} failed`;
      }
      setSnackbarMessage(message);
      setSnackbarOpen(true);

      // Close the modal using the helper which also resets form state
      handleCloseSelectContacts();

      // Don't call onRefresh() here - the local state update is sufficient
      // This prevents UI flickering and keeps the edit card smooth
    } catch (error: any) {
      console.error('Error syncing contacts to deal:', error);
      setSnackbarMessage(`Error syncing contacts: ${error.message || 'Unknown error'}`);
      setSnackbarOpen(true);
      
      // Revert optimistic update on error by fetching fresh data
      try {
        const revertedContacts = await contactsApi.getContacts({ dealId: editingDealId });
        const revertedPeople = revertedContacts.contacts.map((contact: any) => ({
          id: contact.id,
          name: contact.name,
          role: contact.title || contact.role || 'To be updated',
          email: contact.email || '',
          phone: contact.phone || '',
          relationshipScore: contact.relationshipScore || 0,
          lastContact: contact.lastContact ? new Date(contact.lastContact) : new Date(),
          status: (contact.status === 'hot' || contact.status === 'warm' || contact.status === 'cold')
            ? contact.status
            : 'cold' as 'hot' | 'warm' | 'cold',
          summary: contact.notes || contact.summary || 'No interaction history available. Connect to view relationship details.',
          citations: {
            emails: 0,
            calls: 0,
            meetings: 0,
            documents: 0
          }
        }));
        setUpdatedDealContacts(prev => {
          const newMap = new Map(prev);
          newMap.set(editingDealId, revertedPeople);
          return newMap;
        });
      } catch (revertError) {
        console.error('Error reverting contacts:', revertError);
      }
    } finally {
      setContactsLoading(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingDealId || !editFormData) return;
    const deal = deals.find(d => d.id === editingDealId);
    if (!deal) return;

    try {
      setSavingDeal(true);
      // Parse value - handle empty string or invalid numbers
      const valueInMillions = editFormData.value ? parseFloat(editFormData.value) : 0;

      // Clean the data before sending
      // Remove empty strings and special values like '__select_more__'
      const updatedDeal: any = {};

      if (editFormData.company && editFormData.company.trim()) {
        updatedDeal.company = editFormData.company.trim();
      }

      if (editFormData.sector && editFormData.sector.trim()) {
        updatedDeal.sector = editFormData.sector.trim();
      }

      if (editFormData.value && !isNaN(valueInMillions)) {
        updatedDeal.value = valueInMillions * 1000000;
      }

      // Only include leadPartner if it's a valid value (not empty or '__select_more__')
      if (editFormData.leadPartner &&
          editFormData.leadPartner.trim() &&
          editFormData.leadPartner !== '__select_more__') {
        updatedDeal.leadPartner = editFormData.leadPartner.trim();
      }

      if (editFormData.nextStep && editFormData.nextStep.trim()) {
        updatedDeal.nextStep = editFormData.nextStep.trim();
      }

      // Update deal directly via API
      await dealsApi.updateDeal(editingDealId, updatedDeal);

      // Close edit modal immediately for smooth UX
      handleCloseEdit();

      // Refresh deals list in the background after closing
      // This prevents UI flickering while the card is closing
      setTimeout(() => {
        onRefresh();
      }, 100);
    } catch (error: any) {
      console.error('Error saving deal:', error);
      console.error('Error response:', error.response?.data);
      setSavingDeal(false);
      // Show error message with more details
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
      setSnackbarMessage(`Error saving deal: ${errorMessage}`);
      setSnackbarOpen(true);
    }
  };

  const handleDeleteDeal = (dealId: string) => {
    setSelectedDealId(dealId);
    setDeleteConfirmOpen(true);
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
        // Close edit card if it's open for this deal
        if (editingDealId === selectedDealId) {
          handleCloseEdit();
        }
        // Refresh to remove deleted deal
        onRefresh();
        setDeleteConfirmOpen(false);
        setSnackbarMessage(`✓ Deal deleted successfully`);
        setSnackbarOpen(true);
      } catch (error: any) {
        console.error('Error deleting deal:', error);
        const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
        setSnackbarMessage(`Error deleting deal: ${errorMessage}`);
        setSnackbarOpen(true);
      }
    }
  };

  const handleDeleteFromEdit = () => {
    if (editingDealId) {
      setSelectedDealId(editingDealId);
      setDeleteConfirmOpen(true);
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

  const formatDealValue = (value: number): string => {
    if (value >= 1000000) {
      // Show in millions
      return `$${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      // Show in thousands
      return `$${(value / 1000).toFixed(0)}K`;
    } else {
      // Show as is
      return `$${value.toFixed(0)}`;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'hot': return 'error.main';
      case 'warm': return 'warning.main';
      case 'cold': return 'info.main';
      default: return 'text.secondary';
    }
  };

  // Helper function to decode base64 email content
  const base64DecodeEmail = (str: string): string => {
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

  const stripHtmlFromEmail = (html: string): string => {
    try {
      let text = html;

      // Remove DOCTYPE, HTML comments, and CDATA sections
      text = text.replace(/<!DOCTYPE[^>]*>/gi, '');
      text = text.replace(/<!--[\s\S]*?-->/g, '');
      text = text.replace(/<!\[CDATA\[[\s\S]*?\]\]>/g, '');

      // Remove script tags and their content
      text = text.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

      // Remove style tags and their content
      text = text.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');

      // Remove head tag and its content
      text = text.replace(/<head\b[^<]*(?:(?!<\/head>)<[^<]*)*<\/head>/gi, '');

      // Add spacing before closing anchor tags (links often run together)
      text = text.replace(/<\/a>/gi, '</a> ');

      // Convert common block elements to newlines for readability
      // Add double newlines for major sections
      text = text.replace(/<\/(p|div|h[1-6]|table|section|article|ul|ol)[^>]*>/gi, '\n\n');
      text = text.replace(/<(br|hr)[^>]*>/gi, '\n');
      text = text.replace(/<\/tr>/gi, '\n');
      // Add space or newline for table cells and list items
      text = text.replace(/<\/(td|th)>/gi, ' ');
      text = text.replace(/<\/(li)>/gi, '\n');

      // Remove all remaining HTML tags
      text = text.replace(/<[^>]+>/g, '');

      // Decode HTML entities multiple times to handle nested encoding
      const tmp = document.createElement('DIV');
      tmp.innerHTML = text;
      text = tmp.textContent || tmp.innerText || text;

      // Second pass for any remaining entities
      tmp.innerHTML = text;
      text = tmp.textContent || tmp.innerText || text;

      // Replace common HTML entity artifacts
      text = text.replace(/&nbsp;/g, ' ');
      text = text.replace(/&#160;/g, ' ');
      text = text.replace(/&amp;/g, '&');
      text = text.replace(/&lt;/g, '<');
      text = text.replace(/&gt;/g, '>');
      text = text.replace(/&quot;/g, '"');
      text = text.replace(/&#39;/g, "'");

      // Remove non-breaking spaces and replace with regular spaces
      text = text.replace(/\u00A0/g, ' ');
      text = text.replace(/\u00C2/g, ''); // Common encoding artifact

      // Remove zero-width characters and other control characters except newlines
      text = text.replace(/[\u200B-\u200D\uFEFF]/g, '');
      text = text.replace(/[\u0000-\u0008\u000B-\u001F\u007F-\u009F]/g, '');

      // Remove the weird "â ï»¿ Í" type characters (UTF-8 mojibake)
      text = text.replace(/[â€žâ€™â€œâ€�Ã�Â�ï»¿Íí]/g, '');

      // Remove excessive spaces and tabs on each line
      text = text.replace(/[ \t]+/g, ' ');

      // Clean up each line but preserve structure
      text = text
        .split('\n')
        .map(line => line.trim())
        .join('\n')
        .trim();

      // Remove excessive newlines (more than 2 consecutive)
      text = text.replace(/\n{3,}/g, '\n\n');

      // Remove lines that are just whitespace
      text = text
        .split('\n')
        .filter(line => line.length > 0)
        .join('\n');

      // Try to add spacing around common concatenated patterns
      // Add space before capital letters that follow lowercase (likely concatenated words)
      text = text.replace(/([a-z])([A-Z])/g, '$1 $2');

      return text || 'No readable content found';
    } catch (e) {
      console.error('Error stripping HTML:', e);
      return html;
    }
  };

  // Helper function to recursively extract body content from email payload
  const extractBodyContentFromPayload = (payload: any): string => {
    let content = '';

    console.log('📧 [DealPipeline] Extracting body from payload:', {
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
        const decoded = base64DecodeEmail(payload.body.data);
        console.log('📧 [DealPipeline] Decoded body data, length:', decoded.length);
        content += decoded;
      } catch (e) {
        console.error('❌ [DealPipeline] Error decoding body:', e);
      }
    }

    // Then check parts
    if (payload.parts && Array.isArray(payload.parts)) {
      console.log('📧 [DealPipeline] Processing', payload.parts.length, 'parts');
      for (let i = 0; i < payload.parts.length; i++) {
        const part = payload.parts[i];
        console.log(`📧 [DealPipeline] Part ${i}:`, {
          mimeType: part.mimeType,
          hasBody: !!part.body,
          hasBodyData: !!part.body?.data,
          bodySize: part.body?.size,
          hasParts: !!part.parts
        });

        // Prefer text/plain content
        if (part.mimeType === 'text/plain' && part.body?.data) {
          try {
            const decoded = base64DecodeEmail(part.body.data);
            console.log('📧 [DealPipeline] Decoded text/plain part, length:', decoded.length);
            content += decoded;
          } catch (e) {
            console.error('❌ [DealPipeline] Error decoding text/plain part:', e);
          }
        }
        // Use text/html as fallback if no plain text found yet
        else if (part.mimeType === 'text/html' && part.body?.data && !content) {
          try {
            const htmlContent = base64DecodeEmail(part.body.data);
            console.log('📧 [DealPipeline] Decoded text/html part, length:', htmlContent.length);
            // Strip HTML tags for plain display
            content = stripHtmlFromEmail(htmlContent);
          } catch (e) {
            console.error('❌ [DealPipeline] Error decoding text/html part:', e);
          }
        }
        // Recursively check multipart sections
        else if (part.mimeType?.startsWith('multipart/') && part.parts) {
          console.log('📧 [DealPipeline] Recursing into multipart section');
          const nestedContent = extractBodyContentFromPayload(part);
          if (nestedContent) {
            content += nestedContent;
          }
        }
      }
    }

    console.log('📧 [DealPipeline] Total content extracted, length:', content.length);
    return content;
  };

  // Handler to open email thread modal
  const handleOpenEmailThread = async (comm: Communication) => {
    const commId = comm.id || comm.threadId || comm.messageId || '';
    if (!commId) return;

    console.log('📧 [DealPipeline] ===== OPENING EMAIL THREAD =====');
    console.log('📧 [DealPipeline] Communication object:', comm);
    console.log('📧 [DealPipeline] Available data:', {
      commId,
      threadId: comm.threadId,
      messageId: comm.messageId,
      content: comm.content,
      snippet: comm.snippet,
      htmlContent: comm.htmlContent,
      subject: comm.subject,
      fromEmail: comm.fromEmail,
      toEmails: comm.toEmails
    });

    setSelectedEmailThread(comm);
    setOpenEmailThreadModal(true);

    // If we already have the content in cache, don't fetch again
    if (emailFullContent[commId]) {
      console.log('📧 [DealPipeline] Using cached content for:', commId);
      return;
    }

    // If we already have content or snippet in the communication object, use it
    if (comm.content || comm.snippet) {
      console.log('📧 [DealPipeline] Using content/snippet from communication object');
      let content = comm.content || comm.snippet || 'No content available';

      // Strip HTML if the content contains HTML tags
      if (content.includes('<') && content.includes('>')) {
        console.log('📧 [DealPipeline] Stripping HTML from stored content');
        content = stripHtmlFromEmail(content);
      }

      setEmailFullContent(prev => ({
        ...prev,
        [commId]: content
      }));
      return;
    }

    // Try to fetch content - either by messageId or threadId
    if (comm.messageId || comm.threadId) {
      setLoadingEmailContent(prev => new Set(prev).add(commId));
      try {
        let fullContent = '';

        if (comm.messageId) {
          // Fetch using messageId - if part of thread, fetch full thread
          console.log('📧 [DealPipeline] ===== FETCHING BY MESSAGE ID =====');
          console.log('📧 [DealPipeline] Message ID:', comm.messageId);
          console.log('📧 [DealPipeline] Thread ID:', comm.threadId);

          // If we have a threadId, fetch the full thread for context
          if (comm.threadId) {
            try {
              const response = await gmailApi.getThread(comm.threadId);
              const thread = response.thread;

              if (thread.messages && thread.messages.length > 1) {
                // Multiple messages - format as thread
                console.log(`📧 [DealPipeline] Found thread with ${thread.messages.length} messages`);

                const formattedMessages: string[] = [];

                for (let i = 0; i < thread.messages.length; i++) {
                  const message = thread.messages[i];
                  const headers = message.payload?.headers || [];

                  // Extract headers
                  const fromHeader = headers.find((h: any) => h.name.toLowerCase() === 'from')?.value || 'Unknown';
                  const dateHeader = headers.find((h: any) => h.name.toLowerCase() === 'date')?.value || '';
                  const subjectHeader = headers.find((h: any) => h.name.toLowerCase() === 'subject')?.value || '';

                  // Extract message content
                  let messageContent = '';
                  if (message.payload) {
                    messageContent = extractBodyContentFromPayload(message.payload);
                  }

                  // Fallback to snippet if no content extracted
                  if (!messageContent || messageContent.trim().length === 0) {
                    messageContent = message.snippet || '';
                    // Strip HTML from snippet if present
                    if (messageContent.includes('<') && messageContent.includes('>')) {
                      messageContent = stripHtmlFromEmail(messageContent);
                    }
                  }

                  // Format this message with separator
                  const separator = i > 0 ? '\n\n' + '─'.repeat(60) + '\n\n' : '';
                  const messageHeader = `From: ${fromHeader}${dateHeader ? '\nDate: ' + new Date(dateHeader).toLocaleString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true
                  }) : ''}${i === 0 && subjectHeader ? '\nSubject: ' + subjectHeader : ''}\n\n`;

                  formattedMessages.push(separator + messageHeader + messageContent);
                }

                fullContent = formattedMessages.join('');
              } else if (thread.messages && thread.messages.length === 1) {
                // Single message - extract content normally
                console.log('📧 [DealPipeline] Single message in thread');
                const message = thread.messages[0];
                if (message.payload) {
                  fullContent = extractBodyContentFromPayload(message.payload);
                }
                if (!fullContent || fullContent.trim().length === 0) {
                  fullContent = message.snippet || '';
                }
              }
            } catch (err) {
              console.warn('⚠️ [DealPipeline] Failed to fetch thread, falling back to single message:', err);
              // Fall back to fetching just the message
              const response = await gmailApi.getMessage(comm.messageId);
              const message = response.message;

              if (message.payload) {
                fullContent = extractBodyContentFromPayload(message.payload);
              }

              if (!fullContent || fullContent.trim().length === 0) {
                fullContent = message.snippet || '';
              }
            }
          } else {
            // No threadId, just fetch the single message
            const response = await gmailApi.getMessage(comm.messageId);
            const message = response.message;

            console.log('📧 [DealPipeline] Message snippet:', message.snippet);

            if (message.payload) {
              fullContent = extractBodyContentFromPayload(message.payload);
            }

            if (!fullContent || fullContent.trim().length === 0) {
              fullContent = message.snippet || '';
            }
          }
        } else if (comm.threadId) {
          // Fallback: Fetch using threadId and format full thread
          console.log('📧 [DealPipeline] ===== FETCHING BY THREAD ID =====');
          console.log('📧 [DealPipeline] Thread ID:', comm.threadId);

          const response = await gmailApi.getThread(comm.threadId);
          const thread = response.thread;

          console.log('📧 [DealPipeline] Thread response:', thread);

          if (thread.messages && thread.messages.length > 0) {
            console.log(`📧 [DealPipeline] Processing ${thread.messages.length} messages in thread`);

            // Format all messages in the thread
            const formattedMessages: string[] = [];

            for (let i = 0; i < thread.messages.length; i++) {
              const message = thread.messages[i];
              const headers = message.payload?.headers || [];

              // Extract headers
              const fromHeader = headers.find((h: any) => h.name.toLowerCase() === 'from')?.value || 'Unknown';
              const dateHeader = headers.find((h: any) => h.name.toLowerCase() === 'date')?.value || '';
              const subjectHeader = headers.find((h: any) => h.name.toLowerCase() === 'subject')?.value || '';

              // Extract message content
              let messageContent = '';
              if (message.payload) {
                messageContent = extractBodyContentFromPayload(message.payload);
              }

              // Fallback to snippet if no content extracted
              if (!messageContent || messageContent.trim().length === 0) {
                messageContent = message.snippet || '';
                // Strip HTML from snippet if present
                if (messageContent.includes('<') && messageContent.includes('>')) {
                  messageContent = stripHtmlFromEmail(messageContent);
                }
              }

              // Format this message with separator
              const separator = i > 0 ? '\n\n' + '─'.repeat(60) + '\n\n' : '';
              const messageHeader = `From: ${fromHeader}${dateHeader ? '\nDate: ' + new Date(dateHeader).toLocaleString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
              }) : ''}${i === 0 && subjectHeader ? '\nSubject: ' + subjectHeader : ''}\n\n`;

              formattedMessages.push(separator + messageHeader + messageContent);
            }

            fullContent = formattedMessages.join('');
          } else {
            console.warn('⚠️ [DealPipeline] No messages in thread:', comm.threadId);
          }
        }

        // Final fallback
        if (!fullContent || fullContent.trim().length === 0) {
          console.warn('⚠️ [DealPipeline] No content extracted, using fallback');
          fullContent = 'No content available';
        }

        // Final HTML stripping pass to ensure consistency
        // This catches any HTML that might have come from snippets or other sources
        if (fullContent && fullContent !== 'No content available' && fullContent.includes('<') && fullContent.includes('>')) {
          console.log('📧 [DealPipeline] Final HTML stripping pass');
          fullContent = stripHtmlFromEmail(fullContent);
        }

        console.log('✅ [DealPipeline] Final content length:', fullContent.length);
        console.log('✅ [DealPipeline] Final content preview:', fullContent.substring(0, 200));

        // Update full content cache
        setEmailFullContent(prev => ({
          ...prev,
          [commId]: fullContent
        }));
      } catch (err: any) {
        console.error('❌ [DealPipeline] ===== ERROR FETCHING EMAIL =====');
        console.error('❌ [DealPipeline] Error object:', err);
        console.error('❌ [DealPipeline] Error message:', err.message);
        console.error('❌ [DealPipeline] Error response:', err.response);

        // Fallback to existing content if fetch fails
        setEmailFullContent(prev => ({
          ...prev,
          [commId]: 'Failed to load email content'
        }));
      } finally {
        setLoadingEmailContent(prev => {
          const newSet = new Set(prev);
          newSet.delete(commId);
          return newSet;
        });
      }
    } else {
      // No messageId or threadId, can't fetch content
      console.warn('⚠️ [DealPipeline] No messageId or threadId available');
      setEmailFullContent(prev => ({
        ...prev,
        [commId]: 'No content available - missing email identifiers'
      }));
    }
  };

  const handleCloseEmailThread = () => {
    setOpenEmailThreadModal(false);
    setSelectedEmailThread(null);
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

    // Just read the communications that were already fetched
    const communications = dealCommunications[deal.id] || [];

    return (
      <Card
        ref={setNodeRef}
        {...listeners}
        {...attributes}
        sx={{
          mb: 1.5,
          width: '100%',
          maxWidth: '100%',
          cursor: isDragging ? 'grabbing' : 'grab',
          bgcolor: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: 1, // More rectangular
          opacity: isDragging ? 0.6 : 1,
          transform: style?.transform || 'scale(1)',
          // Smooth transitions when not dragging - Google Docs style
          transition: isDragging 
            ? 'none' 
            : 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: isDragging 
            ? '0 20px 40px rgba(0,0,0,0.3), 0 0 0 1px rgba(0,0,0,0.1)' 
            : '0 1px 3px rgba(0,0,0,0.08)',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          position: 'relative',
          willChange: isDragging ? 'transform' : 'auto',
          overflow: 'hidden',
          // Professional hover effect
          '&:hover': {
            transform: isDragging 
              ? style?.transform || 'scale(1)' 
              : 'translateY(-1px)',
            boxShadow: isDragging 
              ? '0 20px 40px rgba(0,0,0,0.3), 0 0 0 1px rgba(0,0,0,0.1)' 
              : '0 4px 12px rgba(0,0,0,0.12)',
            borderColor: '#d1d5db',
            transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
          },
          '&:active': {
            cursor: 'grabbing',
          },
        }}
        onClick={(e: React.MouseEvent) => {
          // Prevent click when dragging
          if (!isDragging) {
            // Toggle expansion instead of opening modal
            setExpandedDeals(prev => {
              const newSet = new Set(prev);
              if (newSet.has(deal.id)) {
                newSet.delete(deal.id);
              } else {
                newSet.add(deal.id);
              }
              return newSet;
            });
          }
        }}
      >
        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 }, width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
          {/* Minimal collapsed view - just company name, sector, and expand button */}
          {!isExpanded && (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1.5, width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography 
                  variant="body1" 
                  sx={{ 
                    fontWeight: 600, 
                    color: '#111827',
                    fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    letterSpacing: '-0.01em',
                    fontSize: '0.9375rem',
                    lineHeight: 1.4,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    mb: 0.25
                  }}
                >
                  {deal.company}
                </Typography>
                <Typography 
                  variant="caption" 
                  sx={{ 
                    color: '#6b7280',
                    fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    fontWeight: 400,
                    fontSize: '0.75rem',
                    display: 'block',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {deal.sector}
                </Typography>
              </Box>
              <Tooltip title={isExpanded ? "Hide details" : "Show details"}>
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
                    bgcolor: 'transparent',
                    color: '#6b7280',
                    flexShrink: 0,
                    width: 32,
                    height: 32,
                    '&:hover': {
                      bgcolor: '#f3f4f6',
                      color: '#111827'
                    }
                  }}
                >
                  <ExpandMoreIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          )}

          {/* Expanded view with all details - smooth animation */}
          <Collapse in={isExpanded} timeout={300}>
            <Box sx={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
              {/* Header with company info */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2, width: '100%', pb: 2, borderBottom: '1px solid #e5e7eb' }}>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        fontWeight: 600, 
                        color: '#111827',
                        fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                        letterSpacing: '-0.01em',
                        fontSize: '1rem',
                        lineHeight: 1.3
                      }}
                    >
                      {deal.company}
                    </Typography>
                    {getSentimentIcon(deal.sentiment || 'neutral')}
                  </Box>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: '#6b7280',
                      fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                      fontWeight: 400,
                      fontSize: '0.8125rem'
                    }}
                  >
                    {deal.sector}
                  </Typography>
                </Box>
                <Tooltip title="Hide details">
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
                      bgcolor: '#f3f4f6',
                      color: '#6b7280',
                      flexShrink: 0,
                      width: 28,
                      height: 28,
                      '&:hover': {
                        bgcolor: '#e5e7eb',
                        color: '#111827'
                      }
                    }}
                  >
                    <ExpandLessIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>

              {/* Deal Details Grid */}
              <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(2, 1fr)', 
                gap: 1.5, 
                mb: 2,
                width: '100%',
                maxWidth: '100%',
                boxSizing: 'border-box'
              }}>
                <Box>
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      color: '#6b7280',
                      fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                      fontWeight: 500,
                      fontSize: '0.6875rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      display: 'block',
                      mb: 0.5
                    }}
                  >
                    Deal Value
                  </Typography>
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      fontWeight: 600, 
                      color: '#000000',
                      fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                      letterSpacing: '-0.01em',
                      fontSize: '0.9375rem'
                    }}
                  >
                    {formatDealValue(deal.value || 0)}
                  </Typography>
                </Box>
                
                <Box>
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      color: '#6b7280',
                      fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                      fontWeight: 500,
                      fontSize: '0.6875rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      display: 'block',
                      mb: 0.5
                    }}
                  >
                    Main Contact
                  </Typography>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: '#111827',
                      fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                      fontWeight: 500,
                      fontSize: '0.8125rem'
                    }}
                  >
                    {deal.leadPartner || (deal.people && deal.people.length > 0 ? deal.people[0].name : 'Unassigned')}
                  </Typography>
                </Box>
              </Box>
              
              {/* Next Step */}
              {deal.nextStep && (
                <Box sx={{ mb: 2, pb: 2, borderBottom: '1px solid #e5e7eb' }}>
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      color: '#6b7280',
                      fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                      fontWeight: 500,
                      fontSize: '0.6875rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      display: 'block',
                      mb: 0.5
                    }}
                  >
                    Next Step
                  </Typography>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: '#111827',
                      fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                      fontWeight: 400,
                      fontSize: '0.8125rem',
                      lineHeight: 1.5
                    }}
                  >
                    {deal.nextStep}
                  </Typography>
                </Box>
              )}

              {/* Expanded People Section */}
              {deal.people && deal.people.length > 0 && (
                <Box sx={{ 
                  mt: 0, 
                  pt: 2, 
                  width: '100%',
                  maxWidth: '100%',
                  boxSizing: 'border-box'
                }}>
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      fontWeight: 600, 
                      mb: 1.5, 
                      display: 'flex', 
                      alignItems: 'center',
                      color: '#111827',
                      fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                      fontSize: '0.6875rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}
                  >
                    <PersonIcon sx={{ mr: 0.75, fontSize: 14 }} />
                    Key Contacts ({deal.people.length})
                  </Typography>
              
                  {deal.people.map((person) => (
                    <Box
                      key={person.id}
                      sx={{
                        p: 1.5,
                        mb: 1,
                        border: '1px solid #e5e7eb',
                        borderRadius: 1,
                        bgcolor: '#fafafa',
                        transition: 'all 0.2s ease',
                        overflow: 'hidden',
                        wordBreak: 'break-word',
                        width: '100%',
                        maxWidth: '100%',
                        boxSizing: 'border-box',
                        '&:hover': {
                          borderColor: '#d1d5db',
                          bgcolor: '#ffffff'
                        }
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1, gap: 1 }}>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              fontWeight: 600,
                              color: '#111827',
                              fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                              mb: 0.25,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              fontSize: '0.8125rem'
                            }}
                          >
                            {person.name}
                          </Typography>
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              color: '#6b7280',
                              fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              display: 'block',
                              fontSize: '0.75rem'
                            }}
                          >
                            {person.role}
                          </Typography>
                        </Box>
                        <Chip
                          label={person.status}
                          size="small"
                          sx={{
                            bgcolor: '#f5f5f5',
                            color: '#000000',
                            border: '1px solid #e0e0e0',
                            fontSize: '0.6875rem',
                            height: 18,
                            fontWeight: 500
                          }}
                        />
                      </Box>

                      {/* Contact Info */}
                      {(person.email || person.phone) && (
                        <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                          {person.email && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 0, flex: '1 1 auto', maxWidth: '100%' }}>
                              <EmailIcon fontSize="small" sx={{ color: '#6b7280', fontSize: 12, flexShrink: 0 }} />
                              <Typography 
                                variant="caption" 
                                sx={{ 
                                  color: '#6b7280',
                                  fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                  minWidth: 0,
                                  fontSize: '0.6875rem'
                                }}
                              >
                                {person.email}
                              </Typography>
                            </Box>
                          )}
                          {person.phone && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 0, flex: '1 1 auto', maxWidth: '100%' }}>
                              <PhoneIcon fontSize="small" sx={{ color: '#6b7280', fontSize: 12, flexShrink: 0 }} />
                              <Typography 
                                variant="caption" 
                                sx={{ 
                                  color: '#6b7280',
                                  fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                  minWidth: 0,
                                  fontSize: '0.6875rem'
                                }}
                              >
                                {person.phone}
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      )}

                      {/* Citations */}
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                        {person.citations.emails > 0 && (
                          <Chip
                            icon={<EmailIcon sx={{ fontSize: 12 }} />}
                            label={`${person.citations.emails} emails`}
                            size="small"
                            sx={{ 
                              bgcolor: '#f5f5f5', 
                              color: '#000000',
                              border: '1px solid #e0e0e0',
                              fontSize: '0.6875rem',
                              height: 20,
                              fontWeight: 500,
                              '&:hover': { bgcolor: '#e0e0e0' }
                            }}
                          />
                        )}
                        {person.citations.calls > 0 && (
                          <Chip
                            icon={<PhoneIcon sx={{ fontSize: 12 }} />}
                            label={`${person.citations.calls} calls`}
                            size="small"
                            sx={{ 
                              bgcolor: '#f5f5f5', 
                              color: '#000000',
                              border: '1px solid #e0e0e0',
                              fontSize: '0.6875rem',
                              height: 20,
                              fontWeight: 500,
                              '&:hover': { bgcolor: '#e0e0e0' }
                            }}
                          />
                        )}
                        {person.citations.meetings > 0 && (
                          <Chip
                            icon={<PersonIcon sx={{ fontSize: 12 }} />}
                            label={`${person.citations.meetings} meetings`}
                            size="small"
                            sx={{ 
                              bgcolor: '#f5f5f5', 
                              color: '#000000',
                              border: '1px solid #e0e0e0',
                              fontSize: '0.6875rem',
                              height: 20,
                              fontWeight: 500,
                              '&:hover': { bgcolor: '#e0e0e0' }
                            }}
                          />
                        )}
                        {person.citations.documents > 0 && (
                          <Chip
                            icon={<AttachFileIcon sx={{ fontSize: 12 }} />}
                            label={`${person.citations.documents} docs`}
                            size="small"
                            sx={{ 
                              bgcolor: '#f5f5f5', 
                              color: '#000000',
                              border: '1px solid #e0e0e0',
                              fontSize: '0.6875rem',
                              height: 20,
                              fontWeight: 500,
                              '&:hover': { bgcolor: '#e0e0e0' }
                            }}
                          />
                        )}
                      </Box>
                    </Box>
                  ))}
                </Box>
              )}

              {/* Key Interactions Section */}
              <Box sx={{
                mt: 2,
                pt: 2,
                borderTop: '1px solid #e5e7eb',
                width: '100%',
                maxWidth: '100%',
                boxSizing: 'border-box'
              }}>
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 600,
                    mb: 1,
                    display: 'flex',
                    alignItems: 'center',
                    color: '#111827',
                    fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    fontSize: '0.6875rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}
                >
                  <EmailIcon sx={{ mr: 0.75, fontSize: 14 }} />
                  Key Interactions ({communications.length})
                </Typography>

                {communications.length === 0 ? (
                  <Typography variant="body2" sx={{ color: '#6b7280', fontSize: '0.875rem', py: 0.5 }}>
                    No emails
                  </Typography>
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    {communications.map((comm) => {
                      const commId = comm.id || comm.threadId || comm.messageId || '';

                      return (
                        <Box
                          key={commId || Math.random()}
                          onClick={() => handleOpenEmailThread(comm)}
                          sx={{
                            p: 1.5,
                            border: '1px solid #e5e7eb',
                            borderRadius: 1,
                            bgcolor: '#f9fafb',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              bgcolor: '#f3f4f6',
                              borderColor: '#d1d5db',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                            }
                          }}
                        >
                          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5, fontSize: '0.8125rem' }}>
                            {comm.subject || '(No Subject)'}
                          </Typography>

                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                            {comm.fromEmail && (
                              <Typography variant="caption" sx={{ color: '#6b7280', fontSize: '0.6875rem' }}>
                                <strong>From:</strong> {comm.fromEmail}
                              </Typography>
                            )}
                            {comm.toEmails && comm.toEmails.length > 0 && (
                              <Typography variant="caption" sx={{ color: '#6b7280', fontSize: '0.6875rem' }}>
                                <strong>To:</strong> {comm.toEmails.join(', ')}
                              </Typography>
                            )}
                            {(comm.sentAt || comm.receivedAt || comm.createdAt) && (
                              <Typography variant="caption" sx={{ color: '#6b7280', fontSize: '0.6875rem' }}>
                                <strong>Date:</strong> {comm.sentAt
                                  ? new Date(comm.sentAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                                  : comm.receivedAt
                                  ? new Date(comm.receivedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                                  : comm.createdAt
                                  ? new Date(comm.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                                  : ''
                                }
                              </Typography>
                            )}
                          </Box>

                          {comm.content && (
                            <Box sx={{ mt: 1, pt: 1, borderTop: '1px solid #e5e7eb' }}>
                              <Typography variant="caption" sx={{ color: '#374151', fontSize: '0.6875rem', display: 'block', lineHeight: 1.4 }}>
                                {comm.content.replace(/<[^>]*>/g, '').substring(0, 150)}...
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      );
                    })}
                  </Box>
                )}
              </Box>

              {/* Team Members */}
              {deal.team && deal.team.length > 0 && (
                <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #e5e7eb', width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      color: '#6b7280',
                      fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                      fontWeight: 500,
                      fontSize: '0.6875rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      display: 'block',
                      mb: 1
                    }}
                  >
                    Team Members
                  </Typography>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                      {deal.leadPartner || 'No lead partner'}
                      {deal.team && deal.team.length > 0 && ` + ${deal.team.length} member${deal.team.length !== 1 ? 's' : ''}`}
                    </Typography>
                  </Box>
                </Box>
              )}
            </Box>
          </Collapse>
        </CardContent>
        
        {/* Actions - edit button only in expanded view with smooth animation */}
        <Collapse in={isExpanded} timeout={300}>
          <CardActions sx={{ px: 2, py: 1.5, justifyContent: 'flex-end', minHeight: 'auto', borderTop: '1px solid #e5e7eb' }}>
            <IconButton 
              size="small" 
              onClick={(e) => handleEditDeal(e, deal.id)}
              sx={{
                width: 32,
                height: 32,
                color: '#6b7280',
                '&:hover': {
                  bgcolor: '#f3f4f6',
                  color: '#111827'
                }
              }}
            >
              <AddIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </CardActions>
        </Collapse>
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
              
              const stageDeals = filteredDeals
              .filter(deal => deal.id && deal.company) // Filter out deals missing id or company
              .filter(deal =>
                searchTerm === '' || deal.company.toLowerCase().includes(searchTerm.toLowerCase())
              );

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
                    {formatDealValue(totalValue)} total value
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
                    stageDeals.map((deal) => {
                        if (!deal.id) {
                          console.error(`DealPipeline.render: Deal missing id!`, deal);
                          return null;
                        }
                        if (!deal.company) {
                          console.error(`DealPipeline.render: Deal missing company!`, deal);
                          return null;
                        }
                        return <DraggableDealCard key={deal.id} deal={deal} />;
                      })
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

        {/* Edit Deal Card */}
        {editingDealId && (() => {
          const dealToEdit = dealsWithContacts.find(d => d.id === editingDealId);
          if (!dealToEdit) return null;
          
          return (
            <Box
              sx={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                bgcolor: 'rgba(0, 0, 0, 0.5)',
                zIndex: 1300,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                p: 2
              }}
              onClick={handleCloseEdit}
            >
              <Card
                onClick={(e) => e.stopPropagation()}
                sx={{
                  width: '100%',
                  maxWidth: 600,
                  maxHeight: '90vh',
                  overflow: 'auto',
                  bgcolor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: 1,
                  boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
                }}
              >
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  {/* Header */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2, pb: 2, borderBottom: '1px solid #e5e7eb' }}>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          fontWeight: 600, 
                          color: '#111827',
                          fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                          letterSpacing: '-0.01em',
                          fontSize: '1rem',
                          lineHeight: 1.3,
                          mb: 0.5
                        }}
                      >
                        Edit Deal
                      </Typography>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: '#6b7280',
                          fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                          fontWeight: 400,
                          fontSize: '0.8125rem'
                        }}
                      >
                        {dealToEdit.company}
                      </Typography>
                    </Box>
                    <IconButton
                      size="small"
                      onClick={handleCloseEdit}
                      sx={{ 
                        bgcolor: '#f3f4f6',
                        color: '#6b7280',
                        flexShrink: 0,
                        width: 28,
                        height: 28,
                        '&:hover': {
                          bgcolor: '#e5e7eb',
                          color: '#111827'
                        }
                      }}
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </Box>

                  {/* Edit Form */}
                  {editFormData && (
                    <>
                      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2, mb: 2 }}>
                        <TextField
                          label="Company"
                          value={editFormData.company}
                          onChange={(e) => setEditFormData({ ...editFormData, company: e.target.value })}
                          fullWidth
                          size="small"
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                            }
                          }}
                        />
                        <TextField
                          label="Sector"
                          value={editFormData.sector}
                          onChange={(e) => setEditFormData({ ...editFormData, sector: e.target.value })}
                          fullWidth
                          size="small"
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                            }
                          }}
                        />
                        <TextField
                          label="Deal Value (M)"
                          value={editFormData.value}
                          onChange={(e) => {
                            // Allow free typing - accept any input, user can type numbers and decimals freely
                            setEditFormData({ ...editFormData, value: e.target.value });
                          }}
                          fullWidth
                          size="small"
                          type="text"
                          InputProps={{
                            startAdornment: <InputAdornment position="start">$</InputAdornment>,
                            endAdornment: <InputAdornment position="end">M</InputAdornment>
                          }}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                            }
                          }}
                        />
                        <FormControl fullWidth size="small">
                          <InputLabel 
                            sx={{
                              fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                            }}
                          >
                            Lead Contacts
                          </InputLabel>
                          <Select
                            value={editFormData.leadPartner === '__select_more__' ? '' : (editFormData.leadPartner || '')}
                            onChange={(e) => {
                              if (e.target.value === '__select_more__') {
                                // Update form data to track that we're in "select more" mode
                                setEditFormData({ ...editFormData, leadPartner: '__select_more__' });
                                // Open the select contacts modal
                                handleOpenSelectContacts();
                              } else {
                                setEditFormData({ ...editFormData, leadPartner: e.target.value });
                              }
                            }}
                            label="Lead Contacts"
                            sx={{
                              fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                            }}
                          >
                            <MenuItem value="">
                              <em>None</em>
                            </MenuItem>
                            {dealToEdit.people && dealToEdit.people.length > 0 ? (
                              dealToEdit.people.map((person) => (
                                <MenuItem key={person.id} value={person.name}>
                                  {person.name} {person.email ? `(${person.email})` : ''}
                                </MenuItem>
                              ))
                            ) : (
                              <MenuItem value="" disabled>
                                No contacts available
                              </MenuItem>
                            )}
                            <Divider />
                            <MenuItem value="__select_more__" sx={{ color: '#000000', fontWeight: 500 }}>
                              + Select More Contacts
                            </MenuItem>
                          </Select>
                        </FormControl>
                      </Box>

                      <Box sx={{ mb: 2 }}>
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            color: '#6b7280',
                            fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                            fontWeight: 500,
                            fontSize: '0.6875rem',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            display: 'block',
                            mb: 0.5
                          }}
                        >
                          Next Step
                        </Typography>
                        <TextField
                          value={editFormData.nextStep}
                          onChange={(e) => setEditFormData({ ...editFormData, nextStep: e.target.value })}
                          fullWidth
                          size="small"
                          multiline
                          rows={2}
                          placeholder="Enter next step..."
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                            }
                          }}
                        />
                      </Box>
                    </>
                  )}

                  {/* Actions */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 2, borderTop: '1px solid #e5e7eb' }}>
                    <Button
                      onClick={handleDeleteFromEdit}
                      sx={{
                        color: '#dc2626',
                        fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                        '&:hover': {
                          bgcolor: '#fee2e2'
                        }
                      }}
                      startIcon={<DeleteIcon />}
                    >
                      Delete Deal
                    </Button>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        onClick={handleCloseEdit}
                        sx={{
                          color: '#6b7280',
                          fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                          '&:hover': {
                            bgcolor: '#f3f4f6'
                          }
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="contained"
                        onClick={handleSaveEdit}
                        disabled={savingDeal}
                        sx={{
                          bgcolor: '#000000',
                          color: 'white',
                          fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                          '&:hover': {
                            bgcolor: '#111827'
                          },
                          '&:disabled': {
                            bgcolor: '#9ca3af',
                            color: 'white'
                          },
                          position: 'relative',
                          minWidth: 120
                        }}
                      >
                        {savingDeal ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CircularProgress size={14} sx={{ color: 'white' }} />
                            <span>Saving...</span>
                          </Box>
                        ) : (
                          'Save Changes'
                        )}
                      </Button>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Box>
          );
        })()}

        {/* Select Contacts Modal */}
        {editingDealId && (() => {
          const dealToEdit = dealsWithContacts.find(d => d.id === editingDealId);
          if (!dealToEdit) return null;
          
          return (
            <Dialog
              open={selectContactsOpen}
              onClose={handleCloseSelectContacts}
              maxWidth="sm"
              fullWidth
              PaperProps={{
                sx: {
                  borderRadius: 1,
                  maxHeight: '80vh'
                }
              }}
            >
              <DialogTitle sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                pb: 2,
                borderBottom: '1px solid #e5e7eb'
              }}>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontWeight: 600,
                    fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                  }}
                >
                  Select Contacts
                </Typography>
                <IconButton onClick={handleCloseSelectContacts} size="small">
                  <CloseIcon />
                </IconButton>
              </DialogTitle>
              <DialogContent sx={{ p: 2 }}>
                {contactsLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress />
                  </Box>
                ) : (
                  <Box>
                    {availableContacts.length === 0 ? (
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: '#6b7280',
                          textAlign: 'center',
                          py: 4,
                          fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                        }}
                      >
                        No contacts available
                      </Typography>
                    ) : (
                      <Box sx={{ maxHeight: '50vh', overflowY: 'auto' }}>
                        {availableContacts.map((contact) => (
                          <Box
                            key={contact.id}
                            onClick={() => handleToggleContact(contact.id)}
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              p: 1.5,
                              mb: 1,
                              border: '1px solid #e5e7eb',
                              borderRadius: 1,
                              bgcolor: selectedContactIds.includes(contact.id) ? '#f3f4f6' : 'white',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              '&:hover': {
                                borderColor: '#d1d5db',
                                bgcolor: selectedContactIds.includes(contact.id) ? '#e5e7eb' : '#fafafa'
                              }
                            }}
                          >
                            <Box sx={{ 
                              width: 20, 
                              height: 20, 
                              border: '2px solid #9ca3af',
                              borderRadius: '4px',
                              mr: 1.5,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              bgcolor: selectedContactIds.includes(contact.id) ? '#000000' : 'transparent',
                              borderColor: selectedContactIds.includes(contact.id) ? '#000000' : '#9ca3af'
                            }}>
                              {selectedContactIds.includes(contact.id) && (
                                <CheckIcon sx={{ fontSize: 14, color: 'white' }} />
                              )}
                            </Box>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography 
                                variant="body2" 
                                sx={{ 
                                  fontWeight: 500,
                                  color: '#111827',
                                  fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                                  mb: 0.25
                                }}
                              >
                                {contact.name}
                              </Typography>
                              {contact.email && (
                                <Typography 
                                  variant="caption" 
                                  sx={{ 
                                    color: '#6b7280',
                                    fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                                  }}
                                >
                                  {contact.email}
                                </Typography>
                              )}
                            </Box>
                          </Box>
                        ))}
                      </Box>
                    )}
                  </Box>
                )}
              </DialogContent>
              <DialogActions sx={{ px: 2, py: 1.5, borderTop: '1px solid #e5e7eb' }}>
                <Button
                  onClick={handleCloseSelectContacts}
                  sx={{
                    color: '#6b7280',
                    fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    '&:hover': {
                      bgcolor: '#f3f4f6'
                    }
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  onClick={handleAddContactsToDeal}
                  disabled={contactsLoading || selectedContactIds.length === 0}
                  sx={{
                    bgcolor: '#000000',
                    color: 'white',
                    fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    '&:hover': {
                      bgcolor: '#111827'
                    },
                    '&:disabled': {
                      bgcolor: '#9ca3af',
                      color: 'white'
                    },
                    position: 'relative',
                    minWidth: 140
                  }}
                >
                  {contactsLoading ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CircularProgress size={14} sx={{ color: 'white' }} />
                      <span>Updating...</span>
                    </Box>
                  ) : (
                    `Add ${selectedContactIds.length > 0 ? `${selectedContactIds.length} ` : ''}Contact${selectedContactIds.length !== 1 ? 's' : ''}`
                  )}
                </Button>
              </DialogActions>
            </Dialog>
          );
        })()}

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
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {selectedCompany?.company}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                {selectedCompany?.sector} • {formatDealValue(selectedCompany?.value || 0)}
              </Typography>
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
                    <Typography variant="body2" color="text.secondary">Main Contact</Typography>
                    <Typography variant="body1">{selectedCompany.leadPartner || (selectedCompany.people && selectedCompany.people.length > 0 ? selectedCompany.people[0].name : 'Unassigned')}</Typography>
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
                  {formatDealValue(activeDeal.value || 0)}
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
                  Main Contact
                </Typography>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: '#1f2937',
                    fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    fontWeight: 500
                  }}
                >
                  {activeDeal.leadPartner || (activeDeal.people && activeDeal.people.length > 0 ? activeDeal.people[0].name : 'Unassigned')}
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

        {/* Email Thread Modal */}
        <Dialog
          open={openEmailThreadModal}
          onClose={handleCloseEmailThread}
          maxWidth="lg"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 2,
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column'
            }
          }}
        >
          <DialogTitle
            sx={{
              borderBottom: '1px solid #e5e7eb',
              pb: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <EmailIcon sx={{ color: '#6b7280', fontSize: 24 }} />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Email Details
              </Typography>
            </Box>
            <IconButton
              onClick={handleCloseEmailThread}
              sx={{
                color: '#6b7280',
                '&:hover': {
                  bgcolor: '#f3f4f6'
                }
              }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent
            sx={{
              flex: 1,
              overflow: 'auto',
              p: 0,
              bgcolor: '#ffffff'
            }}
          >
            {selectedEmailThread && (() => {
              const commId = selectedEmailThread.id || selectedEmailThread.threadId || selectedEmailThread.messageId || '';
              const isLoading = loadingEmailContent.has(commId);
              let fullContent = emailFullContent[commId];

              if (isLoading) {
                return (
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 6 }}>
                    <CircularProgress size={40} />
                    <Typography variant="body2" sx={{ mt: 2, color: '#6b7280' }}>
                      Loading email content...
                    </Typography>
                  </Box>
                );
              }

              // Use fullContent if available, otherwise fall back to comm fields
              let displayContent = fullContent || selectedEmailThread.content || selectedEmailThread.snippet || 'No content available';

              // Final safety check: strip HTML if it's still present (catches any edge cases)
              if (displayContent && displayContent !== 'No content available' && displayContent.includes('<') && displayContent.includes('>')) {
                console.log('📧 [DealPipeline Modal] Stripping HTML from display content');
                displayContent = stripHtmlFromEmail(displayContent);
              }

              return (
                <Box
                  sx={{
                    bgcolor: '#ffffff',
                    borderRadius: 1,
                    border: '1px solid #e5e7eb',
                    m: 3
                  }}
                >
                  {/* Email metadata section */}
                  <Box
                    sx={{
                      p: 2.5,
                      bgcolor: '#f9fafb',
                      borderBottom: '1px solid #e5e7eb'
                    }}
                  >
                    {selectedEmailThread.fromEmail && (
                      <Box sx={{ mb: 1.5 }}>
                        <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.75rem' }}>
                          From:
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#1f2937', mt: 0.5 }}>
                          {selectedEmailThread.fromEmail}
                        </Typography>
                      </Box>
                    )}

                    {selectedEmailThread.toEmails && selectedEmailThread.toEmails.length > 0 && (
                      <Box sx={{ mb: 1.5 }}>
                        <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.75rem' }}>
                          To:
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#1f2937', mt: 0.5 }}>
                          {selectedEmailThread.toEmails.join(', ')}
                        </Typography>
                      </Box>
                    )}

                    {selectedEmailThread.subject && (
                      <Box sx={{ mb: 1.5 }}>
                        <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.75rem' }}>
                          Subject:
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#1f2937', mt: 0.5, fontWeight: 500 }}>
                          {selectedEmailThread.subject}
                        </Typography>
                      </Box>
                    )}

                    {(selectedEmailThread.sentAt || selectedEmailThread.receivedAt || selectedEmailThread.createdAt) && (
                      <Box>
                        <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.75rem' }}>
                          Date:
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#1f2937', mt: 0.5 }}>
                          {selectedEmailThread.sentAt
                            ? new Date(selectedEmailThread.sentAt).toLocaleString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                                hour: 'numeric',
                                minute: '2-digit',
                                hour12: true
                              })
                            : selectedEmailThread.receivedAt
                            ? new Date(selectedEmailThread.receivedAt).toLocaleString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                                hour: 'numeric',
                                minute: '2-digit',
                                hour12: true
                              })
                            : selectedEmailThread.createdAt
                            ? new Date(selectedEmailThread.createdAt).toLocaleString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                                hour: 'numeric',
                                minute: '2-digit',
                                hour12: true
                              })
                            : ''
                          }
                        </Typography>
                      </Box>
                    )}
                  </Box>

                  {/* Email body section */}
                  <Box sx={{ p: 3 }}>
                    <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.75rem', mb: 1.5, display: 'block' }}>
                      Message:
                    </Typography>
                    <Typography
                      variant="body1"
                      component="pre"
                      sx={{
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        color: '#1f2937',
                        lineHeight: 1.8,
                        fontSize: '0.9375rem',
                        fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                        margin: 0,
                        padding: 0
                      }}
                    >
                      {displayContent}
                    </Typography>
                  </Box>
                </Box>
              );
            })()}
          </DialogContent>
          <DialogActions sx={{ borderTop: '1px solid #e5e7eb', p: 2 }}>
            <Button
              onClick={handleCloseEmailThread}
              variant="outlined"
              sx={{
                borderColor: '#d1d5db',
                color: '#374151',
                '&:hover': {
                  borderColor: '#9ca3af',
                  bgcolor: '#f9fafb'
                }
              }}
            >
              Close
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </DndContext>
  );
}
