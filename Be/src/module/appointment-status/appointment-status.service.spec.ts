import { ERROR_MESSAGES } from '@/common/constants';
import { BadRequestException } from '@nestjs/common';
import { AppointmentStatus } from '@prisma/client';
import { AppointmentStatusService } from './appointment-status.service';

describe('AppointmentStatusService', () => {
  let service: AppointmentStatusService;
  let prismaMock: any;

  beforeEach(() => {
    prismaMock = {
      appointment: {
        updateMany: jest.fn(),
      },
    };
    service = new AppointmentStatusService(prismaMock as any);
  });

  describe('canTransition', () => {
    it('cho phép UPCOMING -> ON_GOING và UPCOMING -> CANCELLED', () => {
      expect(
        service.canTransition(
          AppointmentStatus.UPCOMING,
          AppointmentStatus.ON_GOING,
        ),
      ).toBe(true);
      expect(
        service.canTransition(
          AppointmentStatus.UPCOMING,
          AppointmentStatus.CANCELLED,
        ),
      ).toBe(true);
    });

    it('cho phép ON_GOING -> COMPLETED và ON_GOING -> CANCELLED', () => {
      expect(
        service.canTransition(
          AppointmentStatus.ON_GOING,
          AppointmentStatus.COMPLETED,
        ),
      ).toBe(true);
      expect(
        service.canTransition(
          AppointmentStatus.ON_GOING,
          AppointmentStatus.CANCELLED,
        ),
      ).toBe(true);
    });

    it('từ chối chuyển từ trạng thái kết thúc (COMPLETED, CANCELLED)', () => {
      expect(
        service.canTransition(
          AppointmentStatus.COMPLETED,
          AppointmentStatus.CANCELLED,
        ),
      ).toBe(false);
      expect(
        service.canTransition(
          AppointmentStatus.COMPLETED,
          AppointmentStatus.ON_GOING,
        ),
      ).toBe(false);
      expect(
        service.canTransition(
          AppointmentStatus.CANCELLED,
          AppointmentStatus.UPCOMING,
        ),
      ).toBe(false);
      expect(
        service.canTransition(
          AppointmentStatus.CANCELLED,
          AppointmentStatus.COMPLETED,
        ),
      ).toBe(false);
    });

    it('từ chối UPCOMING -> COMPLETED trực tiếp', () => {
      expect(
        service.canTransition(
          AppointmentStatus.UPCOMING,
          AppointmentStatus.COMPLETED,
        ),
      ).toBe(false);
    });
  });

  describe('transition', () => {
    it('gọi updateMany với status in allowedFrom và thành công khi count = 1', async () => {
      prismaMock.appointment.updateMany.mockResolvedValue({ count: 1 });

      await expect(
        service.transition({
          appointmentId: 10,
          to: AppointmentStatus.ON_GOING,
          allowedFrom: [AppointmentStatus.UPCOMING],
          actor: 'RECEPTIONIST',
          actorUserId: 101,
          reason: 'Bệnh nhân đến quầy',
        }),
      ).resolves.toBeUndefined();

      expect(prismaMock.appointment.updateMany).toHaveBeenCalledWith({
        where: {
          id: 10,
          status: { in: [AppointmentStatus.UPCOMING] },
        },
        data: {
          status: AppointmentStatus.ON_GOING,
        },
      });
    });

    it('throw BadRequestException khi count === 0', async () => {
      prismaMock.appointment.updateMany.mockResolvedValue({ count: 0 });

      await expect(
        service.transition({
          appointmentId: 10,
          to: AppointmentStatus.ON_GOING,
          allowedFrom: [AppointmentStatus.UPCOMING],
          actor: 'RECEPTIONIST',
        }),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.transition({
          appointmentId: 10,
          to: AppointmentStatus.ON_GOING,
          allowedFrom: [AppointmentStatus.UPCOMING],
          actor: 'RECEPTIONIST',
        }),
      ).rejects.toThrow(ERROR_MESSAGES.APPOINTMENT.INVALID_STATUS);
    });

    it('lọc bỏ các trạng thái không hợp lệ trong allowedFrom', async () => {
      prismaMock.appointment.updateMany.mockResolvedValue({ count: 1 });

      await service.transition({
        appointmentId: 10,
        to: AppointmentStatus.ON_GOING,
        // COMPLETED không thể chuyển sang ON_GOING, nên phải bị lọc ra
        allowedFrom: [
          AppointmentStatus.UPCOMING,
          AppointmentStatus.COMPLETED,
        ],
        actor: 'DOCTOR',
      });

      expect(prismaMock.appointment.updateMany).toHaveBeenCalledWith({
        where: {
          id: 10,
          status: { in: [AppointmentStatus.UPCOMING] },
        },
        data: {
          status: AppointmentStatus.ON_GOING,
        },
      });
    });

    it('dùng allowedFrom mặc định khi không truyền', async () => {
      prismaMock.appointment.updateMany.mockResolvedValue({ count: 1 });

      await service.transition({
        appointmentId: 10,
        to: AppointmentStatus.CANCELLED,
        actor: 'ADMIN',
      });

      expect(prismaMock.appointment.updateMany).toHaveBeenCalledWith({
        where: {
          id: 10,
          status: {
            in: [AppointmentStatus.UPCOMING, AppointmentStatus.ON_GOING],
          },
        },
        data: {
          status: AppointmentStatus.CANCELLED,
        },
      });
    });

    it('sử dụng tx khi được truyền vào', async () => {
      const txMock = {
        appointment: {
          updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        },
      };

      await service.transition({
        appointmentId: 10,
        to: AppointmentStatus.ON_GOING,
        allowedFrom: [AppointmentStatus.UPCOMING],
        actor: 'DOCTOR',
        tx: txMock as any,
      });

      expect(txMock.appointment.updateMany).toHaveBeenCalledWith({
        where: {
          id: 10,
          status: { in: [AppointmentStatus.UPCOMING] },
        },
        data: {
          status: AppointmentStatus.ON_GOING,
        },
      });
      expect(prismaMock.appointment.updateMany).not.toHaveBeenCalled();
    });

    it('merge extraWhere và data vào updateMany', async () => {
      prismaMock.appointment.updateMany.mockResolvedValue({ count: 1 });

      await service.transition({
        appointmentId: 10,
        to: AppointmentStatus.ON_GOING,
        allowedFrom: [AppointmentStatus.UPCOMING],
        actor: 'DOCTOR',
        actorUserId: 5,
        extraWhere: { doctorId: 15 },
        data: { notes: 'Bắt đầu khám' },
      });

      expect(prismaMock.appointment.updateMany).toHaveBeenCalledWith({
        where: {
          id: 10,
          status: { in: [AppointmentStatus.UPCOMING] },
          doctorId: 15,
        },
        data: {
          notes: 'Bắt đầu khám',
          status: AppointmentStatus.ON_GOING,
        },
      });
    });
  });

  describe('bulkTransition', () => {
    it('throw Error khi chuyển trạng thái không hợp lệ', async () => {
      await expect(
        service.bulkTransition({
          where: {},
          from: AppointmentStatus.COMPLETED,
          to: AppointmentStatus.ON_GOING,
          actor: 'SYSTEM',
          reason: 'test invalid',
        }),
      ).rejects.toThrow('Cannot transition from COMPLETED to ON_GOING');

      expect(prismaMock.appointment.updateMany).not.toHaveBeenCalled();
    });

    it('thực hiện updateMany và trả về số lượng bản ghi cập nhật', async () => {
      prismaMock.appointment.updateMany.mockResolvedValue({ count: 5 });

      const count = await service.bulkTransition({
        where: { endTime: { lte: new Date() } },
        from: AppointmentStatus.ON_GOING,
        to: AppointmentStatus.COMPLETED,
        actor: 'SYSTEM',
        reason: 'quá endTime',
      });

      expect(count).toBe(5);
      expect(prismaMock.appointment.updateMany).toHaveBeenCalledWith({
        where: {
          endTime: expect.any(Object),
          status: AppointmentStatus.ON_GOING,
        },
        data: {
          status: AppointmentStatus.COMPLETED,
        },
      });
    });
  });
});
