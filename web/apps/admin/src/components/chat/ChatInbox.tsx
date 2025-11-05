'use client'

import { useState, useEffect } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@workspace/ui/components/Avatar'
import { Badge } from '@workspace/ui/components/Badge'
import { Button } from '@workspace/ui/components/Button'
import { Input } from '@workspace/ui/components/Textfield'
import { formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale'
import { MessageCircle, Clock, Search } from 'lucide-react'
import { cn } from '@workspace/ui/lib/utils'
import { chatService, type ChatChannel } from '@/shared/lib/api-services'
import { useChat } from '@/contexts/ChatContext'

interface ChatInboxProps {
    onSelectChannel: (channelId: string) => void
    selectedChannelId: string | null
}

export function ChatInbox({ onSelectChannel, selectedChannelId }: ChatInboxProps) {
    const { client, isConnected } = useChat()
    const [channels, setChannels] = useState<ChatChannel[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [isSearching, setIsSearching] = useState(false)

    useEffect(() => {
        const loadChannels = async () => {
            if (!isConnected) return

            try {
                setLoading(true)
                const channelData = await chatService.getChannels()
                setChannels(channelData)
            } catch (error) {
                console.error('Failed to load channels:', error)
                // Fallback to empty array on error
                setChannels([])
            } finally {
                setLoading(false)
            }
        }

        loadChannels()
    }, [isConnected])

    const formatLastMessageTime = (timestamp?: string) => {
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

    const filteredChannels = searchQuery
        ? channels.filter(
              channel =>
                  channel.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  channel.lastMessage?.text?.toLowerCase().includes(searchQuery.toLowerCase()),
          )
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

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    return (
        <div className="h-full flex flex-col">
            {/* Search Header */}
            <div className="flex-shrink-0 p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-2">
                    <h2 className="text-lg font-semibold text-foreground dark:text-gray-100">Cuộc trò chuyện</h2>
                    <Button variant="ghost" size="sm" onClick={handleSearchToggle}>
                        <Search className="h-4 w-4" />
                    </Button>
                </div>

                {/* Search Input */}
                {isSearching && (
                    <div className="mt-3">
                        <Input
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Tìm kiếm cuộc trò chuyện..."
                            className="w-full"
                        />
                    </div>
                )}
            </div>

            {/* Conversations List */}
            <div className="flex-1 overflow-hidden">
                <div className="space-y-1 p-2">
                    {filteredChannels.length === 0 ? (
                        <div className="text-center py-8">
                            <MessageCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                            <p className="text-muted-foreground">Chưa có cuộc trò chuyện nào</p>
                        </div>
                    ) : (
                        filteredChannels.map(channel => (
                            <div
                                key={channel.channelId}
                                onClick={() => onSelectChannel(channel.channelId)}
                                className={cn(
                                    'flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors',
                                    selectedChannelId === channel.channelId &&
                                        'bg-blue-50 dark:bg-blue-900/20 border-r-2 border-blue-600',
                                )}
                            >
                                {/* Avatar */}
                                <Avatar className="h-12 w-12 flex-shrink-0">
                                    <AvatarImage src="" alt={channel.name} />
                                    <AvatarFallback className="bg-blue-100 text-blue-700">
                                        {getInitials(channel.name)}
                                    </AvatarFallback>
                                </Avatar>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1">
                                        <h3 className="font-medium text-foreground dark:text-gray-100 truncate">
                                            {channel.name}
                                        </h3>
                                        {channel.lastMessageAt && (
                                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                {formatLastMessageTime(channel.lastMessageAt)}
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <p className="text-sm text-muted-foreground truncate max-w-[180px]">
                                            {channel.lastMessage?.text || 'Chưa có tin nhắn'}
                                        </p>

                                        {channel.unreadCount > 0 && (
                                            <Badge
                                                variant="destructive"
                                                className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                                            >
                                                {channel.unreadCount > 99 ? '99+' : channel.unreadCount}
                                            </Badge>
                                        )}
                                    </div>

                                    {/* Members count */}
                                    <div className="text-xs text-muted-foreground mt-1">
                                        {channel.members.length} thành viên
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    )
}
