import { ERROR_MESSAGES } from '@/common/constants';
import { PrismaService } from '@/common/prisma/prisma.service';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { AppointmentStatus, Prisma } from '@prisma/client';
import { APPOINTMENT_TRANSITIONS } from './appointment-status.constant';

export interface TransitionAppointmentParams {
  appointmentId: number;
  to: AppointmentStatus;
  allowedFrom?: AppointmentStatus[];
  actor: 'PATIENT' | 'RECEPTIONIST' | 'DOCTOR' | 'ADMIN' | 'SYSTEM';
  actorUserId?: number;
  reason?: string;
  extraWhere?: Prisma.AppointmentWhereInput;
  data?: Prisma.AppointmentUpdateManyMutationInput;
  tx?: Prisma.TransactionClient;
}

export interface BulkTransitionAppointmentParams {
  where: Prisma.AppointmentWhereInput;
  from: AppointmentStatus;
  to: AppointmentStatus;
  actor: 'SYSTEM';
  reason: string;
}

@Injectable()
export class AppointmentStatusService {
  private readonly logger = new Logger(AppointmentStatusService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Kiểm tra khả năng chuyển trạng thái giữa 2 status theo bảng quy tắc
   */
  canTransition(from: AppointmentStatus, to: AppointmentStatus): boolean {
    return APPOINTMENT_TRANSITIONS[from]?.includes(to) ?? false;
  }

  /**
   * Chuyển trạng thái cho 1 lịch hẹn duy nhất với kiểm tra an toàn đồng thời
   */
  async transition(params: TransitionAppointmentParams): Promise<void> {
    const {
      appointmentId,
      to,
      allowedFrom,
      actor,
      actorUserId,
      reason,
      extraWhere,
      data,
      tx,
    } = params;

    const allStatuses = Object.values(AppointmentStatus);
    const validAllowedFrom = allowedFrom
      ? allowedFrom.filter((status) => this.canTransition(status, to))
      : allStatuses.filter((status) => this.canTransition(status, to));

    const client = tx ?? this.prisma;

    const result = await client.appointment.updateMany({
      where: {
        ...extraWhere,
        id: appointmentId,
        status: { in: validAllowedFrom },
      },
      data: {
        ...data,
        status: to,
      },
    });

    if (result.count === 0) {
      throw new BadRequestException(ERROR_MESSAGES.APPOINTMENT.INVALID_STATUS);
    }

    this.logger.log(
      `Appointment ${appointmentId}: -> ${to} by ${actor}${
        actorUserId ? '#' + actorUserId : ''
      }${reason ? ' (' + reason + ')' : ''}`,
    );
  }

  /**
   * Chuyển trạng thái hàng loạt cho cron job
   */
  async bulkTransition(
    params: BulkTransitionAppointmentParams,
  ): Promise<number> {
    const { where, from, to, actor, reason } = params;

    if (!this.canTransition(from, to)) {
      throw new Error(`Cannot transition from ${from} to ${to}`);
    }

    const result = await this.prisma.appointment.updateMany({
      where: {
        ...where,
        status: from,
      },
      data: {
        status: to,
      },
    });

    this.logger.log(
      `Bulk transitioned ${result.count} appointments: ${from} -> ${to} by ${actor}${
        reason ? ' (' + reason + ')' : ''
      }`,
    );

    return result.count;
  }
}
