import React from 'react';
import { Box, Typography, Paper, Grid, Card, CardContent, Button } from '@mui/material';
import { Assessment as AssessmentIcon, Add as AddIcon } from '@mui/icons-material';

export default function Reports() {
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
            Reports & Analytics
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Generate insights and performance reports
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />}>
          Create Report
        </Button>
      </Box>

      <Grid container spacing={3}>
        {['Quarterly Performance', 'Portfolio Overview', 'Deal Pipeline', 'Investor Update'].map((title, i) => (
          <Grid item xs={12} md={6} key={i}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Comprehensive analysis and insights
                </Typography>
                <Button sx={{ mt: 2 }}>Generate</Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}