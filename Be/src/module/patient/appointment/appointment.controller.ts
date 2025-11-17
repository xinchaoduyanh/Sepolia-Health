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
} from '@nestjs/swagger';
import { AppointmentService } from './appointment.service';
import { CurrentUser } from '@/common/decorators';
import { Roles } from '@/common/decorators';
import { Role } from '@prisma/client';
import {
  UpdateAppointmentDto,
  AppointmentDetailResponseDto,
  GetAppointmentsQueryDto,
  GetAvailableDateQueryDto,
  GetDoctorServicesQueryDto,
  AppointmentsListResponseDto,
  GetDoctorAvailabilityQueryDto,
  CreateAppointmentFromDoctorServiceBodyDto,
  GetDoctorAvailabilityResponseDto,
  GetAvailabilityDateResponseDto,
} from './dto';

@ApiBearerAuth()
@Roles(Role.PATIENT)
@ApiTags('Patient Appointments')
@Controller('patient/appointments')
export class AppointmentController {
  constructor(private readonly appointmentService: AppointmentService) {}

  @Put(':id')
  @ApiOperation({ summary: 'Cập nhật lịch hẹn' })
  @ApiParam({ name: 'id', description: 'ID lịch hẹn' })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy lịch hẹn' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateAppointmentDto: UpdateAppointmentDto,
    @CurrentUser('userId') userId: number,
  ): Promise<AppointmentDetailResponseDto> {
    return this.appointmentService.update(id, updateAppointmentDto, userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa lịch hẹn' })
  @ApiParam({ name: 'id', description: 'ID lịch hẹn' })
  @ApiResponse({ status: 200, description: 'Xóa thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy lịch hẹn' })
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('userId') userId: number,
  ): Promise<{ message: string }> {
    return this.appointmentService.remove(id, userId);
  }

  @Get('my-appointments')
  @ApiOperation({ summary: 'Lấy lịch hẹn của bệnh nhân hiện tại' })
  @ApiResponse({ status: 200, description: 'Lấy danh sách thành công' })
  async getMyAppointments(
    @Query() query: GetAppointmentsQueryDto,
    @CurrentUser('userId') userId: number,
  ): Promise<AppointmentsListResponseDto> {
    return this.appointmentService.getMyAppointments(query, userId);
  }

  @Get('closest')
  @ApiOperation({ summary: 'Lấy lịch hẹn gần nhất của bệnh nhân hiện tại' })
  @ApiResponse({ status: 200, description: 'Lấy lịch hẹn gần nhất thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy lịch hẹn' })
  async getClosestAppointment(
    @CurrentUser('userId') userId: number,
  ): Promise<AppointmentDetailResponseDto | null> {
    return this.appointmentService.getClosestAppointment(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy thông tin lịch hẹn theo ID' })
  @ApiParam({ name: 'id', description: 'ID lịch hẹn' })
  @ApiResponse({ status: 200, description: 'Lấy thông tin thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy lịch hẹn' })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<AppointmentDetailResponseDto> {
    return this.appointmentService.findOne(id);
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
  })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  @ApiResponse({
    status: 404,
    description: 'Dịch vụ bác sĩ không tồn tại',
  })
  async getAvailableDates(
    @Query() query: GetAvailableDateQueryDto,
  ): Promise<GetAvailabilityDateResponseDto> {
    return this.appointmentService.getAvailableDates(query);
  }

  @Get('booking/doctor-availability')
  @ApiOperation({
    summary: 'Kiểm tra lịch bận của bác sĩ trong một ngày cụ thể',
  })
  @ApiResponse({
    status: 200,
    description: 'Lấy lịch bận thành công',
  })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  @ApiResponse({
    status: 404,
    description: 'Bác sĩ không làm việc vào ngày này',
  })
  async getDoctorAvailability(
    @Query() query: GetDoctorAvailabilityQueryDto,
  ): Promise<GetDoctorAvailabilityResponseDto> {
    return this.appointmentService.getDoctorAvailability(query);
  }

  @Post('booking/create')
  @ApiOperation({ summary: 'Tạo lịch hẹn từ DoctorService' })
  @ApiResponse({ status: 201, description: 'Tạo lịch hẹn thành công' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  @ApiResponse({ status: 401, description: 'Không có quyền truy cập' })
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
