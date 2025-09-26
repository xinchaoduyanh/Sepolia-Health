import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { Appointment } from '@prisma/client';

@Injectable()
export class AppointmentRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create appointment
   */
  async create(data: {
    date: Date;
    status: string;
    paymentStatus: string;
    notes?: string;
    patientId: number;
    doctorId: string;
    serviceId: string;
  }): Promise<Appointment> {
    return this.prisma.appointment.create({
      data,
    });
  }

  /**
   * Find appointment by ID
   */
  async findById(id: string): Promise<Appointment | null> {
    return this.prisma.appointment.findUnique({
      where: { id },
    });
  }

  /**
   * Find appointments with filters
   */
  async findMany(options: {
    where?: any;
    skip?: number;
    take?: number;
    orderBy?: any;
    include?: any;
  }): Promise<Appointment[]> {
    return this.prisma.appointment.findMany(options);
  }

  /**
   * Count appointments
   */
  async count(where?: any): Promise<number> {
    return this.prisma.appointment.count({ where });
  }

  /**
   * Update appointment
   */
  async update(id: string, data: any): Promise<Appointment> {
    return this.prisma.appointment.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete appointment
   */
  async delete(id: string): Promise<Appointment> {
    return this.prisma.appointment.delete({
      where: { id },
    });
  }

  /**
   * Find appointments by patient ID
   */
  async findByPatientId(
    patientId: number,
    options?: {
      skip?: number;
      take?: number;
      orderBy?: any;
    },
  ): Promise<Appointment[]> {
    return this.prisma.appointment.findMany({
      where: { patientId },
      ...options,
    });
  }

  /**
   * Find appointments by doctor ID
   */
  async findByDoctorId(
    doctorId: string,
    options?: {
      skip?: number;
      take?: number;
      orderBy?: any;
    },
  ): Promise<Appointment[]> {
    return this.prisma.appointment.findMany({
      where: { doctorId },
      ...options,
    });
  }

  /**
   * Find appointments by date range
   */
  async findByDateRange(
    startDate: Date,
    endDate: Date,
    options?: {
      skip?: number;
      take?: number;
      orderBy?: any;
    },
  ): Promise<Appointment[]> {
    return this.prisma.appointment.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      ...options,
    });
  }

  /**
   * Get appointment statistics
   */
  async getStatistics(where?: any): Promise<{
    total: number;
    scheduled: number;
    completed: number;
    cancelled: number;
    pending: number;
    paid: number;
  }> {
    const [total, scheduled, completed, cancelled, pending, paid] =
      await Promise.all([
        this.prisma.appointment.count({ where }),
        this.prisma.appointment.count({
          where: { ...where, status: 'scheduled' },
        }),
        this.prisma.appointment.count({
          where: { ...where, status: 'completed' },
        }),
        this.prisma.appointment.count({
          where: { ...where, status: 'cancelled' },
        }),
        this.prisma.appointment.count({
          where: { ...where, paymentStatus: 'pending' },
        }),
        this.prisma.appointment.count({
          where: { ...where, paymentStatus: 'paid' },
        }),
      ]);

    return {
      total,
      scheduled,
      completed,
      cancelled,
      pending,
      paid,
    };
  }
}
