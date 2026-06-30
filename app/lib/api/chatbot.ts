import { apiClient } from '@/lib/api-client';
import { ProcessMessageResponse, CreateAIChannelResponse } from '@/types/chatbot';

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
   * Get AI bot user ID. PHẢI khớp với AI_BOT_USER_ID ở backend (.env).
   * Mặc định backend dùng 'ai-assistant'; có thể override qua EXPO_PUBLIC_AI_BOT_USER_ID.
   */
  static getAIBotUserId(): string {
    return process.env.EXPO_PUBLIC_AI_BOT_USER_ID || 'ai-assistant';
  }

  /**
   * Ảnh avatar bundled local cho AI bot. Dùng ảnh này thay vì URL remote lưu
   * trong Stream (bucket S3 cũ đã bị xóa nên link chết).
   */
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  static getAIBotAvatar(): number {
    return require('@/assets/avatarbot.jpg');
  }
}
