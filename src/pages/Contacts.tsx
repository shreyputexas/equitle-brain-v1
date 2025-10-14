import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  InputAdornment,
  IconButton,
  Chip,
  Avatar,
  Tooltip,
  Button,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Card,
  CardContent,
  Menu,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Divider,
  Tab,
  Tabs,
  Badge
} from '@mui/material';
import { DataGrid, GridColDef, GridRowSelectionModel } from '@mui/x-data-grid';
import SearchIcon from '@mui/icons-material/Search';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import BusinessIcon from '@mui/icons-material/Business';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import FilterListIcon from '@mui/icons-material/FilterList';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import GroupIcon from '@mui/icons-material/Group';
import BusinessCenterIcon from '@mui/icons-material/BusinessCenter';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import RefreshIcon from '@mui/icons-material/Refresh';
import axios from 'axios';

type ContactType = 'all' | 'deal' | 'investor' | 'broker';

interface Contact {
  id: string;
  name: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  linkedin_url: string;
  title: string;
  company: string;
  type: ContactType; // deal, investor, broker
  organization_id?: string;
  city?: string;
  state?: string;
  country?: string;
  headline?: string;
  photo_url?: string;
  tags?: string[];
  lastContacted?: string;
  status?: 'active' | 'inactive' | 'pending';
  createdAt?: string;
}

const Contacts: React.FC = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<ContactType>('all');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedRows, setSelectedRows] = useState<GridRowSelectionModel>([]);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  
  // New contact form state
  const [newContact, setNewContact] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    linkedin_url: '',
    title: '',
    company: '',
    type: 'deal' as ContactType,
    city: '',
    state: '',
    tags: [] as string[]
  });

  useEffect(() => {
    fetchContacts();
    
    // Set up auto-refresh every 10 seconds to catch new contacts
    const intervalId = setInterval(() => {
      fetchContacts();
    }, 10000);
    
    return () => clearInterval(intervalId);
  }, []);

  const fetchContacts = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('Fetching contacts from /api/firebase/contacts...');
      const response = await axios.get('/api/firebase/contacts');
      console.log('Response received:', response.data);
      // Map contacts and determine type from tags
      const contactsList = response.data.data?.contacts || response.data.data || [];
      console.log('Contacts list:', contactsList);
      const contactsWithTypes = contactsList.map((contact: any) => {
        // Determine contact type from tags
        let contactType: ContactType = 'deal';
        const tags = contact.tags || [];
        
        if (tags.includes('investor') || tags.includes('investors')) {
          contactType = 'investor';
        } else if (tags.includes('broker') || tags.includes('brokers')) {
          contactType = 'broker';
        } else if (tags.includes('people') || tags.includes('deal')) {
          contactType = 'deal';
        }

        return {
          ...contact,
          type: contactType,
          status: contact.status || 'active',
          tags: tags.filter((tag: string) => !['people', 'broker', 'investor', 'brokers', 'investors', 'deal'].includes(tag))
        };
      });
      console.log('Setting contacts:', contactsWithTypes);
      setContacts(contactsWithTypes);
      console.log('✅ Contacts loaded successfully');
    } catch (err: any) {
      console.error('❌ Error fetching contacts:', err);
      console.error('Error details:', err.response?.data);
      const errorMessage = err.response?.data?.message || err.response?.data?.error || err.message || 'Failed to load contacts';
      console.error('Error message:', errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleAddContact = async () => {
    try {
      const response = await axios.post('/api/firebase/contacts', {
        name: `${newContact.first_name} ${newContact.last_name}`.trim(),
        email: newContact.email,
        phone: newContact.phone,
        linkedinUrl: newContact.linkedin_url,
        title: newContact.title,
        company: newContact.company,
        tags: [newContact.type, ...newContact.tags],
        status: 'warm'
      });
      
      // Add the new contact with proper type mapping
      const addedContact = {
        ...response.data.data,
        first_name: newContact.first_name,
        last_name: newContact.last_name,
        linkedin_url: response.data.data.linkedinUrl,
        type: newContact.type
      };
      
      setContacts([addedContact, ...contacts]);
      setAddDialogOpen(false);
      
      // Reset form
      setNewContact({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        linkedin_url: '',
        title: '',
        company: '',
        type: 'deal',
        city: '',
        state: '',
        tags: []
      });
    } catch (err: any) {
      console.error('Error adding contact:', err);
      setError(err.response?.data?.message || 'Failed to add contact');
    }
  };

  const handleExportCSV = () => {
    const filteredContacts = getFilteredContacts();

    const headers = ['Name', 'Email', 'Phone', 'LinkedIn', 'Title', 'Company', 'Type', 'Location', 'Tags', 'Status'];
    const csvContent = [
      headers.join(','),
      ...filteredContacts.map(contact => [
        `"${contact.name}"`,
        `"${contact.email || 'N/A'}"`,
        `"${contact.phone || 'N/A'}"`,
        `"${contact.linkedin_url || 'N/A'}"`,
        `"${contact.title || 'N/A'}"`,
        `"${contact.company || 'N/A'}"`,
        `"${contact.type || 'deal'}"`,
        `"${[contact.city, contact.state, contact.country].filter(Boolean).join(', ')}"`,
        `"${contact.tags?.join('; ') || 'N/A'}"`,
        `"${contact.status || 'active'}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `contacts_${selectedType}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const getFilteredContacts = () => {
    let filtered = contacts;

    // Filter by type
    if (selectedType !== 'all') {
      filtered = filtered.filter(contact => contact.type === selectedType);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(contact =>
        contact.name?.toLowerCase().includes(query) ||
        contact.email?.toLowerCase().includes(query) ||
        contact.company?.toLowerCase().includes(query) ||
        contact.title?.toLowerCase().includes(query) ||
        contact.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }

    return filtered;
  };

  const getTypeColor = (type: ContactType) => {
    switch (type) {
      case 'deal': return '#4CAF50';
      case 'investor': return '#2196F3';
      case 'broker': return '#FF9800';
      default: return '#9E9E9E';
    }
  };

  const getTypeLabel = (type: ContactType) => {
    switch (type) {
      case 'deal': return 'Deal Contact';
      case 'investor': return 'Investor';
      case 'broker': return 'Broker';
      default: return 'Unknown';
    }
  };

  const getStats = () => {
    const total = contacts.length;
    const deals = contacts.filter(c => c.type === 'deal').length;
    const investors = contacts.filter(c => c.type === 'investor').length;
    const brokers = contacts.filter(c => c.type === 'broker').length;
    const withEmail = contacts.filter(c => c.email && c.email !== 'email_not_unlocked' && !c.email.includes('email_not_unlocked')).length;
    
    return { total, deals, investors, brokers, withEmail };
  };

  const columns: GridColDef[] = [
    {
      field: 'name',
      headerName: 'Name',
      width: 220,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Avatar
            src={params.row.photo_url}
            alt={params.row.name}
            sx={{
              width: 36,
              height: 36,
              bgcolor: '#000000',
              color: '#ffffff',
              fontSize: '0.875rem'
            }}
          >
            {params.row.first_name?.[0]}{params.row.last_name?.[0]}
          </Avatar>
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {params.row.name}
            </Typography>
            {params.row.status && (
              <Chip 
                label={params.row.status} 
                size="small"
                sx={{ 
                  height: 16, 
                  fontSize: '0.65rem',
                  mt: 0.25,
                  bgcolor: params.row.status === 'active' ? '#DCFCE7' : '#F3F4F6',
                  color: params.row.status === 'active' ? '#166534' : '#6B7280'
                }}
              />
            )}
          </Box>
        </Box>
      ),
    },
    {
      field: 'type',
      headerName: 'Type',
      width: 140,
      renderCell: (params) => (
        <Chip
          label={getTypeLabel(params.row.type || 'deal')}
          size="small"
          sx={{
            bgcolor: getTypeColor(params.row.type || 'deal') + '20',
            color: getTypeColor(params.row.type || 'deal'),
            fontWeight: 600,
            borderColor: getTypeColor(params.row.type || 'deal'),
            border: '1px solid'
          }}
        />
      ),
    },
    {
      field: 'email',
      headerName: 'Email',
      width: 200,
      renderCell: (params) => {
        const email = params.row.email;
        if (email && email !== 'email_not_unlocked' && !email.includes('email_not_unlocked')) {
          return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <EmailIcon sx={{ fontSize: 16, color: 'success.main' }} />
              <Typography variant="body2" sx={{ fontSize: '0.8125rem' }}>{email}</Typography>
            </Box>
          );
        }
        return (
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8125rem' }}>
            Not Available
          </Typography>
        );
      },
    },
    {
      field: 'phone',
      headerName: 'Phone',
      width: 140,
      renderCell: (params) => {
        const phone = params.row.phone;
        if (phone) {
          return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <PhoneIcon sx={{ fontSize: 16, color: 'primary.main' }} />
              <Typography variant="body2" sx={{ fontSize: '0.8125rem' }}>{phone}</Typography>
            </Box>
          );
        }
        return (
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8125rem' }}>
            Not Available
          </Typography>
        );
      },
    },
    {
      field: 'title',
      headerName: 'Title',
      width: 180,
      renderCell: (params) => (
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8125rem' }}>
          {params.row.title || '-'}
        </Typography>
      ),
    },
    {
      field: 'company',
      headerName: 'Company',
      width: 180,
      renderCell: (params) => {
        if (params.row.company) {
          return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <BusinessIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Typography variant="body2" sx={{ fontSize: '0.8125rem' }}>{params.row.company}</Typography>
            </Box>
          );
        }
        return (
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8125rem' }}>
            -
          </Typography>
        );
      },
    },
    {
      field: 'location',
      headerName: 'Location',
      width: 150,
      renderCell: (params) => {
        const location = [params.row.city, params.row.state]
          .filter(Boolean)
          .join(', ');
        return (
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8125rem' }}>
            {location || '-'}
          </Typography>
        );
      },
    },
    {
      field: 'tags',
      headerName: 'Tags',
      width: 180,
      renderCell: (params) => {
        const tags = params.row.tags || [];
        if (tags.length === 0) return <Typography variant="body2" color="text.secondary">-</Typography>;
        
        return (
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
            {tags.slice(0, 2).map((tag: string, index: number) => (
              <Chip 
                key={index}
                label={tag}
                size="small"
                sx={{ height: 20, fontSize: '0.6875rem' }}
              />
            ))}
            {tags.length > 2 && (
              <Chip 
                label={`+${tags.length - 2}`}
                size="small"
                sx={{ height: 20, fontSize: '0.6875rem' }}
              />
            )}
          </Box>
        );
      },
    },
    {
      field: 'linkedin_url',
      headerName: 'LinkedIn',
      width: 90,
      renderCell: (params) => {
        const linkedinUrl = params.row.linkedin_url;
        if (linkedinUrl) {
          return (
            <Tooltip title="Open LinkedIn Profile">
              <IconButton
                size="small"
                onClick={() => window.open(linkedinUrl, '_blank')}
                sx={{ color: '#0077B5' }}
              >
                <LinkedInIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          );
        }
        return (
          <Typography variant="body2" color="text.secondary">
            -
          </Typography>
        );
      },
    },
    {
      field: 'actions',
      headerName: 'History',
      width: 80,
      renderCell: (params) => (
        <IconButton
          size="small"
          onClick={(e) => setAnchorEl(e.currentTarget)}
        >
          <MoreVertIcon fontSize="small" />
        </IconButton>
      ),
    },
  ];

  const filteredContacts = getFilteredContacts();
  const stats = getStats();

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" sx={{ fontWeight: 600, fontFamily: '"Space Grotesk", sans-serif' }}>
          Contacts
        </Typography>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Tooltip title="Refresh contacts">
            <IconButton
              onClick={fetchContacts}
              disabled={loading}
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                '&:hover': {
                  borderColor: '#D1D5DB',
                  bgcolor: '#F9FAFB'
                }
              }}
            >
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Button
            variant="outlined"
            startIcon={<FileDownloadIcon />}
            onClick={handleExportCSV}
            disabled={filteredContacts.length === 0}
            sx={{
              borderColor: 'divider',
              color: 'text.primary',
              '&:hover': {
                borderColor: '#D1D5DB',
                bgcolor: '#F9FAFB'
              },
            }}
          >
            Export CSV
          </Button>
          <Button
            variant="contained"
            startIcon={<PersonAddIcon />}
            onClick={() => setAddDialogOpen(true)}
            sx={{
              bgcolor: '#000000',
              color: '#ffffff',
              '&:hover': {
                bgcolor: '#333333',
              },
            }}
          >
            Add Contact
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ border: '1px solid', borderColor: 'divider' }}>
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                    Total Contacts
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700, fontFamily: '"Space Grotesk", sans-serif' }}>
                    {stats.total}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: '#F3F4F6', color: '#000000', width: 40, height: 40 }}>
                  <GroupIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ border: '1px solid', borderColor: 'divider' }}>
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                    Deal Contacts
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700, fontFamily: '"Space Grotesk", sans-serif' }}>
                    {stats.deals}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: '#DCFCE7', color: '#166534', width: 40, height: 40 }}>
                  <BusinessCenterIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ border: '1px solid', borderColor: 'divider' }}>
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                    Investors
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700, fontFamily: '"Space Grotesk", sans-serif' }}>
                    {stats.investors}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: '#DBEAFE', color: '#1E40AF', width: 40, height: 40 }}>
                  <AccountBalanceIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ border: '1px solid', borderColor: 'divider' }}>
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                    Brokers
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700, fontFamily: '"Space Grotesk", sans-serif' }}>
                    {stats.brokers}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: '#FEF3C7', color: '#92400E', width: 40, height: 40 }}>
                  <TrendingUpIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Main Content */}
      <Paper sx={{ overflow: 'hidden' }}>
        {/* Filters Bar */}
        <Box sx={{ p: 2.5, bgcolor: '#000000', color: 'white' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, fontFamily: '"Space Grotesk", sans-serif', color: 'white' }}>
              All Contacts
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <FilterListIcon sx={{ color: 'rgba(255,255,255,0.7)', fontSize: 20 }} />
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                {selectedRows.length > 0 ? `${selectedRows.length} selected` : ''}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Tabs
              value={selectedType}
              onChange={(e, value) => setSelectedType(value)}
              sx={{
                '& .MuiTab-root': {
                  color: 'rgba(255,255,255,0.7)',
                  minHeight: 36,
                  textTransform: 'none',
                  fontWeight: 500,
                  '&.Mui-selected': {
                    color: 'white'
                  }
                },
                '& .MuiTabs-indicator': {
                  bgcolor: 'white'
                }
              }}
            >
              <Tab label={`All (${stats.total})`} value="all" />
              <Tab label={`Deals (${stats.deals})`} value="deal" />
              <Tab label={`Investors (${stats.investors})`} value="investor" />
              <Tab label={`Brokers (${stats.brokers})`} value="broker" />
            </Tabs>
          </Box>
        </Box>

        {/* Search and Filters */}
        <Box sx={{ p: 2.5, bgcolor: 'background.paper' }}>
          <TextField
            fullWidth
            placeholder="Search by name, email, company, title, or tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ mb: 2 }}
          />

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Showing <strong>{filteredContacts.length}</strong> of <strong>{contacts.length}</strong> contacts
            </Typography>
            {searchQuery && (
              <Chip
                label={`Search: "${searchQuery}"`}
                size="small"
                onDelete={() => setSearchQuery('')}
              />
            )}
            {selectedType !== 'all' && (
              <Chip
                label={`Type: ${getTypeLabel(selectedType)}`}
                size="small"
                onDelete={() => setSelectedType('all')}
                sx={{
                  bgcolor: getTypeColor(selectedType) + '20',
                  color: getTypeColor(selectedType),
                  borderColor: getTypeColor(selectedType),
                  border: '1px solid'
                }}
              />
            )}
          </Box>
        </Box>

        <Divider />

        {/* Data Grid */}
        <Box sx={{ height: 600, width: '100%' }}>
          <DataGrid
            rows={filteredContacts}
            columns={columns}
            loading={loading}
            checkboxSelection
            disableRowSelectionOnClick
            onRowSelectionModelChange={(newSelection) => setSelectedRows(newSelection)}
            pageSizeOptions={[10, 25, 50, 100]}
            initialState={{
              pagination: {
                paginationModel: { pageSize: 25 },
              },
            }}
            sx={{
              border: 'none',
              '& .MuiDataGrid-cell': {
                borderColor: 'divider',
                fontSize: '0.8125rem'
              },
              '& .MuiDataGrid-columnHeaders': {
                bgcolor: '#F9FAFB',
                borderColor: 'divider',
                fontSize: '0.8125rem',
                fontWeight: 600
              },
              '& .MuiDataGrid-row:hover': {
                bgcolor: '#F9FAFB'
              }
            }}
          />
        </Box>
      </Paper>

      {/* Add Contact Dialog */}
      <Dialog 
        open={addDialogOpen} 
        onClose={() => setAddDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 2 }
        }}
      >
        <DialogTitle>
          <Typography variant="h6" sx={{ fontWeight: 600, fontFamily: '"Space Grotesk", sans-serif' }}>
            Add New Contact
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Fill in the contact details below
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="First Name *"
                value={newContact.first_name}
                onChange={(e) => setNewContact({ ...newContact, first_name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Last Name *"
                value={newContact.last_name}
                onChange={(e) => setNewContact({ ...newContact, last_name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email *"
                type="email"
                value={newContact.email}
                onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Phone"
                value={newContact.phone}
                onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="LinkedIn URL"
                value={newContact.linkedin_url}
                onChange={(e) => setNewContact({ ...newContact, linkedin_url: e.target.value })}
                placeholder="https://linkedin.com/in/..."
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Title"
                value={newContact.title}
                onChange={(e) => setNewContact({ ...newContact, title: e.target.value })}
                placeholder="e.g., CEO, Founder"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Company"
                value={newContact.company}
                onChange={(e) => setNewContact({ ...newContact, company: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>Contact Type *</InputLabel>
                <Select
                  value={newContact.type}
                  label="Contact Type *"
                  onChange={(e) => setNewContact({ ...newContact, type: e.target.value as ContactType })}
                >
                  <MenuItem value="deal">Deal Contact</MenuItem>
                  <MenuItem value="investor">Investor</MenuItem>
                  <MenuItem value="broker">Broker</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="City"
                value={newContact.city}
                onChange={(e) => setNewContact({ ...newContact, city: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="State"
                value={newContact.state}
                onChange={(e) => setNewContact({ ...newContact, state: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 1.5 }}>
          <Button onClick={() => setAddDialogOpen(false)} sx={{ color: 'text.secondary' }}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={handleAddContact}
            disabled={!newContact.first_name || !newContact.last_name || !newContact.email}
            sx={{
              bgcolor: '#000000',
              '&:hover': { bgcolor: '#333333' }
            }}
          >
            Add Contact
          </Button>
        </DialogActions>
      </Dialog>

      {/* Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        <MenuItem onClick={() => setAnchorEl(null)}>
          <EditIcon fontSize="small" sx={{ mr: 1 }} />
          Edit
        </MenuItem>
        <MenuItem onClick={() => setAnchorEl(null)}>
          <LocalOfferIcon fontSize="small" sx={{ mr: 1 }} />
          Add Tag
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => setAnchorEl(null)} sx={{ color: 'error.main' }}>
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default Contacts;
