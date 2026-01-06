import { ApiProperty } from '@nestjs/swagger';

export class UserStatisticsResponseDto {
  @ApiProperty({
    description: 'Tổng số patient',
    example: 150,
  })
  totalPatients: number;

  @ApiProperty({
    description: 'Tổng số doctor',
    example: 25,
  })
  totalDoctors: number;

  @ApiProperty({
    description: 'Tổng số receptionist',
    example: 10,
  })
  totalReceptionists: number;

  @ApiProperty({
    description: 'Tổng số admin',
    example: 3,
  })
  totalAdmins: number;

  @ApiProperty({
    description: 'Patient mới trong tháng',
    example: 15,
  })
  newPatientsThisMonth: number;

  @ApiProperty({
    description: 'Doctor mới trong tháng',
    example: 2,
  })
  newDoctorsThisMonth: number;

  @ApiProperty({
    description: 'Receptionist mới trong tháng',
    example: 1,
  })
  newReceptionistsThisMonth: number;

  @ApiProperty({
    description: 'Thống kê theo tháng (12 tháng gần nhất)',
    example: [
      { month: '2024-01', patients: 10, doctors: 2, receptionists: 1 },
      { month: '2024-02', patients: 15, doctors: 1, receptionists: 0 },
    ],
  })
  monthlyStats: Array<{
    month: string;
    patients: number;
    doctors: number;
    receptionists: number;
  }>;
}

export class AppointmentStatisticsResponseDto {
  @ApiProperty({
    description: 'Tổng số lịch hẹn',
    example: 500,
  })
  totalAppointments: number;

  @ApiProperty({
    description: 'Lịch hẹn đã lên lịch',
    example: 200,
  })
  scheduledAppointments: number;

  @ApiProperty({
    description: 'Lịch hẹn đã hoàn thành',
    example: 250,
  })
  completedAppointments: number;

  @ApiProperty({
    description: 'Lịch hẹn đã hủy',
    example: 50,
  })
  cancelledAppointments: number;

  @ApiProperty({
    description: 'Lịch hẹn trong tháng này',
    example: 45,
  })
  appointmentsThisMonth: number;

  @ApiProperty({
    description: 'Lịch hẹn hôm nay',
    example: 8,
  })
  appointmentsToday: number;

  @ApiProperty({
    description: 'Thống kê theo tháng (12 tháng gần nhất)',
    example: [
      { month: '2024-01', total: 40, completed: 35, cancelled: 5 },
      { month: '2024-02', total: 45, completed: 40, cancelled: 5 },
    ],
  })
  monthlyStats: Array<{
    month: string;
    total: number;
    completed: number;
    cancelled: number;
  }>;

  @ApiProperty({
    description: 'Thống kê theo trạng thái thanh toán',
    example: {
      pending: 20,
      paid: 450,
      refunded: 30,
    },
  })
  paymentStats: {
    pending: number;
    paid: number;
    refunded: number;
  };
}

export class RevenueStatisticsResponseDto {
  @ApiProperty({
    description: 'Tổng doanh thu',
    example: 150000000,
  })
  totalRevenue: number;

  @ApiProperty({
    description: 'Doanh thu tháng này',
    example: 25000000,
  })
  monthlyRevenue: number;

  @ApiProperty({
    description: 'Doanh thu hôm nay',
    example: 1500000,
  })
  todayRevenue: number;

  @ApiProperty({
    description: 'Doanh thu theo tháng (12 tháng gần nhất)',
    example: [
      { month: '2024-01', revenue: 20000000 },
      { month: '2024-02', revenue: 25000000 },
    ],
  })
  monthlyRevenueStats: Array<{
    month: string;
    revenue: number;
  }>;

  @ApiProperty({
    description: 'Doanh thu theo dịch vụ',
    example: [
      { serviceId: 1, serviceName: 'Khám nội khoa', revenue: 50000000 },
      { serviceId: 2, serviceName: 'Khám răng hàm mặt', revenue: 30000000 },
    ],
  })
  revenueByService: Array<{
    serviceId: number;
    serviceName: string;
    revenue: number;
    count: number;
  }>;

  @ApiProperty({
    description: 'Doanh thu theo bác sĩ',
    example: [
      { doctorId: 1, doctorName: 'Nguyễn Văn A', revenue: 40000000 },
      { doctorId: 2, doctorName: 'Trần Thị B', revenue: 35000000 },
    ],
  })
  revenueByDoctor: Array<{
    doctorId: number;
    doctorName: string;
    revenue: number;
    count: number;
  }>;
}

export class MonthlyAppointmentsResponseDto {
  @ApiProperty({
    description: 'Số lượng appointment trong tháng gần đây',
    example: 245,
  })
  totalAppointments: number;

  @ApiProperty({
    description: 'Appointment theo ngày trong tháng',
    example: [
      { date: '2024-10-01', count: 12 },
      { date: '2024-10-02', count: 15 },
    ],
  })
  dailyAppointments: Array<{
    date: string;
    count: number;
  }>;

  @ApiProperty({
    description: 'Appointment theo trạng thái',
    example: {
      UPCOMING: 50,
      COMPLETED: 180,
      CANCELLED: 15,
    },
  })
  appointmentsByStatus: {
    UPCOMING: number;
    COMPLETED: number;
    CANCELLED: number;
  };

  @ApiProperty({
    description: 'Appointment theo dịch vụ',
    example: [
      { serviceName: 'Khám nội khoa', count: 100 },
      { serviceName: 'Khám răng hàm mặt', count: 80 },
    ],
  })
  appointmentsByService: Array<{
    serviceName: string;
    count: number;
  }>;
}

export class DashboardStatisticsResponseDto {
  @ApiProperty({
    description: 'Thống kê người dùng',
    type: UserStatisticsResponseDto,
  })
  users: UserStatisticsResponseDto;

  @ApiProperty({
    description: 'Thống kê lịch hẹn',
    type: AppointmentStatisticsResponseDto,
  })
  appointments: AppointmentStatisticsResponseDto;

  @ApiProperty({
    description: 'Tổng doanh thu tháng này',
    example: 50000000,
  })
  monthlyRevenue: number;

  @ApiProperty({
    description: 'Tổng doanh thu hôm nay',
    example: 2000000,
  })
  todayRevenue: number;

  @ApiProperty({
    description: 'Tỷ lệ hoàn thành lịch hẹn (%)',
    example: 85.5,
  })
  completionRate: number;

  @ApiProperty({
    description: 'Số lịch hẹn trung bình mỗi ngày',
    example: 12.5,
  })
  averageAppointmentsPerDay: number;
}

export class MonthComparisonDto {
  @ApiProperty({
    description: 'Giá trị tổng tuyệt đối',
    example: 1500,
  })
  absoluteTotal: number;

  @ApiProperty({
    description: 'Giá trị tháng này',
    example: 150,
  })
  currentMonth: number;

  @ApiProperty({
    description: 'Giá trị tháng trước',
    example: 125,
  })
  previousMonth: number;

  @ApiProperty({
    description: 'Chênh lệch tuyệt đối',
    example: 25,
  })
  difference: number;

  @ApiProperty({
    description: 'Phần trăm thay đổi',
    example: 20.0,
  })
  percentageChange: number;
}

export class OverviewStatisticsResponseDto {
  @ApiProperty({
    description: 'Thống kê tổng bệnh nhân (so sánh tháng này vs tháng trước)',
    type: MonthComparisonDto,
  })
  totalPatients: MonthComparisonDto;

  @ApiProperty({
    description: 'Thống kê lịch hẹn (so sánh tháng này vs tháng trước)',
    type: MonthComparisonDto,
  })
  appointments: MonthComparisonDto;

  @ApiProperty({
    description: 'Thống kê bác sĩ (so sánh tháng này vs tháng trước)',
    type: MonthComparisonDto,
  })
  doctors: MonthComparisonDto;

  @ApiProperty({
    description:
      'Thống kê doanh thu từ lịch hẹn COMPLETED (so sánh tháng này vs tháng trước)',
    type: MonthComparisonDto,
  })
  revenue: MonthComparisonDto;
}

export class ClinicStatisticsItemDto {
  @ApiProperty({
    description: 'ID của clinic',
    example: 1,
  })
  clinicId: number;

  @ApiProperty({
    description: 'Tên clinic',
    example: 'Phòng khám Đa khoa Hà Nội',
  })
  clinicName: string;

  @ApiProperty({
    description: 'Số bệnh nhân',
    example: 150,
  })
  patients: number;

  @ApiProperty({
    description: 'Số lịch hẹn COMPLETED',
    example: 45,
  })
  appointments: number;

  @ApiProperty({
    description: 'Số bác sĩ',
    example: 12,
  })
  doctors: number;

  @ApiProperty({
    description: 'Doanh thu (từ COMPLETED appointments)',
    example: 22500000,
  })
  revenue: number;
}

export class ClinicStatisticsResponseDto {
  @ApiProperty({
    description: 'Thống kê theo từng clinic',
    type: [ClinicStatisticsItemDto],
  })
  clinics: ClinicStatisticsItemDto[];
}

export class RevenueChartDataPointDto {
  @ApiProperty({
    description: 'Label cho điểm dữ liệu (ngày/tuần/tháng)',
    example: '2024-01-15',
  })
  label: string;

  @ApiProperty({
    description: 'Doanh thu theo từng clinic',
    example: [
      { clinicId: 1, clinicName: 'Clinic A', revenue: 1000000 },
      { clinicId: 2, clinicName: 'Clinic B', revenue: 2000000 },
    ],
  })
  clinics: Array<{
    clinicId: number;
    clinicName: string;
    revenue: number;
  }>;
}

export class RevenueChartResponseDto {
  @ApiProperty({
    description: 'Dữ liệu biểu đồ doanh thu',
    type: [RevenueChartDataPointDto],
  })
  data: RevenueChartDataPointDto[];

  @ApiProperty({
    description: 'Danh sách clinic',
    example: [
      { clinicId: 1, clinicName: 'Clinic A' },
      { clinicId: 2, clinicName: 'Clinic B' },
    ],
  })
  clinics: Array<{
    clinicId: number;
    clinicName: string;
  }>;
}

export class AppointmentsChartDataPointDto {
  @ApiProperty({
    description: 'Label cho điểm dữ liệu (tháng)',
    example: '2024-01',
  })
  label: string;

  @ApiProperty({
    description: 'Số lịch hẹn theo từng clinic',
    example: [
      { clinicId: 1, clinicName: 'Clinic A', appointments: 10 },
      { clinicId: 2, clinicName: 'Clinic B', appointments: 20 },
    ],
  })
  clinics: Array<{
    clinicId: number;
    clinicName: string;
    appointments: number;
  }>;
}

export class AppointmentsChartResponseDto {
  @ApiProperty({
    description: 'Dữ liệu biểu đồ lịch hẹn',
    type: [AppointmentsChartDataPointDto],
  })
  data: AppointmentsChartDataPointDto[];
}
