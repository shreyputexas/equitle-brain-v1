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
  Fade
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Email as EmailIcon,
  Lock as LockIcon,
  ArrowForward as ArrowForwardIcon,
  Google as GoogleIcon,
  Microsoft as MicrosoftIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import MarketingHeader from '../components/MarketingHeader';
import Footer from '../components/Footer';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/app');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };


  return (
    <>
      <MarketingHeader />
      <Box
        sx={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #FFFFFF 0%, #F8F8FF 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          py: 4,
          pt: { xs: 16, md: 20 }
        }}
      >
      <Container maxWidth="sm">
        <Fade in timeout={1000}>
          <Paper
            elevation={0}
            sx={{
              p: 6,
              width: '100%',
              maxWidth: 480,
              mx: 'auto',
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
                Welcome Back
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Access your search fund dashboard
              </Typography>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                sx={{ mb: 3 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon sx={{ color: 'text.secondary' }} />
                    </InputAdornment>
                  )
                }}
              />

              <TextField
                fullWidth
                label="Password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                sx={{ mb: 3 }}
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

              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Link
                  component="button"
                  variant="body2"
                  onClick={(e) => {
                    e.preventDefault();
                  }}
                  sx={{ textDecoration: 'none' }}
                >
                  Forgot password?
                </Link>
              </Box>

              <Button
                fullWidth
                type="submit"
                variant="contained"
                size="large"
                disabled={loading}
                endIcon={<ArrowForwardIcon />}
                sx={{
                  py: 1.5,
                  mb: 3,
                  background: 'linear-gradient(135deg, #9CA3AF 0%, #374151 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #6B7280 0%, #1F2937 100%)'
                  }
                }}
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>

              <Divider sx={{ my: 3 }}>
                <Typography variant="body2" color="text.secondary">
                  OR
                </Typography>
              </Divider>

              <Button
                fullWidth
                variant="outlined"
                size="large"
                startIcon={<GoogleIcon />}
                sx={{ 
                  py: 1.5, 
                  mb: 2,
                  borderColor: 'rgba(0, 0, 0, 0.1)',
                  '&:hover': {
                    borderColor: 'rgba(0, 0, 0, 0.2)',
                    backgroundColor: 'rgba(0, 0, 0, 0.02)'
                  }
                }}
              >
                Continue with Google
              </Button>

              <Button
                fullWidth
                variant="outlined"
                size="large"
                startIcon={<MicrosoftIcon />}
                sx={{ 
                  py: 1.5,
                  borderColor: 'rgba(0, 0, 0, 0.1)',
                  '&:hover': {
                    borderColor: 'rgba(0, 0, 0, 0.2)',
                    backgroundColor: 'rgba(0, 0, 0, 0.02)'
                  }
                }}
              >
                Continue with Microsoft
              </Button>
            </form>

            <Box sx={{ mt: 4, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Don't have an account?{' '}
                <Link
                  component="button"
                  variant="body2"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate('/signup');
                  }}
                  sx={{ 
                    color: 'text.primary', 
                    textDecoration: 'none',
                    fontWeight: 500,
                    '&:hover': {
                      textDecoration: 'underline'
                    }
                  }}
                >
                  Sign up
                </Link>
              </Typography>
            </Box>

            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary">
                Demo credentials: demo@equitle.com / demo123
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