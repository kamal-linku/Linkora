import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { OTPInput } from '../components/auth/OTPInput';
import { Button } from '../components/common/Button';
import { Toast } from '../components/common/Toast';
import { authApi } from '../services/authApi';
import { useAuth } from '../hooks/useAuth';
import { validateOTP } from '../utils/validators';

export const VerifyOTP = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { loginWithToken } = useAuth();

  const phoneNumber = location.state?.phoneNumber;
  const isRegister = location.state?.isRegister;
  const isEmail = phoneNumber && phoneNumber.includes('@');

  // Real OTP: start completely empty, NO dummy OTP pre-filling!
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [timer, setTimer] = useState(60);

  useEffect(() => {
    if (!phoneNumber) {
      navigate('/login');
    }
  }, [phoneNumber, navigate]);

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer((t) => t - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  const handleVerify = async (e) => {
    if (e) e.preventDefault();
    const cleanOtp = otp.trim();
    const check = validateOTP(cleanOtp);
    if (!check.isValid) {
      setToast({ message: check.error, type: 'error' });
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.verifyOtp(phoneNumber, cleanOtp);
      loginWithToken(res.access_token, res.user);

      if (res.is_new_user || !res.user?.name) {
        navigate('/create-profile');
      } else {
        navigate('/');
      }
    } catch (err) {
      setToast({ message: err.message || 'Invalid or expired OTP', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (timer > 0) return;
    setLoading(true);
    try {
      await authApi.sendOtp(phoneNumber);
      setTimer(60);
      setOtp('');
      setToast({
        message: isEmail ? 'New OTP code sent to your email!' : 'New OTP code sent via SMS!',
        type: 'success',
      });
    } catch (err) {
      setToast({ message: err.message || 'Failed to resend OTP', type: 'error' });
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

      <div>
        <button
          onClick={() => navigate('/login')}
          className="btn-icon"
          style={{
            marginBottom: '16px',
            background: 'var(--surface-input)',
            border: '1px solid var(--border-light)',
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px',
            color: 'var(--text-main)',
          }}
          title="Back to login"
        >
          ←
        </button>

        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div
            style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: 'rgba(37, 211, 102, 0.15)',
              border: '2px solid var(--accent-green)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '28px',
              margin: '0 auto 14px',
            }}
          >
            {isEmail ? '✉️' : '💬'}
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: '800', marginBottom: '6px' }}>
            {isRegister ? 'Verify Email Registration' : 'Verify Your Identity'}
          </h2>
          <p style={{ color: 'var(--text-sub)', fontSize: '13.5px', margin: 0, lineHeight: '1.5' }}>
            Enter the 6-digit real verification code sent to:
            <br />
            <strong style={{ color: 'var(--accent-green)', fontSize: '14.5px' }}>{phoneNumber}</strong>
          </p>
        </div>

        {/* Helpful real OTP instructions box */}
        <div
          style={{
            background: 'rgba(37, 211, 102, 0.08)',
            border: '1px solid rgba(37, 211, 102, 0.3)',
            borderRadius: '12px',
            padding: '12px 14px',
            fontSize: '12.5px',
            color: 'var(--text-main)',
            marginBottom: '20px',
            lineHeight: '1.45',
          }}
        >
          {isEmail ? (
            <div>
              <strong>📧 Check your Email Inbox:</strong>
              <div style={{ color: 'var(--text-sub)', marginTop: '4px' }}>
                We sent your 6-digit code via EmailJS. If not found in primary inbox, please check your <strong>Spam / Junk</strong> folder.
              </div>
            </div>
          ) : (
            <div>
              <strong>📱 Check your SMS Inbox:</strong>
              <div style={{ color: 'var(--text-sub)', marginTop: '4px' }}>
                Carrier SMS dispatched. Enter the 6-digit code to continue.
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleVerify}>
          <OTPInput value={otp} onChange={setOtp} length={6} disabled={loading} />

          <Button
            type="submit"
            disabled={loading || otp.length < 4}
            style={{ width: '100%', marginTop: '20px', padding: '14px', fontSize: '15px' }}
          >
            {loading ? 'Verifying Code...' : 'Verify & Continue'}
          </Button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          {timer > 0 ? (
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Resend real OTP in <strong style={{ color: 'var(--text-main)' }}>{timer}s</strong>
            </span>
          ) : (
            <button
              onClick={handleResend}
              disabled={loading}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--accent-green)',
                fontWeight: '700',
                fontSize: '13.5px',
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              Resend Real OTP
            </button>
          )}
        </div>
      </div>

      <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '12.5px', marginTop: '20px' }}>
        Wrong {isEmail ? 'email address' : 'phone number'}?{' '}
        <span
          onClick={() => navigate('/login')}
          style={{ color: 'var(--accent-green)', cursor: 'pointer', fontWeight: '700', textDecoration: 'underline' }}
        >
          Change
        </span>
      </div>
    </div>
  );
};
