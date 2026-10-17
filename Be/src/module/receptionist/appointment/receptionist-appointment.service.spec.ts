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
        findMany: jest.fn(),
        count: jest.fn(),
        groupBy: jest.fn(),
      },
      receptionistProfile: {
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

  describe('getAppointments', () => {
    beforeEach(() => {
      prismaMock.appointment.findMany.mockResolvedValue([]);
      prismaMock.appointment.count.mockResolvedValue(0);
    });

    it('lễ tân có clinicId → where có AND chứa điều kiện clinic/ONLINE và search OR vẫn còn', async () => {
      prismaMock.receptionistProfile.findUnique.mockResolvedValue({
        clinicId: 10,
      });

      await service.getAppointments(
        {
          page: 1,
          limit: 10,
          search: 'Nguyen',
        },
        1,
      );

      expect(prismaMock.receptionistProfile.findUnique).toHaveBeenCalledWith({
        where: { userId: 1 },
      });

      const findManyCall = prismaMock.appointment.findMany.mock.calls[0][0];
      expect(findManyCall.where.AND).toEqual(
        expect.arrayContaining([
          {
            OR: [{ clinicId: 10 }, { type: 'ONLINE' }],
          },
        ]),
      );
      expect(findManyCall.where.OR).toBeDefined();
      expect(findManyCall.where.OR.length).toBeGreaterThan(0);
    });

    it('không có clinicId → không thêm điều kiện clinic/ONLINE', async () => {
      prismaMock.receptionistProfile.findUnique.mockResolvedValue({
        clinicId: null,
      });

      await service.getAppointments(
        {
          page: 1,
          limit: 10,
        },
        2,
      );

      const findManyCall = prismaMock.appointment.findMany.mock.calls[0][0];
      expect(findManyCall.where.AND).toBeUndefined();
    });

    it('không có userId → không truy vấn receptionistProfile và không thêm AND', async () => {
      await service.getAppointments({
        page: 1,
        limit: 10,
      });

      expect(prismaMock.receptionistProfile.findUnique).not.toHaveBeenCalled();
      const findManyCall = prismaMock.appointment.findMany.mock.calls[0][0];
      expect(findManyCall.where.AND).toBeUndefined();
    });

    it('có startDate → orderBy startTime ASC', async () => {
      await service.getAppointments({
        page: 1,
        limit: 10,
        startDate: '2026-10-17',
      });

      const findManyCall = prismaMock.appointment.findMany.mock.calls[0][0];
      expect(findManyCall.orderBy).toEqual({ startTime: 'asc' });
    });

    it('không có startDate → orderBy startTime DESC', async () => {
      await service.getAppointments({ page: 1, limit: 10 });

      const findManyCall = prismaMock.appointment.findMany.mock.calls[0][0];
      expect(findManyCall.orderBy).toEqual({ startTime: 'desc' });
    });
  });

  describe('getAppointmentSummary', () => {
    it('lễ tân có clinicId → groupBy có where lọc theo clinicId hoặc ONLINE', async () => {
      prismaMock.receptionistProfile.findUnique.mockResolvedValue({
        clinicId: 10,
      });
      prismaMock.appointment.groupBy.mockResolvedValue([
        { status: AppointmentStatus.UPCOMING, _count: { status: 5 } },
      ]);

      const result = await service.getAppointmentSummary(1);

      expect(prismaMock.receptionistProfile.findUnique).toHaveBeenCalledWith({
        where: { userId: 1 },
      });
      expect(prismaMock.appointment.groupBy).toHaveBeenCalledWith({
        by: ['status'],
        where: {
          AND: [{ OR: [{ clinicId: 10 }, { type: 'ONLINE' }] }],
        },
        _count: { status: true },
      });
      expect(result).toEqual([
        { appointmentStatus: AppointmentStatus.UPCOMING, count: 5 },
      ]);
    });

    it('không có clinicId → groupBy không có where', async () => {
      prismaMock.receptionistProfile.findUnique.mockResolvedValue({
        clinicId: null,
      });
      prismaMock.appointment.groupBy.mockResolvedValue([]);

      await service.getAppointmentSummary(2);

      expect(prismaMock.appointment.groupBy).toHaveBeenCalledWith({
        by: ['status'],
        where: undefined,
        _count: { status: true },
      });
    });
  });
});
