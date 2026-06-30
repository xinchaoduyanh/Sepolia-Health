import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ChatbotAPI } from '@/lib/api/chatbot';

export const CustomTypingIndicator = ({
  isAIThinking,
  isAI,
  avatar,
  userName,
}: {
  isAIThinking: boolean;
  isAI: boolean;
  avatar?: string | null;
  userName?: string | null;
}) => {
  if (!isAIThinking) {
    return null;
  }

  // Determine styles based on whether it is AI or human assistant
  const displayName = isAI ? 'Trợ lý AI' : (userName || 'Trợ lý');
  const dotColor = isAI ? '#8B5CF6' : '#2563EB'; // Purple for AI, Blue for human
  const borderColor = isAI ? '#E9D5FF' : '#E2E8F0'; // Purple border for AI, grey for human
  const shadowColor = isAI ? '#A855F7' : '#000000'; // Purple shadow for AI, black shadow for human
  const nameColor = isAI ? '#7C3AED' : '#64748B'; // Purple text for AI, slate grey for human

  // Render Avatar
  const renderAvatar = () => {
    if (isAI) {
      return (
        <Image
          source={ChatbotAPI.getAIBotAvatar()}
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            marginRight: 8,
            borderWidth: 2,
            borderColor: '#FFFFFF',
          }}
          resizeMode="cover"
        />
      );
    }

    if (avatar) {
      return (
        <Image
          source={{ uri: avatar }}
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            marginRight: 8,
            borderWidth: 2,
            borderColor: '#FFFFFF',
          }}
          resizeMode="cover"
        />
      );
    }

    // Default icon avatar for human
    return (
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: 16,
          backgroundColor: '#E2E8F0',
          marginRight: 8,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 2,
          borderColor: '#FFFFFF',
        }}>
        <Ionicons name="person" size={16} color="#64748B" />
      </View>
    );
  };

  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 4,
        alignItems: 'flex-end',
        marginBottom: 8,
      }}>
      {/* Avatar */}
      {renderAvatar()}

      {/* Message Content Container */}
      <View
        style={{
          maxWidth: '75%',
          flexDirection: 'column',
          alignItems: 'flex-start',
        }}>
        {/* Username */}
        <Text
          style={{
            fontSize: 12,
            color: nameColor,
            fontWeight: '600',
            marginBottom: 4,
            marginLeft: 8,
          }}>
          {displayName}
        </Text>

        {/* Message Bubble */}
        <View
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 20,
            borderBottomLeftRadius: 4,
            paddingHorizontal: 18,
            paddingVertical: 14,
            shadowColor: shadowColor,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: isAI ? 0.08 : 0.05,
            shadowRadius: 4,
            elevation: 2,
            borderWidth: 1,
            borderColor: borderColor,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          {/* Animated dots - modern waves */}
          <View style={{ flexDirection: 'row', alignItems: 'center', height: 8 }}>
            <AnimatedDot delay={0} color={dotColor} />
            <AnimatedDot delay={150} color={dotColor} />
            <AnimatedDot delay={300} color={dotColor} />
          </View>
        </View>
      </View>
    </View>
  );
};

const AnimatedDot = ({ delay, color }: { delay: number; color: string }) => {
  const travelAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(travelAnim, {
          toValue: -5,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.timing(travelAnim, {
          toValue: 0,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.delay(350),
      ])
    );

    animation.start();

    return () => animation.stop();
  }, [travelAnim, delay]);

  return (
    <Animated.View
      style={{
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: color,
        marginHorizontal: 3.5,
        transform: [{ translateY: travelAnim }],
      }}
    />
  );
};
