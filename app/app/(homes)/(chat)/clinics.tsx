import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  TextInput,
  StatusBar,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { ChatAPI } from '@/lib/api/chat';
import { useRouter, useNavigation } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { useChatContext } from '@/contexts/ChatContext';
import { Clinic } from '@/types';

const ClinicItem = ({
  item,
  onPress,
  isLoading,
}: {
  item: Clinic;
  onPress: (id: number) => void;
  isLoading: boolean;
}) => {
  return (
    <TouchableOpacity
      onPress={() => onPress(item.id)}
      disabled={isLoading}
      className="mb-4 rounded-xl border border-slate-200 bg-white p-4"
      style={{
        shadowColor: '#0284C7',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
      }}>
      <View className="flex-row items-center">
        {/* Clinic Icon - Smaller, rectangular style */}
        <View className="mr-3 h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-50 to-blue-50">
          <Ionicons name="medical" size={20} color="#0284C7" />
        </View>

        {/* Clinic Info */}
        <View className="flex-1">
          <View className="mb-1 flex-row items-center justify-between">
            <Text className="text-base font-bold text-slate-900 flex-1 mr-2">{item.name}</Text>
            <View className="h-2 w-2 rounded-full bg-green-500" />
          </View>

          <View className="mb-2 flex-row items-center">
            <Ionicons name="location-outline" size={12} color="#64748b" style={{ marginRight: 4 }} />
            <Text className="flex-1 text-sm text-slate-600 leading-4" numberOfLines={1}>
              {item.address}
            </Text>
          </View>

          {item.phone && (
            <View className="flex-row items-center">
              <Ionicons name="call-outline" size={12} color="#64748b" style={{ marginRight: 4 }} />
              <Text className="text-sm text-slate-600">{item.phone}</Text>
            </View>
          )}
        </View>

        {/* Action Button - Smaller */}
        <View className="ml-3">
          {isLoading ? (
            <View className="h-8 w-8 items-center justify-center rounded-full bg-cyan-100">
              <ActivityIndicator size="small" color="#0284C7" />
            </View>
          ) : (
            <View className="h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-blue-600">
              <Ionicons name="chatbubble-outline" size={16} color="white" />
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default function ClinicsScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { createChannel } = useChatContext();
  const [creatingChannelId, setCreatingChannelId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Hide tab bar when entering clinics
  React.useEffect(() => {
    const parentNavigator = navigation.getParent();
    if (parentNavigator) {
      parentNavigator.setOptions({
        tabBarStyle: { display: 'none' },
      });
    }

    return () => {
      // Cleanup handled by channels screen
    };
  }, [navigation]);

  const {
    data: clinics,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['clinics'],
    queryFn: ChatAPI.getClinics,
  });

  const { isChatReady } = useChatContext();

  // Filter clinics based on search query
  const filteredClinics = clinics?.filter(clinic =>
    clinic.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    clinic.address.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const handleSelectClinic = async (clinicId: number) => {
    if (creatingChannelId || !isChatReady) return; // Prevent multiple simultaneous requests and ensure chat is ready

    setCreatingChannelId(clinicId);
    try {
      const channel = await createChannel(clinicId);
      if (channel) {
        // Wait a bit to ensure channel is fully created
        setTimeout(() => {
          router.replace({
            pathname: '/(homes)/(chat)/[cid]',
            params: { cid: channel.cid },
          });
        }, 500);
      }
    } catch (error) {
      console.error('Failed to start chat:', error);
      Alert.alert(
        'Không thể bắt đầu tư vấn',
        'Có lỗi xảy ra khi kết nối với cơ sở y tế. Vui lòng thử lại.',
        [{ text: 'OK' }]
      );
    } finally {
      setCreatingChannelId(null);
    }
  };

  const handleRefresh = () => {
    refetch();
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#E0F2FE' }}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <SafeAreaView className="flex-1">
          <ScrollView
            showsVerticalScrollIndicator={false}
            bounces={false}
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingBottom: 100 }}>
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
                }}>
                <TouchableOpacity
                  onPress={() => router.back()}
                  style={{
                    height: 40,
                    width: 40,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 20,
                    backgroundColor: 'rgba(255,255,255,0.25)',
                    marginRight: 12,
                  }}>
                  <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                </TouchableOpacity>
                <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#FFFFFF', flex: 1 }}>
                  Chọn cơ sở y tế
                </Text>
              </View>
            </View>

            {/* Loading Content */}
            <View style={{ paddingHorizontal: 24, marginTop: -80, marginBottom: 24 }}>
              <View style={{ marginTop: 32, alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#0284C7" />
                <Text className="text-base font-medium text-slate-600 mt-4">Đang tải danh sách cơ sở...</Text>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={{ flex: 1, backgroundColor: '#E0F2FE' }}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <SafeAreaView className="flex-1">
          <ScrollView
            showsVerticalScrollIndicator={false}
            bounces={false}
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingBottom: 100 }}>
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

              {/* Header positioned within gradient */}
              <View
                style={{
                  position: 'absolute',
                  top: 100,
                  left: 24,
                  right: 24,
                  flexDirection: 'row',
                  alignItems: 'center',
                }}>
                <TouchableOpacity
                  onPress={() => router.back()}
                  style={{
                    height: 40,
                    width: 40,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 20,
                    backgroundColor: 'rgba(255,255,255,0.25)',
                    marginRight: 12,
                  }}>
                  <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                </TouchableOpacity>
                <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#FFFFFF', flex: 1 }}>
                  Chọn cơ sở y tế
                </Text>
              </View>
            </View>

            {/* Error Content */}
            <View style={{ paddingHorizontal: 24, marginTop: -80, marginBottom: 24 }}>
              <View style={{ marginTop: 32, alignItems: 'center' }}>
                <Ionicons name="wifi-outline" size={48} color="#EF4444" />
                <Text className="text-center text-lg font-semibold text-slate-900 mt-4 mb-2">
                  Không thể tải danh sách cơ sở
                </Text>
                <Text className="text-center text-sm text-slate-600 mb-6">
                  Vui lòng kiểm tra kết nối internet và thử lại.
                </Text>
                <TouchableOpacity
                  onPress={handleRefresh}
                  className="rounded-lg bg-cyan-500 px-6 py-3"
                  disabled={isRefetching}>
                  <Text className="text-center text-sm font-semibold text-white">
                    {isRefetching ? 'Đang tải...' : 'Thử lại'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#E0F2FE' }}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <SafeAreaView className="flex-1">
      <ScrollView
        showsVerticalScrollIndicator={false}
        bounces={false}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 100 }}>
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
            }}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={{
                height: 40,
                width: 40,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 20,
                backgroundColor: 'rgba(255,255,255,0.25)',
                marginRight: 12,
              }}>
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#FFFFFF', flex: 1 }}>
              Chọn cơ sở y tế
            </Text>
          </View>
        </View>

        {/* Content */}
        <View style={{ paddingHorizontal: 24, marginTop: -80, marginBottom: 24 }}>
          {/* Search Bar */}
          <View style={{ marginBottom: 16 }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: 'white',
                borderRadius: 12,
                borderWidth: 1,
                borderColor: '#E0F2FE',
                paddingHorizontal: 16,
                paddingVertical: 12,
              }}>
              <Ionicons name="search" size={20} color="#0284C7" />
              <TextInput
                style={{
                  flex: 1,
                  marginLeft: 12,
                  fontSize: 16,
                  color: '#0F172A',
                }}
                placeholder="Tìm cơ sở y tế..."
                placeholderTextColor="#94A3B8"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
          </View>

          {/* Clinics List */}
          {filteredClinics.length === 0 ? (
            <View className="mt-8 items-center">
              <Ionicons
                name={searchQuery ? "search-outline" : "medical-outline"}
                size={64}
                color="#64748b"
              />
              <Text className="text-center text-lg font-semibold text-slate-700 mb-2">
                {searchQuery ? 'Không tìm thấy cơ sở phù hợp' : 'Không có cơ sở nào'}
              </Text>
              <Text className="text-center text-sm text-slate-500 px-8">
                {searchQuery
                  ? 'Thử tìm kiếm với từ khóa khác'
                  : 'Hiện tại chưa có cơ sở y tế nào khả dụng để tư vấn'
                }
              </Text>
            </View>
          ) : (
            filteredClinics.map((clinic) => (
              <ClinicItem
                key={clinic.id}
                item={clinic}
                onPress={handleSelectClinic}
                isLoading={creatingChannelId === clinic.id}
              />
            ))
          )}
        </View>
      </ScrollView>
      </SafeAreaView>
    </View>
  );
};

