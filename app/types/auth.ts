// Auth Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
}

export interface VerifyEmailRequest {
  email: string;
  otp: string;
}

export interface CompleteRegisterRequest {
  email: string;
  otp: string;
  firstName: string;
  lastName: string;
  phone: string;
  password: string;
  role?: 'PATIENT' | 'DOCTOR' | 'ADMIN';
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
}

export interface RegisterResponse {
  email: string;
}

export interface VerifyEmailResponse {
  success: boolean;
}

export interface CompleteRegisterResponse {
  user: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
}

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}
