import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { NotificationService } from './notification.service';
import { CurrentUser } from '@/common/decorators';
import { NotificationType, NotificationPriority, NotificationStatus } from './notification.types';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@ApiTags('Notifications')
@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) { }

  @Get()
  @ApiOperation({ summary: 'Get user notifications with filters' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Notifications retrieved successfully' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of notifications to return' })
  @ApiQuery({ name: 'offset', required: false, type: Number, description: 'Number of notifications to skip' })
  @ApiQuery({ name: 'type', required: false, enum: NotificationType, description: 'Filter by notification type' })
  @ApiQuery({ name: 'status', required: false, enum: NotificationStatus, description: 'Filter by status' })
  @ApiQuery({ name: 'priority', required: false, enum: NotificationPriority, description: 'Filter by priority' })
  async getNotifications(
    @CurrentUser('userId') userId: number,
    @Query('limit', ParseIntPipe) limit: number = 20,
    @Query('offset', ParseIntPipe) offset: number = 0,
    @Query('type') type?: NotificationType,
    @Query('status') status?: NotificationStatus,
    @Query('priority') priority?: NotificationPriority,
  ): Promise<any> {
    const notifications = await this.notificationService.getNotifications(
      userId.toString(),
      limit,
      offset,
    );

    // Apply filters (this would ideally be done at the StreamChat level)
    let filteredNotifications = notifications;

    if (type) {
      filteredNotifications = filteredNotifications.filter(n => n.type === type);
    }

    if (status) {
      filteredNotifications = filteredNotifications.filter(n => n.status === status);
    }

    if (priority) {
      filteredNotifications = filteredNotifications.filter(n => n.priority === priority);
    }

    return {
      notifications: filteredNotifications,
      total: filteredNotifications.length,
      limit,
      offset,
    };
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread notification count' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Unread count retrieved successfully' })
  async getUnreadCount(
    @CurrentUser('userId') userId: number,
  ): Promise<{ count: number }> {
    const count = await this.notificationService.getUnreadCount(userId.toString());
    return { count };
  }

  @Patch(':messageId/read')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Mark notification as read' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Notification marked as read' })
  async markAsRead(
    @Param('messageId') messageId: string,
    @CurrentUser('userId') currentUserId: number,
  ): Promise<void> {
    return this.notificationService.markAsRead(currentUserId, messageId, currentUserId);
  }

  @Patch('read-all')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'All notifications marked as read' })
  async markAllAsRead(
    @CurrentUser('userId') userId: number,
  ): Promise<void> {
    // Get all notifications and mark them as read
    const notifications = await this.notificationService.getNotifications(userId.toString(), 1000, 0);

    for (const notification of notifications) {
      if (notification.status === NotificationStatus.UNREAD) {
        try {
          await this.notificationService.markAsRead(userId, notification.id, userId);
        } catch (error) {
          // Continue even if one notification fails
          console.warn(`Failed to mark notification ${notification.id} as read:`, error);
        }
      }
    }
  }

  @Delete(':messageId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete notification (mark as archived)' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Notification deleted successfully' })
  async deleteNotification(
    @Param('messageId') messageId: string,
    @CurrentUser('userId') currentUserId: number,
  ): Promise<void> {
    // This would archive the notification in StreamChat
    // For now, we'll implement a basic version by updating the status
    const channel = await (this.notificationService as any).getOrCreateNotificationChannel(currentUserId.toString());

    // Get the message from channel state
    const message = channel.state.messages.find((msg: any) => msg.id === messageId);

    if (!message) {
      throw new Error(`Message ${messageId} not found`);
    }

    // Update message metadata to mark as archived
    await (this.notificationService as any).streamClient.updateMessage({
      id: messageId,
      channel_id: `notifications_${currentUserId}`,
      channel_type: 'messaging',
      user_id: 'system',
      metadata: {
        ...(message as any).metadata,
        status: NotificationStatus.ARCHIVED,
        archivedAt: new Date().toISOString(),
      },
    } as any);
  }

  @Get('types')
  @ApiOperation({ summary: 'Get available notification types' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Notification types retrieved successfully' })
  async getNotificationTypes(): Promise<{ types: string[] }> {
    return {
      types: Object.values(NotificationType),
    };
  }

  @Get('priorities')
  @ApiOperation({ summary: 'Get available notification priorities' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Notification priorities retrieved successfully' })
  async getNotificationPriorities(): Promise<{ priorities: string[] }> {
    return {
      priorities: Object.values(NotificationPriority),
    };
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get user notification statistics' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Notification statistics retrieved successfully' })
  async getUserNotificationStats(
    @CurrentUser('userId') userId: number,
  ): Promise<{
    total: number;
    unread: number;
    byType: Record<string, number>;
    byPriority: Record<string, number>;
  }> {
    const notifications = await this.notificationService.getNotifications(userId.toString(), 1000, 0);
    const unread = await this.notificationService.getUnreadCount(userId.toString());

    // Group by type
    const byType: Record<string, number> = {};
    notifications.forEach(n => {
      byType[n.type] = (byType[n.type] || 0) + 1;
    });

    // Group by priority
    const byPriority: Record<string, number> = {};
    notifications.forEach(n => {
      byPriority[n.priority] = (byPriority[n.priority] || 0) + 1;
    });

    return {
      total: notifications.length,
      unread,
      byType,
      byPriority,
    };
  }
}
