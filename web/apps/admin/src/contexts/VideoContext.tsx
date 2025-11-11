'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react'
import { StreamVideoClient, Call, StreamVideo, StreamTheme } from '@stream-io/video-react-sdk'
import '@stream-io/video-react-sdk/dist/css/styles.css'

interface VideoContextType {
    client: StreamVideoClient | null
    isConnected: boolean
    currentCall: Call | null
    isInCall: boolean
    callType: 'audio' | 'video' | null
    callStartTime: number | null
    isRinging: boolean // Caller is waiting for answer
    incomingCall: Call | null // Incoming call for the receiver
    connectUser: (userId: string, token: string, name?: string, image?: string) => Promise<void>
    disconnectUser: () => void
    startAudioCall: (channelId: string, chatClient?: any, otherUserId?: string) => Promise<void>
    startVideoCall: (channelId: string, chatClient?: any, otherUserId?: string) => Promise<void>
    acceptCall: () => Promise<void>
    rejectCall: (chatClient?: any, userName?: string) => Promise<void>
    joinCallFromId: (callId: string, callType?: 'audio' | 'video') => Promise<void>
    endCall: (sendSummary?: boolean, chatClient?: any, userName?: string) => Promise<void>
    toggleMic: () => void
    toggleCamera: () => void
    isMicOn: boolean
    isCameraOn: boolean
}

const VideoContext = createContext<VideoContextType | undefined>(undefined)

interface VideoProviderProps {
    children: ReactNode
    apiKey: string
}

export function VideoProvider({ children, apiKey }: VideoProviderProps) {
    const [client, setClient] = useState<StreamVideoClient | null>(null)
    const [isConnected, setIsConnected] = useState(false)
    const [currentCall, setCurrentCall] = useState<Call | null>(null)
    const [isInCall, setIsInCall] = useState(false)
    const [callType, setCallType] = useState<'audio' | 'video' | null>(null)
    const [callStartTime, setCallStartTime] = useState<number | null>(null)
    const [isRinging, setIsRinging] = useState(false)
    const [incomingCall, setIncomingCall] = useState<Call | null>(null)
    const [isMicOn, setIsMicOn] = useState(true)
    const [isCameraOn, setIsCameraOn] = useState(true)
    const [ringingCallInfo, setRingingCallInfo] = useState<{
        channelId: string
        callId: string
        callType: 'audio' | 'video'
    } | null>(null)
    const clientRef = useRef<StreamVideoClient | null>(null)
    const callStateRef = useRef<Call | null>(null)

    useEffect(() => {
        clientRef.current = client
    }, [client])

    useEffect(() => {
        callStateRef.current = currentCall
    }, [currentCall])

    // Listen for call state changes to detect when someone joins
    useEffect(() => {
        if (!currentCall || !isRinging) return

        const checkParticipants = () => {
            try {
                const participants = currentCall.state.participants || {}
                const participantCount = Object.keys(participants).length

                console.log('🔍 Checking participants:', {
                    count: participantCount,
                    participants: Object.keys(participants),
                    isRinging,
                    isInCall,
                })

                // If we're ringing and someone else joins, start the call
                if (participantCount >= 2) {
                    console.log('✅ Call accepted, participant joined - transitioning to active call')
                    setIsRinging(false)
                    setIsInCall(true)
                    setCallStartTime(Date.now())
                    setRingingCallInfo(null) // Clear ringing info since call is now active
                }
            } catch (error) {
                console.error('Error checking participants:', error)
            }
        }

        // Check immediately
        checkParticipants()

        // Subscribe to multiple events for better reliability
        const unsubscribes: (() => void)[] = []

        // Listen for general call updates
        unsubscribes.push(
            currentCall.on('call.updated', () => {
                console.log('📞 call.updated event')
                checkParticipants()
            }),
        )

        // Listen for participant joined events
        unsubscribes.push(
            currentCall.on('call.session_participant_joined', event => {
                console.log('👤 call.session_participant_joined event:', event)
                checkParticipants()
            }),
        )

        // Listen for call accepted event
        unsubscribes.push(
            currentCall.on('call.accepted', event => {
                console.log('✅ call.accepted event:', event)
                checkParticipants()
            }),
        )

        // Also watch the participants state directly
        const interval = setInterval(() => {
            if (isRinging) {
                checkParticipants()
            }
        }, 500)

        return () => {
            unsubscribes.forEach(unsub => unsub())
            clearInterval(interval)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentCall, isRinging])

    // Listen for call ended event to detect when other person hangs up
    useEffect(() => {
        if (!currentCall) return

        const unsubscribes: (() => void)[] = []

        // Listen for call ended event
        unsubscribes.push(
            currentCall.on('call.ended', event => {
                console.log('📵 call.ended event:', event)
                // Reset all call states
                setCurrentCall(null)
                setIsInCall(false)
                setIsRinging(false)
                setCallType(null)
                setCallStartTime(null)
                setRingingCallInfo(null)
                setIsMicOn(true)
                setIsCameraOn(true)
            }),
        )

        // Listen for participant left event
        unsubscribes.push(
            currentCall.on('call.session_participant_left', event => {
                console.log('👋 call.session_participant_left event:', event)
                // Check if all other participants have left
                const participants = currentCall.state.participants || {}
                const participantCount = Object.keys(participants).length
                console.log('Participants remaining:', participantCount)

                // If only we remain (or no one), end the call
                if (participantCount <= 1) {
                    console.log('🔚 All participants left, ending call')
                    setCurrentCall(null)
                    setIsInCall(false)
                    setIsRinging(false)
                    setCallType(null)
                    setCallStartTime(null)
                    setRingingCallInfo(null)
                    setIsMicOn(true)
                    setIsCameraOn(true)
                }
            }),
        )

        return () => {
            unsubscribes.forEach(unsub => unsub())
        }
    }, [currentCall])

    const connectUser = async (userId: string, token: string, name?: string, image?: string) => {
        try {
            // Check if already connected
            if (client && isConnected) {
                console.log('Already connected to Stream Video')
                return
            }

            const videoClient = new StreamVideoClient({
                apiKey,
                user: {
                    id: userId,
                    name: name || `User ${userId}`,
                    image: image || `https://getstream.io/random_png/?id=${userId}&name=${name || 'User'}`,
                },
                token,
            })

            setClient(videoClient)
            setIsConnected(true)
            console.log('Connected to Stream Video successfully')
        } catch (error) {
            console.error('Failed to connect to Stream Video:', error)
            throw error
        }
    }

    const disconnectUser = () => {
        try {
            if (currentCall) {
                currentCall.leave().catch(err => console.error('Error leaving call:', err))
            }
            setClient(null)
            setIsConnected(false)
            setCurrentCall(null)
            setIsInCall(false)
            setCallType(null)
            setCallStartTime(null)
            console.log('Disconnected from Stream Video')
        } catch (error) {
            console.error('Failed to disconnect from Stream Video:', error)
        }
    }

    const startAudioCall = async (channelId: string, chatClient?: any, otherUserId?: string) => {
        if (!client || !isConnected) {
            console.error('Video client not connected')
            throw new Error('Video client not connected')
        }

        try {
            const callId = `audio_${channelId}_${Date.now()}`
            const call = client.call('default', callId)

            // Create call and join, but mark as ringing
            await call.join({
                create: true,
                data: {
                    custom: {
                        channelId,
                        callType: 'audio',
                    },
                    members: otherUserId ? [{ user_id: otherUserId }] : undefined,
                },
                ring: true, // Ring the other participant
            })

            // Enable microphone and disable camera for audio-only call
            await call.microphone.enable()
            await call.camera.disable()

            setCurrentCall(call)
            setIsRinging(true) // Set ringing state instead of isInCall
            setCallType('audio')
            setIsMicOn(true)
            setIsCameraOn(false)
            setRingingCallInfo({ channelId, callId, callType: 'audio' })

            // Send notification via chat if chatClient is provided
            // Include call ID in message text for easy parsing
            if (chatClient && channelId) {
                try {
                    const channel = chatClient.channel('messaging', channelId)
                    await channel.sendMessage({
                        text: `📞 Đang gọi... CALL_ID:${callId} CALL_TYPE:audio`,
                    })
                } catch (error) {
                    console.error('Failed to send call notification:', error)
                }
            }

            console.log('Audio call initiated, ringing:', callId)
        } catch (error) {
            console.error('Failed to start audio call:', error)
            throw error
        }
    }

    const startVideoCall = async (channelId: string, chatClient?: any, otherUserId?: string) => {
        if (!client || !isConnected) {
            console.error('Video client not connected')
            throw new Error('Video client not connected')
        }

        try {
            const callId = `video_${channelId}_${Date.now()}`
            const call = client.call('default', callId)

            // Create call and join, but mark as ringing
            await call.join({
                create: true,
                data: {
                    custom: {
                        channelId,
                        callType: 'video',
                    },
                    members: otherUserId ? [{ user_id: otherUserId }] : undefined,
                },
                ring: true, // Ring the other participant
            })

            // Enable both microphone and camera for video call
            await call.microphone.enable()
            await call.camera.enable()

            setCurrentCall(call)
            setIsRinging(true) // Set ringing state instead of isInCall
            setCallType('video')
            setIsMicOn(true)
            setIsCameraOn(true)
            setRingingCallInfo({ channelId, callId, callType: 'video' })

            // Send notification via chat if chatClient is provided
            // Include call ID in message text for easy parsing
            if (chatClient && channelId) {
                try {
                    const channel = chatClient.channel('messaging', channelId)
                    await channel.sendMessage({
                        text: `📹 Đang gọi video... CALL_ID:${callId} CALL_TYPE:video`,
                    })
                } catch (error) {
                    console.error('Failed to send call notification:', error)
                }
            }

            console.log('Video call initiated, ringing:', callId)
        } catch (error) {
            console.error('Failed to start video call:', error)
            throw error
        }
    }

    const acceptCall = async () => {
        if (!incomingCall || !client) {
            console.error('No incoming call to accept')
            return
        }

        try {
            await incomingCall.join()

            // Determine call type from call data
            const callTypeFromCall = incomingCall.state.custom?.callType as 'audio' | 'video' | undefined

            setCurrentCall(incomingCall)
            setIsInCall(true)
            setCallType(callTypeFromCall || 'video')
            setCallStartTime(Date.now())
            setIncomingCall(null)

            if (callTypeFromCall === 'audio') {
                await incomingCall.camera.disable()
                setIsCameraOn(false)
            } else {
                setIsCameraOn(true)
            }

            console.log('Call accepted:', incomingCall.id)
        } catch (error) {
            console.error('Failed to accept call:', error)
            throw error
        }
    }

    const rejectCall = async (chatClient?: any, userName?: string) => {
        if (!incomingCall) {
            console.error('No incoming call to reject')
            return
        }

        try {
            const channelId = incomingCall.state.custom?.channelId as string
            const callType = incomingCall.state.custom?.callType as 'audio' | 'video' | undefined
            const callId = incomingCall.id

            await incomingCall.reject()

            // Send rejection message to chat
            if (chatClient && channelId && userName) {
                try {
                    const channel = chatClient.channel('messaging', channelId)
                    const callTypeText = callType === 'video' ? 'video' : 'cuộc gọi'
                    await channel.sendMessage({
                        text: `❌ ${userName} đã từ chối ${callTypeText}`,
                    })
                } catch (error) {
                    console.error('Failed to send rejection message:', error)
                }
            }

            setIncomingCall(null)
            console.log('Call rejected:', callId)
        } catch (error) {
            console.error('Failed to reject call:', error)
            // Still clear the incoming call state
            setIncomingCall(null)
        }
    }

    const joinCallFromId = async (callId: string, callType: 'audio' | 'video' = 'video') => {
        if (!client || !isConnected) {
            console.error('Video client not connected')
            throw new Error('Video client not connected')
        }

        try {
            const call = client.call('default', callId)
            await call.join()

            // Enable microphone first
            await call.microphone.enable()

            setCurrentCall(call)
            setIsInCall(true)
            setCallType(callType)
            setCallStartTime(Date.now())
            setIncomingCall(null)
            setIsMicOn(true)

            if (callType === 'audio') {
                await call.camera.disable()
                setIsCameraOn(false)
            } else {
                await call.camera.enable()
                setIsCameraOn(true)
            }

            console.log('Joined call:', callId, 'with mic and', callType === 'video' ? 'camera' : 'no camera')
        } catch (error) {
            console.error('Failed to join call:', error)
            throw error
        }
    }

    const endCall = async (sendSummary: boolean = true, chatClient?: any, userName?: string) => {
        console.log('📞 endCall called', {
            hasCurrentCall: !!currentCall,
            isRinging,
            isInCall,
            hasRingingCallInfo: !!ringingCallInfo,
            hasChatClient: !!chatClient,
            hasUserName: !!userName,
        })

        if (!currentCall && !isRinging) {
            console.log('⚠️ No call to end')
            return
        }

        const callToEnd = currentCall

        // If we're ringing but call hasn't been accepted yet (no one else joined)
        // This means the caller (A) is cancelling the call before B accepts
        if (isRinging && !isInCall && ringingCallInfo) {
            console.log('🔔 Call is ringing but not accepted yet, sending cancellation message')

            // Send cancellation message to chat
            if (chatClient && userName && ringingCallInfo.channelId) {
                try {
                    console.log('📤 Sending cancellation message to channel:', ringingCallInfo.channelId)
                    const channel = chatClient.channel('messaging', ringingCallInfo.channelId)

                    // Ensure channel is watched/loaded before sending message
                    console.log('👀 Watching channel before sending cancellation message...')
                    await channel.watch()
                    console.log('✅ Channel watched successfully')

                    const callTypeText = ringingCallInfo.callType === 'video' ? 'video' : 'cuộc gọi'
                    const cancellationMessage = `❌ ${userName} đã hủy ${callTypeText}`

                    console.log('📝 Sending cancellation message:', cancellationMessage)
                    const messageResponse = await channel.sendMessage({
                        text: cancellationMessage,
                    })
                    console.log('✅ Cancellation message sent successfully:', messageResponse)
                } catch (error) {
                    console.error('❌ Failed to send cancellation message:', error)
                    console.error('Error details:', {
                        error,
                        message: error instanceof Error ? error.message : String(error),
                        stack: error instanceof Error ? error.stack : undefined,
                    })
                }
            } else {
                console.warn('⚠️ Cannot send cancellation message: missing required info', {
                    hasChatClient: !!chatClient,
                    hasUserName: !!userName,
                    hasChannelId: !!ringingCallInfo?.channelId,
                    ringingCallInfo,
                })
            }

            // Leave the call if it exists
            if (callToEnd) {
                try {
                    console.log('🚪 Leaving call...')
                    await callToEnd.leave()
                    console.log('✅ Call left successfully')
                } catch (error) {
                    console.error('❌ Error leaving call:', error)
                }
            }

            // Clear ringing state
            setIsRinging(false)
            setCurrentCall(null)
            setCallType(null)
            setRingingCallInfo(null)
            setIsMicOn(true)
            setIsCameraOn(true)
            console.log('✅ Call cancellation completed')
            return
        }

        if (!callToEnd) {
            // If we're just ringing but no call object, clear the state
            console.log('⚠️ No call object but isRinging is true, clearing state')
            setIsRinging(false)
            setCurrentCall(null)
            setCallType(null)
            setRingingCallInfo(null)
            return
        }

        try {
            // Calculate duration
            const duration = callStartTime ? Date.now() - callStartTime : 0
            const durationMinutes = Math.floor(duration / 60000)
            const durationSeconds = Math.floor((duration % 60000) / 1000)
            const durationText = `${durationMinutes}:${durationSeconds.toString().padStart(2, '0')}`

            // Get channel ID from call metadata
            const channelId = callToEnd.state.custom?.channelId as string

            // Leave call first
            await callToEnd.leave()

            // Send summary message to chat if requested and call was actually connected
            if (sendSummary && channelId && chatClient && callStartTime) {
                try {
                    const channel = chatClient.channel('messaging', channelId)
                    await channel.sendMessage({
                        text: `📞 ${callType === 'video' ? 'Video call' : 'Audio call'} • ${durationText}`,
                    })
                    console.log('Call summary sent to chat')
                } catch (error) {
                    console.error('Failed to send call summary:', error)
                }
            }

            // Reset state
            setCurrentCall(null)
            setIsInCall(false)
            setIsRinging(false)
            setCallType(null)
            setCallStartTime(null)
            setRingingCallInfo(null)
            setIsMicOn(true)
            setIsCameraOn(true)
            console.log('Call ended successfully')
        } catch (error) {
            console.error('Failed to end call:', error)
            throw error
        }
    }

    const toggleMic = async () => {
        if (!currentCall) return
        try {
            await currentCall.microphone.toggle()
            // Get the actual state from the call
            const isEnabled = currentCall.microphone.state.status === 'enabled'
            setIsMicOn(isEnabled)
            console.log('Mic toggled:', isEnabled ? 'ON' : 'OFF')
        } catch (error) {
            console.error('Failed to toggle mic:', error)
        }
    }

    const toggleCamera = async () => {
        if (!currentCall || callType !== 'video') return
        try {
            await currentCall.camera.toggle()
            // Get the actual state from the call
            const isEnabled = currentCall.camera.state.status === 'enabled'
            setIsCameraOn(isEnabled)
            console.log('Camera toggled:', isEnabled ? 'ON' : 'OFF')
        } catch (error) {
            console.error('Failed to toggle camera:', error)
        }
    }

    useEffect(() => {
        return () => {
            // Cleanup on unmount - using ref to avoid adding currentCall as dependency
            if (clientRef.current && callStateRef.current) {
                console.log('VideoProvider unmounting, leaving call...')
                callStateRef.current.leave().catch(err => console.error('Error leaving call on unmount:', err))
            }
        }
    }, [])

    // Only wrap with StreamVideo when we have a client
    if (client && isConnected) {
        return (
            <VideoContext.Provider
                value={{
                    client,
                    isConnected,
                    currentCall,
                    isInCall,
                    callType,
                    callStartTime,
                    isRinging,
                    incomingCall,
                    connectUser,
                    disconnectUser,
                    startAudioCall,
                    startVideoCall,
                    acceptCall,
                    rejectCall,
                    joinCallFromId,
                    endCall,
                    toggleMic,
                    toggleCamera,
                    isMicOn,
                    isCameraOn,
                }}
            >
                <StreamVideo client={client}>
                    <StreamTheme>{children}</StreamTheme>
                </StreamVideo>
            </VideoContext.Provider>
        )
    }

    return (
        <VideoContext.Provider
            value={{
                client,
                isConnected,
                currentCall,
                isInCall,
                callType,
                callStartTime,
                isRinging,
                incomingCall,
                connectUser,
                disconnectUser,
                startAudioCall,
                startVideoCall,
                acceptCall,
                rejectCall,
                joinCallFromId,
                endCall,
                toggleMic,
                toggleCamera,
                isMicOn,
                isCameraOn,
            }}
        >
            {children}
        </VideoContext.Provider>
    )
}

export function useVideo() {
    const context = useContext(VideoContext)
    if (context === undefined) {
        throw new Error('useVideo must be used within a VideoProvider')
    }
    return context
}
