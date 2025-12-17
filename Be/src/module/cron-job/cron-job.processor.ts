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
    await this.prisma.appointment.updateMany({
      where: { endTime: now, status: AppointmentStatus.ON_GOING },
      data: { status: AppointmentStatus.COMPLETED },
    });

    await this.prisma.appointment.updateMany({
      where: { status: AppointmentStatus.UPCOMING, endTime: now },
      data: { status: AppointmentStatus.CANCELLED },
    });
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
    console.log(`Job with data ${job.data.appointmentId} completed`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<any>, error: Error) {
    console.log(`Job ${job.data.appointmentId} failed: `, error.message);
  }

  @OnWorkerEvent('active')
  onActive(job: Job<any>) {
    console.log(`Job ${job.data.appointmentId} is active`);
  }
}
