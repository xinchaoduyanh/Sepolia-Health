import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Text, TouchableOpacity, View } from 'react-native';
import { useChannelContext } from 'stream-chat-expo';

const SUGGESTED_QUESTIONS = [
  { icon: 'calendar-outline', text: 'Tôi muốn đặt lịch khám' },
  { icon: 'medkit-outline', text: 'Triệu chứng của tôi là gì?' },
  { icon: 'document-text-outline', text: 'Giải thích kết quả xét nghiệm' },
  { icon: 'help-circle-outline', text: 'Tư vấn sức khỏe tổng quát' },
];

/**
 * Màn hình chào mừng khi lần đầu mở cuộc trò chuyện với Trợ lý AI.
 * Có hiệu ứng: avatar phát sáng nhịp nhàng, nội dung trượt lên + mờ dần,
 * và các gợi ý câu hỏi để bắt đầu nhanh.
 */
export const AIWelcomeScreen = () => {
  const { channel } = useChannelContext();

  // Entrance animation
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;
  // Glow pulse animation
  const glowAnim = useRef(new Animated.Value(0)).current;
  // Floating animation for avatar
  const floatAnim = useRef(new Animated.Value(0)).current;
  // Staggered chips
  const chipsAnim = useRef(SUGGESTED_QUESTIONS.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    // Fade + slide in
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    // Staggered chips entrance
    Animated.stagger(
      120,
      chipsAnim.map((anim) =>
        Animated.spring(anim, {
          toValue: 1,
          friction: 7,
          tension: 40,
          useNativeDriver: true,
        })
      )
    ).start();

    // Looping glow pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 1600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 1600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Looping float
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 2200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [fadeAnim, slideAnim, glowAnim, floatAnim, chipsAnim]);

  const handleSuggestion = async (text: string) => {
    if (!channel) return;
    try {
      // AI trả lời do Stream webhook -> backend xử lý (không gọi direct API).
      await channel.sendMessage({ text });
    } catch {
      // Silent: input still available for retry
    }
  };

  const glowScale = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.35] });
  const glowOpacity = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.45, 0] });
  const floatY = floatAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -10] });

  return (
    <LinearGradient
      colors={['#FAF5FF', '#F5F3FF', '#EEF2FF']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 28,
      }}>
      <Animated.View
        style={{
          alignItems: 'center',
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }}>
        {/* Avatar with pulsing glow */}
        <Animated.View style={{ transform: [{ translateY: floatY }], marginBottom: 24 }}>
          {/* Outer glow ring */}
          <Animated.View
            style={{
              position: 'absolute',
              top: -14,
              left: -14,
              right: -14,
              bottom: -14,
              borderRadius: 60,
              backgroundColor: '#A855F7',
              opacity: glowOpacity,
              transform: [{ scale: glowScale }],
            }}
          />
          <LinearGradient
            colors={['#8B5CF6', '#A855F7', '#D946EF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              width: 92,
              height: 92,
              borderRadius: 46,
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: '#A855F7',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.4,
              shadowRadius: 16,
              elevation: 8,
            }}>
            <Ionicons name="sparkles" size={44} color="#FFFFFF" />
          </LinearGradient>
        </Animated.View>

        {/* Title */}
        <Text
          style={{
            fontSize: 22,
            fontWeight: '800',
            color: '#581C87',
            textAlign: 'center',
            marginBottom: 8,
          }}>
          Trợ lý Y tế Thông minh
        </Text>
        <Text
          style={{
            fontSize: 14,
            color: '#7C3AED',
            textAlign: 'center',
            lineHeight: 20,
            marginBottom: 28,
            maxWidth: 300,
          }}>
          Xin chào! Tôi có thể giúp bạn đặt lịch khám, giải đáp triệu chứng và tư vấn sức khỏe. Hãy
          bắt đầu nhé 👇
        </Text>

        {/* Suggested questions */}
        <View style={{ width: '100%', gap: 12 }}>
          {SUGGESTED_QUESTIONS.map((q, i) => (
            <Animated.View
              key={q.text}
              style={{
                opacity: chipsAnim[i],
                transform: [
                  {
                    translateY: chipsAnim[i].interpolate({
                      inputRange: [0, 1],
                      outputRange: [16, 0],
                    }),
                  },
                ],
              }}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => handleSuggestion(q.text)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: '#FFFFFF',
                  borderRadius: 16,
                  paddingVertical: 14,
                  paddingHorizontal: 16,
                  borderWidth: 1,
                  borderColor: '#E9D5FF',
                  shadowColor: '#A855F7',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.1,
                  shadowRadius: 8,
                  elevation: 2,
                }}>
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: '#F3E8FF',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 12,
                  }}>
                  <Ionicons name={q.icon as any} size={20} color="#A855F7" />
                </View>
                <Text style={{ flex: 1, fontSize: 14, color: '#4C1D95', fontWeight: '600' }}>
                  {q.text}
                </Text>
                <Ionicons name="arrow-forward" size={16} color="#C084FC" />
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>
      </Animated.View>
    </LinearGradient>
  );
};
