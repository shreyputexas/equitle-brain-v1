import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Paper,
  LinearProgress,
  Chip,
  IconButton,
  Avatar,
  AvatarGroup,
  CircularProgress
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AttachMoney as MoneyIcon,
  Business as BusinessIcon,
  People as PeopleIcon,
  Assessment as AssessmentIcon,
  ArrowForward as ArrowForwardIcon,
  MoreVert as MoreVertIcon
} from '@mui/icons-material';
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import DashboardApiService, { DashboardData } from '../services/dashboardApi';

export default function Dashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const data = await DashboardApiService.getDashboardData();
        setDashboardData(data);
        setError(null);
      } catch (err: any) {
        console.error('Error fetching dashboard data:', err);
        setError(err.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress size={40} />
      </Box>
    );
  }

  if (error || !dashboardData) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h6" color="error" gutterBottom>
          {error || 'Failed to load dashboard data'}
        </Typography>
        <Button onClick={() => window.location.reload()} variant="contained">
          Retry
        </Button>
      </Box>
    );
  }

  const metrics = [
    {
      title: 'Total Portfolio Value',
      value: dashboardData.metrics.totalPortfolioValue,
      change: dashboardData.metrics.totalPortfolioValueChange,
      icon: <MoneyIcon />,
      trend: 'up',
      color: '#5E5CE6'
    },
    {
      title: 'Active Deals',
      value: dashboardData.metrics.activeDeals.toString(),
      change: `+${dashboardData.metrics.activeDealsChange}`,
      icon: <BusinessIcon />,
      trend: 'up',
      color: '#10B981'
    },
    {
      title: 'Portfolio Companies',
      value: dashboardData.metrics.portfolioCompanies.toString(),
      change: `+${dashboardData.metrics.portfolioCompaniesChange}`,
      icon: <AssessmentIcon />,
      trend: 'up',
      color: '#F59E0B'
    },
    {
      title: 'Total Contacts',
      value: dashboardData.metrics.totalContacts.toString(),
      change: `+${dashboardData.metrics.totalContactsChange}`,
      icon: <PeopleIcon />,
      trend: 'up',
      color: '#3B82F6'
    }
  ];

  return (
    <Box className="fade-in">
      <Box sx={{ mb: 3, p: 3, bgcolor: 'background.paper', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
        <Typography variant="h4" sx={{ fontWeight: 600, mb: 0.5, fontFamily: '"Space Grotesk", sans-serif', color: 'text.primary' }}>
          Welcome back, {dashboardData.userName}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Here's what's happening with your portfolio today.
        </Typography>
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {metrics.map((metric, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card
              className="scale-in"
              sx={{
                background: 'background.paper',
                transition: 'all 0.15s ease',
                cursor: 'pointer',
                '&:hover': {
                  borderColor: '#D1D5DB'
                }
              }}
            >
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontSize: '0.8125rem' }}>
                      {metric.title}
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700, fontFamily: '"Space Grotesk", sans-serif', fontSize: '1.75rem' }}>
                      {metric.value}
                    </Typography>
                  </Box>
                  <Avatar sx={{ 
                    bgcolor: '#F3F4F6',
                    color: '#000000',
                    width: 40, 
                    height: 40
                  }}>
                    {metric.icon}
                  </Avatar>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  {metric.trend === 'up' ? <TrendingUpIcon sx={{ fontSize: 16, color: 'success.main' }} /> : <TrendingDownIcon sx={{ fontSize: 16, color: 'error.main' }} />}
                  <Typography variant="caption" sx={{ color: metric.trend === 'up' ? 'success.main' : 'error.main', fontWeight: 600 }}>
                    {metric.change}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    from last month
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={2}>
        <Grid item xs={12} md={8}>
          <Paper className="scale-in" sx={{ p: 2.5, height: 400 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, fontFamily: '"Space Grotesk", sans-serif', color: 'text.primary', fontSize: '1.125rem' }}>
                Deal Flow Performance
              </Typography>
              <Button variant="text" size="small" endIcon={<ArrowForwardIcon />}>
                View All
              </Button>
            </Box>
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={dashboardData.dealFlow}>
                <defs>
                  <linearGradient id="colorDeals" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#000000" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#000000" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#666666" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#666666" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
                <XAxis dataKey="month" stroke="#666666" />
                <YAxis stroke="#666666" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid rgba(0,0,0,0.1)',
                    borderRadius: 4
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="deals"
                  stroke="#000000"
                  fillOpacity={1}
                  fill="url(#colorDeals)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#666666"
                  fillOpacity={1}
                  fill="url(#colorValue)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper className="scale-in" sx={{ p: 2.5, height: 400 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, fontFamily: '"Space Grotesk", sans-serif', color: 'text.primary', fontSize: '1.125rem' }}>
              Portfolio Distribution
            </Typography>
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie
                  data={dashboardData.portfolioDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {dashboardData.portfolioDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid rgba(0,0,0,0.1)',
                    borderRadius: 4
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <Box sx={{ mt: 2 }}>
              {dashboardData.portfolioDistribution.map((item, index) => (
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
        </Grid>

        <Grid item xs={12}>
          <Paper className="slide-up" sx={{ p: 2.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, fontFamily: '"Space Grotesk", sans-serif', color: 'text.primary', fontSize: '1.125rem' }}>
                Recent Deals
              </Typography>
              <Button variant="contained" size="small" startIcon={<BusinessIcon />}>
                New Deal
              </Button>
            </Box>
            <Box sx={{ overflow: 'auto' }}>
              {dashboardData.recentDeals.map((deal) => (
                <Box
                  key={deal.id}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    p: 2,
                    mb: 1.5,
                    bgcolor: 'background.paper',
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1.5,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    '&:hover': {
                      bgcolor: '#F9FAFB',
                      borderColor: '#D1D5DB'
                    }
                  }}
                >
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.25 }}>
                      {deal.company}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {deal.stage}
                    </Typography>
                  </Box>
                  <Typography variant="h6" sx={{ mx: 3, fontWeight: 700, fontFamily: '"Space Grotesk", sans-serif', fontSize: '1.125rem' }}>
                    {deal.value}
                  </Typography>
                  <Box sx={{ width: 180, mr: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6875rem' }}>
                        Progress
                      </Typography>
                      <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.6875rem' }}>
                        {deal.progress}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={deal.progress}
                      sx={{
                        height: 6,
                        borderRadius: 3
                      }}
                    />
                  </Box>
                  <Chip
                    label={deal.status}
                    size="small"
                    sx={{
                      bgcolor:
                        deal.status === 'active'
                          ? '#DCFCE7'
                          : deal.status === 'pending'
                          ? '#FEF3C7'
                          : '#DBEAFE',
                      color:
                        deal.status === 'active'
                          ? '#166534'
                          : deal.status === 'pending'
                          ? '#92400E'
                          : '#1E40AF',
                      textTransform: 'capitalize',
                      fontWeight: 500
                    }}
                  />
                  <IconButton size="small" sx={{ ml: 1 }}>
                    <MoreVertIcon fontSize="small" />
                  </IconButton>
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}