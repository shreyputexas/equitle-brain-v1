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
      <Box sx={{ mb: 4, p: 3, bgcolor: 'background.paper' }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, fontFamily: '"Space Grotesk", sans-serif', color: 'text.primary' }}>
          Welcome back, {dashboardData.userName}
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1rem' }}>
          Here's what's happening with your portfolio today.
        </Typography>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        {metrics.map((metric, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card
              className="scale-in premium-shadow-hover"
              sx={{
                background: 'background.paper',
                transition: 'all 0.2s ease',
                '&:hover': {
                  transform: 'none',
                  boxShadow: '0 2px 6px rgba(0, 0, 0, 0.15)'
                }
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Avatar sx={{ 
                    background: 'primary.main',
                    width: 48, 
                    height: 48,
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                  }}>
                    {metric.icon}
                  </Avatar>
                  <Chip
                    label={metric.change}
                    size="small"
                    icon={metric.trend === 'up' ? <TrendingUpIcon /> : <TrendingDownIcon />}
                    sx={{
                      bgcolor: metric.trend === 'up' ? 'success.main' : 'error.main',
                      color: 'white',
                      borderRadius: 1,
                      '& .MuiChip-icon': {
                        color: 'white'
                      }
                    }}
                  />
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5, fontFamily: '"Space Grotesk", sans-serif' }}>
                  {metric.value}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                  {metric.title}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper className="scale-in" sx={{ p: 3, height: 400 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, fontFamily: '"Space Grotesk", sans-serif', color: 'text.primary' }}>
                Deal Flow Performance
              </Typography>
              <Button variant="outlined" endIcon={<ArrowForwardIcon />} sx={{ borderRadius: 1 }}>
                View Details
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
          <Paper className="scale-in" sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, fontFamily: '"Space Grotesk", sans-serif', color: 'text.primary' }}>
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
          <Paper className="slide-up" sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, fontFamily: '"Space Grotesk", sans-serif', color: 'text.primary' }}>
                Recent Deals
              </Typography>
              <Button variant="contained" startIcon={<BusinessIcon />} sx={{ borderRadius: 1 }}>
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
                    mb: 2,
                    bgcolor: 'background.paper',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      bgcolor: 'action.hover',
                      transform: 'none',
                      boxShadow: '0 2px 6px rgba(0, 0, 0, 0.1)'
                    }
                  }}
                >
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      {deal.company}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {deal.stage}
                    </Typography>
                  </Box>
                  <Typography variant="h6" sx={{ mx: 3, fontWeight: 600 }}>
                    {deal.value}
                  </Typography>
                  <Box sx={{ width: 200, mr: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        Progress
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {deal.progress}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={deal.progress}
                      sx={{
                        height: 4,
                        borderRadius: 2,
                        bgcolor: 'rgba(0,0,0,0.1)',
                        '& .MuiLinearProgress-bar': {
                          borderRadius: 2,
                          background: '#000000'
                        }
                      }}
                    />
                  </Box>
                  <Chip
                    label={deal.status}
                    size="small"
                    sx={{
                      bgcolor:
                        deal.status === 'active'
                          ? 'success.main'
                          : deal.status === 'pending'
                          ? 'warning.main'
                          : 'info.main',
                      color: 'white',
                      textTransform: 'capitalize'
                    }}
                  />
                  <IconButton sx={{ ml: 2 }}>
                    <MoreVertIcon />
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