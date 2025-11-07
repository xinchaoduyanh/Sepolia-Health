'use client'

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { StreamChat } from 'stream-chat'
import { Chat, Channel, ChannelList, MessageList, MessageInput, Thread, Window } from 'stream-chat-react'
import 'stream-chat-react/dist/css/v2/index.css'

interface ChatContextType {
    client: StreamChat | null
    isConnected: boolean
    connectUser: (userId: string, token: string, name?: string, image?: string) => Promise<void>
    disconnectUser: () => Promise<void>
}

const ChatContext = createContext<ChatContextType | undefined>(undefined)

interface ChatProviderProps {
    children: ReactNode
    apiKey: string
}

export function ChatProvider({ children, apiKey }: ChatProviderProps) {
    const [client] = useState(() => StreamChat.getInstance(apiKey))
    const [isConnected, setIsConnected] = useState(false)

    const connectUser = async (userId: string, token: string, name?: string, image?: string) => {
        try {
            await client.connectUser(
                {
                    id: userId,
                    name: name || `User ${userId}`,
                    image: image || `https://getstream.io/random_png/?id=${userId}&name=${name || 'User'}`,
                },
                token,
            )
            setIsConnected(true)
            console.log('Connected to Stream Chat')
        } catch (error) {
            console.error('Failed to connect to Stream Chat:', error)
            throw error
        }
    }

    const disconnectUser = async () => {
        try {
            await client.disconnectUser()
            setIsConnected(false)
            console.log('Disconnected from Stream Chat')
        } catch (error) {
            console.error('Failed to disconnect from Stream Chat:', error)
            throw error
        }
    }

    useEffect(() => {
        return () => {
            if (isConnected) {
                client.disconnectUser()
            }
        }
    }, [client, isConnected])

    return (
        <ChatContext.Provider value={{ client, isConnected, connectUser, disconnectUser }}>
            <Chat client={client}>{children}</Chat>
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
