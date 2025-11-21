import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';

// Zod schemas
export const CreatePromotionDisplaySchema = z.object({
  promotionId: z.number().int().positive('ID promotion phải là số dương'),
  displayOrder: z.number().int().min(0).default(0),
  isActive: z.boolean().default(false),
  backgroundColor: z.string().min(1, 'Màu nền không được để trống'),
  textColor: z.string().min(1, 'Màu chữ không được để trống'),
  buttonColor: z.string().min(1, 'Màu nút không được để trống'),
  buttonTextColor: z.string().min(1, 'Màu chữ nút không được để trống'),
  imageUrl: z.string().optional(),
});

export type CreatePromotionDisplayDto = z.infer<
  typeof CreatePromotionDisplaySchema
>;

export const UpdatePromotionDisplaySchema = z.object({
  promotionId: z
    .number()
    .int()
    .positive('ID promotion phải là số dương')
    .optional(),
  displayOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
  backgroundColor: z.string().min(1, 'Màu nền không được để trống').optional(),
  textColor: z.string().min(1, 'Màu chữ không được để trống').optional(),
  buttonColor: z.string().min(1, 'Màu nút không được để trống').optional(),
  buttonTextColor: z
    .string()
    .min(1, 'Màu chữ nút không được để trống')
    .optional(),
  imageUrl: z.string().optional(),
});

export type UpdatePromotionDisplayDto = z.infer<
  typeof UpdatePromotionDisplaySchema
>;

export const ApplyPromotionSchema = z.object({
  promotionId: z.number().int().positive('ID promotion phải là số dương'),
});

export type ApplyPromotionDto = z.infer<typeof ApplyPromotionSchema>;

// DTO Classes for Swagger
export class CreatePromotionDisplayDtoClass {
  @ApiProperty({
    description: 'ID chương trình khuyến mãi',
    example: 1,
  })
  promotionId: number;

  @ApiProperty({
    description: 'Thứ tự hiển thị',
    example: 0,
    default: 0,
  })
  displayOrder: number;

  @ApiProperty({
    description: 'Trạng thái active',
    example: false,
    default: false,
  })
  isActive: boolean;

  @ApiProperty({
    description: 'Màu nền gradient (JSON array)',
    example: '["#1E3A5F", "#2C5282"]',
  })
  backgroundColor: string;

  @ApiProperty({
    description: 'Màu chữ',
    example: '#FFFFFF',
  })
  textColor: string;

  @ApiProperty({
    description: 'Màu nút',
    example: 'rgba(255,255,255,0.25)',
  })
  buttonColor: string;

  @ApiProperty({
    description: 'Màu chữ nút',
    example: '#FFFFFF',
  })
  buttonTextColor: string;

  @ApiProperty({
    description: 'URL hình ảnh',
    example: 'https://example.com/image.jpg',
    required: false,
  })
  imageUrl?: string;
}

export class UpdatePromotionDisplayDtoClass {
  @ApiProperty({
    description: 'ID chương trình khuyến mãi',
    example: 1,
    required: false,
  })
  promotionId?: number;

  @ApiProperty({
    description: 'Thứ tự hiển thị',
    example: 0,
    required: false,
  })
  displayOrder?: number;

  @ApiProperty({
    description: 'Trạng thái active',
    example: false,
    required: false,
  })
  isActive?: boolean;

  @ApiProperty({
    description: 'Màu nền gradient (JSON array)',
    example: '["#1E3A5F", "#2C5282"]',
    required: false,
  })
  backgroundColor?: string;

  @ApiProperty({
    description: 'Màu chữ',
    example: '#FFFFFF',
    required: false,
  })
  textColor?: string;

  @ApiProperty({
    description: 'Màu nút',
    example: 'rgba(255,255,255,0.25)',
    required: false,
  })
  buttonColor?: string;

  @ApiProperty({
    description: 'Màu chữ nút',
    example: '#FFFFFF',
    required: false,
  })
  buttonTextColor?: string;

  @ApiProperty({
    description: 'URL hình ảnh',
    example: 'https://example.com/image.jpg',
    required: false,
  })
  imageUrl?: string;
}

export class ApplyPromotionDtoClass {
  @ApiProperty({
    description: 'ID chương trình khuyến mãi',
    example: 1,
  })
  promotionId: number;
}

// Response DTOs
export class PromotionDisplayResponseDto {
  @ApiProperty({
    description: 'ID display',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'ID chương trình khuyến mãi',
    example: 1,
  })
  promotionId: number;

  @ApiProperty({
    description: 'Thông tin promotion',
    type: Object,
    additionalProperties: true,
  })
  promotion: any;

  @ApiProperty({
    description: 'Thứ tự hiển thị',
    example: 0,
  })
  displayOrder: number;

  @ApiProperty({
    description: 'Trạng thái active',
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: 'Màu nền gradient',
    example: '["#1E3A5F", "#2C5282"]',
  })
  backgroundColor: string;

  @ApiProperty({
    description: 'Màu chữ',
    example: '#FFFFFF',
  })
  textColor: string;

  @ApiProperty({
    description: 'Màu nút',
    example: 'rgba(255,255,255,0.25)',
  })
  buttonColor: string;

  @ApiProperty({
    description: 'Màu chữ nút',
    example: '#FFFFFF',
  })
  buttonTextColor: string;

  @ApiProperty({
    description: 'URL hình ảnh',
    example: 'https://example.com/image.jpg',
    nullable: true,
  })
  imageUrl?: string;

  @ApiProperty({
    description: 'Ngày tạo',
    example: '2024-12-01T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Ngày cập nhật',
    example: '2024-12-01T00:00:00.000Z',
  })
  updatedAt: Date;

  @ApiProperty({
    description: 'Ngày archive',
    example: '2024-12-01T00:00:00.000Z',
    nullable: true,
  })
  archivedAt?: Date;
}

export class PromotionDisplayDetailResponseDto extends PromotionDisplayResponseDto {}

export class CreatePromotionDisplayResponseDto extends PromotionDisplayResponseDto {}

export class UpdatePromotionDisplayResponseDto extends PromotionDisplayResponseDto {}
