import { apiClient } from '../api-client'

export interface ChatChannel {
    channelId: string
    name: string
    lastMessage?: any
    unreadCount: number
    lastMessageAt?: string
    members: string[]
}

export interface Clinic {
    id: number
    name: string
    address: string
    phone?: string
}

export interface ChatChannelResponse {
    channelId: string
    clinicName: string
    members: number
    streamToken: string
}

export interface UserSearchResult {
    id: number
    email: string
    name: string
    avatar?: string
    role: string
}

export interface DirectChatChannelResponse {
    channelId: string
    targetUserName: string
    members: number
    streamToken: string
}

export class ChatService {
    static async getChannels(): Promise<ChatChannel[]> {
        // apiClient.get already unwraps the response
        const response = await apiClient.get<ChatChannel[]>('/chat/channels')
        return response
    }

    static async getToken(): Promise<string> {
        // apiClient.get already unwraps the response, so response is { token, userId }
        const response = await apiClient.get<{ token: string; userId: string }>('/chat/token')
        return response.token
    }

    static async getClinics(): Promise<Clinic[]> {
        // apiClient.get already unwraps the response
        const response = await apiClient.get<Clinic[]>('/chat/clinics')
        return response
    }

    static async startChat(clinicId: number): Promise<ChatChannelResponse> {
        // apiClient.post already unwraps the response
        const response = await apiClient.post<ChatChannelResponse>('/chat/start', { clinicId })
        return response
    }

    static async searchUser(email: string): Promise<UserSearchResult> {
        // apiClient.post already unwraps the response
        const response = await apiClient.post<UserSearchResult>('/chat/search-user', { email })
        return response
    }

    static async startDirectChat(email: string): Promise<DirectChatChannelResponse> {
        // apiClient.post already unwraps the response
        const response = await apiClient.post<DirectChatChannelResponse>('/chat/start-direct', { email })
        return response
    }
}

export const chatService = ChatService
