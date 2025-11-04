import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  TextField,
  Grid
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import MarketingHeader from '../components/MarketingHeader';
import Footer from '../components/Footer';

export default function SignUp() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    console.log('Request credentials for:', email);
    // Here you would typically send the data to your backend
    setTimeout(() => {
      alert('Thank you for your request! We\'ll send you credentials soon.');
      setLoading(false);
    }, 1000);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  };

  return (
    <Box sx={{ background: 'linear-gradient(180deg, #000000 0%, #434343 100%)', minHeight: '100vh' }}>
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
          overflow: 'hidden'
        }}
      >
        <Container maxWidth={false} sx={{ px: { xs: 2, md: 4 }, position: 'relative', zIndex: 1 }}>
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
              Request Credentials
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
              Enter your{' '}
              <Box component="span" sx={{ 
                color: '#10B981',
                fontWeight: 600
              }}>
                email address
              </Box>
              {' '}and we'll send you access credentials to get started.
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
              <form onSubmit={handleSubmit}>
                <Grid container spacing={3} alignItems="center" justifyContent="center">
                  <Grid item xs={12} sm={8} md={6}>
                    <TextField
                      fullWidth
                      placeholder="john@domain.com"
                      name="email"
                      type="email"
                      value={email}
                      onChange={handleInputChange}
                      required
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          color: '#000000',
                          borderRadius: 0,
                          px: 2,
                          backgroundColor: '#FFFFFF',
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
                  <Grid item xs={12} sm={4} md={3}>
                    <Button
                      type="submit"
                      variant="contained"
                      size="medium"
                      fullWidth
                      disabled={loading}
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
                        borderRadius: '8px',
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
                        '&:disabled': {
                          opacity: 0.6
                        }
                      }}
                    >
                      {loading ? 'Sending...' : 'Request Credentials'}
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
