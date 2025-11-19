import { StreamChat } from 'stream-chat';
import { PrismaService } from '@/common/prisma/prisma.service';
import { NotificationType, NotificationPriority } from './notification.types';

// Chuyển type DTO trước đây còn dùng thành type thuần hoặc import từ notification.types.ts
// Ví dụ:
// export interface AppointmentNotificationPatient {
//   appointmentId: number;
//   appointmentDate: string;
//   appointmentTime: string;
//   doctorName: string;
//   serviceName: string;
//   clinicName: string;
//   recipientId: string;
//   notes?: string;
// }

export class NotificationUtils {
  private static streamClient: StreamChat;
  private static readonly NOTIFICATION_CHANNEL_PREFIX = 'notifications';
  private static prisma: PrismaService;

  static initialize(streamChatConf: any, prisma: PrismaService) {
    this.streamClient = StreamChat.getInstance(
      streamChatConf.streamChatApiKey,
      streamChatConf.streamChatSecret,
    );
    this.prisma = prisma;
    void this.ensureSystemUserExists();
  }

  private static async ensureSystemUserExists() {
    try {
      await this.streamClient.upsertUser({
        id: 'system',
        role: 'admin',
      });
      console.log('[NotificationUtils] System user initialized successfully');
    } catch (error) {
      console.warn(
        '[NotificationUtils] Failed to initialize system user in Stream.io. The application will continue but notification features may not work properly.',
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  private static async getOrCreateNotificationChannel(userId: string) {
    const channelId = `${this.NOTIFICATION_CHANNEL_PREFIX}_${userId}`;
    const channel = this.streamClient.channel('messaging', channelId, {
      created_by_id: 'system',
      members: ['system', userId],
    });
    await channel.watch();
    return channel;
  }

  static async sendNotification(
    type: NotificationType,
    priority: NotificationPriority,
    recipientId: string,
    senderId: string | undefined,
    title: string,
    message: string,
    metadata?: Record<string, any>,
  ): Promise<void> {
    try {
      await this.streamClient.upsertUser({
        id: recipientId,
        role: 'user',
      });
      const channel = await this.getOrCreateNotificationChannel(recipientId);
      const sentMessage = await channel.sendMessage({
        text: message,
        user_id: senderId || 'system',
        type: 'system', // StreamChat chỉ chấp nhận: '', 'regular', hoặc 'system'
        // Đưa các thông tin custom vào metadata
        metadata: {
          notificationType: type, // NotificationType gốc (CREATE_APPOINTMENT_PATIENT, etc.)
          priority,
          status: 'UNREAD',
          title,
          ...metadata, // Merge với metadata từ bên ngoài
        },
      } as any);

      console.log('✅ [NotificationUtils] Notification sent successfully:', {
        messageId: sentMessage.message?.id,
        type,
        recipientId,
        title,
        channelId: `${this.NOTIFICATION_CHANNEL_PREFIX}_${recipientId}`,
      });
    } catch (error) {
      console.error(
        '❌ [NotificationUtils] Error sending notification:',
        error,
      );
    }
  }

  // Các hàm gửi noti cụ thể (ví dụ sendCreateAppointmentPatientNotification) sẽ nhận object thuần và truyền xuống sendNotification giống trên
  // ... (bạn tiếp tục di chuyển/giản lược các hàm xử lý nếu cần hoặc chỉ giữ lại duy nhất sendNotification)
}
