import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Modal, Pressable } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useClaimPromotionViaQr } from '@/lib/api/promotion';

type ResultType = 'success' | 'info' | 'error' | null;

export default function QRScannerScreen() {
  console.log('--- RENDERING QR SCANNER V2 ---');
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const claimMutation = useClaimPromotionViaQr();
  
  // Modal state
  const [showResultModal, setShowResultModal] = useState(false);
  const [resultType, setResultType] = useState<ResultType>(null);
  const [resultMessage, setResultMessage] = useState('');
  
  // Use ref to track if we're showing result to prevent double-firing
  const isShowingResult = useRef(false);

  // Reset scanned state when screen is focused (so camera works every time)
  // But only reset if not currently showing a result modal
  useFocusEffect(
    useCallback(() => {
      console.log('QR Scanner focused - checking if should reset');
      // Only reset if we're not showing a result modal
      if (!isShowingResult.current) {
        console.log('Resetting scanned state');
        setScanned(false);
        setShowResultModal(false);
        setResultType(null);
        setResultMessage('');
      }
    }, [])
  );

  useEffect(() => {
    if (!permission) {
      requestPermission();
    }
  }, [permission]);

  // Navigate to Home page
  const goToHome = () => {
    isShowingResult.current = false;
    setShowResultModal(false);
    router.replace('/(homes)');
  };

  // Navigate to Promotions page
  const goToPromotions = () => {
    isShowingResult.current = false;
    setShowResultModal(false);
    router.replace('/(homes)/(account)/promotions');
  };

  // Show result modal
  const showResult = (type: ResultType, message: string) => {
    // Prevent showing result if already showing one
    if (isShowingResult.current) {
      console.log('Already showing result, ignoring duplicate');
      return;
    }
    isShowingResult.current = true;
    setResultType(type);
    setResultMessage(message);
    setShowResultModal(true);
  };

  if (!permission) {
    // Camera permissions are still loading
    return (
      <View className="flex-1 items-center justify-center bg-[#0F172A]">
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet
    return (
      <View className="flex-1 items-center justify-center bg-[#0F172A] px-6">
        <View className="mb-6 h-20 w-20 items-center justify-center rounded-full bg-red-100 italic">
          <Ionicons name="camera-outline" size={40} color="#EF4444" />
        </View>
        <Text className="mb-2 text-center text-xl font-bold text-white">Chúng tôi cần quyền Camera</Text>
        <Text className="mb-8 text-center text-gray-400">
          Vui lòng cấp quyền truy cập máy ảnh để có thể quét mã QR nhận ưu đãi
        </Text>
        <TouchableOpacity 
          className="rounded-full bg-blue-600 px-8 py-3"
          onPress={requestPermission}
        >
          <Text className="text-lg font-semibold text-white">Cấp quyền ngay</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    // Prevent double scanning
    if (scanned || claimMutation.isPending) return;
    
    setScanned(true);

    try {
      // Expected format: sepolia-health://claim?id=123&sig=abc&t=456
      if (data.startsWith('sepolia-health://claim')) {
        const url = data.replace('sepolia-health://claim?', '');
        const params = new URLSearchParams(url);
        
        const id = params.get('id');
        const sig = params.get('sig');
        const t = params.get('t');
        const i = params.get('i');

        if (!id || !sig || !t || !i) {
          showResult('error', 'Dữ liệu mã QR không đúng định dạng');
          return;
        }

        // Gọi API nhận voucher
        const result = await claimMutation.mutateAsync({
          promotionId: parseInt(id),
          signature: sig,
          t: parseInt(t),
          i: parseInt(i),
        });

        if (result.success) {
          showResult('success', result.message || 'Bạn đã nhận voucher thành công!');
        } else {
          showResult('info', result.message || 'Bạn đã có voucher này rồi.');
        }
      } else {
        showResult('error', 'Mã QR không hợp lệ hoặc không thuộc hệ thống Sepolia Health');
      }
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error.message || 'Có lỗi xảy ra khi quét mã';
      showResult('error', errorMessage);
    }
  };

  // Get modal config based on result type
  const getModalConfig = () => {
    switch (resultType) {
      case 'success':
        return {
          icon: 'gift' as const,
          iconBgColor: '#D1FAE5',
          iconColor: '#10B981',
          title: 'Nhận voucher thành công!',
          titleColor: '#10B981',
          containerBg: '#ECFDF5',
          primaryBtnBg: '#10B981',
          primaryBtnText: 'Xem kho voucher',
          primaryAction: goToPromotions,
          secondaryBtnText: 'Về trang chủ',
          secondaryAction: goToHome,
        };
      case 'info':
        return {
          icon: 'information-circle' as const,
          iconBgColor: '#DBEAFE',
          iconColor: '#3B82F6',
          title: 'Thông báo',
          titleColor: '#3B82F6',
          containerBg: '#EFF6FF',
          primaryBtnBg: '#3B82F6',
          primaryBtnText: 'Về trang chủ',
          primaryAction: goToHome,
          secondaryBtnText: null,
          secondaryAction: null,
        };
      case 'error':
      default:
        return {
          icon: 'close-circle' as const,
          iconBgColor: '#FEE2E2',
          iconColor: '#EF4444',
          title: 'Lỗi',
          titleColor: '#EF4444',
          containerBg: '#FEF2F2',
          primaryBtnBg: '#EF4444',
          primaryBtnText: 'Về trang chủ',
          primaryAction: goToHome,
          secondaryBtnText: null,
          secondaryAction: null,
        };
    }
  };

  const modalConfig = getModalConfig();

  return (
    <View className="flex-1 bg-black">
      <CameraView
        style={StyleSheet.absoluteFillObject}
        onBarcodeScanned={scanned || showResultModal ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
      />
      
      {/* Overlay UI */}
      <View className="flex-1 items-center justify-center">
        <View className="h-64 w-64 rounded-3xl border-2 border-white/50" />
        <Text className="mt-8 text-center text-white/80 font-medium bg-black/40 px-4 py-2 rounded-full overflow-hidden">
          Di chuyển khung hình trùng với mã QR
        </Text>
      </View>

      {/* Header controls */}
      <View className="absolute top-12 left-6 right-6 flex-row justify-between items-center">
        <TouchableOpacity 
          className="h-10 w-10 items-center justify-center rounded-full bg-black/50"
          onPress={goToHome}
        >
          <Ionicons name="close" size={24} color="white" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-white">Quét nhận ưu đãi</Text>
        <View className="w-10" />
      </View>

      {/* Loading Overlay */}
      {claimMutation.isPending && (
        <View className="absolute inset-0 items-center justify-center bg-black/60">
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text className="mt-4 text-white font-semibold">Đang xử lý...</Text>
        </View>
      )}

      {/* Result Modal */}
      <Modal
        visible={showResultModal}
        transparent={true}
        animationType="fade"
        onRequestClose={goToHome}>
        <View className="flex-1 items-center justify-center bg-black/50">
          <View
            className="mx-6 w-80 items-center rounded-3xl p-8"
            style={{ backgroundColor: modalConfig.containerBg }}>
            {/* Icon */}
            <View 
              className="mb-6 h-24 w-24 items-center justify-center rounded-full"
              style={{ backgroundColor: modalConfig.iconBgColor }}>
              <View 
                className="h-16 w-16 items-center justify-center rounded-full"
                style={{ backgroundColor: modalConfig.iconColor }}>
                <Ionicons name={modalConfig.icon} size={32} color="white" />
              </View>
            </View>

            {/* Title */}
            <Text 
              className="mb-2 text-center text-2xl font-bold" 
              style={{ color: modalConfig.titleColor }}>
              {modalConfig.title}
            </Text>

            {/* Message */}
            <Text className="mb-6 text-center text-base text-gray-600">
              {resultMessage}
            </Text>

            {/* Buttons */}
            <View className="w-full space-y-3">
              <Pressable
                onPress={modalConfig.primaryAction}
                className="w-full items-center rounded-xl py-4"
                style={{ backgroundColor: modalConfig.primaryBtnBg }}>
                <Text className="text-base font-bold text-white">{modalConfig.primaryBtnText}</Text>
              </Pressable>

              {modalConfig.secondaryBtnText && modalConfig.secondaryAction && (
                <Pressable
                  onPress={modalConfig.secondaryAction}
                  className="w-full items-center rounded-xl border-2 py-4"
                  style={{ borderColor: modalConfig.primaryBtnBg, backgroundColor: 'white' }}>
                  <Text className="text-base font-bold" style={{ color: modalConfig.primaryBtnBg }}>
                    {modalConfig.secondaryBtnText}
                  </Text>
                </Pressable>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}