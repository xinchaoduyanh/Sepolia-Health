import {
  Controller,
  Get,
  Post,
  Body,
  Param,
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
import { CurrentUser, Public } from '@/common/decorators';
import {
  GetDoctorServiceResponseDto,
  getTimeslotByDoctorIdAndDayResponseDto,
} from './dto/response';
import {
  CreateDoctorProfileBodyDto,
  GetDoctorServiceQueryDto,
  updateDoctorProfileBodyDto,
} from './dto/request';
import { SuccessResponseDto } from '@/common/dto';
import {
  CreateDoctorProfileResponseDto,
  GetDoctorProfileByServiceIdResponseDto,
} from './dto/response/doctor-profile.dto';

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
    type: PaginatedDto(GetDoctorServiceResponseDto),
  })
  @ApiOperation({
    description: 'get doctor service',
  })
  async getDoctorServices(
    @Query() dto: GetDoctorServiceQueryDto,
  ): Promise<PaginationResultDto<GetDoctorServiceResponseDto>> {
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

  @Post()
  @Public()
  @ApiResponse({
    status: HttpStatus.CREATED,
    type: CreateDoctorProfileResponseDto,
  })
  @ApiOperation({
    description: 'create doctor profile',
  })
  async createDoctorProfile(
    @Body() body: CreateDoctorProfileBodyDto,
    @CurrentUser('userId') userId: number,
  ): Promise<CreateDoctorProfileResponseDto> {
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
