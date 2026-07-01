"use client";
// frontend/src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { authApi } from "@/lib/api/auth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  const saveSession = (userData, accessToken) => {
    setUser(userData);
    setToken(accessToken);
    localStorage.setItem("accessToken", accessToken);
  };

  const clearSession = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("accessToken");
  };

  // Restore session on mount
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const stored = localStorage.getItem("accessToken");
        if (!stored) throw new Error("No token");
        const { data } = await authApi.getMe(stored);
        setUser(data.user);
        setToken(stored);
      } catch {
        // Try silent refresh
        try {
          const { data } = await authApi.refresh();
          const { data: meData } = await authApi.getMe(data.accessToken);
          saveSession(meData.user, data.accessToken);
        } catch {
          clearSession();
        }
      } finally {
        setLoading(false);
      }
    };
    restoreSession();
  }, []);

  const register = useCallback(async (formData) => {
    const { data } = await authApi.register(formData);
    saveSession(data.user, data.accessToken);
    return data;
  }, []);

  const login = useCallback(async (formData) => {
    const { data } = await authApi.login(formData);
    saveSession(data.user, data.accessToken);
    return data;
  }, []);

  const logout = useCallback(async () => {
    if (token) await authApi.logout(token);
    clearSession();
  }, [token]);

  return (
    <AuthContext.Provider value={{ user, token, loading, register, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};
