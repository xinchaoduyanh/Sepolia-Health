import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { Appointment, AppointmentStatus, PaymentStatus } from '@prisma/client';

@Injectable()
export class AppointmentRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create appointment
   */
  async create(data: {
    date: Date;
    startTime: string;
    endTime: string;
    status: AppointmentStatus;
    paymentStatus: PaymentStatus;
    notes?: string;
    patientProfileId?: number;
    patientName: string;
    patientDob: Date;
    patientPhone: string;
    patientGender: string;
    doctorId: number;
    serviceId: number;
    clinicId: number;
  }): Promise<Appointment> {
    return this.prisma.appointment.create({
      data,
    });
  }

  /**
   * Find appointment by ID
   */
  async findById(id: number): Promise<Appointment | null> {
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
  async update(id: number, data: any): Promise<Appointment> {
    return this.prisma.appointment.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete appointment
   */
  async delete(id: number): Promise<Appointment> {
    return this.prisma.appointment.delete({
      where: { id },
    });
  }

  /**
   * Find appointments by patient profile ID
   */
  async findByPatientProfileId(
    patientProfileId: number,
    options?: {
      skip?: number;
      take?: number;
      orderBy?: any;
    },
  ): Promise<Appointment[]> {
    return this.prisma.appointment.findMany({
      where: { patientProfileId },
      ...options,
    });
  }

  /**
   * Find appointments by doctor ID
   */
  async findByDoctorId(
    doctorId: number,
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
    confirmed: number;
    completed: number;
    cancelled: number;
    pending: number;
    paid: number;
  }> {
    const [total, confirmed, completed, cancelled, pending, paid] =
      await Promise.all([
        this.prisma.appointment.count({ where }),
        this.prisma.appointment.count({
          where: { ...where, status: 'CONFIRMED' },
        }),
        this.prisma.appointment.count({
          where: { ...where, status: 'COMPLETED' },
        }),
        this.prisma.appointment.count({
          where: { ...where, status: 'CANCELLED' },
        }),
        this.prisma.appointment.count({
          where: { ...where, paymentStatus: 'PENDING' },
        }),
        this.prisma.appointment.count({
          where: { ...where, paymentStatus: 'PAID' },
        }),
      ]);

    return {
      total,
      confirmed,
      completed,
      cancelled,
      pending,
      paid,
    };
  }
}
