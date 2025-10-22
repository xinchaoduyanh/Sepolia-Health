import { Controller, Get, Param, HttpStatus, Query } from '@nestjs/common';
import { DoctorService } from './doctor.service';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Public } from '@/common/decorators';
import {
  GetDoctorServiceResponseDto,
  getTimeslotByDoctorIdAndDayResponseDto,
} from './dto/response';
import { GetDoctorServiceQueryDto } from './dto/request';
import { createPaginateSwaggerType, PaginationResponseDto } from '@/common/dto';
import { GetDoctorProfileByServiceIdResponseDto } from './dto/response/doctor-profile.dto';

@ApiBearerAuth()
@ApiTags('Patient Doctor')
@Controller('patient/doctor')
export class DoctorController {
  constructor(private readonly doctorService: DoctorService) {}

  @Get('services')
  @Public()
  @ApiResponse({
    status: HttpStatus.OK,
    type: createPaginateSwaggerType(GetDoctorServiceResponseDto),
  })
  @ApiOperation({
    description: 'get doctor service',
  })
  async getDoctorServices(
    @Query() dto: GetDoctorServiceQueryDto,
  ): Promise<PaginationResponseDto<GetDoctorServiceResponseDto>> {
    return this.doctorService.getDoctorServices(dto);
  }

  @Get()
  @Public()
  @ApiOperation({
    description: 'get doctor by service id',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: GetDoctorProfileByServiceIdResponseDto,
    isArray: true,
  })
  async getDoctorByServiceId(
    @Query('serviceId') serviceId: string,
  ): Promise<GetDoctorProfileByServiceIdResponseDto[]> {
    return this.doctorService.getDoctorByServiceId(Number(serviceId));
  }

  @Get('timeslot/:doctorId')
  @Public()
  @ApiResponse({
    status: HttpStatus.OK,
    type: getTimeslotByDoctorIdAndDayResponseDto,
    isArray: true,
  })
  @ApiOperation({
    description: 'get timeslot by doctor',
  })
  async getTimeslotByDoctorId(
    @Param('doctorId') doctorId: string,
  ): Promise<getTimeslotByDoctorIdAndDayResponseDto[]> {
    return this.doctorService.getTimeslotByDoctorIdAndDay(Number(doctorId));
  }
}
