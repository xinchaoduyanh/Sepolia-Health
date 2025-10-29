import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';

// Query schemas
export const GetClinicsQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  search: z.string().optional(),
});

export type GetClinicsQueryDto = z.infer<typeof GetClinicsQuerySchema>;

// Zod schemas
export const CreateClinicSchema = z.object({
  name: z.string().min(1, 'Tên phòng khám không được để trống'),
  address: z.string().min(1, 'Địa chỉ không được để trống'),
  phone: z.string().optional(),
  email: z.string().email('Email không hợp lệ').optional().or(z.literal('')),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
});

export type CreateClinicDto = z.infer<typeof CreateClinicSchema>;

export const UpdateClinicSchema = z.object({
  name: z.string().min(1, 'Tên phòng khám không được để trống').optional(),
  address: z.string().min(1, 'Địa chỉ không được để trống').optional(),
  phone: z.string().optional(),
  email: z.string().email('Email không hợp lệ').optional().or(z.literal('')),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
});

export type UpdateClinicDto = z.infer<typeof UpdateClinicSchema>;

// DTO Classes for Swagger
export class CreateClinicDtoClass {
  @ApiProperty({
    description: 'Tên phòng khám',
    example: 'Phòng khám Đa khoa ABC',
  })
  name: string;

  @ApiProperty({
    description: 'Địa chỉ phòng khám',
    example: '123 Đường ABC, Quận 1, TP.HCM',
  })
  address: string;

  @ApiProperty({
    description: 'Số điện thoại',
    example: '0123456789',
    required: false,
  })
  phone?: string;

  @ApiProperty({
    description: 'Email liên hệ',
    example: 'contact@clinicabc.com',
    required: false,
  })
  email?: string;

  @ApiProperty({
    description: 'Mô tả về phòng khám',
    example: 'Phòng khám đa khoa với đội ngũ bác sĩ chuyên nghiệp',
    required: false,
  })
  description?: string;

  @ApiProperty({
    description: 'Trạng thái hoạt động',
    example: true,
    default: true,
    required: false,
  })
  isActive?: boolean;
}

export class UpdateClinicDtoClass {
  @ApiProperty({
    description: 'Tên phòng khám',
    example: 'Phòng khám Đa khoa ABC',
    required: false,
  })
  name?: string;

  @ApiProperty({
    description: 'Địa chỉ phòng khám',
    example: '123 Đường ABC, Quận 1, TP.HCM',
    required: false,
  })
  address?: string;

  @ApiProperty({
    description: 'Số điện thoại',
    example: '0123456789',
    required: false,
  })
  phone?: string;

  @ApiProperty({
    description: 'Email liên hệ',
    example: 'contact@clinicabc.com',
    required: false,
  })
  email?: string;

  @ApiProperty({
    description: 'Mô tả về phòng khám',
    example: 'Phòng khám đa khoa với đội ngũ bác sĩ chuyên nghiệp',
    required: false,
  })
  description?: string;

  @ApiProperty({
    description: 'Trạng thái hoạt động',
    example: true,
    required: false,
  })
  isActive?: boolean;
}

// Response DTOs
export class ClinicResponseDto {
  @ApiProperty({
    description: 'ID phòng khám',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Tên phòng khám',
    example: 'Phòng khám Đa khoa ABC',
  })
  name: string;

  @ApiProperty({
    description: 'Địa chỉ phòng khám',
    example: '123 Đường ABC, Quận 1, TP.HCM',
  })
  address: string;

  @ApiProperty({
    description: 'Số điện thoại',
    example: '0123456789',
    nullable: true,
  })
  phone?: string;

  @ApiProperty({
    description: 'Email liên hệ',
    example: 'contact@clinicabc.com',
    nullable: true,
  })
  email?: string;

  @ApiProperty({
    description: 'Mô tả về phòng khám',
    example: 'Phòng khám đa khoa với đội ngũ bác sĩ chuyên nghiệp',
    nullable: true,
  })
  description?: string;

  @ApiProperty({
    description: 'Trạng thái hoạt động',
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: 'Ngày tạo',
    example: '2023-10-28T10:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Ngày cập nhật',
    example: '2023-10-28T10:00:00.000Z',
  })
  updatedAt: Date;
}

export class ClinicsListResponseDto {
  @ApiProperty({
    description: 'Danh sách phòng khám',
    type: [ClinicResponseDto],
  })
  clinics: ClinicResponseDto[];

  @ApiProperty({
    description: 'Tổng số phòng khám',
    example: 15,
  })
  total: number;

  @ApiProperty({
    description: 'Trang hiện tại',
    example: 1,
  })
  page: number;

  @ApiProperty({
    description: 'Số bản ghi mỗi trang',
    example: 10,
  })
  limit: number;
}

export class ClinicDetailResponseDto extends ClinicResponseDto {}

export class CreateClinicResponseDto extends ClinicResponseDto {}

export class UpdateClinicResponseDto extends ClinicResponseDto {}

// Query DTO class for Swagger
export class GetClinicsQueryDtoClass {
  @ApiProperty({
    description: 'Trang hiện tại',
    example: 1,
    required: false,
    minimum: 1,
  })
  page?: number;

  @ApiProperty({
    description: 'Số bản ghi mỗi trang',
    example: 10,
    required: false,
    minimum: 1,
    maximum: 100,
  })
  limit?: number;

  @ApiProperty({
    description: 'Từ khóa tìm kiếm theo tên hoặc địa chỉ',
    example: 'Đa khoa ABC',
    required: false,
  })
  search?: string;
}
