import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  Inject,
  Request,
  Req,
  Headers,
  Logger,
  UnauthorizedException,
  RawBodyRequest,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { ConfigType } from '@nestjs/config';
import { Request as ExpressRequest } from 'express';
import { Public } from '@/common/decorators';
import { ChatbotService } from './chatbot.service';
import {
  ProcessMessageDto,
  DoctorScheduleQueryDto,
  SearchDoctorsDto,
  StreamChatWebhookDto,
  AiChannelActionDto,
} from './dto/process-message.dto';
import { DoctorScheduleTool } from './tools/doctor-schedule.tool';
import { SearchDoctorsTool } from './tools/search-doctors.tool';
import { appConfig } from '@/common/config';
import { ApiBearerAuth } from '@nestjs/swagger';

@ApiBearerAuth()
@ApiTags('Chatbot')
@Controller('chatbot')
export class ChatbotController {
  private readonly logger = new Logger(ChatbotController.name);

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
  @Public()
  @Post('webhook/stream-chat')
  @ApiOperation({
    summary: 'Process message from Stream Chat webhook',
    description:
      'Webhook endpoint để nhận events từ Stream Chat. Chỉ xử lý event type "message.new". PUBLIC nhưng BẮT BUỘC verify chữ ký X-Signature.',
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
  handleStreamChatWebhook(
    @Req() req: RawBodyRequest<ExpressRequest>,
    @Headers('x-signature') signature: string,
    @Body() payload: StreamChatWebhookDto,
  ) {
    // 1. BẮT BUỘC verify chữ ký trên raw bytes TRƯỚC mọi side-effect.
    if (!this.chatbotService.verifyWebhookSignature(req.rawBody, signature)) {
      throw new UnauthorizedException('Invalid Stream webhook signature');
    }

    // 2. Chỉ xử lý message.new; event khác (reaction/typing/notification) bỏ qua.
    if (!payload || payload.type !== 'message.new') {
      return { status: 'ignored' };
    }

    const message = payload.message;
    // channel_id, hoặc parse từ cid "messaging:ai-consult-1".
    const channelId = payload.channel_id ?? payload.cid?.split(':').pop();
    const userId = message?.user?.id;

    // 3. Validate runtime field bắt buộc cho message.new.
    if (!channelId || !userId || !message?.text || message.text.trim().length === 0) {
      return { status: 'ignored' };
    }

    // 4. Bỏ qua message do chính bot gửi (tránh vòng lặp).
    if (userId === this.config.aiBotUserId) {
      return { status: 'ignored' };
    }

    // 5. Ownership: chỉ AI channel của đúng user đó.
    try {
      this.chatbotService.assertCanUseAiChannel(channelId, userId);
    } catch {
      this.logger.warn('Webhook bỏ qua channel không phải AI/không thuộc user');
      return { status: 'ignored' };
    }

    // 6. Xử lý bất đồng bộ. KHÔNG log full payload (chứa nội dung chat).
    this.chatbotService
      .processMessageAndReply(channelId, message.text, userId)
      .catch((err) =>
        this.logger.error(`Lỗi xử lý webhook message: ${err?.message}`),
      );

    return { status: 'ok' };
  }

  /**
   * Alternative: Direct API call (không dùng webhook)
   * Frontend gọi trực tiếp khi user gửi message
   * Nếu có channelId, tự động gửi response vào channel
   */
  @ApiBearerAuth()
  @Post('process')
  @ApiOperation({
    summary: 'Process message and return AI response',
    description:
      'Nếu có channelId, sẽ tự động gửi response vào channel. Nếu không, chỉ trả về response.',
  })
  @ApiResponse({
    status: 200,
    description: 'Message processed successfully',
  })
  async processMessage(@Body() dto: ProcessMessageDto, @Request() req) {
    // User id LẤY TỪ JWT, KHÔNG tin dto.userId (ngăn giả mạo).
    const userId = req.user?.userId;

    // Nếu có channelId, gửi response vào channel.
    if (dto.channelId) {
      // Ownership: chỉ cho phép AI channel của chính user (403 nếu khác).
      this.chatbotService.assertCanUseAiChannel(dto.channelId, userId);
      return await this.chatbotService.processMessageAndReply(
        dto.channelId,
        dto.message,
        userId?.toString(),
      );
    }

    // Không có channelId: chỉ trả về response (test/debug).
    return await this.chatbotService.processMessage(
      dto.message,
      userId?.toString(),
    );
  }

  @ApiBearerAuth()
  @Post('confirm')
  @ApiOperation({ summary: 'Confirm pending AI booking draft' })
  async confirmAiBooking(@Body() dto: AiChannelActionDto, @Request() req) {
    const userId = req.user?.userId;
    return await this.chatbotService.confirmAiBooking(dto.channelId, userId);
  }

  @ApiBearerAuth()
  @Post('cancel')
  @ApiOperation({ summary: 'Cancel pending AI booking draft' })
  async cancelAiBooking(@Body() dto: AiChannelActionDto, @Request() req) {
    const userId = req.user?.userId;
    return await this.chatbotService.cancelAiBooking(dto.channelId, userId);
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
