import { Injectable, Logger, Inject } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { StreamChat } from 'stream-chat';
import { appConfig } from '@/common/config';
import {
  NotificationTemplate,
  CreateTemplateDTO,
  UpdateTemplateDTO,
  NotificationType,
} from './notification.types';

@Injectable()
export class NotificationTemplateService {
  private streamClient: StreamChat;
  private readonly TEMPLATES_CHANNEL = 'admin_notifications_templates';
  private readonly logger = new Logger(NotificationTemplateService.name);

  constructor(
    @Inject(appConfig.KEY)
    private readonly streamChatConf: ConfigType<typeof appConfig>,
  ) {
    this.streamClient = StreamChat.getInstance(
      this.streamChatConf.streamChatApiKey,
      this.streamChatConf.streamChatSecret,
    );
  }

  async onModuleInit() {
    await this.ensureTemplatesChannelExists();
  }

  private async ensureTemplatesChannelExists() {
    try {
      const channel = this.streamClient.channel('messaging', this.TEMPLATES_CHANNEL, {
        created_by_id: 'system',
        members: ['system'],
      });
      await channel.watch();
      this.logger.log('Templates channel initialized successfully');
    } catch (error) {
      this.logger.warn(
        'Failed to initialize templates channel in Stream.io. Template management may not work properly.',
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  async createTemplate(dto: CreateTemplateDTO): Promise<string> {
    const templateId = this.generateTemplateId();
    const variables = this.extractVariables(dto.message);

    await this.streamClient.channel('messaging', this.TEMPLATES_CHANNEL).sendMessage({
      text: dto.name,
      user_id: 'system',
      custom_data: {
        templateId,
        name: dto.name,
        type: dto.type,
        title: dto.title,
        message: dto.message,
        variables,
        isActive: true,
        createdBy: dto.createdBy,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    } as any);

    this.logger.log(`Template created: ${templateId} - ${dto.name}`);
    return templateId;
  }

  async updateTemplate(templateId: string, dto: UpdateTemplateDTO): Promise<void> {
    const channel = this.streamClient.channel('messaging', this.TEMPLATES_CHANNEL);
    await channel.watch();

    const messages = await channel.query({ messages: { limit: 1000 } });
    const templateMessage = messages.messages.find(
      msg => (msg as any).custom_data?.templateId === templateId
    );

    if (!templateMessage) {
      throw new Error(`Template ${templateId} not found`);
    }

    const currentMetadata = (templateMessage as any).custom_data || {};
    const updatedVariables = dto.message ? this.extractVariables(dto.message) : currentMetadata.variables;

    await this.streamClient.updateMessage({
      id: templateMessage.id,
      set: {
        custom_data: {
          ...currentMetadata,
          ...dto,
          variables: updatedVariables,
          updatedAt: new Date().toISOString(),
        },
      },
    } as any);

    this.logger.log(`Template updated: ${templateId}`);
  }

  async deleteTemplate(templateId: string): Promise<void> {
    const channel = this.streamClient.channel('messaging', this.TEMPLATES_CHANNEL);
    await channel.watch();

    const messages = await channel.query({ messages: { limit: 1000 } });
    const templateMessage = messages.messages.find(
      msg => (msg as any).custom_data?.templateId === templateId
    );

    if (!templateMessage) {
      throw new Error(`Template ${templateId} not found`);
    }

    // Soft delete by marking as inactive
    await this.streamClient.updateMessage({
      id: templateMessage.id,
      set: {
        custom_data: {
          ...(templateMessage as any).custom_data,
          isActive: false,
          deletedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      },
    } as any);

    this.logger.log(`Template deleted (soft): ${templateId}`);
  }

  async renderTemplate(templateId: string, variables: Record<string, any>): Promise<{title: string, message: string}> {
    const template = await this.getTemplateById(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    if (!template.isActive) {
      throw new Error(`Template ${templateId} is not active`);
    }

    return {
      title: this.replaceVariables(template.title, variables),
      message: this.replaceVariables(template.message, variables),
    };
  }

  async getActiveTemplates(): Promise<NotificationTemplate[]> {
    const channel = this.streamClient.channel('messaging', this.TEMPLATES_CHANNEL);
    await channel.watch();

    const messages = await channel.query({ messages: { limit: 1000 } });

    return messages.messages
      .filter(msg =>
        (msg as any).custom_data?.isActive &&
        !(msg as any).custom_data?.deletedAt &&
        (msg as any).custom_data?.templateId
      )
      .map(msg => (msg as any).custom_data as NotificationTemplate);
  }

  async getTemplateById(templateId: string): Promise<NotificationTemplate | null> {
    const channel = this.streamClient.channel('messaging', this.TEMPLATES_CHANNEL);
    await channel.watch();

    const messages = await channel.query({ messages: { limit: 1000 } });

    const templateMessage = messages.messages.find(
      msg => (msg as any).custom_data?.templateId === templateId
    );

    if (!templateMessage || (templateMessage as any).custom_data?.deletedAt) {
      return null;
    }

    return (templateMessage as any).custom_data as NotificationTemplate;
  }

  async getTemplatesByType(type: NotificationType): Promise<NotificationTemplate[]> {
    const allTemplates = await this.getActiveTemplates();
    return allTemplates.filter(template => template.type === type);
  }

  async getActiveTemplateNames(): Promise<{templateId: string, name: string, type: NotificationType}[]> {
    const templates = await this.getActiveTemplates();
    return templates.map(template => ({
      templateId: template.id,
      name: template.name,
      type: template.type,
    }));
  }

  /**
   * Extract template variables from message text
   * Variables are in format: {{variableName}}
   */
  private extractVariables(message: string): string[] {
    const regex = /\{\{(\w+)\}\}/g;
    const variables: string[] = [];
    let match;

    while ((match = regex.exec(message)) !== null) {
      if (!variables.includes(match[1])) {
        variables.push(match[1]);
      }
    }

    return variables;
  }

  /**
   * Replace template variables with actual values
   */
  private replaceVariables(text: string, variables: Record<string, any>): string {
    return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return variables[key] !== undefined ? String(variables[key]) : match;
    });
  }

  private generateTemplateId(): string {
    return `tpl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Create default templates for common notification types
   */
  async createDefaultTemplates(): Promise<void> {
    const defaultTemplates: CreateTemplateDTO[] = [
      {
        name: 'Appointment Reminder Template',
        type: NotificationType.APPOINTMENT_REMINDER_PATIENT,
        title: 'Nhắc nhở lịch hẹn',
        message: 'Lịch hẹn của bạn vào {{appointmentDate}} lúc {{appointmentTime}} với Bác sĩ {{doctorName}} tại {{clinicName}}. Dịch vụ: {{serviceName}}.',
        createdBy: 'system',
      },
      {
        name: 'Payment Success Template',
        type: NotificationType.PAYMENT_SUCCESS,
        title: 'Thanh toán thành công',
        message: 'Thanh toán cho lịch hẹn #{{appointmentId}} đã thành công. Số tiền: {{amount}}. Dịch vụ: {{serviceName}}.',
        createdBy: 'system',
      },
      {
        name: 'Appointment Cancelled Template',
        type: NotificationType.DELETE_APPOINTMENT_PATIENT,
        title: 'Hủy lịch hẹn',
        message: 'Lịch hẹn #{{appointmentId}} với Bác sĩ {{doctorName}} vào {{appointmentDate}} lúc {{appointmentTime}} đã được hủy.{{#reason}} Lý do: {{reason}}.{{/reason}}',
        createdBy: 'system',
      },
      {
        name: 'System Maintenance Template',
        type: NotificationType.SYSTEM_MAINTENANCE_SCHEDULED,
        title: 'Bảo trì hệ thống',
        message: 'Hệ thống sẽ được bảo trì từ {{startTime}} đến {{endTime}}. Trong thời gian này, một số tính năng có thể không khả dụng.',
        createdBy: 'system',
      },
      {
        name: 'Admin Announcement Template',
        type: NotificationType.ADMIN_ANNOUNCEMENT,
        title: 'Thông báo từ quản trị viên',
        message: '{{message}}',
        createdBy: 'system',
      },
    ];

    for (const templateDto of defaultTemplates) {
      try {
        // Check if template already exists
        const existingTemplates = await this.getTemplatesByType(templateDto.type);
        const existingTemplate = existingTemplates.find(t => t.name === templateDto.name);

        if (!existingTemplate) {
          await this.createTemplate(templateDto);
          this.logger.log(`Default template created: ${templateDto.name}`);
        }
      } catch (error) {
        this.logger.error(
          `Failed to create default template ${templateDto.name}:`,
          error instanceof Error ? error.message : String(error),
        );
      }
    }
  }
}