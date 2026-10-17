import { ERROR_MESSAGES, MESSAGES } from '@/common/constants';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { AppointmentStatus } from '@prisma/client';
import { AppointmentService } from './appointment.service';

describe('AppointmentService - cancelAppointment', () => {
  let service: AppointmentService;
  let prismaMock: any;
  let notificationServiceMock: any;
  let meetingServiceMock: any;
  let appointmentStatusServiceMock: any;

  beforeEach(() => {
    prismaMock = {
      appointment: {
        findUnique: jest.fn(),
      },
    };

    notificationServiceMock = {
      sendDeleteAppointmentPatientNotification: jest
        .fn()
        .mockResolvedValue(true),
    };

    meetingServiceMock = {};

    appointmentStatusServiceMock = {
      transition: jest.fn().mockResolvedValue(undefined),
    };

    service = new AppointmentService(
      prismaMock as any,
      notificationServiceMock as any,
      meetingServiceMock as any,
      appointmentStatusServiceMock as any,
    );
  });

  it('lịch COMPLETED → transition throw (mock throw) → hàm throw BadRequestException', async () => {
    // Thời gian khám sau 10 tiếng (không bị lỗi 4h)
    const startTime = new Date(Date.now() + 10 * 60 * 60 * 1000);
    prismaMock.appointment.findUnique.mockResolvedValue({
      id: 1,
      startTime,
      patientProfile: { managerId: 100 },
      status: AppointmentStatus.COMPLETED,
    });

    appointmentStatusServiceMock.transition.mockRejectedValue(
      new BadRequestException(ERROR_MESSAGES.APPOINTMENT.INVALID_STATUS),
    );

    await expect(service.cancelAppointment(1, 100)).rejects.toThrow(
      BadRequestException,
    );
    await expect(service.cancelAppointment(1, 100)).rejects.toThrow(
      ERROR_MESSAGES.APPOINTMENT.INVALID_STATUS,
    );
  });

  it('lịch UPCOMING hợp lệ → gọi transition với allowedFrom [UPCOMING]', async () => {
    const startTime = new Date(Date.now() + 10 * 60 * 60 * 1000);
    prismaMock.appointment.findUnique.mockResolvedValue({
      id: 1,
      startTime,
      patientProfile: { managerId: 100 },
      doctor: { firstName: 'A', lastName: 'Nguyen' },
      service: { name: 'Kham tong quat' },
      clinic: { name: 'Phong kham Sepolia' },
      status: AppointmentStatus.UPCOMING,
    });

    const result = await service.cancelAppointment(1, 100);

    expect(result.success).toBe(true);
    expect(appointmentStatusServiceMock.transition).toHaveBeenCalledWith({
      appointmentId: 1,
      to: AppointmentStatus.CANCELLED,
      allowedFrom: [AppointmentStatus.UPCOMING],
      actor: 'PATIENT',
      actorUserId: 100,
    });
  });

  it('từ chối nếu không phải người quản lý hồ sơ bệnh nhân', async () => {
    prismaMock.appointment.findUnique.mockResolvedValue({
      id: 1,
      startTime: new Date(Date.now() + 10 * 60 * 60 * 1000),
      patientProfile: { managerId: 999 }, // Khác userId 100
    });

    await expect(service.cancelAppointment(1, 100)).rejects.toThrow(
      ForbiddenException,
    );
    expect(appointmentStatusServiceMock.transition).not.toHaveBeenCalled();
  });

  it('từ chối nếu thời gian hủy cách giờ hẹn dưới 4 tiếng', async () => {
    prismaMock.appointment.findUnique.mockResolvedValue({
      id: 1,
      startTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // Dưới 4 tiếng
      patientProfile: { managerId: 100 },
    });

    await expect(service.cancelAppointment(1, 100)).rejects.toThrow(
      ForbiddenException,
    );
    await expect(service.cancelAppointment(1, 100)).rejects.toThrow(
      ERROR_MESSAGES.APPOINTMENT.CAN_NOT_CANCEL,
    );
    expect(appointmentStatusServiceMock.transition).not.toHaveBeenCalled();
  });
});
