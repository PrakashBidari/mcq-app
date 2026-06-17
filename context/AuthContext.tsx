import { API_URL } from "@/config/constants";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import React, { createContext, useContext, useEffect, useState } from "react";

interface User {
  id: number;
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  pendingResetOtp: string | null;
  login: (userData: User, authToken: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  setPendingResetOtp: (otp: string | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingResetOtp, setPendingResetOtp] = useState<string | null>(null);

  useEffect(() => {
    loadAuthData();
  }, []);

  const loadAuthData = async () => {
    try {
      const savedToken = await SecureStore.getItemAsync("auth_token");
      const savedUser = await AsyncStorage.getItem("auth_user");

      if (savedToken && savedUser) {
        try {
          const response = await fetch(`${API_URL}/user`, {
            headers: { Authorization: `Bearer ${savedToken}` },
          });

          if (response.status === 401) {
            await SecureStore.deleteItemAsync("auth_token");
            await AsyncStorage.removeItem("auth_user");
            setToken(null);
            setUser(null);
            return;
          }

          const contentType = response.headers.get("content-type") ?? "";
          const isJson = contentType.includes("application/json");

          if (!isJson) {
            setToken(savedToken);
            setUser(JSON.parse(savedUser));
            return;
          }

          const data = await response.json();

          if (data.success && data.data) {
            setToken(savedToken);
            setUser(data.data);
          } else {
            await SecureStore.deleteItemAsync("auth_token");
            await AsyncStorage.removeItem("auth_user");
            setToken(null);
            setUser(null);
          }
        } catch {
          setToken(savedToken);
          setUser(JSON.parse(savedUser));
        }
      }
    } catch {
      // silent — storage unavailable
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (userData: User, authToken: string) => {
    setUser(userData);
    setToken(authToken);
    await SecureStore.setItemAsync("auth_token", authToken);
    await AsyncStorage.setItem("auth_user", JSON.stringify(userData));
  };

  const logout = async () => {
    try {
      if (token) {
        try {
          await fetch(`${API_URL}/logout`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          });
        } catch {
          // network error during logout — continue to clear local session
        }
      }

      setUser(null);
      setToken(null);
      setPendingResetOtp(null);
      await SecureStore.deleteItemAsync("auth_token");
      await AsyncStorage.removeItem("auth_user");
    } catch {
      // silent
    }
  };

  const refreshUser = async () => {
    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/user`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 401) {
        await logout();
        return;
      }

      const data = await response.json();

      if (data.success) {
        setUser(data.data);
        await AsyncStorage.setItem("auth_user", JSON.stringify(data.data));
      }
    } catch {
      // silent — keep existing user state on network error
    }
  };

  const value = {
    user,
    token,
    isLoading,
    isAuthenticated: !!token && !!user,
    pendingResetOtp,
    login,
    logout,
    refreshUser,
    setPendingResetOtp,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
