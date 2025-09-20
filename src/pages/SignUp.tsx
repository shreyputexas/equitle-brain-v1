import { useAuth } from '../contexts/AuthContext';
import { getAuthErrorMessage } from '../utils/errorMessages';
import React, { useState } from 'react';
import {
  Box,
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Link,
  Alert,
  InputAdornment,
  IconButton,
  Divider,
  Fade,
  Stepper,
  Step,
  StepLabel,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  FormControlLabel,
  Checkbox,
  RadioGroup,
  Radio,
  FormLabel
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Email as EmailIcon,
  Lock as LockIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  ArrowForward as ArrowForwardIcon,
  ArrowBack as ArrowBackIcon,
  Google as GoogleIcon,
  Microsoft as MicrosoftIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import MarketingHeader from '../components/MarketingHeader';
import Footer from '../components/Footer';

const steps = ['Personal Information', 'Search Details', 'Team & Experience', 'Preferences'];

export default function SignUp() {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const [activeStep, setActiveStep] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    // Personal Information
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    location: '',
    password: '',
    confirmPassword: '',
    
    // Search Details
    searchStage: '',
    searchDuration: '',
    targetCompanySize: '',
    targetIndustries: [] as string[],
    investmentRange: '',
    
    // Team & Experience
    teamSize: '',
    previousExperience: '',
    currentRole: '',
    education: '',
    
    // Preferences
    communicationPreference: '',
    newsletter: false,
    termsAccepted: false
  });

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    // Basic validation for each step
    if (activeStep === 0) {
      if (!formData.firstName || !formData.lastName || !formData.email || !formData.password || !formData.confirmPassword) {
        setError('Please fill in all required fields');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        return;
      }
    } else if (activeStep === 1) {
      if (!formData.searchStage || !formData.searchDuration || !formData.targetCompanySize || !formData.investmentRange) {
        setError('Please fill in all required search details');
        return;
      }
    } else if (activeStep === 2) {
      if (!formData.teamSize || !formData.currentRole || !formData.previousExperience) {
        setError('Please fill in all required team and experience details');
        return;
      }
    }
    
    setError(''); // Clear any previous errors
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };


const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError('');
  setLoading(true);

  const profile = {
    firstName: formData.firstName,
    lastName: formData.lastName,
    phone: formData.phone,
    location: formData.location,
    searchDetails: {
      searchStage: formData.searchStage,
      searchDuration: formData.searchDuration,
      companySize: formData.targetCompanySize,
      investmentRange: formData.investmentRange,
      industries: formData.targetIndustries,
    },
    teamExperience: {
      teamSize: formData.teamSize,
      currentRole: formData.currentRole,
      previousExperience: formData.previousExperience,
      education: formData.education,
    },
    preferences: {
      communication: formData.communicationPreference,
      newsletter: formData.newsletter,
      agreeTerms: formData.termsAccepted,
    },
  };

  try {
    console.log('Sign up data:', profile);
    await signup(formData.email, formData.password, profile);
    navigate('/app');
  } catch (err: any) {
    console.error('Sign up error:', err);
    setError(getAuthErrorMessage(err));
  } finally {
    setLoading(false);
  }
};



  const renderPersonalInfo = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="First Name"
          value={formData.firstName}
          onChange={(e) => handleInputChange('firstName', e.target.value)}
          required
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <PersonIcon sx={{ color: 'text.secondary' }} />
              </InputAdornment>
            )
          }}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Last Name"
          value={formData.lastName}
          onChange={(e) => handleInputChange('lastName', e.target.value)}
          required
        />
      </Grid>
      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Email"
          type="email"
          value={formData.email}
          onChange={(e) => handleInputChange('email', e.target.value)}
          required
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <EmailIcon sx={{ color: 'text.secondary' }} />
              </InputAdornment>
            )
          }}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Phone Number"
          value={formData.phone}
          onChange={(e) => handleInputChange('phone', e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <PhoneIcon sx={{ color: 'text.secondary' }} />
              </InputAdornment>
            )
          }}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Location"
          value={formData.location}
          onChange={(e) => handleInputChange('location', e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <LocationIcon sx={{ color: 'text.secondary' }} />
              </InputAdornment>
            )
          }}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Password"
          type={showPassword ? 'text' : 'password'}
          value={formData.password}
          onChange={(e) => handleInputChange('password', e.target.value)}
          required
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <LockIcon sx={{ color: 'text.secondary' }} />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  onClick={() => setShowPassword(!showPassword)}
                  edge="end"
                >
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            )
          }}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Confirm Password"
          type={showConfirmPassword ? 'text' : 'password'}
          value={formData.confirmPassword}
          onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
          required
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  edge="end"
                >
                  {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            )
          }}
        />
      </Grid>
    </Grid>
  );

  const renderSearchDetails = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth required>
          <InputLabel>Search Stage</InputLabel>
          <Select
            value={formData.searchStage}
            onChange={(e) => handleInputChange('searchStage', e.target.value)}
            label="Search Stage"
          >
            <MenuItem value="planning">Planning Phase</MenuItem>
            <MenuItem value="active">Active Search</MenuItem>
            <MenuItem value="due-diligence">Due Diligence</MenuItem>
            <MenuItem value="closing">Closing</MenuItem>
            <MenuItem value="post-acquisition">Post-Acquisition</MenuItem>
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth required>
          <InputLabel>How long have you been searching?</InputLabel>
          <Select
            value={formData.searchDuration}
            onChange={(e) => handleInputChange('searchDuration', e.target.value)}
            label="How long have you been searching?"
          >
            <MenuItem value="0-6-months">0-6 months</MenuItem>
            <MenuItem value="6-12-months">6-12 months</MenuItem>
            <MenuItem value="1-2-years">1-2 years</MenuItem>
            <MenuItem value="2-3-years">2-3 years</MenuItem>
            <MenuItem value="3+ years">3+ years</MenuItem>
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth required>
          <InputLabel>Target Company Size</InputLabel>
          <Select
            value={formData.targetCompanySize}
            onChange={(e) => handleInputChange('targetCompanySize', e.target.value)}
            label="Target Company Size"
          >
            <MenuItem value="<1M">Under $1M Revenue</MenuItem>
            <MenuItem value="1M-5M">$1M - $5M Revenue</MenuItem>
            <MenuItem value="5M-10M">$5M - $10M Revenue</MenuItem>
            <MenuItem value="10M-25M">$10M - $25M Revenue</MenuItem>
            <MenuItem value="25M+">$25M+ Revenue</MenuItem>
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth required>
          <InputLabel>Investment Range</InputLabel>
          <Select
            value={formData.investmentRange}
            onChange={(e) => handleInputChange('investmentRange', e.target.value)}
            label="Investment Range"
          >
            <MenuItem value="<1M">Under $1M</MenuItem>
            <MenuItem value="1M-5M">$1M - $5M</MenuItem>
            <MenuItem value="5M-10M">$5M - $10M</MenuItem>
            <MenuItem value="10M-25M">$10M - $25M</MenuItem>
            <MenuItem value="25M+">$25M+</MenuItem>
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12}>
        <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
          Target Industries (Select all that apply)
          {formData.targetIndustries.length > 0 && (
            <Typography component="span" variant="body2" sx={{ ml: 1, color: 'text.secondary' }}>
              ({formData.targetIndustries.length} selected)
            </Typography>
          )}
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
          {[
            'Technology', 'Healthcare', 'Manufacturing', 'Services', 
            'Retail', 'Food & Beverage', 'Construction', 'Transportation',
            'Financial Services', 'Education', 'Real Estate', 'Other'
          ].map((industry) => (
            <Chip
              key={industry}
              label={industry}
              clickable
              color={formData.targetIndustries.includes(industry) ? 'primary' : 'default'}
              onClick={() => {
                const newIndustries = formData.targetIndustries.includes(industry)
                  ? formData.targetIndustries.filter(i => i !== industry)
                  : [...formData.targetIndustries, industry];
                handleInputChange('targetIndustries', newIndustries);
              }}
              sx={{
                backgroundColor: formData.targetIndustries.includes(industry) 
                  ? 'rgba(156, 163, 175, 0.2)' 
                  : 'rgba(156, 163, 175, 0.05)',
                border: formData.targetIndustries.includes(industry) 
                  ? '1px solid rgba(156, 163, 175, 0.5)' 
                  : '1px solid rgba(156, 163, 175, 0.2)',
                color: formData.targetIndustries.includes(industry) 
                  ? 'black' 
                  : 'rgba(0, 0, 0, 0.7)',
                '&:hover': {
                  backgroundColor: formData.targetIndustries.includes(industry) 
                    ? 'rgba(156, 163, 175, 0.3)' 
                    : 'rgba(156, 163, 175, 0.1)',
                  border: '1px solid rgba(156, 163, 175, 0.4)'
                }
              }}
            />
          ))}
        </Box>
        
        {formData.targetIndustries.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Selected industries:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {formData.targetIndustries.map((industry) => (
                <Chip
                  key={industry}
                  label={industry}
                  size="small"
                  onDelete={() => {
                    const newIndustries = formData.targetIndustries.filter(i => i !== industry);
                    handleInputChange('targetIndustries', newIndustries);
                  }}
                  sx={{
                    backgroundColor: 'rgba(156, 163, 175, 0.15)',
                    border: '1px solid rgba(156, 163, 175, 0.3)',
                    color: 'black',
                    '& .MuiChip-deleteIcon': {
                      color: 'rgba(0, 0, 0, 0.6)',
                      '&:hover': {
                        color: 'black'
                      }
                    }
                  }}
                />
              ))}
            </Box>
          </Box>
        )}
      </Grid>
    </Grid>
  );

  const renderTeamExperience = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth required>
          <InputLabel>Team Size</InputLabel>
          <Select
            value={formData.teamSize}
            onChange={(e) => handleInputChange('teamSize', e.target.value)}
            label="Team Size"
          >
            <MenuItem value="solo">Solo Searcher</MenuItem>
            <MenuItem value="2-3">2-3 People</MenuItem>
            <MenuItem value="4-5">4-5 People</MenuItem>
            <MenuItem value="6-10">6-10 People</MenuItem>
            <MenuItem value="10+">10+ People</MenuItem>
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth required>
          <InputLabel>Current Role</InputLabel>
          <Select
            value={formData.currentRole}
            onChange={(e) => handleInputChange('currentRole', e.target.value)}
            label="Current Role"
          >
            <MenuItem value="searcher">Searcher</MenuItem>
            <MenuItem value="co-searcher">Co-Searcher</MenuItem>
            <MenuItem value="investor">Investor</MenuItem>
            <MenuItem value="advisor">Advisor</MenuItem>
            <MenuItem value="other">Other</MenuItem>
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12}>
        <FormControl fullWidth required>
          <InputLabel>Previous Experience</InputLabel>
          <Select
            value={formData.previousExperience}
            onChange={(e) => handleInputChange('previousExperience', e.target.value)}
            label="Previous Experience"
          >
            <MenuItem value="none">No previous search experience</MenuItem>
            <MenuItem value="1-search">1 previous search</MenuItem>
            <MenuItem value="2-3-searches">2-3 previous searches</MenuItem>
            <MenuItem value="4+ searches">4+ previous searches</MenuItem>
            <MenuItem value="pe-experience">Private equity experience</MenuItem>
            <MenuItem value="investment-banking">Investment banking</MenuItem>
            <MenuItem value="consulting">Management consulting</MenuItem>
            <MenuItem value="entrepreneur">Entrepreneur</MenuItem>
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Education Background"
          value={formData.education}
          onChange={(e) => handleInputChange('education', e.target.value)}
          placeholder="e.g., MBA from Stanford, BS in Engineering from MIT"
        />
      </Grid>
    </Grid>
  );

  const renderPreferences = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <FormControl component="fieldset">
          <FormLabel component="legend">Communication Preference</FormLabel>
          <RadioGroup
            value={formData.communicationPreference}
            onChange={(e) => handleInputChange('communicationPreference', e.target.value)}
          >
            <FormControlLabel value="email" control={<Radio />} label="Email" />
            <FormControlLabel value="phone" control={<Radio />} label="Phone" />
            <FormControlLabel value="both" control={<Radio />} label="Both Email and Phone" />
          </RadioGroup>
        </FormControl>
      </Grid>
      <Grid item xs={12}>
        <FormControlLabel
          control={
            <Checkbox
              checked={formData.newsletter}
              onChange={(e) => handleInputChange('newsletter', e.target.checked)}
            />
          }
          label="Subscribe to our newsletter for search fund insights and updates"
        />
      </Grid>
      <Grid item xs={12}>
        <FormControlLabel
          control={
            <Checkbox
              checked={formData.termsAccepted}
              onChange={(e) => handleInputChange('termsAccepted', e.target.checked)}
              required
              sx={{
                '&.Mui-checked': {
                  color: '#374151'
                }
              }}
            />
          }
          label={
            <Typography variant="body2" sx={{ color: 'text.primary', lineHeight: 1.5 }}>
              I agree to the{' '}
              <Link 
                href="#" 
                sx={{ 
                  color: '#374151',
                  textDecoration: 'underline',
                  fontWeight: 500,
                  '&:hover': {
                    color: '#1F2937',
                    textDecoration: 'underline'
                  }
                }}
              >
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link 
                href="#" 
                sx={{ 
                  color: '#374151',
                  textDecoration: 'underline',
                  fontWeight: 500,
                  '&:hover': {
                    color: '#1F2937',
                    textDecoration: 'underline'
                  }
                }}
              >
                Privacy Policy
              </Link>
            </Typography>
          }
          sx={{ alignItems: 'flex-start' }}
        />
      </Grid>
    </Grid>
  );

  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return renderPersonalInfo();
      case 1:
        return renderSearchDetails();
      case 2:
        return renderTeamExperience();
      case 3:
        return renderPreferences();
      default:
        return 'Unknown step';
    }
  };

  return (
    <>
      <MarketingHeader />
      <Box
        sx={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #FFFFFF 0%, #F8F8FF 100%)',
          py: 4,
          pt: { xs: 16, md: 20 }
        }}
      >
        <Container maxWidth="md">
          <Fade in timeout={1000}>
            <Paper
              elevation={0}
              sx={{
                p: 6,
                background: 'white',
                border: '1px solid rgba(94, 92, 230, 0.08)',
                borderRadius: 3,
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)'
              }}
            >
              <Box sx={{ textAlign: 'center', mb: 4 }}>
                <Typography
                  variant="h4"
                  sx={{
                    fontFamily: '"Space Grotesk", sans-serif',
                    fontWeight: 700,
                    mb: 1
                  }}
                >
                  Join the Search Fund Community
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Tell us about your search to get started
                </Typography>
              </Box>

              <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
                {steps.map((label, index) => (
                  <Step key={label}>
                    <StepLabel
                      sx={{
                        '& .MuiStepLabel-label': {
                          fontSize: '0.875rem',
                          fontWeight: activeStep === index ? 600 : 400,
                          color: activeStep >= index ? '#374151' : 'rgba(0, 0, 0, 0.4)'
                        },
                        '& .MuiStepIcon-root': {
                          color: activeStep >= index ? '#374151' : 'rgba(0, 0, 0, 0.2)',
                          '&.Mui-active': {
                            color: '#374151'
                          },
                          '&.Mui-completed': {
                            color: '#374151'
                          }
                        }
                      }}
                    >
                      {label}
                    </StepLabel>
                  </Step>
                ))}
              </Stepper>

              {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {error}
                </Alert>
              )}

              <form onSubmit={handleSubmit}>
                <Box sx={{ mb: 4 }}>
                  {getStepContent(activeStep)}
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Button
                    disabled={activeStep === 0}
                    onClick={handleBack}
                    startIcon={<ArrowBackIcon />}
                    sx={{ 
                      display: activeStep === 0 ? 'none' : 'flex',
                      color: '#374151',
                      borderColor: '#374151',
                      '&:hover': {
                        borderColor: '#1F2937',
                        backgroundColor: 'rgba(55, 65, 81, 0.04)'
                      }
                    }}
                    variant="outlined"
                  >
                    Back
                  </Button>
                  
                  <Typography variant="body2" color="text.secondary" sx={{ flex: 1, textAlign: 'center' }}>
                    Step {activeStep + 1} of {steps.length}
                  </Typography>
                  
                  {activeStep === steps.length - 1 ? (
                    <Button
                      type="submit"
                      variant="contained"
                      disabled={loading || !formData.termsAccepted}
                      endIcon={<ArrowForwardIcon />}
                      sx={{
                        background: 'linear-gradient(135deg, #9CA3AF 0%, #374151 100%)',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #6B7280 0%, #1F2937 100%)'
                        },
                        '&:disabled': {
                          background: 'rgba(156, 163, 175, 0.3)',
                          color: 'rgba(0, 0, 0, 0.4)'
                        }
                      }}
                    >
                      {loading ? 'Creating Account...' : 'Create Account'}
                    </Button>
                  ) : (
                    <Button
                      variant="contained"
                      onClick={handleNext}
                      endIcon={<ArrowForwardIcon />}
                      sx={{
                        background: 'linear-gradient(135deg, #9CA3AF 0%, #374151 100%)',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #6B7280 0%, #1F2937 100%)'
                        }
                      }}
                    >
                      Next
                    </Button>
                  )}
                </Box>
              </form>

              <Divider sx={{ my: 3 }}>
                <Typography variant="body2" color="text.secondary">
                  OR
                </Typography>
              </Divider>

              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Already have an account?{' '}
                  <Link
                    component="button"
                    variant="body2"
                    onClick={() => navigate('/login')}
                    sx={{ 
                      color: 'text.primary', 
                      textDecoration: 'none',
                      fontWeight: 500,
                      '&:hover': {
                        textDecoration: 'underline'
                      }
                    }}
                  >
                    Sign in
                  </Link>
                </Typography>
              </Box>
            </Paper>
          </Fade>
        </Container>
      </Box>
      <Footer />
    </>
  );
}