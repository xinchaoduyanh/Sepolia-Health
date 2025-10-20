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
import { AdminDoctorService } from './admin-doctor.service';
import {
  CreateDoctorDto,
  UpdateDoctorDto,
  CreateDoctorResponseDto,
  DoctorListResponseDto,
  DoctorDetailResponseDto,
  CreateDoctorScheduleDto,
  CreateDoctorDtoClass,
  UpdateDoctorDtoClass,
  CreateDoctorScheduleDtoClass,
  CreateDoctorSchema,
  UpdateDoctorSchema,
  CreateDoctorScheduleSchema,
} from './admin-doctor.dto';
import { JwtAuthGuard, RolesGuard } from '@/common/guards';
import { Roles, CurrentUser } from '@/common/decorators';
import { Role } from '@prisma/client';
import type { TokenPayload } from '@/common/types/jwt.type';
import { CustomZodValidationPipe } from '@/common/pipes';

@ApiTags('Admin Doctor Management')
@Controller('admin/doctors')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminDoctorController {
  constructor(private readonly adminDoctorService: AdminDoctorService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Tạo tài khoản bác sĩ mới' })
  @ApiBody({ type: CreateDoctorDtoClass })
  @ApiResponse({
    status: 201,
    description: 'Tạo bác sĩ thành công',
    type: CreateDoctorResponseDto,
  })
  async createDoctor(
    @Body(new CustomZodValidationPipe(CreateDoctorSchema))
    createDoctorDto: CreateDoctorDto,
  ): Promise<CreateDoctorResponseDto> {
    return this.adminDoctorService.createDoctor(createDoctorDto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Lấy danh sách bác sĩ' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiResponse({
    status: 200,
    description: 'Lấy danh sách thành công',
    type: DoctorListResponseDto,
  })
  async getDoctors(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
  ): Promise<DoctorListResponseDto> {
    return this.adminDoctorService.getDoctors(page, limit, search);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Lấy thông tin chi tiết bác sĩ' })
  @ApiParam({ name: 'id', description: 'ID bác sĩ' })
  @ApiResponse({
    status: 200,
    description: 'Lấy thông tin thành công',
    type: DoctorDetailResponseDto,
  })
  async getDoctorById(
    @Param('id') id: string,
  ): Promise<DoctorDetailResponseDto> {
    return this.adminDoctorService.getDoctorById(Number(id));
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cập nhật thông tin bác sĩ' })
  @ApiParam({ name: 'id', description: 'ID bác sĩ' })
  @ApiBody({ type: UpdateDoctorDtoClass })
  @ApiResponse({
    status: 200,
    description: 'Cập nhật thành công',
    type: CreateDoctorResponseDto,
  })
  async updateDoctor(
    @Param('id') id: string,
    @Body(new CustomZodValidationPipe(UpdateDoctorSchema))
    updateDoctorDto: UpdateDoctorDto,
  ): Promise<CreateDoctorResponseDto> {
    return this.adminDoctorService.updateDoctor(Number(id), updateDoctorDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Xóa bác sĩ' })
  @ApiParam({ name: 'id', description: 'ID bác sĩ' })
  @ApiResponse({
    status: 200,
    description: 'Xóa thành công',
  })
  async deleteDoctor(@Param('id') id: string): Promise<{ message: string }> {
    return this.adminDoctorService.deleteDoctor(Number(id));
  }

  @Post(':id/schedule')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Tạo lịch làm việc cho bác sĩ' })
  @ApiParam({ name: 'id', description: 'ID bác sĩ' })
  @ApiBody({ type: CreateDoctorScheduleDtoClass })
  @ApiResponse({
    status: 201,
    description: 'Tạo lịch làm việc thành công',
  })
  async createDoctorSchedule(
    @Param('id') id: string,
    @Body(new CustomZodValidationPipe(CreateDoctorScheduleSchema))
    createScheduleDto: CreateDoctorScheduleDto,
  ): Promise<{ message: string }> {
    return this.adminDoctorService.createDoctorSchedule(
      Number(id),
      createScheduleDto,
    );
  }

  @Get(':id/schedule')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Lấy lịch làm việc của bác sĩ' })
  @ApiParam({ name: 'id', description: 'ID bác sĩ' })
  @ApiResponse({
    status: 200,
    description: 'Lấy lịch làm việc thành công',
  })
  async getDoctorSchedule(@Param('id') id: string) {
    return this.adminDoctorService.getDoctorSchedule(Number(id));
  }
}
