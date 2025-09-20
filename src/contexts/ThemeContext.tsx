import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

interface ThemeContextType {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

const createAppTheme = (isDarkMode: boolean) => {
  return createTheme({
    palette: {
      mode: isDarkMode ? 'dark' : 'light',
      primary: {
        main: isDarkMode ? '#FFFFFF' : '#0A0A0A',
        light: isDarkMode ? '#E5E5E5' : '#2C2C2C',
        dark: isDarkMode ? '#CCCCCC' : '#000000',
        contrastText: isDarkMode ? '#0A0A0A' : '#FFFFFF'
      },
      secondary: {
        main: '#5E5CE6',
        light: '#7C7AED',
        dark: '#4A48C7',
        contrastText: '#FFFFFF'
      },
      background: {
        default: isDarkMode ? '#0A0A0A' : '#FFFFFF',
        paper: isDarkMode ? '#1A1A1A' : '#FFFFFF'
      },
      text: {
        primary: isDarkMode ? '#FFFFFF' : '#0A0A0A',
        secondary: isDarkMode ? '#B3B3B3' : '#6B7280'
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
      divider: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)'
    },
    typography: {
      fontFamily: '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
      h1: {
        fontFamily: '"Space Grotesk", sans-serif',
        fontSize: '3.75rem',
        fontWeight: 700,
        lineHeight: 1.1,
        letterSpacing: '-0.03em'
      },
      h2: {
        fontFamily: '"Space Grotesk", sans-serif',
        fontSize: '2.75rem',
        fontWeight: 600,
        lineHeight: 1.2,
        letterSpacing: '-0.02em'
      },
      h3: {
        fontFamily: '"Space Grotesk", sans-serif',
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
              boxShadow: isDarkMode 
                ? '0 8px 20px rgba(255, 255, 255, 0.1)' 
                : '0 8px 20px rgba(94, 92, 230, 0.25)'
            }
          },
          contained: {
            background: isDarkMode 
              ? 'linear-gradient(135deg, #FFFFFF 0%, #E5E5E5 100%)'
              : 'linear-gradient(135deg, #0A0A0A 0%, #2C2C2C 100%)',
            color: isDarkMode ? '#0A0A0A' : '#FFFFFF',
            boxShadow: isDarkMode 
              ? '0 2px 8px rgba(255, 255, 255, 0.1)'
              : '0 2px 8px rgba(0, 0, 0, 0.15)',
            '&:hover': {
              background: isDarkMode 
                ? 'linear-gradient(135deg, #F0F0F0 0%, #D0D0D0 100%)'
                : 'linear-gradient(135deg, #1A1A1A 0%, #3C3C3C 100%)',
              boxShadow: isDarkMode 
                ? '0 6px 20px rgba(255, 255, 255, 0.15)'
                : '0 6px 20px rgba(0, 0, 0, 0.25)'
            }
          },
          outlined: {
            borderWidth: '1.5px',
            borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(10, 10, 10, 0.2)',
            color: isDarkMode ? '#FFFFFF' : '#0A0A0A',
            '&:hover': {
              borderWidth: '1.5px',
              borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(10, 10, 10, 0.4)',
              backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(10, 10, 10, 0.02)'
            }
          }
        }
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            backgroundColor: isDarkMode ? '#1A1A1A' : '#FFFFFF',
            border: isDarkMode 
              ? '1px solid rgba(255, 255, 255, 0.1)'
              : '1px solid rgba(0, 0, 0, 0.05)',
            boxShadow: isDarkMode 
              ? '0 2px 8px rgba(0, 0, 0, 0.3), 0 8px 24px rgba(0, 0, 0, 0.2)'
              : '0 2px 8px rgba(0, 0, 0, 0.04), 0 8px 24px rgba(0, 0, 0, 0.02)',
            borderRadius: 16
          }
        }
      },
      MuiCard: {
        styleOverrides: {
          root: {
            backgroundColor: isDarkMode ? '#1A1A1A' : '#FFFFFF',
            backgroundImage: 'none',
            border: isDarkMode 
              ? '1px solid rgba(255, 255, 255, 0.1)'
              : '1px solid rgba(0, 0, 0, 0.05)',
            borderRadius: 16,
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: isDarkMode 
              ? '0 2px 8px rgba(0, 0, 0, 0.3), 0 8px 24px rgba(0, 0, 0, 0.2)'
              : '0 2px 8px rgba(0, 0, 0, 0.04), 0 8px 24px rgba(0, 0, 0, 0.02)',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: isDarkMode 
                ? '0 12px 32px rgba(0, 0, 0, 0.4), 0 2px 8px rgba(0, 0, 0, 0.3)'
                : '0 12px 32px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.06)',
              border: isDarkMode 
                ? '1px solid rgba(94, 92, 230, 0.3)'
                : '1px solid rgba(94, 92, 230, 0.15)'
            }
          }
        }
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              backgroundColor: isDarkMode ? '#2A2A2A' : '#FAFAFA',
              borderRadius: 10,
              transition: 'all 0.2s ease-in-out',
              '& fieldset': {
                borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)',
                borderWidth: '1.5px'
              },
              '&:hover fieldset': {
                borderColor: 'rgba(94, 92, 230, 0.3)'
              },
              '&.Mui-focused': {
                backgroundColor: isDarkMode ? '#1A1A1A' : '#FFFFFF',
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
            backgroundColor: isDarkMode ? 'rgba(94, 92, 230, 0.2)' : 'rgba(94, 92, 230, 0.08)',
            border: isDarkMode ? '1px solid rgba(94, 92, 230, 0.4)' : '1px solid rgba(94, 92, 230, 0.2)',
            color: isDarkMode ? '#FFFFFF' : '#0A0A0A',
            fontWeight: 500,
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              backgroundColor: isDarkMode ? 'rgba(94, 92, 230, 0.3)' : 'rgba(94, 92, 230, 0.15)',
              transform: 'scale(1.05)'
            }
          }
        }
      },
      MuiAvatar: {
        styleOverrides: {
          root: {
            backgroundColor: 'linear-gradient(135deg, #5E5CE6 0%, #7C7AED 100%)',
            fontWeight: 600
          }
        }
      },
      MuiLinearProgress: {
        styleOverrides: {
          root: {
            height: 8,
            borderRadius: 4,
            backgroundColor: isDarkMode ? 'rgba(94, 92, 230, 0.2)' : 'rgba(94, 92, 230, 0.1)'
          },
          bar: {
            borderRadius: 4,
            background: 'linear-gradient(90deg, #5E5CE6 0%, #7C7AED 100%)'
          }
        }
      },
      MuiSwitch: {
        styleOverrides: {
          root: {
            '& .MuiSwitch-switchBase': {
              '&.Mui-checked': {
                color: '#5E5CE6',
                '& + .MuiSwitch-track': {
                  backgroundColor: '#5E5CE6',
                },
              },
            },
            '& .MuiSwitch-track': {
              backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.2)',
            },
          },
        },
      },
    }
  });
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const AppThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Check localStorage first, then system preference
    const saved = localStorage.getItem('darkMode');
    if (saved !== null) {
      return JSON.parse(saved);
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const toggleDarkMode = () => {
    setIsDarkMode(prev => {
      const newMode = !prev;
      localStorage.setItem('darkMode', JSON.stringify(newMode));
      return newMode;
    });
  };

  const theme = createAppTheme(isDarkMode);

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleDarkMode }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeContext.Provider>
  );
};
