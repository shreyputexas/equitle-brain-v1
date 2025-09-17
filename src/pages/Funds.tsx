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
  Clear as ClearIcon
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
    investments: [
      {
        investor: 'Goldman Sachs',
        entities: [
          { name: 'Goldman Sachs Asset Management', amount: 25000000, type: 'Direct' },
          { name: 'GS Private Wealth Solutions', amount: 15000000, type: 'Client Account' }
        ]
      },
      {
        investor: 'Smith Family Office',
        entities: [
          { name: 'Smith Holdings LLC', amount: 10000000, type: 'Family LLC' },
          { name: 'Smith Investment Trust', amount: 5000000, type: 'Trust' }
        ]
      },
      {
        investor: 'JP Morgan Chase',
        entities: [
          { name: 'JPM Private Bank', amount: 20000000, type: 'Private Banking' },
          { name: 'Chase Investment Services', amount: 10000000, type: 'Investment Services' }
        ]
      }
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
                      {investment.entities.map((entity: any, entityIndex: number) => (
                        <ListItem key={entityIndex}>
                          <ListItemAvatar>
                            <Avatar sx={{ width: 24, height: 24, bgcolor: '#9CA3AF' }}>
                              <BusinessIcon fontSize="small" />
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={entity.name}
                            secondary={entity.type}
                          />
                          <ListItemSecondaryAction>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              ${(entity.amount / 1000000).toFixed(1)}M
                            </Typography>
                          </ListItemSecondaryAction>
                        </ListItem>
                      ))}
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
    </Box>
  );
}