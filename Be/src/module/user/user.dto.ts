import { z } from 'zod';

// Update User Profile DTO
export const UpdateUserProfileDto = z.object({
  firstName: z.string().min(1, 'Tên không được để trống').optional(),
  lastName: z.string().min(1, 'Họ không được để trống').optional(),
  phone: z
    .string()
    .regex(/^[0-9]{10,11}$/, 'Số điện thoại không hợp lệ')
    .optional(),
  address: z.string().optional(),
  dateOfBirth: z.string().datetime().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  avatar: z.string().url('URL avatar không hợp lệ').optional(),
});

// Change Password DTO
export const ChangePasswordDto = z
  .object({
    currentPassword: z.string().min(1, 'Mật khẩu hiện tại không được để trống'),
    newPassword: z.string().min(6, 'Mật khẩu mới phải có ít nhất 6 ký tự'),
    confirmPassword: z.string().min(1, 'Xác nhận mật khẩu không được để trống'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirmPassword'],
  });

// Upload Avatar DTO
export const UploadAvatarDto = z.object({
  avatar: z.any(), // File will be handled by multer
});

// Response DTOs
export const UserProfileResponseDto = z.object({
  id: z.number(),
  email: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  phone: z.string().nullable(),
  address: z.string().nullable(),
  dateOfBirth: z.string().nullable(),
  gender: z.string().nullable(),
  avatar: z.string().nullable(),
  role: z.string(),
  isVerified: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const UpdateUserProfileResponseDto = z.object({
  user: UserProfileResponseDto,
});

export const ChangePasswordResponseDto = z.object({
  message: z.string(),
});

export const UploadAvatarResponseDto = z.object({
  avatarUrl: z.string(),
});

// Export types
export type UpdateUserProfileDtoType = z.infer<typeof UpdateUserProfileDto>;
export type ChangePasswordDtoType = z.infer<typeof ChangePasswordDto>;
export type UploadAvatarDtoType = z.infer<typeof UploadAvatarDto>;
export type UserProfileResponseDtoType = z.infer<typeof UserProfileResponseDto>;
export type UpdateUserProfileResponseDtoType = z.infer<
  typeof UpdateUserProfileResponseDto
>;
export type ChangePasswordResponseDtoType = z.infer<
  typeof ChangePasswordResponseDto
>;
export type UploadAvatarResponseDtoType = z.infer<
  typeof UploadAvatarResponseDto
>;
