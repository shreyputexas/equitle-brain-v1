import React from 'react';
import { Box, Typography, Paper, List, ListItem, ListItemAvatar, Avatar, ListItemText, Button } from '@mui/material';
import { Person as PersonIcon, Add as AddIcon } from '@mui/icons-material';

export default function Contacts() {
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
            Contacts
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage your network of contacts and relationships
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />}>
          Add Contact
        </Button>
      </Box>

      <Paper sx={{ p: 3 }}>
        <List>
          {[1, 2, 3, 4, 5].map((i) => (
            <ListItem key={i}>
              <ListItemAvatar>
                <Avatar>
                  <PersonIcon />
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={`Contact ${i}`}
                secondary="CEO at TechCorp"
              />
            </ListItem>
          ))}
        </List>
      </Paper>
    </Box>
  );
}