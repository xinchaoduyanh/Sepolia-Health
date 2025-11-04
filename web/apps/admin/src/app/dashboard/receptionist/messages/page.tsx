'use client'

import { useState } from 'react'
import { ChatInbox } from '@/components/chat/ChatInbox'
import { ChatWindow } from '@/components/chat/ChatWindow'
import { Button } from '@workspace/ui/components/Button'
import { MessageSquare } from 'lucide-react'

export default function ReceptionistMessagesPage() {
    const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null)
    const [isChatOpen, setIsChatOpen] = useState(false)

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
                <div
                    className={`flex-shrink-0 ${isChatOpen ? 'hidden md:block' : 'block'} w-full md:w-80 border-r border-gray-200 dark:border-gray-700 bg-background dark:bg-gray-800`}
                >
                    <ChatInbox
                        onSelectChannel={channelId => {
                            setSelectedChannelId(channelId)
                            setIsChatOpen(true)
                        }}
                        selectedChannelId={selectedChannelId}
                    />
                </div>

                {/* Chat Window - Bên phải */}
                <div className={`flex-1 ${!isChatOpen ? 'hidden md:block' : 'block'}`}>
                {selectedChannelId ? (
                    <ChatWindow
                        channelId={selectedChannelId}
                        onClose={() => {
                            setIsChatOpen(false)
                            setSelectedChannelId(null)
                        }}
                    />
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

            {/* Mobile back button */}
            {isChatOpen && (
                <div className="md:hidden fixed top-4 left-4 z-10">
                    <Button variant="outline" size="sm" onClick={() => setIsChatOpen(false)}>
                        ← Quay lại
                    </Button>
                </div>
            )}
        </div>
        </div>
    )
}
