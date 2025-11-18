import React, { useEffect, useState, useCallback } from 'react';
import { View, ActivityIndicator, Text, TouchableOpacity, Alert, Image } from 'react-native';
import { useLocalSearchParams, Stack, useRouter, useNavigation } from 'expo-router';
import { Channel, MessageList, MessageInput } from 'stream-chat-expo';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useChatContext } from '@/contexts/ChatContext';
import { Ionicons } from '@expo/vector-icons';
import { CustomMessage } from '@/components/CustomMessage';
import { CustomDateSeparator } from '@/components/CustomDateSeparator';
import { CustomTypingIndicator } from '@/components/CustomTypingIndicator';
import { CustomMessageInput } from '@/components/CustomMessageInput';
import Constants from 'expo-constants';
import { useAuth } from '@/lib/hooks/useAuth';
import { AIThinkingProvider } from '@/contexts/AIThinkingContext';
import { ChatbotAPI } from '@/lib/api/chatbot';

// Lazy import useVideoContext
const isExpoGo = Constants.appOwnership === 'expo';
let useVideoContext: any = () => ({
  startAudioCall: async () => {},
  startVideoCall: async () => {},
  isVideoReady: false,
});

if (!isExpoGo) {
  try {
    const videoModule = require('@/contexts/VideoContext');
    useVideoContext = videoModule.useVideoContext;
  } catch (error) {
    console.warn('VideoContext not available in Expo Go');
  }
}

// Context for sharing reply state between MessageList and MessageInput
const ReplyContext = React.createContext<{
  replyingTo: any;
  setReplyingTo: (message: any) => void;
}>({
  replyingTo: null,
  setReplyingTo: () => {},
});

export default function ChannelScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { cid } = useLocalSearchParams<{ cid: string }>();
  const { chatClient, isChatReady, initChat } = useChatContext();
  const { startAudioCall, startVideoCall, isVideoReady } = useVideoContext();
  const { user } = useAuth();
  const [channel, setChannel] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [replyingTo, setReplyingTo] = useState<any>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [otherUserAvatar, setOtherUserAvatar] = useState<string | null>(null);
  const [otherUserName, setOtherUserName] = useState<string | null>(null);
  const [isAIChannel, setIsAIChannel] = useState(false);

  // Hide tab bar when entering individual chat
  React.useEffect(() => {
    const parentNavigator = navigation.getParent();
    if (parentNavigator) {
      parentNavigator.setOptions({
        tabBarStyle: { display: 'none' },
      });
    }

    return () => {
      // Show tab bar when leaving chat (but keep hidden if still in chat group)
      // This cleanup will be handled by channels screen
    };
  }, [navigation]);

  // Auto mark as read when new messages arrive while viewing the channel
  useEffect(() => {
    if (!channel) return;

    const handleNewMessage = async (event: any) => {
      // Only mark as read if it's a new message (not from current user)
      if (event.type === 'message.new' && event.user?.id !== user?.id) {
        try {
          await channel.markRead();
          console.log('Auto-marked channel as read after new message');
        } catch (err) {
          console.error('Failed to auto-mark channel as read:', err);
        }
      }
    };

    // Listen for new messages
    channel.on('message.new', handleNewMessage);

    // Cleanup: mark as read when leaving the channel
    return () => {
      channel.off('message.new', handleNewMessage);

      // Mark as read when component unmounts (user leaves the channel)
      channel.markRead().catch((err) => {
        console.error('Failed to mark channel as read on unmount:', err);
      });
      console.log('Marked channel as read on unmount');
    };
  }, [channel, user?.id]);

  const handleRetryChat = useCallback(async () => {
    try {
      setRetryCount((prev) => prev + 1);
      await initChat();
    } catch (error) {
      console.error('Retry chat initialization failed:', error);
    }
  }, [initChat]);

  // Auto retry if chat is not ready after 10 seconds
  useEffect(() => {
    if (isChatReady || !chatClient || retryCount >= 1) return;

    const autoRetryTimeout = setTimeout(() => {
      console.log('Auto retrying chat initialization...');
      handleRetryChat();
    }, 10000); // 10 seconds

    return () => clearTimeout(autoRetryTimeout);
  }, [isChatReady, chatClient, retryCount, handleRetryChat]);

  useEffect(() => {
    if (!isChatReady || !chatClient || !cid) return;

    let timeoutId: ReturnType<typeof setTimeout>;
    let isMounted = true;

    const fetchChannel = async () => {
      try {
        console.log('Fetching channel with cid:', cid);

        // Try to get channel by querying with cid filter
        const channels = await chatClient.queryChannels({
          cid: { $eq: cid },
        });

        console.log('Query result channels count:', channels.length);

        if (channels.length > 0) {
          const channel = channels[0];
          console.log('Channel found:', channel.id, channel.cid, channel.data);

          // Ensure channel is ready before setting
          try {
            await channel.watch({ state: true, watchers: { limit: 100 } });
            console.log('Channel watched successfully, cid:', channel.cid);

            // Mark all messages as read when entering the channel
            await channel.markRead();
            console.log('Channel marked as read:', channel.cid);

            // Check if this is AI channel
            const channelIsAI =
              channel.id?.startsWith('ai-consult-') ||
              channel.data?.ai_channel === true ||
              channel.data?.consultation_type === 'ai_assistant';
            setIsAIChannel(channelIsAI);

            // Get other user's avatar and name
            try {
              const botUserId = ChatbotAPI.getAIBotUserId();
              const members = await channel.queryMembers({});
              console.log(
                'Channel members:',
                members.members.map((m) => ({
                  user_id: m.user_id,
                  name: m.user?.name,
                  image: m.user?.image,
                }))
              );
              console.log('Current user ID:', user?.id, 'type:', typeof user?.id);
              console.log('Bot user ID:', botUserId);

              if (members.members && members.members.length > 0) {
                // Convert user ID to string for comparison
                const currentUserId = String(user?.id);

                // For AI channels, find bot user
                if (channelIsAI) {
                  const botMember = members.members.find((m) => m.user_id === botUserId);
                  console.log(
                    'AI Bot member found:',
                    botMember?.user?.name,
                    'image:',
                    botMember?.user?.image
                  );

                  if (botMember?.user?.image) {
                    setOtherUserAvatar(botMember.user.image as string);
                  }
                  if (botMember?.user?.name) {
                    setOtherUserName(botMember.user.name as string);
                  }
                } else {
                  // For regular channels, find other member
                  const otherMember = members.members.find((m) => m.user_id !== currentUserId);
                  console.log(
                    'Other member found:',
                    otherMember?.user?.name,
                    'image:',
                    otherMember?.user?.image
                  );

                  if (otherMember?.user?.image) {
                    setOtherUserAvatar(otherMember.user.image as string);
                  }
                  if (otherMember?.user?.name) {
                    setOtherUserName(otherMember.user.name as string);
                  }
                }
              }
            } catch (err: any) {
              console.error('Failed to get channel members:', err);
            }

            if (isMounted) {
              setChannel(channel);
              setLoading(false);
              if (timeoutId) clearTimeout(timeoutId);
            }
            return;
          } catch (watchErr) {
            console.error('Failed to watch channel:', watchErr);
            if (isMounted) {
              setError('Lỗi khi kết nối cuộc trò chuyện');
              setLoading(false);
              if (timeoutId) clearTimeout(timeoutId);
            }
            return;
          }
        }

        console.error('No channel found with cid:', cid);

        // Fallback: try to create channel object directly
        const [channelType, channelId] = cid.split(':');
        if (channelType && channelId) {
          console.log('Fallback: creating channel object directly');
          const channel = chatClient.channel(channelType, channelId);
          try {
            await channel.watch({ state: true, watchers: { limit: 100 } });
            console.log('Fallback channel created and watched:', channel.id, channel.cid);

            // Mark all messages as read when entering the channel
            await channel.markRead();
            console.log('Fallback channel marked as read:', channel.cid);

            // Check if this is AI channel
            const channelIsAI =
              channel.id?.startsWith('ai-consult-') ||
              channel.data?.ai_channel === true ||
              channel.data?.consultation_type === 'ai_assistant';
            setIsAIChannel(channelIsAI);

            // Get other user's avatar and name
            try {
              const botUserId = ChatbotAPI.getAIBotUserId();
              const members = await channel.queryMembers({});
              console.log(
                'Fallback - Channel members:',
                members.members.map((m) => ({
                  user_id: m.user_id,
                  name: m.user?.name,
                  image: m.user?.image,
                }))
              );
              console.log('Fallback - Current user ID:', user?.id, 'type:', typeof user?.id);
              console.log('Fallback - Bot user ID:', botUserId);

              if (members.members && members.members.length > 0) {
                // Convert user ID to string for comparison
                const currentUserId = String(user?.id);

                // For AI channels, find bot user
                if (channelIsAI) {
                  const botMember = members.members.find((m) => m.user_id === botUserId);
                  console.log(
                    'Fallback - AI Bot member found:',
                    botMember?.user?.name,
                    'image:',
                    botMember?.user?.image
                  );

                  if (botMember?.user?.image) {
                    setOtherUserAvatar(botMember.user.image as string);
                  }
                  if (botMember?.user?.name) {
                    setOtherUserName(botMember.user.name as string);
                  }
                } else {
                  // For regular channels, find other member
                  const otherMember = members.members.find((m) => m.user_id !== currentUserId);
                  console.log(
                    'Fallback - Other member found:',
                    otherMember?.user?.name,
                    'image:',
                    otherMember?.user?.image
                  );

                  if (otherMember?.user?.image) {
                    setOtherUserAvatar(otherMember.user.image as string);
                  }
                  if (otherMember?.user?.name) {
                    setOtherUserName(otherMember.user.name as string);
                  }
                }
              }
            } catch (err: any) {
              console.error('Failed to get channel members:', err);
            }

            if (isMounted) {
              setChannel(channel);
              setLoading(false);
              if (timeoutId) clearTimeout(timeoutId);
            }
            return;
          } catch (fallbackErr) {
            console.error('Fallback channel creation failed:', fallbackErr);
            if (isMounted) {
              setError('Lỗi khi tạo cuộc trò chuyện');
              setLoading(false);
              if (timeoutId) clearTimeout(timeoutId);
            }
            return;
          }
        }

        // If all methods fail, set error
        if (isMounted) {
          setError('Không thể tìm thấy cuộc trò chuyện');
          setLoading(false);
          if (timeoutId) clearTimeout(timeoutId);
        }
      } catch (err) {
        console.error('Failed to fetch channel:', err);
        if (isMounted) {
          setError('Lỗi khi tải cuộc trò chuyện');
          setLoading(false);
          if (timeoutId) clearTimeout(timeoutId);
        }
      }
    };

    // Set timeout to avoid infinite loading
    timeoutId = setTimeout(() => {
      if (isMounted && loading) {
        console.error('Channel loading timeout');
        setError('Quá thời gian tải cuộc trò chuyện');
        setLoading(false);
      }
    }, 15000); // 15 seconds timeout

    fetchChannel();

    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [cid, isChatReady, chatClient, retryCount, loading]);

  if (!isChatReady || !chatClient) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50">
        <Stack.Screen options={{ title: 'Đang tải...' }} />
        <View className="flex-1 items-center justify-center p-6">
          <View className="mb-6 items-center justify-center rounded-full bg-blue-50 p-6">
            <Ionicons name="chatbubbles" size={48} color="#2563EB" />
          </View>
          <Text className="mb-2 text-center text-xl font-semibold text-slate-900">
            Đang kết nối chat
          </Text>
          <Text className="mb-6 text-center text-sm text-slate-600">
            {chatClient ? 'Đang hoàn tất kết nối...' : 'Đang khởi tạo kết nối chat...'}
          </Text>
          <ActivityIndicator size="large" color="#2563EB" />
          {retryCount > 0 && (
            <Text className="mt-2 text-center text-xs text-slate-500">
              Đã thử lại {retryCount} lần
            </Text>
          )}
          <TouchableOpacity
            onPress={handleRetryChat}
            className="mt-4 flex-row items-center rounded-lg bg-blue-600 px-4 py-2"
            style={{
              shadowColor: '#2563EB',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.2,
              shadowRadius: 4,
              elevation: 3,
            }}>
            <Ionicons name="refresh" size={16} color="white" />
            <Text className="ml-2 text-sm font-medium text-white">Thử lại</Text>
          </TouchableOpacity>
          <Text className="mt-2 text-center text-xs text-slate-500">
            Nếu vẫn không được, hãy thoát và vào lại
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-gray-100">
        <Stack.Screen options={{ title: 'Lỗi' }} />
        <View className="flex-1 items-center justify-center p-6">
          <View className="mb-4 items-center justify-center rounded-full bg-red-50 p-6">
            <Ionicons name="alert-circle" size={48} color="#ef4444" />
          </View>
          <Text className="mb-2 text-center text-xl font-bold text-gray-900">
            Không thể tải cuộc trò chuyện
          </Text>
          <Text className="mb-6 text-center text-gray-600">
            {error || 'Cuộc trò chuyện có thể chưa được tạo hoặc đã bị xóa.'}
          </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            className="flex-row items-center rounded-lg bg-cyan-500 px-6 py-3">
            <Ionicons name="arrow-back" size={20} color="white" />
            <Text className="ml-2 font-medium text-white">Quay lại</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-100">
        <Stack.Screen options={{ title: 'Đang tải...' }} />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#06b6d4" />
          <Text className="mt-4 text-base text-gray-600">Đang tải cuộc trò chuyện...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleAudioCall = () => {
    if (isExpoGo) {
      Alert.alert(
        'Tính năng không khả dụng',
        'Video call chỉ hoạt động khi build ứng dụng. Vui lòng sử dụng bản production.'
      );
      return;
    }
    if (!isVideoReady) {
      Alert.alert('Thông báo', 'Dịch vụ gọi điện chưa sẵn sàng. Vui lòng thử lại sau.');
      return;
    }
    if (!channel?.id) return;
    startAudioCall(channel.id);
  };

  const handleVideoCall = () => {
    if (isExpoGo) {
      Alert.alert(
        'Tính năng không khả dụng',
        'Video call chỉ hoạt động khi build ứng dụng. Vui lòng sử dụng bản production.'
      );
      return;
    }
    if (!isVideoReady) {
      Alert.alert('Thông báo', 'Dịch vụ video call chưa sẵn sàng. Vui lòng thử lại sau.');
      return;
    }
    if (!channel?.id) return;
    startVideoCall(channel.id);
  };

  // Get display name with fallback
  const displayName =
    otherUserName || channel.data?.name || (isAIChannel ? 'Trợ lý Y tế Thông minh' : 'Tư vấn y tế');

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <Stack.Screen
        options={{
          headerShown: true,
          headerBackTitle: 'Quay lại',
          headerBackVisible: true,
          headerStyle: {
            backgroundColor: isAIChannel ? '#7C3AED' : '#2563EB',
          },
          headerTintColor: '#ffffff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          headerTitle: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              {/* Avatar */}
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: isAIChannel ? '#F3E8FF' : '#DBEAFE',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 2,
                  borderColor: '#FFFFFF',
                  position: 'relative',
                }}>
                {otherUserAvatar ? (
                  <Image
                    source={{ uri: otherUserAvatar }}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                    }}
                    resizeMode="cover"
                  />
                ) : isAIChannel ? (
                  <Ionicons name="sparkles" size={20} color="#A855F7" />
                ) : (
                  <Ionicons name="person" size={20} color="#2563EB" />
                )}
                {/* AI indicator badge */}
                {isAIChannel && (
                  <View
                    style={{
                      position: 'absolute',
                      right: -4,
                      bottom: -4,
                      width: 14,
                      height: 14,
                      borderRadius: 7,
                      backgroundColor: '#A855F7',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderWidth: 2,
                      borderColor: '#FFFFFF',
                    }}>
                    <Ionicons name="sparkles" size={8} color="#FFFFFF" />
                  </View>
                )}
              </View>
              {/* User Name */}
              <Text
                style={{
                  fontSize: 17,
                  fontWeight: 'bold',
                  color: '#FFFFFF',
                }}
                numberOfLines={1}>
                {displayName}
              </Text>
            </View>
          ),
          headerRight: () =>
            isAIChannel ? (
              // For AI channels, show a small AI badge instead of call buttons
              <View style={{ flexDirection: 'row', marginRight: 8, gap: 8, alignItems: 'center' }}>
                <View
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    paddingHorizontal: 10,
                    paddingVertical: 5,
                    borderRadius: 12,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4,
                  }}>
                  <Ionicons name="sparkles" size={16} color="white" />
                  <Text style={{ color: 'white', fontSize: 12, fontWeight: '600' }}>AI</Text>
                </View>
              </View>
            ) : (
              <View style={{ flexDirection: 'row', marginRight: 8, gap: 12 }}>
                {/* Audio Call Button */}
                <TouchableOpacity
                  onPress={handleAudioCall}
                  style={{
                    padding: 8,
                    borderRadius: 20,
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  }}>
                  <Ionicons name="call" size={22} color="white" />
                </TouchableOpacity>

                {/* Video Call Button */}
                <TouchableOpacity
                  onPress={handleVideoCall}
                  style={{
                    padding: 8,
                    borderRadius: 20,
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  }}>
                  <Ionicons name="videocam" size={22} color="white" />
                </TouchableOpacity>
              </View>
            ),
        }}
      />

      <AIThinkingProvider>
        <ReplyContext.Provider value={{ replyingTo, setReplyingTo }}>
          <Channel channel={channel} MessageSimple={CustomMessage} DateHeader={CustomDateSeparator}>
            {/* AI Channel Notice Banner */}
            {isAIChannel && (
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
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: '#A855F7',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  <Ionicons name="sparkles" size={18} color="white" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: '600',
                      color: '#7C3AED',
                      marginBottom: 2,
                    }}>
                    Trò chuyện với Trợ lý AI
                  </Text>
                  <Text style={{ fontSize: 11, color: '#9333EA' }}>
                    Được hỗ trợ bởi trí tuệ nhân tạo tiên tiến
                  </Text>
                </View>
              </View>
            )}

            {/* Message List Container */}
            <View
              className="flex-1"
              style={{ backgroundColor: isAIChannel ? '#FAF5FF' : '#F8FAFC' }}>
              <MessageList
                additionalFlatListProps={{
                  contentContainerStyle: {
                    paddingTop: 16,
                    paddingBottom: 8,
                  },
                }}
              />
            </View>

            {/* Typing Indicator - render manually outside MessageList */}
            <CustomTypingIndicator />

            {/* Custom Message Input with proper typing indicator */}
            <CustomMessageInput />
          </Channel>
        </ReplyContext.Provider>
      </AIThinkingProvider>
    </SafeAreaView>
  );
}
