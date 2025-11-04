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

interface ChatChannel {
    channelId: string
    name: string
    lastMessage?: any
    unreadCount: number
    lastMessageAt?: string
    members: string[]
}

interface ChatInboxProps {
    onSelectChannel: (channelId: string) => void
    selectedChannelId: string | null
}

export function ChatInbox({ onSelectChannel, selectedChannelId }: ChatInboxProps) {
    const [channels, setChannels] = useState<ChatChannel[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [isSearching, setIsSearching] = useState(false)

    // Mock data - sẽ thay thế bằng API call thực tế
    useEffect(() => {
        // Simulate API call
        const mockChannels: ChatChannel[] = [
            {
                channelId: 'patient_123_VS_clinic_1',
                name: 'Chat với Nguyễn Văn A',
                lastMessage: {
                    text: 'Cảm ơn bác sĩ đã tư vấn rất kỹ lưỡng',
                    created_at: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
                },
                unreadCount: 2,
                lastMessageAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
                members: ['123', '456', '789'],
            },
            {
                channelId: 'patient_124_VS_clinic_1',
                name: 'Chat với Trần Thị B',
                lastMessage: {
                    text: 'Tôi muốn đặt lịch khám vào tuần sau được không?',
                    created_at: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
                },
                unreadCount: 0,
                lastMessageAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
                members: ['124', '456', '789'],
            },
            {
                channelId: 'patient_125_VS_clinic_1',
                name: 'Chat với Lê Văn C',
                lastMessage: {
                    text: 'Thuốc này có tác dụng phụ gì không bác sĩ?',
                    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
                },
                unreadCount: 1,
                lastMessageAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
                members: ['125', '456', '789'],
            },
            {
                channelId: 'patient_126_VS_clinic_1',
                name: 'Chat với Phạm Thị D',
                lastMessage: {
                    text: 'Em bé nhà mình bị ho, có cần đưa đi khám không?',
                    created_at: new Date(Date.now() - 1000 * 60 * 60 * 6), // 6 hours ago
                },
                unreadCount: 3,
                lastMessageAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
                members: ['126', '456', '789'],
            },
            {
                channelId: 'patient_127_VS_clinic_1',
                name: 'Chat với Hoàng Văn E',
                lastMessage: {
                    text: 'Kết quả xét nghiệm của tôi đã có chưa?',
                    created_at: new Date(Date.now() - 1000 * 60 * 60 * 12), // 12 hours ago
                },
                unreadCount: 0,
                lastMessageAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
                members: ['127', '456', '789'],
            },
            {
                channelId: 'patient_128_VS_clinic_1',
                name: 'Chat với Đỗ Thị F',
                lastMessage: {
                    text: 'Tôi cần tái khám định kỳ, lịch nào còn trống?',
                    created_at: new Date(Date.now() - 1000 * 60 * 60 * 18), // 18 hours ago
                },
                unreadCount: 1,
                lastMessageAt: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
                members: ['128', '456', '789'],
            },
            {
                channelId: 'patient_129_VS_clinic_1',
                name: 'Chat với Nguyễn Văn G',
                lastMessage: {
                    text: 'Thuốc giảm đau này uống bao nhiêu viên một lần?',
                    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
                },
                unreadCount: 0,
                lastMessageAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
                members: ['129', '456', '789'],
            },
            {
                channelId: 'patient_130_VS_clinic_1',
                name: 'Chat với Trần Thị H',
                lastMessage: {
                    text: 'Bảo hiểm y tế của tôi có được áp dụng không?',
                    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3), // 3 days ago
                },
                unreadCount: 2,
                lastMessageAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
                members: ['130', '456', '789'],
            },
            {
                channelId: 'patient_131_VS_clinic_1',
                name: 'Chat với Lê Văn I',
                lastMessage: {
                    text: 'Tôi bị đau bụng, có phải đi cấp cứu không?',
                    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4), // 4 days ago
                },
                unreadCount: 0,
                lastMessageAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(),
                members: ['131', '456', '789'],
            },
            {
                channelId: 'patient_132_VS_clinic_1',
                name: 'Chat với Phạm Thị J',
                lastMessage: {
                    text: 'Kết quả siêu âm có bình thường không bác sĩ?',
                    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5), // 5 days ago
                },
                unreadCount: 1,
                lastMessageAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
                members: ['132', '456', '789'],
            },
            {
                channelId: 'patient_133_VS_clinic_1',
                name: 'Chat với Hoàng Văn K',
                lastMessage: {
                    text: 'Tôi cần tư vấn về chế độ ăn uống sau phẫu thuật',
                    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6), // 6 days ago
                },
                unreadCount: 0,
                lastMessageAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6).toISOString(),
                members: ['133', '456', '789'],
            },
            {
                channelId: 'patient_134_VS_clinic_1',
                name: 'Chat với Đỗ Thị L',
                lastMessage: {
                    text: 'Vaccine COVID-19 có tác dụng phụ gì không?',
                    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7), // 1 week ago
                },
                unreadCount: 3,
                lastMessageAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
                members: ['134', '456', '789'],
            },
        ]

        setTimeout(() => {
            setChannels(mockChannels)
            setLoading(false)
        }, 1000)
    }, [])

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

    const handleSearchToggle = () => {
        setIsSearching(!isSearching)
        if (!isSearching) {
            setSearchQuery('')
        }
    }

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(word => word.charAt(0))
            .join('')
            .toUpperCase()
            .slice(0, 2)
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
            <div className="flex-1 overflow-y-auto">
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
