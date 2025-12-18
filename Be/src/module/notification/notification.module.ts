import { Module, Global } from '@nestjs/common';
import { PrismaModule } from '@/common/prisma/prisma.module';
import { CommonModule } from '@/common/common.module';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule } from '@nestjs/config';
import { NotificationService } from './notification.service';
import { NotificationTemplateService } from './notification-template.service';
import { NotificationSchedulerService } from './notification-scheduler.service';
import { NotificationController } from './notification.controller';
import { AdminNotificationController } from './admin-notification.controller';
import { NOTIFICATION_SCHEDULER_QUEUE } from './notification-scheduler.service';

@Global()
@Module({
  imports: [
    PrismaModule,
    CommonModule,
    ConfigModule,
    BullModule.registerQueue({
      name: NOTIFICATION_SCHEDULER_QUEUE,
    }),
  ],
  controllers: [
    NotificationController,
    AdminNotificationController,
  ],
  providers: [
    NotificationService,
    NotificationTemplateService,
    NotificationSchedulerService,
  ],
  exports: [
    NotificationService,
    NotificationTemplateService,
    NotificationSchedulerService,
  ],
})
export class NotificationModule { }
