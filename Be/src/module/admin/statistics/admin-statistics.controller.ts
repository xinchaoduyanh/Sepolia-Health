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
  OverviewStatisticsResponseDto,
  ClinicStatisticsResponseDto,
  RevenueChartResponseDto,
  AppointmentsChartResponseDto,
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
  @ApiOperation({
    summary: 'Thống kê số lượng appointment trong tháng gần đây',
  })
  @ApiResponse({
    status: 200,
    description: 'Lấy thống kê appointment tháng gần đây thành công',
    type: MonthlyAppointmentsResponseDto,
  })
  async getMonthlyAppointments(): Promise<MonthlyAppointmentsResponseDto> {
    return this.adminStatisticsService.getMonthlyAppointments();
  }

  @Get('overview')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Thống kê tổng quan so sánh tháng này vs tháng trước',
  })
  @ApiResponse({
    status: 200,
    description: 'Lấy thống kê tổng quan thành công',
    type: OverviewStatisticsResponseDto,
  })
  async getOverviewStatistics(): Promise<OverviewStatisticsResponseDto> {
    return this.adminStatisticsService.getOverviewStatistics();
  }

  @Get('clinics')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Thống kê các chỉ số theo từng cơ sở (clinic)',
  })
  @ApiResponse({
    status: 200,
    description: 'Lấy thống kê theo clinic thành công',
    type: ClinicStatisticsResponseDto,
  })
  async getClinicStatistics(): Promise<ClinicStatisticsResponseDto> {
    return this.adminStatisticsService.getClinicStatistics();
  }

  @Get('revenue-chart-by-clinic')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Biểu đồ doanh thu theo cơ sở',
  })
  @ApiQuery({
    name: 'period',
    required: true,
    enum: ['1month', '3months', 'year'],
    description:
      'Khoảng thời gian: 1month (theo ngày), 3months (theo tuần), year (theo tháng)',
  })
  @ApiResponse({
    status: 200,
    description: 'Lấy dữ liệu biểu đồ doanh thu thành công',
    type: RevenueChartResponseDto,
  })
  async getRevenueChartByClinic(
    @Query('period') period: '1month' | '3months' | 'year',
  ): Promise<RevenueChartResponseDto> {
    return this.adminStatisticsService.getRevenueChartByClinic(period);
  }

  @Get('appointments-chart-by-clinic')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Biểu đồ lịch hẹn theo cơ sở (12 tháng gần nhất)',
  })
  @ApiQuery({
    name: 'month',
    required: false,
    type: String,
    description: 'Tháng mục tiêu (format: YYYY-MM), mặc định là tháng hiện tại',
  })
  @ApiResponse({
    status: 200,
    description: 'Lấy dữ liệu biểu đồ lịch hẹn thành công',
    type: AppointmentsChartResponseDto,
  })
  async getAppointmentsChartByClinic(
    @Query('month') month?: string,
  ): Promise<AppointmentsChartResponseDto> {
    return this.adminStatisticsService.getAppointmentsChartByClinic(month);
  }
}
