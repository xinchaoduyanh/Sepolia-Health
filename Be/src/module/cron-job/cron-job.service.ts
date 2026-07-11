import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Queue } from 'bullmq';
import { CRON_JOB } from './cron-job.constant';

@Injectable()
export class CronJobService implements OnModuleInit {
  private readonly logger = new Logger(CronJobService.name);

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

    this.logger.log(
      'Appointment status update cronjob scheduled (every 30 minutes)',
    );
  }
}
