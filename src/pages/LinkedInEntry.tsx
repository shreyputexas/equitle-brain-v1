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
  MenuItem
} from '@mui/material';
import {
  Person as PersonIcon,
  Work as WorkIcon,
  School as SchoolIcon,
  LocationOn as LocationIcon,
  Psychology as PsychologyIcon,
  Article as ArticleIcon,
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

const LinkedInEntry: React.FC = () => {
  const [formData, setFormData] = useState<LinkedInData>({
    interest: '',
    aboutMe: '',
    experience: '',
    latestPost: '',
    education: '',
    location: '',
    callPreference: '',
    outreachType: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [generatedMessage, setGeneratedMessage] = useState<any>(null);

  const handleInputChange = (field: keyof LinkedInData) => (
    event: React.ChangeEvent<HTMLInputElement>
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

    if (!websiteUrl) {
      setMessage({
        type: 'error',
        text: 'Please enter a website URL to scrape.'
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
          linkedinData: formData,
          websiteUrl: websiteUrl
        })
      });

      const result = await response.json();

      if (result.success) {
        setGeneratedMessage(result.data);
        setMessage({
          type: 'success',
          text: 'Personalized message generated successfully!'
        });
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

  const formFields = [
    {
      key: 'interest' as keyof LinkedInData,
      label: 'Interest',
      placeholder: 'What are you passionate about? What drives you professionally?',
      icon: <PsychologyIcon />,
      multiline: true,
      rows: 3
    },
    {
      key: 'aboutMe' as keyof LinkedInData,
      label: 'About Me',
      placeholder: 'Tell us about yourself, your background, and what makes you unique...',
      icon: <PersonIcon />,
      multiline: true,
      rows: 4
    },
    {
      key: 'experience' as keyof LinkedInData,
      label: 'Experience',
      placeholder: 'Describe your professional experience, key achievements, and career highlights...',
      icon: <WorkIcon />,
      multiline: true,
      rows: 4
    },
    {
      key: 'latestPost' as keyof LinkedInData,
      label: 'Latest Post',
      placeholder: 'Share your most recent LinkedIn post or professional update...',
      icon: <ArticleIcon />,
      multiline: true,
      rows: 3
    },
    {
      key: 'education' as keyof LinkedInData,
      label: 'Education',
      placeholder: 'Your educational background, degrees, certifications, etc.',
      icon: <SchoolIcon />,
      multiline: true,
      rows: 2
    },
    {
      key: 'location' as keyof LinkedInData,
      label: 'Location',
      placeholder: 'City, State/Country',
      icon: <LocationIcon />,
      multiline: false,
      rows: 1
    }
  ];

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
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Enter your LinkedIn profile information to generate personalized outreach messages. 
        This data will be combined with company website information to create custom messages.
      </Typography>

      {message && (
        <Alert severity={message.type} sx={{ mb: 3 }}>
          {message.text}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          {/* Website URL Input */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <LocationIcon />
                  <Typography variant="h6" sx={{ ml: 1 }}>
                    Target Website URL
                  </Typography>
                </Box>
                
                <TextField
                  fullWidth
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  placeholder="https://example.com (the company website to scrape)"
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

          {formFields.map((field) => (
            <Grid item xs={12} key={field.key}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    {field.icon}
                    <Typography variant="h6" sx={{ ml: 1 }}>
                      {field.label}
                    </Typography>
                  </Box>
                  
                  <TextField
                    fullWidth
                    multiline={field.multiline}
                    rows={field.rows}
                    value={formData[field.key]}
                    onChange={handleInputChange(field.key)}
                    placeholder={field.placeholder}
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
          ))}

          {/* Call Preference Dropdown */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <ScheduleIcon />
                  <Typography variant="h6" sx={{ ml: 1 }}>
                    Call Preference
                  </Typography>
                </Box>
                
                <FormControl fullWidth>
                  <InputLabel>When would you like to schedule a call?</InputLabel>
                  <Select
                    value={formData.callPreference}
                    onChange={(e) => setFormData(prev => ({ ...prev, callPreference: e.target.value }))}
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
                    Outreach Type
                  </Typography>
                </Box>
                
                <FormControl fullWidth>
                  <InputLabel>What's your primary interest?</InputLabel>
                  <Select
                    value={formData.outreachType}
                    onChange={(e) => setFormData(prev => ({ ...prev, outreachType: e.target.value }))}
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
                Processing...
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
          <Typography variant="h5" gutterBottom>
            Generated Personalized Message
          </Typography>
          
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
                Approach: {generatedMessage.message.approach}
              </Typography>
            </CardContent>
          </Card>

          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Company Information
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Company: {generatedMessage.companyInfo.name}<br/>
                URL: {generatedMessage.companyInfo.url}<br/>
                Text Length: {generatedMessage.companyInfo.textLength} characters
              </Typography>
            </CardContent>
          </Card>
        </Box>
      )}

      <Divider sx={{ my: 4 }} />
      
      <Paper sx={{ p: 3, backgroundColor: '#f5f5f5' }}>
        <Typography variant="h6" gutterBottom>
          How This Works
        </Typography>
        <Typography variant="body2" color="text.secondary">
          1. Enter your LinkedIn profile information above<br/>
          2. Enter the target company's website URL<br/>
          3. The system will crawl the company's About/Team pages<br/>
          4. AI will analyze both your profile and company information<br/>
          5. A personalized outreach message will be generated<br/>
          6. You can customize and send the message
        </Typography>
      </Paper>
    </Box>
  );
};

export default LinkedInEntry;
