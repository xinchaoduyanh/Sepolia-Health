'use client'

import { useState, useEffect } from 'react'
import { ChatInbox } from '@/components/chat/ChatInbox'
import { ChatWindow } from '@/components/chat/ChatWindow'
import { ChatProvider, useChat } from '@/contexts/ChatContext'
import { chatService } from '@/shared/lib/api-services'
import { useAuth } from '@/shared/hooks/useAuth'
import { getUserProfile } from '@/shared/lib/user-profile'
import { MessageSquare } from 'lucide-react'

const STREAM_CHAT_API_KEY = process.env.NEXT_PUBLIC_STREAM_CHAT_API_KEY || 'your-api-key-here'

function MessagesContent() {
    const { connectUser, isConnected } = useChat()
    const { user } = useAuth()
    const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null)
    const [authLoading, setAuthLoading] = useState(true)

    useEffect(() => {
        const initializeChat = async () => {
            if (!user) return

            try {
                const userId = user.id.toString()
                const userProfile = getUserProfile(user)

                const token = await chatService.getToken()

                await connectUser(userId, token, userProfile.name, userProfile.image)
            } catch (error) {
                console.error('Failed to initialize chat:', error)
            } finally {
                setAuthLoading(false)
            }
        }

        initializeChat()
    }, [connectUser, user])

    if (authLoading) {
        return (
            <div className="h-screen flex items-center justify-center bg-background dark:bg-gray-900">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    return (
        <div className="h-screen flex flex-col bg-background dark:bg-gray-900">
            {/* Header */}
            <div className="flex-shrink-0 p-4 border-b border-gray-200 dark:border-gray-700 bg-background dark:bg-gray-800">
                <h1 className="text-2xl font-bold text-foreground dark:text-gray-100">Tin nhắn</h1>
                <p className="text-sm text-muted-foreground mt-1">Chat với bệnh nhân</p>
            </div>

            {/* Main Chat Layout */}
            <div className="flex-1 flex overflow-hidden">
                {/* Chat Inbox - Bên trái */}
                <div className="flex-shrink-0 w-full md:w-80 border-r border-gray-200 dark:border-gray-700 bg-background dark:bg-gray-800">
                    <ChatInbox onSelectChannel={setSelectedChannelId} selectedChannelId={selectedChannelId} />
                </div>

                {/* Chat Window - Bên phải */}
                <div className="flex-1">
                    {selectedChannelId ? (
                        <ChatWindow channelId={selectedChannelId} onClose={() => setSelectedChannelId(null)} />
                    ) : (
                        <div className="h-full flex items-center justify-center bg-background dark:bg-gray-900">
                            <div className="text-center">
                                <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                                <h3 className="text-lg font-medium text-foreground dark:text-gray-100 mb-2">
                                    Chọn cuộc trò chuyện
                                </h3>
                                <p className="text-muted-foreground">
                                    Chọn một cuộc trò chuyện từ danh sách để bắt đầu chat
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default function ReceptionistMessagesPage() {
    return (
        <ChatProvider apiKey={STREAM_CHAT_API_KEY}>
            <MessagesContent />
        </ChatProvider>
    )
}
