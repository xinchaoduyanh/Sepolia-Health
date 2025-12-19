import { StreamChat } from 'stream-chat';
import { NotificationType, NotificationPriority, NotificationStatus } from '@/types/notification.types';
import { notificationApiService } from '@/lib/notification-api.service';

export interface StreamChatConfig {
  apiKey: string;
  userId: string;
  userToken?: string;
}

export interface StreamChatMessage {
  id: string;
  text: string;
  user_id: string;
  created_at: string;
  type?: string;
  title?: string;
  priority?: NotificationPriority;
  status?: NotificationStatus;
  metadata?: Record<string, any>;
}

class StreamChatService {
  private client: StreamChat | null = null;
  private config: StreamChatConfig | null = null;
  private notificationChannel: any = null;
  private isInitializing: boolean = false;

  /**
   * Initialize StreamChat client
   */
  async initialize(config: StreamChatConfig): Promise<boolean> {
    try {
      console.log('🚀 initialize() called with:', { userId: config.userId, hasClient: !!this.client, currentConfig: this.config, isInitializing: this.isInitializing });

      // Prevent concurrent initializations
      if (this.isInitializing) {
        console.log('⏳ Already initializing, waiting...');
        // Wait for current initialization to complete
        while (this.isInitializing) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        console.log('⏳ Initialization completed, checking result...');
        return this.client !== null && this.config?.userId === config.userId;
      }

      // Prevent multiple initializations
      if (this.client && this.config?.userId === config.userId) {
        console.log('🔧 StreamChat client already initialized, skipping...');
        return true;
      }

      // Set initializing flag
      this.isInitializing = true;

      console.log('🔧 Setting config...');
      this.config = config;

      // Initialize StreamChat client with API key only (frontend)
      console.log('🔧 Creating StreamChat client with apiKey:', config.apiKey);
      this.client = StreamChat.getInstance(config.apiKey);
      console.log('🔧 StreamChat client created:', this.client);
      console.log('🔧 Client type:', typeof this.client);
      console.log('🔧 Client constructor:', this.client?.constructor?.name);

      if (!this.client) {
        throw new Error('❌ Failed to create StreamChat client');
      }

      // Get JWT token from auth-storage first
      const getAccessToken = (): string | null => {
        try {
          const authStorage = localStorage.getItem('auth-storage');
          if (authStorage) {
            const parsed = JSON.parse(authStorage);
            return parsed.state?.accessToken || null;
          }
        } catch (error) {
          console.error('Error reading access token from localStorage:', error);
        }
        return null;
      };

      const jwtToken = getAccessToken();
      if (!jwtToken) {
        throw new Error('No authentication token found. Please login first.');
      }

      console.log('✅ Found JWT token, initializing notificationApiService');

      // Check if client is still valid after async operation
      if (!this.client) {
        console.log('❌ Client became null during token retrieval!');
        throw new Error('StreamChat client became null during initialization');
      }

      // Initialize notificationApiService with JWT token
      notificationApiService.initialize({
        accessToken: jwtToken,
      });

      // Get StreamChat token from backend first
      let streamChatToken: string;
      try {
        const tokenData = await notificationApiService.getStreamToken();
        streamChatToken = tokenData.token;
        console.log('✅ StreamChat token received from backend');

        // Check client again after async call
        if (!this.client) {
          console.log('❌ Client became null during getStreamToken!');
          throw new Error('StreamChat client became null during token request');
        }
      } catch (error) {
        console.error('❌ Failed to get StreamChat token from backend:', error);
        throw error;
      }

      // Now connect with the obtained token
      console.log('🔗 Connecting to StreamChat with user token');
      console.log('🔗 Client before connectUser:', !!this.client);
      console.log('🔗 Config before connectUser:', this.config);

      if (!this.client) {
        console.log('❌ Client is null right before connectUser!');
        throw new Error('StreamChat client is null before connectUser call');
      }

      await this.client.connectUser({
        id: config.userId,
        name: config.userId, // Can enhance with actual user name later
      }, streamChatToken);

      // Setup notification channel
      await this.setupNotificationChannel();

      console.log('✅ StreamChat initialization completed successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize StreamChat:', error);
      // Reset state on error
      this.client = null;
      this.config = null;
      return false;
    } finally {
      // Always clear initializing flag
      this.isInitializing = false;
      console.log('🔧 Initializing flag cleared');
    }
  }

  /**
   * Setup notification channel for the user
   */
  private async setupNotificationChannel(): Promise<void> {
    if (!this.client || !this.config) return;

    const channelId = `notifications_${this.config.userId}`;
    this.notificationChannel = this.client.channel('messaging', channelId);

    // Watch the channel
    await this.notificationChannel.watch();
  }

  /**
   * Get notification messages
   */
  async getNotifications(options: {
    limit?: number;
    offset?: number;
    filters?: Record<string, any>;
  } = {}): Promise<StreamChatMessage[]> {
    if (!this.notificationChannel) return [];

    try {
      const response = await this.notificationChannel.query({
        messages: {
          limit: options.limit || 50,
          id_gt: options.offset ? options.offset : undefined,
          ...options.filters,
        },
      });

      return response.messages || [];
    } catch (error) {
      console.error('Failed to get notifications:', error);
      return [];
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(messageId: string): Promise<boolean> {
    if (!this.client) return false;

    try {
      await this.client.updateMessage({
        id: messageId,
        set: {
          status: NotificationStatus.READ,
        },
      });

      return true;
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      return false;
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<boolean> {
    if (!this.notificationChannel) return false;

    try {
      // Get all unread notifications
      const unreadMessages = await this.getNotifications({
        filters: {
          status: { $ne: NotificationStatus.READ },
        },
      });

      // Mark each as read
      await Promise.all(
        unreadMessages.map((message) =>
          this.markAsRead(message.id)
        )
      );

      return true;
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      return false;
    }
  }

  /**
   * Archive notification
   */
  async archiveNotification(messageId: string): Promise<boolean> {
    if (!this.client) return false;

    try {
      await this.client.updateMessage({
        id: messageId,
        set: {
          status: NotificationStatus.ARCHIVED,
        },
      });

      return true;
    } catch (error) {
      console.error('Failed to archive notification:', error);
      return false;
    }
  }

  /**
   * Get unread count
   */
  async getUnreadCount(): Promise<number> {
    if (!this.notificationChannel) return 0;

    try {
      const response = await this.notificationChannel.query({
        messages: {
          limit: 1, // Just get count
          filters: {
            status: { $ne: NotificationStatus.READ },
          },
        },
      });

      return response.messages?.length || 0;
    } catch (error) {
      console.error('Failed to get unread count:', error);
      return 0;
    }
  }

  /**
   * Listen for new notifications
   */
  onNewNotification(callback: (notification: StreamChatMessage) => void): void {
    if (!this.notificationChannel) return;

    this.notificationChannel.on('message.new', (event) => {
      const message = event.message;
      if (message) {
        callback(message as StreamChatMessage);
      }
    });
  }

  /**
   * Listen for notification updates
   */
  onNotificationUpdate(callback: (notification: StreamChatMessage) => void): void {
    if (!this.notificationChannel) return;

    this.notificationChannel.on('message.updated', (event) => {
      const message = event.message;
      if (message) {
        callback(message as StreamChatMessage);
      }
    });
  }

  /**
   * Disconnect from StreamChat
   */
  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.disconnect();
      this.client = null;
      this.notificationChannel = null;
      this.config = null;
      this.isInitializing = false;
    }
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.client !== null && this.config !== null;
  }

  /**
   * Get current user info
   */
  getCurrentUser(): StreamChatConfig | null {
    return this.config;
  }
}

// Create singleton instance
export const streamChatService = new StreamChatService();

export default streamChatService;