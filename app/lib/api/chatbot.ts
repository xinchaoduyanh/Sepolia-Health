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
   * Xác nhận đặt lịch (bấm nút trong tin nhắn xác nhận). BE tự chạy confirm_booking
   * (đã handle slot_taken/draft_expired) và gửi tin nhắn kết quả vào channel.
   */
  static async confirmBooking(channelId: string): Promise<{ response: string }> {
    const response = await apiClient.post<{ response: string }>('/chatbot/confirm', { channelId });
    return response.data;
  }

  /**
   * Từ chối / huỷ bản nháp (hoặc xác nhận huỷ lịch).
   */
  static async cancelBooking(channelId: string): Promise<{ response: string }> {
    const response = await apiClient.post<{ response: string }>('/chatbot/cancel', { channelId });
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
