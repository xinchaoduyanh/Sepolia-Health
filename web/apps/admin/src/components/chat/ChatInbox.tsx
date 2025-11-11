'use client'

import { useState, useEffect, useCallback } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@workspace/ui/components/Avatar'
import { Badge } from '@workspace/ui/components/Badge'
import { Button } from '@workspace/ui/components/Button'
import { Input } from '@workspace/ui/components/Textfield'
import { formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale'
import { MessageCircle, Clock, Search, RefreshCw, UserPlus } from 'lucide-react'
import { cn } from '@workspace/ui/lib/utils'
import { useChat } from '@/contexts/ChatContext'
import { useAuth } from '@/shared/hooks/useAuth'
import type { Channel } from 'stream-chat'
import { UserSearchModal } from './UserSearchModal'

interface ChatInboxProps {
    onSelectChannel: (channelId: string) => void
    selectedChannelId: string | null
}

export function ChatInbox({ onSelectChannel, selectedChannelId }: ChatInboxProps) {
    const { getUserChannels, isConnected, client } = useChat()
    const { user } = useAuth()
    const [channels, setChannels] = useState<Channel[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [isSearching, setIsSearching] = useState(false)
    const [isUserSearchModalOpen, setIsUserSearchModalOpen] = useState(false)

    const loadChannels = useCallback(async () => {
        if (!isConnected) return

        try {
            setLoading(true)
            const channelData = await getUserChannels()
            setChannels(channelData)
        } catch (error) {
            console.error('Failed to load channels:', error)
            setChannels([])
        } finally {
            setLoading(false)
        }
    }, [isConnected, getUserChannels])

    useEffect(() => {
        loadChannels()
    }, [loadChannels])

    // Setup realtime updates when chat client is ready
    useEffect(() => {
        if (!client || !isConnected) {
            return
        }

        const handleChannelEvent = (event: any) => {
            console.log('Channel event received:', event.type, event.channel?.id)

            // Refresh channels when there's a new message or update
            if (event.type === 'message.new' || event.type === 'message.updated' || event.type === 'message.deleted') {
                loadChannels()
            }
        }

        // Listen to all channel events
        client.on(handleChannelEvent)

        // Cleanup
        return () => {
            client.off(handleChannelEvent)
        }
    }, [client, isConnected, loadChannels])

    const formatLastMessageTime = (timestamp?: string | Date) => {
        if (!timestamp) return ''
        try {
            return formatDistanceToNow(new Date(timestamp), {
                addSuffix: true,
                locale: vi,
            })
        } catch {
            return ''
        }
    }

    const getChannelName = (channel: Channel) => {
        if (!user) return 'Cuộc trò chuyện'

        const members = channel.state.members ? Object.values(channel.state.members) : []
        const otherMember = members.find(member => member.user_id !== String(user.id))
        return otherMember?.user?.name || otherMember?.user?.id || 'Cuộc trò chuyện'
    }

    const getLastMessage = (channel: Channel) => {
        const messages = channel.state.messages
        if (messages && messages.length > 0) {
            const lastMessage = messages[messages.length - 1]
            let messageText = 'Đã gửi tệp đính kèm'

            // Handle attachments
            if (lastMessage?.attachments?.length) {
                const attachment = lastMessage.attachments[0]
                const attachmentType = attachment?.type

                if (attachmentType === 'image') {
                    messageText = 'Đã gửi ảnh'
                } else if (attachmentType === 'video') {
                    messageText = 'Đã gửi video'
                } else {
                    messageText =
                        attachment?.title || attachment?.fallback || (attachment as any)?.name || 'Đã gửi tệp đính kèm'
                }
            } else {
                messageText = lastMessage?.text || 'Đã gửi tệp đính kèm'
            }

            // Nếu tin nhắn cuối là của chính mình thì thêm prefix "Bạn:"
            if (lastMessage?.user?.id === String(user?.id)) {
                return `Bạn: ${messageText}`
            }

            return messageText
        }
        return 'Chưa có tin nhắn'
    }

    const getUnreadCount = (channel: Channel) => {
        return channel.state.unreadCount || 0
    }

    const filteredChannels = searchQuery
        ? channels.filter(channel => {
              const name = getChannelName(channel).toLowerCase()
              const lastMessage = getLastMessage(channel).toLowerCase()
              const query = searchQuery.toLowerCase()
              return name.includes(query) || lastMessage.includes(query)
          })
        : channels

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(word => word.charAt(0))
            .join('')
            .toUpperCase()
            .slice(0, 2)
    }

    const handleSearchToggle = () => {
        setIsSearching(!isSearching)
        if (!isSearching) {
            setSearchQuery('')
        }
    }

    const handleUserSelected = async (channelId: string) => {
        // Reload channels to get the new one
        await loadChannels()
        // Select the new channel
        onSelectChannel(channelId)
    }

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center p-8 bg-background dark:bg-gray-800">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    <p className="text-sm text-muted-foreground">Đang tải...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="h-full flex flex-col bg-background dark:bg-gray-800">
            {/* Search Header */}
            <div className="flex-shrink-0 p-4 border-b border-gray-200 dark:border-gray-700 bg-background dark:bg-gray-800">
                <div className="flex items-center justify-between mb-2">
                    <h2 className="text-lg font-semibold text-foreground dark:text-gray-100">Cuộc trò chuyện</h2>
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => setIsUserSearchModalOpen(true)}>
                            <UserPlus className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={loadChannels} isDisabled={loading}>
                            <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={handleSearchToggle}>
                            <Search className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* Search Input */}
                {isSearching && (
                    <div className="mt-3">
                        <Input
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Tìm kiếm cuộc trò chuyện..."
                            className="w-full"
                            autoFocus
                        />
                    </div>
                )}
            </div>

            {/* Conversations List with Internal Scroll */}
            <div className="flex-1 overflow-y-auto">
                <div className="space-y-1 p-2">
                    {filteredChannels.length === 0 ? (
                        <div className="text-center py-12">
                            <MessageCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                            <p className="text-muted-foreground text-sm">
                                {searchQuery ? 'Không tìm thấy cuộc trò chuyện' : 'Chưa có cuộc trò chuyện nào'}
                            </p>
                        </div>
                    ) : (
                        filteredChannels.map(channel => {
                            const channelName = getChannelName(channel)
                            const lastMessage = getLastMessage(channel)
                            const unreadCount = getUnreadCount(channel)
                            const lastMessageAt = channel.state.last_message_at

                            return (
                                <div
                                    key={channel.id}
                                    onClick={() => onSelectChannel(channel.id || '')}
                                    className={cn(
                                        'flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-200',
                                        'hover:bg-gray-100 dark:hover:bg-gray-700/50',
                                        selectedChannelId === channel.id &&
                                            'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-600 shadow-sm',
                                    )}
                                >
                                    {/* Avatar */}
                                    <Avatar className="h-12 w-12 flex-shrink-0">
                                        <AvatarImage src="" alt={channelName} />
                                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white font-semibold">
                                            {getInitials(channelName)}
                                        </AvatarFallback>
                                    </Avatar>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <h3 className="font-semibold text-foreground dark:text-gray-100 truncate">
                                                {channelName}
                                            </h3>
                                            {lastMessageAt && (
                                                <span className="text-xs text-muted-foreground flex items-center gap-1 ml-2">
                                                    <Clock className="h-3 w-3" />
                                                    {formatLastMessageTime(lastMessageAt)}
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex items-center justify-between gap-2">
                                            <p className="text-sm text-muted-foreground truncate flex-1">
                                                {lastMessage}
                                            </p>

                                            {unreadCount > 0 && (
                                                <Badge
                                                    variant="destructive"
                                                    className="ml-2 h-5 min-w-5 px-1.5 rounded-full flex items-center justify-center text-xs font-bold bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 text-white border-0 shadow-sm"
                                                >
                                                    {unreadCount > 99 ? '99+' : unreadCount}
                                                </Badge>
                                            )}
                                        </div>

                                        {/* Members count */}
                                        {channel.state.members && Object.keys(channel.state.members).length > 0 && (
                                            <div className="text-xs text-muted-foreground mt-1">
                                                {Object.keys(channel.state.members).length} thành viên
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>
            </div>

            {/* User Search Modal */}
            <UserSearchModal
                open={isUserSearchModalOpen}
                onOpenChange={setIsUserSearchModalOpen}
                onUserSelected={handleUserSelected}
            />
        </div>
    )
}
