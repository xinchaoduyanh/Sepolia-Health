'use client'

import { useState, useEffect, useMemo } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@workspace/ui/components/Avatar'
import { Button } from '@workspace/ui/components/Button'
import { X, Phone, Video, MoreVertical, Users } from 'lucide-react'
import { useChat } from '@/contexts/ChatContext'
import { useVideo } from '@/contexts/VideoContext'
import { useAuth } from '@/shared/hooks/useAuth'
import { Channel, MessageList, MessageInput, Window, Thread } from 'stream-chat-react'
import type { Channel as StreamChannel, MessageResponse } from 'stream-chat'
import { toast } from '@workspace/ui/components/Sonner'
import { IncomingCallNotification } from '@/components/video/IncomingCallNotification'
import { getWebChatUserInfo, getChatChannelNameFromLastMessage, getUserInitials } from '@/lib/chat-user-data'

interface ChatWindowProps {
    channelId: string
    onClose: () => void
}

export function ChatWindow({ channelId, onClose }: ChatWindowProps) {
    const { getChannel, isConnected, client: chatClient } = useChat()
    const { startAudioCall, startVideoCall, isConnected: isVideoConnected } = useVideo()
    const { user } = useAuth()
    const [channel, setChannel] = useState<StreamChannel | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [showChannelInfo, setShowChannelInfo] = useState(false)
    const [incomingCall, setIncomingCall] = useState<{
        callId: string
        callType: 'audio' | 'video'
        callerName: string
        channelId: string
    } | null>(null)

    // Get channel info using shared utility
    const [channelInfo, setChannelInfo] = useState<{ name: string; avatar: string | null; members: string[]; isOnline: boolean } | null>(null)

    useEffect(() => {
        if (!channel || !user) {
            setChannelInfo(null)
            return
        }

        const loadChannelInfo = async () => {
            try {
                // Priority: Get name from last message sender (patientProfile data)
                const name = await getChatChannelNameFromLastMessage(channel, String(user.id))

                // Get the actual user info from last message (NOT current user)
                const lastMessage = channel.state?.messages?.[channel.state.messages.length - 1]
                let userImage: string | null = null
                let targetUserId = ''

                // Find a message from the other user (not current user)
                let otherUserMessage: MessageResponse | null = null
                for (let i = channel.state.messages.length - 1; i >= 0; i--) {
                    const msg = channel.state.messages[i]
                    if (msg?.user?.id && msg.user.id !== String(user.id) && msg.user?.name) {
                        otherUserMessage = msg
                        break
                    }
                }

                if (otherUserMessage?.user) {
                    userImage = otherUserMessage.user.image || null
                    targetUserId = otherUserMessage.user.id
                    console.log('✅ ChatWindow using other user message:', otherUserMessage.user.name)
                } else {
                    // Fallback: get user info from channel members (other user)
                    const userInfo = await getWebChatUserInfo(channel, String(user.id), undefined, undefined)
                    userImage = userInfo.image
                    targetUserId = userInfo.userId
                    console.log('⚡ ChatWindow using channel member data:', userInfo.name)
                }

                const members = channel.state.members ? Object.values(channel.state.members) : []
                const memberIds = members.map(member => member.user_id).filter(id => id !== undefined)
                const isOnline = channel.state.watcher_count ? channel.state.watcher_count > 0 : false

                console.log('✅ ChatWindow channel info loaded:', name)

                setChannelInfo({
                    name,
                    avatar: userImage,
                    members: memberIds,
                    isOnline
                })
            } catch (error) {
                console.warn('Failed to load channel info:', error)
                // Fallback to cached data
                const members = channel.state.members ? Object.values(channel.state.members) : []
                const otherMember = members.find(member => member.user_id !== String(user.id))
                const name = otherMember?.user?.name || otherMember?.user?.id || 'Cuộc trò chuyện'
                const avatar = otherMember?.user?.image || null
                const memberIds = members.map(member => member.user_id).filter(id => id !== undefined)
                const isOnline = channel.state.watcher_count ? channel.state.watcher_count > 0 : false

                setChannelInfo({ name, avatar, members: memberIds, isOnline })
            }
        }

        loadChannelInfo()
    }, [channel, user])

    const handleAudioCall = async () => {
        if (!isVideoConnected) {
            toast.error({ title: 'Lỗi', description: 'Dịch vụ gọi điện chưa sẵn sàng' })
            return
        }
        if (!channelId) return

        try {
            // Get other user ID from channel
            const otherUserId = channelInfo?.members?.find(id => id !== String(user?.id))
            await startAudioCall(channelId, chatClient, otherUserId)
        } catch (error) {
            console.error('Failed to start audio call:', error)
            toast.error({ title: 'Lỗi', description: 'Không thể bắt đầu cuộc gọi' })
        }
    }

    const handleVideoCall = async () => {
        if (!isVideoConnected) {
            toast.error({ title: 'Lỗi', description: 'Dịch vụ video call chưa sẵn sàng' })
            return
        }
        if (!channelId) return

        try {
            // Get other user ID from channel
            const otherUserId = channelInfo?.members?.find(id => id !== String(user?.id))
            await startVideoCall(channelId, chatClient, otherUserId)
        } catch (error) {
            console.error('Failed to start video call:', error)
            toast.error({ title: 'Lỗi', description: 'Không thể bắt đầu video call' })
        }
    }

    useEffect(() => {
        const loadChannel = async () => {
            if (!isConnected || !channelId) return

            try {
                setLoading(true)
                setError(null)
                const channelInstance = await getChannel(channelId)
                if (channelInstance) {
                    setChannel(channelInstance)
                } else {
                    setError('Không thể tải cuộc trò chuyện')
                }
            } catch (error) {
                console.error('Failed to load channel:', error)
                setError('Đã xảy ra lỗi khi tải cuộc trò chuyện')
            } finally {
                setLoading(false)
            }
        }

        loadChannel()

        // Cleanup
        return () => {
            if (channel) {
                channel.stopWatching().catch(err => console.error('Error stopping watch:', err))
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isConnected, channelId])

    // Listen for call notifications in messages
    useEffect(() => {
        if (!channel || !user) return
        // Store channelId in a local variable to help TypeScript understand it's defined
        const currentChannelId = channelId
        if (!currentChannelId) return

        const handleNewMessage = (event: any) => {
            const message: MessageResponse = event.message
            // Only process messages from other users
            if (message.user?.id === String(user.id)) return

            const text = message.text || ''
            // Check if message contains call notification
            const callIdMatch = text.match(/CALL_ID:([^\s]+)/)
            const callTypeMatch = text.match(/CALL_TYPE:(audio|video)/)

            if (callIdMatch && callTypeMatch) {
                const callId = callIdMatch[1]
                const callType = callTypeMatch[1] as 'audio' | 'video'

                // Get caller name with fallback
                const userName = message.user?.name
                const channelName = channelInfo?.name
                const finalCallerName = userName || channelName || 'Người gọi'

                // TypeScript assertion to ensure it's a string
                const callerName = finalCallerName as string

                console.log('📞 Incoming call detected:', { callId, callType, callerName, channelId: currentChannelId })
                // TypeScript: currentChannelId is checked to be truthy above, so it's a string
                setIncomingCall({
                    callId: callId as string,
                    callType,
                    callerName,
                    channelId: currentChannelId as string,
                })
                console.log('✅ IncomingCallNotification state set, notification should appear')
            }
        }

        channel.on('message.new', handleNewMessage)

        return () => {
            channel.off('message.new', handleNewMessage)
        }
    }, [channel, user, channelInfo, channelId])

    // getInitials is now imported from @/lib/chat-user-data

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center bg-background dark:bg-gray-900">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-3"></div>
                    <p className="text-sm text-muted-foreground">Đang tải cuộc trò chuyện...</p>
                </div>
            </div>
        )
    }

    if (error || !channel) {
        return (
            <div className="h-full flex items-center justify-center bg-background dark:bg-gray-900">
                <div className="text-center p-6">
                    <div className="text-red-500 mb-4">
                        <X className="h-12 w-12 mx-auto" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground dark:text-gray-100 mb-2">
                        Không thể tải cuộc trò chuyện
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">{error}</p>
                    <Button onClick={onClose} variant="outline">
                        Đóng
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
            {/* Incoming Call Notification */}
            {incomingCall && (
                <IncomingCallNotification
                    callId={incomingCall.callId}
                    callType={incomingCall.callType}
                    callerName={incomingCall.callerName}
                    channelId={incomingCall.channelId}
                    onClose={() => {
                        console.log('🚪 Closing IncomingCallNotification')
                        setIncomingCall(null)
                    }}
                />
            )}

            <Channel channel={channel}>
                <Window>
                    {/* Chat Header - Improved Layout */}
                    <div className="flex-shrink-0 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
                        {/* Top row - Avatar, Name, and Actions */}
                        <div className="flex items-center justify-between px-4 py-3">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                <Avatar className="h-12 w-12 flex-shrink-0 ring-2 ring-white dark:ring-gray-700">
                                    <AvatarImage
                                        src={channelInfo?.avatar || undefined}
                                        alt={channelInfo?.name}
                                    />
                                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white font-semibold text-base">
                                        {channelInfo ? getUserInitials(channelInfo.name) : 'NA'}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
                                        {channelInfo?.name || 'Chat với bệnh nhân'}
                                    </h2>
                                </div>
                            </div>

                            <div className="flex items-center gap-1 flex-shrink-0">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleAudioCall}
                                    className="hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
                                    aria-label="Gọi điện"
                                >
                                    <Phone className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleVideoCall}
                                    className="hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
                                    aria-label="Video call"
                                >
                                    <Video className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setShowChannelInfo(!showChannelInfo)}
                                    className="hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
                                    aria-label="Thông tin"
                                >
                                    <MoreVertical className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={onClose}
                                    className="md:hidden hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
                                    aria-label="Đóng"
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        {/* Bottom row - Status and Info */}
                        <div className="px-4 pb-3 flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-1.5">
                                <div
                                    className={`h-2 w-2 rounded-full ${
                                        channelInfo?.isOnline
                                            ? 'bg-green-500 shadow-sm shadow-green-500'
                                            : 'bg-gray-400 dark:bg-gray-500'
                                    }`}
                                />
                                <span
                                    className={`text-sm font-medium ${
                                        channelInfo?.isOnline
                                            ? 'text-green-600 dark:text-green-400'
                                            : 'text-gray-500 dark:text-gray-400'
                                    }`}
                                >
                                    {channelInfo?.isOnline ? 'Đang hoạt động' : 'Offline'}
                                </span>
                            </div>

                            {channelInfo?.members && channelInfo.members.length > 0 && (
                                <>
                                    <span className="text-gray-300 dark:text-gray-600">|</span>
                                    <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                                        <Users className="h-4 w-4" />
                                        <span className="text-sm">{channelInfo.members.length} thành viên</span>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Messages Area with Internal Scroll */}
                    <div className="flex-1 overflow-hidden">
                        <MessageList />
                    </div>

                    {/* Message Input */}
                    <div className="flex-shrink-0">
                        <MessageInput placeholder="Nhập tin nhắn" />
                    </div>
                </Window>

                {/* Thread Panel (only shows when a thread is opened) */}
                <Thread />

                {/* Channel Info Sidebar (optional) */}
                {showChannelInfo && (
                    <div className="absolute right-0 top-0 bottom-0 w-80 bg-background dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 shadow-lg z-10 overflow-y-auto">
                        <div className="p-4">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-semibold text-foreground dark:text-gray-100">Thông tin chi tiết</h3>
                                <Button variant="ghost" size="sm" onClick={() => setShowChannelInfo(false)}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>

                            <div className="space-y-4">
                                {/* Channel name */}
                                <div>
                                    <p className="text-xs text-muted-foreground mb-1">Tên cuộc trò chuyện</p>
                                    <p className="text-sm font-medium text-foreground dark:text-gray-100">
                                        {channelInfo?.name}
                                    </p>
                                </div>

                                {/* Members */}
                                {channelInfo?.members && channelInfo.members.length > 0 && (
                                    <div>
                                        <p className="text-xs text-muted-foreground mb-2">
                                            Thành viên ({channelInfo.members.length})
                                        </p>
                                        <div className="space-y-2">
                                            {channelInfo.members.map(memberId => (
                                                <div key={memberId} className="flex items-center gap-2">
                                                    <Avatar className="h-8 w-8">
                                                        <AvatarFallback className="bg-gray-200 dark:bg-gray-700 text-xs">
                                                            {memberId?.slice(0, 2).toUpperCase()}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <span className="text-sm text-foreground dark:text-gray-100">
                                                        {memberId}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </Channel>
        </div>
    )
}
