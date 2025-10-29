import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
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
import { AdminDoctorService } from './admin-doctor.service';
import {
  CreateDoctorDto,
  UpdateDoctorDto,
  UpdateDoctorStatusDto,
  CreateDoctorResponseDto,
  DoctorListResponseDto,
  DoctorDetailResponseDto,
  CreateDoctorScheduleDto,
  CreateDoctorDtoClass,
  UpdateDoctorDtoClass,
  UpdateDoctorStatusDtoClass,
  CreateDoctorScheduleDtoClass,
  CreateDoctorSchema,
  UpdateDoctorSchema,
  UpdateDoctorStatusSchema,
  CreateDoctorScheduleSchema,
  GetDoctorsQueryDto,
  GetDoctorsQuerySchema,
} from './admin-doctor.dto';
import { JwtAuthGuard, RolesGuard } from '@/common/guards';
import { Roles } from '@/common/decorators';
import { Role } from '@prisma/client';
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
  @ApiResponse({
    status: 200,
    description: 'Lấy danh sách thành công',
    type: DoctorListResponseDto,
  })
  async getDoctors(
    @Query(new CustomZodValidationPipe(GetDoctorsQuerySchema))
    query: GetDoctorsQueryDto,
  ): Promise<DoctorListResponseDto> {
    return this.adminDoctorService.getDoctors(query);
  }

  @Get('clinics/list')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Lấy danh sách cơ sở phòng khám' })
  @ApiResponse({
    status: 200,
    description: 'Lấy danh sách cơ sở thành công',
  })
  async getClinics() {
    return this.adminDoctorService.getClinics();
  }

  @Get('services/list')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Lấy danh sách dịch vụ' })
  @ApiResponse({
    status: 200,
    description: 'Lấy danh sách dịch vụ thành công',
  })
  async getServices() {
    return this.adminDoctorService.getServices();
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

  @Put(':id/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cập nhật trạng thái bác sĩ' })
  @ApiParam({ name: 'id', description: 'ID bác sĩ' })
  @ApiBody({ type: UpdateDoctorStatusDtoClass })
  @ApiResponse({
    status: 200,
    description: 'Cập nhật trạng thái thành công',
    type: CreateDoctorResponseDto,
  })
  async updateDoctorStatus(
    @Param('id') id: string,
    @Body(new CustomZodValidationPipe(UpdateDoctorStatusSchema))
    updateStatusDto: UpdateDoctorStatusDto,
  ): Promise<CreateDoctorResponseDto> {
    return this.adminDoctorService.updateDoctorStatus(
      Number(id),
      updateStatusDto,
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Xóa bác sĩ (soft delete)' })
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
