import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Grid
} from '@mui/material';
import { collection, addDoc } from 'firebase/firestore';
import { signInAnonymously } from 'firebase/auth';
import { db, auth } from '../firebase/config';
import MarketingHeader from '../components/MarketingHeader';
import Footer from '../components/Footer';

export default function Network() {
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    type: 'pe-firm'
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (e: any) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      console.log('Firebase app config:', db.app.options);
      console.log('Attempting to submit to Firebase...', formData);

      // Remove anonymous auth for now - will use Firestore rules instead

      // Test if we can even access the collection reference
      const collectionRef = collection(db, 'network-requests');
      console.log('Collection reference created:', collectionRef);

      const docRef = await addDoc(collectionRef, {
        email: formData.email,
        phone: formData.phone,
        type: formData.type,
        timestamp: new Date().toISOString(),
        status: 'pending',
        createdAt: new Date()
      });

      console.log('Successfully submitted with ID:', docRef.id);
      alert('Thank you for your interest! We\'ll be in touch soon.');

      setFormData({
        email: '',
        phone: '',
        type: 'pe-firm'
      });
    } catch (error: any) {
      console.error('Full error object:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);

      if (error.code === 'permission-denied') {
        alert('Database permissions error. Please contact support.');
      } else if (error.code === 'unavailable') {
        alert('Firebase service unavailable. Check if Firestore is enabled.');
      } else {
        alert(`Error: ${error.message}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box sx={{ background: 'linear-gradient(180deg, #000000 0%, #434343 100%)', minHeight: '100vh', position: 'relative' }}>
      <MarketingHeader />
      
      {/* Hero Section with Form */}
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          background: 'linear-gradient(180deg, #000000 0%, #434343 100%)',
          color: '#FFFFFF',
          pt: { xs: 12, md: 14 },
          position: 'relative',
          zIndex: 1,
          overflow: 'hidden',
          pointerEvents: 'auto'
        }}
      >
        <Container maxWidth={false} sx={{ px: { xs: 2, md: 4 }, position: 'relative', zIndex: 2 }}>
          <Box sx={{ textAlign: 'center', mb: 8 }}>
            {/* Main Heading */}
            <Typography 
              variant="h1" 
              sx={{ 
                fontFamily: "'Darker Grotesque', 'Outfit', 'Inter', 'Poppins', 'Roboto', 'Helvetica', 'Arial', sans-serif",
                fontWeight: 800,
                fontSize: { xs: '2.5rem', md: '4.5rem' },
                lineHeight: 1.1,
                mb: 4,
                color: '#FFFFFF',
                background: 'linear-gradient(135deg, #FFFFFF 0%, #E5E7EB 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
            >
              Join the Ecosystem
            </Typography>
            
            {/* Subheading */}
            <Typography 
              variant="body1" 
              sx={{ 
                fontFamily: "'Poppins', 'Inter', 'Roboto', 'Helvetica', 'Arial', sans-serif",
                fontWeight: 400,
                fontSize: { xs: '1rem', md: '1.25rem' },
                mb: 6,
                color: 'rgba(255, 255, 255, 0.8)',
                maxWidth: '800px',
                mx: 'auto',
                lineHeight: 1.6
              }}
            >
              Connect with{' '}
              <Box component="span" sx={{ 
                color: '#10B981',
                fontWeight: 600
              }}>
                investors, private equity firms, brokers, and lawyers
              </Box>
              {' '}to accelerate deal flow and create lasting value.
            </Typography>

          </Box>
            
            {/* Form Section */}
            <Box sx={{ 
              maxWidth: '1400px', 
              mx: 'auto', 
              px: { xs: 4, md: 8 },
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '16px',
              py: 6,
              backdropFilter: 'blur(10px)'
            }}>
              <Typography 
                variant="h5" 
                sx={{ 
                  textAlign: 'center',
                  mb: 4,
                  color: '#FFFFFF',
                  fontFamily: "'Poppins', 'Inter', 'Roboto', 'Helvetica', 'Arial', sans-serif",
                  fontWeight: 600
                }}
              >
               
              </Typography>
              
              <form onSubmit={handleSubmit}>
                <Grid container spacing={3} alignItems="center" justifyContent="center">
                  <Grid item xs={12} sm={3}>
                    <TextField
                      fullWidth
                      placeholder="john@domain.com"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          color: '#000000',
                          borderRadius: 0,
                          px: 2,
                          '& fieldset': {
                            borderColor: '#000000',
                            borderWidth: '1px',
                          },
                          '&:hover fieldset': {
                            borderColor: '#000000',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#000000',
                          },
                        },
                        '& .MuiInputBase-input::placeholder': {
                          color: 'rgba(0, 0, 0, 0.6)',
                          opacity: 1,
                          textAlign: 'center',
                        },
                        '& .MuiInputBase-input': {
                          textAlign: 'center',
                        },
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <TextField
                      fullWidth
                      placeholder="+1 (123) 456-7890"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      required
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          color: '#000000',
                          borderRadius: 0,
                          px: 2,
                          '& fieldset': {
                            borderColor: '#000000',
                            borderWidth: '1px',
                          },
                          '&:hover fieldset': {
                            borderColor: '#000000',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#000000',
                          },
                        },
                        '& .MuiInputBase-input::placeholder': {
                          color: 'rgba(0, 0, 0, 0.6)',
                          opacity: 1,
                          textAlign: 'center',
                        },
                        '& .MuiInputBase-input': {
                          textAlign: 'center',
                        },
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <FormControl fullWidth>
                      <Select
                        name="type"
                        value={formData.type}
                        onChange={handleSelectChange}
                        required
                        displayEmpty
                        sx={{
                          color: '#000000',
                          backgroundColor: '#FFFFFF',
                          borderRadius: 0,
                          px: 2,
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#000000',
                          borderWidth: '1px',
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#000000',
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#000000',
                        },
                          '& .MuiSelect-select': {
                            color: '#000000',
                          },
                        }}
                        MenuProps={{
                          PaperProps: {
                            sx: {
                              borderRadius: 0,
                              border: '1px solid #000000',
                              '& .MuiMenuItem-root': {
                                borderBottom: '1px solid #000000',
                                '&:last-child': {
                                  borderBottom: 'none',
                                },
                                '&:hover': {
                                  backgroundColor: '#10B981',
                                  color: '#FFFFFF',
                                },
                              },
                            },
                          },
                        }}
                      >
                        <MenuItem value="pe-firm">Private Equity Firm</MenuItem>
                        <MenuItem value="pe-lp">Private Equity LP</MenuItem>
                        <MenuItem value="search-fund-investor">Search Fund Investor</MenuItem>
                        <MenuItem value="broker">Broker</MenuItem>
                        <MenuItem value="active-searcher">Active Searcher</MenuItem>
                        <MenuItem value="ma-lawyer">M&A Lawyer</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <Button
                      type="submit"
                      variant="contained"
                      size="medium"
                      fullWidth
                      disabled={isSubmitting}
                      sx={{
                        background: `
                          linear-gradient(180deg, rgba(16, 185, 129, 0.6) 0%, rgba(5, 150, 105, 0.6) 30%, rgba(4, 120, 87, 0.6) 70%, rgba(6, 78, 59, 0.6) 100%),
                          radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%),
                          radial-gradient(circle at 80% 20%, rgba(255,255,255,0.05) 0%, transparent 50%),
                          radial-gradient(circle at 40% 80%, rgba(0,0,0,0.1) 0%, transparent 50%)
                        `,
                        backdropFilter: 'blur(10px)',
                        color: '#FFFFFF',
                        border: '1px solid rgba(16, 185, 129, 0.4)',
                        py: 1.5,
                        px: 4,
                        fontSize: '1.1rem',
                        fontWeight: 600,
                        position: 'relative',
                        overflow: 'hidden',
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          background: `
                            repeating-linear-gradient(
                              0deg,
                              transparent,
                              transparent 2px,
                              rgba(255,255,255,0.03) 2px,
                              rgba(255,255,255,0.03) 4px
                            ),
                            repeating-linear-gradient(
                              90deg,
                              transparent,
                              transparent 2px,
                              rgba(0,0,0,0.02) 2px,
                              rgba(0,0,0,0.02) 4px
                            )
                          `,
                          pointerEvents: 'none',
                          zIndex: 1
                        },
                        '&::after': {
                          content: '""',
                          position: 'absolute',
                          top: 0,
                          left: '-100%',
                          width: '100%',
                          height: '100%',
                          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
                          animation: 'slideShine 1.5s infinite',
                          zIndex: 2
                        },
                      }}
                    >
{isSubmitting ? 'Submitting...' : 'Request Spot'}
                    </Button>
                  </Grid>
                </Grid>
              </form>
            </Box>
        </Container>
      </Box>
      
      <Box sx={{ position: 'relative', zIndex: 1 }}>
        <Footer />
      </Box>
    </Box>
  );
}