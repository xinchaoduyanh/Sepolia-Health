import { appConfig } from '@/common/config';
import { PrismaService } from '@/common/prisma/prisma.service';
import { InjectQueue } from '@nestjs/bullmq';
import {
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import axios from 'axios';
import { Queue } from 'bullmq';
import { createHash } from 'crypto';
import { addDays, format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { StreamChat } from 'stream-chat';
import {
  AiMessageResponse,
  AiPlatformClient,
} from './ai-platform-client.service';
import { CHATBOT_QUEUE } from './chatbot.constant';
import { DoctorScheduleTool } from './tools/doctor-schedule.tool';
import { FindAvailableDoctorsTool } from './tools/find-available-doctors.tool';
import { SearchClinicsTool } from './tools/search-clinics.tool';
import { SearchDoctorsTool } from './tools/search-doctors.tool';
import { SearchServicesTool } from './tools/search-services.tool';

const THINKING_PLACEHOLDER = 'Đang soạn câu trả lời…';

export interface StreamAiMessageJob {
  streamMessageId: string;
  channelId: string;
  text: string;
  userId: string;
}

/** Gắn cờ lifecycle lên Error để outer catch biết đã có placeholder / đã finalize. */
const AI_PLACEHOLDER_CREATED = '__aiPlaceholderCreated';
const AI_PLACEHOLDER_FINALIZED = '__aiPlaceholderFinalized';

function markErrorMeta(
  error: unknown,
  meta: { placeholderCreated?: boolean; placeholderFinalized?: boolean },
): void {
  if (!error || typeof error !== 'object') return;
  if (meta.placeholderCreated) {
    (error as any)[AI_PLACEHOLDER_CREATED] = true;
  }
  if (meta.placeholderFinalized) {
    (error as any)[AI_PLACEHOLDER_FINALIZED] = true;
    (error as any)[AI_PLACEHOLDER_CREATED] = true;
  }
}

function wasPlaceholderCreated(error: unknown): boolean {
  return Boolean(
    error &&
      typeof error === 'object' &&
      ((error as any)[AI_PLACEHOLDER_CREATED] ||
        (error as any)[AI_PLACEHOLDER_FINALIZED]),
  );
}

function wasPlaceholderFinalized(error: unknown): boolean {
  return Boolean(
    error && typeof error === 'object' && (error as any)[AI_PLACEHOLDER_FINALIZED],
  );
}

function userFacingAiErrorMessage(error: any): string {
  if (error?.response?.status === 502 || error?.response?.status === 503) {
    return 'Xin lỗi, AI Agent đang tạm thời không khả dụng. Vui lòng thử lại sau vài giây.';
  }
  if (error?.response?.status === 429) {
    return 'Xin lỗi, bạn gửi tin hơi nhanh. Vui lòng thử lại sau giây lát.';
  }
  if (error?.status === 403 || error?.name === 'ForbiddenException') {
    return 'Xin lỗi, em không thể xử lý yêu cầu này. Vui lòng thử lại hoặc mở lại chat AI.';
  }
  return 'Xin lỗi, có lỗi xảy ra khi xử lý tin nhắn của bạn. Vui lòng thử lại sau.';
}

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
  private readonly logger = new Logger(ChatbotService.name);
  private streamClient: StreamChat;
  private readonly botUserId: string;

  private botReady = false;

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
    @InjectQueue(CHATBOT_QUEUE.NAME)
    private readonly streamMessageQueue: Queue<StreamAiMessageJob>,
  ) {
    // Initialize Stream Chat
    this.streamClient = StreamChat.getInstance(
      this.config.streamChatApiKey,
      this.config.streamChatSecret,
    );

    this.botUserId = this.config.aiBotUserId || 'sepolia-health-ai-assistant';
  }

  async enqueueStreamMessage(job: StreamAiMessageJob): Promise<void> {
    const jobId = `stream-${createHash('sha256')
      .update(job.streamMessageId)
      .digest('hex')}`;
    await this.streamMessageQueue.add(CHATBOT_QUEUE.JOB, job, {
      jobId,
      attempts: 5,
      backoff: { type: 'exponential', delay: 2_000 },
      removeOnComplete: { age: 24 * 3600, count: 10_000 },
      removeOnFail: { age: 24 * 3600, count: 10_000 },
    });
  }

  private async ensureBotUser(): Promise<void> {
    if (this.botReady) return;
    await this.streamClient.upsertUser({
      id: this.botUserId,
      name: 'Trợ lý Y tế Thông minh',
      role: 'user',
      image:
        'https://do-an-tot-nghiep-ptit.s3.ap-southeast-1.amazonaws.com/patient-avatars/612-727-1763463617117.jpg',
    });
    this.botReady = true;
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

    // Track placeholderCreated: false → outer catch gửi error bubble;
    // true + stream fail → update cùng bubble, không double-send.
    let placeholderCreated = false;
    let messageId: string | null = null;
    try {
      const msg = await channel.sendMessage({
        text: THINKING_PLACEHOLDER,
        user_id: this.botUserId,
        extra: {
          aiPlatform: true,
          streamStatus: 'thinking',
          schemaVersion: 1,
        },
      } as any);
      messageId = msg.message.id;
      placeholderCreated = true;
    } catch (sendErr) {
      this.log('processViaAiPlatform', 'error', 'Failed to create thinking placeholder', {
        channelId,
        error: sendErr instanceof Error ? sendErr.message : String(sendErr),
      });
      markErrorMeta(sendErr, { placeholderCreated: false });
      throw sendErr;
    }

    let fullText = '';
    let lastUpdate = 0;
    let updateChain: Promise<void> = Promise.resolve();
    let partialUpdateFails = 0;

    const enqueuePartialUpdate = (text: string, streamStatus: string) => {
      updateChain = updateChain
        .then(async () => {
          try {
            await this.streamClient.updateMessage({
              id: messageId!,
              text,
              user_id: this.botUserId,
              extra: {
                aiPlatform: true,
                streamStatus,
                schemaVersion: 1,
              },
            } as any);
          } catch (e) {
            partialUpdateFails += 1;
            this.log('processViaAiPlatform', 'warn', 'stream_partial_update_fail', {
              channelId,
              messageId,
              fails: partialUpdateFails,
              error: e instanceof Error ? e.message : String(e),
            });
          }
        })
        .catch(() => undefined);
    };

    const onChunk = (chunk: string) => {
      fullText += chunk;
      const now = Date.now();
      if (now - lastUpdate > 300) {
        lastUpdate = now;
        // Serialize updates; do not fire-and-forget races against final.
        enqueuePartialUpdate(fullText || THINKING_PLACEHOLDER, 'streaming');
      }
    };

    try {
      const aiResp = await this.aiPlatformClient.streamMessageForChannel(
        numericUserId,
        channelId,
        messageText,
        onChunk,
      );

      // Wait for any in-flight partial updates before final write wins.
      await updateChain;

      const sessionId = aiResp.session_state.session_id;
      const cleanedResponse = this.cleanResponse(aiResp.message);

      // Thẻ cũ hết vai trò khi: user xác nhận bằng chữ ("vâng" -> booked) hoặc có
      // thẻ MỚI thay thế. Resolve TRƯỚC final update.
      if (
        aiResp.requires_confirmation ||
        aiResp.session_state?.agent_state === 'booked'
      ) {
        await this.resolveConfirmationCards(channelId);
      }

      await this.streamClient.updateMessage({
        id: messageId!,
        text: cleanedResponse || fullText || THINKING_PLACEHOLDER,
        user_id: this.botUserId,
        extra: {
          aiPlatform: true,
          streamStatus: 'completed',
          schemaVersion: 1,
          sessionId,
          proposedAction: aiResp.proposed_action,
          requiresConfirmation: aiResp.requires_confirmation,
          expiresAt:
            (aiResp.proposed_action?.payload?.expires_at as string | undefined) ??
            undefined,
          traceId: aiResp.trace_id,
          toolResultsSummary: aiResp.tool_results_summary,
        },
      } as any);

      this.log('processViaAiPlatform', 'info', 'AI Platform reply sent via stream', {
        channelId,
        sessionId,
        traceId: aiResp.trace_id,
        requiresConfirmation: aiResp.requires_confirmation,
        partialUpdateFails,
      });

      return {
        response: cleanedResponse,
        timestamp: new Date().toISOString(),
        sessionId,
        traceId: aiResp.trace_id,
      };
    } catch (error: any) {
      await updateChain.catch(() => undefined);
      const errorMessage = userFacingAiErrorMessage(error);
      markErrorMeta(error, { placeholderCreated });
      if (placeholderCreated && messageId) {
        try {
          await this.streamClient.updateMessage({
            id: messageId,
            text: errorMessage,
            user_id: this.botUserId,
            extra: {
              aiPlatform: true,
              streamStatus: 'failed',
              schemaVersion: 1,
            },
          } as any);
          // Placeholder đã failed — outer catch không gửi bubble thứ 2.
          markErrorMeta(error, { placeholderFinalized: true });
        } catch (updateErr) {
          this.log('processViaAiPlatform', 'error', 'Failed to finalize error message', {
            channelId,
            messageId,
            error: updateErr instanceof Error ? updateErr.message : String(updateErr),
          });
          // placeholderCreated=true nhưng chưa finalize → outer có thể gửi bubble mới.
        }
      }
      throw error;
    }
  }

  /**
   * Đánh dấu các thẻ xác nhận đang mở trong channel là đã xử lý (extra.resolved).
   * FE đọc cờ này để render trạng thái tĩnh thay vì nút bấm — state cục bộ của
   * component mất khi rời/vào lại đoạn chat nên phải ghi lên chính message.
   */
  private async resolveConfirmationCards(channelId: string): Promise<void> {
    try {
      const channel = this.streamClient.channel('messaging', channelId);
      const res = await channel.query({ messages: { limit: 30 } });
      const pending = (res.messages || []).filter((m: any) => {
        const extra = m.extra ?? m;
        return (
          m.user?.id === this.botUserId &&
          extra?.requiresConfirmation &&
          !extra?.resolved
        );
      });
      for (const m of pending) {
        const extra = ((m as any).extra as Record<string, unknown>) ?? {};
        await this.streamClient.partialUpdateMessage(
          m.id,
          { set: { extra: { ...extra, resolved: true } } } as any,
          this.botUserId,
        );
      }
    } catch (e: any) {
      // Không chặn luồng chính: thẻ chưa resolve thì FE vẫn còn TTL 10' + AI từ chối.
      this.log('resolveConfirmationCards', 'warn', 'Failed to resolve cards', {
        channelId,
        error: e?.message,
      });
    }
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
    const logMessage = data
      ? `[${section}] ${message} ${JSON.stringify(data)}`
      : `[${section}] ${message}`;

    switch (level) {
      case 'info':
        this.logger.log(logMessage);
        break;
      case 'warn':
        this.logger.warn(logMessage);
        break;
      case 'error':
        this.logger.error(logMessage);
        break;
      case 'debug':
        this.logger.debug(logMessage);
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

  /**
   * @returns delivered=true khi user đã nhận bot reply (success hoặc bubble lỗi).
   * delivered=false / throw → webhook phải release Redis claim để Stream retry.
   */
  async processMessageAndReply(
    channelId: string,
    messageText: string,
    userId?: string,
  ): Promise<{
    response: string;
    timestamp: string;
    delivered: boolean;
    sessionId?: string;
    traceId?: string;
  }> {
    // Defense-in-depth: chốt ownership ngay cả khi controller đã kiểm tra.
    if (userId) {
      this.assertCanUseAiChannel(channelId, userId);
    }
    try {
      await this.ensureBotUser();

      const channel = this.streamClient.channel('messaging', channelId);

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
        const result = await this.processViaAiPlatform(
          channel,
          channelId,
          messageText,
          userId,
        );
        return { ...result, delivered: true };
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

      const errorMessage = userFacingAiErrorMessage(error);
      // Review: track placeholderCreated — chưa tạo thì gửi error bubble.
      // Đã finalize failed trên placeholder → không double bubble.
      const placeholderCreated = wasPlaceholderCreated(error);
      const placeholderFinalized = wasPlaceholderFinalized(error);
      let delivered = placeholderFinalized;

      try {
        await this.ensureBotUser();
        const channel = this.streamClient.channel('messaging', channelId);
        await channel
          .sendEvent({ type: 'typing.stop', user_id: this.botUserId })
          .catch(() => undefined);

        if (!placeholderFinalized) {
          // Chưa có placeholder HOẶC có nhưng update failed → bubble lỗi mới.
          await channel.sendMessage({
            text: errorMessage,
            user_id: this.botUserId,
            extra: {
              aiPlatform: true,
              streamStatus: 'failed',
              schemaVersion: 1,
              placeholderCreated,
            },
          } as any);
          delivered = true;
        }
      } catch (sendError) {
        this.log(
          'processMessageAndReply',
          'error',
          'Failed to deliver error message to channel',
          {
            channelId,
            placeholderCreated,
            placeholderFinalized,
            error: sendError instanceof Error ? sendError.message : String(sendError),
          },
        );
        delivered = false;
      }

      if (!delivered) {
        // Webhook: mark failed + release claim → Stream retry (không nuốt 24h).
        throw error;
      }

      return {
        response: errorMessage,
        timestamp: new Date().toISOString(),
        delivered: true,
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
      // Nút đã được bấm -> thẻ cũ coi như tiêu thụ xong, bất kể kết quả.
      await this.resolveConfirmationCards(channelId);
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
      await this.resolveConfirmationCards(channelId);
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
