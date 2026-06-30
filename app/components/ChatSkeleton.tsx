import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Skeleton hiển thị trong lúc tải channel chat, thay cho spinner trống.
 * Có thanh header giả + vài bong bóng tin nhắn trái/phải với hiệu ứng shimmer.
 * Tự đổi tông màu theo loại chat: tím (AI) hoặc xanh dương (chat thường) để
 * trùng với UI thật, tránh "nháy màu" khi load xong.
 */

interface SkeletonTheme {
  headerBg: string;
  background: readonly [string, string, ...string[]];
  bubbleLeft: string;
  bubbleRight: string;
}

const AI_THEME: SkeletonTheme = {
  headerBg: '#7C3AED',
  background: ['#FAF5FF', '#F5F3FF', '#EEF2FF'],
  bubbleLeft: '#EDE9FE',
  bubbleRight: '#DDD6FE',
};

const DEFAULT_THEME: SkeletonTheme = {
  headerBg: '#2563EB',
  background: ['#F8FAFC', '#F8FAFC'],
  bubbleLeft: '#E2E8F0',
  bubbleRight: '#BFDBFE',
};

const MessageBubble = ({
  shimmer,
  align,
  width,
  theme,
}: {
  shimmer: Animated.AnimatedInterpolation<number>;
  align: 'left' | 'right';
  width: number;
  theme: SkeletonTheme;
}) => (
  <View
    style={{
      flexDirection: 'row',
      justifyContent: align === 'right' ? 'flex-end' : 'flex-start',
      alignItems: 'flex-end',
      paddingHorizontal: 16,
      marginBottom: 16,
      gap: 8,
    }}>
    {align === 'left' && (
      <Animated.View
        style={{
          width: 32,
          height: 32,
          borderRadius: 16,
          backgroundColor: theme.bubbleLeft,
          opacity: shimmer,
        }}
      />
    )}
    <Animated.View
      style={{
        width,
        height: 44,
        borderRadius: 20,
        borderBottomLeftRadius: align === 'left' ? 4 : 20,
        borderBottomRightRadius: align === 'right' ? 4 : 20,
        backgroundColor: align === 'right' ? theme.bubbleRight : theme.bubbleLeft,
        opacity: shimmer,
      }}
    />
  </View>
);

export const ChatSkeleton = ({ isAI = false }: { isAI?: boolean }) => {
  const insets = useSafeAreaInsets();
  const anim = useRef(new Animated.Value(0)).current;
  const theme = isAI ? AI_THEME : DEFAULT_THEME;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 0,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [anim]);

  const shimmer = anim.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] });

  return (
    <View style={{ flex: 1 }}>
      {/* Header giả - cùng tông màu với header thật */}
      <View style={{ backgroundColor: theme.headerBg, paddingTop: insets.top }}>
        <View
          style={{
            height: 56,
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 16,
            gap: 12,
          }}>
          <Ionicons name="arrow-back" size={24} color="rgba(255,255,255,0.7)" />
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: 'rgba(255,255,255,0.25)',
            }}
          />
          <View
            style={{
              width: 140,
              height: 16,
              borderRadius: 8,
              backgroundColor: 'rgba(255,255,255,0.25)',
            }}
          />
        </View>
      </View>

      {/* Nền + bong bóng tin nhắn giả - cùng nền với chat thật */}
      <LinearGradient
        colors={theme.background}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ flex: 1 }}>
        {/* Banner AI giả để khớp với chat AI thật */}
        {isAI && (
          <View
            style={{
              backgroundColor: '#F3E8FF',
              paddingHorizontal: 16,
              paddingVertical: 12,
              borderBottomWidth: 1,
              borderBottomColor: '#E9D5FF',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
            }}>
            <Animated.View
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: '#A855F7',
                opacity: shimmer,
              }}
            />
            <Animated.View
              style={{ width: 180, height: 28, borderRadius: 8, backgroundColor: '#E9D5FF', opacity: shimmer }}
            />
          </View>
        )}
        <SafeAreaView edges={['bottom']} style={{ flex: 1, paddingTop: 20 }}>
          <MessageBubble shimmer={shimmer} align="left" width={200} theme={theme} />
          <MessageBubble shimmer={shimmer} align="right" width={150} theme={theme} />
          <MessageBubble shimmer={shimmer} align="left" width={240} theme={theme} />
          <MessageBubble shimmer={shimmer} align="left" width={120} theme={theme} />
          <MessageBubble shimmer={shimmer} align="right" width={180} theme={theme} />
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
};
