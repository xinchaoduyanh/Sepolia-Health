import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  TextInput,
  StatusBar,
  Animated,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { ChatAPI } from '@/lib/api/chat';
import { useRouter, useNavigation } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { useChatContext } from '@/contexts/ChatContext';
import { Clinic } from '@/types';

const ClinicItemSkeleton = () => {
  const pulseAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseAnim]);

  return (
    <Animated.View
      style={{
        opacity: pulseAnim,
        marginBottom: 16,
        backgroundColor: '#E8F5FE', // Match light blue background
        borderRadius: 20,
        padding: 6,
        borderWidth: 1,
        borderColor: '#C0E4FC',
      }}>
      <View
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 14,
          padding: 16,
          flexDirection: 'row',
          alignItems: 'center',
        }}>
        {/* Icon block placeholder */}
        <View style={{ width: 48, height: 48, borderRadius: 10, backgroundColor: '#E2E8F0', marginRight: 14 }} />

        {/* Info placeholder */}
        <View style={{ flex: 1 }}>
          {/* Title placeholder */}
          <View style={{ height: 16, width: '60%', backgroundColor: '#E2E8F0', borderRadius: 4, marginBottom: 8 }} />
          {/* Address placeholder */}
          <View style={{ height: 12, width: '80%', backgroundColor: '#E2E8F0', borderRadius: 4, marginBottom: 6 }} />
          {/* Phone placeholder */}
          <View style={{ height: 12, width: '40%', backgroundColor: '#E2E8F0', borderRadius: 4 }} />
        </View>

        {/* Action button placeholder */}
        <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#E2E8F0', marginLeft: 12 }} />
      </View>
    </Animated.View>
  );
};

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
      style={{
        marginBottom: 16,
        backgroundColor: '#E8F5FE', // Light blue shell background
        borderRadius: 20,
        padding: 6,
        borderWidth: 1,
        borderColor: '#C0E4FC', // Soft blue border
        shadowColor: '#0284C7',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
        elevation: 2,
      }}>
      <View
        style={{
          backgroundColor: '#FFFFFF', // Inner core background
          borderRadius: 14,
          padding: 16,
          flexDirection: 'row',
          alignItems: 'center',
        }}>
        {/* Clinic Icon - Smaller, rectangular style */}
        <View
          style={{
            marginRight: 14,
            height: 48,
            width: 48,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 10,
            backgroundColor: '#F0F9FF',
            borderWidth: 1,
            borderColor: '#E0F2FE',
          }}>
          <Ionicons name="medical" size={24} color="#0284C7" />
        </View>

        {/* Clinic Info */}
        <View style={{ flex: 1 }}>
          <View style={{ marginBottom: 4, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#0F172A', flex: 1, marginRight: 8 }}>
              {item.name}
            </Text>
            <View style={{ height: 6, width: 6, borderRadius: 3, backgroundColor: '#10B981' }} />
          </View>

          <View style={{ marginBottom: 4, flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="location-outline" size={13} color="#64748B" style={{ marginRight: 4 }} />
            <Text style={{ flex: 1, fontSize: 13, color: '#475569', lineHeight: 16 }} numberOfLines={1}>
              {item.address}
            </Text>
          </View>

          {item.phone && (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="call-outline" size={13} color="#64748B" style={{ marginRight: 4 }} />
              <Text style={{ fontSize: 13, color: '#64748B' }}>{item.phone}</Text>
            </View>
          )}
        </View>

        {/* Action Button - Smaller */}
        <View style={{ marginLeft: 12 }}>
          {isLoading ? (
            <ActivityIndicator size="small" color="#0284C7" />
          ) : (
            <View
              style={{
                height: 36,
                width: 36,
                borderRadius: 18,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#0284C7',
                shadowColor: '#0284C7',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.2,
                shadowRadius: 4,
                elevation: 2,
              }}>
              <Ionicons name="chatbubble-outline" size={18} color="white" />
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
  const insets = useSafeAreaInsets();
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

  return (
    <View style={{ flex: 1, backgroundColor: '#E0F2FE' }}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <ScrollView
        showsVerticalScrollIndicator={false}
        bounces={true}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Background Gradient Header */}
        <View style={{ height: insets.top + 160, position: 'relative' }}>
          <LinearGradient
            colors={['#0284C7', '#06B6D4', '#10B981']} // Sky blue, cyan, emerald
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ flex: 1 }}
          />
          {/* Curved bottom edge using SVG */}
          <Svg
            height="50"
            width="100%"
            viewBox="0 0 1440 120"
            preserveAspectRatio="none"
            style={{ position: 'absolute', bottom: -1, left: 0, right: 0 }}>
            <Path d="M0,0 Q720,120 1440,0 L1440,120 L0,120 Z" fill="#E0F2FE" />
          </Svg>

          {/* Decorative circles */}
          <View
            style={{
              position: 'absolute',
              top: -20,
              right: -20,
              height: 120,
              width: 120,
              borderRadius: 60,
              backgroundColor: 'rgba(255,255,255,0.12)',
            }}
          />
          <View
            style={{
              position: 'absolute',
              top: insets.top + 20,
              left: -30,
              height: 80,
              width: 80,
              borderRadius: 40,
              backgroundColor: 'rgba(255,255,255,0.08)',
            }}
          />

          {/* Header positioned within gradient */}
          <View
            style={{
              position: 'absolute',
              top: insets.top + 16,
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
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#FFFFFF', flex: 1 }}>
              Chọn cơ sở y tế
            </Text>
          </View>
        </View>

        {/* Content */}
        <View style={{ paddingHorizontal: 24, marginTop: -50, marginBottom: 24 }}>
          {/* Search Bar */}
          <View style={{ marginBottom: 20 }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: '#FFFFFF',
                borderRadius: 16,
                borderWidth: 1,
                borderColor: '#E0F2FE',
                paddingHorizontal: 16,
                paddingVertical: 14,
                shadowColor: '#0284C7',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.04,
                shadowRadius: 8,
                elevation: 2,
              }}>
              <Ionicons name="search" size={20} color="#0284C7" />
              <TextInput
                style={{
                  flex: 1,
                  marginLeft: 12,
                  fontSize: 15,
                  color: '#0F172A',
                  fontWeight: '500',
                }}
                placeholder="Tìm cơ sở y tế..."
                placeholderTextColor="#94A3B8"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
          </View>

          {/* Clinics List or Skeleton or Error */}
          {isLoading ? (
            <View>
              <ClinicItemSkeleton />
              <ClinicItemSkeleton />
              <ClinicItemSkeleton />
            </View>
          ) : isError ? (
            <View style={{ marginTop: 32, alignItems: 'center' }}>
              <Ionicons name="wifi-outline" size={48} color="#EF4444" />
              <Text style={{ textAlign: 'center', fontSize: 18, fontWeight: '600', color: '#0F172A', marginTop: 16, marginBottom: 8 }}>
                Không thể tải danh sách cơ sở
              </Text>
              <Text style={{ textAlign: 'center', fontSize: 14, color: '#475569', marginBottom: 24 }}>
                Vui lòng kiểm tra kết nối internet và thử lại.
              </Text>
              <TouchableOpacity
                onPress={handleRefresh}
                style={{
                  borderRadius: 12,
                  backgroundColor: '#0284C7',
                  paddingHorizontal: 24,
                  paddingVertical: 12,
                  shadowColor: '#0284C7',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.2,
                  shadowRadius: 4,
                  elevation: 2,
                }}
                disabled={isRefetching}>
                <Text style={{ textAlign: 'center', fontSize: 14, fontWeight: '600', color: 'white' }}>
                  {isRefetching ? 'Đang tải...' : 'Thử lại'}
                </Text>
              </TouchableOpacity>
            </View>
          ) : filteredClinics.length === 0 ? (
            <View style={{ marginTop: 32, alignItems: 'center' }}>
              <Ionicons
                name={searchQuery ? "search-outline" : "medical-outline"}
                size={64}
                color="#64748B"
              />
              <Text style={{ textAlign: 'center', fontSize: 18, fontWeight: '600', color: '#475569', marginTop: 16, marginBottom: 8 }}>
                {searchQuery ? 'Không tìm thấy cơ sở phù hợp' : 'Không có cơ sở nào'}
              </Text>
              <Text style={{ textAlign: 'center', fontSize: 14, color: '#64748B', paddingHorizontal: 32 }}>
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
    </View>
  );
}
