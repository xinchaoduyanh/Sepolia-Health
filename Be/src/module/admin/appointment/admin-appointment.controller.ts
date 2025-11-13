import {
  Controller,
  Get,
  HttpStatus,
  Param,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AdminAppointmentService } from './admin-appointment.service';
import {
  AppointmentListResponseDto,
  AppointmentDetailResponseDto,
  GetAppointmentQueryDto,
} from './admin-appointment.dto';
import { Roles } from '@/common/decorators';
import { Role } from '@prisma/client';

@ApiBearerAuth()
@Roles(Role.ADMIN)
@Controller('admin/appointments')
@ApiTags('Admin Appointment Management')
export class AdminAppointmentController {
  constructor(
    private readonly adminAppointmentService: AdminAppointmentService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách cuộc hẹn' })
  @ApiResponse({
    status: HttpStatus.OK,
    type: AppointmentListResponseDto,
  })
  async getAppointments(
    @Query() query: GetAppointmentQueryDto,
  ): Promise<AppointmentListResponseDto> {
    return this.adminAppointmentService.getAppointments(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy thông tin chi tiết cuộc hẹn' })
  @ApiResponse({
    status: HttpStatus.OK,
    type: AppointmentDetailResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Không tìm thấy cuộc hẹn',
  })
  async getAppointmentById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<AppointmentDetailResponseDto> {
    return this.adminAppointmentService.getAppointmentById(id);
  }
}
