import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { AdminPromotionDisplayService } from './admin-promotion-display.service';
import {
  CreatePromotionDisplayDto,
  UpdatePromotionDisplayDto,
  CreatePromotionDisplayResponseDto,
  PromotionDisplayDetailResponseDto,
  UpdatePromotionDisplayResponseDto,
  ApplyPromotionDto,
  CreatePromotionDisplayDtoClass,
  UpdatePromotionDisplayDtoClass,
  ApplyPromotionDtoClass,
  CreatePromotionDisplaySchema,
  UpdatePromotionDisplaySchema,
  ApplyPromotionSchema,
} from './admin-promotion-display.dto';
import { JwtAuthGuard, RolesGuard } from '@/common/guards';
import { Roles } from '@/common/decorators';
import { Role } from '@prisma/client';
import { CustomZodValidationPipe } from '@/common/pipes';
import { CurrentUser } from '@/common/decorators/current-user.decorator';

@ApiTags('Admin Promotion Display Management')
@Controller('admin/promotion-displays')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminPromotionDisplayController {
  constructor(
    private readonly adminPromotionDisplayService: AdminPromotionDisplayService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Tạo cấu hình hiển thị promotion mới' })
  @ApiBody({ type: CreatePromotionDisplayDtoClass })
  @ApiResponse({
    status: 201,
    description: 'Tạo cấu hình hiển thị thành công',
    type: CreatePromotionDisplayResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  @ApiResponse({ status: 401, description: 'Không có quyền truy cập' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy promotion' })
  async createPromotionDisplay(
    @Body(new CustomZodValidationPipe(CreatePromotionDisplaySchema))
    createDto: CreatePromotionDisplayDto,
    @CurrentUser('userId') userId: number,
  ): Promise<CreatePromotionDisplayResponseDto> {
    return this.adminPromotionDisplayService.createPromotionDisplay(
      createDto,
      userId,
    );
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Lấy danh sách tất cả cấu hình hiển thị' })
  @ApiResponse({
    status: 200,
    description: 'Lấy danh sách thành công',
    type: [PromotionDisplayDetailResponseDto],
  })
  @ApiResponse({ status: 401, description: 'Không có quyền truy cập' })
  async getPromotionDisplays(): Promise<PromotionDisplayDetailResponseDto[]> {
    return this.adminPromotionDisplayService.getPromotionDisplays();
  }

  @Get('active')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Lấy cấu hình hiển thị đang active' })
  @ApiResponse({
    status: 200,
    description: 'Lấy cấu hình active thành công',
    type: PromotionDisplayDetailResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Không có cấu hình active' })
  @ApiResponse({ status: 401, description: 'Không có quyền truy cập' })
  async getActivePromotionDisplay(): Promise<PromotionDisplayDetailResponseDto | null> {
    return this.adminPromotionDisplayService.getActivePromotionDisplay();
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Lấy chi tiết cấu hình hiển thị' })
  @ApiParam({ name: 'id', type: 'number', description: 'ID cấu hình hiển thị' })
  @ApiResponse({
    status: 200,
    description: 'Lấy chi tiết thành công',
    type: PromotionDisplayDetailResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Không tìm thấy cấu hình' })
  @ApiResponse({ status: 401, description: 'Không có quyền truy cập' })
  async getPromotionDisplay(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<PromotionDisplayDetailResponseDto> {
    return this.adminPromotionDisplayService.getPromotionDisplay(id);
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cập nhật cấu hình hiển thị' })
  @ApiParam({ name: 'id', type: 'number', description: 'ID cấu hình hiển thị' })
  @ApiBody({ type: UpdatePromotionDisplayDtoClass })
  @ApiResponse({
    status: 200,
    description: 'Cập nhật thành công',
    type: UpdatePromotionDisplayResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy cấu hình' })
  @ApiResponse({ status: 401, description: 'Không có quyền truy cập' })
  async updatePromotionDisplay(
    @Param('id', ParseIntPipe) id: number,
    @Body(new CustomZodValidationPipe(UpdatePromotionDisplaySchema))
    updateDto: UpdatePromotionDisplayDto,
    @CurrentUser('userId') userId: number,
  ): Promise<UpdatePromotionDisplayResponseDto> {
    return this.adminPromotionDisplayService.updatePromotionDisplay(
      id,
      updateDto,
      userId,
    );
  }

  @Put(':id/apply-promotion')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Áp dụng promotion vào display' })
  @ApiParam({ name: 'id', type: 'number', description: 'ID cấu hình hiển thị' })
  @ApiBody({ type: ApplyPromotionDtoClass })
  @ApiResponse({
    status: 200,
    description: 'Áp dụng promotion thành công',
    type: UpdatePromotionDisplayResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Promotion không còn hiệu lực' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy' })
  @ApiResponse({ status: 401, description: 'Không có quyền truy cập' })
  async applyPromotionToDisplay(
    @Param('id', ParseIntPipe) id: number,
    @Body(new CustomZodValidationPipe(ApplyPromotionSchema))
    applyDto: ApplyPromotionDto,
  ): Promise<UpdatePromotionDisplayResponseDto> {
    return this.adminPromotionDisplayService.applyPromotionToDisplay(
      id,
      applyDto,
    );
  }

  @Put(':id/activate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Kích hoạt cấu hình hiển thị' })
  @ApiParam({ name: 'id', type: 'number', description: 'ID cấu hình hiển thị' })
  @ApiResponse({
    status: 200,
    description: 'Kích hoạt thành công',
    type: UpdatePromotionDisplayResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Không tìm thấy cấu hình' })
  @ApiResponse({ status: 401, description: 'Không có quyền truy cập' })
  async activatePromotionDisplay(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<UpdatePromotionDisplayResponseDto> {
    return this.adminPromotionDisplayService.activatePromotionDisplay(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Xóa cấu hình hiển thị' })
  @ApiParam({ name: 'id', type: 'number', description: 'ID cấu hình hiển thị' })
  @ApiResponse({
    status: 200,
    description: 'Xóa thành công',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Xóa cấu hình hiển thị thành công',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Không thể xóa cấu hình đang active',
  })
  @ApiResponse({ status: 404, description: 'Không tìm thấy cấu hình' })
  @ApiResponse({ status: 401, description: 'Không có quyền truy cập' })
  async deletePromotionDisplay(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ message: string }> {
    return this.adminPromotionDisplayService.deletePromotionDisplay(id);
  }
}
