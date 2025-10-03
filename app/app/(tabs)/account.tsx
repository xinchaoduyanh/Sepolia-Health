'use client';

import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';

export default function AccountScreen() {
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
      <View className="px-6 py-8">
        {/* Header */}
        <View className="mb-8 items-center">
          <View className="mb-4 h-20 w-20 items-center justify-center rounded-full bg-blue-100">
            <Ionicons name="person" size={40} color="#3B82F6" />
          </View>
          <Text className="text-2xl font-bold text-gray-800">{user?.name || 'Nguyễn Văn A'}</Text>
          <Text className="text-gray-600">{user?.email}</Text>
        </View>

        {/* Menu Items */}
        <View className="space-y-4">
          <TouchableOpacity className="flex-row items-center rounded-lg bg-white p-4 shadow-sm">
            <View className="mr-4 h-10 w-10 items-center justify-center rounded-full bg-blue-100">
              <Ionicons name="person-outline" size={20} color="#3B82F6" />
            </View>
            <Text className="flex-1 text-base font-medium text-gray-800">Thông tin cá nhân</Text>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity className="flex-row items-center rounded-lg bg-white p-4 shadow-sm">
            <View className="mr-4 h-10 w-10 items-center justify-center rounded-full bg-green-100">
              <Ionicons name="shield-outline" size={20} color="#10B981" />
            </View>
            <Text className="flex-1 text-base font-medium text-gray-800">Bảo mật</Text>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity className="flex-row items-center rounded-lg bg-white p-4 shadow-sm">
            <View className="mr-4 h-10 w-10 items-center justify-center rounded-full bg-purple-100">
              <Ionicons name="settings-outline" size={20} color="#8B5CF6" />
            </View>
            <Text className="flex-1 text-base font-medium text-gray-800">Cài đặt</Text>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity className="flex-row items-center rounded-lg bg-white p-4 shadow-sm">
            <View className="mr-4 h-10 w-10 items-center justify-center rounded-full bg-orange-100">
              <Ionicons name="help-circle-outline" size={20} color="#F59E0B" />
            </View>
            <Text className="flex-1 text-base font-medium text-gray-800">Trợ giúp</Text>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleLogout}
            className="flex-row items-center rounded-lg bg-white p-4 shadow-sm">
            <View className="mr-4 h-10 w-10 items-center justify-center rounded-full bg-red-100">
              <Ionicons name="log-out-outline" size={20} color="#DC2626" />
            </View>
            <Text className="flex-1 text-base font-medium text-red-600">Đăng xuất</Text>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
