import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
  Divider,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip
} from '@mui/material';
import {
  Person as PersonIcon,
  LocationOn as LocationIcon,
  Schedule as ScheduleIcon,
  Business as BusinessIcon
} from '@mui/icons-material';

interface LinkedInData {
  interest: string;
  aboutMe: string;
  experience: string;
  latestPost: string;
  education: string;
  location: string;
  callPreference: string;
  outreachType: string;
}

interface LinkedInProfileData {
  rawLinkedInText: string;
  websiteUrl: string;
  callPreference: string;
  outreachType: string;
}

const LinkedInEntry: React.FC = () => {
  const [formData, setFormData] = useState<LinkedInProfileData>({
    rawLinkedInText: '',
    websiteUrl: '',
    callPreference: '',
    outreachType: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [generatedMessage, setGeneratedMessage] = useState<any>(null);

  const handleInputChange = (field: keyof LinkedInProfileData) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  const handleSelectChange = (field: keyof LinkedInProfileData) => (
    event: any
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    if (!formData.rawLinkedInText) {
      setMessage({
        type: 'error',
        text: 'Please paste the LinkedIn profile data.'
      });
      setIsSubmitting(false);
      return;
    }

    if (!formData.callPreference) {
      setMessage({
        type: 'error',
        text: 'Please select a call preference.'
      });
      setIsSubmitting(false);
      return;
    }

    if (!formData.outreachType) {
      setMessage({
        type: 'error',
        text: 'Please select an outreach type.'
      });
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch('/api/linkedin-outreach/generate-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          linkedinProfileData: formData
        })
      });

      const result = await response.json();

      if (result.success) {
        setGeneratedMessage(result.data);
        
        if (result.data.mode === 'profile-only') {
          setMessage({
            type: 'success',
            text: 'Personalized message generated from LinkedIn profile! (No website data included)'
          });
        } else {
          setMessage({
            type: 'success',
            text: 'Personalized message generated with company research!'
          });
        }
      } else {
        setMessage({
          type: 'error',
          text: result.error || 'Failed to generate message.'
        });
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Error generating message. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const callPreferenceOptions = [
    'Monday morning',
    'Monday afternoon', 
    'Tuesday morning',
    'Tuesday afternoon',
    'Wednesday morning',
    'Wednesday afternoon',
    'Thursday morning',
    'Thursday afternoon',
    'Friday morning',
    'Friday afternoon',
    'Next week',
    'Flexible'
  ];

  const outreachTypeOptions = [
    'Interest in Acquisition',
    'Interest in Entrepreneurial Journey'
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
        LinkedIn Profile Entry
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
        Copy and paste a LinkedIn profile (Ctrl+A on the profile page) to generate personalized outreach messages. 
        The AI will extract the profile information and create custom messages.
      </Typography>

      <Alert severity="info" sx={{ mb: 4 }}>
        <Typography variant="body2">
          <strong>Two modes available:</strong><br/>
          • <strong>With Website URL:</strong> Generate message with detailed company research (scrapes website)<br/>
          • <strong>Without Website URL:</strong> Generate message based only on LinkedIn profile
        </Typography>
      </Alert>

      {message && (
        <Alert severity={message.type} sx={{ mb: 3 }}>
          {message.text}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          {/* LinkedIn Profile Data */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <PersonIcon />
                  <Typography variant="h6" sx={{ ml: 1 }}>
                    LinkedIn Profile Data *
                  </Typography>
                </Box>
                
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Go to the LinkedIn profile you want to reach out to, press Ctrl+A to select all, then Ctrl+C to copy, and paste it here.
                </Typography>
                
                <TextField
                  fullWidth
                  multiline
                  rows={8}
                  value={formData.rawLinkedInText}
                  onChange={handleInputChange('rawLinkedInText')}
                  placeholder="Paste the entire LinkedIn profile page content here (Ctrl+A, Ctrl+C, Ctrl+V)..."
                  variant="outlined"
                  required
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: 'rgba(0, 0, 0, 0.02)',
                    }
                  }}
                />
              </CardContent>
            </Card>
          </Grid>

          {/* Website URL Input - Now Optional */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <LocationIcon />
                  <Typography variant="h6" sx={{ ml: 1 }}>
                    Target Website URL
                  </Typography>
                  <Chip 
                    label="Optional" 
                    size="small" 
                    sx={{ ml: 2 }}
                    color="default"
                  />
                </Box>
                
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Enter the company's website URL to include detailed company research in your message. Leave blank to generate a message based only on the LinkedIn profile.
                </Typography>
                
                <TextField
                  fullWidth
                  value={formData.websiteUrl}
                  onChange={handleInputChange('websiteUrl')}
                  placeholder="https://example.com (optional - leave blank to skip company research)"
                  variant="outlined"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: 'rgba(0, 0, 0, 0.02)',
                    }
                  }}
                />
              </CardContent>
            </Card>
          </Grid>

          {/* Call Preference Dropdown */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <ScheduleIcon />
                  <Typography variant="h6" sx={{ ml: 1 }}>
                    Call Preference *
                  </Typography>
                </Box>
                
                <FormControl fullWidth required>
                  <InputLabel>When would you like to schedule a call?</InputLabel>
                  <Select
                    value={formData.callPreference}
                    onChange={handleSelectChange('callPreference')}
                    label="When would you like to schedule a call?"
                    sx={{
                      backgroundColor: 'rgba(0, 0, 0, 0.02)',
                    }}
                  >
                    {callPreferenceOptions.map((option) => (
                      <MenuItem key={option} value={option}>
                        {option}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </CardContent>
            </Card>
          </Grid>

          {/* Outreach Type Dropdown */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <BusinessIcon />
                  <Typography variant="h6" sx={{ ml: 1 }}>
                    Outreach Type *
                  </Typography>
                </Box>
                
                <FormControl fullWidth required>
                  <InputLabel>What's your primary interest?</InputLabel>
                  <Select
                    value={formData.outreachType}
                    onChange={handleSelectChange('outreachType')}
                    label="What's your primary interest?"
                    sx={{
                      backgroundColor: 'rgba(0, 0, 0, 0.02)',
                    }}
                  >
                    {outreachTypeOptions.map((option) => (
                      <MenuItem key={option} value={option}>
                        {option}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={isSubmitting}
            sx={{
              px: 4,
              py: 1.5,
              backgroundColor: '#000',
              color: '#fff',
              '&:hover': {
                backgroundColor: '#333',
              },
              '&:disabled': {
                backgroundColor: '#ccc',
              }
            }}
          >
            {isSubmitting ? (
              <>
                <CircularProgress size={20} sx={{ mr: 1, color: '#fff' }} />
                {formData.websiteUrl ? 'Researching & Generating...' : 'Generating...'}
              </>
            ) : (
              'Generate Personalized Message'
            )}
          </Button>
        </Box>
      </form>

      {/* Generated Message Display */}
      {generatedMessage && (
        <Box sx={{ mt: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Typography variant="h5" gutterBottom>
              Generated Personalized Message
            </Typography>
            {generatedMessage.mode === 'profile-only' && (
              <Chip 
                label="Profile Only Mode" 
                color="info" 
                size="small" 
                sx={{ ml: 2 }}
              />
            )}
            {generatedMessage.mode === 'full-research' && (
              <Chip 
                label="Full Research Mode" 
                color="success" 
                size="small" 
                sx={{ ml: 2 }}
              />
            )}
          </Box>
          
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Subject: {generatedMessage.message.subject}
              </Typography>
              <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
                {generatedMessage.message.body}
              </Typography>
            </CardContent>
          </Card>

          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Approach
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {generatedMessage.message.approach}
              </Typography>
            </CardContent>
          </Card>

          {generatedMessage.companyInfo && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Company Information (Researched)
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Company: {generatedMessage.companyInfo.name}<br/>
                  URL: {generatedMessage.companyInfo.url}<br/>
                  Text Extracted: {generatedMessage.companyInfo.textLength} characters
                </Typography>
              </CardContent>
            </Card>
          )}

          {!generatedMessage.companyInfo && (
            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="body2">
                This message was generated using only the LinkedIn profile data. 
                Add a website URL to include detailed company research in future messages.
              </Typography>
            </Alert>
          )}
        </Box>
      )}

      <Divider sx={{ my: 4 }} />
      
      <Paper sx={{ p: 3, backgroundColor: '#f5f5f5' }}>
        <Typography variant="h6" gutterBottom>
          How This Works
        </Typography>
        <Typography variant="body2" color="text.secondary" component="div">
          <strong>With Website URL (Full Research Mode):</strong>
          <ol style={{ marginTop: '8px', marginBottom: '16px' }}>
            <li>Enter LinkedIn profile data</li>
            <li>Enter target company's website URL</li>
            <li>System crawls the company's About/Team pages</li>
            <li>AI analyzes both profile and company information</li>
            <li>Personalized message with detailed company insights is generated</li>
          </ol>
          
          <strong>Without Website URL (Profile Only Mode):</strong>
          <ol style={{ marginTop: '8px' }}>
            <li>Enter LinkedIn profile data only</li>
            <li>Select call preference and outreach type</li>
            <li>AI analyzes the LinkedIn profile</li>
            <li>Personalized message based on profile alone is generated</li>
            <li>Faster generation, no web scraping required</li>
          </ol>
        </Typography>
      </Paper>
    </Box>
  );
};

export default LinkedInEntry;