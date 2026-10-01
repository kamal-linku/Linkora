// Authentication API endpoints
import { api } from './api';

export const authApi = {
  sendOtp: (phoneNumber) => api.post('/auth/send-otp', { phone_number: phoneNumber }),
  verifyOtp: (phoneNumber, otpCode) =>
    api.post('/auth/verify-otp', { phone_number: phoneNumber, otp_code: otpCode }),
  getMe: () => api.get('/auth/me'),
};
