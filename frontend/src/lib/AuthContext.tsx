import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {
  GoogleAuthProvider,
  RecaptchaVerifier,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPhoneNumber,
  signInWithPopup,
  signOut,
  sendPasswordResetEmail,
  type ConfirmationResult,
  type User,
} from "firebase/auth";

import { auth, isFirebaseConfigured } from "../auth/firebase";
import { getMe, registerUser, setApiToken } from "./api";
import type { UserProfile } from "../types";

interface AuthContextValue {
  firebaseUser: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isConfigured: boolean;
  sendOtp: (phone: string) => Promise<void>;
  verifyOtp: (code: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  register: (role: string, name: string, extra?: { phone?: string; email?: string; college_id?: string }) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmResult, setConfirmResult] = useState<ConfirmationResult | null>(null);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      console.info("[NearMyColleges] Firebase not configured — running in guest mode");
      setLoading(false);
      return;
    }

    try {
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        setFirebaseUser(user);
        if (user) {
          const token = await user.getIdToken();
          setApiToken(token);
          try {
            const me = await getMe();
            setProfile(me);
          } catch {
            // User authenticated but not registered yet — that's ok
            setProfile(null);
          }
        } else {
          setApiToken("");
          setProfile(null);
        }
        setLoading(false);
      });
      return unsubscribe;
    } catch (err) {
      console.warn("[NearMyColleges] Auth listener failed:", err);
      setLoading(false);
    }
  }, []);

  const sendOtp = async (phone: string) => {
    if (!isFirebaseConfigured) throw new Error("Firebase not configured");
    const appVerifier = new RecaptchaVerifier(auth, "recaptcha-container", { size: "invisible" });
    const result = await signInWithPhoneNumber(auth, phone, appVerifier);
    setConfirmResult(result);
  };

  const verifyOtp = async (code: string) => {
    if (!confirmResult) throw new Error("No OTP sent yet");
    await confirmResult.confirm(code);
  };

  const loginWithGoogle = async () => {
    if (!isFirebaseConfigured) throw new Error("Firebase not configured");
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const loginWithEmail = async (email: string, password: string) => {
    if (!isFirebaseConfigured) throw new Error("Firebase not configured");
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signUpWithEmail = async (email: string, password: string) => {
    if (!isFirebaseConfigured) throw new Error("Firebase not configured");
    await createUserWithEmailAndPassword(auth, email, password);
  };

  const register = async (role: string, name: string, extra?: { phone?: string; email?: string; college_id?: string }) => {
    if (!firebaseUser) throw new Error("Must be signed in first");
    const token = await firebaseUser.getIdToken();
    setApiToken(token);
    await registerUser({
      role,
      name,
      phone: extra?.phone,
      email: extra?.email || firebaseUser.email || undefined,
      college_id: extra?.college_id,
    });

    // Force-refresh the Firebase ID token so new custom claims (role) take effect
    const freshToken = await firebaseUser.getIdToken(true);
    setApiToken(freshToken);

    // Now fetch profile with the refreshed token
    try {
      const me = await getMe();
      setProfile(me);
    } catch {
      setProfile(null);
    }
  };

  const logout = async () => {
    try { await signOut(auth); } catch { /* ignore */ }
    setApiToken("");
    setProfile(null);
    setFirebaseUser(null);
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const refreshProfile = async () => {
    if (firebaseUser) {
      const token = await firebaseUser.getIdToken(true);
      setApiToken(token);
      try {
        const me = await getMe();
        setProfile(me);
      } catch {
        setProfile(null);
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        profile,
        loading,
        isConfigured: isFirebaseConfigured,
        sendOtp,
        verifyOtp,
        loginWithGoogle,
        loginWithEmail,
        signUpWithEmail,
        resetPassword,
        register,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
