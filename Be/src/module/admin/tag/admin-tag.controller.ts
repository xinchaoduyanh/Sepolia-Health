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
import { AdminTagService } from './admin-tag.service';
import {
  CreateTagDto,
  UpdateTagDto,
  CreateTagResponseDto,
  TagsListResponseDto,
  TagDetailResponseDto,
  UpdateTagResponseDto,
  CreateTagDtoClass,
  UpdateTagDtoClass,
  GetTagsQueryDto,
  CreateTagSchema,
  UpdateTagSchema,
  GetTagsQuerySchema,
} from './admin-tag.dto';
import { JwtAuthGuard, RolesGuard } from '@/common/guards';
import { Roles } from '@/common/decorators';
import { Role } from '@prisma/client';
import { CustomZodValidationPipe } from '@/common/pipes';
import { z } from 'zod';

@ApiTags('Admin Tag Management')
@Controller('admin/tags')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminTagController {
  constructor(private readonly adminTagService: AdminTagService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Tạo tag mới' })
  @ApiBody({ type: CreateTagDtoClass })
  @ApiResponse({
    status: 201,
    description: 'Tạo tag thành công',
    type: CreateTagResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  @ApiResponse({ status: 401, description: 'Không có quyền truy cập' })
  @ApiResponse({ status: 409, description: 'Tag đã tồn tại' })
  async createTag(
    @Body(new CustomZodValidationPipe(CreateTagSchema))
    createTagDto: CreateTagDto,
  ): Promise<CreateTagResponseDto> {
    return this.adminTagService.createTag(createTagDto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Lấy danh sách tags' })
  @ApiResponse({
    status: 200,
    description: 'Lấy danh sách tags thành công',
    type: TagsListResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Không có quyền truy cập' })
  async getTags(
    @Query(new CustomZodValidationPipe(GetTagsQuerySchema))
    query: GetTagsQueryDto,
  ): Promise<TagsListResponseDto> {
    return this.adminTagService.getTags(query);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Lấy chi tiết tag' })
  @ApiParam({
    name: 'id',
    description: 'ID của tag',
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Lấy chi tiết tag thành công',
    type: TagDetailResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Tag không tồn tại' })
  @ApiResponse({ status: 401, description: 'Không có quyền truy cập' })
  async getTag(
    @Param(
      'id',
      new CustomZodValidationPipe(z.coerce.number().int().positive()),
    )
    id: number,
  ): Promise<TagDetailResponseDto> {
    return this.adminTagService.getTag(id);
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cập nhật tag' })
  @ApiParam({
    name: 'id',
    description: 'ID của tag',
    type: Number,
    example: 1,
  })
  @ApiBody({ type: UpdateTagDtoClass })
  @ApiResponse({
    status: 200,
    description: 'Cập nhật tag thành công',
    type: UpdateTagResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Tag không tồn tại' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  @ApiResponse({ status: 401, description: 'Không có quyền truy cập' })
  @ApiResponse({ status: 409, description: 'Tag đã tồn tại' })
  async updateTag(
    @Param(
      'id',
      new CustomZodValidationPipe(z.coerce.number().int().positive()),
    )
    id: number,
    @Body(new CustomZodValidationPipe(UpdateTagSchema))
    updateTagDto: UpdateTagDto,
  ): Promise<UpdateTagResponseDto> {
    return this.adminTagService.updateTag(id, updateTagDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Xóa tag' })
  @ApiParam({
    name: 'id',
    description: 'ID của tag',
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Xóa tag thành công',
  })
  @ApiResponse({ status: 404, description: 'Tag không tồn tại' })
  @ApiResponse({ status: 401, description: 'Không có quyền truy cập' })
  @ApiResponse({
    status: 409,
    description: 'Tag đang được sử dụng, không thể xóa',
  })
  async deleteTag(
    @Param(
      'id',
      new CustomZodValidationPipe(z.coerce.number().int().positive()),
    )
    id: number,
  ): Promise<{ message: string }> {
    await this.adminTagService.deleteTag(id);
    return { message: 'Xóa tag thành công' };
  }
}
