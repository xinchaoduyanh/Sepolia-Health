import { apiClient } from '@/lib/api-client';

export interface ChatChannel {
  channelId: string;
  name: string;
  lastMessage?: any;
  unreadCount: number;
  lastMessageAt?: string;
  members: string[];
}

export interface Clinic {
  id: number;
  name: string;
  address: string;
  phone?: string;
}

export interface ChatChannelResponse {
  channelId: string;
  clinicName: string;
  members: number;
  streamToken: string;
}

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
