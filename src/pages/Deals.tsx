import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  InputAdornment,
  Tabs,
  Tab,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  AvatarGroup,
  Tooltip,
  LinearProgress,
  Grid,
  Card,
  CardContent,
  CardActions,
  Divider
} from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import {
  Add as AddIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  MoreVert as MoreVertIcon,
  AttachMoney as MoneyIcon,
  TrendingUp as TrendingUpIcon,
  Schedule as ScheduleIcon,
  Business as BusinessIcon,
  ViewKanban as KanbanIcon,
  ViewList as ListView
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

interface Deal {
  id: string;
  company: string;
  sector: string;
  stage: string;
  value: number;
  probability: number;
  leadPartner: string;
  team: string[];
  lastActivity: Date;
  nextStep: string;
  status: 'active' | 'on-hold' | 'closed-won' | 'closed-lost';
}

const mockDeals: Deal[] = [
  {
    id: '1',
    company: 'TechCorp Inc.',
    sector: 'Technology',
    stage: 'Due Diligence',
    value: 12500000,
    probability: 65,
    leadPartner: 'John Smith',
    team: ['Alice Johnson', 'Bob Williams'],
    lastActivity: new Date('2024-01-15'),
    nextStep: 'Management meeting scheduled',
    status: 'active'
  },
  {
    id: '2',
    company: 'HealthTech Solutions',
    sector: 'Healthcare',
    stage: 'Term Sheet',
    value: 8200000,
    probability: 40,
    leadPartner: 'Sarah Davis',
    team: ['Charlie Brown', 'Diana Prince'],
    lastActivity: new Date('2024-01-14'),
    nextStep: 'Awaiting counter-proposal',
    status: 'active'
  },
  {
    id: '3',
    company: 'FinanceAI',
    sector: 'Fintech',
    stage: 'Closing',
    value: 15000000,
    probability: 85,
    leadPartner: 'Michael Chen',
    team: ['Eve Adams', 'Frank Miller'],
    lastActivity: new Date('2024-01-16'),
    nextStep: 'Final documentation',
    status: 'active'
  },
  {
    id: '4',
    company: 'GreenEnergy Co.',
    sector: 'CleanTech',
    stage: 'Initial Review',
    value: 6700000,
    probability: 20,
    leadPartner: 'Lisa Wang',
    team: ['George Wilson'],
    lastActivity: new Date('2024-01-10'),
    nextStep: 'Initial pitch review',
    status: 'on-hold'
  }
];

const stages = ['Initial Review', 'Due Diligence', 'Term Sheet', 'Closing', 'Closed'];
const stageColors: Record<string, string> = {
  'Initial Review': '#6B7280',
  'Due Diligence': '#3B82F6',
  'Term Sheet': '#F59E0B',
  'Closing': '#10B981',
  'Closed': '#6366F1'
};

export default function Deals() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedDeal, setSelectedDeal] = useState<string | null>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, dealId: string) => {
    setAnchorEl(event.currentTarget);
    setSelectedDeal(dealId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedDeal(null);
  };

  const columns: GridColDef[] = [
    {
      field: 'company',
      headerName: 'Company',
      width: 200,
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Avatar sx={{ width: 32, height: 32, mr: 2, bgcolor: 'primary.main' }}>
            {params.value.charAt(0)}
          </Avatar>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {params.value}
          </Typography>
        </Box>
      )
    },
    {
      field: 'sector',
      headerName: 'Sector',
      width: 130,
      renderCell: (params: GridRenderCellParams) => (
        <Chip label={params.value} size="small" variant="outlined" />
      )
    },
    {
      field: 'stage',
      headerName: 'Stage',
      width: 140,
      renderCell: (params: GridRenderCellParams) => (
        <Chip
          label={params.value}
          size="small"
          sx={{
            bgcolor: `${stageColors[params.value]}20`,
            color: stageColors[params.value],
            border: `1px solid ${stageColors[params.value]}`
          }}
        />
      )
    },
    {
      field: 'value',
      headerName: 'Value',
      width: 130,
      renderCell: (params: GridRenderCellParams) => (
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          ${(params.value / 1000000).toFixed(1)}M
        </Typography>
      )
    },
    {
      field: 'probability',
      headerName: 'Probability',
      width: 130,
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ width: '100%' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="caption">{params.value}%</Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={params.value}
            sx={{
              height: 4,
              borderRadius: 2,
              bgcolor: 'rgba(255,255,255,0.05)',
              '& .MuiLinearProgress-bar': {
                borderRadius: 2,
                bgcolor: params.value > 60 ? 'success.main' : params.value > 30 ? 'warning.main' : 'error.main'
              }
            }}
          />
        </Box>
      )
    },
    {
      field: 'team',
      headerName: 'Team',
      width: 150,
      renderCell: (params: GridRenderCellParams) => (
        <AvatarGroup max={3} sx={{ '& .MuiAvatar-root': { width: 28, height: 28, fontSize: 12 } }}>
          <Avatar>{params.row.leadPartner.split(' ').map((n: string) => n[0]).join('')}</Avatar>
          {params.value.map((member: string, index: number) => (
            <Avatar key={index}>{member.split(' ').map((n: string) => n[0]).join('')}</Avatar>
          ))}
        </AvatarGroup>
      )
    },
    {
      field: 'lastActivity',
      headerName: 'Last Activity',
      width: 130,
      renderCell: (params: GridRenderCellParams) => (
        <Typography variant="caption" color="text.secondary">
          {new Date(params.value).toLocaleDateString()}
        </Typography>
      )
    },
    {
      field: 'actions',
      headerName: '',
      width: 60,
      renderCell: (params: GridRenderCellParams) => (
        <IconButton
          size="small"
          onClick={(e) => handleMenuOpen(e, params.row.id)}
        >
          <MoreVertIcon fontSize="small" />
        </IconButton>
      )
    }
  ];

  const filteredDeals = mockDeals.filter(deal => {
    if (activeTab === 1) return deal.status === 'active';
    if (activeTab === 2) return deal.stage === 'Due Diligence';
    if (activeTab === 3) return deal.status === 'closed-won';
    return true;
  });

  const DealCard = ({ deal }: { deal: Deal }) => (
    <Card
      sx={{
        height: '100%',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 12px 24px rgba(0,0,0,0.2)'
        }
      }}
      onClick={() => navigate(`/deals/${deal.id}`)}
    >
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Avatar sx={{ bgcolor: 'primary.main' }}>
            {deal.company.charAt(0)}
          </Avatar>
          <Chip
            label={deal.stage}
            size="small"
            sx={{
              bgcolor: `${stageColors[deal.stage]}20`,
              color: stageColors[deal.stage],
              border: `1px solid ${stageColors[deal.stage]}`
            }}
          />
        </Box>
        
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
          {deal.company}
        </Typography>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {deal.sector}
        </Typography>
        
        <Box sx={{ mb: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            ${(deal.value / 1000000).toFixed(1)}M
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Deal Value
          </Typography>
        </Box>
        
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="caption">Probability</Typography>
            <Typography variant="caption">{deal.probability}%</Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={deal.probability}
            sx={{
              height: 6,
              borderRadius: 3,
              bgcolor: 'rgba(255,255,255,0.05)',
              '& .MuiLinearProgress-bar': {
                borderRadius: 3,
                bgcolor: deal.probability > 60 ? 'success.main' : deal.probability > 30 ? 'warning.main' : 'error.main'
              }
            }}
          />
        </Box>
        
        <Box sx={{ mb: 2 }}>
          <Typography variant="caption" color="text.secondary">
            Lead Partner
          </Typography>
          <Typography variant="body2">
            {deal.leadPartner}
          </Typography>
        </Box>
        
        <Divider sx={{ my: 2 }} />
        
        <Box>
          <Typography variant="caption" color="text.secondary">
            Next Step
          </Typography>
          <Typography variant="body2">
            {deal.nextStep}
          </Typography>
        </Box>
      </CardContent>
      
      <CardActions sx={{ px: 2, pb: 2 }}>
        <AvatarGroup max={3} sx={{ flexGrow: 1, '& .MuiAvatar-root': { width: 24, height: 24, fontSize: 10 } }}>
          {deal.team.map((member, index) => (
            <Avatar key={index}>{member.split(' ').map(n => n[0]).join('')}</Avatar>
          ))}
        </AvatarGroup>
        <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleMenuOpen(e, deal.id); }}>
          <MoreVertIcon fontSize="small" />
        </IconButton>
      </CardActions>
    </Card>
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
            Deal Pipeline
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Track and manage all your investment opportunities
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          sx={{
            background: 'linear-gradient(135deg, #6366F1 0%, #EC4899 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #818CF8 0%, #F472B6 100%)'
            }
          }}
        >
          New Deal
        </Button>
      </Box>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                <MoneyIcon />
              </Avatar>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 600 }}>
                  $42.4M
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Total Pipeline Value
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Avatar sx={{ bgcolor: 'success.main', mr: 2 }}>
                <TrendingUpIcon />
              </Avatar>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 600 }}>
                  52%
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Avg. Probability
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Avatar sx={{ bgcolor: 'warning.main', mr: 2 }}>
                <ScheduleIcon />
              </Avatar>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 600 }}>
                  45 days
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Avg. Deal Cycle
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Avatar sx={{ bgcolor: 'info.main', mr: 2 }}>
                <BusinessIcon />
              </Avatar>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 600 }}>
                  {mockDeals.length}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Active Deals
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <TextField
            placeholder="Search deals..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ flexGrow: 1, mr: 2 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              )
            }}
          />
          <Button startIcon={<FilterIcon />} sx={{ mr: 2 }}>
            Filters
          </Button>
          <Box sx={{ display: 'flex', border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
            <IconButton
              size="small"
              onClick={() => setViewMode('list')}
              sx={{
                borderRadius: 1,
                bgcolor: viewMode === 'list' ? 'primary.main' : 'transparent',
                color: viewMode === 'list' ? 'white' : 'text.secondary'
              }}
            >
              <ListView />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => setViewMode('grid')}
              sx={{
                borderRadius: 1,
                bgcolor: viewMode === 'grid' ? 'primary.main' : 'transparent',
                color: viewMode === 'grid' ? 'white' : 'text.secondary'
              }}
            >
              <KanbanIcon />
            </IconButton>
          </Box>
        </Box>

        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          sx={{ mb: 3, borderBottom: '1px solid', borderColor: 'divider' }}
        >
          <Tab label={`All Deals (${mockDeals.length})`} />
          <Tab label={`Active (${mockDeals.filter(d => d.status === 'active').length})`} />
          <Tab label="Due Diligence (2)" />
          <Tab label="Closed Won (0)" />
        </Tabs>

        {viewMode === 'list' ? (
          <DataGrid
            rows={filteredDeals}
            columns={columns}
            initialState={{
              pagination: {
                paginationModel: { page: 0, pageSize: 10 }
              }
            }}
            pageSizeOptions={[10, 25, 50]}
            checkboxSelection
            disableRowSelectionOnClick
            onRowClick={(params) => navigate(`/deals/${params.row.id}`)}
            sx={{
              border: 'none',
              '& .MuiDataGrid-cell': {
                borderColor: 'divider'
              },
              '& .MuiDataGrid-row': {
                cursor: 'pointer',
                '&:hover': {
                  bgcolor: 'action.hover'
                }
              }
            }}
          />
        ) : (
          <Grid container spacing={3}>
            {filteredDeals.map((deal) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={deal.id}>
                <DealCard deal={deal} />
              </Grid>
            ))}
          </Grid>
        )}
      </Paper>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => { navigate(`/deals/${selectedDeal}`); handleMenuClose(); }}>
          View Details
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>Edit Deal</MenuItem>
        <MenuItem onClick={handleMenuClose}>Add Activity</MenuItem>
        <MenuItem onClick={handleMenuClose}>Generate Report</MenuItem>
        <Divider />
        <MenuItem onClick={handleMenuClose}>Archive Deal</MenuItem>
      </Menu>
    </Box>
  );
}