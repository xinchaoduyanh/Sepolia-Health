import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';

// Zod schemas
export const CreatePatientSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
  fullName: z.string().min(1, 'Họ tên không được để trống'),
  phone: z.string().min(1, 'Số điện thoại không được để trống'),
  dateOfBirth: z.string().min(1, 'Ngày sinh không được để trống'),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER'], {
    message: 'Giới tính không hợp lệ',
  }),
  address: z.string().optional(),
});

export type CreatePatientDto = z.infer<typeof CreatePatientSchema>;

export class CreatePatientDtoClass {
  @ApiProperty({
    description: 'Email patient',
    example: 'patient@sepolia.com',
  })
  email: string;

  @ApiProperty({
    description: 'Mật khẩu',
    example: 'patient123',
    minLength: 6,
  })
  password: string;

  @ApiProperty({
    description: 'Họ tên patient',
    example: 'Nguyễn Văn C',
  })
  fullName: string;

  @ApiProperty({
    description: 'Số điện thoại',
    example: '0123456789',
  })
  phone: string;

  @ApiProperty({
    description: 'Ngày sinh',
    example: '1990-01-15',
  })
  dateOfBirth: string;

  @ApiProperty({
    description: 'Giới tính',
    example: 'MALE',
    enum: ['MALE', 'FEMALE', 'OTHER'],
  })
  gender: string;

  @ApiProperty({
    description: 'Địa chỉ',
    example: '789 Đường DEF, Quận 3, TP.HCM',
    required: false,
  })
  address?: string;
}

export const UpdatePatientSchema = z.object({
  fullName: z.string().min(1, 'Họ tên không được để trống').optional(),
  phone: z.string().min(1, 'Số điện thoại không được để trống').optional(),
  dateOfBirth: z.string().min(1, 'Ngày sinh không được để trống').optional(),
  gender: z
    .enum(['MALE', 'FEMALE', 'OTHER'], {
      message: 'Giới tính không hợp lệ',
    })
    .optional(),
  address: z.string().optional(),
});

export type UpdatePatientDto = z.infer<typeof UpdatePatientSchema>;

export class UpdatePatientDtoClass {
  @ApiProperty({
    description: 'Họ tên patient',
    example: 'Nguyễn Văn C',
    required: false,
  })
  fullName?: string;

  @ApiProperty({
    description: 'Số điện thoại',
    example: '0123456789',
    required: false,
  })
  phone?: string;

  @ApiProperty({
    description: 'Ngày sinh',
    example: '1990-01-15',
    required: false,
  })
  dateOfBirth?: string;

  @ApiProperty({
    description: 'Giới tính',
    example: 'MALE',
    enum: ['MALE', 'FEMALE', 'OTHER'],
    required: false,
  })
  gender?: string;

  @ApiProperty({
    description: 'Địa chỉ',
    example: '789 Đường DEF, Quận 3, TP.HCM',
    required: false,
  })
  address?: string;
}

export class CreatePatientResponseDto {
  @ApiProperty({
    description: 'ID patient',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Email patient',
    example: 'patient@sepolia.com',
  })
  email: string;

  @ApiProperty({
    description: 'Họ tên patient',
    example: 'Nguyễn Văn C',
  })
  fullName: string;

  @ApiProperty({
    description: 'Trạng thái',
    example: 'ACTIVE',
  })
  status: string;
}

export class PatientListResponseDto {
  @ApiProperty({
    description: 'Danh sách patient',
    type: [CreatePatientResponseDto],
  })
  patients: CreatePatientResponseDto[];

  @ApiProperty({
    description: 'Tổng số patient',
    example: 50,
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

export class PatientDetailResponseDto extends CreatePatientResponseDto {
  @ApiProperty({
    description: 'Số điện thoại',
    example: '0123456789',
  })
  phone: string;

  @ApiProperty({
    description: 'Ngày sinh',
    example: '1990-01-15',
  })
  dateOfBirth: string;

  @ApiProperty({
    description: 'Giới tính',
    example: 'MALE',
  })
  gender: string;

  @ApiProperty({
    description: 'Địa chỉ',
    example: '789 Đường DEF, Quận 3, TP.HCM',
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
