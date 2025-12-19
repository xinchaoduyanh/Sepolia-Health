'use client';

import React, { useState } from 'react';
import NotificationBell from './notification-bell';
import NotificationPanel from './notification-panel';

interface NotificationCenterProps {
  className?: string;
  userId?: string;
  userToken?: string;
}

export function NotificationCenter({ className = '', userId, userToken }: NotificationCenterProps) {
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const handleBellClick = () => {
    setIsPanelOpen(!isPanelOpen);
  };

  const handlePanelClose = () => {
    setIsPanelOpen(false);
  };

  return (
    <div className={`relative ${className}`}>
      <NotificationBell onClick={handleBellClick} />
      {isPanelOpen && (
        <NotificationPanel
          isOpen={isPanelOpen}
          onClose={handlePanelClose}
          className="right-0"
        />
      )}
    </div>
  );
}

export default NotificationCenter;