import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import {
  AppointmentStatus,
  AppointmentType,
  PaymentStatus,
} from '@prisma/client';
import {
  UpdateAppointmentDto,
  GetAppointmentsQueryDto,
  GetAvailableDateQueryDto,
  GetDoctorServicesQueryDto,
  AppointmentsListResponseDto,
  GetDoctorAvailabilityQueryDto,
  CreateAppointmentFromDoctorServiceBodyDto,
  GetDoctorAvailabilityResponseDto,
  GetAvailabilityDateResponseDto,
  AppointmentDetailResponseDto,
  AvailableDateDto,
} from './dto';
import { NotificationService } from '@/module/notification/notification.service';
import {
  NotificationPriority,
  NotificationType,
} from '@/module/notification/notification.types';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import { DateUtil, TimeUtil } from '@/common/utils';
import { SortOrder } from '@/common/enum/sort.enum';
import { ERROR_MESSAGES, MESSAGES } from '@/common/constants';
import { SuccessResponseDto } from '@/common/dto';

@Injectable()
export class AppointmentService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('appointment') private readonly appointmentQueue: Queue,
    private readonly notificationService: NotificationService,
  ) { }

  /**
   * Get all appointments with filters
   */
  async findAll(
    query: GetAppointmentsQueryDto,
  ): Promise<AppointmentsListResponseDto> {
    const {
      page = 1,
      limit = 10,
      status,
      doctorId,
      patientId,
      dateFrom,
      dateTo,
      sortBy = 'date',
      sortOrder = SortOrder.DESC,
    } = query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};

    if (status) where.status = status;
    if (doctorId) where.doctorId = doctorId;
    if (patientId) where.patientProfileId = patientId;
    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) where.date.gte = new Date(dateFrom);
      if (dateTo) where.date.lte = new Date(dateTo);
    }

    // Build orderBy based on sortBy and sortOrder
    let orderBy: any = {};
    if (sortBy === 'status') {
      orderBy = { status: sortOrder };
    } else {
      // Default: sort by date
      orderBy = { date: sortOrder };
    }

    const [appointments, total] = await Promise.all([
      this.prisma.appointment.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy,
        include: {
          patientProfile: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              phone: true,
              relationship: true,
            },
          },
          doctor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          service: true,
          clinic: {
            select: {
              id: true,
              name: true,
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
  async findOne(id: number): Promise<AppointmentDetailResponseDto> {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
      include: {
        patientProfile: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            managerId: true, // Cần managerId để gửi notification
          },
        },
        doctor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        service: true,
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
        clinic: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!appointment) {
      throw new NotFoundException(MESSAGES.APPOINTMENT.APPOINTMENT_NOT_FOUND);
    }

    // Fetch doctorServiceId
    let doctorServiceId: number | undefined;
    if (appointment.doctorId && appointment.serviceId) {
      const doctorService = await this.prisma.doctorService.findUnique({
        where: {
          doctorId_serviceId: {
            doctorId: appointment.doctorId,
            serviceId: appointment.serviceId,
          },
        },
        select: {
          id: true,
        },
      });
      doctorServiceId = doctorService?.id;
    }

    return {
      ...appointment,
      doctorServiceId,
    };
  }

  /**
   * Update appointment
   */
  async update(
    id: number,
    body: UpdateAppointmentDto,
    userId: number,
  ): Promise<AppointmentDetailResponseDto> {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
      include: {
        doctor: true,
        service: true,
        patientProfile: true,
      },
    });

    if (!appointment) {
      throw new NotFoundException(MESSAGES.APPOINTMENT.APPOINTMENT_NOT_FOUND);
    }

    // Check permissions
    if (
      appointment.patientProfile?.managerId !== userId &&
      appointment.doctor.userId !== userId
    ) {
      throw new ForbiddenException(MESSAGES.APPOINTMENT.UNAUTHORIZED_ACCESS);
    }

    if (!appointment.patientProfileId) {
      throw new BadRequestException(
        MESSAGES.APPOINTMENT.PATIENT_PROFILE_NOT_FOUND,
      );
    }

    await this.checkConflict(
      body.startTime,
      body.endTime,
      appointment.doctorId,
      appointment.service.duration,
      appointment.patientProfileId,
      userId,
    );

    if (TimeUtil.isLessThanFourHours(new Date(), appointment.startTime)) {
      throw new ForbiddenException(ERROR_MESSAGES.APPOINTMENT.CAN_NOT_UPDATE);
    }

    const updatedAppointment = await this.prisma.appointment.update({
      where: { id },
      data: {
        ...body,
      },
      include: {
        patientProfile: true,
        doctor: true,
        service: true,
        billing: true,
        clinic: true,
      },
    });

    return this.formatAppointmentResponse(updatedAppointment);
  }

  /**
   * Cancel appointment
   */
  async cancelAppointment(
    id: number,
    userId: number,
  ): Promise<SuccessResponseDto> {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
      include: { patientProfile: true },
    });

    if (!appointment) {
      throw new NotFoundException(MESSAGES.APPOINTMENT.APPOINTMENT_NOT_FOUND);
    }

    // Check permissions
    if (appointment.patientProfile?.managerId !== userId) {
      throw new ForbiddenException(MESSAGES.APPOINTMENT.UNAUTHORIZED_ACCESS);
    }

    if (TimeUtil.isLessThanFourHours(new Date(), appointment.startTime)) {
      throw new ForbiddenException(ERROR_MESSAGES.APPOINTMENT.CAN_NOT_CANCEL);
    }

    await this.prisma.appointment.update({
      where: { id },
      data: {
        status: AppointmentStatus.CANCELLED,
      },
    });

    return new SuccessResponseDto();
  }

  /**
   * Get current user's appointments
   */
  async getMyAppointments(
    query: GetAppointmentsQueryDto,
    userId: number,
  ): Promise<AppointmentsListResponseDto> {
    // Find patient profiles managed by this user
    const patientProfiles = await this.prisma.patientProfile.findMany({
      where: { managerId: userId },
      select: { id: true },
    });

    const patientProfileIds = patientProfiles.map((p) => p.id);

    if (patientProfileIds.length === 0) {
      // Return empty result if no patient profiles
      return {
        data: [],
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
      billingStatus,
      doctorId,
      dateFrom,
      dateTo,
      sortBy = 'date',
      sortOrder = SortOrder.DESC,
    } = query;

    // Ensure sortBy and sortOrder are properly set
    const finalSortBy = sortBy || 'date';
    const finalSortOrder = sortOrder || SortOrder.DESC;

    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {
      patientProfileId: { in: patientProfileIds }, // Query all patient profiles
    };

    if (status) where.status = status;
    if (doctorId) where.doctorId = doctorId;
    if (billingStatus) {
      where.billing = {
        status: billingStatus,
      };
    }
    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) where.date.gte = new Date(dateFrom);
      if (dateTo) where.date.lte = new Date(dateTo);
    }

    // Build orderBy based on sortBy and sortOrder
    // Note: Prisma doesn't support nested orderBy for billing.status
    // So we need to fetch all matching appointments, sort in memory, then paginate
    let orderBy: any = {};
    let shouldSortInMemory = false;

    if (finalSortBy === 'status') {
      orderBy = { status: finalSortOrder };
    } else if (finalSortBy === 'billingStatus') {
      // For billingStatus, we need to sort in memory
      shouldSortInMemory = true;
      orderBy = { startTime: SortOrder.ASC }; // Temporary orderBy, will be overridden
    } else {
      // Default: sort by date
      orderBy = { startTime: finalSortOrder };
    }

    // If sorting by billingStatus, fetch all then sort in memory
    if (shouldSortInMemory) {
      const allAppointments = await this.prisma.appointment.findMany({
        where,
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
            },
          },
          service: true,
          clinic: {
            select: {
              id: true,
              name: true,
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

      // Sort by billing status
      // asc: PENDING -> PAID -> REFUNDED (Chưa thanh toán trước)
      // desc: PAID -> PENDING -> REFUNDED (Đã thanh toán trước)
      allAppointments.sort((a, b) => {
        const aStatus = a.billing?.status || PaymentStatus.PENDING;
        const bStatus = b.billing?.status || PaymentStatus.PENDING;

        if (finalSortOrder === SortOrder.ASC) {
          // PENDING (1) -> PAID (2) -> REFUNDED (3)
          const statusOrder = { PENDING: 1, PAID: 2, REFUNDED: 3 };
          const aOrder = statusOrder[aStatus] || 0;
          const bOrder = statusOrder[bStatus] || 0;
          return aOrder - bOrder;
        } else {
          // PAID (1) -> PENDING (2) -> REFUNDED (3)
          const statusOrder = { PAID: 1, PENDING: 2, REFUNDED: 3 };
          const aOrder = statusOrder[aStatus] || 0;
          const bOrder = statusOrder[bStatus] || 0;
          return aOrder - bOrder;
        }
      });

      // Paginate after sorting
      const total = allAppointments.length;
      const paginatedAppointments = allAppointments.slice(
        skip,
        skip + Number(limit),
      );

      return {
        data: paginatedAppointments.map((appointment) =>
          this.formatAppointmentResponse(appointment),
        ),
        total,
        page,
        limit,
      };
    }

    const [appointments, total] = await Promise.all([
      this.prisma.appointment.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy,
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
            },
          },
          service: true,
          clinic: {
            select: {
              id: true,
              name: true,
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
   * Get doctor's appointments
   */
  async getDoctorAppointments(
    query: GetAppointmentsQueryDto,
    userId: number,
  ): Promise<AppointmentsListResponseDto> {
    // Get doctor profile
    const doctorProfile = await this.prisma.doctorProfile.findUnique({
      where: { userId: userId },
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
   * Get closest upcoming appointment for current user
   * Returns null if no appointment found
   */
  async getClosestAppointment(
    userId: number,
  ): Promise<AppointmentDetailResponseDto | null> {
    // Find patient profiles managed by this user
    const patientProfiles = await this.prisma.patientProfile.findMany({
      where: { managerId: userId },
      select: { id: true },
    });

    const patientProfileIds = patientProfiles.map((p) => p.id);
    if (patientProfileIds.length === 0) {
      // No patient profiles, return null
      return null;
    }

    const appointments = await this.prisma.appointment.findMany({
      where: {
        patientProfileId: { in: patientProfileIds },
        startTime: { gte: new Date() },
        status: {
          in: [AppointmentStatus.UPCOMING, AppointmentStatus.ON_GOING],
        },
      },
      orderBy: { startTime: SortOrder.ASC },
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
          },
        },
        service: true,
        clinic: {
          select: {
            id: true,
            name: true,
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

    // If no appointments found, return null (frontend will handle display)
    if (!appointments || appointments.length === 0) {
      return null;
    }

    // Return the closest appointment (already sorted by date and startTime)
    return this.formatAppointmentResponse(appointments[0]);
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
        name: SortOrder.ASC,
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
        name: SortOrder.ASC,
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
  async getDoctorServices(query: GetDoctorServicesQueryDto) {
    const { serviceId, locationId } = query;
    // Check if service exists
    const service = await this.prisma.service.findUnique({
      where: { id: serviceId },
    });

    if (!service) {
      throw new NotFoundException(MESSAGES.APPOINTMENT.SERVICE_NOT_FOUND);
    }

    const location = await this.prisma.clinic.findUnique({
      where: { id: locationId },
    });

    if (!location) {
      throw new NotFoundException(MESSAGES.APPOINTMENT.LOCATION_NOT_FOUND);
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
            experience: true,
            contactInfo: true,
            avatar: true,
          },
        },
      },
    });

    // Format response
    const formattedData = doctorServices.map((ds) => ({
      id: ds.id,
      doctorId: ds.doctorId,
      serviceId: ds.serviceId,
      doctor: {
        id: ds.doctorId,
        firstName: ds.doctor.firstName,
        lastName: ds.doctor.lastName,
        experience: ds.doctor.experience,
        contactInfo: ds.doctor.contactInfo,
        avatar: ds.doctor.avatar,
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
    createAppointmentDto: CreateAppointmentFromDoctorServiceBodyDto,
    userId: number,
  ): Promise<AppointmentDetailResponseDto> {
    const { doctorServiceId, startTime, endTime, notes, patientProfileId } =
      createAppointmentDto;

    const doctorService = await this.prisma.doctorService.findUnique({
      where: { id: doctorServiceId },
      include: {
        doctor: true,
        service: true,
      },
    });

    if (!doctorService) {
      throw new NotFoundException(
        MESSAGES.APPOINTMENT.DOCTOR_SERVICE_NOT_FOUND,
      );
    }
    if (!doctorService.doctor.clinicId) {
      throw new BadRequestException(MESSAGES.APPOINTMENT.DOCTOR_NO_CLINIC);
    }
    const clinic = await this.prisma.clinic.findUnique({
      where: { id: doctorService.doctor.clinicId },
    });

    if (!clinic || !clinic.isActive) {
      throw new NotFoundException(MESSAGES.APPOINTMENT.CLINIC_NOT_FOUND);
    }

    await this.checkConflict(
      startTime,
      endTime,
      doctorService.doctorId,
      doctorService.service.duration,
      patientProfileId,
      userId,
    );

    // Create appointment using data from DoctorService
    const appointment = await this.prisma.appointment.create({
      data: {
        startTime,
        endTime,
        status: AppointmentStatus.UPCOMING,
        notes,
        type: AppointmentType.OFFLINE,
        patientProfileId: patientProfileId,
        doctorId: doctorService.doctorId,
        serviceId: doctorService.serviceId,
        clinicId: doctorService.doctor.clinicId,
      },
      include: {
        patientProfile: true,
        doctor: true,
        service: true,
        clinic: true,
      },
    });

    // Create billing for the appointment
    const billing = await this.prisma.billing.create({
      data: {
        amount: doctorService.service.price,
        status: PaymentStatus.PENDING,
        appointmentId: appointment.id,
      },
    });

    // Send notification to patient
    try {
      const patientUserId = appointment.patientProfile?.managerId.toString();
      if (!patientUserId) {
        console.warn(
          '⚠️ [AppointmentService] Cannot send notification: patientProfile.managerId is missing',
        );
      } else {
        await this.notificationService.sendCreateAppointmentPatientNotification({
          appointmentId: appointment.id,
          startTime: appointment.startTime,
          doctorName: `${doctorService.doctor.firstName} ${doctorService.doctor.lastName}`,
          serviceName: doctorService.service.name,
          clinicName: clinic.name,
          recipientId: patientUserId,
        });
      }
    } catch (error) {
      console.error('Failed to send notification:', error);
      // Don't throw error, just log it
    }

    // Send notification to doctor
    try {
      await this.notificationService.sendCreateAppointmentDoctorNotification({
        appointmentId: appointment.id,
        startTime: appointment.startTime,
        patientName: `${appointment.patientProfile?.firstName} ${appointment.patientProfile?.lastName}`,
        serviceName: doctorService.service.name,
        clinicName: clinic.name,
        recipientId: doctorService.doctor.userId.toString(),
        notes: notes,
      });
    } catch (error) {
      console.error('Failed to send notification to doctor:', error);
      // Don't throw error, just log it
    }

    await this.appointmentQueue.add(
      'appointment',
      {
        appointmentId: appointment.id,
      },
      {
        delay: appointment.endTime.getTime() - Date.now(),
      },
    );

    // Return appointment response with all required data
    return this.formatAppointmentResponse({
      ...appointment,
      billing,
    });
  }

  /**
   * Format appointment response
   */
  private formatAppointmentResponse(
    appointment: any,
  ): AppointmentDetailResponseDto {
    if (!appointment) {
      throw new NotFoundException(MESSAGES.APPOINTMENT.APPOINTMENT_NOT_FOUND);
    }

    return {
      id: appointment.id,
      startTime: appointment.startTime,
      status: appointment.status,
      notes: appointment.notes,
      patient: appointment.patientProfile
        ? {
          id: appointment.patientProfile.id,
          firstName: appointment.patientProfile.firstName,
          lastName: appointment.patientProfile.lastName,
          phone: appointment.patientProfile.phone,
          email: appointment.patientProfile.email,
        }
        : {
          id: appointment.patientId,
          firstName: '',
          lastName: '',
          phone: '',
          email: '',
        },
      doctor: appointment.doctor
        ? {
          id: appointment.doctor.id,
          firstName: appointment.doctor.firstName,
          lastName: appointment.doctor.lastName,
        }
        : {
          id: appointment.doctorId,
          firstName: '',
          lastName: '',
        },
      service: appointment.service
        ? {
          id: appointment.service.id,
          name: appointment.service.name,
          price: appointment.service.price,
          duration: appointment.service.duration,
        }
        : {
          id: appointment.serviceId,
          name: '',
          price: 0,
          duration: 0,
        },
      clinic: appointment.clinic
        ? {
          id: appointment.clinic.id,
          name: appointment.clinic.name,
        }
        : {
          id: appointment.clinicId,
          name: '',
        },
      billing: appointment.billing
        ? {
          id: appointment.billing.id,
          amount: appointment.billing.amount,
          status: appointment.billing.status,
          paymentMethod: appointment.billing.paymentMethod,
          notes: appointment.billing.notes,
          createdAt: appointment.billing.createdAt,
        }
        : undefined,
      createdAt: appointment.createdAt,
      updatedAt: appointment.updatedAt,
    };
  }

  /**
   * Get doctor availability for a specific date (simple version)
   */
  async getDoctorAvailability(
    query: GetDoctorAvailabilityQueryDto,
  ): Promise<GetDoctorAvailabilityResponseDto> {
    const { doctorServiceId, date } = query;

    // Get doctor service info
    const doctorService = await this.prisma.doctorService.findUnique({
      where: { id: doctorServiceId },
      include: {
        doctor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
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
    const dayOfWeek = DateUtil.getDayOfWeek(date);
    const workingHours = await this.prisma.doctorAvailability.findUnique({
      where: {
        doctorId_dayOfWeek: {
          doctorId: doctorService.doctorId,
          dayOfWeek: dayOfWeek,
        },
      },
    });

    // If doctor doesn't work on this day, return empty time slots
    if (!workingHours) {
      return {
        doctorId: doctorService.doctorId,
        doctorName: `${doctorService.doctor.firstName} ${doctorService.doctor.lastName}`,
        serviceName: doctorService.service.name,
        serviceDuration: doctorService.service.duration,
        date,
        workingHours: {
          startTime: '08:00',
          endTime: '17:00',
        },
        availableTimeSlots: [],
      };
    }

    // Get existing appointments for the date
    // Convert date string (YYYY-MM-DD) to Date objects for start and end of day
    const startOfDay = DateUtil.startOfDay(new Date(date));
    const endOfDay = DateUtil.endOfDay(new Date(date));

    const bookedAppointments = await this.prisma.appointment.findMany({
      where: {
        doctorId: doctorService.doctorId,
        startTime: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: {
          in: [AppointmentStatus.UPCOMING, AppointmentStatus.ON_GOING],
        },
      },
      select: {
        startTime: true,
        endTime: true,
      },
      orderBy: {
        startTime: SortOrder.ASC,
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
      doctorId: doctorService.doctorId,
      doctorName: `${doctorService.doctor.firstName} ${doctorService.doctor.lastName}`,
      serviceName: doctorService.service.name,
      serviceDuration: doctorService.service.duration,
      date,
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
    query: GetAvailableDateQueryDto,
  ): Promise<GetAvailabilityDateResponseDto> {
    const { doctorServiceId, startTime, endTime } = query;

    // Get doctor service info
    const doctorService = await this.prisma.doctorService.findUnique({
      where: { id: doctorServiceId },
      include: {
        doctor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
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
        doctorId: doctorService.doctorId,
      },
    });

    if (workingHours.length === 0) {
      throw new NotFoundException(
        ERROR_MESSAGES.DOCTOR.DOCTOR_DOES_NOT_HAVE_SCHEDULE,
      );
    }

    // Create a map of day of week to working hours
    const workingHoursMap = new Map<
      number,
      { startTime: string; endTime: string }
    >();
    workingHours.forEach((wh) => {
      workingHoursMap.set(wh.dayOfWeek, {
        startTime: wh.startTime,
        endTime: wh.endTime,
      });
    });

    // Generate available dates
    const availableDates: Array<AvailableDateDto> = [];
    const currentDate = new Date(startTime);

    while (currentDate <= endTime) {
      const dayOfWeek = DateUtil.getDayOfWeek(currentDate);
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
      doctorId: doctorService.doctorId,
      doctorName: `${doctorService.doctor.firstName} ${doctorService.doctor.lastName}`,
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
      startTime: Date;
      endTime: Date;
    }>,
  ) {
    const slots: Array<{
      startTime: string;
      endTime: string;
      displayTime: string;
      period: 'morning' | 'afternoon';
    }> = [];
    const start = TimeUtil.timeToMinutes(startTime);
    const end = TimeUtil.timeToMinutes(endTime);
    const duration = serviceDuration;

    // Generate time slots every 30 minutes, but each slot has the full service duration
    for (let time = start; time + duration <= end; time += 30) {
      const slotStartTime = TimeUtil.minutesToTime(time);
      const slotEndTime = TimeUtil.minutesToTime(time + duration);

      // Check if this slot conflicts with any booked appointment
      const isAvailable = !bookedAppointments.some((apt) => {
        const aptStart = TimeUtil.dateToMinutes(apt.startTime);
        const aptEnd = TimeUtil.dateToMinutes(apt.endTime);

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

  private async checkConflict(
    startTime: Date,
    endTime: Date,
    doctorId: number,
    duration: number,
    patientProfileId: number,
    userId: number,
  ) {
    // Check patient profile
    const patientProfile = await this.prisma.patientProfile.findUnique({
      where: { id: patientProfileId },
    });

    if (!patientProfile) {
      throw new NotFoundException(
        MESSAGES.APPOINTMENT.PATIENT_PROFILE_NOT_FOUND,
      );
    }
    if (patientProfile.managerId !== userId) {
      throw new ForbiddenException(
        MESSAGES.APPOINTMENT.PATIENT_PROFILE_NOT_OWNED,
      );
    }

    // Check doctor availability
    const dayOfWeek = DateUtil.getDayOfWeek(startTime);
    const workingHours = await this.prisma.doctorAvailability.findUnique({
      where: {
        doctorId_dayOfWeek: {
          doctorId: doctorId,
          dayOfWeek: dayOfWeek,
        },
      },
    });

    if (!workingHours) {
      throw new BadRequestException(
        MESSAGES.APPOINTMENT.DOCTOR_NOT_AVAILABLE_ON_DATE,
      );
    }

    // Check if requested time is within working hours
    const startMinutes = startTime.getHours() * 60 + startTime.getMinutes();
    const workingStart = TimeUtil.timeToMinutes(workingHours.startTime);
    const workingEnd = TimeUtil.timeToMinutes(workingHours.endTime);

    if (startMinutes < workingStart || startMinutes + duration > workingEnd) {
      throw new BadRequestException(
        MESSAGES.APPOINTMENT.APPOINTMENT_OUTSIDE_WORKING_HOURS,
      );
    }

    // Check for conflicts with existing appointments
    const hasConflict = await this.prisma.appointment.findFirst({
      where: {
        doctorId: doctorId,
        startTime: { lt: endTime },
        endTime: { gt: startTime },
        status: {
          in: [AppointmentStatus.UPCOMING, AppointmentStatus.ON_GOING],
        },
      },
    });

    if (hasConflict) {
      throw new BadRequestException(
        MESSAGES.APPOINTMENT.TIME_SLOT_ALREADY_BOOKED,
      );
    }
  }
}
