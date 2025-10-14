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
  role: 'PATIENT' | 'DOCTOR' | 'RECEPTIONIST' | 'ADMIN';
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

// Relationship enum to match Prisma
export type Relationship =
  | 'SELF'
  | 'SPOUSE'
  | 'CHILD'
  | 'PARENT'
  | 'SIBLING'
  | 'RELATIVE'
  | 'FRIEND'
  | 'OTHER';

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
  managerId: number;
  isPrimary: boolean;
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
