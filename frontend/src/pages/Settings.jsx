import React from 'react';
import { Navbar } from '../components/layout/Navbar';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/common/Button';

export const Settings = () => {
  const { logout, user } = useAuth();

  const handleLogout = () => {
    if (confirm('Are you sure you want to log out of ChatConnect?')) {
      logout();
    }
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto' }}>
      <Navbar title="Settings" />

      <div style={{ padding: '20px 16px' }}>
        {/* Account Info */}
        <div
          style={{
            background: 'var(--surface-header)',
            borderRadius: 'var(--radius-md)',
            padding: '16px',
            marginBottom: '16px',
            border: '1px solid var(--border-light)',
          }}
        >
          <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '8px' }}>
            ACCOUNT DETAILS
          </div>
          <div style={{ fontSize: '15px', fontWeight: '600' }}>{user?.name || 'ChatConnect User'}</div>
          <div style={{ fontSize: '13px', color: 'var(--accent-green)', marginTop: '2px' }}>
            {user?.phone_number} (Verified)
          </div>
        </div>

        {/* Security & Features */}
        <div
          style={{
            background: 'var(--surface-header)',
            borderRadius: 'var(--radius-md)',
            padding: '16px',
            marginBottom: '16px',
            border: '1px solid var(--border-light)',
          }}
        >
          <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '12px' }}>
            CARRIER & SYSTEM SPECS
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-light)', fontSize: '13.5px' }}>
            <span style={{ color: 'var(--text-sub)' }}>Authentication</span>
            <span style={{ color: 'var(--text-main)', fontWeight: '600' }}>Carrier Phone OTP</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-light)', fontSize: '13.5px' }}>
            <span style={{ color: 'var(--text-sub)' }}>Transport</span>
            <span style={{ color: 'var(--text-main)', fontWeight: '600' }}>WebSocket (RFC 6455)</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-light)', fontSize: '13.5px' }}>
            <span style={{ color: 'var(--text-sub)' }}>Sound Alerts</span>
            <span style={{ color: 'var(--accent-green)', fontWeight: '600' }}>Web Audio Synthesizer</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: '13.5px' }}>
            <span style={{ color: 'var(--text-sub)' }}>Client Format</span>
            <span style={{ color: 'var(--text-main)', fontWeight: '600' }}>Native Mobile App Shell</span>
          </div>
        </div>

        {/* Actions */}
        <div style={{ marginTop: '24px' }}>
          <Button
            onClick={handleLogout}
            variant="secondary"
            style={{ width: '100%', color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.3)' }}
          >
            Log Out of Account
          </Button>
        </div>

        <div style={{ textAlign: 'center', marginTop: '30px', color: 'var(--text-muted)', fontSize: '11.5px' }}>
          ChatConnect Mobile v1.0.0 &bull; Built with FastAPI & React
        </div>
      </div>
    </div>
  );
};
