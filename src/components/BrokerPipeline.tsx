import React, { useState } from 'react';
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
  ListItemIcon
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
import { Broker } from '../services/brokersApi';

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

  const getBrokersForStage = (stage: string) => {
    if (stage === 'all') {
      // For "All", show brokers that don't have a specific stage or have stage='all'
      return brokers.filter(b => !b.stage || b.stage === 'all' ||
        (b.stage !== 'response-received' && b.stage !== 'closing'));
    }
    return brokers.filter(b => b.stage === stage);
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

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{
      display: 'flex',
      gap: 2,
      overflowX: 'auto',
      pb: 2,
      minHeight: '70vh'
    }}>
      {stages.map((stage) => {
        const stageBrokers = getBrokersForStage(stage.value);

        return (
          <Paper
            key={stage.value}
            sx={{
              minWidth: 350,
              maxWidth: 350,
              bgcolor: '#f8fafc',
              borderRadius: 3,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
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
                    color: 'white'
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
                    fontWeight: 500
                  }}
                />
              </Box>
              <Typography
                variant="body2"
                sx={{
                  fontSize: '0.9rem',
                  color: 'rgba(255, 255, 255, 0.8)'
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
                  <Typography variant="body2">
                    No brokers in this stage
                  </Typography>
                </Box>
              ) : (
                stageBrokers.map((broker) => (
                  <Card
                    key={broker.id}
                    sx={{
                      mb: 2,
                      borderRadius: 2,
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                      '&:hover': {
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                      },
                      transition: 'all 0.2s'
                    }}
                  >
                    {/* Card Header */}
                    <Box sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      p: 2,
                      pb: 1
                    }}>
                      <IconButton
                        size="small"
                        onClick={() => toggleBrokerExpansion(broker.id)}
                      >
                        {expandedBrokers.has(broker.id) ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      </IconButton>
                    </Box>

                    <CardContent sx={{ pt: 0 }}>
                      {/* Broker Name */}
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 700,
                          color: '#1e293b',
                          mb: 0.5,
                          fontSize: '1.1rem'
                        }}
                      >
                        {broker.name}
                      </Typography>

                      {/* Firm Name */}
                      {broker.firmName && (
                        <Typography variant="body2" sx={{ color: '#64748b', mb: 1 }}>
                          {broker.firmName}
                        </Typography>
                      )}

                      {/* Type Chip */}
                      {broker.type && (
                        <Chip
                          label={broker.type}
                          size="small"
                          sx={{ mb: 2, bgcolor: '#f1f5f9', color: '#475569' }}
                        />
                      )}

                      {/* Specialization */}
                      {broker.specialization && (
                        <Typography variant="body2" sx={{ color: '#64748b', mb: 2 }}>
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
                        />
                        <Chip
                          icon={<EmailIcon />}
                          label={`${broker.communicationCount || 0} email${broker.communicationCount !== 1 ? 's' : ''}`}
                          size="small"
                          variant="outlined"
                        />
                      </Box>

                      {/* Next Step */}
                      {broker.nextStep && (
                        <Box sx={{ bgcolor: '#fef3c7', p: 1.5, borderRadius: 1, mb: 2 }}>
                          <Typography variant="caption" sx={{ color: '#92400e', fontWeight: 600, display: 'block', mb: 0.5 }}>
                            NEXT STEP
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#78350f' }}>
                            {broker.nextStep}
                          </Typography>
                        </Box>
                      )}

                      {/* Associated Contacts Section - Always Visible (Mini View) */}
                      {!expandedBrokers.has(broker.id) && broker.people && broker.people.length > 0 && (
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block', fontWeight: 600 }}>
                            Associated Contacts
                          </Typography>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            {broker.people.slice(0, 3).map((person: any) => (
                              <Box
                                key={person.id}
                                sx={{
                                  p: 1,
                                  border: '1px solid',
                                  borderColor: '#e0e0e0',
                                  borderRadius: 1,
                                  bgcolor: '#f5f5f5'
                                }}
                              >
                                <Typography variant="caption" sx={{ fontWeight: 600, color: '#000000', display: 'block', mb: 0.5 }}>
                                  {person.name}
                                </Typography>
                                {person.email && (
                                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.7rem' }}>
                                    {person.email}
                                  </Typography>
                                )}
                                {person.title && (
                                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.65rem', mt: 0.5 }}>
                                    {person.title} {person.company && `• ${person.company}`}
                                  </Typography>
                                )}
                              </Box>
                            ))}
                            {broker.people.length > 3 && (
                              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                                +{broker.people.length - 3} more - Click expand to view all
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      )}

                      {/* Associated Emails Section - Always Visible (Mini View) */}
                      {!expandedBrokers.has(broker.id) && broker.communications && broker.communications.length > 0 && (
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block', fontWeight: 600 }}>
                            Associated Emails
                          </Typography>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            {broker.communications.slice(0, 3).map((comm: any) => (
                              <Box
                                key={comm.id || comm.threadId || Math.random()}
                                onClick={() => {
                                  setSelectedEmail(comm);
                                  setEmailModalOpen(true);
                                }}
                                sx={{
                                  p: 1,
                                  border: '1px solid',
                                  borderColor: '#e0e0e0',
                                  borderRadius: 1,
                                  bgcolor: '#f5f5f5',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s ease',
                                  '&:hover': {
                                    bgcolor: '#e8e8e8',
                                    borderColor: '#000000'
                                  }
                                }}
                              >
                                <Typography variant="caption" sx={{ fontWeight: 600, color: '#000000', display: 'block', mb: 0.5 }}>
                                  {comm.subject || '(No Subject)'}
                                </Typography>
                                {comm.fromEmail && (
                                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.7rem' }}>
                                    {comm.fromEmail}
                                  </Typography>
                                )}
                                {(comm.sentAt || comm.receivedAt || comm.createdAt) && (
                                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.65rem', mt: 0.5 }}>
                                    {comm.sentAt 
                                      ? new Date(comm.sentAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                                      : comm.receivedAt
                                      ? new Date(comm.receivedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                                      : comm.createdAt
                                      ? new Date(comm.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                                      : ''
                                    }
                                  </Typography>
                                )}
                              </Box>
                            ))}
                            {broker.communications.length > 3 && (
                              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                                +{broker.communications.length - 3} more - Click expand to view all
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      )}

                      {/* Expanded Section */}
                      <Collapse in={expandedBrokers.has(broker.id)}>
                        <Divider sx={{ my: 2 }} />

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
                            color: '#000000'
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
                                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, fontSize: '0.65rem', color: '#999999' }}>
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
                              <Typography variant="body2" color="text.secondary" sx={{ color: '#666666', fontWeight: 500 }}>
                                No contacts associated yet.
                              </Typography>
                              <Typography variant="caption" color="text.secondary" sx={{ color: '#999999', display: 'block', mt: 1 }}>
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
                            color: '#000000'
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
                                          whiteSpace: 'nowrap'
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
                                            color: '#666666'
                                          }}
                                        >
                                          From: {comm.fromEmail}
                                        </Typography>
                                      )}
                                      {(comm.sentAt || comm.receivedAt || comm.createdAt) && (
                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, fontSize: '0.65rem', color: '#999999' }}>
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
                              <Typography variant="body2" color="text.secondary" sx={{ color: '#666666', fontWeight: 500 }}>
                                No interactions recorded yet.
                              </Typography>
                              <Typography variant="caption" color="text.secondary" sx={{ color: '#999999', display: 'block', mt: 1 }}>
                                Interactions associated with this broker will appear here.
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      </Collapse>
                    </CardContent>

                    {/* Card Actions */}
                    <CardActions sx={{ px: 2, pb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Chip
                        label={broker.status}
                        size="small"
                        sx={{
                          bgcolor: getStatusColor(broker.status),
                          color: 'white',
                          fontWeight: 600,
                          fontSize: '0.7rem'
                        }}
                      />
                      <IconButton 
                        size="small" 
                        onClick={(e) => handleActionClick(e, broker.id)}
                        sx={{
                          ml: 'auto',
                          bgcolor: '#000000',
                          color: 'white',
                          '&:hover': {
                            bgcolor: '#333333'
                          }
                        }}
                      >
                        <AddIcon fontSize="small" />
                      </IconButton>
                    </CardActions>
                  </Card>
                ))
              )}
            </Box>
          </Paper>
        );
      })}

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
    </Box>
  );
}
