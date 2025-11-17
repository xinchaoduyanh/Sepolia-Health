import {
  Controller,
  Get,
  HttpStatus,
  Param,
  ParseIntPipe,
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

@ApiBearerAuth()
@Roles(Role.RECEPTIONIST)
@ApiTags('Receptionist Appointment')
@Controller('receptionist/appointment')
export class ReceptionistAppointmentController {
  constructor(
    private readonly receptionistAppointmentService: ReceptionistAppointmentService,
  ) {}

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
}
