// Validation helpers for phone numbers and OTP codes

export function validatePhoneNumber(input) {
  if (!input) return { isValid: false, error: 'Phone number or email is required' };
  const clean = input.trim();
  if (clean.includes('@')) {
    // Basic email check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(clean)) {
      return { isValid: false, error: 'Please enter a valid email address' };
    }
    return { isValid: true, error: null };
  }

  const phoneClean = clean.replace(/[\s\-\(\)]/g, '');
  if (phoneClean.length < 10) {
    return { isValid: false, error: 'Please enter a valid mobile number or email' };
  }
  return { isValid: true, error: null };
}

export function validateOTP(otp) {
  if (!otp) return { isValid: false, error: 'OTP is required' };
  if (!/^\d{4,6}$/.test(otp.trim())) {
    return { isValid: false, error: 'OTP must be 4 to 6 digits' };
  }
  return { isValid: true, error: null };
}
