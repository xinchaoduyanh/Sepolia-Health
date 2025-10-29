import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';

// Query schemas
export const GetServicesQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  search: z.string().optional(),
});

export type GetServicesQueryDto = z.infer<typeof GetServicesQuerySchema>;

// Zod schemas
export const CreateServiceSchema = z.object({
  name: z.string().min(1, 'Tên dịch vụ không được để trống'),
  price: z.number().min(0, 'Giá phải >= 0'),
  duration: z.number().int().min(1, 'Thời lượng phải >= 1 phút'),
  description: z.string().optional(),
});

export type CreateServiceDto = z.infer<typeof CreateServiceSchema>;

export const UpdateServiceSchema = z.object({
  name: z.string().min(1, 'Tên dịch vụ không được để trống').optional(),
  price: z.number().min(0, 'Giá phải >= 0').optional(),
  duration: z.number().int().min(1, 'Thời lượng phải >= 1 phút').optional(),
  description: z.string().optional(),
});

export type UpdateServiceDto = z.infer<typeof UpdateServiceSchema>;

// DTO Classes for Swagger
export class CreateServiceDtoClass {
  @ApiProperty({
    description: 'Tên dịch vụ',
    example: 'Khám tổng quát',
  })
  name: string;

  @ApiProperty({
    description: 'Giá dịch vụ (VNĐ)',
    example: 500000,
    minimum: 0,
  })
  price: number;

  @ApiProperty({
    description: 'Thời lượng (phút)',
    example: 30,
    minimum: 1,
  })
  duration: number;

  @ApiProperty({
    description: 'Mô tả dịch vụ',
    example: 'Khám tổng quát bao gồm kiểm tra sức khỏe cơ bản',
    required: false,
  })
  description?: string;
}

export class UpdateServiceDtoClass {
  @ApiProperty({
    description: 'Tên dịch vụ',
    example: 'Khám tổng quát',
    required: false,
  })
  name?: string;

  @ApiProperty({
    description: 'Giá dịch vụ (VNĐ)',
    example: 500000,
    minimum: 0,
    required: false,
  })
  price?: number;

  @ApiProperty({
    description: 'Thời lượng (phút)',
    example: 30,
    minimum: 1,
    required: false,
  })
  duration?: number;

  @ApiProperty({
    description: 'Mô tả dịch vụ',
    example: 'Khám tổng quát bao gồm kiểm tra sức khỏe cơ bản',
    required: false,
  })
  description?: string;
}

// Response DTOs
export class ServiceResponseDto {
  @ApiProperty({
    description: 'ID dịch vụ',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Tên dịch vụ',
    example: 'Khám tổng quát',
  })
  name: string;

  @ApiProperty({
    description: 'Giá dịch vụ (VNĐ)',
    example: 500000,
  })
  price: number;

  @ApiProperty({
    description: 'Thời lượng (phút)',
    example: 30,
  })
  duration: number;

  @ApiProperty({
    description: 'Mô tả dịch vụ',
    example: 'Khám tổng quát bao gồm kiểm tra sức khỏe cơ bản',
    nullable: true,
  })
  description?: string;

  @ApiProperty({
    description: 'Ngày tạo',
    example: '2023-10-28T10:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Ngày cập nhật',
    example: '2023-10-28T10:00:00.000Z',
    nullable: true,
  })
  updatedAt?: Date;
}

export class ServicesListResponseDto {
  @ApiProperty({
    description: 'Danh sách dịch vụ',
    type: [ServiceResponseDto],
  })
  services: ServiceResponseDto[];

  @ApiProperty({
    description: 'Tổng số dịch vụ',
    example: 25,
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

export class ServiceDetailResponseDto extends ServiceResponseDto {}

export class CreateServiceResponseDto extends ServiceResponseDto {}

export class UpdateServiceResponseDto extends ServiceResponseDto {}

// Query DTO class for Swagger
export class GetServicesQueryDtoClass {
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
    description: 'Từ khóa tìm kiếm theo tên dịch vụ',
    example: 'khám tổng quát',
    required: false,
  })
  search?: string;
}
