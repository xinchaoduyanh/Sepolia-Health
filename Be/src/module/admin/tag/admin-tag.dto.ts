import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';

// Query schemas
export const GetTagsQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  search: z.string().optional(),
});

export type GetTagsQueryDto = z.infer<typeof GetTagsQuerySchema>;

// Query DTO Class for Swagger
export class GetTagsQueryDtoClass {
  @ApiProperty({
    description: 'Số trang',
    example: 1,
    required: false,
    default: 1,
  })
  page?: number;

  @ApiProperty({
    description: 'Số lượng mỗi trang',
    example: 10,
    required: false,
    default: 10,
  })
  limit?: number;

  @ApiProperty({
    description: 'Tìm kiếm theo tên hoặc slug',
    example: 'tim',
    required: false,
  })
  search?: string;
}

// Zod schemas
export const CreateTagSchema = z.object({
  name: z.string().min(1, 'Tên tag không được để trống'),
  description: z.string().optional(),
});

export type CreateTagDto = z.infer<typeof CreateTagSchema>;

export const UpdateTagSchema = z.object({
  name: z.string().min(1, 'Tên tag không được để trống').optional(),
  description: z.string().optional(),
});

export type UpdateTagDto = z.infer<typeof UpdateTagSchema>;

// DTO Classes for Swagger
export class CreateTagDtoClass {
  @ApiProperty({
    description: 'Tên tag',
    example: 'Tim mạch',
  })
  name: string;

  @ApiProperty({
    description: 'Mô tả tag',
    example: 'Các câu hỏi về bệnh tim mạch',
    required: false,
  })
  description?: string;
}

export class UpdateTagDtoClass {
  @ApiProperty({
    description: 'Tên tag',
    example: 'Tim mạch',
    required: false,
  })
  name?: string;

  @ApiProperty({
    description: 'Mô tả tag',
    example: 'Các câu hỏi về bệnh tim mạch',
    required: false,
  })
  description?: string;
}

// Response DTOs
export class TagResponseDto {
  @ApiProperty({
    description: 'ID tag',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Tên tag',
    example: 'Tim mạch',
  })
  name: string;

  @ApiProperty({
    description: 'Slug của tag',
    example: 'tim-mach',
  })
  slug: string;

  @ApiProperty({
    description: 'Mô tả tag',
    example: 'Các câu hỏi về bệnh tim mạch',
    required: false,
  })
  description?: string;

  @ApiProperty({
    description: 'Số lần sử dụng',
    example: 10,
  })
  usageCount: number;

  @ApiProperty({
    description: 'Ngày tạo',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Ngày cập nhật',
    example: '2024-01-01T00:00:00.000Z',
    required: false,
  })
  updatedAt?: Date;
}

export class TagsListResponseDto {
  @ApiProperty({
    description: 'Danh sách tags',
    type: TagResponseDto,
    isArray: true,
  })
  tags: TagResponseDto[];

  @ApiProperty({
    description: 'Tổng số tags',
    example: 100,
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

// Response DTO Classes (aliases for Swagger)
export class TagDetailResponseDto extends TagResponseDto {}
export class CreateTagResponseDto extends TagResponseDto {}
export class UpdateTagResponseDto extends TagResponseDto {}
