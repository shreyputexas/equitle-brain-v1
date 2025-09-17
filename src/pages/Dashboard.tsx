import React from 'react';
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
  AvatarGroup
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

const performanceData = [
  { month: 'Jan', deals: 12, value: 45 },
  { month: 'Feb', deals: 15, value: 52 },
  { month: 'Mar', deals: 18, value: 61 },
  { month: 'Apr', deals: 14, value: 48 },
  { month: 'May', deals: 22, value: 73 },
  { month: 'Jun', deals: 25, value: 82 }
];

const portfolioData = [
  { name: 'Technology', value: 35, color: '#9CA3AF' },
  { name: 'Healthcare', value: 25, color: '#D1D5DB' },
  { name: 'Finance', value: 20, color: '#10B981' },
  { name: 'Energy', value: 12, color: '#F59E0B' },
  { name: 'Others', value: 8, color: '#6B7280' }
];

const recentDeals = [
  { id: 1, company: 'TechCorp Inc.', stage: 'Due Diligence', value: '$12.5M', status: 'active', progress: 65 },
  { id: 2, company: 'HealthTech Solutions', stage: 'Term Sheet', value: '$8.2M', status: 'pending', progress: 40 },
  { id: 3, company: 'FinanceAI', stage: 'Closing', value: '$15.0M', status: 'active', progress: 85 },
  { id: 4, company: 'GreenEnergy Co.', stage: 'Initial Review', value: '$6.7M', status: 'review', progress: 20 }
];

const metrics = [
  { title: 'Total Portfolio Value', value: '$847M', change: '+12.5%', icon: <MoneyIcon />, trend: 'up', color: '#9CA3AF' },
  { title: 'Active Deals', value: '24', change: '+4', icon: <BusinessIcon />, trend: 'up', color: '#10B981' },
  { title: 'Portfolio Companies', value: '67', change: '+2', icon: <AssessmentIcon />, trend: 'up', color: '#F59E0B' },
  { title: 'Total Contacts', value: '1,284', change: '+48', icon: <PeopleIcon />, trend: 'up', color: '#3B82F6' }
];

export default function Dashboard() {
  return (
    <Box className="fade-in">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, fontFamily: '"Space Grotesk", sans-serif' }}>
          Welcome back, John
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1.05rem' }}>
          Here's what's happening with your portfolio today.
        </Typography>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        {metrics.map((metric, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card
              className="scale-in premium-shadow-hover"
              sx={{
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(250, 250, 250, 0.9) 100%)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(94, 92, 230, 0.08)',
                borderRadius: '16px',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  transform: 'translateY(-6px) scale(1.02)',
                  boxShadow: '0 20px 40px rgba(94, 92, 230, 0.12)',
                  border: '1px solid rgba(94, 92, 230, 0.2)'
                }
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Avatar sx={{ 
                    background: `linear-gradient(135deg, ${metric.color} 0%, ${metric.color}dd 100%)`,
                    width: 48, 
                    height: 48,
                    boxShadow: `0 4px 12px ${metric.color}33`
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
          <Paper className="scale-in" sx={{ p: 3.5, height: 400, borderRadius: '16px', border: '1px solid rgba(94, 92, 230, 0.08)' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, fontFamily: '"Space Grotesk", sans-serif' }}>
                Deal Flow Performance
              </Typography>
              <Button variant="text" endIcon={<ArrowForwardIcon />}>
                View Details
              </Button>
            </Box>
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={performanceData}>
                <defs>
                  <linearGradient id="colorDeals" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#9CA3AF" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#9CA3AF" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#D1D5DB" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#D1D5DB" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" stroke="#9CA3AF" />
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
                  dataKey="deals"
                  stroke="#9CA3AF"
                  fillOpacity={1}
                  fill="url(#colorDeals)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#D1D5DB"
                  fillOpacity={1}
                  fill="url(#colorValue)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper className="scale-in" sx={{ p: 3.5, height: 400, borderRadius: '16px', border: '1px solid rgba(94, 92, 230, 0.08)' }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, fontFamily: '"Space Grotesk", sans-serif' }}>
              Portfolio Distribution
            </Typography>
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie
                  data={portfolioData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {portfolioData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#111827',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 8
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <Box sx={{ mt: 2 }}>
              {portfolioData.map((item, index) => (
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
          <Paper className="slide-up" sx={{ p: 3.5, borderRadius: '16px', border: '1px solid rgba(94, 92, 230, 0.08)' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, fontFamily: '"Space Grotesk", sans-serif' }}>
                Recent Deals
              </Typography>
              <Button variant="contained" startIcon={<BusinessIcon />}>
                New Deal
              </Button>
            </Box>
            <Box sx={{ overflow: 'auto' }}>
              {recentDeals.map((deal) => (
                <Box
                  key={deal.id}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    p: 2.5,
                    mb: 2,
                    borderRadius: '12px',
                    bgcolor: 'rgba(250, 250, 250, 0.5)',
                    border: '1px solid rgba(94, 92, 230, 0.06)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      borderColor: 'rgba(94, 92, 230, 0.2)',
                      bgcolor: 'rgba(94, 92, 230, 0.02)',
                      transform: 'translateX(8px)',
                      boxShadow: '0 4px 12px rgba(94, 92, 230, 0.08)'
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
                        height: 6,
                        borderRadius: 3,
                        bgcolor: 'rgba(255,255,255,0.05)',
                        '& .MuiLinearProgress-bar': {
                          borderRadius: 4,
                          background: 'linear-gradient(90deg, #9CA3AF 0%, #374151 100%)'
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