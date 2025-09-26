import * as React from 'react';
import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

interface User {
  id: string;
  email: string;
  name: string;
  role?: string;
  firm?: string;
  phone?: string;
  location?: string;
  avatar?: string;
  profile?: {
    title?: string;
    bio?: string;
    timezone?: string;
    language?: string;
  };
  preferences?: {
    emailNotify: boolean;
    pushNotify: boolean;
    calendarNotify: boolean;
    dealNotify: boolean;
    autoSave: boolean;
    darkMode: boolean;
  };
}

interface AuthResponse {
  user: User;
}

interface LoginResponse {
  token: string;
  refreshToken: string;
  user: User;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Configure axios base URL
  axios.defaults.baseURL = 'http://localhost:4001/api';
  axios.defaults.headers.common['Authorization'] = 'Bearer mock-token';

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const response = await axios.get<AuthResponse>('/auth/me');
      setUser(response.data.user);
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      // Fallback to default user if API fails
      const fallbackUser: User = {
        id: 'default-user-id',
        email: 'demo@equitle.com',
        name: 'Demo User',
        role: 'admin',
        firm: 'Equitle',
        phone: '+1 (555) 123-4567',
        location: 'San Francisco, CA',
        avatar: undefined
      };
      setUser(fallbackUser);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    // For demo purposes - would normally authenticate
    await fetchUserProfile();
    navigate('/deals/all');
  };

  const logout = () => {
    setUser(null);
    navigate('/deals/all');
  };

  const updateUser = (userData: Partial<User>) => {
    setUser(prev => prev ? { ...prev, ...userData } : null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};