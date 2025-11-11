import { createZodDto } from 'nestjs-zod';
import z from 'zod';
import { Role, Gender } from '@prisma/client';

const resetPasswordSchema = z.object({
  email: z.email(),
  otp: z.string(),
  newPassword: z.string(),
});

// Login DTO
const LoginSchema = z.object({
  email: z.email({ error: 'Email không hợp lệ' }),
  password: z.string().nonempty('Mật khẩu không được để trống'),
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
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
  role: z.enum(Role).default(Role.PATIENT),
  // Patient profile fields - basic info needed for registration
  firstName: z.string().min(2, 'Tên phải có ít nhất 2 ký tự'),
  lastName: z.string().min(2, 'Họ phải có ít nhất 2 ký tự'),
  phone: z.string().min(10, 'Số điện thoại không hợp lệ'),
  dateOfBirth: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), 'Ngày sinh không hợp lệ'),
  gender: z.enum(Gender, 'Giới tính không hợp lệ'),
});

// Refresh Token DTO
const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token không được để trống'),
});

export class LoginDto extends createZodDto(LoginSchema) {}
export class RegisterDto extends createZodDto(RegisterSchema) {}
export class ForgotPasswordDto extends RegisterDto {}
export class VerifyEmailDto extends createZodDto(VerifyEmailSchema) {}
export class RefreshTokenDto extends createZodDto(RefreshTokenSchema) {}
export class ResetPasswordBodyDto extends createZodDto(resetPasswordSchema) {}
export class CompleteRegisterDto extends createZodDto(CompleteRegisterSchema) {}
