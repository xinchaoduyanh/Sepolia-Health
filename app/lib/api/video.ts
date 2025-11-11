import apiClient from '../api-client';

export interface VideoTokenResponse {
  token: string;
  apiKey: string;
  userId: string;
}

export const VideoAPI = {
  /**
   * Get Stream Video token from backend
   */
  getVideoToken: async (): Promise<VideoTokenResponse> => {
    const response = await apiClient.get<VideoTokenResponse>('/chat/video-token');
    return response.data;
  },
};
