"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import {
  getAuthErrorMessage,
  signInWithGoogle,
  signOutUser,
} from "@/lib/auth";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  error: string;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const signIn = useCallback(async () => {
    setError("");
    try {
      await signInWithGoogle();
    } catch (err) {
      const message = getAuthErrorMessage(err);
      if (message) setError(message);
    }
  }, []);

  const logOut = useCallback(async () => {
    setError("");
    try {
      await signOutUser();
    } catch (err) {
      const message = getAuthErrorMessage(err);
      if (message) setError(message);
    }
  }, []);

  const value = useMemo(
    () => ({ user, loading, error, signIn, signOut: logOut }),
    [user, loading, error, signIn, logOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth는 AuthProvider 안에서만 사용할 수 있습니다.");
  }
  return context;
}
