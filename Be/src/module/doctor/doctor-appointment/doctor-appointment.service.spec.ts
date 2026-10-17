import { BadRequestException, ForbiddenException } from '@nestjs/common';
import {
  AppointmentStatus,
  AppointmentType,
  PaymentStatus,
} from '@prisma/client';
import { DoctorAppointmentService } from './doctor-appointment.service';

// file-type là ESM-only, jest (CJS) không resolve được → mock ảo
jest.mock(
  'file-type',
  () => ({
    fileTypeFromBuffer: jest.fn(),
  }),
  { virtual: true },
);

describe('DoctorAppointmentService', () => {
  let service: DoctorAppointmentService;
  let prismaMock: any;
  let uploadServiceMock: any;
  let notificationServiceMock: any;

  const doctorProfile = {
    id: 10,
    userId: 1,
    firstName: 'Van A',
    lastName: 'Nguyen',
  };

  beforeEach(() => {
    prismaMock = {
      doctorProfile: {
        findUnique: jest.fn().mockResolvedValue(doctorProfile),
      },
      appointment: {
        findUnique: jest.fn(),
        updateMany: jest.fn(),
      },
      appointmentResult: {
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    uploadServiceMock = {
      uploadFile: jest.fn(),
    };

    notificationServiceMock = {
      sendAppointmentResultPatientNotification: jest
        .fn()
        .mockResolvedValue(true),
    };

    service = new DoctorAppointmentService(
      prismaMock as any,
      uploadServiceMock as any,
      notificationServiceMock as any,
    );
  });

  describe('startAppointment', () => {
    const validStartTime = new Date(Date.now() + 5 * 60 * 1000); // 5 phút nữa (trong khoảng trước 10 phút)
    const validEndTime = new Date(Date.now() + 35 * 60 * 1000);

    it('sai bác sĩ → Forbidden', async () => {
      prismaMock.appointment.findUnique.mockResolvedValue({
        id: 1,
        doctorId: 999, // Bác sĩ khác
        status: AppointmentStatus.UPCOMING,
        startTime: validStartTime,
        endTime: validEndTime,
        type: AppointmentType.ONLINE,
      });

      await expect(service.startAppointment(1, 1)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('không phải UPCOMING → BadRequest', async () => {
      prismaMock.appointment.findUnique.mockResolvedValue({
        id: 1,
        doctorId: 10,
        status: AppointmentStatus.ON_GOING, // Đã bắt đầu rồi, không phải UPCOMING
        startTime: validStartTime,
        endTime: validEndTime,
        type: AppointmentType.ONLINE,
      });

      await expect(service.startAppointment(1, 1)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('quá sớm → BadRequest', async () => {
      prismaMock.appointment.findUnique.mockResolvedValue({
        id: 1,
        doctorId: 10,
        status: AppointmentStatus.UPCOMING,
        startTime: new Date(Date.now() + 20 * 60 * 1000), // 20 phút nữa (> 10 phút)
        endTime: new Date(Date.now() + 50 * 60 * 1000),
        type: AppointmentType.ONLINE,
      });

      await expect(service.startAppointment(1, 1)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('OFFLINE chưa PAID → BadRequest', async () => {
      prismaMock.appointment.findUnique.mockResolvedValue({
        id: 1,
        doctorId: 10,
        status: AppointmentStatus.UPCOMING,
        startTime: validStartTime,
        endTime: validEndTime,
        type: AppointmentType.OFFLINE,
        billing: { status: PaymentStatus.PENDING }, // Chưa PAID
      });

      await expect(service.startAppointment(1, 1)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('ONLINE hợp lệ → gọi update sang ON_GOING', async () => {
      prismaMock.appointment.findUnique.mockResolvedValue({
        id: 1,
        doctorId: 10,
        status: AppointmentStatus.UPCOMING,
        startTime: validStartTime,
        endTime: validEndTime,
        type: AppointmentType.ONLINE,
        billing: { status: PaymentStatus.PENDING }, // ONLINE không bắt buộc PAID
      });

      prismaMock.appointment.updateMany.mockResolvedValue({ count: 1 });

      const result = await service.startAppointment(1, 1);
      expect(result.success).toBe(true);
      expect(prismaMock.appointment.updateMany).toHaveBeenCalledWith({
        where: {
          id: 1,
          doctorId: 10,
          status: AppointmentStatus.UPCOMING,
        },
        data: {
          status: AppointmentStatus.ON_GOING,
        },
      });
    });
  });

  describe('completeAppointment', () => {
    it('ON_GOING → COMPLETED', async () => {
      prismaMock.appointment.findUnique.mockResolvedValue({
        id: 1,
        doctorId: 10,
        status: AppointmentStatus.ON_GOING,
      });

      prismaMock.appointment.updateMany.mockResolvedValue({ count: 1 });

      const result = await service.completeAppointment(1, 1);
      expect(result.success).toBe(true);
      expect(prismaMock.appointment.updateMany).toHaveBeenCalledWith({
        where: {
          id: 1,
          doctorId: 10,
          status: AppointmentStatus.ON_GOING,
        },
        data: {
          status: AppointmentStatus.COMPLETED,
        },
      });
    });

    it('UPCOMING → BadRequest', async () => {
      prismaMock.appointment.findUnique.mockResolvedValue({
        id: 1,
        doctorId: 10,
        status: AppointmentStatus.UPCOMING, // Không phải ON_GOING
      });

      await expect(service.completeAppointment(1, 1)).rejects.toThrow(
        BadRequestException,
      );
      expect(prismaMock.appointment.updateMany).not.toHaveBeenCalled();
    });
  });

  describe('createOrUpdateAppointmentResult', () => {
    it('không còn từ chối ON_GOING', async () => {
      prismaMock.appointment.findUnique.mockResolvedValue({
        id: 1,
        doctorId: 10,
        status: AppointmentStatus.ON_GOING, // ON_GOING được chấp nhận
        result: null,
        patientProfile: {
          manager: { id: 99 },
        },
      });

      prismaMock.appointmentResult.create.mockResolvedValue({
        id: 100,
        appointmentId: 1,
        diagnosis: 'Viêm họng cấp',
        notes: 'Uống thuốc đều đặn',
        prescription: 'Kháng sinh',
        recommendations: 'Tái khám sau 7 ngày',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.createOrUpdateAppointmentResult(
        1,
        {
          diagnosis: 'Viêm họng cấp',
          notes: 'Uống thuốc đều đặn',
          prescription: 'Kháng sinh',
          recommendations: 'Tái khám sau 7 ngày',
        },
        1,
      );

      expect(result).toBeDefined();
      expect(result.id).toBe(100);
      expect(result.diagnosis).toBe('Viêm họng cấp');
      expect(prismaMock.appointmentResult.create).toHaveBeenCalled();
    });
  });
});
