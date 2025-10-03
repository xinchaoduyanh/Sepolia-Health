'use client';

import { View, Text, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../contexts/AuthContext';

export default function ProfileScreen() {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert('Đăng xuất', 'Bạn có chắc chắn muốn đăng xuất?', [
      {
        text: 'Hủy',
        style: 'cancel',
      },
      {
        text: 'Đăng xuất',
        style: 'destructive',
        onPress: async () => {
          try {
            await logout();
            console.log('Logout successful');
          } catch (error) {
            console.error('Logout error:', error);
            Alert.alert('Lỗi', 'Có lỗi xảy ra khi đăng xuất');
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={['#667eea', '#764ba2', '#f093fb']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ paddingHorizontal: 24, paddingBottom: 48, paddingTop: 32 }}>
          <View className="items-center">
            <View className="mb-6 h-32 w-32 items-center justify-center rounded-full bg-white/20 shadow-2xl backdrop-blur-sm">
              <Text className="text-5xl font-bold text-white">
                {user?.name?.charAt(0).toUpperCase() || 'A'}
              </Text>
            </View>
            <Text className="mb-2 text-3xl font-bold text-white">
              {user?.name || 'Nguyễn Văn A'}
            </Text>
            <Text className="text-lg text-white/90">22 tuổi • 0123 456 789</Text>
          </View>
        </LinearGradient>
        <View className="-mt-6 mb-6 px-6">
          <View className="rounded-2xl bg-white p-4 shadow-lg">
            <View className="flex-row justify-around">
              <View className="items-center">
                <View className="mb-2 h-12 w-12 items-center justify-center rounded-full bg-blue-50">
                  <Ionicons name="calendar" size={24} color="#3B82F6" />
                </View>
                <Text className="text-xl font-bold text-gray-800">12</Text>
                <Text className="text-xs text-gray-500">Lịch hẹn</Text>
              </View>
              <View className="items-center">
                <View className="mb-2 h-12 w-12 items-center justify-center rounded-full bg-green-50">
                  <Ionicons name="document-text" size={24} color="#10B981" />
                </View>
                <Text className="text-xl font-bold text-gray-800">8</Text>
                <Text className="text-xs text-gray-500">Đơn thuốc</Text>
              </View>
              <View className="items-center">
                <View className="mb-2 h-12 w-12 items-center justify-center rounded-full bg-blue-50">
                  <Ionicons name="heart" size={24} color="#3B82F6" />
                </View>
                <Text className="text-xl font-bold text-gray-800">95</Text>
                <Text className="text-xs text-gray-500">Điểm sức khỏe</Text>
              </View>
            </View>
          </View>
        </View>

        <View className="px-6">
          <View className="mb-6">
            <Text className="mb-3 text-base font-bold text-gray-800">Tài khoản</Text>
            <View className="space-y-3">
              <TouchableOpacity className="flex-row items-center rounded-xl bg-white p-4 shadow-sm">
                <View className="mr-4 h-11 w-11 items-center justify-center rounded-full bg-blue-50">
                  <Ionicons name="person-outline" size={22} color="#3B82F6" />
                </View>
                <Text className="flex-1 text-base font-medium text-gray-800">Chỉnh sửa hồ sơ</Text>
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
              </TouchableOpacity>

              <TouchableOpacity className="flex-row items-center rounded-xl bg-white p-4 shadow-sm">
                <View className="mr-4 h-11 w-11 items-center justify-center rounded-full bg-green-50">
                  <Ionicons name="lock-closed-outline" size={22} color="#10B981" />
                </View>
                <Text className="flex-1 text-base font-medium text-gray-800">Đổi mật khẩu</Text>
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
              </TouchableOpacity>

              <TouchableOpacity className="flex-row items-center rounded-xl bg-white p-4 shadow-sm">
                <View className="mr-4 h-11 w-11 items-center justify-center rounded-full bg-blue-50">
                  <Ionicons name="notifications-outline" size={22} color="#3B82F6" />
                </View>
                <Text className="flex-1 text-base font-medium text-gray-800">Thông báo</Text>
                <View className="mr-3 rounded-full bg-red-500 px-2 py-0.5">
                  <Text className="text-xs font-bold text-white">3</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
          </View>

          <View className="mb-6">
            <Text className="mb-3 text-base font-bold text-gray-800">Ứng dụng</Text>
            <View className="space-y-3">
              <TouchableOpacity className="flex-row items-center rounded-xl bg-white p-4 shadow-sm">
                <View className="mr-4 h-11 w-11 items-center justify-center rounded-full bg-blue-50">
                  <Ionicons name="help-circle-outline" size={22} color="#3B82F6" />
                </View>
                <Text className="flex-1 text-base font-medium text-gray-800">Trợ giúp</Text>
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
              </TouchableOpacity>

              <TouchableOpacity className="flex-row items-center rounded-xl bg-white p-4 shadow-sm">
                <View className="mr-4 h-11 w-11 items-center justify-center rounded-full bg-green-50">
                  <Ionicons name="information-circle-outline" size={22} color="#10B981" />
                </View>
                <Text className="flex-1 text-base font-medium text-gray-800">Giới thiệu</Text>
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            onPress={handleLogout}
            className="mb-8 flex-row items-center justify-center rounded-xl bg-red-50 p-4 shadow-sm">
            <View className="mr-3 h-11 w-11 items-center justify-center rounded-full bg-red-100">
              <Ionicons name="log-out-outline" size={22} color="#EF4444" />
            </View>
            <Text className="text-base font-semibold text-red-600">Đăng xuất</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
