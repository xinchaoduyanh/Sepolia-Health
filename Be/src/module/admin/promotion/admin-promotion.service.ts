import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import {
  CreatePromotionDto,
  UpdatePromotionDto,
  CreatePromotionResponseDto,
  PromotionsListResponseDto,
  PromotionDetailResponseDto,
  UpdatePromotionResponseDto,
  GetPromotionsQueryDto,
  PromotionResponseDto,
} from './admin-promotion.dto';
import * as crypto from 'crypto';

@Injectable()
export class AdminPromotionService {
  private readonly QR_SECRET = process.env.QR_SECRET || 'sepolia_health_secret_2024';

  constructor(private readonly prisma: PrismaService) {}

  // ... (existing methods)

  async getQrData(id: number, interval: number = 30) {
    const promotion = await this.prisma.promotion.findUnique({
      where: { id },
    });

    if (!promotion) {
      throw new NotFoundException('Không tìm thấy chương trình khuyến mãi');
    }

    const t = Math.floor(Date.now() / 1000 / interval);
    const signature = this.generateSignature(promotion.id, promotion.updatedAt, t, interval);

    return {
      id: promotion.id,
      t,
      signature,
      i: interval,
      expiresIn: interval - (Math.floor(Date.now() / 1000) % interval),
    };
  }

  private generateSignature(id: number, updatedAt: Date, t: number, interval: number): string {
    const data = `${id}:${updatedAt.getTime()}:${t}:${interval}:${this.QR_SECRET}`;
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  async createPromotion(
    createPromotionDto: CreatePromotionDto,
    userId: number,
  ): Promise<CreatePromotionResponseDto> {
    // Check if code already exists
    const existingPromotion = await this.prisma.promotion.findUnique({
      where: { code: createPromotionDto.code },
    });

    if (existingPromotion) {
      throw new ConflictException('Mã voucher đã tồn tại');
    }

    const promotion = await this.prisma.promotion.create({
      data: {
        ...createPromotionDto,
        createdBy: userId,
      },
    });

    return this.mapToResponseDto(promotion);
  }

  async getPromotions(
    query: GetPromotionsQueryDto,
  ): Promise<PromotionsListResponseDto> {
    const { page, limit, search } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.OR = [
        {
          title: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          code: {
            contains: search,
            mode: 'insensitive',
          },
        },
      ];
    }

    const [promotions, total] = await Promise.all([
      this.prisma.promotion.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.promotion.count({ where }),
    ]);

    return {
      promotions: promotions.map((p) => this.mapToResponseDto(p)),
      total,
      page,
      limit,
    };
  }

  async getPromotion(id: number): Promise<PromotionDetailResponseDto> {
    const promotion = await this.prisma.promotion.findUnique({
      where: { id },
    });

    if (!promotion) {
      throw new NotFoundException('Không tìm thấy chương trình khuyến mãi');
    }

    return this.mapToResponseDto(promotion);
  }

  async updatePromotion(
    id: number,
    updatePromotionDto: UpdatePromotionDto,
    userId: number,
  ): Promise<UpdatePromotionResponseDto> {
    const promotion = await this.prisma.promotion.findUnique({
      where: { id },
    });

    if (!promotion) {
      throw new NotFoundException('Không tìm thấy chương trình khuyến mãi');
    }

    // Check if code is being updated and if it already exists
    if (updatePromotionDto.code && updatePromotionDto.code !== promotion.code) {
      const existingPromotion = await this.prisma.promotion.findUnique({
        where: { code: updatePromotionDto.code },
      });

      if (existingPromotion) {
        throw new ConflictException('Mã voucher đã tồn tại');
      }
    }

    const updatedPromotion = await this.prisma.promotion.update({
      where: { id },
      data: {
        ...updatePromotionDto,
        updatedBy: userId,
      },
    });

    return this.mapToResponseDto(updatedPromotion);
  }

  async deletePromotion(id: number): Promise<{ message: string }> {
    const promotion = await this.prisma.promotion.findUnique({
      where: { id },
      include: {
        displays: {
          where: {
            isActive: true,
          },
        },
      },
    });

    if (!promotion) {
      throw new NotFoundException('Không tìm thấy chương trình khuyến mãi');
    }

    // Check if promotion is being used in an active display
    if (promotion.displays.length > 0) {
      throw new BadRequestException(
        'Không thể xóa chương trình khuyến mãi đang được sử dụng trong hiển thị',
      );
    }

    await this.prisma.promotion.delete({
      where: { id },
    });

    return { message: 'Xóa chương trình khuyến mãi thành công' };
  }

  async renewPromotionQrSignature(id: number): Promise<{ message: string }> {
    const promotion = await this.prisma.promotion.findUnique({
      where: { id },
    });

    if (!promotion) {
      throw new NotFoundException('Không tìm thấy chương trình khuyến mãi');
    }

    // "Renew" by updating just the updatedAt field
    await this.prisma.promotion.update({
      where: { id },
      data: {
        updatedAt: new Date(),
      },
    });

    return { message: 'Đã làm mới mã QR thành công' };
  }

  private mapToResponseDto(promotion: any): PromotionResponseDto {
    return {
      id: promotion.id,
      title: promotion.title,
      code: promotion.code,
      description: promotion.description || undefined,
      discountPercent: promotion.discountPercent,
      maxDiscountAmount: promotion.maxDiscountAmount,
      validFrom: promotion.validFrom,
      validTo: promotion.validTo,
      createdAt: promotion.createdAt,
      updatedAt: promotion.updatedAt,
    };
  }
}
