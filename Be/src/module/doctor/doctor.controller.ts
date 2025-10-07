import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { DoctorService } from './doctor.service';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { UpdateDoctorDto } from './dto/update-doctor.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  PaginatedDto,
  PaginationResultDto,
} from '@/common/dto/pagination-result.dto';
import { DoctorProfile, Service } from '@prisma/client';
import { Public } from '@/common/decorators';
import { DoctorProfileDto } from './dto/response/doctor-profile.dto';
import { getTimeslotByDoctorIdAndDayResponseDto } from './dto/response';
import { GetDoctorServiceQueryDto } from './dto/request';

@Public()
@ApiBearerAuth()
@ApiTags('Doctor')
@Controller('doctor')
export class DoctorController {
  constructor(private readonly doctorService: DoctorService) {}

  @Get('services')
  @Public()
  @ApiResponse({
    status: HttpStatus.OK,
    // type: PaginatedDto(Service),
  })
  async getDoctorServices(
    @Query() dto: GetDoctorServiceQueryDto,
  ): Promise<PaginationResultDto<Service>> {
    return this.doctorService.getDoctorServices(dto);
  }

  @Get()
  @Public()
  async getDoctorByServiceId(@Query('serviceId') serviceId: string) {
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
