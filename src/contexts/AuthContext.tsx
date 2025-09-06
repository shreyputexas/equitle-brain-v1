import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'analyst' | 'viewer';
  firm: string;
  avatar?: string;
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
  // Mock user for development - bypass authentication
  const mockUser: User = {
    id: '1',
    email: 'admin@equitle.com',
    name: 'Admin User',
    role: 'admin',
    firm: 'Equitle',
    avatar: undefined
  };

  const [user, setUser] = useState<User | null>(mockUser);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Skip authentication check - user is already set to mock user
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    // Mock login - just set the user and navigate
    setUser(mockUser);
    navigate('/deals/relationships');
  };

  const logout = () => {
    // Mock logout - just set user to null
    setUser(null);
    navigate('/deals/relationships');
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