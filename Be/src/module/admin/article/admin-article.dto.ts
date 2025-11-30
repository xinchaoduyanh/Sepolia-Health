import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';

// Query schemas
export const GetArticlesQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  search: z.string().optional(),
  isPublished: z.coerce.boolean().optional(),
  tagId: z.coerce.number().optional(),
});

export type GetArticlesQueryDto = z.infer<typeof GetArticlesQuerySchema>;

// Helper function to generate slug from title
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// Zod schemas
export const CreateArticleSchema = z
  .object({
    title: z.string().min(1, 'Tiêu đề không được để trống'),
    content: z.string().optional(), // Giữ lại cho backward compatibility
    contentMarkdown: z.string().min(1, 'Nội dung Markdown không được để trống'),
    excerpt: z
      .string()
      .max(500, 'Mô tả ngắn không được vượt quá 500 ký tự')
      .optional(),
    slug: z.string().optional(), // Auto-generate nếu không có
    image: z.string().optional(), // Ảnh thumbnail
    isPublished: z.boolean().default(false),
    tagIds: z.array(z.number()).optional(), // Array of tag IDs
  })
  .transform((data) => {
    // Auto-generate slug if not provided
    if (!data.slug) {
      data.slug = generateSlug(data.title);
    }
    return data;
  });

export type CreateArticleDto = z.infer<typeof CreateArticleSchema>;

export const UpdateArticleSchema = z.object({
  title: z.string().min(1, 'Tiêu đề không được để trống').optional(),
  content: z.string().optional(),
  contentMarkdown: z
    .string()
    .min(1, 'Nội dung Markdown không được để trống')
    .optional(),
  excerpt: z
    .string()
    .max(500, 'Mô tả ngắn không được vượt quá 500 ký tự')
    .optional(),
  slug: z.string().optional(),
  image: z.string().optional(),
  isPublished: z.boolean().optional(),
  tagIds: z.array(z.number()).optional(),
});

export type UpdateArticleDto = z.infer<typeof UpdateArticleSchema>;

// DTOs for image management
export const UploadArticleImageSchema = z.object({
  url: z.string().url('URL ảnh không hợp lệ'),
  alt: z.string().optional(),
  order: z.number().int().min(0).default(0),
});

export type UploadArticleImageDto = z.infer<typeof UploadArticleImageSchema>;

export const UpdateArticleImageSchema = z.object({
  alt: z.string().optional(),
  order: z.number().int().min(0).optional(),
});

export type UpdateArticleImageDto = z.infer<typeof UpdateArticleImageSchema>;

// DTOs for tag management
export const AddArticleTagsSchema = z.object({
  tagIds: z.array(z.number().int().positive()).min(1, 'Phải có ít nhất 1 tag'),
});

export type AddArticleTagsDto = z.infer<typeof AddArticleTagsSchema>;

// DTO Classes for Swagger
export class CreateArticleDtoClass {
  @ApiProperty({
    description: 'Tiêu đề bài viết',
    example: 'Cách chăm sóc sức khỏe tại nhà',
  })
  title: string;

  @ApiProperty({
    description: 'Nội dung bài viết (backward compatibility)',
    example: 'Bài viết về các cách chăm sóc sức khỏe...',
    required: false,
  })
  content?: string;

  @ApiProperty({
    description: 'Nội dung bài viết dạng Markdown',
    example: '# Tiêu đề\n\nNội dung bài viết...',
  })
  contentMarkdown: string;

  @ApiProperty({
    description: 'Mô tả ngắn bài viết',
    example: 'Bài viết hướng dẫn cách chăm sóc sức khỏe tại nhà',
    required: false,
  })
  excerpt?: string;

  @ApiProperty({
    description: 'URL thân thiện (slug). Tự động tạo từ title nếu không có',
    example: 'cach-cham-soc-suc-khoe-tai-nha',
    required: false,
  })
  slug?: string;

  @ApiProperty({
    description: 'URL ảnh thumbnail bài viết',
    example: 'https://example.com/image.jpg',
    required: false,
  })
  image?: string;

  @ApiProperty({
    description: 'Trạng thái publish',
    example: false,
    default: false,
  })
  isPublished?: boolean;

  @ApiProperty({
    description: 'Danh sách ID tags',
    example: [1, 2, 3],
    required: false,
    type: [Number],
  })
  tagIds?: number[];
}

export class UpdateArticleDtoClass {
  @ApiProperty({
    description: 'Tiêu đề bài viết',
    example: 'Cách chăm sóc sức khỏe tại nhà',
    required: false,
  })
  title?: string;

  @ApiProperty({
    description: 'Nội dung bài viết (backward compatibility)',
    example: 'Bài viết về các cách chăm sóc sức khỏe...',
    required: false,
  })
  content?: string;

  @ApiProperty({
    description: 'Nội dung bài viết dạng Markdown',
    example: '# Tiêu đề\n\nNội dung bài viết...',
    required: false,
  })
  contentMarkdown?: string;

  @ApiProperty({
    description: 'Mô tả ngắn bài viết',
    example: 'Bài viết hướng dẫn cách chăm sóc sức khỏe tại nhà',
    required: false,
  })
  excerpt?: string;

  @ApiProperty({
    description: 'URL thân thiện (slug)',
    example: 'cach-cham-soc-suc-khoe-tai-nha',
    required: false,
  })
  slug?: string;

  @ApiProperty({
    description: 'URL ảnh thumbnail bài viết',
    example: 'https://example.com/image.jpg',
    required: false,
  })
  image?: string;

  @ApiProperty({
    description: 'Trạng thái publish',
    example: true,
    required: false,
  })
  isPublished?: boolean;

  @ApiProperty({
    description: 'Danh sách ID tags',
    example: [1, 2, 3],
    required: false,
    type: [Number],
  })
  tagIds?: number[];
}

// Response DTOs
export class ArticleImageResponseDto {
  @ApiProperty({ description: 'ID ảnh', example: 1 })
  id: number;

  @ApiProperty({
    description: 'URL ảnh',
    example: 'https://example.com/image.jpg',
  })
  url: string;

  @ApiProperty({
    description: 'Alt text',
    example: 'Mô tả ảnh',
    required: false,
  })
  alt?: string;

  @ApiProperty({ description: 'Thứ tự hiển thị', example: 0 })
  order: number;

  @ApiProperty({ description: 'Ngày tạo' })
  createdAt: Date;
}

export class ArticleTagResponseDto {
  @ApiProperty({ description: 'ID tag', example: 1 })
  id: number;

  @ApiProperty({ description: 'Tên tag', example: 'Sức khỏe' })
  name: string;

  @ApiProperty({ description: 'Slug tag', example: 'suc-khoe' })
  slug: string;
}

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
    description: 'Nội dung bài viết (backward compatibility)',
    example: 'Bài viết về các cách chăm sóc sức khỏe...',
    required: false,
  })
  content?: string;

  @ApiProperty({
    description: 'Nội dung bài viết dạng Markdown',
    example: '# Tiêu đề\n\nNội dung...',
  })
  contentMarkdown: string;

  @ApiProperty({
    description: 'Mô tả ngắn',
    example: 'Bài viết hướng dẫn...',
    required: false,
  })
  excerpt?: string;

  @ApiProperty({
    description: 'URL thân thiện',
    example: 'cach-cham-soc-suc-khoe-tai-nha',
  })
  slug: string;

  @ApiProperty({
    description: 'Trạng thái publish',
    example: true,
  })
  isPublished: boolean;

  @ApiProperty({
    description: 'Ngày publish',
    example: '2023-10-28T10:00:00.000Z',
    required: false,
  })
  publishedAt?: Date;

  @ApiProperty({
    description: 'ID tác giả',
    example: 1,
    required: false,
  })
  authorId?: number;

  @ApiProperty({
    description: 'Lượt xem',
    example: 100,
  })
  views: number;

  @ApiProperty({
    description: 'URL ảnh thumbnail',
    example: 'https://example.com/image.jpg',
    nullable: true,
  })
  image?: string;

  @ApiProperty({
    description: 'Danh sách ảnh trong bài viết',
    type: [ArticleImageResponseDto],
    required: false,
  })
  images?: ArticleImageResponseDto[];

  @ApiProperty({
    description: 'Danh sách tags',
    type: [ArticleTagResponseDto],
    required: false,
  })
  tags?: ArticleTagResponseDto[];

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

  @ApiProperty({
    description: 'Lọc theo trạng thái publish',
    example: true,
    required: false,
  })
  isPublished?: boolean;

  @ApiProperty({
    description: 'Lọc theo tag ID',
    example: 1,
    required: false,
  })
  tagId?: number;
}
