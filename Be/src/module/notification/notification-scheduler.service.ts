import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectQueue, Processor } from '@nestjs/bullmq';
import { Queue, Worker } from 'bullmq';
import { Inject } from '@nestjs/common';
import { appConfig } from '@/common/config';
import { ConfigType } from '@nestjs/config';
import { NotificationService } from './notification.service';
import { AppointmentResultScannerService } from './appointment-result-scanner.service';

export const NOTIFICATION_SCHEDULER_QUEUE = 'notification-scheduler';

@Injectable()
export class NotificationSchedulerService implements OnModuleInit {
  private readonly logger = new Logger(NotificationSchedulerService.name);
  private worker: Worker;

  constructor(
    @InjectQueue(NOTIFICATION_SCHEDULER_QUEUE) private readonly queue: Queue,
    private readonly notificationService: NotificationService,
    private readonly appointmentResultScannerService: AppointmentResultScannerService,
    @Inject(appConfig.KEY) private readonly appConf: ConfigType<typeof appConfig>,
  ) {}

  async onModuleInit() {
    await this.setupWorker();
    this.logger.log('Notification scheduler initialized');
  }

  private async setupWorker(): Promise<void> {
    this.worker = new Worker(
      NOTIFICATION_SCHEDULER_QUEUE,
      async (job) => {
        this.logger.log(`Processing job: ${job.name} with ID: ${job.id}`);

        try {
          switch (job.name) {
            case 'appointment-reminder':
              await this.processAppointmentReminder(job.data);
              break;

            case 'campaign-broadcast':
              await this.processCampaignBroadcast(job.data);
              break;

            case 'appointment-status-change':
              await this.processAppointmentStatusChange(job.data);
              break;

            case 'payment-status-change':
              await this.processPaymentStatusChange(job.data);
              break;

            case 'system-announcement':
              await this.processSystemAnnouncement(job.data);
              break;

            case 'appointment-result-pending':
              await this.processAppointmentResultPending(job.data);
              break;

            default:
              this.logger.warn(`Unknown job type: ${job.name}`);
          }

          this.logger.log(`Completed job: ${job.name} with ID: ${job.id}`);
        } catch (error) {
          this.logger.error(
            `Failed to process job ${job.name} with ID ${job.id}:`,
            error instanceof Error ? error.message : String(error),
          );
          throw error; // Re-throw to trigger job failure handling
        }
      },
      {
        connection: {
          url: this.appConf.redisUrl,
        },
        concurrency: 5, // Process up to 5 jobs concurrently
      },
    );

    this.worker.on('completed', (job) => {
      this.logger.log(`Job completed: ${job.id}`);
    });

    this.worker.on('failed', (job, err) => {
      this.logger.error(`Job failed: ${job?.id}`, err);
    });

    this.worker.on('error', (err) => {
      this.logger.error('Worker error:', err);
    });
  }

  /**
   * Schedule appointment reminder (usually 24 hours before)
   */
  async scheduleAppointmentReminder(
    appointmentId: number,
    reminderTime: Date,
  ): Promise<void> {
    const delay = reminderTime.getTime() - Date.now();

    if (delay <= 0) {
      // If reminder time is in the past, send immediately
      await this.notificationService.sendAppointmentReminder(appointmentId);
      return;
    }

    await this.queue.add(
      'appointment-reminder',
      { appointmentId },
      {
        delay,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 60000, // 1 minute
        },
        removeOnComplete: 100,
        removeOnFail: 50,
      },
    );

    this.logger.log(`Scheduled appointment reminder for appointment ${appointmentId} at ${reminderTime.toISOString()}`);
  }

  /**
   * Schedule campaign broadcast
   */
  async scheduleCampaignBroadcast(
    campaignId: string,
    scheduledFor: Date,
  ): Promise<void> {
    const delay = scheduledFor.getTime() - Date.now();

    if (delay <= 0) {
      // If scheduled time is in the past, send immediately
      await this.processCampaignBroadcast({ campaignId });
      return;
    }

    await this.queue.add(
      'campaign-broadcast',
      { campaignId },
      {
        delay,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 300000, // 5 minutes
        },
        removeOnComplete: 50,
        removeOnFail: 25,
      },
    );

    this.logger.log(`Scheduled campaign broadcast ${campaignId} at ${scheduledFor.toISOString()}`);
  }

  /**
   * Schedule appointment status change notification
   */
  async scheduleAppointmentStatusChange(
    appointmentId: number,
    oldStatus: string,
    newStatus: string,
    delay: number = 0,
  ): Promise<void> {
    await this.queue.add(
      'appointment-status-change',
      {
        appointmentId,
        oldStatus,
        newStatus,
      },
      {
        delay,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 30000, // 30 seconds
        },
        removeOnComplete: 100,
        removeOnFail: 50,
      },
    );

    this.logger.log(`Scheduled appointment status change for appointment ${appointmentId}`);
  }

  /**
   * Schedule payment status change notification
   */
  async schedulePaymentStatusChange(
    appointmentId: number,
    paymentStatus: string,
    amount?: number,
    delay: number = 0,
  ): Promise<void> {
    await this.queue.add(
      'payment-status-change',
      {
        appointmentId,
        paymentStatus,
        amount,
      },
      {
        delay,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 30000, // 30 seconds
        },
        removeOnComplete: 100,
        removeOnFail: 50,
      },
    );

    this.logger.log(`Scheduled payment status change for appointment ${appointmentId}`);
  }

  /**
   * Schedule system announcement
   */
  async scheduleSystemAnnouncement(
    title: string,
    message: string,
    targetRoles: string[],
    scheduledFor?: Date,
    priority: string = 'MEDIUM',
  ): Promise<void> {
    const delay = scheduledFor ? scheduledFor.getTime() - Date.now() : 0;

    await this.queue.add(
      'system-announcement',
      {
        title,
        message,
        targetRoles,
        priority,
      },
      {
        delay,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 60000, // 1 minute
        },
        removeOnComplete: 10,
        removeOnFail: 5,
      },
    );

    this.logger.log(`Scheduled system announcement: ${title}`);
  }

  /**
   * Cancel scheduled notification
   */
  async cancelScheduledNotification(jobId: string): Promise<void> {
    try {
      await this.queue.remove(jobId);
      this.logger.log(`Cancelled scheduled notification: ${jobId}`);
    } catch (error) {
      this.logger.error(`Failed to cancel notification ${jobId}:`, error);
      throw error;
    }
  }

  /**
   * Schedule daily appointment result scanner job
   */
  async scheduleDailyResultScan(): Promise<void> {
    await this.queue.add(
      'appointment-result-pending',
      {},
      {
        repeat: { pattern: '0 9 * * *' }, // 9 AM every day
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 300000, // 5 minutes
        },
        removeOnComplete: 10,
        removeOnFail: 5,
      }
    );

    this.logger.log('✅ Scheduled daily appointment result scan at 9:00 AM');
  }

  /**
   * Trigger manual appointment result scanner
   */
  async triggerManualResultScan(): Promise<void> {
    await this.queue.add(
      'appointment-result-pending',
      { manual: true, timestamp: new Date().toISOString() },
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 60000, // 1 minute for manual trigger
        },
        removeOnComplete: 5,
        removeOnFail: 3,
      }
    );

    this.logger.log('🔧 Triggered manual appointment result scan');
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  }> {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      this.queue.getWaiting(),
      this.queue.getActive(),
      this.queue.getCompleted(),
      this.queue.getFailed(),
      this.queue.getDelayed(),
    ]);

    return {
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length,
      delayed: delayed.length,
    };
  }

  // ===== JOB PROCESSORS =====

  private async processAppointmentReminder(data: { appointmentId: number }): Promise<void> {
    await this.notificationService.sendAppointmentReminder(data.appointmentId);
  }

  private async processCampaignBroadcast(data: { campaignId: string }): Promise<void> {
    // Get campaign details from StreamChat
    // This would require accessing the campaign storage in StreamChat
    // For now, we'll implement a basic version
    this.logger.log(`Processing campaign broadcast: ${data.campaignId}`);

    // In a real implementation, you would:
    // 1. Fetch campaign details from StreamChat admin_notifications_campaigns channel
    // 2. Parse the campaign data
    // 3. Call notificationService.sendBroadcastNotification()

    // For now, just log the processing
    this.logger.log(`Campaign ${data.campaignId} broadcast processed`);
  }

  private async processAppointmentStatusChange(data: {
    appointmentId: number;
    oldStatus: string;
    newStatus: string;
  }): Promise<void> {
    // Import AppointmentStatus from @prisma/client
    const { AppointmentStatus } = await import('@prisma/client');

    await this.notificationService.sendAppointmentStatusChange(
      data.appointmentId,
      data.oldStatus as any,
      data.newStatus as any,
    );
  }

  private async processPaymentStatusChange(data: {
    appointmentId: number;
    paymentStatus: string;
    amount?: number;
  }): Promise<void> {
    // This would implement payment status change notifications
    // You can expand this based on your specific payment flow
    this.logger.log(`Processing payment status change for appointment ${data.appointmentId}: ${data.paymentStatus}`);
  }

  private async processSystemAnnouncement(data: {
    title: string;
    message: string;
    targetRoles: string[];
    priority: string;
  }): Promise<void> {
    const { Role } = await import('@prisma/client');

    // Convert string roles to Role enum
    const targetRoles = data.targetRoles.map(role => Role[role as keyof typeof Role]);

    // Send to each target role
    for (const role of targetRoles) {
      await this.notificationService.sendToRole(role, {
        type: 'SYSTEM_NOTIFICATION' as any,
        title: data.title,
        message: data.message,
        priority: data.priority as any,
      });
    }
  }

  private async processAppointmentResultPending(data: any): Promise<void> {
    this.logger.log(`🔍 Processing appointment result pending job...`);

    // Use injected scanner service
    await this.appointmentResultScannerService.processAppointmentResultScanner(data);

    this.logger.log(`✅ Completed appointment result pending job processing`);
  }


  async onModuleDestroy() {
    if (this.worker) {
      await this.worker.close();
      this.logger.log('Notification scheduler worker closed');
    }
  }
}