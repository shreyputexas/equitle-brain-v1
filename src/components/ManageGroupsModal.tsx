import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Box,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Alert,
  CircularProgress,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Card,
  CardContent,
  Divider,
  Switch,
  FormControlLabel,
  Tab,
  Tabs
} from '@mui/material';
import {
  Close as CloseIcon,
  Group as GroupIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Settings as SettingsIcon,
  People as PeopleIcon,
  Business as BusinessIcon
} from '@mui/icons-material';
import LPGroupsApiService, { LPGroup as ApiLPGroup, CreateLPGroupRequest } from '../services/lpGroupsApi';

interface ManageGroupsModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// Use the API types directly
type LPGroup = ApiLPGroup;

// Remove default groups - we'll load from API

const investorTypes = [
  'Institutional Investor',
  'Family Office',
  'Fund of Funds',
  'Corporate Investor',
  'Sovereign Wealth Fund',
  'Pension Fund',
  'Insurance Company',
  'Endowment',
  'Foundation',
  'High Net Worth Individual'
];

const regions = [
  'North America',
  'Europe',
  'Asia Pacific',
  'Middle East',
  'Latin America',
  'Africa'
];

export default function ManageGroupsModal({ open, onClose, onSuccess }: ManageGroupsModalProps) {
  const [groups, setGroups] = useState<LPGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<LPGroup | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loadingGroups, setLoadingGroups] = useState(true);

  // Load groups from API
  useEffect(() => {
    const loadGroups = async () => {
      if (open) {
        try {
          setLoadingGroups(true);
          const apiGroups = await LPGroupsApiService.getLPGroups();
          setGroups(apiGroups);
        } catch (err) {
          console.error('Failed to load groups:', err);
          setError('Failed to load existing groups');
        } finally {
          setLoadingGroups(false);
        }
      }
    };
    loadGroups();
  }, [open]);

  // Calculate member count based on real LP data
  const calculateMemberCount = (group: LPGroup, allLPs: any[] = []) => {
    if (group.name === 'All Limited Partners') {
      return allLPs.length;
    }

    return allLPs.filter(lp => {
      // Check investor type criteria
      if (group.criteria?.investorTypes && group.criteria.investorTypes.length > 0 &&
          !group.criteria.investorTypes.includes(lp.type)) {
        return false;
      }

      // Check commitment amount criteria
      if ((group.criteria?.minCommitment && lp.commitment < group.criteria.minCommitment) ||
          (group.criteria?.maxCommitment && lp.commitment > group.criteria.maxCommitment)) {
        return false;
      }

      // Check region criteria
      if (group.criteria?.regions && group.criteria.regions.length > 0 &&
          !group.criteria.regions.includes(lp.region)) {
        return false;
      }

      return true;
    }).length;
  };

  const [newGroupForm, setNewGroupForm] = useState({
    name: '',
    description: '',
    investorTypes: [] as string[],
    minCommitment: '',
    maxCommitment: '',
    regions: [] as string[],
    autoAssign: true,
    enableNotifications: true,
    frequency: 'monthly',
    types: [] as string[]
  });


  const handleCreateGroup = async () => {
    try {
      setLoading(true);
      setError('');

      if (!newGroupForm.name.trim()) {
        setError('Group name is required');
        return;
      }

      const groupData: CreateLPGroupRequest = {
        name: newGroupForm.name.trim(),
        description: newGroupForm.description.trim() || undefined,
        criteria: {
          investorTypes: newGroupForm.investorTypes.length > 0 ? newGroupForm.investorTypes : undefined,
          minCommitment: Number(newGroupForm.minCommitment) || undefined,
          maxCommitment: Number(newGroupForm.maxCommitment) || undefined,
          regions: newGroupForm.regions.length > 0 ? newGroupForm.regions : undefined
        },
        autoAssign: newGroupForm.autoAssign,
        emailPreferences: {
          enableNotifications: newGroupForm.enableNotifications,
          frequency: newGroupForm.frequency,
          types: newGroupForm.types
        }
      };

      // Create group using API service
      const newGroup = await LPGroupsApiService.createLPGroup(groupData);
      setGroups([...groups, newGroup]);

      // Reset form
      setNewGroupForm({
        name: '',
        description: '',
        investorTypes: [],
        minCommitment: '',
        maxCommitment: '',
        regions: [],
        autoAssign: true,
        enableNotifications: true,
        frequency: 'monthly',
        types: []
      });

      setTabValue(0); // Switch back to groups list
    } catch (err: any) {
      setError(err.message || 'Failed to create group');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    const group = groups.find(g => g.id === groupId);
    if (group?.type === 'system') {
      setError('Cannot delete system groups');
      return;
    }

    try {
      setLoading(true);
      await LPGroupsApiService.deleteLPGroup(groupId);
      setGroups(groups.filter(g => g.id !== groupId));
    } catch (err) {
      setError('Failed to delete group');
    } finally {
      setLoading(false);
    }
  };


  const handleClose = () => {
    if (!loading) {
      setError('');
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
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
          <SettingsIcon />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Manage LP Groups
          </Typography>
        </Box>
        <IconButton onClick={handleClose} sx={{ color: 'white' }} disabled={loading}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 0, px: 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3, mt: 4 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        <Box sx={{ borderBottom: 1, borderColor: 'divider', mt: 4 }}>
          <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
            <Tab label="Groups" icon={<GroupIcon />} />
            <Tab label="Create New Group" icon={<AddIcon />} />
          </Tabs>
        </Box>

        {/* Groups List Tab */}
        {tabValue === 0 && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
              Existing Groups ({groups.length})
            </Typography>

            {loadingGroups && (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            )}

            {!loadingGroups && (
              <Grid container spacing={3}>
                {groups.map((group) => (
                <Grid item xs={12} md={6} key={group.id}>
                  <Card sx={{
                    border: '1px solid #e0e0e0',
                    '&:hover': { boxShadow: 2 }
                  }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <GroupIcon color="primary" />
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            {group.name}
                          </Typography>
                          {group.type === 'system' && (
                            <Chip label="System" size="small" color="primary" variant="outlined" />
                          )}
                        </Box>
                        <Box>
                          <IconButton size="small" disabled={group.type === 'system'}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            disabled={group.type === 'system'}
                            onClick={() => handleDeleteGroup(group.id)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </Box>

                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {group.description}
                      </Typography>

                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <PeopleIcon fontSize="small" color="action" />
                          <Typography variant="body2">
                            {calculateMemberCount(group)} members
                          </Typography>
                        </Box>
                        {group.autoAssign && (
                          <Chip label="Auto-assign" size="small" color="success" variant="outlined" />
                        )}
                      </Box>

                      <Divider sx={{ my: 2 }} />

                      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                        Criteria:
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
                        {group.criteria?.minCommitment && group.criteria.minCommitment > 0 && (
                          <Typography variant="caption" color="text.secondary">
                            Min Commitment: ${(group.criteria.minCommitment / 1000000).toFixed(0)}M
                          </Typography>
                        )}
                        {group.criteria?.investorTypes && group.criteria.investorTypes.length > 0 && (
                          <Typography variant="caption" color="text.secondary">
                            Types: {group.criteria.investorTypes.join(', ')}
                          </Typography>
                        )}
                        {group.criteria?.regions && group.criteria.regions.length > 0 && (
                          <Typography variant="caption" color="text.secondary">
                            Regions: {group.criteria.regions.join(', ')}
                          </Typography>
                        )}
                      </Box>

                      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                        Email Preferences:
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {group.emailPreferences?.enableNotifications && <Chip label="Notifications" size="small" />}
                        {group.emailPreferences?.frequency && <Chip label={group.emailPreferences.frequency} size="small" />}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
              </Grid>
            )}
          </Box>
        )}

        {/* Create New Group Tab */}
        {tabValue === 1 && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
              Create New LP Group
            </Typography>

            <Grid container spacing={3}>
              {/* Basic Information */}
              <Grid item xs={12}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                  Basic Information
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Group Name"
                  value={newGroupForm.name}
                  onChange={(e) => setNewGroupForm(prev => ({ ...prev, name: e.target.value }))}
                  required
                  disabled={loading}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  value={newGroupForm.description}
                  onChange={(e) => setNewGroupForm(prev => ({ ...prev, description: e.target.value }))}
                  multiline
                  rows={2}
                  disabled={loading}
                />
              </Grid>

              {/* Group Criteria */}
              <Grid item xs={12}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, mt: 2 }}>
                  Group Criteria
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth disabled={loading}>
                  <InputLabel>Investor Types</InputLabel>
                  <Select
                    multiple
                    value={newGroupForm.investorTypes}
                    onChange={(e) => setNewGroupForm(prev => ({
                      ...prev,
                      investorTypes: e.target.value as string[]
                    }))}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {(selected as string[]).map((value) => (
                          <Chip key={value} label={value} size="small" />
                        ))}
                      </Box>
                    )}
                  >
                    {investorTypes.map((type) => (
                      <MenuItem key={type} value={type}>
                        {type}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth disabled={loading}>
                  <InputLabel>Regions</InputLabel>
                  <Select
                    multiple
                    value={newGroupForm.regions}
                    onChange={(e) => setNewGroupForm(prev => ({
                      ...prev,
                      regions: e.target.value as string[]
                    }))}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {(selected as string[]).map((value) => (
                          <Chip key={value} label={value} size="small" />
                        ))}
                      </Box>
                    )}
                  >
                    {regions.map((region) => (
                      <MenuItem key={region} value={region}>
                        {region}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Minimum Commitment ($)"
                  value={newGroupForm.minCommitment}
                  onChange={(e) => setNewGroupForm(prev => ({ ...prev, minCommitment: e.target.value }))}
                  type="number"
                  disabled={loading}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Maximum Commitment ($)"
                  value={newGroupForm.maxCommitment}
                  onChange={(e) => setNewGroupForm(prev => ({ ...prev, maxCommitment: e.target.value }))}
                  type="number"
                  disabled={loading}
                />
              </Grid>


              {/* Email Preferences */}
              <Grid item xs={12}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, mt: 2 }}>
                  Email Preferences
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={newGroupForm.enableNotifications}
                        onChange={(e) => setNewGroupForm(prev => ({
                          ...prev,
                          enableNotifications: e.target.checked
                        }))}
                        disabled={loading}
                      />
                    }
                    label="Enable Email Notifications"
                  />
                  <FormControl fullWidth disabled={loading}>
                    <InputLabel>Frequency</InputLabel>
                    <Select
                      value={newGroupForm.frequency}
                      label="Frequency"
                      onChange={(e) => setNewGroupForm(prev => ({
                        ...prev,
                        frequency: e.target.value
                      }))}
                    >
                      <MenuItem value="daily">Daily</MenuItem>
                      <MenuItem value="weekly">Weekly</MenuItem>
                      <MenuItem value="monthly">Monthly</MenuItem>
                      <MenuItem value="quarterly">Quarterly</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              </Grid>

              {/* Auto-assign */}
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={newGroupForm.autoAssign}
                      onChange={(e) => setNewGroupForm(prev => ({
                        ...prev,
                        autoAssign: e.target.checked
                      }))}
                      disabled={loading}
                    />
                  }
                  label="Automatically assign LPs that match criteria"
                />
              </Grid>
            </Grid>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3, bgcolor: 'background.default' }}>
        <Button
          onClick={handleClose}
          variant="outlined"
          disabled={loading}
        >
          Close
        </Button>
        {tabValue === 1 && (
          <Button
            onClick={handleCreateGroup}
            variant="contained"
            disabled={loading}
            sx={{
              bgcolor: '#000000',
              color: 'white',
              '&:hover': {
                bgcolor: '#333333'
              }
            }}
            startIcon={loading ? <CircularProgress size={20} /> : <AddIcon />}
          >
            {loading ? 'Creating...' : 'Create Group'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}