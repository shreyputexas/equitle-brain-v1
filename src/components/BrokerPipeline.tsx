import React, { useState, useRef } from 'react';
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
  Avatar,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Menu,
  MenuItem,
  ListItemIcon,
  Snackbar,
  Alert
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Business as BusinessIcon,
  MoreVert as MoreVertIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Add as AddIcon
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
import { Broker } from '../services/brokersApi';
import brokersApi from '../services/brokersApi';

interface BrokerPipelineProps {
  brokers: Broker[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  onEditBroker: (broker: Broker) => void;
  onDeleteBroker: (brokerId: string) => void;
}

const stages = [
  { value: 'all', label: 'All', color: '#64748b' },
  { value: 'response-received', label: 'Response Received', color: '#f59e0b' },
  { value: 'closing', label: 'Closing', color: '#10b981' }
];

export default function BrokerPipeline({
  brokers,
  loading,
  error,
  onRefresh,
  onEditBroker,
  onDeleteBroker
}: BrokerPipelineProps) {
  const ACCENT_MAROON = '#800020';
  const [expandedBrokers, setExpandedBrokers] = useState<Set<string>>(new Set());
  const [selectedEmail, setSelectedEmail] = useState<any>(null);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedBrokerId, setSelectedBrokerId] = useState<string | null>(null);
  const [actionModalOpen, setActionModalOpen] = useState(false);
  
  // Drag and drop state
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [optimisticStageUpdates, setOptimisticStageUpdates] = useState<Map<string, string>>(new Map());
  const [brokersInAllOnly, setBrokersInAllOnly] = useState<Set<string>>(new Set());
  const pendingDragsRef = useRef<Set<string>>(new Set());
  
  // Configure sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px of movement before starting drag
      },
    }),
    useSensor(KeyboardSensor)
  );

  // Clear optimistic state when brokers change (after refresh from backend)
  React.useEffect(() => {
    // Clear any stale optimistic updates
    setOptimisticStageUpdates(new Map());
    setBrokersInAllOnly(new Set());
  }, [brokers]);

  const toggleBrokerExpansion = (brokerId: string) => {
    setExpandedBrokers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(brokerId)) {
        newSet.delete(brokerId);
      } else {
        newSet.add(brokerId);
      }
      return newSet;
    });
  };

  // Apply optimistic stage updates to brokers for instant UI feedback
  const brokersWithOptimisticStages = brokers.map(broker => {
    const optimisticStage = optimisticStageUpdates.get(broker.id);
    const finalStage = (optimisticStage || broker.stage || 'all') as 'all' | 'response-received' | 'closing';
    return { ...broker, stage: finalStage };
  });

  const getBrokersForStage = (stage: string) => {
    if (stage === 'all') {
      // For "All", show brokers that don't have a specific stage or have stage='all'
      // But exclude brokers that are marked to appear only in "All" if they're in other stages
      return brokersWithOptimisticStages.filter(b => {
        // If broker is marked to appear only in "All", show it here
        if (brokersInAllOnly.has(b.id)) {
          return true;
        }
        // Otherwise, show brokers that don't have a specific stage or have stage='all'
        return !b.stage || b.stage === 'all' ||
          (b.stage !== 'response-received' && b.stage !== 'closing');
      });
    }
    // For specific stages, exclude brokers marked to appear only in "All"
    return brokersWithOptimisticStages.filter(b => 
      b.stage === stage && !brokersInAllOnly.has(b.id)
    );
  };

  const getStageColor = (stage: string) => {
    const stageObj = stages.find(s => s.value === stage);
    return stageObj?.color || '#64748b';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#10b981';
      case 'paused': return '#f59e0b';
      case 'closed': return '#6b7280';
      case 'not-interested': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getRelationshipScoreColor = (score: number) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'error';
  };

  const getStatusChipColor = (status: string) => {
    switch (status) {
      case 'hot': return 'error';
      case 'warm': return 'warning';
      case 'cold': return 'info';
      default: return 'default';
    }
  };

  const handleActionClick = (event: React.MouseEvent<HTMLElement>, brokerId: string) => {
    event.stopPropagation();
    setSelectedBrokerId(brokerId);
    setActionModalOpen(true);
  };

  const handleActionModalClose = () => {
    setActionModalOpen(false);
    setSelectedBrokerId(null);
  };

  const handleEditBrokerClick = () => {
    if (selectedBrokerId) {
      const broker = brokers.find(b => b.id === selectedBrokerId);
      if (broker) {
        onEditBroker(broker);
      }
    }
    handleActionModalClose();
  };

  const handleDeleteBrokerClick = () => {
    if (selectedBrokerId) {
      onDeleteBroker(selectedBrokerId);
    }
    handleActionModalClose();
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

    const brokerId = active.id as string;
    const targetStage = over.id as string;

    // Prevent multiple simultaneous drags of the same broker
    if (pendingDragsRef.current.has(brokerId)) {
      return;
    }

    // Find the broker being moved
    const brokerToMove = brokersWithOptimisticStages.find(b => b.id === brokerId);
    if (!brokerToMove) {
      console.error('Broker not found:', brokerId);
      return;
    }

    // Mark this drag as pending
    pendingDragsRef.current.add(brokerId);

    const currentStage = brokerToMove.stage || 'all';

    // Don't do anything if the broker is already in the target stage
    if (currentStage === targetStage) {
      pendingDragsRef.current.delete(brokerId);
      return;
    }

    // Update optimistic stage immediately for instant UI feedback
    setOptimisticStageUpdates(prev => {
      const newMap = new Map(prev);
      newMap.set(brokerToMove.id, targetStage);
      return newMap;
    });

    // Handle "All" stage differently for UI purposes
    if (targetStage === 'all') {
      // Add broker to the set of brokers that should appear only in "All"
      setBrokersInAllOnly(prev => {
        const newSet = new Set(prev);
        newSet.add(brokerToMove.id);
        return newSet;
      });
    } else {
      // Remove from "All only" set if it was there
      setBrokersInAllOnly(prev => {
        const newSet = new Set(prev);
        newSet.delete(brokerToMove.id);
        return newSet;
      });
    }

    const stageName = stages.find(s => s.value === targetStage)?.label || targetStage;
    setSnackbarMessage(`✓ ${brokerToMove.name} moved to ${stageName}`);
    setSnackbarOpen(true);

    try {
      // Update broker stage in backend - this persists the change to the database
      await brokersApi.updateBroker(brokerToMove.id, { stage: targetStage as 'all' | 'response-received' | 'closing' });

      // Refresh the brokers list to get updated data from the backend
      await onRefresh();

      // Clear optimistic updates after successful refresh
      setOptimisticStageUpdates(prev => {
        const newMap = new Map(prev);
        newMap.delete(brokerToMove.id);
        return newMap;
      });

      // Remove from pending drags
      pendingDragsRef.current.delete(brokerToMove.id);
    } catch (error) {
      console.error('Error updating broker stage:', error);

      // Revert optimistic update on error
      setOptimisticStageUpdates(prev => {
        const newMap = new Map(prev);
        newMap.delete(brokerToMove.id);
        return newMap;
      });

      // Revert "All only" state on error
      if (targetStage === 'all') {
        setBrokersInAllOnly(prev => {
          const newSet = new Set(prev);
          newSet.delete(brokerToMove.id);
          return newSet;
        });
      }

      setSnackbarMessage(`✗ Failed to move ${brokerToMove.name}`);
      setSnackbarOpen(true);

      // Remove from pending drags
      pendingDragsRef.current.delete(brokerToMove.id);
    }
  };

  // Draggable Broker Card Component
  const DraggableBrokerCard = ({ broker }: { broker: Broker }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      isDragging,
    } = useDraggable({
      id: broker.id,
      data: {
        type: 'broker',
        broker,
      },
    });

    const style = transform
      ? {
          transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        }
      : undefined;

    const isExpanded = expandedBrokers.has(broker.id);

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
          borderRadius: 1, // More rectangular
          bgcolor: 'white',
          border: '1px solid #e5e7eb',
          opacity: isDragging ? 0.3 : 1,
          transform: style?.transform || 'scale(1)',
          transition: isDragging 
            ? 'none' 
            : 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: isDragging 
            ? '0 20px 40px rgba(0,0,0,0.3), 0 0 0 1px rgba(0,0,0,0.1)' 
            : '0 1px 3px rgba(0,0,0,0.08)',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          position: 'relative',
          zIndex: isDragging ? 1000 : 'auto',
          willChange: isDragging ? 'transform' : 'auto',
          overflow: 'hidden',
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
            toggleBrokerExpansion(broker.id);
          }
        }}
      >
        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 }, width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
          {/* Minimal collapsed view - just broker name and firm name */}
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
                  {broker.name}
                </Typography>
                {broker.firmName && (
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
                    {broker.firmName}
                  </Typography>
                )}
              </Box>
              <Tooltip title={expandedBrokers.has(broker.id) ? "Hide details" : "Show details"}>
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleBrokerExpansion(broker.id);
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

          {/* Expanded view with all details */}
          <Collapse in={isExpanded} timeout={300}>
            <Box sx={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
              {/* Header with broker info */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2, width: '100%', pb: 2, borderBottom: '1px solid #e5e7eb' }}>
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
                    {broker.name}
                  </Typography>
                  {broker.firmName && (
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: '#6b7280',
                        fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                        fontWeight: 400,
                        fontSize: '0.8125rem'
                      }}
                    >
                      {broker.firmName}
                    </Typography>
                  )}
                </Box>
                <Tooltip title="Hide details">
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleBrokerExpansion(broker.id);
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

              {/* Type Chip */}
              {broker.type && (
                <Chip
                  label={broker.type}
                  size="small"
                  sx={{ mb: 2, bgcolor: '#f1f5f9', color: '#475569', fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
                />
              )}

              {/* Specialization */}
              {broker.specialization && (
                <Typography variant="body2" sx={{ color: '#64748b', mb: 2, fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
                  <strong>Focus:</strong> {broker.specialization}
                </Typography>
              )}

              {/* Contact & Email Counts */}
              <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                <Chip
                  icon={<PersonIcon />}
                  label={`${broker.contactCount || 0} contact${broker.contactCount !== 1 ? 's' : ''}`}
                  size="small"
                  variant="outlined"
                  sx={{ fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
                />
                <Chip
                  icon={<EmailIcon />}
                  label={`${broker.communicationCount || 0} email${broker.communicationCount !== 1 ? 's' : ''}`}
                  size="small"
                  variant="outlined"
                  sx={{ fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
                />
              </Box>

              {/* Next Step */}
              {broker.nextStep && (
                <Box sx={{ bgcolor: '#fef3c7', p: 1.5, borderRadius: 1, mb: 2 }}>
                  <Typography variant="caption" sx={{ color: '#92400e', fontWeight: 600, display: 'block', mb: 0.5, fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
                    NEXT STEP
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#78350f', fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
                    {broker.nextStep}
                  </Typography>
                </Box>
              )}


              {/* Key Contacts */}
              <Box sx={{ 
                mt: 0, 
                p: 2, 
                bgcolor: '#f5f5f5', 
                borderRadius: 2,
                border: '1px solid',
                borderColor: '#e0e0e0',
                mb: 3
              }}>
                <Typography variant="subtitle1" sx={{ 
                  fontWeight: 600, 
                  mb: 2, 
                  display: 'flex', 
                  alignItems: 'center',
                  color: '#000000',
                  fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                }}>
                  <PersonIcon sx={{ mr: 1, fontSize: 20 }} />
                  Key Contacts ({broker.people?.length || 0})
                </Typography>
              {broker.people && broker.people.length > 0 ? (
                broker.people.map((person: any) => (
                  <Box
                    key={person.id}
                    sx={{
                      p: 1.5,
                      mb: 1,
                      border: '1px solid',
                      borderColor: '#e0e0e0',
                      borderRadius: 1.5,
                      bgcolor: '#ffffff',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        transform: 'translateY(-1px)'
                      }
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography 
                          variant="subtitle2" 
                          sx={{ 
                            fontWeight: 600,
                            color: '#000000',
                            mb: 0.5,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {person.name}
                        </Typography>
                        {person.email && (
                          <Typography 
                            variant="caption" 
                            color="text.secondary"
                            sx={{ 
                              display: 'block',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              color: '#666666'
                            }}
                          >
                            {person.email}
                          </Typography>
                        )}
                        {person.title && (
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, fontSize: '0.65rem', color: '#999999', fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
                            {person.title} {person.company && `• ${person.company}`}
                          </Typography>
                        )}
                      </Box>
                      {person.status && (
                        <Chip
                          label={person.status}
                          size="small"
                          sx={{
                            bgcolor: '#f5f5f5',
                            color: '#000000',
                            border: '1px solid #000000',
                            fontSize: '0.7rem',
                            height: 20,
                            fontWeight: 600
                          }}
                        />
                      )}
                    </Box>
                    {person.relationshipScore !== undefined && (
                      <Box sx={{ mt: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                          <Typography variant="caption" sx={{ color: '#666666' }}>
                            Relationship
                          </Typography>
                          <Typography variant="caption" sx={{ fontWeight: 600, color: '#000000' }}>
                            {person.relationshipScore}/100
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={person.relationshipScore}
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
                    )}
                  </Box>
                ))
              ) : (
                <Box sx={{ textAlign: 'left', py: 2, border: '1px dashed #cccccc', borderRadius: 1, p: 2 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ color: '#666666', fontWeight: 500, fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
                    No contacts associated yet.
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ color: '#999999', display: 'block', mt: 1, fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
                    Contacts associated with this broker will appear here.
                  </Typography>
                </Box>
              )}
            </Box>

            {/* Key Interactions */}
            <Box sx={{ 
              mt: 0, 
              p: 2, 
              bgcolor: '#f5f5f5', 
              borderRadius: 2,
              border: '1px solid',
              borderColor: '#e0e0e0',
              mb: 3
            }}>
              <Typography variant="subtitle1" sx={{ 
                fontWeight: 600, 
                mb: 2, 
                display: 'flex', 
                alignItems: 'center',
                color: '#000000',
                fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
              }}>
                <EmailIcon sx={{ mr: 1, fontSize: 20 }} />
                Key Interactions ({broker.communications?.length || broker.communicationCount || 0})
              </Typography>
              {broker.communications && broker.communications.length > 0 ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {broker.communications.map((comm: any) => (
                    <Box
                      key={comm.id || comm.threadId || Math.random()}
                      onClick={() => {
                        setSelectedEmail(comm);
                        setEmailModalOpen(true);
                      }}
                      sx={{
                        p: 1.5,
                        border: '1px solid',
                        borderColor: '#e0e0e0',
                        borderRadius: 1.5,
                        bgcolor: '#ffffff',
                        transition: 'all 0.2s ease',
                        cursor: 'pointer',
                        '&:hover': {
                          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                          transform: 'translateY(-1px)',
                          borderColor: '#000000'
                        }
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography 
                            variant="subtitle2" 
                            sx={{ 
                              fontWeight: 600,
                              color: '#000000',
                              mb: 0.5,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                            }}
                          >
                            {comm.subject || '(No Subject)'}
                          </Typography>
                          {comm.fromEmail && (
                            <Typography 
                              variant="caption" 
                              color="text.secondary"
                              sx={{ 
                                display: 'block',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                color: '#666666',
                                fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                              }}
                            >
                              From: {comm.fromEmail}
                            </Typography>
                          )}
                          {(comm.sentAt || comm.receivedAt || comm.createdAt) && (
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, fontSize: '0.65rem', color: '#999999', fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
                              {comm.sentAt 
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
                        {comm.direction && (
                          <Chip
                            label={comm.direction === 'inbound' ? 'Inbound' : comm.direction === 'outbound' ? 'Outbound' : 'Email'}
                            size="small"
                            sx={{
                              bgcolor: '#f5f5f5',
                              color: '#000000',
                              border: '1px solid #000000',
                              fontSize: '0.7rem',
                              height: 20,
                              fontWeight: 600
                            }}
                          />
                        )}
                      </Box>
                      {comm.snippet && (
                        <Typography 
                          variant="caption" 
                          color="text.secondary"
                          sx={{
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            lineHeight: 1.4,
                            mt: 0.5,
                            color: '#666666'
                          }}
                        >
                          {comm.snippet}
                        </Typography>
                      )}
                    </Box>
                  ))}
                </Box>
              ) : (
                <Box sx={{ textAlign: 'left', py: 2, border: '1px dashed #cccccc', borderRadius: 1, p: 2 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ color: '#666666', fontWeight: 500, fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
                    No interactions recorded yet.
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ color: '#999999', display: 'block', mt: 1, fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
                    Interactions associated with this broker will appear here.
                  </Typography>
                </Box>
              )}
              </Box>
            </Box>
          </Collapse>
        </CardContent>

        {/* Card Actions - only show in expanded view */}
        <Collapse in={isExpanded} timeout={300}>
          <CardActions sx={{ px: 2, py: 1.5, justifyContent: 'flex-end', minHeight: 'auto', borderTop: '1px solid #e5e7eb' }}>
            <IconButton 
              size="small" 
              onClick={(e) => {
                e.stopPropagation();
                handleActionClick(e, broker.id);
              }}
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
          minWidth: 400,
          maxWidth: 'none',
          borderRadius: 3,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          border: isOver ? '2px solid #10b981' : '1px solid #e5e7eb',
          bgcolor: isOver ? '#f0fdf4' : '#ffffff',
          boxShadow: isOver
            ? '0 8px 24px rgba(16, 185, 129, 0.25)'
            : '0 2px 8px rgba(0,0,0,0.05)',
          transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
          transform: isOver ? 'scale(1.005)' : 'scale(1)',
          position: 'relative',
          zIndex: isOver ? 100 : 1,
          willChange: isOver ? 'transform, box-shadow' : 'auto',
        }}
      >
        {children}
      </Paper>
    );
  };

  // Get active broker for drag overlay
  const activeBroker = activeId ? brokersWithOptimisticStages.find(b => b.id === activeId) : null;

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Ensure sensors are properly initialized
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
      <Box sx={{ mt: 2, position: 'relative', width: '100%' }}>
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
                  Broker Pipeline
                </Typography>
                <Chip
                  size="small"
                  label={`${brokers.length} Broker${brokers.length !== 1 ? 's' : ''}`}
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
                Track and manage your broker relationships
              </Typography>
            </Box>
          </Box>
        </Box>

        <Box sx={{
          display: 'flex',
          gap: 2,
          overflowX: 'auto',
          pb: 2,
          minHeight: '70vh',
          position: 'relative',
          zIndex: 1,
          px: 4
        }}>
        {stages.map((stage) => {
          const stageBrokers = getBrokersForStage(stage.value);

          return (
            <DroppableStage key={stage.value} stage={stage}>
            {/* Stage Header */}
            <Box sx={{
              background: 'linear-gradient(180deg, #2c2c2c 0%, #1a1a1a 100%)',
              color: 'white',
              py: 2,
              px: 2,
              borderRadius: '12px 12px 0 0'
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
                  label={`${stageBrokers.length} broker${stageBrokers.length !== 1 ? 's' : ''}`}
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
                  fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                }}
              >
                $0 total value
              </Typography>
            </Box>

            {/* Broker Cards */}
            <Box
              sx={{
                minHeight: 400,
                p: 1.5,
                overflowY: 'auto'
              }}
            >
              {stageBrokers.length === 0 ? (
                <Box sx={{
                  textAlign: 'center',
                  py: 8,
                  border: '2px dashed #cbd5e1',
                  borderRadius: 2,
                  color: '#94a3b8'
                }}>
                  <BusinessIcon sx={{ fontSize: 48, mb: 1, opacity: 0.5 }} />
                  <Typography variant="body2" sx={{ fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
                    No brokers in this stage
                  </Typography>
                </Box>
              ) : (
                stageBrokers.map((broker) => (
                  <DraggableBrokerCard key={broker.id} broker={broker} />
                ))
              )}
            </Box>
          </DroppableStage>
        );
      })}
        </Box>
      </Box>

      {/* Broker Action Modal */}
      <Dialog
        open={actionModalOpen}
        onClose={handleActionModalClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2
          }
        }}
      >
        <DialogTitle sx={{ 
          borderBottom: '1px solid #e0e0e0',
          pb: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}>
          <BusinessIcon />
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#000000' }}>
            Broker Actions
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ pt: 3, pb: 2 }}>
          {selectedBrokerId && (
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Choose an action for this broker
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Button
                  variant="outlined"
                  startIcon={<EditIcon />}
                  onClick={handleEditBrokerClick}
                  fullWidth
                  sx={{
                    py: 1.5,
                    borderColor: '#000000',
                    color: '#000000',
                    '&:hover': {
                      borderColor: '#333333',
                      bgcolor: '#f5f5f5'
                    }
                  }}
                >
                  Edit Broker
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<DeleteIcon />}
                  onClick={handleDeleteBrokerClick}
                  fullWidth
                  sx={{
                    py: 1.5,
                    borderColor: '#ef4444',
                    color: '#ef4444',
                    '&:hover': {
                      borderColor: '#dc2626',
                      bgcolor: '#fee2e2'
                    }
                  }}
                >
                  Delete Broker
                </Button>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ 
          borderTop: '1px solid #e0e0e0',
          px: 3,
          py: 2
        }}>
          <Button 
            onClick={handleActionModalClose}
            sx={{ 
              color: '#666666',
              fontWeight: 500
            }}
          >
            Cancel
          </Button>
        </DialogActions>
      </Dialog>

      {/* Email Detail Modal */}
      <Dialog
        open={emailModalOpen}
        onClose={() => {
          setEmailModalOpen(false);
          setSelectedEmail(null);
        }}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            maxHeight: '90vh'
          }
        }}
      >
        {selectedEmail && (
          <>
            <DialogTitle sx={{ 
              borderBottom: '1px solid #e0e0e0',
              pb: 2
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <EmailIcon />
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#000000' }}>
                  {selectedEmail.subject || '(No Subject)'}
                </Typography>
              </Box>
              {selectedEmail.direction && (
                <Chip
                  label={selectedEmail.direction === 'inbound' ? 'Inbound' : selectedEmail.direction === 'outbound' ? 'Outbound' : 'Email'}
                  size="small"
                  sx={{
                    bgcolor: '#f5f5f5',
                    color: '#000000',
                    border: '1px solid #000000',
                    fontSize: '0.7rem',
                    fontWeight: 600
                  }}
                />
              )}
            </DialogTitle>
            <DialogContent sx={{ 
              pt: 3,
              pb: 2,
              overflow: 'auto'
            }}>
              {/* Email Metadata */}
              <Box sx={{ mb: 3, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {selectedEmail.fromEmail && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <EmailIcon fontSize="small" sx={{ color: '#666666' }} />
                      <Typography variant="body2" sx={{ color: '#000000' }}>
                        <strong>From:</strong> {selectedEmail.fromEmail}
                      </Typography>
                    </Box>
                  )}
                  {selectedEmail.toEmails && selectedEmail.toEmails.length > 0 && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <EmailIcon fontSize="small" sx={{ color: '#666666' }} />
                      <Typography variant="body2" sx={{ color: '#000000' }}>
                        <strong>To:</strong> {selectedEmail.toEmails.join(', ')}
                      </Typography>
                    </Box>
                  )}
                  {(selectedEmail.sentAt || selectedEmail.receivedAt || selectedEmail.createdAt) && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" sx={{ color: '#000000' }}>
                        <strong>Date:</strong> {
                          selectedEmail.sentAt 
                            ? new Date(selectedEmail.sentAt).toLocaleString('en-US', { 
                                month: 'short', 
                                day: 'numeric', 
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })
                            : selectedEmail.receivedAt
                            ? new Date(selectedEmail.receivedAt).toLocaleString('en-US', { 
                                month: 'short', 
                                day: 'numeric', 
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })
                            : selectedEmail.createdAt
                            ? new Date(selectedEmail.createdAt).toLocaleString('en-US', { 
                                month: 'short', 
                                day: 'numeric', 
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })
                            : 'Unknown date'
                        }
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Box>

              <Divider sx={{ mb: 3 }} />

              {/* Email Content */}
              <Box>
                <Typography variant="body2" sx={{ 
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  color: '#000000',
                  lineHeight: 1.6,
                  '& img': { maxWidth: '100%', height: 'auto' }
                }}>
                  {selectedEmail.content 
                    ? selectedEmail.content.replace(/<[^>]*>/g, '').trim() || selectedEmail.content
                    : selectedEmail.snippet 
                    ? selectedEmail.snippet
                    : 'No content available'}
                </Typography>
              </Box>
            </DialogContent>
            <DialogActions sx={{ 
              borderTop: '1px solid #e0e0e0',
              px: 3,
              py: 2
            }}>
              <Button 
                onClick={() => {
                  setEmailModalOpen(false);
                  setSelectedEmail(null);
                }}
                sx={{ 
                  color: '#666666',
                  fontWeight: 500
                }}
              >
                Close
              </Button>
            </DialogActions>
          </>
        )}
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
          severity={snackbarMessage.startsWith('✗') ? 'error' : 'success'}
          sx={{ width: '100%' }}
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
        style={{ zIndex: 9999 }}
      >
        {activeBroker ? (
          <Card
            sx={{
              minWidth: 400,
              borderRadius: 2,
              boxShadow: '0 20px 40px rgba(0,0,0,0.3), 0 0 0 1px rgba(0,0,0,0.1)',
              bgcolor: 'white',
              border: '1px solid #e5e7eb',
              opacity: 0.95,
              transform: 'rotate(2deg) scale(1.03)',
              transition: 'all 0.1s cubic-bezier(0.4, 0, 0.2, 1)',
              position: 'relative',
              zIndex: 9999,
            }}
          >
            <CardContent sx={{ p: 2 }}>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  color: '#1e293b',
                  mb: 0.5,
                  fontSize: '1.1rem'
                }}
              >
                {activeBroker.name}
              </Typography>
              {activeBroker.firmName && (
                <Typography variant="body2" sx={{ color: '#64748b' }}>
                  {activeBroker.firmName}
                </Typography>
              )}
              {activeBroker.type && (
                <Chip
                  label={activeBroker.type}
                  size="small"
                  sx={{ mt: 1, bgcolor: '#f1f5f9', color: '#475569' }}
                />
              )}
            </CardContent>
          </Card>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
