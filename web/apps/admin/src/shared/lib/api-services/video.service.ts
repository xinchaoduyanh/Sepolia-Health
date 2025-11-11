import { apiClient } from '../api-client'

export interface VideoTokenResponse {
    token: string
    apiKey: string
    userId: string
}

export class VideoService {
    /**
     * Get Stream Video token from backend
     */
    static async getVideoToken(): Promise<VideoTokenResponse> {
        const response = await apiClient.get<VideoTokenResponse>('/chat/video-token')
        return response
    }
}

export const videoService = VideoService
