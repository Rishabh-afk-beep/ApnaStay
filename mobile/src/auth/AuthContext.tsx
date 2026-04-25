import React, { createContext, useContext, useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  type User,
} from "firebase/auth";

import { auth } from "./firebase";
import {
  getMe,
  registerUser,
  saveToken,
  clearToken,
  setApiToken,
} from "../api/client";
import type { UserProfile } from "../types";

interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<User>;
  register: (
    role: string,
    name: string,
    extras?: { phone?: string; email?: string; college_id?: string }
  ) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({
  user: null,
  profile: null,
  loading: true,
  login: async () => {},
  signUp: async () => null as any,
  register: async () => {},
  resetPassword: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Listen to auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          const token = await firebaseUser.getIdToken();
          setApiToken(token);
          await saveToken(token);
          const me = await getMe();
          setProfile(me);
        } catch {
          setProfile(null);
        }
      } else {
        setProfile(null);
        await clearToken();
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const login = async (email: string, password: string) => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const token = await cred.user.getIdToken();
    setApiToken(token);
    await saveToken(token);
    try {
      const me = await getMe();
      setProfile(me);
    } catch {
      // Not registered yet — profile will be null
    }
  };

  const signUp = async (email: string, password: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const token = await cred.user.getIdToken();
    setApiToken(token);
    await saveToken(token);
    return cred.user;
  };

  const register = async (
    role: string,
    name: string,
    extras?: { phone?: string; email?: string; college_id?: string }
  ) => {
    if (!user) throw new Error("Not authenticated");
    const token = await user.getIdToken(true);
    setApiToken(token);
    await saveToken(token);

    await registerUser({
      role,
      name,
      phone: extras?.phone,
      email: extras?.email || user.email || undefined,
      college_id: extras?.college_id,
    });

    // Force refresh token to pick up new claims
    const newToken = await user.getIdToken(true);
    setApiToken(newToken);
    await saveToken(newToken);

    const me = await getMe();
    setProfile(me);
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setProfile(null);
    await clearToken();
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  return (
    <AuthContext.Provider
      value={{ user, profile, loading, login, signUp, register, resetPassword, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
