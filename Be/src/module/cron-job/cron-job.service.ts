import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { Queue } from 'bullmq';
import { CRON_JOB } from './cron-job.constant';

@Injectable()
export class CronJobService implements OnModuleInit {
  constructor(
    @InjectQueue(CRON_JOB.APPOINTMENT.QUEUE_NAME)
    private readonly appointmentQueue: Queue,
  ) { }

  async onModuleInit() {
    // Add repeatable job that runs every hour
    await this.appointmentQueue.add(
      CRON_JOB.APPOINTMENT.JOB_NAME,
      {},
      {
        repeat: {
          pattern: '0,30 * * * *', // Every hour at minute 0 (e.g., 1:00, 2:00, 3:00...)
        },
        removeOnComplete: true,
        removeOnFail: false,
      },
    );

    console.log('✅ Appointment status update cronjob scheduled (every hour)');
  }
}
