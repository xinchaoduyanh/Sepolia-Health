import { createZodDto } from 'nestjs-zod';
import z from 'zod';
import { Role } from '@prisma/client';

// Login DTO
const LoginSchema = z.object({
  email: z.email({ error: 'Email không hợp lệ' }),
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
});

// Register DTO
const RegisterSchema = z.object({
  email: z.email('Email không hợp lệ'),
});

// Verify Email DTO
const VerifyEmailSchema = z.object({
  email: z.email({ error: 'Email không hợp lệ' }),
  otp: z.string().length(6, 'Mã OTP phải có 6 ký tự'),
});

// Complete Register DTO
const CompleteRegisterSchema = z.object({
  email: z.email('Email không hợp lệ'),
  otp: z.string().length(6, 'Mã OTP phải có 6 ký tự'),
  firstName: z.string().min(2, 'Tên phải có ít nhất 2 ký tự'),
  lastName: z.string().min(2, 'Họ phải có ít nhất 2 ký tự'),
  phone: z.string().min(10, 'Số điện thoại không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
  role: z.nativeEnum(Role).default(Role.PATIENT),
});

// Refresh Token DTO
const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token không được để trống'),
});

// Response DTOs
const LoginResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
});

const RegisterResponseSchema = z.object({
  email: z.string(),
});

const VerifyEmailResponseSchema = z.object({
  success: z.boolean(),
});

const CompleteRegisterResponseSchema = z.object({
  user: z.object({
    id: z.number(),
    email: z.string(),
    firstName: z.string(),
    lastName: z.string(),
    role: z.string(),
  }),
});

// Logout DTO - nhận refresh token từ body
const LogoutSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token không được để trống'),
});

export class LoginDto extends createZodDto(LoginSchema) {}
export class LogoutDto extends createZodDto(LogoutSchema) {}
export class RegisterDto extends createZodDto(RegisterSchema) {}
export class VerifyEmailDto extends createZodDto(VerifyEmailSchema) {}
export class RefreshTokenDto extends createZodDto(RefreshTokenSchema) {}
export class LoginResponseDto extends createZodDto(LoginResponseSchema) {}
export class CompleteRegisterDto extends createZodDto(CompleteRegisterSchema) {}
export class RegisterResponseDto extends createZodDto(RegisterResponseSchema) {}
export class VerifyEmailResponseDto extends createZodDto(
  VerifyEmailResponseSchema,
) {}
export class CompleteRegisterResponseDto extends createZodDto(
  CompleteRegisterResponseSchema,
) {}
