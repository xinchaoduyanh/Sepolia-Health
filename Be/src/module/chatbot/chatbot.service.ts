import { appConfig } from '@/common/config';
import { PrismaService } from '@/common/prisma/prisma.service';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import axios from 'axios';
import { addDays, format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { StreamChat } from 'stream-chat';
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
  private readonly agentApiUrl: string;
  private readonly agentEndpoint: string;
  private readonly agentAccessKey: string;
  private readonly botUserId: string;

  constructor(
    @Inject(appConfig.KEY)
    private readonly config: ConfigType<typeof appConfig>,
    private readonly doctorScheduleTool: DoctorScheduleTool,
    private readonly searchDoctorsTool: SearchDoctorsTool,
    private readonly searchClinicsTool: SearchClinicsTool,
    private readonly searchServicesTool: SearchServicesTool,
    private readonly findAvailableDoctorsTool: FindAvailableDoctorsTool,
    private readonly prisma: PrismaService,
  ) {
    // Initialize Stream Chat
    this.streamClient = StreamChat.getInstance(
      this.config.streamChatApiKey,
      this.config.streamChatSecret,
    );

    // DigitalOcean Agent config
    this.agentEndpoint = this.config.digitalOceanAgentEndpoint || '';
    this.agentAccessKey = this.config.digitalOceanAgentAccessKey || '';
    // Agent API endpoint: {AGENT_ENDPOINT}/api/v1/chat/completions
    this.agentApiUrl = this.agentEndpoint
      ? `${this.agentEndpoint}/api/v1/chat/completions`
      : '';
    this.botUserId = this.config.aiBotUserId || 'sepolia-health-ai-assistant';

    if (!this.agentEndpoint || !this.agentAccessKey) {
      this.log(
        'constructor',
        'warn',
        'DigitalOcean Agent credentials not configured',
      );
    }
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
  async processMessageAndReply(
    channelId: string,
    messageText: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _userId?: string,
  ) {
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

      // Get conversation history from Stream Chat (last 4 messages for faster response)
      const history = await this.getChannelHistory(channelId, 4);
      this.log(
        'processMessageAndReply',
        'info',
        'Processing incoming message',
        {
          channelId,
          messageText: messageText.substring(0, 100),
          historyLength: history.length,
        },
      );

      // Process with DigitalOcean Agent
      const agentResponse = await this.callAgent([
        ...history,
        { role: 'user', content: messageText },
      ]);

      this.log('processMessageAndReply', 'info', 'Received agent response', {
        hasContent: !!agentResponse.content,
        contentLength: agentResponse.content?.length || 0,
        contentPreview: agentResponse.content?.substring(0, 100) || '',
        hasToolCalls: !!(agentResponse.toolCalls?.length),
        toolCallsCount: agentResponse.toolCalls?.length || 0,
      });

      // Execute tools if needed - với recursive handling
      const finalResponse = await this.processAgentResponseWithTools(
        agentResponse,
        [...history, { role: 'user', content: messageText }],
        0, // iteration count
        5, // max iterations để tránh infinite loop
      );

      // Log suy nghĩ của AI (nếu có) để debug - giữ lại để xem cách Bot suy nghĩ
      this.extractAndLogAIThought(finalResponse);

      // Làm sạch response trước khi gửi cho user (loại bỏ <think>...</think>)
      this.log(
        'processMessageAndReply',
        'debug',
        'Raw final response before cleaning',
        {
          contentLength: finalResponse.length,
          preview: finalResponse.substring(0, 200),
        },
      );
      const cleanedResponse = this.cleanResponse(finalResponse);
      this.log(
        'processMessageAndReply',
        'info',
        'Final cleaned response ready',
        {
          hasContent: !!cleanedResponse,
          contentLength: cleanedResponse.length,
          isEmpty: cleanedResponse.trim().length === 0,
          preview: cleanedResponse.substring(0, 200),
        },
      );

      // Stop typing
      await channel.sendEvent({
        type: 'typing.stop',
        user_id: this.botUserId,
      });

      let response = cleanedResponse;
      if (messageText.toLowerCase() === 'tra ve unknown') {
        response = 'unknown';
      }

      // Send bot reply (đã làm sạch, không có <think>...</think>)
      await channel.sendMessage({
        text: response,
        user_id: this.botUserId,
      });

      this.log(
        'processMessageAndReply',
        'info',
        'Message processed and sent successfully',
        {
          channelId,
          responseLength: cleanedResponse.length,
        },
      );

      return {
        response: cleanedResponse,
        timestamp: new Date().toISOString(),
      };
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

  /**
   * Process agent response với recursive tool calls handling
   * Xử lý tool calls một cách đệ quy cho đến khi có text response
   */
  private async processAgentResponseWithTools(
    agentResponse: { content?: string; toolCalls?: ToolCall[] },
    conversationHistory: AgentMessage[],
    iteration: number,
    maxIterations: number,
  ): Promise<string> {
    // Nếu không có tool calls, trả về content ngay
    if (
      !agentResponse.toolCalls ||
      !Array.isArray(agentResponse.toolCalls) ||
      agentResponse.toolCalls.length === 0
    ) {
      return agentResponse.content || '';
    }

    // Kiểm tra max iterations để tránh infinite loop
    if (iteration >= maxIterations) {
      this.log(
        'processAgentResponseWithTools',
        'warn',
        'Max iterations reached',
        {
          iteration,
          maxIterations,
        },
      );
      return (
        agentResponse.content ||
        'Xin lỗi, hệ thống đang xử lý quá nhiều bước. Vui lòng thử lại với câu hỏi đơn giản hơn.'
      );
    }

    this.log(
      'processAgentResponseWithTools',
      'info',
      `Executing tools (iteration ${iteration + 1}/${maxIterations})`,
      {
        toolCalls: agentResponse.toolCalls.map((tc) => ({
          name: tc.name,
          parameters: tc.parameters,
        })),
      },
    );

    // Execute tools
    const toolResults = await this.executeTools(agentResponse.toolCalls);

    this.log(
      'processAgentResponseWithTools',
      'info',
      'Tool execution completed',
      {
        iteration: iteration + 1,
        resultsCount: toolResults.length,
        results: toolResults.map((r) => ({
          id: r.id,
          hasOutput: !!r.output,
          outputStatus: r.output?.status,
        })),
      },
    );

    // Kiểm tra xem tool có cần "hỏi lại" không (disambiguation)
    const disambiguation = toolResults.find(
      (r) => r.output?.status === 'disambiguation_needed',
    );

    if (disambiguation) {
      // Nếu cần hỏi lại, trả về câu hỏi của Tool (không gọi AI lại)
      const data = disambiguation.output;
      const response = `${data.message} ${data.question}`;
      this.log(
        'processAgentResponseWithTools',
        'info',
        'Disambiguation needed from tool',
        {
          response: response.substring(0, 200),
        },
      );
      return response;
    }

    // Kiểm tra xem tool có formattedMessage không (ưu tiên dùng trực tiếp)
    const formattedMessageResult = toolResults.find(
      (r) => r.output?.formattedMessage,
    );

    if (formattedMessageResult) {
      // Nếu có formattedMessage, trả về trực tiếp mà không cần gọi AI lại
      const formattedResponse = formattedMessageResult.output.formattedMessage;
      this.log(
        'processAgentResponseWithTools',
        'info',
        'Using formattedMessage from tool directly',
        {
          toolName: agentResponse.toolCalls?.find(
            (tc) => tc.id === formattedMessageResult.id,
          )?.name,
          responseLength: formattedResponse.length,
          preview: formattedResponse.substring(0, 200),
        },
      );
      return formattedResponse;
    }

    // Gọi lại agent với tool results
    this.log(
      'processAgentResponseWithTools',
      'info',
      'Calling agent with tool results',
      {
        iteration: iteration + 1,
        toolResultsCount: toolResults.length,
      },
    );
    const nextAgentResponse = await this.callAgentWithToolResults(
      conversationHistory,
      agentResponse.toolCalls,
      toolResults,
    );

    this.log(
      'processAgentResponseWithTools',
      'info',
      'Agent response after tool results',
      {
        iteration: iteration + 1,
        hasContent: !!nextAgentResponse.content,
        contentLength: nextAgentResponse.content?.length || 0,
        contentPreview: nextAgentResponse.content?.substring(0, 100) || '',
        hasToolCalls: !!(nextAgentResponse.toolCalls?.length),
        toolCallsCount: nextAgentResponse.toolCalls?.length || 0,
      },
    );

    // Nếu response có content, trả về ngay (có thể kết hợp với tool calls)
    if (
      nextAgentResponse.content &&
      nextAgentResponse.content.trim().length > 0
    ) {
      return nextAgentResponse.content;
    }

    // Nếu vẫn có tool calls, tiếp tục recursive
    if (
      nextAgentResponse.toolCalls &&
      Array.isArray(nextAgentResponse.toolCalls) &&
      nextAgentResponse.toolCalls.length > 0
    ) {
      // Cập nhật conversation history với tool results
      const updatedHistory: AgentMessage[] = [
        ...conversationHistory,
        {
          role: 'assistant',
          content: '',
          tool_calls: agentResponse.toolCalls,
        },
        {
          role: 'user',
          content: `Tool execution results:\n${toolResults
            .map((r) => {
              const toolCall = agentResponse.toolCalls?.find(
                (tc) => tc.id === r.id,
              );
              const toolName = toolCall?.name || 'unknown';
              return `Tool: ${toolName}\nResult: ${JSON.stringify(r.output)}`;
            })
            .join('\n\n')}`,
        },
      ];

      return this.processAgentResponseWithTools(
        nextAgentResponse,
        updatedHistory,
        iteration + 1,
        maxIterations,
      );
    }

    // Fallback: nếu không có content và không có tool calls
    return (
      nextAgentResponse.content ||
      'Xin lỗi, tôi không thể xử lý yêu cầu này. Vui lòng thử lại với thông tin rõ ràng hơn.'
    );
  }

  /**
   * Process message và return response (không reply vào channel)
   * Dùng cho direct API call
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async processMessage(messageText: string, _userId?: string) {
    try {
      const agentResponse = await this.callAgent([
        { role: 'user', content: messageText },
      ]);

      // Sử dụng helper function để xử lý recursive tool calls
      const finalResponse = await this.processAgentResponseWithTools(
        agentResponse,
        [{ role: 'user', content: messageText }],
        0,
        5,
      );

      // Log suy nghĩ của AI (nếu có) để debug - giữ lại để xem cách Bot suy nghĩ
      this.extractAndLogAIThought(finalResponse);

      // Làm sạch response trước khi trả về (loại bỏ <think>...</think>)
      this.log(
        'processMessage',
        'debug',
        'Raw final response before cleaning',
        {
          contentLength: finalResponse.length,
          preview: finalResponse.substring(0, 200),
        },
      );
      const cleanedResponse = this.cleanResponse(finalResponse);
      this.log('processMessage', 'info', 'Final cleaned response', {
        contentLength: cleanedResponse.length,
        preview: cleanedResponse.substring(0, 200),
      });

      return {
        response: cleanedResponse,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.log('processMessage', 'error', 'Error processing message', error);
      return {
        response: 'Xin lỗi, có lỗi xảy ra. Vui lòng thử lại sau.',
        error: error.message,
      };
    }
  }

  /**
   * Loại bỏ thẻ <think>...</think> hoặc <think>...</think> VÀ các ký tự Markdown rác
   */
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

  /**
   * Extract và log suy nghĩ của AI (để debug) - giữ lại để xem cách Bot suy nghĩ
   */
  private extractAndLogAIThought(content: string): void {
    if (!content) return;
    // Hỗ trợ cả <think> và <think>
    const thinkMatch =
      content.match(/<think>([\s\S]*?)<\/think>/) ||
      content.match(/<think>([\s\S]*?)<\/think>/);
    if (thinkMatch) {
      this.log(
        'extractAndLogAIThought',
        'debug',
        'AI reasoning process extracted',
        {
          thoughtLength: thinkMatch[1].trim().length,
          preview: thinkMatch[1].trim().substring(0, 300),
        },
      );
    }
  }

  /**
   * Get conversation history from Stream Chat channel
   */
  private async getChannelHistory(
    channelId: string,
    limit = 20,
  ): Promise<AgentMessage[]> {
    try {
      const channel = this.streamClient.channel('messaging', channelId);
      const result = await channel.query({
        messages: { limit },
      });

      // Convert Stream Chat messages to Agent format
      const messages: AgentMessage[] = result.messages.map((msg) => ({
        role: msg.user?.id === this.botUserId ? 'assistant' : 'user',
        content: msg.text || '',
      }));

      this.log('getChannelHistory', 'debug', 'Retrieved channel history', {
        channelId,
        limit,
        messagesCount: messages.length,
      });

      return messages;
    } catch (error) {
      this.log('getChannelHistory', 'error', 'Failed to get channel history', {
        channelId,
        error: error.message,
      });
      return [];
    }
  }

  /**
   * Call DigitalOcean Agent
   */
  private async callAgent(messages: AgentMessage[]) {
    try {
      // 1. TẠO NGỮ CẢNH ĐỘNG
      const now = new Date();
      const formattedDate = new Intl.DateTimeFormat('vi-VN', {
        dateStyle: 'full',
        timeStyle: 'short',
        timeZone: 'Asia/Ho_Chi_Minh', // Đảm bảo đúng múi giờ
      }).format(now);

      // Tạo "Calendar Strip" cho 14 ngày tới (tuần này và tuần sau) để AI không phải tính toán
      const getCalendarStrip = (date: Date) => {
        const result: string[] = [];
        for (let i = -2; i < 12; i++) {
          const d = addDays(date, i);
          const dayName = format(d, 'EEEE', { locale: vi });
          const dateStr = format(d, 'dd/MM/yyyy');
          const isToday = i === 0;
          result.push(`${dayName} (${dateStr}${isToday ? ' - Hôm nay' : ''})`);
        }
        return result.join(', ');
      };

      const calendarStrip = getCalendarStrip(now);

      this.log('callAgent', 'debug', 'Dynamic Context prepared', {
        today: formattedDate,
        calendarStrip,
      });

      const dynamicContext: AgentMessage = {
        role: 'system',
        content: `Bạn là Trợ lý Y tế ảo của Hệ thống Đặt lịch Phòng khám (năm hiện tại là 2026).
Nhiệm vụ: Hỗ trợ người dùng tìm kiếm phòng khám, dịch vụ và đặt lịch hẹn với bác sĩ.

QUY TẮC QUAN TRỌNG VỀ THỜI GIAN:
1. LUÔN dựa vào "Calendar Strip" dưới đây để xác định thứ/ngày. 
2. Calendar Strip (14 ngày tới): ${calendarStrip}
3. Thời điểm hiện tại: ${formattedDate}
4. AI TUYỆT ĐỐI KHÔNG TỰ TÍNH TOÁN NGÀY. Nếu người dùng nói "thứ 3 tuần tới", hãy nhìn vào Calendar Strip để lấy đúng ngày YYYY-MM-DD.
   GHI CHÚ MAPPING THỨ TRONG TUẦN (Tiếng Việt -> Thứ):
   - Thứ 2 = Monday
   - Thứ 3 = Tuesday
   - Thứ 4 = Wednesday
   - Thứ 5 = Thursday
   - Thứ 6 = Friday
   - Thứ 7 = Saturday
   - Chủ nhật = Sunday
5. BẮT BUỘC DÙNG TOOL: Bạn KHÔNG ĐƯỢC tự bịa ra hay phỏng đoán lịch trống của bác sĩ. Nếu người dùng hỏi về lịch rảnh, bạn BẮT BUỘC phải gọi tool thích hợp.
6. ƯU TIÊN TOOL: Nếu người dùng nhắc ĐÍCH DANH tên bác sĩ (Ví dụ: "BST Vương Hữu Canh", "Bác sĩ Canh"), bạn BẮT BUỘC phải gọi tool 'check_doctor_schedule'. TUYỆT ĐỐI KHÔNG dùng tool 'find_available_doctors' khi đã biết tên bác sĩ trừ khi được yêu cầu tìm nhiều bác sĩ khác.
7. THAM SỐ TOOL: Trong 'check_doctor_schedule', 'doctorId' phải là số. Nếu chỉ biết tên, hãy truyền vào 'doctorName' và để trống 'doctorId'.
8. ĐỊNH DẠNG TRẢ LỜI: Khi có kết quả từ tool, hãy dùng nội dung từ trường 'message' của tool để trả lời. TUYỆT ĐỐI KHÔNG tự sáng tạo giờ giấc khác.`,
      };

      // 2. TẠO REQUEST BODY (thêm dynamicContext vào ĐẦU mảng)
      const requestBody = {
        messages: [dynamicContext, ...messages],
        temperature: 0.1, // Giảm temperature để AI bớt "sáng tạo" và nhanh hơn
        max_tokens: 1000,
      };

      const response = await axios.post(this.agentApiUrl, requestBody, {
        headers: {
          Authorization: `Bearer ${this.agentAccessKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 60000, // Tăng lên 60s để tránh timeout khi AI suy nghĩ sâu
      });
      
      this.log('callAgent', 'debug', 'Raw Agent Response', {
        status: response.status,
        message: response.data.choices?.[0]?.message?.content?.substring(0, 100) || 'No content',
        toolCalls: response.data.choices?.[0]?.message?.tool_calls?.length || 0,
      });

      const message = response.data.choices?.[0]?.message;
      if (!message) {
        return {
          content: 'Lỗi kết nối Agent.',
          toolCalls: [],
        };
      }

      let content = message.content || '';
      // Đảm bảo toolCalls luôn là array
      let toolCalls = Array.isArray(message.tool_calls)
        ? message.tool_calls
        : [];

      // --- BẮT ĐẦU HEALER V4 (ULTIMATE) ---

      // 1. Tạo bản sao content sạch
      const contentForParsing = content
        .replace(/<think>[\s\S]*?<\/think>/g, '')
        .trim();

      // 2. Danh sách các tool hợp lệ (để đối chiếu)
      const validTools = [
        'search_clinics',
        'search_services',
        'search_doctors',
        'check_doctor_schedule',
        'find_available_doctors',
      ];

      const hasJsonIntent =
        (!toolCalls || toolCalls.length === 0) &&
        contentForParsing.includes('{') &&
        (contentForParsing.includes('tool') ||
          contentForParsing.includes('search') ||
          contentForParsing.includes('check'));

      if (hasJsonIntent) {
        try {
          this.log(
            'callAgent',
            'debug',
            '[AI Healer] Analyzing unusual JSON structure',
          );
          // Regex tìm JSON object (có thể bị cắt cụt)
          let jsonMatch = contentForParsing.match(/\{[\s\S]*\}/);

          // Nếu không tìm thấy JSON hoàn chỉnh, thử tìm JSON bị cắt cụt
          if (!jsonMatch) {
            const incompleteJsonMatch = contentForParsing.match(/\{[\s\S]*$/);
            if (incompleteJsonMatch) {
              this.log(
                'callAgent',
                'debug',
                '[AI Healer] Detected truncated JSON, attempting to fix',
              );
              let incompleteJson = incompleteJsonMatch[0];

              // Đếm số ngoặc mở và đóng
              const openBraces = (incompleteJson.match(/\{/g) || []).length;
              const closeBraces = (incompleteJson.match(/\}/g) || []).length;
              const openBrackets = (incompleteJson.match(/\[/g) || []).length;
              const closeBrackets = (incompleteJson.match(/\]/g) || []).length;

              // Đóng các ngoặc còn thiếu
              const missingBraces = openBraces - closeBraces;
              const missingBrackets = openBrackets - closeBrackets;

              // Thêm các dấu đóng còn thiếu
              for (let i = 0; i < missingBrackets; i++) {
                incompleteJson += ']';
              }
              for (let i = 0; i < missingBraces; i++) {
                incompleteJson += '}';
              }

              jsonMatch = [incompleteJson];
            }
          }

          if (jsonMatch) {
            let rawJson;
            try {
              rawJson = JSON.parse(jsonMatch[0]);
            } catch (parseError) {
              this.log(
                'callAgent',
                'error',
                '[AI Healer] Failed to parse JSON (possibly truncated)',
                {
                  error: parseError.message,
                },
              );
              // Thử extract tool name và params từ JSON bị cắt
              const toolNameMatch = jsonMatch[0].match(
                /"name"\s*:\s*"([^"]+)"/,
              );

              if (toolNameMatch && validTools.includes(toolNameMatch[1])) {
                const toolName = toolNameMatch[1];
                let params = {};

                // Thử extract locationName hoặc các params khác
                const locationMatch = jsonMatch[0].match(
                  /"locationName"\s*:\s*"([^"]+)"/,
                );
                if (locationMatch) {
                  params = { locationName: locationMatch[1] };
                }

                this.log(
                  'callAgent',
                  'info',
                  `[AI Healer] Fixed truncated JSON`,
                  {
                    toolName,
                    params,
                  },
                );
                toolCalls = [
                  {
                    id: `call_healed_${Date.now()}`,
                    name: toolName,
                    parameters: params,
                  },
                ];
                content = '';
                return {
                  content: '',
                  toolCalls: toolCalls,
                };
              }
              throw parseError;
            }
            let detectedToolName: string | null = null;
            let detectedParams: any = {};

            // --- LOGIC DÒ TÌM TOOL (Quét sâu) ---

            // Helper function để đệ quy tìm tool name trong object
            const findToolInObject = (obj: any, depth = 0) => {
              if (depth > 2 || typeof obj !== 'object' || obj === null) return;

              const keys = Object.keys(obj);
              for (const key of keys) {
                // Case 1: Key chính là tên tool (Ví dụ: { "search_clinics": {...} })
                if (validTools.includes(key)) {
                  detectedToolName = key;
                  detectedParams = obj[key];
                  return;
                }
                // Case 2: Key là "name" và value là tên tool
                if (key === 'name' && validTools.includes(obj[key])) {
                  detectedToolName = obj[key];
                  // Cố gắng tìm params ở anh em lân cận
                  detectedParams =
                    obj.parameters || obj.args || obj.arguments || {};
                  return;
                }
                // Đệ quy: Tìm tiếp trong con (Ví dụ: tool_calls -> search_clinics)
                findToolInObject(obj[key], depth + 1);
                if (detectedToolName) return;
              }
            };

            findToolInObject(rawJson);
            // -------------------------------------

            if (detectedToolName) {
              this.log(
                'callAgent',
                'info',
                `[AI Healer] Detected tool from JSON`,
                {
                  toolName: detectedToolName,
                  params: detectedParams,
                },
              );

              // Chuẩn hóa params (nếu params là string JSON)
              if (typeof detectedParams === 'string') {
                try {
                  detectedParams = JSON.parse(detectedParams);
                } catch {
                  // Giữ nguyên string nếu parse lỗi
                }
              }

              toolCalls = [
                {
                  id: `call_healed_${Date.now()}`,
                  name: detectedToolName,
                  parameters: detectedParams || {},
                },
              ];
              content = ''; // Xóa rác
            }
          }
        } catch (e) {
          this.log('callAgent', 'error', '[AI Healer] Failed to heal JSON', {
            error: e.message,
          });
        }
      }
      // --- KẾT THÚC HEALER V4 ---

      // Convert tool_calls từ API format sang ToolCall format (nếu cần)
      const toolCallsArray = Array.isArray(toolCalls) ? toolCalls : [];
      const convertedToolCalls: ToolCall[] = toolCallsArray.map((tc: any) => {
        // Nếu đã là format ToolCall rồi, giữ nguyên
        if (tc.name && tc.parameters !== undefined) {
          return tc;
        }

        // Nếu là format từ API (type: 'function', function: { name, arguments })
        if (tc.type === 'function' && tc.function) {
          try {
            return {
              id: tc.id || `call_${Date.now()}_${Math.random()}`,
              name: tc.function.name,
              parameters:
                typeof tc.function.arguments === 'string'
                  ? JSON.parse(tc.function.arguments)
                  : tc.function.arguments || {},
            };
          } catch (e) {
            this.log(
              'callAgent',
              'error',
              'Failed to parse tool call arguments',
              {
                toolCallId: tc.id,
                error: e.message,
              },
            );
            return {
              id: tc.id || `call_${Date.now()}_${Math.random()}`,
              name: tc.function.name || 'unknown',
              parameters: {},
            };
          }
        }

        // Fallback: giữ nguyên format cũ
        return {
          id: tc.id || `call_${Date.now()}_${Math.random()}`,
          name: tc.name || 'unknown',
          parameters: tc.parameters || {},
        };
      });

      const result = {
        content: content,
        toolCalls: convertedToolCalls,
      };

      this.log('callAgent', 'info', 'Agent API response processed', {
        hasContent: !!result.content,
        contentLength: result.content?.length || 0,
        contentPreview: result.content?.substring(0, 100) || '',
        toolCallsCount: result.toolCalls?.length || 0,
      });

      return result;
    } catch (error: any) {
      this.log('callAgent', 'error', 'Agent API error', {
        message: error.message,
        status: error.response?.status,
        code: error.code,
      });

      // Fallback response
      return {
        content: 'Lỗi hệ thống AI.',
        toolCalls: [],
      };
    }
  }

  /**
   * Call agent with tool results
   */
  private async callAgentWithToolResults(
    messages: AgentMessage[],
    toolCalls: ToolCall[],
    toolResults: any[],
  ) {
    this.log(
      'callAgentWithToolResults',
      'info',
      'Calling agent API with tool results',
      {
        messagesCount: messages.length,
        toolCallsCount: toolCalls.length,
        toolResultsCount: toolResults.length,
      },
    );

    // Format tool results thành một message từ user
    // Vì DigitalOcean Agent API không hỗ trợ role 'tool'
    const toolResultsContent = toolResults
      .map((result) => {
        const toolCall = toolCalls.find((tc) => tc.id === result.id);
        const toolName = toolCall?.name || 'unknown';

        // Nếu tool result có formattedMessage, ưu tiên dùng nó và yêu cầu AI dùng trực tiếp
        if (result.output?.formattedMessage) {
          return `Tool: ${toolName}\nResult (use this formatted message directly, do not reformat):\n${result.output.formattedMessage}`;
        }

        return `Tool: ${toolName}\nResult: ${JSON.stringify(result.output)}`;
      })
      .join('\n\n');

    const messagesWithToolResults: AgentMessage[] = [
      ...messages,
      {
        role: 'assistant',
        content: '',
        tool_calls: toolCalls,
      },
      {
        role: 'user',
        content: `Tool execution results:\n${toolResultsContent}`,
      },
    ];

    const response = await this.callAgent(messagesWithToolResults);
    this.log(
      'callAgentWithToolResults',
      'info',
      'Agent API response with tool results',
      {
        hasContent: !!response.content,
        contentLength: response.content?.length || 0,
        contentPreview: response.content?.substring(0, 100) || '',
        hasToolCalls: !!(response.toolCalls?.length),
        toolCallsCount: response.toolCalls?.length || 0,
      },
    );

    return response;
  }

  /**
   * Execute tools
   */
  private async executeTools(
    toolCalls: ToolCall[],
  ): Promise<Array<{ id: string; output: any }>> {
    const results: Array<{ id: string; output: any }> = [];

    for (const toolCall of toolCalls) {
      try {
        let output;

        switch (toolCall.name) {
          case 'search_clinics':
            output = await this.searchClinicsTool.execute(toolCall.parameters);
            break;

          case 'search_services':
            output = await this.searchServicesTool.execute(toolCall.parameters);
            break;

          case 'search_doctors':
            output = await this.searchDoctorsTool.execute(toolCall.parameters);
            break;

          case 'check_doctor_schedule':
            output = await this.doctorScheduleTool.execute(toolCall.parameters);
            break;

          case 'find_available_doctors':
            output = await this.findAvailableDoctorsTool.execute(
              toolCall.parameters,
            );
            break;

          default:
            output = { error: `Unknown tool: ${toolCall.name}` };
        }

        this.log('executeTools', 'debug', `Tool executed: ${toolCall.name}`, {
          toolId: toolCall.id,
          hasOutput: !!output,
          outputStatus: output?.status,
        });

        results.push({
          id: toolCall.id || Math.random().toString(),
          output,
        });
      } catch (error) {
        this.log(
          'executeTools',
          'error',
          `Tool execution failed: ${toolCall.name}`,
          {
            toolId: toolCall.id,
            error: error.message,
          },
        );
        results.push({
          id: toolCall.id || Math.random().toString(),
          output: {
            error: error.message,
            tool: toolCall.name,
          },
        });
      }
    }

    this.log('executeTools', 'info', 'All tools execution completed', {
      totalTools: toolCalls.length,
      successCount: results.filter((r) => !r.output?.error).length,
      errorCount: results.filter((r) => r.output?.error).length,
    });

    return results;
  }
}
