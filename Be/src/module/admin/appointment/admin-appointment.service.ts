import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import {
  GetAppointmentsDto,
  AppointmentListResponseDto,
  AppointmentDetailResponseDto,
  AppointmentResponseDto,
} from './admin-appointment.dto';

@Injectable()
export class AdminAppointmentService {
  constructor(private readonly prisma: PrismaService) {}

  async getAppointments(
    query: GetAppointmentsDto,
  ): Promise<AppointmentListResponseDto> {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      paymentStatus,
      doctorId,
      clinicId,
      dateFrom,
      dateTo,
    } = query;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    // Search by patient name or phone
    if (search) {
      where.OR = [
        { patientName: { contains: search, mode: 'insensitive' } },
        { patientPhone: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Filter by status
    if (status) {
      where.status = status;
    }

    // Filter by payment status
    if (paymentStatus) {
      where.paymentStatus = paymentStatus;
    }

    // Filter by doctor
    if (doctorId) {
      where.doctorId = doctorId;
    }

    // Filter by clinic
    if (clinicId) {
      where.clinicId = clinicId;
    }

    // Filter by date range
    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) {
        where.date.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.date.lte = new Date(dateTo);
      }
    }

    const [appointments, total] = await Promise.all([
      this.prisma.appointment.findMany({
        where,
        include: {
          doctor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
          service: {
            select: {
              id: true,
              name: true,
              price: true,
              duration: true,
              description: true,
            },
          },
          clinic: {
            select: {
              id: true,
              name: true,
              address: true,
              phone: true,
            },
          },
          patientProfile: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              phone: true,
              dateOfBirth: true,
              gender: true,
            },
          },
          billing: {
            select: {
              id: true,
              amount: true,
              status: true,
              paymentMethod: true,
              notes: true,
              createdAt: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.appointment.count({ where }),
    ]);

    return {
      appointments: appointments.map((appointment) =>
        this.mapAppointmentToResponse(appointment),
      ),
      total,
      page,
      limit,
    };
  }

  async getAppointmentById(id: number): Promise<AppointmentDetailResponseDto> {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
      include: {
        doctor: {
          select: {
            id: true,
            firstName: true,
            avatar: true,
          },
        },
        service: {
          select: {
            id: true,
            name: true,
            price: true,
            duration: true,
            description: true,
          },
        },
        clinic: {
          select: {
            id: true,
            name: true,
            address: true,
            phone: true,
          },
        },
        patientProfile: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            dateOfBirth: true,
            gender: true,
          },
        },
        billing: {
          select: {
            id: true,
            amount: true,
            status: true,
            paymentMethod: true,
            notes: true,
            createdAt: true,
          },
        },
      },
    });

    if (!appointment) {
      throw new NotFoundException('Không tìm thấy cuộc hẹn');
    }

    return this.mapAppointmentToResponse(appointment);
  }

  private mapAppointmentToResponse(appointment: any): AppointmentResponseDto {
    return {
      id: appointment.id,
      date: appointment.date.toISOString().split('T')[0],
      startTime: appointment.startTime,
      endTime: appointment.endTime,
      status: appointment.status,
      paymentStatus: appointment.paymentStatus,
      notes: appointment.notes || undefined,
      patientName: appointment.patientName,
      patientDob: appointment.patientDob.toISOString().split('T')[0],
      patientPhone: appointment.patientPhone,
      patientGender: appointment.patientGender,
      doctor: {
        id: appointment.doctor.id,
        fullName: `${appointment.doctor.firstName} ${appointment.doctor.lastName}`,
        specialty: appointment.doctor.specialty,
        avatar: appointment.doctor.avatar || undefined,
      },
      service: {
        id: appointment.service.id,
        name: appointment.service.name,
        price: appointment.service.price,
        duration: appointment.service.duration,
        description: appointment.service.description || undefined,
      },
      clinic: {
        id: appointment.clinic.id,
        name: appointment.clinic.name,
        address: appointment.clinic.address,
        phone: appointment.clinic.phone || undefined,
      },
      patientProfile: appointment.patientProfile
        ? {
            id: appointment.patientProfile.id,
            fullName: `${appointment.patientProfile.firstName} ${appointment.patientProfile.lastName}`,
            phone: appointment.patientProfile.phone,
            dateOfBirth: appointment.patientProfile.dateOfBirth
              .toISOString()
              .split('T')[0],
            gender: appointment.patientProfile.gender,
          }
        : undefined,
      billing: appointment.billing
        ? {
            id: appointment.billing.id,
            amount: appointment.billing.amount,
            status: appointment.billing.status,
            paymentMethod: appointment.billing.paymentMethod || undefined,
            notes: appointment.billing.notes || undefined,
            createdAt: appointment.billing.createdAt,
          }
        : undefined,
      createdAt: appointment.createdAt,
      updatedAt: appointment.updatedAt,
    };
  }
}
