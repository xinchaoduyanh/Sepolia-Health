import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import type { TokenPayload } from '@/common/types';
import type {
  CreateAppointmentDtoType,
  UpdateAppointmentDtoType,
  GetAppointmentsQueryDtoType,
  AppointmentResponseDtoType,
  AppointmentsListResponseDtoType,
} from './appointment.dto';
import { CurrentUser } from '@/common/decorators';

@Injectable()
export class AppointmentService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create new appointment
   */
  async create(
    createAppointmentDto: CreateAppointmentDtoType,
    @CurrentUser() user: TokenPayload,
  ): Promise<AppointmentResponseDtoType> {
    const {
      doctorId,
      serviceId,
      date,
      notes,
      patientName,
      patientDob,
      patientPhone,
      patientGender,
      clinicId,
    } = createAppointmentDto;

    // Check if doctor exists
    const doctor = await this.prisma.doctorProfile.findUnique({
      where: { id: doctorId },
      include: { user: true },
    });

    if (!doctor) {
      throw new NotFoundException('Bác sĩ không tồn tại');
    }

    // Check if service exists
    const service = await this.prisma.service.findUnique({
      where: { id: serviceId },
    });

    if (!service) {
      throw new NotFoundException('Dịch vụ không tồn tại');
    }

    // Validate clinicId - it's required in the schema
    if (!clinicId) {
      throw new BadRequestException('Cơ sở phòng khám không được để trống');
    }

    // Check if clinic exists
    const clinic = await this.prisma.clinic.findUnique({
      where: { id: clinicId },
    });

    if (!clinic) {
      throw new NotFoundException('Cơ sở phòng khám không tồn tại');
    }

    // Create appointment
    const appointment = await this.prisma.appointment.create({
      data: {
        date: new Date(date),
        status: 'SCHEDULED',
        paymentStatus: 'PENDING',
        notes,
        patientId: user.userId,
        patientName,
        patientDob: new Date(patientDob),
        patientPhone,
        patientGender,
        doctorId,
        serviceId,
        clinicId,
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        doctor: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        service: true,
      },
    });

    return this.formatAppointmentResponse(appointment);
  }

  /**
   * Get all appointments with filters
   */
  async findAll(
    query: GetAppointmentsQueryDtoType,
  ): Promise<AppointmentsListResponseDtoType> {
    const {
      page,
      limit,
      status,
      paymentStatus,
      doctorId,
      patientId,
      dateFrom,
      dateTo,
    } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (status) where.status = status;
    if (paymentStatus) where.paymentStatus = paymentStatus;
    if (doctorId) where.doctorId = doctorId;
    if (patientId) where.patientId = patientId;
    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) where.date.gte = new Date(dateFrom);
      if (dateTo) where.date.lte = new Date(dateTo);
    }

    const [appointments, total] = await Promise.all([
      this.prisma.appointment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { date: 'asc' },
        include: {
          patient: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
            },
          },
          doctor: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
          service: true,
        },
      }),
      this.prisma.appointment.count({ where }),
    ]);

    return {
      data: appointments.map((appointment) =>
        this.formatAppointmentResponse(appointment),
      ),
      total,
      page,
      limit,
    };
  }

  /**
   * Get appointment by ID
   */
  async findOne(id: number): Promise<AppointmentResponseDtoType> {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        doctor: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        service: true,
      },
    });

    if (!appointment) {
      throw new NotFoundException('Lịch hẹn không tồn tại');
    }

    return this.formatAppointmentResponse(appointment);
  }

  /**
   * Update appointment
   */
  async update(
    id: number,
    updateAppointmentDto: UpdateAppointmentDtoType,
    @CurrentUser() user: TokenPayload,
  ): Promise<AppointmentResponseDtoType> {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
      include: { doctor: true },
    });

    if (!appointment) {
      throw new NotFoundException('Lịch hẹn không tồn tại');
    }

    // Check permissions
    if (
      user.role !== 'ADMIN' &&
      appointment.patientId !== user.userId &&
      appointment.doctor.userId !== user.userId
    ) {
      throw new ForbiddenException('Không có quyền cập nhật lịch hẹn này');
    }

    const updatedAppointment = await this.prisma.appointment.update({
      where: { id },
      data: {
        ...(updateAppointmentDto.date && {
          date: new Date(updateAppointmentDto.date),
        }),
        ...(updateAppointmentDto.status && {
          status: updateAppointmentDto.status,
        }),
        ...(updateAppointmentDto.paymentStatus && {
          paymentStatus: updateAppointmentDto.paymentStatus,
        }),
        ...(updateAppointmentDto.notes !== undefined && {
          notes: updateAppointmentDto.notes,
        }),
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        doctor: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        service: true,
      },
    });

    return this.formatAppointmentResponse(updatedAppointment);
  }

  /**
   * Delete appointment
   */
  async remove(
    id: number,
    @CurrentUser() user: TokenPayload,
  ): Promise<{ message: string }> {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
    });

    if (!appointment) {
      throw new NotFoundException('Lịch hẹn không tồn tại');
    }

    // Check permissions
    if (user.role !== 'ADMIN' && appointment.patientId !== user.userId) {
      throw new ForbiddenException('Không có quyền xóa lịch hẹn này');
    }

    await this.prisma.appointment.delete({
      where: { id },
    });

    return { message: 'Xóa lịch hẹn thành công' };
  }

  /**
   * Get current user's appointments
   */
  async getMyAppointments(
    query: GetAppointmentsQueryDtoType,
    @CurrentUser() user: TokenPayload,
  ): Promise<AppointmentsListResponseDtoType> {
    return this.findAll({
      ...query,
      patientId: user.userId,
    });
  }

  /**
   * Get doctor's appointments
   */
  async getDoctorAppointments(
    query: GetAppointmentsQueryDtoType,
    @CurrentUser() user: TokenPayload,
  ): Promise<AppointmentsListResponseDtoType> {
    // Get doctor profile
    const doctorProfile = await this.prisma.doctorProfile.findUnique({
      where: { userId: user.userId },
    });

    if (!doctorProfile) {
      throw new NotFoundException('Không tìm thấy hồ sơ bác sĩ');
    }

    return this.findAll({
      ...query,
      doctorId: doctorProfile.id,
    });
  }

  /**
   * Format appointment response
   */
  private formatAppointmentResponse(
    appointment: any,
  ): AppointmentResponseDtoType {
    return {
      id: appointment.id,
      date: appointment.date.toISOString(),
      status: appointment.status,
      paymentStatus: appointment.paymentStatus,
      notes: appointment.notes,
      patient: {
        id: appointment.patient.id,
        firstName: appointment.patient.firstName,
        lastName: appointment.patient.lastName,
        email: appointment.patient.email,
        phone: appointment.patient.phone,
      },
      doctor: {
        id: appointment.doctor.id,
        specialty: appointment.doctor.specialty,
        user: {
          id: appointment.doctor.user.id,
          firstName: appointment.doctor.user.firstName,
          lastName: appointment.doctor.user.lastName,
        },
      },
      service: {
        id: appointment.service.id,
        name: appointment.service.name,
        price: appointment.service.price,
        duration: appointment.service.duration,
      },
      createdAt: appointment.createdAt.toISOString(),
      updatedAt: appointment.updatedAt.toISOString(),
    };
  }
}
