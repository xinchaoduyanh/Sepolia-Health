import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import {
  UserStatisticsResponseDto,
  AppointmentStatisticsResponseDto,
  DashboardStatisticsResponseDto,
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
        this.prisma.user.count({ where: { role: 'PATIENT' } }),
        this.prisma.user.count({ where: { role: 'DOCTOR' } }),
        this.prisma.user.count({ where: { role: 'RECEPTIONIST' } }),
        this.prisma.user.count({ where: { role: 'ADMIN' } }),
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
          where: { ...dateFilter, paymentStatus: 'pending' },
        }),
        this.prisma.appointment.count({
          where: { ...dateFilter, paymentStatus: 'paid' },
        }),
        this.prisma.appointment.count({
          where: { ...dateFilter, paymentStatus: 'refunded' },
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
}
