'use client';

import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { useState } from 'react';
import { useMyVouchers } from '@/lib/api/promotion';
import { UserPromotion } from '@/types/promotion';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { router } from 'expo-router';

type TabType = 'available' | 'used';

export default function PromotionsScreen() {
  const [activeTab, setActiveTab] = useState<TabType>('available');

  // Fetch vouchers based on active tab
  // Tab "Còn hạn": voucher chưa sử dụng (usedAt === null) và chưa hết hạn (available)
  // Tab "Đã sử dụng": voucher đã sử dụng (usedAt !== null) - không bao gồm voucher hết hạn chưa sử dụng
  const {
    data: availableVouchers = [],
    isLoading: isLoadingAvailable,
    refetch: refetchAvailable,
  } = useMyVouchers('available');
  const {
    data: usedVouchers = [],
    isLoading: isLoadingUsed,
    refetch: refetchUsed,
  } = useMyVouchers('used');

  const currentVouchers = activeTab === 'available' ? availableVouchers : usedVouchers;
  const isLoading = activeTab === 'available' ? isLoadingAvailable : isLoadingUsed;
  const refetch = activeTab === 'available' ? refetchAvailable : refetchUsed;

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd 'tháng' MM, yyyy", { locale: vi });
    } catch {
      return dateString;
    }
  };

  const renderVoucherCard = (voucher: UserPromotion) => {
    const isExpired = new Date(voucher.promotion.validTo) < new Date();
    const isUsed = voucher.usedAt !== null && voucher.usedAt !== undefined;

    return (
      <View
        key={voucher.id}
        className="mb-4 overflow-hidden rounded-2xl bg-white shadow-lg shadow-sky-600/10"
        style={{
          borderWidth: 1,
          borderColor: isUsed || isExpired ? '#E5E7EB' : '#DBEAFE',
        }}>
        {/* Voucher Header with Gradient */}
        <LinearGradient
          colors={isUsed || isExpired ? ['#F3F4F6', '#E5E7EB'] : ['#0284C7', '#06B6D4']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ padding: 20 }}>
          <View className="flex-row items-start justify-between" style={{ paddingHorizontal: 4 }}>
            <View className="flex-1">
              <Text
                className="mb-1 text-xs font-medium uppercase"
                style={{ color: isUsed || isExpired ? '#6B7280' : '#FFFFFF' }}>
                Mã Voucher
              </Text>
              <Text
                className="mb-2 text-2xl font-bold"
                style={{ color: isUsed || isExpired ? '#374151' : '#FFFFFF' }}>
                {voucher.promotion.code}
              </Text>
              <View className="flex-row items-center">
                <Ionicons
                  name={isUsed || isExpired ? 'time-outline' : 'checkmark-circle'}
                  size={16}
                  color={isUsed || isExpired ? '#6B7280' : '#FFFFFF'}
                />
                <Text
                  className="ml-1 text-xs"
                  style={{ color: isUsed || isExpired ? '#6B7280' : '#FFFFFF' }}>
                  {isUsed
                    ? `Đã sử dụng ${voucher.usedAt ? formatDate(voucher.usedAt) : ''}`
                    : isExpired
                      ? 'Đã hết hạn'
                      : `Có hiệu lực đến ${formatDate(voucher.promotion.validTo)}`}
                </Text>
              </View>
            </View>
            <View
              className="h-16 w-16 items-center justify-center rounded-full"
              style={{
                backgroundColor:
                  isUsed || isExpired ? 'rgba(107, 114, 128, 0.2)' : 'rgba(255, 255, 255, 0.25)',
              }}>
              <Ionicons
                name="ticket"
                size={32}
                color={isUsed || isExpired ? '#6B7280' : '#FFFFFF'}
              />
            </View>
          </View>
        </LinearGradient>

        {/* Voucher Content */}
        <View className="p-5">
          <Text className="mb-2 text-lg font-bold text-slate-900">{voucher.promotion.title}</Text>

          {voucher.promotion.description && (
            <Text className="mb-3 text-sm text-slate-600">{voucher.promotion.description}</Text>
          )}

          <View className="mb-3 flex-row items-center border-t border-gray-100 pt-3">
            <View className="mr-4 flex-1">
              <Text className="text-xs text-slate-500">Giảm giá</Text>
              <Text className="text-lg font-bold text-green-600">
                {voucher.promotion.discountPercent}%
              </Text>
            </View>
            <View className="flex-1">
              <Text className="text-xs text-slate-500">Tối đa</Text>
              <Text className="text-lg font-bold text-slate-900">
                {voucher.promotion.maxDiscountAmount.toLocaleString('vi-VN')} VNĐ
              </Text>
            </View>
          </View>

          <View className="flex-row items-center justify-between rounded-lg bg-sky-50 p-3">
            <View className="flex-1">
              <Text className="text-xs text-slate-500">Nhận vào</Text>
              <Text className="text-sm font-medium text-slate-700">
                {formatDate(voucher.claimedAt)}
              </Text>
            </View>
            <View className="h-8 w-px bg-sky-200" />
            <View className="flex-1 pl-3">
              <Text className="text-xs text-slate-500">Hết hạn</Text>
              <Text className="text-sm font-medium text-slate-700">
                {formatDate(voucher.promotion.validTo)}
              </Text>
            </View>
          </View>

          {(isUsed || isExpired) && (
            <View className="mt-3 flex-row items-center rounded-lg bg-gray-100 p-3">
              <Ionicons name="information-circle" size={18} color="#6B7280" />
              <Text className="ml-2 flex-1 text-xs text-slate-600">
                {isUsed ? 'Voucher này đã được sử dụng' : 'Voucher này đã hết hạn'}
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#E0F2FE' }}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <ScrollView
        showsVerticalScrollIndicator={false}
        bounces={false}
        alwaysBounceVertical={false}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 100 }}
        scrollEventThrottle={16}
        contentInsetAdjustmentBehavior="never"
        automaticallyAdjustContentInsets={false}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor="#0284C7" />
        }>
        {/* Background Gradient - now scrollable and extends to top */}
        <View style={{ height: 320, position: 'relative', marginTop: -60 }}>
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
              top: -60,
              right: -40,
              height: 180,
              width: 180,
              borderRadius: 90,
              backgroundColor: 'rgba(255,255,255,0.12)',
            }}
          />
          <View
            style={{
              position: 'absolute',
              top: 120,
              left: -50,
              height: 150,
              width: 150,
              borderRadius: 75,
              backgroundColor: 'rgba(255,255,255,0.08)',
            }}
          />

          {/* Header positioned within gradient */}
          <View
            style={{
              position: 'absolute',
              top: 120,
              left: 24,
              right: 24,
              flexDirection: 'row',
              alignItems: 'center',
            }}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={{
                marginRight: 16,
                height: 40,
                width: 40,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 20,
                backgroundColor: 'rgba(255,255,255,0.25)',
              }}>
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#FFFFFF' }}>
              Voucher của tôi
            </Text>
          </View>
        </View>

        {/* Tab Selector */}
        <View
          style={{
            marginHorizontal: 24,
            marginTop: -80,
            marginBottom: 16,
            flexDirection: 'row',
            borderRadius: 12,
            backgroundColor: '#FFFFFF',
            padding: 4,
            shadowColor: '#0284C7',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 12,
            elevation: 4,
          }}>
          <TouchableOpacity
            onPress={() => setActiveTab('available')}
            style={{
              flex: 1,
              borderRadius: 8,
              paddingVertical: 12,
              backgroundColor: activeTab === 'available' ? '#0284C7' : '#F8FAFC',
            }}>
            <Text
              style={{
                textAlign: 'center',
                fontSize: 16,
                fontWeight: '600',
                color: activeTab === 'available' ? '#FFFFFF' : '#0F172A',
              }}>
              Còn hạn ({availableVouchers.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab('used')}
            style={{
              flex: 1,
              borderRadius: 8,
              paddingVertical: 12,
              backgroundColor: activeTab === 'used' ? '#0284C7' : '#F8FAFC',
            }}>
            <Text
              style={{
                textAlign: 'center',
                fontSize: 16,
                fontWeight: '600',
                color: activeTab === 'used' ? '#FFFFFF' : '#0F172A',
              }}>
              Đã sử dụng ({usedVouchers.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={{ paddingHorizontal: 24, marginTop: 0, marginBottom: 24 }}>
          {isLoading ? (
            <View style={{ paddingVertical: 80 }}>
              <ActivityIndicator size="large" color="#0284C7" />
              <Text style={{ marginTop: 16, textAlign: 'center', color: '#64748B' }}>
                Đang tải...
              </Text>
            </View>
          ) : currentVouchers.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 80 }}>
              <View
                style={{
                  marginBottom: 16,
                  height: 80,
                  width: 80,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 40,
                  backgroundColor: '#E0F2FE',
                }}>
                <Ionicons name="ticket-outline" size={40} color="#0284C7" />
              </View>
              <Text
                style={{
                  marginBottom: 8,
                  fontSize: 18,
                  fontWeight: '600',
                  color: '#0F172A',
                }}>
                {activeTab === 'available'
                  ? 'Chưa có voucher còn hạn'
                  : 'Chưa có voucher đã sử dụng'}
              </Text>
              <Text style={{ textAlign: 'center', fontSize: 14, color: '#64748B' }}>
                {activeTab === 'available'
                  ? 'Hãy claim voucher từ trang chủ để sử dụng ngay nhé!'
                  : 'Các voucher đã sử dụng sẽ hiển thị ở đây'}
              </Text>
            </View>
          ) : (
            currentVouchers.map((voucher) => renderVoucherCard(voucher))
          )}
        </View>
      </ScrollView>
    </View>
  );
}
