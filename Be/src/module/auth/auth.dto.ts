import { createZodDto } from 'nestjs-zod';
import z from 'zod';

// Login DTO
const LoginSchema = z.object({
  email: z.string().email({ error: 'Email không hợp lệ' }),
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
});

// Register DTO
const RegisterSchema = z
  .object({
    email: z.string().email('Email không hợp lệ'),
    password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
    confirmPassword: z.string(),
    firstName: z.string().min(2, 'Tên phải có ít nhất 2 ký tự'),
    lastName: z.string().min(2, 'Họ phải có ít nhất 2 ký tự'),
    phone: z.string().min(10, 'Số điện thoại không hợp lệ').optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirmPassword'],
  });

// Verify Email DTO
const VerifyEmailSchema = z.object({
  email: z.email({ error: 'Email không hợp lệ' }),
  otp: z.string().length(6, 'Mã OTP phải có 6 ký tự'),
});

// Complete Register DTO
const CompleteRegisterSchema = z
  .object({
    email: z.string().email('Email không hợp lệ'),
    otp: z.string().length(6, 'Mã OTP phải có 6 ký tự'),
    firstName: z.string().min(2, 'Tên phải có ít nhất 2 ký tự'),
    lastName: z.string().min(2, 'Họ phải có ít nhất 2 ký tự'),
    phone: z.string().min(10, 'Số điện thoại không hợp lệ'),
    password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
    confirmPassword: z.string(),
    role: z.enum(['PATIENT', 'DOCTOR', 'RECEPTIONIST']).default('PATIENT'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirmPassword'],
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
const LogoutSchema = z.object({
  userId: z.number(),
});

export class LoginDto extends createZodDto(LoginSchema) {}
export class RegisterDto extends createZodDto(RegisterSchema) {}
export class VerifyEmailDto extends createZodDto(VerifyEmailSchema) {}
export class CompleteRegisterDto extends createZodDto(CompleteRegisterSchema) {}
export class RefreshTokenDto extends createZodDto(RefreshTokenSchema) {}
export class LoginResponseDto extends createZodDto(LoginResponseSchema) {}
export class RegisterResponseDto extends createZodDto(RegisterResponseSchema) {}
export class VerifyEmailResponseDto extends createZodDto(
  VerifyEmailResponseSchema,
) {}
export class CompleteRegisterResponseDto extends createZodDto(
  CompleteRegisterResponseSchema,
) {}
export class LogoutDto extends createZodDto(LogoutSchema) {}
