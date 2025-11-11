// API Configuration Constants
export const API_CONFIG = {
  BASE_URL: process.env.EXPO_PUBLIC_API_URL || 'http://10.2.50.196:8000/api',

  TIMEOUT: 10000, // 10 seconds
  RETRY_ATTEMPTS: 3,
} as const;

// API Endpoints
export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    VERIFY_EMAIL: '/auth/verify-email',
    COMPLETE_REGISTER: '/auth/complete-register',
    REFRESH: '/auth/refresh-token',
    LOGOUT: '/auth/logout',
    FORGOT_PASSWORD: '/auth/forgot-password',
    PROFILE: '/patient/user/profile', // User profile endpoint
  },

  // Users
  USERS: {
    BASE: '/patient/user',
    PROFILE: '/patient/user/profile',
    UPDATE_PROFILE: '/patient/user/profile',
    PATIENT_PROFILES: '/patient/user/patient-profiles',
    UPLOAD_AVATAR: '/patient/user/upload-avatar',
  },

  // Appointments
  APPOINTMENTS: {
    BASE: '/patient/appointments',
    MY_APPOINTMENTS: '/patient/appointments/my-appointments',
    DOCTOR_APPOINTMENTS: '/patient/appointments/doctor/my-appointments',
    LOCATIONS: '/patient/appointments/booking/locations',
    SERVICES: '/patient/appointments/booking/services',
    DOCTOR_SERVICES: '/patient/appointments/booking/doctor-services',
    AVAILABLE_DATES: '/patient/appointments/booking/available-dates',
    DOCTOR_AVAILABILITY: '/patient/appointments/booking/doctor-availability',
  },

  // Doctors
  DOCTORS: {
    BASE: '/patient/doctor',
    SERVICES: '/patient/doctor/services',
    BY_SERVICE: '/patient/doctor',
    TIMESLOTS: '/patient/doctor/timeslot',
  },

  // Health Records
  HEALTH_RECORDS: {
    BASE: '/patient/health-records',
    UPLOAD: '/patient/health-records/upload',
  },

  // Payment
  PAYMENT: {
    CREATE_QR_SCAN: '/payment/create-qr-scan',
    CHECK_STATUS: '/payment/check-payment-status',
    CANCEL: '/payment/cancel-payment-code',
    WEBHOOK: '/payment/sepay-webhook',
  },
} as const;

// Request/Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  errors?: string[];
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Error Types
export interface ApiError {
  message: string;
  status?: number;
  code?: string;
}
