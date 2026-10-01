import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { MainLayout } from '../components/layout/MainLayout';
import { Loader } from '../components/common/Loader';

// Pages
import { Login } from '../pages/Login';
import { VerifyOTP } from '../pages/VerifyOTP';
import { CreateProfile } from '../pages/CreateProfile';
import { Home } from '../pages/Home';
import { Chat } from '../pages/Chat';
import { Contacts } from '../pages/Contacts';
import { Profile } from '../pages/Profile';
import { Settings } from '../pages/Settings';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
        <Loader message="Verifying session..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return null;
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Auth Routes */}
      <Route
        path="/login"
        element={
          <div className="app-viewport">
            <PublicRoute>
              <Login />
            </PublicRoute>
          </div>
        }
      />
      <Route
        path="/verify"
        element={
          <div className="app-viewport">
            <PublicRoute>
              <VerifyOTP />
            </PublicRoute>
          </div>
        }
      />

      {/* Profile Onboarding */}
      <Route
        path="/create-profile"
        element={
          <div className="app-viewport">
            <ProtectedRoute>
              <CreateProfile />
            </ProtectedRoute>
          </div>
        }
      />

      {/* Protected Mobile Shell Routes */}
      <Route
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Home />} />
        <Route path="/chat/:id" element={<Chat />} />
        <Route path="/contacts" element={<Contacts />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/settings" element={<Settings />} />
      </Route>

      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
