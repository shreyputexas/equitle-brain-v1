import React, { useState, useEffect } from 'react';
import { getAuthErrorMessage } from '../utils/errorMessages';
import {
  Box,
  Container,
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

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.title = 'Login - Equitle';
  }, []);

  const { login, googleSignIn } = useAuth(); // <-- use googleSignIn from context
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/app');
    } catch (err: any) {
      console.error('Login error:', err);
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
      console.error('Google sign-in error:', err);
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex'
      }}
    >
        {/* Left side - Logo with green fuzzy background */}
        <Box
          sx={{
            width: { xs: '100%', md: '50%' },
            background: 'linear-gradient(180deg, rgba(4, 120, 87, 0.9) 0%, rgba(6, 78, 59, 0.9) 30%, rgba(5, 46, 22, 0.9) 70%, rgba(2, 44, 34, 0.9) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
          }}
        >
          <Box sx={{ textAlign: 'center', zIndex: 2, position: 'relative' }}>
            <Box
              component="img"
              src="/assets/images/extended_logo_black_white.png"
              alt="Equitle"
              onError={(e) => {
                // Fallback to text if image fails to load
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const parent = target.parentElement;
                if (parent) {
                  parent.innerHTML = '<div style="font-family: \'Darker Grotesque\', sans-serif; font-weight: 700; color: #FFFFFF; font-size: 4rem; text-shadow: 0 4px 8px rgba(0,0,0,0.3);">Equitle</div>';
                }
              }}
              sx={{
                height: { xs: '150px', md: '200px', lg: '250px' },
                width: 'auto',
                maxWidth: '90%',
                filter: 'brightness(1.2) drop-shadow(0 6px 12px rgba(0,0,0,0.4))',
                opacity: 0.95,
                transform: 'scaleX(1.2)',
                transformOrigin: 'center'
              }}
            />
          </Box>
        </Box>

        {/* Right side - Login form */}
        <Box
          sx={{
            width: { xs: '100%', md: '50%' },
            background: 'linear-gradient(180deg, #000000 0%, #434343 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            py: 4,
            px: { xs: 2, md: 4 }
          }}
        >
          <Box sx={{ width: '100%', maxWidth: 400, px: 2 }}>
            <Fade in timeout={1000}>
              <Box
                sx={{
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
              <Box sx={{ textAlign: 'center', mb: 6 }}>
                <Typography
                  variant="h4"
                  sx={{
                    fontFamily: '"Darker Grotesque", sans-serif',
                    fontWeight: 700,
                    color: '#FFFFFF',
                    mb: 1
                  }}
                >
                  Welcome Back
                </Typography>
              
              </Box>

              {error && (
                <Alert severity="error" sx={{ mb: 3, backgroundColor: 'rgba(255, 0, 0, 0.1)', color: '#FFFFFF', border: '1px solid rgba(255, 0, 0, 0.3)' }}>
                  {error}
                </Alert>
              )}

              {/* Social sign-in */}
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
                <TextField
                  fullWidth
                  placeholder="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  sx={{ mb: 4 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailIcon sx={{ color: '#FFFFFF' }} />
                      </InputAdornment>
                    )
                  }}
                />

                <TextField
                  fullWidth
                  placeholder="Password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  sx={{ mb: 4 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockIcon sx={{ color: '#FFFFFF' }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" sx={{ color: '#FFFFFF' }}>
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
                      // TODO: wire up forgot-password flow
                    }}
                    sx={{ 
                      textDecoration: 'none',
                      color: '#10B981',
                      '&:hover': {
                        color: '#059669',
                        textDecoration: 'underline'
                      }
                    }}
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
                    borderRadius: 2,
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
                  {loading ? 'Signing in...' : 'Sign In'}
                </Button>
              </form>


            </Box>
          </Fade>
          </Box>
        </Box>
      </Box>
    );
}
