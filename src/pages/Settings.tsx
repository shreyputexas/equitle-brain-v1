import React from 'react';
import { Box, Typography, Paper, List, ListItem, ListItemText, Switch } from '@mui/material';

export default function Settings() {
  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 600, mb: 4 }}>
        Settings
      </Typography>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Preferences
        </Typography>
        <List>
          <ListItem>
            <ListItemText primary="Email Notifications" />
            <Switch defaultChecked />
          </ListItem>
          <ListItem>
            <ListItemText primary="Dark Mode" />
            <Switch defaultChecked />
          </ListItem>
          <ListItem>
            <ListItemText primary="Auto-save" />
            <Switch defaultChecked />
          </ListItem>
        </List>
      </Paper>
    </Box>
  );
}