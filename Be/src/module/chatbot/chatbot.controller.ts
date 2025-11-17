import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ChatbotService } from './chatbot.service';
import {
  ProcessMessageDto,
  DoctorScheduleQueryDto,
  HealthAdviceDto,
} from './dto/process-message.dto';

@ApiTags('Chatbot')
@Controller('chatbot')
export class ChatbotController {
  constructor(private readonly chatbotService: ChatbotService) {}

  /**
   * Webhook endpoint từ Stream Chat
   * Khi user gửi message trong channel với AI bot
   */
  @Post('webhook/stream-chat')
  @ApiOperation({ summary: 'Process message from Stream Chat webhook' })
  @ApiResponse({ status: 200, description: 'Webhook processed' })
  handleStreamChatWebhook(@Body() payload: any) {
    // Verify webhook signature (important!)
    // Process only messages sent to AI bot

    if (payload.type === 'message.new') {
      const message = payload.message;
      const channelId = payload.channel_id;
      const userId = message.user.id;

      // Ignore messages from AI bot itself
      if (userId === process.env.AI_BOT_USER_ID) {
        return { status: 'ignored' };
      }

      // Process message asynchronously
      this.chatbotService
        .processMessageAndReply(channelId, message.text, userId)
        .catch((err) => {
          console.error('Error processing message:', err);
        });
    }

    return { status: 'ok' };
  }

  /**
   * Alternative: Direct API call (không dùng webhook)
   * Frontend gọi trực tiếp khi user gửi message
   */
  @Post('process')
  @ApiOperation({ summary: 'Process message and return AI response' })
  @ApiResponse({ status: 200, description: 'Message processed successfully' })
  async processMessage(@Body() dto: ProcessMessageDto) {
    return await this.chatbotService.processMessage(dto.message, dto.userId);
  }

  /**
   * Test endpoint để kiểm tra Agent connection
   */
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
   * Direct tool access: Doctor Schedule
   */
  @Get('tools/doctor-schedule')
  @ApiOperation({ summary: 'Get doctor schedule (direct tool access)' })
  @ApiResponse({ status: 200, description: 'Schedule retrieved' })
  async getDoctorSchedule(@Query() query: DoctorScheduleQueryDto) {
    const { default: tool } = await import('./tools/doctor-schedule.tool');
    const doctorScheduleTool = new tool.DoctorScheduleTool(null as any); // Will be injected properly via service
    return await doctorScheduleTool.execute(query);
  }

  /**
   * Direct tool access: Health Advice
   */
  @Post('tools/health-advice')
  @ApiOperation({ summary: 'Get health advice (direct tool access)' })
  @ApiResponse({ status: 200, description: 'Advice retrieved' })
  async getHealthAdvice(@Body() dto: HealthAdviceDto) {
    const { default: tool } = await import('./tools/health-advice.tool');
    const healthAdviceTool = new tool.HealthAdviceTool(null as any); // Will be injected properly via service
    return await healthAdviceTool.execute(dto);
  }
}
