import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { Channel } from 'stream-chat';
import { useAuth } from '@/lib/hooks/useAuth';
import { useChatContext } from './ChatContext';
import { markNotificationAsRead } from '@/lib/api/notification';

export interface NotificationData {
  id: string;
  type: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'UNREAD' | 'READ' | 'ARCHIVED';
  title: string;
  message: string;
  metadata?: Record<string, any>;
  createdAt: string;
  readAt?: string;
}

interface NotificationContextType {
  notifications: NotificationData[];
  unreadCount: number;
  isReady: boolean;
  markAsRead: (notificationId: string) => Promise<void>;
  refreshNotifications: () => Promise<void>;
  notificationChannel?: Channel;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const { chatClient, isChatReady } = useChatContext();
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [notificationChannel, setNotificationChannel] = useState<Channel>();
  const [isReady, setIsReady] = useState(false);

  // Transform Stream message to notification format
  const transformStreamMessageToNotification = useCallback((message: any): NotificationData => {
    // Đọc từ metadata vì BE đã đưa tất cả vào metadata
    const metadata = message.metadata || {};
    return {
      id: message.id || '',
      type: metadata.notificationType || message.type || 'SYSTEM_NOTIFICATION',
      priority: metadata.priority || message.priority || 'MEDIUM',
      status: metadata.status || message.status || 'UNREAD',
      title: metadata.title || message.title || '',
      message: message.text || '',
      metadata: metadata,
      createdAt: message.created_at || new Date().toISOString(),
      readAt:
        metadata.status === 'READ' || message.status === 'READ' ? message.updated_at : undefined,
    };
  }, []);

  // Load notifications from channel
  const loadNotifications = useCallback(
    async (channel: Channel) => {
      try {
        const response = await channel.query({
          messages: { limit: 50, offset: 0 },
        });

        if (response.messages) {
          console.log(`📬 Loaded ${response.messages.length} messages from channel`);
          const transformedNotifications = response.messages
            .map(transformStreamMessageToNotification)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

          console.log('📋 Transformed notifications:', transformedNotifications.length);
          setNotifications(transformedNotifications);
        } else {
          console.log('📭 No messages found in channel');
        }
      } catch (error) {
        console.error('Error loading notifications:', error);
      }
    },
    [transformStreamMessageToNotification]
  );

  // Initialize notification channel when chat is ready
  useEffect(() => {
    console.log('🔍 [NotificationContext] useEffect triggered:', {
      hasChatClient: !!chatClient,
      isChatReady,
      hasUser: !!user,
      userId: user?.id,
    });

    if (!chatClient || !isChatReady || !user) {
      console.warn('⚠️ [NotificationContext] Missing dependencies:', {
        chatClient: !!chatClient,
        isChatReady,
        user: !!user,
      });
      setIsReady(false);
      // Cleanup old channel if exists
      if (notificationChannel) {
        try {
          (notificationChannel as any).off();
          setNotificationChannel(undefined);
        } catch (err) {
          // Ignore cleanup errors
        }
      }
      setNotifications([]);
      return;
    }

    // Check if client is still connected and valid
    if (chatClient.userID !== user.id.toString()) {
      console.warn('⚠️ [NotificationContext] User mismatch, skipping initialization:', {
        clientUserId: chatClient.userID,
        expectedUserId: user.id.toString(),
      });
      setIsReady(false);
      return;
    }

    let isCancelled = false;
    let currentChannel: Channel | undefined;

    const initNotifications = async () => {
      try {
        // Double check client is still valid
        if (isCancelled || !chatClient || chatClient.userID !== user.id.toString()) {
          console.log('🚫 [NotificationContext] Initialization cancelled or client invalid');
          return;
        }

        console.log('🔄 [NotificationContext] Initializing notifications...');

        // Cleanup old channel first
        if (notificationChannel) {
          try {
            console.log('🧹 [NotificationContext] Cleaning up old channel...');
            (notificationChannel as any).off();
            setNotificationChannel(undefined);
          } catch (err) {
            console.warn('⚠️ [NotificationContext] Error cleaning up old channel:', err);
          }
        }

        // Create notification channel ID
        const channelId = `notifications_${user.id}`;
        console.log('📋 [NotificationContext] Channel ID:', channelId);

        // Check again before creating channel
        if (isCancelled || !chatClient || chatClient.userID !== user.id.toString()) {
          console.log('🚫 [NotificationContext] Cancelled before channel creation');
          return;
        }

        // Get or create notification channel
        const channel = chatClient.channel('messaging', channelId);
        currentChannel = channel;

        // Try to watch the channel (create if doesn't exist)
        console.log('👀 [NotificationContext] Watching channel...');
        await channel.watch();

        // Final check after watch
        if (isCancelled || !chatClient || chatClient.userID !== user.id.toString()) {
          console.log('🚫 [NotificationContext] Cancelled after channel watch');
          return;
        }

        console.log('✅ [NotificationContext] Channel watched successfully');

        setNotificationChannel(channel);

        // Load initial notifications
        console.log('📥 [NotificationContext] Loading initial notifications...');
        await loadNotifications(channel);

        // Final check before setting up listeners
        if (isCancelled || !chatClient || chatClient.userID !== user.id.toString()) {
          console.log('🚫 [NotificationContext] Cancelled before setting up listeners');
          return;
        }

        // Listen for new messages
        const handleNewMessage = (event: any) => {
          if (isCancelled) return;
          console.log('📨 New message event received:', {
            channel_id: event.channel_id,
            expected_channel: channelId,
            message_id: event.message?.id,
            message_type: event.message?.type,
            has_metadata: !!event.message?.metadata,
          });
          if (event.message && event.channel_id === channelId) {
            const newNotification = transformStreamMessageToNotification(event.message);
            console.log('✅ Transformed notification:', newNotification);
            setNotifications((prev) => [newNotification, ...prev]);
          } else {
            console.warn('⚠️ Message ignored - channel mismatch or no message:', {
              event_channel: event.channel_id,
              expected: channelId,
              has_message: !!event.message,
            });
          }
        };

        // Listen for message updates (mark as read)
        const handleMessageUpdated = (event: any) => {
          if (isCancelled) return;
          if (event.message && event.channel_id === channelId) {
            const updatedNotification = transformStreamMessageToNotification(event.message);
            setNotifications((prev) =>
              prev.map((n) => (n.id === updatedNotification.id ? updatedNotification : n))
            );
          }
        };

        console.log('👂 [NotificationContext] Registering event listeners...');
        channel.on('message.new', handleNewMessage);
        channel.on('message.updated', handleMessageUpdated);
        console.log('✅ [NotificationContext] Event listeners registered');

        if (!isCancelled) {
          setIsReady(true);
          console.log('✅ [NotificationContext] Notifications initialized successfully');
        }
      } catch (error) {
        if (isCancelled) {
          console.log('🚫 [NotificationContext] Error occurred but already cancelled');
          return;
        }
        console.error('❌ Failed to initialize notifications:', error);
        setIsReady(false);
      }
    };

    initNotifications();

    return () => {
      isCancelled = true;
      if (currentChannel) {
        try {
          (currentChannel as any).off();
        } catch (err) {
          // Ignore cleanup errors
        }
      }
      if (notificationChannel) {
        try {
          (notificationChannel as any).off();
          setNotificationChannel(undefined);
        } catch (err) {
          // Ignore cleanup errors
        }
      }
    };
  }, [chatClient, isChatReady, user, loadNotifications, transformStreamMessageToNotification]);

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    if (!notificationChannel || !user) return;

    try {
      // Gọi backend API để update message metadata trong StreamChat
      await markNotificationAsRead(user.id.toString(), notificationId);

      // Update local state sau khi update thành công
      const readAt = new Date().toISOString();
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId
            ? {
                ...n,
                status: 'READ',
                readAt,
                metadata: {
                  ...n.metadata,
                  status: 'READ',
                  readAt,
                },
              }
            : n
        )
      );

      console.log('✅ Notification marked as read:', notificationId);
    } catch (error) {
      console.error('Error marking notification as read:', error);
      // Fallback: update local state nếu API call fail
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, status: 'READ', readAt: new Date().toISOString() } : n
        )
      );
    }
  };

  // Refresh notifications
  const refreshNotifications = async () => {
    if (notificationChannel) {
      await loadNotifications(notificationChannel);
    }
  };

  // Calculate unread count
  const unreadCount = notifications.filter((n) => n.status === 'UNREAD').length;

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    isReady,
    markAsRead,
    refreshNotifications,
    notificationChannel,
  };

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
};

const useNotificationContext = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    return {
      notifications: [],
      unreadCount: 0,
      isReady: false,
      markAsRead: async () => {},
      refreshNotifications: async () => {},
      notificationChannel: undefined,
    };
  }
  return context;
};

export { NotificationProvider, useNotificationContext };
