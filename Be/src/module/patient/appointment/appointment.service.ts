import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { MESSAGES } from '@/common/constants/messages';
import { PrismaService } from '@/common/prisma/prisma.service';
import { AppointmentStatus } from '@prisma/client';
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
} from './dto';
import { NotificationUtils } from '@/module/notification/notification.utils';
import {
  NotificationPriority,
  NotificationType,
} from '@/module/notification/notification.types';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import { DateUtil } from '@/common/utils';
import { TimeUtil } from '@/common/utils/time';

@Injectable()
export class AppointmentService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('appointment') private readonly appointmentQueue: Queue,
  ) {}

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
      sortOrder = 'desc',
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

    return appointment;
  }

  /**
   * Update appointment
   */
  async update(
    id: number,
    updateAppointmentDto: UpdateAppointmentDto,
    userId: number,
  ): Promise<AppointmentDetailResponseDto> {
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
      appointment.patientProfile?.managerId !== userId &&
      appointment.doctor.userId !== userId
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
      },
    });

    return this.formatAppointmentResponse(updatedAppointment);
  }

  /**
   * Delete appointment
   */
  async remove(id: number, userId: number): Promise<{ message: string }> {
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

    await this.prisma.appointment.delete({
      where: { id },
    });

    return { message: 'Xóa lịch hẹn thành công' };
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
      sortOrder = 'desc',
    } = query;

    // Ensure sortBy and sortOrder are properly set
    const finalSortBy = sortBy || 'date';
    const finalSortOrder = sortOrder || 'desc';

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
      orderBy = { date: 'asc' }; // Temporary orderBy, will be overridden
    } else {
      // Default: sort by date
      orderBy = { date: finalSortOrder };
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
        const aStatus = a.billing?.status || 'PENDING';
        const bStatus = b.billing?.status || 'PENDING';

        if (finalSortOrder === 'asc') {
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
   */
  // TODO refactor this func
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
      return null;
    }

    // Get current date and time
    const nowUTC = new Date();

    // Calculate current time in UTC+7 (Vietnam timezone)
    // UTC+7 = UTC + 7 hours
    const nowUTC7 = new Date(nowUTC.getTime() + 7 * 60 * 60 * 1000);
    const currentTime = `${nowUTC7.getUTCHours().toString().padStart(2, '0')}:${nowUTC7.getUTCMinutes().toString().padStart(2, '0')}`;

    // Calculate start of today in UTC+7 (00:00:00 UTC+7)
    // Get the date components in UTC+7
    const yearUTC7 = nowUTC7.getUTCFullYear();
    const monthUTC7 = nowUTC7.getUTCMonth();
    const dateUTC7 = nowUTC7.getUTCDate();

    // Start of day UTC+7 = 00:00:00 UTC+7
    // To convert to UTC: 00:00 UTC+7 = 17:00 UTC (previous day)
    // Example: 14-11 00:00 UTC+7 = 13-11 17:00 UTC
    // Create UTC timestamp for 00:00 of the UTC+7 date, then subtract 7 hours
    const todayUTC7StartUTC = new Date(
      Date.UTC(yearUTC7, monthUTC7, dateUTC7, 0, 0, 0, 0),
    );
    // Subtract 7 hours to get the UTC equivalent of 00:00 UTC+7
    const todayUTC = new Date(todayUTC7StartUTC.getTime() - 7 * 60 * 60 * 1000);

    // For comparison in filter, we use the same UTC timestamp (todayUTC7StartUTC)
    // This represents 00:00 UTC+7 in UTC format, which is what we need for comparison
    const todayUTC7StartDateOnly = todayUTC7StartUTC;

    // Get all upcoming appointments (date >= today, status = UPCOMING or ON_GOING)
    // Note: DB stores dates in UTC, so we use todayUTC for comparison
    const appointments = await this.prisma.appointment.findMany({
      where: {
        patientProfileId: { in: patientProfileIds },
        startTime: { gte: todayUTC },
        status: {
          in: [AppointmentStatus.UPCOMING, AppointmentStatus.ON_GOING],
        },
      },
      orderBy: [{ startTime: 'asc' }],
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

    // Filter appointments: if date is today, only include those with startTime > currentTime
    const validAppointments = appointments.filter((appointment) => {
      // Convert appointment date (UTC from DB) to UTC+7
      const appointmentDateUTC = new Date(appointment.startTime.getUTCDate());
      const appointmentDateUTC7 = new Date(
        appointmentDateUTC.getTime() + 7 * 60 * 60 * 1000,
      );

      // Get date-only components in UTC+7
      const appointmentYear = appointmentDateUTC7.getUTCFullYear();
      const appointmentMonth = appointmentDateUTC7.getUTCMonth();
      const appointmentDate = appointmentDateUTC7.getUTCDate();

      // Create date-only object in UTC+7 for comparison
      const appointmentDateOnly = new Date(
        Date.UTC(
          appointmentYear,
          appointmentMonth,
          appointmentDate,
          0,
          0,
          0,
          0,
        ),
      );

      // Compare dates (date only, no time) - both in UTC
      const appointmentDateOnlyTime = appointmentDateOnly.getTime();
      const todayTime = todayUTC7StartDateOnly.getTime();
      const isToday = appointmentDateOnlyTime === todayTime;
      const isPastDate = appointmentDateOnlyTime < todayTime;

      // If appointment date is in the past (before today), exclude it immediately
      if (isPastDate) {
        return false;
      }

      // If appointment is today, check if startTime is in the future
      if (isToday) {
        return appointment.startTime > new Date();
      }

      // If appointment is in the future (after today), include it
      return true;
    });

    if (validAppointments.length === 0) {
      return null;
    }

    // Return the closest appointment (already sorted by date and startTime)
    return this.formatAppointmentResponse(validAppointments[0]);
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
  async getDoctorServices(query: GetDoctorServicesQueryDto) {
    const { locationId, serviceId } = query;
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
  //TODO refactor this func
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
    const validatedPatientProfileId = patientProfile.id;

    // Check doctor availability
    const dayOfWeek = DateUtil.getDayOfWeek(startTime);
    const workingHours = await this.prisma.doctorAvailability.findUnique({
      where: {
        doctorId_dayOfWeek: {
          doctorId: doctorService.doctor.id,
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

    if (
      startMinutes < workingStart ||
      startMinutes + doctorService.service.duration > workingEnd
    ) {
      throw new BadRequestException(
        MESSAGES.APPOINTMENT.APPOINTMENT_OUTSIDE_WORKING_HOURS,
      );
    }

    // Check for conflicts with existing appointments
    const hasConflict = await this.prisma.appointment.findFirst({
      where: {
        doctorId: doctorService.doctor.id,
        startTime: { lt: endTime },
        endTime: { gt: startTime },
        status: {
          in: ['UPCOMING', 'ON_GOING'],
        },
      },
    });

    if (hasConflict) {
      throw new BadRequestException(
        MESSAGES.APPOINTMENT.TIME_SLOT_ALREADY_BOOKED,
      );
    }

    // Create appointment using data from DoctorService
    const appointment = await this.prisma.appointment.create({
      data: {
        startTime,
        endTime,
        status: 'UPCOMING',
        notes,
        patientProfileId: validatedPatientProfileId,
        doctorId: doctorService.doctorId,
        serviceId: doctorService.serviceId,
        clinicId: doctorService.doctor.clinicId,
      },
    });

    // Create billing for the appointment
    const billing = await this.prisma.billing.create({
      data: {
        amount: doctorService.service.price,
        status: 'PENDING',
        appointmentId: appointment.id,
      },
      select: {
        id: true,
        amount: true,
        status: true,
        paymentMethod: true,
        notes: true,
        createdAt: true,
      },
    });

    // Send notification to patient
    try {
      const patientUserId = patientProfile.managerId.toString();
      if (!patientUserId) {
        console.warn(
          '⚠️ [AppointmentService] Cannot send notification: patientProfile.managerId is missing',
        );
      } else {
        await NotificationUtils.sendNotification(
          NotificationType.CREATE_APPOINTMENT_PATIENT,
          NotificationPriority.MEDIUM,
          patientUserId,
          'system',
          'Đặt lịch hẹn thành công',
          `Bạn đã đặt lịch vào ${appointment.startTime.toLocaleDateString('vi-VN')}. Dịch vụ: ${doctorService.service.name}.`,
          {
            appointmentId: appointment.id,
            appointmentDate: appointment.startTime.toLocaleDateString('vi-VN'),
            doctorName: `${doctorService.doctor.firstName} ${doctorService.doctor.lastName}`,
            serviceName: doctorService.service.name,
            clinicName: clinic.name,
          },
        );
      }
    } catch (error) {
      console.error('Failed to send notification:', error);
      // Don't throw error, just log it
    }

    // Send notification to doctor
    try {
      await NotificationUtils.sendNotification(
        NotificationType.CREATE_APPOINTMENT_DOCTOR,
        NotificationPriority.MEDIUM,
        doctorService.doctor.userId.toString(),
        'system',
        'Lịch hẹn mới',
        `Bạn có lịch hẹn mới với bệnh nhân ${patientProfile.firstName + ' ' + patientProfile.lastName} vào ${appointment.startTime.toLocaleDateString('vi-VN')} tại ${clinic.name}. Dịch vụ: ${doctorService.service.name}.`,
        {
          appointmentId: appointment.id,
          appointmentDate: appointment.startTime.toLocaleDateString('vi-VN'),
          serviceName: doctorService.service.name,
          clinicName: clinic.name,
          notes: notes,
        },
      );
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
        delay: appointment.endTime.getMilliseconds() - Date.now(),
      },
    );
    // Return appointment with billing included
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
        : undefined,
      doctor: {
        id: appointment.doctor.id,
        firstName: appointment.doctor.firstName,
        lastName: appointment.doctor.lastName,
      },
      service: {
        id: appointment.service.id,
        name: appointment.service.name,
        price: appointment.service.price,
        duration: appointment.service.duration,
      },
      clinic: appointment.clinic
        ? {
            id: appointment.clinic.id,
            name: appointment.clinic.name,
          }
        : undefined,
      billing: appointment.billing
        ? {
            id: appointment.billing.id,
            amount: appointment.billing.amount,
            status: appointment.billing.status,
            paymentMethod: appointment.billing.paymentMethod,
            notes: appointment.billing.notes,
            createdAt: appointment.billing.createdAt.toISOString(),
          }
        : undefined,
      createdAt: appointment.createdAt.toISOString(),
      updatedAt: appointment.updatedAt.toISOString(),
    };
  }

  /**
   * Get doctor availability for a specific date (simple version)
   */
  // refactor this func
  async getDoctorAvailability(
    query: GetDoctorAvailabilityQueryDto,
  ): Promise<GetDoctorAvailabilityResponseDto> {
    const { doctorServiceId, date } = query;
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
    const dayOfWeek = DateUtil.getDayOfWeek(targetDate);
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
        startTime: {
          gte: targetDate,
          lt: new Date(targetDate.getTime() + 24 * 60 * 60 * 1000),
        },
        status: {
          in: ['UPCOMING', 'ON_GOING'],
        },
      },
      select: {
        startTime: true,
        endTime: true,
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
    query: GetAvailableDateQueryDto,
  ): Promise<GetAvailabilityDateResponseDto> {
    const { doctorServiceId, startDate, endDate } = query;
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
    const availableDates: Array<{
      date: string;
      dayOfWeek: number;
      workingHours: {
        startTime: string;
        endTime: string;
      };
    }> = [];
    const currentDate = new Date(start);

    while (currentDate <= end) {
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
      doctorId: doctorService.doctor.id,
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
}
