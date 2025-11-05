import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Link,
  Alert,
  InputAdornment,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Email as EmailIcon,
  Lock as LockIcon,
  Google as GoogleIcon
} from '@mui/icons-material';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);

  const { login } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Check for success message from signup
    if (location.state?.message) {
      setSuccess(location.state.message);
    }
  }, [location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPasswordClick = (e: React.MouseEvent) => {
    e.preventDefault();
    // Pre-fill with email if already entered
    setResetEmail(email);
    setResetError('');
    setResetSuccess(false);
    setResetDialogOpen(true);
  };

  const handleResetPassword = async () => {
    if (!resetEmail.trim()) {
      setResetError('Please enter your email address');
      return;
    }

    setResetError('');
    setResetLoading(true);

    try {
      await sendPasswordResetEmail(auth, resetEmail);
      setResetSuccess(true);
      // Close dialog after 3 seconds
      setTimeout(() => {
        setResetDialogOpen(false);
        setResetSuccess(false);
        setResetEmail('');
      }, 3000);
    } catch (err: any) {
      console.error('Password reset error:', err);
      if (err.code === 'auth/user-not-found') {
        setResetError('No account found with this email address');
      } else if (err.code === 'auth/invalid-email') {
        setResetError('Invalid email address');
      } else {
        setResetError(err.message || 'Failed to send password reset email. Please try again.');
      }
    } finally {
      setResetLoading(false);
    }
  };

  const handleCloseResetDialog = () => {
    setResetDialogOpen(false);
    setResetEmail('');
    setResetError('');
    setResetSuccess(false);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        background: 'linear-gradient(135deg, #10B981 0%, #000000 100%)',
      }}
    >
      {/* Left side - Logo */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 4
        }}
      >
        <Box
          component="img"
          src="/assets/images/extended_logo_black_white.png"
          alt="Equitle"
          sx={{
            height: { xs: '8rem', md: '16rem' },
            width: 'auto',
            maxWidth: '90%',
            objectFit: 'contain',
            filter: 'brightness(0) invert(1)',
            opacity: 0.95
          }}
        />
      </Box>

      {/* Right side - Login form */}
      <Box
        sx={{
          backgroundColor: '#1a1a1a',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          p: { xs: 4, md: 6 },
          maxWidth: '480px',
          ml: 'auto',
          width: '100%'
        }}
      >
        <Typography
          variant="h4"
          sx={{
            color: 'white',
            mb: 4,
            fontWeight: 400,
            fontSize: '2rem'
          }}
        >
          Welcome Back
        </Typography>

        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {success}
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Button
          fullWidth
          variant="outlined"
          size="large"
          startIcon={<GoogleIcon />}
          sx={{
            mb: 3,
            py: 1.5,
            borderColor: '#333',
            color: 'white',
            '&:hover': {
              borderColor: '#10B981',
              backgroundColor: 'transparent'
            }
          }}
        >
          Continue with Google
        </Button>

        <Typography
          variant="body2"
          sx={{
            color: '#888',
            textAlign: 'center',
            mb: 3
          }}
        >
          OR
        </Typography>

        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            placeholder="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            sx={{
              mb: 3,
              '& .MuiOutlinedInput-root': {
                backgroundColor: '#2a2a2a',
                color: 'white',
                '& fieldset': {
                  borderColor: '#333',
                },
                '&:hover fieldset': {
                  borderColor: '#10B981',
                },
                '&.Mui-focused': {
                  backgroundColor: '#2a2a2a',
                  '& fieldset': {
                    borderColor: '#10B981',
                  },
                },
              },
              '& .MuiInputBase-input': {
                color: 'white',
                '&::placeholder': {
                  color: '#888',
                  opacity: 1,
                },
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <EmailIcon sx={{ color: '#888' }} />
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
            sx={{
              mb: 2,
              '& .MuiOutlinedInput-root': {
                backgroundColor: '#2a2a2a',
                color: 'white',
                '& fieldset': {
                  borderColor: '#333',
                },
                '&:hover fieldset': {
                  borderColor: '#10B981',
                },
                '&.Mui-focused': {
                  backgroundColor: '#2a2a2a',
                  '& fieldset': {
                    borderColor: '#10B981',
                  },
                },
              },
              '& .MuiInputBase-input': {
                color: 'white',
                '&::placeholder': {
                  color: '#888',
                  opacity: 1,
                },
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LockIcon sx={{ color: '#888' }} />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                    sx={{ color: '#888' }}
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              )
            }}
          />

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
            <Link
              component="button"
              variant="body2"
              onClick={handleForgotPasswordClick}
              sx={{
                color: '#10B981',
                textDecoration: 'none',
                cursor: 'pointer',
                '&:hover': {
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
            endIcon={<Box component="span" sx={{ ml: 1 }}>→</Box>}
            sx={{
              py: 1.5,
              backgroundColor: '#10B981',
              color: 'white',
              fontWeight: 500,
              '&:hover': {
                backgroundColor: '#059669'
              },
              '&:disabled': {
                opacity: 0.6
              }
            }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>

        {/* Password Reset Dialog */}
        <Dialog
          open={resetDialogOpen}
          onClose={handleCloseResetDialog}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              backgroundColor: '#1a1a1a',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }
          }}
        >
          <DialogTitle sx={{ color: 'white', pb: 2 }}>
            Reset Password
          </DialogTitle>
          <DialogContent>
            {resetSuccess ? (
              <Alert severity="success" sx={{ mb: 2 }}>
                Password reset email sent! Please check your inbox and follow the instructions to reset your password.
              </Alert>
            ) : (
              <>
                <Typography variant="body2" sx={{ color: '#888', mb: 3 }}>
                  Enter your email address and we'll send you a link to reset your password.
                </Typography>
                {resetError && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {resetError}
                  </Alert>
                )}
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  disabled={resetLoading}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: '#2a2a2a',
                      color: 'white',
                      '& fieldset': {
                        borderColor: '#333',
                      },
                      '&:hover fieldset': {
                        borderColor: '#10B981',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#10B981',
                      },
                    },
                    '& .MuiInputLabel-root': {
                      color: '#888',
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: '#10B981',
                    },
                    '& .MuiInputBase-input': {
                      color: 'white',
                    },
                  }}
                />
              </>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 2, pt: 0 }}>
            {!resetSuccess && (
              <>
                <Button
                  onClick={handleCloseResetDialog}
                  disabled={resetLoading}
                  sx={{ color: '#888' }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleResetPassword}
                  disabled={resetLoading || !resetEmail.trim()}
                  variant="contained"
                  sx={{
                    backgroundColor: '#10B981',
                    color: 'white',
                    '&:hover': {
                      backgroundColor: '#059669'
                    },
                    '&:disabled': {
                      opacity: 0.6
                    }
                  }}
                >
                  {resetLoading ? 'Sending...' : 'Send Reset Link'}
                </Button>
              </>
            )}
            {resetSuccess && (
              <Button
                onClick={handleCloseResetDialog}
                variant="contained"
                sx={{
                  backgroundColor: '#10B981',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: '#059669'
                  }
                }}
              >
                Close
              </Button>
            )}
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
}