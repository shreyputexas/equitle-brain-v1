import * as React from 'react';
import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  User as FirebaseUser 
} from 'firebase/auth';
import { auth } from '../lib/firebase';

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

  useEffect(() => {
    // Development mode: bypass Firebase auth and use mock user
    if (process.env.NODE_ENV === 'development') {
      const mockUser: User = {
        id: 'dev-user-123',
        email: 'dev@equitle.com',
        name: 'Development User',
        role: 'admin',
        firm: 'Equitle',
        phone: '',
        location: '',
        avatar: undefined
      };
      
      // Set mock token for backend
      localStorage.setItem('token', 'mock-token');
      axios.defaults.headers.common['Authorization'] = 'Bearer mock-token';
      
      setUser(mockUser);
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        // User is signed in
        const idToken = await firebaseUser.getIdToken();
        localStorage.setItem('token', idToken);
        axios.defaults.headers.common['Authorization'] = `Bearer ${idToken}`;
        
        // Create user object from Firebase user
        const user: User = {
          id: firebaseUser.uid,
          email: firebaseUser.email || '',
          name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
          role: 'user',
          firm: '',
          phone: firebaseUser.phoneNumber || '',
          location: '',
          avatar: firebaseUser.photoURL || undefined
        };
        
        setUser(user);
      } else {
        // User is signed out
        setUser(null);
        localStorage.removeItem('token');
        delete axios.defaults.headers.common['Authorization'];
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // fetchUserProfile is no longer needed - using Firebase auth state listener

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      // Get the ID token for backend authentication
      const idToken = await firebaseUser.getIdToken();
      localStorage.setItem('token', idToken);
      
      // Set axios default header for backend requests
      axios.defaults.headers.common['Authorization'] = `Bearer ${idToken}`;
      
      // Create user object from Firebase user
      const user: User = {
        id: firebaseUser.uid,
        email: firebaseUser.email || '',
        name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
        role: 'user',
        firm: '',
        phone: firebaseUser.phoneNumber || '',
        location: '',
        avatar: firebaseUser.photoURL || undefined
      };
      
      setUser(user);
      navigate('/outreach/deals');
    } catch (error: any) {
      console.error('Login failed:', error);
      throw new Error(error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      // Still clear local state even if Firebase logout fails
      setUser(null);
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
      navigate('/login');
    }
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