import { Inject, Injectable } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { StreamChat } from 'stream-chat';
import axios from 'axios';
import { appConfig } from '@/common/config';
import { DoctorScheduleTool } from './tools/doctor-schedule.tool';
import { HealthAdviceTool } from './tools/health-advice.tool';

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
  private readonly agentId: string;
  private readonly apiToken: string;
  private readonly botUserId: string;

  constructor(
    @Inject(appConfig.KEY)
    private readonly config: ConfigType<typeof appConfig>,
    private readonly doctorScheduleTool: DoctorScheduleTool,
    private readonly healthAdviceTool: HealthAdviceTool,
  ) {
    // Initialize Stream Chat
    this.streamClient = StreamChat.getInstance(
      this.config.streamChatApiKey,
      this.config.streamChatSecret,
    );

    // DigitalOcean Agent config
    this.agentId = process.env.DIGITALOCEAN_AGENT_ID || '';
    this.apiToken = process.env.DIGITALOCEAN_API_TOKEN || '';
    this.agentApiUrl = `https://api.digitalocean.com/v2/ai/agents/${this.agentId}/chat`;
    this.botUserId = process.env.AI_BOT_USER_ID || 'ai-assistant';

    if (!this.agentId || !this.apiToken) {
      console.warn('⚠️ DigitalOcean Agent credentials not configured');
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
   * Process message và reply trong Stream Chat
   */
  async processMessageAndReply(
    channelId: string,
    messageText: string,
    userId: string,
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

        // Call agent again with tool results
        const finalAgentResponse = await this.callAgentWithToolResults(
          [...history, { role: 'user', content: messageText }],
          agentResponse.toolCalls,
          toolResults,
        );

        finalResponse = finalAgentResponse.content;
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
  async processMessage(messageText: string, _userId?: string) {
    try {
      const agentResponse = await this.callAgent([
        { role: 'user', content: messageText },
      ]);

      let finalResponse = agentResponse.content;

      if (agentResponse.toolCalls && agentResponse.toolCalls.length > 0) {
        const toolResults = await this.executeTools(agentResponse.toolCalls);
        const finalAgentResponse = await this.callAgentWithToolResults(
          [{ role: 'user', content: messageText }],
          agentResponse.toolCalls,
          toolResults,
        );
        finalResponse = finalAgentResponse.content;
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
      const response = await axios.post(
        this.agentApiUrl,
        {
          messages,
          temperature: 0.7,
          max_tokens: 2000,
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiToken}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000, // 30 seconds
        },
      );

      return {
        content: response.data.message?.content || response.data.content || '',
        toolCalls: response.data.message?.tool_calls || [],
      };
    } catch (error) {
      console.error('Agent API error:', error.response?.data || error.message);

      // Fallback response
      return {
        content: 'Xin lỗi, tôi đang gặp sự cố kết nối. Vui lòng thử lại sau.',
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
    const messagesWithToolResults: AgentMessage[] = [
      ...messages,
      {
        role: 'assistant',
        content: '',
        tool_calls: toolCalls,
      },
      ...toolResults.map((result) => ({
        role: 'tool' as const,
        tool_call_id: result.id,
        content: JSON.stringify(result.output),
      })),
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
          case 'check_doctor_schedule':
            output = await this.doctorScheduleTool.execute(toolCall.parameters);
            break;

          case 'get_health_advice':
            output = await this.healthAdviceTool.execute(toolCall.parameters);
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
