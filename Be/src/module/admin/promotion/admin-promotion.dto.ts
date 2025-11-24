import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';

// Query schemas
export const GetPromotionsQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  search: z.string().optional(),
});

export type GetPromotionsQueryDto = z.infer<typeof GetPromotionsQuerySchema>;

// Zod schemas
export const CreatePromotionSchema = z
  .object({
    title: z.string().min(1, 'Tiêu đề không được để trống'),
    code: z.string().min(1, 'Mã voucher không được để trống'),
    description: z.string().optional(),
    discountPercent: z
      .number()
      .min(0, 'Phần trăm giảm giá phải >= 0')
      .max(100, 'Phần trăm giảm giá phải <= 100'),
    maxDiscountAmount: z
      .number()
      .int('Số tiền giảm giá tối đa phải là số nguyên')
      .min(1000, 'Số tiền giảm giá tối đa phải >= 1000 VND'),
    validFrom: z.coerce.date(),
    validTo: z.coerce.date(),
  })
  .refine((data) => data.validFrom < data.validTo, {
    message: 'Ngày bắt đầu phải nhỏ hơn ngày kết thúc',
    path: ['validTo'],
  });

export type CreatePromotionDto = z.infer<typeof CreatePromotionSchema>;

export const UpdatePromotionSchema = z
  .object({
    title: z.string().min(1, 'Tiêu đề không được để trống').optional(),
    code: z.string().min(1, 'Mã voucher không được để trống').optional(),
    description: z.string().optional(),
    discountPercent: z
      .number()
      .min(0, 'Phần trăm giảm giá phải >= 0')
      .max(100, 'Phần trăm giảm giá phải <= 100')
      .optional(),
    maxDiscountAmount: z
      .number()
      .int('Số tiền giảm giá tối đa phải là số nguyên')
      .min(1000, 'Số tiền giảm giá tối đa phải >= 1000 VND')
      .optional(),
    validFrom: z.coerce.date().optional(),
    validTo: z.coerce.date().optional(),
  })
  .refine(
    (data) => {
      if (data.validFrom && data.validTo) {
        return data.validFrom < data.validTo;
      }
      return true;
    },
    {
      message: 'Ngày bắt đầu phải nhỏ hơn ngày kết thúc',
      path: ['validTo'],
    },
  );

export type UpdatePromotionDto = z.infer<typeof UpdatePromotionSchema>;

// DTO Classes for Swagger
export class CreatePromotionDtoClass {
  @ApiProperty({
    description: 'Tiêu đề chương trình khuyến mãi',
    example: 'Ưu đãi Giáng Sinh',
  })
  title: string;

  @ApiProperty({
    description: 'Mã voucher',
    example: 'CHRISTMAS2024',
  })
  code: string;

  @ApiProperty({
    description: 'Mô tả chương trình',
    example: 'Nhận ngay voucher 10% nhân dịp Giáng Sinh',
    required: false,
  })
  description?: string;

  @ApiProperty({
    description: 'Phần trăm giảm giá (0-100)',
    example: 10,
  })
  discountPercent: number;

  @ApiProperty({
    description: 'Số tiền giảm giá tối đa (VND)',
    example: 50000,
  })
  maxDiscountAmount: number;

  @ApiProperty({
    description: 'Ngày bắt đầu',
    example: '2024-12-01T00:00:00.000Z',
  })
  validFrom: Date;

  @ApiProperty({
    description: 'Ngày kết thúc',
    example: '2024-12-31T23:59:59.000Z',
  })
  validTo: Date;
}

export class UpdatePromotionDtoClass {
  @ApiProperty({
    description: 'Tiêu đề chương trình khuyến mãi',
    example: 'Ưu đãi Giáng Sinh',
    required: false,
  })
  title?: string;

  @ApiProperty({
    description: 'Mã voucher',
    example: 'CHRISTMAS2024',
    required: false,
  })
  code?: string;

  @ApiProperty({
    description: 'Mô tả chương trình',
    example: 'Nhận ngay voucher 10% nhân dịp Giáng Sinh',
    required: false,
  })
  description?: string;

  @ApiProperty({
    description: 'Phần trăm giảm giá (0-100)',
    example: 10,
    required: false,
  })
  discountPercent?: number;

  @ApiProperty({
    description: 'Số tiền giảm giá tối đa (VND)',
    example: 50000,
    required: false,
  })
  maxDiscountAmount?: number;

  @ApiProperty({
    description: 'Ngày bắt đầu',
    example: '2024-12-01T00:00:00.000Z',
    required: false,
  })
  validFrom?: Date;

  @ApiProperty({
    description: 'Ngày kết thúc',
    example: '2024-12-31T23:59:59.000Z',
    required: false,
  })
  validTo?: Date;
}

// Response DTOs
export class PromotionResponseDto {
  @ApiProperty({
    description: 'ID chương trình khuyến mãi',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Tiêu đề chương trình khuyến mãi',
    example: 'Ưu đãi Giáng Sinh',
  })
  title: string;

  @ApiProperty({
    description: 'Mã voucher',
    example: 'CHRISTMAS2024',
  })
  code: string;

  @ApiProperty({
    description: 'Mô tả chương trình',
    example: 'Nhận ngay voucher 10% nhân dịp Giáng Sinh',
    nullable: true,
  })
  description?: string;

  @ApiProperty({
    description: 'Phần trăm giảm giá',
    example: 10,
  })
  discountPercent: number;

  @ApiProperty({
    description: 'Số tiền giảm giá tối đa (VND)',
    example: 50000,
  })
  maxDiscountAmount: number;

  @ApiProperty({
    description: 'Ngày bắt đầu',
    example: '2024-12-01T00:00:00.000Z',
  })
  validFrom: Date;

  @ApiProperty({
    description: 'Ngày kết thúc',
    example: '2024-12-31T23:59:59.000Z',
  })
  validTo: Date;

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
}

export class PromotionsListResponseDto {
  @ApiProperty({
    description: 'Danh sách chương trình khuyến mãi',
    type: [PromotionResponseDto],
  })
  promotions: PromotionResponseDto[];

  @ApiProperty({
    description: 'Tổng số chương trình khuyến mãi',
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

export class PromotionDetailResponseDto extends PromotionResponseDto {}

export class CreatePromotionResponseDto extends PromotionResponseDto {}

export class UpdatePromotionResponseDto extends PromotionResponseDto {}

// Query DTO class for Swagger
export class GetPromotionsQueryDtoClass {
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
    description: 'Từ khóa tìm kiếm theo tiêu đề hoặc mã',
    example: 'giáng sinh',
    required: false,
  })
  search?: string;
}
