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
    GET_AVAILABILITY_SUCCESS: 'Lấy lịch bận của bác sĩ thành công',
    DOCTOR_NOT_AVAILABLE: 'Bác sĩ không làm việc vào ngày này',
    INVALID_DATE: 'Ngày không hợp lệ',
    PAST_DATE: 'Không thể đặt lịch trong quá khứ',
    DOCTOR_SERVICE_NOT_FOUND: 'Dịch vụ bác sĩ không tồn tại',
    DOCTOR_NO_CLINIC: 'Bác sĩ chưa được gán cơ sở phòng khám',
    CLINIC_NOT_FOUND: 'Cơ sở phòng khám không tồn tại hoặc không hoạt động',
    APPOINTMENT_NOT_FOUND: 'Không tìm thấy lịch hẹn',
    UNAUTHORIZED_ACCESS: 'Bạn không có quyền truy cập lịch hẹn này',
    LOCATION_NOT_FOUND: 'Cơ sở phòng khám không tồn tại',
    SERVICE_NOT_FOUND: 'Dịch vụ không tồn tại',
    GET_LOCATIONS_SUCCESS: 'Lấy danh sách cơ sở thành công',
    GET_SERVICES_SUCCESS: 'Lấy danh sách dịch vụ thành công',
    GET_DOCTOR_SERVICES_SUCCESS: 'Lấy danh sách bác sĩ thành công',
    PATIENT_PROFILE_NOT_FOUND: 'Không tìm thấy hồ sơ bệnh nhân',
    PATIENT_PROFILE_NOT_OWNED: 'Hồ sơ bệnh nhân không thuộc về bạn',
    APPOINTMENT_OUTSIDE_WORKING_HOURS:
      'Thời gian đặt lịch không nằm trong giờ làm việc của bác sĩ',
    DOCTOR_NOT_AVAILABLE_ON_DATE: 'Bác sĩ không làm việc vào ngày này',
    TIME_SLOT_ALREADY_BOOKED: 'Thời gian đã được đặt lịch',
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

  // Payment messages
  PAYMENT: {
    QR_SCAN_SUCCESS: 'Tạo QR code thanh toán thành công',
    PAYMENT_PROCESSED_SUCCESS: 'Thanh toán đã được xử lý thành công',
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

export type MessageKey = keyof typeof MESSAGES;
export type AuthMessageKey = keyof typeof MESSAGES.AUTH;
export type UserMessageKey = keyof typeof MESSAGES.USER;
export type PaymentMessageKey = keyof typeof MESSAGES.PAYMENT;
export type CommonMessageKey = keyof typeof MESSAGES.COMMON;
