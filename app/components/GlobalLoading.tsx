import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useAuth } from '@/lib/hooks/useAuth';
import { useChatContext } from '@/contexts/ChatContext';
import { useNotificationContext } from '@/contexts/NotificationContext';
import { usePathname } from 'expo-router';

export const GlobalLoading = () => {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { isChatReady } = useChatContext();
  const { isReady: isNotificationReady } = useNotificationContext();
  const pathname = usePathname();
  const [showLoading, setShowLoading] = useState(false);

  useEffect(() => {
    // Chỉ hiển thị loading khi:
    // 1. Đã có user (đã login)
    // 2. Auth không còn loading
    // 3. Chat hoặc Notification CHƯA sẵn sàng
    // 4. Không phải đang ở màn hình login/register (để tránh flash ở màn auth)
    const isAuthRoute = pathname.includes('(auth)');

    if (user && !isAuthLoading && !isAuthRoute) {
      if (!isChatReady || !isNotificationReady) {
        setShowLoading(true);
      } else {
        // Thêm một chút delay nhỏ để tránh flash màn hình nếu load quá nhanh
        const timer = setTimeout(() => {
          setShowLoading(false);
        }, 500);
        return () => clearTimeout(timer);
      }
    } else {
      setShowLoading(false);
    }
  }, [user, isAuthLoading, isChatReady, isNotificationReady, pathname]);

  if (!showLoading) return null;

  return (
    <View className="absolute inset-0 z-50 flex-1 items-center justify-center bg-white/90">
      <View className="items-center space-y-4">
        <ActivityIndicator size="large" color="#2563EB" />
        <Text className="text-lg font-medium text-gray-700">
          Đang kết nối hệ thống...
        </Text>
        <Text className="text-sm text-gray-500">
          Vui lòng đợi trong giây lát
        </Text>
      </View>
    </View>
  );
};
