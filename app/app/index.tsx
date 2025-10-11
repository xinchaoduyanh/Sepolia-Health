'use client';

import { useEffect, useRef } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/lib/hooks/useAuth';

export default function IndexScreen() {
  const { isAuthenticated, isLoading } = useAuth();
  const hasNavigated = useRef(false);

  useEffect(() => {
    // Only navigate after component has mounted and auth state is determined
    if (!isLoading && !hasNavigated.current) {
      hasNavigated.current = true;

      // Use setTimeout to ensure navigation happens after render
      const timer = setTimeout(() => {
        if (isAuthenticated) {
          router.replace('/(homes)' as any);
        } else {
          router.replace('/(auth)/login' as any);
        }
      }, 0);

      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, isLoading]);

  return (
    <View className="flex-1 items-center justify-center bg-white">
      <ActivityIndicator size="large" color="#2F80ED" />
      <Text className="mt-4 text-lg text-gray-600">Đang tải...</Text>
    </View>
  );
}
