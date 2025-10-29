import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';

// Query schemas
export const GetArticlesQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  search: z.string().optional(),
});

export type GetArticlesQueryDto = z.infer<typeof GetArticlesQuerySchema>;

// Zod schemas
export const CreateArticleSchema = z.object({
  title: z.string().min(1, 'Tiêu đề không được để trống'),
  content: z.string().min(1, 'Nội dung không được để trống'),
  image: z.string().optional(),
});

export type CreateArticleDto = z.infer<typeof CreateArticleSchema>;

export const UpdateArticleSchema = z.object({
  title: z.string().min(1, 'Tiêu đề không được để trống').optional(),
  content: z.string().min(1, 'Nội dung không được để trống').optional(),
  image: z.string().optional(),
});

export type UpdateArticleDto = z.infer<typeof UpdateArticleSchema>;

// DTO Classes for Swagger
export class CreateArticleDtoClass {
  @ApiProperty({
    description: 'Tiêu đề bài viết',
    example: 'Cách chăm sóc sức khỏe tại nhà',
  })
  title: string;

  @ApiProperty({
    description: 'Nội dung bài viết',
    example: 'Bài viết về các cách chăm sóc sức khỏe...',
  })
  content: string;

  @ApiProperty({
    description: 'URL ảnh bài viết',
    example: 'https://example.com/image.jpg',
    required: false,
  })
  image?: string;
}

export class UpdateArticleDtoClass {
  @ApiProperty({
    description: 'Tiêu đề bài viết',
    example: 'Cách chăm sóc sức khỏe tại nhà',
    required: false,
  })
  title?: string;

  @ApiProperty({
    description: 'Nội dung bài viết',
    example: 'Bài viết về các cách chăm sóc sức khỏe...',
    required: false,
  })
  content?: string;

  @ApiProperty({
    description: 'URL ảnh bài viết',
    example: 'https://example.com/image.jpg',
    required: false,
  })
  image?: string;
}

// Response DTOs
export class ArticleResponseDto {
  @ApiProperty({
    description: 'ID bài viết',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Tiêu đề bài viết',
    example: 'Cách chăm sóc sức khỏe tại nhà',
  })
  title: string;

  @ApiProperty({
    description: 'Nội dung bài viết',
    example: 'Bài viết về các cách chăm sóc sức khỏe...',
  })
  content: string;

  @ApiProperty({
    description: 'URL ảnh bài viết',
    example: 'https://example.com/image.jpg',
    nullable: true,
  })
  image?: string;

  @ApiProperty({
    description: 'Ngày tạo',
    example: '2023-10-28T10:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Ngày cập nhật',
    example: '2023-10-28T10:00:00.000Z',
  })
  updatedAt: Date;
}

export class ArticlesListResponseDto {
  @ApiProperty({
    description: 'Danh sách bài viết',
    type: [ArticleResponseDto],
  })
  articles: ArticleResponseDto[];

  @ApiProperty({
    description: 'Tổng số bài viết',
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

export class ArticleDetailResponseDto extends ArticleResponseDto {}

export class CreateArticleResponseDto extends ArticleResponseDto {}

export class UpdateArticleResponseDto extends ArticleResponseDto {}

// Query DTO class for Swagger
export class GetArticlesQueryDtoClass {
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
    description: 'Từ khóa tìm kiếm theo tiêu đề',
    example: 'sức khỏe',
    required: false,
  })
  search?: string;
}
