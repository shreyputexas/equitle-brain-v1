import React, { useState, useRef, useCallback } from 'react';
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
  ebitda: string;
  revenue: string;
  industries: string;
  subindustries: string;
  location: string;
  growth: string;
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
      ebitda: '',
      revenue: '',
      industries: '',
      subindustries: '',
      location: '',
      growth: ''
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
        break;
      case 'zoominfo':
        setZoominfoApiKey(key);
        break;
      case 'gratta':
        setGrattaApiKey(key);
        break;
    }
  };

  // Organization search state
  const [orgSearchCriteria, setOrgSearchCriteria] = useState({
    industries: '',
    subindustries: '',
    location: '',
    revenue: '',
    ebitda: '',
    growth: '',
    employeeCount: '',
    foundedYear: '',
    keywords: ''
  });
  const [isOrgSearching, setIsOrgSearching] = useState(false);
  const [orgSearchResults, setOrgSearchResults] = useState<any>(null);
  const [showOrgSearchResults, setShowOrgSearchResults] = useState(false);
  const [orgsToFind, setOrgsToFind] = useState<number>(10);

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

    if (!getCurrentApiKey().trim()) {
      setMessage(`Please configure your ${selectedProvider.charAt(0).toUpperCase() + selectedProvider.slice(1)} API key first`);
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

    if (!getCurrentApiKey().trim()) {
      setMessage(`Please configure your ${selectedProvider.charAt(0).toUpperCase() + selectedProvider.slice(1)} API key first`);
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

  // Organization search handler
  const handleOrgSearch = async () => {
    if (!orgSearchCriteria.industries.trim() && !orgSearchCriteria.subindustries.trim()) {
      setMessage('Please enter at least Industries or Subindustries');
      setShowError(true);
      return;
    }

    if (!getCurrentApiKey().trim()) {
      setMessage(`Please configure your ${selectedProvider.charAt(0).toUpperCase() + selectedProvider.slice(1)} API key first`);
      setShowError(true);
      return;
    }

    setIsOrgSearching(true);
    try {
      const response = await fetch('http://localhost:4001/api/data-enrichment/search-organizations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          searchCriteria: orgSearchCriteria,
          orgsToFind,
          apiKey: getCurrentApiKey(),
          provider: selectedProvider
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setOrgSearchResults(data);
        setShowOrgSearchResults(true);
        setMessage(`Found ${data.organizations?.length || 0} organizations matching your criteria`);
        setShowSuccess(true);
      } else {
        setMessage(data.error || 'Failed to search organizations');
        setShowError(true);
      }
    } catch (error) {
      setMessage('Network error. Please try again.');
      setShowError(true);
    } finally {
      setIsOrgSearching(false);
    }
  };

  const handleContactSearch = async () => {
    if (!getCurrentApiKey().trim()) {
      setMessage(`Please configure your ${selectedProvider.charAt(0).toUpperCase() + selectedProvider.slice(1)} API key first`);
      setShowError(true);
      return;
    }

    // Validate criteria based on contact type
    if (contactSearchType === 'people') {
      if (!thesisCriteria.industries.trim() && !thesisCriteria.subindustries.trim()) {
        setMessage('Please enter at least Industries or Subindustries');
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

      const response = await fetch('http://localhost:4001/api/data-enrichment/search-contacts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(searchPayload)
      });

      const data = await response.json();
      
      if (data.success) {
        setDiscoveredContacts(data.contacts || []);
        setDiscoveryResults(data);
        setMessage(`Found ${data.contacts?.length || 0} contacts matching your thesis criteria`);
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
        setMessage(`✅ ${selectedProvider.charAt(0).toUpperCase() + selectedProvider.slice(1)} API key is valid and ready to use!`);
        setShowSuccess(true);
        setShowApiKeyDialog(false);
      } else {
        setIsKeyValid(false);
        const providerName = selectedProvider.charAt(0).toUpperCase() + selectedProvider.slice(1);
        setMessage(`❌ Invalid ${providerName} API key. Please check your API key and permissions.`);
        setShowError(true);
      }
    } catch (error: any) {
      setIsKeyValid(false);
      console.error('API key validation error:', error);
      console.error('Error details:', {
        message: error.message,
        name: error.name,
        stack: error.stack
      });
      setMessage(`❌ Failed to validate API key: ${error.message || 'Network error - check if server is running on port 4001'}`);
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

    if (!getCurrentApiKey().trim()) {
      setMessage(`Please configure your ${selectedProvider.charAt(0).toUpperCase() + selectedProvider.slice(1)} API key first`);
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
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
        <Box>
        <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
            Data Enrichment
        </Typography>
        <Typography variant="body1" color="text.secondary">
            Enrich and discover contact data using {selectedProvider.charAt(0).toUpperCase() + selectedProvider.slice(1)} API
        </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Tooltip title={`Configure ${selectedProvider.charAt(0).toUpperCase() + selectedProvider.slice(1)} API`}>
            <Button
              variant="outlined"
              startIcon={<DataUsageIcon />}
              onClick={() => setShowApiKeyDialog(true)}
              sx={{ borderColor: 'divider' }}
            >
              {isKeyValid ? 'API Configured' : 'Configure API'}
            </Button>
          </Tooltip>
        </Box>
      </Box>

          {/* Simplified Navigation */}
          <Box sx={{ mb: 4 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Card 
                  sx={{ 
                    cursor: 'pointer', 
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    border: activeMainTab === 0 && activeSubTab === 0 ? '2px solid #000000' : '1px solid #e0e0e0',
                    '&:hover': { borderColor: '#000000' }
                  }}
                  onClick={() => { setActiveMainTab(0); setActiveSubTab(0); }}
                >
                  <CardContent sx={{ textAlign: 'center', py: 3, flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                    <PersonIcon sx={{ fontSize: 40, mb: 2, color: activeMainTab === 0 && activeSubTab === 0 ? '#000000' : '#666666' }} />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Enrich Contacts
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Card 
                  sx={{ 
                    cursor: 'pointer', 
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    border: activeMainTab === 0 && activeSubTab === 1 ? '2px solid #000000' : '1px solid #e0e0e0',
                    '&:hover': { borderColor: '#000000' }
                  }}
                  onClick={() => { setActiveMainTab(0); setActiveSubTab(1); }}
                >
                  <CardContent sx={{ textAlign: 'center', py: 3, flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                    <BusinessIcon sx={{ fontSize: 40, mb: 2, color: activeMainTab === 0 && activeSubTab === 1 ? '#000000' : '#666666' }} />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Enrich Companies
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Card 
                  sx={{ 
                    cursor: 'pointer', 
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    border: activeMainTab === 1 && activeSubTab === 0 ? '2px solid #000000' : '1px solid #e0e0e0',
                    '&:hover': { borderColor: '#000000' }
                  }}
                  onClick={() => { setActiveMainTab(1); setActiveSubTab(0); }}
                >
                  <CardContent sx={{ textAlign: 'center', py: 3, flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                    <SearchIcon sx={{ fontSize: 40, mb: 2, color: activeMainTab === 1 && activeSubTab === 0 ? '#000000' : '#666666' }} />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Find Contacts
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Card 
                  sx={{ 
                    cursor: 'pointer', 
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    border: activeMainTab === 1 && activeSubTab === 1 ? '2px solid #000000' : '1px solid #e0e0e0',
                    '&:hover': { borderColor: '#000000' }
                  }}
                  onClick={() => { setActiveMainTab(1); setActiveSubTab(1); }}
                >
                  <CardContent sx={{ textAlign: 'center', py: 3, flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                    <BusinessIcon sx={{ fontSize: 40, mb: 2, color: activeMainTab === 1 && activeSubTab === 1 ? '#000000' : '#666666' }} />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Find Companies
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>

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

      {/* Tab Panel Content */}
      {activeMainTab === 0 && activeSubTab === 0 && (
        <Grid container spacing={3}>
          {/* Upload Section */}
          <Grid item xs={12} md={6}>
          <Paper sx={{ p: 4 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
              Upload Excel File
            </Typography>

            {/* API Key Status */}
            <Box sx={{ mb: 3 }}>
              {isKeyValid === null && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  Please configure your {selectedProvider.charAt(0).toUpperCase() + selectedProvider.slice(1)} API key to start enriching contacts
                </Alert>
              )}
              {isKeyValid === false && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  Invalid API key. Please check your {selectedProvider.charAt(0).toUpperCase() + selectedProvider.slice(1)} API key and try again.
              </Alert>
            )}
              {isKeyValid === true && (
                <Alert severity="success" sx={{ mb: 2 }}>
                  {selectedProvider.charAt(0).toUpperCase() + selectedProvider.slice(1)} API key is configured and valid
                </Alert>
              )}
            </Box>

            {/* Drag and Drop File Upload */}
            <Box 
                  sx={{
                mb: 3,
                border: '2px dashed',
                borderColor: isDragOver ? 'primary.main' : 'divider',
                borderRadius: 2,
                p: 4,
                textAlign: 'center',
                bgcolor: isDragOver ? 'action.hover' : 'background.paper',
                cursor: 'pointer',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  borderColor: 'primary.main',
                  bgcolor: 'action.hover'
                }
              }}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <CloudUploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                {selectedFile ? selectedFile.name : 'Drag & Drop CSV File Here'}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                or click to browse files
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Supports any CSV format with flexible column names (max 10MB)
              </Typography>
              
              <input
                ref={fileInputRef}
                type="file"
                hidden
                accept=".csv,.xlsx,.xls"
                onChange={handleFileInputChange}
              />
            </Box>

            {selectedFile && (
              <Box sx={{ mb: 3, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {selectedFile.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {(selectedFile.size / 1024).toFixed(1)} KB
                    </Typography>
                  </Box>
                  <IconButton
                    size="small"
                    onClick={() => {
                      setSelectedFile(null);
                      if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                      }
                    }}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Box>
            )}

            {/* File Format Instructions */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                Supported File Formats:
              </Typography>
              <List dense>
                <ListItem sx={{ py: 0 }}>
                  <ListItemIcon>
                    <InfoIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Any CSV format with flexible column names"
                    secondary="We automatically detect: Name, Company, Email, Phone, Website columns"
                  />
                </ListItem>
                <ListItem sx={{ py: 0 }}>
                  <ListItemIcon>
                    <GetAppIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary="File types: .csv, .xlsx, .xls"
                    secondary="Maximum file size: 10MB"
                  />
                </ListItem>
                <ListItem sx={{ py: 0 }}>
                  <ListItemIcon>
                    <CheckCircleIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Smart column detection"
                    secondary="Works with any column names like: 'Full Name', 'Contact', 'Business', 'E-mail', etc."
                  />
                </ListItem>
              </List>
            </Box>

            {/* Process Button */}
              <Button
              variant="contained"
              size="large"
              startIcon={isProcessing ? <CircularProgress size={20} /> : <SearchIcon />}
              onClick={handleFileUpload}
              disabled={!selectedFile || !getCurrentApiKey().trim() || isProcessing}
                fullWidth
                sx={{
                bgcolor: 'white',
                  color: '#000000',
                border: '2px solid #000000',
                py: 1.5,
                  '&:hover': {
                  bgcolor: '#f5f5f5'
                },
                '&:disabled': {
                  bgcolor: '#cccccc',
                  color: '#666666'
                }
              }}
            >
              {isProcessing ? 'Processing...' : 'Enrich Contacts with Apollo'}
              </Button>

            {isProcessing && (
              <Box sx={{ mt: 2 }}>
                <LinearProgress />
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  Processing contacts with {selectedProvider.charAt(0).toUpperCase() + selectedProvider.slice(1)} API...
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Results Section */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 4 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
              Enrichment Results
            </Typography>

            {!showResults ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <DataUsageIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="body1" color="text.secondary">
                  Upload and process a file to see enrichment results
                </Typography>
              </Box>
            ) : (
              <Box>
                {/* Summary Stats */}
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={6}>
                    <Card sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="h4" sx={{ fontWeight: 600, color: 'primary.main' }}>
                        {results?.summary.total}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Total Contacts
                      </Typography>
          </Card>
                  </Grid>
                  <Grid item xs={6}>
                    <Card sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="h4" sx={{ fontWeight: 600, color: 'success.main' }}>
                        {results?.summary.successful}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Enriched
              </Typography>
                    </Card>
                  </Grid>
                </Grid>

                {/* Success Rate */}
                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Success Rate</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {results?.summary.successRate}%
              </Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={results?.summary.successRate || 0}
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                </Box>

                {/* Download Button */}
                <Button
                  variant="outlined"
                  startIcon={<FileDownloadIcon />}
                  onClick={handleDownloadResults}
                  fullWidth
                  sx={{ mb: 3 }}
                >
                  Download Enriched Data (CSV)
                </Button>

                {/* Sample Results Preview */}
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                  Sample Results:
                </Typography>
                <TableContainer sx={{ maxHeight: 300 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Name</TableCell>
                        <TableCell>Company</TableCell>
                        <TableCell>Email</TableCell>
                        <TableCell>Phone</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {results?.results.slice(0, 5).map((result, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              {result.enriched?.photo && (
                                <Avatar src={result.enriched.photo} sx={{ width: 24, height: 24 }} />
                              )}
                              <Typography variant="body2">
                                {result.enriched?.name || result.original.given}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {result.enriched?.company || result.original.company}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {result.enriched?.email || result.original.email}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {result.enriched?.phone || result.original.phone}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {getStatusIcon(result.success)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                {results && results.results.length > 5 && (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    Showing first 5 results. Download CSV for complete data.
                  </Typography>
                )}
              </Box>
            )}
          </Paper>
        </Grid>
        </Grid>
      )}

      {/* Organization Enrichment Tab */}
      {activeMainTab === 0 && activeSubTab === 1 && (
        <Grid container spacing={3}>
          {/* Upload Section */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 4 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                Organization Enrichment
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Upload an Excel file with organization data to enrich with LinkedIn links, phone numbers, emails, and other company information using Apollo's Organization Enrichment API.
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
                <Typography variant="h6" sx={{ mb: 1 }}>
                  {orgSelectedFile ? orgSelectedFile.name : 'Drop your Excel file here or click to browse'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
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
                    <CheckCircleIcon sx={{ color: 'success.main' }} />
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      File selected: {orgSelectedFile.name}
                    </Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary">
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
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
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
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
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
                          <Typography variant="h4" sx={{ fontWeight: 600, color: 'primary.main' }}>
                            {orgResults.summary.total}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Total Organizations
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={6}>
                      <Card sx={{ textAlign: 'center', bgcolor: 'success.light' }}>
                        <CardContent sx={{ py: 2 }}>
                          <Typography variant="h4" sx={{ fontWeight: 600, color: 'success.main' }}>
                            {orgResults.summary.successRate}%
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
                                <Typography variant="body2" fontWeight={500}>
                                  {org.enriched?.name || org.original.company}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {org.original.company}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell>
                              {org.enriched?.website ? (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  <BusinessIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                                  <Typography variant="body2" sx={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {org.enriched.website}
                                  </Typography>
                                </Box>
                              ) : (
                                <Typography variant="body2" color="text.secondary">
                                  No website
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell>
                              {org.enriched?.linkedin ? (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  <LinkedInIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                                  <Typography variant="body2">LinkedIn</Typography>
                                </Box>
                              ) : (
                                <Typography variant="body2" color="text.secondary">
                                  No LinkedIn
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell>
                              {org.enriched?.phone ? (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  <PhoneIcon sx={{ fontSize: 16, color: 'success.main' }} />
                                  <Typography variant="body2">{org.enriched.phone}</Typography>
                                </Box>
                              ) : (
                                <Typography variant="body2" color="text.secondary">
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
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                      Showing first 10 results. Download CSV for complete data.
                    </Typography>
                  )}
                </Box>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <BusinessIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="body1" color="text.secondary">
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
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                Contact Enrichment
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Upload an Excel file with contact data to enrich with emails, phone numbers, LinkedIn profiles, and other contact information using Apollo's People Enrichment API.
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
                    <CheckCircleIcon sx={{ color: 'success.main' }} />
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
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
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
                                <Typography variant="body2" color="text.secondary">
                                  No phone
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell>
                              {contact.enriched?.linkedin ? (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  <LinkedInIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                                  <Typography variant="body2">LinkedIn</Typography>
                                </Box>
                              ) : (
                                <Typography variant="body2" color="text.secondary">
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
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
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

      {/* Organization Search Tab */}
      {activeMainTab === 1 && activeSubTab === 1 && (
        <Grid container spacing={3}>
          {/* Search Criteria Form */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 4 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                Organization Search Criteria
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Enter your search criteria to find organizations using Apollo's Organization Search API. Get detailed company information including CEO, revenue, growth, and more.
              </Typography>

              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Industries *"
                    value={orgSearchCriteria.industries}
                    onChange={(e) => setOrgSearchCriteria({...orgSearchCriteria, industries: e.target.value})}
                    placeholder="Technology, Healthcare, Finance"
                    helperText="Target industries (comma-separated)"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Subindustries"
                    value={orgSearchCriteria.subindustries}
                    onChange={(e) => setOrgSearchCriteria({...orgSearchCriteria, subindustries: e.target.value})}
                    placeholder="SaaS, Fintech, MedTech"
                    helperText="Specific subindustries or focus areas"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Location"
                    value={orgSearchCriteria.location}
                    onChange={(e) => setOrgSearchCriteria({...orgSearchCriteria, location: e.target.value})}
                    placeholder="San Francisco, New York, Remote"
                    helperText="Geographic location criteria"
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Revenue"
                    value={orgSearchCriteria.revenue}
                    onChange={(e) => setOrgSearchCriteria({...orgSearchCriteria, revenue: e.target.value})}
                    placeholder="$1M-$10M"
                    helperText="Revenue range criteria"
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="EBITDA"
                    value={orgSearchCriteria.ebitda}
                    onChange={(e) => setOrgSearchCriteria({...orgSearchCriteria, ebitda: e.target.value})}
                    placeholder="$500K-$5M"
                    helperText="Minimum EBITDA requirements"
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Growth Rate"
                    value={orgSearchCriteria.growth}
                    onChange={(e) => setOrgSearchCriteria({...orgSearchCriteria, growth: e.target.value})}
                    placeholder="20%+"
                    helperText="Annual growth rate"
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Employee Count"
                    value={orgSearchCriteria.employeeCount}
                    onChange={(e) => setOrgSearchCriteria({...orgSearchCriteria, employeeCount: e.target.value})}
                    placeholder="10-100"
                    helperText="Company size range"
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Founded Year"
                    value={orgSearchCriteria.foundedYear}
                    onChange={(e) => setOrgSearchCriteria({...orgSearchCriteria, foundedYear: e.target.value})}
                    placeholder="2015-2020"
                    helperText="Year range when founded"
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Number of Organizations to Find"
                    type="number"
                    value={orgsToFind}
                    onChange={(e) => setOrgsToFind(parseInt(e.target.value) || 10)}
                    helperText="Maximum organizations to return"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Keywords"
                    value={orgSearchCriteria.keywords}
                    onChange={(e) => setOrgSearchCriteria({...orgSearchCriteria, keywords: e.target.value})}
                    placeholder="AI, Machine Learning, Blockchain"
                    helperText="Additional keywords to refine search"
                  />
                </Grid>
                </Grid>

              <Button
                variant="contained"
                onClick={handleOrgSearch}
                disabled={isOrgSearching}
                startIcon={isOrgSearching ? <CircularProgress size={20} /> : <SearchIcon />}
                sx={{ mt: 3, width: '100%' }}
              >
                {isOrgSearching ? 'Searching...' : 'Search Organizations'}
              </Button>
            </Paper>
          </Grid>

          {/* Results Section */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 4 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                Search Results
              </Typography>

              {showOrgSearchResults && orgSearchResults ? (
                <Box>
                  {/* Summary Stats */}
                  <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={6}>
                      <Card sx={{ textAlign: 'center', bgcolor: 'primary.light' }}>
                        <CardContent sx={{ py: 2 }}>
                          <Typography variant="h4" sx={{ fontWeight: 600, color: 'primary.main' }}>
                            {orgSearchResults.organizations?.length || 0}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Organizations Found
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={6}>
                      <Card sx={{ textAlign: 'center', bgcolor: 'success.light' }}>
                        <CardContent sx={{ py: 2 }}>
                          <Typography variant="h4" sx={{ fontWeight: 600, color: 'success.main' }}>
                            {orgSearchResults.summary?.averageRevenue || 'N/A'}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Avg Revenue
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
                          <TableCell>CEO</TableCell>
                          <TableCell>Revenue</TableCell>
                          <TableCell>Location</TableCell>
                          <TableCell>Industry</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {orgSearchResults.organizations?.slice(0, 10).map((org: any, index: number) => (
                          <TableRow key={index}>
                            <TableCell>
                              <Box>
                                <Typography variant="body2" fontWeight={500}>
                                  {org.name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {org.website}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {org.ceo || 'N/A'}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {org.revenue || 'N/A'}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {org.location || 'N/A'}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {org.industry || 'N/A'}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>

                  {orgSearchResults.organizations?.length > 10 && (
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                      Showing first 10 results. Download CSV for complete data.
                    </Typography>
                  )}
                </Box>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <BusinessIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="body1" color="text.secondary">
                    Enter your search criteria and click "Search Organizations" to find companies
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
          {/* Contact Type Selection */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Contact Search Type
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button
                  variant={contactSearchType === 'people' ? 'contained' : 'outlined'}
                  onClick={() => setContactSearchType('people')}
                  startIcon={<PersonIcon />}
                >
                  People at Companies
                </Button>
                <Button
                  variant={contactSearchType === 'brokers' ? 'contained' : 'outlined'}
                  onClick={() => setContactSearchType('brokers')}
                  startIcon={<BusinessIcon />}
                >
                  Brokers
                </Button>
                <Button
                  variant={contactSearchType === 'investors' ? 'contained' : 'outlined'}
                  onClick={() => setContactSearchType('investors')}
                  startIcon={<AccountBalanceIcon />}
                >
                  Investors
                </Button>
              </Box>
            </Paper>
          </Grid>

          {/* Search Criteria Form */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 4 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
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
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Find people at companies that match your investment thesis criteria.
                  </Typography>
                </>
              )}

              {/* Brokers Form */}
              {contactSearchType === 'brokers' && (
                <>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Find brokers who have connections and experience in your target industries.
                  </Typography>
                </>
              )}

              {/* Investors Form */}
              {contactSearchType === 'investors' && (
                <>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Find investors who invest in your target industries and match your investment criteria.
                  </Typography>
                </>
              )}

              {/* People at Companies Form Fields */}
              {contactSearchType === 'people' && (
                <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                      label="Industries *"
                    placeholder="e.g., Healthcare, Technology, Finance"
                    value={thesisCriteria.industries}
                    onChange={(e) => handleThesisCriteriaChange('industries', e.target.value)}
                    helperText="Target industries (comma-separated)"
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Subindustries"
                      placeholder="e.g., SaaS, Fintech, MedTech"
                    value={thesisCriteria.subindustries}
                    onChange={(e) => handleThesisCriteriaChange('subindustries', e.target.value)}
                    helperText="Specific subindustries or focus areas"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Location"
                    placeholder="e.g., U.S.-based, California, New York"
                    value={thesisCriteria.location}
                    onChange={(e) => handleThesisCriteriaChange('location', e.target.value)}
                    helperText="Geographic location criteria"
                  />
                </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="EBITDA"
                      placeholder="e.g., $3M+, $5M+, $10M+"
                      value={thesisCriteria.ebitda}
                      onChange={(e) => handleThesisCriteriaChange('ebitda', e.target.value)}
                      helperText="Minimum EBITDA requirements"
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="Revenue"
                      placeholder="e.g., $10M-$20M, $20M-$50M, $50M+"
                      value={thesisCriteria.revenue}
                      onChange={(e) => handleThesisCriteriaChange('revenue', e.target.value)}
                      helperText="Revenue range criteria"
                    />
                  </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Growth Rate</InputLabel>
                    <Select
                      value={thesisCriteria.growth}
                      onChange={(e) => handleThesisCriteriaChange('growth', e.target.value)}
                      label="Growth Rate"
                    >
                      <MenuItem value="">Any</MenuItem>
                      <MenuItem value="single">Single-digit growth</MenuItem>
                      <MenuItem value="double">Double-digit growth</MenuItem>
                      <MenuItem value="high">High growth (20%+)</MenuItem>
                    </Select>
                  </FormControl>
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
                    sx={{ mt: 1 }}
                  >
                    {isDiscovering ? `Searching for ${contactsToFind} Contacts...` : `Search for ${contactsToFind} Contacts`}
                  </Button>
              </Box>
            </Paper>
          </Grid>

          {/* Search Results */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 4 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
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
                        <TableCell>Status</TableCell>
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
                            {contact.email ? (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <EmailIcon sx={{ fontSize: 16, color: 'success.main' }} />
                                <Typography variant="body2">{contact.email}</Typography>
                              </Box>
                            ) : (
                              <Typography variant="body2" color="text.secondary">
                                No email
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={contact.email_unlocked ? 'Unlocked' : 'Locked'}
                              color={contact.email_unlocked ? 'success' : 'warning'}
                              size="small"
                            />
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
              onChange={(e) => setSelectedProvider(e.target.value as 'apollo' | 'zoominfo' | 'gratta')}
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