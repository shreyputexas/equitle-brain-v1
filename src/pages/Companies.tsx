import React from 'react';
import { Box, Typography, Paper, Grid, Card, CardContent, Avatar, Chip, Button } from '@mui/material';
import { Business as BusinessIcon, Add as AddIcon } from '@mui/icons-material';

export default function Companies() {
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
            Portfolio Companies
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage and track your portfolio company information
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />}>
          Add Company
        </Button>
      </Box>

      <Grid container spacing={3}>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Grid item xs={12} md={6} lg={4} key={i}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                    <BusinessIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h6">Company {i}</Typography>
                    <Chip label="Technology" size="small" />
                  </Box>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Leading provider of enterprise solutions
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}