import { apiClient } from '@/lib/api-client';
import { StreamChat, Channel } from 'stream-chat';
import { ChatChannel, Clinic, ChatChannelResponse } from '@/types/chat';

export class ChatAPI {
  static async getChannels(): Promise<ChatChannel[]> {
    const response = await apiClient.get('/chat/channels');
    return response.data;
  }

  static async getToken(): Promise<string> {
    const response = await apiClient.get('/chat/token');
    return response.data.token;
  }

  static async getClinics(): Promise<Clinic[]> {
    const response = await apiClient.get('/chat/clinics');
    return response.data;
  }

  static async startChat(clinicId: number): Promise<ChatChannelResponse> {
    const response = await apiClient.post('/chat/start', { clinicId });
    return response.data;
  }
}

export class ChatService {
  private static client: StreamChat | null = null;

  static setClient(client: StreamChat | null) {
    this.client = client;
  }

  static async fetchUserChannels(): Promise<Channel[]> {
    if (!this.client) {
      throw new Error('Chat client not initialized');
    }

    const userChannels = await this.client.queryChannels(
      {
        members: { $in: [this.client.userID!] },
      },
      { last_message_at: -1 }, // Sort by last message
      {
        state: true, // Load channel state including members
        watch: true, // Watch for realtime updates
        limit: 20,
        message_limit: 30, // Load last 30 messages with user info
      }
    );

    return userChannels;
  }

  static isClientReady(): boolean {
    return this.client !== null && this.client.userID !== null;
  }

  static getClient(): StreamChat | null {
    return this.client;
  }
}
