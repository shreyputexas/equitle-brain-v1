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
  Badge,
  ListItemIcon
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
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import UploadFileIcon from '@mui/icons-material/UploadFile';
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
  const [csvDialogOpen, setCsvDialogOpen] = useState(false);
  const [selectedRows, setSelectedRows] = useState<GridRowSelectionModel>([]);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [addMenuAnchorEl, setAddMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<{contactId: string, field: string} | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvPreview, setCsvPreview] = useState<any[]>([]);
  
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
    
    // Auto-refresh disabled - use manual refresh button instead
    // const intervalId = setInterval(() => {
    //   fetchContacts();
    // }, 10000);
    
    // return () => clearInterval(intervalId);
  }, []);

  const fetchContacts = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get('/api/firebase/contacts');
      // Map contacts and determine type from tags
      const contactsList = response.data.data?.contacts || response.data.data || [];
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
      setContacts(contactsWithTypes);
    } catch (err: any) {
      console.error('Error fetching contacts:', err);
      const errorMessage = err.response?.data?.message || err.response?.data?.error || err.message || 'Failed to load contacts';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleAddContact = async () => {
    try {
      setError(null); // Clear any previous errors
      const contactData = {
        name: `${newContact.first_name} ${newContact.last_name}`.trim(),
        email: newContact.email,
        phone: newContact.phone,
        linkedinUrl: newContact.linkedin_url,
        title: newContact.title,
        company: newContact.company,
        tags: [newContact.type, ...newContact.tags],
        status: 'warm'
      };
      
      // Validate required fields
      if (!contactData.name.trim()) {
        setError('Name is required');
        return;
      }
      if (!contactData.email.trim()) {
        setError('Email is required');
        return;
      }
      
      console.log('Sending contact data:', contactData);
      
      const response = await axios.post('/api/firebase/contacts', contactData);
      
      console.log('API Response:', response.data);
      
      // Add the new contact with proper type mapping
      const contactResponse = response.data.data?.contact || response.data.data;
      const addedContact = {
        ...contactResponse,
        first_name: newContact.first_name,
        last_name: newContact.last_name,
        linkedin_url: contactResponse?.linkedinUrl,
        type: newContact.type
      };
      
      // Only update state if we have valid contact data
      if (contactResponse && contactResponse.id) {
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
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err: any) {
      console.error('Error adding contact:', err);
      console.error('Error response:', err.response?.data);
      
      if (err.response?.data?.details) {
        setError(`Validation error: ${err.response.data.details.join(', ')}`);
      } else {
        setError(err.response?.data?.message || err.response?.data?.error || 'Failed to add contact');
      }
    }
  };

  const handleDeleteContact = async () => {
    if (!selectedContactId) return;
    
    try {
      setError(null);
      await axios.delete(`/api/firebase/contacts/${selectedContactId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || 'mock-token'}`
        }
      });
      
      // Remove the contact from the local state
      setContacts(contacts.filter(contact => contact.id !== selectedContactId));
      setAnchorEl(null);
      setSelectedContactId(null);
    } catch (err: any) {
      console.error('Error deleting contact:', err);
      setError(err.response?.data?.message || 'Failed to delete contact');
    }
  };

  const handleStartEdit = (contactId: string, field: string, currentValue: string) => {
    setEditingField({ contactId, field });
    setEditingValue(currentValue || '');
  };

  const handleSaveEdit = async () => {
    if (!editingField) return;

    try {
      setError(null);
      
      // Prepare the update data
      const updateData: any = {};
      updateData[editingField.field] = editingValue;

      await axios.put(`/api/firebase/contacts/${editingField.contactId}`, updateData, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || 'mock-token'}`
        }
      });

      // Update the local state
      setContacts(contacts.map(contact => 
        contact.id === editingField.contactId 
          ? { ...contact, [editingField.field]: editingValue }
          : contact
      ));

      setEditingField(null);
      setEditingValue('');
    } catch (err: any) {
      console.error('Error updating contact:', err);
      setError(err.response?.data?.message || 'Failed to update contact');
    }
  };

  const handleCancelEdit = () => {
    setEditingField(null);
    setEditingValue('');
  };

  const handleCsvFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setCsvFile(file);
      
      // Parse CSV and show preview
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim());
        
        if (lines.length === 0) return;
        
        // Parse header
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        
        // Parse rows (show first 5 as preview)
        const preview = lines.slice(1, 6).map(line => {
          const values = line.split(',').map(v => v.trim());
          const row: any = {};
          headers.forEach((header, index) => {
            row[header] = values[index] || '';
          });
          return row;
        });
        
        setCsvPreview(preview);
      };
      reader.readAsText(file);
    }
  };

  const handleImportCsv = async () => {
    if (!csvFile) return;
    
    setLoading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim());
        
        if (lines.length === 0) {
          setError('CSV file is empty');
          setLoading(false);
          return;
        }
        
        // Parse header
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        
        // Parse all rows
        const contactsToImport = lines.slice(1).map(line => {
          const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
          const row: any = {};
          headers.forEach((header, index) => {
            row[header] = values[index] || '';
          });
          return row;
        });
        
        // Import contacts via bulk-save API
        const response = await axios.post('/api/firebase/contacts/bulk-save', {
          contacts: contactsToImport.map((c: any) => {
            // Parse type field (defaults to 'deal' if not specified or invalid)
            let contactType = 'people';
            const typeValue = (c.type || '').toLowerCase().trim();
            if (typeValue.includes('broker')) {
              contactType = 'broker';
            } else if (typeValue.includes('investor')) {
              contactType = 'investor';
            } else if (typeValue.includes('deal') || typeValue.includes('target')) {
              contactType = 'people';
            }
            
            // Parse location
            let city, state;
            if (c.location) {
              const locationParts = c.location.split(',').map((p: string) => p.trim());
              city = locationParts[0] || undefined;
              state = locationParts[1] || undefined;
            }
            
            return {
              name: c.name || `${c.first_name || ''} ${c.last_name || ''}`.trim(),
              email: c.email || undefined,
              phone: c.phone || undefined,
              linkedin_url: c.linkedin || c.linkedin_url || c['linkedin url'] || undefined,
              title: c.title || undefined,
              company: c.company || undefined,
              city: city || c.city || undefined,
              state: state || c.state || undefined,
              tags: c.tags ? c.tags.split(';').map((t: string) => t.trim()).filter(Boolean) : [],
              notes: c['interaction history'] || c.notes || undefined,
              contactType: contactType
            };
          }),
          contactType: 'people' // Default fallback
        });
        
        if (response.data.success) {
          await fetchContacts();
          setCsvDialogOpen(false);
          setCsvFile(null);
          setCsvPreview([]);
          setError(null);
          alert(`Successfully imported ${response.data.saved} contacts!`);
        }
      };
      reader.readAsText(csvFile);
    } catch (err: any) {
      console.error('Error importing CSV:', err);
      setError(err.response?.data?.message || 'Failed to import CSV');
    } finally {
      setLoading(false);
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

  // Editable cell component
  const EditableCell = ({ contactId, field, value, onSave, onCancel }: {
    contactId: string;
    field: string;
    value: string;
    onSave: () => void;
    onCancel: () => void;
  }) => {
    const isEditing = editingField?.contactId === contactId && editingField?.field === field;
    
    if (isEditing) {
      return (
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 0.5, 
          width: '100%',
          maxWidth: '100%',
          minHeight: '32px'
        }}>
          <TextField
            value={editingValue}
            onChange={(e) => setEditingValue(e.target.value)}
            size="small"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                onSave();
              } else if (e.key === 'Escape') {
                onCancel();
              }
            }}
            sx={{ 
              flex: 1,
              '& .MuiInputBase-root': {
                height: '28px',
                fontSize: '0.8125rem'
              },
              '& .MuiInputBase-input': {
                padding: '4px 8px'
              }
            }}
          />
          <IconButton size="small" onClick={onSave} color="primary" sx={{ minWidth: '24px', width: '24px', height: '24px' }}>
            ✓
          </IconButton>
          <IconButton size="small" onClick={onCancel} color="error" sx={{ minWidth: '24px', width: '24px', height: '24px' }}>
            ✕
          </IconButton>
        </Box>
      );
    }
    
    return (
      <Box
        onDoubleClick={() => handleStartEdit(contactId, field, value)}
        sx={{ 
          cursor: 'pointer', 
          '&:hover': { backgroundColor: 'action.hover' },
          padding: '4px 8px',
          borderRadius: 1,
          minHeight: '32px',
          maxHeight: '32px',
          display: 'flex',
          alignItems: 'center',
          width: '100%',
          maxWidth: '100%',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}
      >
        <Typography
          variant="body2"
          sx={{
            fontSize: field === 'name' ? '0.875rem' : '0.8125rem',
            fontWeight: field === 'name' ? 600 : 400,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            width: '100%',
            lineHeight: field === 'name' ? 1.2 : 1.4
          }}
        >
          {value || <span style={{ color: '#999', fontStyle: 'italic' }}>Click to edit</span>}
        </Typography>
      </Box>
    );
  };

  const columns: GridColDef[] = [
    {
      field: 'name',
      headerName: 'Name',
      width: 240,
      flex: 1,
      minWidth: 200,
      renderCell: (params) => (
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          width: '100%',
          height: '100%',
          py: 1
        }}>
          <Avatar
            src={params.row.photo_url}
            alt={params.row.name}
            sx={{
              width: 36,
              height: 36,
              bgcolor: '#000000',
              color: '#ffffff',
              fontSize: '0.875rem',
              flexShrink: 0
            }}
          >
            {params.row.first_name?.[0]}{params.row.last_name?.[0]}
          </Avatar>
          <Box sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            minWidth: 0
          }}>
            <EditableCell
              contactId={params.row.id}
              field="name"
              value={params.row.name}
              onSave={handleSaveEdit}
              onCancel={handleCancelEdit}
            />
            {params.row.status && (
              <Chip
                label={params.row.status}
                size="small"
                sx={{
                  height: 16,
                  fontSize: '0.65rem',
                  mt: 0.25,
                  bgcolor: params.row.status === 'active' ? '#DCFCE7' : '#F3F4F6',
                  color: params.row.status === 'active' ? '#166534' : '#6B7280',
                  alignSelf: 'flex-start'
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
      width: 130,
      minWidth: 120,
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
      width: 250,
      flex: 0.8,
      minWidth: 200,
      renderCell: (params) => {
        const email = params.row.email;
        if (email && email !== 'email_not_unlocked' && !email.includes('email_not_unlocked')) {
          return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <EmailIcon sx={{ fontSize: 16, color: 'success.main' }} />
              <EditableCell
                contactId={params.row.id}
                field="email"
                value={email}
                onSave={handleSaveEdit}
                onCancel={handleCancelEdit}
              />
            </Box>
          );
        }
        return (
          <EditableCell
            contactId={params.row.id}
            field="email"
            value=""
            onSave={handleSaveEdit}
            onCancel={handleCancelEdit}
          />
        );
      },
    },
    {
      field: 'phone',
      headerName: 'Phone',
      width: 160,
      minWidth: 140,
      renderCell: (params) => {
        const phone = params.row.phone;
        if (phone) {
          return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <PhoneIcon sx={{ fontSize: 16, color: 'primary.main' }} />
              <EditableCell
                contactId={params.row.id}
                field="phone"
                value={phone}
                onSave={handleSaveEdit}
                onCancel={handleCancelEdit}
              />
            </Box>
          );
        }
        return (
          <EditableCell
            contactId={params.row.id}
            field="phone"
            value=""
            onSave={handleSaveEdit}
            onCancel={handleCancelEdit}
          />
        );
      },
    },
    {
      field: 'title',
      headerName: 'Title',
      width: 280,
      flex: 1,
      minWidth: 220,
      renderCell: (params) => (
        <EditableCell
          contactId={params.row.id}
          field="title"
          value={params.row.title || ''}
          onSave={handleSaveEdit}
          onCancel={handleCancelEdit}
        />
      ),
    },
    {
      field: 'company',
      headerName: 'Company',
      width: 250,
      flex: 1,
      minWidth: 200,
      renderCell: (params) => {
        if (params.row.company) {
          return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <BusinessIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
              <EditableCell
                contactId={params.row.id}
                field="company"
                value={params.row.company}
                onSave={handleSaveEdit}
                onCancel={handleCancelEdit}
              />
            </Box>
          );
        }
        return (
          <EditableCell
            contactId={params.row.id}
            field="company"
            value=""
            onSave={handleSaveEdit}
            onCancel={handleCancelEdit}
          />
        );
      },
    },
    {
      field: 'location',
      headerName: 'Location',
      width: 180,
      minWidth: 140,
      renderCell: (params) => {
        const location = [params.row.city, params.row.state]
          .filter(Boolean)
          .join(', ');
        return (
          <EditableCell
            contactId={params.row.id}
            field="city"
            value={params.row.city || ''}
            onSave={handleSaveEdit}
            onCancel={handleCancelEdit}
          />
        );
      },
    },
    {
      field: 'tags',
      headerName: 'Tags',
      width: 200,
      flex: 0.5,
      minWidth: 160,
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
      width: 100,
      minWidth: 90,
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
      width: 100,
      minWidth: 90,
      renderCell: (params) => (
        <IconButton
          size="small"
          onClick={(e) => {
            setSelectedContactId(params.row.id);
            setAnchorEl(e.currentTarget);
          }}
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
          <Box sx={{ display: 'flex' }}>
            <Button
              variant="contained"
              startIcon={<PersonAddIcon />}
              onClick={(e) => setAddMenuAnchorEl(e.currentTarget)}
              endIcon={<ArrowDropDownIcon />}
              sx={{
                bgcolor: '#000000',
                color: '#ffffff',
                '&:hover': {
                  bgcolor: '#333333',
                },
              }}
            >
              
            </Button>
            <Menu
              anchorEl={addMenuAnchorEl}
              open={Boolean(addMenuAnchorEl)}
              onClose={() => setAddMenuAnchorEl(null)}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
              <MenuItem 
                onClick={() => { 
                  setAddMenuAnchorEl(null); 
                  setAddDialogOpen(true); 
                }}
              >
                <ListItemIcon>
                  <PersonAddIcon fontSize="small" />
                </ListItemIcon>
                Add Single Contact
              </MenuItem>
              <MenuItem 
                onClick={() => { 
                  setAddMenuAnchorEl(null); 
                  setCsvDialogOpen(true); 
                }}
              >
                <ListItemIcon>
                  <UploadFileIcon fontSize="small" />
                </ListItemIcon>
                Import from CSV
              </MenuItem>
            </Menu>
          </Box>
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
            rowHeight={70}
            onRowSelectionModelChange={(newSelection) => setSelectedRows(newSelection)}
            pageSizeOptions={[10, 25, 50, 100]}
            disableColumnMenu={false}
            initialState={{
              pagination: {
                paginationModel: { pageSize: 25 },
              },
            }}
            sx={{
              border: 'none',
              '& .MuiDataGrid-cell': {
                borderColor: 'divider',
                fontSize: '0.8125rem',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center'
              },
              '& .MuiDataGrid-columnHeaders': {
                bgcolor: '#F9FAFB',
                borderColor: 'divider',
                fontSize: '0.8125rem',
                fontWeight: 600,
                height: '72px !important',
                minHeight: '72px !important'
              },
              '& .MuiDataGrid-columnHeader': {
                padding: '12px 16px'
              },
              '& .MuiDataGrid-columnHeader--checkboxSelection': {
                padding: '16px 20px',
                minWidth: '80px !important',
                width: '80px !important',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                '& .MuiCheckbox-root': {
                  padding: '4px',
                  width: '18px !important',
                  height: '18px !important',
                  '& .MuiSvgIcon-root': {
                    fontSize: '18px'
                  }
                }
              },
              '& .MuiDataGrid-cellCheckbox': {
                padding: '12px 20px',
                minWidth: '80px !important',
                width: '80px !important',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                '& .MuiCheckbox-root': {
                  padding: '4px',
                  width: '18px !important',
                  height: '18px !important',
                  '& .MuiSvgIcon-root': {
                    fontSize: '18px'
                  }
                }
              },
              '& .MuiDataGrid-row': {
                '&:hover': {
                  bgcolor: '#F9FAFB'
                },
                '&.Mui-selected': {
                  bgcolor: '#EBF8FF',
                  '&:hover': {
                    bgcolor: '#DBEAFE'
                  }
                }
              },
              '& .MuiDataGrid-virtualScroller': {
                overflowX: 'auto'
              },
              '& .MuiDataGrid-checkboxInput': {
                width: '18px !important',
                height: '18px !important',
                '& .MuiSvgIcon-root': {
                  fontSize: '18px'
                }
              },
              '& .MuiDataGrid-columnHeaderCheckbox': {
                '& .MuiCheckbox-root': {
                  width: '18px !important',
                  height: '18px !important',
                  '& .MuiSvgIcon-root': {
                    fontSize: '18px'
                  }
                }
              },
              '& .MuiDataGrid-cellCheckbox': {
                '& .MuiCheckbox-root': {
                  width: '18px !important',
                  height: '18px !important',
                  '& .MuiSvgIcon-root': {
                    fontSize: '18px'
                  }
                }
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
        <MenuItem onClick={handleDeleteContact} sx={{ color: 'error.main' }}>
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>

      {/* CSV Import Dialog */}
      <Dialog 
        open={csvDialogOpen} 
        onClose={() => {
          setCsvDialogOpen(false);
          setCsvFile(null);
          setCsvPreview([]);
        }} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, fontFamily: '"Space Grotesk", sans-serif' }}>
            Import Contacts from CSV
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Required columns: <strong>name, email</strong>
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25, fontSize: '0.75rem' }}>
            Optional: type (deal/broker/investor), phone, title, company, location, tags (semicolon-separated), linkedin, interaction history
          </Typography>
        </DialogTitle>
        <DialogContent dividers sx={{ pt: 2 }}>
          {/* CSV Format Example */}
          <Box sx={{ mb: 2, p: 2, bgcolor: '#F9FAFB', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 1 }}>
              Example CSV Format:
            </Typography>
            <Typography variant="caption" sx={{ fontFamily: 'monospace', display: 'block', fontSize: '0.7rem', whiteSpace: 'pre', overflowX: 'auto' }}>
              {`name,type,email,phone,title,company,location,tags,linkedin,interaction history
John Doe,deal,john@example.com,555-1234,CEO,Tech Corp,"San Francisco, CA",vip;tech,linkedin.com/in/johndoe,Met at conference
Jane Smith,investor,jane@fund.com,555-5678,Partner,VC Fund,"New York, NY",investor;fintech,linkedin.com/in/janesmith,Pitch meeting scheduled`}
            </Typography>
          </Box>

          <Box sx={{ mb: 3 }}>
            <input
              accept=".csv"
              style={{ display: 'none' }}
              id="csv-upload"
              type="file"
              onChange={handleCsvFileChange}
            />
            <label htmlFor="csv-upload">
              <Button
                variant="outlined"
                component="span"
                startIcon={<UploadFileIcon />}
                fullWidth
                sx={{
                  py: 2,
                  borderColor: 'divider',
                  borderStyle: 'dashed',
                  '&:hover': {
                    borderColor: '#D1D5DB',
                    bgcolor: '#F9FAFB'
                  }
                }}
              >
                {csvFile ? csvFile.name : 'Choose CSV File'}
              </Button>
            </label>
          </Box>

          {csvPreview.length > 0 && (
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                Preview (first 5 rows):
              </Typography>
              <Box sx={{ 
                border: '1px solid', 
                borderColor: 'divider', 
                borderRadius: 1, 
                overflow: 'auto',
                maxHeight: 300
              }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#F9FAFB' }}>
                      {Object.keys(csvPreview[0]).map((header) => (
                        <th key={header} style={{ 
                          padding: '8px', 
                          textAlign: 'left', 
                          borderBottom: '1px solid #E5E7EB',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          textTransform: 'uppercase'
                        }}>
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {csvPreview.map((row, index) => (
                      <tr key={index} style={{ borderBottom: '1px solid #F3F4F6' }}>
                        {Object.values(row).map((value: any, colIndex) => (
                          <td key={colIndex} style={{ 
                            padding: '8px', 
                            fontSize: '0.8125rem'
                          }}>
                            {value}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 1.5 }}>
          <Button 
            onClick={() => {
              setCsvDialogOpen(false);
              setCsvFile(null);
              setCsvPreview([]);
            }} 
            sx={{ color: 'text.secondary' }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleImportCsv}
            disabled={!csvFile || loading}
            sx={{ px: 3 }}
          >
            {loading ? 'Importing...' : 'Import Contacts'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Contacts;
