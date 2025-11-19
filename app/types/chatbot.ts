// Chatbot types

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
