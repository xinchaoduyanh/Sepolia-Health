'use client';

import React, { useRef, useState } from 'react';
import { useNotifications } from '@/contexts/notification-context';
import { getNotificationColor } from '@/types/notification.types';

interface NotificationBellProps {
  className?: string;
  onClick?: () => void;
}

export function NotificationBell({ className = '', onClick }: NotificationBellProps) {
  const { unreadCount, isConnected } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const bellRef = useRef<HTMLButtonElement>(null);

  const handleClick = () => {
    setIsOpen(!isOpen);
    onClick?.();
  };

  const getColorByCount = () => {
    if (!isConnected) return 'bg-gray-400';
    if (unreadCount === 0) return 'bg-gray-500';
    if (unreadCount <= 3) return 'bg-blue-500';
    if (unreadCount <= 10) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getAnimationDelay = (index: number) => {
    return `${index * 0.1}s`;
  };

  return (
    <div className="relative">
      <button
        ref={bellRef}
        onClick={handleClick}
        className={`
          relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800
          transition-colors duration-200 focus:outline-none focus:ring-2
          focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900
          ${className}
        `}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
      >
        {/* Bell Icon */}
        <svg
          className={`w-6 h-6 transition-transform duration-200 ${isOpen ? 'scale-110' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.739 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>

        {/* Connection Status Indicator */}
        <div
          className={`
            absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white dark:border-gray-900
            ${isConnected ? 'bg-green-500' : 'bg-red-500'}
          `}
        />

        {/* Unread Count Badge */}
        {unreadCount > 0 && (
          <div
            className={`
              absolute -top-2 -right-2 min-w-[20px] h-5 rounded-full
              ${getColorByCount()} text-white text-xs font-bold
              flex items-center justify-center px-1.5
              animate-pulse shadow-lg
            `}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </div>
        )}

        {/* Ripple Effect when new notifications arrive */}
        {unreadCount > 0 && (
          <div className="absolute inset-0 rounded-lg animate-ping">
            <div className={`w-6 h-6 ${getColorByCount()} rounded-full opacity-25`} />
          </div>
        )}
      </button>

      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-gray-900 text-white text-sm rounded-md opacity-0 pointer-events-none transition-opacity duration-200 hover:opacity-100 whitespace-nowrap z-50">
        {isConnected ? (
          unreadCount > 0 ? (
            `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`
          ) : (
            'No new notifications'
          )
        ) : (
          'Disconnected from notifications'
        )}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900" />
      </div>

      {/* Animated dots when disconnected */}
      {!isConnected && (
        <div className="absolute -bottom-1 -right-1 flex space-x-1">
          {[0, 1, 2].map((index) => (
            <div
              key={index}
              className="w-1 h-1 bg-red-500 rounded-full animate-pulse"
              style={{
                animationDelay: getAnimationDelay(index),
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default NotificationBell;