'use client';

import { View, Text, TouchableOpacity, ScrollView, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';

export default function HomeScreen() {
  const { user } = useAuth();

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#3B82F6" />

      {/* Header */}
      <View className="bg-blue-600 px-6 pb-6 pt-4">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <View className="mr-4 h-12 w-12 items-center justify-center rounded-full bg-white">
              <Ionicons name="person" size={24} color="#3B82F6" />
            </View>
            <View>
              <Text className="text-lg font-bold text-white">{user?.name || 'Nguyễn Văn A'}</Text>
              <Text className="text-sm text-blue-100">Bệnh nhân</Text>
            </View>
          </View>
          <TouchableOpacity className="relative">
            <View className="h-10 w-10 items-center justify-center rounded-full bg-white/20">
              <Ionicons name="notifications" size={20} color="white" />
            </View>
            <View className="absolute -right-1 -top-1 h-4 w-4 items-center justify-center rounded-full bg-yellow-400">
              <Text className="text-xs font-bold text-white">3</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        {/* Lịch trình sắp tới */}
        <View className="px-6 py-4">
          <Text className="mb-4 text-lg font-bold text-gray-800">Lịch trình sắp tới</Text>
          <View className="rounded-lg bg-white p-4 shadow-sm">
            <View className="flex-row items-center">
              <View className="mr-4 h-2 w-1 bg-blue-500" />
              <View className="flex-1">
                <Text className="text-sm text-gray-500">09:00 • 14:00 15/01/2025</Text>
                <Text className="text-base font-semibold text-gray-800">Khám tổng quát</Text>
                <Text className="text-sm text-gray-600">Bác sĩ Nguyễn Văn B</Text>
                <Text className="text-sm text-gray-500">Phòng 201 - Tầng 2</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Chức năng */}
        <View className="px-6 py-4">
          <View className="mb-4 flex-row items-center justify-between">
            <Text className="text-lg font-bold text-gray-800">Chức năng</Text>
            <TouchableOpacity>
              <Text className="text-sm text-blue-500">Xem thêm →</Text>
            </TouchableOpacity>
          </View>

          <View className="flex-row flex-wrap justify-between">
            {/* Row 1 */}
            <View className="mb-4 w-[48%]">
              <TouchableOpacity className="items-center rounded-lg bg-white p-4 shadow-sm">
                <View className="mb-2 h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                  <Ionicons name="calendar" size={24} color="#3B82F6" />
                </View>
                <Text className="text-center text-sm font-medium text-gray-800">Đặt lịch</Text>
              </TouchableOpacity>
            </View>

            <View className="mb-4 w-[48%]">
              <TouchableOpacity className="items-center rounded-lg bg-white p-4 shadow-sm">
                <View className="mb-2 h-12 w-12 items-center justify-center rounded-lg bg-green-100">
                  <Ionicons name="medical" size={24} color="#10B981" />
                </View>
                <Text className="text-center text-sm font-medium text-gray-800">Lịch sử khám</Text>
              </TouchableOpacity>
            </View>

            <View className="mb-4 w-[48%]">
              <TouchableOpacity className="items-center rounded-lg bg-white p-4 shadow-sm">
                <View className="mb-2 h-12 w-12 items-center justify-center rounded-lg bg-purple-100">
                  <Ionicons name="document-text" size={24} color="#8B5CF6" />
                </View>
                <Text className="text-center text-sm font-medium text-gray-800">Đơn thuốc</Text>
              </TouchableOpacity>
            </View>

            <View className="mb-4 w-[48%]">
              <TouchableOpacity className="items-center rounded-lg bg-white p-4 shadow-sm">
                <View className="mb-2 h-12 w-12 items-center justify-center rounded-lg bg-orange-100">
                  <Ionicons name="card" size={24} color="#F59E0B" />
                </View>
                <Text className="text-center text-sm font-medium text-gray-800">Thanh toán</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Tin mới nhất */}
        <View className="px-6 py-4">
          <Text className="mb-4 text-lg font-bold text-gray-800">Tin mới nhất</Text>

          <View className="space-y-3">
            <TouchableOpacity className="rounded-lg bg-white p-4 shadow-sm">
              <View className="flex-row items-center">
                <View className="mr-3 h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                  <Ionicons name="newspaper" size={20} color="#3B82F6" />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-semibold text-gray-800">
                    Cập nhật quy trình khám bệnh mới
                  </Text>
                  <Text className="text-sm text-gray-500">2 giờ trước</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
              </View>
            </TouchableOpacity>

            <TouchableOpacity className="rounded-lg bg-white p-4 shadow-sm">
              <View className="flex-row items-center">
                <View className="mr-3 h-12 w-12 items-center justify-center rounded-full bg-green-100">
                  <Ionicons name="shield-checkmark" size={20} color="#10B981" />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-semibold text-gray-800">
                    Hướng dẫn phòng chống COVID-19
                  </Text>
                  <Text className="text-sm text-gray-500">1 ngày trước</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
              </View>
            </TouchableOpacity>

            <TouchableOpacity className="rounded-lg bg-white p-4 shadow-sm">
              <View className="flex-row items-center">
                <View className="mr-3 h-12 w-12 items-center justify-center rounded-full bg-purple-100">
                  <Ionicons name="gift" size={20} color="#8B5CF6" />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-semibold text-gray-800">
                    Chương trình ưu đãi tháng 1
                  </Text>
                  <Text className="text-sm text-gray-500">3 ngày trước</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        <View className="h-20" />
      </ScrollView>
    </SafeAreaView>
  );
}
