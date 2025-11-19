// Chat-related types

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
