import { ERROR_MESSAGES, MESSAGES } from '@/common/constants';
import { PrismaService } from '@/common/prisma/prisma.service';
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { SuccessResponseDto } from '@/common/dto';
import { AppointmentDetailResponseDto } from '@/module/patient/appointment/dto';
import {
  AppointmentStatus,
  Role,
  UserStatus,
  Relationship,
} from '@prisma/client';
import { StringUtil } from '@/common/utils';
import * as bcrypt from 'bcrypt';
import {
  FindPatientByEmailDto,
  CreatePatientAccountDto,
  CreateAppointmentForPatientDto,
  GetAppointmentsQueryDto,
} from './dto/request';
import {
  FindPatientResponseDto,
  CreatePatientAccountResponseDto,
  CreateAppointmentResponseDto,
  AppointmentsListResponseDto,
  AppointmentSummaryResponseDto,
} from './dto/response';
import { SortOrder } from '@/common/enum';

@Injectable()
export class ReceptionistAppointmentService {
  constructor(private readonly prisma: PrismaService) { }

  /**
   * Get list of appointments with pagination and filters
   */
  async getAppointments(
    query: GetAppointmentsQueryDto,
  ): Promise<AppointmentsListResponseDto> {
    const { page = 1, limit = 10, search, status, startDate, endDate } = query;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    // Search by patient name, phone, or appointment ID
    if (search) {
      const searchConditions: any[] = [];

      // Check if search is a number (for appointment ID search)
      const searchAsNumber = parseInt(search, 10);
      if (!isNaN(searchAsNumber)) {
        searchConditions.push({ id: searchAsNumber });
      }

      // Always add text-based searches
      searchConditions.push({
        patientProfile: {
          OR: [
            { firstName: { contains: search, mode: 'insensitive' } },
            { lastName: { contains: search, mode: 'insensitive' } },
            { phone: { contains: search, mode: 'insensitive' } },
          ],
        },
      });

      where.OR = searchConditions;
    }

    // Filter by status
    if (status) {
      where.status = status;
    }

    // Filter by date range
    if (startDate || endDate) {
      where.startTime = {};
      if (startDate) {
        where.startTime.gte = new Date(startDate);
      }
      if (endDate) {
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);
        where.startTime.lte = endDateTime;
      }
    }

    const [appointments, total] = await Promise.all([
      this.prisma.appointment.findMany({
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
          service: {
            select: {
              id: true,
              name: true,
              price: true,
              duration: true,
            },
          },
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
            },
          },
        },
        skip,
        take: limit,
        orderBy: { startTime: SortOrder.DESC },
      }),
      this.prisma.appointment.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: appointments.map((appointment) => ({
        id: appointment.id,
        startTime: appointment.startTime.toISOString(),
        endTime: appointment.endTime.toISOString(),
        status: appointment.status,
        notes: appointment.notes || undefined,
        patientProfile: appointment.patientProfile,
        doctor: appointment.doctor,
        service: appointment.service,
        clinic: appointment.clinic || undefined,
        createdAt: appointment.createdAt.toISOString(),
        billing: appointment.billing || undefined,
      })),
      total,
      page,
      limit,
      totalPages,
    };
  }

  async getAppointmentSummary(): Promise<AppointmentSummaryResponseDto[]> {
    const summary = await this.prisma.appointment.groupBy({
      by: ['status'],
      _count: {
        status: true,
      },
    });

    return summary.map((item) => ({
      appointmentStatus: item.status,
      count: item._count.status,
    }));
  }

  async getAppointmentDetail(
    id: number,
  ): Promise<AppointmentDetailResponseDto> {
    const appointment = await this.prisma.appointment.findFirstOrThrow({
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
      throw new NotFoundException(ERROR_MESSAGES.COMMON.RESOURCE_NOT_FOUND);
    }

    return appointment;
  }

  async checkInAppointment(id: number): Promise<SuccessResponseDto> {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
    });

    if (!appointment) {
      throw new NotFoundException(ERROR_MESSAGES.COMMON.RESOURCE_NOT_FOUND);
    }

    if (appointment.status !== AppointmentStatus.UPCOMING) {
      throw new BadRequestException(ERROR_MESSAGES.APPOINTMENT.INVALID_STATUS);
    }

    await this.prisma.appointment.update({
      where: { id },
      data: { status: AppointmentStatus.ON_GOING },
    });

    return new SuccessResponseDto();
  }

  async updateAppointment(
    id: number,
    updateData: { startTime?: string; notes?: string; doctorServiceId?: number },
  ): Promise<SuccessResponseDto> {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        serviceId: true,
        doctorId: true,
        startTime: true,
        endTime: true,
      },
    });

    if (!appointment) {
      throw new NotFoundException(ERROR_MESSAGES.COMMON.RESOURCE_NOT_FOUND);
    }

    // Only allow updating UPCOMING appointments
    if (appointment.status !== AppointmentStatus.UPCOMING) {
      throw new BadRequestException(ERROR_MESSAGES.APPOINTMENT.CAN_NOT_UPDATE);
    }

    const updatePayload: any = {};

    // 1. Determine new details if doctorServiceId is provided
    let newDoctorId = appointment.doctorId;
    let newServiceId = appointment.serviceId;
    let newDuration = 0;

    if (updateData.doctorServiceId) {
      const doctorService = await this.prisma.doctorService.findUnique({
        where: { id: updateData.doctorServiceId },
        include: {
          doctor: true,
          service: true,
        },
      });

      if (!doctorService) {
        throw new NotFoundException(ERROR_MESSAGES.COMMON.RESOURCE_NOT_FOUND);
      }

      newDoctorId = doctorService.doctorId;
      newServiceId = doctorService.serviceId;
      newDuration = doctorService.service.duration;

      updatePayload.doctorId = newDoctorId;
      updatePayload.serviceId = newServiceId;
      updatePayload.clinicId = doctorService.doctor.clinicId;
    } else {
      // Find existing service duration if not changing service but changing time
      if (updateData.startTime) {
        const service = await this.prisma.service.findUnique({
          where: { id: appointment.serviceId },
        });
        newDuration = service ? service.duration : 0;
      }
    }

    // 2. Handle Time Updates & Conflict Checking
    if (updateData.startTime) {
      const startTime = new Date(updateData.startTime);
      const endTime = new Date(startTime);
      if (newDuration > 0) {
        endTime.setMinutes(endTime.getMinutes() + newDuration);
      }

      updatePayload.startTime = startTime;
      updatePayload.endTime = endTime;

      // Check for conflicts
      const conflictingAppointment = await this.prisma.appointment.findFirst({
        where: {
          doctorId: newDoctorId,
          id: { not: id }, // Exclude current appointment
          status: {
            in: [AppointmentStatus.UPCOMING, AppointmentStatus.ON_GOING],
          },
          OR: [
            {
              AND: [
                { startTime: { lte: startTime } },
                { endTime: { gt: startTime } },
              ],
            },
            {
              AND: [
                { startTime: { lt: endTime } },
                { endTime: { gte: endTime } },
              ],
            },
            {
              AND: [
                { startTime: { gte: startTime } },
                { endTime: { lte: endTime } },
              ]
            }
          ],
        },
      });

      if (conflictingAppointment) {
        throw new BadRequestException(ERROR_MESSAGES.APPOINTMENT.TIME_CONFLICT);
      }
    }

    if (updateData.notes !== undefined) {
      updatePayload.notes = updateData.notes;
    }

    await this.prisma.appointment.update({
      where: { id },
      data: updatePayload,
    });

    return new SuccessResponseDto();
  }

  async cancelAppointment(id: number): Promise<SuccessResponseDto> {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
    });

    if (!appointment) {
      throw new NotFoundException(ERROR_MESSAGES.COMMON.RESOURCE_NOT_FOUND);
    }

    // Only allow cancelling UPCOMING or ON_GOING appointments
    if (
      appointment.status !== AppointmentStatus.UPCOMING &&
      appointment.status !== AppointmentStatus.ON_GOING
    ) {
      throw new BadRequestException(ERROR_MESSAGES.APPOINTMENT.CAN_NOT_CANCEL);
    }

    await this.prisma.appointment.update({
      where: { id },
      data: { status: AppointmentStatus.CANCELLED },
    });

    return new SuccessResponseDto();
  }


  /**
   * Find patient by email
   */
  async findPatientByEmail(
    findPatientDto: FindPatientByEmailDto,
  ): Promise<FindPatientResponseDto> {
    const { email } = findPatientDto;

    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        patientProfiles: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            dateOfBirth: true,
            gender: true,
            phone: true,
            relationship: true,
            avatar: true,
            idCardNumber: true,
            occupation: true,
            nationality: true,
            address: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    // Không tìm thấy user
    if (!user) {
      return { found: false };
    }

    // Kiểm tra role - chỉ cho phép user có role PATIENT
    if (user.role !== Role.PATIENT) {
      return { found: false };
    }

    return {
      found: true,
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone || undefined,
        status: user.status,
        role: user.role as string,
      },
      patientProfiles: user.patientProfiles.map((profile) => ({
        id: profile.id,
        firstName: profile.firstName,
        lastName: profile.lastName,
        dateOfBirth: profile.dateOfBirth.toISOString(),
        gender: profile.gender,
        phone: profile.phone,
        relationship: profile.relationship,
        avatar: profile.avatar || undefined,
        idCardNumber: profile.idCardNumber || undefined,
        occupation: profile.occupation || undefined,
        nationality: profile.nationality || undefined,
        address: profile.address || undefined,
        createdAt: profile.createdAt.toISOString(),
        updatedAt: profile.updatedAt.toISOString(),
      })),
    };
  }

  /**
   * Create patient account with random password
   */
  async createPatientAccount(
    createPatientDto: CreatePatientAccountDto,
  ): Promise<CreatePatientAccountResponseDto> {
    const {
      email,
      firstName,
      lastName,
      phone,
      dateOfBirth,
      gender,
      idCardNumber,
      address,
      occupation,
      nationality,
    } = createPatientDto;

    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new BadRequestException('Email đã được sử dụng');
    }

    // Generate random password
    const temporaryPassword = StringUtil.generatePassword(12);
    const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

    // Create user and patient profile in transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          phone,
          role: Role.PATIENT,
          status: UserStatus.ACTIVE, // Set as active immediately
        },
      });

      // Create patient profile
      const patientProfile = await tx.patientProfile.create({
        data: {
          firstName,
          lastName,
          dateOfBirth: new Date(dateOfBirth),
          gender,
          phone,
          relationship: Relationship.SELF, // Always SELF for self-registered patients
          managerId: user.id,
          idCardNumber,
          address,
          occupation,
          nationality,
        },
      });

      return { user, patientProfile };
    });

    return {
      user: {
        id: result.user.id,
        email: result.user.email,
        phone: result.user.phone || undefined,
        status: result.user.status,
        role: result.user.role as string,
      },
      patientProfile: {
        id: result.patientProfile.id,
        firstName: result.patientProfile.firstName,
        lastName: result.patientProfile.lastName,
        dateOfBirth: result.patientProfile.dateOfBirth.toISOString(),
        gender: result.patientProfile.gender,
        phone: result.patientProfile.phone,
        relationship: result.patientProfile.relationship,
        avatar: result.patientProfile.avatar || undefined,
        idCardNumber: result.patientProfile.idCardNumber || undefined,
        occupation: result.patientProfile.occupation || undefined,
        nationality: result.patientProfile.nationality || undefined,
        address: result.patientProfile.address || undefined,
        createdAt: result.patientProfile.createdAt.toISOString(),
        updatedAt: result.patientProfile.updatedAt.toISOString(),
      },
      temporaryPassword,
    };
  }

  /**
   * Get locations (clinics)
   */
  async getLocations() {
    const clinics = await this.prisma.clinic.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        address: true,
        phone: true,
        email: true,
        description: true,
      },
      orderBy: { name: 'asc' },
    });

    return clinics;
  }

  /**
   * Get services
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
      orderBy: { name: 'asc' },
    });

    return services;
  }

  /**
   * Get doctor services by service and location
   */
  /**
   * Get doctor availability (time slots) for a specific date
   */
  async getDoctorAvailability(query: {
    doctorServiceId: number;
    date: string;
  }) {
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
    const targetDate = new Date(date);
    const dayOfWeek = targetDate.getDay(); // 0 = Sunday, 1 = Monday, etc.

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
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

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
   * Generate available time slots based on working hours and booked appointments
   */
  private generateAvailableTimeSlots(
    startTime: string,
    endTime: string,
    serviceDuration: number,
    bookedAppointments: { startTime: Date; endTime: Date }[],
  ): { startTime: string; endTime: string; displayTime: string }[] {
    const slots: { startTime: string; endTime: string; displayTime: string }[] =
      [];
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);

    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;

    // Generate all possible slots
    for (
      let minutes = startMinutes;
      minutes + serviceDuration <= endMinutes;
      minutes += 30
    ) {
      const slotStartTime = this.minutesToTimeString(minutes);
      const slotEndTime = this.minutesToTimeString(minutes + serviceDuration);

      // Check if this slot conflicts with any booked appointment
      const hasConflict = bookedAppointments.some((appointment) => {
        const appointmentStart =
          appointment.startTime.getHours() * 60 +
          appointment.startTime.getMinutes();
        const appointmentEnd =
          appointment.endTime.getHours() * 60 +
          appointment.endTime.getMinutes();

        // Check for overlap
        return (
          minutes < appointmentEnd &&
          minutes + serviceDuration > appointmentStart
        );
      });

      if (!hasConflict) {
        slots.push({
          startTime: slotStartTime,
          endTime: slotEndTime,
          displayTime: `${slotStartTime} - ${slotEndTime}`,
        });
      }
    }

    return slots;
  }

  /**
   * Convert minutes to time string (HH:MM)
   */
  private minutesToTimeString(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }

  async getDoctorServices(query: { serviceId: number; locationId: number }) {
    const { serviceId, locationId } = query;

    // Check if service exists
    const service = await this.prisma.service.findUnique({
      where: { id: serviceId },
    });

    if (!service) {
      throw new NotFoundException('Không tìm thấy dịch vụ');
    }

    const location = await this.prisma.clinic.findUnique({
      where: { id: locationId },
    });

    if (!location) {
      throw new NotFoundException('Không tìm thấy cơ sở');
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
    return doctorServices.map((ds) => ({
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
  }

  /**
   * Create appointment for patient
   */
  async createAppointmentForPatient(
    createAppointmentDto: CreateAppointmentForPatientDto,
  ): Promise<CreateAppointmentResponseDto> {
    const { patientProfileId, doctorServiceId, startTime, endTime, notes } =
      createAppointmentDto;

    // Verify patient profile exists
    const patientProfile = await this.prisma.patientProfile.findUnique({
      where: { id: patientProfileId },
    });

    if (!patientProfile) {
      throw new NotFoundException('Không tìm thấy hồ sơ bệnh nhân');
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

    if (!doctorService) {
      throw new NotFoundException('Không tìm thấy dịch vụ bác sĩ');
    }

    // Check for time conflicts
    const startDateTime = new Date(startTime);
    const endDateTime = new Date(endTime);

    const conflictingAppointment = await this.prisma.appointment.findFirst({
      where: {
        doctorId: doctorService.doctor.id,
        status: {
          in: [AppointmentStatus.UPCOMING, AppointmentStatus.ON_GOING],
        },
        OR: [
          {
            AND: [
              { startTime: { lte: startDateTime } },
              { endTime: { gt: startDateTime } },
            ],
          },
          {
            AND: [
              { startTime: { lt: endDateTime } },
              { endTime: { gte: endDateTime } },
            ],
          },
          {
            AND: [
              { startTime: { gte: startDateTime } },
              { endTime: { lte: endDateTime } },
            ],
          },
        ],
      },
    });

    if (conflictingAppointment) {
      throw new BadRequestException(
        'Bác sĩ đã có lịch hẹn trong thời gian này',
      );
    }

    // Create appointment
    const appointment = await this.prisma.appointment.create({
      data: {
        patientProfileId,
        doctorId: doctorService.doctor.id,
        serviceId: doctorService.service.id,
        startTime: startDateTime,
        endTime: endDateTime,
        status: AppointmentStatus.UPCOMING,
        notes,
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
        clinic: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return {
      id: appointment.id,
      startTime: appointment.startTime.toISOString(),
      endTime: appointment.endTime.toISOString(),
      status: appointment.status,
      notes: appointment.notes || undefined,
      patientProfile: appointment.patientProfile,
      doctor: appointment.doctor,
      service: appointment.service,
      clinic: appointment.clinic || undefined,
      createdAt: appointment.createdAt.toISOString(),
    };
  }
}
