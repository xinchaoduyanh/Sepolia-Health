import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import type { TokenPayload } from '@/common/types';
import type {
  CreateAppointmentFromDoctorServiceDtoType,
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
          date: new Date(updateAppointmentDto.date + 'T00:00:00.000Z'),
        }),
        ...(updateAppointmentDto.startTime && {
          startTime: updateAppointmentDto.startTime,
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
   * Get all locations (clinics)
   */
  async getLocations() {
    const locations = await this.prisma.clinic.findMany({
      where: {
        isActive: true,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        address: true,
        phone: true,
        email: true,
        description: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return {
      data: locations,
      total: locations.length,
    };
  }

  /**
   * Get all services
   */
  async getServices() {
    const services = await this.prisma.service.findMany({
      select: {
        id: true,
        name: true,
        price: true,
        duration: true,
        description: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return {
      data: services,
      total: services.length,
    };
  }

  /**
   * Get doctor services by location and service
   */
  async getDoctorServices(locationId: number, serviceId: number) {
    // First check if location exists
    const location = await this.prisma.clinic.findUnique({
      where: { id: locationId },
    });

    if (!location) {
      throw new NotFoundException('Cơ sở phòng khám không tồn tại');
    }

    // Check if service exists
    const service = await this.prisma.service.findUnique({
      where: { id: serviceId },
    });

    if (!service) {
      throw new NotFoundException('Dịch vụ không tồn tại');
    }

    // Get doctor services that match both location and service
    const doctorServices = await this.prisma.doctorService.findMany({
      where: {
        serviceId: serviceId,
        doctor: {
          clinicId: locationId,
          deletedAt: null,
        },
        deletedAt: null,
      },
      include: {
        doctor: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true,
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
          },
        },
      },
    });

    // Format response
    const formattedData = doctorServices.map((ds) => ({
      id: ds.id,
      doctorId: ds.doctorId,
      serviceId: ds.serviceId,
      clinicId: ds.doctor.clinicId,
      doctor: {
        id: ds.doctor.id,
        specialty: ds.doctor.specialty,
        experience: ds.doctor.experience,
        contactInfo: ds.doctor.contactInfo,
        user: {
          id: ds.doctor.user.id,
          firstName: ds.doctor.user.firstName,
          lastName: ds.doctor.user.lastName,
          avatar: ds.doctor.user.avatar,
        },
      },
      service: ds.service,
      location: {
        id: location.id,
        name: location.name,
        address: location.address,
        phone: location.phone,
        email: location.email,
      },
    }));

    return {
      data: formattedData,
      total: formattedData.length,
    };
  }

  /**
   * Create appointment from DoctorService
   */
  async createFromDoctorService(
    createAppointmentDto: CreateAppointmentFromDoctorServiceDtoType,
    @CurrentUser() user: TokenPayload,
  ): Promise<AppointmentResponseDtoType> {
    const {
      doctorServiceId,
      date,
      startTime,
      notes,
      patientName,
      patientDob,
      patientPhone,
      patientGender,
    } = createAppointmentDto;

    // Get DoctorService with all related data
    const doctorService = await this.prisma.doctorService.findUnique({
      where: { id: doctorServiceId },
      include: {
        doctor: {
          include: {
            user: true,
          },
        },
        service: true,
      },
    });

    if (!doctorService) {
      throw new NotFoundException('Dịch vụ bác sĩ không tồn tại');
    }

    // Check if doctor is active
    if (doctorService.doctor.deletedAt) {
      throw new BadRequestException('Bác sĩ không còn hoạt động');
    }

    // Check if clinic exists and is active
    if (!doctorService.doctor.clinicId) {
      throw new BadRequestException('Bác sĩ chưa được gán cơ sở phòng khám');
    }

    const clinic = await this.prisma.clinic.findUnique({
      where: { id: doctorService.doctor.clinicId },
    });

    if (!clinic || clinic.deletedAt) {
      throw new NotFoundException(
        'Cơ sở phòng khám không tồn tại hoặc không hoạt động',
      );
    }

    // Create appointment using data from DoctorService
    const appointment = await this.prisma.appointment.create({
      data: {
        date: new Date(date + 'T00:00:00.000Z'),
        startTime,
        status: 'PENDING',
        paymentStatus: 'PENDING',
        notes,
        patientId: user.userId,
        patientName,
        patientDob: new Date(patientDob + 'T00:00:00.000Z'),
        patientPhone,
        patientGender,
        doctorId: doctorService.doctorId,
        serviceId: doctorService.serviceId,
        clinicId: doctorService.doctor.clinicId,
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
