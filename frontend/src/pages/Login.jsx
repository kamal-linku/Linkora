import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PhoneInput } from '../components/auth/PhoneInput';
import { Button } from '../components/common/Button';
import { Toast } from '../components/common/Toast';
import { authApi } from '../services/authApi';
import { validatePhoneNumber } from '../utils/validators';

export const Login = () => {
  // authTab: 'register' for new users, 'login' for existing users
  const [authTab, setAuthTab] = useState('register');
  // default to 'email' as requested for real EmailJS OTP
  const [loginMode, setLoginMode] = useState('email');
  const [countryCode, setCountryCode] = useState('+91');
  const [identifier, setIdentifier] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [showServerModal, setShowServerModal] = useState(false);
  const [serverUrlInput, setServerUrlInput] = useState(
    localStorage.getItem('chatconnect_server_url') || ''
  );
  const navigate = useNavigate();

  const handleSaveServer = () => {
    if (serverUrlInput.trim()) {
      localStorage.setItem('chatconnect_server_url', serverUrlInput.trim());
      setToast({ message: 'Server address updated!', type: 'success' });
    } else {
      localStorage.removeItem('chatconnect_server_url');
      setToast({ message: 'Default server restored', type: 'info' });
    }
    setShowServerModal(false);
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();
    const clean = identifier.trim();
    const check = validatePhoneNumber(clean);
    if (!check.isValid) {
      setToast({ message: check.error, type: 'error' });
      return;
    }

    const fullTarget =
      loginMode === 'email' || clean.includes('@')
        ? clean.toLowerCase()
        : `${countryCode}${clean}`;

    setLoading(true);
    try {
      // Dispatch real OTP via backend EmailJS gateway
      await authApi.sendOtp(fullTarget);

      // Navigate to verification screen (no dummy devOtp passed)
      navigate('/verify', {
        state: {
          phoneNumber: fullTarget,
          loginMode,
          isRegister: authTab === 'register',
        },
      });
    } catch (err) {
      setToast({ message: err.message || 'Failed to dispatch OTP', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '28px 24px',
        background: 'var(--surface-body)',
        minHeight: '100%',
        boxSizing: 'border-box',
      }}
    >
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Server URL Config Modal for Mobile APK */}
      {showServerModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            zIndex: 9999,
          }}
        >
          <div
            style={{
              background: 'var(--surface-card)',
              borderRadius: '16px',
              padding: '24px',
              width: '100%',
              maxWidth: '360px',
              border: '1px solid var(--border-light)',
            }}
          >
            <h3 style={{ fontSize: '17px', fontWeight: '700', marginBottom: '8px' }}>⚙️ Server Configuration</h3>
            <p style={{ fontSize: '12.5px', color: 'var(--text-sub)', marginBottom: '14px', lineHeight: '1.4' }}>
              If running this APK on a mobile phone, enter your backend server URL (e.g. your PC's IP <code>http://192.168.1.X:8000</code> or deployed backend):
            </p>
            <input
              type="text"
              value={serverUrlInput}
              onChange={(e) => setServerUrlInput(e.target.value)}
              placeholder="e.g. http://192.168.1.5:8000"
              className="input-control"
              style={{ width: '100%', boxSizing: 'border-box', marginBottom: '16px' }}
            />
            <div style={{ display: 'flex', gap: '10px' }}>
              <Button variant="secondary" onClick={() => setShowServerModal(false)} style={{ flex: 1 }}>
                Cancel
              </Button>
              <Button onClick={handleSaveServer} style={{ flex: 1 }}>
                Save
              </Button>
            </div>
          </div>
        </div>
      )}

      <div>
        {/* Top bar with Server Settings Icon */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '-20px' }}>
          <button
            type="button"
            onClick={() => setShowServerModal(true)}
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid var(--border-light)',
              borderRadius: '20px',
              padding: '6px 12px',
              color: 'var(--text-sub)',
              fontSize: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
            title="Configure Server URL"
          >
            ⚙️ Server IP
          </button>
        </div>

        {/* App Logo & Header */}
        <div style={{ textAlign: 'center', margin: '20px 0 18px' }}>
          <div
            style={{
              width: '68px',
              height: '68px',
              borderRadius: '20px',
              background: 'linear-gradient(135deg, var(--accent-green), var(--accent-teal))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '34px',
              margin: '0 auto 14px',
              boxShadow: '0 8px 24px rgba(37, 211, 102, 0.3)',
            }}
          >
            💬
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '4px', letterSpacing: '-0.3px' }}>
            ChatConnect
          </h1>
          <p style={{ color: 'var(--text-sub)', fontSize: '13px', margin: 0 }}>
            Real-time messaging with instant OTP authentication
          </p>
        </div>

        {/* Dedicated Registration vs Sign-In Tab Selector */}
        <div
          style={{
            display: 'flex',
            background: 'var(--surface-card)',
            borderRadius: '12px',
            padding: '4px',
            marginBottom: '20px',
            border: '1px solid var(--border-light)',
          }}
        >
          <button
            type="button"
            onClick={() => setAuthTab('register')}
            style={{
              flex: 1,
              padding: '10px 14px',
              borderRadius: '9px',
              border: 'none',
              fontSize: '13.5px',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              background: authTab === 'register' ? 'var(--accent-green)' : 'transparent',
              color: authTab === 'register' ? '#0b141a' : 'var(--text-sub)',
              boxShadow: authTab === 'register' ? '0 2px 8px rgba(37, 211, 102, 0.25)' : 'none',
            }}
          >
            ✨ Register (New User)
          </button>
          <button
            type="button"
            onClick={() => setAuthTab('login')}
            style={{
              flex: 1,
              padding: '10px 14px',
              borderRadius: '9px',
              border: 'none',
              fontSize: '13.5px',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              background: authTab === 'login' ? 'var(--accent-green)' : 'transparent',
              color: authTab === 'login' ? '#0b141a' : 'var(--text-sub)',
              boxShadow: authTab === 'login' ? '0 2px 8px rgba(37, 211, 102, 0.25)' : 'none',
            }}
          >
            👋 Sign In
          </button>
        </div>

        {/* Card Header for Current Tab */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: '12px',
            padding: '12px 14px',
            marginBottom: '16px',
            border: '1px solid var(--border-light)',
          }}
        >
          <div style={{ fontSize: '14.5px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '4px' }}>
            {authTab === 'register' ? 'Create New Account' : 'Welcome Back'}
          </div>
          <div style={{ color: 'var(--text-sub)', fontSize: '12.5px', lineHeight: '1.4' }}>
            {authTab === 'register'
              ? loginMode === 'email'
                ? 'Enter your email to receive a real 6-digit verification code directly in your inbox.'
                : 'Enter your phone number to receive a verification SMS code.'
              : loginMode === 'email'
              ? 'Enter your registered email to receive your login verification OTP.'
              : 'Enter your registered mobile number to receive your login code.'}
          </div>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSendOTP}>
          <PhoneInput
            loginMode={loginMode}
            onLoginModeChange={setLoginMode}
            countryCode={countryCode}
            onCountryCodeChange={setCountryCode}
            identifier={identifier}
            onIdentifierChange={setIdentifier}
            disabled={loading}
          />

          <Button
            type="submit"
            disabled={loading || !identifier.trim()}
            style={{ width: '100%', marginTop: '16px', padding: '14px', fontSize: '14.5px' }}
          >
            {loading
              ? 'Sending Real OTP...'
              : authTab === 'register'
              ? `Register & Send ${loginMode === 'email' ? 'Email' : 'SMS'} OTP`
              : `Sign In with ${loginMode === 'email' ? 'Email' : 'SMS'} OTP`}
          </Button>
        </form>

        {/* Direct Link to Switch Tab */}
        <div style={{ textAlign: 'center', marginTop: '18px', fontSize: '13px', color: 'var(--text-sub)' }}>
          {authTab === 'register' ? (
            <span>
              Already registered?{' '}
              <button
                type="button"
                onClick={() => setAuthTab('login')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--accent-green)',
                  fontWeight: '700',
                  cursor: 'pointer',
                  padding: 0,
                  fontSize: '13px',
                }}
              >
                Sign In
              </button>
            </span>
          ) : (
            <span>
              New to ChatConnect?{' '}
              <button
                type="button"
                onClick={() => setAuthTab('register')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--accent-green)',
                  fontWeight: '700',
                  cursor: 'pointer',
                  padding: 0,
                  fontSize: '13px',
                }}
              >
                Create Account
              </button>
            </span>
          )}
        </div>
      </div>

      {/* Security Footer */}
      <div
        style={{
          textAlign: 'center',
          color: 'var(--text-muted)',
          fontSize: '11.5px',
          marginTop: '24px',
          lineHeight: '1.4',
        }}
      >
        🔒 Real Email Verification via EmailJS &bull; Persistent Session Enabled
      </div>
    </div>
  );
};
