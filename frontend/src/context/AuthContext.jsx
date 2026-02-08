import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import api from "../api/api";
import { MOCK_USER } from "../data/mockData";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setTokenState] = useState(api.getToken());
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const setToken = useCallback((t) => {
    api.setToken(t);
    setTokenState(api.getToken());
  }, []);

  const refreshMe = useCallback(async () => {
    if (!api.getToken()) {
      setUser(null);
      return null;
    }
    try {
      const me = await api.auth.me();
      setUser(me);
      return me;
    } catch {
      setToken(null);
      setUser(null);
      return null;
    }
  }, [setToken]);

  useEffect(() => {
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    if (token === "mock") {
      setUser(MOCK_USER);
      setLoading(false);
      return;
    }
    refreshMe().finally(() => setLoading(false));
  }, [token, refreshMe]);

  const login = useCallback(
    async (email, password) => {
      const { access_token } = await api.auth.login(email, password);
      setToken(access_token);
      const me = await api.auth.me();
      setUser(me);
      return me;
    },
    [setToken]
  );

  const loginMock = useCallback(() => {
    setToken("mock");
    setUser(MOCK_USER);
  }, [setToken]);

  const logout = useCallback(() => {
    api.clearToken();
    setTokenState(null);
    setUser(null);
  }, []);

  const value = {
    token,
    user,
    loading,
    login,
    loginMock,
    logout,
    setUser,
    refreshMe,
    isAuthenticated: !!token && !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
