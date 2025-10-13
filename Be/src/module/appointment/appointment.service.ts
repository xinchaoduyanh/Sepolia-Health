import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { MESSAGES } from '@/common/constants/messages';
import { PrismaService } from '@/common/prisma/prisma.service';
import { DayOfWeek } from '@prisma/client';
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
    if (patientId) where.patientProfileId = patientId;
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
          patientProfile: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              phone: true,
            },
          },
          doctor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              specialty: true,
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
        patientProfile: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
        doctor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            specialty: true,
          },
        },
        service: true,
      },
    });

    if (!appointment) {
      throw new NotFoundException(MESSAGES.APPOINTMENT.APPOINTMENT_NOT_FOUND);
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
      include: {
        doctor: true,
        patientProfile: true,
      },
    });

    if (!appointment) {
      throw new NotFoundException(MESSAGES.APPOINTMENT.APPOINTMENT_NOT_FOUND);
    }

    // Check permissions
    if (
      user.role !== 'ADMIN' &&
      appointment.patientProfile?.managerId !== user.userId &&
      appointment.doctor.userId !== user.userId
    ) {
      throw new ForbiddenException(MESSAGES.APPOINTMENT.UNAUTHORIZED_ACCESS);
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
        patientProfile: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
        doctor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            specialty: true,
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
      include: { patientProfile: true },
    });

    if (!appointment) {
      throw new NotFoundException(MESSAGES.APPOINTMENT.APPOINTMENT_NOT_FOUND);
    }

    // Check permissions
    if (
      user.role !== 'ADMIN' &&
      appointment.patientProfile?.managerId !== user.userId
    ) {
      throw new ForbiddenException(MESSAGES.APPOINTMENT.UNAUTHORIZED_ACCESS);
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
    // Find patient profiles managed by this user
    const patientProfiles = await this.prisma.patientProfile.findMany({
      where: { managerId: user.userId },
      select: { id: true },
    });

    const patientProfileIds = patientProfiles.map((p) => p.id);

    return this.findAll({
      ...query,
      patientId: patientProfileIds.length > 0 ? patientProfileIds[0] : -1, // Use first profile or invalid ID
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
      throw new NotFoundException(
        MESSAGES.APPOINTMENT.DOCTOR_SERVICE_NOT_FOUND,
      );
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
      throw new NotFoundException(MESSAGES.APPOINTMENT.LOCATION_NOT_FOUND);
    }

    // Check if service exists
    const service = await this.prisma.service.findUnique({
      where: { id: serviceId },
    });

    if (!service) {
      throw new NotFoundException(MESSAGES.APPOINTMENT.SERVICE_NOT_FOUND);
    }

    // Get doctor services that match both location and service
    const doctorServices = await this.prisma.doctorService.findMany({
      where: {
        serviceId: serviceId,
        doctor: {
          clinicId: locationId,
        },
      },
      include: {
        doctor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            specialty: true,
            experience: true,
            contactInfo: true,
            avatar: true,
            clinicId: true,
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
        firstName: ds.doctor.firstName,
        lastName: ds.doctor.lastName,
        specialty: ds.doctor.specialty,
        experience: ds.doctor.experience,
        contactInfo: ds.doctor.contactInfo,
        avatar: ds.doctor.avatar,
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
      patientProfileId,
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
      throw new NotFoundException(
        MESSAGES.APPOINTMENT.DOCTOR_SERVICE_NOT_FOUND,
      );
    }

    // Doctor is always active in new schema

    // Check if clinic exists and is active
    if (!doctorService.doctor.clinicId) {
      throw new BadRequestException(MESSAGES.APPOINTMENT.DOCTOR_NO_CLINIC);
    }

    const clinic = await this.prisma.clinic.findUnique({
      where: { id: doctorService.doctor.clinicId },
    });

    if (!clinic || !clinic.isActive) {
      throw new NotFoundException(MESSAGES.APPOINTMENT.CLINIC_NOT_FOUND);
    }

    // Validate patientProfileId if provided
    let validatedPatientProfileId: number | null = null;
    if (patientProfileId) {
      const patientProfile = await this.prisma.patientProfile.findUnique({
        where: { id: patientProfileId },
        select: { id: true, managerId: true },
      });

      if (!patientProfile) {
        throw new NotFoundException(
          MESSAGES.APPOINTMENT.PATIENT_PROFILE_NOT_FOUND,
        );
      }

      if (patientProfile.managerId !== user.userId) {
        throw new ForbiddenException(
          MESSAGES.APPOINTMENT.PATIENT_PROFILE_NOT_OWNED,
        );
      }

      validatedPatientProfileId = patientProfile.id;
    }

    // Calculate end time based on service duration
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = startMinutes + doctorService.service.duration;
    const endHour = Math.floor(endMinutes / 60);
    const endMinute = endMinutes % 60;
    const endTime = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;

    // Create appointment using data from DoctorService
    const appointment = await this.prisma.appointment.create({
      data: {
        date: new Date(date + 'T00:00:00.000Z'),
        startTime,
        endTime,
        status: 'REQUESTED',
        paymentStatus: 'PENDING',
        notes,
        patientProfileId: validatedPatientProfileId,
        patientName,
        patientDob: new Date(patientDob + 'T00:00:00.000Z'),
        patientPhone,
        patientGender,
        doctorId: doctorService.doctorId,
        serviceId: doctorService.serviceId,
        clinicId: doctorService.doctor.clinicId,
      },
      include: {
        patientProfile: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
        doctor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            specialty: true,
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
      startTime: appointment.startTime,
      endTime: appointment.endTime,
      status: appointment.status,
      paymentStatus: appointment.paymentStatus,
      notes: appointment.notes,
      patient: appointment.patientProfile
        ? {
            id: appointment.patientProfile.id,
            firstName: appointment.patientProfile.firstName,
            lastName: appointment.patientProfile.lastName,
            email: '', // Patient profile doesn't have email
            phone: appointment.patientProfile.phone,
          }
        : {
            id: 0,
            firstName: appointment.patientName,
            lastName: '',
            email: '',
            phone: appointment.patientPhone,
          },
      doctor: {
        id: appointment.doctor.id,
        specialty: appointment.doctor.specialty,
        user: {
          id: appointment.doctor.id,
          firstName: appointment.doctor.firstName,
          lastName: appointment.doctor.lastName,
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

  /**
   * Get doctor availability for a specific date (simple version)
   */
  async getDoctorAvailability(doctorServiceId: number, date: string) {
    // Validate date format (like dateOfBirth in complete-register)
    if (isNaN(Date.parse(date))) {
      throw new BadRequestException(MESSAGES.APPOINTMENT.INVALID_DATE);
    }
    const targetDate = new Date(date);

    // Check if date is in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (targetDate < today) {
      throw new BadRequestException(MESSAGES.APPOINTMENT.PAST_DATE);
    }

    // Get doctor service info
    const doctorService = await this.prisma.doctorService.findUnique({
      where: { id: doctorServiceId },
      include: {
        doctor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            specialty: true,
          },
        },
        service: {
          select: {
            id: true,
            name: true,
            duration: true,
          },
        },
      },
    });

    if (!doctorService) {
      throw new NotFoundException(
        MESSAGES.APPOINTMENT.DOCTOR_SERVICE_NOT_FOUND,
      );
    }

    // Get doctor's working hours for the day of week
    const dayOfWeek = this.getDayOfWeek(targetDate);
    const workingHours = await this.prisma.doctorAvailability.findUnique({
      where: {
        doctorId_dayOfWeek: {
          doctorId: doctorService.doctor.id,
          dayOfWeek: dayOfWeek,
        },
      },
    });

    // If doctor doesn't work on this day, throw error
    if (!workingHours) {
      throw new NotFoundException(MESSAGES.APPOINTMENT.DOCTOR_NOT_AVAILABLE);
    }

    // Get existing appointments for the date
    const bookedAppointments = await this.prisma.appointment.findMany({
      where: {
        doctorId: doctorService.doctor.id,
        date: targetDate,
        status: {
          in: ['REQUESTED', 'CONFIRMED', 'CHECKED_IN'],
        },
      },
      select: {
        startTime: true,
        endTime: true,
        patientName: true,
        status: true,
      },
      orderBy: {
        startTime: 'asc',
      },
    });

    return {
      doctorId: doctorService.doctor.id,
      doctorName: `${doctorService.doctor.firstName} ${doctorService.doctor.lastName}`,
      specialty: doctorService.doctor.specialty,
      serviceName: doctorService.service.name,
      serviceDuration: doctorService.service.duration,
      date: date,
      workingHours: {
        startTime: workingHours.startTime,
        endTime: workingHours.endTime,
      },
      bookedAppointments: bookedAppointments.map((apt) => ({
        startTime: apt.startTime,
        endTime: apt.endTime,
        patientName: apt.patientName,
        status: apt.status,
      })),
    };
  }

  /**
   * Get day of week from date
   */
  private getDayOfWeek(date: Date): DayOfWeek {
    const days: DayOfWeek[] = [
      'SUNDAY',
      'MONDAY',
      'TUESDAY',
      'WEDNESDAY',
      'THURSDAY',
      'FRIDAY',
      'SATURDAY',
    ];
    return days[date.getDay()];
  }
}
