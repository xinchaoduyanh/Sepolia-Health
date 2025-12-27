import { PrismaService } from '@/common/prisma/prisma.service';
import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { AppointmentStatus } from '@prisma/client';
import { Job } from 'bullmq';
import { CRON_JOB } from './cron-job.constant';

@Processor(CRON_JOB.APPOINTMENT.QUEUE_NAME)
export class CronJobProcessor extends WorkerHost {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(): Promise<void> {
    await this.cancelOrCompleteAppointment();
    await this.sendReminderEmail();
  }

  private async cancelOrCompleteAppointment(): Promise<void> {
    const now = new Date();
    now.setSeconds(0, 0);

    // Update ON_GOING appointments that have passed their endTime to COMPLETED
    const completedResult = await this.prisma.appointment.updateMany({
      where: {
        endTime: { lte: now }, // Less than or equal - catches all past appointments
        status: AppointmentStatus.ON_GOING,
      },
      data: { status: AppointmentStatus.COMPLETED },
    });

    // Update UPCOMING appointments that have passed their endTime to CANCELLED
    const cancelledResult = await this.prisma.appointment.updateMany({
      where: {
        status: AppointmentStatus.UPCOMING,
        endTime: { lte: now }, // Less than or equal - catches all past appointments
      },
      data: { status: AppointmentStatus.CANCELLED },
    });

    // Log the results for monitoring
    if (completedResult.count > 0 || cancelledResult.count > 0) {
      console.log(
        `📅 Updated appointments: ${completedResult.count} completed, ${cancelledResult.count} cancelled`,
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
    console.log(`✅ Appointment status update job #${job.id} completed`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<any>, error: Error) {
    console.log(
      `❌ Appointment status update job #${job.id} failed:`,
      error.message,
    );
  }

  @OnWorkerEvent('active')
  onActive(job: Job<any>) {
    console.log(`🔄 Appointment status update job #${job.id} is running...`);
  }
}
