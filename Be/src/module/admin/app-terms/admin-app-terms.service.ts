import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import {
  CreateAppTermsDto,
  UpdateAppTermsDto,
  CreateAppTermsResponseDto,
  AppTermsListResponseDto,
  AppTermsDetailResponseDto,
  UpdateAppTermsResponseDto,
  GetAppTermsQueryDto,
  ActivateAppTermsDto,
} from './admin-app-terms.dto';
import { AppTermsType } from '@prisma/client';

@Injectable()
export class AdminAppTermsService {
  constructor(private readonly prisma: PrismaService) {}

  async createAppTerms(
    createAppTermsDto: CreateAppTermsDto,
    userId?: number,
  ): Promise<CreateAppTermsResponseDto> {
    const { type, title, content, version } = createAppTermsDto;

    // Kiểm tra xem đã có bản active của loại này chưa
    const existingActive = await this.prisma.appTerms.findFirst({
      where: {
        type,
        isActive: true,
      },
    });

    if (existingActive) {
      // Nếu đã có bản active, tạo bản mới với isActive = false
      const newVersion = version || existingActive.version + 1;
      const terms = await this.prisma.appTerms.create({
        data: {
          type,
          title,
          content,
          version: newVersion,
          isActive: false,
          createdBy: userId,
        },
      });

      return this.mapToResponse(terms);
    } else {
      // Nếu chưa có bản active, tạo bản mới với isActive = true
      const newVersion = version || 1;
      const terms = await this.prisma.appTerms.create({
        data: {
          type,
          title,
          content,
          version: newVersion,
          isActive: true,
          createdBy: userId,
        },
      });

      return this.mapToResponse(terms);
    }
  }

  async getAppTerms(
    query: GetAppTermsQueryDto,
  ): Promise<AppTermsListResponseDto> {
    const { type, isActive } = query;

    const where: any = {};
    if (type) {
      where.type = type;
    }
    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const [terms, total] = await Promise.all([
      this.prisma.appTerms.findMany({
        where,
        orderBy: [{ type: 'asc' }, { version: 'desc' }],
      }),
      this.prisma.appTerms.count({ where }),
    ]);

    return {
      terms: terms.map((term) => this.mapToResponse(term)),
      total,
    };
  }

  async getAppTermsByType(
    type: AppTermsType,
  ): Promise<AppTermsDetailResponseDto> {
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

  async getAppTermsById(id: number): Promise<AppTermsDetailResponseDto> {
    const terms = await this.prisma.appTerms.findUnique({
      where: { id },
    });

    if (!terms) {
      throw new NotFoundException('Điều khoản không tồn tại');
    }

    return this.mapToResponse(terms);
  }

  async updateAppTerms(
    id: number,
    updateAppTermsDto: UpdateAppTermsDto,
    userId?: number,
  ): Promise<UpdateAppTermsResponseDto> {
    const existingTerms = await this.prisma.appTerms.findUnique({
      where: { id },
    });

    if (!existingTerms) {
      throw new NotFoundException('Điều khoản không tồn tại');
    }

    // Nếu đang cập nhật bản active, tạo bản mới thay vì cập nhật trực tiếp
    if (existingTerms.isActive) {
      const { title, content, version } = updateAppTermsDto;
      const newVersion = version || existingTerms.version + 1;

      // Tạo bản mới với isActive = false
      const newTerms = await this.prisma.appTerms.create({
        data: {
          type: existingTerms.type,
          title: title || existingTerms.title,
          content: content || existingTerms.content,
          version: newVersion,
          isActive: false,
          createdBy: userId,
        },
      });

      return this.mapToResponse(newTerms);
    } else {
      // Cập nhật bản không active
      const terms = await this.prisma.appTerms.update({
        where: { id },
        data: {
          ...updateAppTermsDto,
          updatedBy: userId,
        },
      });

      return this.mapToResponse(terms);
    }
  }

  async activateAppTerms(
    id: number,
    userId?: number,
  ): Promise<UpdateAppTermsResponseDto> {
    const terms = await this.prisma.appTerms.findUnique({
      where: { id },
    });

    if (!terms) {
      throw new NotFoundException('Điều khoản không tồn tại');
    }

    if (terms.isActive) {
      throw new BadRequestException('Điều khoản này đã được kích hoạt');
    }

    // Deactivate tất cả các bản cùng loại
    await this.prisma.appTerms.updateMany({
      where: {
        type: terms.type,
        isActive: true,
      },
      data: {
        isActive: false,
      },
    });

    // Activate bản được chọn
    const activated = await this.prisma.appTerms.update({
      where: { id },
      data: {
        isActive: true,
        updatedBy: userId,
      },
    });

    return this.mapToResponse(activated);
  }

  async deleteAppTerms(id: number): Promise<void> {
    const existingTerms = await this.prisma.appTerms.findUnique({
      where: { id },
    });

    if (!existingTerms) {
      throw new NotFoundException('Điều khoản không tồn tại');
    }

    if (existingTerms.isActive) {
      throw new ConflictException(
        'Không thể xóa điều khoản đang được áp dụng. Vui lòng kích hoạt bản khác trước.',
      );
    }

    await this.prisma.appTerms.delete({
      where: { id },
    });
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
