import { PrismaService } from '@/common/prisma/prisma.service';
import { Injectable, NotFoundException } from '@nestjs/common';
import {
  AppointmentDetailResponseDto,
  AppointmentListResponseDto,
  AppointmentResponseDto,
  GetAppointmentQueryDto,
} from './admin-appointment.dto';

@Injectable()
export class AdminAppointmentService {
  constructor(private readonly prisma: PrismaService) {}

  async getAppointments(
    query: GetAppointmentQueryDto,
  ): Promise<AppointmentListResponseDto> {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      billingStatus,
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

    // Filter by billing status
    if (billingStatus) {
      where.billing = {
        status: billingStatus,
      };
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
              specialties: {
                include: {
                  specialty: true,
                },
              },
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
            lastName: true,
            avatar: true,
            specialties: {
              include: {
                specialty: true,
              },
            },
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
    const patientProfile = appointment.patientProfile;

    return {
      id: appointment.id,
      date: appointment.startTime.toISOString().split('T')[0],
      startTime: appointment.startTime
        .toISOString()
        .split('T')[1]
        .substring(0, 5),
      endTime: appointment.endTime.toISOString().split('T')[1].substring(0, 5),
      status: appointment.status,
      notes: appointment.notes || undefined,
      patientName: patientProfile
        ? `${patientProfile.lastName} ${patientProfile.firstName}`
        : 'N/A',
      patientDob: patientProfile
        ? patientProfile.dateOfBirth.toISOString().split('T')[0]
        : '',
      patientPhone: patientProfile?.phone || '',
      patientGender: patientProfile?.gender || '',
      doctor: {
        id: appointment.doctor.id,
        fullName: `${appointment.doctor.firstName} ${appointment.doctor.lastName}`,
        specialty: appointment.doctor.specialties
          ? appointment.doctor.specialties
              .map((s: any) => s.specialty.name)
              .join(', ')
          : '',
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
      patientProfile: patientProfile
        ? {
            id: patientProfile.id,
            fullName: `${patientProfile.lastName} ${patientProfile.firstName}`,
            phone: patientProfile.phone,
            dateOfBirth: patientProfile.dateOfBirth.toISOString().split('T')[0],
            gender: patientProfile.gender,
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

  async cancelAppointment(id: number): Promise<{ message: string }> {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
    });

    if (!appointment) {
      throw new NotFoundException('Không tìm thấy cuộc hẹn');
    }

    if (appointment.status === 'CANCELLED') {
      return { message: 'Cuộc hẹn đã được hủy trước đó' };
    }

    await this.prisma.appointment.update({
      where: { id },
      data: {
        status: 'CANCELLED',
      },
    });

    return { message: 'Hủy cuộc hẹn thành công' };
  }
}
