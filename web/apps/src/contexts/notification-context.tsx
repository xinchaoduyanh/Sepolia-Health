'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { useChat } from '@/contexts/ChatContext';
import { notificationApiService } from '@/lib/notification-api.service';
import { streamChatService } from '@/lib/streamchat.service';
import {
  NotificationState,
  NotificationFilters,
  NotificationListItem,
  formatNotificationForDisplay,
} from '@/types/notification.types';

interface NotificationContextType {
  // State
  notifications: NotificationListItem[];
  unreadCount: number;
  isLoading: boolean;
  isConnected: boolean;
  filters: NotificationFilters;
  isReady: boolean;

  // Actions
  fetchNotifications: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  archiveNotification: (notificationId: string) => Promise<void>;
  setFilters: (filters: NotificationFilters) => void;
  clearNotifications: () => void;
  refreshUnreadCount: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
  userId?: string;
  userToken?: string;
}

export function NotificationProvider({ children, userId, userToken }: NotificationProviderProps) {
  const [state, setState] = useState<NotificationState>({
    notifications: [],
    unreadCount: 0,
    isLoading: false,
    isConnected: false,
  });

  const [filters, setFilters] = useState<NotificationFilters>({});

  // Initialize API service when userId is available
  useEffect(() => {
    if (userId) {
      connect(userId, userToken);
    }

    return () => {
      disconnect();
    };
  }, [userId, userToken]);

  // Poll for new notifications periodically
  useEffect(() => {
    if (!state.isConnected) return;

    const interval = setInterval(() => {
      fetchNotifications();
      refreshUnreadCount();
    }, 30000); // Poll every 30 seconds

    return () => clearInterval(interval);
  }, [state.isConnected]);

  const connect = async (connectUserId: string, connectUserToken?: string): Promise<boolean> => {
    console.log(`🔔 CONNECT CALLED: userId=${connectUserId}`);

    // Get current user from notification service instead
    const currentUser = streamChatService.getCurrentUser();
    if (currentUser?.userId === connectUserId) {
      console.log('🔔 Already connected, skipping...');
      return true;
    }

    setState(prev => ({ ...prev, isLoading: true }));

    try {
      // DEBUG: Check environment
      console.log('🔍 DEBUG: Environment variables:');
      console.log('🔍 NEXT_PUBLIC_STREAM_CHAT_API_KEY:', process.env.NEXT_PUBLIC_STREAM_CHAT_API_KEY);
      console.log('🔍 userId:', connectUserId);

      // Note: In production, get this from environment variables
      const apiKey = process.env.NEXT_PUBLIC_STREAM_CHAT_API_KEY || 'your-stream-chat-api-key';

      console.log('🔍 Using apiKey:', apiKey);

      if (apiKey === 'your-stream-chat-api-key') {
        throw new Error('❌ StreamChat API key not configured properly!');
      }

      // For now, don't use token to avoid validation issues
      // In production, we would get StreamChat token from API
      const connected = await streamChatService.initialize({
        apiKey,
        userId: connectUserId,
        userToken: undefined, // Don't use token for now to avoid validation issues
      });

      console.log('🔍 streamChatService.initialize returned:', connected);

      setState(prev => ({
        ...prev,
        isConnected: connected,
        isLoading: false,
      }));

      if (connected) {
        await fetchNotifications();
        await refreshUnreadCount();
      }

      return connected;
    } catch (error) {
      console.error('Failed to connect to StreamChat:', error);
      setState(prev => ({ ...prev, isLoading: false }));
      return false;
    }
  };

  const disconnect = async (): Promise<void> => {
    await streamChatService.disconnect();
    setState({
      notifications: [],
      unreadCount: 0,
      isLoading: false,
      isConnected: false,
    });
  };

  const fetchNotifications = async (): Promise<void> => {
    if (!state.isConnected) return;

    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const notifications = await notificationApiService.getNotifications({
        limit: 50,
      });

      setState(prev => ({
        ...prev,
        notifications: notifications.map(formatNotificationForDisplay),
        isLoading: false,
      }));
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const refreshUnreadCount = async (): Promise<void> => {
    if (!state.isConnected) return;

    try {
      const unreadCount = await notificationApiService.getUnreadCount();
      setState(prev => ({ ...prev, unreadCount }));
    } catch (error) {
      console.error('Failed to refresh unread count:', error);
    }
  };

  const markAsRead = async (notificationId: string): Promise<void> => {
    try {
      await notificationApiService.markAsRead(notificationId);

      setState(prev => ({
        ...prev,
        notifications: prev.notifications.map(n =>
          n.id === notificationId ? { ...n, status: 'READ' as any, isNew: false } : n
        ),
        unreadCount: Math.max(0, prev.unreadCount - 1),
      }));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllAsRead = async (): Promise<void> => {
    try {
      await notificationApiService.markAllAsRead();

      setState(prev => ({
        ...prev,
        notifications: prev.notifications.map(n => ({ ...n, status: 'READ' as any, isNew: false })),
        unreadCount: 0,
      }));
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  const archiveNotification = async (notificationId: string): Promise<void> => {
    try {
      await notificationApiService.deleteNotification(notificationId);

      setState(prev => ({
        ...prev,
        notifications: prev.notifications.filter(n => n.id !== notificationId),
        unreadCount: prev.notifications.find(n => n.id === notificationId)?.isNew
          ? Math.max(0, prev.unreadCount - 1)
          : prev.unreadCount,
      }));
    } catch (error) {
      console.error('Failed to archive notification:', error);
    }
  };

  const clearNotifications = (): void => {
    setState(prev => ({ ...prev, notifications: [] }));
  };

  const value: NotificationContextType = {
    ...state,
    filters,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    archiveNotification,
    setFilters,
    clearNotifications,
    refreshUnreadCount,
    connect,
    disconnect,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications(): NotificationContextType {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}

export default NotificationContext;