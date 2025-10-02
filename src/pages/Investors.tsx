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
  People as PeopleIcon,
  Search as SearchIcon,
  Add as AddIcon,
  Business as BusinessIcon,
  TrendingUp as TrendingUpIcon,
  Schedule as ScheduleIcon,
  AttachMoney as MoneyIcon
} from '@mui/icons-material';

// Mock data for investors - empty for now
const mockInvestors: any[] = [];

const stages = [
  { value: 'all', label: 'All', color: '#000000' },
  { value: 'response-received', label: 'Response Received', color: '#1976d2' },
  { value: 'closing', label: 'Closing', color: '#388e3c' }
];

export default function Investors() {
  const [searchTerm, setSearchTerm] = useState('');

  const getInvestorsForStage = (stageValue: string) => {
    if (stageValue === 'all') {
      return mockInvestors;
    }
    return mockInvestors.filter(investor => investor.stage === stageValue);
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'good': return '#4caf50';
      case 'bad': return '#f44336';
      case 'neutral': return '#ff9800';
      default: return '#9e9e9e';
    }
  };

  const InvestorCard = ({ investor }: { investor: any }) => (
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
              {investor.name.charAt(0)}
            </Avatar>
            <Box
              sx={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                bgcolor: getSentimentColor(investor.sentiment)
              }}
            />
          </Box>
        </Box>
        
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, color: '#000000' }}>
          {investor.name}
        </Typography>
        
        <Typography variant="body2" sx={{ mb: 2, color: '#000000' }}>
          {investor.type}
        </Typography>
        
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#000000' }}>
            ${((investor.value || 0) / 1000000).toFixed(1)}M
          </Typography>
          <Typography variant="caption" sx={{ color: '#000000' }}>
            Investment Value
          </Typography>
        </Box>
        
        <Box sx={{ mb: 2 }}>
          <Typography variant="caption" sx={{ color: '#000000' }}>
            Lead Partner
          </Typography>
          <Typography variant="body2" sx={{ color: '#000000' }}>
            {investor.leadPartner}
          </Typography>
        </Box>
        
        <Box>
          <Typography variant="caption" sx={{ color: '#000000' }}>
            Next Step
          </Typography>
          <Typography variant="body2" sx={{ color: '#000000' }}>
            {investor.nextStep}
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
            Investors Pipeline
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
          New Investor
        </Button>
      </Box>

      {/* Search Bar */}
      <Box sx={{ mb: 3, px: 3 }}>
        <TextField
          placeholder="Search investors..."
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
          const stageInvestors = getInvestorsForStage(stage.value).filter(investor => 
            searchTerm === '' || investor.name.toLowerCase().includes(searchTerm.toLowerCase())
          );
          const totalValue = stageInvestors.reduce((sum, investor) => sum + (investor.value || 0), 0);
          
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
                    label={`${stageInvestors.length} investor${stageInvestors.length !== 1 ? 's' : ''}`}
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

              {/* Stage Investors */}
              <Box sx={{ minHeight: 400 }}>
                {stageInvestors.length === 0 ? (
                  <Box sx={{ 
                    textAlign: 'center', 
                    py: 8,
                    border: '2px dashed',
                    borderColor: 'divider',
                    borderRadius: 2,
                    bgcolor: 'background.default'
                  }}>
                    <PeopleIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="body2" color="text.secondary">
                      No investors in this stage
                    </Typography>
                  </Box>
                ) : (
                  stageInvestors.map((investor) => (
                    <InvestorCard key={investor.id} investor={investor} />
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
