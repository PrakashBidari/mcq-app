import { API_URL } from "@/config/constants";
import AsyncStorage from "@react-native-async-storage/async-storage";
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
  login: (userData: User, authToken: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load saved auth data on app start
  useEffect(() => {
    loadAuthData();
  }, []);

  const loadAuthData = async () => {
    try {
      const savedToken = await AsyncStorage.getItem("auth_token");
      const savedUser = await AsyncStorage.getItem("auth_user");

      if (savedToken && savedUser) {
        // Verify token with backend
        try {
          const response = await fetch(`${API_URL}/user`, {
            headers: {
              Authorization: `Bearer ${savedToken}`,
            },
          });

          const data = await response.json();

          if (data.success && data.data) {
            // Token is valid, user exists
            setToken(savedToken);
            setUser(data.data);
          } else {
            // Token invalid or user not found - clear storage
            await AsyncStorage.removeItem("auth_token");
            await AsyncStorage.removeItem("auth_user");
            setToken(null);
            setUser(null);
          }
        } catch (error) {
          // Backend error - clear auth
          console.error("Token verification failed:", error);
          await AsyncStorage.removeItem("auth_token");
          await AsyncStorage.removeItem("auth_user");
          setToken(null);
          setUser(null);
        }
      }
    } catch (error) {
      console.error("Error loading auth data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (userData: User, authToken: string) => {
    try {
      // Save to state
      setUser(userData);
      setToken(authToken);

      // Save to AsyncStorage
      await AsyncStorage.setItem("auth_token", authToken);
      await AsyncStorage.setItem("auth_user", JSON.stringify(userData));
    } catch (error) {
      console.error("Error saving auth data:", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Call logout API if token exists
      if (token) {
        try {
          await fetch(`${API_URL}/logout`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          });
        } catch (error) {
          console.error("Logout API error:", error);
        }
      }

      // Clear state
      setUser(null);
      setToken(null);

      // Clear AsyncStorage
      await AsyncStorage.removeItem("auth_token");
      await AsyncStorage.removeItem("auth_user");
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  const refreshUser = async () => {
    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/user`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setUser(data.data);
        await AsyncStorage.setItem("auth_user", JSON.stringify(data.data));
      }
    } catch (error) {
      console.error("Error refreshing user:", error);
    }
  };

  const value = {
    user,
    token,
    isLoading,
    isAuthenticated: !!token && !!user,
    login,
    logout,
    refreshUser,
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
