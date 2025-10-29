import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';
import { UserStatus } from '@prisma/client';

// Query schemas
export const GetReceptionistsQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  search: z.string().optional(),
});

export type GetReceptionistsQueryDto = z.infer<
  typeof GetReceptionistsQuerySchema
>;

// Zod schemas
export const CreateReceptionistSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
  fullName: z.string().min(1, 'Họ tên không được để trống'),
  phone: z.string().min(1, 'Số điện thoại không được để trống'),
  address: z.string().optional(),
});

export type CreateReceptionistDto = z.infer<typeof CreateReceptionistSchema>;

export class CreateReceptionistDtoClass {
  @ApiProperty({
    description: 'Email receptionist',
    example: 'receptionist@sepolia.com',
  })
  email: string;

  @ApiProperty({
    description: 'Mật khẩu',
    example: 'receptionist123',
    minLength: 6,
  })
  password: string;

  @ApiProperty({
    description: 'Họ tên receptionist',
    example: 'Nguyễn Thị B',
  })
  fullName: string;

  @ApiProperty({
    description: 'Số điện thoại',
    example: '0987654321',
  })
  phone: string;

  @ApiProperty({
    description: 'Địa chỉ',
    example: '456 Đường XYZ, Quận 2, TP.HCM',
    required: false,
  })
  address?: string;
}

export const UpdateReceptionistSchema = z.object({
  fullName: z.string().min(1, 'Họ tên không được để trống').optional(),
  phone: z.string().min(1, 'Số điện thoại không được để trống').optional(),
  address: z.string().optional(),
});

export type UpdateReceptionistDto = z.infer<typeof UpdateReceptionistSchema>;

export class UpdateReceptionistDtoClass {
  @ApiProperty({
    description: 'Họ tên receptionist',
    example: 'Nguyễn Thị B',
    required: false,
  })
  fullName?: string;

  @ApiProperty({
    description: 'Số điện thoại',
    example: '0987654321',
    required: false,
  })
  phone?: string;

  @ApiProperty({
    description: 'Địa chỉ',
    example: '456 Đường XYZ, Quận 2, TP.HCM',
    required: false,
  })
  address?: string;
}

export class CreateReceptionistResponseDto {
  @ApiProperty({
    description: 'ID receptionist',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Email receptionist',
    example: 'receptionist@sepolia.com',
  })
  email: string;

  @ApiProperty({
    description: 'Họ tên receptionist',
    example: 'Nguyễn Thị B',
  })
  fullName: string;

  @ApiProperty({
    description: 'Số điện thoại',
    example: '0987654321',
  })
  phone: string;

  @ApiProperty({
    description: 'Trạng thái',
    example: 'ACTIVE',
  })
  status: string;

  @ApiProperty({
    description: 'Ngày tạo',
    example: '2024-01-01T00:00:00.000Z',
    required: false,
  })
  createdAt?: Date;
}

export class ReceptionistListResponseDto {
  @ApiProperty({
    description: 'Danh sách receptionist',
    type: [CreateReceptionistResponseDto],
  })
  receptionists: CreateReceptionistResponseDto[];

  @ApiProperty({
    description: 'Tổng số receptionist',
    example: 5,
  })
  total: number;

  @ApiProperty({
    description: 'Trang hiện tại',
    example: 1,
  })
  page: number;

  @ApiProperty({
    description: 'Số lượng mỗi trang',
    example: 10,
  })
  limit: number;
}

export class ReceptionistDetailResponseDto {
  @ApiProperty({
    description: 'ID receptionist',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Email receptionist',
    example: 'receptionist@sepolia.com',
  })
  email: string;

  @ApiProperty({
    description: 'Họ tên receptionist',
    example: 'Nguyễn Thị B',
  })
  fullName: string;

  @ApiProperty({
    description: 'Số điện thoại',
    example: '0987654321',
  })
  phone: string;

  @ApiProperty({
    description: 'Trạng thái',
    example: 'ACTIVE',
  })
  status: string;

  @ApiProperty({
    description: 'Địa chỉ',
    example: '456 Đường XYZ, Quận 2, TP.HCM',
  })
  address?: string;

  @ApiProperty({
    description: 'Ngày tạo',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Ngày cập nhật',
    example: '2024-01-01T00:00:00.000Z',
  })
  updatedAt: Date;
}

export const UpdateReceptionistStatusSchema = z.object({
  status: z.nativeEnum(UserStatus),
});

export type UpdateReceptionistStatusDto = z.infer<typeof UpdateReceptionistStatusSchema>;

export class UpdateReceptionistStatusDtoClass {
  @ApiProperty({
    description: 'Trạng thái tài khoản',
    example: 'ACTIVE',
    enum: UserStatus,
  })
  status: UserStatus;
}
