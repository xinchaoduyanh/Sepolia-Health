export interface NotificationData {
    id: string
    type: string
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
    status: 'UNREAD' | 'READ' | 'ARCHIVED'
    title: string
    message: string
    metadata?: Record<string, any>
    createdAt: string
    readAt?: string
}
