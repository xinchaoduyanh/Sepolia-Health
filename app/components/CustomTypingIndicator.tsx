import React, { useEffect, useRef } from 'react';
import { View, Text, Animated } from 'react-native';
import { useAIThinking } from '@/contexts/AIThinkingContext';

export const CustomTypingIndicator = () => {
  const { isAIThinking } = useAIThinking();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isAIThinking) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [isAIThinking, fadeAnim]);

  if (!isAIThinking) {
    return null;
  }

  const displayMessage = 'Trợ lý Y tế Thông minh đang suy nghĩ câu trả lời...';

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginTop: 8, // Tách với message bên trên
        backgroundColor: '#F8FAFC',
      }}>
      <Animated.View
        style={{
          opacity: fadeAnim,
          flexDirection: 'row',
          alignItems: 'center',
        }}>
        <View
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 24,
            borderWidth: 1.5,
            borderColor: '#DBEAFE',
            paddingHorizontal: 20,
            paddingVertical: 14,
            flexDirection: 'row',
            alignItems: 'center',
            shadowColor: '#2563EB',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 2,
          }}>
          {/* Animated dots - larger */}
          <View style={{ flexDirection: 'row', marginRight: 12 }}>
            <AnimatedDot delay={0} />
            <AnimatedDot delay={150} />
            <AnimatedDot delay={300} />
          </View>
          <Text
            style={{
              fontSize: 15,
              color: '#2563EB',
              fontWeight: '500',
              fontStyle: 'italic',
            }}>
            {displayMessage}
          </Text>
        </View>
      </Animated.View>
    </View>
  );
};

const AnimatedDot = ({ delay }: { delay: number }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(scaleAnim, {
          toValue: 1.5,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();

    return () => animation.stop();
  }, [scaleAnim, delay]);

  return (
    <Animated.View
      style={{
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#2563EB',
        marginHorizontal: 3,
        transform: [{ scale: scaleAnim }],
      }}
    />
  );
};
