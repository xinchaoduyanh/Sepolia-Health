import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import {
  UserStatisticsResponseDto,
  AppointmentStatisticsResponseDto,
  DashboardStatisticsResponseDto,
  RevenueStatisticsResponseDto,
  MonthlyAppointmentsResponseDto,
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
        this.prisma.user.count({ where: { role: 'PATIENT', ...dateFilter } }),
        this.prisma.user.count({ where: { role: 'DOCTOR', ...dateFilter } }),
        this.prisma.user.count({
          where: { role: 'RECEPTIONIST', ...dateFilter },
        }),
        this.prisma.user.count({ where: { role: 'ADMIN', ...dateFilter } }),
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
        where: { role: 'PATIENT', createdAt: { gte: thisMonth } },
      }),
      this.prisma.user.count({
        where: { role: 'DOCTOR', createdAt: { gte: thisMonth } },
      }),
      this.prisma.user.count({
        where: { role: 'RECEPTIONIST', createdAt: { gte: thisMonth } },
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
        where: { ...dateFilter, status: 'scheduled' },
      }),
      this.prisma.appointment.count({
        where: { ...dateFilter, status: 'completed' },
      }),
      this.prisma.appointment.count({
        where: { ...dateFilter, status: 'cancelled' },
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
        date: {
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
            billing: { status: 'PENDING' },
          },
        }),
        this.prisma.appointment.count({
          where: {
            ...dateFilter,
            billing: { status: 'PAID' },
          },
        }),
        this.prisma.appointment.count({
          where: {
            ...dateFilter,
            billing: { status: 'REFUNDED' },
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
        status: 'PAID',
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
        status: 'PAID',
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
        status: 'PAID',
        appointment: {
          date: {
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
        status: 'PAID',
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
        status: 'PAID',
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
          status: 'UPCOMING',
          createdAt: {
            gte: currentMonth,
            lt: nextMonth,
          },
        },
      }),
      this.prisma.appointment.count({
        where: {
          status: 'COMPLETED',
          createdAt: {
            gte: currentMonth,
            lt: nextMonth,
          },
        },
      }),
      this.prisma.appointment.count({
        where: {
          status: 'CANCELLED',
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
            role: 'PATIENT',
            createdAt: { gte: date, lt: nextMonth },
          },
        }),
        this.prisma.user.count({
          where: {
            role: 'DOCTOR',
            createdAt: { gte: date, lt: nextMonth },
          },
        }),
        this.prisma.user.count({
          where: {
            role: 'RECEPTIONIST',
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
            status: 'COMPLETED',
          },
        }),
        this.prisma.appointment.count({
          where: {
            createdAt: { gte: date, lt: nextMonth },
            status: 'CANCELLED',
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
          status: 'PAID',
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
}
