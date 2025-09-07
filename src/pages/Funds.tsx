import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
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
  AccountBalance as BankIcon,
  Description as DocumentIcon,
  Assessment as ChartIcon,
  Visibility as VisibilityIcon,
  Download as DownloadIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Group as GroupIcon,
  AttachFile as AttachFileIcon,
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  Pause as PauseIcon
} from '@mui/icons-material';

// Mock data for funds and their investors
const funds = [
  {
    id: 'fund-1',
    name: 'Equitle Fund I',
    vintage: 2023,
    targetSize: 100000000,
    raisedAmount: 85000000,
    status: 'Active',
    investorCount: 12,
    size: 100000000,
    fundraisingData: {
      emails: [
        {
          id: 1,
          subject: 'Q4 2023 Fund Performance Update',
          date: '2024-01-15',
          recipients: 12,
          readBy: ['Goldman Sachs', 'JP Morgan Chase', 'BlackRock', 'Smith Family Office'],
          status: 'sent'
        },
        {
          id: 2,
          subject: 'Capital Call Notice #3 - $5M',
          date: '2024-01-10',
          recipients: 12,
          readBy: ['Goldman Sachs', 'JP Morgan Chase', 'BlackRock'],
          status: 'sent'
        },
        {
          id: 3,
          subject: 'Portfolio Company Update: TechCorp Acquisition',
          date: '2024-01-05',
          recipients: 12,
          readBy: ['Goldman Sachs', 'Smith Family Office', 'Tech Ventures LP'],
          status: 'sent'
        }
      ],
      callTranscripts: [
        {
          id: 1,
          title: 'Goldman Sachs - Fund Performance Review',
          date: '2024-01-12',
          duration: '45 minutes',
          participants: ['John Smith (Equitle)', 'Sarah Johnson (Goldman Sachs)'],
          summary: 'Discussed Q4 performance, upcoming capital calls, and portfolio company updates',
          status: 'completed'
        },
        {
          id: 2,
          title: 'JP Morgan Chase - Investment Committee Call',
          date: '2024-01-08',
          duration: '30 minutes',
          participants: ['John Smith (Equitle)', 'Mike Chen (JPM)', 'Lisa Wang (JPM)'],
          summary: 'Reviewed fund performance metrics and discussed co-investment opportunities',
          status: 'completed'
        }
      ],
      bankAccounts: [
        {
          id: 1,
          name: 'Equitle Fund I - Main Account',
          bank: 'JPMorgan Chase',
          accountNumber: '****1234',
          balance: 45000000,
          currency: 'USD',
          status: 'active'
        },
        {
          id: 2,
          name: 'Equitle Fund I - Capital Call Account',
          bank: 'Goldman Sachs',
          accountNumber: '****5678',
          balance: 15000000,
          currency: 'USD',
          status: 'active'
        }
      ],
      subscriptionAgreements: [
        {
          id: 1,
          entityName: 'Goldman Sachs Asset Management',
          date: '2023-01-15',
          amount: 20000000,
          status: 'signed',
          version: 'v2.1'
        },
        {
          id: 2,
          entityName: 'JP Morgan Private Bank',
          date: '2023-01-20',
          amount: 18000000,
          status: 'signed',
          version: 'v2.1'
        }
      ],
      capitalCalls: [
        {
          id: 1,
          callNumber: 'CC-001',
          date: '2023-03-15',
          amount: 25000000,
          dueDate: '2023-04-15',
          status: 'completed',
          collected: 25000000
        },
        {
          id: 2,
          callNumber: 'CC-002',
          date: '2023-06-15',
          amount: 20000000,
          dueDate: '2023-07-15',
          status: 'completed',
          collected: 20000000
        },
        {
          id: 3,
          callNumber: 'CC-003',
          date: '2024-01-10',
          amount: 15000000,
          dueDate: '2024-02-10',
          status: 'pending',
          collected: 10000000
        }
      ],
      commitmentTimeline: [
        { date: '2023-01-15', amount: 20000000, cumulative: 20000000 },
        { date: '2023-01-20', amount: 18000000, cumulative: 38000000 },
        { date: '2023-01-25', amount: 25000000, cumulative: 63000000 },
        { date: '2023-02-01', amount: 10000000, cumulative: 73000000 },
        { date: '2023-02-15', amount: 12000000, cumulative: 85000000 }
      ]
    },
    investments: [
      {
        investor: 'Goldman Sachs',
        entities: [
          { name: 'Goldman Sachs Asset Management', amount: 20000000, type: 'Direct Investment', investmentType: 'Corporation' },
          { name: 'GS Private Wealth Solutions', amount: 15000000, type: 'Client Account', investmentType: 'LLC' }
        ]
      },
      {
        investor: 'JP Morgan Chase',
        entities: [
          { name: 'JPM Private Bank', amount: 18000000, type: 'Private Banking', investmentType: 'Corporation' },
          { name: 'Chase Investment Services', amount: 10000000, type: 'Investment Services', investmentType: 'Partnership' }
        ]
      },
      {
        investor: 'BlackRock',
        entities: [
          { name: 'BlackRock Alternative Investments', amount: 25000000, type: 'Direct Investment', investmentType: 'Corporation' }
        ]
      },
      {
        investor: 'Smith Family Office',
        entities: [
          { name: 'Smith Holdings LLC', amount: 6000000, type: 'Family LLC', investmentType: 'LLC' },
          { name: 'Smith Investment Trust', amount: 3000000, type: 'Trust', investmentType: 'Trust' }
        ]
      },
      {
        investor: 'Tech Ventures LP',
        entities: [
          { name: 'Tech Ventures Main Fund', amount: 10000000, type: 'Fund of Funds', investmentType: 'Partnership' },
          { name: 'Tech Ventures Co-Investment', amount: 6000000, type: 'Co-Investment Vehicle', investmentType: 'LLC' }
        ]
      }
    ]
  },
  {
    id: 'fund-2',
    name: 'Equitle Growth Fund',
    vintage: 2024,
    targetSize: 150000000,
    raisedAmount: 120000000,
    status: 'Fundraising',
    investorCount: 8,
    size: 150000000,
    investments: [
      {
        investor: 'Goldman Sachs',
        entities: [
          { name: 'Goldman Sachs Asset Management', amount: 10000000, type: 'Direct Investment', investmentType: 'Corporation' },
          { name: 'GS Private Wealth Solutions', amount: 5000000, type: 'Client Account', investmentType: 'LLC' }
        ]
      },
      {
        investor: 'JP Morgan Chase',
        entities: [
          { name: 'JPM Private Bank', amount: 7000000, type: 'Private Banking', investmentType: 'Corporation' },
          { name: 'Chase Investment Services', amount: 5000000, type: 'Investment Services', investmentType: 'Partnership' }
        ]
      },
      {
        investor: 'BlackRock',
        entities: [
          { name: 'BlackRock Alternative Investments', amount: 10000000, type: 'Direct Investment', investmentType: 'Corporation' }
        ]
      },
      {
        investor: 'Smith Family Office',
        entities: [
          { name: 'Smith Holdings LLC', amount: 4000000, type: 'Family LLC', investmentType: 'LLC' },
          { name: 'Smith Investment Trust', amount: 2000000, type: 'Trust', investmentType: 'Trust' }
        ]
      },
      {
        investor: 'Tech Ventures LP',
        entities: [
          { name: 'Tech Ventures Main Fund', amount: 5000000, type: 'Fund of Funds', investmentType: 'Partnership' },
          { name: 'Tech Ventures Co-Investment', amount: 4000000, type: 'Co-Investment Vehicle', investmentType: 'LLC' }
        ]
      }
    ]
  },
  {
    id: 'fund-3',
    name: 'Equitle Opportunity Fund',
    vintage: 2023,
    targetSize: 150000000,
    raisedAmount: 120000000,
    status: 'Fundraising',
    investorCount: 8,
    size: 150000000,
    investments: [
      {
        investor: 'BlackRock',
        entities: [
          { name: 'BlackRock Alternative Investments', amount: 40000000, type: 'Direct Investment', investmentType: 'Corporation' },
          { name: 'iShares Private Markets', amount: 20000000, type: 'Fund Vehicle', investmentType: 'Corporation' }
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
  const [searchParams] = useSearchParams();
  const [tabValue, setTabValue] = useState(0);
  const [selectedFund, setSelectedFund] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [highlightedEntity, setHighlightedEntity] = useState<string | null>(null);
  const [fundDetailsOpen, setFundDetailsOpen] = useState(false);
  const [selectedFundDetails, setSelectedFundDetails] = useState<any>(null);
  
  // Handle URL parameters for navigation from Investor Relations
  useEffect(() => {
    const highlight = searchParams.get('highlight');
    const entity = searchParams.get('entity');
    
    if (highlight && entity) {
      setHighlightedEntity(decodeURIComponent(entity));
      // Find and open the corresponding fund
      const fund = funds.find(f => f.id === highlight);
      if (fund) {
        setSelectedFund(fund);
        setDialogOpen(true);
      }
    }
  }, [searchParams]);
  
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

  const handleViewComprehensiveDetails = (fund: any) => {
    setSelectedFundDetails(fund);
    setFundDetailsOpen(true);
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
                <Avatar sx={{ bgcolor: '#000000', mr: 2 }}>
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
                <Avatar sx={{ bgcolor: '#000000', mr: 2 }}>
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
                <Avatar sx={{ bgcolor: '#000000', mr: 2 }}>
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
                  <TableCell align="center">Actions</TableCell>
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
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Button
                            size="small"
                            variant="contained"
                            onClick={() => handleViewComprehensiveDetails(fund)}
                            startIcon={<AddIcon />}
                            sx={{ 
                              minWidth: 'auto',
                              px: 1,
                              py: 0.5,
                              fontSize: '0.75rem',
                              bgcolor: 'primary.main',
                              '&:hover': { 
                                bgcolor: 'primary.dark',
                                transform: 'scale(1.05)'
                              },
                              transition: 'all 0.2s ease-in-out'
                            }}
                          >
                            Details
                          </Button>
                          <IconButton size="small">
                            <MoreVertIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Fund Details Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <FundIcon sx={{ mr: 2 }} />
            {selectedFund?.name} - Investor Details
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedFund && (
            <Box>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Target Size</Typography>
                  <Typography variant="h6">${(selectedFund.targetSize / 1000000).toFixed(0)}M</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Raised Amount</Typography>
                  <Typography variant="h6">${(selectedFund.raisedAmount / 1000000).toFixed(0)}M</Typography>
                </Grid>
              </Grid>

              <Typography variant="h6" sx={{ mb: 2 }}>
                Investors & Their Entities
              </Typography>

              {selectedFund.investments.map((investment: any, index: number) => (
                <Accordion key={index} sx={{ mb: 1 }}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                      <Avatar sx={{ mr: 2, width: 32, height: 32 }}>
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
                      </Box>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <List dense>
                      {investment.entities.map((entity: any, entityIndex: number) => {
                        const isHighlighted = highlightedEntity === entity.name;
                        return (
                          <ListItem 
                            key={entityIndex}
                            sx={{
                              bgcolor: isHighlighted ? 'primary.light' : 'transparent',
                              border: isHighlighted ? '2px solid' : '1px solid transparent',
                              borderColor: isHighlighted ? 'primary.main' : 'transparent',
                              borderRadius: 1,
                              mb: 1,
                              transition: 'all 0.3s ease-in-out',
                              animation: isHighlighted ? 'pulse 2s infinite' : 'none',
                              '@keyframes pulse': {
                                '0%': { boxShadow: '0 0 0 0 rgba(25, 118, 210, 0.7)' },
                                '70%': { boxShadow: '0 0 0 10px rgba(25, 118, 210, 0)' },
                                '100%': { boxShadow: '0 0 0 0 rgba(25, 118, 210, 0)' }
                              }
                            }}
                          >
                            <ListItemAvatar>
                              <Avatar sx={{ 
                                width: 24, 
                                height: 24, 
                                bgcolor: isHighlighted ? 'primary.main' : 'secondary.main' 
                              }}>
                                <BusinessIcon fontSize="small" />
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    {entity.name}
                                  </Typography>
                                  {isHighlighted && (
                                    <Chip 
                                      label="Selected" 
                                      size="small" 
                                      color="primary" 
                                      variant="filled"
                                    />
                                  )}
                                </Box>
                              }
                              secondary={
                                <Box>
                                  <Typography variant="caption" color="text.secondary">
                                    {entity.type}
                                  </Typography>
                                  {entity.investmentType && (
                                    <Chip 
                                      label={entity.investmentType} 
                                      size="small" 
                                      color="info" 
                                      variant="outlined"
                                      sx={{ ml: 1 }}
                                    />
                                  )}
                                </Box>
                              }
                            />
                            <ListItemSecondaryAction>
                              <Box sx={{ textAlign: 'right' }}>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                  ${(entity.amount / 1000000).toFixed(1)}M
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {((entity.amount / selectedFund.size) * 100).toFixed(1)}% of fund
                                </Typography>
                              </Box>
                            </ListItemSecondaryAction>
                          </ListItem>
                        );
                      })}
                    </List>
                  </AccordionDetails>
                </Accordion>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Close</Button>
          <Button variant="contained">Export Details</Button>
        </DialogActions>
      </Dialog>

      {/* Comprehensive Fund Details Dialog */}
      <Dialog
        open={fundDetailsOpen}
        onClose={() => setFundDetailsOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'primary.main' }}>
              <FundIcon />
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {selectedFundDetails?.name} - Comprehensive Fundraising Details
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Complete fundraising overview and activity
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedFundDetails && (
            <Box>
              {/* Fund Overview */}
              <Paper sx={{ p: 2, mb: 3, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
                <Grid container spacing={2}>
                  <Grid item xs={3}>
                    <Typography variant="body2">Target Size</Typography>
                    <Typography variant="h6">${(selectedFundDetails.targetSize / 1000000).toFixed(0)}M</Typography>
                  </Grid>
                  <Grid item xs={3}>
                    <Typography variant="body2">Raised Amount</Typography>
                    <Typography variant="h6">${(selectedFundDetails.raisedAmount / 1000000).toFixed(0)}M</Typography>
                  </Grid>
                  <Grid item xs={3}>
                    <Typography variant="body2">Progress</Typography>
                    <Typography variant="h6">{((selectedFundDetails.raisedAmount / selectedFundDetails.targetSize) * 100).toFixed(1)}%</Typography>
                  </Grid>
                  <Grid item xs={3}>
                    <Typography variant="body2">Investors</Typography>
                    <Typography variant="h6">{selectedFundDetails.investorCount}</Typography>
                  </Grid>
                </Grid>
              </Paper>

              {/* Commitment Timeline Chart */}
              <Paper sx={{ p: 2, mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ChartIcon sx={{ color: '#000000' }} />
                  Commitment Timeline
                </Typography>
                <Box sx={{ height: 200, display: 'flex', alignItems: 'end', gap: 1, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                  {selectedFundDetails.fundraisingData?.commitmentTimeline?.map((point: any, index: number) => (
                    <Box key={index} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                      <Box
                        sx={{
                          width: '100%',
                          height: `${(point.cumulative / selectedFundDetails.targetSize) * 150}px`,
                          bgcolor: 'primary.main',
                          borderRadius: '4px 4px 0 0',
                          mb: 1,
                          transition: 'all 0.3s ease'
                        }}
                      />
                      <Typography variant="caption" sx={{ textAlign: 'center', fontSize: '0.7rem' }}>
                        {new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </Typography>
                      <Typography variant="caption" sx={{ fontSize: '0.6rem', color: 'text.secondary' }}>
                        ${(point.amount / 1000000).toFixed(0)}M
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Paper>

              {/* Tabs for different sections */}
              <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
                  <Tab label="Emails" icon={<EmailIcon />} />
                  <Tab label="Call Transcripts" icon={<PhoneIcon />} />
                  <Tab label="Bank Accounts" icon={<BankIcon />} />
                  <Tab label="Capital Calls" icon={<MoneyIcon />} />
                  <Tab label="Agreements" icon={<DocumentIcon />} />
                </Tabs>
              </Box>

              {/* Emails Tab */}
              {tabValue === 0 && (
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                    Recent Emails ({selectedFundDetails.fundraisingData?.emails?.length || 0})
                  </Typography>
                  {selectedFundDetails.fundraisingData?.emails?.map((email: any) => (
                    <Paper key={email.id} sx={{ p: 2, mb: 2, border: '1px solid', borderColor: 'divider' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                          {email.subject}
                        </Typography>
                        <Chip label={email.status} size="small" color="primary" variant="outlined" />
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        Sent: {new Date(email.date).toLocaleDateString()} • {email.recipients} recipients
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                        <Typography variant="caption" color="text.secondary">
                          Read by:
                        </Typography>
                        {email.readBy.map((reader: string, index: number) => (
                          <Chip key={index} label={reader} size="small" color="success" variant="outlined" />
                        ))}
                      </Box>
                    </Paper>
                  ))}
                </Box>
              )}

              {/* Call Transcripts Tab */}
              {tabValue === 1 && (
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                    Call Transcripts ({selectedFundDetails.fundraisingData?.callTranscripts?.length || 0})
                  </Typography>
                  {selectedFundDetails.fundraisingData?.callTranscripts?.map((call: any) => (
                    <Paper key={call.id} sx={{ p: 2, mb: 2, border: '1px solid', borderColor: 'divider' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                          {call.title}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Chip label={call.duration} size="small" color="info" variant="outlined" />
                          <Chip label={call.status} size="small" color="success" variant="outlined" />
                        </Box>
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {new Date(call.date).toLocaleDateString()}
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        {call.summary}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                        <Typography variant="caption" color="text.secondary">
                          Participants:
                        </Typography>
                        {call.participants.map((participant: string, index: number) => (
                          <Chip key={index} label={participant} size="small" color="primary" variant="outlined" />
                        ))}
                      </Box>
                    </Paper>
                  ))}
                </Box>
              )}

              {/* Bank Accounts Tab */}
              {tabValue === 2 && (
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                    Bank Accounts ({selectedFundDetails.fundraisingData?.bankAccounts?.length || 0})
                  </Typography>
                  {selectedFundDetails.fundraisingData?.bankAccounts?.map((account: any) => (
                    <Paper key={account.id} sx={{ p: 2, mb: 2, border: '1px solid', borderColor: 'divider' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                          {account.name}
                        </Typography>
                        <Chip label={account.status} size="small" color="success" variant="outlined" />
                      </Box>
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">Bank</Typography>
                          <Typography variant="body2">{account.bank}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">Account Number</Typography>
                          <Typography variant="body2">{account.accountNumber}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">Balance</Typography>
                          <Typography variant="h6" color="success.main">
                            ${(account.balance / 1000000).toFixed(1)}M
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">Currency</Typography>
                          <Typography variant="body2">{account.currency}</Typography>
                        </Grid>
                      </Grid>
                    </Paper>
                  ))}
                </Box>
              )}

              {/* Capital Calls Tab */}
              {tabValue === 3 && (
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                    Capital Calls ({selectedFundDetails.fundraisingData?.capitalCalls?.length || 0})
                  </Typography>
                  {selectedFundDetails.fundraisingData?.capitalCalls?.map((call: any) => (
                    <Paper key={call.id} sx={{ p: 2, mb: 2, border: '1px solid', borderColor: 'divider' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                          {call.callNumber}
                        </Typography>
                        <Chip 
                          label={call.status} 
                          size="small" 
                          color={call.status === 'completed' ? 'success' : 'warning'} 
                          variant="outlined" 
                        />
                      </Box>
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">Call Date</Typography>
                          <Typography variant="body2">{new Date(call.date).toLocaleDateString()}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">Due Date</Typography>
                          <Typography variant="body2">{new Date(call.dueDate).toLocaleDateString()}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">Amount</Typography>
                          <Typography variant="h6" color="primary.main">
                            ${(call.amount / 1000000).toFixed(1)}M
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">Collected</Typography>
                          <Typography variant="h6" color="success.main">
                            ${(call.collected / 1000000).toFixed(1)}M
                          </Typography>
                        </Grid>
                      </Grid>
                      <Box sx={{ mt: 1 }}>
                        <LinearProgress
                          variant="determinate"
                          value={(call.collected / call.amount) * 100}
                          sx={{ height: 8, borderRadius: 4 }}
                        />
                        <Typography variant="caption" color="text.secondary">
                          {((call.collected / call.amount) * 100).toFixed(1)}% collected
                        </Typography>
                      </Box>
                    </Paper>
                  ))}
                </Box>
              )}

              {/* Subscription Agreements Tab */}
              {tabValue === 4 && (
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                    Subscription Agreements ({selectedFundDetails.fundraisingData?.subscriptionAgreements?.length || 0})
                  </Typography>
                  {selectedFundDetails.fundraisingData?.subscriptionAgreements?.map((agreement: any) => (
                    <Paper key={agreement.id} sx={{ p: 2, mb: 2, border: '1px solid', borderColor: 'divider' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                          {agreement.entityName}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Chip label={agreement.status} size="small" color="success" variant="outlined" />
                          <Chip label={agreement.version} size="small" color="info" variant="outlined" />
                        </Box>
                      </Box>
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">Date</Typography>
                          <Typography variant="body2">{new Date(agreement.date).toLocaleDateString()}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">Amount</Typography>
                          <Typography variant="h6" color="primary.main">
                            ${(agreement.amount / 1000000).toFixed(1)}M
                          </Typography>
                        </Grid>
                      </Grid>
                    </Paper>
                  ))}
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFundDetailsOpen(false)}>Close</Button>
          <Button variant="contained" startIcon={<DownloadIcon />}>Export All Data</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}