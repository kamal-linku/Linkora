import React, { createContext, useState, useEffect } from 'react';
import { storage } from '../utils/storage';
import { authApi } from '../services/authApi';
import { wsService } from '../websocket/websocket';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const initialToken = storage.getToken();
  const initialUser = storage.getUser();

  const [user, setUser] = useState(initialUser);
  const [token, setToken] = useState(initialToken);
  const [loading, setLoading] = useState(!initialToken);

  useEffect(() => {
    const verifyAuth = async () => {
      const storedToken = storage.getToken();
      if (!storedToken) {
        setLoading(false);
        return;
      }

      // Auto-connect websocket with existing session
      wsService.connect();

      try {
        const userData = await authApi.getMe();
        setUser(userData);
        storage.setUser(userData);
      } catch (err) {
        console.warn('Session verification notice:', err);
        // Only invalidate session if it's strictly a 401 unauthorized error
        if (err.message && (err.message.includes('401') || err.message.toLowerCase().includes('unauthorized') || err.message.toLowerCase().includes('not authenticated'))) {
          storage.clear();
          setUser(null);
          setToken(null);
          wsService.disconnect();
        }
      } finally {
        setLoading(false);
      }
    };

    verifyAuth();

    const handleUnauthorized = () => {
      storage.clear();
      setUser(null);
      setToken(null);
      wsService.disconnect();
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  const loginWithToken = (newToken, newUser) => {
    storage.setToken(newToken);
    storage.setUser(newUser);
    setToken(newToken);
    setUser(newUser);
    setLoading(false);
    wsService.connect();
  };

  const logout = () => {
    wsService.disconnect();
    storage.clear();
    setToken(null);
    setUser(null);
  };

  const updateUserProfile = (updatedUser) => {
    setUser(updatedUser);
    storage.setUser(updatedUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        loading,
        loginWithToken,
        logout,
        updateUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
