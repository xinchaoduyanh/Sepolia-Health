import { apiClient } from '@/lib/api-client';

export interface ProcessMessageResponse {
  response: string;
  timestamp: string;
  error?: string;
}

export interface CreateAIChannelResponse {
  channelId: string;
  cid: string;
  message: string;
}

export class ChatbotAPI {
  /**
   * Process message và trả về response từ AI
   * Nếu có channelId, backend sẽ tự động gửi response vào channel
   */
  static async processMessage(
    message: string,
    userId?: number,
    channelId?: string
  ): Promise<ProcessMessageResponse> {
    const response = await apiClient.post<ProcessMessageResponse>('/chatbot/process', {
      message,
      userId: userId ? String(userId) : '',
      channelId,
    });
    return response.data;
  }

  /**
   * Tạo channel với AI bot
   */
  static async createAIChannel(): Promise<CreateAIChannelResponse> {
    const response = await apiClient.post<CreateAIChannelResponse>(
      '/chatbot/setup/create-ai-channel'
    );
    return response.data;
  }

  /**
   * Get AI bot user ID (từ config hoặc API)
   * Note: Bot user ID thường là 'sepolia-health-ai-assistant' hoặc từ config
   */
  static getAIBotUserId(): string {
    // Bot user ID từ backend config
    return 'sepolia-health-ai-assistant';
  }
}
