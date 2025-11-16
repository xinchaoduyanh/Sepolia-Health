import { PrismaService } from '@/common/prisma/prisma.service';
import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { AppointmentStatus } from '@prisma/client';
import { Job } from 'bullmq';

@Processor('appointment')
export class ReceptionistAppointmentProcessor extends WorkerHost {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(job: Job<any>): Promise<void> {
    console.log('Processing job:', job.name);

    const appointment = await this.prisma.appointment.findFirstOrThrow({
      where: { id: job.data.appointmentId },
    });

    if (appointment.status === AppointmentStatus.UPCOMING) {
      await this.prisma.appointment.update({
        where: { id: job.data.appointmentId },
        data: { status: AppointmentStatus.CANCELLED },
      });
    } else if (appointment.status === AppointmentStatus.ON_GOING) {
      await this.prisma.appointment.update({
        where: { id: job.data.appointmentId },
        data: { status: AppointmentStatus.COMPLETED },
      });
    }
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
