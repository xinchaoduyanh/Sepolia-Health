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
import { UpdateAppointmentDto } from './swagger';
import { AppointmentService } from './appointment.service';
import type {
  CreateAppointmentFromDoctorServiceDtoType,
  UpdateAppointmentDtoType,
  GetAppointmentsQueryDtoType,
  AppointmentResponseDtoType,
  AppointmentsListResponseDtoType,
} from './appointment.dto';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import type { TokenPayload } from '@/common/types/jwt.type';
import { JwtAuthGuard, RolesGuard } from '@/common/guards';
import { Roles } from '@/common/decorators';
import { Role } from '@prisma/client';

@ApiTags('Patient Appointments')
@Controller('patient/appointments')
@ApiBearerAuth()
export class AppointmentController {
  constructor(private readonly appointmentService: AppointmentService) {}

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PATIENT)
  @ApiOperation({ summary: 'Lấy thông tin lịch hẹn theo ID' })
  @ApiParam({ name: 'id', description: 'ID lịch hẹn' })
  @ApiResponse({ status: 200, description: 'Lấy thông tin thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy lịch hẹn' })
  // @ApiResponseOk(MESSAGES.APPOINTMENT.GET_SUCCESS)
  async findOne(@Param('id') id: string): Promise<AppointmentResponseDtoType> {
    return this.appointmentService.findOne(Number(id));
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PATIENT)
  @ApiOperation({ summary: 'Cập nhật lịch hẹn' })
  @ApiParam({ name: 'id', description: 'ID lịch hẹn' })
  @ApiBody({ type: UpdateAppointmentDto })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy lịch hẹn' })
  // @ApiResponseOk(MESSAGES.APPOINTMENT.UPDATE_SUCCESS)
  async update(
    @Param('id') id: string,
    @Body() updateAppointmentDto: UpdateAppointmentDtoType,
    @CurrentUser() user: TokenPayload,
  ): Promise<AppointmentResponseDtoType> {
    return this.appointmentService.update(
      Number(id),
      updateAppointmentDto,
      user,
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PATIENT)
  @ApiOperation({ summary: 'Xóa lịch hẹn' })
  @ApiParam({ name: 'id', description: 'ID lịch hẹn' })
  @ApiResponse({ status: 200, description: 'Xóa thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy lịch hẹn' })
  @HttpCode(HttpStatus.OK)
  // @ApiResponseOk(MESSAGES.APPOINTMENT.DELETE_SUCCESS)
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: TokenPayload,
  ): Promise<{ message: string }> {
    return this.appointmentService.remove(Number(id), user);
  }

  @Get('patient/my-appointments')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PATIENT)
  @ApiOperation({ summary: 'Lấy lịch hẹn của bệnh nhân hiện tại' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['scheduled', 'completed', 'cancelled'],
  })
  @ApiResponse({ status: 200, description: 'Lấy danh sách thành công' })
  // @ApiResponseOk(MESSAGES.PATIENT.GET_APPOINTMENTS_SUCCESS)
  async getMyAppointments(
    @Query() query: GetAppointmentsQueryDtoType,
    @CurrentUser() user: TokenPayload,
  ): Promise<AppointmentsListResponseDtoType> {
    return this.appointmentService.getMyAppointments(query, user);
  }

  // ========== BOOKING APIS ==========
  @Get('booking/locations')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PATIENT)
  @ApiOperation({ summary: 'Lấy danh sách cơ sở phòng khám (locations)' })
  @ApiResponse({ status: 200, description: 'Lấy danh sách cơ sở thành công' })
  async getLocations() {
    return this.appointmentService.getLocations();
  }

  @Get('booking/services')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PATIENT)
  @ApiOperation({ summary: 'Lấy danh sách dịch vụ khám' })
  @ApiResponse({ status: 200, description: 'Lấy danh sách dịch vụ thành công' })
  async getServices() {
    return this.appointmentService.getServices();
  }

  @Get('booking/doctor-services')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PATIENT)
  @ApiOperation({
    summary: 'Lấy danh sách bác sĩ cung cấp dịch vụ theo location và service',
  })
  @ApiQuery({
    name: 'locationId',
    required: true,
    type: Number,
    description: 'ID cơ sở phòng khám',
  })
  @ApiQuery({
    name: 'serviceId',
    required: true,
    type: Number,
    description: 'ID dịch vụ',
  })
  @ApiResponse({ status: 200, description: 'Lấy danh sách bác sĩ thành công' })
  async getDoctorServices(
    @Query('locationId') locationId: string,
    @Query('serviceId') serviceId: string,
  ) {
    return this.appointmentService.getDoctorServices(
      Number(locationId),
      Number(serviceId),
    );
  }

  @Get('booking/available-dates')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PATIENT)
  @ApiOperation({
    summary:
      'Lấy danh sách các ngày bác sĩ có thể làm việc trong khoảng thời gian',
  })
  @ApiQuery({
    name: 'doctorServiceId',
    required: true,
    type: Number,
    description: 'ID DoctorService',
  })
  @ApiQuery({
    name: 'startDate',
    required: true,
    type: String,
    description: 'Ngày bắt đầu (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'endDate',
    required: true,
    type: String,
    description: 'Ngày kết thúc (YYYY-MM-DD)',
  })
  @ApiResponse({
    status: 200,
    description: 'Lấy danh sách ngày khả dụng thành công',
    schema: {
      type: 'object',
      properties: {
        doctorId: { type: 'number' },
        doctorName: { type: 'string' },
        specialty: { type: 'string' },
        serviceName: { type: 'string' },
        serviceDuration: { type: 'number' },
        availableDates: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              date: { type: 'string' },
              dayOfWeek: { type: 'string' },
              workingHours: {
                type: 'object',
                properties: {
                  startTime: { type: 'string' },
                  endTime: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  @ApiResponse({
    status: 404,
    description: 'Dịch vụ bác sĩ không tồn tại',
  })
  async getAvailableDates(
    @Query('doctorServiceId') doctorServiceId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return await this.appointmentService.getAvailableDates(
      Number(doctorServiceId),
      startDate,
      endDate,
    );
  }

  @Get('booking/doctor-availability')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PATIENT)
  @ApiOperation({
    summary: 'Kiểm tra lịch bận của bác sĩ trong một ngày cụ thể',
  })
  @ApiQuery({
    name: 'doctorServiceId',
    required: true,
    type: Number,
    description: 'ID DoctorService',
  })
  @ApiQuery({
    name: 'date',
    required: true,
    type: String,
    description: 'Ngày cần kiểm tra (YYYY-MM-DD)',
  })
  @ApiResponse({
    status: 200,
    description: 'Lấy lịch bận thành công',
    schema: {
      type: 'object',
      properties: {
        doctorId: { type: 'number' },
        doctorName: { type: 'string' },
        specialty: { type: 'string' },
        serviceName: { type: 'string' },
        serviceDuration: { type: 'number' },
        date: { type: 'string' },
        workingHours: {
          type: 'object',
          properties: {
            startTime: { type: 'string' },
            endTime: { type: 'string' },
          },
        },
        occupiedTimeSlots: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              startTime: { type: 'string' },
              endTime: { type: 'string' },
            },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  @ApiResponse({
    status: 404,
    description: 'Bác sĩ không làm việc vào ngày này',
  })
  async getDoctorAvailability(
    @Query('doctorServiceId') doctorServiceId: string,
    @Query('date') date: string,
  ) {
    return await this.appointmentService.getDoctorAvailability(
      Number(doctorServiceId),
      date,
    );
  }

  @Post('booking/create')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PATIENT)
  @ApiOperation({ summary: 'Tạo lịch hẹn từ DoctorService' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        doctorServiceId: { type: 'number', description: 'ID DoctorService' },
        date: {
          type: 'string',
          format: 'date',
          description: 'Ngày hẹn',
        },
        startTime: {
          type: 'string',
          pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$',
          description: 'Thời gian bắt đầu (HH:mm)',
        },
        notes: { type: 'string', description: 'Ghi chú' },
        patientProfileId: {
          type: 'number',
          description: 'ID hồ sơ bệnh nhân (tùy chọn)',
        },
        patientName: { type: 'string', description: 'Họ tên bệnh nhân' },
        patientDob: {
          type: 'string',
          format: 'date',
          description: 'Ngày sinh',
        },
        patientPhone: { type: 'string', description: 'Số điện thoại' },
        patientGender: {
          type: 'string',
          enum: ['MALE', 'FEMALE', 'OTHER'],
          description: 'Giới tính',
        },
      },
      required: [
        'doctorServiceId',
        'date',
        'startTime',
        'patientName',
        'patientDob',
        'patientPhone',
        'patientGender',
      ],
    },
  })
  @ApiResponse({ status: 201, description: 'Tạo lịch hẹn thành công' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  @ApiResponse({ status: 401, description: 'Không có quyền truy cập' })
  @HttpCode(HttpStatus.CREATED)
  async createFromDoctorService(
    @Body() createAppointmentDto: CreateAppointmentFromDoctorServiceDtoType,
    @CurrentUser() user: TokenPayload,
  ): Promise<AppointmentResponseDtoType> {
    return this.appointmentService.createFromDoctorService(
      createAppointmentDto,
      user,
    );
  }
}
