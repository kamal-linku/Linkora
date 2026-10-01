import React, { useState } from 'react';
import { Navbar } from '../components/layout/Navbar';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';
import { Toast } from '../components/common/Toast';
import { useAuth } from '../hooks/useAuth';
import { userApi } from '../services/userApi';

export const Profile = () => {
  const { user, updateUserProfile } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [about, setAbout] = useState(user?.about || '');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setToast({ message: 'Name cannot be empty', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      const updated = await userApi.updateProfile({ name: name.trim(), about: about.trim() });
      updateUserProfile(updated);
      setToast({ message: 'Profile updated successfully!', type: 'success' });
    } catch (err) {
      setToast({ message: err.message || 'Failed to update profile', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto' }}>
      <Navbar title="My Profile" />

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div style={{ padding: '24px 20px' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div
            style={{
              width: '84px',
              height: '84px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '36px',
              color: '#fff',
              fontWeight: '700',
              margin: '0 auto 12px',
              boxShadow: '0 6px 20px rgba(0, 0, 0, 0.3)',
            }}
          >
            {user?.name ? user.name[0].toUpperCase() : '👤'}
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: '700' }}>{user?.name || 'Unnamed User'}</h3>
          <span style={{ fontSize: '13px', color: 'var(--text-sub)' }}>{user?.phone_number}</span>
        </div>

        <form onSubmit={handleSave}>
          <div className="form-group">
            <label className="form-label">Phone Number</label>
            <input
              type="text"
              value={user?.phone_number || ''}
              disabled
              className="input-control"
              style={{ opacity: 0.65, cursor: 'not-allowed' }}
            />
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Your phone number is verified and tied to this account.
            </span>
          </div>

          <Input
            label="Display Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            disabled={loading}
          />

          <Input
            label="About Status"
            value={about}
            onChange={(e) => setAbout(e.target.value)}
            placeholder="Status message"
            disabled={loading}
          />

          <Button
            type="submit"
            disabled={loading}
            style={{ width: '100%', marginTop: '8px' }}
          >
            {loading ? 'Saving Changes...' : 'Save Profile'}
          </Button>
        </form>
      </div>
    </div>
  );
};
