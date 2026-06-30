import { appConfig } from '@/common/config';
import { PrismaService } from '@/common/prisma/prisma.service';
import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import axios from 'axios';
import { addDays, format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { StreamChat } from 'stream-chat';
import {
  AiMessageResponse,
  AiPlatformClient,
} from './ai-platform-client.service';
import { DoctorScheduleTool } from './tools/doctor-schedule.tool';
import { FindAvailableDoctorsTool } from './tools/find-available-doctors.tool';
import { SearchClinicsTool } from './tools/search-clinics.tool';
import { SearchDoctorsTool } from './tools/search-doctors.tool';
import { SearchServicesTool } from './tools/search-services.tool';

interface AgentMessage {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  tool_calls?: any[];
  tool_call_id?: string;
}

interface ToolCall {
  id: string;
  name: string;
  parameters: any;
}

@Injectable()
export class ChatbotService {
  private streamClient: StreamChat;
  private readonly botUserId: string;

  constructor(
    @Inject(appConfig.KEY)
    private readonly config: ConfigType<typeof appConfig>,
    private readonly doctorScheduleTool: DoctorScheduleTool,
    private readonly searchDoctorsTool: SearchDoctorsTool,
    private readonly searchClinicsTool: SearchClinicsTool,
    private readonly searchServicesTool: SearchServicesTool,
    private readonly findAvailableDoctorsTool: FindAvailableDoctorsTool,
    private readonly aiPlatformClient: AiPlatformClient,
    private readonly prisma: PrismaService,
  ) {
    // Initialize Stream Chat
    this.streamClient = StreamChat.getInstance(
      this.config.streamChatApiKey,
      this.config.streamChatSecret,
    );

    this.botUserId = this.config.aiBotUserId || 'sepolia-health-ai-assistant';
  }

  private startTypingHeartbeat(channel: any): NodeJS.Timeout {
    return setInterval(() => {
      channel
        .sendEvent({
          type: 'typing.start',
          user_id: this.botUserId,
        })
        .catch(() => undefined);
    }, 8000);
  }

  private async processViaAiPlatform(
    channel: any,
    channelId: string,
    messageText: string,
    userId: string,
  ) {
    const numericUserId = Number(userId);
    if (!Number.isInteger(numericUserId)) {
      throw new ForbiddenException('Invalid AI user id');
    }

    const aiResp = await this.aiPlatformClient.sendMessage(
      numericUserId,
      channelId,
      messageText,
    );
    const sessionId = aiResp.session_state.session_id;
    const cleanedResponse = await this.sendAiPlatformMessage(
      channel,
      sessionId,
      aiResp,
    );

    this.log('processViaAiPlatform', 'info', 'AI Platform reply sent', {
      channelId,
      sessionId,
      traceId: aiResp.trace_id,
      requiresConfirmation: aiResp.requires_confirmation,
    });

    return {
      response: cleanedResponse,
      timestamp: new Date().toISOString(),
      sessionId,
      traceId: aiResp.trace_id,
    };
  }

  private async sendAiPlatformMessage(
    channel: any,
    sessionId: string,
    aiResp: AiMessageResponse,
  ): Promise<string> {
    const cleanedResponse = this.cleanResponse(aiResp.message);

    await channel.sendMessage({
      text: cleanedResponse,
      user_id: this.botUserId,
      extra: {
        aiPlatform: true,
        sessionId,
        proposedAction: aiResp.proposed_action,
        requiresConfirmation: aiResp.requires_confirmation,
        traceId: aiResp.trace_id,
        toolResultsSummary: aiResp.tool_results_summary,
      },
    } as any);

    return cleanedResponse;
  }

  /**
   * Helper method để format logs với prefix rõ ràng
   */
  private log(
    section: string,
    level: 'info' | 'warn' | 'error' | 'debug',
    message: string,
    data?: any,
  ): void {
    const prefix = `[ChatbotService::${section}]`;
    const logMessage = `${prefix} ${message}`;

    switch (level) {
      case 'info':
        if (data) {
          console.log(`📘 ${logMessage}`, data);
        } else {
          console.log(`📘 ${logMessage}`);
        }
        break;
      case 'warn':
        if (data) {
          console.warn(`⚠️  ${logMessage}`, data);
        } else {
          console.warn(`⚠️  ${logMessage}`);
        }
        break;
      case 'error':
        if (data) {
          console.error(`❌ ${logMessage}`, data);
        } else {
          console.error(`❌ ${logMessage}`);
        }
        break;
      case 'debug':
        if (data) {
          console.log(`🔍 ${logMessage}`, data);
        } else {
          console.log(`🔍 ${logMessage}`);
        }
        break;
    }
  }

  /**
   * Create AI bot user trong Stream Chat (run once during setup)
   */
  async createAIBotUser() {
    try {
      await this.streamClient.upsertUser({
        id: this.botUserId,
        name: 'Trợ lý Y tế Thông minh',
        role: 'user',
        image:
          'https://do-an-tot-nghiep-ptit.s3.ap-southeast-1.amazonaws.com/patient-avatars/612-727-1763463617117.jpg',
      });

      this.log('createAIBotUser', 'info', 'AI bot user created successfully', {
        botUserId: this.botUserId,
      });

      return {
        success: true,
        message: 'AI bot user created successfully',
        botUserId: this.botUserId,
      };
    } catch (error) {
      this.log(
        'createAIBotUser',
        'error',
        'Failed to create AI bot user',
        error,
      );
      throw error;
    }
  }

  /**
   * Tạo channel riêng với AI bot để test chatbot
   */
  async createAIChannel(userId: number) {
    try {
      // Channel ID unique cho mỗi user
      const channelId = `ai-consult-${userId}`;

      // Lấy thông tin user từ database
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          doctorProfile: true,
          receptionistProfile: true,
          adminProfile: true,
          patientProfiles: {
            where: { relationship: 'SELF' },
            take: 1,
          },
        },
      });

      if (!user) {
        throw new Error(`User ${userId} not found`);
      }

      // Lấy tên và avatar dựa trên role
      let userName = `User ${userId}`;
      let userAvatar: string | undefined = undefined;

      if (user.doctorProfile) {
        userName = `${user.doctorProfile.firstName} ${user.doctorProfile.lastName}`;
        userAvatar = user.doctorProfile.avatar || undefined;
      } else if (user.receptionistProfile) {
        userName = `${user.receptionistProfile.firstName} ${user.receptionistProfile.lastName}`;
        userAvatar = user.receptionistProfile.avatar || undefined;
      } else if (user.adminProfile) {
        userName = `${user.adminProfile.firstName} ${user.adminProfile.lastName}`;
        userAvatar = user.adminProfile.avatar || undefined;
      } else if (user.patientProfiles.length > 0) {
        const patientProfile = user.patientProfiles[0];
        userName = `${patientProfile.firstName} ${patientProfile.lastName}`;
        userAvatar = patientProfile.avatar || undefined;
      }

      // Upsert user vào Stream Chat
      await this.streamClient.upsertUser({
        id: userId.toString(),
        name: userName,
        role: 'user',
        image: userAvatar || undefined,
      });

      // Đảm bảo AI bot user tồn tại
      await this.streamClient.upsertUser({
        id: this.botUserId,
        name: 'Trợ lý Y tế Thông minh',
        role: 'user',
        image:
          'https://do-an-tot-nghiep-ptit.s3.ap-southeast-1.amazonaws.com/patient-avatars/612-727-1763463617117.jpg',
      });

      // Tạo hoặc lấy channel
      const channel = this.streamClient.channel('messaging', channelId, {
        created_by_id: userId.toString(),
        members: [userId.toString(), this.botUserId],
        ai_channel: true,
        consultation_type: 'ai_assistant',
      } as any);

      // Tạo channel trước khi watch
      await channel.create();
      await channel.watch();

      // Kiểm tra xem channel đã có message chưa
      const messages = await channel.query({ messages: { limit: 1 } });

      // Nếu channel mới (chưa có message), gửi welcome message
      if (messages.messages.length === 0) {
        await channel.sendMessage({
          text: 'Xin chào bạn! Tôi là Chatbot Assistants của Sepolia. Xin hỏi bạn cần giúp đỡ gì nhỉ?',
          user_id: this.botUserId,
        });
      }

      this.log('createAIChannel', 'info', 'AI channel created successfully', {
        channelId,
        cid: channel.cid,
        userId,
      });

      return {
        channelId,
        cid: channel.cid,
        message: 'Channel created and welcome message sent',
      };
    } catch (error) {
      this.log('createAIChannel', 'error', 'Failed to create AI channel', {
        userId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Process message và reply trong Stream Chat
   */
  /**
   * Verify chữ ký webhook Stream Chat trên RAW body bytes (không phải JSON.stringify).
   * Stream ký bằng API secret; sai/thiếu chữ ký -> false.
   */
  verifyWebhookSignature(
    rawBody: Buffer | string | undefined,
    signature: string | undefined,
  ): boolean {
    if (!rawBody || !signature) return false;
    try {
      return this.streamClient.verifyWebhook(rawBody, signature);
    } catch {
      return false;
    }
  }

  /**
   * Chốt ownership: chỉ cho phép tác động lên đúng AI channel của user đó.
   * Channel AI phải đúng dạng `ai-consult-${userId}`. Ngăn user A khiến bot
   * post vào channel của user B hoặc channel phòng khám.
   */
  assertCanUseAiChannel(channelId: string, userId: string | number): void {
    if (!userId || channelId !== `ai-consult-${userId}`) {
      throw new ForbiddenException('Forbidden AI channel');
    }
  }

  async processMessageAndReply(
    channelId: string,
    messageText: string,
    userId?: string,
  ) {
    // Defense-in-depth: chốt ownership ngay cả khi controller đã kiểm tra.
    if (userId) {
      this.assertCanUseAiChannel(channelId, userId);
    }
    try {
      // Ensure bot user exists with avatar before sending messages
      await this.streamClient.upsertUser({
        id: this.botUserId,
        name: 'Trợ lý Y tế Thông minh',
        role: 'user',
        image:
          'https://do-an-tot-nghiep-ptit.s3.ap-southeast-1.amazonaws.com/patient-avatars/612-727-1763463617117.jpg',
      });

      // Get channel
      const channel = this.streamClient.channel('messaging', channelId);

      // Show typing indicator
      await channel.sendEvent({
        type: 'typing.start',
        user_id: this.botUserId,
      });

      if (!this.config.chatbotUseAiPlatform) {
        throw new ForbiddenException(
          'AI Platform chưa được bật. Vui lòng đặt CHATBOT_USE_AI_PLATFORM=true trong cấu hình.',
        );
      }

      if (!userId) {
        throw new ForbiddenException('Missing user id for AI channel');
      }

      const heartbeat = this.startTypingHeartbeat(channel);
      try {
        return await this.processViaAiPlatform(
          channel,
          channelId,
          messageText,
          userId,
        );
      } finally {
        clearInterval(heartbeat);
        await channel
          .sendEvent({
            type: 'typing.stop',
            user_id: this.botUserId,
          })
          .catch(() => undefined);
      }
    } catch (error: any) {
      this.log('processMessageAndReply', 'error', 'Error processing message', {
        channelId,
        message: error.message,
        status: error.response?.status,
        code: error.code,
      });

      // Send error message to channel
      let errorMessage =
        'Xin lỗi, có lỗi xảy ra khi xử lý tin nhắn của bạn. Vui lòng thử lại sau.';

      if (error.response?.status === 502 || error.response?.status === 503) {
        errorMessage =
          'Xin lỗi, AI Agent đang tạm thời không khả dụng. Vui lòng thử lại sau vài giây.';
      }

      try {
        // Ensure bot user exists with avatar before sending error message
        await this.streamClient.upsertUser({
          id: this.botUserId,
          name: 'Trợ lý Y tế Thông minh',
          role: 'user',
          image:
            'https://do-an-tot-nghiep-ptit.s3.ap-southeast-1.amazonaws.com/patient-avatars/612-727-1763463617117.jpg',
        });

        const channel = this.streamClient.channel('messaging', channelId);
        await channel.sendEvent({
          type: 'typing.stop',
          user_id: this.botUserId,
        });
        await channel.sendMessage({
          text: errorMessage,
          user_id: this.botUserId,
        });
      } catch (sendError) {
        this.log(
          'processMessageAndReply',
          'error',
          'Failed to send error message to channel',
          {
            channelId,
            error: sendError.message,
          },
        );
      }

      // Return error response instead of throwing
      return {
        response: errorMessage,
        timestamp: new Date().toISOString(),
      };
    }
  }

  async confirmAiBooking(channelId: string, userId: string | number) {
    this.assertCanUseAiChannel(channelId, userId);
    const numericUserId = Number(userId);
    if (!Number.isInteger(numericUserId)) {
      throw new ForbiddenException('Invalid AI user id');
    }

    const channel = this.streamClient.channel('messaging', channelId);
    await channel.sendEvent({ type: 'typing.start', user_id: this.botUserId });
    const heartbeat = this.startTypingHeartbeat(channel);
    try {
      const aiResp = await this.aiPlatformClient.confirmForChannel(
        numericUserId,
        channelId,
      );
      const sessionId = aiResp.session_state.session_id;
      const cleanedResponse = await this.sendAiPlatformMessage(
        channel,
        sessionId,
        aiResp,
      );
      return {
        response: cleanedResponse,
        timestamp: new Date().toISOString(),
        sessionId,
        traceId: aiResp.trace_id,
      };
    } finally {
      clearInterval(heartbeat);
      await channel
        .sendEvent({ type: 'typing.stop', user_id: this.botUserId })
        .catch(() => undefined);
    }
  }

  async cancelAiBooking(channelId: string, userId: string | number) {
    this.assertCanUseAiChannel(channelId, userId);
    const numericUserId = Number(userId);
    if (!Number.isInteger(numericUserId)) {
      throw new ForbiddenException('Invalid AI user id');
    }

    const channel = this.streamClient.channel('messaging', channelId);
    await channel.sendEvent({ type: 'typing.start', user_id: this.botUserId });
    const heartbeat = this.startTypingHeartbeat(channel);
    try {
      const aiResp = await this.aiPlatformClient.cancelForChannel(
        numericUserId,
        channelId,
      );
      const sessionId = aiResp.session_state.session_id;
      const cleanedResponse = await this.sendAiPlatformMessage(
        channel,
        sessionId,
        aiResp,
      );
      return {
        response: cleanedResponse,
        timestamp: new Date().toISOString(),
        sessionId,
        traceId: aiResp.trace_id,
      };
    } finally {
      clearInterval(heartbeat);
      await channel
        .sendEvent({ type: 'typing.stop', user_id: this.botUserId })
        .catch(() => undefined);
    }
  }



  /**
   * Process message và return response (không reply vào channel)
   * Dùng cho direct API call
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async processMessage(messageText: string, _userId?: string) {
    try {
      if (!this.config.chatbotUseAiPlatform || !_userId) {
        throw new ForbiddenException(
          'AI Platform chưa được bật (CHATBOT_USE_AI_PLATFORM=true) hoặc thiếu UserId.',
        );
      }

      const numericUserId = Number(_userId);
      if (!Number.isInteger(numericUserId)) {
        throw new ForbiddenException('Invalid AI user id');
      }
      const session = await this.aiPlatformClient.getOrCreateSession(
        numericUserId,
      );
      const aiResp = await this.aiPlatformClient.postMessage(
        session.sessionId,
        messageText,
      );
      const cleanedResponse = this.cleanResponse(aiResp.message);
      return {
        response: cleanedResponse,
        timestamp: new Date().toISOString(),
        sessionId: session.sessionId,
        traceId: aiResp.trace_id,
      };
    } catch (error: any) {
      this.log('processMessage', 'error', 'Error processing message', error);
      return {
        response: 'Xin lỗi, có lỗi xảy ra. Vui lòng thử lại sau.',
        error: error.message,
      };
    }
  }

  private cleanResponse(content: string): string {
    if (!content) return '';

    // 1. Xóa thẻ <think> và <think> (đều đóng bằng </think>)
    let cleanText = content
      .replace(/<think>[\s\S]*?<\/think>/g, '')
      .replace(/<think>[\s\S]*?<\/think>/g, '')
      .trim();

    // 2. Xóa các block code markdown nếu AI lỡ output ra mà không phải tool call
    // Ví dụ: ```json ... ``` hoặc chỉ đơn giản là ```
    cleanText = cleanText.replace(/```json/gi, ''); // Xóa chữ json
    cleanText = cleanText.replace(/```/g, ''); // Xóa dấu ```

    // 3. Trim lại lần nữa
    return cleanText.trim();
  }
}
