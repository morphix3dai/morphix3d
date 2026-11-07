"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  auth as authApi,
  credits as creditsApi,
  getAccessToken,
  setAccessToken,
  setRefreshToken,
  type User as UserType,
} from "@/lib/api";

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
  credits: 200,
  plan: "FREE",
  isLoading: true,
  isLoggedIn: false,
  refreshUser: async () => {},
  updateCredits: () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserType | null>(null);
  const [credits, setCredits] = useState<number>(200);
  const [plan, setPlan] = useState<string>("FREE");
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUser = useCallback(async () => {
    const token = getAccessToken();
    if (!token) {
      setUser(null);
      setCredits(200);
      setPlan("FREE");
      setIsLoading(false);
      return;
    }
    try {
      const [meData, creditData] = await Promise.all([
        authApi.me().catch(() => null),
        creditsApi.balance().catch(() => null),
      ]);
      const fetchedUser = meData?.user;
      const isLegacyTestAccount =
        fetchedUser &&
        ((fetchedUser.email.startsWith("studio_") && fetchedUser.email.endsWith("@3dmorphix.com")) ||
          fetchedUser.email.startsWith("google_user_") ||
          fetchedUser.name === "Morphix Studio Creator");

      if (fetchedUser && !isLegacyTestAccount) {
        setUser(fetchedUser);
        setPlan(creditData?.plan || fetchedUser.plan || "FREE");
        setCredits(creditData?.credits !== undefined ? creditData.credits : (fetchedUser.credits || 0));
      } else {
        if (isLegacyTestAccount) {
          setAccessToken(null);
          setRefreshToken(null);
        }
        setUser(null);
        setCredits(200);
        setPlan("FREE");
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
