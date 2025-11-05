'use client';

import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Pressable } from 'react-native';
import React from 'react';
import { useChatContext } from '@/contexts/ChatContext';
import { Channel } from 'stream-chat';
import { Stack, useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const ChannelItem = ({ channel }: { channel: Channel }) => {
  const router = useRouter();
  const handlePress = () => {
    console.log('Navigating to channel:', channel.cid, channel.id, channel.data);
    router.push({
      pathname: '/(homes)/(chat)/[cid]',
      params: { cid: channel.cid },
    });
  };

  const lastMessage = channel.state.messages[channel.state.messages.length - 1];
  const lastMessageTime = lastMessage?.created_at
    ? new Date(lastMessage.created_at).toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  return (
    <TouchableOpacity
      onPress={handlePress}
      className="mb-4 rounded-xl border border-gray-100 bg-white p-4 shadow-sm"
      style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      }}>
      <View className="flex-row items-center">
        {/* Channel Icon */}
        <View className="mr-4 h-12 w-12 items-center justify-center rounded-full bg-cyan-50">
          <Ionicons name="chatbubbles" size={24} color="#06b6d4" />
        </View>

        {/* Channel Info */}
        <View className="flex-1">
          <Text className="mb-1 text-lg font-semibold text-gray-900">
            {channel.data?.name || 'Cơ sở y tế'}
          </Text>
          <Text className="text-sm text-gray-600" numberOfLines={1}>
            {lastMessage?.text || 'Chưa có tin nhắn'}
          </Text>
        </View>

        {/* Time and Unread Count */}
        <View className="items-end">
          {lastMessageTime && <Text className="mb-1 text-xs text-gray-500">{lastMessageTime}</Text>}
          {channel.state.unreadCount > 0 && (
            <View className="h-6 w-6 items-center justify-center rounded-full bg-cyan-500">
              <Text className="text-xs font-medium text-white">
                {channel.state.unreadCount > 99 ? '99+' : channel.state.unreadCount}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const ChannelsScreen = () => {
  const { chatClient, isChatReady } = useChatContext();
  const [channels, setChannels] = React.useState<Channel[]>([]);
  const router = useRouter();

  useFocusEffect(
    React.useCallback(() => {
      if (!isChatReady || !chatClient) {
        console.log('Chat not ready or no client:', { isChatReady, hasClient: !!chatClient });
        return;
      }

      const fetchChannels = async () => {
        try {
          console.log('Fetching user channels for user:', chatClient.userID);
          const userChannels = await chatClient.queryChannels({
            members: { $in: [chatClient.userID!] },
          });
          console.log('Found channels:', userChannels.length);
          userChannels.forEach((ch) => console.log('Channel:', ch.id, ch.cid, ch.data?.name));
          setChannels(userChannels);
        } catch (error) {
          console.error('Error fetching channels:', error);
        }
      };

      fetchChannels();
    }, [isChatReady, chatClient])
  );

  if (!isChatReady) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <Stack.Screen
        options={{
          title: 'Tin nhắn',
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.back()}
              className="ml-4 h-8 w-8 items-center justify-center rounded-full bg-white shadow-sm"
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 2,
              }}>
              <Ionicons name="arrow-back" size={20} color="#06b6d4" />
            </TouchableOpacity>
          ),
          headerStyle: {
            backgroundColor: '#06b6d4',
          },
          headerTintColor: '#ffffff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      />
      <View className="flex-1 p-4">
        {/* New Consultation Button */}
        <View className="mb-8">
          <Pressable
            onPress={() => router.push('/(homes)/(chat)/clinics')}
            className="flex-row items-center justify-center rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-500 p-5 shadow-lg"
            style={{
              shadowColor: '#06b6d4',
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.3,
              shadowRadius: 12,
              elevation: 8,
            }}>
            <Ionicons name="add-circle" size={28} color="white" />
            <Text className="ml-4 text-lg font-bold text-white">Bắt đầu tư vấn mới</Text>
            <Ionicons name="chevron-forward" size={24} color="white" className="ml-auto" />
          </Pressable>
        </View>

        {/* Channels List */}
        {channels.length === 0 ? (
          <View className="flex-1 items-center justify-center px-8">
            <View className="shadow-inner mb-8 items-center justify-center rounded-full bg-gradient-to-br from-cyan-50 to-blue-50 p-10">
              <Ionicons name="chatbubbles" size={80} color="#06b6d4" />
            </View>
            <Text className="mb-3 text-center text-2xl font-bold text-gray-900">
              Chưa có cuộc trò chuyện nào
            </Text>
            <Text className="mb-8 text-center text-base leading-6 text-gray-600">
              Bắt đầu cuộc tư vấn đầu tiên với đội ngũ y tế chuyên nghiệp của chúng tôi
            </Text>
            <Pressable
              onPress={() => router.push('/(homes)/(chat)/clinics')}
              className="flex-row items-center rounded-xl bg-cyan-500 px-8 py-4 shadow-lg"
              style={{
                shadowColor: '#06b6d4',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 6,
              }}>
              <Ionicons name="add-circle" size={24} color="white" />
              <Text className="ml-3 text-lg font-semibold text-white">Tư vấn ngay</Text>
            </Pressable>
          </View>
        ) : (
          <FlatList
            data={channels}
            renderItem={({ item }) => <ChannelItem channel={item} />}
            keyExtractor={(item) => item.cid}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

export default ChannelsScreen;
