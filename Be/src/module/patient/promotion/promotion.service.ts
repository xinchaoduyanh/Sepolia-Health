import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import {
  FeaturedPromotionResponseDto,
  UserPromotionDto,
  ClaimPromotionResponseDto,
  ClaimPromotionViaQrDto,
} from './promotion.dto';
import * as crypto from 'crypto';

@Injectable()
export class PromotionService {
  private readonly QR_SECRET = process.env.QR_SECRET || 'sepolia_health_secret_2024';

  constructor(private readonly prisma: PrismaService) {}


  private generateSignature(id: number, updatedAt: Date, t: number, interval: number): string {
    const data = `${id}:${updatedAt.getTime()}:${t}:${interval}:${this.QR_SECRET}`;
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  async claimPromotionViaQr(
    promotionId: number,
    userId: number,
    qrData: ClaimPromotionViaQrDto,
  ): Promise<ClaimPromotionResponseDto> {
    const promotion = await this.prisma.promotion.findUnique({
      where: { id: promotionId },
    });

    if (!promotion) {
      throw new NotFoundException('Không tìm thấy chương trình khuyến mãi');
    }

    // Verify signature with current time block and previous time block (to allow some delay)
    const isValid = this.verifySignature(promotion, qrData);
    if (!isValid) {
      throw new BadRequestException('Mã QR đã hết hạn hoặc không hợp lệ');
    }

    // Reuse existing claim logic
    return this.claimPromotion(promotionId, userId);
  }

  private verifySignature(promotion: any, qrData: ClaimPromotionViaQrDto): boolean {
    const { signature, t, i: interval } = qrData;
    
    // 1. Check if the signature matches the provided t and interval
    const expectedSignature = this.generateSignature(promotion.id, promotion.updatedAt, t, interval);
    if (signature !== expectedSignature) {
      return false;
    }

    // 2. Check if t is within a reasonable window
    const currentT = Math.floor(Date.now() / 1000 / interval);
    
    // Allow current and ±2 blocks to account for network lag and clock drift
    if (t < currentT - 2 || t > currentT + 1) {
      return false;
    }

    return true;
  }

  async getFeaturedPromotion(): Promise<FeaturedPromotionResponseDto | null> {
    const display = await this.prisma.promotionDisplay.findFirst({
      where: {
        isActive: true,
      },
      include: {
        promotion: true,
      },
    });

    if (!display) {
      return null;
    }

    // Check if promotion is still valid
    const now = new Date();
    if (now < display.promotion.validFrom || now > display.promotion.validTo) {
      return null;
    }

    return {
      promotion: {
        id: display.promotion.id,
        title: display.promotion.title,
        code: display.promotion.code,
        description: display.promotion.description || undefined,
        discountPercent: display.promotion.discountPercent,
        maxDiscountAmount: display.promotion.maxDiscountAmount,
        validFrom: display.promotion.validFrom,
        validTo: display.promotion.validTo,
      },
      display: {
        backgroundColor: display.backgroundColor,
        textColor: display.textColor,
        buttonColor: display.buttonColor,
        buttonTextColor: display.buttonTextColor,
        buttonText: display.buttonText,
        iconName: display.iconName,
        imageUrl: display.imageUrl || undefined,
      },
    };
  }

  async getMyVouchers(
    userId: number,
    status?: 'available' | 'used' | 'expired',
  ): Promise<UserPromotionDto[]> {
    const userPromotions = await this.prisma.userPromotion.findMany({
      where: {
        userId,
      },
      include: {
        promotion: true,
      },
      orderBy: {
        claimedAt: 'desc',
      },
    });

    const now = new Date();
    let filteredPromotions = userPromotions;

    // Filter by status if provided
    if (status === 'used') {
      // Voucher đã sử dụng là voucher có usedAt khác null
      filteredPromotions = userPromotions.filter((up) => up.usedAt !== null);
    } else if (status === 'available') {
      // Voucher còn hạn là voucher chưa sử dụng (usedAt === null) và chưa hết hạn
      filteredPromotions = userPromotions.filter(
        (up) => up.usedAt === null && new Date(up.promotion.validTo) >= now,
      );
    } else if (status === 'expired') {
      filteredPromotions = userPromotions.filter(
        (up) => new Date(up.promotion.validTo) < now,
      );
    }

    return filteredPromotions.map((up) => ({
      id: up.id,
      promotion: {
        id: up.promotion.id,
        title: up.promotion.title,
        code: up.promotion.code,
        description: up.promotion.description || undefined,
        discountPercent: up.promotion.discountPercent,
        maxDiscountAmount: up.promotion.maxDiscountAmount,
        validFrom: up.promotion.validFrom,
        validTo: up.promotion.validTo,
      },
      claimedAt: up.claimedAt,
      usedAt: up.usedAt || undefined,
    }));
  }

  async claimPromotion(
    promotionId: number,
    userId: number,
  ): Promise<ClaimPromotionResponseDto> {
    // Check if promotion exists
    const promotion = await this.prisma.promotion.findUnique({
      where: { id: promotionId },
    });

    if (!promotion) {
      throw new NotFoundException('Không tìm thấy chương trình khuyến mãi');
    }

    // Check if promotion is still valid
    const now = new Date();
    if (now < promotion.validFrom || now > promotion.validTo) {
      throw new BadRequestException(
        'Chương trình khuyến mãi không còn hiệu lực',
      );
    }

    // Check if user already claimed this promotion
    const existingClaim = await this.prisma.userPromotion.findUnique({
      where: {
        userId_promotionId: {
          userId,
          promotionId,
        },
      },
    });

    if (existingClaim) {
      return {
        success: false,
        message: 'Bạn đã nhận chương trình khuyến mãi này rồi',
      };
    }

    // Create user promotion record
    await this.prisma.userPromotion.create({
      data: {
        userId,
        promotionId,
      },
    });

    return {
      success: true,
      message: 'Bạn đã nhận voucher thành công',
    };
  }
}
