import {
  Controller,
  Get,
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
  AppointmentsListResponseDto,
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
}
