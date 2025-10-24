import { useAuth } from '../contexts/AuthContext';
import { getAuthErrorMessage } from '../utils/errorMessages';
import React, { useState, useEffect } from 'react';
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
  ArrowForward as ArrowForwardIcon,
  ArrowBack as ArrowBackIcon,
  Google as GoogleIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import MarketingHeader from '../components/MarketingHeader';
import Footer from '../components/Footer';

const steps = ['Personal Information', 'Search Details', 'Team & Experience', 'Preferences'];

export default function SignUp() {
  const navigate = useNavigate();
  const { signup, googleSignIn } = useAuth(); // <-- use googleSignIn
  const [activeStep, setActiveStep] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.title = 'Sign Up - Equitle';
  }, []);
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
      phone: formData.phone || null,
      location: formData.location || null,
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
      await signup(formData.email, formData.password, profile);
      navigate('/app');
    } catch (err: any) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // NEW: Google sign-in handler
  const handleGoogle = async () => {
    setError('');
    setLoading(true);
    try {
      await googleSignIn();
      navigate('/app');
    } catch (err: any) {
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
          placeholder="First Name *"
          value={formData.firstName}
          onChange={(e) => handleInputChange('firstName', e.target.value)}
          required
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <PersonIcon sx={{ color: '#FFFFFF' }} />
              </InputAdornment>
            )
          }}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          placeholder="Last Name *"
          value={formData.lastName}
          onChange={(e) => handleInputChange('lastName', e.target.value)}
          required
        />
      </Grid>
      <Grid item xs={12}>
        <TextField
          fullWidth
          placeholder="Email *"
          type="email"
          value={formData.email}
          onChange={(e) => handleInputChange('email', e.target.value)}
          required
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <EmailIcon sx={{ color: '#FFFFFF' }} />
              </InputAdornment>
            )
          }}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          placeholder="Phone Number"
          value={formData.phone}
          onChange={(e) => handleInputChange('phone', e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <PhoneIcon sx={{ color: '#FFFFFF' }} />
              </InputAdornment>
            )
          }}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          placeholder="Location"
          value={formData.location}
          onChange={(e) => handleInputChange('location', e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <LocationIcon sx={{ color: '#FFFFFF' }} />
              </InputAdornment>
            )
          }}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          placeholder="Password *"
          type={showPassword ? 'text' : 'password'}
          value={formData.password}
          onChange={(e) => handleInputChange('password', e.target.value)}
          required
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <LockIcon sx={{ color: '#FFFFFF' }} />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  onClick={() => setShowPassword(!showPassword)}
                  edge="end"
                  sx={{ color: '#FFFFFF' }}
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
          placeholder="Confirm Password *"
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
                  sx={{ color: '#FFFFFF' }}
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
          <Select
            value={formData.searchStage}
            onChange={(e) => handleInputChange('searchStage', e.target.value)}
            displayEmpty
            renderValue={(selected) => selected || 'Search Stage *'}
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
        <Select
            value={formData.searchDuration}
            onChange={(e) => handleInputChange('searchDuration', e.target.value)}
            displayEmpty
            renderValue={(selected) => selected || 'How long have you been searching? *'}
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
          <Select
            value={formData.targetCompanySize}
            onChange={(e) => handleInputChange('targetCompanySize', e.target.value)}
            displayEmpty
            renderValue={(selected) => selected || 'Target Company Size *'}
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
          <Select
            value={formData.investmentRange}
            onChange={(e) => handleInputChange('investmentRange', e.target.value)}
            displayEmpty
            renderValue={(selected) => selected || 'Investment Range *'}
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
        <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600, color: '#FFFFFF' }}>
          Target Industries (Select all that apply)
          {formData.targetIndustries.length > 0 && (
            <Typography component="span" variant="body2" sx={{ ml: 1, color: '#CCCCCC' }}>
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
          <Select
            value={formData.teamSize}
            onChange={(e) => handleInputChange('teamSize', e.target.value)}
            displayEmpty
            renderValue={(selected) => selected || 'Team Size *'}
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
          <Select
            value={formData.currentRole}
            onChange={(e) => handleInputChange('currentRole', e.target.value)}
            displayEmpty
            renderValue={(selected) => selected || 'Current Role *'}
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
          <Select
            value={formData.previousExperience}
            onChange={(e) => handleInputChange('previousExperience', e.target.value)}
            displayEmpty
            renderValue={(selected) => selected || 'Previous Experience *'}
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
          placeholder="Education Background (e.g., MBA from Stanford, BS in Engineering from MIT)"
          value={formData.education}
          onChange={(e) => handleInputChange('education', e.target.value)}
        />
      </Grid>
    </Grid>
  );

  const renderPreferences = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <FormControl component="fieldset">
          <FormLabel component="legend" sx={{ color: '#FFFFFF' }}>Communication Preference</FormLabel>
          <RadioGroup
            value={formData.communicationPreference}
            onChange={(e) => handleInputChange('communicationPreference', e.target.value)}
          >
            <FormControlLabel value="email" control={<Radio sx={{ color: '#10B981' }} />} label={<span style={{ color: '#FFFFFF' }}>Email</span>} />
            <FormControlLabel value="phone" control={<Radio sx={{ color: '#10B981' }} />} label={<span style={{ color: '#FFFFFF' }}>Phone</span>} />
            <FormControlLabel value="both" control={<Radio sx={{ color: '#10B981' }} />} label={<span style={{ color: '#FFFFFF' }}>Both Email and Phone</span>} />
          </RadioGroup>
        </FormControl>
      </Grid>
      <Grid item xs={12}>
        <FormControlLabel
          control={
            <Checkbox
              checked={formData.newsletter}
              onChange={(e) => handleInputChange('newsletter', e.target.checked)}
              sx={{ color: '#10B981' }}
            />
          }
          label={<span style={{ color: '#FFFFFF' }}>Subscribe to our newsletter for search fund insights and updates</span>}
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
          background: 'linear-gradient(180deg, #000000 0%, #434343 100%)',
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
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: 0,
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                backdropFilter: 'blur(10px)',
                '& .MuiTextField-root': {
                  '& .MuiInputLabel-root': {
                    color: '#FFFFFF',
                    '&.Mui-focused': {
                      color: '#10B981'
                    }
                  },
                  '& .MuiOutlinedInput-root': {
                    color: '#FFFFFF',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: 0,
                    '&:hover': {
                      borderColor: '#10B981'
                    },
                    '&.Mui-focused': {
                      borderColor: '#10B981',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#10B981'
                      }
                    },
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(255, 255, 255, 0.2)'
                    },
                    '& input::placeholder': {
                      color: '#FFFFFF',
                      opacity: 0.8
                    },
                    '& input': {
                      color: '#FFFFFF'
                    }
                  }
                },
                '& .MuiFormControl-root': {
                  '& .MuiInputLabel-root': {
                    color: '#FFFFFF',
                    '&.Mui-focused': {
                      color: '#10B981'
                    }
                  },
                  '& .MuiOutlinedInput-root': {
                    color: '#FFFFFF',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: 0,
                    '&:hover': {
                      borderColor: '#10B981'
                    },
                    '&.Mui-focused': {
                      borderColor: '#10B981',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#10B981'
                      }
                    },
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(255, 255, 255, 0.2)'
                    },
                    '& input::placeholder': {
                      color: '#FFFFFF',
                      opacity: 0.8
                    },
                    '& input': {
                      color: '#FFFFFF'
                    },
                    '& .MuiSelect-select': {
                      color: '#FFFFFF'
                    }
                  },
                  '& .MuiSelect-icon': {
                    color: '#FFFFFF'
                  }
                },
                '& .MuiMenuItem-root': {
                  color: '#FFFFFF',
                  backgroundColor: 'rgba(0, 0, 0, 0.8)',
                  '&:hover': {
                    backgroundColor: 'rgba(16, 185, 129, 0.2)'
                  },
                  '&.Mui-selected': {
                    backgroundColor: 'rgba(16, 185, 129, 0.3)',
                    '&:hover': {
                      backgroundColor: 'rgba(16, 185, 129, 0.4)'
                    }
                  }
                },
                '& .MuiPaper-root': {
                  backgroundColor: 'rgba(0, 0, 0, 0.9)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: 0
                },
                '& .MuiButton-root': {
                  fontFamily: '"Darker Grotesque", sans-serif',
                  fontWeight: 600,
                  textTransform: 'none',
                  borderRadius: 0,
                  '&.MuiButton-contained': {
                    background: 'linear-gradient(180deg, rgba(16, 185, 129, 0.6) 0%, rgba(5, 150, 105, 0.6) 30%, rgba(4, 120, 87, 0.6) 70%, rgba(6, 78, 59, 0.6) 100%)',
                    color: '#FFFFFF',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    '&:hover': {
                      background: 'linear-gradient(180deg, rgba(16, 185, 129, 0.8) 0%, rgba(5, 150, 105, 0.8) 30%, rgba(4, 120, 87, 0.8) 70%, rgba(6, 78, 59, 0.8) 100%)',
                      transform: 'none',
                      boxShadow: 'none'
                    }
                  },
                  '&.MuiButton-outlined': {
                    color: '#FFFFFF',
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                    '&:hover': {
                      borderColor: '#10B981',
                      backgroundColor: 'rgba(16, 185, 129, 0.1)',
                      transform: 'none',
                      boxShadow: 'none'
                    }
                  }
                }
              }}
            >
              <Box sx={{ textAlign: 'center', mb: 4 }}>
                <Typography
                  variant="h4"
                  sx={{
                    fontFamily: '"Darker Grotesque", sans-serif',
                    fontWeight: 700,
                    color: '#FFFFFF',
                    mb: 1
                  }}
                >
                  Welcome to Equitle
                </Typography>
                <Typography variant="body1" sx={{ color: '#CCCCCC' }}>
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
                          color: activeStep >= index ? '#FFFFFF' : 'rgba(255, 255, 255, 0.4)',
                          fontFamily: '"Darker Grotesque", sans-serif'
                        },
                        '& .MuiStepIcon-root': {
                          color: activeStep >= index ? '#10B981' : 'rgba(255, 255, 255, 0.2)',
                          '&.Mui-active': {
                            color: '#10B981'
                          },
                          '&.Mui-completed': {
                            color: '#10B981'
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
                <Alert severity="error" sx={{ mb: 3, backgroundColor: 'rgba(255, 0, 0, 0.1)', color: '#FFFFFF', border: '1px solid rgba(255, 0, 0, 0.3)' }}>
                  {error}
                </Alert>
              )}

              {/* Google sign-in button */}
              <Box sx={{ mb: 2 }}>
                <Button
                  onClick={handleGoogle}
                  variant="outlined"
                  fullWidth
                  startIcon={<GoogleIcon />}
                  disabled={loading}
                  sx={{
                    textTransform: 'none',
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                    color: '#FFFFFF',
                    '&:hover': { 
                      borderColor: '#10B981', 
                      backgroundColor: 'rgba(16, 185, 129, 0.1)',
                      transform: 'none',
                      boxShadow: 'none'
                    }
                  }}
                >
                  Continue with Google
                </Button>
              </Box>

              <Divider sx={{ my: 3, '& .MuiDivider-root': { borderColor: 'rgba(255, 255, 255, 0.2)' } }}>
                <Typography variant="body2" sx={{ color: '#CCCCCC' }}>
                  OR  
                </Typography>
              </Divider>

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
                      color: '#FFFFFF',
                      borderColor: 'rgba(255, 255, 255, 0.3)',
                      '&:hover': {
                        borderColor: '#10B981',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        transform: 'none',
                        boxShadow: 'none'
                      }
                    }}
                    variant="outlined"
                  >
                    Back
                  </Button>
                  
                  <Typography variant="body2" sx={{ flex: 1, textAlign: 'center', color: '#CCCCCC' }}>
                    
                  </Typography>
                  
                  {activeStep === steps.length - 1 ? (
                    <Button
                      type="submit"
                      variant="contained"
                      disabled={loading || !formData.termsAccepted}
                      endIcon={<ArrowForwardIcon />}
                      sx={{
                        background: 'linear-gradient(180deg, rgba(16, 185, 129, 0.6) 0%, rgba(5, 150, 105, 0.6) 30%, rgba(4, 120, 87, 0.6) 70%, rgba(6, 78, 59, 0.6) 100%)',
                        color: '#FFFFFF',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        '&:hover': {
                          background: 'linear-gradient(180deg, rgba(16, 185, 129, 0.8) 0%, rgba(5, 150, 105, 0.8) 30%, rgba(4, 120, 87, 0.8) 70%, rgba(6, 78, 59, 0.8) 100%)',
                          transform: 'none',
                          boxShadow: 'none'
                        },
                        '&:disabled': {
                          background: 'rgba(255, 255, 255, 0.1)',
                          color: 'rgba(255, 255, 255, 0.4)',
                          border: '1px solid rgba(255, 255, 255, 0.1)'
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
                        background: 'linear-gradient(180deg, rgba(16, 185, 129, 0.6) 0%, rgba(5, 150, 105, 0.6) 30%, rgba(4, 120, 87, 0.6) 70%, rgba(6, 78, 59, 0.6) 100%)',
                        color: '#FFFFFF',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        '&:hover': {
                          background: 'linear-gradient(180deg, rgba(16, 185, 129, 0.8) 0%, rgba(5, 150, 105, 0.8) 30%, rgba(4, 120, 87, 0.8) 70%, rgba(6, 78, 59, 0.8) 100%)',
                          transform: 'none',
                          boxShadow: 'none'
                        }
                      }}
                    >
                      Next
                    </Button>
                  )}
                </Box>
              </form>

              <Box sx={{ textAlign: 'center', mt: 3 }}>
                <Typography variant="body2" sx={{ color: '#CCCCCC' }}>
                  Already have an account?{' '}
                  <Link
                    component="button"
                    variant="body2"
                    onClick={() => navigate('/login')}
                    sx={{ 
                      color: '#10B981', 
                      textDecoration: 'none',
                      fontWeight: 500,
                      '&:hover': { 
                        textDecoration: 'underline',
                        color: '#059669'
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
