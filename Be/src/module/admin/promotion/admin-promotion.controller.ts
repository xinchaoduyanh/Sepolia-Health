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
import { AdminPromotionService } from './admin-promotion.service';
import {
  CreatePromotionDto,
  UpdatePromotionDto,
  CreatePromotionResponseDto,
  PromotionsListResponseDto,
  PromotionDetailResponseDto,
  UpdatePromotionResponseDto,
  GetPromotionsQueryDto,
  CreatePromotionDtoClass,
  UpdatePromotionDtoClass,
  GetPromotionsQueryDtoClass,
  CreatePromotionSchema,
  UpdatePromotionSchema,
  GetPromotionsQuerySchema,
} from './admin-promotion.dto';
import { JwtAuthGuard, RolesGuard } from '@/common/guards';
import { Roles } from '@/common/decorators';
import { Role } from '@prisma/client';
import { CustomZodValidationPipe } from '@/common/pipes';
import { CurrentUser } from '@/common/decorators/current-user.decorator';

@ApiTags('Admin Promotion Management')
@Controller('admin/promotions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminPromotionController {
  constructor(private readonly adminPromotionService: AdminPromotionService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Tạo chương trình khuyến mãi mới' })
  @ApiBody({ type: CreatePromotionDtoClass })
  @ApiResponse({
    status: 201,
    description: 'Tạo chương trình khuyến mãi thành công',
    type: CreatePromotionResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  @ApiResponse({ status: 401, description: 'Không có quyền truy cập' })
  @ApiResponse({ status: 409, description: 'Mã voucher đã tồn tại' })
  async createPromotion(
    @Body(new CustomZodValidationPipe(CreatePromotionSchema))
    createPromotionDto: CreatePromotionDto,
    @CurrentUser('userId') userId: number,
  ): Promise<CreatePromotionResponseDto> {
    return this.adminPromotionService.createPromotion(
      createPromotionDto,
      userId,
    );
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Lấy danh sách chương trình khuyến mãi' })
  @ApiResponse({
    status: 200,
    description: 'Lấy danh sách chương trình khuyến mãi thành công',
    type: PromotionsListResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Không có quyền truy cập' })
  async getPromotions(
    @Query(new CustomZodValidationPipe(GetPromotionsQuerySchema))
    query: GetPromotionsQueryDto,
  ): Promise<PromotionsListResponseDto> {
    return this.adminPromotionService.getPromotions(query);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Lấy chi tiết chương trình khuyến mãi' })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'ID chương trình khuyến mãi',
  })
  @ApiResponse({
    status: 200,
    description: 'Lấy chi tiết chương trình khuyến mãi thành công',
    type: PromotionDetailResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Không tìm thấy chương trình khuyến mãi',
  })
  @ApiResponse({ status: 401, description: 'Không có quyền truy cập' })
  async getPromotion(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<PromotionDetailResponseDto> {
    return this.adminPromotionService.getPromotion(id);
  }

  @Get(':id/qr-data')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Lấy dữ liệu chữ ký QR hiện tại' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'Lấy dữ liệu thành công',
  })
  async getPromotionQrData(
    @Param('id', ParseIntPipe) id: number,
    @Query('interval', ParseIntPipe) interval: number = 30,
  ) {
    return this.adminPromotionService.getQrData(id, interval);
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cập nhật chương trình khuyến mãi' })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'ID chương trình khuyến mãi',
  })
  @ApiBody({ type: UpdatePromotionDtoClass })
  @ApiResponse({
    status: 200,
    description: 'Cập nhật chương trình khuyến mãi thành công',
    type: UpdatePromotionResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  @ApiResponse({
    status: 404,
    description: 'Không tìm thấy chương trình khuyến mãi',
  })
  @ApiResponse({ status: 401, description: 'Không có quyền truy cập' })
  @ApiResponse({ status: 409, description: 'Mã voucher đã tồn tại' })
  async updatePromotion(
    @Param('id', ParseIntPipe) id: number,
    @Body(new CustomZodValidationPipe(UpdatePromotionSchema))
    updatePromotionDto: UpdatePromotionDto,
    @CurrentUser('userId') userId: number,
  ): Promise<UpdatePromotionResponseDto> {
    return this.adminPromotionService.updatePromotion(
      id,
      updatePromotionDto,
      userId,
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Xóa chương trình khuyến mãi' })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'ID chương trình khuyến mãi',
  })
  @ApiResponse({
    status: 200,
    description: 'Xóa chương trình khuyến mãi thành công',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Xóa chương trình khuyến mãi thành công',
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Không tìm thấy chương trình khuyến mãi',
  })
  @ApiResponse({
    status: 400,
    description: 'Không thể xóa chương trình đang được sử dụng',
  })
  @ApiResponse({ status: 401, description: 'Không có quyền truy cập' })
  async deletePromotion(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ message: string }> {
    return this.adminPromotionService.deletePromotion(id);
  }

  @Post(':id/renew-qr')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Làm mới mã QR (Vô hiệu hóa các mã QR cũ)' })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'ID chương trình khuyến mãi',
  })
  @ApiResponse({
    status: 200,
    description: 'Làm mới mã QR thành công',
  })
  @ApiResponse({
    status: 404,
    description: 'Không tìm thấy chương trình khuyến mãi',
  })
  async renewPromotionQr(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ message: string }> {
    return this.adminPromotionService.renewPromotionQrSignature(id);
  }
}
