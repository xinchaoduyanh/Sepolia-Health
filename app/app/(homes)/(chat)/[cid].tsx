import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, Text, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { Channel, MessageList, MessageInput } from 'stream-chat-expo';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useChatContext } from '@/contexts/ChatContext';
import { Ionicons } from '@expo/vector-icons';

const ChannelScreen = () => {
  const router = useRouter();
  const { cid } = useLocalSearchParams<{ cid: string }>();
  const { chatClient, isChatReady } = useChatContext();
  const [channel, setChannel] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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
  }, [cid, isChatReady, chatClient]);

  if (!isChatReady || !chatClient) {
    return (
      <SafeAreaView className="flex-1 bg-gray-100">
        <Stack.Screen options={{ title: 'Đang tải...' }} />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#06b6d4" />
          <Text className="mt-4 text-base text-gray-600">Đang kết nối chat...</Text>
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
    <SafeAreaView className="flex-1 bg-white">
      <Stack.Screen
        options={{
          title: channel.data?.name || 'Tư vấn y tế',
          headerBackTitle: 'Tin nhắn',
          headerStyle: {
            backgroundColor: '#06b6d4',
          },
          headerTintColor: '#ffffff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          headerRight: () => (
            <View className="mr-4 flex-row items-center">
              <View className="mr-2 h-2 w-2 rounded-full bg-green-400" />
              <Text className="text-sm text-white">Đang hoạt động</Text>
            </View>
          ),
        }}
      />
      <Channel channel={channel}>
        <MessageList />
        <MessageInput />
      </Channel>
    </SafeAreaView>
  );
};

export default ChannelScreen;
