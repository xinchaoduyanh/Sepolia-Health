import React, { useEffect, useState, useCallback } from 'react';
import { View, ActivityIndicator, Text, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, Stack, useRouter, useNavigation } from 'expo-router';
import { Channel, MessageList, MessageInput } from 'stream-chat-expo';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useChatContext } from '@/contexts/ChatContext';
import { Ionicons } from '@expo/vector-icons';
import { CustomMessage } from '@/components/CustomMessage';
import { CustomDateSeparator } from '@/components/CustomDateSeparator';
import { CustomTypingIndicator } from '@/components/CustomTypingIndicator';
import { CustomMessageInput } from '@/components/CustomMessageInput';

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
  const [channel, setChannel] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [replyingTo, setReplyingTo] = useState<any>(null);
  const [retryCount, setRetryCount] = useState(0);

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
            await channel.watch();
            console.log('Channel watched successfully, cid:', channel.cid);
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
            await channel.watch();
            console.log('Fallback channel created and watched:', channel.id, channel.cid);
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

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <Stack.Screen
        options={{
          headerShown: true,
          title: channel.data?.name || 'Tư vấn y tế',
          headerBackTitle: 'Quay lại',
          headerBackVisible: true,
          headerStyle: {
            backgroundColor: '#2563EB',
          },
          headerTintColor: '#ffffff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      />

      <ReplyContext.Provider value={{ replyingTo, setReplyingTo }}>
        <Channel
          channel={channel}
          MessageSimple={CustomMessage}
          DateHeader={CustomDateSeparator}
          TypingIndicator={CustomTypingIndicator}>
          {/* Message List Container */}
          <View className="flex-1">
            <MessageList
              additionalFlatListProps={{
                contentContainerStyle: {
                  paddingTop: 16,
                  paddingBottom: 8,
                },
              }}
            />
          </View>

          {/* Message Input - Use default for now with image/file support */}
          <MessageInput />
        </Channel>
      </ReplyContext.Provider>
    </SafeAreaView>
  );
}
