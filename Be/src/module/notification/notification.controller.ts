import {
  Controller,
  Patch,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { NotificationService } from './notification.service';
import { JwtAuthGuard } from '@/common/guards';
import { CurrentUser } from '@/common/decorators';

@ApiTags('Notifications')
@Controller('notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Patch(':userId/:messageId/read')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Mark notification as read' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiParam({ name: 'messageId', description: 'Message ID' })
  @ApiResponse({ status: 204, description: 'Notification marked as read' })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  async markAsRead(
    @Param('userId') userId: string,
    @Param('messageId') messageId: string,
    @CurrentUser('userId') currentUserId: number,
  ): Promise<void> {
    // Verify that the user is marking their own notification
    if (userId !== currentUserId.toString()) {
      throw new Error(
        "Unauthorized: Cannot mark other user's notifications as read",
      );
    }
    return this.notificationService.markAsRead(userId, messageId);
  }
}
