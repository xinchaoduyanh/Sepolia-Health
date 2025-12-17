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

export const validatePhone = (phone: string): { isValid: boolean; message?: string } => {
  // Clean phone number: remove spaces, dashes, dots, parentheses
  const cleanedPhone = phone.replace(/[\s\-\.\(\)]/g, '');

  // Support formats:
  // - 0912345678 (10-11 digits with 0 prefix)
  // - +84912345678 (12 digits with +84 prefix)
  // - 84912345678 (11 digits with 84 prefix)
  const phoneRegex = /^((0|\+84)[0-9]{9,10}|84[0-9]{9,10})$/;

  if (!phone || phone.trim().length === 0) {
    return { isValid: false, message: 'Số điện thoại không được để trống' };
  }

  if (!phoneRegex.test(cleanedPhone)) {
    return { isValid: false, message: 'Số điện thoại không hợp lệ (ví dụ: 0912345678)' };
  }

  return { isValid: true };
};

export const validateName = (name: string): { isValid: boolean; message?: string } => {
  // Cho phép chữ cái (Việt Nam và quốc tế) và khoảng trắng, không cho phép số
  const nameRegex = /^[A-Za-zÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂÂÊÔƠưăâêôơ\s]+$/;

  if (!name || name.trim().length === 0) {
    return { isValid: false, message: 'Tên không được để trống' };
  }

  if (!nameRegex.test(name)) {
    return { isValid: false, message: 'Tên chỉ được chứa chữ cái và khoảng trắng' };
  }

  if (name.trim().length < 2) {
    return { isValid: false, message: 'Tên phải có ít nhất 2 ký tự' };
  }

  if (name.trim().length > 50) {
    return { isValid: false, message: 'Tên không được quá 50 ký tự' };
  }

  return { isValid: true };
};

export const validateAddress = (address: string): { isValid: boolean; message?: string } => {
  if (!address || address.trim().length === 0) {
    return { isValid: false, message: 'Địa chỉ không được để trống' };
  }

  if (address.trim().length < 5) {
    return { isValid: false, message: 'Địa chỉ phải có ít nhất 5 ký tự' };
  }

  if (address.trim().length > 200) {
    return { isValid: false, message: 'Địa chỉ không được quá 200 ký tự' };
  }

  return { isValid: true };
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
