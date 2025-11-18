import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  Inject,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { ConfigType } from '@nestjs/config';
import { ChatbotService } from './chatbot.service';
import {
  ProcessMessageDto,
  DoctorScheduleQueryDto,
  SearchDoctorsDto,
  StreamChatWebhookDto,
} from './dto/process-message.dto';
import { DoctorScheduleTool } from './tools/doctor-schedule.tool';
import { SearchDoctorsTool } from './tools/search-doctors.tool';
import { appConfig } from '@/common/config';
import { ApiBearerAuth } from '@nestjs/swagger';

@ApiBearerAuth()
@ApiTags('Chatbot')
@Controller('chatbot')
export class ChatbotController {
  constructor(
    private readonly chatbotService: ChatbotService,
    private readonly doctorScheduleTool: DoctorScheduleTool,
    private readonly searchDoctorsTool: SearchDoctorsTool,
    @Inject(appConfig.KEY)
    private readonly config: ConfigType<typeof appConfig>,
  ) {}

  /**
   * Webhook endpoint từ Stream Chat
   * Khi user gửi message trong channel với AI bot
   * Public endpoint vì Stream Chat sẽ gọi từ bên ngoài không có JWT token
   */
  @Post('webhook/stream-chat')
  @ApiOperation({
    summary: 'Process message from Stream Chat webhook',
    description:
      'Webhook endpoint để nhận events từ Stream Chat. Chỉ xử lý event type "message.new". Endpoint này là PUBLIC, không cần JWT token.',
  })
  @ApiBody({
    type: StreamChatWebhookDto,
    description: 'Stream Chat webhook payload',
    examples: {
      messageNew: {
        summary: 'Message New Event',
        description: 'Example payload khi có message mới',
        value: {
          type: 'message.new',
          channel_id: 'messaging:clinic-1-patient-1',
          message: {
            id: 'msg-123',
            text: 'Xin chào, tôi cần tư vấn',
            user: {
              id: '1',
              name: 'Test User',
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Webhook processed successfully',
    schema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          example: 'ok',
        },
        message: {
          type: 'string',
          example: 'Webhook processed',
        },
      },
    },
  })
  handleStreamChatWebhook(@Body() payload: StreamChatWebhookDto) {
    // Verify webhook signature (important!)
    // Process only messages sent to AI bot

    // Validate payload exists
    if (!payload) {
      console.warn('Webhook received with no payload');
      return { status: 'ok', message: 'No payload received' };
    }

    // Log payload for debugging (remove in production if sensitive)
    console.log('Webhook payload received:', JSON.stringify(payload, null, 2));

    // Only process message.new events
    if (payload.type === 'message.new') {
      const message = payload.message;
      const channelId = payload.channel_id;

      // Validate required fields
      if (!message) {
        console.warn('Webhook payload missing message field');
        return { status: 'ok', message: 'No message in payload' };
      }

      if (!channelId) {
        console.warn('Webhook payload missing channel_id field');
        return { status: 'ok', message: 'No channel_id in payload' };
      }

      if (!message.user || !message.user.id) {
        console.warn('Webhook payload missing user information');
        return { status: 'ok', message: 'No user info in message' };
      }

      const userId = message.user.id;

      // Ignore messages from AI bot itself
      if (userId === this.config.aiBotUserId) {
        console.log('Ignoring message from AI bot itself');
        return { status: 'ignored' };
      }

      // Validate message text exists
      if (!message.text || message.text.trim().length === 0) {
        console.warn('Webhook received message with no text');
        return { status: 'ok', message: 'Message has no text' };
      }

      // Process message asynchronously
      this.chatbotService
        .processMessageAndReply(channelId, message.text, userId)
        .catch((err) => {
          console.error('Error processing message:', err);
        });
    } else {
      console.log(`Webhook received event type: ${payload.type}, ignoring`);
    }

    return { status: 'ok' };
  }

  /**
   * Alternative: Direct API call (không dùng webhook)
   * Frontend gọi trực tiếp khi user gửi message
   */
  @ApiBearerAuth()
  @Post('process')
  @ApiOperation({ summary: 'Process message and return AI response' })
  @ApiResponse({ status: 200, description: 'Message processed successfully' })
  async processMessage(@Body() dto: ProcessMessageDto) {
    return await this.chatbotService.processMessage(dto.message, dto.userId);
  }

  /**
   * Test endpoint để kiểm tra Agent connection
   */
  @ApiBearerAuth()
  @Get('test')
  @ApiOperation({ summary: 'Test DigitalOcean Agent connection' })
  @ApiResponse({ status: 200, description: 'Test successful' })
  async testAgent() {
    const response = await this.chatbotService.processMessage(
      'Xin chào, tôi cần test connection',
    );
    return {
      success: true,
      message: 'Agent connection successful',
      response,
    };
  }

  /**
   * Create AI bot user in Stream Chat (chạy 1 lần khi setup)
   */
  @Post('setup/create-bot-user')
  @ApiOperation({ summary: 'Create AI bot user in Stream Chat' })
  @ApiResponse({ status: 201, description: 'Bot user created' })
  async createBotUser() {
    return await this.chatbotService.createAIBotUser();
  }

  /**
   * Tạo channel riêng với AI bot để test chatbot
   */
  @Post('setup/create-ai-channel')
  @ApiOperation({
    summary: 'Create channel với AI bot để test chatbot',
    description:
      'Tạo channel riêng giữa user và AI bot. Channel này dùng để test chatbot, không liên quan đến chat với receptionist. Cần JWT token.',
  })
  @ApiResponse({
    status: 201,
    description: 'AI channel created successfully',
    schema: {
      type: 'object',
      properties: {
        channelId: {
          type: 'string',
          example: 'ai-consult-1',
        },
        cid: {
          type: 'string',
          example: 'messaging:ai-consult-1',
        },
        message: {
          type: 'string',
          example: 'Channel created and welcome message sent',
        },
      },
    },
  })
  async createAIChannel(@Request() req) {
    const userId = req.user.userId;
    return await this.chatbotService.createAIChannel(userId);
  }

  /**
   * Direct tool access: Doctor Schedule
   */
  @Get('tools/doctor-schedule')
  @ApiOperation({ summary: 'Get doctor schedule (direct tool access)' })
  @ApiResponse({ status: 200, description: 'Schedule retrieved' })
  async getDoctorSchedule(@Query() query: DoctorScheduleQueryDto) {
    return await this.doctorScheduleTool.execute(query);
  }

  /**
   * Direct tool access: Health Advice
   */

  /**
   * Direct tool access: Search Doctors
   */
  @Get('tools/search-doctors')
  @ApiOperation({ summary: 'Search doctors by name (direct tool access)' })
  @ApiResponse({ status: 200, description: 'Doctors found' })
  async searchDoctors(@Query() query: SearchDoctorsDto) {
    return await this.searchDoctorsTool.execute(query);
  }
}
