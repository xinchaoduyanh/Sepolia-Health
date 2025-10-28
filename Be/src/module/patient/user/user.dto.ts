import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { Gender, Relationship, Role, UserStatus } from '@prisma/client';

// Update User Profile DTO Schema
export const UpdateUserProfileSchema = z.object({
  firstName: z.string().min(1, 'Tên không được để trống').optional(),
  lastName: z.string().min(1, 'Họ không được để trống').optional(),
  phone: z
    .string()
    .regex(/^[0-9]{10,11}$/, 'Số điện thoại không hợp lệ')
    .optional(),
  address: z.string().optional(),
  dateOfBirth: z.string().datetime().optional(),
  gender: z.nativeEnum(Gender).optional(),
  avatar: z.string().url('URL avatar không hợp lệ').optional(),
});

// Export class for Swagger
export class UpdateUserProfileDto extends createZodDto(
  UpdateUserProfileSchema,
) {}

// Change Password DTO Schema
export const ChangePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Mật khẩu hiện tại không được để trống'),
    newPassword: z.string().min(6, 'Mật khẩu mới phải có ít nhất 6 ký tự'),
    confirmPassword: z.string().min(1, 'Xác nhận mật khẩu không được để trống'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirmPassword'],
  });

// Export class for Swagger
export class ChangePasswordDto extends createZodDto(ChangePasswordSchema) {}

// Upload Avatar DTO
export const UploadAvatarDto = z.object({
  avatar: z.any(), // File will be handled by multer
});

// Response DTOs
export const UserProfileResponseSchema = z.object({
  id: z.number(),
  email: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  phone: z.string().nullable(),
  address: z.string().nullable(),
  dateOfBirth: z.string().nullable(),
  gender: z.string().nullable(),
  avatar: z.string().nullable(),
  role: z.nativeEnum(Role),
  status: z.nativeEnum(UserStatus),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const UpdateUserProfileResponseSchema = z.object({
  user: UserProfileResponseSchema,
});

export const ChangePasswordResponseSchema = z.object({});

export const UploadAvatarResponseSchema = z.object({
  avatarUrl: z.string(),
});

// Patient Profile Response Schema
export const PatientProfileResponseSchema = z.object({
  id: z.number(),
  firstName: z.string(),
  lastName: z.string(),
  dateOfBirth: z.string(),
  gender: z.string(),
  phone: z.string(),
  relationship: z.string(),
  avatar: z.string().nullable(),
  idCardNumber: z.string().nullable(),
  occupation: z.string().nullable(),
  nationality: z.string().nullable(),
  address: z.string().nullable(),
  healthDetailsJson: z.any().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// User Profile Response Schema with Patient Profiles
export const UserProfileWithPatientProfilesResponseSchema = z.object({
  id: z.number(),
  email: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  phone: z.string().nullable(),
  address: z.string().nullable(),
  dateOfBirth: z.string().nullable(),
  gender: z.string().nullable(),
  avatar: z.string().nullable(),
  role: z.enum(Role),
  status: z.enum(UserStatus),
  createdAt: z.string(),
  updatedAt: z.string(),
  patientProfiles: z.array(PatientProfileResponseSchema),
});

export const PatientProfilesResponseSchema = z.object({
  profiles: z.array(PatientProfileResponseSchema),
});

// Create Patient Profile Schema
export const CreatePatientProfileSchema = z.object({
  firstName: z.string().min(1, 'Tên không được để trống'),
  lastName: z.string().min(1, 'Họ không được để trống'),
  dateOfBirth: z.string().datetime('Ngày sinh không hợp lệ'),
  gender: z.enum(Gender, {
    message: 'Giới tính không hợp lệ',
  }),
  phone: z.string().regex(/^[0-9]{10,11}$/, 'Số điện thoại không hợp lệ'),
  relationship: z.nativeEnum(Relationship, {
    message: 'Mối quan hệ không hợp lệ',
  }),
  avatar: z.string().url('URL avatar không hợp lệ').optional(),
  idCardNumber: z.string().optional(),
  occupation: z.string().optional(),
  nationality: z.string().optional(),
  address: z.string().optional(),
  healthDetailsJson: z.any().optional(),
});

// Update Patient Profile Schema
export const UpdatePatientProfileSchema = z.object({
  firstName: z.string().min(1, 'Tên không được để trống').optional(),
  lastName: z.string().min(1, 'Họ không được để trống').optional(),
  dateOfBirth: z.string().datetime('Ngày sinh không hợp lệ').optional(),
  gender: z.nativeEnum(Gender).optional(),
  phone: z
    .string()
    .regex(/^[0-9]{10,11}$/, 'Số điện thoại không hợp lệ')
    .optional(),
  relationship: z.nativeEnum(Relationship).optional(),
  avatar: z.string().url('URL avatar không hợp lệ').optional(),
  idCardNumber: z.string().optional(),
  occupation: z.string().optional(),
  nationality: z.string().optional(),
  address: z.string().optional(),
  healthDetailsJson: z.any().optional(),
});

// Create Patient Profile Response Schema
export const CreatePatientProfileResponseSchema = z.object({
  profile: PatientProfileResponseSchema,
});

// Update Patient Profile Response Schema
export const UpdatePatientProfileResponseSchema = z.object({
  profile: PatientProfileResponseSchema,
});

// Delete Patient Profile Response Schema
export const DeletePatientProfileResponseSchema = z.object({});

// Export classes for Swagger
export class UpdateUserProfileResponseDto extends createZodDto(
  UpdateUserProfileResponseSchema,
) {}
export class ChangePasswordResponseDto extends createZodDto(
  ChangePasswordResponseSchema,
) {}
export class UploadAvatarResponseDto extends createZodDto(
  UploadAvatarResponseSchema,
) {}
export class PatientProfileResponseDto extends createZodDto(
  PatientProfileResponseSchema,
) {}
export class PatientProfilesResponseDto extends createZodDto(
  PatientProfilesResponseSchema,
) {}
export class CreatePatientProfileDto extends createZodDto(
  CreatePatientProfileSchema,
) {}
export class UpdatePatientProfileDto extends createZodDto(
  UpdatePatientProfileSchema,
) {}
export class CreatePatientProfileResponseDto extends createZodDto(
  CreatePatientProfileResponseSchema,
) {}
export class UpdatePatientProfileResponseDto extends createZodDto(
  UpdatePatientProfileResponseSchema,
) {}
export class DeletePatientProfileResponseDto extends createZodDto(
  DeletePatientProfileResponseSchema,
) {}

// Export types
export type UpdateUserProfileDtoType = z.infer<typeof UpdateUserProfileSchema>;
export type ChangePasswordDtoType = z.infer<typeof ChangePasswordSchema>;
export type UploadAvatarDtoType = z.infer<typeof UploadAvatarDto>;
export type UserProfileResponseDtoType = z.infer<
  typeof UserProfileResponseSchema
>;
export type UserProfileWithPatientProfilesResponseDtoType = z.infer<
  typeof UserProfileWithPatientProfilesResponseSchema
>;
export type UpdateUserProfileResponseDtoType = z.infer<
  typeof UpdateUserProfileResponseSchema
>;
export type ChangePasswordResponseDtoType = z.infer<
  typeof ChangePasswordResponseSchema
>;
export type UploadAvatarResponseDtoType = z.infer<
  typeof UploadAvatarResponseSchema
>;
export type PatientProfileResponseDtoType = z.infer<
  typeof PatientProfileResponseSchema
>;
export type PatientProfilesResponseDtoType = z.infer<
  typeof PatientProfilesResponseSchema
>;
export type CreatePatientProfileDtoType = z.infer<
  typeof CreatePatientProfileSchema
>;
export type UpdatePatientProfileDtoType = z.infer<
  typeof UpdatePatientProfileSchema
>;
export type CreatePatientProfileResponseDtoType = z.infer<
  typeof CreatePatientProfileResponseSchema
>;
export type UpdatePatientProfileResponseDtoType = z.infer<
  typeof UpdatePatientProfileResponseSchema
>;
export type DeletePatientProfileResponseDtoType = z.infer<
  typeof DeletePatientProfileResponseSchema
>;

export class UserProfileResponseDto extends createZodDto(
  UserProfileResponseSchema,
) {}
export class UserProfileWithPatientProfilesResponseDto extends createZodDto(
  UserProfileWithPatientProfilesResponseSchema,
) {}
