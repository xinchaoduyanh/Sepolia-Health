import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import {
  CreatePromotionDisplayDto,
  UpdatePromotionDisplayDto,
  CreatePromotionDisplayResponseDto,
  PromotionDisplayDetailResponseDto,
  UpdatePromotionDisplayResponseDto,
  ApplyPromotionDto,
} from './admin-promotion-display.dto';

@Injectable()
export class AdminPromotionDisplayService {
  constructor(private readonly prisma: PrismaService) {}

  async createPromotionDisplay(
    createDto: CreatePromotionDisplayDto,
    userId: number,
  ): Promise<CreatePromotionDisplayResponseDto> {
    // Validate promotion exists
    const promotion = await this.prisma.promotion.findUnique({
      where: { id: createDto.promotionId },
    });

    if (!promotion) {
      throw new NotFoundException('Không tìm thấy chương trình khuyến mãi');
    }

    // If setting as active, deactivate others and archive them
    if (createDto.isActive) {
      await this.deactivateAllDisplays();
    }

    const display = await this.prisma.promotionDisplay.create({
      data: {
        ...createDto,
        createdBy: userId,
      },
      include: {
        promotion: true,
      },
    });

    return this.mapToResponseDto(display);
  }

  async getPromotionDisplays(): Promise<PromotionDisplayDetailResponseDto[]> {
    const displays = await this.prisma.promotionDisplay.findMany({
      include: {
        promotion: true,
      },
      orderBy: [
        { isActive: 'desc' },
        { archivedAt: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    return displays.map((d) => this.mapToResponseDto(d));
  }

  async getActivePromotionDisplay(): Promise<PromotionDisplayDetailResponseDto | null> {
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

    return this.mapToResponseDto(display);
  }

  async getPromotionDisplay(
    id: number,
  ): Promise<PromotionDisplayDetailResponseDto> {
    const display = await this.prisma.promotionDisplay.findUnique({
      where: { id },
      include: {
        promotion: true,
      },
    });

    if (!display) {
      throw new NotFoundException('Không tìm thấy cấu hình hiển thị');
    }

    return this.mapToResponseDto(display);
  }

  async updatePromotionDisplay(
    id: number,
    updateDto: UpdatePromotionDisplayDto,
    userId: number,
  ): Promise<UpdatePromotionDisplayResponseDto> {
    const display = await this.prisma.promotionDisplay.findUnique({
      where: { id },
    });

    if (!display) {
      throw new NotFoundException('Không tìm thấy cấu hình hiển thị');
    }

    // If promotionId is being updated, validate it exists
    if (updateDto.promotionId) {
      const promotion = await this.prisma.promotion.findUnique({
        where: { id: updateDto.promotionId },
      });

      if (!promotion) {
        throw new NotFoundException('Không tìm thấy chương trình khuyến mãi');
      }
    }

    // If setting as active, deactivate others and archive them
    if (updateDto.isActive === true && !display.isActive) {
      await this.deactivateAllDisplays();
    }

    const updatedDisplay = await this.prisma.promotionDisplay.update({
      where: { id },
      data: {
        ...updateDto,
        updatedBy: userId,
      },
      include: {
        promotion: true,
      },
    });

    return this.mapToResponseDto(updatedDisplay);
  }

  async applyPromotionToDisplay(
    id: number,
    applyDto: ApplyPromotionDto,
  ): Promise<UpdatePromotionDisplayResponseDto> {
    const display = await this.prisma.promotionDisplay.findUnique({
      where: { id },
    });

    if (!display) {
      throw new NotFoundException('Không tìm thấy cấu hình hiển thị');
    }

    // Validate promotion exists
    const promotion = await this.prisma.promotion.findUnique({
      where: { id: applyDto.promotionId },
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

    const updatedDisplay = await this.prisma.promotionDisplay.update({
      where: { id },
      data: {
        promotionId: applyDto.promotionId,
      },
      include: {
        promotion: true,
      },
    });

    return this.mapToResponseDto(updatedDisplay);
  }

  async activatePromotionDisplay(
    id: number,
  ): Promise<UpdatePromotionDisplayResponseDto> {
    const display = await this.prisma.promotionDisplay.findUnique({
      where: { id },
    });

    if (!display) {
      throw new NotFoundException('Không tìm thấy cấu hình hiển thị');
    }

    // Deactivate all other displays
    await this.deactivateAllDisplays();

    const updatedDisplay = await this.prisma.promotionDisplay.update({
      where: { id },
      data: {
        isActive: true,
      },
      include: {
        promotion: true,
      },
    });

    return this.mapToResponseDto(updatedDisplay);
  }

  async deletePromotionDisplay(id: number): Promise<{ message: string }> {
    const display = await this.prisma.promotionDisplay.findUnique({
      where: { id },
    });

    if (!display) {
      throw new NotFoundException('Không tìm thấy cấu hình hiển thị');
    }

    if (display.isActive) {
      throw new BadRequestException(
        'Không thể xóa cấu hình hiển thị đang active',
      );
    }

    await this.prisma.promotionDisplay.delete({
      where: { id },
    });

    return { message: 'Xóa cấu hình hiển thị thành công' };
  }

  private async deactivateAllDisplays(): Promise<void> {
    const activeDisplays = await this.prisma.promotionDisplay.findMany({
      where: {
        isActive: true,
      },
    });

    if (activeDisplays.length > 0) {
      await this.prisma.promotionDisplay.updateMany({
        where: {
          isActive: true,
        },
        data: {
          isActive: false,
          archivedAt: new Date(),
        },
      });
    }
  }

  private mapToResponseDto(display: any): PromotionDisplayDetailResponseDto {
    return {
      id: display.id,
      promotionId: display.promotionId,
      promotion: display.promotion,
      displayOrder: display.displayOrder,
      isActive: display.isActive,
      backgroundColor: display.backgroundColor,
      textColor: display.textColor,
      buttonColor: display.buttonColor,
      buttonTextColor: display.buttonTextColor,
      buttonText: display.buttonText,
      iconName: display.iconName,
      imageUrl: display.imageUrl || undefined,
      createdAt: display.createdAt,
      updatedAt: display.updatedAt,
      archivedAt: display.archivedAt || undefined,
    };
  }
}
