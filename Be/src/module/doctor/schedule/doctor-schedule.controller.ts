import {
  Controller,
  Get,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { DoctorScheduleService } from './doctor-schedule.service';
import {
  GetWeeklyScheduleQueryDto,
  WeeklyScheduleResponseDto,
  MonthlyScheduleResponseDto,
} from './dto/doctor-schedule.dto';
import { JwtAuthGuard, RolesGuard } from '@/common/guards';
import { Roles } from '@/common/decorators';
import { Role } from '@prisma/client';
import { CurrentUser } from '@/common/decorators';
import { CustomZodValidationPipe } from '@/common/pipes';
import {
  GetWeeklyScheduleQuerySchema,
  GetMonthlyScheduleQuerySchema,
  GetMonthlyScheduleQueryDto,
} from './dto/doctor-schedule.dto';

@ApiTags('Doctor Schedule')
@Controller('doctor/schedule')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.DOCTOR)
export class DoctorScheduleController {
  constructor(private readonly doctorScheduleService: DoctorScheduleService) {}

  @Get('weekly')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Lấy lịch làm việc theo tuần của bác sĩ' })
  @ApiResponse({
    status: 200,
    description: 'Lấy lịch làm việc thành công',
    type: WeeklyScheduleResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Chưa đăng nhập',
  })
  @ApiResponse({
    status: 404,
    description: 'Không tìm thấy hồ sơ bác sĩ',
  })
  async getWeeklySchedule(
    @CurrentUser('userId') userId: number,
    @Query(new CustomZodValidationPipe(GetWeeklyScheduleQuerySchema))
    query: GetWeeklyScheduleQueryDto,
  ): Promise<WeeklyScheduleResponseDto> {
    return this.doctorScheduleService.getWeeklySchedule(
      userId,
      query.weekStartDate,
    );
  }

  @Get('monthly')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Lấy lịch làm việc theo tháng của bác sĩ' })
  @ApiResponse({
    status: 200,
    description: 'Lấy lịch làm việc thành công',
    type: MonthlyScheduleResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Chưa đăng nhập',
  })
  @ApiResponse({
    status: 404,
    description: 'Không tìm thấy hồ sơ bác sĩ',
  })
  async getMonthlySchedule(
    @CurrentUser('userId') userId: number,
    @Query(new CustomZodValidationPipe(GetMonthlyScheduleQuerySchema))
    query: GetMonthlyScheduleQueryDto,
  ): Promise<MonthlyScheduleResponseDto> {
    return this.doctorScheduleService.getMonthlySchedule(
      userId,
      query.startDate,
      query.endDate,
    );
  }
}


