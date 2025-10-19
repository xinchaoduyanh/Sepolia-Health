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
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { AdminPatientService } from './admin-patient.service';
import {
  CreatePatientDto,
  UpdatePatientDto,
  CreatePatientResponseDto,
  PatientListResponseDto,
  PatientDetailResponseDto,
  CreatePatientDtoClass,
  UpdatePatientDtoClass,
  CreatePatientSchema,
  UpdatePatientSchema,
} from './admin-patient.dto';
import { JwtAuthGuard, RolesGuard } from '@/common/guards';
import { Roles, CurrentUser } from '@/common/decorators';
import { Role } from '@prisma/client';
import type { TokenPayload } from '@/common/types/jwt.type';
import { CustomZodValidationPipe } from '@/common/pipes';

@ApiTags('Admin Patient Management')
@Controller('admin/patients')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminPatientController {
  constructor(private readonly adminPatientService: AdminPatientService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Tạo tài khoản patient mới' })
  @ApiBody({ type: CreatePatientDtoClass })
  @ApiResponse({
    status: 201,
    description: 'Tạo patient thành công',
    type: CreatePatientResponseDto,
  })
  async createPatient(
    @Body(new CustomZodValidationPipe(CreatePatientSchema))
    createPatientDto: CreatePatientDto,
    @CurrentUser() admin: TokenPayload,
  ): Promise<CreatePatientResponseDto> {
    return this.adminPatientService.createPatient(
      createPatientDto,
      admin.userId,
    );
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Lấy danh sách patient' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiResponse({
    status: 200,
    description: 'Lấy danh sách thành công',
    type: PatientListResponseDto,
  })
  async getPatients(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
  ): Promise<PatientListResponseDto> {
    return this.adminPatientService.getPatients(page, limit, search);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Lấy thông tin chi tiết patient' })
  @ApiParam({ name: 'id', description: 'ID patient' })
  @ApiResponse({
    status: 200,
    description: 'Lấy thông tin thành công',
    type: PatientDetailResponseDto,
  })
  async getPatientById(
    @Param('id') id: string,
  ): Promise<PatientDetailResponseDto> {
    return this.adminPatientService.getPatientById(Number(id));
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cập nhật thông tin patient' })
  @ApiParam({ name: 'id', description: 'ID patient' })
  @ApiBody({ type: UpdatePatientDtoClass })
  @ApiResponse({
    status: 200,
    description: 'Cập nhật thành công',
    type: CreatePatientResponseDto,
  })
  async updatePatient(
    @Param('id') id: string,
    @Body(new CustomZodValidationPipe(UpdatePatientSchema))
    updatePatientDto: UpdatePatientDto,
  ): Promise<CreatePatientResponseDto> {
    return this.adminPatientService.updatePatient(Number(id), updatePatientDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Xóa patient' })
  @ApiParam({ name: 'id', description: 'ID patient' })
  @ApiResponse({
    status: 200,
    description: 'Xóa thành công',
  })
  async deletePatient(@Param('id') id: string): Promise<{ message: string }> {
    return this.adminPatientService.deletePatient(Number(id));
  }
}
