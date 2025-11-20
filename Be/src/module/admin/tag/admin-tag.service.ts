import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import {
  CreateTagDto,
  UpdateTagDto,
  CreateTagResponseDto,
  TagsListResponseDto,
  TagDetailResponseDto,
  UpdateTagResponseDto,
  GetTagsQueryDto,
} from './admin-tag.dto';

@Injectable()
export class AdminTagService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Tạo slug từ tên tag
   */
  private createSlug(name: string): string {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
      .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with hyphens
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
  }

  async createTag(createTagDto: CreateTagDto): Promise<CreateTagResponseDto> {
    const slug = this.createSlug(createTagDto.name);

    // Check if tag with same name or slug already exists
    const existingTag = await this.prisma.tag.findFirst({
      where: {
        OR: [{ name: createTagDto.name }, { slug }],
      },
    });

    if (existingTag) {
      throw new ConflictException('Tag với tên này đã tồn tại');
    }

    const tag = await this.prisma.tag.create({
      data: {
        name: createTagDto.name,
        slug,
        description: createTagDto.description,
        usageCount: 0,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        usageCount: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      id: tag.id,
      name: tag.name,
      slug: tag.slug,
      description: tag.description || undefined,
      usageCount: tag.usageCount,
      createdAt: tag.createdAt,
      updatedAt: tag.updatedAt || undefined,
    };
  }

  async getTags(query: GetTagsQueryDto): Promise<TagsListResponseDto> {
    const { page, limit, search } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.OR = [
        {
          name: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          slug: {
            contains: search,
            mode: 'insensitive',
          },
        },
      ];
    }

    const [tags, total] = await Promise.all([
      this.prisma.tag.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          usageCount: 'desc',
        },
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          usageCount: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      this.prisma.tag.count({ where }),
    ]);

    return {
      tags: tags.map((tag) => ({
        id: tag.id,
        name: tag.name,
        slug: tag.slug,
        description: tag.description || undefined,
        usageCount: tag.usageCount,
        createdAt: tag.createdAt,
        updatedAt: tag.updatedAt || undefined,
      })),
      total,
      page,
      limit,
    };
  }

  async getTag(id: number): Promise<TagDetailResponseDto> {
    const tag = await this.prisma.tag.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        usageCount: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!tag) {
      throw new NotFoundException('Tag không tồn tại');
    }

    return {
      id: tag.id,
      name: tag.name,
      slug: tag.slug,
      description: tag.description || undefined,
      usageCount: tag.usageCount,
      createdAt: tag.createdAt,
      updatedAt: tag.updatedAt || undefined,
    };
  }

  async updateTag(
    id: number,
    updateTagDto: UpdateTagDto,
  ): Promise<UpdateTagResponseDto> {
    const existingTag = await this.prisma.tag.findUnique({
      where: { id },
    });

    if (!existingTag) {
      throw new NotFoundException('Tag không tồn tại');
    }

    const updateData: any = {};
    if (updateTagDto.name !== undefined) {
      updateData.name = updateTagDto.name;
      updateData.slug = this.createSlug(updateTagDto.name);

      // Check if new name/slug conflicts with existing tag
      const conflictingTag = await this.prisma.tag.findFirst({
        where: {
          id: { not: id },
          OR: [{ name: updateTagDto.name }, { slug: updateData.slug }],
        },
      });

      if (conflictingTag) {
        throw new ConflictException('Tag với tên này đã tồn tại');
      }
    }
    if (updateTagDto.description !== undefined) {
      updateData.description = updateTagDto.description;
    }

    const tag = await this.prisma.tag.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        usageCount: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      id: tag.id,
      name: tag.name,
      slug: tag.slug,
      description: tag.description || undefined,
      usageCount: tag.usageCount,
      createdAt: tag.createdAt,
      updatedAt: tag.updatedAt || undefined,
    };
  }

  async deleteTag(id: number): Promise<void> {
    const existingTag = await this.prisma.tag.findUnique({
      where: { id },
    });

    if (!existingTag) {
      throw new NotFoundException('Tag không tồn tại');
    }

    // Check if tag is being used
    const usageCount = await this.prisma.questionTag.count({
      where: { tagId: id },
    });

    if (usageCount > 0) {
      throw new ConflictException(
        `Không thể xóa tag này vì đang được sử dụng bởi ${usageCount} câu hỏi`,
      );
    }

    await this.prisma.tag.delete({
      where: { id },
    });
  }
}
