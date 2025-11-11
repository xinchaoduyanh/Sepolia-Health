'use client'

import { useState } from 'react'
import { useVideo } from '@/contexts/VideoContext'
import { useChat } from '@/contexts/ChatContext'
import { useAuth } from '@/shared/hooks/useAuth'
import { getUserProfile } from '@/shared/lib/user-profile'
import { Button } from '@workspace/ui/components/Button'
import { Phone, Video, X } from 'lucide-react'

interface IncomingCallNotificationProps {
    callId: string
    callType: 'audio' | 'video'
    callerName?: string
    channelId?: string
    onClose: () => void
}

export function IncomingCallNotification({
    callId,
    callType,
    callerName,
    channelId,
    onClose,
}: IncomingCallNotificationProps) {
    const { joinCallFromId, rejectCall } = useVideo()
    const { client: chatClient } = useChat()
    const { user } = useAuth()
    const [isJoining, setIsJoining] = useState(false)

    // Debug: Log props when component mounts or props change
    console.log('🔔 IncomingCallNotification rendered', {
        callId,
        callType,
        callerName,
        channelId,
        hasChatClient: !!chatClient,
        hasUser: !!user,
    })

    const handleAccept = async () => {
        try {
            setIsJoining(true)
            await joinCallFromId(callId, callType)
            onClose()
        } catch (error) {
            console.error('Failed to accept call:', error)
            setIsJoining(false)
        }
    }

    const handleReject = async () => {
        console.log('🛑 handleReject called', {
            callId,
            callType,
            channelId,
            hasChatClient: !!chatClient,
            hasUser: !!user,
        })

        try {
            // Get current user name
            const userName = user ? getUserProfile(user).name : 'Người dùng'
            console.log('👤 User name:', userName)

            // If we have channelId, send rejection message directly
            if (chatClient && channelId) {
                try {
                    console.log('📤 Sending rejection message to channel:', channelId)
                    const channel = chatClient.channel('messaging', channelId)

                    // Ensure channel is watched/loaded before sending message
                    console.log('👀 Watching channel before sending message...')
                    await channel.watch()
                    console.log('✅ Channel watched successfully')

                    const callTypeText = callType === 'video' ? 'video' : 'cuộc gọi'
                    const rejectionMessage = `❌ ${userName} đã từ chối ${callTypeText}`

                    console.log('📝 Sending rejection message:', rejectionMessage)
                    const messageResponse = await channel.sendMessage({
                        text: rejectionMessage,
                    })
                    console.log('✅ Rejection message sent successfully:', messageResponse)
                } catch (error) {
                    console.error('❌ Failed to send rejection message:', error)
                    console.error('Error details:', {
                        error,
                        message: error instanceof Error ? error.message : String(error),
                        stack: error instanceof Error ? error.stack : undefined,
                    })
                    // Don't return, still try to reject the call
                }
            } else {
                console.warn('⚠️ Cannot send rejection message: missing chatClient or channelId', {
                    hasChatClient: !!chatClient,
                    hasChannelId: !!channelId,
                    channelIdValue: channelId,
                })
            }

            // Call rejectCall (may not have incomingCall set, but that's ok)
            // This is mainly for cleanup, the message is already sent above
            console.log('🔄 Calling rejectCall from VideoContext...')
            try {
                await rejectCall(chatClient, userName)
                console.log('✅ rejectCall completed')
            } catch (error) {
                console.error('❌ Error in rejectCall:', error)
                // Continue anyway since message is already sent
            }

            console.log('🔚 Closing notification...')
            onClose()
        } catch (error) {
            console.error('❌ Failed to reject call - unexpected error:', error)
            console.error('Error details:', {
                error,
                message: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined,
            })
            onClose()
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-sm w-full mx-4">
                <div className="text-center mb-6">
                    <div
                        className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${
                            callType === 'video' ? 'bg-blue-100 dark:bg-blue-900' : 'bg-green-100 dark:bg-green-900'
                        }`}
                    >
                        {callType === 'video' ? (
                            <Video className="h-10 w-10 text-blue-600 dark:text-blue-400" />
                        ) : (
                            <Phone className="h-10 w-10 text-green-600 dark:text-green-400" />
                        )}
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Cuộc gọi đến</h3>
                    <p className="text-gray-600 dark:text-gray-400">{callerName || 'Người gọi'}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                        {callType === 'video' ? 'Video call' : 'Audio call'}
                    </p>
                </div>

                <div className="flex gap-3">
                    <Button
                        onClick={e => {
                            console.log('🔴 Reject button clicked!', { callId, channelId })
                            e.preventDefault()
                            e.stopPropagation()
                            handleReject()
                        }}
                        variant="destructive"
                        className="flex-1"
                        isDisabled={isJoining}
                    >
                        <X className="h-4 w-4 mr-2" />
                        Từ chối
                    </Button>
                    <Button
                        onClick={e => {
                            console.log('🟢 Accept button clicked!', { callId, channelId })
                            e.preventDefault()
                            e.stopPropagation()
                            handleAccept()
                        }}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                        isDisabled={isJoining}
                    >
                        {callType === 'video' ? <Video className="h-4 w-4 mr-2" /> : <Phone className="h-4 w-4 mr-2" />}
                        {isJoining ? 'Đang kết nối...' : 'Chấp nhận'}
                    </Button>
                </div>
            </div>
        </div>
    )
}
