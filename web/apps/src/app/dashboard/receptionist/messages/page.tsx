'use client'

import { useState, useEffect } from 'react'
import { ChatInbox } from '@/components/chat/ChatInbox'
import { ChatWindow } from '@/components/chat/ChatWindow'
import { CallModal } from '@/components/video/CallModal'
import { ChatProvider, useChat } from '@/contexts/ChatContext'
import { VideoProvider, useVideo } from '@/contexts/VideoContext'
import { chatService, videoService } from '@/shared/lib/api-services'
import { useAuth } from '@/shared/hooks/useAuth'
import { getUserProfile } from '@/shared/lib/user-profile'
import { MessageSquare, AlertCircle } from 'lucide-react'

const STREAM_CHAT_API_KEY = process.env.NEXT_PUBLIC_STREAM_CHAT_API_KEY || ''
const STREAM_VIDEO_API_KEY = process.env.NEXT_PUBLIC_STREAM_VIDEO_API_KEY || ''

function MessagesContent() {
    const { connectUser } = useChat()
    const { connectUser: connectVideoUser } = useVideo()
    const { user } = useAuth()
    const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null)
    const [authLoading, setAuthLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const initializeChat = async () => {
            if (!user) {
                setAuthLoading(false)
                return
            }

            try {
                setError(null)
                const userId = user.id.toString()
                const userProfile = getUserProfile(user)

                console.log('Getting chat token...')
                const token = await chatService.getToken()

                console.log('Connecting user to Stream Chat...')
                await connectUser(userId, token, userProfile.name, userProfile.image)
                console.log('Successfully connected to Stream Chat')

                // Also initialize video if API key is available
                if (STREAM_VIDEO_API_KEY) {
                    try {
                        console.log('Getting video token...')
                        const videoTokenResponse = await videoService.getVideoToken()

                        console.log('Connecting user to Stream Video...')
                        await connectVideoUser(userId, videoTokenResponse.token, userProfile.name, userProfile.image)
                        console.log('Successfully connected to Stream Video')
                    } catch (videoError) {
                        console.error('Failed to initialize video:', videoError)
                        // Don't block chat if video fails
                    }
                }
            } catch (error) {
                console.error('Failed to initialize chat:', error)
                setError('Không thể kết nối đến hệ thống chat. Vui lòng thử lại sau.')
            } finally {
                setAuthLoading(false)
            }
        }

        initializeChat()
    }, [connectUser, connectVideoUser, user])

    if (authLoading) {
        return (
            <div className="h-full flex items-center justify-center bg-background dark:bg-gray-900">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-3"></div>
                    <p className="text-sm text-muted-foreground">Đang kết nối...</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="h-full flex items-center justify-center bg-background dark:bg-gray-900">
                <div className="text-center p-6 max-w-md">
                    <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
                    <h3 className="text-lg font-semibold text-foreground dark:text-gray-100 mb-2">Lỗi kết nối</h3>
                    <p className="text-sm text-muted-foreground mb-4">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Thử lại
                    </button>
                </div>
            </div>
        )
    }

    return (
        <>
            <div className="absolute inset-0 flex overflow-hidden bg-background dark:bg-gray-900">
                {/* Chat Inbox - Bên trái với fixed width */}
                <div className="flex-shrink-0 w-80 border-r border-gray-200 dark:border-gray-700 bg-background dark:bg-gray-800 h-full overflow-hidden">
                    <ChatInbox onSelectChannel={setSelectedChannelId} selectedChannelId={selectedChannelId} />
                </div>

                {/* Chat Window - Bên phải chiếm phần còn lại */}
                <div className="flex-1 h-full overflow-hidden">
                    {selectedChannelId ? (
                        <ChatWindow channelId={selectedChannelId} onClose={() => setSelectedChannelId(null)} />
                    ) : (
                        <div className="h-full flex items-center justify-center bg-background dark:bg-gray-900">
                            <div className="text-center p-8">
                                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-blue-50 dark:bg-blue-900/20 mb-4">
                                    <MessageSquare className="h-10 w-10 text-blue-600 dark:text-blue-400" />
                                </div>
                                <h3 className="text-xl font-semibold text-foreground dark:text-gray-100 mb-2">
                                    Chọn cuộc trò chuyện
                                </h3>
                                <p className="text-sm text-muted-foreground max-w-sm">
                                    Chọn một cuộc trò chuyện từ danh sách bên trái để bắt đầu nhắn tin với bệnh nhân
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Global Call Modal */}
            <CallModal />
        </>
    )
}

export default function ReceptionistMessagesPage() {
    if (!STREAM_CHAT_API_KEY) {
        return (
            <div className="h-full flex items-center justify-center bg-background dark:bg-gray-900">
                <div className="text-center p-6 max-w-md">
                    <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
                    <h3 className="text-lg font-semibold text-foreground dark:text-gray-100 mb-2">Thiếu cấu hình</h3>
                    <p className="text-sm text-muted-foreground">
                        Vui lòng cấu hình{' '}
                        <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                            NEXT_PUBLIC_STREAM_CHAT_API_KEY
                        </code>{' '}
                        trong file .env
                    </p>
                </div>
            </div>
        )
    }

    return (
        <ChatProvider apiKey={STREAM_CHAT_API_KEY}>
            <VideoProvider apiKey={STREAM_VIDEO_API_KEY || STREAM_CHAT_API_KEY}>
                <MessagesContent />
            </VideoProvider>
        </ChatProvider>
    )
}
