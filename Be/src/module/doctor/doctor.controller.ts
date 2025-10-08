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
  Put,
} from '@nestjs/common';
import { DoctorService } from './doctor.service';
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
import { CurrentUser, Public } from '@/common/decorators';
import { DoctorProfileDto } from './dto/response/doctor-profile.dto';
import { getTimeslotByDoctorIdAndDayResponseDto } from './dto/response';
import {
  CreateDoctorProfileBodyDto,
  GetDoctorServiceQueryDto,
  updateDoctorProfileBodyDto,
} from './dto/request';
import { SuccessResponseDto } from '@/common/dto';

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

  @Post()
  @Public()
  async createDoctorProfile(
    @Body() body: CreateDoctorProfileBodyDto,
    @CurrentUser('userId') userId: number,
  ) {
    return this.doctorService.createDoctorProfile(body, userId);
  }

  @Put()
  @Public()
  @ApiResponse({
    status: HttpStatus.OK,
    type: SuccessResponseDto,
  })
  @ApiOperation({
    description: 'update doctor profile',
  })
  async updateDoctorProfile(
    @Body() body: updateDoctorProfileBodyDto,
    @CurrentUser('userId') userId: number,
  ): Promise<SuccessResponseDto> {
    return this.doctorService.updateDoctorProfile(body, userId);
  }
}
