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
import { AdminClinicService } from './admin-clinic.service';
import {
  CreateClinicDto,
  UpdateClinicDto,
  CreateClinicResponseDto,
  ClinicsListResponseDto,
  ClinicDetailResponseDto,
  UpdateClinicResponseDto,
  CreateClinicDtoClass,
  UpdateClinicDtoClass,
  GetClinicsQueryDto,
  GetClinicsQueryDtoClass,
  CreateClinicSchema,
  UpdateClinicSchema,
  GetClinicsQuerySchema,
} from './admin-clinic.dto';
import { JwtAuthGuard, RolesGuard } from '@/common/guards';
import { Roles } from '@/common/decorators';
import { Role } from '@prisma/client';
import { CustomZodValidationPipe } from '@/common/pipes';
import { z } from 'zod';

@ApiTags('Admin Clinic Management')
@Controller('admin/clinics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminClinicController {
  constructor(private readonly adminClinicService: AdminClinicService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Tạo phòng khám mới' })
  @ApiBody({ type: CreateClinicDtoClass })
  @ApiResponse({
    status: 201,
    description: 'Tạo phòng khám thành công',
    type: CreateClinicResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  @ApiResponse({ status: 401, description: 'Không có quyền truy cập' })
  async createClinic(
    @Body(new CustomZodValidationPipe(CreateClinicSchema))
    createClinicDto: CreateClinicDto,
  ): Promise<CreateClinicResponseDto> {
    return this.adminClinicService.createClinic(createClinicDto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Lấy danh sách phòng khám' })
  @ApiResponse({
    status: 200,
    description: 'Lấy danh sách phòng khám thành công',
    type: ClinicsListResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Không có quyền truy cập' })
  async getClinics(
    @Query(new CustomZodValidationPipe(GetClinicsQuerySchema))
    query: GetClinicsQueryDto,
  ): Promise<ClinicsListResponseDto> {
    return this.adminClinicService.getClinics(query);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Lấy chi tiết phòng khám' })
  @ApiParam({
    name: 'id',
    description: 'ID của phòng khám',
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Lấy chi tiết phòng khám thành công',
    type: ClinicDetailResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Phòng khám không tồn tại' })
  @ApiResponse({ status: 401, description: 'Không có quyền truy cập' })
  async getClinic(
    @Param(
      'id',
      new CustomZodValidationPipe(z.coerce.number().int().positive()),
    )
    id: number,
  ): Promise<ClinicDetailResponseDto> {
    return this.adminClinicService.getClinic(id);
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cập nhật phòng khám' })
  @ApiParam({
    name: 'id',
    description: 'ID của phòng khám',
    type: Number,
    example: 1,
  })
  @ApiBody({ type: UpdateClinicDtoClass })
  @ApiResponse({
    status: 200,
    description: 'Cập nhật phòng khám thành công',
    type: UpdateClinicResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Phòng khám không tồn tại' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  @ApiResponse({ status: 401, description: 'Không có quyền truy cập' })
  async updateClinic(
    @Param(
      'id',
      new CustomZodValidationPipe(z.coerce.number().int().positive()),
    )
    id: number,
    @Body(new CustomZodValidationPipe(UpdateClinicSchema))
    updateClinicDto: UpdateClinicDto,
  ): Promise<UpdateClinicResponseDto> {
    return this.adminClinicService.updateClinic(id, updateClinicDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Xóa phòng khám' })
  @ApiParam({
    name: 'id',
    description: 'ID của phòng khám',
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Xóa phòng khám thành công',
  })
  @ApiResponse({ status: 404, description: 'Phòng khám không tồn tại' })
  @ApiResponse({ status: 401, description: 'Không có quyền truy cập' })
  async deleteClinic(
    @Param(
      'id',
      new CustomZodValidationPipe(z.coerce.number().int().positive()),
    )
    id: number,
  ): Promise<{ message: string }> {
    await this.adminClinicService.deleteClinic(id);
    return { message: 'Xóa phòng khám thành công' };
  }
}
