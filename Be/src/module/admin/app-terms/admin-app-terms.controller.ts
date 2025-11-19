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
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { AdminAppTermsService } from './admin-app-terms.service';
import {
  CreateAppTermsDto,
  UpdateAppTermsDto,
  CreateAppTermsResponseDto,
  AppTermsListResponseDto,
  AppTermsDetailResponseDto,
  UpdateAppTermsResponseDto,
  CreateAppTermsDtoClass,
  UpdateAppTermsDtoClass,
  GetAppTermsQueryDto,
  GetAppTermsQueryDtoClass,
  CreateAppTermsSchema,
  UpdateAppTermsSchema,
  GetAppTermsQuerySchema,
} from './admin-app-terms.dto';
import { JwtAuthGuard, RolesGuard } from '@/common/guards';
import { Roles } from '@/common/decorators';
import { Role, AppTermsType } from '@prisma/client';
import { CustomZodValidationPipe } from '@/common/pipes';

@ApiTags('Admin App Terms Management')
@Controller('admin/app-terms')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminAppTermsController {
  constructor(private readonly adminAppTermsService: AdminAppTermsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Tạo điều khoản mới' })
  @ApiBody({ type: CreateAppTermsDtoClass })
  @ApiResponse({
    status: 201,
    description: 'Tạo điều khoản thành công',
    type: CreateAppTermsResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  @ApiResponse({ status: 401, description: 'Không có quyền truy cập' })
  async createAppTerms(
    @Body(new CustomZodValidationPipe(CreateAppTermsSchema))
    createAppTermsDto: CreateAppTermsDto,
    @Request() req: any,
  ): Promise<CreateAppTermsResponseDto> {
    const userId = req.user?.id;
    return this.adminAppTermsService.createAppTerms(createAppTermsDto, userId);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Lấy danh sách điều khoản' })
  @ApiResponse({
    status: 200,
    description: 'Lấy danh sách điều khoản thành công',
    type: AppTermsListResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Không có quyền truy cập' })
  async getAppTerms(
    @Query(new CustomZodValidationPipe(GetAppTermsQuerySchema))
    query: GetAppTermsQueryDto,
  ): Promise<AppTermsListResponseDto> {
    return this.adminAppTermsService.getAppTerms(query);
  }

  @Get('type/:type')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Lấy điều khoản theo loại (bản đang active)' })
  @ApiParam({
    name: 'type',
    enum: AppTermsType,
    description: 'Loại điều khoản',
  })
  @ApiResponse({
    status: 200,
    description: 'Lấy điều khoản thành công',
    type: AppTermsDetailResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Không tìm thấy điều khoản' })
  @ApiResponse({ status: 401, description: 'Không có quyền truy cập' })
  async getAppTermsByType(
    @Param('type') type: AppTermsType,
  ): Promise<AppTermsDetailResponseDto> {
    return this.adminAppTermsService.getAppTermsByType(type);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Lấy chi tiết điều khoản' })
  @ApiParam({ name: 'id', description: 'ID điều khoản' })
  @ApiResponse({
    status: 200,
    description: 'Lấy chi tiết điều khoản thành công',
    type: AppTermsDetailResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Không tìm thấy điều khoản' })
  @ApiResponse({ status: 401, description: 'Không có quyền truy cập' })
  async getAppTermsById(
    @Param('id') id: string,
  ): Promise<AppTermsDetailResponseDto> {
    return this.adminAppTermsService.getAppTermsById(Number(id));
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cập nhật điều khoản' })
  @ApiParam({ name: 'id', description: 'ID điều khoản' })
  @ApiBody({ type: UpdateAppTermsDtoClass })
  @ApiResponse({
    status: 200,
    description: 'Cập nhật điều khoản thành công',
    type: UpdateAppTermsResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Không tìm thấy điều khoản' })
  @ApiResponse({ status: 401, description: 'Không có quyền truy cập' })
  async updateAppTerms(
    @Param('id') id: string,
    @Body(new CustomZodValidationPipe(UpdateAppTermsSchema))
    updateAppTermsDto: UpdateAppTermsDto,
    @Request() req: any,
  ): Promise<UpdateAppTermsResponseDto> {
    const userId = req.user?.id;
    return this.adminAppTermsService.updateAppTerms(
      Number(id),
      updateAppTermsDto,
      userId,
    );
  }

  @Put(':id/activate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Kích hoạt điều khoản (áp dụng bản này)' })
  @ApiParam({ name: 'id', description: 'ID điều khoản' })
  @ApiResponse({
    status: 200,
    description: 'Kích hoạt điều khoản thành công',
    type: UpdateAppTermsResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Không tìm thấy điều khoản' })
  @ApiResponse({ status: 400, description: 'Điều khoản đã được kích hoạt' })
  @ApiResponse({ status: 401, description: 'Không có quyền truy cập' })
  async activateAppTerms(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<UpdateAppTermsResponseDto> {
    const userId = req.user?.id;
    return this.adminAppTermsService.activateAppTerms(Number(id), userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Xóa điều khoản' })
  @ApiParam({ name: 'id', description: 'ID điều khoản' })
  @ApiResponse({
    status: 204,
    description: 'Xóa điều khoản thành công',
  })
  @ApiResponse({ status: 404, description: 'Không tìm thấy điều khoản' })
  @ApiResponse({
    status: 409,
    description: 'Không thể xóa điều khoản đang được áp dụng',
  })
  @ApiResponse({ status: 401, description: 'Không có quyền truy cập' })
  async deleteAppTerms(@Param('id') id: string): Promise<void> {
    return this.adminAppTermsService.deleteAppTerms(Number(id));
  }
}
