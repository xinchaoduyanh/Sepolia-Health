// Validation utilities - Match backend validation
export const validateEmail = (email: string): { isValid: boolean; message?: string } => {
  // Simple and reliable email regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!email || email.trim().length === 0) {
    return { isValid: false, message: 'Email không được để trống' };
  }

  if (!emailRegex.test(email)) {
    return { isValid: false, message: 'Email không hợp lệ' };
  }

  return { isValid: true };
};

// Password regex: tối thiểu 6 ký tự, có chữ IN HOA, có số, có ký tự đặc biệt
const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{6,}$/;

export const validatePassword = (password: string): { isValid: boolean; message?: string } => {
  if (!password || password.trim().length === 0) {
    return { isValid: false, message: 'Mật khẩu không được để trống' };
  }

  if (password.length < 6) {
    return { isValid: false, message: 'Mật khẩu phải có ít nhất 6 ký tự' };
  }

  if (!PASSWORD_REGEX.test(password)) {
    return {
      isValid: false,
      message: 'Mật khẩu phải có ít nhất 6 ký tự, bao gồm chữ IN HOA, số và ký tự đặc biệt',
    };
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
