// API Configuration Constants
export const API_CONFIG = {
  // Development URLs
  BASE_URL: __DEV__
    ? 'http://172.20.10.4:3000/api' // Local development
    : 'https://your-production-api.com/api', // Production URL

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
    PROFILE: '/user/profile', // User profile endpoint
  },

  // Users
  USERS: {
    BASE: '/user',
    PROFILE: '/user/profile',
    UPDATE_PROFILE: '/user/profile',
  },

  // Appointments
  APPOINTMENTS: {
    BASE: '/appointments',
    MY_APPOINTMENTS: '/appointments/patient/my-appointments',
    DOCTOR_APPOINTMENTS: '/appointments/doctor/my-appointments',
  },

  // Doctors
  DOCTORS: {
    BASE: '/doctor',
    SERVICES: '/doctor/services',
    BY_SERVICE: '/doctor',
    TIMESLOTS: '/doctor/timeslot',
  },

  // Health Records
  HEALTH_RECORDS: {
    BASE: '/health-records',
    UPLOAD: '/health-records/upload',
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
