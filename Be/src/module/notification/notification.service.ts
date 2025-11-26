import { Inject, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { StreamChat } from 'stream-chat';
import { appConfig } from '@/common/config';
import { PrismaService } from '@/common/prisma/prisma.service';
import {
  NotificationType,
  NotificationPriority,
  NotificationStatus,
  NotificationResponse,
  AppointmentNotificationPatient,
  UpdateAppointmentNotificationPatient,
  DeleteAppointmentNotificationPatient,
  AppointmentNotificationDoctor,
  UpdateAppointmentNotificationDoctor,
  DeleteAppointmentNotificationDoctor,
  PaymentSuccessNotificationPatient,
} from './notification.types';

@Injectable()
export class NotificationService {
  private streamClient: StreamChat;
  private readonly NOTIFICATION_CHANNEL_PREFIX = 'notifications';
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @Inject(appConfig.KEY)
    private readonly streamChatConf: ConfigType<typeof appConfig>,
    private prisma: PrismaService,
  ) {
    this.streamClient = StreamChat.getInstance(
      this.streamChatConf.streamChatApiKey,
      this.streamChatConf.streamChatSecret,
    );
  }

  async onModuleInit() {
    await this.ensureSystemUserExists();
  }

  private async ensureSystemUserExists() {
    try {
      await this.streamClient.upsertUser({
        id: 'system',
        role: 'admin',
      });
      this.logger.log('System user initialized successfully');
    } catch (error) {
      this.logger.warn(
        'Failed to initialize system user in Stream.io. The application will continue but notification features may not work properly.',
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  private async getOrCreateNotificationChannel(userId: string) {
    const channelId = `${this.NOTIFICATION_CHANNEL_PREFIX}_${userId}`;
    const channel = this.streamClient.channel('messaging', channelId, {
      created_by_id: 'system',
      members: ['system', userId],
    });
    await channel.watch();
    return channel;
  }

  async sendNotification(dto: {
    type: NotificationType;
    priority: NotificationPriority;
    recipientId: string;
    senderId?: string;
    title: string;
    message: string;
    metadata?: Record<string, any>;
  }): Promise<NotificationResponse> {
    await this.streamClient.upsertUser({
      id: dto.recipientId,
      role: 'user',
    });
    const channel = await this.getOrCreateNotificationChannel(dto.recipientId);
    const message = await channel.sendMessage({
      text: dto.message,
      user_id: dto.senderId || 'system',
      type: dto.type as any,
      priority: dto.priority as any,
      status: NotificationStatus.UNREAD,
      title: dto.title,
      metadata: dto.metadata,
    } as any);
    return {
      id: message.message?.id || '',
      type: dto.type,
      priority: dto.priority,
      status: NotificationStatus.UNREAD,
      title: dto.title,
      message: dto.message,
      metadata: dto.metadata,
      createdAt: message.message?.created_at
        ? new Date(message.message.created_at)
        : new Date(),
    };
  }

  /**
   * Send notification when patient creates an appointment
   */

  async sendCreateAppointmentPatientNotification(
    obj: AppointmentNotificationPatient,
  ): Promise<NotificationResponse> {
    const appointmentDate = obj.startTime.toLocaleDateString('vi-VN');
    const appointmentTime = obj.startTime.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const title = 'Đặt lịch hẹn thành công';
    const message = `Bạn đã đặt lịch khám với Bác sĩ ${obj.doctorName} vào ${appointmentDate} lúc ${appointmentTime} tại ${obj.clinicName}. Dịch vụ: ${obj.serviceName}.`;
    return this.sendNotification({
      type: NotificationType.CREATE_APPOINTMENT_PATIENT,
      priority: NotificationPriority.HIGH,
      recipientId: obj.recipientId,
      senderId: 'system',
      title,
      message,
      metadata: { ...obj },
    });
  }

  /**
   * Send notification when patient updates an appointment
   */
  async sendUpdateAppointmentPatientNotification(
    dto: UpdateAppointmentNotificationPatient,
  ): Promise<NotificationResponse> {
    const title = 'Cập nhật lịch hẹn';
    let message = `Lịch hẹn #${dto.appointmentId} của bạn đã được cập nhật.`;

    if (dto.changes && Object.keys(dto.changes).length > 0) {
      const changeDetails = Object.entries(dto.changes)
        .map(([key, value]) => `${key}: ${value}`)
        .join(', ');
      message += ` Thay đổi: ${changeDetails}`;
    }

    return this.sendNotification({
      type: NotificationType.UPDATE_APPOINTMENT_PATIENT,
      priority: NotificationPriority.MEDIUM,
      recipientId: dto.recipientId,
      senderId: 'system',
      title,
      message,
      metadata: {
        changes: dto.changes,
        notes: dto.notes,
      },
    });
  }

  /**
   * Send notification when patient deletes/cancels an appointment
   */
  async sendDeleteAppointmentPatientNotification(
    dto: DeleteAppointmentNotificationPatient,
  ): Promise<NotificationResponse> {
    const appointmentDate = dto.startTime.toLocaleDateString('vi-VN');
    const appointmentTime = dto.startTime.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const title = 'Hủy lịch hẹn';
    const message = `Lịch hẹn #${dto.appointmentId} với Bác sĩ ${dto.doctorName} vào ${appointmentDate} lúc ${appointmentTime} đã được hủy.${dto.reason ? ` Lý do: ${dto.reason}` : ''}`;

    return this.sendNotification({
      type: NotificationType.DELETE_APPOINTMENT_PATIENT,
      priority: NotificationPriority.MEDIUM,
      recipientId: dto.recipientId,
      senderId: 'system',
      title,
      message,
      metadata: {
        reason: dto.reason,
      },
    });
  }

  /**
   * Send notification when doctor receives a new appointment
   */
  async sendCreateAppointmentDoctorNotification(
    dto: AppointmentNotificationDoctor,
  ): Promise<NotificationResponse> {
    const appointmentDate = dto.startTime.toLocaleDateString('vi-VN');
    const appointmentTime = dto.startTime.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const title = 'Lịch hẹn mới';
    const message = `Bạn có lịch hẹn mới với bệnh nhân ${dto.patientName} vào ${appointmentDate} lúc ${appointmentTime} tại ${dto.clinicName}. Dịch vụ: ${dto.serviceName}.`;

    return this.sendNotification({
      type: NotificationType.CREATE_APPOINTMENT_DOCTOR,
      priority: NotificationPriority.HIGH,
      recipientId: dto.recipientId,
      senderId: 'system',
      title,
      message,
      metadata: {
        notes: dto.notes,
      },
    });
  }

  /**
   * Send notification when doctor's appointment is updated
   */
  async sendUpdateAppointmentDoctorNotification(
    dto: UpdateAppointmentNotificationDoctor,
  ): Promise<NotificationResponse> {
    const title = 'Cập nhật lịch hẹn';
    let message = `Lịch hẹn #${dto.appointmentId} với bệnh nhân ${dto.patientName} đã được cập nhật.`;

    if (dto.changes && Object.keys(dto.changes).length > 0) {
      const changeDetails = Object.entries(dto.changes)
        .map(([key, value]) => `${key}: ${value}`)
        .join(', ');
      message += ` Thay đổi: ${changeDetails}`;
    }

    return this.sendNotification({
      type: NotificationType.UPDATE_APPOINTMENT_DOCTOR,
      priority: NotificationPriority.MEDIUM,
      recipientId: dto.recipientId,
      senderId: 'system',
      title,
      message,
      metadata: {
        changes: dto.changes,
        notes: dto.notes,
      },
    });
  }

  /**
   * Send notification when doctor's appointment is deleted/cancelled
   */
  async sendDeleteAppointmentDoctorNotification(
    dto: DeleteAppointmentNotificationDoctor,
  ): Promise<NotificationResponse> {
    const appointmentDate = dto.startTime.toLocaleDateString('vi-VN');
    const appointmentTime = dto.startTime.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const title = 'Hủy lịch hẹn';
    const message = `Lịch hẹn #${dto.appointmentId} với bệnh nhân ${dto.patientName} vào ${appointmentDate} lúc ${appointmentTime} đã được hủy.${dto.reason ? ` Lý do: ${dto.reason}` : ''}`;

    return this.sendNotification({
      type: NotificationType.DELETE_APPOINTMENT_DOCTOR,
      priority: NotificationPriority.MEDIUM,
      recipientId: dto.recipientId,
      senderId: 'system',
      title,
      message,
      metadata: {
        reason: dto.reason,
      },
    });
  }

  /**
   * Get notifications for a user
   */
  async getNotifications(
    userId: string,
    limit = 20,
    offset = 0,
  ): Promise<NotificationResponse[]> {
    const channel = await this.getOrCreateNotificationChannel(userId);

    const messages = await channel.query({
      messages: { limit, offset },
    });

    if (!messages.messages) {
      return [];
    }

    return messages.messages.map((msg) => ({
      id: msg.id || '',
      type: (msg as any).type || NotificationType.SYSTEM_NOTIFICATION,
      priority: (msg as any).priority || NotificationPriority.MEDIUM,
      status: (msg as any).status || NotificationStatus.UNREAD,
      title: (msg as any).title || '',
      message: msg.text || '',
      metadata: (msg as any).metadata,
      createdAt: msg.created_at ? new Date(msg.created_at) : new Date(),
    }));
  }

  /**
   * Mark notification as read
   */
  async markAsRead(userId: number, messageId: string, currentUserId: number): Promise<void> {
    if (userId !== currentUserId) {
      throw new UnauthorizedException(
        "Unauthorized: Cannot mark other user's notifications as read",
      );
    }
    const channel = await this.getOrCreateNotificationChannel(userId.toString());

    // Get the message from channel state
    const message = channel.state.messages.find((msg) => msg.id === messageId);

    if (!message) {
      throw new Error(`Message ${messageId} not found`);
    }

    // Update message metadata with read status
    const currentMetadata = (message as any).metadata || {};
    const updatedMetadata = {
      ...currentMetadata,
      status: NotificationStatus.READ,
      readAt: new Date().toISOString(),
    };

    // Update message in StreamChat using streamClient
    // Cần thêm user_id để StreamChat xác thực server-side
    const channelId = `${this.NOTIFICATION_CHANNEL_PREFIX}_${userId}`;
    await this.streamClient.updateMessage({
      id: messageId,
      channel_id: channelId,
      channel_type: 'messaging',
      user_id: 'system', // Message được gửi bởi system, nên update cũng dùng system
      metadata: updatedMetadata,
    } as any);
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(userId: string): Promise<number> {
    const channel = await this.getOrCreateNotificationChannel(userId);

    const state = channel.state;
    if (!state?.messages) {
      return 0;
    }

    return state.messages.filter(
      (msg) => (msg as any).status === NotificationStatus.UNREAD,
    ).length;
  }

  /**
   * Send notification when payment is successful for patient
   */
  async sendPaymentSuccessNotification(
    dto: PaymentSuccessNotificationPatient,
  ): Promise<NotificationResponse> {
    const formattedAmount = new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(dto.amount);

    const title = 'Thanh toán thành công';
    let message = `Thanh toán cho lịch hẹn #${dto.appointmentId} đã thành công. Số tiền: ${formattedAmount}.`;

    if (dto.serviceName) {
      message += ` Dịch vụ: ${dto.serviceName}.`;
    }

    if (dto.doctorName) {
      message += ` Bác sĩ: ${dto.doctorName}.`;
    }

    if (dto.transactionId) {
      message += ` Mã giao dịch: ${dto.transactionId}.`;
    }

    return this.sendNotification({
      type: NotificationType.PAYMENT_SUCCESS,
      priority: NotificationPriority.HIGH,
      recipientId: dto.recipientId,
      senderId: 'system',
      title,
      message,
      metadata: {
        appointmentId: dto.appointmentId,
        billingId: dto.billingId,
        amount: dto.amount,
        transactionId: dto.transactionId,
        paymentMethod: dto.paymentMethod,
      },
    });
  }
}
