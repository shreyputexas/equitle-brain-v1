import * as React from 'react';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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
        main: isDarkMode ? '#FFFFFF' : '#000000',
        light: isDarkMode ? '#E5E5E5' : '#333333',
        dark: isDarkMode ? '#CCCCCC' : '#000000',
        contrastText: isDarkMode ? '#000000' : '#FFFFFF'
      },
      secondary: {
        main: '#666666',
        light: '#999999',
        dark: '#333333',
        contrastText: '#FFFFFF'
      },
      background: {
        default: isDarkMode ? '#000000' : '#FFFFFF',
        paper: isDarkMode ? '#111111' : '#FFFFFF'
      },
      text: {
        primary: isDarkMode ? '#FFFFFF' : '#000000',
        secondary: isDarkMode ? '#CCCCCC' : '#666666'
      },
      error: {
        main: '#000000'
      },
      warning: {
        main: '#666666'
      },
      info: {
        main: '#000000'
      },
      success: {
        main: '#000000'
      },
      divider: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
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
      borderRadius: 4
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 4,
            padding: '12px 24px',
            fontSize: '0.875rem',
            fontWeight: 600,
            textTransform: 'none',
            transition: 'all 0.2s ease',
            boxShadow: 'none',
            border: 'none',
            '&:hover': {
              transform: 'none',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
            }
          },
          contained: {
            background: isDarkMode ? '#FFFFFF' : '#000000',
            color: isDarkMode ? '#000000' : '#FFFFFF',
            border: 'none',
            '&:hover': {
              background: isDarkMode ? '#F5F5F5' : '#333333'
            }
          },
          outlined: {
            border: 'none',
            color: isDarkMode ? '#FFFFFF' : '#000000',
            '&:hover': {
              backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'
            }
          }
        }
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            backgroundColor: isDarkMode ? '#111111' : '#FFFFFF',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            borderRadius: 4
          }
        }
      },
      MuiCard: {
        styleOverrides: {
          root: {
            backgroundColor: isDarkMode ? '#111111' : '#FFFFFF',
            backgroundImage: 'none',
            borderRadius: 4,
            transition: 'all 0.2s ease',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            '&:hover': {
              transform: 'none',
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.15)'
            }
          }
        }
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              backgroundColor: isDarkMode ? '#222222' : '#FFFFFF',
              borderRadius: 4,
              transition: 'all 0.2s ease',
              '& fieldset': {
                borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
                borderWidth: '1px'
              },
              '&:hover fieldset': {
                borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)'
              },
              '&.Mui-focused': {
                backgroundColor: isDarkMode ? '#111111' : '#FFFFFF',
                '& fieldset': {
                  borderColor: isDarkMode ? '#FFFFFF' : '#000000',
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
            borderRadius: 4,
            backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
            border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid rgba(0, 0, 0, 0.1)',
            color: isDarkMode ? '#FFFFFF' : '#000000',
            fontWeight: 500,
            transition: 'all 0.2s ease',
            '&:hover': {
              backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)',
              transform: 'none'
            }
          }
        }
      },
      MuiAvatar: {
        styleOverrides: {
          root: {
            backgroundColor: isDarkMode ? '#FFFFFF' : '#000000',
            color: isDarkMode ? '#000000' : '#FFFFFF',
            fontWeight: 600
          }
        }
      },
      MuiLinearProgress: {
        styleOverrides: {
          root: {
            height: 4,
            borderRadius: 2,
            backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
          },
          bar: {
            borderRadius: 2,
            background: isDarkMode ? '#FFFFFF' : '#000000'
          }
        }
      },
      MuiSwitch: {
        styleOverrides: {
          root: {
            '& .MuiSwitch-switchBase': {
              '&.Mui-checked': {
                color: isDarkMode ? '#000000' : '#FFFFFF',
                '& + .MuiSwitch-track': {
                  backgroundColor: isDarkMode ? '#FFFFFF' : '#000000',
                },
              },
            },
            '& .MuiSwitch-track': {
              backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
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
