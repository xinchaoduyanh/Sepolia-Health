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
      console.warn('DigitalOcean Agent credentials not configured');
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
      console.log('📥 [Chatbot] Processing message:', {
        channelId,
        messageText,
        historyLength: history.length,
      });

      // Process with DigitalOcean Agent
      const agentResponse = await this.callAgent([
        ...history,
        { role: 'user', content: messageText },
      ]);

      console.log('🤖 [Chatbot] Agent response:', {
        hasContent: !!agentResponse.content,
        contentLength: agentResponse.content?.length || 0,
        contentPreview: agentResponse.content?.substring(0, 100) || '',
        hasToolCalls: !!agentResponse.toolCalls,
        toolCallsCount: agentResponse.toolCalls?.length || 0,
      });

      // Execute tools if needed
      let finalResponse = agentResponse.content || '';

      if (
        agentResponse.toolCalls &&
        Array.isArray(agentResponse.toolCalls) &&
        agentResponse.toolCalls.length > 0
      ) {
        console.log('🔧 [Chatbot] Executing tools:', {
          toolCalls: agentResponse.toolCalls.map((tc) => ({
            name: tc.name,
            parameters: tc.parameters,
          })),
        });

        const toolResults = await this.executeTools(agentResponse.toolCalls);

        console.log('✅ [Chatbot] Tool results:', {
          resultsCount: toolResults.length,
          results: toolResults.map((r) => ({
            id: r.id,
            hasOutput: !!r.output,
            outputStatus: r.output?.status,
          })),
        });

        // Kiểm tra xem tool có cần "hỏi lại" không (disambiguation)
        const disambiguation = toolResults.find(
          (r) => r.output?.status === 'disambiguation_needed',
        );

        if (disambiguation) {
          // Nếu cần hỏi lại, trả về câu hỏi của Tool (không gọi AI lại)
          const data = disambiguation.output;
          finalResponse = `${data.message} ${data.question}`;
          console.log('❓ [Chatbot] Disambiguation needed:', finalResponse);
        } else {
          // Nếu không cần hỏi lại, tiếp tục như cũ
          console.log('🔄 [Chatbot] Calling agent with tool results...');
          const finalAgentResponse = await this.callAgentWithToolResults(
            [...history, { role: 'user', content: messageText }],
            agentResponse.toolCalls,
            toolResults,
          );

          finalResponse = finalAgentResponse.content || '';
          console.log('✅ [Chatbot] Final agent response:', {
            hasContent: !!finalResponse,
            contentLength: finalResponse.length,
            contentPreview: finalResponse.substring(0, 100),
          });
        }
      }

      // Log suy nghĩ của AI (nếu có) để debug - giữ lại để xem cách Bot suy nghĩ
      this.extractAndLogAIThought(finalResponse);

      // Làm sạch response trước khi gửi cho user (loại bỏ <think>...</think>)
      console.log('🧠 [AI Thought Process2.1]:', finalResponse);
      const cleanedResponse = this.cleanResponse(finalResponse);
      console.log('🧠 [AI Thought Process3]:', cleanedResponse);
      console.log('📤 [Chatbot] Final response (cleaned):', {
        hasContent: !!cleanedResponse,
        contentLength: cleanedResponse.length,
        isEmpty: cleanedResponse.trim().length === 0,
        content: cleanedResponse,
      });

      // Stop typing
      await channel.sendEvent({
        type: 'typing.stop',
        user_id: this.botUserId,
      });

      // Send bot reply (đã làm sạch, không có <think>...</think>)
      await channel.sendMessage({
        text: cleanedResponse,
        user_id: this.botUserId,
      });

      return {
        response: cleanedResponse,
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      console.error('Process message and reply error:', {
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
        console.error('Error sending error message:', sendError);
      }

      // Return error response instead of throwing
      return {
        response: errorMessage,
        timestamp: new Date().toISOString(),
      };
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

      // Log suy nghĩ của AI (nếu có) để debug - giữ lại để xem cách Bot suy nghĩ
      this.extractAndLogAIThought(finalResponse);

      // Làm sạch response trước khi trả về (loại bỏ <think>...</think>)
      console.log('🧠 [AI Thought Process1]:', finalResponse);
      const cleanedResponse = this.cleanResponse(finalResponse);
      console.log('🧠 [AI Thought Process2]:', cleanedResponse);
      return {
        response: cleanedResponse,
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
   * Loại bỏ thẻ <think>...</think> hoặc <think>...</think> VÀ các ký tự Markdown rác
   */
  private cleanResponse(content: string): string {
    if (!content) return '';

    // 1. Xóa thẻ <think> (hỗ trợ cả <think> và <think>, đều đóng bằng </think>)
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
    const thinkMatch = content.match(/<think>([\s\S]*?)<\/think>/);
    if (thinkMatch) {
      console.log('🧠 [AI Thought Process]:', thinkMatch[1].trim());
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
        content: `Hôm nay: ${formattedDate}. Trả lời ngắn gọn, súc tích.`,
      };

      // 2. TẠO REQUEST BODY (thêm dynamicContext vào ĐẦU mảng)
      const requestBody = {
        messages: [dynamicContext, ...messages],
        temperature: 0.7, // Tăng temperature để response nhanh hơn
        max_tokens: 1000, // Đủ tokens để hoàn thành JSON tool_calls (tối thiểu 800-1000)
      };

      const response = await axios.post(this.agentApiUrl, requestBody, {
        headers: {
          Authorization: `Bearer ${this.agentAccessKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000, // Giảm timeout xuống 30s để response nhanh hơn
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
      ];

      const hasJsonIntent =
        (!toolCalls || toolCalls.length === 0) &&
        contentForParsing.includes('{') &&
        (contentForParsing.includes('tool') ||
          contentForParsing.includes('search') ||
          contentForParsing.includes('check'));

      if (hasJsonIntent) {
        try {
          console.log('⚠️ [AI Healer] Đang phân tích cấu trúc JSON lạ...');
          // Regex tìm JSON object (có thể bị cắt cụt)
          let jsonMatch = contentForParsing.match(/\{[\s\S]*\}/);

          // Nếu không tìm thấy JSON hoàn chỉnh, thử tìm JSON bị cắt cụt
          if (!jsonMatch) {
            const incompleteJsonMatch = contentForParsing.match(/\{[\s\S]*$/);
            if (incompleteJsonMatch) {
              console.log(
                '⚠️ [AI Healer] Phát hiện JSON bị cắt cụt, đang thử fix...',
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
              console.error(
                '❌ [AI Healer] Không thể parse JSON (có thể bị cắt cụt):',
                parseError.message,
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

                console.log(`✅ [AI Healer] Đã fix JSON bị cắt: ${toolName}`);
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
              console.log(
                `✅ [AI Healer] Đã bắt dính tool: ${String(detectedToolName)}`,
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
          console.error('❌ [AI Healer] Thất bại:', e.message);
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
            console.error('Error parsing tool call arguments:', e);
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

      console.log('🔵 [Agent API] Response processed:', {
        hasContent: !!result.content,
        contentLength: result.content?.length || 0,
        contentPreview: result.content?.substring(0, 100) || '',
        toolCallsCount: result.toolCalls?.length || 0,
      });

      return result;
    } catch (error: any) {
      console.error('Agent API Error:', error.message);

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
    console.log('🔄 [Agent API] Calling with tool results:', {
      messagesCount: messages.length,
      toolCallsCount: toolCalls.length,
      toolResultsCount: toolResults.length,
    });

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

    const response = await this.callAgent(messagesWithToolResults);
    console.log('✅ [Agent API] Response with tool results:', {
      hasContent: !!response.content,
      contentLength: response.content?.length || 0,
      contentPreview: response.content?.substring(0, 100) || '',
    });

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
