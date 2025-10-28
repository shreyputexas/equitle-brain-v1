import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Grid,
  Card,
  CardContent,
  LinearProgress,
  Alert,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
  Snackbar,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  Badge,
  CardActions,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  Search as SearchIcon,
  Download as DownloadIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  AccountBalance as AccountBalanceIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LinkedIn as LinkedInIcon,
  LocationOn as LocationIcon,
  Photo as PhotoIcon,
  Close as CloseIcon,
  Refresh as RefreshIcon,
  FileDownload as FileDownloadIcon,
  DataUsage as DataUsageIcon,
  Info as InfoIcon,
  GetApp as GetAppIcon
} from '@mui/icons-material';

interface EnrichedContact {
  id: string;
  original: {
    given: string;
    company: string;
    website: string;
    phone: string;
    email: string;
  };
  enriched: {
    name: string;
    email?: string;
    phone?: string;
    title?: string;
    company?: string;
    linkedin?: string;
    location?: string;
    photo?: string;
    organization?: any;
    website?: string;
  } | null;
  success: boolean;
  error?: string;
}

interface ScrapingResults {
  results: EnrichedContact[];
  summary: {
    total: number;
    successful: number;
    failed: number;
    successRate: number;
  };
}

interface ThesisCriteria {
  industries: string;
  location: string;
  companySizeRange: string;
  fundingStage: string;
  technologies: string;
  jobDepartments: string;
}

interface DiscoveredContact {
  id: string;
  name: string;
  first_name: string;
  last_name: string;
  title: string;
  email: string;
  phone: string;
  linkedin_url: string;
  company: string;
  company_domain: string;
  company_industry: string;
  company_size: string;
  location: string;
  match_quality: string;
  apollo_confidence: number;
  email_status: string;
  email_unlocked: boolean;
}

interface EnrichedOrganization {
  id: string;
  original: {
    company: string;
    website: string;
    industry: string;
    location: string;
  };
  enriched: {
    name: string;
    website?: string;
    linkedin?: string;
    phone?: string;
    email?: string;
    industry?: string;
    employeeCount?: number;
    description?: string;
    headquarters?: string;
    revenue?: string;
    foundedYear?: number;
    socialMedia?: {
      linkedin?: string;
      twitter?: string;
      facebook?: string;
    };
  } | null;
  success: boolean;
  error?: string;
}

interface OrganizationResults {
  results: EnrichedOrganization[];
  summary: {
    total: number;
    successful: number;
    failed: number;
    successRate: number;
  };
}

interface EnrichedContactData {
  id: string;
  original: {
    firstName: string;
    lastName: string;
    email: string;
    company: string;
    title: string;
    phone: string;
  };
  enriched: {
    name: string;
    email?: string;
    phone?: string;
    title?: string;
    company?: string;
    linkedin?: string;
    location?: string;
    photo?: string;
    industry?: string;
    employeeCount?: number;
    companyDomain?: string;
    twitter?: string;
    github?: string;
    facebook?: string;
  } | null;
  success: boolean;
  error?: string;
}

interface ContactResults {
  results: EnrichedContactData[];
  summary: {
    total: number;
    successful: number;
    failed: number;
    successRate: number;
  };
}

export default function DataEnrichment() {
  const [selectedProvider, setSelectedProvider] = useState<'apollo' | 'zoominfo' | 'gratta'>('apollo');
  const [apolloApiKey, setApolloApiKey] = useState('');
  const [zoominfoApiKey, setZoominfoApiKey] = useState('');
  const [grattaApiKey, setGrattaApiKey] = useState('');
  const [isValidatingKey, setIsValidatingKey] = useState(false);
  const [isKeyValid, setIsKeyValid] = useState<boolean | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<ScrapingResults | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [message, setMessage] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);


  // Load API key state from localStorage on component mount
  useEffect(() => {
    const savedApolloKey = localStorage.getItem('apolloApiKey');
    const savedZoominfoKey = localStorage.getItem('zoominfoApiKey');
    const savedGrattaKey = localStorage.getItem('grattaApiKey');
    const savedIsKeyValid = localStorage.getItem('isKeyValid');
    const savedSelectedProvider = localStorage.getItem('selectedProvider');

    if (savedApolloKey) setApolloApiKey(savedApolloKey);
    if (savedZoominfoKey) setZoominfoApiKey(savedZoominfoKey);
    if (savedGrattaKey) setGrattaApiKey(savedGrattaKey);
    if (savedIsKeyValid) {
      const isValid = savedIsKeyValid === 'true';
      setIsKeyValid(isValid);
    }
    if (savedSelectedProvider && ['apollo', 'zoominfo', 'gratta'].includes(savedSelectedProvider)) {
      setSelectedProvider(savedSelectedProvider as 'apollo' | 'zoominfo' | 'gratta');
    }
  }, []);


  // Main tab and sub-tab state
  const [activeMainTab, setActiveMainTab] = useState(0); // 0: Enrichment, 1: Search
  const [activeSubTab, setActiveSubTab] = useState(0); // 0: Contact, 1: Organization
  const [activeTab, setActiveTab] = useState(0); // Keep for backward compatibility
  const [thesisCriteria, setThesisCriteria] = useState<ThesisCriteria>(() => {
    // Load from localStorage on component mount
    const saved = localStorage.getItem('thesisCriteria');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (error) {
        console.error('Failed to parse saved thesis criteria:', error);
      }
    }
    return {
      industries: '',
      location: '',
      companySizeRange: '',
      fundingStage: '',
      technologies: '',
      jobDepartments: ''
    };
  });
  const [discoveredContacts, setDiscoveredContacts] = useState<DiscoveredContact[]>([]);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [discoveryResults, setDiscoveryResults] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [contactsToFind, setContactsToFind] = useState<number>(10);

  // Organization enrichment state
  const [orgSelectedFile, setOrgSelectedFile] = useState<File | null>(null);
  const [isOrgProcessing, setIsOrgProcessing] = useState(false);
  const [orgResults, setOrgResults] = useState<OrganizationResults | null>(null);
  const [showOrgResults, setShowOrgResults] = useState(false);
  const [orgFileInputRef] = useState(useRef<HTMLInputElement>(null));

  // Contact enrichment state
  const [contactSelectedFile, setContactSelectedFile] = useState<File | null>(null);
  const [isContactProcessing, setIsContactProcessing] = useState(false);
  const [contactResults, setContactResults] = useState<ContactResults | null>(null);
  const [showContactResults, setShowContactResults] = useState(false);
  const [contactFileInputRef] = useState(useRef<HTMLInputElement>(null));

  // Helper function to get current API key based on selected provider
  const getCurrentApiKey = () => {
    switch (selectedProvider) {
      case 'apollo':
        return apolloApiKey;
      case 'zoominfo':
        return zoominfoApiKey;
      case 'gratta':
        return grattaApiKey;
      default:
        return apolloApiKey;
    }
  };

  // Helper function to set API key based on selected provider
  const setCurrentApiKey = (key: string) => {
    switch (selectedProvider) {
      case 'apollo':
        setApolloApiKey(key);
        localStorage.setItem('apolloApiKey', key);
        break;
      case 'zoominfo':
        setZoominfoApiKey(key);
        localStorage.setItem('zoominfoApiKey', key);
        break;
      case 'gratta':
        setGrattaApiKey(key);
        localStorage.setItem('grattaApiKey', key);
        break;
    }
  };


  // Enhanced contact search state
  const [contactSearchType, setContactSearchType] = useState<'people' | 'brokers' | 'investors'>('people');
  const [searchQuery, setSearchQuery] = useState('');
  const [brokerSearchCriteria, setBrokerSearchCriteria] = useState({
    industries: '',
    subindustries: '',
    location: '',
    experience: '',
    dealSize: '',
    keywords: ''
  });
  const [investorSearchCriteria, setInvestorSearchCriteria] = useState({
    industries: '',
    subindustries: '',
    location: '',
    investmentStage: '',
    checkSize: '',
    keywords: ''
  });

  // Organization enrichment handlers
  const handleOrgFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setOrgSelectedFile(file);
      setOrgResults(null);
      setShowOrgResults(false);
    }
  };

  const handleOrgFileUpload = async () => {
    if (!orgSelectedFile) {
      setMessage('Please select a file to upload');
      setShowError(true);
      return;
    }

    if (!isKeyValid) {
      setMessage(`Please configure and validate your ${selectedProvider.charAt(0).toUpperCase() + selectedProvider.slice(1)} API key first`);
      setShowError(true);
      return;
    }

    setIsOrgProcessing(true);
    try {
      const formData = new FormData();
      formData.append('file', orgSelectedFile);
      formData.append('apiKey', getCurrentApiKey());
      formData.append('provider', selectedProvider);

      const response = await fetch('http://localhost:4001/api/data-enrichment/organization-enrich', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        setOrgResults(data);
        setShowOrgResults(true);
        setMessage(`Successfully processed ${data.summary.total} organizations with ${data.summary.successRate}% success rate`);
        setShowSuccess(true);
      } else {
        setMessage(data.error || 'Failed to process file');
        setShowError(true);
      }
    } catch (error) {
      setMessage('Network error. Please try again.');
      setShowError(true);
    } finally {
      setIsOrgProcessing(false);
    }
  };

  const handleOrgDownloadResults = () => {
    if (!orgResults) return;

    const csvData = orgResults.results.map(org => ({
      'Original Company': org.original.company,
      'Original Website': org.original.website,
      'Enriched Name': org.enriched?.name || '',
      'Enriched Website': org.enriched?.website || '',
      'LinkedIn': org.enriched?.linkedin || '',
      'Phone': org.enriched?.phone || '',
      'Email': org.enriched?.email || '',
      'Industry': org.enriched?.industry || '',
      'Employee Count': org.enriched?.employeeCount || '',
      'Description': org.enriched?.description || '',
      'Headquarters': org.enriched?.headquarters || '',
      'Revenue': org.enriched?.revenue || '',
      'Founded Year': org.enriched?.foundedYear || '',
      'Status': org.success ? 'Success' : 'Failed',
      'Error': org.error || ''
    }));

    const csvContent = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).map(val => `"${val}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `organization_enrichment_results_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  // Contact enrichment handlers
  const handleContactFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setContactSelectedFile(file);
      setContactResults(null);
      setShowContactResults(false);
    }
  };

  const handleContactFileUpload = async () => {
    if (!contactSelectedFile) {
      setMessage('Please select a file to upload');
      setShowError(true);
      return;
    }

    if (!isKeyValid) {
      setMessage(`Please configure and validate your ${selectedProvider.charAt(0).toUpperCase() + selectedProvider.slice(1)} API key first`);
      setShowError(true);
      return;
    }

    setIsContactProcessing(true);
    try {
      const formData = new FormData();
      formData.append('file', contactSelectedFile);
      formData.append('apiKey', getCurrentApiKey());
      formData.append('provider', selectedProvider);

      const response = await fetch('http://localhost:4001/api/data-enrichment/contact-enrich', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        setContactResults(data);
        setShowContactResults(true);
        setMessage(`Successfully processed ${data.summary.total} contacts with ${data.summary.successRate}% success rate`);
        setShowSuccess(true);
      } else {
        setMessage(data.error || 'Failed to process file');
        setShowError(true);
      }
    } catch (error) {
      setMessage('Network error. Please try again.');
      setShowError(true);
    } finally {
      setIsContactProcessing(false);
    }
  };

  const handleContactDownloadResults = () => {
    if (!contactResults) return;

    const csvData = contactResults.results.map(contact => ({
      'Original First Name': contact.original.firstName,
      'Original Last Name': contact.original.lastName,
      'Original Email': contact.original.email,
      'Original Company': contact.original.company,
      'Original Title': contact.original.title,
      'Original Phone': contact.original.phone,
      'Enriched Name': contact.enriched?.name || '',
      'Enriched Email': contact.enriched?.email || '',
      'Enriched Phone': contact.enriched?.phone || '',
      'Enriched Title': contact.enriched?.title || '',
      'Enriched Company': contact.enriched?.company || '',
      'LinkedIn': contact.enriched?.linkedin || '',
      'Location': contact.enriched?.location || '',
      'Industry': contact.enriched?.industry || '',
      'Company Domain': contact.enriched?.companyDomain || '',
      'Twitter': contact.enriched?.twitter || '',
      'GitHub': contact.enriched?.github || '',
      'Facebook': contact.enriched?.facebook || '',
      'Status': contact.success ? 'Success' : 'Failed',
      'Error': contact.error || ''
    }));

    const csvContent = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).map(val => `"${val}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `contact_enrichment_results_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleContactSearch = async () => {
    if (!isKeyValid) {
      setMessage(`Please configure and validate your ${selectedProvider.charAt(0).toUpperCase() + selectedProvider.slice(1)} API key first`);
      setShowError(true);
      return;
    }

    // Validate criteria based on contact type
    if (contactSearchType === 'people') {
      if (!thesisCriteria.industries.trim()) {
        setMessage('Please select an industry');
        setShowError(true);
        return;
      }
    } else if (contactSearchType === 'brokers') {
      // Allow empty search query for brokers - we'll search for all brokers
      // if (!searchQuery.trim()) {
      //   setMessage('Please describe what kind of brokers you are looking for');
      //   setShowError(true);
      //   return;
      // }
    } else if (contactSearchType === 'investors') {
      // No validation needed for investors - structured form ensures valid data
    }

    setIsDiscovering(true);
    try {
      const searchPayload: any = {
        contactType: contactSearchType,
        contactsToFind,
        apolloApiKey
        //apiKey: getCurrentApiKey(),  
        //provider: selectedProvider
      };

      // Add appropriate criteria based on contact type
      if (contactSearchType === 'people') {
        searchPayload.thesisCriteria = thesisCriteria;
      } else if (contactSearchType === 'brokers') {
        searchPayload.brokerCriteria = brokerSearchCriteria;
      } else if (contactSearchType === 'investors') {
        searchPayload.investorCriteria = investorSearchCriteria;
      }

      const response = await fetch('/api/data-enrichment/search-contacts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(searchPayload)
      });

      const data = await response.json();
      
      if (data.success) {
        const contacts = data.contacts || [];
        setDiscoveredContacts(contacts);
        setDiscoveryResults(data);
        
        // Automatically save discovered contacts to the database
        if (contacts.length > 0) {
          try {
            const saveResponse = await fetch('/api/firebase/contacts/bulk-save', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token') || 'mock-token'}`
              },
              body: JSON.stringify({
                contacts: contacts,
                contactType: contactSearchType // 'people', 'broker', or 'investor'
              })
            });
            
            const saveData = await saveResponse.json();
            console.log('Bulk save response:', saveData);
            
            if (saveResponse.ok && saveData.success) {
              setMessage(`✅ Found and saved ${saveData.saved} contacts to your Contacts page!`);
            } else {
              console.error('Failed to save contacts:', saveData);
              setMessage(`Found ${contacts.length} contacts, but failed to save them: ${saveData.error || 'Unknown error'}`);
            }
          } catch (saveError) {
            console.error('Error auto-saving contacts:', saveError);
            setMessage(`Found ${contacts.length} contacts, but failed to auto-save them. Check console for details.`);
          }
        } else {
          setMessage('No contacts found matching your criteria');
        }
        
        setShowSuccess(true);
      } else {
        setMessage(data.error || 'Failed to discover contacts');
        setShowError(true);
      }
    } catch (error) {
      setMessage('Failed to discover contacts. Please try again.');
      setShowError(true);
    } finally {
      setIsDiscovering(false);
    }
  };

  const handleDownloadSearchResults = async () => {
    if (!discoveredContacts.length) {
      setMessage('No contacts to download');
      setShowError(true);
      return;
    }

    try {
      const response = await fetch('http://localhost:4001/api/data-enrichment/download-search-results', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contacts: discoveredContacts,
          thesisCriteria
        })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `apollo-contacts-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        setMessage('Contacts downloaded successfully!');
        setShowSuccess(true);
      } else {
        setMessage('Failed to download contacts');
        setShowError(true);
      }
    } catch (error) {
      console.error('Download error:', error);
      setMessage('Failed to download contacts');
      setShowError(true);
    }
  };

  const handleThesisCriteriaChange = (field: keyof ThesisCriteria, value: string) => {
    const newCriteria = {
      ...thesisCriteria,
      [field]: value
    };
    setThesisCriteria(newCriteria);
    
    // Auto-save to localStorage as user types
    localStorage.setItem('thesisCriteria', JSON.stringify(newCriteria));
  };

  const handleSaveThesis = async () => {
    setIsSaving(true);
    try {
      // Save to localStorage
      localStorage.setItem('thesisCriteria', JSON.stringify(thesisCriteria));
      
      // Also save to backend for persistence across devices
      const response = await fetch('http://localhost:4001/api/data-enrichment/save-thesis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          thesisCriteria,
          userId: 'current-user' // You can replace this with actual user ID
        })
      });

      if (response.ok) {
        setMessage('Thesis criteria saved successfully!');
        setShowSuccess(true);
      } else {
        setMessage('Thesis criteria saved locally, but failed to sync to server');
        setShowSuccess(true);
      }
    } catch (error) {
      // Still save locally even if server fails
      localStorage.setItem('thesisCriteria', JSON.stringify(thesisCriteria));
      setMessage('Thesis criteria saved locally');
      setShowSuccess(true);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLoadThesis = () => {
    const saved = localStorage.getItem('thesisCriteria');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setThesisCriteria(parsed);
        setMessage('Thesis criteria loaded from saved data');
        setShowSuccess(true);
      } catch (error) {
        setMessage('Failed to load saved thesis criteria');
        setShowError(true);
      }
    } else {
      setMessage('No saved thesis criteria found');
      setShowError(true);
    }
  };

  const handleApiKeySubmit = async () => {
    const currentApiKey = getCurrentApiKey();
    if (!currentApiKey.trim()) {
      setMessage(`Please enter your ${selectedProvider.charAt(0).toUpperCase() + selectedProvider.slice(1)} API key`);
      setShowError(true);
      return;
    }

    setIsValidatingKey(true);
    console.log('Starting API key validation...');

    try {
      const url = 'http://localhost:4001/api/data-enrichment/validate-key';
      console.log('Sending request to:', url);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          apiKey: currentApiKey,
          provider: selectedProvider
        })
      });

      console.log('Response received:', response.status, response.statusText);

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Response data:', data);
      
      if (data.success && data.valid) {
        setIsKeyValid(true);
        localStorage.setItem('isKeyValid', 'true');
        localStorage.setItem('selectedProvider', selectedProvider);
        setMessage(`${selectedProvider.charAt(0).toUpperCase() + selectedProvider.slice(1)} API key is valid and ready to use!`);
        setShowSuccess(true);
        setShowApiKeyDialog(false);
      } else {
        setIsKeyValid(false);
        localStorage.setItem('isKeyValid', 'false');
        const providerName = selectedProvider.charAt(0).toUpperCase() + selectedProvider.slice(1);
        setMessage(`Invalid ${providerName} API key. Please check your API key and permissions.`);
        setShowError(true);
      }
    } catch (error: any) {
      setIsKeyValid(false);
      localStorage.setItem('isKeyValid', 'false');
      console.error('API key validation error:', error);
      console.error('Error details:', {
        message: error.message,
        name: error.name,
        stack: error.stack
      });
      setMessage(`Failed to validate API key: ${error.message || 'Network error - check if server is running on port 4001'}`);
      setShowError(true);
    } finally {
      setIsValidatingKey(false);
    }
  };

  const handleFileSelect = (file: File) => {
    if (file) {
      setSelectedFile(file);
      setResults(null);
      setShowResults(false);
    }
  };

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const file = files[0];
    
    if (file && (file.type.includes('sheet') || file.type.includes('csv') || file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.name.endsWith('.csv'))) {
      handleFileSelect(file);
    } else {
      setMessage('Please upload an Excel file (.xlsx, .xls) or CSV file');
      setShowError(true);
    }
  }, []);

  const handleFileUpload = async () => {
    if (!selectedFile) {
      setMessage('Please select a file to upload');
      setShowError(true);
      return;
    }

    if (!isKeyValid) {
      setMessage(`Please configure and validate your ${selectedProvider.charAt(0).toUpperCase() + selectedProvider.slice(1)} API key first`);
      setShowError(true);
      return;
    }

    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('apiKey', getCurrentApiKey());
      formData.append('provider', selectedProvider);

      const response = await fetch('http://localhost:4001/api/data-enrichment/upload-and-enrich', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        setResults(data);
        setShowResults(true);
        setMessage(`Successfully processed ${data.summary.total} contacts with ${data.summary.successRate}% success rate`);
        setShowSuccess(true);
      } else {
        setMessage(data.error || 'Failed to process file');
        setShowError(true);
      }
    } catch (error) {
      setMessage('Network error. Please try again.');
      setShowError(true);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadResults = async () => {
    if (!results) return;

    try {
      setIsProcessing(true);
      
      // Generate enriched CSV in original format
      const response = await fetch('http://localhost:4001/api/data-enrichment/generate-csv', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          results: results.results,
          originalHeaders: ['Given', 'Company', 'To be populated', 'To be populated_1', 'To be populated_2']
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate CSV');
      }

      // Download the file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `apollo-enriched-contacts-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      setMessage('Enriched CSV file downloaded successfully!');
      setShowSuccess(true);
    } catch (error) {
      console.error('Download error:', error);
      setMessage('Failed to download enriched CSV file');
      setShowError(true);
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusIcon = (success: boolean) => {
    return success ? (
      <CheckCircleIcon sx={{ color: 'success.main', fontSize: 20 }} />
    ) : (
      <ErrorIcon sx={{ color: 'error.main', fontSize: 20 }} />
    );
  };

  return (
    <Box>
      {/* Hero Section */}
      <Box sx={{
        position: 'relative',
        bgcolor: 'white',
        borderRadius: '0 0 32px 32px',
        overflow: 'hidden',
        mb: 6,
        boxShadow: '0 8px 32px rgba(15, 23, 42, 0.08)'
      }}>
        {/* Background Pattern */}
        <Box sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.02) 0%, rgba(220, 38, 38, 0.05) 100%)',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: -50,
            right: -50,
            width: 100,
            height: 100,
            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            borderRadius: '50%',
            opacity: 0.1
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            bottom: -30,
            left: -30,
            width: 60,
            height: 60,
            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            borderRadius: 2,
            opacity: 0.1,
            transform: 'rotate(15deg)'
          }
        }} />

        <Box sx={{ position: 'relative', zIndex: 2, px: 4, py: 6 }}>

        <Grid container spacing={4} alignItems="center">
          <Grid item xs={12} md={8}>
            <Box sx={{ position: 'relative', zIndex: 2 }}>
              <Typography 
                variant="h3" 
                sx={{ 
                  fontWeight: 700, 
                  mb: 2, 
                  color: '#1e293b',
                  fontSize: { xs: '2.2rem', md: '3rem' },
                  lineHeight: 1.1,
                  letterSpacing: '-0.02em',
                  fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                  textTransform: 'uppercase',
                  background: 'linear-gradient(135deg, #1e293b 0%, #475569 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}
              >
                Data Management
              </Typography>
              <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: 500, 
                  mb: 3, 
                  color: '#475569',
                  fontSize: '1.1rem',
                  lineHeight: 1.5,
                  fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                }}
              >
                Enrich and discover contact data using advanced APIs to build comprehensive prospect databases.
              </Typography>
              <Typography 
                variant="body1" 
                sx={{ 
                  color: '#64748b',
                  mb: 4,
                  maxWidth: '600px',
                  lineHeight: 1.6,
                  fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                }}
              >
                Upload Excel files to enrich contact data, discover new prospects, and build comprehensive databases for your investment thesis and outreach campaigns.
              </Typography>
              
              {/* Action Buttons */}
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<DataUsageIcon />}
                  onClick={() => setShowApiKeyDialog(true)}
                  sx={{
                    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                    color: 'white',
                    px: 4,
                    py: 1.5,
                    borderRadius: 2,
                    fontSize: '1rem',
                    fontWeight: 600,
                    textTransform: 'none',
                    boxShadow: '0 4px 14px rgba(239, 68, 68, 0.3)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                      boxShadow: '0 6px 20px rgba(239, 68, 68, 0.4)',
                      transform: 'translateY(-2px)'
                    },
                    transition: 'all 0.3s ease'
                  }}
                >
                  {isKeyValid ? 'API Configured' : 'Configure API'}
                </Button>
              </Box>
            </Box>
          </Grid>
          
          {/* Right Side - Visual Elements */}
          <Grid item xs={12} md={4}>
            <Box sx={{ 
              position: 'relative', 
              height: 300, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              zIndex: 2
            }}>
              {/* Data Visualization Mockup */}
              <Box sx={{
                width: 200,
                height: 200,
                background: 'white',
                borderRadius: 3,
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
                p: 3,
                position: 'relative',
                overflow: 'hidden'
              }}>
                {/* Chart Bars */}
                <Box sx={{ display: 'flex', alignItems: 'end', gap: 1, height: 120, mb: 2 }}>
                  <Box sx={{ width: 20, height: 60, background: '#ef4444', borderRadius: 1 }} />
                  <Box sx={{ width: 20, height: 80, background: '#dc2626', borderRadius: 1 }} />
                  <Box sx={{ width: 20, height: 40, background: '#ef4444', borderRadius: 1 }} />
                  <Box sx={{ width: 20, height: 100, background: '#dc2626', borderRadius: 1 }} />
                  <Box sx={{ width: 20, height: 70, background: '#ef4444', borderRadius: 1 }} />
                </Box>
                
                {/* Data Points */}
                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                  <Box sx={{ width: 8, height: 8, background: '#ef4444', borderRadius: '50%' }} />
                  <Box sx={{ width: 8, height: 8, background: '#dc2626', borderRadius: '50%' }} />
                  <Box sx={{ width: 8, height: 8, background: '#ef4444', borderRadius: '50%' }} />
                </Box>
                
                {/* Floating Elements */}
                <Box sx={{
                  position: 'absolute',
                  top: 10,
                  right: 10,
                  width: 12,
                  height: 12,
                  background: '#ef4444',
                  borderRadius: '50%',
                  opacity: 0.7
                }} />
                <Box sx={{
                  position: 'absolute',
                  bottom: 20,
                  left: 20,
                  width: 8,
                  height: 8,
                  background: '#dc2626',
                  borderRadius: 1,
                  opacity: 0.6
                }} />
              </Box>
              
              {/* Floating Data Icons */}
              <Box sx={{
                position: 'absolute',
                top: 20,
                left: 20,
                width: 40,
                height: 40,
                background: 'rgba(239, 68, 68, 0.1)',
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transform: 'rotate(-15deg)'
              }}>
                <DataUsageIcon sx={{ color: '#ef4444', fontSize: 20 }} />
              </Box>
              
              <Box sx={{
                position: 'absolute',
                bottom: 40,
                right: 30,
                width: 35,
                height: 35,
                background: 'rgba(220, 38, 38, 0.1)',
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transform: 'rotate(20deg)'
              }}>
                <CloudUploadIcon sx={{ color: '#dc2626', fontSize: 18 }} />
              </Box>
            </Box>
          </Grid>
        </Grid>
        </Box>
      </Box>

          {/* Modern Integrated Switch with Sub-options */}
          <Box sx={{ mb: 4, display: 'flex', justifyContent: 'center' }}>
            <Paper 
              sx={{ 
                display: 'flex', 
                borderRadius: 3, 
                overflow: 'hidden',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                border: '1px solid #e5e7eb',
                position: 'relative',
                background: '#ffffff'
              }}
            >
              {/* Sliding Background Indicator */}
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  height: '100%',
                  width: '33.333%',
                  background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                  borderRadius: 3,
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  transform: activeMainTab === 0 && activeSubTab === 0 
                    ? 'translateX(0%)' 
                    : activeMainTab === 0 && activeSubTab === 1 
                    ? 'translateX(100%)' 
                    : 'translateX(200%)',
                  zIndex: 0,
                  boxShadow: '0 2px 8px rgba(239, 68, 68, 0.3)'
                }}
              />

              {/* Enrich Contacts */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 1,
                  px: 3,
                  py: 2,
                  cursor: 'pointer',
                  background: 'transparent',
                  color: activeMainTab === 0 && activeSubTab === 0 ? 'white' : '#6b7280',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  position: 'relative',
                  zIndex: 1,
                  flex: 1,
                  '&:hover': {
                    color: activeMainTab === 0 && activeSubTab === 0 ? 'white' : '#374151',
                    transform: 'translateY(-1px)'
                  }
                }}
                onClick={() => { setActiveMainTab(0); setActiveSubTab(0); }}
              >
                <PersonIcon sx={{ fontSize: 20 }} />
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    letterSpacing: '-0.01em',
                    whiteSpace: 'nowrap',
                    textAlign: 'center'
                  }}
                >
                  Enrich Contacts
                </Typography>
              </Box>

              {/* Enrich Organizations */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 1,
                  px: 3,
                  py: 2,
                  cursor: 'pointer',
                  background: 'transparent',
                  color: activeMainTab === 0 && activeSubTab === 1 ? 'white' : '#6b7280',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  position: 'relative',
                  zIndex: 1,
                  flex: 1,
                  '&:hover': {
                    color: activeMainTab === 0 && activeSubTab === 1 ? 'white' : '#374151',
                    transform: 'translateY(-1px)'
                  }
                }}
                onClick={() => { setActiveMainTab(0); setActiveSubTab(1); }}
              >
                <BusinessIcon sx={{ fontSize: 20 }} />
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    letterSpacing: '-0.01em',
                    whiteSpace: 'nowrap',
                    textAlign: 'center'
                  }}
                >
                  Enrich Organizations
                </Typography>
              </Box>

              {/* Find Contacts - Main Option */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 1,
                  px: 3,
                  py: 2,
                  cursor: 'pointer',
                  background: 'transparent',
                  color: activeMainTab === 1 && activeSubTab === 0 ? 'white' : '#6b7280',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  position: 'relative',
                  zIndex: 1,
                  flex: 1,
                  '&:hover': {
                    color: activeMainTab === 1 && activeSubTab === 0 ? 'white' : '#374151',
                    transform: 'translateY(-1px)'
                  }
                }}
                onClick={() => { setActiveMainTab(1); setActiveSubTab(0); }}
              >
                <SearchIcon sx={{ fontSize: 20 }} />
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    letterSpacing: '-0.01em',
                    whiteSpace: 'nowrap',
                    textAlign: 'center'
                  }}
                >
                  Find Contacts
                </Typography>
              </Box>
            </Paper>
          </Box>

          {/* Contact Type Filter - Only show when Find Contacts is active */}
          {activeMainTab === 1 && activeSubTab === 0 && (
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'center' }}>
              <Paper 
                sx={{ 
                  display: 'flex', 
                  borderRadius: 2, 
                  overflow: 'hidden',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                  border: '1px solid #e5e7eb',
                  bgcolor: '#f8fafc',
                  position: 'relative'
                }}
              >
                {/* Sub-filter Sliding Indicator */}
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    height: '100%',
                    width: '33.333%',
                    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                    borderRadius: 2,
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    transform: contactSearchType === 'people' 
                      ? 'translateX(0%)' 
                      : contactSearchType === 'brokers' 
                      ? 'translateX(100%)' 
                      : 'translateX(200%)',
                    zIndex: 0,
                    boxShadow: '0 1px 4px rgba(239, 68, 68, 0.3)'
                  }}
                />
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 1,
                    px: 2,
                    py: 1.5,
                    cursor: 'pointer',
                    background: 'transparent',
                    color: contactSearchType === 'people' ? 'white' : '#6b7280',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    position: 'relative',
                    zIndex: 1,
                    flex: 1,
                    '&:hover': {
                      color: contactSearchType === 'people' ? 'white' : '#374151',
                      transform: 'translateY(-1px)'
                    }
                  }}
                  onClick={() => setContactSearchType('people')}
                >
                  <PersonIcon sx={{ fontSize: 16 }} />
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      fontWeight: 600,
                      fontSize: '0.8rem',
                      fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                      letterSpacing: '-0.01em'
                    }}
                  >
                    People
                  </Typography>
                </Box>

                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 1,
                    px: 2,
                    py: 1.5,
                    cursor: 'pointer',
                    background: 'transparent',
                    color: contactSearchType === 'brokers' ? 'white' : '#6b7280',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    position: 'relative',
                    zIndex: 1,
                    flex: 1,
                    '&:hover': {
                      color: contactSearchType === 'brokers' ? 'white' : '#374151',
                      transform: 'translateY(-1px)'
                    }
                  }}
                  onClick={() => setContactSearchType('brokers')}
                >
                  <BusinessIcon sx={{ fontSize: 16 }} />
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      fontWeight: 600,
                      fontSize: '0.8rem',
                      fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                      letterSpacing: '-0.01em'
                    }}
                  >
                    Brokers
                  </Typography>
                </Box>

                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 1,
                    px: 2,
                    py: 1.5,
                    cursor: 'pointer',
                    background: 'transparent',
                    color: contactSearchType === 'investors' ? 'white' : '#6b7280',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    position: 'relative',
                    zIndex: 1,
                    flex: 1,
                    '&:hover': {
                      color: contactSearchType === 'investors' ? 'white' : '#374151',
                      transform: 'translateY(-1px)'
                    }
                  }}
                  onClick={() => setContactSearchType('investors')}
                >
                  <AccountBalanceIcon sx={{ fontSize: 16 }} />
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      fontWeight: 600,
                      fontSize: '0.8rem',
                      fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                      letterSpacing: '-0.01em'
                    }}
                  >
                    Investors
                  </Typography>
                </Box>
              </Paper>
            </Box>
          )}

      {/* Success/Error Alerts */}
      <Snackbar
        open={showSuccess}
        autoHideDuration={6000}
        onClose={() => setShowSuccess(false)}
      >
        <Alert severity="success" onClose={() => setShowSuccess(false)}>
          {message}
        </Alert>
      </Snackbar>

      <Snackbar
        open={showError}
        autoHideDuration={6000}
        onClose={() => setShowError(false)}
      >
        <Alert severity="error" onClose={() => setShowError(false)}>
          {message}
        </Alert>
      </Snackbar>


      {/* Organization Enrichment Tab */}
      {activeMainTab === 0 && activeSubTab === 1 && (
        <Grid container spacing={3}>
          {/* Upload Section */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 4 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
                Organization Enrichment
              </Typography>

              {/* File Upload Area */}
              <Box
                sx={{
                  border: '2px dashed',
                  borderColor: isDragOver ? 'primary.main' : 'grey.300',
                  borderRadius: 2,
                  p: 4,
                  textAlign: 'center',
                  bgcolor: isDragOver ? 'action.hover' : 'background.paper',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    borderColor: 'primary.main',
                    bgcolor: 'action.hover',
                  },
                }}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => orgFileInputRef.current?.click()}
              >
                <CloudUploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                <Typography variant="h6" sx={{ mb: 1, fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
                  {orgSelectedFile ? orgSelectedFile.name : 'Drop your Excel file here or click to browse'}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
                  Supports .xlsx, .xls, and .csv files
                </Typography>
                <input
                  ref={orgFileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleOrgFileSelect}
                  style={{ display: 'none' }}
                />
              </Box>

              {/* File Info */}
              {orgSelectedFile && (
                <Box sx={{ mt: 2, p: 2, bgcolor: 'success.light', borderRadius: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CheckCircleIcon sx={{ color: '#ef4444' }} />
                    <Typography variant="body2" sx={{ 
                      fontWeight: 500,
                      fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                      letterSpacing: '-0.01em'
                    }}>
                      File selected: {orgSelectedFile.name}
                    </Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{
                    fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    letterSpacing: '-0.01em'
                  }}>
                    Size: {(orgSelectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </Typography>
                </Box>
              )}

              {/* Upload Button */}
              <Button
                variant="contained"
                onClick={handleOrgFileUpload}
                disabled={!orgSelectedFile || isOrgProcessing}
                startIcon={isOrgProcessing ? <CircularProgress size={20} /> : <CloudUploadIcon />}
                sx={{ mt: 3, width: '100%' }}
              >
                {isOrgProcessing ? 'Processing...' : 'Enrich Organizations'}
              </Button>

              {/* Progress Bar */}
              {isOrgProcessing && (
                <Box sx={{ mt: 2 }}>
                  <LinearProgress />
                  <Typography variant="caption" color="text.secondary" sx={{ 
                    mt: 1, 
                    display: 'block',
                    fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    letterSpacing: '-0.01em'
                  }}>
                    Enriching organization data... This may take a few minutes.
                  </Typography>
                </Box>
              )}
            </Paper>
          </Grid>

          {/* Results Section */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 4 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
                  Enrichment Results
                </Typography>
                {orgResults && (
                  <Button
                    variant="outlined"
                    startIcon={<DownloadIcon />}
                    onClick={handleOrgDownloadResults}
                    size="small"
                  >
                    Download CSV
                  </Button>
                )}
              </Box>

              {showOrgResults && orgResults ? (
                <Box>
                  {/* Summary Stats */}
                  <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={6}>
                      <Card sx={{ textAlign: 'center', bgcolor: 'primary.light' }}>
                        <CardContent sx={{ py: 2 }}>
                          <Typography variant="h4" sx={{ fontWeight: 600, color: 'primary.main', fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
                            {orgResults.summary.total}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
                            Total Organizations
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={6}>
                      <Card sx={{ textAlign: 'center', bgcolor: 'success.light' }}>
                        <CardContent sx={{ py: 2 }}>
                          <Typography variant="h4" sx={{ fontWeight: 600, color: 'success.main', fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
                            {orgResults.summary.successRate}%
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
                            Success Rate
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>

                  {/* Results Table */}
                  <TableContainer sx={{ maxHeight: 400 }}>
                    <Table stickyHeader>
                      <TableHead>
                        <TableRow>
                          <TableCell>Company</TableCell>
                          <TableCell>Website</TableCell>
                          <TableCell>LinkedIn</TableCell>
                          <TableCell>Phone</TableCell>
                          <TableCell>Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {orgResults.results.slice(0, 10).map((org, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              <Box>
                                <Typography variant="body2" sx={{
                                  fontWeight: 500,
                                  fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                                  letterSpacing: '-0.01em'
                                }}>
                                  {org.enriched?.name || org.original.company}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" sx={{
                                  fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                                  letterSpacing: '-0.01em'
                                }}>
                                  {org.original.company}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell>
                              {org.enriched?.website ? (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  <BusinessIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                                  <Typography variant="body2" sx={{ 
                                    maxWidth: 150, 
                                    overflow: 'hidden', 
                                    textOverflow: 'ellipsis',
                                    fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                                    letterSpacing: '-0.01em'
                                  }}>
                                    {org.enriched.website}
                                  </Typography>
                                </Box>
                              ) : (
                                <Typography variant="body2" color="text.secondary" sx={{
                                  fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                                  letterSpacing: '-0.01em'
                                }}>
                                  No website
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell>
                              {org.enriched?.linkedin ? (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  <LinkedInIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                                  <Typography variant="body2" sx={{
                                    fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                                    letterSpacing: '-0.01em'
                                  }}>LinkedIn</Typography>
                                </Box>
                              ) : (
                                <Typography variant="body2" color="text.secondary" sx={{
                                  fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                                  letterSpacing: '-0.01em'
                                }}>
                                  No LinkedIn
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell>
                              {org.enriched?.phone ? (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  <PhoneIcon sx={{ fontSize: 16, color: 'success.main' }} />
                                  <Typography variant="body2" sx={{
                                    fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                                    letterSpacing: '-0.01em'
                                  }}>{org.enriched.phone}</Typography>
                                </Box>
                              ) : (
                                <Typography variant="body2" color="text.secondary" sx={{
                                  fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                                  letterSpacing: '-0.01em'
                                }}>
                                  No phone
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell>
                <Chip 
                                label={org.success ? 'Success' : 'Failed'}
                                color={org.success ? 'success' : 'error'}
                  size="small" 
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>

                  {orgResults.results.length > 10 && (
                    <Typography variant="caption" color="text.secondary" sx={{ 
                      mt: 2, 
                      display: 'block',
                      fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                      letterSpacing: '-0.01em'
                    }}>
                      Showing first 10 results. Download CSV for complete data.
                    </Typography>
                  )}
                </Box>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <BusinessIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="body1" color="text.secondary" sx={{
                    fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    letterSpacing: '-0.01em'
                  }}>
                    Upload an Excel file to start enriching organization data
                  </Typography>
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Contact Enrichment Tab */}
      {activeMainTab === 0 && activeSubTab === 0 && (
        <Grid container spacing={3}>
          {/* Upload Section */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 4 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
                Contact Enrichment
              </Typography>

              {/* File Upload Area */}
              <Box
                sx={{
                  border: '2px dashed',
                  borderColor: isDragOver ? 'primary.main' : 'grey.300',
                  borderRadius: 2,
                  p: 4,
                  textAlign: 'center',
                  bgcolor: isDragOver ? 'action.hover' : 'background.paper',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    borderColor: 'primary.main',
                    bgcolor: 'action.hover',
                  },
                }}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => contactFileInputRef.current?.click()}
              >
                <CloudUploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                <Typography variant="h6" sx={{ mb: 1 }}>
                  {contactSelectedFile ? contactSelectedFile.name : 'Drop your Excel file here or click to browse'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Supports .xlsx, .xls, and .csv files
                </Typography>
                <input
                  ref={contactFileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleContactFileSelect}
                  style={{ display: 'none' }}
                />
              </Box>

              {/* File Info */}
              {contactSelectedFile && (
                <Box sx={{ mt: 2, p: 2, bgcolor: 'success.light', borderRadius: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CheckCircleIcon sx={{ color: '#ef4444' }} />
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      File selected: {contactSelectedFile.name}
                    </Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    Size: {(contactSelectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </Typography>
                </Box>
              )}

              {/* Upload Button */}
              <Button
                variant="contained"
                onClick={handleContactFileUpload}
                disabled={!contactSelectedFile || isContactProcessing}
                startIcon={isContactProcessing ? <CircularProgress size={20} /> : <CloudUploadIcon />}
                sx={{ mt: 3, width: '100%' }}
              >
                {isContactProcessing ? 'Processing...' : 'Enrich Contacts'}
              </Button>

              {/* Progress Bar */}
              {isContactProcessing && (
                <Box sx={{ mt: 2 }}>
                  <LinearProgress />
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    Enriching contact data... This may take a few minutes.
                  </Typography>
                </Box>
              )}
            </Paper>
          </Grid>

          {/* Results Section */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 4 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
                  Enrichment Results
                </Typography>
                {contactResults && (
                  <Button
                  variant="outlined"
                    startIcon={<DownloadIcon />}
                    onClick={handleContactDownloadResults}
                    size="small"
                  >
                    Download CSV
                  </Button>
                )}
              </Box>

              {showContactResults && contactResults ? (
                <Box>
                  {/* Summary Stats */}
                  <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={6}>
                      <Card sx={{ textAlign: 'center', bgcolor: 'primary.light' }}>
                        <CardContent sx={{ py: 2 }}>
                          <Typography variant="h4" sx={{ fontWeight: 600, color: 'primary.main' }}>
                            {contactResults.summary.total}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Total Contacts
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={6}>
                      <Card sx={{ textAlign: 'center', bgcolor: 'success.light' }}>
                        <CardContent sx={{ py: 2 }}>
                          <Typography variant="h4" sx={{ fontWeight: 600, color: 'success.main' }}>
                            {contactResults.summary.successRate}%
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Success Rate
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>

                  {/* Results Table */}
                  <TableContainer sx={{ maxHeight: 400 }}>
                    <Table stickyHeader>
                      <TableHead>
                        <TableRow>
                          <TableCell>Contact</TableCell>
                          <TableCell>Email</TableCell>
                          <TableCell>Phone</TableCell>
                          <TableCell>LinkedIn</TableCell>
                          <TableCell>Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {contactResults.results.slice(0, 10).map((contact, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              <Box>
                                <Typography variant="body2" fontWeight={500}>
                                  {contact.enriched?.name || `${contact.original.firstName} ${contact.original.lastName}`}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {contact.original.company}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell>
                              {contact.enriched?.email ? (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  <EmailIcon sx={{ fontSize: 16, color: 'success.main' }} />
                                  <Typography variant="body2">{contact.enriched.email}</Typography>
                                </Box>
                              ) : (
                                <Typography variant="body2" color="text.secondary">
                                  No email
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell>
                              {contact.enriched?.phone ? (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  <PhoneIcon sx={{ fontSize: 16, color: 'success.main' }} />
                                  <Typography variant="body2">{contact.enriched.phone}</Typography>
                                </Box>
                              ) : (
                                <Typography variant="body2" color="text.secondary" sx={{
                                  fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                                  letterSpacing: '-0.01em'
                                }}>
                                  No phone
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell>
                              {contact.enriched?.linkedin ? (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  <LinkedInIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                                  <Typography variant="body2" sx={{
                                    fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                                    letterSpacing: '-0.01em'
                                  }}>LinkedIn</Typography>
                                </Box>
                              ) : (
                                <Typography variant="body2" color="text.secondary" sx={{
                                  fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                                  letterSpacing: '-0.01em'
                                }}>
                                  No LinkedIn
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={contact.success ? 'Success' : 'Failed'}
                                color={contact.success ? 'success' : 'error'}
                                size="small"
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>

                  {contactResults.results.length > 10 && (
                    <Typography variant="caption" color="text.secondary" sx={{ 
                      mt: 2, 
                      display: 'block',
                      fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                      letterSpacing: '-0.01em'
                    }}>
                      Showing first 10 results. Download CSV for complete data.
                    </Typography>
                  )}
              </Box>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <PersonIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="body1" color="text.secondary">
                    Upload an Excel file to start enriching contact data
                  </Typography>
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>
      )}


          {/* Contact Search Tab */}
          {activeMainTab === 1 && activeSubTab === 0 && (
        <Grid container spacing={3}>
          {/* Search Criteria Form */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 4 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
                  Contact Search Criteria
                </Typography>
                <Chip 
                  label="Auto-saved locally" 
                  color="success" 
                  size="small" 
                  variant="outlined"
                />
              </Box>
              {/* People at Companies Form */}
              {contactSearchType === 'people' && (
                <>
                </>
              )}

              {/* Brokers Form */}
              {contactSearchType === 'brokers' && (
                <>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3, fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
                    Find brokers who have connections and experience in your target industries.
                  </Typography>
                </>
              )}

              {/* Investors Form */}
              {contactSearchType === 'investors' && (
                <>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3, fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
                    Find investors who invest in your target industries and match your investment criteria.
                  </Typography>
                </>
              )}

              {/* People at Companies Form Fields */}
              {contactSearchType === 'people' && (
                <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <FormControl fullWidth required>
                      <InputLabel>Industry *</InputLabel>
                      <Select
                        value={thesisCriteria.industries}
                        onChange={(e) => handleThesisCriteriaChange('industries', e.target.value)}
                        label="Industry *"
                      >
                        <MenuItem value="">Select an industry</MenuItem>
                      
                      {/* Healthcare */}
                      <MenuItem value="Hospital & Health Care">Hospital & Health Care</MenuItem>
                      <MenuItem value="Healthcare SaaS">Healthcare SaaS</MenuItem>
                      <MenuItem value="Medical Devices">Medical Devices</MenuItem>
                      <MenuItem value="Biotechnology">Biotechnology</MenuItem>
                      <MenuItem value="Pharmaceuticals">Pharmaceuticals</MenuItem>
                      <MenuItem value="Mental Health Care">Mental Health Care</MenuItem>
                      <MenuItem value="Health Wellness and Fitness">Health Wellness and Fitness</MenuItem>
                      
                      {/* Technology */}
                      <MenuItem value="Information Technology and Services">Information Technology and Services</MenuItem>
                      <MenuItem value="Computer Software">Computer Software</MenuItem>
                      <MenuItem value="SaaS">SaaS</MenuItem>
                      <MenuItem value="Internet">Internet</MenuItem>
                      <MenuItem value="Telecommunications">Telecommunications</MenuItem>
                      <MenuItem value="Computer Hardware">Computer Hardware</MenuItem>
                      <MenuItem value="Computer Networking">Computer Networking</MenuItem>
                      <MenuItem value="Cybersecurity">Cybersecurity</MenuItem>
                      <MenuItem value="Artificial Intelligence">Artificial Intelligence</MenuItem>
                      
                      {/* Financial Services */}
                      <MenuItem value="Financial Services">Financial Services</MenuItem>
                      <MenuItem value="Banking">Banking</MenuItem>
                      <MenuItem value="Investment Banking">Investment Banking</MenuItem>
                      <MenuItem value="Investment Management">Investment Management</MenuItem>
                      <MenuItem value="Venture Capital & Private Equity">Venture Capital & Private Equity</MenuItem>
                      <MenuItem value="Insurance">Insurance</MenuItem>
                      <MenuItem value="Fintech">Fintech</MenuItem>
                      <MenuItem value="Accounting">Accounting</MenuItem>
                      <MenuItem value="Accounting SaaS">Accounting SaaS</MenuItem>
                      
                      {/* Real Estate */}
                      <MenuItem value="Real Estate">Real Estate</MenuItem>
                      <MenuItem value="Commercial Real Estate">Commercial Real Estate</MenuItem>
                      <MenuItem value="Real Estate Technology">Real Estate Technology</MenuItem>
                      <MenuItem value="Construction">Construction</MenuItem>
                      <MenuItem value="Architecture & Planning">Architecture & Planning</MenuItem>
                      
                      {/* Manufacturing & Industrial */}
                      <MenuItem value="Manufacturing">Manufacturing</MenuItem>
                      <MenuItem value="Industrial Automation">Industrial Automation</MenuItem>
                      <MenuItem value="Automotive">Automotive</MenuItem>
                      <MenuItem value="Aviation & Aerospace">Aviation & Aerospace</MenuItem>
                      <MenuItem value="Mechanical or Industrial Engineering">Mechanical or Industrial Engineering</MenuItem>
                      
                      {/* Consumer & Retail */}
                      <MenuItem value="Retail">Retail</MenuItem>
                      <MenuItem value="E-commerce">E-commerce</MenuItem>
                      <MenuItem value="Consumer Goods">Consumer Goods</MenuItem>
                      <MenuItem value="Food & Beverages">Food & Beverages</MenuItem>
                      <MenuItem value="Restaurants">Restaurants</MenuItem>
                      <MenuItem value="Apparel & Fashion">Apparel & Fashion</MenuItem>
                      
                      {/* Professional Services */}
                      <MenuItem value="Management Consulting">Management Consulting</MenuItem>
                      <MenuItem value="Marketing and Advertising">Marketing and Advertising</MenuItem>
                      <MenuItem value="Public Relations and Communications">Public Relations and Communications</MenuItem>
                      <MenuItem value="Legal Services">Legal Services</MenuItem>
                      <MenuItem value="Human Resources">Human Resources</MenuItem>
                      
                      {/* Education & Research */}
                      <MenuItem value="Education">Education</MenuItem>
                      <MenuItem value="E-Learning">E-Learning</MenuItem>
                      <MenuItem value="Research">Research</MenuItem>
                      <MenuItem value="Higher Education">Higher Education</MenuItem>
                      
                      {/* Energy & Utilities */}
                      <MenuItem value="Oil & Energy">Oil & Energy</MenuItem>
                      <MenuItem value="Renewables & Environment">Renewables & Environment</MenuItem>
                      <MenuItem value="Utilities">Utilities</MenuItem>
                      
                      {/* Media & Entertainment */}
                      <MenuItem value="Media Production">Media Production</MenuItem>
                      <MenuItem value="Entertainment">Entertainment</MenuItem>
                      <MenuItem value="Publishing">Publishing</MenuItem>
                      <MenuItem value="Broadcast Media">Broadcast Media</MenuItem>
                      <MenuItem value="Gaming">Gaming</MenuItem>
                      
                      {/* Transportation & Logistics */}
                      <MenuItem value="Transportation/Trucking/Railroad">Transportation/Trucking/Railroad</MenuItem>
                      <MenuItem value="Logistics and Supply Chain">Logistics and Supply Chain</MenuItem>
                      <MenuItem value="Warehousing">Warehousing</MenuItem>
                      
                      {/* Other */}
                      <MenuItem value="Nonprofit Organization Management">Nonprofit Organization Management</MenuItem>
                      <MenuItem value="Government Administration">Government Administration</MenuItem>
                      <MenuItem value="Sports">Sports</MenuItem>
                      <MenuItem value="Hospitality">Hospitality</MenuItem>
                    </Select>
                    </FormControl>
                    <Tooltip title="The industry or sector the company operates in. Apollo searches company profiles and keywords to match this.">
                      <IconButton size="small">
                        <InfoIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Grid>

                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TextField
                      fullWidth
                      label="Location"
                      placeholder="e.g., California, New York, Texas"
                      value={thesisCriteria.location}
                      onChange={(e) => handleThesisCriteriaChange('location', e.target.value)}
                    />
                    <Tooltip title="Geographic location where the company is headquartered or has offices. Can indicate: market focus, talent access, regulatory environment, and cost structure.">
                      <IconButton size="small">
                        <InfoIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Grid>

                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <FormControl fullWidth>
                      <InputLabel>Company Size (Employees)</InputLabel>
                      <Select
                        value={thesisCriteria.companySizeRange}
                        onChange={(e) => handleThesisCriteriaChange('companySizeRange', e.target.value)}
                        label="Company Size (Employees)"
                      >
                        <MenuItem value="">Any Size</MenuItem>
                        <MenuItem value="1,10">1-10 employees (Seed/Startup)</MenuItem>
                        <MenuItem value="11,50">11-50 employees (Early Stage)</MenuItem>
                        <MenuItem value="51,200">51-200 employees (Growth Stage)</MenuItem>
                        <MenuItem value="201,500">201-500 employees (Mid-Market)</MenuItem>
                        <MenuItem value="501,1000">501-1,000 employees (Large)</MenuItem>
                        <MenuItem value="1001,5000">1,001-5,000 employees (Enterprise)</MenuItem>
                        <MenuItem value="5001,10000">5,001-10,000 employees (Large Enterprise)</MenuItem>
                        <MenuItem value="10001,max">10,000+ employees (Fortune 500)</MenuItem>
                      </Select>
                    </FormControl>
                    <Tooltip title="Number of employees. Indicates: company maturity, revenue scale (~$100K-200K revenue per employee is typical), organizational complexity, and decision-making speed.">
                      <IconButton size="small">
                        <InfoIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Grid>

                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <FormControl fullWidth>
                      <InputLabel>Funding/Growth Stage</InputLabel>
                      <Select
                        value={thesisCriteria.fundingStage}
                        onChange={(e) => handleThesisCriteriaChange('fundingStage', e.target.value)}
                        label="Funding/Growth Stage"
                      >
                        <MenuItem value="">Any Stage</MenuItem>
                        <MenuItem value="seed">Seed Stage</MenuItem>
                        <MenuItem value="series-a">Series A</MenuItem>
                        <MenuItem value="series-b">Series B</MenuItem>
                        <MenuItem value="series-c">Series C+</MenuItem>
                        <MenuItem value="growth">Growth Stage</MenuItem>
                        <MenuItem value="private-equity">Private Equity Backed</MenuItem>
                        <MenuItem value="public">Public Company</MenuItem>
                        <MenuItem value="bootstrapped">Bootstrapped/Profitable</MenuItem>
                      </Select>
                    </FormControl>
                    <Tooltip title="Funding and growth stage. Indicates: capital availability, growth trajectory, investor backing, profitability focus, and acquisition readiness. Note: Data may be limited for private companies.">
                      <IconButton size="small">
                        <InfoIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Grid>

                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TextField
                      fullWidth
                      label="Technologies Used (Optional)"
                      placeholder="e.g., Salesforce, AWS, HubSpot, Stripe"
                      value={thesisCriteria.technologies}
                      onChange={(e) => handleThesisCriteriaChange('technologies', e.target.value)}
                    />
                    <Tooltip title="Technology stack the company uses (e.g., Salesforce, AWS, HubSpot). Indicates: technical sophistication, digital maturity, infrastructure spend, and operational complexity. Companies using modern tech stacks often have higher valuations.">
                      <IconButton size="small">
                        <InfoIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Grid>

                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <FormControl fullWidth>
                      <InputLabel>Hiring Departments (Optional)</InputLabel>
                      <Select
                        value={thesisCriteria.jobDepartments}
                        onChange={(e) => handleThesisCriteriaChange('jobDepartments', e.target.value)}
                        label="Hiring Departments (Optional)"
                      >
                        <MenuItem value="">Any Department</MenuItem>
                        <MenuItem value="sales">Sales</MenuItem>
                        <MenuItem value="engineering">Engineering</MenuItem>
                        <MenuItem value="marketing">Marketing</MenuItem>
                        <MenuItem value="operations">Operations</MenuItem>
                        <MenuItem value="finance">Finance</MenuItem>
                        <MenuItem value="customer success">Customer Success</MenuItem>
                        <MenuItem value="product">Product</MenuItem>
                      </Select>
                    </FormControl>
                    <Tooltip title="Departments actively hiring. Indicates: company growth areas, strategic priorities, and expansion stage. Heavy sales hiring = revenue growth focus. Engineering hiring = product development. Multiple departments = rapid scaling.">
                      <IconButton size="small">
                        <InfoIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Number of Contacts to Find"
                    type="number"
                    value={contactsToFind}
                    onChange={(e) => setContactsToFind(parseInt(e.target.value) || 10)}
                    helperText="How many contacts should Apollo search for? (1-50)"
                  />
                </Grid>
                </Grid>
              )}

              {/* Brokers Form Fields */}
              {contactSearchType === 'brokers' && (
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Industry Focus</InputLabel>
                      <Select
                        value={brokerSearchCriteria.industries}
                        onChange={(e) => setBrokerSearchCriteria({...brokerSearchCriteria, industries: e.target.value})}
                        label="Industry Focus"
                      >
                        <MenuItem value="">Any Industry</MenuItem>
                        <MenuItem value="healthcare">Healthcare</MenuItem>
                        <MenuItem value="technology">Technology</MenuItem>
                        <MenuItem value="financial services">Financial Services</MenuItem>
                        <MenuItem value="manufacturing">Manufacturing</MenuItem>
                        <MenuItem value="retail">Retail</MenuItem>
                        <MenuItem value="energy">Energy</MenuItem>
                        <MenuItem value="real estate">Real Estate</MenuItem>
                        <MenuItem value="media">Media & Entertainment</MenuItem>
                        <MenuItem value="education">Education</MenuItem>
                        <MenuItem value="transportation">Transportation</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Deal Size Range</InputLabel>
                      <Select
                        value={brokerSearchCriteria.dealSize}
                        onChange={(e) => setBrokerSearchCriteria({...brokerSearchCriteria, dealSize: e.target.value})}
                        label="Deal Size Range"
                      >
                        <MenuItem value="">Any Deal Size</MenuItem>
                        <MenuItem value="1M-10M">$1M - $10M</MenuItem>
                        <MenuItem value="10M-50M">$10M - $50M</MenuItem>
                        <MenuItem value="50M-100M">$50M - $100M</MenuItem>
                        <MenuItem value="100M-500M">$100M - $500M</MenuItem>
                        <MenuItem value="500M+">$500M+</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Location</InputLabel>
                      <Select
                        value={brokerSearchCriteria.location}
                        onChange={(e) => setBrokerSearchCriteria({...brokerSearchCriteria, location: e.target.value})}
                        label="Location"
                      >
                        <MenuItem value="">Any Location</MenuItem>
                        <MenuItem value="New York">New York</MenuItem>
                        <MenuItem value="California">California</MenuItem>
                        <MenuItem value="Texas">Texas</MenuItem>
                        <MenuItem value="Florida">Florida</MenuItem>
                        <MenuItem value="Illinois">Illinois</MenuItem>
                        <MenuItem value="Massachusetts">Massachusetts</MenuItem>
                        <MenuItem value="Pennsylvania">Pennsylvania</MenuItem>
                        <MenuItem value="Georgia">Georgia</MenuItem>
                        <MenuItem value="North Carolina">North Carolina</MenuItem>
                        <MenuItem value="Virginia">Virginia</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Experience Level</InputLabel>
                      <Select
                        value={brokerSearchCriteria.experience}
                        onChange={(e) => setBrokerSearchCriteria({...brokerSearchCriteria, experience: e.target.value})}
                        label="Experience Level"
                      >
                        <MenuItem value="">Any Experience</MenuItem>
                        <MenuItem value="junior">Junior (1-5 years)</MenuItem>
                        <MenuItem value="mid">Mid-level (5-10 years)</MenuItem>
                        <MenuItem value="senior">Senior (10-15 years)</MenuItem>
                        <MenuItem value="executive">Executive (15+ years)</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Additional Keywords"
                      placeholder="e.g., M&A, investment banking, private equity, venture capital"
                      value={brokerSearchCriteria.keywords}
                      onChange={(e) => setBrokerSearchCriteria({...brokerSearchCriteria, keywords: e.target.value})}
                      helperText="Optional: Add specific terms like deal types, specializations, etc."
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Number of Brokers to Find"
                      type="number"
                      value={contactsToFind}
                      onChange={(e) => setContactsToFind(parseInt(e.target.value) || 10)}
                      helperText="How many brokers should Apollo search for? (1-50)"
                    />
                  </Grid>
                </Grid>
              )}

              {/* Investors Form Fields */}
              {contactSearchType === 'investors' && (
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Investment Focus</InputLabel>
                      <Select
                        value={investorSearchCriteria.industries}
                        onChange={(e) => setInvestorSearchCriteria({...investorSearchCriteria, industries: e.target.value})}
                        label="Investment Focus"
                      >
                        <MenuItem value="">Any Industry</MenuItem>
                        <MenuItem value="healthcare">Healthcare</MenuItem>
                        <MenuItem value="technology">Technology</MenuItem>
                        <MenuItem value="fintech">Fintech</MenuItem>
                        <MenuItem value="saas">SaaS</MenuItem>
                        <MenuItem value="ecommerce">E-commerce</MenuItem>
                        <MenuItem value="biotech">Biotech</MenuItem>
                        <MenuItem value="cleantech">Clean Tech</MenuItem>
                        <MenuItem value="edtech">EdTech</MenuItem>
                        <MenuItem value="proptech">PropTech</MenuItem>
                        <MenuItem value="cybersecurity">Cybersecurity</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Investment Stage</InputLabel>
                      <Select
                        value={investorSearchCriteria.investmentStage}
                        onChange={(e) => setInvestorSearchCriteria({...investorSearchCriteria, investmentStage: e.target.value})}
                        label="Investment Stage"
                      >
                        <MenuItem value="">Any Stage</MenuItem>
                        <MenuItem value="seed">Seed</MenuItem>
                        <MenuItem value="series-a">Series A</MenuItem>
                        <MenuItem value="series-b">Series B</MenuItem>
                        <MenuItem value="series-c">Series C</MenuItem>
                        <MenuItem value="growth">Growth</MenuItem>
                        <MenuItem value="late-stage">Late Stage</MenuItem>
                        <MenuItem value="pre-ipo">Pre-IPO</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Check Size Range</InputLabel>
                      <Select
                        value={investorSearchCriteria.checkSize}
                        onChange={(e) => setInvestorSearchCriteria({...investorSearchCriteria, checkSize: e.target.value})}
                        label="Check Size Range"
                      >
                        <MenuItem value="">Any Check Size</MenuItem>
                        <MenuItem value="100K-500K">$100K - $500K</MenuItem>
                        <MenuItem value="500K-1M">$500K - $1M</MenuItem>
                        <MenuItem value="1M-5M">$1M - $5M</MenuItem>
                        <MenuItem value="5M-10M">$5M - $10M</MenuItem>
                        <MenuItem value="10M-25M">$10M - $25M</MenuItem>
                        <MenuItem value="25M+">$25M+</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Location</InputLabel>
                      <Select
                        value={investorSearchCriteria.location}
                        onChange={(e) => setInvestorSearchCriteria({...investorSearchCriteria, location: e.target.value})}
                        label="Location"
                      >
                        <MenuItem value="">Any Location</MenuItem>
                        <MenuItem value="San Francisco">San Francisco</MenuItem>
                        <MenuItem value="New York">New York</MenuItem>
                        <MenuItem value="Boston">Boston</MenuItem>
                        <MenuItem value="Los Angeles">Los Angeles</MenuItem>
                        <MenuItem value="Austin">Austin</MenuItem>
                        <MenuItem value="Seattle">Seattle</MenuItem>
                        <MenuItem value="Chicago">Chicago</MenuItem>
                        <MenuItem value="Miami">Miami</MenuItem>
                        <MenuItem value="Denver">Denver</MenuItem>
                        <MenuItem value="Remote">Remote</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Additional Keywords"
                      placeholder="e.g., AI, blockchain, sustainability, B2B, enterprise"
                      value={investorSearchCriteria.keywords}
                      onChange={(e) => setInvestorSearchCriteria({...investorSearchCriteria, keywords: e.target.value})}
                      helperText="Optional: Add specific terms like technologies, business models, etc."
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Number of Investors to Find"
                      type="number"
                      value={contactsToFind}
                      onChange={(e) => setContactsToFind(parseInt(e.target.value) || 10)}
                      helperText="How many investors should Apollo search for? (1-50)"
                    />
                  </Grid>
                </Grid>
              )}


              {/* Search Button */}
              <Box sx={{ mt: 3 }}>
                  <Button
                    fullWidth
                    variant="contained"
                    size="large"
                    onClick={handleContactSearch}
                    disabled={isDiscovering || !isKeyValid}
                    startIcon={isDiscovering ? <CircularProgress size={20} /> : <SearchIcon />}
                    sx={{ 
                      mt: 1,
                      background: 'linear-gradient(135deg, #374151 0%, #1f2937 100%) !important',
                      color: 'white !important',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #1f2937 0%, #111827 100%) !important'
                      },
                      '&:disabled': {
                        bgcolor: '#9CA3AF !important',
                        color: '#FFFFFF !important'
                      }
                    }}
                  >
                    {isDiscovering ? `Searching for ${contactsToFind} Contacts...` : `Search for ${contactsToFind} Contacts`}
                  </Button>
              </Box>
            </Paper>
          </Grid>

          {/* Search Results */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 4 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
                Search Results
              </Typography>

                  {discoveryResults && (
                    <Box sx={{ mb: 3 }}>
                      <Alert severity="success" sx={{ mb: 2 }}>
                        Found {discoveryResults.summary?.found || 0} contacts matching your search criteria
                        {contactsToFind > 0 && ` (requested ${contactsToFind})`}
                      </Alert>

                      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                        <Chip
                          label={`Total: ${discoveryResults.summary?.total || 0}`}
                          color="primary"
                          variant="outlined"
                        />
                        <Chip
                          label={`Success Rate: ${discoveryResults.summary?.successRate || 0}%`}
                          color="success"
                          variant="outlined"
                        />
                        {contactsToFind > 0 && (
                          <Chip
                            label={`Requested: ${contactsToFind}`}
                            color="info"
                            variant="outlined"
                          />
                        )}
                      </Box>
                      
                      {discoveredContacts.length > 0 && (
                        <Box sx={{ mb: 2 }}>
                          <Button
                            variant="contained"
                            color="success"
                            startIcon={<GetAppIcon />}
                            onClick={handleDownloadSearchResults}
                            sx={{ mr: 2 }}
                          >
                            Download CSV ({discoveredContacts.length} contacts)
                          </Button>
                        </Box>
                      )}
                    </Box>
                  )}

              {discoveredContacts.length > 0 ? (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Name</TableCell>
                        <TableCell>Title</TableCell>
                        <TableCell>Company</TableCell>
                        <TableCell>Email</TableCell>
                        <TableCell>Phone</TableCell>
                        <TableCell>LinkedIn</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {discoveredContacts.slice(0, 10).map((contact, index) => (
                        <TableRow key={contact.id || index}>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                                {contact.first_name?.[0] || contact.name?.[0] || '?'}
                              </Avatar>
                              <Box>
                                <Typography variant="body2" fontWeight={500}>
                                  {contact.name || `${contact.first_name} ${contact.last_name}`}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {contact.title}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>{contact.title}</TableCell>
                          <TableCell>{contact.company}</TableCell>
                          <TableCell>
                            {contact.email && contact.email !== 'email_not_unlocked' && !contact.email.includes('email_not_unlocked') ? (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <EmailIcon sx={{ fontSize: 16, color: 'success.main' }} />
                                <Typography variant="body2">{contact.email}</Typography>
                              </Box>
                            ) : (
                              <Typography variant="body2" color="text.secondary">
                                Not Found
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            {contact.phone ? (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <PhoneIcon sx={{ fontSize: 16, color: 'success.main' }} />
                                <Typography variant="body2">{contact.phone}</Typography>
                              </Box>
                            ) : (
                              <Typography variant="body2" color="text.secondary">
                                Not Found
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            {contact.linkedin_url ? (
                              <IconButton
                                size="small"
                                component="a"
                                href={contact.linkedin_url}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <LinkedInIcon sx={{ fontSize: 20, color: 'primary.main' }} />
                              </IconButton>
                            ) : (
                              <Typography variant="body2" color="text.secondary">
                                Not Found
                              </Typography>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <SearchIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                      <Typography variant="body1" color="text.secondary">
                        Enter your search criteria and click "Search for Contacts" to find relevant contacts
                      </Typography>
                    </Box>
              )}
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* API Key Configuration Dialog */}
      <Dialog
        open={showApiKeyDialog}
        onClose={() => setShowApiKeyDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Configure API Key
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Select your data provider and enter the corresponding API key to enable contact enrichment.
          </Typography>
          
          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel>Data Provider</InputLabel>
            <Select
              value={selectedProvider}
              onChange={(e) => {
                const newProvider = e.target.value as 'apollo' | 'zoominfo' | 'gratta';
                setSelectedProvider(newProvider);
                localStorage.setItem('selectedProvider', newProvider);
              }}
              label="Data Provider"
            >
              <MenuItem value="apollo">Apollo</MenuItem>
              <MenuItem value="zoominfo">ZoomInfo</MenuItem>
              <MenuItem value="gratta">Gratta</MenuItem>
            </Select>
          </FormControl>
          
          <TextField
            fullWidth
            label={`${selectedProvider.charAt(0).toUpperCase() + selectedProvider.slice(1)} API Key`}
            type="password"
            value={getCurrentApiKey()}
            onChange={(e) => setCurrentApiKey(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && getCurrentApiKey().trim() && !isValidatingKey) {
                handleApiKeySubmit();
              }
            }}
            placeholder={`Enter your ${selectedProvider.charAt(0).toUpperCase() + selectedProvider.slice(1)} API key`}
            sx={{ mb: 2 }}
          />

          <Alert severity="info" sx={{ mb: 2 }}>
            Your API key is stored locally and only used for this session. It's not saved to our servers.
          </Alert>

          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
              How to get your {selectedProvider.charAt(0).toUpperCase() + selectedProvider.slice(1)} API key:
            </Typography>
            {selectedProvider === 'apollo' && (
              <>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  1. Go to Apollo.io → Settings → API Keys
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  2. Click "Activate" on your API key
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  3. Make sure you have API access enabled on your plan
                </Typography>
              </>
            )}
            {selectedProvider === 'zoominfo' && (
              <>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  1. Go to ZoomInfo → Account Settings → API Keys
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  2. Generate a new API key or use existing one
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  3. Ensure you have the appropriate API access permissions
                </Typography>
              </>
            )}
            {selectedProvider === 'gratta' && (
              <>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  1. Go to Gratta → Dashboard → API Settings
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  2. Create or copy your API key
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  3. Verify your API key has the required permissions
                </Typography>
              </>
            )}
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowApiKeyDialog(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleApiKeySubmit}
            disabled={!getCurrentApiKey().trim() || isValidatingKey}
            startIcon={isValidatingKey ? <CircularProgress size={16} /> : <CheckCircleIcon />}
          >
            {isValidatingKey ? 'Validating...' : 'Validate & Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}