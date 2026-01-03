import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useClaimPromotionViaQr } from '@/lib/api/promotion';
import Toast from 'react-native-toast-message';

export default function QRScannerScreen() {
  console.log('--- RENDERING QR SCANNER V2 ---');
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const claimMutation = useClaimPromotionViaQr();

  useEffect(() => {
    if (!permission) {
      requestPermission();
    }
  }, [permission]);

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
          throw new Error('Dữ liệu mã QR không đúng định dạng');
        }

        // Gọi API nhận voucher
        const result = await claimMutation.mutateAsync({
          promotionId: parseInt(id),
          signature: sig,
          t: parseInt(t),
          i: parseInt(i),
        });

        if (result.success) {
          Alert.alert(
            'Thành công!',
            result.message || 'Bạn đã nhận voucher thành công.',
            [
              {
                text: 'Xem kho Voucher',
                onPress: () => router.replace('/(homes)/(account)/promotions'),
              },
              {
                text: 'Đóng',
                onPress: () => router.back(),
                style: 'cancel',
              },
            ]
          );
        } else {
          Alert.alert('Thông báo', result.message, [
            { text: 'OK', onPress: () => setScanned(false) }
          ]);
        }
      } else {
        Alert.alert('Lỗi', 'Mã QR không hợp lệ hoặc không thuộc hệ thống Sepolia Health', [
          { text: 'Quét lại', onPress: () => setScanned(false) }
        ]);
      }
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error.message || 'Có lỗi xảy ra khi quét mã';
      Alert.alert('Lỗi', errorMessage, [
        { text: 'Thử lại', onPress: () => setScanned(false) }
      ]);
    }
  };

  return (
    <View className="flex-1 bg-black">
      <CameraView
        style={StyleSheet.absoluteFillObject}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
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
          onPress={() => router.back()}
        >
          <Ionicons name="close" size={24} color="white" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-white">Quét nhận ưu đãi</Text>
        <View className="w-10" />
      </View>

      {claimMutation.isPending && (
        <View className="absolute inset-0 items-center justify-center bg-black/60">
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text className="mt-4 text-white font-semibold">Đang xử lý...</Text>
        </View>
      )}
    </View>
  );
}