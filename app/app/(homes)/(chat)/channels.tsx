import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Pressable,
  ScrollView,
} from 'react-native';
import React from 'react';
import { useChatContext } from '@/contexts/ChatContext';
import { Channel } from 'stream-chat';
import { useRouter, useFocusEffect, useNavigation } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { ChatService } from '@/lib/api/chat';
import { CustomChannelPreview } from '@/components/CustomChannelPreview';

const ChannelItem = ({ channel }: { channel: Channel }) => {
  const router = useRouter();
  const { isChatReady } = useChatContext();

  const handlePress = () => {
    if (!isChatReady) {
      console.log('Chat not ready, cannot navigate to channel');
      return;
    }

    console.log('Navigating to channel:', channel.cid, channel.id, channel.data);
    router.push({
      pathname: '/(homes)/(chat)/[cid]',
      params: { cid: channel.cid },
    });
  };

  return <CustomChannelPreview channel={channel} onPress={handlePress} disabled={!isChatReady} />;
};

export default function ChannelsScreen() {
  const { isChatReady, chatClient } = useChatContext();
  const [channels, setChannels] = React.useState<any[]>([]);
  const router = useRouter();
  const navigation = useNavigation();

  // Hide tab bar when entering chat
  React.useEffect(() => {
    const parentNavigator = navigation.getParent();
    if (parentNavigator) {
      parentNavigator.setOptions({
        tabBarStyle: { display: 'none' },
      });
    }

    return navigation.addListener('beforeRemove', () => {
      // Show tab bar when leaving chat channels completely
      if (parentNavigator) {
        parentNavigator.setOptions({
          tabBarStyle: undefined, // Reset to default
        });
      }
    });
  }, [navigation]);

  useFocusEffect(
    React.useCallback(() => {
      if (!isChatReady) {
        return;
      }

      const loadChannels = async () => {
        try {
          const userChannels = await ChatService.fetchUserChannels();
          setChannels(userChannels);
        } catch (error) {
          console.error('Error fetching channels:', error);
        }
      };

      loadChannels();
    }, [isChatReady])
  );

  // Setup realtime updates when chat client is ready
  React.useEffect(() => {
    if (!chatClient || !isChatReady) {
      return;
    }

    const handleChannelEvent = (event: any) => {
      console.log('Channel event received:', event.type, event.channel?.id);

      // Refresh channels when there's a new message or update
      if (
        event.type === 'message.new' ||
        event.type === 'message.updated' ||
        event.type === 'message.deleted'
      ) {
        ChatService.fetchUserChannels()
          .then((userChannels) => {
            setChannels(userChannels);
          })
          .catch((error) => {
            console.error('Error refreshing channels:', error);
          });
      }
    };

    // Listen to all channel events
    chatClient.on(handleChannelEvent);

    // Cleanup
    return () => {
      chatClient.off(handleChannelEvent);
    };
  }, [chatClient, isChatReady]);

  if (!isChatReady) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50">
        <View className="flex-1 items-center justify-center p-6">
          <View className="mb-6 items-center justify-center rounded-full bg-blue-50 p-6">
            <Ionicons name="chatbubbles" size={48} color="#2563EB" />
          </View>
          <Text className="mb-2 text-center text-xl font-semibold text-slate-900">
            Đang kết nối chat
          </Text>
          <Text className="mb-6 text-center text-sm text-slate-600">
            Đang thiết lập kết nối để tải tin nhắn...
          </Text>
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#E0F2FE' }}>
      {/* Background Gradient */}
      <View style={{ height: 280, position: 'relative', marginTop: -60 }}>
        <LinearGradient
          colors={['#0284C7', '#06B6D4', '#10B981']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ flex: 1 }}
        />
        {/* Curved bottom edge using SVG */}
        <Svg
          height="70"
          width="200%"
          viewBox="0 0 1440 120"
          style={{ position: 'absolute', bottom: -1, left: 0, right: 0 }}>
          <Path d="M0,0 Q720,120 1440,0 L1440,120 L0,120 Z" fill="#E0F2FE" />
        </Svg>

        {/* Decorative circles */}
        <View
          style={{
            position: 'absolute',
            top: -40,
            right: -40,
            height: 120,
            width: 120,
            borderRadius: 60,
            backgroundColor: 'rgba(255,255,255,0.12)',
          }}
        />
        <View
          style={{
            position: 'absolute',
            top: 80,
            left: -30,
            height: 100,
            width: 100,
            borderRadius: 50,
            backgroundColor: 'rgba(255,255,255,0.08)',
          }}
        />

        {/* Header positioned within gradient */}
        <View
          style={{
            position: 'absolute',
            top: 100,
            left: 24,
            right: 24,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#FFFFFF' }}>Tin nhắn</Text>
          <View style={{ width: 24 }} /> {/* Spacer for alignment */}
        </View>
      </View>

      <View style={{ paddingHorizontal: 24, marginTop: -80, marginBottom: 24 }}>
        {/* New Consultation Button */}
        <Pressable
          onPress={() => router.push('/(homes)/(chat)/clinics')}
          className="flex-row items-center justify-center rounded-xl bg-white p-4 shadow-sm"
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
          }}>
          <Ionicons name="add-circle" size={24} color="#0284C7" />
          <Text className="ml-3 text-base font-bold text-slate-900">Bắt đầu tư vấn mới</Text>
          <Ionicons name="chevron-forward" size={20} color="#0284C7" className="ml-auto" />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        bounces={false}
        alwaysBounceVertical={false}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 100 }}
        scrollEventThrottle={16}
        contentInsetAdjustmentBehavior="never"
        automaticallyAdjustContentInsets={false}>
        <View className="px-6 pb-6">
          {/* Channels List */}
          <View className="mt-4">
            <Text className="mb-4 text-lg font-semibold text-slate-900">Cuộc trò chuyện</Text>

            {channels.length === 0 ? (
              <View className="items-center justify-center rounded-xl bg-white px-8 py-12 shadow-sm">
                <View className="mb-6 items-center justify-center rounded-full bg-slate-100 p-8">
                  <Ionicons name="chatbubbles" size={48} color="#94A3B8" />
                </View>
                <Text className="mb-2 text-center text-lg font-semibold text-slate-900">
                  Chưa có cuộc trò chuyện nào
                </Text>
                <Text className="mb-6 text-center text-sm text-slate-600">
                  Bắt đầu cuộc tư vấn đầu tiên với đội ngũ y tế chuyên nghiệp của chúng tôi
                </Text>
                <Pressable
                  onPress={() => router.push('/(homes)/(chat)/clinics')}
                  className="flex-row items-center rounded-lg bg-blue-600 px-6 py-3 shadow-sm">
                  <Ionicons name="add-circle" size={20} color="white" />
                  <Text className="ml-2 text-sm font-semibold text-white">Tư vấn ngay</Text>
                </Pressable>
              </View>
            ) : (
              <View style={{ gap: 0 }}>
                {channels.map((channel, index) => (
                  <ChannelItem key={`channel-${index}`} channel={channel} />
                ))}
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
