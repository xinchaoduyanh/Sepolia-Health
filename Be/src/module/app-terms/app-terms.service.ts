import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { AppTermsDetailResponseDto } from '../admin/app-terms/admin-app-terms.dto';
import { AppTermsType } from '@prisma/client';

@Injectable()
export class AppTermsService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllActiveTerms(): Promise<AppTermsDetailResponseDto[]> {
    const terms = await this.prisma.appTerms.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        type: 'asc',
      },
    });

    return terms.map((term) => this.mapToResponse(term));
  }

  async getTermsByType(type: AppTermsType): Promise<AppTermsDetailResponseDto> {
    const terms = await this.prisma.appTerms.findFirst({
      where: {
        type,
        isActive: true,
      },
    });

    if (!terms) {
      throw new NotFoundException(
        `Không tìm thấy điều khoản loại ${type} đang được áp dụng`,
      );
    }

    return this.mapToResponse(terms);
  }

  private mapToResponse(terms: any): AppTermsDetailResponseDto {
    return {
      id: terms.id,
      type: terms.type,
      title: terms.title,
      content: terms.content,
      version: terms.version,
      isActive: terms.isActive,
      createdAt: terms.createdAt,
      updatedAt: terms.updatedAt,
    };
  }
}
