import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { AppointmentStatus } from '@prisma/client';
import {
  GetDoctorAppointmentsQueryDto,
  DoctorAppointmentsListResponseDto,
  DoctorAppointmentDetailDto,
  CreateAppointmentResultDto,
  AppointmentResultDto,
} from './dto';
import { ERROR_MESSAGES, MESSAGES } from '@/common/constants';

@Injectable()
export class DoctorAppointmentService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Lấy danh sách appointments của doctor
   */
  async getDoctorAppointments(
    query: GetDoctorAppointmentsQueryDto,
    userId: number,
  ): Promise<DoctorAppointmentsListResponseDto> {
    // Get doctor profile
    const doctorProfile = await this.prisma.doctorProfile.findUnique({
      where: { userId: userId },
    });

    if (!doctorProfile) {
      throw new NotFoundException(
        MESSAGES.APPOINTMENT.DOCTOR_SERVICE_NOT_FOUND,
      );
    }

    const {
      page = 1,
      limit = 10,
      status,
      sortBy = 'startTime',
      sortOrder = 'desc',
    } = query;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      doctorId: doctorProfile.id,
    };

    if (status) {
      where.status = status;
    }

    // Build orderBy
    const orderBy: any = {};
    orderBy[sortBy] = sortOrder === 'asc' ? 'asc' : 'desc';

    // Get appointments with related data
    const [appointments, total] = await Promise.all([
      this.prisma.appointment.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
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
              address: true,
            },
          },
          feedback: {
            select: {
              id: true,
              rating: true,
              comment: true,
              createdAt: true,
            },
          },
          result: {
            select: {
              id: true,
              diagnosis: true,
              notes: true,
              prescription: true,
              recommendations: true,
              appointmentId: true,
              createdAt: true,
              updatedAt: true,
            },
          },
        },
      }),
      this.prisma.appointment.count({ where }),
    ]);

    // Format response
    const data: DoctorAppointmentDetailDto[] = appointments.map((apt) => ({
      id: apt.id,
      startTime: apt.startTime,
      endTime: apt.endTime,
      status: apt.status,
      notes: apt.notes,
      type: apt.type,
      hostUrl: apt.hostUrl,
      patient: apt.patientProfile
        ? {
            id: apt.patientProfile.id,
            firstName: apt.patientProfile.firstName,
            lastName: apt.patientProfile.lastName,
            phone: apt.patientProfile.phone,
            dateOfBirth: apt.patientProfile.dateOfBirth,
            gender: apt.patientProfile.gender,
          }
        : undefined,
      service: apt.service
        ? {
            id: apt.service.id,
            name: apt.service.name,
            price: apt.service.price,
            duration: apt.service.duration,
          }
        : undefined,
      clinic: apt.clinic
        ? {
            id: apt.clinic.id,
            name: apt.clinic.name,
            address: apt.clinic.address,
          }
        : null,
      feedback: apt.feedback
        ? {
            id: apt.feedback.id,
            rating: apt.feedback.rating,
            comment: apt.feedback.comment,
            createdAt: apt.feedback.createdAt,
          }
        : null,
      result: apt.result
        ? {
            id: apt.result.id,
            diagnosis: apt.result.diagnosis,
            notes: apt.result.notes,
            prescription: apt.result.prescription,
            recommendations: apt.result.recommendations,
            appointmentId: apt.result.appointmentId,
            createdAt: apt.result.createdAt,
            updatedAt: apt.result.updatedAt,
          }
        : null,
      createdAt: apt.createdAt,
      updatedAt: apt.updatedAt,
    }));

    return {
      data,
      total,
      page,
      limit,
    };
  }

  /**
   * Lấy chi tiết appointment của doctor
   */
  async getAppointmentById(
    appointmentId: number,
    userId: number,
  ): Promise<DoctorAppointmentDetailDto> {
    // Get doctor profile
    const doctorProfile = await this.prisma.doctorProfile.findUnique({
      where: { userId: userId },
    });

    if (!doctorProfile) {
      throw new NotFoundException(
        MESSAGES.APPOINTMENT.DOCTOR_SERVICE_NOT_FOUND,
      );
    }

    // Get appointment
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
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
            address: true,
          },
        },
        feedback: {
          select: {
            id: true,
            rating: true,
            comment: true,
            createdAt: true,
          },
        },
        result: {
          select: {
            id: true,
            diagnosis: true,
            notes: true,
            prescription: true,
            recommendations: true,
            appointmentId: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    if (!appointment) {
      throw new NotFoundException(ERROR_MESSAGES.COMMON.RESOURCE_NOT_FOUND);
    }

    // Check if appointment belongs to this doctor
    if (appointment.doctorId !== doctorProfile.id) {
      throw new ForbiddenException('Bạn không có quyền xem appointment này');
    }

    return {
      id: appointment.id,
      startTime: appointment.startTime,
      endTime: appointment.endTime,
      status: appointment.status,
      notes: appointment.notes,
      type: appointment.type,
      hostUrl: appointment.hostUrl,
      patient: appointment.patientProfile
        ? {
            id: appointment.patientProfile.id,
            firstName: appointment.patientProfile.firstName,
            lastName: appointment.patientProfile.lastName,
            phone: appointment.patientProfile.phone,
            dateOfBirth: appointment.patientProfile.dateOfBirth,
            gender: appointment.patientProfile.gender,
          }
        : undefined,
      service: appointment.service
        ? {
            id: appointment.service.id,
            name: appointment.service.name,
            price: appointment.service.price,
            duration: appointment.service.duration,
          }
        : undefined,
      clinic: appointment.clinic
        ? {
            id: appointment.clinic.id,
            name: appointment.clinic.name,
            address: appointment.clinic.address,
          }
        : null,
      feedback: appointment.feedback
        ? {
            id: appointment.feedback.id,
            rating: appointment.feedback.rating,
            comment: appointment.feedback.comment,
            createdAt: appointment.feedback.createdAt,
          }
        : null,
      result: appointment.result
        ? {
            id: appointment.result.id,
            diagnosis: appointment.result.diagnosis,
            notes: appointment.result.notes,
            prescription: appointment.result.prescription,
            recommendations: appointment.result.recommendations,
            appointmentId: appointment.result.appointmentId,
            createdAt: appointment.result.createdAt,
            updatedAt: appointment.result.updatedAt,
          }
        : null,
      createdAt: appointment.createdAt,
      updatedAt: appointment.updatedAt,
    };
  }

  /**
   * Tạo hoặc cập nhật kết quả khám cho appointment
   */
  async createOrUpdateAppointmentResult(
    appointmentId: number,
    createResultDto: CreateAppointmentResultDto,
    userId: number,
  ): Promise<AppointmentResultDto> {
    // Get doctor profile
    const doctorProfile = await this.prisma.doctorProfile.findUnique({
      where: { userId: userId },
    });

    if (!doctorProfile) {
      throw new NotFoundException(
        MESSAGES.APPOINTMENT.DOCTOR_SERVICE_NOT_FOUND,
      );
    }

    // Get appointment
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        result: true,
      },
    });

    if (!appointment) {
      throw new NotFoundException(ERROR_MESSAGES.COMMON.RESOURCE_NOT_FOUND);
    }

    // Check if appointment belongs to this doctor
    if (appointment.doctorId !== doctorProfile.id) {
      throw new ForbiddenException(
        'Bạn không có quyền tạo kết quả cho appointment này',
      );
    }

    // Check if appointment is completed
    if (appointment.status !== AppointmentStatus.COMPLETED) {
      throw new BadRequestException(
        'Chỉ có thể tạo kết quả cho appointment đã hoàn thành',
      );
    }

    // Create or update result
    let result;
    if (appointment.result) {
      // Update existing result
      result = await this.prisma.appointmentResult.update({
        where: { id: appointment.result.id },
        data: {
          diagnosis: createResultDto.diagnosis ?? appointment.result.diagnosis,
          notes: createResultDto.notes ?? appointment.result.notes,
          prescription:
            createResultDto.prescription ?? appointment.result.prescription,
          recommendations:
            createResultDto.recommendations ??
            appointment.result.recommendations,
        },
      });
    } else {
      // Create new result
      result = await this.prisma.appointmentResult.create({
        data: {
          appointmentId: appointment.id,
          doctorId: doctorProfile.id,
          diagnosis: createResultDto.diagnosis || null,
          notes: createResultDto.notes || null,
          prescription: createResultDto.prescription || null,
          recommendations: createResultDto.recommendations || null,
        },
      });
    }

    return {
      id: result.id,
      diagnosis: result.diagnosis,
      notes: result.notes,
      prescription: result.prescription,
      recommendations: result.recommendations,
      appointmentId: result.appointmentId,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
    };
  }

  /**
   * Lấy lịch sử khám bệnh của bệnh nhân
   * Chỉ lấy các appointments đã hoàn thành (COMPLETED)
   */
  async getPatientMedicalHistory(
    patientProfileId: number,
    query: GetDoctorAppointmentsQueryDto,
    userId: number,
  ): Promise<DoctorAppointmentsListResponseDto> {
    // Get doctor profile to verify authentication
    const doctorProfile = await this.prisma.doctorProfile.findUnique({
      where: { userId: userId },
    });

    if (!doctorProfile) {
      throw new NotFoundException(
        MESSAGES.APPOINTMENT.DOCTOR_SERVICE_NOT_FOUND,
      );
    }

    // Verify patient exists
    const patient = await this.prisma.patientProfile.findUnique({
      where: { id: patientProfileId },
    });

    if (!patient) {
      throw new NotFoundException('Không tìm thấy hồ sơ bệnh nhân');
    }

    const {
      page = 1,
      limit = 10,
      sortBy = 'startTime',
      sortOrder = 'desc',
    } = query;
    const skip = (page - 1) * limit;

    // Build where clause - chỉ lấy COMPLETED appointments của patient này
    const where: any = {
      patientProfileId: patientProfileId,
      status: AppointmentStatus.COMPLETED,
    };

    // Build orderBy
    const orderBy: any = {};
    orderBy[sortBy] = sortOrder === 'asc' ? 'asc' : 'desc';

    // Get appointments with related data
    const [appointments, total] = await Promise.all([
      this.prisma.appointment.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
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
              address: true,
            },
          },
          feedback: {
            select: {
              id: true,
              rating: true,
              comment: true,
              createdAt: true,
            },
          },
          result: {
            select: {
              id: true,
              diagnosis: true,
              notes: true,
              prescription: true,
              recommendations: true,
              appointmentId: true,
              createdAt: true,
              updatedAt: true,
            },
          },
        },
      }),
      this.prisma.appointment.count({ where }),
    ]);

    // Format response
    const data: DoctorAppointmentDetailDto[] = appointments.map((apt) => ({
      id: apt.id,
      startTime: apt.startTime,
      endTime: apt.endTime,
      status: apt.status,
      notes: apt.notes,
      type: apt.type,
      hostUrl: apt.hostUrl,
      patient: apt.patientProfile
        ? {
            id: apt.patientProfile.id,
            firstName: apt.patientProfile.firstName,
            lastName: apt.patientProfile.lastName,
            phone: apt.patientProfile.phone,
            dateOfBirth: apt.patientProfile.dateOfBirth,
            gender: apt.patientProfile.gender,
          }
        : undefined,
      doctor: apt.doctor
        ? {
            id: apt.doctor.id,
            firstName: apt.doctor.firstName,
            lastName: apt.doctor.lastName,
          }
        : undefined,
      service: apt.service
        ? {
            id: apt.service.id,
            name: apt.service.name,
            price: apt.service.price,
            duration: apt.service.duration,
          }
        : undefined,
      clinic: apt.clinic
        ? {
            id: apt.clinic.id,
            name: apt.clinic.name,
            address: apt.clinic.address,
          }
        : null,
      feedback: apt.feedback
        ? {
            id: apt.feedback.id,
            rating: apt.feedback.rating,
            comment: apt.feedback.comment,
            createdAt: apt.feedback.createdAt,
          }
        : null,
      result: apt.result
        ? {
            id: apt.result.id,
            diagnosis: apt.result.diagnosis,
            notes: apt.result.notes,
            prescription: apt.result.prescription,
            recommendations: apt.result.recommendations,
            appointmentId: apt.result.appointmentId,
            createdAt: apt.result.createdAt,
            updatedAt: apt.result.updatedAt,
          }
        : null,
      createdAt: apt.createdAt,
      updatedAt: apt.updatedAt,
    }));

    return {
      data,
      total,
      page,
      limit,
    };
  }
}
