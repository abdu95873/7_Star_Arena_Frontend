import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api, { setAccessToken, registerAuthHandlers } from '../lib/apiClient.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const applySession = useCallback((accessToken, nextUser) => {
    setAccessToken(accessToken || null);
    if (nextUser !== undefined) setUser(nextUser);
  }, []);

  // On first load, try to silently restore a session via the refresh cookie.
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { data } = await api.post('/auth/refresh');
        const token = data?.data?.accessToken;
        if (token) {
          setAccessToken(token);
          const me = await api.get('/auth/me');
          if (active) setUser(me.data.data.user);
        }
      } catch {
        /* no active session */
      } finally {
        if (active) setLoading(false);
      }
    })();

    registerAuthHandlers({
      onRefreshFailed: () => {
        setAccessToken(null);
        setUser(null);
      },
    });

    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async (payload) => {
    const { data } = await api.post('/auth/login', payload);
    applySession(data.data.accessToken, data.data.user);
    return data.data.user;
  }, [applySession]);

  const register = useCallback(async (payload) => {
    const { data } = await api.post('/auth/register', payload);
    applySession(data.data.accessToken, data.data.user);
    return data.data.user;
  }, [applySession]);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      /* ignore */
    }
    applySession(null, null);
  }, [applySession]);

  const refreshUser = useCallback(async () => {
    const me = await api.get('/auth/me');
    setUser(me.data.data.user);
    return me.data.data.user;
  }, []);

  const value = {
    user,
    loading,
    isAuthenticated: Boolean(user),
    isAdmin: user?.role === 'admin' || user?.role === 'staff',
    login,
    register,
    logout,
    refreshUser,
    setUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
