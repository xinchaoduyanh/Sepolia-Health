import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Channel, StreamChat } from 'stream-chat';
import { useAuth } from '@/lib/hooks/useAuth';
import { ChatAPI } from '@/lib/api/chat';
import { EXPO_PUBLIC_STREAM_API_KEY } from '@env';
import { Chat, OverlayProvider } from 'stream-chat-expo';

interface ChatContextType {
  chatClient?: StreamChat;
  isChatReady: boolean;
  initChat: () => Promise<void>;
  disconnectChat: () => void;
  createChannel: (clinicId: number) => Promise<Channel | null>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

const ChatProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [chatClient, setChatClient] = useState<StreamChat>();
  const [isChatReady, setIsChatReady] = useState(false);

  // Auto-init chat when user is available (for push notifications)
  useEffect(() => {
    const initChat = async () => {
      if (!user || chatClient || !EXPO_PUBLIC_STREAM_API_KEY) return;

      try {
        const client = StreamChat.getInstance(EXPO_PUBLIC_STREAM_API_KEY);
        const token = await ChatAPI.getToken();

        await client.connectUser(
          {
            id: user.id.toString(),
            name: user.patientProfiles?.[0]
              ? `${user.patientProfiles[0].firstName} ${user.patientProfiles[0].lastName}`
              : 'Anonymous',
            image: user.patientProfiles?.[0]?.avatar,
          },
          token
        );

        setChatClient(client);
        setIsChatReady(true);
      } catch (error) {
        console.error('Failed to initialize chat:', error);
        // Don't throw error here to avoid breaking the app
      }
    };

    initChat();

    return () => {
      if (chatClient) {
        chatClient.disconnectUser();
        setIsChatReady(false);
      }
    };
  }, [user, chatClient]);

  const initChat = async () => {
    if (!user || chatClient || !EXPO_PUBLIC_STREAM_API_KEY) return;

    try {
      const client = StreamChat.getInstance(EXPO_PUBLIC_STREAM_API_KEY);
      const token = await ChatAPI.getToken();

      await client.connectUser(
        {
          id: user.id.toString(),
          name: user.patientProfiles?.[0]
            ? `${user.patientProfiles[0].firstName} ${user.patientProfiles[0].lastName}`
            : 'Anonymous',
          image: user.patientProfiles?.[0]?.avatar,
        },
        token
      );

      setChatClient(client);
      setIsChatReady(true);
    } catch (error) {
      console.error('Failed to initialize chat:', error);
      throw error;
    }
  };

  const disconnectChat = () => {
    if (chatClient) {
      chatClient.disconnectUser();
      setChatClient(undefined);
      setIsChatReady(false);
    }
  };

  const createChannel = async (clinicId: number): Promise<Channel | null> => {
    if (!chatClient || !user) {
      console.error('Chat client not ready or user not logged in.');
      return null;
    }

    try {
      console.log('Creating channel for clinic:', clinicId);
      const { channelId } = await ChatAPI.startChat(clinicId);
      console.log('Channel ID from backend:', channelId);

      const channel = chatClient.channel('messaging', channelId);
      console.log('Channel object created:', channel.id, channel.cid);

      await channel.create();
      console.log('Channel created successfully');

      await channel.watch(); // Automatically watch the channel after creating
      console.log('Channel watched successfully, cid:', channel.cid);

      return channel;
    } catch (error) {
      console.error('Error creating channel:', error);
      return null;
    }
  };

  return (
    <ChatContext.Provider
      value={{ chatClient, isChatReady, initChat, disconnectChat, createChannel }}>
      <OverlayProvider>
        {isChatReady && chatClient ? <Chat client={chatClient}>{children}</Chat> : <>{children}</>}
      </OverlayProvider>
    </ChatContext.Provider>
  );
};

const useChatContext = () => {
  const context = useContext(ChatContext);
  if (!context) {
    // Instead of throwing error, return a loading state
    return {
      chatClient: undefined,
      isChatReady: false,
      initChat: async () => {},
      disconnectChat: () => {},
      createChannel: async () => null,
    };
  }
  return context;
};

export { ChatProvider, useChatContext };
