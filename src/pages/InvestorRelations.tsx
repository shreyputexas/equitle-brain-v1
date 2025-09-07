import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  MenuItem as SelectMenuItem
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
  ArrowForward as ArrowForwardIcon
} from '@mui/icons-material';
import { PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

const fundPerformance = [
  { quarter: 'Q1 2023', value: 100, returns: 5.2 },
  { quarter: 'Q2 2023', value: 105, returns: 7.8 },
  { quarter: 'Q3 2023', value: 113, returns: 6.4 },
  { quarter: 'Q4 2023', value: 120, returns: 9.1 },
  { quarter: 'Q1 2024', value: 131, returns: 8.3 }
];

const investors = [
  { 
    id: 1, 
    name: 'Goldman Sachs', 
    type: 'Institutional', 
    commitment: 50000000, 
    called: 35000000, 
    status: 'active',
    entities: [
      { 
        id: 1, 
        name: 'Goldman Sachs Asset Management', 
        type: 'Direct Investment', 
        investmentType: 'Corporation',
        commitment: 30000000, 
        called: 21000000,
        documents: [
          { id: 1, name: 'Subscription Agreement', type: 'Legal', date: '2023-01-15', size: '2.3 MB', status: 'Signed' },
          { id: 2, name: 'Side Letter - Co-Investment Rights', type: 'Legal', date: '2023-01-20', size: '1.8 MB', status: 'Signed' },
          { id: 3, name: 'KYC Documentation', type: 'Compliance', date: '2023-01-10', size: '5.2 MB', status: 'Approved' },
          { id: 4, name: 'Capital Call Notice #1', type: 'Administrative', date: '2023-03-15', size: '0.5 MB', status: 'Sent' }
        ],
        fundInvestments: [
          { fundName: 'Equitle Fund I', amount: 20000000, percentage: 66.7, vintage: '2023', fundId: 'fund-1' },
          { fundName: 'Equitle Growth Fund', amount: 10000000, percentage: 33.3, vintage: '2024', fundId: 'fund-2' }
        ]
      },
      { 
        id: 2, 
        name: 'GS Private Wealth Solutions', 
        type: 'Client Account', 
        investmentType: 'LLC',
        commitment: 20000000, 
        called: 14000000,
        documents: [
          { id: 5, name: 'Subscription Agreement', type: 'Legal', date: '2023-02-01', size: '2.1 MB', status: 'Signed' },
          { id: 6, name: 'Operating Agreement', type: 'Legal', date: '2023-01-25', size: '3.4 MB', status: 'Signed' },
          { id: 7, name: 'KYC Documentation', type: 'Compliance', date: '2023-01-28', size: '4.8 MB', status: 'Approved' },
          { id: 8, name: 'Capital Call Notice #1', type: 'Administrative', date: '2023-04-01', size: '0.6 MB', status: 'Sent' }
        ],
        fundInvestments: [
          { fundName: 'Equitle Fund I', amount: 15000000, percentage: 75.0, vintage: '2023', fundId: 'fund-1' },
          { fundName: 'Equitle Growth Fund', amount: 5000000, percentage: 25.0, vintage: '2024', fundId: 'fund-2' }
        ]
      }
    ]
  },
  { 
    id: 2, 
    name: 'JP Morgan Chase', 
    type: 'Institutional', 
    commitment: 40000000, 
    called: 28000000, 
    status: 'active',
    entities: [
      { 
        id: 3, 
        name: 'JPM Private Bank', 
        type: 'Private Banking', 
        investmentType: 'Corporation',
        commitment: 25000000, 
        called: 17500000,
        documents: [
          { id: 9, name: 'Subscription Agreement', type: 'Legal', date: '2023-01-30', size: '2.5 MB', status: 'Signed' },
          { id: 10, name: 'Side Letter - Reporting Rights', type: 'Legal', date: '2023-02-05', size: '1.2 MB', status: 'Signed' },
          { id: 11, name: 'KYC Documentation', type: 'Compliance', date: '2023-01-28', size: '6.1 MB', status: 'Approved' },
          { id: 12, name: 'Capital Call Notice #1', type: 'Administrative', date: '2023-03-20', size: '0.7 MB', status: 'Sent' }
        ],
        fundInvestments: [
          { fundName: 'Equitle Fund I', amount: 18000000, percentage: 72.0, vintage: '2023', fundId: 'fund-1' },
          { fundName: 'Equitle Growth Fund', amount: 7000000, percentage: 28.0, vintage: '2024', fundId: 'fund-2' }
        ]
      },
      { 
        id: 4, 
        name: 'Chase Investment Services', 
        type: 'Investment Services', 
        investmentType: 'Partnership',
        commitment: 15000000, 
        called: 10500000,
        documents: [
          { id: 13, name: 'Subscription Agreement', type: 'Legal', date: '2023-02-10', size: '2.2 MB', status: 'Signed' },
          { id: 14, name: 'Partnership Agreement', type: 'Legal', date: '2023-02-05', size: '4.1 MB', status: 'Signed' },
          { id: 15, name: 'KYC Documentation', type: 'Compliance', date: '2023-02-08', size: '3.9 MB', status: 'Approved' },
          { id: 16, name: 'Capital Call Notice #1', type: 'Administrative', date: '2023-04-10', size: '0.5 MB', status: 'Sent' }
        ],
        fundInvestments: [
          { fundName: 'Equitle Fund I', amount: 10000000, percentage: 66.7, vintage: '2023', fundId: 'fund-1' },
          { fundName: 'Equitle Growth Fund', amount: 5000000, percentage: 33.3, vintage: '2024', fundId: 'fund-2' }
        ]
      }
    ]
  },
  { 
    id: 3, 
    name: 'BlackRock', 
    type: 'Institutional', 
    commitment: 35000000, 
    called: 24500000, 
    status: 'active',
    entities: [
      { 
        id: 5, 
        name: 'BlackRock Alternative Investments', 
        type: 'Direct Investment', 
        investmentType: 'Corporation',
        commitment: 35000000, 
        called: 24500000,
        documents: [
          { id: 17, name: 'Subscription Agreement', type: 'Legal', date: '2023-01-20', size: '2.8 MB', status: 'Signed' },
          { id: 18, name: 'Side Letter - Co-Investment Rights', type: 'Legal', date: '2023-01-25', size: '1.5 MB', status: 'Signed' },
          { id: 19, name: 'KYC Documentation', type: 'Compliance', date: '2023-01-18', size: '7.2 MB', status: 'Approved' },
          { id: 20, name: 'Capital Call Notice #1', type: 'Administrative', date: '2023-03-10', size: '0.8 MB', status: 'Sent' }
        ],
        fundInvestments: [
          { fundName: 'Equitle Fund I', amount: 25000000, percentage: 71.4, vintage: '2023', fundId: 'fund-1' },
          { fundName: 'Equitle Growth Fund', amount: 10000000, percentage: 28.6, vintage: '2024', fundId: 'fund-2' }
        ]
      }
    ]
  },
  { 
    id: 4, 
    name: 'Smith Family Office', 
    type: 'Family Office', 
    commitment: 15000000, 
    called: 10500000, 
    status: 'active',
    entities: [
      { 
        id: 6, 
        name: 'Smith Holdings LLC', 
        type: 'Family LLC', 
        investmentType: 'LLC',
        commitment: 10000000, 
        called: 7000000,
        documents: [
          { id: 21, name: 'Subscription Agreement', type: 'Legal', date: '2023-02-15', size: '1.9 MB', status: 'Signed' },
          { id: 22, name: 'Operating Agreement', type: 'Legal', date: '2023-02-10', size: '2.8 MB', status: 'Signed' },
          { id: 23, name: 'KYC Documentation', type: 'Compliance', date: '2023-02-12', size: '3.5 MB', status: 'Approved' },
          { id: 24, name: 'Capital Call Notice #1', type: 'Administrative', date: '2023-04-15', size: '0.4 MB', status: 'Sent' }
        ],
        fundInvestments: [
          { fundName: 'Equitle Fund I', amount: 6000000, percentage: 60.0, vintage: '2023', fundId: 'fund-1' },
          { fundName: 'Equitle Growth Fund', amount: 4000000, percentage: 40.0, vintage: '2024', fundId: 'fund-2' }
        ]
      },
      { 
        id: 7, 
        name: 'Smith Investment Trust', 
        type: 'Trust', 
        investmentType: 'Trust',
        commitment: 5000000, 
        called: 3500000,
        documents: [
          { id: 25, name: 'Subscription Agreement', type: 'Legal', date: '2023-02-20', size: '1.7 MB', status: 'Signed' },
          { id: 26, name: 'Trust Agreement', type: 'Legal', date: '2023-02-15', size: '3.2 MB', status: 'Signed' },
          { id: 27, name: 'KYC Documentation', type: 'Compliance', date: '2023-02-18', size: '2.9 MB', status: 'Approved' },
          { id: 28, name: 'Capital Call Notice #1', type: 'Administrative', date: '2023-04-20', size: '0.3 MB', status: 'Sent' }
        ],
        fundInvestments: [
          { fundName: 'Equitle Fund I', amount: 3000000, percentage: 60.0, vintage: '2023', fundId: 'fund-1' },
          { fundName: 'Equitle Growth Fund', amount: 2000000, percentage: 40.0, vintage: '2024', fundId: 'fund-2' }
        ]
      }
    ]
  },
  { 
    id: 5, 
    name: 'Tech Ventures LP', 
    type: 'Fund of Funds', 
    commitment: 25000000, 
    called: 17500000, 
    status: 'active',
    entities: [
      { 
        id: 8, 
        name: 'Tech Ventures Main Fund', 
        type: 'Fund of Funds', 
        investmentType: 'Partnership',
        commitment: 15000000, 
        called: 10500000,
        documents: [
          { id: 29, name: 'Subscription Agreement', type: 'Legal', date: '2023-03-01', size: '2.4 MB', status: 'Signed' },
          { id: 30, name: 'Partnership Agreement', type: 'Legal', date: '2023-02-25', size: '4.5 MB', status: 'Signed' },
          { id: 31, name: 'KYC Documentation', type: 'Compliance', date: '2023-02-28', size: '5.8 MB', status: 'Approved' },
          { id: 32, name: 'Capital Call Notice #1', type: 'Administrative', date: '2023-05-01', size: '0.6 MB', status: 'Sent' }
        ],
        fundInvestments: [
          { fundName: 'Equitle Fund I', amount: 10000000, percentage: 66.7, vintage: '2023', fundId: 'fund-1' },
          { fundName: 'Equitle Growth Fund', amount: 5000000, percentage: 33.3, vintage: '2024', fundId: 'fund-2' }
        ]
      },
      { 
        id: 9, 
        name: 'Tech Ventures Co-Investment', 
        type: 'Co-Investment Vehicle', 
        investmentType: 'LLC',
        commitment: 10000000, 
        called: 7000000,
        documents: [
          { id: 33, name: 'Subscription Agreement', type: 'Legal', date: '2023-03-05', size: '2.1 MB', status: 'Signed' },
          { id: 34, name: 'Operating Agreement', type: 'Legal', date: '2023-03-01', size: '3.7 MB', status: 'Signed' },
          { id: 35, name: 'KYC Documentation', type: 'Compliance', date: '2023-03-03', size: '4.2 MB', status: 'Approved' },
          { id: 36, name: 'Capital Call Notice #1', type: 'Administrative', date: '2023-05-05', size: '0.5 MB', status: 'Sent' }
        ],
        fundInvestments: [
          { fundName: 'Equitle Fund I', amount: 6000000, percentage: 60.0, vintage: '2023', fundId: 'fund-1' },
          { fundName: 'Equitle Growth Fund', amount: 4000000, percentage: 40.0, vintage: '2024', fundId: 'fund-2' }
        ]
      }
    ]
  }
];

const recentCommunications = [
  { id: 1, title: 'Q4 2023 Quarterly Report', date: '2024-01-15', type: 'report', recipients: 45 },
  { id: 2, title: 'Portfolio Company Update: TechCorp', date: '2024-01-10', type: 'update', recipients: 45 },
  { id: 3, title: 'Capital Call Notice #8', date: '2024-01-05', type: 'capital_call', recipients: 45 },
  { id: 4, title: 'Annual Meeting Invitation', date: '2023-12-20', type: 'event', recipients: 45 }
];

const upcomingEvents = [
  { id: 1, title: 'Annual LP Meeting', date: '2024-02-15', location: 'New York, NY', attendees: 38 },
  { id: 2, title: 'Q1 2024 Webinar', date: '2024-02-28', location: 'Virtual', attendees: 42 },
  { id: 3, title: 'Portfolio Showcase', date: '2024-03-10', location: 'San Francisco, CA', attendees: 31 }
];

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
        ${(raised / 1000000).toFixed(0)}M called of ${(target / 1000000).toFixed(0)}M committed ({progress.toFixed(1)}%)
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
  
  // Filter states
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [commitmentFilter, setCommitmentFilter] = useState<string>('all');

  // Filter logic
  const filteredInvestors = investors.filter(investor => {
    const matchesType = typeFilter === 'all' || investor.type.toLowerCase().includes(typeFilter.toLowerCase());
    const matchesStatus = statusFilter === 'all' || investor.status === statusFilter;
    const matchesSearch = searchTerm === '' || investor.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCommitment = commitmentFilter === 'all' ||
      (commitmentFilter === 'small' && investor.commitment <= 20000000) ||
      (commitmentFilter === 'medium' && investor.commitment > 20000000 && investor.commitment <= 40000000) ||
      (commitmentFilter === 'large' && investor.commitment > 40000000);
    
    return matchesType && matchesStatus && matchesSearch && matchesCommitment;
  });

  // Calculate metrics based on filtered investors
  const totalCommitment = filteredInvestors.reduce((sum, inv) => sum + inv.commitment, 0);
  const totalCalled = filteredInvestors.reduce((sum, inv) => sum + inv.called, 0);
  const callPercentage = (totalCalled / totalCommitment) * 100;

  const investorTypeDistribution = [
    { name: 'Institutional', value: 60, color: '#6366F1' },
    { name: 'Family Office', value: 20, color: '#EC4899' },
    { name: 'Fund of Funds', value: 15, color: '#10B981' },
    { name: 'Others', value: 5, color: '#F59E0B' }
  ];

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
          <Button startIcon={<EmailIcon />}>
            Send Update
          </Button>
          <Button variant="contained" startIcon={<AddIcon />}>
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
                <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
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
                    bgcolor: 'primary.main'
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
                <Avatar sx={{ bgcolor: 'success.main', mr: 2 }}>
                  <TrendingUpIcon />
                </Avatar>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 600 }}>
                    31.2%
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Net IRR
                  </Typography>
                </Box>
              </Box>
              <Chip
                label="+8.3% QoQ"
                size="small"
                sx={{ bgcolor: 'success.main', color: 'white' }}
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
                  <Avatar key={investor.id} sx={{ width: 24, height: 24, fontSize: 10 }}>
                    {investor.name.split(' ').map(n => n[0]).join('')}
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
                <Avatar sx={{ bgcolor: 'warning.main', mr: 2 }}>
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
                Next: {upcomingEvents[0].date}
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
                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
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
                  stroke="#6366F1"
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
                
                {filteredInvestors.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body1" color="text.secondary">
                      No investors match the current filters
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
                          <TableRow key={investor.id}>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Avatar sx={{ mr: 2, width: 32, height: 32 }}>
                                  {investor.name.split(' ').map(n => n[0]).join('')}
                                </Avatar>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                  {investor.name}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Chip label={investor.type} size="small" variant="outlined" />
                            </TableCell>
                            <TableCell align="right">
                              ${(investor.commitment / 1000000).toFixed(1)}M
                            </TableCell>
                            <TableCell align="right">
                              ${(investor.called / 1000000).toFixed(1)}M
                            </TableCell>
                            <TableCell>
                              <Box sx={{ minWidth: 150 }}>
                                <CapitalProgressBar 
                                  raised={investor.called} 
                                  target={investor.commitment}
                                  height={6}
                                />
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={investor.status}
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
                                {investor.entities.length} entities
                              </Button>
                            </TableCell>
                            <TableCell>
                              <IconButton size="small">
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
              <List sx={{ mt: 2 }}>
                {recentCommunications.map((comm) => (
                  <ListItem key={comm.id}>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'primary.main' }}>
                        {comm.type === 'report' && <DocumentIcon />}
                        {comm.type === 'update' && <EmailIcon />}
                        {comm.type === 'capital_call' && <FundIcon />}
                        {comm.type === 'event' && <EventIcon />}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={comm.title}
                      secondary={`Sent to ${comm.recipients} recipients • ${comm.date}`}
                    />
                    <ListItemSecondaryAction>
                      <Button size="small">View</Button>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            )}

            {tabValue === 2 && (
              <List sx={{ mt: 2 }}>
                {upcomingEvents.map((event) => (
                  <ListItem key={event.id}>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'warning.main' }}>
                        <EventIcon />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={event.title}
                      secondary={`${event.date} • ${event.location} • ${event.attendees} confirmed`}
                    />
                    <ListItemSecondaryAction>
                      <Button size="small">Manage</Button>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
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
              >
                Send LP Update
              </Button>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<DocumentIcon />}
                sx={{ justifyContent: 'flex-start' }}
              >
                Generate Quarterly Report
              </Button>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<FundIcon />}
                sx={{ justifyContent: 'flex-start' }}
              >
                Issue Capital Call
              </Button>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<EventIcon />}
                sx={{ justifyContent: 'flex-start' }}
              >
                Schedule Meeting
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
                  <Typography variant="h6">${(selectedInvestor.commitment / 1000000).toFixed(1)}M</Typography>
                </Grid>
                <Grid item xs={3}>
                  <Typography variant="body2" color="text.secondary">Total Called</Typography>
                  <Typography variant="h6">${(selectedInvestor.called / 1000000).toFixed(1)}M</Typography>
                </Grid>
                <Grid item xs={3}>
                  <Typography variant="body2" color="text.secondary">Number of Entities</Typography>
                  <Typography variant="h6">{selectedInvestor.entities.length}</Typography>
                </Grid>
                <Grid item xs={3}>
                  <Typography variant="body2" color="text.secondary">Funds Invested In</Typography>
                  <Typography variant="h6">
                    {new Set(
                      selectedInvestor.entities.flatMap((entity: any) => 
                        entity.fundInvestments?.map((fund: any) => fund.fundName) || []
                      )
                    ).size}
                  </Typography>
                </Grid>
              </Grid>

              {/* Fund Investment Summary */}
              <Paper sx={{ p: 2, mb: 3, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <FundIcon />
                  Fund Investment Summary
                </Typography>
                <Grid container spacing={2}>
                  {['Equitle Fund I', 'Equitle Growth Fund'].map((fundName) => {
                    const totalAmount = selectedInvestor.entities.reduce((sum: number, entity: any) => {
                      const fundInvestment = entity.fundInvestments?.find((fund: any) => fund.fundName === fundName);
                      return sum + (fundInvestment?.amount || 0);
                    }, 0);
                    const percentage = (totalAmount / selectedInvestor.commitment) * 100;
                    
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
                {selectedInvestor.entities.map((entity: any) => (
                  <React.Fragment key={entity.id}>
                    <ListItem sx={{ flexDirection: 'column', alignItems: 'stretch', py: 2 }}>
                      {/* Entity Header */}
                      <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', mb: 2 }}>
                        <Avatar sx={{ bgcolor: 'secondary.main', mr: 2 }}>
                          <BusinessIcon />
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            {entity.name}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                            <Typography variant="body2" color="text.secondary">
                              {entity.type}
                            </Typography>
                            <Chip 
                              label={entity.investmentType} 
                              size="small" 
                              color={getInvestmentTypeColor(entity.investmentType) as any}
                              variant="outlined"
                            />
                          </Box>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={(entity.called / entity.commitment) * 100}
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
                                <strong>Commitment:</strong> ${(entity.commitment / 1000000).toFixed(1)}M
                              </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <TrendingUpIcon color="success" fontSize="small" />
                              <Typography variant="body2">
                                <strong>Called:</strong> ${(entity.called / 1000000).toFixed(1)}M
                              </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <PieChartIcon color="info" fontSize="small" />
                              <Typography variant="body2">
                                <strong>% Called:</strong> {((entity.called / entity.commitment) * 100).toFixed(1)}%
                              </Typography>
                            </Box>
                          </Box>

                      {/* Fund Investments */}
                      <Box sx={{ bgcolor: 'background.default', borderRadius: 2, p: 2 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                          <FundIcon color="primary" />
                          Fund Investments
                        </Typography>
                        
                        {entity.fundInvestments && entity.fundInvestments.length > 0 ? (
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
                                    bgcolor: 'primary.light',
                                    transform: 'translateY(-2px)',
                                    boxShadow: 2
                                  }
                                }}
                                onClick={() => handleNavigateToFund(fund.fundId, entity.name)}
                              >
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                                  <Box>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'primary.main' }}>
                                      {fund.fundName}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      Vintage: {fund.vintage}
                                    </Typography>
                                  </Box>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Chip 
                                      label={`${fund.percentage}%`} 
                                      size="small" 
                                      color="primary" 
                                      variant="outlined"
                                    />
                                    <OpenInNewIcon fontSize="small" color="primary" />
                                  </Box>
                                </Box>
                                
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <Typography variant="h6" sx={{ fontWeight: 600, color: 'success.main' }}>
                                    ${(fund.amount / 1000000).toFixed(1)}M
                                  </Typography>
                        <LinearProgress
                          variant="determinate"
                                    value={fund.percentage}
                          sx={{ 
                                      width: 100,
                            height: 6,
                            borderRadius: 3,
                                      bgcolor: 'rgba(0,0,0,0.1)',
                            '& .MuiLinearProgress-bar': {
                                        borderRadius: 3,
                                        bgcolor: 'primary.main'
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
                        
                        {entity.documents && entity.documents.length > 0 ? (
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            {entity.documents.map((doc: any) => (
                              <Box 
                                key={doc.id} 
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
                                    bgcolor: `${getDocumentColor(doc.type)}.light`, 
                                    color: `${getDocumentColor(doc.type)}.contrastText`,
                                    mr: 2,
                                    width: 32,
                                    height: 32
                                  }}
                                >
                                  {getDocumentIcon(doc.type)}
                                </Avatar>
                                <Box sx={{ flex: 1 }}>
                                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    {doc.name}
                                  </Typography>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 0.5 }}>
                                    <Chip 
                                      label={doc.type} 
                                      size="small" 
                                      color={getDocumentColor(doc.type) as any}
                                      variant="outlined"
                                    />
                                    <Typography variant="caption" color="text.secondary">
                                      {doc.date}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      {doc.size}
                                    </Typography>
                                  </Box>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Chip 
                                    label={doc.status} 
                                    size="small" 
                                    color={doc.status === 'Signed' || doc.status === 'Approved' ? 'success' : 'default'}
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
    </Box>
  );
}