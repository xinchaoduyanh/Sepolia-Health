'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useNotifications } from '@/contexts/notification-context';
import { NotificationListItem, getNotificationIcon, getNotificationColor } from '@/types/notification.types';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

export function NotificationPanel({ isOpen, onClose, className = '' }: NotificationPanelProps) {
  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    archiveNotification,
    filters,
    setFilters,
  } = useNotifications();

  const panelRef = useRef<HTMLDivElement>(null);
  const lastNotificationRef = useRef<HTMLDivElement>(null);

  // Show all notifications without filters
  const filteredNotifications = notifications;

  // Close panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, onClose]);

  // Auto-scroll to bottom when new notifications arrive
  useEffect(() => {
    if (lastNotificationRef.current && isOpen) {
      lastNotificationRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [notifications.length, isOpen]);

  const handleNotificationClick = async (notification: NotificationListItem) => {
    if (notification.isNew) {
      await markAsRead(notification.id);
    }
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  const handleArchive = async (notificationId: string) => {
    await archiveNotification(notificationId);
  };

  const getRelativeTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return formatDistanceToNow(date, { addSuffix: true, locale: vi });
    } catch {
      return 'Vừa xong';
    }
  };

  
  if (!isOpen) return null;

  return (
    <div
      ref={panelRef}
      className={`
        absolute top-full right-0 mt-2 w-96 max-h-[600px] bg-white dark:bg-gray-800
        border border-gray-200 dark:border-gray-700 rounded-lg shadow-2xl
        z-50 flex flex-col ${className}
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Thông báo
          </h3>
          {unreadCount > 0 && (
            <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full">
              {unreadCount} mới
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Filters and Actions */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 space-y-3">
        {/* Actions */}
        <div className="flex space-x-2">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700
                       focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium"
            >
              Đọc tất cả
            </button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-gray-500 dark:text-gray-400">
            <svg className="w-12 h-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 00-.707.293l-2.414-2.414a1 1 0 00-.707-.293H4m16 0v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2z" />
            </svg>
            <p>Không có thông báo nào</p>
            <p className="text-sm mt-2">
              Bạn sẽ thấy thông báo ở đây
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredNotifications.map((notification, index) => (
              <div
                key={notification.id}
                ref={index === filteredNotifications.length - 1 ? lastNotificationRef : null}
                className={`
                  p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer
                  transition-colors duration-150 ${notification.isNew ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
                `}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex items-start space-x-3">
                  {/* Notification Icon */}
                  <div className={`
                    flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center
                    ${getNotificationColor(notification.priority)} text-white
                  `}>
                    <span className="text-lg">{getNotificationIcon(notification.type)}</span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {notification.title}
                      </h4>
                      <div className="flex items-center space-x-1">
                        {/* Unread indicator */}
                        {notification.isNew && (
                          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                        )}
                        {/* Actions */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleArchive(notification.id);
                          }}
                          className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m0-4V7" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
                      {notification.message}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        {getRelativeTime(notification.createdAt)}
                      </p>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {notification.type}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
            <span>{notifications.length} thông báo</span>
            <button
              onClick={() => { /* Navigate to full notifications page */ }}
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              Xem tất cả
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationPanel;