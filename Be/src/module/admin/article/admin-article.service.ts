import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import {
  CreateArticleDto,
  UpdateArticleDto,
  CreateArticleResponseDto,
  ArticlesListResponseDto,
  ArticleDetailResponseDto,
  UpdateArticleResponseDto,
  GetArticlesQueryDto,
  UploadArticleImageDto,
  UpdateArticleImageDto,
  AddArticleTagsDto,
} from './admin-article.dto';

@Injectable()
export class AdminArticleService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generate unique slug from title
   */
  private async generateUniqueSlug(
    title: string,
    excludeId?: number,
  ): Promise<string> {
    let baseSlug = title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    let slug = baseSlug;
    let counter = 1;

    while (true) {
      const existing = await this.prisma.article.findUnique({
        where: { slug },
      });

      if (!existing || (excludeId && existing.id === excludeId)) {
        break;
      }

      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    return slug;
  }

  async createArticle(
    createArticleDto: CreateArticleDto,
    authorId?: number,
  ): Promise<CreateArticleResponseDto> {
    // Generate unique slug if not provided or if provided slug already exists
    const slug = createArticleDto.slug
      ? await this.generateUniqueSlug(createArticleDto.slug)
      : await this.generateUniqueSlug(createArticleDto.title);

    // Handle tags if provided
    const { tagIds, content, contentMarkdown, excerpt, image, isPublished, title } = createArticleDto;

    const article = await this.prisma.article.create({
      data: {
        title,
        content: content || '', // Provide empty string for backward compatibility
        contentMarkdown,
        slug,
        authorId,
        publishedAt: isPublished ? new Date() : null,
        isPublished,
        // Only include optional fields if they are provided
        ...(excerpt !== undefined && { excerpt }),
        ...(image !== undefined && { image }),
        tags: tagIds
          ? {
              create: tagIds.map((tagId) => ({ tagId })),
            }
          : undefined,
      },
      include: {
        images: true,
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    return this.mapToResponseDto(article);
  }

  async getArticles(
    query: GetArticlesQueryDto,
  ): Promise<ArticlesListResponseDto> {
    const { page, limit, search, isPublished, tagId } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { excerpt: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (isPublished !== undefined) {
      where.isPublished = isPublished;
    }
    if (tagId) {
      where.tags = {
        some: {
          tagId,
        },
      };
    }

    const [articles, total] = await Promise.all([
      this.prisma.article.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          images: {
            orderBy: { order: 'asc' },
          },
          tags: {
            include: {
              tag: true,
            },
          },
        },
      }),
      this.prisma.article.count({ where }),
    ]);

    return {
      articles: articles.map((article) => this.mapToResponseDto(article)),
      total,
      page,
      limit,
    };
  }

  async getArticle(id: number): Promise<ArticleDetailResponseDto> {
    const article = await this.prisma.article.findUnique({
      where: { id },
      include: {
        images: {
          orderBy: { order: 'asc' },
        },
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    if (!article) {
      throw new NotFoundException('Bài viết không tồn tại');
    }

    return this.mapToResponseDto(article);
  }

  async getPublishedArticle(id: number): Promise<ArticleDetailResponseDto> {
    const article = await this.prisma.article.findUnique({
      where: { id },
      include: {
        images: {
          orderBy: { order: 'asc' },
        },
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    if (!article) {
      throw new NotFoundException('Bài viết không tồn tại');
    }

    if (!article.isPublished) {
      throw new NotFoundException('Bài viết chưa được published');
    }

    return this.mapToResponseDto(article);
  }

  async updateArticle(
    id: number,
    updateArticleDto: UpdateArticleDto,
  ): Promise<UpdateArticleResponseDto> {
    const existingArticle = await this.prisma.article.findUnique({
      where: { id },
    });

    if (!existingArticle) {
      throw new NotFoundException('Bài viết không tồn tại');
    }

    // Handle slug uniqueness if provided
    let slug = updateArticleDto.slug;
    if (slug && slug !== existingArticle.slug) {
      slug = await this.generateUniqueSlug(slug, id);
    }

    // Handle tags update
    const { tagIds, ...articleData } = updateArticleDto;

    const updateData: any = {
      ...articleData,
      ...(slug && { slug }),
      ...(updateArticleDto.isPublished !== undefined && {
        isPublished: updateArticleDto.isPublished,
        publishedAt:
          updateArticleDto.isPublished && !existingArticle.isPublished
            ? new Date()
            : existingArticle.publishedAt,
      }),
    };

    // Update tags if provided
    if (tagIds !== undefined) {
      // Delete existing tags
      await this.prisma.articleTag.deleteMany({
        where: { articleId: id },
      });

      // Create new tags
      if (tagIds.length > 0) {
        await this.prisma.articleTag.createMany({
          data: tagIds.map((tagId) => ({
            articleId: id,
            tagId,
          })),
        });
      }
    }

    const article = await this.prisma.article.update({
      where: { id },
      data: updateData,
      include: {
        images: {
          orderBy: { order: 'asc' },
        },
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    return this.mapToResponseDto(article);
  }

  async deleteArticle(id: number): Promise<void> {
    const existingArticle = await this.prisma.article.findUnique({
      where: { id },
    });

    if (!existingArticle) {
      throw new NotFoundException('Bài viết không tồn tại');
    }

    await this.prisma.article.delete({
      where: { id },
    });
  }

  /**
   * Upload image for article
   */
  async uploadArticleImage(articleId: number, imageDto: UploadArticleImageDto) {
    const article = await this.prisma.article.findUnique({
      where: { id: articleId },
    });

    if (!article) {
      throw new NotFoundException('Bài viết không tồn tại');
    }

    const articleImage = await this.prisma.articleImage.create({
      data: {
        articleId,
        ...imageDto,
      },
    });

    return articleImage;
  }

  /**
   * Delete article image
   */
  async deleteArticleImage(articleId: number, imageId: number): Promise<void> {
    const image = await this.prisma.articleImage.findFirst({
      where: {
        id: imageId,
        articleId,
      },
    });

    if (!image) {
      throw new NotFoundException('Ảnh không tồn tại');
    }

    await this.prisma.articleImage.delete({
      where: { id: imageId },
    });
  }

  /**
   * Update article image
   */
  async updateArticleImage(
    articleId: number,
    imageId: number,
    updateDto: UpdateArticleImageDto,
  ) {
    const image = await this.prisma.articleImage.findFirst({
      where: {
        id: imageId,
        articleId,
      },
    });

    if (!image) {
      throw new NotFoundException('Ảnh không tồn tại');
    }

    return this.prisma.articleImage.update({
      where: { id: imageId },
      data: updateDto,
    });
  }

  /**
   * Publish article
   */
  async publishArticle(id: number): Promise<ArticleDetailResponseDto> {
    const article = await this.prisma.article.findUnique({
      where: { id },
    });

    if (!article) {
      throw new NotFoundException('Bài viết không tồn tại');
    }

    if (article.isPublished) {
      throw new BadRequestException('Bài viết đã được publish');
    }

    const updated = await this.prisma.article.update({
      where: { id },
      data: {
        isPublished: true,
        publishedAt: new Date(),
      },
      include: {
        images: {
          orderBy: { order: 'asc' },
        },
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    return this.mapToResponseDto(updated);
  }

  /**
   * Unpublish article
   */
  async unpublishArticle(id: number): Promise<ArticleDetailResponseDto> {
    const article = await this.prisma.article.findUnique({
      where: { id },
    });

    if (!article) {
      throw new NotFoundException('Bài viết không tồn tại');
    }

    if (!article.isPublished) {
      throw new BadRequestException('Bài viết chưa được publish');
    }

    const updated = await this.prisma.article.update({
      where: { id },
      data: {
        isPublished: false,
      },
      include: {
        images: {
          orderBy: { order: 'asc' },
        },
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    return this.mapToResponseDto(updated);
  }

  /**
   * Increment view count
   */
  async incrementViews(id: number): Promise<void> {
    await this.prisma.article.update({
      where: { id },
      data: {
        views: {
          increment: 1,
        },
      },
    });
  }

  /**
   * Add tags to article
   */
  async addTags(articleId: number, addTagsDto: AddArticleTagsDto) {
    const article = await this.prisma.article.findUnique({
      where: { id: articleId },
    });

    if (!article) {
      throw new NotFoundException('Bài viết không tồn tại');
    }

    // Check if tags exist
    const tags = await this.prisma.tag.findMany({
      where: {
        id: {
          in: addTagsDto.tagIds,
        },
      },
    });

    if (tags.length !== addTagsDto.tagIds.length) {
      throw new BadRequestException('Một hoặc nhiều tag không tồn tại');
    }

    // Create article tags (ignore duplicates)
    await this.prisma.articleTag.createMany({
      data: addTagsDto.tagIds.map((tagId) => ({
        articleId,
        tagId,
      })),
      skipDuplicates: true,
    });

    return this.getArticle(articleId);
  }

  /**
   * Remove tag from article
   */
  async removeTag(articleId: number, tagId: number): Promise<void> {
    const articleTag = await this.prisma.articleTag.findUnique({
      where: {
        articleId_tagId: {
          articleId,
          tagId,
        },
      },
    });

    if (!articleTag) {
      throw new NotFoundException('Tag không tồn tại trong bài viết');
    }

    await this.prisma.articleTag.delete({
      where: {
        articleId_tagId: {
          articleId,
          tagId,
        },
      },
    });
  }

  /**
   * Map article to response DTO
   */
  private mapToResponseDto(article: any): ArticleDetailResponseDto {
    return {
      id: article.id,
      title: article.title,
      content: article.content || undefined,
      contentMarkdown: article.contentMarkdown || '',
      excerpt: article.excerpt || undefined,
      slug: article.slug,
      isPublished: article.isPublished,
      publishedAt: article.publishedAt || undefined,
      authorId: article.authorId || undefined,
      views: article.views,
      image: article.image || undefined,
      images: article.images?.map((img: any) => ({
        id: img.id,
        url: img.url,
        alt: img.alt || undefined,
        order: img.order,
        createdAt: img.createdAt,
      })),
      tags: article.tags?.map((at: any) => ({
        id: at.tag.id,
        name: at.tag.name,
        slug: at.tag.slug,
      })),
      createdAt: article.createdAt,
      updatedAt: article.updatedAt,
    };
  }
}
