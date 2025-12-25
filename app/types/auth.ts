import { Relationship } from '@/constants/enum';

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
  dateOfBirth: string; // ISO date string
  gender: 'MALE' | 'FEMALE' | 'OTHER'; // Should match Prisma Gender enum
  // relationship không cần gửi lên, BE sẽ mặc định là SELF
  role?: 'PATIENT' | 'DOCTOR' | 'ADMIN';
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface VerifyForgotPasswordOtpRequest {
  email: string;
  otp: string;
}

export interface ResetPasswordRequest {
  email: string;
  otp: string;
  newPassword: string;
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
  avatar?: string;
  role: 'PATIENT' | 'DOCTOR' | 'RECEPTIONIST' | 'ADMIN';
  status?: UserStatus;
  isVerified: boolean;
  verifiedAt?: string;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  patientProfiles?: PatientProfile[];
}

// Gender enum to match Prisma
export type Gender = 'MALE' | 'FEMALE' | 'OTHER';

// Role enum to match Prisma
export type Role = 'PATIENT' | 'DOCTOR' | 'RECEPTIONIST' | 'ADMIN';

// UserStatus enum to match Prisma
export type UserStatus = 'UNVERIFIED' | 'ACTIVE' | 'DEACTIVE';

// Patient Profile interface
export interface PatientProfile {
  id: number;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: Gender;
  phone: string;
  relationship: Relationship;
  avatar?: string;
  idCardNumber?: string;
  occupation?: string;
  nationality?: string;
  address?: string;
  healthDetailsJson?: any;
  additionalInfo?: any;
  managerId: number;
  createdAt: string;
  updatedAt: string;
}

// Doctor Profile interface
export interface DoctorProfile {
  id: number;
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  gender?: Gender;
  avatar?: string;
  specialty: string;
  experience?: string;
  contactInfo?: string;
  userId: number;
  clinicId?: number;
  createdAt: string;
  updatedAt: string;
}

// Receptionist Profile interface
export interface ReceptionistProfile {
  id: number;
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  gender?: Gender;
  avatar?: string;
  shift?: string;
  userId: number;
  createdAt: string;
  updatedAt: string;
}
