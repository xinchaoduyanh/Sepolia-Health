import {
  Controller,
  Get,
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
} from '@nestjs/swagger';
import { AdminAppointmentService } from './admin-appointment.service';
import {
  GetAppointmentsDto,
  AppointmentListResponseDto,
  AppointmentDetailResponseDto,
} from './admin-appointment.dto';
import { JwtAuthGuard, RolesGuard } from '@/common/guards';
import { Roles } from '@/common/decorators';
import { Role } from '@prisma/client';
import { CustomZodValidationPipe } from '@/common/pipes';
import { GetAppointmentsSchema } from './admin-appointment.dto';

@ApiTags('Admin Appointment Management')
@Controller('admin/appointments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminAppointmentController {
  constructor(
    private readonly adminAppointmentService: AdminAppointmentService,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Lấy danh sách cuộc hẹn' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Trang hiện tại',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Số lượng mỗi trang',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Tìm kiếm theo tên bệnh nhân, số điện thoại',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    type: String,
    description: 'Lọc theo trạng thái cuộc hẹn',
  })
  @ApiQuery({
    name: 'billingStatus',
    required: false,
    type: String,
    description: 'Lọc theo trạng thái thanh toán (từ billing)',
  })
  @ApiQuery({
    name: 'doctorId',
    required: false,
    type: Number,
    description: 'Lọc theo bác sĩ',
  })
  @ApiQuery({
    name: 'clinicId',
    required: false,
    type: Number,
    description: 'Lọc theo phòng khám',
  })
  @ApiQuery({
    name: 'dateFrom',
    required: false,
    type: String,
    description: 'Lọc từ ngày (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'dateTo',
    required: false,
    type: String,
    description: 'Lọc đến ngày (YYYY-MM-DD)',
  })
  @ApiResponse({
    status: 200,
    description: 'Lấy danh sách cuộc hẹn thành công',
    type: AppointmentListResponseDto,
  })
  async getAppointments(
    @Query(new CustomZodValidationPipe(GetAppointmentsSchema))
    query: GetAppointmentsDto,
  ): Promise<AppointmentListResponseDto> {
    return this.adminAppointmentService.getAppointments(query);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Lấy thông tin chi tiết cuộc hẹn' })
  @ApiParam({ name: 'id', description: 'ID cuộc hẹn', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Lấy thông tin cuộc hẹn thành công',
    type: AppointmentDetailResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Không tìm thấy cuộc hẹn',
  })
  async getAppointmentById(
    @Param('id') id: string,
  ): Promise<AppointmentDetailResponseDto> {
    return this.adminAppointmentService.getAppointmentById(Number(id));
  }
}
