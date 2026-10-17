import { PrismaService } from '@/common/prisma/prisma.service';
import { AppointmentStatusService } from '@/module/appointment-status/appointment-status.service';
import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { AppointmentStatus } from '@prisma/client';
import { Job } from 'bullmq';
import { CRON_JOB } from './cron-job.constant';

@Processor(CRON_JOB.APPOINTMENT.QUEUE_NAME)
export class CronJobProcessor extends WorkerHost {
  private readonly logger = new Logger(CronJobProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly appointmentStatusService: AppointmentStatusService,
  ) {
    super();
  }

  async process(): Promise<void> {
    try {
      await this.cancelOrCompleteAppointment();
    } catch (error) {
      this.logger.error(
        'Failed to cancel or complete appointments',
        error?.stack,
      );
    }

    try {
      await this.sendReminderEmail();
    } catch (error) {
      this.logger.error('Failed to send reminder email', error?.stack);
    }
  }

  private async cancelOrCompleteAppointment(): Promise<void> {
    const now = new Date();
    now.setSeconds(0, 0);

    // Update ON_GOING appointments that have passed their endTime to COMPLETED
    const completedCount = await this.appointmentStatusService.bulkTransition({
      where: {
        endTime: { lte: now },
      },
      from: AppointmentStatus.ON_GOING,
      to: AppointmentStatus.COMPLETED,
      actor: 'SYSTEM',
      reason: 'quá endTime',
    });

    // Update UPCOMING appointments that have passed their endTime to CANCELLED
    const cancelledCount = await this.appointmentStatusService.bulkTransition({
      where: {
        endTime: { lte: now },
      },
      from: AppointmentStatus.UPCOMING,
      to: AppointmentStatus.CANCELLED,
      actor: 'SYSTEM',
      reason: 'quá giờ chưa check-in',
    });

    // Log the results for monitoring
    if (completedCount > 0 || cancelledCount > 0) {
      this.logger.log(
        `Updated appointments: ${completedCount} completed, ${cancelledCount} cancelled`,
      );
    }
  }

  private async sendReminderEmail(): Promise<void> {
    const now = new Date();
    now.setSeconds(0, 0);
    const target24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const target1h = new Date(now.getTime() + 60 * 60 * 1000);

    const appointment = await this.prisma.appointment.findMany({
      where: {
        status: AppointmentStatus.UPCOMING,
        startTime: { in: [target1h, target24h] },
      },
    });

    // send email

    // send notification
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job<any>) {
    this.logger.log(`Appointment status update job #${job.id} completed`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<any>, error: Error) {
    this.logger.error(
      `Appointment status update job #${job.id} failed: ${error.message}`,
      error.stack,
    );
  }

  @OnWorkerEvent('active')
  onActive(job: Job<any>) {
    this.logger.log(`Appointment status update job #${job.id} is running...`);
  }
}
