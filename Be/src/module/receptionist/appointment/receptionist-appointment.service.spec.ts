import { BadRequestException } from '@nestjs/common';
import { AppointmentStatus, PaymentStatus } from '@prisma/client';
import { ERROR_MESSAGES } from '@/common/constants';
import { ReceptionistAppointmentService } from './receptionist-appointment.service';

describe('ReceptionistAppointmentService', () => {
  let service: ReceptionistAppointmentService;
  let prismaMock: any;

  beforeEach(() => {
    prismaMock = {
      appointment: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };
    service = new ReceptionistAppointmentService(prismaMock as any);
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
      prismaMock.appointment.update.mockResolvedValue({
        ...appointment,
        status: AppointmentStatus.ON_GOING,
      });

      const result = await service.checkInAppointment(1);
      expect(result.success).toBe(true);
      expect(prismaMock.appointment.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { status: AppointmentStatus.ON_GOING },
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
      expect(prismaMock.appointment.update).not.toHaveBeenCalled();
    });
  });
});
