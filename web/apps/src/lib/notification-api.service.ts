import { NotificationType, NotificationPriority, NotificationStatus } from '@/types/notification.types';

export interface NotificationConfig {
  apiBaseUrl: string;
  accessToken?: string;
}

export interface NotificationMessage {
  id: string;
  type: NotificationType;
  text: string;
  title?: string;
  priority?: NotificationPriority;
  status?: NotificationStatus;
  metadata?: Record<string, any>;
  created_at: string;
  isNew?: boolean;
}

class NotificationApiService {
  private config: NotificationConfig | null = null;
  private baseUrl: string = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  /**
   * Initialize notification API service
   */
  initialize(config: Partial<NotificationConfig> = {}): boolean {
    this.config = {
      apiBaseUrl: config.apiBaseUrl || this.baseUrl,
      accessToken: config.accessToken,
    };

    return true;
  }

  /**
   * Get authorization header
   */
  private getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.config?.accessToken) {
      headers['Authorization'] = `Bearer ${this.config.accessToken}`;
    }

    return headers;
  }

  /**
   * Get notifications from API
   */
  async getNotifications(options: {
    limit?: number;
    offset?: number;
    type?: NotificationType;
    status?: NotificationStatus;
    priority?: NotificationPriority;
  } = {}): Promise<NotificationMessage[]> {
    if (!this.config) {
      throw new Error('Notification service not initialized');
    }

    try {
      const params = new URLSearchParams();

      if (options.limit) params.append('limit', options.limit.toString());
      if (options.offset) params.append('offset', options.offset.toString());
      if (options.type) params.append('type', options.type);
      if (options.status) params.append('status', options.status);
      if (options.priority) params.append('priority', options.priority);

      const response = await fetch(
        `${this.config.apiBaseUrl}/notifications?${params.toString()}`,
        {
          headers: this.getAuthHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // Transform API response to match expected format
      return data.notifications.map((notification: any) => ({
        id: notification.id,
        type: notification.type,
        text: notification.message || notification.text,
        title: notification.title,
        priority: notification.priority,
        status: notification.status,
        metadata: notification.metadata,
        created_at: notification.created_at,
        isNew: notification.status === NotificationStatus.UNREAD,
      }));
    } catch (error) {
      console.error('Failed to get notifications:', error);
      return [];
    }
  }

  /**
   * Get unread count
   */
  async getUnreadCount(): Promise<number> {
    if (!this.config) {
      throw new Error('Notification service not initialized');
    }

    try {
      const response = await fetch(
        `${this.config.apiBaseUrl}/notifications/unread-count`,
        {
          headers: this.getAuthHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data.count || 0;
    } catch (error) {
      console.error('Failed to get unread count:', error);
      return 0;
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(messageId: string): Promise<boolean> {
    if (!this.config) {
      throw new Error('Notification service not initialized');
    }

    try {
      const response = await fetch(
        `${this.config.apiBaseUrl}/notifications/${messageId}/read`,
        {
          method: 'PATCH',
          headers: this.getAuthHeaders(),
        }
      );

      return response.ok;
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      return false;
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<boolean> {
    if (!this.config) {
      throw new Error('Notification service not initialized');
    }

    try {
      const response = await fetch(
        `${this.config.apiBaseUrl}/notifications/read-all`,
        {
          method: 'PATCH',
          headers: this.getAuthHeaders(),
        }
      );

      return response.ok;
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      return false;
    }
  }

  /**
   * Delete notification (mark as archived)
   */
  async deleteNotification(messageId: string): Promise<boolean> {
    if (!this.config) {
      throw new Error('Notification service not initialized');
    }

    try {
      const response = await fetch(
        `${this.config.apiBaseUrl}/notifications/${messageId}`,
        {
          method: 'DELETE',
          headers: this.getAuthHeaders(),
        }
      );

      return response.ok;
    } catch (error) {
      console.error('Failed to delete notification:', error);
      return false;
    }
  }

  /**
   * Get notification statistics
   */
  async getStats(): Promise<{
    total: number;
    unread: number;
    byType: Record<string, number>;
    byPriority: Record<string, number>;
  }> {
    if (!this.config) {
      throw new Error('Notification service not initialized');
    }

    try {
      const response = await fetch(
        `${this.config.apiBaseUrl}/notifications/stats`,
        {
          headers: this.getAuthHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get notification stats:', error);
      return {
        total: 0,
        unread: 0,
        byType: {},
        byPriority: {},
      };
    }
  }

  /**
   * Update access token
   */
  updateToken(accessToken: string): void {
    if (this.config) {
      this.config.accessToken = accessToken;
    }
  }

  /**
   * Check if initialized
   */
  isInitialized(): boolean {
    return this.config !== null;
  }

  /**
   * Get StreamChat token
   */
  async getStreamToken(): Promise<{ token: string; apiKey: string; userId: string }> {
    if (!this.config) {
      throw new Error('Notification service not initialized');
    }

    try {
      const response = await fetch(
        `${this.config.apiBaseUrl}/notifications/stream-token`,
        {
          method: 'POST',
          headers: this.getAuthHeaders(),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Stream token API Error:', response.status, errorText);
        throw new Error(`Failed to get stream token: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get StreamChat token:', error);
      throw error;
    }
  }

  /**
   * Disconnect (cleanup)
   */
  disconnect(): void {
    this.config = null;
  }
}

// Create singleton instance
export const notificationApiService = new NotificationApiService();

export default notificationApiService;