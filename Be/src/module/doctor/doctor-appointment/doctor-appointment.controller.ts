import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  ParseIntPipe,
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
} from '@nestjs/swagger';
import { DoctorAppointmentService } from './doctor-appointment.service';
import {
  GetDoctorAppointmentsQueryDto,
  DoctorAppointmentsListResponseDto,
  DoctorAppointmentDetailDto,
  CreateAppointmentResultDto,
  AppointmentResultDto,
} from './dto';
import { JwtAuthGuard, RolesGuard } from '@/common/guards';
import { Roles } from '@/common/decorators';
import { Role } from '@prisma/client';
import { CurrentUser } from '@/common/decorators';

@ApiTags('Doctor Appointments')
@Controller('doctor/appointments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.DOCTOR)
export class DoctorAppointmentController {
  constructor(
    private readonly doctorAppointmentService: DoctorAppointmentService,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Lấy danh sách appointments của doctor' })
  @ApiResponse({
    status: 200,
    description: 'Lấy danh sách thành công',
    type: DoctorAppointmentsListResponseDto,
  })
  async getAppointments(
    @Query() query: GetDoctorAppointmentsQueryDto,
    @CurrentUser('userId') userId: number,
  ): Promise<DoctorAppointmentsListResponseDto> {
    return this.doctorAppointmentService.getDoctorAppointments(query, userId);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Lấy chi tiết appointment của doctor' })
  @ApiParam({ name: 'id', type: 'number', description: 'ID appointment' })
  @ApiResponse({
    status: 200,
    description: 'Lấy chi tiết thành công',
    type: DoctorAppointmentDetailDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Không có quyền xem appointment này',
  })
  @ApiResponse({
    status: 404,
    description: 'Không tìm thấy appointment',
  })
  async getAppointmentById(
    @Param('id', ParseIntPipe) appointmentId: number,
    @CurrentUser('userId') userId: number,
  ): Promise<DoctorAppointmentDetailDto> {
    return this.doctorAppointmentService.getAppointmentById(
      appointmentId,
      userId,
    );
  }

  @Post(':id/result')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Tạo hoặc cập nhật kết quả khám cho appointment',
  })
  @ApiParam({ name: 'id', type: 'number', description: 'ID appointment' })
  @ApiResponse({
    status: 201,
    description: 'Tạo/cập nhật kết quả thành công',
    type: AppointmentResultDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Appointment chưa hoàn thành hoặc dữ liệu không hợp lệ',
  })
  @ApiResponse({
    status: 403,
    description: 'Không có quyền tạo kết quả cho appointment này',
  })
  @ApiResponse({
    status: 404,
    description: 'Không tìm thấy appointment',
  })
  async createOrUpdateResult(
    @Param('id', ParseIntPipe) appointmentId: number,
    @Body() createResultDto: CreateAppointmentResultDto,
    @CurrentUser('userId') userId: number,
  ): Promise<AppointmentResultDto> {
    return this.doctorAppointmentService.createOrUpdateAppointmentResult(
      appointmentId,
      createResultDto,
      userId,
    );
  }

  @Put(':id/result')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cập nhật kết quả khám cho appointment' })
  @ApiParam({ name: 'id', type: 'number', description: 'ID appointment' })
  @ApiResponse({
    status: 200,
    description: 'Cập nhật kết quả thành công',
    type: AppointmentResultDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Appointment chưa hoàn thành hoặc dữ liệu không hợp lệ',
  })
  @ApiResponse({
    status: 403,
    description: 'Không có quyền cập nhật kết quả cho appointment này',
  })
  @ApiResponse({
    status: 404,
    description: 'Không tìm thấy appointment',
  })
  async updateResult(
    @Param('id', ParseIntPipe) appointmentId: number,
    @Body() createResultDto: CreateAppointmentResultDto,
    @CurrentUser('userId') userId: number,
  ): Promise<AppointmentResultDto> {
    return this.doctorAppointmentService.createOrUpdateAppointmentResult(
      appointmentId,
      createResultDto,
      userId,
    );
  }
}
