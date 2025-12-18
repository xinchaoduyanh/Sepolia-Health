import { Inject, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { StreamChat } from 'stream-chat';
import { appConfig } from '@/common/config';
import { PrismaService } from '@/common/prisma/prisma.service';
import { Role, AppointmentStatus } from '@prisma/client';
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
  AdminDirectNotificationDTO,
  AdminBroadcastDTO,
  EnhancedStreamMessage,
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

  // ===== ENHANCED NOTIFICATION METHODS =====

  /**
   * Send notification to a specific role-based channel
   */
  async sendToRole(role: Role, notification: {
    type: NotificationType;
    title: string;
    message: string;
    priority?: NotificationPriority;
    metadata?: Record<string, any>;
  }): Promise<void> {
    const channelId = `notifications_${role.toString().toLowerCase()}_all`;
    const channel = this.streamClient.channel('messaging', channelId);
    await channel.watch();

    await channel.sendMessage({
      text: notification.message,
      type: notification.type as any,
      priority: notification.priority || NotificationPriority.MEDIUM,
      status: NotificationStatus.UNREAD,
      title: notification.title,
      metadata: {
        ...notification.metadata,
        targetType: 'role',
        targetRole: role,
        senderId: 'system',
      },
    } as any);
  }

  /**
   * Send notification to all users in a specific clinic
   */
  async sendToClinic(clinicId: number, notification: {
    type: NotificationType;
    title: string;
    message: string;
    priority?: NotificationPriority;
    metadata?: Record<string, any>;
  }): Promise<void> {
    const channelId = `notifications_clinic_${clinicId}`;
    const channel = this.streamClient.channel('messaging', channelId);
    await channel.watch();

    await channel.sendMessage({
      text: notification.message,
      type: notification.type as any,
      priority: notification.priority || NotificationPriority.MEDIUM,
      status: NotificationStatus.UNREAD,
      title: notification.title,
      metadata: {
        ...notification.metadata,
        targetType: 'clinic',
        targetClinicId: clinicId,
        senderId: 'system',
      },
    } as any);
  }

  /**
   * Send notification to receptionists at a specific clinic
   */
  async sendToClinicReceptionists(clinicId: number, notification: {
    type: NotificationType;
    title: string;
    message: string;
    priority?: NotificationPriority;
    metadata?: Record<string, any>;
  }): Promise<void> {
    const channelId = `notifications_receptionists_clinic_${clinicId}`;
    const channel = this.streamClient.channel('messaging', channelId);
    await channel.watch();

    await channel.sendMessage({
      text: notification.message,
      type: notification.type as any,
      priority: notification.priority || NotificationPriority.MEDIUM,
      status: NotificationStatus.UNREAD,
      title: notification.title,
      metadata: {
        ...notification.metadata,
        targetType: 'clinic_role',
        targetClinicId: clinicId,
        targetRole: Role.RECEPTIONIST,
        senderId: 'system',
      },
    } as any);
  }

  /**
   * Send appointment reminder to all parties
   */
  async sendAppointmentReminder(appointmentId: number): Promise<void> {
    const appointment = await this.getAppointmentDetails(appointmentId);
    if (!appointment) {
      this.logger.error(`Appointment ${appointmentId} not found`);
      return;
    }

    const formattedDate = appointment.startTime.toLocaleDateString('vi-VN');
    const formattedTime = appointment.startTime.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    });

    // Send to patient
    await this.sendNotification({
      type: NotificationType.APPOINTMENT_REMINDER_PATIENT,
      priority: NotificationPriority.HIGH,
      recipientId: appointment.patientId.toString(),
      senderId: 'system',
      title: 'Nhắc nhở lịch hẹn',
      message: `Lịch hẹn của bạn vào ${formattedDate} lúc ${formattedTime} với Bác sĩ ${appointment.doctorName} tại ${appointment.clinicName}. Dịch vụ: ${appointment.serviceName}.`,
      metadata: {
        appointmentId,
        targetType: 'individual',
      },
    });

    // Send to doctor
    await this.sendNotification({
      type: NotificationType.APPOINTMENT_REMINDER_DOCTOR,
      priority: NotificationPriority.HIGH,
      recipientId: appointment.doctorId.toString(),
      senderId: 'system',
      title: 'Nhắc nhở lịch hẹn',
      message: `Bạn có lịch hẹn vào ${formattedDate} lúc ${formattedTime} với bệnh nhân ${appointment.patientName} tại ${appointment.clinicName}. Dịch vụ: ${appointment.serviceName}.`,
      metadata: {
        appointmentId,
        targetType: 'individual',
      },
    });

    // Send to receptionists at clinic
    if (appointment.clinicId) {
      await this.sendToClinicReceptionists(appointment.clinicId, {
        type: NotificationType.APPOINTMENT_REMINDER_RECEPTIONIST,
        title: 'Nhắc nhở lịch hẹn',
        message: `Lịch hẹn vào ${formattedDate} lúc ${formattedTime} - Bác sĩ ${appointment.doctorName} với bệnh nhân ${appointment.patientName}.`,
        priority: NotificationPriority.MEDIUM,
        metadata: {
          appointmentId,
          doctorId: appointment.doctorId,
          patientId: appointment.patientId,
        },
      });
    }
  }

  /**
   * Send appointment status change notification
   */
  async sendAppointmentStatusChange(
    appointmentId: number,
    oldStatus: AppointmentStatus,
    newStatus: AppointmentStatus,
  ): Promise<void> {
    const appointment = await this.getAppointmentDetails(appointmentId);
    if (!appointment) {
      this.logger.error(`Appointment ${appointmentId} not found`);
      return;
    }

    const notification = {
      type: NotificationType.APPOINTMENT_STATUS_CHANGE,
      title: 'Cập nhật trạng thái lịch hẹn',
      message: `Lịch hẹn #${appointmentId} đã chuyển từ ${oldStatus} thành ${newStatus}`,
      priority: NotificationPriority.MEDIUM,
      metadata: {
        appointmentId,
        oldStatus,
        newStatus,
        targetType: 'appointment_status_change',
      },
    };

    // Send to all relevant parties
    await this.sendToAllAppointmentParties(appointment, notification);
  }

  /**
   * Send receptionist notification when appointment is created
   */
  async sendAppointmentCreatedToReceptionists(appointmentId: number): Promise<void> {
    const appointment = await this.getAppointmentDetails(appointmentId);
    if (!appointment || !appointment.clinicId) {
      return;
    }

    const formattedDate = appointment.startTime.toLocaleDateString('vi-VN');
    const formattedTime = appointment.startTime.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    });

    await this.sendToClinicReceptionists(appointment.clinicId, {
      type: NotificationType.APPOINTMENT_CONFIRMED_RECEPTIONIST,
      title: 'Lịch hẹn mới',
      message: `Lịch hẹn mới vào ${formattedDate} lúc ${formattedTime} - Bác sĩ ${appointment.doctorName} với bệnh nhân ${appointment.patientName}.`,
      priority: NotificationPriority.MEDIUM,
      metadata: {
        appointmentId,
        doctorId: appointment.doctorId,
        patientId: appointment.patientId,
      },
    });
  }

  /**
   * Admin direct notification functionality
   */
  async sendDirectNotification(dto: AdminDirectNotificationDTO): Promise<void> {
    if (dto.recipientId) {
      // Send to individual user
      await this.sendNotification({
        type: dto.type,
        priority: dto.priority,
        recipientId: dto.recipientId.toString(),
        senderId: 'system',
        title: dto.title,
        message: dto.message,
        metadata: {
          ...dto.metadata,
          targetType: 'individual',
          scheduledFor: dto.scheduledFor,
        },
      });
    } else if (dto.recipientRole) {
      // Send to role-based channel
      await this.sendToRole(dto.recipientRole, {
        type: dto.type,
        title: dto.title,
        message: dto.message,
        priority: dto.priority,
        metadata: {
          ...dto.metadata,
          scheduledFor: dto.scheduledFor,
        },
      });
    } else if (dto.recipientIds?.length) {
      // Send to multiple users
      for (const userId of dto.recipientIds) {
        await this.sendNotification({
          type: dto.type,
          priority: dto.priority,
          recipientId: userId.toString(),
          senderId: 'system',
          title: dto.title,
          message: dto.message,
          metadata: {
            ...dto.metadata,
            targetType: 'individual',
            scheduledFor: dto.scheduledFor,
          },
        });
      }
    }
  }

  /**
   * Create broadcast campaign tracking
   */
  async createBroadcastCampaign(dto: AdminBroadcastDTO): Promise<string> {
    const campaignId = this.generateCampaignId();

    const campaignMessage = await this.streamClient
      .channel('messaging', 'admin_notifications_campaigns')
      .sendMessage({
        text: dto.title,
        type: NotificationType.ADMIN_BROADCAST as any,
        priority: dto.priority as any,
        status: NotificationStatus.UNREAD,
        title: dto.title,
        metadata: {
          campaignId,
          title: dto.title,
          message: dto.message,
          targetRoles: dto.targetRoles,
          targetUsers: dto.targetUsers,
          targetClinics: dto.targetClinics,
          scheduledFor: dto.scheduledFor,
          templateId: dto.templateId,
          status: 'created',
          createdAt: new Date().toISOString(),
        },
      } as any);

    return campaignId;
  }

  /**
   * Send broadcast notification to target channels
   */
  async sendBroadcastNotification(campaignId: string, dto: AdminBroadcastDTO): Promise<void> {
    const channels = await this.getTargetChannels(dto.targetRoles, dto.targetUsers, dto.targetClinics);

    for (const channelId of channels) {
      const channel = this.streamClient.channel('messaging', channelId);
      await channel.watch();

      await channel.sendMessage({
        text: dto.message,
        type: NotificationType.ADMIN_BROADCAST as any,
        priority: dto.priority as any,
        status: NotificationStatus.UNREAD,
        title: dto.title,
        metadata: {
          campaignId,
          targetType: 'broadcast',
          targetRoles: dto.targetRoles,
          targetClinics: dto.targetClinics,
          targetUsers: dto.targetUsers,
          senderId: 'system',
        },
      } as any);
    }
  }

  // ===== HELPER METHODS =====

  private async getAppointmentDetails(appointmentId: number) {
    return await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        patientProfile: {
          include: {
            manager: true,
          },
        },
        doctor: {
          include: {
            user: true,
          },
        },
        service: true,
        clinic: true,
      },
    }).then(appointment => {
      if (!appointment) return null;

      return {
        id: appointment.id,
        startTime: appointment.startTime,
        endTime: appointment.endTime,
        status: appointment.status,
        patientId: appointment.patientProfile.manager.id,
        doctorId: appointment.doctor.userId,
        clinicId: appointment.clinic?.id,
        patientName: `${appointment.patientProfile.firstName} ${appointment.patientProfile.lastName}`,
        doctorName: `Bác sĩ ${appointment.doctor.firstName} ${appointment.doctor.lastName}`,
        serviceName: appointment.service.name,
        clinicName: appointment.clinic?.name || 'Chưa xác định',
      };
    });
  }

  private async sendToAllAppointmentParties(
    appointment: any,
    notification: any,
  ): Promise<void> {
    // Send to patient
    await this.sendNotification({
      ...notification,
      recipientId: appointment.patientId.toString(),
      metadata: {
        ...notification.metadata,
        recipientRole: Role.PATIENT,
      },
    });

    // Send to doctor
    await this.sendNotification({
      ...notification,
      recipientId: appointment.doctorId.toString(),
      metadata: {
        ...notification.metadata,
        recipientRole: Role.DOCTOR,
      },
    });

    // Send to receptionists at clinic
    if (appointment.clinicId) {
      await this.sendToClinicReceptionists(appointment.clinicId, {
        ...notification,
        metadata: {
          ...notification.metadata,
          recipientRole: Role.RECEPTIONIST,
        },
      });
    }
  }

  private async getTargetChannels(
    targetRoles: Role[],
    targetUsers?: number[],
    targetClinics?: number[],
  ): Promise<string[]> {
    const channels: string[] = [];

    // Role-based channels
    targetRoles.forEach(role => {
      channels.push(`notifications_${role.toString().toLowerCase()}_all`);
    });

    // Specific user channels
    targetUsers?.forEach(userId => {
      channels.push(`notifications_${userId}`);
    });

    // Clinic-based channels
    targetClinics?.forEach(clinicId => {
      channels.push(`notifications_clinic_${clinicId}`);
    });

    return channels;
  }

  private generateCampaignId(): string {
    return `campaign_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
