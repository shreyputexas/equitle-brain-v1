import React from 'react';
import { Box, Typography, Paper, Avatar, Button, TextField, Grid } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

export default function Profile() {
  const { user } = useAuth();

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 600, mb: 4 }}>
        Profile
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Avatar sx={{ width: 120, height: 120, mx: 'auto', mb: 2, bgcolor: 'primary.main', fontSize: 48 }}>
              {user?.displayName?.charAt(0) || user?.email?.charAt(0) || 'U'}
            </Avatar>
            <Typography variant="h6">{user?.displayName || user?.email || 'User'}</Typography>
            <Typography variant="body2" color="text.secondary">{user?.email}</Typography>
            <Button variant="outlined" sx={{ mt: 2 }}>Change Photo</Button>
          </Paper>
        </Grid>

        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Personal Information</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Name" defaultValue={user?.displayName} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Email" defaultValue={user?.email} />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth label="Firm" defaultValue="" />
              </Grid>
            </Grid>
            <Button variant="contained" sx={{ mt: 3 }}>Save Changes</Button>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}