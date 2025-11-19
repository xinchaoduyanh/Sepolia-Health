export const ERROR_MESSAGES = {
  AUTH: {
    USER_NOT_FOUND: 'Không tìm thấy người dùng',
    REFRESH_TOKEN_INVALID: 'Refresh token không hợp lệ',
    USER_NOT_VERIFIED: 'Người dùng chưa được xác thực',
    INVALID_CREADENTIALS: 'Email hoặc mật khẩu không hợp lệ',
    EMAIL_ALREADY_EXISTS: 'Email đã được sử dụng',
    INVALID_OTP: 'Mã OTP không hợp lệ hoặc đã hết hạn',
    COMPLETE_REGISTER_SUCCESS: 'Đăng ký hoàn tất thành công',
  },
  USER: {
    USER_NOT_FOUND: 'Không tìm thấy người dùng',
  },
  COMMON: {
    USER_NOT_FOUND: 'Không tìm thấy người dùng',
    USER_ALREADY_EXISTS: 'Người dùng đã tồn tại',
    USER_NOT_VERIFIED: 'Người dùng chưa được xác thực',
    USER_NOT_AUTHORIZED: 'Không có quyền truy cập',
    USER_NOT_AUTHENTICATED: 'Không đăng nhập',
    RESOURCE_NOT_FOUND: 'Không tìm thấy tài nguyên',
  },
  DOCTOR: {
    DOCTOR_ALREADY_EXIST: 'Tài khoản bác sĩ đã tồn tại',
    DOCTOR_DOES_NOT_HAVE_SCHEDULE: 'Bác sĩ chưa có lịch làm việc',
  },
  PAYMENT: {
    APPOINTMENT_NOT_FOUND: 'Lịch hẹn không tồn tại',
    APPOINTMENT_ALREADY_PAID: 'Lịch hẹn đã được thanh toán',
    PAYMENT_CODE_GENERATION_FAILED: 'Không thể tạo mã thanh toán',
    PAYMENT_CODE_NOT_FOUND: 'Mã thanh toán không tồn tại',
    PAYMENT_CODE_ALREADY_USED: 'Mã thanh toán đã được sử dụng',
    PAYMENT_CODE_NOT_FOUND_IN_CONTENT:
      'Không tìm thấy mã thanh toán trong nội dung giao dịch',
    AMOUNT_MISMATCH: 'Số tiền không khớp',
    TRANSACTION_NOT_FOUND: 'Giao dịch không tồn tại',
  },
};
