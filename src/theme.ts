import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#6B7280',
      light: '#9CA3AF',
      dark: '#4B5563',
      contrastText: '#FFFFFF'
    },
    secondary: {
      main: '#5E5CE6',
      light: '#7C7AED',
      dark: '#4A48C7',
      contrastText: '#FFFFFF'
    },
    background: {
      default: '#FFFFFF',
      paper: '#FFFFFF'
    },
    text: {
      primary: '#000000',
      secondary: '#000000'
    },
    error: {
      main: '#EF4444'
    },
    warning: {
      main: '#F59E0B'
    },
    info: {
      main: '#3B82F6'
    },
    success: {
      main: '#10B981'
    },
    divider: 'rgba(0, 0, 0, 0.06)'
  },
  typography: {
    fontFamily: '"Poppins", -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
    h1: {
      fontFamily: '"Poppins", sans-serif',
      fontSize: '3.75rem',
      fontWeight: 700,
      lineHeight: 1.1,
      letterSpacing: '-0.03em'
    },
    h2: {
      fontFamily: '"Poppins", sans-serif',
      fontSize: '2.75rem',
      fontWeight: 600,
      lineHeight: 1.2,
      letterSpacing: '-0.02em'
    },
    h3: {
      fontFamily: '"Poppins", sans-serif',
      fontSize: '2.125rem',
      fontWeight: 600,
      lineHeight: 1.3,
      letterSpacing: '-0.01em'
    },
    h4: {
      fontSize: '1.625rem',
      fontWeight: 600,
      lineHeight: 1.35,
      letterSpacing: '-0.01em'
    },
    h5: {
      fontSize: '1.375rem',
      fontWeight: 500,
      lineHeight: 1.4
    },
    h6: {
      fontSize: '1.125rem',
      fontWeight: 500,
      lineHeight: 1.45
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.7,
      letterSpacing: '0.01em'
    },
    body2: {
      fontSize: '0.9375rem',
      lineHeight: 1.6,
      letterSpacing: '0.01em'
    },
    button: {
      fontWeight: 600,
      textTransform: 'none',
      letterSpacing: '0.02em'
    }
  },
  shape: {
    borderRadius: 16
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          padding: '12px 28px',
          fontSize: '0.9375rem',
          fontWeight: 600,
          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: 'none',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 8px 20px rgba(94, 92, 230, 0.25)'
          }
        },
        contained: {
          background: 'linear-gradient(135deg, #6B7280 0%, #9CA3AF 100%)',
          boxShadow: '0 2px 8px rgba(107, 114, 128, 0.15)',
          '&:hover': {
            background: 'linear-gradient(135deg, #4B5563 0%, #6B7280 100%)',
            boxShadow: '0 6px 20px rgba(107, 114, 128, 0.25)'
          }
        },
        outlined: {
          borderWidth: '1.5px',
          borderColor: 'rgba(107, 114, 128, 0.2)',
          '&:hover': {
            borderWidth: '1.5px',
            borderColor: 'rgba(107, 114, 128, 0.4)',
            backgroundColor: 'rgba(107, 114, 128, 0.02)'
          }
        }
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: '#FFFFFF',
          border: '1px solid rgba(0, 0, 0, 0.05)',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04), 0 8px 24px rgba(0, 0, 0, 0.02)',
          borderRadius: 16
        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: '#FFFFFF',
          backgroundImage: 'none',
          border: '1px solid rgba(0, 0, 0, 0.05)',
          borderRadius: 16,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04), 0 8px 24px rgba(0, 0, 0, 0.02)',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 12px 32px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.06)',
            border: '1px solid rgba(94, 92, 230, 0.15)'
          }
        }
      }
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            backgroundColor: '#FAFAFA',
            borderRadius: 10,
            transition: 'all 0.2s ease-in-out',
            '& fieldset': {
              borderColor: 'rgba(0, 0, 0, 0.1)',
              borderWidth: '1.5px'
            },
            '&:hover fieldset': {
              borderColor: 'rgba(94, 92, 230, 0.3)'
            },
            '&.Mui-focused': {
              backgroundColor: '#FFFFFF',
              '& fieldset': {
                borderColor: '#5E5CE6',
                borderWidth: '2px'
              }
            }
          }
        }
      }
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          backgroundColor: 'rgba(94, 92, 230, 0.08)',
          border: '1px solid rgba(94, 92, 230, 0.2)',
          color: '#0A0A0A',
          fontWeight: 500,
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            backgroundColor: 'rgba(94, 92, 230, 0.15)',
            transform: 'scale(1.05)'
          }
        }
      }
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          backgroundColor: '#6B7280',
          fontWeight: 600
        }
      }
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          height: 8,
          borderRadius: 4,
          backgroundColor: 'rgba(94, 92, 230, 0.1)'
        },
        bar: {
          borderRadius: 4,
          background: 'linear-gradient(90deg, #5E5CE6 0%, #7C7AED 100%)'
        }
      }
    }
  }
});

export default theme;