import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#000000',
      light: '#404040',
      dark: '#000000',
      contrastText: '#FFFFFF'
    },
    secondary: {
      main: '#4A4A4A',
      light: '#6B6B6B',
      dark: '#2A2A2A',
      contrastText: '#FFFFFF'
    },
    background: {
      default: '#F9FAFB',
      paper: '#FFFFFF'
    },
    text: {
      primary: '#111827',
      secondary: '#6B7280',
      disabled: '#9CA3AF'
    },
    error: {
      main: '#DC2626',
      light: '#EF4444',
      dark: '#B91C1C'
    },
    warning: {
      main: '#F59E0B',
      light: '#FCD34D',
      dark: '#D97706'
    },
    info: {
      main: '#3B82F6',
      light: '#60A5FA',
      dark: '#2563EB'
    },
    success: {
      main: '#10B981',
      light: '#34D399',
      dark: '#059669'
    },
    divider: 'rgba(0, 0, 0, 0.08)'
  },
  typography: {
    fontFamily: '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
    h1: {
      fontFamily: '"Space Grotesk", sans-serif',
      fontSize: '2.5rem',
      fontWeight: 700,
      lineHeight: 1.2,
      letterSpacing: '-0.02em'
    },
    h2: {
      fontFamily: '"Space Grotesk", sans-serif',
      fontSize: '2rem',
      fontWeight: 600,
      lineHeight: 1.3,
      letterSpacing: '-0.015em'
    },
    h3: {
      fontFamily: '"Space Grotesk", sans-serif',
      fontSize: '1.5rem',
      fontWeight: 600,
      lineHeight: 1.4,
      letterSpacing: '-0.01em'
    },
    h4: {
      fontSize: '1.25rem',
      fontWeight: 600,
      lineHeight: 1.4,
      letterSpacing: '0em'
    },
    h5: {
      fontSize: '1.125rem',
      fontWeight: 600,
      lineHeight: 1.5
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 600,
      lineHeight: 1.5
    },
    body1: {
      fontSize: '0.875rem',
      lineHeight: 1.6,
      letterSpacing: '0em'
    },
    body2: {
      fontSize: '0.8125rem',
      lineHeight: 1.5,
      letterSpacing: '0em'
    },
    button: {
      fontWeight: 500,
      textTransform: 'none',
      letterSpacing: '0em',
      fontSize: '0.875rem'
    },
    caption: {
      fontSize: '0.75rem',
      lineHeight: 1.4,
      letterSpacing: '0em'
    }
  },
  shape: {
    borderRadius: 8
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          padding: '8px 16px',
          fontSize: '0.875rem',
          fontWeight: 500,
          transition: 'all 0.15s ease',
          boxShadow: 'none',
          '&:hover': {
            transform: 'none',
            boxShadow: 'none'
          }
        },
        contained: {
          backgroundColor: '#000000',
          boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
          '&:hover': {
            backgroundColor: '#262626',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
          },
          '&:active': {
            backgroundColor: '#404040'
          }
        },
        outlined: {
          borderWidth: '1px',
          borderColor: '#D1D5DB',
          color: '#374151',
          '&:hover': {
            borderWidth: '1px',
            borderColor: '#9CA3AF',
            backgroundColor: '#F9FAFB'
          }
        },
        text: {
          color: '#374151',
          '&:hover': {
            backgroundColor: '#F9FAFB'
          }
        },
        sizeSmall: {
          padding: '6px 12px',
          fontSize: '0.8125rem'
        },
        sizeLarge: {
          padding: '10px 20px',
          fontSize: '0.9375rem'
        }
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: '#FFFFFF',
          border: '1px solid #E5E7EB',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
          borderRadius: 8
        },
        elevation0: {
          boxShadow: 'none'
        },
        elevation1: {
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
        },
        elevation2: {
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: '#FFFFFF',
          backgroundImage: 'none',
          border: '1px solid #E5E7EB',
          borderRadius: 8,
          transition: 'all 0.2s ease',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
          '&:hover': {
            transform: 'none',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            borderColor: '#D1D5DB'
          }
        }
      }
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            backgroundColor: '#FFFFFF',
            borderRadius: 6,
            fontSize: '0.875rem',
            transition: 'all 0.15s ease',
            '& fieldset': {
              borderColor: '#D1D5DB',
              borderWidth: '1px'
            },
            '&:hover fieldset': {
              borderColor: '#9CA3AF'
            },
            '&.Mui-focused': {
              backgroundColor: '#FFFFFF',
              '& fieldset': {
                borderColor: '#000000',
                borderWidth: '2px'
              }
            }
          },
          '& .MuiInputLabel-root': {
            fontSize: '0.875rem',
            color: '#6B7280',
            '&.Mui-focused': {
              color: '#000000'
            }
          }
        }
      }
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          backgroundColor: '#F3F4F6',
          border: 'none',
          color: '#374151',
          fontWeight: 500,
          fontSize: '0.75rem',
          height: 24,
          transition: 'all 0.15s ease',
          '&:hover': {
            backgroundColor: '#E5E7EB',
            transform: 'none'
          }
        },
        outlined: {
          backgroundColor: 'transparent',
          border: '1px solid #D1D5DB',
          '&:hover': {
            backgroundColor: '#F9FAFB'
          }
        }
      }
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          backgroundColor: '#000000',
          color: '#FFFFFF',
          fontWeight: 600,
          fontSize: '0.875rem'
        }
      }
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          height: 6,
          borderRadius: 3,
          backgroundColor: '#E5E7EB'
        },
        bar: {
          borderRadius: 3,
          background: 'linear-gradient(90deg, #6B7280 0%, #000000 100%)'
        }
      }
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid #F3F4F6',
          padding: '12px 16px',
          fontSize: '0.875rem'
        },
        head: {
          fontWeight: 600,
          color: '#6B7280',
          backgroundColor: '#F9FAFB',
          borderBottom: '1px solid #E5E7EB'
        }
      }
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          borderRadius: 8,
          marginTop: 4
        }
      }
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          fontSize: '0.875rem',
          padding: '8px 16px',
          '&:hover': {
            backgroundColor: '#F9FAFB'
          },
          '&.Mui-selected': {
            backgroundColor: '#F3F4F6',
            '&:hover': {
              backgroundColor: '#E5E7EB'
            }
          }
        }
      }
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: '#1F2937',
          color: '#FFFFFF',
          fontSize: '0.75rem',
          borderRadius: 6,
          padding: '6px 12px'
        }
      }
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontSize: '0.875rem'
        },
        standardError: {
          backgroundColor: '#FEF2F2',
          color: '#991B1B',
          border: '1px solid #FEE2E2'
        },
        standardWarning: {
          backgroundColor: '#FFFBEB',
          color: '#92400E',
          border: '1px solid #FEF3C7'
        },
        standardInfo: {
          backgroundColor: '#EFF6FF',
          color: '#1E40AF',
          border: '1px solid #DBEAFE'
        },
        standardSuccess: {
          backgroundColor: '#F0FDF4',
          color: '#166534',
          border: '1px solid #DCFCE7'
        }
      }
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: '#F3F4F6'
        }
      }
    }
  }
});

export default theme;