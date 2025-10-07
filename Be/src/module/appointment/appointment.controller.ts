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
import { CreateAppointmentDto, UpdateAppointmentDto } from './swagger';
import { AppointmentService } from './appointment.service';
import type {
  CreateAppointmentDtoType,
  UpdateAppointmentDtoType,
  GetAppointmentsQueryDtoType,
  AppointmentResponseDtoType,
  AppointmentsListResponseDtoType,
} from './appointment.dto';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import type { TokenPayload } from '@/common/types/jwt.type';
import { JwtAuthGuard, RolesGuard } from '@/common/guards';
import { Roles } from '@/common/decorators';

@ApiTags('Appointments')
@Controller('appointments')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AppointmentController {
  constructor(private readonly appointmentService: AppointmentService) {}

  @Post()
  @ApiOperation({ summary: 'Tạo lịch hẹn mới' })
  @ApiBody({ type: CreateAppointmentDto })
  @ApiResponse({ status: 201, description: 'Tạo lịch hẹn thành công' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  @ApiResponse({ status: 401, description: 'Không có quyền truy cập' })
  @HttpCode(HttpStatus.CREATED)
  // @ApiResponseCreated(MESSAGES.APPOINTMENT.CREATE_SUCCESS)
  async create(
    @Body() createAppointmentDto: CreateAppointmentDtoType,
    @CurrentUser() user: TokenPayload,
  ): Promise<AppointmentResponseDtoType> {
    return this.appointmentService.create(createAppointmentDto, user);
  }

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách lịch hẹn' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Trang',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Số lượng mỗi trang',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['scheduled', 'completed', 'cancelled'],
  })
  @ApiQuery({
    name: 'paymentStatus',
    required: false,
    enum: ['pending', 'paid', 'refunded'],
  })
  @ApiQuery({ name: 'doctorId', required: false, type: String })
  @ApiQuery({ name: 'patientId', required: false, type: String })
  @ApiQuery({ name: 'dateFrom', required: false, type: String })
  @ApiQuery({ name: 'dateTo', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Lấy danh sách thành công' })
  // @ApiResponseOk(MESSAGES.APPOINTMENT.LIST_SUCCESS)
  async findAll(
    @Query() query: GetAppointmentsQueryDtoType,
  ): Promise<AppointmentsListResponseDtoType> {
    return this.appointmentService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy thông tin lịch hẹn theo ID' })
  @ApiParam({ name: 'id', description: 'ID lịch hẹn' })
  @ApiResponse({ status: 200, description: 'Lấy thông tin thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy lịch hẹn' })
  // @ApiResponseOk(MESSAGES.APPOINTMENT.GET_SUCCESS)
  async findOne(@Param('id') id: string): Promise<AppointmentResponseDtoType> {
    return this.appointmentService.findOne(Number(id));
  }

  @Put(':id')
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

  @Get('doctor/my-appointments')
  @ApiOperation({ summary: 'Lấy lịch hẹn của bác sĩ hiện tại' })
  @Roles('DOCTOR', 'ADMIN')
  @UseGuards(RolesGuard)
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['scheduled', 'completed', 'cancelled'],
  })
  @ApiResponse({ status: 200, description: 'Lấy danh sách thành công' })
  // @ApiResponseOk(MESSAGES.DOCTOR.GET_APPOINTMENTS_SUCCESS)
  async getDoctorAppointments(
    @Query() query: GetAppointmentsQueryDtoType,
    @CurrentUser() user: TokenPayload,
  ): Promise<AppointmentsListResponseDtoType> {
    return this.appointmentService.getDoctorAppointments(query, user);
  }
}
