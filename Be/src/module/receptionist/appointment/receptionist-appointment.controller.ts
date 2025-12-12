import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  HttpStatus,
  Param,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ReceptionistAppointmentService } from './receptionist-appointment.service';
import { Roles } from '@/common/decorators';
import { Role } from '@prisma/client';
import { AppointmentDetailResponseDto } from '@/module/patient/appointment/dto';
import {
  FindPatientByEmailDto,
  CreatePatientAccountDto,
  CreateAppointmentForPatientDto,
  GetAppointmentsQueryDto,
  UpdateAppointmentDto,
} from './dto/request';
import {
  FindPatientResponseDto,
  CreatePatientAccountResponseDto,
  CreateAppointmentResponseDto,
  AppointmentsListResponseDto,
  AppointmentSummaryResponseDto,
} from './dto/response';
import { SuccessResponseDto } from '@/common/dto';

@ApiBearerAuth()
@Roles(Role.RECEPTIONIST)
@ApiTags('Receptionist Appointment')
@Controller('receptionist/appointment')
export class ReceptionistAppointmentController {
  constructor(
    private readonly receptionistAppointmentService: ReceptionistAppointmentService,
  ) { }

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách lịch hẹn' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lấy danh sách lịch hẹn thành công',
    type: AppointmentsListResponseDto,
  })
  async getAppointments(
    @Query() query: GetAppointmentsQueryDto,
  ): Promise<AppointmentsListResponseDto> {
    return this.receptionistAppointmentService.getAppointments(query);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Lấy thông tin tổng hợp lịch hẹn' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lấy thông tin tổng hợp lịch hẹn thành công',
    type: [AppointmentSummaryResponseDto],
  })
  async getAppointmentSummary(): Promise<AppointmentSummaryResponseDto[]> {
    return this.receptionistAppointmentService.getAppointmentSummary();
  }


  @Get('locations')
  @ApiOperation({ summary: 'Lấy danh sách cơ sở phòng khám' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lấy danh sách cơ sở thành công',
  })
  getLocations() {
    return this.receptionistAppointmentService.getLocations();
  }

  @Get('services')
  @ApiOperation({ summary: 'Lấy danh sách dịch vụ khám' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lấy danh sách dịch vụ thành công',
  })
  getServices() {
    return this.receptionistAppointmentService.getServices();
  }

  @Get('doctor-services')
  @ApiOperation({ summary: 'Lấy danh sách bác sĩ theo dịch vụ và cơ sở' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lấy danh sách bác sĩ thành công',
  })
  async getDoctorServices(
    @Query('serviceId', ParseIntPipe) serviceId: number,
    @Query('locationId', ParseIntPipe) locationId: number,
  ) {
    return this.receptionistAppointmentService.getDoctorServices({
      serviceId,
      locationId,
    });
  }

  @Get('doctor-availability')
  @ApiOperation({ summary: 'Lấy lịch trống của bác sĩ trong ngày' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lấy lịch trống thành công',
  })
  async getDoctorAvailability(
    @Query('doctorServiceId', ParseIntPipe) doctorServiceId: number,
    @Query('date') date: string,
  ) {
    return this.receptionistAppointmentService.getDoctorAvailability({
      doctorServiceId,
      date,
    });
  }

  @Patch(':appointmentId/check-in')
  @ApiOperation({ summary: 'Check in lịch hẹn' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Check in lịch hẹn thành công',
    type: SuccessResponseDto,
  })
  async checkInAppointment(
    @Param('appointmentId', ParseIntPipe) appointmentId: number,
  ): Promise<SuccessResponseDto> {
    return this.receptionistAppointmentService.checkInAppointment(appointmentId);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Hủy lịch hẹn' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Hủy lịch hẹn thành công',
    type: SuccessResponseDto,
  })
  async cancelAppointment(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<SuccessResponseDto> {
    return this.receptionistAppointmentService.cancelAppointment(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật lịch hẹn' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Cập nhật lịch hẹn thành công',
    type: SuccessResponseDto,
  })
  async updateAppointment(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateAppointmentDto,
  ): Promise<SuccessResponseDto> {
    return this.receptionistAppointmentService.updateAppointment(id, updateDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy thông tin chi tiết cuộc hẹn' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lấy thông tin cuộc hẹn thành công',
    type: AppointmentDetailResponseDto,
  })
  async getAppointmentDetail(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<AppointmentDetailResponseDto> {
    return this.receptionistAppointmentService.getAppointmentDetail(id);
  }

  @Post('find-patient')
  @ApiOperation({ summary: 'Tìm kiếm bệnh nhân qua email' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tìm kiếm bệnh nhân thành công',
    type: FindPatientResponseDto,
  })
  async findPatientByEmail(
    @Body() findPatientDto: FindPatientByEmailDto,
  ): Promise<FindPatientResponseDto> {
    return this.receptionistAppointmentService.findPatientByEmail(
      findPatientDto,
    );
  }

  @Post('create-patient')
  @ApiOperation({ summary: 'Tạo tài khoản bệnh nhân mới' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Tạo tài khoản bệnh nhân thành công',
    type: CreatePatientAccountResponseDto,
  })
  async createPatientAccount(
    @Body() createPatientDto: CreatePatientAccountDto,
  ): Promise<CreatePatientAccountResponseDto> {
    return this.receptionistAppointmentService.createPatientAccount(
      createPatientDto,
    );
  }

  @Post('create')
  @ApiOperation({ summary: 'Tạo lịch hẹn cho bệnh nhân' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Tạo lịch hẹn thành công',
    type: CreateAppointmentResponseDto,
  })
  async createAppointmentForPatient(
    @Body() createAppointmentDto: CreateAppointmentForPatientDto,
  ): Promise<CreateAppointmentResponseDto> {
    return this.receptionistAppointmentService.createAppointmentForPatient(
      createAppointmentDto,
    );
  }
}
