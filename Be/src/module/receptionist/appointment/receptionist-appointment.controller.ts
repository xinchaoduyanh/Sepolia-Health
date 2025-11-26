import {
  Controller,
  Get,
  Post,
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
} from './dto/request';
import {
  FindPatientResponseDto,
  CreatePatientAccountResponseDto,
  CreateAppointmentResponseDto,
} from './dto/response';

@ApiBearerAuth()
@Roles(Role.RECEPTIONIST)
@ApiTags('Receptionist Appointment')
@Controller('receptionist/appointment')
export class ReceptionistAppointmentController {
  constructor(
    private readonly receptionistAppointmentService: ReceptionistAppointmentService,
  ) {}

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
