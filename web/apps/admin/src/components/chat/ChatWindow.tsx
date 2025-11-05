'use client'

import { useState, useEffect } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@workspace/ui/components/Avatar'
import { Button } from '@workspace/ui/components/Button'
import { X, Phone, Video, MoreVertical } from 'lucide-react'
import { useChat } from '@/contexts/ChatContext'
import { Channel, MessageList, MessageInput, Window, Thread } from 'stream-chat-react'

interface ChatWindowProps {
    channelId: string
    onClose: () => void
}

export function ChatWindow({ channelId, onClose }: ChatWindowProps) {
    const { client, isConnected } = useChat()
    const [channel, setChannel] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const loadChannel = async () => {
            if (!client || !isConnected || !channelId) return

            try {
                setLoading(true)
                // Watch the channel for real-time updates
                const channelInstance = client.channel('messaging', channelId)
                await channelInstance.watch()
                setChannel(channelInstance)
            } catch (error) {
                console.error('Failed to load channel:', error)
            } finally {
                setLoading(false)
            }
        }

        loadChannel()

        // Cleanup
        return () => {
            if (channel) {
                channel.stopWatching()
            }
        }
    }, [client, isConnected, channelId])

    if (loading || !channel) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    return (
        <Channel channel={channel}>
            <Window>
                {/* Chat Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-background dark:bg-gray-800">
                    <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                            <AvatarImage src="" alt="Patient" />
                            <AvatarFallback className="bg-blue-100 text-blue-700">NA</AvatarFallback>
                        </Avatar>
                        <div>
                            <h2 className="font-semibold text-foreground dark:text-gray-100">
                                {channel?.data?.name || 'Chat với bệnh nhân'}
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                {channel?.state?.online ? 'Đang hoạt động' : 'Offline'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm">
                            <Phone className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                            <Video className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={onClose}>
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-hidden">
                    <MessageList />
                </div>

                {/* Message Input */}
                <div className="border-t border-gray-200 dark:border-gray-700 bg-background dark:bg-gray-800">
                    <MessageInput />
                </div>
            </Window>

            {/* Thread Panel */}
            <Thread />
        </Channel>
    )
}
