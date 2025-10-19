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
