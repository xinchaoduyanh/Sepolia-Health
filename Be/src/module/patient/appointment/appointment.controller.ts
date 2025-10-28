import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
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
import { AppointmentService } from './appointment.service';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Roles } from '@/common/decorators';
import { Role } from '@prisma/client';
import { TokenPayload } from '@/common/modules';
import {
  UpdateAppointmentDto,
  AppointmentResponseDto,
  GetAppointmentsQueryDto,
  GetAvailableDateQueryDto,
  GetDoctorServicesQueryDto,
  AppointmentsListResponseDto,
  GetDoctorAvailabilityQueryDto,
  CreateAppointmentFromDoctorServiceBodyDto,
} from './dto';

@ApiBearerAuth()
@Roles(Role.PATIENT)
@ApiTags('Patient Appointments')
@Controller('patient/appointments')
export class AppointmentController {
  constructor(private readonly appointmentService: AppointmentService) {}

  @Get(':id')
  @ApiOperation({ summary: 'Lấy thông tin lịch hẹn theo ID' })
  @ApiParam({ name: 'id', description: 'ID lịch hẹn' })
  @ApiResponse({ status: 200, description: 'Lấy thông tin thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy lịch hẹn' })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<AppointmentResponseDto> {
    return this.appointmentService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Cập nhật lịch hẹn' })
  @ApiParam({ name: 'id', description: 'ID lịch hẹn' })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy lịch hẹn' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateAppointmentDto: UpdateAppointmentDto,
    @CurrentUser() user: TokenPayload,
  ): Promise<AppointmentResponseDto> {
    return this.appointmentService.update(id, updateAppointmentDto, user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa lịch hẹn' })
  @ApiParam({ name: 'id', description: 'ID lịch hẹn' })
  @ApiResponse({ status: 200, description: 'Xóa thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy lịch hẹn' })
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: TokenPayload,
  ): Promise<{ message: string }> {
    return this.appointmentService.remove(id, user);
  }

  @Get('patient/my-appointments')
  @ApiOperation({ summary: 'Lấy lịch hẹn của bệnh nhân hiện tại' })
  @ApiResponse({ status: 200, description: 'Lấy danh sách thành công' })
  async getMyAppointments(
    @Query() query: GetAppointmentsQueryDto,
    @CurrentUser() user: TokenPayload,
  ): Promise<AppointmentsListResponseDto> {
    return this.appointmentService.getMyAppointments(query, user);
  }

  // ========== BOOKING APIS ==========
  @Get('booking/locations')
  @ApiOperation({ summary: 'Lấy danh sách cơ sở phòng khám (locations)' })
  @ApiResponse({ status: 200, description: 'Lấy danh sách cơ sở thành công' })
  async getLocations() {
    return this.appointmentService.getLocations();
  }

  @Get('booking/services')
  @ApiOperation({ summary: 'Lấy danh sách dịch vụ khám' })
  @ApiResponse({ status: 200, description: 'Lấy danh sách dịch vụ thành công' })
  async getServices() {
    return this.appointmentService.getServices();
  }

  @Get('booking/doctor-services')
  @ApiOperation({
    summary: 'Lấy danh sách bác sĩ cung cấp dịch vụ theo location và service',
  })
  @ApiResponse({ status: 200, description: 'Lấy danh sách bác sĩ thành công' })
  async getDoctorServices(@Query() query: GetDoctorServicesQueryDto) {
    return this.appointmentService.getDoctorServices(query);
  }

  @Get('booking/available-dates')
  @ApiOperation({
    summary:
      'Lấy danh sách các ngày bác sĩ có thể làm việc trong khoảng thời gian',
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
              dayOfWeek: { type: 'number' },
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
  async getAvailableDates(@Query() query: GetAvailableDateQueryDto) {
    return await this.appointmentService.getAvailableDates(query);
  }

  @Get('booking/doctor-availability')
  @ApiOperation({
    summary: 'Kiểm tra lịch bận của bác sĩ trong một ngày cụ thể',
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
  async getDoctorAvailability(@Query() query: GetDoctorAvailabilityQueryDto) {
    return await this.appointmentService.getDoctorAvailability(query);
  }

  @Post('booking/create')
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
  async createFromDoctorService(
    @Body() createAppointmentDto: CreateAppointmentFromDoctorServiceBodyDto,
    @CurrentUser() user: TokenPayload,
  ): Promise<AppointmentResponseDto> {
    return this.appointmentService.createFromDoctorService(
      createAppointmentDto,
      user,
    );
  }
}
