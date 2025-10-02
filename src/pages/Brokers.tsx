import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Card,
  CardContent,
  Avatar,
  Chip,
  IconButton,
  Tooltip,
  Button,
  TextField,
  InputAdornment,
  Badge
} from '@mui/material';
import {
  BusinessCenter as BusinessCenterIcon,
  Search as SearchIcon,
  Add as AddIcon,
  Business as BusinessIcon,
  TrendingUp as TrendingUpIcon,
  Schedule as ScheduleIcon,
  AttachMoney as MoneyIcon
} from '@mui/icons-material';

// Mock data for brokers - empty for now
const mockBrokers: any[] = [];

const stages = [
  { value: 'all', label: 'All', color: '#000000' },
  { value: 'response-received', label: 'Response Received', color: '#1976d2' },
  { value: 'closing', label: 'Closing', color: '#388e3c' }
];

export default function Brokers() {
  const [searchTerm, setSearchTerm] = useState('');

  const getBrokersForStage = (stageValue: string) => {
    if (stageValue === 'all') {
      return mockBrokers;
    }
    return mockBrokers.filter(broker => broker.stage === stageValue);
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'good': return '#4caf50';
      case 'bad': return '#f44336';
      case 'neutral': return '#ff9800';
      default: return '#9e9e9e';
    }
  };

  const BrokerCard = ({ broker }: { broker: any }) => (
    <Card
      sx={{
        mb: 2,
        transition: 'all 0.3s ease',
        cursor: 'pointer',
        bgcolor: 'white',
        border: '1px solid #d0d0d0',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.1)'
        }
      }}
    >
      <CardContent sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Avatar sx={{ bgcolor: '#000000' }}>
              {broker.name.charAt(0)}
            </Avatar>
            <Box
              sx={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                bgcolor: getSentimentColor(broker.sentiment)
              }}
            />
          </Box>
        </Box>
        
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, color: '#000000' }}>
          {broker.name}
        </Typography>
        
        <Typography variant="body2" sx={{ mb: 2, color: '#000000' }}>
          {broker.type}
        </Typography>
        
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#000000' }}>
            ${((broker.value || 0) / 1000000).toFixed(1)}M
          </Typography>
          <Typography variant="caption" sx={{ color: '#000000' }}>
            Brokerage Value
          </Typography>
        </Box>
        
        <Box sx={{ mb: 2 }}>
          <Typography variant="caption" sx={{ color: '#000000' }}>
            Lead Partner
          </Typography>
          <Typography variant="body2" sx={{ color: '#000000' }}>
            {broker.leadPartner}
          </Typography>
        </Box>
        
        <Box>
          <Typography variant="caption" sx={{ color: '#000000' }}>
            Next Step
          </Typography>
          <Typography variant="body2" sx={{ color: '#000000' }}>
            {broker.nextStep}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ bgcolor: '#f8f9fa', minHeight: '100vh' }}>
      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: 2,
        bgcolor: 'black',
        color: 'white',
        p: 1.5,
        borderRadius: 0
      }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 600, color: 'white' }}>
            Brokers Pipeline
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          sx={{
            bgcolor: 'white',
            color: 'black',
            '&:hover': {
              bgcolor: 'rgba(255,255,255,0.9)'
            }
          }}
        >
          New Broker
        </Button>
      </Box>

      {/* Search Bar */}
      <Box sx={{ mb: 3, px: 3 }}>
        <TextField
          placeholder="Search brokers..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          fullWidth
          sx={{
            '& .MuiOutlinedInput-root': {
              bgcolor: '#ffffff',
              border: '2px solid #d0d0d0',
              borderRadius: 2,
              '&:hover': {
                borderColor: '#000000',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                bgcolor: '#ffffff'
              },
              '&.Mui-focused': {
                borderColor: '#000000',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                bgcolor: '#ffffff'
              }
            },
            '& .MuiInputBase-input': {
              color: '#000000',
              fontWeight: 500
            }
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: '#666666' }} />
              </InputAdornment>
            )
          }}
        />
      </Box>

      {/* Pipeline Columns */}
      <Box sx={{ 
        display: 'flex', 
        gap: 1.5, 
        pb: 2, 
        minHeight: '60vh', 
        px: 3,
        width: '100%',
        overflowX: 'hidden',
        bgcolor: '#f8f9fa'
      }}>
        {stages.map((stage) => {
          const stageBrokers = getBrokersForStage(stage.value).filter(broker => 
            searchTerm === '' || broker.name.toLowerCase().includes(searchTerm.toLowerCase())
          );
          const totalValue = stageBrokers.reduce((sum, broker) => sum + (broker.value || 0), 0);
          
          return (
            <Paper
              key={stage.value}
              sx={{
                flex: 1,
                minWidth: 0,
                maxWidth: '33.33%',
                p: 1.5,
                borderRadius: 2,
                border: '1px solid #d0d0d0',
                bgcolor: '#f5f5f5',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}
            >
              {/* Stage Header */}
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#333333' }}>
                    {stage.label}
                  </Typography>
                  <Chip
                    label={`${stageBrokers.length} broker${stageBrokers.length !== 1 ? 's' : ''}`}
                    size="small"
                    sx={{
                      bgcolor: '#333333',
                      color: 'white',
                      fontSize: '0.75rem'
                    }}
                  />
                </Box>
                <Typography variant="body2" sx={{ color: '#666666' }}>
                  ${(totalValue / 1000000).toFixed(1)}M total value
                </Typography>
              </Box>

              {/* Stage Brokers */}
              <Box sx={{ minHeight: 400 }}>
                {stageBrokers.length === 0 ? (
                  <Box sx={{ 
                    textAlign: 'center', 
                    py: 8,
                    border: '2px dashed',
                    borderColor: 'divider',
                    borderRadius: 2,
                    bgcolor: 'background.default'
                  }}>
                    <BusinessCenterIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="body2" color="text.secondary">
                      No brokers in this stage
                    </Typography>
                  </Box>
                ) : (
                  stageBrokers.map((broker) => (
                    <BrokerCard key={broker.id} broker={broker} />
                  ))
                )}
              </Box>
            </Paper>
          );
        })}
      </Box>
    </Box>
  );
}
