import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  LinearProgress,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem as SelectMenuItem,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  InputAdornment,
  Stack,
  ToggleButton,
  ToggleButtonGroup
} from '@mui/material';
import {
  Add as AddIcon,
  AccountBalance as FundIcon,
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  AttachMoney as MoneyIcon,
  MoreVert as MoreVertIcon,
  ExpandMore as ExpandMoreIcon,
  Business as BusinessIcon,
  Person as PersonIcon,
  FilterList as FilterIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Description as DocumentIcon,
  Download as DownloadIcon,
  Visibility as ViewIcon,
  BusinessCenter as CompanyIcon,
  CalendarToday as CalendarIcon,
  Percent as PercentIcon,
  AttachFile as AttachFileIcon
} from '@mui/icons-material';

// Mock data for funds and their investors
const funds = [
  {
    id: 1,
    name: 'Equitle Growth Fund I',
    vintage: 2022,
    targetSize: 100000000,
    raisedAmount: 85000000,
    status: 'Active',
    investorCount: 12,
    description: 'A growth equity fund focused on technology and healthcare companies with strong fundamentals and scalable business models.',
    fundManager: 'Sarah Johnson',
    launchDate: '2022-03-15',
    firstClose: '2022-06-30',
    finalClose: '2022-12-15',
    managementFee: 2.0,
    carriedInterest: 20.0,
    keyTerms: [
      '2% management fee on committed capital',
      '20% carried interest with 8% preferred return',
      '10-year fund life with 2-year extension option',
      'Key person provision for Sarah Johnson'
    ],
    investments: [
      {
        investor: 'Goldman Sachs',
        contactPerson: 'Michael Chen',
        email: 'michael.chen@gs.com',
        phone: '+1-212-902-1000',
        commitmentDate: '2022-04-15',
        entities: [
          { name: 'Goldman Sachs Asset Management', amount: 25000000, type: 'Direct', called: 17500000, status: 'Active' },
          { name: 'GS Private Wealth Solutions', amount: 15000000, type: 'Client Account', called: 10500000, status: 'Active' }
        ]
      },
      {
        investor: 'Smith Family Office',
        contactPerson: 'Robert Smith',
        email: 'robert@smithfamilyoffice.com',
        phone: '+1-415-555-0123',
        commitmentDate: '2022-05-20',
        entities: [
          { name: 'Smith Holdings LLC', amount: 10000000, type: 'Family LLC', called: 7000000, status: 'Active' },
          { name: 'Smith Investment Trust', amount: 5000000, type: 'Trust', called: 3500000, status: 'Active' }
        ]
      },
      {
        investor: 'JP Morgan Chase',
        contactPerson: 'Jennifer Martinez',
        email: 'jennifer.martinez@jpmorgan.com',
        phone: '+1-212-270-6000',
        commitmentDate: '2022-06-10',
        entities: [
          { name: 'JPM Private Bank', amount: 20000000, type: 'Private Banking', called: 14000000, status: 'Active' },
          { name: 'Chase Investment Services', amount: 10000000, type: 'Investment Services', called: 7000000, status: 'Active' }
        ]
      }
    ],
    documents: [
      { id: 1, name: 'Limited Partnership Agreement', type: 'Legal', date: '2022-03-15', size: '2.4 MB', status: 'Final' },
      { id: 2, name: 'Private Placement Memorandum', type: 'Marketing', date: '2022-02-28', size: '1.8 MB', status: 'Final' },
      { id: 3, name: 'Subscription Agreement Template', type: 'Legal', date: '2022-03-01', size: '856 KB', status: 'Final' },
      { id: 4, name: 'Q4 2023 Quarterly Report', type: 'Reporting', date: '2024-01-15', size: '3.2 MB', status: 'Final' },
      { id: 5, name: 'Capital Call Notice #8', type: 'Administrative', date: '2024-01-05', size: '245 KB', status: 'Final' },
      { id: 6, name: 'Annual Meeting Presentation', type: 'Presentation', date: '2024-02-15', size: '5.1 MB', status: 'Final' }
    ],
    portfolioCompanies: [
      { name: 'TechCorp Inc.', sector: 'Technology', investmentDate: '2022-08-15', amount: 15000000, status: 'Active' },
      { name: 'HealthTech Solutions', sector: 'Healthcare', investmentDate: '2022-11-20', amount: 12000000, status: 'Active' },
      { name: 'DataFlow Systems', sector: 'Technology', investmentDate: '2023-03-10', amount: 8000000, status: 'Active' }
    ]
  },
  {
    id: 2,
    name: 'Equitle Opportunity Fund',
    vintage: 2023,
    targetSize: 150000000,
    raisedAmount: 120000000,
    status: 'Fundraising',
    investorCount: 8,
    investments: [
      {
        investor: 'BlackRock',
        entities: [
          { name: 'BlackRock Alternative Investments', amount: 40000000, type: 'Direct' },
          { name: 'iShares Private Markets', amount: 20000000, type: 'Fund Vehicle' }
        ]
      },
      {
        investor: 'Tech Ventures LP',
        entities: [
          { name: 'Tech Ventures Main Fund', amount: 35000000, type: 'Fund of Funds' },
          { name: 'Tech Ventures Co-Investment', amount: 15000000, type: 'Co-Investment Vehicle' }
        ]
      }
    ]
  },
  {
    id: 3,
    name: 'Equitle Seed Fund',
    vintage: 2024,
    targetSize: 50000000,
    raisedAmount: 12000000,
    status: 'Pre-Launch',
    investorCount: 3,
    investments: [
      {
        investor: 'Wilson Family Trust',
        entities: [
          { name: 'Wilson Investment LLC', amount: 8000000, type: 'Family LLC' }
        ]
      },
      {
        investor: 'Angel Syndicate Group',
        entities: [
          { name: 'Angel Syndicate Fund I', amount: 4000000, type: 'Syndicate Vehicle' }
        ]
      }
    ]
  }
];

// Custom Progress Bar Component
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
        ${(raised / 1000000).toFixed(0)}M raised of ${(target / 1000000).toFixed(0)}M target ({progress.toFixed(1)}%)
      </Typography>
    </Box>
  );
};

export default function Funds() {
  const [tabValue, setTabValue] = useState(0);
  const [selectedFund, setSelectedFund] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [dialogTabValue, setDialogTabValue] = useState(0);
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [vintageFilter, setVintageFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sizeFilter, setSizeFilter] = useState<string>('all');

  // Filter logic
  const filteredFunds = funds.filter(fund => {
    const matchesStatus = statusFilter === 'all' || fund.status.toLowerCase() === statusFilter.toLowerCase();
    const matchesVintage = vintageFilter === 'all' || fund.vintage.toString() === vintageFilter;
    const matchesSearch = searchQuery === '' || fund.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSize = sizeFilter === 'all' || 
      (sizeFilter === 'small' && fund.targetSize <= 50000000) ||
      (sizeFilter === 'medium' && fund.targetSize > 50000000 && fund.targetSize <= 100000000) ||
      (sizeFilter === 'large' && fund.targetSize > 100000000);
    
    return matchesStatus && matchesVintage && matchesSearch && matchesSize;
  });

  // Calculate metrics based on filtered funds
  const totalAUM = filteredFunds.reduce((sum, fund) => sum + fund.raisedAmount, 0);
  const totalTarget = filteredFunds.reduce((sum, fund) => sum + fund.targetSize, 0);
  const totalInvestors = filteredFunds.reduce((sum, fund) => sum + fund.investorCount, 0);
  const activeFunds = filteredFunds.filter(fund => fund.status === 'Active').length;
  const avgProgress = filteredFunds.length > 0 ? 
    filteredFunds.reduce((sum, fund) => sum + (fund.raisedAmount / fund.targetSize * 100), 0) / filteredFunds.length : 0;

  const handleViewFundDetails = (fund: any) => {
    setSelectedFund(fund);
    setDialogOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'success';
      case 'Fundraising': return 'warning';
      case 'Pre-Launch': return 'info';
      default: return 'default';
    }
  };

  const clearFilters = () => {
    setStatusFilter('all');
    setVintageFilter('all');
    setSearchQuery('');
    setSizeFilter('all');
  };

  const hasActiveFilters = statusFilter !== 'all' || vintageFilter !== 'all' || searchQuery !== '' || sizeFilter !== 'all';

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
            Funds Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage funds, track investments, and monitor investor relationships
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="outlined">
            Export Data
          </Button>
          <Button variant="contained" startIcon={<AddIcon />}>
            Create Fund
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
              label="Search Funds"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <SelectMenuItem value="all">All Status</SelectMenuItem>
                <SelectMenuItem value="active">Active</SelectMenuItem>
                <SelectMenuItem value="fundraising">Fundraising</SelectMenuItem>
                <SelectMenuItem value="pre-launch">Pre-Launch</SelectMenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Vintage Year</InputLabel>
              <Select
                value={vintageFilter}
                label="Vintage Year"
                onChange={(e) => setVintageFilter(e.target.value)}
              >
                <SelectMenuItem value="all">All Years</SelectMenuItem>
                <SelectMenuItem value="2024">2024</SelectMenuItem>
                <SelectMenuItem value="2023">2023</SelectMenuItem>
                <SelectMenuItem value="2022">2022</SelectMenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Fund Size</InputLabel>
              <Select
                value={sizeFilter}
                label="Fund Size"
                onChange={(e) => setSizeFilter(e.target.value)}
              >
                <SelectMenuItem value="all">All Sizes</SelectMenuItem>
                <SelectMenuItem value="small">Small (≤$50M)</SelectMenuItem>
                <SelectMenuItem value="medium">Medium ($50M-$100M)</SelectMenuItem>
                <SelectMenuItem value="large">Large (&gt;$100M)</SelectMenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        {hasActiveFilters && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Showing {filteredFunds.length} of {funds.length} funds
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Overall Capital Progress */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
          Capital Raising Progress {hasActiveFilters && '(Filtered)'}
        </Typography>
        <CapitalProgressBar raised={totalAUM} target={totalTarget} height={12} />
      </Paper>

      {/* Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                  <MoneyIcon />
                </Avatar>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 600 }}>
                    ${(totalAUM / 1000000).toFixed(0)}M
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Total AUM
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: 'success.main', mr: 2 }}>
                  <FundIcon />
                </Avatar>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 600 }}>
                    {filteredFunds.length}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {hasActiveFilters ? 'Filtered' : 'Total'} Funds
                  </Typography>
                </Box>
              </Box>
              <Typography variant="body2" color="text.secondary">
                {activeFunds} Active
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: 'info.main', mr: 2 }}>
                  <PeopleIcon />
                </Avatar>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 600 }}>
                    {totalInvestors}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Total Investors
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: 'warning.main', mr: 2 }}>
                  <TrendingUpIcon />
                </Avatar>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 600 }}>
                    {avgProgress.toFixed(1)}%
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Avg. Progress
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Funds Table */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
          Fund Portfolio {hasActiveFilters && `(${filteredFunds.length} funds)`}
        </Typography>
        
        {filteredFunds.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body1" color="text.secondary">
              No funds match the current filters
            </Typography>
            <Button onClick={clearFilters} sx={{ mt: 2 }}>
              Clear Filters
            </Button>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Fund Name</TableCell>
                  <TableCell>Vintage</TableCell>
                  <TableCell align="right">Target Size</TableCell>
                  <TableCell align="right">Raised</TableCell>
                  <TableCell align="center">Capital Progress</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="center">Investors</TableCell>
                  <TableCell></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredFunds.map((fund) => {
                  return (
                    <TableRow key={fund.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar sx={{ mr: 2, width: 32, height: 32, bgcolor: 'primary.main' }}>
                            <FundIcon fontSize="small" />
                          </Avatar>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {fund.name}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{fund.vintage}</TableCell>
                      <TableCell align="right">
                        ${(fund.targetSize / 1000000).toFixed(0)}M
                      </TableCell>
                      <TableCell align="right">
                        ${(fund.raisedAmount / 1000000).toFixed(0)}M
                      </TableCell>
                      <TableCell>
                        <Box sx={{ minWidth: 150 }}>
                          <CapitalProgressBar 
                            raised={fund.raisedAmount} 
                            target={fund.targetSize}
                            height={6}
                          />
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={fund.status}
                          size="small"
                          color={getStatusColor(fund.status) as any}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Button
                          size="small"
                          onClick={() => handleViewFundDetails(fund)}
                        >
                          {fund.investorCount} Investors
                        </Button>
                      </TableCell>
                      <TableCell>
                        <IconButton size="small">
                          <MoreVertIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Comprehensive Fund Insights Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: { height: '90vh' }
        }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <FundIcon sx={{ mr: 2 }} />
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 600 }}>
                  {selectedFund?.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedFund?.description}
                </Typography>
              </Box>
            </Box>
            <Button onClick={() => setDialogOpen(false)}>Close</Button>
          </Box>
        </DialogTitle>
        
        <DialogContent sx={{ p: 0 }}>
          {selectedFund && (
            <Box>
              {/* Fund Overview Cards */}
              <Box sx={{ p: 3, borderBottom: 1, borderColor: 'divider' }}>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Card variant="outlined">
                      <CardContent sx={{ textAlign: 'center' }}>
                        <Typography variant="h4" sx={{ fontWeight: 600, color: 'primary.main' }}>
                          ${(selectedFund.targetSize / 1000000).toFixed(0)}M
                        </Typography>
                        <Typography variant="body2" color="text.secondary">Target Size</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Card variant="outlined">
                      <CardContent sx={{ textAlign: 'center' }}>
                        <Typography variant="h4" sx={{ fontWeight: 600, color: 'success.main' }}>
                          ${(selectedFund.raisedAmount / 1000000).toFixed(0)}M
                        </Typography>
                        <Typography variant="body2" color="text.secondary">Raised Amount</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Card variant="outlined">
                      <CardContent sx={{ textAlign: 'center' }}>
                        <Typography variant="h4" sx={{ fontWeight: 600, color: 'info.main' }}>
                          {selectedFund.investorCount}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">Investors</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Card variant="outlined">
                      <CardContent sx={{ textAlign: 'center' }}>
                        <Typography variant="h4" sx={{ fontWeight: 600, color: 'warning.main' }}>
                          {selectedFund.managementFee}%
                        </Typography>
                        <Typography variant="body2" color="text.secondary">Management Fee</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Box>

              {/* Tabs for different sections */}
              <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={dialogTabValue} onChange={(_, newValue) => setDialogTabValue(newValue)}>
                  <Tab label="Investors & Entities" />
                  <Tab label="Fund Details" />
                  <Tab label="Documents" />
                  <Tab label="Portfolio" />
                </Tabs>
              </Box>

              {/* Tab Content */}
              <Box sx={{ p: 3, maxHeight: '50vh', overflow: 'auto' }}>
                {dialogTabValue === 0 && (
                  <Box>
                    <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                      Investors & Their Investment Entities
                    </Typography>
                    {selectedFund.investments.map((investment: any, index: number) => (
                      <Accordion key={index} sx={{ mb: 2 }}>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                          <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                            <Avatar sx={{ mr: 2, width: 40, height: 40 }}>
                              {investment.investor.split(' ').map((n: string) => n[0]).join('')}
                            </Avatar>
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                {investment.investor}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {investment.entities.length} entities • $
                                {(investment.entities.reduce((sum: number, entity: any) => sum + entity.amount, 0) / 1000000).toFixed(1)}M total
                              </Typography>
                              <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  <PersonIcon fontSize="small" sx={{ mr: 0.5 }} />
                                  <Typography variant="caption">{investment.contactPerson}</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  <EmailIcon fontSize="small" sx={{ mr: 0.5 }} />
                                  <Typography variant="caption">{investment.email}</Typography>
                                </Box>
                              </Box>
                            </Box>
                          </Box>
                        </AccordionSummary>
                        <AccordionDetails>
                          <List>
                            {investment.entities.map((entity: any, entityIndex: number) => (
                              <ListItem key={entityIndex} sx={{ pl: 4 }}>
                                <ListItemAvatar>
                                  <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
                                    <BusinessIcon fontSize="small" />
                                  </Avatar>
                                </ListItemAvatar>
                                <ListItemText
                                  primary={
                                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                      {entity.name}
                                    </Typography>
                                  }
                                  secondary={
                                    <Box>
                                      <Typography variant="body2" color="text.secondary">
                                        {entity.type} • Committed: ${(entity.amount / 1000000).toFixed(1)}M • Called: ${(entity.called / 1000000).toFixed(1)}M
                                      </Typography>
                                      <Box sx={{ mt: 1 }}>
                                        <CapitalProgressBar 
                                          raised={entity.called} 
                                          target={entity.amount}
                                          height={4}
                                        />
                                      </Box>
                                    </Box>
                                  }
                                />
                                <ListItemSecondaryAction>
                                  <Chip 
                                    label={entity.status} 
                                    size="small" 
                                    color="success" 
                                    variant="outlined"
                                  />
                                </ListItemSecondaryAction>
                              </ListItem>
                            ))}
                          </List>
                        </AccordionDetails>
                      </Accordion>
                    ))}
                  </Box>
                )}

                {dialogTabValue === 1 && (
                  <Box>
                    <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                      Fund Details & Terms
                    </Typography>
                    <Grid container spacing={3}>
                      <Grid item xs={12} md={6}>
                        <Paper sx={{ p: 2 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                            Fund Information
                          </Typography>
                          <List dense>
                            <ListItem>
                              <ListItemText 
                                primary="Fund Manager" 
                                secondary={selectedFund.fundManager}
                              />
                            </ListItem>
                            <ListItem>
                              <ListItemText 
                                primary="Launch Date" 
                                secondary={selectedFund.launchDate}
                              />
                            </ListItem>
                            <ListItem>
                              <ListItemText 
                                primary="First Close" 
                                secondary={selectedFund.firstClose}
                              />
                            </ListItem>
                            <ListItem>
                              <ListItemText 
                                primary="Final Close" 
                                secondary={selectedFund.finalClose}
                              />
                            </ListItem>
                            <ListItem>
                              <ListItemText 
                                primary="Management Fee" 
                                secondary={`${selectedFund.managementFee}%`}
                              />
                            </ListItem>
                            <ListItem>
                              <ListItemText 
                                primary="Carried Interest" 
                                secondary={`${selectedFund.carriedInterest}%`}
                              />
                            </ListItem>
                          </List>
                        </Paper>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Paper sx={{ p: 2 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                            Key Terms
                          </Typography>
                          <List dense>
                            {selectedFund.keyTerms.map((term: string, index: number) => (
                              <ListItem key={index}>
                                <ListItemText primary={term} />
                              </ListItem>
                            ))}
                          </List>
                        </Paper>
                      </Grid>
                    </Grid>
                  </Box>
                )}

                {dialogTabValue === 2 && (
                  <Box>
                    <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                      Fund Documents
                    </Typography>
                    <List>
                      {selectedFund.documents.map((doc: any) => (
                        <ListItem key={doc.id} sx={{ border: 1, borderColor: 'divider', borderRadius: 1, mb: 1 }}>
                          <ListItemAvatar>
                            <Avatar sx={{ bgcolor: 'primary.main' }}>
                              <DocumentIcon />
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={
                              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                {doc.name}
                              </Typography>
                            }
                            secondary={
                              <Box>
                                <Typography variant="body2" color="text.secondary">
                                  {doc.type} • {doc.date} • {doc.size}
                                </Typography>
                                <Chip 
                                  label={doc.status} 
                                  size="small" 
                                  color="success" 
                                  variant="outlined"
                                  sx={{ mt: 0.5 }}
                                />
                              </Box>
                            }
                          />
                          <ListItemSecondaryAction>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <IconButton size="small">
                                <ViewIcon />
                              </IconButton>
                              <IconButton size="small">
                                <DownloadIcon />
                              </IconButton>
                            </Box>
                          </ListItemSecondaryAction>
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}

                {dialogTabValue === 3 && (
                  <Box>
                    <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                      Portfolio Companies
                    </Typography>
                    <List>
                      {selectedFund.portfolioCompanies.map((company: any, index: number) => (
                        <ListItem key={index} sx={{ border: 1, borderColor: 'divider', borderRadius: 1, mb: 1 }}>
                          <ListItemAvatar>
                            <Avatar sx={{ bgcolor: 'success.main' }}>
                              <CompanyIcon />
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={
                              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                {company.name}
                              </Typography>
                            }
                            secondary={
                              <Box>
                                <Typography variant="body2" color="text.secondary">
                                  {company.sector} • Investment Date: {company.investmentDate}
                                </Typography>
                                <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.5 }}>
                                  Investment Amount: ${(company.amount / 1000000).toFixed(1)}M
                                </Typography>
                              </Box>
                            }
                          />
                          <ListItemSecondaryAction>
                            <Chip 
                              label={company.status} 
                              size="small" 
                              color="success" 
                              variant="outlined"
                            />
                          </ListItemSecondaryAction>
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}
              </Box>
            </Box>
          )}
        </DialogContent>
        
        <DialogActions sx={{ p: 3, borderTop: 1, borderColor: 'divider' }}>
          <Button variant="outlined" startIcon={<DownloadIcon />}>
            Export All Data
          </Button>
          <Button variant="contained" startIcon={<EmailIcon />}>
            Send Update to LPs
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}