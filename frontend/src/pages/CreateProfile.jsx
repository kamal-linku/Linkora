import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';
import { Toast } from '../components/common/Toast';
import { userApi } from '../services/userApi';
import { useAuth } from '../hooks/useAuth';

export const CreateProfile = () => {
  const [name, setName] = useState('');
  const [about, setAbout] = useState('Hey there! I am using ChatConnect.');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const { updateUserProfile } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) {
      setToast({ message: 'Please enter your name', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      const updated = await userApi.updateProfile({ name: cleanName, about: about.trim() });
      updateUserProfile(updated);
      navigate('/');
    } catch (err) {
      setToast({ message: err.message || 'Failed to save profile', type: 'error' });
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
        padding: '32px 24px',
        background: 'var(--surface-body)',
      }}
    >
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div>
        <div style={{ textAlign: 'center', margin: '30px 0 24px' }}>
          <div
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '36px',
              margin: '0 auto 16px',
              color: '#fff',
              fontWeight: '700',
            }}
          >
            {name ? name[0].toUpperCase() : '👤'}
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: '800', marginBottom: '6px' }}>Profile Info</h2>
          <p style={{ color: 'var(--text-sub)', fontSize: '13.5px' }}>
            Please provide your name so friends can recognize you.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <Input
            label="Your Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Kamal Sharma"
            disabled={loading}
            autoFocus
          />

          <Input
            label="About"
            value={about}
            onChange={(e) => setAbout(e.target.value)}
            placeholder="About status"
            disabled={loading}
          />

          <Button type="submit" disabled={loading || !name.trim()} style={{ width: '100%', marginTop: '12px' }}>
            {loading ? 'Saving...' : 'Start Chatting'}
          </Button>
        </form>
      </div>

      <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
        You can always update this later from Settings.
      </div>
    </div>
  );
};
