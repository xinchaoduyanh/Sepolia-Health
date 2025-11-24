import { ApiProperty } from '@nestjs/swagger';

// Response DTOs
export class PromotionDto {
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
}

export class PromotionDisplayDto {
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
    description: 'Text hiển thị trên nút',
    example: 'Nhận ngay',
  })
  buttonText: string;

  @ApiProperty({
    description: 'Tên icon Ionicons',
    example: 'gift-outline',
  })
  iconName: string;

  @ApiProperty({
    description: 'URL hình ảnh',
    example: 'https://example.com/image.jpg',
    nullable: true,
  })
  imageUrl?: string;
}

export class FeaturedPromotionResponseDto {
  @ApiProperty({
    description: 'Thông tin promotion',
    type: PromotionDto,
  })
  promotion: PromotionDto;

  @ApiProperty({
    description: 'Cấu hình UI',
    type: PromotionDisplayDto,
  })
  display: PromotionDisplayDto;
}

export class UserPromotionDto {
  @ApiProperty({
    description: 'ID',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Thông tin promotion',
    type: PromotionDto,
  })
  promotion: PromotionDto;

  @ApiProperty({
    description: 'Thời điểm claim',
    example: '2024-12-01T00:00:00.000Z',
  })
  claimedAt: Date;

  @ApiProperty({
    description: 'Thời điểm sử dụng',
    example: '2024-12-01T00:00:00.000Z',
    nullable: true,
  })
  usedAt?: Date;
}

export class ClaimPromotionResponseDto {
  @ApiProperty({
    description: 'Thành công hay không',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Thông báo',
    example: 'Bạn đã nhận voucher thành công',
  })
  message: string;
}
