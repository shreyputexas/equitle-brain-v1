import * as React from 'react';
import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut, 
  onAuthStateChanged, 
  User as FirebaseUser 
} from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { API_BASE_URL } from '../config/api';
import { searcherProfilesApi } from '../services/searcherProfilesApi';

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
  signup: (email: string, password: string, name: string, firm?: string, role?: string, phone?: string, location?: string) => Promise<void>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  refreshUser: () => Promise<void>;
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

  // Fetch user profile from API to get real name (shared function)
  const fetchUserProfile = async (userId: string, email: string, displayName?: string) => {
    try {
      // Read user doc from Firestore for persisted display settings
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);

      let primaryProfileId: string | undefined;
      let storedName: string | undefined;
      if (userSnap.exists()) {
        const data = userSnap.data() as any;
        primaryProfileId = data?.primaryProfileId;
        storedName = data?.name || data?.displayName;
      }

      // If a name is stored directly on the user doc, use it first
      if (storedName && typeof storedName === 'string' && storedName.trim().length > 0) {
        return storedName.trim();
      }

      // Otherwise, if a primary profile is set, use that profile's name
      try {
        const profiles = await searcherProfilesApi.getSearcherProfiles();
        // Ensure profiles is an array before using array methods
        if (Array.isArray(profiles)) {
          if (primaryProfileId && profiles.length > 0) {
            const primaryProfile = profiles.find(p => p.id === primaryProfileId);
            if (primaryProfile?.name) {
              console.log('✅ Using primary investor profile name:', primaryProfile.name);
              return primaryProfile.name;
            }
          }

          // If only one profile exists, use it automatically
          if (profiles.length === 1) {
            console.log('✅ Using single investor profile name:', profiles[0].name);
            return profiles[0].name;
          }
        }
      } catch (profileError) {
        console.warn('Failed to fetch investor profiles, falling back to auth profile:', profileError);
      }

      // Fallback to Firebase auth displayName or email prefix
      return displayName || email?.split('@')[0] || 'User';
    } catch (error) {
      console.warn('Failed to fetch user profile, using fallback name:', error);
    }
    return displayName || email?.split('@')[0] || 'User';
  };

  // Don't set axios base URL globally - let individual services handle their own paths
  // axios.defaults.baseURL = API_BASE_URL;

  useEffect(() => {

    // Development mode: bypass Firebase auth and use mock user
    if (process.env.NODE_ENV === 'development') {
      const mockUserId = 'dev-user-123';
      const mockEmail = 'dev@equitle.com';
      
      // Set mock token and userId for backend
      localStorage.setItem('token', 'mock-token');
      localStorage.setItem('userId', mockUserId);
      axios.defaults.headers.common['Authorization'] = 'Bearer mock-token';

      console.log('✅ AuthContext: Stored userId in localStorage (dev mode):', mockUserId);

      // Fetch real name from profile
      fetchUserProfile(mockUserId, mockEmail).then((name) => {
        const mockUser: User = {
          id: mockUserId,
          email: mockEmail,
          name: name,
          role: 'admin',
          firm: 'Equitle',
          phone: '',
          location: '',
          avatar: undefined
        };
        setUser(mockUser);
        setLoading(false);
      }).catch(() => {
        // Fallback if profile fetch fails
        const mockUser: User = {
          id: mockUserId,
          email: mockEmail,
          name: 'Development User',
          role: 'admin',
          firm: 'Equitle',
          phone: '',
          location: '',
          avatar: undefined
        };
        setUser(mockUser);
        setLoading(false);
      });
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        // User is signed in
        const idToken = await firebaseUser.getIdToken();
        localStorage.setItem('token', idToken);
        localStorage.setItem('userId', firebaseUser.uid);
        axios.defaults.headers.common['Authorization'] = `Bearer ${idToken}`;

        console.log('✅ AuthContext: Stored userId in localStorage (auth state):', firebaseUser.uid);

        // Fetch real name from profile API
        const realName = await fetchUserProfile(
          firebaseUser.uid, 
          firebaseUser.email || '',
          firebaseUser.displayName || undefined
        );

        // Create user object from Firebase user with profile name
        const user: User = {
          id: firebaseUser.uid,
          email: firebaseUser.email || '',
          name: realName,
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
        localStorage.removeItem('userId');
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
      localStorage.setItem('userId', firebaseUser.uid);

      console.log('✅ AuthContext: Stored userId in localStorage (login):', firebaseUser.uid);

      // Set axios default header for backend requests
      axios.defaults.headers.common['Authorization'] = `Bearer ${idToken}`;

      // Fetch real name from profile
      const realName = await fetchUserProfile(
        firebaseUser.uid, 
        firebaseUser.email || '',
        firebaseUser.displayName || undefined
      );

      // Create user object from Firebase user with profile name
      const user: User = {
        id: firebaseUser.uid,
        email: firebaseUser.email || '',
        name: realName,
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

  const signup = async (email: string, password: string, name: string, firm?: string, role?: string, phone?: string, location?: string) => {
    try {
      setLoading(true);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      // Update Firebase Auth display name
      await updateProfile(firebaseUser, { displayName: name });
      
      // Create user document in Firestore
      const userRef = doc(db, 'users', firebaseUser.uid);
      await setDoc(userRef, {
        email: email.toLowerCase(),
        name: name,
        firm: firm || '',
        role: role || '',
        phone: phone || '',
        location: location || '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Get the ID token for backend authentication
      const idToken = await firebaseUser.getIdToken();
      localStorage.setItem('token', idToken);
      localStorage.setItem('userId', firebaseUser.uid);

      console.log('✅ AuthContext: Created user and stored userId:', firebaseUser.uid);

      // Set axios default header for backend requests
      axios.defaults.headers.common['Authorization'] = `Bearer ${idToken}`;

      // Create user object
      const user: User = {
        id: firebaseUser.uid,
        email: firebaseUser.email || '',
        name: name,
        role: role || 'user',
        firm: firm || '',
        phone: phone || '',
        location: location || '',
        avatar: firebaseUser.photoURL || undefined
      };

      setUser(user);
      
      // Send email notification to admin (non-blocking)
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
      fetch(`${apiBaseUrl}/api/signup-notifications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      }).catch(err => {
        console.error('Failed to send signup notification:', err);
        // Don't block the user flow if email fails
      });
      
      navigate('/outreach/deals');
    } catch (error: any) {
      console.error('Signup failed:', error);
      throw new Error(error.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      delete axios.defaults.headers.common['Authorization'];
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
      // Still clear local state even if Firebase logout fails
      setUser(null);
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      delete axios.defaults.headers.common['Authorization'];
      navigate('/');
    }
  };

  const updateUser = (userData: Partial<User>) => {
    setUser(prev => prev ? { ...prev, ...userData } : null);
  };

  const refreshUser = async () => {
    if (!user) return;
    
    try {
      // Add a small delay to ensure Firestore write completes
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const newName = await fetchUserProfile(user.id, user.email, user.name);
      if (newName !== user.name) {
        setUser({ ...user, name: newName });
        console.log('✅ Refreshed user display name:', newName);
      }
    } catch (error) {
      console.error('Failed to refresh user:', error);
      // On error, try to fetch profiles directly
      try {
        const userRef = doc(db, 'users', user.id);
        const userSnap = await getDoc(userRef);
        const data = userSnap.exists() ? (userSnap.data() as any) : {};
        const primaryProfileId = data?.primaryProfileId;
        const profiles = await searcherProfilesApi.getSearcherProfiles();
        // Ensure profiles is an array before using array methods
        if (Array.isArray(profiles) && primaryProfileId && profiles.length > 0) {
          const primaryProfile = profiles.find(p => p.id === primaryProfileId);
          if (primaryProfile && primaryProfile.name !== user.name) {
            setUser({ ...user, name: primaryProfile.name });
            console.log('✅ Updated user display name from profile:', primaryProfile.name);
          }
        }
      } catch (fallbackError) {
        console.error('Fallback refresh also failed:', fallbackError);
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, updateUser, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};