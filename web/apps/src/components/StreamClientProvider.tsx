'use client'

import { ChatProvider, useChat } from '@/contexts/ChatContext'
import { NotificationProvider } from '@/contexts/NotificationContext'
import { useAuth } from '@/shared/hooks/useAuth'
import { chatService } from '@/shared/lib/api-services'
import { getUserProfile } from '@/shared/lib/user-profile'
import { useEffect, useState } from 'react'

const STREAM_CHAT_API_KEY = process.env.NEXT_PUBLIC_STREAM_CHAT_API_KEY || ''

function StreamConnectionManager({ children }: { children: React.ReactNode }) {
    const { connectUser, isConnected } = useChat()
    const { user } = useAuth()
    const [isConnecting, setIsConnecting] = useState(false)

    useEffect(() => {
        const connect = async () => {
            if (!user || isConnected || isConnecting) return

            try {
                setIsConnecting(true)
                const userId = user.id.toString()
                const userProfile = getUserProfile(user)

                // Only connect if we have a valid user
                if (!userId) return

                // console.log('Getting chat token for notification...')
                const token = await chatService.getToken()

                await connectUser(userId, token, userProfile.name, userProfile.image)
            } catch (error) {
                console.error('Failed to connect to Stream Chat for notifications:', error)
            } finally {
                setIsConnecting(false)
            }
        }

        connect()
    }, [user, isConnected, isConnecting, connectUser])

    return <>{children}</>
}

export function StreamClientProvider({ children }: { children: React.ReactNode }) {
    if (!STREAM_CHAT_API_KEY) {
        console.warn('Stream Chat API Key is missing, notifications will not work')
        return <>{children}</>
    }

    return (
        <ChatProvider apiKey={STREAM_CHAT_API_KEY}>
            <StreamConnectionManager>
                <NotificationProvider>{children}</NotificationProvider>
            </StreamConnectionManager>
        </ChatProvider>
    )
}
