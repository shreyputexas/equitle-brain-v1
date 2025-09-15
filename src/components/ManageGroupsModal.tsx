import React, { useState } from 'react';
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

interface ManageGroupsModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface LPGroup {
  id: string;
  name: string;
  description: string;
  type: string;
  criteria: {
    investorTypes: string[];
    minCommitment: number;
    maxCommitment: number;
    regions: string[];
    customRules: string[];
  };
  memberCount: number;
  autoAssign: boolean;
  emailPreferences: {
    quarterlyReports: boolean;
    capitalCalls: boolean;
    performanceUpdates: boolean;
    marketCommentary: boolean;
  };
}

const defaultGroups: LPGroup[] = [
  {
    id: '1',
    name: 'All Limited Partners',
    description: 'Default group containing all LPs',
    type: 'system',
    criteria: {
      investorTypes: [],
      minCommitment: 0,
      maxCommitment: Infinity,
      regions: [],
      customRules: []
    },
    memberCount: 0, // Will be calculated from real LP data
    autoAssign: true,
    emailPreferences: {
      quarterlyReports: true,
      capitalCalls: true,
      performanceUpdates: true,
      marketCommentary: false
    }
  }
];

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
  const [groups, setGroups] = useState<LPGroup[]>(defaultGroups);
  const [selectedGroup, setSelectedGroup] = useState<LPGroup | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Calculate member count based on real LP data
  const calculateMemberCount = (group: LPGroup, allLPs: any[] = []) => {
    if (group.name === 'All Limited Partners') {
      return allLPs.length;
    }

    return allLPs.filter(lp => {
      // Check investor type criteria
      if (group.criteria.investorTypes.length > 0 &&
          !group.criteria.investorTypes.includes(lp.type)) {
        return false;
      }

      // Check commitment amount criteria
      if (lp.commitment < group.criteria.minCommitment ||
          lp.commitment > group.criteria.maxCommitment) {
        return false;
      }

      // Check region criteria
      if (group.criteria.regions.length > 0 &&
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
    customRules: [] as string[],
    autoAssign: true,
    quarterlyReports: true,
    capitalCalls: true,
    performanceUpdates: true,
    marketCommentary: false
  });

  const [ruleInput, setRuleInput] = useState('');

  const handleCreateGroup = async () => {
    try {
      setLoading(true);
      setError('');

      if (!newGroupForm.name.trim()) {
        setError('Group name is required');
        return;
      }

      const newGroup: LPGroup = {
        id: (groups.length + 1).toString(),
        name: newGroupForm.name.trim(),
        description: newGroupForm.description.trim(),
        type: 'custom',
        criteria: {
          investorTypes: newGroupForm.investorTypes,
          minCommitment: Number(newGroupForm.minCommitment) || 0,
          maxCommitment: Number(newGroupForm.maxCommitment) || Infinity,
          regions: newGroupForm.regions,
          customRules: newGroupForm.customRules
        },
        memberCount: 0, // Would be calculated from actual LP data
        autoAssign: newGroupForm.autoAssign,
        emailPreferences: {
          quarterlyReports: newGroupForm.quarterlyReports,
          capitalCalls: newGroupForm.capitalCalls,
          performanceUpdates: newGroupForm.performanceUpdates,
          marketCommentary: newGroupForm.marketCommentary
        }
      };

      // TODO: Replace with actual API call
      const response = await fetch('http://localhost:4000/api/lp-groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-token'
        },
        body: JSON.stringify(newGroup)
      });

      if (!response.ok) {
        throw new Error('Failed to create group');
      }

      setGroups([...groups, newGroup]);

      // Reset form
      setNewGroupForm({
        name: '',
        description: '',
        investorTypes: [],
        minCommitment: '',
        maxCommitment: '',
        regions: [],
        customRules: [],
        autoAssign: true,
        quarterlyReports: true,
        capitalCalls: true,
        performanceUpdates: true,
        marketCommentary: false
      });

      setTabValue(0); // Switch back to groups list
    } catch (err: any) {
      setError(err.message || 'Failed to create group');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGroup = (groupId: string) => {
    const group = groups.find(g => g.id === groupId);
    if (group?.type === 'system') {
      setError('Cannot delete system groups');
      return;
    }
    setGroups(groups.filter(g => g.id !== groupId));
  };

  const handleAddRule = () => {
    if (ruleInput.trim() && !newGroupForm.customRules.includes(ruleInput.trim())) {
      setNewGroupForm(prev => ({
        ...prev,
        customRules: [...prev.customRules, ruleInput.trim()]
      }));
      setRuleInput('');
    }
  };

  const handleRemoveRule = (rule: string) => {
    setNewGroupForm(prev => ({
      ...prev,
      customRules: prev.customRules.filter(r => r !== rule)
    }));
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
                        {group.criteria.minCommitment > 0 && (
                          <Typography variant="caption" color="text.secondary">
                            Min Commitment: ${(group.criteria.minCommitment / 1000000).toFixed(0)}M
                          </Typography>
                        )}
                        {group.criteria.investorTypes.length > 0 && (
                          <Typography variant="caption" color="text.secondary">
                            Types: {group.criteria.investorTypes.join(', ')}
                          </Typography>
                        )}
                        {group.criteria.regions.length > 0 && (
                          <Typography variant="caption" color="text.secondary">
                            Regions: {group.criteria.regions.join(', ')}
                          </Typography>
                        )}
                      </Box>

                      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                        Email Preferences:
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {group.emailPreferences.quarterlyReports && <Chip label="Quarterly" size="small" />}
                        {group.emailPreferences.capitalCalls && <Chip label="Capital Calls" size="small" />}
                        {group.emailPreferences.performanceUpdates && <Chip label="Performance" size="small" />}
                        {group.emailPreferences.marketCommentary && <Chip label="Commentary" size="small" />}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
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

              {/* Custom Rules */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                  Custom Rules
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Add custom rule"
                    value={ruleInput}
                    onChange={(e) => setRuleInput(e.target.value)}
                    disabled={loading}
                  />
                  <Button
                    variant="outlined"
                    onClick={handleAddRule}
                    disabled={!ruleInput.trim() || loading}
                  >
                    Add
                  </Button>
                </Box>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {newGroupForm.customRules.map((rule, index) => (
                    <Chip
                      key={index}
                      label={rule}
                      onDelete={() => handleRemoveRule(rule)}
                      disabled={loading}
                    />
                  ))}
                </Box>
              </Grid>

              {/* Email Preferences */}
              <Grid item xs={12}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, mt: 2 }}>
                  Email Preferences
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={newGroupForm.quarterlyReports}
                        onChange={(e) => setNewGroupForm(prev => ({
                          ...prev,
                          quarterlyReports: e.target.checked
                        }))}
                        disabled={loading}
                      />
                    }
                    label="Quarterly Reports"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={newGroupForm.capitalCalls}
                        onChange={(e) => setNewGroupForm(prev => ({
                          ...prev,
                          capitalCalls: e.target.checked
                        }))}
                        disabled={loading}
                      />
                    }
                    label="Capital Call Notices"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={newGroupForm.performanceUpdates}
                        onChange={(e) => setNewGroupForm(prev => ({
                          ...prev,
                          performanceUpdates: e.target.checked
                        }))}
                        disabled={loading}
                      />
                    }
                    label="Performance Updates"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={newGroupForm.marketCommentary}
                        onChange={(e) => setNewGroupForm(prev => ({
                          ...prev,
                          marketCommentary: e.target.checked
                        }))}
                        disabled={loading}
                      />
                    }
                    label="Market Commentary"
                  />
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