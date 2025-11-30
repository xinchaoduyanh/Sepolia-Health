import {
  Controller,
  Get,
  Post,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { AdminArticleService } from '../../admin/article/admin-article.service';
import {
  ArticlesListResponseDto,
  ArticleDetailResponseDto,
} from '../../admin/article/admin-article.dto';
import { JwtAuthGuard } from '@/common/guards';
import { CustomZodValidationPipe } from '@/common/pipes';
import { z } from 'zod';

// Schema for query parameters
const GetArticlesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().optional(),
  isPublished: z.coerce.boolean().default(true),
  tagId: z.coerce.number().int().positive().optional(),
});

type GetArticlesQueryDto = z.infer<typeof GetArticlesQuerySchema>;

@ApiTags('Patient Articles')
@Controller('patient/articles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class PatientArticleController {
  constructor(private readonly adminArticleService: AdminArticleService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Lấy danh sách bài viết đã published' })
  @ApiResponse({
    status: 200,
    description: 'Lấy danh sách bài viết thành công',
    type: ArticlesListResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Không có quyền truy cập' })
  async getPublishedArticles(
    @Query(new CustomZodValidationPipe(GetArticlesQuerySchema))
    query: GetArticlesQueryDto,
  ): Promise<ArticlesListResponseDto> {
    // Only return published articles for patients
    return this.adminArticleService.getArticles({
      ...query,
      isPublished: true, // Force isPublished to true for patients
    });
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Lấy chi tiết bài viết đã published' })
  @ApiParam({
    name: 'id',
    description: 'ID của bài viết',
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Lấy chi tiết bài viết thành công',
    type: ArticleDetailResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Bài viết không tồn tại hoặc chưa được published' })
  @ApiResponse({ status: 401, description: 'Không có quyền truy cập' })
  async getPublishedArticle(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ArticleDetailResponseDto> {
    return this.adminArticleService.getPublishedArticle(id);
  }

  @Post(':id/views')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Tăng lượt xem bài viết' })
  @ApiParam({
    name: 'id',
    description: 'ID của bài viết',
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Tăng lượt xem thành công',
  })
  @ApiResponse({ status: 404, description: 'Bài viết không tồn tại' })
  async incrementViews(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ message: string }> {
    await this.adminArticleService.incrementViews(id);
    return { message: 'Tăng lượt xem thành công' };
  }
}