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
  ApiQuery,
} from '@nestjs/swagger';
import { AdminStatisticsService } from './admin-statistics.service';
import {
  UserStatisticsResponseDto,
  AppointmentStatisticsResponseDto,
  DashboardStatisticsResponseDto,
  RevenueStatisticsResponseDto,
  MonthlyAppointmentsResponseDto,
} from './admin-statistics.dto';
import { JwtAuthGuard, RolesGuard } from '@/common/guards';
import { Roles } from '@/common/decorators';
import { Role } from '@prisma/client';

@ApiTags('Admin Statistics')
@Controller('admin/statistics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminStatisticsController {
  constructor(
    private readonly adminStatisticsService: AdminStatisticsService,
  ) {}

  @Get('users')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Thống kê người dùng (patient/doctor/receptionist)',
  })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiResponse({
    status: 200,
    description: 'Lấy thống kê người dùng thành công',
    type: UserStatisticsResponseDto,
  })
  async getUserStatistics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<UserStatisticsResponseDto> {
    return this.adminStatisticsService.getUserStatistics(startDate, endDate);
  }

  @Get('appointments')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Thống kê lịch hẹn' })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiResponse({
    status: 200,
    description: 'Lấy thống kê lịch hẹn thành công',
    type: AppointmentStatisticsResponseDto,
  })
  async getAppointmentStatistics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<AppointmentStatisticsResponseDto> {
    return this.adminStatisticsService.getAppointmentStatistics(
      startDate,
      endDate,
    );
  }

  @Get('dashboard')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Thống kê tổng quan dashboard' })
  @ApiResponse({
    status: 200,
    description: 'Lấy thống kê dashboard thành công',
    type: DashboardStatisticsResponseDto,
  })
  async getDashboardStatistics(): Promise<DashboardStatisticsResponseDto> {
    return this.adminStatisticsService.getDashboardStatistics();
  }

  @Get('revenue')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Thống kê doanh thu chi tiết' })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiResponse({
    status: 200,
    description: 'Lấy thống kê doanh thu thành công',
    type: RevenueStatisticsResponseDto,
  })
  async getRevenueStatistics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<RevenueStatisticsResponseDto> {
    return this.adminStatisticsService.getRevenueStatistics(startDate, endDate);
  }

  @Get('monthly-appointments')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Thống kê số lượng appointment trong tháng gần đây' })
  @ApiResponse({
    status: 200,
    description: 'Lấy thống kê appointment tháng gần đây thành công',
    type: MonthlyAppointmentsResponseDto,
  })
  async getMonthlyAppointments(): Promise<MonthlyAppointmentsResponseDto> {
    return this.adminStatisticsService.getMonthlyAppointments();
  }
}
