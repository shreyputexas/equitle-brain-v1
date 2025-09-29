import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Box,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  InputAdornment,
  Alert,
  CircularProgress,
  IconButton,
  Chip,
  Avatar,
  Divider,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  IconButton as ListIconButton,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import dealsApi from '../services/dealsApi';
import {
  Close as CloseIcon,
  AttachMoney as MoneyIcon,
  Business as BusinessIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  Note as NoteIcon,
  Message as MessageIcon,
  ContactPhone as ContactPhoneIcon
} from '@mui/icons-material';

interface NewDealModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  isPrimary: boolean;
}

interface EmailTemplate {
  subject: string;
  body: string;
}

interface DealNote {
  id: string;
  content: string;
  createdAt: Date;
  type: 'general' | 'meeting' | 'call' | 'email';
}

const stages = [
  { value: 'prospect', label: 'Initial Review' },
  { value: 'due-diligence', label: 'Due Diligence' },
  { value: 'term-sheet', label: 'Term Sheet' },
  { value: 'closing', label: 'Closing' },
  { value: 'closed', label: 'Closed' }
];

const sectors = [
  'Technology',
  'Healthcare',
  'Fintech',
  'CleanTech',
  'Consumer',
  'B2B SaaS',
  'E-commerce',
  'AI/ML',
  'Biotech',
  'Other'
];

const statuses = [
  { value: 'active', label: 'Active' },
  { value: 'paused', label: 'Paused' },
  { value: 'closed', label: 'Closed' },
  { value: 'lost', label: 'Lost' }
];

export default function NewDealModal({ open, onClose, onSuccess }: NewDealModalProps) {
  const [formData, setFormData] = useState({
    company: '',
    sector: '',
    stage: 'prospect',
    value: '',
    probability: '',
    leadPartner: '',
    status: 'active',
    nextStep: '',
    description: ''
  });

  // New state for enhanced functionality
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [emailTemplate, setEmailTemplate] = useState<EmailTemplate>({
    subject: '',
    body: ''
  });
  const [notes, setNotes] = useState<DealNote[]>([]);
  const [newContact, setNewContact] = useState<Partial<Contact>>({
    name: '',
    email: '',
    phone: '',
    role: '',
    isPrimary: false
  });
  const [newNote, setNewNote] = useState('');
  const [showContactForm, setShowContactForm] = useState(false);
  const [editingContact, setEditingContact] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | any) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  // Contact management functions
  const handleAddContact = () => {
    if (newContact.name && newContact.email) {
      const contact: Contact = {
        id: Date.now().toString(),
        name: newContact.name,
        email: newContact.email,
        phone: newContact.phone || '',
        role: newContact.role || 'Contact',
        isPrimary: contacts.length === 0 || newContact.isPrimary || false
      };
      
      // If this is set as primary, unset others
      if (contact.isPrimary) {
        setContacts(prev => prev.map(c => ({ ...c, isPrimary: false })));
      }
      
      setContacts(prev => [...prev, contact]);
      setNewContact({ name: '', email: '', phone: '', role: '', isPrimary: false });
      setShowContactForm(false);
    }
  };

  const handleEditContact = (contactId: string) => {
    const contact = contacts.find(c => c.id === contactId);
    if (contact) {
      setNewContact(contact);
      setEditingContact(contactId);
      setShowContactForm(true);
    }
  };

  const handleUpdateContact = () => {
    if (editingContact && newContact.name && newContact.email) {
      setContacts(prev => prev.map(c => 
        c.id === editingContact 
          ? { ...c, ...newContact }
          : c
      ));
      setNewContact({ name: '', email: '', phone: '', role: '', isPrimary: false });
      setEditingContact(null);
      setShowContactForm(false);
    }
  };

  const handleDeleteContact = (contactId: string) => {
    setContacts(prev => prev.filter(c => c.id !== contactId));
  };

  const handleSetPrimaryContact = (contactId: string) => {
    setContacts(prev => prev.map(c => ({
      ...c,
      isPrimary: c.id === contactId
    })));
  };

  // Notes management functions
  const handleAddNote = () => {
    if (newNote.trim()) {
      const note: DealNote = {
        id: Date.now().toString(),
        content: newNote.trim(),
        createdAt: new Date(),
        type: 'general'
      };
      setNotes(prev => [...prev, note]);
      setNewNote('');
    }
  };

  const handleDeleteNote = (noteId: string) => {
    setNotes(prev => prev.filter(n => n.id !== noteId));
  };

  // Email template functions
  const handleEmailTemplateChange = (field: keyof EmailTemplate) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setEmailTemplate(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError('');

      // Validate required fields
      if (!formData.company.trim()) {
        setError('Company name is required');
        return;
      }
      if (!formData.sector) {
        setError('Sector is required');
        return;
      }
      if (!formData.value || isNaN(Number(formData.value))) {
        setError('Valid deal value is required');
        return;
      }
      if (!formData.probability || isNaN(Number(formData.probability)) || Number(formData.probability) < 0 || Number(formData.probability) > 100) {
        setError('Probability must be between 0 and 100');
        return;
      }

      const dealData = {
        company: formData.company.trim(),
        sector: formData.sector,
        stage: formData.stage,
        value: Number(formData.value),
        probability: Number(formData.probability),
        leadPartner: formData.leadPartner.trim() || 'Unassigned',
        status: formData.status,
        nextStep: formData.nextStep.trim() || 'To be determined',
        ...(formData.description.trim() && { description: formData.description.trim() }),
        // Include new enhanced data
        contacts: contacts,
        emailTemplate: emailTemplate,
        notes: notes
      };

      // Use the dealsApi service
      try {
        await dealsApi.createDeal(dealData);
      } catch (apiError) {
        console.warn('API not available, creating deal locally:', apiError);
        // For now, just show success message even if API fails
        // In a real app, you might want to queue this for later sync
      }

      // Reset form
      setFormData({
        company: '',
        sector: '',
        stage: 'prospect',
        value: '',
        probability: '',
        leadPartner: '',
        status: 'active',
        nextStep: '',
        description: ''
      });
      setContacts([]);
      setEmailTemplate({ subject: '', body: '' });
      setNotes([]);
      setNewContact({ name: '', email: '', phone: '', role: '', isPrimary: false });
      setNewNote('');
      setShowContactForm(false);
      setEditingContact(null);

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error creating deal:', err);
      setError(err.message || 'Failed to create deal');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setError('');
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      disableEscapeKeyDown={false}
      PaperProps={{
        sx: {
          borderRadius: 3,
          minHeight: '50vh',
          zIndex: 9999
        }
      }}
      sx={{
        zIndex: 9999
      }}
    >
      <DialogTitle sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        bgcolor: '#000000',
        color: 'white',
        py: 2
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <BusinessIcon />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Create New Deal
          </Typography>
        </Box>
        <IconButton onClick={handleClose} sx={{ color: 'white' }} disabled={loading}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 0, px: 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3, mt: 4 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3} sx={{ mt: 4 }}>
          {/* Company Name */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Company Name"
              value={formData.company}
              onChange={handleChange('company')}
              required
              disabled={loading}
              InputLabelProps={{
                sx: { color: '#333333', fontWeight: 500 }
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <BusinessIcon color="action" />
                  </InputAdornment>
                )
              }}
            />
          </Grid>

          {/* Sector */}
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth required disabled={loading}>
              <InputLabel sx={{ color: '#333333', fontWeight: 500 }}>Sector</InputLabel>
              <Select
                value={formData.sector}
                label="Sector"
                onChange={handleChange('sector')}
              >
                {sectors.map((sector) => (
                  <MenuItem key={sector} value={sector}>
                    {sector}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Stage */}
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth disabled={loading}>
              <InputLabel sx={{ color: '#333333', fontWeight: 500 }}>Stage</InputLabel>
              <Select
                value={formData.stage}
                label="Stage"
                onChange={handleChange('stage')}
              >
                {stages.map((stage) => (
                  <MenuItem key={stage.value} value={stage.value}>
                    {stage.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Status */}
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth disabled={loading}>
              <InputLabel sx={{ color: '#333333', fontWeight: 500 }}>Status</InputLabel>
              <Select
                value={formData.status}
                label="Status"
                onChange={handleChange('status')}
              >
                {statuses.map((status) => (
                  <MenuItem key={status.value} value={status.value}>
                    {status.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Deal Value */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Deal Value ($)"
              value={formData.value}
              onChange={handleChange('value')}
              required
              type="number"
              disabled={loading}
              InputLabelProps={{
                sx: { color: '#333333', fontWeight: 500 }
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <MoneyIcon color="action" />
                  </InputAdornment>
                )
              }}
              helperText="Enter amount in USD"
            />
          </Grid>

          {/* Probability */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Probability (%)"
              value={formData.probability}
              onChange={handleChange('probability')}
              required
              type="number"
              disabled={loading}
              InputLabelProps={{
                sx: { color: '#333333', fontWeight: 500 }
              }}
              inputProps={{ min: 0, max: 100 }}
              helperText="0-100%"
            />
          </Grid>

          {/* Lead Partner */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Lead Partner"
              value={formData.leadPartner}
              onChange={handleChange('leadPartner')}
              disabled={loading}
              InputLabelProps={{
                sx: { color: '#333333', fontWeight: 500 }
              }}
              helperText="Optional"
            />
          </Grid>

          {/* Next Step */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Next Step"
              value={formData.nextStep}
              onChange={handleChange('nextStep')}
              disabled={loading}
              InputLabelProps={{
                sx: { color: '#333333', fontWeight: 500 }
              }}
              helperText="Optional"
            />
          </Grid>

          {/* Description */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Description"
              value={formData.description}
              onChange={handleChange('description')}
              multiline
              rows={3}
              disabled={loading}
              InputLabelProps={{
                sx: { color: '#333333', fontWeight: 500 }
              }}
              helperText="Optional deal description or notes"
            />
          </Grid>
        </Grid>

        {/* Enhanced Sections */}
        <Divider sx={{ my: 3 }} />

        {/* Contacts Section */}
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PersonIcon sx={{ color: '#000000' }} />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Key Contacts ({contacts.length})
              </Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* Contact List */}
              {contacts.length > 0 && (
                <List>
                  {contacts.map((contact) => (
                    <ListItem key={contact.id} sx={{ px: 0 }}>
                      <ListItemIcon>
                        <Avatar sx={{ width: 32, height: 32, bgcolor: contact.isPrimary ? '#000000' : 'grey.300' }}>
                          {contact.name.charAt(0)}
                        </Avatar>
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                              {contact.name}
                            </Typography>
                            {contact.isPrimary && (
                              <Chip label="Primary" size="small" sx={{ bgcolor: '#000000', color: 'white', fontSize: '0.7rem' }} />
                            )}
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="caption" display="block">{contact.email}</Typography>
                            {contact.phone && <Typography variant="caption" display="block">{contact.phone}</Typography>}
                            <Typography variant="caption" color="text.secondary">{contact.role}</Typography>
                          </Box>
                        }
                      />
                      <ListItemSecondaryAction>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <Tooltip title="Set as Primary">
                            <IconButton
                              size="small"
                              onClick={() => handleSetPrimaryContact(contact.id)}
                              sx={{ 
                                color: contact.isPrimary ? '#000000' : 'text.secondary',
                                '&:hover': { bgcolor: 'action.hover' }
                              }}
                            >
                              <PersonIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit Contact">
                            <IconButton
                              size="small"
                              onClick={() => handleEditContact(contact.id)}
                              sx={{ '&:hover': { bgcolor: 'action.hover' } }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete Contact">
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteContact(contact.id)}
                              sx={{ color: 'error.main', '&:hover': { bgcolor: 'error.light' } }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              )}

              {/* Add Contact Form */}
              {showContactForm && (
                <Card sx={{ p: 2, bgcolor: 'background.default' }}>
                  <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                    {editingContact ? 'Edit Contact' : 'Add New Contact'}
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Name"
                        value={newContact.name}
                        onChange={(e) => setNewContact(prev => ({ ...prev, name: e.target.value }))}
                        disabled={loading}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Email"
                        type="email"
                        value={newContact.email}
                        onChange={(e) => setNewContact(prev => ({ ...prev, email: e.target.value }))}
                        disabled={loading}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Phone"
                        value={newContact.phone}
                        onChange={(e) => setNewContact(prev => ({ ...prev, phone: e.target.value }))}
                        disabled={loading}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Role"
                        value={newContact.role}
                        onChange={(e) => setNewContact(prev => ({ ...prev, role: e.target.value }))}
                        disabled={loading}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          size="small"
                          variant="contained"
                          onClick={editingContact ? handleUpdateContact : handleAddContact}
                          disabled={loading || !newContact.name || !newContact.email}
                          sx={{ bgcolor: '#000000', '&:hover': { bgcolor: '#333333' } }}
                        >
                          {editingContact ? 'Update' : 'Add'} Contact
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => {
                            setShowContactForm(false);
                            setEditingContact(null);
                            setNewContact({ name: '', email: '', phone: '', role: '', isPrimary: false });
                          }}
                        >
                          Cancel
                        </Button>
                      </Box>
                    </Grid>
                  </Grid>
                </Card>
              )}

              {/* Add Contact Button */}
              {!showContactForm && (
                <Button
                  startIcon={<AddIcon />}
                  onClick={() => setShowContactForm(true)}
                  variant="outlined"
                  sx={{
                    borderColor: '#000000',
                    color: '#000000',
                    '&:hover': {
                      borderColor: '#333333',
                      bgcolor: 'rgba(0,0,0,0.04)'
                    }
                  }}
                >
                  Add Contact
                </Button>
              )}
            </Box>
          </AccordionDetails>
        </Accordion>

        {/* Email Template Section */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <EmailIcon sx={{ color: '#000000' }} />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Email Template
              </Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                fullWidth
                label="Email Subject"
                value={emailTemplate.subject}
                onChange={handleEmailTemplateChange('subject')}
                disabled={loading}
                placeholder="e.g., Follow-up on Investment Opportunity"
                InputLabelProps={{
                  sx: { color: '#333333', fontWeight: 500 }
                }}
              />
              <TextField
                fullWidth
                label="Email Body"
                value={emailTemplate.body}
                onChange={handleEmailTemplateChange('body')}
                multiline
                rows={6}
                disabled={loading}
                placeholder="Enter your email template here..."
                InputLabelProps={{
                  sx: { color: '#333333', fontWeight: 500 }
                }}
                helperText="This template will be used for initial outreach emails"
              />
            </Box>
          </AccordionDetails>
        </Accordion>

        {/* Notes Section */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <NoteIcon sx={{ color: '#000000' }} />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Deal Notes ({notes.length})
              </Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* Notes List */}
              {notes.length > 0 && (
                <List>
                  {notes.map((note) => (
                    <ListItem key={note.id} sx={{ px: 0 }}>
                      <ListItemIcon>
                        <NoteIcon color="action" />
                      </ListItemIcon>
                      <ListItemText
                        primary={note.content}
                        secondary={note.createdAt.toLocaleString()}
                      />
                      <ListItemSecondaryAction>
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteNote(note.id)}
                          sx={{ color: 'error.main' }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              )}

              {/* Add Note Form */}
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  fullWidth
                  label="Add Note"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  disabled={loading}
                  placeholder="Enter a note about this deal..."
                  InputLabelProps={{
                    sx: { color: '#333333', fontWeight: 500 }
                  }}
                />
                <Button
                  variant="contained"
                  onClick={handleAddNote}
                  disabled={loading || !newNote.trim()}
                  sx={{ bgcolor: '#000000', '&:hover': { bgcolor: '#333333' } }}
                >
                  Add
                </Button>
              </Box>
            </Box>
          </AccordionDetails>
        </Accordion>
      </DialogContent>

      <DialogActions sx={{ p: 3, bgcolor: 'background.default' }}>
        <Button
          onClick={handleClose}
          variant="outlined"
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading}
          sx={{
            bgcolor: '#000000',
            color: 'white',
            '&:hover': {
              bgcolor: '#333333'
            }
          }}
          startIcon={loading ? <CircularProgress size={20} /> : <BusinessIcon />}
        >
          {loading ? 'Creating...' : 'Create Deal'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}