/**
 * Application messages constants
 */
export const MESSAGES = {
  // Auth messages
  AUTH: {
    LOGIN_SUCCESS: 'Đăng nhập thành công',
    REGISTER_SUCCESS: 'Đăng ký thành công, vui lòng kiểm tra email để xác thực',
    VERIFY_EMAIL_SUCCESS: 'Xác thực email thành công',
    LOGOUT_SUCCESS: 'Đăng xuất thành công',
    REFRESH_TOKEN_SUCCESS: 'Làm mới token thành công',
    FORGOT_PASSWORD_SUCCESS: 'Gửi email khôi phục mật khẩu thành công',
    RESET_PASSWORD_SUCCESS: 'Đặt lại mật khẩu thành công',
  },

  // User messages
  USER: {
    GET_PROFILE_SUCCESS: 'Lấy thông tin cá nhân thành công',
    UPDATE_PROFILE_SUCCESS: 'Cập nhật thông tin cá nhân thành công',
    CHANGE_PASSWORD_SUCCESS: 'Đổi mật khẩu thành công',
  },

  // Doctor messages
  DOCTOR: {
    GET_SCHEDULE_SUCCESS: 'Lấy lịch làm việc thành công',
    UPDATE_SCHEDULE_SUCCESS: 'Cập nhật lịch làm việc thành công',
    GET_APPOINTMENTS_SUCCESS: 'Lấy danh sách lịch hẹn thành công',
  },

  // Patient messages
  PATIENT: {
    BOOK_APPOINTMENT_SUCCESS: 'Đặt lịch hẹn thành công',
    CANCEL_APPOINTMENT_SUCCESS: 'Hủy lịch hẹn thành công',
    GET_APPOINTMENTS_SUCCESS: 'Lấy danh sách lịch hẹn thành công',
  },

  // Appointment messages
  APPOINTMENT: {
    CREATE_SUCCESS: 'Tạo lịch hẹn thành công',
    UPDATE_SUCCESS: 'Cập nhật lịch hẹn thành công',
    DELETE_SUCCESS: 'Xóa lịch hẹn thành công',
    GET_SUCCESS: 'Lấy thông tin lịch hẹn thành công',
    LIST_SUCCESS: 'Lấy danh sách lịch hẹn thành công',
  },

  // Medicine messages
  MEDICINE: {
    CREATE_SUCCESS: 'Thêm thuốc thành công',
    UPDATE_SUCCESS: 'Cập nhật thông tin thuốc thành công',
    DELETE_SUCCESS: 'Xóa thuốc thành công',
    GET_SUCCESS: 'Lấy thông tin thuốc thành công',
  },

  // Prescription messages
  PRESCRIPTION: {
    CREATE_SUCCESS: 'Tạo đơn thuốc thành công',
    UPDATE_SUCCESS: 'Cập nhật đơn thuốc thành công',
    DELETE_SUCCESS: 'Xóa đơn thuốc thành công',
    GET_SUCCESS: 'Lấy thông tin đơn thuốc thành công',
  },

  // Common messages
  COMMON: {
    CREATE_SUCCESS: 'Tạo mới thành công',
    UPDATE_SUCCESS: 'Cập nhật thành công',
    DELETE_SUCCESS: 'Xóa thành công',
    GET_SUCCESS: 'Lấy thông tin thành công',
    LIST_SUCCESS: 'Lấy danh sách thành công',
  },
} as const;
export const ERROR_MESSAGES = {
  AUTH: {
    USER_NOT_FOUND: 'Không tìm thấy người dùng',
    REFRESH_TOKEN_INVALID: 'Refresh token không hợp lệ',
    USER_NOT_VERIFIED: 'Người dùng chưa được xác thực',
    INVALID_PASSWORD: 'Email hoặc mật khẩu không hợp lệ',
    EMAIL_ALREADY_EXISTS: 'Email đã được sử dụng',
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
  },
};
export type MessageKey = keyof typeof MESSAGES;
export type AuthMessageKey = keyof typeof MESSAGES.AUTH;
export type UserMessageKey = keyof typeof MESSAGES.USER;
export type CommonMessageKey = keyof typeof MESSAGES.COMMON;
