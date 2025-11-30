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
  Patch,
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
  UploadArticleImageDto,
  UploadArticleImageSchema,
  UpdateArticleImageDto,
  UpdateArticleImageSchema,
  AddArticleTagsDto,
  AddArticleTagsSchema,
} from './admin-article.dto';
import { JwtAuthGuard, RolesGuard } from '@/common/guards';
import { Roles, CurrentUser } from '@/common/decorators';
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
    @CurrentUser('userId') authorId: number,
    @Body(new CustomZodValidationPipe(CreateArticleSchema))
    createArticleDto: CreateArticleDto,
  ): Promise<CreateArticleResponseDto> {
    return this.adminArticleService.createArticle(createArticleDto, authorId);
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

  // Image Management Endpoints
  @Post(':id/images')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Upload ảnh cho bài viết' })
  @ApiParam({
    name: 'id',
    description: 'ID của bài viết',
    type: Number,
    example: 1,
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        url: { type: 'string', format: 'uri' },
        alt: { type: 'string' },
        order: { type: 'number', default: 0 },
      },
      required: ['url'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Upload ảnh thành công',
  })
  @ApiResponse({ status: 404, description: 'Bài viết không tồn tại' })
  async uploadArticleImage(
    @Param(
      'id',
      new CustomZodValidationPipe(z.coerce.number().int().positive()),
    )
    articleId: number,
    @Body(new CustomZodValidationPipe(UploadArticleImageSchema))
    imageDto: UploadArticleImageDto,
  ) {
    return this.adminArticleService.uploadArticleImage(articleId, imageDto);
  }

  @Delete(':id/images/:imageId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Xóa ảnh của bài viết' })
  @ApiParam({
    name: 'id',
    description: 'ID của bài viết',
    type: Number,
    example: 1,
  })
  @ApiParam({
    name: 'imageId',
    description: 'ID của ảnh',
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Xóa ảnh thành công',
  })
  @ApiResponse({ status: 404, description: 'Ảnh không tồn tại' })
  async deleteArticleImage(
    @Param(
      'id',
      new CustomZodValidationPipe(z.coerce.number().int().positive()),
    )
    articleId: number,
    @Param(
      'imageId',
      new CustomZodValidationPipe(z.coerce.number().int().positive()),
    )
    imageId: number,
  ): Promise<{ message: string }> {
    await this.adminArticleService.deleteArticleImage(articleId, imageId);
    return { message: 'Xóa ảnh thành công' };
  }

  @Patch(':id/images/:imageId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cập nhật thông tin ảnh' })
  @ApiParam({
    name: 'id',
    description: 'ID của bài viết',
    type: Number,
    example: 1,
  })
  @ApiParam({
    name: 'imageId',
    description: 'ID của ảnh',
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Cập nhật ảnh thành công',
  })
  async updateArticleImage(
    @Param(
      'id',
      new CustomZodValidationPipe(z.coerce.number().int().positive()),
    )
    articleId: number,
    @Param(
      'imageId',
      new CustomZodValidationPipe(z.coerce.number().int().positive()),
    )
    imageId: number,
    @Body(new CustomZodValidationPipe(UpdateArticleImageSchema))
    updateDto: UpdateArticleImageDto,
  ) {
    return this.adminArticleService.updateArticleImage(
      articleId,
      imageId,
      updateDto,
    );
  }

  // Publish/Unpublish Endpoints
  @Post(':id/publish')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Publish bài viết' })
  @ApiParam({
    name: 'id',
    description: 'ID của bài viết',
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Publish bài viết thành công',
    type: ArticleDetailResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bài viết đã được publish' })
  @ApiResponse({ status: 404, description: 'Bài viết không tồn tại' })
  async publishArticle(
    @Param(
      'id',
      new CustomZodValidationPipe(z.coerce.number().int().positive()),
    )
    id: number,
  ): Promise<ArticleDetailResponseDto> {
    return this.adminArticleService.publishArticle(id);
  }

  @Post(':id/unpublish')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unpublish bài viết' })
  @ApiParam({
    name: 'id',
    description: 'ID của bài viết',
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Unpublish bài viết thành công',
    type: ArticleDetailResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bài viết chưa được publish' })
  @ApiResponse({ status: 404, description: 'Bài viết không tồn tại' })
  async unpublishArticle(
    @Param(
      'id',
      new CustomZodValidationPipe(z.coerce.number().int().positive()),
    )
    id: number,
  ): Promise<ArticleDetailResponseDto> {
    return this.adminArticleService.unpublishArticle(id);
  }

  // Tag Management Endpoints
  @Post(':id/tags')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Thêm tags cho bài viết' })
  @ApiParam({
    name: 'id',
    description: 'ID của bài viết',
    type: Number,
    example: 1,
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        tagIds: {
          type: 'array',
          items: { type: 'number' },
          minItems: 1,
        },
      },
      required: ['tagIds'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Thêm tags thành công',
    type: ArticleDetailResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Một hoặc nhiều tag không tồn tại' })
  @ApiResponse({ status: 404, description: 'Bài viết không tồn tại' })
  async addTags(
    @Param(
      'id',
      new CustomZodValidationPipe(z.coerce.number().int().positive()),
    )
    articleId: number,
    @Body(new CustomZodValidationPipe(AddArticleTagsSchema))
    addTagsDto: AddArticleTagsDto,
  ): Promise<ArticleDetailResponseDto> {
    return this.adminArticleService.addTags(articleId, addTagsDto);
  }

  @Delete(':id/tags/:tagId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Xóa tag khỏi bài viết' })
  @ApiParam({
    name: 'id',
    description: 'ID của bài viết',
    type: Number,
    example: 1,
  })
  @ApiParam({
    name: 'tagId',
    description: 'ID của tag',
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Xóa tag thành công',
  })
  @ApiResponse({ status: 404, description: 'Tag không tồn tại trong bài viết' })
  async removeTag(
    @Param(
      'id',
      new CustomZodValidationPipe(z.coerce.number().int().positive()),
    )
    articleId: number,
    @Param(
      'tagId',
      new CustomZodValidationPipe(z.coerce.number().int().positive()),
    )
    tagId: number,
  ): Promise<{ message: string }> {
    await this.adminArticleService.removeTag(articleId, tagId);
    return { message: 'Xóa tag thành công' };
  }

  // View Count Endpoint
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
  async incrementViews(
    @Param(
      'id',
      new CustomZodValidationPipe(z.coerce.number().int().positive()),
    )
    id: number,
  ): Promise<{ message: string }> {
    await this.adminArticleService.incrementViews(id);
    return { message: 'Tăng lượt xem thành công' };
  }
}
