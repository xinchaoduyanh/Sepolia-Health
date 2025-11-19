import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';
import { AppTermsType } from '@prisma/client';

// Query schemas
export const GetAppTermsQuerySchema = z.object({
  type: z.nativeEnum(AppTermsType).optional(),
  isActive: z.coerce.boolean().optional(),
});

export type GetAppTermsQueryDto = z.infer<typeof GetAppTermsQuerySchema>;

// Zod schemas
export const CreateAppTermsSchema = z.object({
  type: z.nativeEnum(AppTermsType),
  title: z.string().min(1, 'Tiêu đề không được để trống'),
  content: z.string().min(1, 'Nội dung không được để trống'),
  version: z.number().int().positive().optional(),
});

export type CreateAppTermsDto = z.infer<typeof CreateAppTermsSchema>;

export const UpdateAppTermsSchema = z.object({
  title: z.string().min(1, 'Tiêu đề không được để trống').optional(),
  content: z.string().min(1, 'Nội dung không được để trống').optional(),
  version: z.number().int().positive().optional(),
});

export type UpdateAppTermsDto = z.infer<typeof UpdateAppTermsSchema>;

export const ActivateAppTermsSchema = z.object({
  version: z.number().int().positive().optional(),
});

export type ActivateAppTermsDto = z.infer<typeof ActivateAppTermsSchema>;

// DTO Classes for Swagger
export class CreateAppTermsDtoClass {
  @ApiProperty({
    description: 'Loại điều khoản',
    enum: AppTermsType,
    example: AppTermsType.USAGE_REGULATIONS,
  })
  type: AppTermsType;

  @ApiProperty({
    description: 'Tiêu đề',
    example: 'Quy định sử dụng ứng dụng Sepolia Health',
  })
  title: string;

  @ApiProperty({
    description: 'Nội dung (HTML hoặc markdown)',
    example: '<h1>Quy định sử dụng</h1><p>Nội dung quy định...</p>',
  })
  content: string;

  @ApiProperty({
    description: 'Phiên bản',
    example: 1,
    required: false,
  })
  version?: number;
}

export class UpdateAppTermsDtoClass {
  @ApiProperty({
    description: 'Tiêu đề',
    example: 'Quy định sử dụng ứng dụng Sepolia Health',
    required: false,
  })
  title?: string;

  @ApiProperty({
    description: 'Nội dung (HTML hoặc markdown)',
    example: '<h1>Quy định sử dụng</h1><p>Nội dung quy định...</p>',
    required: false,
  })
  content?: string;

  @ApiProperty({
    description: 'Phiên bản',
    example: 2,
    required: false,
  })
  version?: number;
}

export class GetAppTermsQueryDtoClass {
  @ApiProperty({
    description: 'Loại điều khoản',
    enum: AppTermsType,
    required: false,
  })
  type?: AppTermsType;

  @ApiProperty({
    description: 'Chỉ lấy bản đang active',
    example: true,
    required: false,
  })
  isActive?: boolean;
}

// Response DTOs
export class AppTermsResponseDto {
  @ApiProperty({
    description: 'ID',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Loại điều khoản',
    enum: AppTermsType,
    example: AppTermsType.USAGE_REGULATIONS,
  })
  type: AppTermsType;

  @ApiProperty({
    description: 'Tiêu đề',
    example: 'Quy định sử dụng ứng dụng Sepolia Health',
  })
  title: string;

  @ApiProperty({
    description: 'Nội dung',
    example: '<h1>Quy định sử dụng</h1><p>Nội dung quy định...</p>',
  })
  content: string;

  @ApiProperty({
    description: 'Phiên bản',
    example: 1,
  })
  version: number;

  @ApiProperty({
    description: 'Đang được áp dụng',
    example: true,
  })
  isActive: boolean;

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

export class CreateAppTermsResponseDto extends AppTermsResponseDto {}

export class AppTermsListResponseDto {
  @ApiProperty({
    description: 'Danh sách điều khoản',
    type: [AppTermsResponseDto],
  })
  terms: AppTermsResponseDto[];

  @ApiProperty({
    description: 'Tổng số',
    example: 4,
  })
  total: number;
}

export class AppTermsDetailResponseDto extends AppTermsResponseDto {}

export class UpdateAppTermsResponseDto extends AppTermsResponseDto {}
