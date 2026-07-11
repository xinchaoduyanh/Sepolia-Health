import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Pressable,
  ScrollView,
  Animated,
  StyleSheet,
} from 'react-native';
import React, { useCallback, useRef, useEffect } from 'react';
import { useChatContext } from '@/contexts/ChatContext';
import { Channel } from 'stream-chat';
import { useRouter, useNavigation, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Rect, Circle } from 'react-native-svg';
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

const CuteLoadingScreen = ({ statusText = "Đang kết nối cuộc trò chuyện..." }: { statusText?: string }) => {
  const bobValue = useRef(new Animated.Value(0)).current;
  const pulseValue = useRef(new Animated.Value(0)).current;
  const progressValue = useRef(new Animated.Value(0)).current;

  // Bobbing animation (Robot floats up & down)
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(bobValue, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(bobValue, {
          toValue: 0,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [bobValue]);

  // Antenna pulsing animation
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseValue, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(pulseValue, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseValue]);

  // Progress bar filling animation
  useEffect(() => {
    Animated.loop(
      Animated.timing(progressValue, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      })
    ).start();
  }, [progressValue]);

  const translateY = bobValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -15],
  });

  const shadowScaleX = bobValue.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.75],
  });

  const shadowOpacity = bobValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.15, 0.05],
  });

  const antennaScale = pulseValue.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.4],
  });

  const antennaOpacity = pulseValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.8],
  });

  const progressTranslateX = progressValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-100, 200],
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#E0F2FE' }}>
      <LinearGradient
        colors={['#E0F2FE', '#F0FDFA']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 }}
      >
        {/* Cute Floating Robot */}
        <View style={{ alignItems: 'center', justifyContent: 'center', height: 220, marginBottom: 20 }}>
          <Animated.View style={{ transform: [{ translateY }], alignItems: 'center' }}>
            <Svg width={140} height={150} viewBox="0 0 140 150">
              {/* Antenna pole */}
              <Rect x={67} y={20} width={6} height={20} rx={3} fill="#94A3B8" />
              
              {/* Ears */}
              <Rect x={12} y={55} width={10} height={20} rx={5} fill="#64748B" />
              <Rect x={118} y={55} width={10} height={20} rx={5} fill="#64748B" />

              {/* Head */}
              <Rect x={20} y={35} width={100} height={75} rx={22} fill="#F8FAFC" stroke="#CBD5E1" strokeWidth={3} />
              
              {/* Eye Screen */}
              <Rect x={32} y={47} width={76} height={40} rx={12} fill="#1E293B" />
              
              {/* Glowing Eyes */}
              <Circle cx={50} cy={67} r={8} fill="#38BDF8" />
              <Circle cx={90} cy={67} r={8} fill="#38BDF8" />
              {/* Eye sparkles */}
              <Circle cx={52} cy={65} r={2.5} fill="#FFFFFF" />
              <Circle cx={92} cy={65} r={2.5} fill="#FFFFFF" />

              {/* Cheek Blush */}
              <Circle cx={38} cy={78} r={4.5} fill="#F472B6" opacity={0.6} />
              <Circle cx={102} cy={78} r={4.5} fill="#F472B6" opacity={0.6} />

              {/* Cute Mouth */}
              <Path d="M64 73 Q70 78 76 73" fill="none" stroke="#FFFFFF" strokeWidth={2.5} strokeLinecap="round" />

              {/* Body */}
              <Rect x={45} y={110} width={50} height={32} rx={10} fill="#E2E8F0" stroke="#CBD5E1" strokeWidth={3} />
              {/* Screen on Chest */}
              <Rect x={55} y={117} width={30} height={15} rx={3} fill="#94A3B8" />
              {/* Heart on chest screen */}
              <Path d="M70 127 L67 123 A2.2 2.2 0 0 1 70 120 A2.2 2.2 0 0 1 73 123 Z" fill="#EF4444" />
            </Svg>
            
            {/* Animated Antenna Glow */}
            <Animated.View
              style={{
                position: 'absolute',
                top: 6,
                width: 28,
                height: 28,
                borderRadius: 14,
                backgroundColor: '#38BDF8',
                transform: [{ scale: antennaScale }],
                opacity: antennaOpacity,
                zIndex: -1,
              }}
            />
            {/* Antenna Ball */}
            <View
              style={{
                position: 'absolute',
                top: 12,
                width: 16,
                height: 16,
                borderRadius: 8,
                backgroundColor: '#0EA5E9',
                borderWidth: 2,
                borderColor: '#FFFFFF',
              }}
            />
          </Animated.View>

          {/* Floating Shadow */}
          <Animated.View
            style={{
              width: 80,
              height: 10,
              borderRadius: 5,
              backgroundColor: '#0F172A',
              opacity: shadowOpacity,
              transform: [{ scaleX: shadowScaleX }],
              marginTop: 10,
            }}
          />
        </View>

        {/* Text Loader */}
        <Text style={{ fontSize: 16, fontWeight: '700', color: '#0369A1', marginBottom: 12 }}>
          {statusText}
        </Text>

        {/* Custom Progress Bar */}
        <View style={{
          width: 200,
          height: 8,
          backgroundColor: 'rgba(2, 132, 199, 0.1)',
          borderRadius: 4,
          overflow: 'hidden'
        }}>
          <Animated.View style={{
            height: '100%',
            width: '40%',
            backgroundColor: '#0284C7',
            borderRadius: 4,
            transform: [{ translateX: progressTranslateX }],
          }} />
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
};

export default function ChannelsScreen() {
  const { isChatReady, chatClient, createOrGetAIChannel, isAIChannel } = useChatContext();
  const [channels, setChannels] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isCreatingAIChannel, setIsCreatingAIChannel] = React.useState(false);

  // Loading states for cute screen transition
  const [shouldRenderLoading, setShouldRenderLoading] = React.useState(true);
  const isFirstMount = React.useRef(true);
  const loadingOpacity = React.useRef(new Animated.Value(1)).current;

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

  // Load channels when screen is focused (refresh on every focus)
  useFocusEffect(
    useCallback(() => {
      if (!isChatReady) {
        return;
      }

      const showOverlay = isFirstMount.current;
      if (showOverlay) {
        setShouldRenderLoading(true);
        loadingOpacity.setValue(1);
      }

      const loadChannels = async () => {
        setIsLoading(showOverlay);
        const startTime = Date.now();
        try {
          console.log('📥 Loading channels (screen focused)...');
          const userChannels = await ChatService.fetchUserChannels();

          // Sắp xếp: AI channel luôn đứng đầu
          const sortedChannels = [...userChannels].sort((a, b) => {
            const aIsAI = isAIChannel(a);
            const bIsAI = isAIChannel(b);

            if (aIsAI && !bIsAI) return -1; // AI channel lên đầu
            if (!aIsAI && bIsAI) return 1; // AI channel lên đầu

            // Nếu cùng loại, sắp xếp theo last_message_at
            const aTime = a.state?.last_message_at?.getTime() || 0;
            const bTime = b.state?.last_message_at?.getTime() || 0;
            return bTime - aTime; // Mới nhất lên đầu
          });

          setChannels(sortedChannels);
          console.log('✅ Channels loaded:', sortedChannels.length);
        } catch (error) {
          console.error('❌ Error loading channels:', error);
        } finally {
          setIsLoading(false);
          
          if (showOverlay) {
            // Đảm bảo loading diễn ra ít nhất 500ms để người dùng thấy animation mượt mà
            const elapsedTime = Date.now() - startTime;
            const remainingTime = Math.max(0, 500 - elapsedTime);

            setTimeout(() => {
              Animated.timing(loadingOpacity, {
                toValue: 0,
                duration: 250,
                useNativeDriver: true,
              }).start(() => {
                setShouldRenderLoading(false);
                isFirstMount.current = false;
              });
            }, remainingTime);
          }
        }
      };

      loadChannels();
    }, [isChatReady, isAIChannel, loadingOpacity])
  );

  // Setup realtime updates when chat client is ready
  React.useEffect(() => {
    if (!chatClient || !isChatReady) {
      return;
    }

    const handleChannelEvent = async (event: any) => {
      console.log('Channel event received:', event.type, event.channel?.id);

      // When new channel is created or user is added to channel, refresh the list
      if (
        event.type === 'channel.visible' ||
        event.type === 'channel.created' ||
        event.type === 'member.added'
      ) {
        console.log('🔄 Channel list changed, refreshing...');
        try {
          const userChannels = await ChatService.fetchUserChannels();
          const sortedChannels = [...userChannels].sort((a, b) => {
            const aIsAI = isAIChannel(a);
            const bIsAI = isAIChannel(b);

            if (aIsAI && !bIsAI) return -1;
            if (!aIsAI && bIsAI) return 1;

            const aTime = a.state?.last_message_at?.getTime() || 0;
            const bTime = b.state?.last_message_at?.getTime() || 0;
            return bTime - aTime;
          });
          setChannels(sortedChannels);
          console.log('✅ Channel list refreshed:', sortedChannels.length);
        } catch (error) {
          console.error('❌ Error refreshing channel list:', error);
        }
      }
      // Update existing channels when messages change
      else if (
        event.type === 'message.new' ||
        event.type === 'message.updated' ||
        event.type === 'message.deleted'
      ) {
        const updatedChannel = event.channel;
        if (updatedChannel) {
          setChannels((prevChannels) => {
            const channelIndex = prevChannels.findIndex((ch) => ch.cid === updatedChannel.cid);
            let updated: Channel[];

            if (channelIndex >= 0) {
              // Update existing channel
              updated = [...prevChannels];
              updated.splice(channelIndex, 1);
              updated.push(updatedChannel);
            } else {
              // New channel, add to list and refresh from server
              // This ensures we get the complete channel data
              setTimeout(() => {
                ChatService.fetchUserChannels().then(userChannels => {
                  const sortedChannels = [...userChannels].sort((a, b) => {
                    const aIsAI = isAIChannel(a);
                    const bIsAI = isAIChannel(b);

                    if (aIsAI && !bIsAI) return -1;
                    if (!aIsAI && bIsAI) return 1;

                    const aTime = a.state?.last_message_at?.getTime() || 0;
                    const bTime = b.state?.last_message_at?.getTime() || 0;
                    return bTime - aTime;
                  });
                  setChannels(sortedChannels);
                }).catch(err => console.error('Error fetching channels after new message:', err));
              }, 1000);
              return [...prevChannels, updatedChannel];
            }

            // Sắp xếp lại: AI channel luôn đứng đầu
            return updated.sort((a, b) => {
              const aIsAI = isAIChannel(a);
              const bIsAI = isAIChannel(b);

              if (aIsAI && !bIsAI) return -1;
              if (!aIsAI && bIsAI) return 1;

              const aTime = a.state?.last_message_at?.getTime() || 0;
              const bTime = b.state?.last_message_at?.getTime() || 0;
              return bTime - aTime;
            });
          });
        }
      }
    };

    // Listen to all channel events
    chatClient.on(handleChannelEvent);

    // Cleanup
    return () => {
      chatClient.off(handleChannelEvent);
    };
  }, [chatClient, isChatReady, isAIChannel]);

  if (!isChatReady) {
    return <CuteLoadingScreen statusText="Đang kết nối cuộc trò chuyện..." />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#E0F2FE' }}>
      {/* Main Content (faded/hidden until loading is done) */}
      <View
        style={{ flex: 1 }}
        pointerEvents={shouldRenderLoading ? 'none' : 'auto'}
      >
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
            <View style={{ width: 24 }} />
          </View>
        </View>

        <View style={{ paddingHorizontal: 24, marginTop: -80, marginBottom: 24, gap: 12 }}>
          {/* AI Assistant Button - Luôn đứng đầu */}
          <Pressable
            onPress={async () => {
              if (isCreatingAIChannel || !isChatReady) return;

              setIsCreatingAIChannel(true);
              try {
                const aiChannel = await createOrGetAIChannel();
                if (aiChannel) {
                  router.push({
                    pathname: '/(homes)/(chat)/[cid]',
                    params: { cid: aiChannel.cid },
                  });
                }
              } catch (error) {
                console.error('Error creating AI channel:', error);
              } finally {
                setIsCreatingAIChannel(false);
              }
            }}
            disabled={isCreatingAIChannel || !isChatReady}
            className="flex-row items-center justify-center rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 p-4 shadow-sm"
            style={{
              shadowColor: '#7C3AED',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.2,
              shadowRadius: 4,
              elevation: 3,
              backgroundColor: '#7C3AED',
              opacity: isCreatingAIChannel || !isChatReady ? 0.6 : 1,
            }}>
            {isCreatingAIChannel ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Ionicons name="sparkles" size={24} color="#FFFFFF" />
            )}
            <Text className="ml-3 flex-1 text-base font-bold text-white">
              {isCreatingAIChannel ? 'Đang tải...' : 'Chat với trợ lý ảo'}
            </Text>
            <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
          </Pressable>

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
            <Text className="ml-3 flex-1 text-base font-bold text-slate-900">Bắt đầu tư vấn mới</Text>
            <Ionicons name="chevron-forward" size={20} color="#0284C7" />
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

              {isLoading ? (
                <View className="items-center justify-center rounded-xl bg-white px-8 py-12 shadow-sm">
                  <ActivityIndicator size="large" color="#2563EB" />
                  <Text className="mt-4 text-center text-sm text-slate-600">Đang tải...</Text>
                </View>
              ) : channels.length === 0 ? (
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

      {/* Cute Loading Screen Overlay */}
      {shouldRenderLoading && (
        <Animated.View
          style={{
            ...StyleSheet.absoluteFillObject,
            opacity: loadingOpacity,
            zIndex: 999,
          }}
        >
          <CuteLoadingScreen statusText="Đang kết nối cuộc trò chuyện..." />
        </Animated.View>
      )}
    </View>
  );
}
