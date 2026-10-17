import { BadRequestException } from '@nestjs/common';
import { AppointmentStatus, PaymentStatus } from '@prisma/client';
import { ERROR_MESSAGES } from '@/common/constants';
import { ReceptionistAppointmentService } from './receptionist-appointment.service';

describe('ReceptionistAppointmentService', () => {
  let service: ReceptionistAppointmentService;
  let prismaMock: any;
  let appointmentStatusServiceMock: any;

  beforeEach(() => {
    prismaMock = {
      appointment: {
        findUnique: jest.fn(),
      },
    };
    appointmentStatusServiceMock = {
      transition: jest.fn().mockResolvedValue(undefined),
    };
    service = new ReceptionistAppointmentService(
      prismaMock as any,
      appointmentStatusServiceMock as any,
    );
  });

  describe('checkInAppointment', () => {
    it('cho phép check-in 9 phút trước giờ hẹn', async () => {
      const now = Date.now();
      const appointment = {
        id: 1,
        status: AppointmentStatus.UPCOMING,
        startTime: new Date(now + 9 * 60 * 1000), // 9 phút trước giờ hẹn (trong khoảng 10 phút)
        billing: { status: PaymentStatus.PAID },
      };

      prismaMock.appointment.findUnique.mockResolvedValue(appointment);

      const result = await service.checkInAppointment(1);
      expect(result.success).toBe(true);
      expect(appointmentStatusServiceMock.transition).toHaveBeenCalledWith({
        appointmentId: 1,
        to: AppointmentStatus.ON_GOING,
        allowedFrom: [AppointmentStatus.UPCOMING],
        actor: 'RECEPTIONIST',
      });
    });

    it('từ chối check-in 11 phút trước giờ hẹn', async () => {
      const now = Date.now();
      const appointment = {
        id: 1,
        status: AppointmentStatus.UPCOMING,
        startTime: new Date(now + 11 * 60 * 1000), // 11 phút trước giờ hẹn (quá 10 phút)
        billing: { status: PaymentStatus.PAID },
      };

      prismaMock.appointment.findUnique.mockResolvedValue(appointment);

      await expect(service.checkInAppointment(1)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.checkInAppointment(1)).rejects.toThrow(
        ERROR_MESSAGES.APPOINTMENT.NOT_YET_REACHED,
      );
      expect(appointmentStatusServiceMock.transition).not.toHaveBeenCalled();
    });
  });

  describe('cancelAppointment', () => {
    it('cho phép hủy lịch UPCOMING', async () => {
      prismaMock.appointment.findUnique.mockResolvedValue({
        id: 1,
        status: AppointmentStatus.UPCOMING,
      });

      const result = await service.cancelAppointment(1);
      expect(result.success).toBe(true);
      expect(appointmentStatusServiceMock.transition).toHaveBeenCalledWith({
        appointmentId: 1,
        to: AppointmentStatus.CANCELLED,
        allowedFrom: [AppointmentStatus.UPCOMING, AppointmentStatus.ON_GOING],
        actor: 'RECEPTIONIST',
      });
    });

    it('cho phép hủy lịch ON_GOING', async () => {
      prismaMock.appointment.findUnique.mockResolvedValue({
        id: 1,
        status: AppointmentStatus.ON_GOING,
      });

      const result = await service.cancelAppointment(1);
      expect(result.success).toBe(true);
      expect(appointmentStatusServiceMock.transition).toHaveBeenCalledWith({
        appointmentId: 1,
        to: AppointmentStatus.CANCELLED,
        allowedFrom: [AppointmentStatus.UPCOMING, AppointmentStatus.ON_GOING],
        actor: 'RECEPTIONIST',
      });
    });

    it('từ chối hủy lịch COMPLETED', async () => {
      prismaMock.appointment.findUnique.mockResolvedValue({
        id: 1,
        status: AppointmentStatus.COMPLETED,
      });

      await expect(service.cancelAppointment(1)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.cancelAppointment(1)).rejects.toThrow(
        ERROR_MESSAGES.APPOINTMENT.CAN_NOT_CANCEL,
      );
      expect(appointmentStatusServiceMock.transition).not.toHaveBeenCalled();
    });
  });
});
