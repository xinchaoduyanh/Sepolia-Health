import { Injectable, OnModuleInit } from '@nestjs/common';
import { CronJobProcessor } from './cron-job.processor';

@Injectable()
export class CronJobService implements OnModuleInit {
  constructor(private readonly cronJobProcessor: CronJobProcessor) {}

  async onModuleInit() {
    await this.cronJobProcessor.process();
  }
}
