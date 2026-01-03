'use client';

import { View, Text, TouchableOpacity, Alert, ScrollView, StatusBar, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { router } from 'expo-router';
import { useAuth } from '@/lib/hooks/useAuth';
import { PatientProfile } from '@/types/auth';

export default function AccountScreen() {
  const { user, logout } = useAuth();
  // Lấy patientProfiles từ user data
  const patientProfiles = user?.patientProfiles || [];

  // Lấy primary profile (hồ sơ chính)
  const primaryProfile = patientProfiles.find(
    (profile: PatientProfile) => profile.relationship === 'SELF'
  );

  const handleLogout = () => {
    Alert.alert('Đăng xuất', 'Bạn có chắc chắn muốn đăng xuất?', [
      {
        text: 'Hủy',
        style: 'cancel',
      },
      {
        text: 'Đăng xuất',
        style: 'destructive',
        onPress: logout,
      },
    ]);
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
        automaticallyAdjustContentInsets={false}>
        {/* Background Gradient - now scrollable and extends to top */}
        <View style={{ height: 380, position: 'relative', marginTop: -60 }}>
          <LinearGradient
            colors={['#0284C7', '#06B6D4', '#10B981']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ flex: 1 }}
          />

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
          {/* Header + Avatar positioned within gradient */}
          <View
            style={{
              position: 'absolute',
              top: 120,
              left: 24,
              right: 24,
              alignItems: 'center',
            }}>
            {/* Header Title */}
            <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 20 }}>
              Tài khoản của tôi
            </Text>

            {/* Avatar Section */}
            <View style={{ alignItems: 'center' }}>
              <View
                style={{
                  height: 80,
                  width: 80,
                  borderRadius: 40,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'rgba(255,255,255,0.25)',
                  borderWidth: 3,
                  borderColor: 'rgba(255,255,255,0.4)',
                  shadowColor: '#000000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.2,
                  shadowRadius: 8,
                  elevation: 4,
                  marginBottom: 12,
                }}>
                {primaryProfile?.avatar ? (
                  <Image
                    source={{ uri: primaryProfile.avatar }}
                    style={{
                      height: 74,
                      width: 74,
                      borderRadius: 37,
                    }}
                  />
                ) : (
                  <Text style={{ fontSize: 32, fontWeight: 'bold', color: '#FFFFFF' }}>
                    {primaryProfile
                      ? primaryProfile.firstName.charAt(0).toUpperCase()
                      : user?.firstName?.charAt(0).toUpperCase() || 'U'}
                  </Text>
                )}
              </View>

              <Text style={{ fontSize: 20, fontWeight: '700', color: '#FFFFFF', marginBottom: 6 }}>
                {primaryProfile
                  ? `${primaryProfile.lastName} ${primaryProfile.firstName}`
                  : user
                    ? `${user.lastName} ${user.firstName}`
                    : 'Người dùng'}
              </Text>
            </View>
          </View>
        </View>

        {/* Main Content Area */}
        <View style={{ paddingHorizontal: 24, marginTop: -80, marginBottom: 24 }}>
          {/* Quản lý yêu cầu và ưu đãi */}
          <View className="mb-6">
            <Text className="mb-4 text-lg font-bold text-slate-900">Quản lý yêu cầu và ưu đãi</Text>
            <View className="overflow-hidden rounded-2xl bg-white shadow-lg shadow-sky-600/10">
              <TouchableOpacity
                onPress={() => router.push('/(homes)/(account)/promotions')}
                className="flex-row items-center p-4">
                <View className="mr-4 h-10 w-10 items-center justify-center rounded-lg bg-sky-50">
                  <Ionicons name="ticket-outline" size={20} color="#0284C7" />
                </View>
                <Text className="flex-1 text-base font-medium text-slate-900">Khuyến mãi</Text>
                <Ionicons name="chevron-forward" size={18} color="#06B6D4" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Cài đặt */}
          <View className="mb-6">
            <Text className="mb-4 text-lg font-bold text-slate-900">Cài đặt</Text>
            <View className="overflow-hidden rounded-2xl bg-white shadow-lg shadow-sky-600/10">
              <TouchableOpacity
                onPress={() => router.push('/(homes)/(account)/change-password')}
                className="flex-row items-center border-b border-sky-50 p-4">
                <View className="mr-4 h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                  <Ionicons name="lock-closed-outline" size={20} color="#10B981" />
                </View>
                <Text className="flex-1 text-base font-medium text-slate-900">Đổi mật khẩu</Text>
                <Ionicons name="chevron-forward" size={18} color="#06B6D4" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Điều khoản & quy định */}
          <View className="mb-6">
            <Text className="mb-4 text-lg font-bold text-slate-900">Điều khoản & quy định</Text>
            <View className="overflow-hidden rounded-2xl bg-white shadow-lg shadow-sky-600/10">
              <TouchableOpacity
                onPress={() => router.push('/(homes)/(account)/terms/usage-regulations')}
                className="flex-row items-center border-b border-sky-50 p-4">
                <View className="mr-4 h-10 w-10 items-center justify-center rounded-lg bg-sky-50">
                  <Ionicons name="document-text-outline" size={20} color="#0284C7" />
                </View>
                <Text className="flex-1 text-base font-medium text-slate-900">
                  Quy định sử dụng
                </Text>
                <Ionicons name="chevron-forward" size={18} color="#06B6D4" />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => router.push('/(homes)/(account)/terms/dispute-resolution')}
                className="flex-row items-center border-b border-sky-50 p-4">
                <View className="mr-4 h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                  <Ionicons name="warning-outline" size={20} color="#10B981" />
                </View>
                <Text className="flex-1 text-base font-medium text-slate-900">
                  Chính sách giải quyết khiếu nại, tranh chấp
                </Text>
                <Ionicons name="chevron-forward" size={18} color="#06B6D4" />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => router.push('/(homes)/(account)/terms/privacy-policy')}
                className="flex-row items-center border-b border-sky-50 p-4">
                <View className="mr-4 h-10 w-10 items-center justify-center rounded-lg bg-sky-50">
                  <Ionicons name="shield-checkmark-outline" size={20} color="#0284C7" />
                </View>
                <Text className="flex-1 text-base font-medium text-slate-900">
                  Chính sách bảo vệ dữ liệu cá nhân của Sepolia
                </Text>
                <Ionicons name="chevron-forward" size={18} color="#06B6D4" />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => router.push('/(homes)/(account)/terms/app-faq')}
                className="flex-row items-center border-b border-sky-50 p-4">
                <View className="mr-4 h-10 w-10 items-center justify-center rounded-lg bg-sky-50">
                  <Ionicons name="help-circle-outline" size={20} color="#0284C7" />
                </View>
                <Text className="flex-1 text-base font-medium text-slate-900">
                  Hỏi đáp về ứng dụng
                </Text>
                <Ionicons name="chevron-forward" size={18} color="#06B6D4" />
              </TouchableOpacity>

              <TouchableOpacity onPress={handleLogout} className="flex-row items-center p-4">
                <View className="mr-4 h-10 w-10 items-center justify-center rounded-lg bg-red-100">
                  <Ionicons name="log-out-outline" size={20} color="#EF4444" />
                </View>
                <Text className="flex-1 text-base font-medium text-slate-900">Đăng xuất</Text>
                <Ionicons name="chevron-forward" size={18} color="#06B6D4" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Thông tin công ty */}
          <View className="items-center py-5">
            <Text className="mb-2 text-center text-xs leading-5 text-slate-500">
              CÔNG TY CỔ PHẦN Y TẾ SEPOLIA HEALTH{'\n'}
              Lai Xá, Kim Chung, Hoài Đức, Hà Nội, Việt Nam{'\n'}
              Điện thoại: 0243.975.0028{'\n'}
              Email: info@sepoliahealth.com
            </Text>

            <View className="mb-2 flex-row items-center rounded-lg bg-sky-50 px-3 py-1.5">
              <View className="mr-2 h-4 w-4 items-center justify-center rounded-full bg-sky-600">
                <Ionicons name="checkmark" size={10} color="white" />
              </View>
              <Text className="text-xs font-medium text-sky-600">ĐÃ THÔNG BÁO BỘ CÔNG THƯƠNG</Text>
            </View>

            <Text className="text-xs text-slate-500">Sepolia Health v1.0.0</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
