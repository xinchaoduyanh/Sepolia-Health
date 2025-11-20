import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { Role, AppointmentStatus, PaymentStatus } from '@prisma/client';
import {
  UserStatisticsResponseDto,
  AppointmentStatisticsResponseDto,
  DashboardStatisticsResponseDto,
  RevenueStatisticsResponseDto,
  MonthlyAppointmentsResponseDto,
  OverviewStatisticsResponseDto,
  MonthComparisonDto,
  ClinicStatisticsResponseDto,
  RevenueChartResponseDto,
  AppointmentsChartResponseDto,
} from './admin-statistics.dto';

@Injectable()
export class AdminStatisticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getUserStatistics(
    startDate?: string,
    endDate?: string,
  ): Promise<UserStatisticsResponseDto> {
    const dateFilter = this.buildDateFilter(startDate, endDate);

    // Get total counts
    const [totalPatients, totalDoctors, totalReceptionists, totalAdmins] =
      await Promise.all([
        this.prisma.user.count({
          where: { role: Role.PATIENT, ...dateFilter },
        }),
        this.prisma.user.count({
          where: { role: Role.DOCTOR, ...dateFilter },
        }),
        this.prisma.user.count({
          where: { role: Role.RECEPTIONIST, ...dateFilter },
        }),
        this.prisma.user.count({
          where: { role: Role.ADMIN, ...dateFilter },
        }),
      ]);

    // Get new users this month
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);

    const [
      newPatientsThisMonth,
      newDoctorsThisMonth,
      newReceptionistsThisMonth,
    ] = await Promise.all([
      this.prisma.user.count({
        where: { role: Role.PATIENT, createdAt: { gte: thisMonth } },
      }),
      this.prisma.user.count({
        where: { role: Role.DOCTOR, createdAt: { gte: thisMonth } },
      }),
      this.prisma.user.count({
        where: { role: Role.RECEPTIONIST, createdAt: { gte: thisMonth } },
      }),
    ]);

    // Get monthly stats for last 12 months
    const monthlyStats = await this.getMonthlyUserStats();

    return {
      totalPatients,
      totalDoctors,
      totalReceptionists,
      totalAdmins,
      newPatientsThisMonth,
      newDoctorsThisMonth,
      newReceptionistsThisMonth,
      monthlyStats,
    };
  }

  async getAppointmentStatistics(
    startDate?: string,
    endDate?: string,
  ): Promise<AppointmentStatisticsResponseDto> {
    const dateFilter = this.buildDateFilter(startDate, endDate);

    // Get total counts
    const [
      totalAppointments,
      scheduledAppointments,
      completedAppointments,
      cancelledAppointments,
    ] = await Promise.all([
      this.prisma.appointment.count({ where: dateFilter }),
      this.prisma.appointment.count({
        where: { ...dateFilter, status: AppointmentStatus.UPCOMING },
      }),
      this.prisma.appointment.count({
        where: { ...dateFilter, status: AppointmentStatus.COMPLETED },
      }),
      this.prisma.appointment.count({
        where: { ...dateFilter, status: AppointmentStatus.CANCELLED },
      }),
    ]);

    // Get appointments this month
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);

    const appointmentsThisMonth = await this.prisma.appointment.count({
      where: { createdAt: { gte: thisMonth } },
    });

    // Get appointments today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const appointmentsToday = await this.prisma.appointment.count({
      where: {
        startTime: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    // Get monthly appointment stats
    const monthlyStats = await this.getMonthlyAppointmentStats();

    // Get payment stats
    const [pendingPayments, paidPayments, refundedPayments] = await Promise.all(
      [
        this.prisma.appointment.count({
          where: {
            ...dateFilter,
            billing: { status: PaymentStatus.PENDING },
          },
        }),
        this.prisma.appointment.count({
          where: {
            ...dateFilter,
            billing: { status: PaymentStatus.PAID },
          },
        }),
        this.prisma.appointment.count({
          where: {
            ...dateFilter,
            billing: { status: PaymentStatus.REFUNDED },
          },
        }),
      ],
    );

    return {
      totalAppointments,
      scheduledAppointments,
      completedAppointments,
      cancelledAppointments,
      appointmentsThisMonth,
      appointmentsToday,
      monthlyStats,
      paymentStats: {
        pending: pendingPayments,
        paid: paidPayments,
        refunded: refundedPayments,
      },
    };
  }

  async getDashboardStatistics(): Promise<DashboardStatisticsResponseDto> {
    const [users, appointments] = await Promise.all([
      this.getUserStatistics(),
      this.getAppointmentStatistics(),
    ]);

    // Calculate revenue (assuming each appointment costs 500,000 VND)
    const appointmentPrice = 500000;
    const monthlyRevenue =
      appointments.appointmentsThisMonth * appointmentPrice;
    const todayRevenue = appointments.appointmentsToday * appointmentPrice;

    // Calculate completion rate
    const completionRate =
      appointments.totalAppointments > 0
        ? (appointments.completedAppointments /
            appointments.totalAppointments) *
          100
        : 0;

    // Calculate average appointments per day (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const appointmentsLast30Days = await this.prisma.appointment.count({
      where: { createdAt: { gte: thirtyDaysAgo } },
    });

    const averageAppointmentsPerDay = appointmentsLast30Days / 30;

    return {
      users,
      appointments,
      monthlyRevenue,
      todayRevenue,
      completionRate: Math.round(completionRate * 10) / 10,
      averageAppointmentsPerDay:
        Math.round(averageAppointmentsPerDay * 10) / 10,
    };
  }

  async getRevenueStatistics(
    startDate?: string,
    endDate?: string,
  ): Promise<RevenueStatisticsResponseDto> {
    const dateFilter = this.buildDateFilter(startDate, endDate);

    // Get total revenue from billing
    const totalRevenueResult = await this.prisma.billing.aggregate({
      where: {
        status: PaymentStatus.PAID,
        appointment: dateFilter,
      },
      _sum: {
        amount: true,
      },
    });
    const totalRevenue = totalRevenueResult._sum.amount || 0;

    // Get monthly revenue
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);

    const monthlyRevenueResult = await this.prisma.billing.aggregate({
      where: {
        status: PaymentStatus.PAID,
        appointment: {
          createdAt: { gte: thisMonth },
        },
      },
      _sum: {
        amount: true,
      },
    });
    const monthlyRevenue = monthlyRevenueResult._sum.amount || 0;

    // Get today revenue
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayRevenueResult = await this.prisma.billing.aggregate({
      where: {
        status: PaymentStatus.PAID,
        appointment: {
          startTime: {
            gte: today,
            lt: tomorrow,
          },
        },
      },
      _sum: {
        amount: true,
      },
    });
    const todayRevenue = todayRevenueResult._sum.amount || 0;

    // Get monthly revenue stats for last 12 months
    const monthlyRevenueStats = await this.getMonthlyRevenueStats();

    // Get revenue by service using raw SQL approach or simpler aggregation
    const revenueByServiceData = await this.prisma.billing.findMany({
      where: {
        status: PaymentStatus.PAID,
        appointment: dateFilter,
      },
      select: {
        amount: true,
        appointment: {
          select: { serviceId: true },
        },
      },
    });

    const serviceRevenueMap = new Map<
      number,
      { revenue: number; count: number }
    >();
    revenueByServiceData.forEach((item) => {
      const serviceId = item.appointment.serviceId;
      const existing = serviceRevenueMap.get(serviceId) || {
        revenue: 0,
        count: 0,
      };
      serviceRevenueMap.set(serviceId, {
        revenue: existing.revenue + item.amount,
        count: existing.count + 1,
      });
    });

    const revenueByServiceWithNames = await Promise.all(
      Array.from(serviceRevenueMap.entries()).map(async ([serviceId, data]) => {
        const service = await this.prisma.service.findUnique({
          where: { id: serviceId },
          select: { name: true },
        });
        return {
          serviceId,
          serviceName: service?.name || 'Unknown',
          revenue: data.revenue,
          count: data.count,
        };
      }),
    );

    // Get revenue by doctor
    const revenueByDoctorData = await this.prisma.billing.findMany({
      where: {
        status: PaymentStatus.PAID,
        appointment: dateFilter,
      },
      select: {
        amount: true,
        appointment: {
          select: { doctorId: true },
        },
      },
    });

    const doctorRevenueMap = new Map<
      number,
      { revenue: number; count: number }
    >();
    revenueByDoctorData.forEach((item) => {
      const doctorId = item.appointment.doctorId;
      const existing = doctorRevenueMap.get(doctorId) || {
        revenue: 0,
        count: 0,
      };
      doctorRevenueMap.set(doctorId, {
        revenue: existing.revenue + item.amount,
        count: existing.count + 1,
      });
    });

    const revenueByDoctorWithNames = await Promise.all(
      Array.from(doctorRevenueMap.entries()).map(async ([doctorId, data]) => {
        const doctor = await this.prisma.doctorProfile.findUnique({
          where: { id: doctorId },
          select: { firstName: true, lastName: true },
        });
        return {
          doctorId,
          doctorName:
            `${doctor?.firstName || ''} ${doctor?.lastName || ''}`.trim() ||
            'Unknown',
          revenue: data.revenue,
          count: data.count,
        };
      }),
    );

    return {
      totalRevenue,
      monthlyRevenue,
      todayRevenue,
      monthlyRevenueStats,
      revenueByService: revenueByServiceWithNames,
      revenueByDoctor: revenueByDoctorWithNames,
    };
  }

  async getMonthlyAppointments(): Promise<MonthlyAppointmentsResponseDto> {
    // Get current month start and end
    const now = new Date();
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    // Get total appointments in current month
    const totalAppointments = await this.prisma.appointment.count({
      where: {
        createdAt: {
          gte: currentMonth,
          lt: nextMonth,
        },
      },
    });

    // Get daily appointments for current month
    const dailyAppointments: Array<{ date: string; count: number }> = [];
    const daysInMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
    ).getDate();

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(now.getFullYear(), now.getMonth(), day);
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);

      const count = await this.prisma.appointment.count({
        where: {
          createdAt: {
            gte: date,
            lt: nextDay,
          },
        },
      });

      if (count > 0) {
        dailyAppointments.push({
          date: date.toISOString().split('T')[0],
          count,
        });
      }
    }

    // Get appointments by status
    const [upcomingCount, completedCount, cancelledCount] = await Promise.all([
      this.prisma.appointment.count({
        where: {
          status: AppointmentStatus.UPCOMING,
          createdAt: {
            gte: currentMonth,
            lt: nextMonth,
          },
        },
      }),
      this.prisma.appointment.count({
        where: {
          status: AppointmentStatus.COMPLETED,
          createdAt: {
            gte: currentMonth,
            lt: nextMonth,
          },
        },
      }),
      this.prisma.appointment.count({
        where: {
          status: AppointmentStatus.CANCELLED,
          createdAt: {
            gte: currentMonth,
            lt: nextMonth,
          },
        },
      }),
    ]);

    // Get appointments by service
    const appointmentsByServiceRaw = await this.prisma.appointment.groupBy({
      by: ['serviceId'],
      where: {
        createdAt: {
          gte: currentMonth,
          lt: nextMonth,
        },
      },
      _count: true,
    });

    const appointmentsByService = await Promise.all(
      appointmentsByServiceRaw.map(async (item) => {
        const service = await this.prisma.service.findUnique({
          where: { id: item.serviceId },
          select: { name: true },
        });
        return {
          serviceName: service?.name || 'Unknown',
          count: item._count,
        };
      }),
    );

    return {
      totalAppointments,
      dailyAppointments,
      appointmentsByStatus: {
        UPCOMING: upcomingCount,
        COMPLETED: completedCount,
        CANCELLED: cancelledCount,
      },
      appointmentsByService,
    };
  }

  private buildDateFilter(startDate?: string, endDate?: string) {
    const filter: any = {};

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.gte = new Date(startDate);
      if (endDate) filter.createdAt.lte = new Date(endDate);
    }

    return filter;
  }

  private async getMonthlyUserStats() {
    const stats: Array<{
      month: string;
      patients: number;
      doctors: number;
      receptionists: number;
    }> = [];
    const now = new Date();

    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextMonth = new Date(date.getFullYear(), date.getMonth() + 1, 1);

      const [patients, doctors, receptionists] = await Promise.all([
        this.prisma.user.count({
          where: {
            role: Role.PATIENT,
            createdAt: { gte: date, lt: nextMonth },
          },
        }),
        this.prisma.user.count({
          where: {
            role: Role.DOCTOR,
            createdAt: { gte: date, lt: nextMonth },
          },
        }),
        this.prisma.user.count({
          where: {
            role: Role.RECEPTIONIST,
            createdAt: { gte: date, lt: nextMonth },
          },
        }),
      ]);

      stats.push({
        month: date.toISOString().substring(0, 7),
        patients,
        doctors,
        receptionists,
      });
    }

    return stats;
  }

  private async getMonthlyAppointmentStats() {
    const stats: Array<{
      month: string;
      total: number;
      completed: number;
      cancelled: number;
    }> = [];
    const now = new Date();

    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextMonth = new Date(date.getFullYear(), date.getMonth() + 1, 1);

      const [total, completed, cancelled] = await Promise.all([
        this.prisma.appointment.count({
          where: { createdAt: { gte: date, lt: nextMonth } },
        }),
        this.prisma.appointment.count({
          where: {
            createdAt: { gte: date, lt: nextMonth },
            status: AppointmentStatus.COMPLETED,
          },
        }),
        this.prisma.appointment.count({
          where: {
            createdAt: { gte: date, lt: nextMonth },
            status: AppointmentStatus.CANCELLED,
          },
        }),
      ]);

      stats.push({
        month: date.toISOString().substring(0, 7),
        total,
        completed,
        cancelled,
      });
    }

    return stats;
  }

  private async getMonthlyRevenueStats() {
    const stats: Array<{
      month: string;
      revenue: number;
    }> = [];
    const now = new Date();

    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextMonth = new Date(date.getFullYear(), date.getMonth() + 1, 1);

      const result = await this.prisma.billing.aggregate({
        where: {
          status: PaymentStatus.PAID,
          appointment: {
            createdAt: { gte: date, lt: nextMonth },
          },
        },
        _sum: {
          amount: true,
        },
      });

      stats.push({
        month: date.toISOString().substring(0, 7),
        revenue: result._sum.amount || 0,
      });
    }

    return stats;
  }

  /**
   * Calculate month comparison statistics
   */
  private calculateMonthComparison(
    current: number,
    previous: number,
  ): MonthComparisonDto {
    const difference = current - previous;
    const percentageChange =
      previous === 0
        ? current > 0
          ? 100
          : 0
        : Math.round((difference / previous) * 100 * 10) / 10;

    return {
      currentMonth: current,
      previousMonth: previous,
      difference,
      percentageChange,
    };
  }

  /**
   * Get overview statistics comparing current month vs previous month
   */
  async getOverviewStatistics(): Promise<OverviewStatisticsResponseDto> {
    const now = new Date();

    // Current month range
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    currentMonthStart.setHours(0, 0, 0, 0);
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    currentMonthEnd.setHours(0, 0, 0, 0);

    // Previous month range
    const previousMonthStart = new Date(
      now.getFullYear(),
      now.getMonth() - 1,
      1,
    );
    previousMonthStart.setHours(0, 0, 0, 0);
    const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 1);
    previousMonthEnd.setHours(0, 0, 0, 0);

    // 1. Total Patients: Số bệnh nhân mới được tạo trong tháng này vs tháng trước
    const [patientsCurrentMonth, patientsPreviousMonth] = await Promise.all([
      this.prisma.user.count({
        where: {
          role: Role.PATIENT,
          createdAt: {
            gte: currentMonthStart,
            lt: currentMonthEnd,
          },
        },
      }),
      this.prisma.user.count({
        where: {
          role: Role.PATIENT,
          createdAt: {
            gte: previousMonthStart,
            lt: previousMonthEnd,
          },
        },
      }),
    ]);

    // 2. Appointments: Số appointment COMPLETED trong tháng này vs tháng trước
    // Lấy theo thời điểm appointment được completed (updatedAt khi status = COMPLETED)
    const [appointmentsCurrentMonth, appointmentsPreviousMonth] =
      await Promise.all([
        this.prisma.appointment.count({
          where: {
            status: AppointmentStatus.COMPLETED,
            updatedAt: {
              gte: currentMonthStart,
              lt: currentMonthEnd,
            },
          },
        }),
        this.prisma.appointment.count({
          where: {
            status: AppointmentStatus.COMPLETED,
            updatedAt: {
              gte: previousMonthStart,
              lt: previousMonthEnd,
            },
          },
        }),
      ]);

    // 3. Doctors: Số bác sĩ mới được tạo trong tháng này vs tháng trước
    const [doctorsCurrentMonth, doctorsPreviousMonth] = await Promise.all([
      this.prisma.user.count({
        where: {
          role: Role.DOCTOR,
          createdAt: {
            gte: currentMonthStart,
            lt: currentMonthEnd,
          },
        },
      }),
      this.prisma.user.count({
        where: {
          role: Role.DOCTOR,
          createdAt: {
            gte: previousMonthStart,
            lt: previousMonthEnd,
          },
        },
      }),
    ]);

    // 4. Revenue: Doanh thu từ các appointment COMPLETED trong tháng này vs tháng trước
    // Lấy theo thời điểm appointment được completed (updatedAt khi status = COMPLETED)
    const [revenueCurrentMonthResult, revenuePreviousMonthResult] =
      await Promise.all([
        this.prisma.billing.aggregate({
          where: {
            status: PaymentStatus.PAID,
            appointment: {
              status: AppointmentStatus.COMPLETED,
              updatedAt: {
                gte: currentMonthStart,
                lt: currentMonthEnd,
              },
            },
          },
          _sum: {
            amount: true,
          },
        }),
        this.prisma.billing.aggregate({
          where: {
            status: PaymentStatus.PAID,
            appointment: {
              status: AppointmentStatus.COMPLETED,
              updatedAt: {
                gte: previousMonthStart,
                lt: previousMonthEnd,
              },
            },
          },
          _sum: {
            amount: true,
          },
        }),
      ]);

    const revenueCurrentMonth = revenueCurrentMonthResult._sum.amount || 0;
    const revenuePreviousMonth = revenuePreviousMonthResult._sum.amount || 0;

    return {
      totalPatients: this.calculateMonthComparison(
        patientsCurrentMonth,
        patientsPreviousMonth,
      ),
      appointments: this.calculateMonthComparison(
        appointmentsCurrentMonth,
        appointmentsPreviousMonth,
      ),
      doctors: this.calculateMonthComparison(
        doctorsCurrentMonth,
        doctorsPreviousMonth,
      ),
      revenue: this.calculateMonthComparison(
        revenueCurrentMonth,
        revenuePreviousMonth,
      ),
    };
  }

  /**
   * Get statistics by clinic
   */
  async getClinicStatistics(): Promise<ClinicStatisticsResponseDto> {
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    currentMonthStart.setHours(0, 0, 0, 0);
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    currentMonthEnd.setHours(0, 0, 0, 0);

    // Get all active clinics
    const clinics = await this.prisma.clinic.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        name: true,
      },
    });

    // Get statistics for each clinic
    const clinicStats = await Promise.all(
      clinics.map(async (clinic) => {
        // Count patients (users with role PATIENT who have appointments at this clinic)
        const patients = await this.prisma.user.count({
          where: {
            role: Role.PATIENT,
            patientProfiles: {
              some: {
                appointments: {
                  some: {
                    clinicId: clinic.id,
                  },
                },
              },
            },
          },
        });

        // Count COMPLETED appointments in current month
        const appointments = await this.prisma.appointment.count({
          where: {
            clinicId: clinic.id,
            status: AppointmentStatus.COMPLETED,
            updatedAt: {
              gte: currentMonthStart,
              lt: currentMonthEnd,
            },
          },
        });

        // Count doctors at this clinic
        const doctors = await this.prisma.doctorProfile.count({
          where: {
            clinicId: clinic.id,
          },
        });

        // Calculate revenue from COMPLETED appointments in current month
        const revenueResult = await this.prisma.billing.aggregate({
          where: {
            status: PaymentStatus.PAID,
            appointment: {
              clinicId: clinic.id,
              status: AppointmentStatus.COMPLETED,
              updatedAt: {
                gte: currentMonthStart,
                lt: currentMonthEnd,
              },
            },
          },
          _sum: {
            amount: true,
          },
        });

        return {
          clinicId: clinic.id,
          clinicName: clinic.name,
          patients,
          appointments,
          doctors,
          revenue: revenueResult._sum.amount || 0,
        };
      }),
    );

    return {
      clinics: clinicStats,
    };
  }

  /**
   * Get revenue chart data by clinic with different periods
   * @param period - '1month' (by day), '3months' (by week), 'year' (by month)
   */
  async getRevenueChartByClinic(
    period: '1month' | '3months' | 'year',
  ): Promise<RevenueChartResponseDto> {
    const now = new Date();
    let startDate: Date;
    const endDate: Date = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    endDate.setHours(23, 59, 59, 999);

    // Calculate start date based on period
    if (period === '1month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (period === '3months') {
      startDate = new Date(now.getFullYear(), now.getMonth() - 2, 1);
    } else {
      // year
      startDate = new Date(now.getFullYear(), 0, 1);
    }
    startDate.setHours(0, 0, 0, 0);

    // Get all active clinics
    const clinics = await this.prisma.clinic.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        name: true,
      },
    });

    const data: Array<{
      label: string;
      clinics: Array<{
        clinicId: number;
        clinicName: string;
        revenue: number;
      }>;
    }> = [];

    if (period === '1month') {
      // Group by day
      const currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        const dayStart = new Date(currentDate);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(currentDate);
        dayEnd.setHours(23, 59, 59, 999);

        const clinicRevenues = await Promise.all(
          clinics.map(async (clinic) => {
            const result = await this.prisma.billing.aggregate({
              where: {
                status: PaymentStatus.PAID,
                appointment: {
                  clinicId: clinic.id,
                  status: AppointmentStatus.COMPLETED,
                  updatedAt: {
                    gte: dayStart,
                    lte: dayEnd,
                  },
                },
              },
              _sum: {
                amount: true,
              },
            });
            return {
              clinicId: clinic.id,
              clinicName: clinic.name,
              revenue: result._sum.amount || 0,
            };
          }),
        );

        data.push({
          label: dayStart.toISOString().split('T')[0],
          clinics: clinicRevenues,
        });

        currentDate.setDate(currentDate.getDate() + 1);
      }
    } else if (period === '3months') {
      // Group by week
      const currentDate = new Date(startDate);
      // Set to Monday of the first week
      const dayOfWeek = currentDate.getDay();
      const diff =
        currentDate.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
      currentDate.setDate(diff);
      currentDate.setHours(0, 0, 0, 0);

      while (currentDate <= endDate) {
        const weekStart = new Date(currentDate);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);

        if (weekStart > endDate) {
          break;
        }

        if (weekEnd > endDate) {
          weekEnd.setTime(endDate.getTime());
        }

        const clinicRevenues = await Promise.all(
          clinics.map(async (clinic) => {
            const result = await this.prisma.billing.aggregate({
              where: {
                status: PaymentStatus.PAID,
                appointment: {
                  clinicId: clinic.id,
                  status: AppointmentStatus.COMPLETED,
                  updatedAt: {
                    gte: weekStart,
                    lte: weekEnd,
                  },
                },
              },
              _sum: {
                amount: true,
              },
            });
            return {
              clinicId: clinic.id,
              clinicName: clinic.name,
              revenue: result._sum.amount || 0,
            };
          }),
        );

        data.push({
          label: `${weekStart.toISOString().split('T')[0]} - ${weekEnd.toISOString().split('T')[0]}`,
          clinics: clinicRevenues,
        });

        // Move to next week (Monday)
        currentDate.setDate(currentDate.getDate() + 7);
      }
    } else {
      // year - Group by month
      const currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        const monthStart = new Date(
          currentDate.getFullYear(),
          currentDate.getMonth(),
          1,
        );
        monthStart.setHours(0, 0, 0, 0);
        const monthEnd = new Date(
          currentDate.getFullYear(),
          currentDate.getMonth() + 1,
          0,
        );
        monthEnd.setHours(23, 59, 59, 999);

        if (monthEnd > endDate) {
          monthEnd.setTime(endDate.getTime());
        }

        const clinicRevenues = await Promise.all(
          clinics.map(async (clinic) => {
            const result = await this.prisma.billing.aggregate({
              where: {
                status: PaymentStatus.PAID,
                appointment: {
                  clinicId: clinic.id,
                  status: AppointmentStatus.COMPLETED,
                  updatedAt: {
                    gte: monthStart,
                    lte: monthEnd,
                  },
                },
              },
              _sum: {
                amount: true,
              },
            });
            return {
              clinicId: clinic.id,
              clinicName: clinic.name,
              revenue: result._sum.amount || 0,
            };
          }),
        );

        data.push({
          label: monthStart.toISOString().substring(0, 7), // YYYY-MM
          clinics: clinicRevenues,
        });

        currentDate.setMonth(currentDate.getMonth() + 1);
        currentDate.setDate(1);
      }
    }

    return {
      data,
      clinics: clinics.map((c) => ({ clinicId: c.id, clinicName: c.name })),
    };
  }

  /**
   * Get appointments chart data by clinic for a specific month
   * @param month - Format: 'YYYY-MM' (e.g., '2024-01')
   */
  async getAppointmentsChartByClinic(
    month?: string,
  ): Promise<AppointmentsChartResponseDto> {
    const now = new Date();
    let targetMonth: Date;

    if (month) {
      const [year, monthNum] = month.split('-').map(Number);
      targetMonth = new Date(year, monthNum - 1, 1);
    } else {
      targetMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    // Get data for 12 months ending with target month
    const data: Array<{
      label: string;
      clinics: Array<{
        clinicId: number;
        clinicName: string;
        appointments: number;
      }>;
    }> = [];

    // Get all active clinics
    const clinics = await this.prisma.clinic.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        name: true,
      },
    });

    for (let i = 11; i >= 0; i--) {
      const monthDate = new Date(
        targetMonth.getFullYear(),
        targetMonth.getMonth() - i,
        1,
      );
      const monthStart = new Date(
        monthDate.getFullYear(),
        monthDate.getMonth(),
        1,
      );
      monthStart.setHours(0, 0, 0, 0);
      const monthEnd = new Date(
        monthDate.getFullYear(),
        monthDate.getMonth() + 1,
        0,
      );
      monthEnd.setHours(23, 59, 59, 999);

      const clinicAppointments = await Promise.all(
        clinics.map(async (clinic) => {
          const count = await this.prisma.appointment.count({
            where: {
              clinicId: clinic.id,
              status: AppointmentStatus.COMPLETED,
              updatedAt: {
                gte: monthStart,
                lte: monthEnd,
              },
            },
          });
          return {
            clinicId: clinic.id,
            clinicName: clinic.name,
            appointments: count,
          };
        }),
      );

      data.push({
        label: monthStart.toISOString().substring(0, 7), // YYYY-MM
        clinics: clinicAppointments,
      });
    }

    return {
      data,
    };
  }
}
