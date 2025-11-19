import apiClient from '../api-client';
import { VideoTokenResponse } from '@/types/video';

export const VideoAPI = {
  /**
   * Get Stream Video token from backend
   */
  getVideoToken: async (): Promise<VideoTokenResponse> => {
    const response = await apiClient.get<VideoTokenResponse>('/chat/video-token');
    return response.data;
  },
};
