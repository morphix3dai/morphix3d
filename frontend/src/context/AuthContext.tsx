"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { auth as authApi, credits as creditsApi, getAccessToken, type User as UserType } from "@/lib/api";

interface AuthContextType {
  user: UserType | null;
  credits: number;
  plan: string;
  isLoading: boolean;
  isLoggedIn: boolean;
  refreshUser: () => Promise<void>;
  updateCredits: (newCredits: number) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  credits: 0,
  plan: "FREE",
  isLoading: true,
  isLoggedIn: false,
  refreshUser: async () => {},
  updateCredits: () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserType | null>(null);
  const [credits, setCredits] = useState<number>(0);
  const [plan, setPlan] = useState<string>("FREE");
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUser = useCallback(async () => {
    const token = getAccessToken();
    if (!token) {
      setUser(null);
      setCredits(0);
      setPlan("FREE");
      setIsLoading(false);
      return;
    }
    try {
      const [meData, creditData] = await Promise.all([
        authApi.me().catch(() => null),
        creditsApi.balance().catch(() => null),
      ]);
      if (meData?.user) {
        setUser(meData.user);
        setPlan(creditData?.plan || meData.user.plan || "FREE");
        setCredits(creditData?.credits !== undefined ? creditData.credits : (meData.user.credits || 0));
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const updateCredits = useCallback((newCredits: number) => {
    setCredits(newCredits);
    setUser((prev) => (prev ? { ...prev, credits: newCredits } : null));
  }, []);

  const logout = useCallback(() => {
    authApi.logout();
    setUser(null);
    setCredits(0);
    setPlan("FREE");
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        credits,
        plan,
        isLoading,
        isLoggedIn: !!user,
        refreshUser,
        updateCredits,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
