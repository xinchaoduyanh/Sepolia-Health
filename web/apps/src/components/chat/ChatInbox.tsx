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
import { getWebChatUserInfo, getChatChannelNameFromLastMessage, getUserInitials } from '@/lib/chat-user-data'

interface ChatInboxProps {
    onSelectChannel: (channelId: string) => void
    selectedChannelId: string | null
}

export function ChatInbox({ onSelectChannel, selectedChannelId }: ChatInboxProps) {
    const { getUserChannels, isConnected, client } = useChat()
    const { user } = useAuth()
    const [channels, setChannels] = useState<Channel[]>([])
    const [channelNames, setChannelNames] = useState<Map<string, string>>(new Map())
    const [channelAvatars, setChannelAvatars] = useState<Map<string, string | null>>(new Map())
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [isSearching, setIsSearching] = useState(false)
    const [isUserSearchModalOpen, setIsUserSearchModalOpen] = useState(false)

    const loadChannels = useCallback(async () => {
        if (!isConnected) return

        try {
            setLoading(true)
            console.log('📥 Loading channels...')
            const channelData = await getUserChannels()
            setChannels(channelData)
            console.log('✅ Channels loaded:', channelData.length)
        } catch (error) {
            console.error('❌ Failed to load channels:', error)
            setChannels([])
        } finally {
            setLoading(false)
        }
    }, [isConnected, getUserChannels])

    // Load channels only once when connected
    useEffect(() => {
        if (!isConnected) return
        loadChannels()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isConnected]) // Only depend on isConnected, not loadChannels to avoid re-fetching

    // Load channel names when channels change
    useEffect(() => {
        if (!channels.length || !user) return

        const loadChannelNames = async () => {
            const names = new Map<string, string>()
            const avatars = new Map<string, string | null>()

            for (const channel of channels) {
                try {
                    const name = await getChannelName(channel)
                    names.set(channel.id || '', name)

                    // Get avatar from last message sender (not from name)
                    const lastMessage = channel.state?.messages?.[channel.state.messages.length - 1]
                    let avatarUrl: string | null = null

                    if (lastMessage?.user?.image && lastMessage.user.id !== String(user.id)) {
                        avatarUrl = lastMessage.user.image
                        console.log('✅ Avatar from last message:', lastMessage.user.name, lastMessage.user.image)
                    } else {
                        // Fallback: Try to get user info from channel members
                        try {
                            const userInfo = await getWebChatUserInfo(channel, String(user.id), undefined, undefined)
                            avatarUrl = userInfo.image
                            if (avatarUrl) {
                                console.log('⚡ Avatar from channel member data:', userInfo.name, avatarUrl)
                            }
                        } catch (error) {
                            console.warn('Failed to get user avatar info:', error)
                        }
                    }

                    avatars.set(channel.id || '', avatarUrl)
                } catch (error) {
                    console.warn('Failed to load channel name for:', channel.id, error)
                    names.set(channel.id || '', 'Cuộc trò chuyện')
                    avatars.set(channel.id || '', null)
                }
            }

            setChannelNames(names)
            setChannelAvatars(avatars)
        }

        loadChannelNames()

        // Retry avatar loading after a delay to handle cases where channel data is still loading
        const retryTimer = setTimeout(() => {
            const channelsWithoutAvatars = channels.filter(channel => {
                const channelId = channel.id || ''
                return !channelAvatars.get(channelId) && channel.state?.messages?.length === 0
            })

            if (channelsWithoutAvatars.length > 0) {
                console.log('🔄 Retrying avatar loading for', channelsWithoutAvatars.length, 'channels')
                loadChannelNames()
            }
        }, 3000) // 3 seconds delay

        return () => clearTimeout(retryTimer)
    }, [channels, user])

    // Setup realtime updates when chat client is ready
    useEffect(() => {
        if (!client || !isConnected) {
            return
        }

        const handleChannelEvent = (event: any) => {
            console.log('📨 Channel event:', event.type, event.channel?.id)

            // Only update the specific channel that changed, not refetch all channels
            // Stream SDK already handles updating channel state automatically
            if (event.type === 'message.new' || event.type === 'message.updated' || event.type === 'message.deleted') {
                const updatedChannel = event.channel
                if (updatedChannel) {
                    // Update channels list
                    setChannels(prevChannels => {
                        const channelIndex = prevChannels.findIndex(ch => ch.id === updatedChannel.id)
                        if (channelIndex >= 0) {
                            // Update existing channel and move to top
                            const updated = [...prevChannels]
                            updated.splice(channelIndex, 1)
                            return [updatedChannel, ...updated]
                        } else {
                            // New channel, add to top
                            return [updatedChannel, ...prevChannels]
                        }
                    })

                    // Update avatar when new message arrives
                    if (event.type === 'message.new') {
                        const lastMessage = updatedChannel.state?.messages?.[updatedChannel.state.messages.length - 1]
                        if (lastMessage?.user?.image && lastMessage.user.id !== String(user.id)) {
                            setChannelAvatars(prevAvatars => {
                                const updated = new Map(prevAvatars)
                                updated.set(updatedChannel.id || '', lastMessage.user.image)
                                return updated
                            })
                            console.log('✅ Real-time avatar update for message:', lastMessage.user.name)
                        }

                        // Update channel name if needed
                        const newChannelName = lastMessage?.user?.name
                        if (newChannelName && lastMessage.user.id !== String(user.id)) {
                            setChannelNames(prevNames => {
                                const updated = new Map(prevNames)
                                updated.set(updatedChannel.id || '', newChannelName)
                                return updated
                            })
                            console.log('✅ Real-time name update for message:', newChannelName)
                        }
                    }
                }
            }
        }

        // Listen to all channel events
        client.on(handleChannelEvent)

        // Cleanup
        return () => {
            client.off(handleChannelEvent)
        }
    }, [client, isConnected, user])

    // Update channel names when channels change due to events
    useEffect(() => {
        if (!channels.length || !user) return

        const updateChannelNames = async () => {
            const names = new Map<string, string>()

            for (const channel of channels) {
                if (!channelNames.has(channel.id || '')) {
                    try {
                        const name = await getChannelName(channel)
                        names.set(channel.id || '', name)
                    } catch (error) {
                        console.warn('Failed to load channel name for:', channel.id, error)
                        names.set(channel.id || '', 'Cuộc trò chuyện')
                    }
                } else {
                    // Keep existing name
                    const existingName = channelNames.get(channel.id || '')
                    if (existingName) {
                        names.set(channel.id || '', existingName)
                    }
                }
            }

            // Only update if names actually changed
            if (names.size !== channelNames.size ||
                Array.from(names.entries()).some(([key, value]) => channelNames.get(key) !== value)) {
                setChannelNames(names)
            }
        }

        updateChannelNames()
    }, [channels, user]) // Remove channelNames from dependencies

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

    const getChannelName = async (channel: Channel) => {
        if (!user) return 'Cuộc trò chuyện'

        try {
            // Priority: Get name from last message sender (patientProfile data)
            const name = await getChatChannelNameFromLastMessage(channel, String(user.id))
            return name
        } catch (error) {
            console.warn('Failed to get channel name:', error)
            // Fallback to cached data
            const members = channel.state.members ? Object.values(channel.state.members) : []
            const otherMember = members.find(member => member.user_id !== String(user.id))
            return otherMember?.user?.name || otherMember?.user?.id || 'Cuộc trò chuyện'
        }
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
              const channelName = channelNames.get(channel.id || '') || 'Cuộc trò chuyện'
              const name = channelName.toLowerCase()
              const lastMessage = getLastMessage(channel).toLowerCase()
              const query = searchQuery.toLowerCase()
              return name.includes(query) || lastMessage.includes(query)
          })
        : channels

    // getInitials is now imported from @/lib/chat-user-data

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
                            const channelName = channelNames.get(channel.id || '') || 'Đang tải...'
                            const channelAvatar = channelAvatars.get(channel.id || '')
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
                                        <AvatarImage src={channelAvatar || ''} alt={channelName} />
                                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white font-semibold">
                                            {getUserInitials(channelName)}
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
