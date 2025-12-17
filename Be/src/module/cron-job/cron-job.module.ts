import { Module } from '@nestjs/common';
import { CronJobProcessor } from './cron-job.processor';
import { PrismaModule } from '@/common/prisma/prisma.module';
import { CronJobService } from './cron-job.service';
import { BullModule } from '@nestjs/bullmq';
import { CRON_JOB } from './cron-job.constant';

@Module({
  imports: [
    PrismaModule,
    BullModule.registerQueue({ name: CRON_JOB.APPOINTMENT.QUEUE_NAME }),
  ],
  controllers: [],
  providers: [CronJobProcessor, CronJobService],
  exports: [CronJobService],
})
export class CronJobModule {}
