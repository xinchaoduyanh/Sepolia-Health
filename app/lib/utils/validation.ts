// Validation utilities
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): { isValid: boolean; message?: string } => {
  if (password.length < 6) {
    return { isValid: false, message: 'Mật khẩu phải có ít nhất 6 ký tự' };
  }
  return { isValid: true };
};

export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^[0-9]{10,11}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

export const validateOTP = (otp: string): boolean => {
  return /^[0-9]{6}$/.test(otp);
};

export const validateRequired = (
  value: string,
  fieldName: string
): { isValid: boolean; message?: string } => {
  if (!value || value.trim().length === 0) {
    return { isValid: false, message: `${fieldName} không được để trống` };
  }
  return { isValid: true };
};
