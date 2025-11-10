'use client'

import React, { createContext, useContext, useEffect, useState, ReactNode, useRef } from 'react'
import { StreamChat, Channel as StreamChannel } from 'stream-chat'
import { Chat } from 'stream-chat-react'
import 'stream-chat-react/dist/css/v2/index.css'
import '@/styles/stream-chat-custom.css'

interface ChatContextType {
    client: StreamChat | null
    isConnected: boolean
    connectUser: (userId: string, token: string, name?: string, image?: string) => Promise<void>
    disconnectUser: () => Promise<void>
    getChannel: (channelId: string) => Promise<StreamChannel | null>
    getUserChannels: () => Promise<StreamChannel[]>
}

const ChatContext = createContext<ChatContextType | undefined>(undefined)

interface ChatProviderProps {
    children: ReactNode
    apiKey: string
}

export function ChatProvider({ children, apiKey }: ChatProviderProps) {
    const [client] = useState(() => StreamChat.getInstance(apiKey))
    const [isConnected, setIsConnected] = useState(false)
    const [isReady, setIsReady] = useState(false)
    const clientRef = useRef<StreamChat | null>(null)

    useEffect(() => {
        clientRef.current = client
    }, [client])

    const connectUser = async (userId: string, token: string, name?: string, image?: string) => {
        try {
            // Check if already connected with the same user
            if (client.userID === userId && isConnected) {
                console.log('Already connected to Stream Chat with this user')
                setIsReady(true)
                return
            }

            // Disconnect if connected with different user
            if (client.userID && client.userID !== userId) {
                console.log('Disconnecting previous user before connecting new user')
                await client.disconnectUser()
            }

            await client.connectUser(
                {
                    id: userId,
                    name: name || `User ${userId}`,
                    image: image || `https://getstream.io/random_png/?id=${userId}&name=${name || 'User'}`,
                },
                token,
            )
            setIsConnected(true)
            setIsReady(true)
            console.log('Connected to Stream Chat successfully')
        } catch (error) {
            console.error('Failed to connect to Stream Chat:', error)
            setIsReady(false)
            throw error
        }
    }

    const disconnectUser = async () => {
        try {
            await client.disconnectUser()
            setIsConnected(false)
            setIsReady(false)
            console.log('Disconnected from Stream Chat')
        } catch (error) {
            console.error('Failed to disconnect from Stream Chat:', error)
            throw error
        }
    }

    const getChannel = async (channelId: string): Promise<StreamChannel | null> => {
        if (!client || !isConnected) {
            console.error('Chat client not connected')
            return null
        }

        try {
            const channel = client.channel('messaging', channelId)
            await channel.watch()
            return channel
        } catch (error) {
            console.error('Failed to get channel:', error)
            return null
        }
    }

    const getUserChannels = async (): Promise<StreamChannel[]> => {
        if (!client || !isConnected || !client.userID) {
            console.error('Chat client not connected or no user ID')
            return []
        }

        try {
            const channels = await client.queryChannels(
                {
                    members: { $in: [client.userID] },
                },
                { last_message_at: -1 },
                {
                    state: true,
                    watch: true,
                    limit: 20,
                },
            )
            return channels
        } catch (error) {
            console.error('Failed to get user channels:', error)
            return []
        }
    }

    useEffect(() => {
        return () => {
            // Cleanup on unmount
            if (clientRef.current && clientRef.current.userID) {
                console.log('ChatProvider unmounting, disconnecting...')
                clientRef.current.disconnectUser().catch(err => {
                    console.error('Error disconnecting on unmount:', err)
                })
            }
        }
    }, [])

    // Only render Chat wrapper when connected
    if (isReady && isConnected) {
        return (
            <ChatContext.Provider
                value={{ client, isConnected, connectUser, disconnectUser, getChannel, getUserChannels }}
            >
                <Chat client={client}>{children}</Chat>
            </ChatContext.Provider>
        )
    }

    return (
        <ChatContext.Provider value={{ client, isConnected, connectUser, disconnectUser, getChannel, getUserChannels }}>
            {children}
        </ChatContext.Provider>
    )
}

export function useChat() {
    const context = useContext(ChatContext)
    if (context === undefined) {
        throw new Error('useChat must be used within a ChatProvider')
    }
    return context
}
