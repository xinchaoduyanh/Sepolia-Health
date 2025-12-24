'use client'

import { useAuth } from '@/shared/hooks/useAuth'
import { NotificationData } from '@/types/notification'
import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react'
import { Channel } from 'stream-chat'
import { useChat } from './ChatContext'

interface NotificationContextType {
    notifications: NotificationData[]
    unreadCount: number
    isReady: boolean
    markAsRead: (notificationId: string) => Promise<void>
    refreshNotifications: () => Promise<void>
    notificationChannel?: Channel
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
    const { user } = useAuth()
    const { client, isConnected } = useChat()
    const [notifications, setNotifications] = useState<NotificationData[]>([])
    const [notificationChannel, setNotificationChannel] = useState<Channel>()
    const [isReady, setIsReady] = useState(false)

    // Transform Stream message to notification format
    const transformStreamMessageToNotification = useCallback(
        (message: any, channel?: Channel): NotificationData => {
            const metadata = message.metadata || {}
            let status = metadata.status || message.status || 'UNREAD'

            // Check if message is read based on channel state
            if (status === 'UNREAD' && channel && user) {
                const readState = channel.state.read[user.id.toString()]
                if (readState && new Date(message.created_at) <= new Date(readState.last_read)) {
                    status = 'READ'
                }
            }

            return {
                id: message.id || '',
                type: metadata.notificationType || message.type || 'SYSTEM_NOTIFICATION',
                priority: metadata.priority || message.priority || 'MEDIUM',
                status: status,
                title: metadata.title || message.title || '',
                message: message.text || '',
                metadata: metadata,
                createdAt: message.created_at || new Date().toISOString(),
                readAt: status === 'READ' ? message.updated_at || new Date().toISOString() : undefined,
            }
        },
        [user],
    )

    // Load notifications from channel
    const loadNotifications = useCallback(
        async (channel: Channel) => {
            try {
                const response = await channel.query({
                    messages: { limit: 50, offset: 0 },
                })

                if (response.messages) {
                    const transformedNotifications = response.messages
                        .map(msg => transformStreamMessageToNotification(msg, channel))
                        // Filter out deprecated message types if necessary, or just map all
                        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

                    setNotifications(transformedNotifications)
                }
            } catch (error) {
                console.error('Error loading notifications:', error)
            }
        },
        [transformStreamMessageToNotification],
    )

    // Initialize notification channel when chat is ready
    useEffect(() => {
        if (!client || !isConnected || !user) {
            setIsReady(false)
            if (notificationChannel) {
                try {
                    notificationChannel.off()
                } catch (e) {
                    // ignore
                }
                setNotificationChannel(undefined)
            }
            setNotifications([])
            return
        }

        if (client.userID !== user.id.toString()) {
            console.warn('User mismatch in NotificationContext')
            return
        }

        let isCancelled = false

        const initNotifications = async () => {
            try {
                const channelId = `notifications_${user.id}`
                const channel = client.channel('messaging', channelId)

                await channel.watch()

                if (isCancelled) return

                setNotificationChannel(channel)
                await loadNotifications(channel)

                const handleNewMessage = (event: any) => {
                    if (event.channel_id === channelId && event.message) {
                        const newNotification = transformStreamMessageToNotification(event.message, channel)
                        setNotifications(prev => [newNotification, ...prev])
                    }
                }

                const handleMessageUpdated = (event: any) => {
                    if (event.channel_id === channelId && event.message) {
                        const updatedNotification = transformStreamMessageToNotification(event.message, channel)
                        setNotifications(prev =>
                            prev.map(n => (n.id === updatedNotification.id ? updatedNotification : n)),
                        )
                    }
                }

                channel.on('message.new', handleNewMessage)
                channel.on('message.updated', handleMessageUpdated)
                // Listen to read events to update status in real-time
                channel.on('message.read', () => {
                    loadNotifications(channel)
                })

                setIsReady(true)
            } catch (error) {
                console.error('Failed to initialize notifications:', error)
                setIsReady(false)
            }
        }

        initNotifications()

        return () => {
            isCancelled = true
            // Cleanup handled by logic above if dependencies change
        }
    }, [client, isConnected, user, loadNotifications, transformStreamMessageToNotification])

    // Mark notification as read
    const markAsRead = async (notificationId: string) => {
        if (!notificationChannel || !user) return

        try {
            // Since we cannot use API and regular users cannot update message metadata directly
            // we will use channel markRead to clear unread count
            await notificationChannel.markRead()

            // And update local state optimistically
            const readAt = new Date().toISOString()
            setNotifications(prev =>
                prev.map(n => ({
                    ...n,
                    status: 'READ',
                    readAt: n.readAt || readAt,
                })),
            )
        } catch (error) {
            console.error('Error marking notification as read:', error)
            // Optimistic update fallback
            setNotifications(prev =>
                prev.map(n =>
                    n.id === notificationId ? { ...n, status: 'READ', readAt: new Date().toISOString() } : n,
                ),
            )
        }
    }

    // Refresh notifications
    const refreshNotifications = async () => {
        if (notificationChannel) {
            await loadNotifications(notificationChannel)
        }
    }

    const unreadCount = notifications.filter(n => n.status === 'UNREAD').length

    const value: NotificationContextType = {
        notifications,
        unreadCount,
        isReady,
        markAsRead,
        refreshNotifications,
        notificationChannel,
    }

    return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
}

export const useNotification = () => {
    const context = useContext(NotificationContext)
    if (!context) {
        throw new Error('useNotification must be used within a NotificationProvider')
    }
    return context
}
