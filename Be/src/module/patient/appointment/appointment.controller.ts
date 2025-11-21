import {
  Controller,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  HttpStatus,
  Patch,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AppointmentService } from './appointment.service';
import { CurrentUser } from '@/common/decorators';
import { Roles } from '@/common/decorators';
import { Role } from '@prisma/client';
import {
  UpdateAppointmentDto,
  AppointmentDetailResponseDto,
  GetAppointmentsQueryDto,
  AppointmentsListResponseDto,
} from './dto';
import { SuccessResponseDto } from '@/common/dto';

@ApiBearerAuth()
@Roles(Role.PATIENT)
@ApiTags('Patient Appointments')
@Controller('patient/appointments')
export class AppointmentController {
  constructor(private readonly appointmentService: AppointmentService) {}

  @Put(':id')
  @ApiOperation({ summary: 'Cập nhật lịch hẹn' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Cập nhật thành công' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateAppointmentDto: UpdateAppointmentDto,
    @CurrentUser('userId') userId: number,
  ): Promise<AppointmentDetailResponseDto> {
    return this.appointmentService.update(id, updateAppointmentDto, userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Hủy lịch hẹn' })
  @ApiResponse({ status: HttpStatus.OK, type: SuccessResponseDto })
  async cancelAppointment(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('userId') userId: number,
  ): Promise<SuccessResponseDto> {
    return this.appointmentService.cancelAppointment(id, userId);
  }

  @Get('my-appointments')
  @ApiOperation({ summary: 'Lấy lịch hẹn của bệnh nhân hiện tại' })
  @ApiResponse({ status: HttpStatus.OK, type: AppointmentsListResponseDto, description: 'Lấy danh sách thành công' })
  async getMyAppointments(
    @Query() query: GetAppointmentsQueryDto,
    @CurrentUser('userId') userId: number,
  ): Promise<AppointmentsListResponseDto> {
    return this.appointmentService.getMyAppointments(query, userId);
  }

  @Get('closest')
  @ApiOperation({ summary: 'Lấy lịch hẹn gần nhất của bệnh nhân hiện tại' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Lấy lịch hẹn gần nhất thành công' })
  async getClosestAppointment(
    @CurrentUser('userId') userId: number,
  ): Promise<AppointmentDetailResponseDto | null> {
    return this.appointmentService.getClosestAppointment(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy thông tin lịch hẹn theo ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Lấy thông tin thành công' })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<AppointmentDetailResponseDto> {
    return this.appointmentService.findOne(id);
  }
}
