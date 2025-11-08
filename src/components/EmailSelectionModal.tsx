import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Checkbox,
  Typography,
  CircularProgress,
  Box,
  Alert
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { emailsApi } from '../services/emailsApi';

interface EmailSelectionModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (threadIds: string[], subjects: string[]) => void;
  selectedThreadIds?: string[];
  multiSelect?: boolean;
}

export default function EmailSelectionModal({
  open,
  onClose,
  onSelect,
  selectedThreadIds = [],
  multiSelect = false
}: EmailSelectionModalProps) {
  const [emails, setEmails] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>(selectedThreadIds);

  useEffect(() => {
    if (open) {
      setSelectedIds(selectedThreadIds);
      fetchEmails();
    }
  }, [open, selectedThreadIds]);

  const fetchEmails = async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedEmails = await emailsApi.getEmails(50);
      setEmails(fetchedEmails);
    } catch (err: any) {
      console.error('Error fetching emails:', err);
      setError(err.message || 'Failed to fetch emails');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (threadId: string, subject: string) => {
    if (!threadId) return;

    if (multiSelect) {
      setSelectedIds(prev => {
        const isSelected = prev.includes(threadId);
        if (isSelected) {
          return prev.filter(id => id !== threadId);
        } else {
          return [...prev, threadId];
        }
      });
    } else {
      setSelectedIds([threadId]);
    }
  };

  const handleConfirm = () => {
    const selectedEmails = emails.filter(email => {
      const threadId = email.thread_id || email.id;
      return selectedIds.includes(threadId);
    });

    const threadIds = selectedEmails.map(email => email.thread_id || email.id);
    const subjects = selectedEmails.map(email => email.email_subject || email.subject || '(No Subject)');

    onSelect(threadIds, subjects);
    onClose();
  };

  const handleCancel = () => {
    setSelectedIds(selectedThreadIds);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleCancel} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">
            {multiSelect ? 'Select Email Threads' : 'Select Email Thread'}
          </Typography>
          <Button onClick={handleCancel} size="small" sx={{ minWidth: 'auto' }}>
            <CloseIcon />
          </Button>
        </Box>
      </DialogTitle>
      <DialogContent>
        {loading && (
          <Box display="flex" justifyContent="center" p={3}>
            <CircularProgress />
          </Box>
        )}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {!loading && !error && emails.length === 0 && (
          <Alert severity="info" sx={{ mb: 2 }}>
            No emails found
          </Alert>
        )}
        {!loading && !error && emails.length > 0 && (
          <List>
            {emails.map((email) => {
              const threadId = email.thread_id || email.id;
              const subject = email.email_subject || email.subject || '(No Subject)';
              const from = email.prospect_email || email.from?.emailAddress?.address || 'Unknown';
              const isSelected = selectedIds.includes(threadId);

              return (
                <ListItem key={email.id || threadId} disablePadding>
                  <ListItemButton
                    onClick={() => handleToggle(threadId, subject)}
                    selected={isSelected}
                  >
                    {multiSelect && (
                      <Checkbox
                        checked={isSelected}
                        edge="start"
                        tabIndex={-1}
                        disableRipple
                      />
                    )}
                    <ListItemText
                      primary={subject}
                      secondary={`From: ${from}`}
                    />
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCancel}>Cancel</Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          disabled={selectedIds.length === 0}
        >
          {multiSelect ? `Select ${selectedIds.length}` : 'Select'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

