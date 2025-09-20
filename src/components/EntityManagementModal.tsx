import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  TextField,
  Grid,
  Card,
  CardContent,
  Chip,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Alert,
  CircularProgress,
  Checkbox,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Avatar,
  AvatarGroup
} from '@mui/material';
import {
  Add as AddIcon,
  Business as BusinessIcon,
  Group as GroupIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { Deal as ApiDeal } from '../services/dealsApi';

interface EntityGroup {
  id: string;
  name: string;
  description?: string;
  entities: string[];
  createdAt: Date;
}

interface FundInvestment {
  id: string;
  fundName: string;
  fundSize: number;
  investmentAmount: number;
  investmentDate: Date;
  status: 'active' | 'exited' | 'pending';
  commitmentAmount?: number;
  remainingCommitment?: number;
}

interface EntityDetails {
  name: string;
  investments: FundInvestment[];
  totalInvested: number;
  totalCommitments: number;
  activeInvestments: number;
}

interface EntityManagementModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function EntityManagementModal({ open, onClose, onSuccess }: EntityManagementModalProps) {
  const [entityGroups, setEntityGroups] = useState<EntityGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<EntityGroup | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');
  const [availableEntities, setAvailableEntities] = useState<string[]>([]);
  const [selectedEntities, setSelectedEntities] = useState<string[]>([]);
  const [entityDetailsOpen, setEntityDetailsOpen] = useState(false);
  const [groupDetailsOpen, setGroupDetailsOpen] = useState(false);
  const [selectedEntityDetails, setSelectedEntityDetails] = useState<EntityDetails | null>(null);
  const [selectedGroupDetails, setSelectedGroupDetails] = useState<EntityGroup | null>(null);

  // Mock data for demonstration
  const mockEntities = [
    'ABC Capital LLC',
    'ABC Capital Partners LP',
    'ABC Capital Management Inc',
    'XYZ Ventures LLC',
    'XYZ Ventures Partners LP',
    'XYZ Family Office',
    'DEF Investment Group LLC',
    'DEF Investment Partners LP',
    'GHI Capital LLC',
    'GHI Capital Partners LP'
  ];

  // Mock investment data
  const mockInvestmentData: { [entityName: string]: FundInvestment[] } = {
    'ABC Capital LLC': [
      {
        id: '1',
        fundName: 'Equitle Fund I',
        fundSize: 100000000,
        investmentAmount: 5000000,
        investmentDate: new Date('2023-01-15'),
        status: 'active',
        commitmentAmount: 10000000,
        remainingCommitment: 5000000
      },
      {
        id: '2',
        fundName: 'Equitle Fund II',
        fundSize: 200000000,
        investmentAmount: 15000000,
        investmentDate: new Date('2024-03-20'),
        status: 'active',
        commitmentAmount: 20000000,
        remainingCommitment: 5000000
      }
    ],
    'ABC Capital Partners LP': [
      {
        id: '3',
        fundName: 'Equitle Fund I',
        fundSize: 100000000,
        investmentAmount: 3000000,
        investmentDate: new Date('2023-01-15'),
        status: 'active',
        commitmentAmount: 5000000,
        remainingCommitment: 2000000
      }
    ],
    'XYZ Ventures LLC': [
      {
        id: '4',
        fundName: 'Equitle Fund II',
        fundSize: 200000000,
        investmentAmount: 10000000,
        investmentDate: new Date('2024-03-20'),
        status: 'active',
        commitmentAmount: 15000000,
        remainingCommitment: 5000000
      }
    ],
    'XYZ Ventures Partners LP': [
      {
        id: '5',
        fundName: 'Equitle Fund I',
        fundSize: 100000000,
        investmentAmount: 2000000,
        investmentDate: new Date('2023-01-15'),
        status: 'exited',
        commitmentAmount: 2000000,
        remainingCommitment: 0
      }
    ]
  };

  useEffect(() => {
    if (open) {
      setAvailableEntities(mockEntities);
      // Load existing entity groups
      loadEntityGroups();
    }
  }, [open]);

  const loadEntityGroups = async () => {
    setLoading(true);
    try {
      // Mock data - in real implementation, this would fetch from API
      const mockGroups: EntityGroup[] = [
        {
          id: '1',
          name: 'ABC Capital Group',
          description: 'Main ABC Capital entities',
          entities: ['ABC Capital LLC', 'ABC Capital Partners LP', 'ABC Capital Management Inc'],
          createdAt: new Date()
        },
        {
          id: '2',
          name: 'XYZ Ventures Group',
          description: 'XYZ Ventures family of entities',
          entities: ['XYZ Ventures LLC', 'XYZ Ventures Partners LP', 'XYZ Family Office'],
          createdAt: new Date()
        }
      ];
      setEntityGroups(mockGroups);
    } catch (err) {
      setError('Failed to load entity groups');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = () => {
    setIsCreating(true);
    setNewGroupName('');
    setNewGroupDescription('');
    setSelectedEntities([]);
  };

  const handleEditGroup = (group: EntityGroup) => {
    setSelectedGroup(group);
    setIsEditing(true);
    setNewGroupName(group.name);
    setNewGroupDescription(group.description || '');
    setSelectedEntities(group.entities);
  };

  const handleSaveGroup = async () => {
    if (!newGroupName.trim()) return;

    try {
      setLoading(true);
      const newGroup: EntityGroup = {
        id: selectedGroup?.id || Date.now().toString(),
        name: newGroupName.trim(),
        description: newGroupDescription.trim(),
        entities: selectedEntities,
        createdAt: selectedGroup?.createdAt || new Date()
      };

      if (isEditing && selectedGroup) {
        setEntityGroups(prev => prev.map(g => g.id === selectedGroup.id ? newGroup : g));
      } else {
        setEntityGroups(prev => [...prev, newGroup]);
      }

      setIsCreating(false);
      setIsEditing(false);
      setSelectedGroup(null);
      setNewGroupName('');
      setNewGroupDescription('');
      setSelectedEntities([]);
    } catch (err) {
      setError('Failed to save entity group');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    try {
      setEntityGroups(prev => prev.filter(g => g.id !== groupId));
    } catch (err) {
      setError('Failed to delete entity group');
    }
  };

  const handleEntityToggle = (entity: string) => {
    setSelectedEntities(prev => 
      prev.includes(entity) 
        ? prev.filter(e => e !== entity)
        : [...prev, entity]
    );
  };

  const handleEntityClick = (entityName: string) => {
    const investments = mockInvestmentData[entityName] || [];
    const totalInvested = investments.reduce((sum, inv) => sum + inv.investmentAmount, 0);
    const totalCommitments = investments.reduce((sum, inv) => sum + (inv.commitmentAmount || 0), 0);
    const activeInvestments = investments.filter(inv => inv.status === 'active').length;

    setSelectedEntityDetails({
      name: entityName,
      investments,
      totalInvested,
      totalCommitments,
      activeInvestments
    });
    setEntityDetailsOpen(true);
  };

  const handleGroupClick = (group: EntityGroup) => {
    setSelectedGroupDetails(group);
    setGroupDetailsOpen(true);
  };

  const getGroupInvestmentSummary = (group: EntityGroup) => {
    const allInvestments: FundInvestment[] = [];
    group.entities.forEach(entity => {
      const entityInvestments = mockInvestmentData[entity] || [];
      allInvestments.push(...entityInvestments);
    });

    const totalInvested = allInvestments.reduce((sum, inv) => sum + inv.investmentAmount, 0);
    const totalCommitments = allInvestments.reduce((sum, inv) => sum + (inv.commitmentAmount || 0), 0);
    const activeInvestments = allInvestments.filter(inv => inv.status === 'active').length;

    return {
      totalInvested,
      totalCommitments,
      activeInvestments,
      allInvestments
    };
  };

  const filteredGroups = entityGroups.filter(group =>
    group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    group.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredEntities = availableEntities.filter(entity =>
    entity.toLowerCase().includes(searchTerm.toLowerCase()) &&
    !selectedEntities.includes(entity)
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
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
          <BusinessIcon />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Entity Management
          </Typography>
        </Box>
        <IconButton onClick={onClose} sx={{ color: 'white' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ p: 3 }}>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Group multiple LP entities under one parent name. This is useful when the same LP uses multiple entities to invest in the same fund.
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <TextField
              placeholder="Search entity groups..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ flexGrow: 1, mr: 2 }}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
              }}
            />
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreateGroup}
              sx={{
                bgcolor: '#000000',
                color: 'white',
                '&:hover': { bgcolor: '#333333' }
              }}
            >
              Create Group
            </Button>
          </Box>

          {isCreating || isEditing ? (
            <Card sx={{ mb: 3, border: '2px solid', borderColor: '#000000' }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  {isEditing ? 'Edit Entity Group' : 'Create New Entity Group'}
                </Typography>
                
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Group Name"
                      value={newGroupName}
                      onChange={(e) => setNewGroupName(e.target.value)}
                      placeholder="e.g., ABC Capital Group"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Description (Optional)"
                      value={newGroupDescription}
                      onChange={(e) => setNewGroupDescription(e.target.value)}
                      placeholder="Brief description of the group"
                    />
                  </Grid>
                </Grid>

                <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                  Select Entities to Group:
                </Typography>

                <Box sx={{ maxHeight: 200, overflow: 'auto', border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1 }}>
                  {filteredEntities.map((entity) => (
                    <Box
                      key={entity}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        p: 1,
                        borderRadius: 1,
                        cursor: 'pointer',
                        '&:hover': { bgcolor: 'action.hover' }
                      }}
                      onClick={() => handleEntityToggle(entity)}
                    >
                      <Checkbox
                        checked={selectedEntities.includes(entity)}
                        onChange={() => handleEntityToggle(entity)}
                        size="small"
                      />
                      <Typography variant="body2" sx={{ ml: 1 }}>
                        {entity}
                      </Typography>
                    </Box>
                  ))}
                </Box>

                {selectedEntities.length > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                      Selected Entities ({selectedEntities.length}):
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {selectedEntities.map((entity) => (
                        <Chip
                          key={entity}
                          label={entity}
                          onDelete={() => handleEntityToggle(entity)}
                          size="small"
                          sx={{
                            bgcolor: '#f5f5f5',
                            color: '#000000',
                            border: '1px solid #e0e0e0'
                          }}
                        />
                      ))}
                    </Box>
                  </Box>
                )}

                <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
                  <Button
                    variant="contained"
                    onClick={handleSaveGroup}
                    disabled={!newGroupName.trim() || selectedEntities.length === 0}
                    sx={{
                      bgcolor: '#000000',
                      color: 'white',
                      '&:hover': { bgcolor: '#333333' }
                    }}
                  >
                    {isEditing ? 'Update Group' : 'Create Group'}
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => {
                      setIsCreating(false);
                      setIsEditing(false);
                      setSelectedGroup(null);
                      setNewGroupName('');
                      setNewGroupDescription('');
                      setSelectedEntities([]);
                    }}
                  >
                    Cancel
                  </Button>
                </Box>
              </CardContent>
            </Card>
          ) : null}

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Grid container spacing={2}>
              {filteredGroups.map((group) => {
                const summary = getGroupInvestmentSummary(group);
                return (
                  <Grid item xs={12} md={6} key={group.id}>
                    <Card sx={{ 
                      height: '100%',
                      border: '1px solid',
                      borderColor: 'divider',
                      cursor: 'pointer',
                      '&:hover': {
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        transform: 'translateY(-2px)'
                      }
                    }}
                    onClick={() => handleGroupClick(group)}
                    >
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                              {group.name}
                            </Typography>
                            {group.description && (
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                {group.description}
                              </Typography>
                            )}
                          </Box>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditGroup(group);
                              }}
                              sx={{ color: '#000000' }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteGroup(group.id);
                              }}
                              sx={{ color: 'error.main' }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </Box>

                        {/* Investment Summary */}
                        {summary.totalInvested > 0 && (
                          <Box sx={{ mb: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                              Investment Summary
                            </Typography>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                              <Typography variant="body2">Total Invested:</Typography>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                ${(summary.totalInvested / 1000000).toFixed(1)}M
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                              <Typography variant="body2">Total Commitments:</Typography>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                ${(summary.totalCommitments / 1000000).toFixed(1)}M
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                              <Typography variant="body2">Active Investments:</Typography>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {summary.activeInvestments}
                              </Typography>
                            </Box>
                          </Box>
                        )}

                        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                          Entities ({group.entities.length}):
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {group.entities.map((entity) => (
                            <Chip
                              key={entity}
                              label={entity}
                              size="small"
                              clickable
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEntityClick(entity);
                              }}
                              sx={{
                                bgcolor: '#f5f5f5',
                                color: '#000000',
                                border: '1px solid #e0e0e0',
                                '&:hover': {
                                  bgcolor: '#e0e0e0'
                                }
                              }}
                            />
                          ))}
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          )}

          {filteredGroups.length === 0 && !loading && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <BusinessIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No entity groups found
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Create your first entity group to organize multiple LP entities under one parent name.
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleCreateGroup}
                sx={{
                  bgcolor: '#000000',
                  color: 'white',
                  '&:hover': { bgcolor: '#333333' }
                }}
              >
                Create Group
              </Button>
            </Box>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, bgcolor: 'background.default' }}>
        <Button onClick={onClose} variant="outlined">
          Close
        </Button>
      </DialogActions>

      {/* Entity Details Dialog */}
      <Dialog
        open={entityDetailsOpen}
        onClose={() => setEntityDetailsOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            minHeight: '60vh'
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
            <BusinessIcon />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {selectedEntityDetails?.name}
            </Typography>
          </Box>
          <IconButton onClick={() => setEntityDetailsOpen(false)} sx={{ color: 'white' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 3 }}>
          {selectedEntityDetails && (
            <Box>
              {/* Investment Summary */}
              <Box sx={{ mb: 4, p: 3, bgcolor: '#f5f5f5', borderRadius: 2 }}>
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                  Investment Summary
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={4}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" sx={{ fontWeight: 700, color: '#000000' }}>
                        ${(selectedEntityDetails.totalInvested / 1000000).toFixed(1)}M
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total Invested
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" sx={{ fontWeight: 700, color: '#000000' }}>
                        ${(selectedEntityDetails.totalCommitments / 1000000).toFixed(1)}M
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total Commitments
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" sx={{ fontWeight: 700, color: '#000000' }}>
                        {selectedEntityDetails.activeInvestments}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Active Investments
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Box>

              {/* Fund Investments */}
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Fund Investments
              </Typography>
              {selectedEntityDetails.investments.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <BusinessIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    No investments found
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    This entity has not made any fund investments yet.
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {selectedEntityDetails.investments.map((investment) => (
                    <Card key={investment.id} sx={{ border: '1px solid', borderColor: 'divider' }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                          <Box>
                            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                              {investment.fundName}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Fund Size: ${(investment.fundSize / 1000000).toFixed(1)}M
                            </Typography>
                          </Box>
                          <Chip
                            label={investment.status}
                            size="small"
                            sx={{
                              bgcolor: investment.status === 'active' ? '#4caf50' : 
                                       investment.status === 'exited' ? '#ff9800' : '#9e9e9e',
                              color: 'white',
                              fontWeight: 600
                            }}
                          />
                        </Box>
                        
                        <Grid container spacing={2}>
                          <Grid item xs={12} sm={6}>
                            <Box sx={{ mb: 1 }}>
                              <Typography variant="body2" color="text.secondary">
                                Investment Amount
                              </Typography>
                              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                ${(investment.investmentAmount / 1000000).toFixed(1)}M
                              </Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <Box sx={{ mb: 1 }}>
                              <Typography variant="body2" color="text.secondary">
                                Investment Date
                              </Typography>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {investment.investmentDate.toLocaleDateString()}
                              </Typography>
                            </Box>
                          </Grid>
                          {investment.commitmentAmount && (
                            <Grid item xs={12} sm={6}>
                              <Box sx={{ mb: 1 }}>
                                <Typography variant="body2" color="text.secondary">
                                  Total Commitment
                                </Typography>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                  ${(investment.commitmentAmount / 1000000).toFixed(1)}M
                                </Typography>
                              </Box>
                            </Grid>
                          )}
                          {investment.remainingCommitment !== undefined && (
                            <Grid item xs={12} sm={6}>
                              <Box sx={{ mb: 1 }}>
                                <Typography variant="body2" color="text.secondary">
                                  Remaining Commitment
                                </Typography>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                  ${(investment.remainingCommitment / 1000000).toFixed(1)}M
                                </Typography>
                              </Box>
                            </Grid>
                          )}
                        </Grid>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              )}
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 3, bgcolor: 'background.default' }}>
          <Button onClick={() => setEntityDetailsOpen(false)} variant="outlined">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Group Details Dialog */}
      <Dialog
        open={groupDetailsOpen}
        onClose={() => setGroupDetailsOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            minHeight: '70vh'
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
            <GroupIcon />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {selectedGroupDetails?.name} - Investment Overview
            </Typography>
          </Box>
          <IconButton onClick={() => setGroupDetailsOpen(false)} sx={{ color: 'white' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 3 }}>
          {selectedGroupDetails && (
            <Box>
              {(() => {
                const summary = getGroupInvestmentSummary(selectedGroupDetails);
                return (
                  <>
                    {/* Group Investment Summary */}
                    <Box sx={{ mb: 4, p: 3, bgcolor: '#f5f5f5', borderRadius: 2 }}>
                      <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                        Group Investment Summary
                      </Typography>
                      <Grid container spacing={3}>
                        <Grid item xs={12} sm={3}>
                          <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="h4" sx={{ fontWeight: 700, color: '#000000' }}>
                              ${(summary.totalInvested / 1000000).toFixed(1)}M
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Total Invested
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={12} sm={3}>
                          <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="h4" sx={{ fontWeight: 700, color: '#000000' }}>
                              ${(summary.totalCommitments / 1000000).toFixed(1)}M
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Total Commitments
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={12} sm={3}>
                          <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="h4" sx={{ fontWeight: 700, color: '#000000' }}>
                              {summary.activeInvestments}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Active Investments
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={12} sm={3}>
                          <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="h4" sx={{ fontWeight: 700, color: '#000000' }}>
                              {selectedGroupDetails.entities.length}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Entities
                            </Typography>
                          </Box>
                        </Grid>
                      </Grid>
                    </Box>

                    {/* Entity Breakdown */}
                    <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                      Entity Investment Breakdown
                    </Typography>
                    <Grid container spacing={2}>
                      {selectedGroupDetails.entities.map((entity) => {
                        const entityInvestments = mockInvestmentData[entity] || [];
                        const entityTotal = entityInvestments.reduce((sum, inv) => sum + inv.investmentAmount, 0);
                        const entityCommitments = entityInvestments.reduce((sum, inv) => sum + (inv.commitmentAmount || 0), 0);
                        const entityActive = entityInvestments.filter(inv => inv.status === 'active').length;

                        return (
                          <Grid item xs={12} md={6} key={entity}>
                            <Card sx={{ 
                              border: '1px solid', 
                              borderColor: 'divider',
                              cursor: 'pointer',
                              '&:hover': {
                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                              }
                            }}
                            onClick={() => {
                              setEntityDetailsOpen(true);
                              handleEntityClick(entity);
                            }}
                            >
                              <CardContent>
                                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                                  {entity}
                                </Typography>
                                
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                  <Typography variant="body2">Invested:</Typography>
                                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    ${(entityTotal / 1000000).toFixed(1)}M
                                  </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                  <Typography variant="body2">Commitments:</Typography>
                                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    ${(entityCommitments / 1000000).toFixed(1)}M
                                  </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                  <Typography variant="body2">Active:</Typography>
                                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    {entityActive}
                                  </Typography>
                                </Box>

                                {entityInvestments.length > 0 && (
                                  <Box>
                                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                                      Funds:
                                    </Typography>
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                      {entityInvestments.map((inv) => (
                                        <Chip
                                          key={inv.id}
                                          label={inv.fundName}
                                          size="small"
                                          sx={{
                                            bgcolor: '#f5f5f5',
                                            color: '#000000',
                                            border: '1px solid #e0e0e0'
                                          }}
                                        />
                                      ))}
                                    </Box>
                                  </Box>
                                )}
                              </CardContent>
                            </Card>
                          </Grid>
                        );
                      })}
                    </Grid>
                  </>
                );
              })()}
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 3, bgcolor: 'background.default' }}>
          <Button onClick={() => setGroupDetailsOpen(false)} variant="outlined">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
}
