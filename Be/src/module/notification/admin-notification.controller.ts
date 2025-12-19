import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  ValidationPipe,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { Roles } from '@/common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { NotificationService } from './notification.service';
import { NotificationTemplateService } from './notification-template.service';
import { NotificationSchedulerService } from './notification-scheduler.service';
import { AppointmentResultScannerService } from './appointment-result-scanner.service';
import {
  AdminDirectNotificationDTO,
  AdminBroadcastDTO,
  CreateTemplateDTO,
  UpdateTemplateDTO,
  NotificationResponse,
  NotificationTemplate,
} from './notification.types';
import { AppointmentScannerStats } from './appointment-scanner.types';

@ApiBearerAuth()
@Roles(Role.ADMIN)
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('Admin Notifications')
@Controller('admin/notifications')
export class AdminNotificationController {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly templateService: NotificationTemplateService,
    // private readonly schedulerService: NotificationSchedulerService, // DISABLED
    // private readonly appointmentResultScannerService: AppointmentResultScannerService, // DISABLED
  ) {}

  // ===== DIRECT NOTIFICATION ENDPOINTS =====

  @Post('direct')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Send direct notification to user(s) or role(s)' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Notification sent successfully' })
  async sendDirectNotification(
    @Body(ValidationPipe) dto: AdminDirectNotificationDTO,
  ): Promise<void> {
    // Scheduling disabled - send immediately only
    await this.notificationService.sendDirectNotification(dto);
  }

  // ===== BROADCAST CAMPAIGN ENDPOINTS =====

  @Post('broadcast')
  @ApiOperation({ summary: 'Create broadcast campaign' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Campaign created successfully' })
  async createBroadcastCampaign(
    @Body(ValidationPipe) dto: AdminBroadcastDTO,
  ): Promise<{ campaignId: string; message: string }> {
    const campaignId = await this.notificationService.createBroadcastCampaign(dto);

    // Scheduling disabled - send immediately
    await this.notificationService.sendBroadcastNotification(campaignId, dto);
    return {
      campaignId,
      message: 'Campaign sent successfully',
    };
  }

  @Get('campaigns')
  @ApiOperation({ summary: 'List all campaigns' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Campaigns retrieved successfully' })
  async listCampaigns(): Promise<any[]> {
    // This would query StreamChat admin_notifications_campaigns channel
    // For now, return placeholder implementation
    return [];
  }

  @Get('campaigns/:campaignId')
  @ApiOperation({ summary: 'Get campaign details' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Campaign details retrieved successfully' })
  async getCampaignDetails(
    @Param('campaignId') campaignId: string,
  ): Promise<any> {
    // This would query StreamChat for specific campaign
    // For now, return placeholder implementation
    return { campaignId, message: 'Campaign details placeholder' };
  }

  @Post('campaigns/:campaignId/send')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Send campaign immediately' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Campaign sent successfully' })
  async sendCampaignImmediately(
    @Param('campaignId') campaignId: string,
  ): Promise<void> {
    // This would fetch campaign details and send immediately
    // For now, just log the action
    console.log(`Sending campaign ${campaignId} immediately`);
  }

  @Put('campaigns/:campaignId/cancel')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Cancel scheduled campaign' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Campaign cancelled successfully' })
  async cancelCampaign(
    @Param('campaignId') campaignId: string,
  ): Promise<void> {
    // This would cancel a scheduled campaign
    // For now, just log the action
    console.log(`Cancelling campaign ${campaignId}`);
  }

  // ===== TEMPLATE MANAGEMENT ENDPOINTS =====

  @Post('templates')
  @ApiOperation({ summary: 'Create notification template' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Template created successfully' })
  async createTemplate(
    @Body(ValidationPipe) dto: CreateTemplateDTO,
  ): Promise<{ templateId: string; message: string }> {
    const templateId = await this.templateService.createTemplate(dto);
    return {
      templateId,
      message: 'Template created successfully',
    };
  }

  @Get('templates')
  @ApiOperation({ summary: 'List all active templates' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Templates retrieved successfully' })
  async getTemplates(
    @Query('type') type?: string,
  ): Promise<NotificationTemplate[]> {
    if (type) {
      return await this.templateService.getTemplatesByType(type as any);
    }
    return await this.templateService.getActiveTemplates();
  }

  @Get('templates/names')
  @ApiOperation({ summary: 'Get template names for dropdown' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Template names retrieved successfully' })
  async getTemplateNames(): Promise<{ templateId: string; name: string; type: string }[]> {
    return await this.templateService.getActiveTemplateNames();
  }

  @Get('templates/:templateId')
  @ApiOperation({ summary: 'Get template by ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Template retrieved successfully' })
  async getTemplateById(
    @Param('templateId') templateId: string,
  ): Promise<NotificationTemplate> {
    const template = await this.templateService.getTemplateById(templateId);
    if (!template) {
      throw new Error('Template not found');
    }
    return template;
  }

  @Put('templates/:templateId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Update notification template' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Template updated successfully' })
  async updateTemplate(
    @Param('templateId') templateId: string,
    @Body(ValidationPipe) dto: UpdateTemplateDTO,
  ): Promise<void> {
    await this.templateService.updateTemplate(templateId, dto);
  }

  @Delete('templates/:templateId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete notification template (soft delete)' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Template deleted successfully' })
  async deleteTemplate(
    @Param('templateId') templateId: string,
  ): Promise<void> {
    await this.templateService.deleteTemplate(templateId);
  }

  @Post('templates/:templateId/preview')
  @ApiOperation({ summary: 'Preview template with sample variables' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Template preview generated successfully' })
  async previewTemplate(
    @Param('templateId') templateId: string,
    @Body() variables: Record<string, any>,
  ): Promise<{ title: string; message: string }> {
    return await this.templateService.renderTemplate(templateId, variables);
  }

  @Post('templates/default')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Create default templates' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Default templates created successfully' })
  async createDefaultTemplates(): Promise<void> {
    await this.templateService.createDefaultTemplates();
  }

  // ===== ANALYTICS ENDPOINTS =====

  @Get('analytics/delivery')
  @ApiOperation({ summary: 'Get delivery statistics' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Delivery statistics retrieved successfully' })
  async getDeliveryStats(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('type') type?: string,
  ): Promise<{
    totalSent: number;
    totalDelivered: number;
    totalRead: number;
    deliveryRate: number;
    readRate: number;
  }> {
    // This would query StreamChat for delivery statistics
    // For now, return placeholder data
    return {
      totalSent: 1000,
      totalDelivered: 950,
      totalRead: 600,
      deliveryRate: 95,
      readRate: 60,
    };
  }

  @Get('analytics/queue')
  @ApiOperation({ summary: 'Get queue statistics' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Queue statistics retrieved successfully' })
  async getQueueStats(): Promise<any> {
    // Queue functionality disabled - return placeholder data
    return {
      active: 0,
      delayed: 0,
      paused: 0,
      waiting: 0,
      completed: 0,
      failed: 0
    };
  }

  @Get('analytics/types')
  @ApiOperation({ summary: 'Get notification type distribution' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Type distribution retrieved successfully' })
  async getNotificationTypeDistribution(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<{ type: string; count: number; percentage: number }[]> {
    // This would analyze notification types from StreamChat
    // For now, return placeholder data
    return [
      { type: 'APPOINTMENT_REMINDER_PATIENT', count: 300, percentage: 30 },
      { type: 'PAYMENT_SUCCESS', count: 250, percentage: 25 },
      { type: 'ADMIN_BROADCAST', count: 150, percentage: 15 },
      { type: 'APPOINTMENT_STATUS_CHANGE', count: 200, percentage: 20 },
      { type: 'SYSTEM_NOTIFICATION', count: 100, percentage: 10 },
    ];
  }

  // ===== APPOINTMENT RESULT SCANNER ENDPOINTS =====

  @Post('scanner/trigger')
  @ApiOperation({ summary: 'Manually trigger appointment result scanner' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Scanner triggered successfully' })
  async triggerAppointmentResultScanner(): Promise<{
    message: string;
    result: {
      totalDoctors: number;
      totalAppointments: number;
      scanTime: Date;
    };
  }> {
    // Scanner functionality disabled - return placeholder response
    return {
      message: 'Appointment result scanner is currently disabled',
      result: {
        totalDoctors: 0,
        totalAppointments: 0,
        scanTime: new Date(),
      },
    };
  }

  @Get('scanner/stats')
  @ApiOperation({ summary: 'Get appointment result scanner statistics' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Scanner statistics retrieved successfully' })
  async getScannerStats(): Promise<AppointmentScannerStats> {
    // Scanner functionality disabled - return empty stats
    return {
      lastScanTime: null,
      nextScanTime: null,
      totalDoctorsNotified: 0,
      totalPendingAppointments: 0,
      averageProcessingTime: 0,
    };
  }

  @Get('scanner/health')
  @ApiOperation({ summary: 'Get appointment result scanner health status' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Health status retrieved successfully' })
  async getScannerHealth(): Promise<{
    status: 'healthy' | 'unhealthy';
    lastScanTime?: Date;
    nextScanTime?: Date;
    databaseConnection: boolean;
    error?: string;
  }> {
    // Scanner functionality disabled - return disabled status
    return {
      status: 'healthy',
      lastScanTime: undefined,
      nextScanTime: undefined,
      databaseConnection: true,
      error: 'Scanner service is disabled',
    };
  }

  // ===== BULK OPERATIONS =====

  @Post('bulk/direct')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Send bulk direct notifications' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Bulk notifications sent successfully' })
  async sendBulkDirectNotifications(
    @Body() body: {
      notifications: AdminDirectNotificationDTO[];
      batchSize?: number;
      delayBetweenBatches?: number;
    },
  ): Promise<void> {
    const { notifications, batchSize = 50, delayBetweenBatches = 1000 } = body;

    for (let i = 0; i < notifications.length; i += batchSize) {
      const batch = notifications.slice(i, i + batchSize);

      // Process batch in parallel
      await Promise.all(
        batch.map(dto => this.notificationService.sendDirectNotification(dto))
      );

      // Add delay between batches (except for the last batch)
      if (i + batchSize < notifications.length) {
        await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
      }
    }
  }

  @Post('test')
  @ApiOperation({ summary: 'Send test notification' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Test notification sent successfully' })
  async sendTestNotification(
    @Body() body: {
      recipientId: number;
      message: string;
      type: string;
    },
  ): Promise<{ message: string; notificationId: string }> {
    const testNotification = {
      type: 'SYSTEM_NOTIFICATION' as any,
      priority: 'MEDIUM' as any,
      recipientId: body.recipientId.toString(),
      senderId: 'system',
      title: 'Test Notification',
      message: body.message || 'This is a test notification from admin panel',
      metadata: {
        isTest: true,
        sentAt: new Date().toISOString(),
      },
    };

    const result = await this.notificationService.sendNotification(testNotification);

    return {
      message: 'Test notification sent successfully',
      notificationId: result.id,
    };
  }

  // ===== STREAMCHAT TOKEN ENDPOINTS =====

  @Post('streamchat/tokens/generate-all')
  @ApiOperation({ summary: 'Generate StreamChat tokens for all users' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Tokens generated successfully' })
  async generateTokensForAllUsers(): Promise<{
    message: string;
    results: { success: number; failed: number; errors: any[] };
  }> {
    const results = await (this.notificationService as any).generateTokensForAllUsers();

    return {
      message: `Token generation completed. Success: ${results.success}, Failed: ${results.failed}`,
      results,
    };
  }

  @Post('streamchat/tokens/:userId')
  @ApiOperation({ summary: 'Generate StreamChat token for specific user' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Token generated successfully' })
  async generateTokenForUser(
    @Param('userId') userId: string,
  ): Promise<{
    message: string;
    token: string;
    userId: string;
  }> {
    const token = await (this.notificationService as any).generateStreamToken(userId);

    return {
      message: 'Token generated successfully',
      token,
      userId,
    };
  }
}