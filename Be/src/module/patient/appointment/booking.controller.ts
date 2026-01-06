import { Role } from '@prisma/client';
import { Roles } from '@/common/decorators';
import { Body, Controller, Get, HttpStatus, Post, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AppointmentService } from './appointment.service';
import { CurrentUser } from '@/common/decorators';
import {
  AppointmentDetailResponseDto,
  CreateAppointmentFromDoctorServiceBodyDto,
  GetAvailableDateQueryDto,
  GetDoctorAvailabilityQueryDto,
  GetDoctorAvailabilityResponseDto,
  GetDoctorServicesQueryDto,
  GetAvailabilityDateResponseDto,
} from './dto';

@ApiBearerAuth()
@Roles(Role.PATIENT)
@ApiTags('Patient Appointment Booking')
@Controller('patient/appointment/booking')
export class BookingController {
  constructor(private readonly appointmentService: AppointmentService) {}

  @Get('locations')
  @ApiOperation({ summary: 'Lấy danh sách cơ sở phòng khám (locations)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lấy danh sách cơ sở thành công',
  })
  async getLocations() {
    return this.appointmentService.getLocations();
  }

  @Get('services')
  @ApiOperation({ summary: 'Lấy danh sách dịch vụ khám' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lấy danh sách dịch vụ thành công',
  })
  async getServices() {
    return this.appointmentService.getServices();
  }

  @Get('doctor')
  @ApiOperation({
    summary: 'Lấy danh sách bác sĩ cung cấp dịch vụ theo service và location',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lấy danh sách bác sĩ thành công',
  })
  async getDoctorServices(@Query() query: GetDoctorServicesQueryDto) {
    return this.appointmentService.getDoctorServices(query);
  }

  @Get('available-dates')
  @ApiOperation({
    summary:
      'Lấy danh sách các ngày bác sĩ có thể làm việc trong khoảng thời gian',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lấy danh sách ngày khả dụng thành công',
  })
  async getAvailableDates(
    @Query() query: GetAvailableDateQueryDto,
  ): Promise<GetAvailabilityDateResponseDto> {
    return this.appointmentService.getAvailableDates(query);
  }

  @Roles(Role.RECEPTIONIST)
  @Get('doctor-availability')
  @ApiOperation({
    summary: 'Kiểm tra lịch bận của bác sĩ trong một ngày cụ thể',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: GetDoctorAvailabilityResponseDto,
    description: 'Lấy lịch bận thành công',
  })
  async getDoctorAvailability(
    @Query() query: GetDoctorAvailabilityQueryDto,
  ): Promise<GetDoctorAvailabilityResponseDto> {
    return this.appointmentService.getDoctorAvailability(query);
  }

  @Post('create')
  @ApiOperation({ summary: 'Tạo lịch hẹn từ DoctorService' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Tạo lịch hẹn thành công',
  })
  async createFromDoctorService(
    @Body() createAppointmentDto: CreateAppointmentFromDoctorServiceBodyDto,
    @CurrentUser('userId') userId: number,
  ): Promise<AppointmentDetailResponseDto> {
    return this.appointmentService.createFromDoctorService(
      createAppointmentDto,
      userId,
    );
  }
}
