import { createZodDto } from '@/common/helper';
import { z } from 'zod';

// Login DTO
const LoginSchema = z.object({
  email: z.email({ error: 'Email không hợp lệ' }),
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
});

// Register DTO
export const RegisterDto = z
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
export const VerifyEmailDto = z.object({
  email: z.email({ error: 'Email không hợp lệ' }),
  otp: z.string().length(6, 'Mã OTP phải có 6 ký tự'),
});

// Complete Register DTO
export const CompleteRegisterDto = z
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
export const RefreshTokenDto = z.object({
  refreshToken: z.string().min(1, 'Refresh token không được để trống'),
});

// Response DTOs
export const LoginResponseDto = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
});

export const RegisterResponseDto = z.object({
  email: z.string(),
});

export const VerifyEmailResponseDto = z.object({
  success: z.boolean(),
});

export const CompleteRegisterResponseDto = z.object({
  user: z.object({
    id: z.number(),
    email: z.string(),
    firstName: z.string(),
    lastName: z.string(),
    role: z.string(),
  }),
});
export const LogoutDto = z.object({
  userId: z.number(),
});
// Export types
export type LoginDtoType = z.infer<typeof LoginDto>;
export type RegisterDtoType = z.infer<typeof RegisterDto>;
export type VerifyEmailDtoType = z.infer<typeof VerifyEmailDto>;
export type CompleteRegisterDtoType = z.infer<typeof CompleteRegisterDto>;
export type RefreshTokenDtoType = z.infer<typeof RefreshTokenDto>;
export type LoginResponseDtoType = z.infer<typeof LoginResponseDto>;
export type RegisterResponseDtoType = z.infer<typeof RegisterResponseDto>;
export type VerifyEmailResponseDtoType = z.infer<typeof VerifyEmailResponseDto>;
export type CompleteRegisterResponseDtoType = z.infer<
  typeof CompleteRegisterResponseDto
>;
export type LogoutDtoType = z.infer<typeof LogoutDto>;

export class LoginDto extends createZodDto(LoginSchema) {}
