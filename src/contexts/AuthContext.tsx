import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  onAuthStateChanged,
  User,
} from "firebase/auth";
import { auth, db } from "../firebase/config";
import { doc, setDoc, updateDoc, getDoc, serverTimestamp } from "firebase/firestore";

type Profile = {
  firstName?: string;
  lastName?: string;
  phone?: string | null;
  location?: string | null;
  // later steps:
  searchDetails?: any;
  teamExperience?: any;
  preferences?: any;
  onboardStep?: number;
};

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, profile?: Profile) => Promise<void>;
  saveProfile: (data: Partial<Profile>) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  // keep user in sync with Firebase
  useEffect(() => onAuthStateChanged(auth, setUser), []);

  const login = async (email: string, password: string) => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    setUser(cred.user);
    const token = await cred.user.getIdToken();
    localStorage.setItem("token", token);
  };


const signup = async (email: string, password: string, profile?: Profile) => {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  setUser(cred.user);
  const token = await cred.user.getIdToken();
  localStorage.setItem("token", token);

  if (profile?.firstName || profile?.lastName) {
    await updateProfile(cred.user, {
      displayName: `${profile.firstName ?? ""} ${profile.lastName ?? ""}`.trim(),
    });
  }

  const ref = doc(db, "users", cred.user.uid);
  await setDoc(ref, {
    email: email.toLowerCase(),
    firstName: profile?.firstName ?? null,
    lastName: profile?.lastName ?? null,
    phone: profile?.phone ?? null,
    location: profile?.location ?? null,
    searchDetails: profile?.searchDetails ?? null,
    teamExperience: profile?.teamExperience ?? null,
    preferences: profile?.preferences ?? null,
    onboardStep: 1,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
};


  const saveProfile = async (data: Partial<Profile>) => {
    const u = auth.currentUser;
    if (!u) throw new Error("Not authenticated");
    const ref = doc(db, "users", u.uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, {
        email: u.email ?? "",
        createdAt: serverTimestamp(),
        onboardStep: 1,
        ...data,
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(ref, { ...data, updatedAt: serverTimestamp() });
    }
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    localStorage.removeItem("token");
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, saveProfile, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
};
