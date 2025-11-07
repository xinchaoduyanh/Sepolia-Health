import { createContext, useContext, useEffect, useState, ReactNode, useRef } from 'react';
import { Channel, StreamChat } from 'stream-chat';
import { useAuth } from '@/lib/hooks/useAuth';
import { ChatAPI, ChatService } from '@/lib/api/chat';
import { Chat, OverlayProvider } from 'stream-chat-expo';
import { getUserProfile } from '@/lib/utils';

interface ChatContextType {
  chatClient?: StreamChat;
  isChatReady: boolean;
  initChat: () => Promise<void>;
  disconnectChat: () => void;
  createChannel: (clinicId: number) => Promise<Channel | null>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

// 🎨 ĐỊNH NGHĨA THEME CỦA BẠN TẠI ĐÂY - Enhanced Theme
const myChatTheme = {
  colors: {
    // Nền của MessageList
    grey_gainsboro: '#F8FAFC',
    white: '#FFFFFF',
    white_smoke: '#F1F5F9',
    white_snow: '#FAFAFA',

    // Màu xanh dương chủ đạo
    primary: '#2563EB',
    accent_blue: '#3B82F6',

    // Màu văn bản
    black: '#1F2937',
    grey: '#64748B',
    grey_whisper: '#94A3B8',

    // Màu trạng thái
    border: '#E2E8F0',
    overlay: 'rgba(0, 0, 0, 0.4)',
  },
  messageSimple: {
    // Bong bóng chat CỦA BẠN (bên phải) - Gradient effect
    contentRight: {
      container: {
        backgroundColor: '#2563EB',
        borderRadius: 20,
        borderBottomRightRadius: 4,
        borderWidth: 0,
        paddingHorizontal: 14,
        paddingVertical: 10,
        shadowColor: '#2563EB',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 2,
      },
      text: {
        color: '#FFFFFF',
        fontSize: 15,
        lineHeight: 20,
      },
    },
    // Bong bóng chat CỦA NGƯỜI KHÁC (bên trái)
    content: {
      container: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        borderBottomLeftRadius: 4,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        paddingHorizontal: 14,
        paddingVertical: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
      },
      text: {
        color: '#1F2937',
        fontSize: 15,
        lineHeight: 20,
      },
    },
    // Container của message
    container: {
      marginBottom: 8,
    },
    // Avatar
    avatar: {
      container: {
        marginRight: 8,
      },
      image: {
        width: 36,
        height: 36,
        borderRadius: 18,
        borderWidth: 2,
        borderColor: '#FFFFFF',
      },
    },
    // Tên người gửi
    username: {
      text: {
        color: '#64748B',
        fontSize: 12,
        fontWeight: 600 as any,
        marginBottom: 4,
        marginLeft: 8,
      },
    },
    // Thời gian
    timestamp: {
      text: {
        color: '#94A3B8',
        fontSize: 11,
        marginTop: 4,
        marginHorizontal: 8,
      },
    },
  },
  // Channel Preview Styling
  channelPreview: {
    container: {
      backgroundColor: 'transparent',
      borderBottomWidth: 0,
      paddingVertical: 12,
    },
    title: {
      fontSize: 16,
      fontWeight: 600 as any,
      color: '#1F2937',
    },
    message: {
      fontSize: 14,
      color: '#64748B',
    },
    date: {
      fontSize: 12,
      color: '#94A3B8',
    },
    unreadCount: {
      backgroundColor: '#EF4444',
      borderRadius: 10,
      minWidth: 20,
      height: 20,
    },
  },
  // Message List
  messageList: {
    container: {
      backgroundColor: '#F8FAFC',
    },
    dateSeparator: {
      text: {
        color: '#64748B',
        fontSize: 12,
        fontWeight: 600 as any,
      },
      container: {
        backgroundColor: '#E2E8F0',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 4,
        marginVertical: 16,
      },
    },
  },
  // Typing Indicator
  typingIndicator: {
    text: {
      color: '#64748B',
      fontSize: 13,
      fontStyle: 'italic' as any,
    },
  },
  // Reply (Thread)
  reply: {
    container: {
      backgroundColor: '#F1F5F9',
      borderLeftWidth: 3,
      borderLeftColor: '#2563EB',
      borderRadius: 8,
      padding: 8,
      marginTop: 4,
    },
    text: {
      color: '#64748B',
      fontSize: 13,
    },
  },
};

const ChatProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [chatClient, setChatClient] = useState<StreamChat>();
  const [isChatReady, setIsChatReady] = useState(false);
  const chatClientRef = useRef<StreamChat | undefined>(undefined);

  // Update ref when chatClient changes
  useEffect(() => {
    if (chatClient) {
      chatClientRef.current = chatClient;
    }
  }, [chatClient]);

  // Auto-init chat when user is available (for push notifications)
  useEffect(() => {
    const initChat = async () => {
      console.log('ChatContext initChat called', {
        hasUser: !!user,
        hasClient: !!chatClient,
        isReady: isChatReady,
        hasApiKey: !!process.env.EXPO_PUBLIC_STREAM_API_KEY,
      });

      if (!user || chatClient || !process.env.EXPO_PUBLIC_STREAM_API_KEY) {
        console.log('ChatContext initChat skipped', {
          noUser: !user,
          hasClient: !!chatClient,
          noApiKey: !process.env.EXPO_PUBLIC_STREAM_API_KEY,
        });
        return;
      }

      try {
        console.log('Creating StreamChat client...');
        const client = StreamChat.getInstance(process.env.EXPO_PUBLIC_STREAM_API_KEY);
        console.log('StreamChat client created, getting token...');
        const token = await ChatAPI.getToken();
        console.log('Token received, connecting user...');

        const userProfile = getUserProfile(user);
        console.log('User profile:', userProfile);

        await client.connectUser(
          {
            id: user.id.toString(),
            name: userProfile.name,
            image: userProfile.image,
          },
          token
        );

        console.log('User connected successfully, setting states...');
        setChatClient(client);
        ChatService.setClient(client); // Set client in service
        setIsChatReady(true);
        console.log('Chat initialization completed successfully');
      } catch (error) {
        console.error('Failed to initialize chat:', error);
        // Reset state on error to allow retry
        setChatClient(undefined);
        setIsChatReady(false);
        // Don't throw error here to avoid breaking the app
      }
    };

    initChat();

    // IMPORTANT: Only cleanup on component unmount, not when user/chatClient changes
    // This prevents chat disconnect during navigation between screens
    return () => {
      // Cleanup will only run when ChatProvider unmounts completely
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array - only run once on mount

  // Handle user changes (login/logout) without disconnecting chat during navigation
  useEffect(() => {
    if (!user && chatClient) {
      // User logged out - disconnect chat
      console.log('User logged out, disconnecting chat...');
      chatClient.disconnectUser();
      setChatClient(undefined);
      setIsChatReady(false);
    } else if (user && !chatClient && !isChatReady) {
      // User logged in but no chat - init chat
      console.log('User logged in, initializing chat...');
      const initChatForNewUser = async () => {
        try {
          const streamApiKey = process.env.EXPO_PUBLIC_STREAM_API_KEY as string;
          console.log('streamApiKey', streamApiKey);
          const client = StreamChat.getInstance(streamApiKey);
          const token = await ChatAPI.getToken();
          const userProfile = getUserProfile(user);

          await client.connectUser(
            {
              id: user.id.toString(),
              name: userProfile.name,
              image: userProfile.image,
            },
            token
          );

          setChatClient(client);
          ChatService.setClient(client); // Set client in service
          setIsChatReady(true);
          console.log('Chat initialized for new user');
        } catch (error) {
          console.error('Failed to initialize chat for new user:', error);
          setChatClient(undefined);
          setIsChatReady(false);
        }
      };
      initChatForNewUser();
    }
  }, [user, chatClient, isChatReady]);

  // Cleanup only on component unmount
  useEffect(() => {
    return () => {
      // Use ref to get the latest chatClient on unmount
      if (chatClientRef.current) {
        console.log('ChatProvider unmounting, disconnecting chat...');
        chatClientRef.current.disconnectUser().catch((err) => {
          console.error('Error disconnecting chat:', err);
        });
      }
    };
  }, []); // Empty deps - cleanup only runs on unmount

  const initChat = async () => {
    if (!user || chatClient || !process.env.EXPO_PUBLIC_STREAM_API_KEY) return;

    try {
      const client = StreamChat.getInstance(process.env.EXPO_PUBLIC_STREAM_API_KEY);
      const token = await ChatAPI.getToken();

      const userProfile = getUserProfile(user);

      await client.connectUser(
        {
          id: user.id.toString(),
          name: userProfile.name,
          image: userProfile.image,
        },
        token
      );

      setChatClient(client);
      ChatService.setClient(client); // Set client in service
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
        {isChatReady && chatClient ? (
          <Chat client={chatClient} style={myChatTheme}>
            {children}
          </Chat>
        ) : (
          <>{children}</>
        )}
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
