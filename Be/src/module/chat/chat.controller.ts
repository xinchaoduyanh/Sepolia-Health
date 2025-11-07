import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import {
  StartChatDto,
  ChatChannelResponseDto,
  ChatChannelDto,
  StreamTokenResponseDto,
  ClinicDto,
} from './chat.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';

@ApiTags('Chat')
@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('start')
  @ApiOperation({ summary: 'Bắt đầu cuộc chat mới với clinic' })
  @ApiResponse({
    status: 201,
    description: 'Channel created successfully',
    type: ChatChannelResponseDto,
  })
  async startChat(
    @Body() dto: StartChatDto,
    @Request() req,
  ): Promise<ChatChannelResponseDto> {
    const patientUserId = req.user.userId;
    const result = await this.chatService.createChatChannel(
      patientUserId,
      dto.clinicId,
    );
    const token = this.chatService.generateStreamToken(patientUserId);
    return {
      ...result,
      streamToken: token,
    };
  }

  @Get('channels')
  @ApiOperation({ summary: 'Lấy danh sách channels của user' })
  @ApiResponse({
    status: 200,
    description: 'Channels retrieved successfully',
    type: [ChatChannelDto],
  })
  async getChannels(@Request() req): Promise<ChatChannelDto[]> {
    const userId = req.user.userId;
    return this.chatService.getUserChannels(userId);
  }

  @Get('token')
  @ApiOperation({ summary: 'Lấy Stream Chat token cho user' })
  @ApiResponse({
    status: 200,
    description: 'Token generated successfully',
    type: StreamTokenResponseDto,
  })
  getToken(@Request() req) {
    const userId = req.user.userId;
    const token = this.chatService.generateStreamToken(userId);
    return {
      token,
      userId: userId.toString(),
    };
  }

  @Post('test-receptionist-message')
  @ApiOperation({ summary: 'Test: Gửi message từ receptionist để test avatar' })
  @ApiResponse({
    status: 200,
    description: 'Test message sent successfully',
  })
  async sendTestReceptionistMessage(@Body() body: { channelId: string }) {
    await this.chatService.sendTestReceptionistMessage(body.channelId);
    return { success: true, message: 'Test receptionist message sent' };
  }

  @Get('clinics')
  @ApiOperation({ summary: 'Lấy danh sách clinics có thể chat' })
  @ApiResponse({
    status: 200,
    description: 'Clinics retrieved successfully',
    type: [ClinicDto],
  })
  async getClinics(): Promise<ClinicDto[]> {
    return await this.chatService.getAvailableClinics();
  }
}
