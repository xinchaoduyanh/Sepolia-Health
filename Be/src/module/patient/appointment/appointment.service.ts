import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { MESSAGES } from '@/common/constants/messages';
import { PrismaService } from '@/common/prisma/prisma.service';
import { DayOfWeek, AppointmentStatus, PaymentStatus } from '@prisma/client';
import type { TokenPayload } from '@/common/types';
import type {
  CreateAppointmentFromDoctorServiceDtoType,
  GetAppointmentsQueryDtoType,
  AppointmentResponseDtoType,
  AppointmentsListResponseDtoType,
  UpdateAppointmentDto,
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
      page = 1,
      limit = 10,
      status,
      paymentStatus,
      doctorId,
      patientId,
      dateFrom,
      dateTo,
    } = query;
    const skip = (Number(page) - 1) * Number(limit);

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
        take: Number(limit),
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
      appointments: appointments.map((appointment) =>
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
    updateAppointmentDto: UpdateAppointmentDto,
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
          status: updateAppointmentDto.status as AppointmentStatus,
        }),
        ...(updateAppointmentDto.paymentStatus && {
          paymentStatus: updateAppointmentDto.paymentStatus as PaymentStatus,
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

    if (patientProfileIds.length === 0) {
      // Return empty result if no patient profiles
      return {
        appointments: [],
        total: 0,
        page: query.page || 1,
        limit: query.limit || 10,
      };
    }

    // Query appointments for all patient profiles
    const {
      page = 1,
      limit = 10,
      status,
      paymentStatus,
      doctorId,
      dateFrom,
      dateTo,
    } = query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {
      patientProfileId: { in: patientProfileIds }, // Query all patient profiles
    };

    if (status) where.status = status;
    if (paymentStatus) where.paymentStatus = paymentStatus;
    if (doctorId) where.doctorId = doctorId;
    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) where.date.gte = new Date(dateFrom);
      if (dateTo) where.date.lte = new Date(dateTo);
    }

    const [appointments, total] = await Promise.all([
      this.prisma.appointment.findMany({
        where,
        skip,
        take: Number(limit),
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
      appointments: appointments.map((appointment) =>
        this.formatAppointmentResponse(appointment),
      ),
      total,
      page,
      limit,
    };
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
        date: new Date(date),
        startTime,
        endTime,
        status: 'CREATED',
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

    // If doctor doesn't work on this day, return empty time slots
    if (!workingHours) {
      return {
        doctorId: doctorService.doctor.id,
        doctorName: `${doctorService.doctor.firstName} ${doctorService.doctor.lastName}`,
        specialty: doctorService.doctor.specialty,
        serviceName: doctorService.service.name,
        serviceDuration: doctorService.service.duration,
        date: date,
        workingHours: {
          startTime: '08:00',
          endTime: '17:00',
        },
        availableTimeSlots: [],
      };
    }

    // Get existing appointments for the date
    const bookedAppointments = await this.prisma.appointment.findMany({
      where: {
        doctorId: doctorService.doctor.id,
        date: targetDate,
        status: {
          in: ['CREATED', 'UPCOMING', 'ON_GOING'],
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

    // Generate available time slots
    const availableTimeSlots = this.generateAvailableTimeSlots(
      workingHours.startTime,
      workingHours.endTime,
      doctorService.service.duration,
      bookedAppointments,
    );

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
      availableTimeSlots,
    };
  }

  /**
   * Get available dates for a doctor service within a date range
   */
  async getAvailableDates(
    doctorServiceId: number,
    startDate: string,
    endDate: string,
  ) {
    // Validate date formats
    if (isNaN(Date.parse(startDate)) || isNaN(Date.parse(endDate))) {
      throw new BadRequestException(MESSAGES.APPOINTMENT.INVALID_DATE);
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Check if dates are valid
    if (start >= end) {
      throw new BadRequestException('Ngày bắt đầu phải nhỏ hơn ngày kết thúc');
    }

    // Check if start date is not in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (start < today) {
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

    // Get all working hours for the doctor
    const workingHours = await this.prisma.doctorAvailability.findMany({
      where: {
        doctorId: doctorService.doctor.id,
      },
    });

    if (workingHours.length === 0) {
      throw new NotFoundException('Bác sĩ chưa có lịch làm việc');
    }

    // Create a map of day of week to working hours
    const workingHoursMap = new Map<
      DayOfWeek,
      { startTime: string; endTime: string }
    >();
    workingHours.forEach((wh) => {
      workingHoursMap.set(wh.dayOfWeek, {
        startTime: wh.startTime,
        endTime: wh.endTime,
      });
    });

    // Generate available dates
    const availableDates: Array<{
      date: string;
      dayOfWeek: DayOfWeek;
      workingHours: {
        startTime: string;
        endTime: string;
      };
    }> = [];
    const currentDate = new Date(start);

    while (currentDate <= end) {
      const dayOfWeek = this.getDayOfWeek(currentDate);
      const workingHour = workingHoursMap.get(dayOfWeek);

      if (workingHour) {
        availableDates.push({
          date: currentDate.toISOString().split('T')[0], // YYYY-MM-DD format
          dayOfWeek: dayOfWeek,
          workingHours: {
            startTime: workingHour.startTime,
            endTime: workingHour.endTime,
          },
        });
      }

      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return {
      doctorId: doctorService.doctor.id,
      doctorName: `${doctorService.doctor.firstName} ${doctorService.doctor.lastName}`,
      specialty: doctorService.doctor.specialty,
      serviceName: doctorService.service.name,
      serviceDuration: doctorService.service.duration,
      availableDates,
    };
  }

  /**
   * Generate available time slots for a doctor on a specific date
   */
  private generateAvailableTimeSlots(
    startTime: string,
    endTime: string,
    serviceDuration: number,
    bookedAppointments: Array<{
      startTime: string;
      endTime: string;
      patientName: string;
      status: string;
    }>,
  ) {
    const slots: Array<{
      startTime: string;
      endTime: string;
      displayTime: string;
      period: 'morning' | 'afternoon';
    }> = [];
    const start = this.timeToMinutes(startTime);
    const end = this.timeToMinutes(endTime);
    const duration = serviceDuration;

    // Generate time slots every 30 minutes, but each slot has the full service duration
    for (let time = start; time + duration <= end; time += 30) {
      const slotStartTime = this.minutesToTime(time);
      const slotEndTime = this.minutesToTime(time + duration);

      // Check if this slot conflicts with any booked appointment
      const isAvailable = !bookedAppointments.some((apt) => {
        const aptStart = this.timeToMinutes(apt.startTime);
        const aptEnd = this.timeToMinutes(apt.endTime);

        // Check for overlap - slot must not overlap with any existing appointment
        return time < aptEnd && time + duration > aptStart;
      });

      if (isAvailable) {
        slots.push({
          startTime: slotStartTime,
          endTime: slotEndTime,
          displayTime: `${slotStartTime} - ${slotEndTime}`,
          period: time < 12 * 60 ? 'morning' : 'afternoon', // Before 12:00 is morning
        });
      }
    }

    return slots;
  }

  /**
   * Convert time string (HH:mm) to minutes since midnight
   */
  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * Convert minutes since midnight to time string (HH:mm)
   */
  private minutesToTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
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
