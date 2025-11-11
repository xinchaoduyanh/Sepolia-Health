'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react'
import { StreamVideoClient, Call, StreamCall, StreamVideo, StreamTheme } from '@stream-io/video-react-sdk'
import '@stream-io/video-react-sdk/dist/css/styles.css'

interface VideoContextType {
    client: StreamVideoClient | null
    isConnected: boolean
    currentCall: Call | null
    isInCall: boolean
    callType: 'audio' | 'video' | null
    callStartTime: number | null
    connectUser: (userId: string, token: string, name?: string, image?: string) => Promise<void>
    disconnectUser: () => void
    startAudioCall: (channelId: string) => Promise<void>
    startVideoCall: (channelId: string) => Promise<void>
    endCall: (sendSummary?: boolean, chatClient?: any) => Promise<void>
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
    const [isMicOn, setIsMicOn] = useState(true)
    const [isCameraOn, setIsCameraOn] = useState(true)
    const clientRef = useRef<StreamVideoClient | null>(null)

    useEffect(() => {
        clientRef.current = client
    }, [client])

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

    const startAudioCall = async (channelId: string) => {
        if (!client || !isConnected) {
            console.error('Video client not connected')
            throw new Error('Video client not connected')
        }

        try {
            const callId = `audio_${channelId}_${Date.now()}`
            const call = client.call('default', callId)

            await call.join({
                create: true,
                data: {
                    custom: {
                        channelId,
                        callType: 'audio',
                    },
                },
            })

            // Disable camera for audio-only call
            await call.camera.disable()

            setCurrentCall(call)
            setIsInCall(true)
            setCallType('audio')
            setCallStartTime(Date.now())
            setIsCameraOn(false)
            console.log('Audio call started:', callId)
        } catch (error) {
            console.error('Failed to start audio call:', error)
            throw error
        }
    }

    const startVideoCall = async (channelId: string) => {
        if (!client || !isConnected) {
            console.error('Video client not connected')
            throw new Error('Video client not connected')
        }

        try {
            const callId = `video_${channelId}_${Date.now()}`
            const call = client.call('default', callId)

            await call.join({
                create: true,
                data: {
                    custom: {
                        channelId,
                        callType: 'video',
                    },
                },
            })

            setCurrentCall(call)
            setIsInCall(true)
            setCallType('video')
            setCallStartTime(Date.now())
            setIsCameraOn(true)
            console.log('Video call started:', callId)
        } catch (error) {
            console.error('Failed to start video call:', error)
            throw error
        }
    }

    const endCall = async (sendSummary: boolean = true, chatClient?: any) => {
        if (!currentCall) return

        try {
            // Calculate duration
            const duration = callStartTime ? Date.now() - callStartTime : 0
            const durationMinutes = Math.floor(duration / 60000)
            const durationSeconds = Math.floor((duration % 60000) / 1000)
            const durationText = `${durationMinutes}:${durationSeconds.toString().padStart(2, '0')}`

            // Get channel ID from call metadata
            const channelId = currentCall.state.custom?.channelId as string

            // Leave call first
            await currentCall.leave()

            // Send summary message to chat if requested
            if (sendSummary && channelId && chatClient) {
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
            setCallType(null)
            setCallStartTime(null)
            setIsMicOn(true)
            setIsCameraOn(true)
            console.log('Call ended successfully')
        } catch (error) {
            console.error('Failed to end call:', error)
            throw error
        }
    }

    const toggleMic = () => {
        if (!currentCall) return
        currentCall.microphone.toggle()
        setIsMicOn(!isMicOn)
    }

    const toggleCamera = () => {
        if (!currentCall || callType !== 'video') return
        currentCall.camera.toggle()
        setIsCameraOn(!isCameraOn)
    }

    useEffect(() => {
        return () => {
            // Cleanup on unmount
            if (clientRef.current && currentCall) {
                console.log('VideoProvider unmounting, leaving call...')
                currentCall.leave().catch(err => console.error('Error leaving call on unmount:', err))
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
                    connectUser,
                    disconnectUser,
                    startAudioCall,
                    startVideoCall,
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
                connectUser,
                disconnectUser,
                startAudioCall,
                startVideoCall,
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
