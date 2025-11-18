import { Inject, Injectable } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { StreamChat } from 'stream-chat';
import axios from 'axios';
import { appConfig } from '@/common/config';
import { PrismaService } from '@/common/prisma/prisma.service';
import { DoctorScheduleTool } from './tools/doctor-schedule.tool';
import { SearchDoctorsTool } from './tools/search-doctors.tool';
import { SearchClinicsTool } from './tools/search-clinics.tool';
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
      console.warn('⚠️ DigitalOcean Agent credentials not configured');
    } else {
      console.log('✅ DigitalOcean Agent configured:', {
        agentEndpoint: this.agentEndpoint,
        agentApiUrl: this.agentApiUrl,
        accessKeyLength: this.agentAccessKey.length,
        accessKeyPrefix: this.agentAccessKey.substring(0, 10) || 'N/A',
      });
    }
  }

  /**
   * Create AI bot user trong Stream Chat (run once during setup)
   */
  async createAIBotUser() {
    try {
      await this.streamClient.upsertUser({
        id: this.botUserId,
        name: 'Trợ lý AI Sepolia',
        role: 'user',
        image: 'https://api.dicebear.com/7.x/bottts/svg?seed=ai-assistant',
      });

      return {
        success: true,
        message: 'AI bot user created successfully',
        botUserId: this.botUserId,
      };
    } catch (error) {
      console.error('Create bot user error:', error);
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
        name: 'Trợ lý AI Sepolia',
        role: 'user',
        image: 'https://api.dicebear.com/7.x/bottts/svg?seed=ai-assistant',
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

      return {
        channelId,
        cid: channel.cid,
        message: 'Channel created and welcome message sent',
      };
    } catch (error) {
      console.error('Create AI channel error:', error);
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
      // Get channel
      const channel = this.streamClient.channel('messaging', channelId);

      // Show typing indicator
      await channel.sendEvent({
        type: 'typing.start',
        user_id: this.botUserId,
      });

      // Get conversation history from Stream Chat (last 10 messages)
      const history = await this.getChannelHistory(channelId, 10);

      // Process with DigitalOcean Agent
      const agentResponse = await this.callAgent([
        ...history,
        { role: 'user', content: messageText },
      ]);

      // Execute tools if needed
      let finalResponse = agentResponse.content;

      if (agentResponse.toolCalls && agentResponse.toolCalls.length > 0) {
        const toolResults = await this.executeTools(agentResponse.toolCalls);

        // Kiểm tra xem tool có cần "hỏi lại" không (disambiguation)
        const disambiguation = toolResults.find(
          (r) => r.output?.status === 'disambiguation_needed',
        );

        if (disambiguation) {
          // Nếu cần hỏi lại, trả về câu hỏi của Tool (không gọi AI lại)
          const data = disambiguation.output;
          finalResponse = `${data.message} ${data.question}`;
        } else {
          // Nếu không cần hỏi lại, tiếp tục như cũ
          const finalAgentResponse = await this.callAgentWithToolResults(
            [...history, { role: 'user', content: messageText }],
            agentResponse.toolCalls,
            toolResults,
          );

          finalResponse = finalAgentResponse.content;
        }
      }

      // Stop typing
      await channel.sendEvent({
        type: 'typing.stop',
        user_id: this.botUserId,
      });

      // Send bot reply
      await channel.sendMessage({
        text: finalResponse,
        user_id: this.botUserId,
      });

      return { success: true };
    } catch (error) {
      console.error('Process message error:', error);

      // Send error message
      try {
        const channel = this.streamClient.channel('messaging', channelId);
        await channel.sendMessage({
          text: 'Xin lỗi, có lỗi xảy ra khi xử lý tin nhắn của bạn. Vui lòng thử lại sau.',
          user_id: this.botUserId,
        });
      } catch (sendError) {
        console.error('Error sending error message:', sendError);
      }

      throw error;
    }
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

      let finalResponse = agentResponse.content;

      if (agentResponse.toolCalls && agentResponse.toolCalls.length > 0) {
        const toolResults = await this.executeTools(agentResponse.toolCalls);

        // Kiểm tra xem tool có cần "hỏi lại" không (disambiguation)
        const disambiguation = toolResults.find(
          (r) => r.output?.status === 'disambiguation_needed',
        );

        if (disambiguation) {
          // Nếu cần hỏi lại, trả về câu hỏi của Tool (không gọi AI lại)
          const data = disambiguation.output;
          finalResponse = `${data.message} ${data.question}`;
        } else {
          // Nếu không cần hỏi lại, tiếp tục như cũ
          const finalAgentResponse = await this.callAgentWithToolResults(
            [{ role: 'user', content: messageText }],
            agentResponse.toolCalls,
            toolResults,
          );
          finalResponse = finalAgentResponse.content;
        }
      }

      return {
        response: finalResponse,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Process message error:', error);
      return {
        response: 'Xin lỗi, có lỗi xảy ra. Vui lòng thử lại sau.',
        error: error.message,
      };
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
      return result.messages.map((msg) => ({
        role: msg.user?.id === this.botUserId ? 'assistant' : 'user',
        content: msg.text || '',
      }));
    } catch (error) {
      console.error('Get channel history error:', error);
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

      const dynamicContext: AgentMessage = {
        role: 'system',
        content: `--- NGỮ CẢNH ĐỘNG (DYNAMIC CONTEXT) ---\nHôm nay là: ${formattedDate}.\nHãy sử dụng thông tin này để trả lời chủ động và gợi ý lịch hẹn cho người dùng.\n--- HẾT NGỮ CẢNH ---`,
      };

      // 2. TẠO REQUEST BODY (thêm dynamicContext vào ĐẦU mảng)
      const requestBody = {
        messages: [dynamicContext, ...messages], // <-- SỬA Ở ĐÂY
        temperature: 0.7,
        max_tokens: 2000,
      };

      // Log đầy đủ trước khi gọi API
      console.log('🔵 [Agent API] Request Details:', {
        url: this.agentApiUrl,
        agentEndpoint: this.agentEndpoint,
        accessKeyLength: this.agentAccessKey?.length || 0,
        accessKeyPrefix: this.agentAccessKey?.substring(0, 10) || 'N/A',
        messagesCount: requestBody.messages.length, // Cập nhật count
        requestBody: JSON.stringify(requestBody, null, 2),
      });

      const response = await axios.post(this.agentApiUrl, requestBody, {
        headers: {
          Authorization: `Bearer ${this.agentAccessKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000, // 30 seconds
      });

      // Log response thành công
      console.log('✅ [Agent API] Response Success:', {
        status: response.status,
        statusText: response.statusText,
        data: JSON.stringify(response.data, null, 2),
        headers: response.headers,
      });

      // -----------------------------------------------------------
      // --- BẮT ĐẦU PHẦN SỬA LỖI (DEFENSIVE CODING) ---
      // -----------------------------------------------------------

      const message = response.data.choices?.[0]?.message;
      if (!message) {
        console.error('❌ [Agent API] Response không có message body.');
        return {
          content: 'Xin lỗi, tôi đang gặp sự cố. Vui lòng thử lại sau.',
          toolCalls: [],
        };
      }

      let content = message.content || '';
      let toolCalls = message.tool_calls || [];

      // KIỂM TRA LỖI "LAI" (HYBRID): Nếu AI trả về CẢ text VÀ JSON string
      if (
        (!toolCalls || toolCalls.length === 0) &&
        content.includes('tool_calls') &&
        content.includes('{')
      ) {
        console.warn(
          '⚠️ [Agent API] AI trả về tool_calls trong content (dạng lai). Đang sửa lỗi...',
        );

        // Dùng Regex để "moi" phần JSON { ... } ra
        const jsonMatch = content.match(/(\{[\s\S]*\})/);

        if (jsonMatch && jsonMatch[1]) {
          try {
            // Thử parse cái JSON vừa "moi" được
            const parsedContent = JSON.parse(jsonMatch[1]);

            // Gán lại giá trị cho đúng
            // Nếu content gốc chỉ có JSON, content mới sẽ là ""
            // Nếu content gốc là "text... {JSON}", content mới sẽ là "text..."
            content = content.substring(0, jsonMatch.index).trim();
            toolCalls = parsedContent.tool_calls || [];

            console.log('✅ [Agent API] Đã sửa lỗi AI (lai) thành công.');
          } catch {
            console.error(
              '❌ [Agent API] AI trả về JSON string không hợp lệ trong content.',
              jsonMatch[1],
            );
            // Giữ nguyên content lỗi để debug
          }
        }
      }

      return {
        content: content,
        toolCalls: toolCalls,
      };

      // -----------------------------------------------------------
      // --- KẾT THÚC PHẦN SỬA LỖI ---
      // -----------------------------------------------------------
    } catch (error) {
      // Log error đầy đủ
      const errorDetails = {
        message: error.message,
        code: error.code,
        status: error.response?.status,
        statusText: error.response?.statusText,
        responseData: error.response?.data,
        responseHeaders: error.response?.headers,
        requestUrl: this.agentApiUrl,
        requestAgentEndpoint: this.agentEndpoint,
        requestConfig: {
          url: error.config?.url,
          method: error.config?.method,
          headers: {
            ...error.config?.headers,
            Authorization: error.config?.headers?.Authorization
              ? `${error.config.headers.Authorization.substring(0, 20)}...`
              : 'N/A',
          },
          data: error.config?.data,
        },
      };

      console.error(
        '❌ [Agent API] Error Details:',
        JSON.stringify(errorDetails, null, 2),
      );

      // Xử lý các loại lỗi cụ thể
      let errorMessage =
        'Xin lỗi, tôi đang gặp sự cố kết nối. Vui lòng thử lại sau.';

      if (error.code === 'ENOTFOUND') {
        console.error(
          '🔴 [Agent API] DNS Error - Không tìm thấy domain:',
          this.agentEndpoint,
        );
        console.error(
          '💡 Hướng dẫn:',
          '\n1. Kiểm tra DIGITALOCEAN_AGENT_ENDPOINT trong .env file',
          '\n2. Đảm bảo endpoint có format: https://xxx.agents.do-ai.run',
          '\n3. Kiểm tra Agent đã được deploy và active trong DigitalOcean dashboard',
          '\n4. Lấy endpoint mới từ DigitalOcean Agent dashboard → Settings → Endpoint',
        );
        errorMessage =
          'Xin lỗi, không thể kết nối đến AI Agent. Vui lòng kiểm tra cấu hình endpoint.';
      } else if (error.response?.status === 401) {
        console.error(
          '🔴 [Agent API] Authentication Error - Access key không hợp lệ',
        );
        console.error(
          '💡 Hướng dẫn:',
          '\n1. Kiểm tra DIGITALOCEAN_AGENT_ACCESS_KEY trong .env file',
          '\n2. Đảm bảo access key không có khoảng trắng ở đầu/cuối',
          '\n3. Lấy access key mới từ DigitalOcean Agent dashboard → Settings → Access Keys',
          '\n4. Đảm bảo access key có quyền truy cập vào agent endpoint này',
        );
        errorMessage =
          'Xin lỗi, lỗi xác thực với AI Agent. Vui lòng kiểm tra cấu hình access key.';
      } else if (error.response?.status === 404) {
        console.error('🔴 [Agent API] Not Found - Endpoint không tồn tại');
        errorMessage =
          'Xin lỗi, không tìm thấy AI Agent endpoint. Vui lòng kiểm tra cấu hình.';
      }

      // Fallback response
      return {
        content: errorMessage,
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
    // Format tool results thành một message từ user
    // Vì DigitalOcean Agent API không hỗ trợ role 'tool'
    const toolResultsContent = toolResults
      .map((result) => {
        const toolCall = toolCalls.find((tc) => tc.id === result.id);
        const toolName = toolCall?.name || 'unknown';
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

    return this.callAgent(messagesWithToolResults);
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
          default:
            output = { error: `Unknown tool: ${toolCall.name}` };
        }

        results.push({
          id: toolCall.id || Math.random().toString(),
          output,
        });
      } catch (error) {
        console.error(`Tool execution error (${toolCall.name}):`, error);
        results.push({
          id: toolCall.id || Math.random().toString(),
          output: {
            error: error.message,
            tool: toolCall.name,
          },
        });
      }
    }

    return results;
  }
}
