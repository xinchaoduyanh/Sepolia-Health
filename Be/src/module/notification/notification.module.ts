import { Module, Global } from '@nestjs/common';
import { PrismaModule } from '@/common/prisma/prisma.module';
import { CommonModule } from '@/common/common.module';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule } from '@nestjs/config';
import { NotificationService } from './notification.service';
import { NotificationTemplateService } from './notification-template.service';
import { NotificationSchedulerService } from './notification-scheduler.service';
import { AppointmentResultScannerService } from './appointment-result-scanner.service';
import { NotificationController } from './notification.controller';
import { AdminNotificationController } from './admin-notification.controller';
import { NOTIFICATION_SCHEDULER_QUEUE } from './notification-scheduler.service';

@Global()
@Module({
  imports: [
    PrismaModule,
    CommonModule,
    ConfigModule,
    // BullModule.registerQueue({ // DISABLED - Background scheduler queue
    //   name: NOTIFICATION_SCHEDULER_QUEUE,
    // }),
  ],
  controllers: [
    NotificationController,
    AdminNotificationController, // ENABLED - Admin features for StreamChat tokens
  ],
  providers: [
    NotificationService,
    NotificationTemplateService,
    // NotificationSchedulerService, // DISABLED - Background scheduler
    // AppointmentResultScannerService, // DISABLED - Background scanner
  ],
  exports: [
    NotificationService,
    NotificationTemplateService,
    // NotificationSchedulerService, // DISABLED - Background scheduler
    // AppointmentResultScannerService, // DISABLED - Background scanner
  ],
})
export class NotificationModule { }
