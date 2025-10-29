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
import { AdminServiceService } from './admin-service.service';
import {
  CreateServiceDto,
  UpdateServiceDto,
  CreateServiceResponseDto,
  ServicesListResponseDto,
  ServiceDetailResponseDto,
  UpdateServiceResponseDto,
  CreateServiceDtoClass,
  UpdateServiceDtoClass,
  GetServicesQueryDto,
  GetServicesQueryDtoClass,
  CreateServiceSchema,
  UpdateServiceSchema,
  GetServicesQuerySchema,
} from './admin-service.dto';
import { JwtAuthGuard, RolesGuard } from '@/common/guards';
import { Roles } from '@/common/decorators';
import { Role } from '@prisma/client';
import { CustomZodValidationPipe } from '@/common/pipes';
import { z } from 'zod';

@ApiTags('Admin Service Management')
@Controller('admin/services')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminServiceController {
  constructor(private readonly adminServiceService: AdminServiceService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Tạo dịch vụ mới' })
  @ApiBody({ type: CreateServiceDtoClass })
  @ApiResponse({
    status: 201,
    description: 'Tạo dịch vụ thành công',
    type: CreateServiceResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  @ApiResponse({ status: 401, description: 'Không có quyền truy cập' })
  async createService(
    @Body(new CustomZodValidationPipe(CreateServiceSchema))
    createServiceDto: CreateServiceDto,
  ): Promise<CreateServiceResponseDto> {
    return this.adminServiceService.createService(createServiceDto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Lấy danh sách dịch vụ' })
  @ApiResponse({
    status: 200,
    description: 'Lấy danh sách dịch vụ thành công',
    type: ServicesListResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Không có quyền truy cập' })
  async getServices(
    @Query(new CustomZodValidationPipe(GetServicesQuerySchema))
    query: GetServicesQueryDto,
  ): Promise<ServicesListResponseDto> {
    return this.adminServiceService.getServices(query);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Lấy chi tiết dịch vụ' })
  @ApiParam({
    name: 'id',
    description: 'ID của dịch vụ',
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Lấy chi tiết dịch vụ thành công',
    type: ServiceDetailResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Dịch vụ không tồn tại' })
  @ApiResponse({ status: 401, description: 'Không có quyền truy cập' })
  async getService(
    @Param('id', new CustomZodValidationPipe(z.coerce.number().int().positive()))
    id: number,
  ): Promise<ServiceDetailResponseDto> {
    return this.adminServiceService.getService(id);
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cập nhật dịch vụ' })
  @ApiParam({
    name: 'id',
    description: 'ID của dịch vụ',
    type: Number,
    example: 1,
  })
  @ApiBody({ type: UpdateServiceDtoClass })
  @ApiResponse({
    status: 200,
    description: 'Cập nhật dịch vụ thành công',
    type: UpdateServiceResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Dịch vụ không tồn tại' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  @ApiResponse({ status: 401, description: 'Không có quyền truy cập' })
  async updateService(
    @Param('id', new CustomZodValidationPipe(z.coerce.number().int().positive()))
    id: number,
    @Body(new CustomZodValidationPipe(UpdateServiceSchema))
    updateServiceDto: UpdateServiceDto,
  ): Promise<UpdateServiceResponseDto> {
    return this.adminServiceService.updateService(id, updateServiceDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Xóa dịch vụ' })
  @ApiParam({
    name: 'id',
    description: 'ID của dịch vụ',
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Xóa dịch vụ thành công',
  })
  @ApiResponse({ status: 404, description: 'Dịch vụ không tồn tại' })
  @ApiResponse({ status: 401, description: 'Không có quyền truy cập' })
  async deleteService(
    @Param('id', new CustomZodValidationPipe(z.coerce.number().int().positive()))
    id: number,
  ): Promise<{ message: string }> {
    await this.adminServiceService.deleteService(id);
    return { message: 'Xóa dịch vụ thành công' };
  }
}
