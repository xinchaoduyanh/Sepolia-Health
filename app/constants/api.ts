// API Configuration Constants
export const API_CONFIG = {
  // Development URLs
  BASE_URL: __DEV__
    ? 'http://10.0.2.2:8000/api' // Local development
    : 'https://your-production-api.com/api', // Production URL

  TIMEOUT: 10000, // 10 seconds
  RETRY_ATTEMPTS: 3,
} as const;

// API Endpoints
export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    LOGIN: '/patient/auth/login',
    REGISTER: '/patient/auth/register',
    VERIFY_EMAIL: '/patient/auth/verify-email',
    COMPLETE_REGISTER: '/patient/auth/complete-register',
    REFRESH: '/patient/auth/refresh-token',
    LOGOUT: '/patient/auth/logout',
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
