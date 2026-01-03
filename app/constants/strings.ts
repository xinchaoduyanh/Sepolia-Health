// Home Screen Strings
export const STRINGS = {
  // Header & Greeting
  GREETING: 'Xin chào',
  NOT_UPDATED: 'Chưa cập nhật',

  // Sections
  UPCOMING_SCHEDULE: 'Lịch trình sắp tới',
  SERVICES: 'Dịch vụ',
  HEALTH_TIPS: 'Mẹo sức khỏe',
  NEWS_EVENTS: 'Tin tức & Sự kiện',

  // Common Actions
  SEE_ALL: 'Xem tất cả',
  BOOK_NOW: 'Đặt lịch ngay',
  OK: 'OK',

  // Service Labels
  SCHEDULE: 'Đặt lịch',
  ONLINE_CONSULTATION: 'Khám Online',
  HISTORY: 'Lịch sử',
  MESSAGES: 'Tin nhắn',
  COMMUNITY: 'Cộng đồng',

  // Appointment Related
  NO_UPCOMING_APPOINTMENTS: 'Chưa có lịch khám sắp tới',
  SCHEDULE_APPOINTMENT_MESSAGE: 'Hãy đặt lịch khám để chăm sóc sức khỏe của bạn',
  DOCTOR: 'Bác sĩ',
  ONLINE_APPOINTMENT_TYPE: 'Khám trực tuyến (Online)',

  // Health Tips Content
  DRINK_WATER: 'Uống đủ nước',
  DRINK_WATER_DESC: 'Uống ít nhất 2 lít nước mỗi ngày để duy trì sức khỏe tốt',
  MORNING_SUNBATHING: 'Tắm nắng sáng',
  SUNBATHING_DESC: '15-20 phút tắm nắng buổi sáng giúp cơ thể tổng hợp vitamin D',
  GET_SLEEP: 'Ngủ đủ giấc',
  SLEEP_DESC: '7-8 tiếng ngủ mỗi đêm giúp cơ thể phục hồi và tái tạo năng lượng',

  // News Section
  NO_NEWS: 'Chưa có tin tức nào',

  // Promotion
  GET_VOUCHER: 'Nhận ngay voucher',
  GET_NOW: 'Nhận ngay',

  // Footer
  FOOTER_TITLE: 'Trải nghiệm dịch vụ y tế tốt nhất',
  FOOTER_SUBTITLE: 'Chăm sóc sức khỏe toàn diện với công nghệ hiện đại',
  COPYRIGHT: '© 2025 DUYANH. All rights reserved.',

  // Alert Messages
  SUCCESS: 'Thành công',
  NOTIFICATION: 'Thông báo',
  ERROR: 'Lỗi',
  ERROR_OCCURRED: 'Có lỗi xảy ra',

  // Badges
  MORE_THAN_99: '99+',

  // Time Formatting
  JUST_NOW: 'Vừa xong',
  HOURS_AGO: 'giờ trước',
  YESTERDAY: 'Hôm qua',
  DAYS_AGO: 'ngày trước',
} as const;

export type StringKey = keyof typeof STRINGS;
