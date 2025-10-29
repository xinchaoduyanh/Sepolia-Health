import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import {
  CreateArticleDto,
  UpdateArticleDto,
  CreateArticleResponseDto,
  ArticlesListResponseDto,
  ArticleDetailResponseDto,
  UpdateArticleResponseDto,
  GetArticlesQueryDto,
} from './admin-article.dto';

@Injectable()
export class AdminArticleService {
  constructor(private readonly prisma: PrismaService) {}

  async createArticle(
    createArticleDto: CreateArticleDto,
  ): Promise<CreateArticleResponseDto> {
    const article = await this.prisma.article.create({
      data: createArticleDto,
    });

    return {
      id: article.id,
      title: article.title,
      content: article.content,
      image: article.image || undefined,
      createdAt: article.createdAt,
      updatedAt: article.updatedAt,
    };
  }

  async getArticles(
    query: GetArticlesQueryDto,
  ): Promise<ArticlesListResponseDto> {
    const { page, limit, search } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.title = {
        contains: search,
        mode: 'insensitive',
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
      }),
      this.prisma.article.count({ where }),
    ]);

    return {
      articles: articles.map((article) => ({
        id: article.id,
        title: article.title,
        content: article.content,
        image: article.image || undefined,
        createdAt: article.createdAt,
        updatedAt: article.updatedAt,
      })),
      total,
      page,
      limit,
    };
  }

  async getArticle(id: number): Promise<ArticleDetailResponseDto> {
    const article = await this.prisma.article.findUnique({
      where: { id },
    });

    if (!article) {
      throw new NotFoundException('Bài viết không tồn tại');
    }

    return {
      id: article.id,
      title: article.title,
      content: article.content,
      image: article.image || undefined,
      createdAt: article.createdAt,
      updatedAt: article.updatedAt,
    };
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

    const article = await this.prisma.article.update({
      where: { id },
      data: updateArticleDto,
    });

    return {
      id: article.id,
      title: article.title,
      content: article.content,
      image: article.image || undefined,
      createdAt: article.createdAt,
      updatedAt: article.updatedAt,
    };
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
}
