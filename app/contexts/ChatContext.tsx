import { createContext, useContext, useEffect, useState, ReactNode, useRef } from 'react';
import { Channel, StreamChat } from 'stream-chat';
import { useAuth } from '@/lib/hooks/useAuth';
import { ChatAPI, ChatService } from '@/lib/api/chat';
import { ChatbotAPI } from '@/lib/api/chatbot';
import { Chat, OverlayProvider } from 'stream-chat-expo';
import { getUserProfile } from '@/lib/utils';

interface ChatContextType {
  chatClient?: StreamChat;
  isChatReady: boolean;
  initChat: () => Promise<void>;
  disconnectChat: () => void;
  createChannel: (clinicId: number) => Promise<Channel | null>;
  createOrGetAIChannel: () => Promise<Channel | null>;
  isAIChannel: (channel: Channel) => boolean;
  totalUnreadCount: number;
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
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);
  const chatClientRef = useRef<StreamChat | undefined>(undefined);
  const currentUserIdRef = useRef<number | undefined>(undefined);

  // Update ref when chatClient changes
  useEffect(() => {
    if (chatClient) {
      chatClientRef.current = chatClient;
    }
  }, [chatClient]);

  // Track total unread messages across all channels
  useEffect(() => {
    if (!chatClient || !isChatReady || !user) return;

    const calculateTotalUnread = async () => {
      try {
        if (!user) return;

        // Get all channels for the current user with proper members filter
        const channels = await chatClient.queryChannels({
          members: { $in: [user.id.toString()] }
        });

        // Sum up unread counts from all channels
        const total = channels.reduce((sum, channel) => {
          const unreadCount = channel.state?.unreadCount ?? 0;
          return sum + unreadCount;
        }, 0);

        console.log(`🔢 Total unread messages: ${total} (from ${channels.length} channels)`);
        setTotalUnreadCount(total);
      } catch (error) {
        console.error('Error calculating total unread count:', error);
      }
    };

    // Initial calculation
    calculateTotalUnread();

    // Set up event listeners for real-time updates
    const handleNewMessage = () => {
      calculateTotalUnread();
    };

    const handleReadMessage = () => {
      calculateTotalUnread();
    };

    // Subscribe to events
    chatClient.on('message.new', handleNewMessage);
    chatClient.on('message.read', handleReadMessage);

    // Cleanup
    return () => {
      chatClient.off('message.new', handleNewMessage);
      chatClient.off('message.read', handleReadMessage);
    };
  }, [chatClient, isChatReady, user]);

  // Initialize chat client when user is available or when user changes
  useEffect(() => {
    let isMounted = true;

    const initChat = async () => {
      // If no user or no API key, disconnect and clear
      if (!user || !process.env.EXPO_PUBLIC_STREAM_API_KEY) {
        if (chatClient) {
          console.log('No user or API key, disconnecting...');
          try {
            await chatClient.disconnectUser();
          } catch (err) {
            console.error('Error disconnecting:', err);
          }
          if (isMounted) {
            setChatClient(undefined);
            setIsChatReady(false);
            ChatService.setClient(null);
            currentUserIdRef.current = undefined;
          }
        }
        return;
      }

      // Check if user has changed
      const userIdChanged = currentUserIdRef.current !== user.id;
      const currentUserIdString = user.id.toString();

      // If chatClient exists and user changed, disconnect first and wait
      if (chatClient && userIdChanged) {
        console.log('User changed, disconnecting old user...', {
          oldUserId: currentUserIdRef.current,
          newUserId: user.id,
        });
        try {
          await chatClient.disconnectUser();
          console.log('Old user disconnected successfully');
        } catch (err) {
          console.error('Error disconnecting old user:', err);
        }

        if (isMounted) {
          setChatClient(undefined);
          setIsChatReady(false);
          ChatService.setClient(null);
        }
      }

      // Skip if already connected with the same user
      if (chatClient && !userIdChanged && chatClient.userID === currentUserIdString) {
        console.log('Already connected with same user, skipping...');
        return;
      }

      try {
        const apiKey = process.env.EXPO_PUBLIC_STREAM_API_KEY;
        if (!apiKey) {
          throw new Error('Stream API key not found');
        }

        // Get or create client instance
        const client = StreamChat.getInstance(apiKey);

        // Double check: If client is already connected to a different user, disconnect first
        if (client.userID && client.userID !== currentUserIdString) {
          console.log('Client instance has different user, disconnecting...', {
            currentClientUserId: client.userID,
            targetUserId: currentUserIdString,
          });
          try {
            await client.disconnectUser();
            console.log('Previous user disconnected from client instance');
          } catch (err) {
            console.error('Error disconnecting from client instance:', err);
          }
        }

        const userProfile = getUserProfile(user);

        console.log('Connecting new user to StreamChat...', {
          userId: currentUserIdString,
          userName: userProfile.name,
        });

        // Use tokenProvider for automatic token refresh
        await client.connectUser(
          {
            id: currentUserIdString,
            name: userProfile.name,
            image: userProfile.image,
          },
          async () => {
            return await ChatAPI.getToken();
          }
        );

        if (isMounted) {
          setChatClient(client);
          ChatService.setClient(client);
          setIsChatReady(true);
          currentUserIdRef.current = user.id;
          console.log('✅ Chat client connected successfully for user:', user.id);
        }
      } catch (error) {
        console.error('❌ Failed to initialize chat:', error);
        if (isMounted) {
          setChatClient(undefined);
          setIsChatReady(false);
          currentUserIdRef.current = undefined;
        }
      }
    };

    initChat();

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]); // Only depend on user.id to detect user changes

  // Cleanup only on component unmount
  useEffect(() => {
    return () => {
      // Use ref to get the latest chatClient on unmount
      if (chatClientRef.current) {
        chatClientRef.current.disconnectUser().catch(() => {
          // Silently handle disconnection errors
        });
      }
    };
  }, []); // Empty deps - cleanup only runs on unmount

  // Manual initChat function for retry purposes
  const initChat = async () => {
    if (!user || !process.env.EXPO_PUBLIC_STREAM_API_KEY) {
      console.log('Cannot init chat: no user or API key');
      return;
    }

    // If already connected with same user, skip
    if (chatClient && chatClient.userID === user.id.toString()) {
      console.log('Already connected, skipping manual init');
      return;
    }

    try {
      const apiKey = process.env.EXPO_PUBLIC_STREAM_API_KEY;
      const client = StreamChat.getInstance(apiKey);

      // Disconnect if connected to different user
      if (client.userID && client.userID !== user.id.toString()) {
        console.log('Manual init: disconnecting previous user');
        await client.disconnectUser();
      }

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
      ChatService.setClient(client);
      setIsChatReady(true);
      currentUserIdRef.current = user.id;
      console.log('Manual init: Chat client connected');
    } catch (error) {
      console.error('Manual init failed:', error);
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
      return null;
    }

    try {
      const { channelId } = await ChatAPI.startChat(clinicId);

      const channel = chatClient.channel('messaging', channelId);

      await channel.create();

      await channel.watch(); // Automatically watch the channel after creating

      return channel;
    } catch {
      return null;
    }
  };

  const createOrGetAIChannel = async (): Promise<Channel | null> => {
    if (!chatClient || !user) {
      return null;
    }

    try {
      // Kiểm tra xem đã có AI channel chưa
      const aiChannelId = `ai-consult-${user.id}`;
      const existingChannels = await chatClient.queryChannels({
        cid: { $eq: `messaging:${aiChannelId}` },
      });

      if (existingChannels.length > 0) {
        const channel = existingChannels[0];
        await channel.watch();
        return channel;
      }

      // Nếu chưa có, tạo mới
      const response = await ChatbotAPI.createAIChannel();

      const channel = chatClient.channel('messaging', response.channelId);
      await channel.watch();

      return channel;
    } catch {
      return null;
    }
  };

  const isAIChannel = (channel: Channel): boolean => {
    // Kiểm tra xem channel có phải là AI channel không
    const channelId = channel.id || '';
    const channelData = channel.data || {};

    // Check by channel ID pattern
    if (channelId.startsWith('ai-consult-')) {
      return true;
    }

    // Check by channel custom data
    if (channelData.ai_channel === true || channelData.consultation_type === 'ai_assistant') {
      return true;
    }

    // Check by members (nếu có AI bot user)
    const botUserId = ChatbotAPI.getAIBotUserId();
    const members = channel.state?.members || {};
    if (members[botUserId]) {
      return true;
    }

    return false;
  };

  return (
    <ChatContext.Provider
      value={{
        chatClient,
        isChatReady,
        initChat,
        disconnectChat,
        createChannel,
        createOrGetAIChannel,
        isAIChannel,
        totalUnreadCount,
      }}>
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
      createOrGetAIChannel: async () => null,
      isAIChannel: () => false,
      totalUnreadCount: 0,
    };
  }
  return context;
};

export { ChatProvider, useChatContext };
