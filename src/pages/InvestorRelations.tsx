import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ReportModal from '../components/ReportModal';
import EmailUpdateModal from '../components/EmailUpdateModal';
import NewLPModal from '../components/NewLPModal';
import ManageGroupsModal from '../components/ManageGroupsModal';
import InvestorsApiService, { Investor } from '../services/investorsApi';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Tabs,
  Tab,
  Avatar,
  AvatarGroup,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  IconButton,
  TextField,
  InputAdornment,
  Menu,
  MenuItem,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem as SelectMenuItem,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Add as AddIcon,
  Email as EmailIcon,
  FileDownload as DownloadIcon,
  Send as SendIcon,
  Group as GroupIcon,
  TrendingUp as TrendingUpIcon,
  AccountBalance as FundIcon,
  Event as EventIcon,
  Description as DocumentIcon,
  Search as SearchIcon,
  MoreVert as MoreVertIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  ExpandMore as ExpandMoreIcon,
  Business as BusinessIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
  AttachMoney as MoneyIcon,
  PieChart as PieChartIcon,
  Visibility as VisibilityIcon,
  OpenInNew as OpenInNewIcon,
  Folder as FolderIcon,
  Gavel as GavelIcon,
  Security as SecurityIcon,
  Assignment as AssignmentIcon,
  ArrowForward as ArrowForwardIcon,
  Delete as DeleteIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import { PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

const fundPerformance: any[] = [];
const recentCommunications: any[] = [];
const upcomingEvents: any[] = [];

// Custom Progress Bar Component (same as Funds page)
const CapitalProgressBar = ({ raised, target, height = 8 }: { raised: number; target: number; height?: number }) => {
  const progress = Math.min((raised / target) * 100, 100);
  
  return (
    <Box sx={{ width: '100%', position: 'relative' }}>
      <Box
        sx={{
          width: '100%',
          height: height,
          backgroundColor: '#e0e0e0', // Light grey background
          borderRadius: height / 2,
          overflow: 'hidden',
          position: 'relative'
        }}
      >
        <Box
          sx={{
            width: `${progress}%`,
            height: '100%',
            backgroundColor: '#000000', // Black for committed capital
            borderRadius: height / 2,
            transition: 'width 0.3s ease-in-out'
          }}
        />
      </Box>
      <Typography variant="caption" sx={{ mt: 0.5, display: 'block' }}>
        ${(raised / 1000000).toFixed(0)} called of ${(target / 1000000).toFixed(0)} committed ({progress.toFixed(1)}%)
      </Typography>
    </Box>
  );
};

export default function InvestorRelations() {
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedInvestor, setSelectedInvestor] = useState<any>(null);
  const [entityDialogOpen, setEntityDialogOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [emailUpdateModalOpen, setEmailUpdateModalOpen] = useState(false);
  const [newLPModalOpen, setNewLPModalOpen] = useState(false);
  const [manageGroupsModalOpen, setManageGroupsModalOpen] = useState(false);
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedInvestorId, setSelectedInvestorId] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  
  // Filter states
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [commitmentFilter, setCommitmentFilter] = useState<string>('all');

  // Fetch investors data
  const fetchInvestors = async () => {
    try {
      setLoading(true);
      setError(null);
      const investorsData = await InvestorsApiService.getInvestors();

      // Transform API data to match UI expectations
      const transformedInvestors = investorsData.map(investor => ({
        ...investor,
        commitment: investor.totalCommitment || 0,
        called: investor.totalCalled || 0,
        // Map database fields to UI expectations
        name: investor.name,
        type: investor.type.replace('_', ' '),
        status: investor.status
      }));

      setInvestors(transformedInvestors);
    } catch (err: any) {
      console.error('Error fetching investors:', err);
      setError(err.message || 'Failed to fetch investors');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvestors();
  }, []);

  // Handle successful investor creation
  const handleInvestorCreated = () => {
    fetchInvestors(); // Refresh the investors list
  };

  // Filter logic
  const filteredInvestors = investors.filter(investor => {
    const matchesType = typeFilter === 'all' || investor.type.toLowerCase().includes(typeFilter.toLowerCase());
    const matchesStatus = statusFilter === 'all' || investor.status === statusFilter;
    const matchesSearch = searchTerm === '' || investor.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCommitment = commitmentFilter === 'all' ||
      (commitmentFilter === 'small' && (investor.totalCommitment || 0) <= 20000000) ||
      (commitmentFilter === 'medium' && (investor.totalCommitment || 0) > 20000000 && (investor.totalCommitment || 0) <= 40000000) ||
      (commitmentFilter === 'large' && (investor.totalCommitment || 0) > 40000000);
    
    return matchesType && matchesStatus && matchesSearch && matchesCommitment;
  });

  // Calculate metrics based on filtered investors
  const totalCommitment = filteredInvestors.reduce((sum, inv) => sum + (inv.totalCommitment || 0), 0);
  const totalCalled = filteredInvestors.reduce((sum, inv) => sum + (inv.totalCalled || 0), 0);
  const callPercentage = totalCommitment > 0 ? (totalCalled / totalCommitment) * 100 : 0;

  // Calculate real investor type distribution from actual data
  const calculateInvestorDistribution = () => {
    if (filteredInvestors.length === 0) {
      return [
        { name: 'No Data', value: 100, color: '#e0e0e0' }
      ];
    }

    const typeCounts = filteredInvestors.reduce((acc, investor) => {
      const type = investor?.type || 'Unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const total = filteredInvestors.length;
    const colors = ['#000000', '#666666', '#999999', '#cccccc', '#e0e0e0'];

    return Object.entries(typeCounts).map(([name, count], index) => ({
      name,
      value: Math.round(((count as number) / total) * 100),
      color: colors[index % colors.length]
    }));
  };

  const investorTypeDistribution = calculateInvestorDistribution();

  // Calculate real IRR from fund performance data
  const calculateNetIRR = () => {
    if (fundPerformance.length === 0) {
      return { irr: 0, change: 0 };
    }

    // For demo purposes, calculate a simple IRR approximation
    // In real implementation, this would use actual fund performance data
    const totalCommitted = totalCommitment;
    const totalReturned = totalCalled * 1.25; // Simplified calculation
    const years = 3; // Average holding period

    if (totalCommitted === 0) {
      return { irr: 0, change: 0 };
    }

    // Simple IRR calculation: ((Final Value / Initial Value) ^ (1/years)) - 1
    const irr = Math.pow(totalReturned / totalCommitted, 1 / years) - 1;
    const annualizedIRR = irr * 100;

    // Calculate quarter-over-quarter change (simplified)
    const qoqChange = Math.random() * 10 - 5; // Placeholder for real calculation

    return {
      irr: isNaN(annualizedIRR) ? 0 : Math.max(0, annualizedIRR),
      change: qoqChange
    };
  };

  const { irr: netIRR, change: irrChange } = calculateNetIRR();

  const handleViewEntities = (investor: any) => {
    setSelectedInvestor(investor);
    setEntityDialogOpen(true);
  };

  const handleNavigateToFund = (fundId: string, entityName: string) => {
    // Navigate to funds page with the specific fund and entity highlighted
    navigate(`/funds?highlight=${fundId}&entity=${encodeURIComponent(entityName)}`);
  };

  const getDocumentIcon = (type: string) => {
    switch (type) {
      case 'Legal': return <GavelIcon />;
      case 'Compliance': return <SecurityIcon />;
      case 'Administrative': return <AssignmentIcon />;
      default: return <DocumentIcon />;
    }
  };

  const getDocumentColor = (type: string) => {
    switch (type) {
      case 'Legal': return 'primary';
      case 'Compliance': return 'success';
      case 'Administrative': return 'info';
      default: return 'default';
    }
  };

  const getInvestmentTypeColor = (type: string) => {
    switch (type) {
      case 'Corporation': return 'primary';
      case 'LLC': return 'success';
      case 'Partnership': return 'info';
      case 'Trust': return 'warning';
      default: return 'default';
    }
  };

  const clearFilters = () => {
    setTypeFilter('all');
    setStatusFilter('all');
    setCommitmentFilter('all');
    setSearchTerm('');
  };

  const hasActiveFilters = typeFilter !== 'all' || statusFilter !== 'all' || commitmentFilter !== 'all' || searchTerm !== '';

  const handleReportSuccess = () => {
    console.log('Report generated successfully');
  };

  const handleEmailUpdateSuccess = () => {
    console.log('Email update sent successfully');
  };

  const handleNewLPSuccess = () => {
    console.log('New LP added successfully');
    handleInvestorCreated(); // Refresh the data
  };

  const handleManageGroupsSuccess = () => {
    console.log('LP groups updated successfully');
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, investorId: string) => {
    setAnchorEl(event.currentTarget);
    setSelectedInvestorId(investorId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedInvestorId(null);
  };

  const handleDeleteInvestor = () => {
    setDeleteConfirmOpen(true);
    setAnchorEl(null); // Close menu but keep selectedInvestorId
  };

  const handleConfirmDelete = async () => {
    if (selectedInvestorId) {
      try {
        await InvestorsApiService.deleteInvestor(selectedInvestorId);
        fetchInvestors(); // Refresh the investors list
        setDeleteConfirmOpen(false);
        setSelectedInvestorId(null); // Reset selected investor
      } catch (error) {
        console.error('Error deleting investor:', error);
      }
    }
  };

  const handleCancelDelete = () => {
    setDeleteConfirmOpen(false);
    setSelectedInvestorId(null); // Reset selected investor
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
            Investor Relations
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage LP communications, reporting, and engagement
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            startIcon={<EmailIcon />}
            onClick={() => setEmailUpdateModalOpen(true)}
          >
            Send Update
          </Button>
          <Button
            startIcon={<GroupIcon />}
            onClick={() => setNewLPModalOpen(true)}
          >
            Add New LP
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setReportModalOpen(true)}
          >
            New Report
          </Button>
        </Box>
      </Box>

      {/* Filters Section */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <FilterIcon sx={{ mr: 1 }} />
          <Typography variant="h6" sx={{ fontWeight: 600, mr: 2 }}>
            Filters
          </Typography>
          {hasActiveFilters && (
            <Button
              size="small"
              startIcon={<ClearIcon />}
              onClick={clearFilters}
              sx={{ ml: 'auto' }}
            >
              Clear All Filters
            </Button>
          )}
        </Box>
        
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Search Investors"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Investor Type</InputLabel>
              <Select
                value={typeFilter}
                label="Investor Type"
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <SelectMenuItem value="all">All Types</SelectMenuItem>
                <SelectMenuItem value="institutional">Institutional</SelectMenuItem>
                <SelectMenuItem value="family">Family Office</SelectMenuItem>
                <SelectMenuItem value="fund">Fund of Funds</SelectMenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <SelectMenuItem value="all">All Status</SelectMenuItem>
                <SelectMenuItem value="active">Active</SelectMenuItem>
                <SelectMenuItem value="inactive">Inactive</SelectMenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Commitment Size</InputLabel>
              <Select
                value={commitmentFilter}
                label="Commitment Size"
                onChange={(e) => setCommitmentFilter(e.target.value)}
              >
                <SelectMenuItem value="all">All Sizes</SelectMenuItem>
                <SelectMenuItem value="small">Small (≤$20M)</SelectMenuItem>
                <SelectMenuItem value="medium">Medium ($20M-$40M)</SelectMenuItem>
                <SelectMenuItem value="large">Large (&gt;$40M)</SelectMenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        {hasActiveFilters && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Showing {filteredInvestors.length} of {investors.length} investors
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Overall Capital Progress */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
          Capital Call Progress {hasActiveFilters && '(Filtered)'}
        </Typography>
        <CapitalProgressBar raised={totalCalled} target={totalCommitment} height={12} />
      </Paper>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: '#000000', mr: 2 }}>
                  <FundIcon />
                </Avatar>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 600 }}>
                    ${(totalCommitment / 1000000).toFixed(0)}M
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Total Commitments
                  </Typography>
                </Box>
              </Box>
              <LinearProgress
                variant="determinate"
                value={callPercentage}
                sx={{
                  height: 6,
                  borderRadius: 3,
                  bgcolor: 'rgba(255,255,255,0.05)',
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 3,
                    bgcolor: '#000000'
                  }
                }}
              />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                {callPercentage.toFixed(1)}% Called
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: '#000000', mr: 2 }}>
                  <TrendingUpIcon />
                </Avatar>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 600 }}>
                    {netIRR.toFixed(1)}%
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Net IRR
                  </Typography>
                </Box>
              </Box>
              <Chip
                label={`${irrChange >= 0 ? '+' : ''}${irrChange.toFixed(1)}% QoQ`}
                size="small"
                sx={{
                  bgcolor: irrChange >= 0 ? '#000000' : '#d32f2f',
                  color: 'white'
                }}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: 'info.main', mr: 2 }}>
                  <GroupIcon />
                </Avatar>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 600 }}>
                    {filteredInvestors.length}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {hasActiveFilters ? 'Filtered' : 'Active'} LPs
                  </Typography>
                </Box>
              </Box>
              <AvatarGroup max={4} sx={{ justifyContent: 'flex-start' }}>
                {filteredInvestors.slice(0, 4).map((investor) => (
                  <Avatar key={investor?.id} sx={{ width: 24, height: 24, fontSize: 10 }}>
                    {investor?.name ? investor.name.split(' ').map((n: string) => n[0]).join('') : '?'}
                  </Avatar>
                ))}
              </AvatarGroup>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: '#000000', mr: 2 }}>
                  <EventIcon />
                </Avatar>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 600 }}>
                    {upcomingEvents.length}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Upcoming Events
                  </Typography>
                </Box>
              </Box>
              <Typography variant="body2">
                {upcomingEvents.length > 0 ? `Next: ${upcomingEvents[0]?.date}` : 'No upcoming events'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
              Fund Performance
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={fundPerformance}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#9e9e9e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#000000" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="quarter" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#111827',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 8
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#000000"
                  fillOpacity={1}
                  fill="url(#colorValue)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </Paper>

          <Paper sx={{ p: 3 }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
                <Tab label="Investors" />
                <Tab label="Communications" />
                <Tab label="Events" />
                <Tab label="Documents" />
              </Tabs>
            </Box>

            {tabValue === 0 && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Investor Portfolio {hasActiveFilters && `(${filteredInvestors.length} investors)`}
                </Typography>
                
{loading ? (
                  <Box sx={{ textAlign: 'center', py: 8 }}>
                    <CircularProgress size={48} sx={{ mb: 2 }} />
                    <Typography variant="body1" color="text.secondary">
                      Loading investors...
                    </Typography>
                  </Box>
                ) : error ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Alert severity="error" sx={{ mb: 2, maxWidth: 600 }}>
                      {error}
                    </Alert>
                    <Button variant="outlined" onClick={fetchInvestors}>
                      Retry
                    </Button>
                  </Box>
                ) : filteredInvestors.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body1" color="text.secondary">
                      {investors.length === 0 ? 'No investors found. Add your first LP to get started!' : 'No investors match the current filters'}
                    </Typography>
                    {investors.length === 0 ? (
                      <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => setNewLPModalOpen(true)}
                        sx={{ mt: 2 }}
                      >
                        Add New LP
                      </Button>
                    ) : (
                      <Button onClick={clearFilters} sx={{ mt: 2 }}>
                        Clear Filters
                      </Button>
                    )}
                  </Box>
                ) : (
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Investor</TableCell>
                          <TableCell>Type</TableCell>
                          <TableCell align="right">Commitment</TableCell>
                          <TableCell align="right">Called</TableCell>
                          <TableCell align="right">Capital Progress</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell align="center">Entities</TableCell>
                          <TableCell></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {filteredInvestors.map((investor) => (
                          <TableRow key={investor?.id}>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Avatar sx={{ mr: 2, width: 32, height: 32 }}>
                                  {investor?.name ? investor.name.split(' ').map((n: string) => n[0]).join('') : '?'}
                                </Avatar>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                  {investor?.name || 'Unknown'}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Chip label={investor?.type || 'Unknown'} size="small" variant="outlined" />
                            </TableCell>
                            <TableCell align="right">
                              ${((investor?.totalCommitment || 0) / 1000000).toFixed(1)}M
                            </TableCell>
                            <TableCell align="right">
                              ${((investor?.totalCalled || 0) / 1000000).toFixed(1)}M
                            </TableCell>
                            <TableCell>
                              <Box sx={{ minWidth: 150 }}>
                                <CapitalProgressBar
                                  raised={investor?.totalCalled || 0}
                                  target={investor?.totalCommitment || 1}
                                  height={6}
                                />
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={investor?.status || 'Unknown'}
                                size="small"
                                color="success"
                                sx={{ textTransform: 'capitalize' }}
                              />
                            </TableCell>
                            <TableCell align="center">
                              <Button
                                size="small"
                                onClick={() => handleViewEntities(investor)}
                                startIcon={<BusinessIcon />}
                              >
                                {investor?.entities?.length || 0} entities
                              </Button>
                            </TableCell>
                            <TableCell>
                              <IconButton size="small" onClick={(e) => handleMenuOpen(e, investor.id)}>
                                <MoreVertIcon fontSize="small" />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Box>
            )}

            {tabValue === 1 && (
              <Box sx={{ mt: 2 }}>
                {recentCommunications.length > 0 ? (
                  <List>
                    {recentCommunications.map((comm) => (
                      <ListItem key={comm?.id}>
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: '#000000' }}>
                            {comm?.type === 'report' && <DocumentIcon />}
                            {comm?.type === 'update' && <EmailIcon />}
                            {comm?.type === 'capital_call' && <FundIcon />}
                            {comm?.type === 'event' && <EventIcon />}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={comm?.title}
                          secondary={`Sent to ${comm?.recipients} recipients • ${comm?.date}`}
                        />
                        <ListItemSecondaryAction>
                          <Button size="small">View</Button>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 6 }}>
                    <EmailIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                      No communications found
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                      Communication history will appear here once you start sending updates to your LPs.
                    </Typography>
                    <Button variant="outlined" startIcon={<EmailIcon />}>
                      Send LP Update
                    </Button>
                  </Box>
                )}
              </Box>
            )}

            {tabValue === 2 && (
              <Box sx={{ mt: 2 }}>
                {upcomingEvents.length > 0 ? (
                  <List>
                    {upcomingEvents.map((event) => (
                      <ListItem key={event?.id}>
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: '#000000' }}>
                            <EventIcon />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={event?.title}
                          secondary={`${event?.date} • ${event?.location} • ${event?.attendees} confirmed`}
                        />
                        <ListItemSecondaryAction>
                          <Button size="small">Manage</Button>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 6 }}>
                    <EventIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                      No upcoming events
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                      Events and meetings will appear here once scheduled.
                    </Typography>
                    <Button variant="outlined" startIcon={<EventIcon />}>
                      Schedule Meeting
                    </Button>
                  </Box>
                )}
              </Box>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
              Investor Distribution
            </Typography>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={investorTypeDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {investorTypeDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <Box sx={{ mt: 2 }}>
              {investorTypeDistribution.map((item, index) => (
                <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Box
                    sx={{
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      bgcolor: item.color,
                      mr: 1
                    }}
                  />
                  <Typography variant="body2" sx={{ flex: 1 }}>
                    {item.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {item.value}%
                  </Typography>
                </Box>
              ))}
            </Box>
          </Paper>

          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
              Quick Actions
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<EmailIcon />}
                sx={{ justifyContent: 'flex-start' }}
                onClick={() => setEmailUpdateModalOpen(true)}
              >
                Send LP Update
              </Button>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<DocumentIcon />}
                sx={{ justifyContent: 'flex-start' }}
                onClick={() => setReportModalOpen(true)}
              >
                Generate Quarterly Report
              </Button>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<FundIcon />}
                sx={{ justifyContent: 'flex-start' }}
                onClick={() => console.log('Capital Call feature coming soon')}
              >
                Issue Capital Call
              </Button>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<EventIcon />}
                sx={{ justifyContent: 'flex-start' }}
                onClick={() => console.log('Meeting Scheduler feature coming soon')}
              >
                Schedule Meeting
              </Button>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<GroupIcon />}
                sx={{ justifyContent: 'flex-start' }}
                onClick={() => setManageGroupsModalOpen(true)}
              >
                Manage Groups
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Entity Details Dialog */}
      <Dialog
        open={entityDialogOpen}
        onClose={() => setEntityDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <BusinessIcon sx={{ mr: 2 }} />
            {selectedInvestor?.name} - Investment Entities
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedInvestor && (
            <Box>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={3}>
                  <Typography variant="body2" color="text.secondary">Total Commitment</Typography>
                  <Typography variant="h6">${((selectedInvestor?.commitment || 0) / 1000000).toFixed(1)}M</Typography>
                </Grid>
                <Grid item xs={3}>
                  <Typography variant="body2" color="text.secondary">Total Called</Typography>
                  <Typography variant="h6">${((selectedInvestor?.called || 0) / 1000000).toFixed(1)}M</Typography>
                </Grid>
                <Grid item xs={3}>
                  <Typography variant="body2" color="text.secondary">Number of Entities</Typography>
                  <Typography variant="h6">{selectedInvestor?.entities?.length || 0}</Typography>
                </Grid>
                <Grid item xs={3}>
                  <Typography variant="body2" color="text.secondary">Funds Invested In</Typography>
                  <Typography variant="h6">
                    {selectedInvestor?.entities ? new Set(
                      selectedInvestor.entities.flatMap((entity: any) =>
                        entity?.fundInvestments?.map((fund: any) => fund?.fundName) || []
                      )
                    ).size : 0}
                  </Typography>
                </Grid>
              </Grid>

              {/* Fund Investment Summary */}
              <Paper sx={{ p: 2, mb: 3, bgcolor: '#f5f5f5', color: '#000000' }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <FundIcon />
                  Fund Investment Summary
                </Typography>
                <Grid container spacing={2}>
                  {['Equitle Fund I', 'Equitle Growth Fund'].map((fundName) => {
                    const totalAmount = selectedInvestor?.entities?.reduce((sum: number, entity: any) => {
                      const fundInvestment = entity?.fundInvestments?.find((fund: any) => fund?.fundName === fundName);
                      return sum + (fundInvestment?.amount || 0);
                    }, 0) || 0;
                    const percentage = selectedInvestor?.commitment ? (totalAmount / selectedInvestor.commitment) * 100 : 0;
                    
                    return (
                      <Grid item xs={6} key={fundName}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                              {fundName}
                            </Typography>
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                              ${(totalAmount / 1000000).toFixed(1)}M
                            </Typography>
                          </Box>
                          <Chip 
                            label={`${percentage.toFixed(1)}%`} 
                            size="small" 
                            sx={{ 
                              bgcolor: 'rgba(255,255,255,0.2)', 
                              color: 'white',
                              border: '1px solid rgba(255,255,255,0.3)'
                            }}
                          />
                        </Box>
                      </Grid>
                    );
                  })}
                </Grid>
              </Paper>

              <Typography variant="h6" sx={{ mb: 2 }}>
                Investment Entities & LLCs
              </Typography>

              <List>
                {selectedInvestor?.entities?.map((entity: any) => (
                  <React.Fragment key={entity.id}>
                    <ListItem sx={{ flexDirection: 'column', alignItems: 'stretch', py: 2 }}>
                      {/* Entity Header */}
                      <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', mb: 2 }}>
                        <Avatar sx={{ bgcolor: 'secondary.main', mr: 2 }}>
                          <BusinessIcon />
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            {entity?.name || 'Unknown Entity'}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                            <Typography variant="body2" color="text.secondary">
                              {entity?.type || 'Unknown'}
                            </Typography>
                            <Chip
                              label={entity?.investmentType || 'Unknown'}
                              size="small"
                              color={getInvestmentTypeColor(entity?.investmentType || '') as any}
                              variant="outlined"
                            />
                          </Box>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={entity?.commitment ? ((entity?.called || 0) / entity.commitment) * 100 : 0}
                          sx={{
                            width: 80,
                            height: 6,
                            borderRadius: 3,
                            '& .MuiLinearProgress-bar': {
                              borderRadius: 3
                            }
                          }}
                        />
                      </Box>

                      {/* Entity Summary */}
                      <Box sx={{ display: 'flex', gap: 3, mb: 2, flexWrap: 'wrap' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <MoneyIcon color="primary" fontSize="small" />
                              <Typography variant="body2">
                                <strong>Commitment:</strong> ${((entity?.commitment || 0) / 1000000).toFixed(1)}M
                              </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <TrendingUpIcon color="success" fontSize="small" />
                              <Typography variant="body2">
                                <strong>Called:</strong> ${((entity?.called || 0) / 1000000).toFixed(1)}M
                              </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <PieChartIcon sx={{ color: '#000000' }} fontSize="small" />
                              <Typography variant="body2">
                                <strong>% Called:</strong> {entity?.commitment ? (((entity?.called || 0) / entity.commitment) * 100).toFixed(1) : '0.0'}%
                              </Typography>
                            </Box>
                          </Box>

                      {/* Fund Investments */}
                      <Box sx={{ bgcolor: 'background.default', borderRadius: 2, p: 2 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                          <FundIcon color="primary" />
                          Fund Investments
                        </Typography>
                        
                        {entity?.fundInvestments && entity.fundInvestments.length > 0 ? (
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {entity.fundInvestments.map((fund: any, index: number) => (
                              <Box 
                                key={index} 
                                sx={{ 
                                  border: '1px solid', 
                                  borderColor: 'divider', 
                                  borderRadius: 2, 
                                  p: 2,
                                  bgcolor: 'background.paper',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s ease-in-out',
                                  '&:hover': {
                                    borderColor: 'primary.main',
                                    bgcolor: '#f5f5f5',
                                    transform: 'translateY(-2px)',
                                    boxShadow: 2
                                  }
                                }}
                                onClick={() => handleNavigateToFund(fund?.fundId, entity?.name)}
                              >
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                                  <Box>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'primary.main' }}>
                                      {fund?.fundName || 'Unknown Fund'}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      Vintage: {fund?.vintage || 'Unknown'}
                                    </Typography>
                                  </Box>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Chip
                                      label={`${fund?.percentage || 0}%`}
                                      size="small"
                                      color="primary"
                                      variant="outlined"
                                    />
                                    <OpenInNewIcon fontSize="small" color="primary" />
                                  </Box>
                                </Box>

                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <Typography variant="h6" sx={{ fontWeight: 600, color: 'success.main' }}>
                                    ${((fund?.amount || 0) / 1000000).toFixed(1)}M
                                  </Typography>
                        <LinearProgress
                          variant="determinate"
                                    value={fund?.percentage || 0}
                          sx={{
                                      width: 100,
                            height: 6,
                            borderRadius: 3,
                                      bgcolor: 'rgba(0,0,0,0.1)',
                            '& .MuiLinearProgress-bar': {
                                        borderRadius: 3,
                                        bgcolor: '#000000'
                            }
                          }}
                        />
                                </Box>
                                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  <ArrowForwardIcon fontSize="small" />
                                  Click to view fund details
                                </Typography>
                              </Box>
                            ))}
                          </Box>
                        ) : (
                          <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                            No fund investments recorded
                          </Typography>
                        )}
                      </Box>

                      {/* Documents Section */}
                      <Box sx={{ bgcolor: 'background.default', borderRadius: 2, p: 2, mt: 2 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                          <FolderIcon color="primary" />
                          Documents & Agreements
                        </Typography>
                        
                        {entity?.documents && entity.documents.length > 0 ? (
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            {entity.documents.map((doc: any) => (
                              <Box
                                key={doc?.id}
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  p: 1.5,
                                  border: '1px solid',
                                  borderColor: 'divider',
                                  borderRadius: 1,
                                  bgcolor: 'background.paper',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s ease-in-out',
                                  '&:hover': {
                                    borderColor: 'primary.main',
                                    bgcolor: 'primary.light'
                                  }
                                }}
                              >
                                <Avatar
                                  sx={{
                                    bgcolor: `${getDocumentColor(doc?.type || '')}.light`,
                                    color: `${getDocumentColor(doc?.type || '')}.contrastText`,
                                    mr: 2,
                                    width: 32,
                                    height: 32
                                  }}
                                >
                                  {getDocumentIcon(doc?.type || '')}
                                </Avatar>
                                <Box sx={{ flex: 1 }}>
                                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    {doc?.name || 'Unknown Document'}
                                  </Typography>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 0.5 }}>
                                    <Chip
                                      label={doc?.type || 'Unknown'}
                                      size="small"
                                      color={getDocumentColor(doc?.type || '') as any}
                                      variant="outlined"
                                    />
                                    <Typography variant="caption" color="text.secondary">
                                      {doc?.date || 'No date'}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      {doc?.size || 'Unknown size'}
                                    </Typography>
                                  </Box>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Chip
                                    label={doc?.status || 'Unknown'}
                                    size="small"
                                    color={doc?.status === 'Signed' || doc?.status === 'Approved' ? 'success' : 'default'}
                                    variant="outlined"
                                  />
                                  <IconButton size="small">
                                    <DownloadIcon fontSize="small" />
                                  </IconButton>
                                </Box>
                              </Box>
                            ))}
                          </Box>
                        ) : (
                          <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                            No documents available
                          </Typography>
                        )}
                      </Box>
                    </ListItem>
                    <Divider />
                  </React.Fragment>
                ))}
              </List>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEntityDialogOpen(false)}>Close</Button>
          <Button variant="contained">Export Entity Details</Button>
        </DialogActions>
      </Dialog>

      {/* Report Modal */}
      <ReportModal
        open={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        onSuccess={handleReportSuccess}
      />

      {/* Email Update Modal */}
      <EmailUpdateModal
        open={emailUpdateModalOpen}
        onClose={() => setEmailUpdateModalOpen(false)}
        onSuccess={handleEmailUpdateSuccess}
      />

      {/* New LP Modal */}
      <NewLPModal
        open={newLPModalOpen}
        onClose={() => setNewLPModalOpen(false)}
        onSuccess={handleNewLPSuccess}
      />

      {/* Investors Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleMenuClose}>
          <EditIcon fontSize="small" sx={{ mr: 1 }} />
          Edit Investor
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <VisibilityIcon fontSize="small" sx={{ mr: 1 }} />
          View Details
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <EmailIcon fontSize="small" sx={{ mr: 1 }} />
          Send Email
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleDeleteInvestor} sx={{ color: 'error.main' }}>
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          Delete Investor
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
            Are you sure you want to delete this investor? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDelete}>Cancel</Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Manage Groups Modal */}
      <ManageGroupsModal
        open={manageGroupsModalOpen}
        onClose={() => setManageGroupsModalOpen(false)}
        onSuccess={handleManageGroupsSuccess}
      />
    </Box>
  );
}