import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { AdminArticleService } from './admin-article.service';
import {
  CreateArticleDto,
  UpdateArticleDto,
  CreateArticleResponseDto,
  ArticlesListResponseDto,
  ArticleDetailResponseDto,
  UpdateArticleResponseDto,
  CreateArticleDtoClass,
  UpdateArticleDtoClass,
  GetArticlesQueryDto,
  GetArticlesQueryDtoClass,
  CreateArticleSchema,
  UpdateArticleSchema,
  GetArticlesQuerySchema,
} from './admin-article.dto';
import { JwtAuthGuard, RolesGuard } from '@/common/guards';
import { Roles } from '@/common/decorators';
import { Role } from '@prisma/client';
import { CustomZodValidationPipe } from '@/common/pipes';
import { z } from 'zod';

@ApiTags('Admin Article Management')
@Controller('admin/articles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminArticleController {
  constructor(private readonly adminArticleService: AdminArticleService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Tạo bài viết mới' })
  @ApiBody({ type: CreateArticleDtoClass })
  @ApiResponse({
    status: 201,
    description: 'Tạo bài viết thành công',
    type: CreateArticleResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  @ApiResponse({ status: 401, description: 'Không có quyền truy cập' })
  async createArticle(
    @Body(new CustomZodValidationPipe(CreateArticleSchema))
    createArticleDto: CreateArticleDto,
  ): Promise<CreateArticleResponseDto> {
    return this.adminArticleService.createArticle(createArticleDto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Lấy danh sách bài viết' })
  @ApiResponse({
    status: 200,
    description: 'Lấy danh sách bài viết thành công',
    type: ArticlesListResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Không có quyền truy cập' })
  async getArticles(
    @Query(new CustomZodValidationPipe(GetArticlesQuerySchema))
    query: GetArticlesQueryDto,
  ): Promise<ArticlesListResponseDto> {
    return this.adminArticleService.getArticles(query);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Lấy chi tiết bài viết' })
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
  @ApiResponse({ status: 404, description: 'Bài viết không tồn tại' })
  @ApiResponse({ status: 401, description: 'Không có quyền truy cập' })
  async getArticle(
    @Param(
      'id',
      new CustomZodValidationPipe(z.coerce.number().int().positive()),
    )
    id: number,
  ): Promise<ArticleDetailResponseDto> {
    return this.adminArticleService.getArticle(id);
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cập nhật bài viết' })
  @ApiParam({
    name: 'id',
    description: 'ID của bài viết',
    type: Number,
    example: 1,
  })
  @ApiBody({ type: UpdateArticleDtoClass })
  @ApiResponse({
    status: 200,
    description: 'Cập nhật bài viết thành công',
    type: UpdateArticleResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Bài viết không tồn tại' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  @ApiResponse({ status: 401, description: 'Không có quyền truy cập' })
  async updateArticle(
    @Param(
      'id',
      new CustomZodValidationPipe(z.coerce.number().int().positive()),
    )
    id: number,
    @Body(new CustomZodValidationPipe(UpdateArticleSchema))
    updateArticleDto: UpdateArticleDto,
  ): Promise<UpdateArticleResponseDto> {
    return this.adminArticleService.updateArticle(id, updateArticleDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Xóa bài viết' })
  @ApiParam({
    name: 'id',
    description: 'ID của bài viết',
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Xóa bài viết thành công',
  })
  @ApiResponse({ status: 404, description: 'Bài viết không tồn tại' })
  @ApiResponse({ status: 401, description: 'Không có quyền truy cập' })
  async deleteArticle(
    @Param(
      'id',
      new CustomZodValidationPipe(z.coerce.number().int().positive()),
    )
    id: number,
  ): Promise<{ message: string }> {
    await this.adminArticleService.deleteArticle(id);
    return { message: 'Xóa bài viết thành công' };
  }
}
