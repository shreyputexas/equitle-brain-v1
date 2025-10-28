import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Chip,
  IconButton,
  Button,
  Tooltip
} from '@mui/material';
import {
  TrendingUp,
  Phone,
  AccessTime,
  Percent,
  SentimentVerySatisfied,
  SentimentNeutral,
  SentimentVeryDissatisfied,
  Refresh,
  GetApp
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend
} from 'recharts';
import { getApiUrl } from '../config/api';

interface CallAnalytics {
  totalCalls: number;
  successfulCalls: number;
  successRate: number;
  averageDuration: number;
  totalDuration: number;
  callsByStatus: Record<string, number>;
  callsByOutcome: Record<string, number>;
  sentimentDistribution: Record<string, number>;
  voiceProfilePerformance: Array<{
    voiceId: string;
    voiceName: string;
    totalCalls: number;
    successRate: number;
    avgDuration: number;
    avgSentiment: number;
  }>;
  trendsData: Array<{
    date: string;
    totalCalls: number;
    successfulCalls: number;
    avgDuration: number;
  }>;
  keyMetrics: {
    bestPerformingVoice?: string;
    avgCallsPerDay: number;
    peakCallingHour?: number;
    mostCommonOutcome: string;
  };
}

interface VoiceCallAnalyticsProps {
  dateRange?: { start: Date; end: Date };
  onDateRangeChange?: (range: { start: Date; end: Date }) => void;
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#f97316'];

const VoiceCallAnalytics: React.FC<VoiceCallAnalyticsProps> = ({ dateRange }) => {
  const [analytics, setAnalytics] = useState<CallAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      let url = getApiUrl('voice-agent/analytics/dashboard');
      if (dateRange) {
        const params = new URLSearchParams({
          startDate: dateRange.start.toISOString(),
          endDate: dateRange.end.toISOString()
        });
        url += `?${params}`;
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }

      const data = await response.json();
      setAnalytics(data.analytics);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const triggerBatchAnalysis = async () => {
    try {
      setIsAnalyzing(true);
      const response = await fetch(getApiUrl('voice-agent/analytics/batch-analyze'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ limit: 50 })
      });

      if (response.ok) {
        // Refresh analytics after a delay
        setTimeout(() => {
          fetchAnalytics();
          setIsAnalyzing(false);
        }, 2000);
      }
    } catch (error) {
      console.error('Error triggering batch analysis:', error);
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  const formatPercent = (value: number) => `${value.toFixed(1)}%`;

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return <SentimentVerySatisfied sx={{ color: '#10b981' }} />;
      case 'negative': return <SentimentVeryDissatisfied sx={{ color: '#ef4444' }} />;
      default: return <SentimentNeutral sx={{ color: '#6b7280' }} />;
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
        <Button onClick={fetchAnalytics} sx={{ ml: 2 }}>
          Retry
        </Button>
      </Alert>
    );
  }

  if (!analytics) {
    return (
      <Alert severity="info">
        No analytics data available
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: '#1e293b' }}>
          Voice Call Analytics
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Refresh Analytics">
            <IconButton onClick={fetchAnalytics} disabled={loading}>
              <Refresh />
            </IconButton>
          </Tooltip>
          <Tooltip title="Analyze Recent Calls">
            <Button
              variant="outlined"
              onClick={triggerBatchAnalysis}
              disabled={isAnalyzing}
              startIcon={isAnalyzing ? <CircularProgress size={16} /> : <GetApp />}
            >
              {isAnalyzing ? 'Analyzing...' : 'Analyze Calls'}
            </Button>
          </Tooltip>
        </Box>
      </Box>

      {/* Key Metrics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h3" sx={{ color: 'white', fontWeight: 700 }}>
                    {analytics.totalCalls}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                    Total Calls
                  </Typography>
                </Box>
                <Phone sx={{ color: 'white', fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h3" sx={{ color: 'white', fontWeight: 700 }}>
                    {formatPercent(analytics.successRate)}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                    Success Rate
                  </Typography>
                </Box>
                <TrendingUp sx={{ color: 'white', fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h3" sx={{ color: 'white', fontWeight: 700 }}>
                    {formatDuration(analytics.averageDuration)}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                    Avg Duration
                  </Typography>
                </Box>
                <AccessTime sx={{ color: 'white', fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h3" sx={{ color: 'white', fontWeight: 700 }}>
                    {analytics.keyMetrics.avgCallsPerDay.toFixed(1)}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                    Calls/Day
                  </Typography>
                </Box>
                <Percent sx={{ color: 'white', fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts Section */}
      <Grid container spacing={3}>
        {/* Call Trends Chart */}
        <Grid item xs={12} lg={8}>
          <Paper sx={{ p: 3, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
              Call Trends Over Time
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={analytics.trendsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="totalCalls"
                  stackId="1"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.6}
                  name="Total Calls"
                />
                <Area
                  type="monotone"
                  dataKey="successfulCalls"
                  stackId="2"
                  stroke="#10b981"
                  fill="#10b981"
                  fillOpacity={0.8}
                  name="Successful Calls"
                />
              </AreaChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Call Status Distribution */}
        <Grid item xs={12} lg={4}>
          <Paper sx={{ p: 3, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
              Call Status Distribution
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={Object.entries(analytics.callsByStatus).map(([status, count]) => ({
                    name: status.charAt(0).toUpperCase() + status.slice(1),
                    value: count
                  }))}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {Object.entries(analytics.callsByStatus).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Average Duration by Day */}
        <Grid item xs={12} lg={6}>
          <Paper sx={{ p: 3, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
              Average Call Duration
            </Typography>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={analytics.trendsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}
                  formatter={(value) => [formatDuration(value as number), 'Duration']}
                />
                <Bar dataKey="avgDuration" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Key Insights */}
        <Grid item xs={12} lg={6}>
          <Paper sx={{ p: 3, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
              Key Insights
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Most Common Outcome
                </Typography>
                <Chip
                  label={analytics.keyMetrics.mostCommonOutcome}
                  color="primary"
                  size="small"
                />
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Total Talk Time
                </Typography>
                <Typography variant="body1" fontWeight={600}>
                  {formatDuration(analytics.totalDuration)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Successful Calls
                </Typography>
                <Typography variant="body1" fontWeight={600} color="#10b981">
                  {analytics.successfulCalls} / {analytics.totalCalls}
                </Typography>
              </Box>
              {analytics.keyMetrics.bestPerformingVoice && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    Best Voice Profile
                  </Typography>
                  <Chip
                    label={analytics.keyMetrics.bestPerformingVoice}
                    color="success"
                    size="small"
                  />
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default VoiceCallAnalytics;