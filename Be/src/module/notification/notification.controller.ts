import {
  Controller,
  Patch,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { NotificationService } from './notification.service';
import { CurrentUser } from '@/common/decorators';

@ApiBearerAuth()
@ApiTags('Notifications')
@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) { }

  @Patch(':userId/:messageId/read')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Mark notification as read' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Notification marked as read' })
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
