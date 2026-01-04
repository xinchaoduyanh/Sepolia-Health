import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { router, useLocalSearchParams } from 'expo-router';
import { useAppointment } from '@/lib/api/appointments';
import { useMyVouchers } from '@/lib/api/promotion';
import { useApplyVoucher } from '@/lib/api/payment';
import { UserPromotion } from '@/types/promotion';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function VoucherSelectScreen() {
  const { id } = useLocalSearchParams();
  const appointmentId = parseInt(id as string);
  const { data: appointment, isLoading: isLoadingAppointment } = useAppointment(appointmentId);
  const { data: availableVouchers = [], isLoading: isLoadingVouchers } = useMyVouchers('available');
  const applyVoucherMutation = useApplyVoucher();

  const [selectedVoucherId, setSelectedVoucherId] = useState<number | null>(null);
  const [appliedVoucher, setAppliedVoucher] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Lấy original amount từ service price (billing.amount giữ nguyên)
  const originalAmount = appointment?.service?.price || appointment?.billing?.amount || 0;

  // Tính discount và finalAmount ở FE
  const calculateDiscount = (voucher: UserPromotion) => {
    const discountAmount = Math.min(
      (originalAmount * voucher.promotion.discountPercent) / 100,
      voucher.promotion.maxDiscountAmount
    );
    const finalAmount = Math.max(0, originalAmount - discountAmount);
    return { discountAmount, finalAmount };
  };

  const handleSelectVoucher = async (voucher: UserPromotion) => {
    if (selectedVoucherId === voucher.id) {
      // Deselect
      setSelectedVoucherId(null);
      setAppliedVoucher(null);
      return;
    }

    setSelectedVoucherId(voucher.id);

    try {
      // Apply voucher (chỉ lưu userPromotionId vào billing)
      const result = await applyVoucherMutation.mutateAsync({
        appointmentId,
        userPromotionId: voucher.id,
      });

      // Tính discount ở FE và lưu vào state
      const { discountAmount, finalAmount } = calculateDiscount(voucher);
      setAppliedVoucher({
        ...result,
        discountAmount,
        finalAmount,
      });
    } catch (error: any) {
      Alert.alert(
        'Lỗi',
        error?.response?.data?.message || 'Không thể áp dụng voucher. Vui lòng thử lại.'
      );
      setSelectedVoucherId(null);
    }
  };

  const handleContinue = () => {
    if (isProcessing) return;

    // Tính finalAmount để pass sang QR screen
    let finalAmount = originalAmount;
    if (selectedVoucherId && appliedVoucher) {
      finalAmount = appliedVoucher.finalAmount;
    }

    setIsProcessing(true);
    if (selectedVoucherId) {
      router.push({
        pathname: '/(homes)/(payment)/qr-payment',
        params: {
          id: appointmentId.toString(),
          voucherId: selectedVoucherId.toString(),
          finalAmount: finalAmount.toString(),
        },
      });
    } else {
      router.push({
        pathname: '/(homes)/(payment)/qr-payment',
        params: {
          id: appointmentId.toString(),
          finalAmount: finalAmount.toString(),
        },
      });
    }
    setTimeout(() => setIsProcessing(false), 1000);
  };

  const renderVoucherCard = (voucher: UserPromotion) => {
    const isSelected = selectedVoucherId === voucher.id;
    const isApplying = applyVoucherMutation.isPending && selectedVoucherId === voucher.id;

    // Calculate potential discount
    const { discountAmount: potentialDiscount } = calculateDiscount(voucher);

    return (
      <TouchableOpacity
        key={voucher.id}
        onPress={() => handleSelectVoucher(voucher)}
        disabled={isApplying}
        className={`mb-3 overflow-hidden rounded-xl border-2 ${
          isSelected ? 'border-sky-500 bg-sky-50' : 'border-gray-200 bg-white'
        }`}
        style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
        }}>
        <View className="p-4">
          <View className="flex-row items-start justify-between">
            <View className="flex-1">
              <Text className="mb-1 text-lg font-bold text-gray-900">
                {voucher.promotion.title}
              </Text>
              {voucher.promotion.description && (
                <Text className="mb-2 text-sm text-gray-600">{voucher.promotion.description}</Text>
              )}
              <View className="mt-2 flex-row items-center">
                <View className="mr-4">
                  <Text className="text-xs text-gray-500">Giảm giá</Text>
                  <Text className="text-lg font-bold text-green-600">
                    {voucher.promotion.discountPercent}%
                  </Text>
                </View>
                <View>
                  <Text className="text-xs text-gray-500">Tối đa</Text>
                  <Text className="text-lg font-bold text-gray-900">
                    {voucher.promotion.maxDiscountAmount.toLocaleString('vi-VN')} VNĐ
                  </Text>
                </View>
              </View>
              <View className="mt-2 rounded-lg bg-green-50 p-2">
                <Text className="text-xs text-gray-600">
                  Bạn sẽ tiết kiệm:{' '}
                  <Text className="font-bold text-green-600">
                    {potentialDiscount.toLocaleString('vi-VN')} VNĐ
                  </Text>
                </Text>
              </View>
            </View>
            <View className="ml-4">
              {isSelected ? (
                <View className="h-8 w-8 items-center justify-center rounded-full bg-sky-500">
                  <Ionicons name="checkmark" size={20} color="white" />
                </View>
              ) : (
                <View className="h-8 w-8 items-center justify-center rounded-full border-2 border-gray-300" />
              )}
            </View>
          </View>
          {isApplying && (
            <View className="mt-2 flex-row items-center">
              <ActivityIndicator size="small" color="#0284C7" />
              <Text className="ml-2 text-sm text-gray-600">Đang áp dụng...</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoadingAppointment) {
    return (
      <View style={{ flex: 1, backgroundColor: '#E0F2FE' }}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <SafeAreaView style={{ flex: 1 }}>
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#0284C7" />
            <Text className="mt-4 text-gray-500">Đang tải...</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

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
        automaticallyAdjustContentInsets={false}>
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
              Chọn Voucher
            </Text>
          </View>
        </View>

        {/* Content */}
        <View style={{ paddingHorizontal: 24, marginTop: -80, marginBottom: 24 }}>
          {/* Appointment Info */}
          {appointment && (
            <View className="mb-6 rounded-xl bg-white p-4 shadow-sm">
              <Text className="mb-3 text-lg font-bold text-gray-900">Thông tin lịch hẹn</Text>
              <Text className="text-gray-600">Dịch vụ: {appointment.service.name}</Text>
              <Text className="text-gray-600">
                Bác sĩ: BS. {appointment.doctor.lastName} {appointment.doctor.firstName}
              </Text>
              <View className="mt-3 border-t border-gray-200 pt-3">
                <View className="flex-row items-center justify-between">
                  <Text className="text-gray-600">Số tiền gốc:</Text>
                  <Text className="text-xl font-bold text-green-600">
                    {originalAmount.toLocaleString('vi-VN')} VNĐ
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* No Voucher Option */}
          <TouchableOpacity
            onPress={() => {
              setSelectedVoucherId(null);
              setAppliedVoucher(null);
            }}
            className={`mb-4 rounded-xl border-2 p-4 ${
              selectedVoucherId === null ? 'border-sky-500 bg-sky-50' : 'border-gray-200 bg-white'
            }`}>
            <View className="flex-row items-center justify-between">
              <View className="flex-1 flex-row items-center">
                <Ionicons
                  name={selectedVoucherId === null ? 'checkmark-circle' : 'ellipse-outline'}
                  size={24}
                  color={selectedVoucherId === null ? '#0284C7' : '#9CA3AF'}
                />
                <Text className="ml-3 text-base font-medium text-gray-900">
                  Không sử dụng voucher
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* Vouchers List */}
          {isLoadingVouchers ? (
            <View className="items-center py-8">
              <ActivityIndicator size="large" color="#0284C7" />
              <Text className="mt-4 text-gray-500">Đang tải voucher...</Text>
            </View>
          ) : availableVouchers.length === 0 ? (
            <View className="items-center rounded-xl bg-white p-8">
              <Ionicons name="ticket-outline" size={64} color="#D1D5DB" />
              <Text className="mt-4 text-center text-gray-500">
                Bạn chưa có voucher nào khả dụng
              </Text>
            </View>
          ) : (
            <>
              <Text className="mb-3 text-base font-semibold text-gray-900">
                Voucher của bạn ({availableVouchers.length})
              </Text>
              {availableVouchers.map((voucher) => renderVoucherCard(voucher))}
            </>
          )}

          {/* Price Breakdown */}
          {appliedVoucher && (
            <View className="mt-6 rounded-xl bg-white p-4 shadow-sm">
              <Text className="mb-3 text-lg font-bold text-gray-900">Tóm tắt thanh toán</Text>
              <View className="space-y-2">
                <View className="flex-row items-center justify-between">
                  <Text className="text-gray-600">Số tiền gốc:</Text>
                  <Text className="font-medium text-gray-900">
                    {appliedVoucher.originalAmount.toLocaleString('vi-VN')} VNĐ
                  </Text>
                </View>
                <View className="flex-row items-center justify-between">
                  <Text className="text-gray-600">Giảm giá:</Text>
                  <Text className="font-bold text-green-600">
                    -{appliedVoucher.discountAmount.toLocaleString('vi-VN')} VNĐ
                  </Text>
                </View>
                <View className="mt-2 border-t border-gray-200 pt-2">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-lg font-bold text-gray-900">Tổng cần thanh toán:</Text>
                    <Text className="text-xl font-bold text-green-600">
                      {appliedVoucher.finalAmount.toLocaleString('vi-VN')} VNĐ
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* Continue Button */}
          <View style={{ paddingTop: 24 }}>
            <TouchableOpacity
              onPress={handleContinue}
              disabled={applyVoucherMutation.isPending}
              className="w-full items-center rounded-lg bg-sky-600 py-4"
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.2,
                shadowRadius: 4,
                elevation: 3,
              }}>
              {applyVoucherMutation.isPending ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-lg font-bold text-white">Tiếp tục thanh toán</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
