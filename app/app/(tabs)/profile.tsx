'use client';

import { View, Text, TouchableOpacity, Alert } from 'react-native';
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
        onPress: logout,
      },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      <LinearGradient colors={['#2F80ED', '#1E5FBF']} className="px-6 pb-8 pt-4">
        <View className="items-center">
          <View className="mb-4 h-24 w-24 items-center justify-center rounded-full bg-white shadow-lg">
            <Ionicons name="person" size={48} color="#2F80ED" />
          </View>
          <Text className="text-2xl font-bold text-white">{user?.name || 'User'}</Text>
          <Text className="text-blue-100">{user?.email}</Text>
        </View>
      </LinearGradient>

      <View className="flex-1 px-6 py-8">
        {/* Profile Options */}
        <View className="mb-8">
          <Text className="mb-4 text-lg font-semibold text-gray-800">Tài khoản</Text>
          <View className="space-y-2">
            <TouchableOpacity className="flex-row items-center rounded-2xl bg-white p-4 shadow-sm">
              <Ionicons name="person-outline" size={24} color="#2F80ED" />
              <Text className="ml-4 text-base font-medium text-gray-800">Chỉnh sửa hồ sơ</Text>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" className="ml-auto" />
            </TouchableOpacity>

            <TouchableOpacity className="flex-row items-center rounded-2xl bg-white p-4 shadow-sm">
              <Ionicons name="lock-closed-outline" size={24} color="#2F80ED" />
              <Text className="ml-4 text-base font-medium text-gray-800">Đổi mật khẩu</Text>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" className="ml-auto" />
            </TouchableOpacity>

            <TouchableOpacity className="flex-row items-center rounded-2xl bg-white p-4 shadow-sm">
              <Ionicons name="notifications-outline" size={24} color="#2F80ED" />
              <Text className="ml-4 text-base font-medium text-gray-800">Thông báo</Text>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" className="ml-auto" />
            </TouchableOpacity>
          </View>
        </View>

        {/* App Options */}
        <View className="mb-8">
          <Text className="mb-4 text-lg font-semibold text-gray-800">Ứng dụng</Text>
          <View className="space-y-2">
            <TouchableOpacity className="flex-row items-center rounded-2xl bg-white p-4 shadow-sm">
              <Ionicons name="help-circle-outline" size={24} color="#2F80ED" />
              <Text className="ml-4 text-base font-medium text-gray-800">Trợ giúp</Text>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" className="ml-auto" />
            </TouchableOpacity>

            <TouchableOpacity className="flex-row items-center rounded-2xl bg-white p-4 shadow-sm">
              <Ionicons name="information-circle-outline" size={24} color="#2F80ED" />
              <Text className="ml-4 text-base font-medium text-gray-800">Giới thiệu</Text>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" className="ml-auto" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          onPress={handleLogout}
          className="flex-row items-center justify-center rounded-2xl bg-red-50 p-4 shadow-sm">
          <Ionicons name="log-out-outline" size={24} color="#EF4444" />
          <Text className="ml-4 text-base font-medium text-red-600">Đăng xuất</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
