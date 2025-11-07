import React, { useEffect, useRef } from 'react';
import { View, Text, Animated } from 'react-native';
import { useTypingContext } from 'stream-chat-expo';

export const CustomTypingIndicator = () => {
  const { typing } = useTypingContext();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (Object.keys(typing).length > 0) {
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
  }, [typing, fadeAnim]);

  if (Object.keys(typing).length === 0) {
    return null;
  }

  const typingUsers = Object.values(typing)
    .map((user: any) => user.user?.name || 'Someone')
    .join(', ');

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
      }}>
      <View
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 20,
          borderWidth: 1,
          borderColor: '#E2E8F0',
          paddingHorizontal: 16,
          paddingVertical: 10,
          flexDirection: 'row',
          alignItems: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 2,
          elevation: 1,
        }}>
        {/* Animated dots */}
        <View style={{ flexDirection: 'row', marginRight: 8 }}>
          <AnimatedDot delay={0} />
          <AnimatedDot delay={150} />
          <AnimatedDot delay={300} />
        </View>
        <Text
          style={{
            fontSize: 13,
            color: '#64748B',
            fontStyle: 'italic',
          }}>
          {typingUsers} đang nhập...
        </Text>
      </View>
    </Animated.View>
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
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#64748B',
        marginHorizontal: 2,
        transform: [{ scale: scaleAnim }],
      }}
    />
  );
};
