import { View, Text, TouchableOpacity, ScrollView, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function AppointmentScreen() {
  return (
    <LinearGradient colors={['#f8fafc', '#f1f5f9', '#e2e8f0']} style={{ flex: 1 }}>
      <SafeAreaView className="flex-1" edges={['top']}>
        <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <LinearGradient
            colors={['#667eea', '#764ba2', '#f093fb']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ paddingHorizontal: 24, paddingBottom: 32, paddingTop: 24 }}>
            <Text className="text-3xl font-bold text-white">Đặt lịch khám</Text>
            <Text className="mt-2 text-lg text-white/90">Chọn thời gian và bác sĩ phù hợp</Text>
          </LinearGradient>
          <View className="-mt-6 mb-8 px-6">
            <View className="rounded-3xl bg-white/90 p-6 shadow-xl backdrop-blur-sm">
              <Text className="mb-4 text-xl font-bold text-gray-800">Đặt lịch nhanh</Text>
              <View className="space-y-6">
                <TouchableOpacity className="flex-row items-center rounded-2xl border border-white/20 bg-white/80 p-4 shadow-lg backdrop-blur-sm mb-2">
                  <View className="mr-4 h-14 w-14 items-center justify-center rounded-full bg-blue-50">
                    <Ionicons name="medical" size={28} color="#3B82F6" />
                  </View>
                  <View className="flex-1 ">
                    <Text className="text-lg font-semibold text-gray-800">Khám tổng quát</Text>
                    <Text className="mt-1 text-sm text-gray-500">Kiểm tra sức khỏe định kỳ</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={22} color="#9CA3AF" />
                </TouchableOpacity>

                <TouchableOpacity className="flex-row items-center rounded-2xl border border-white/20 bg-white/80 p-4 shadow-lg backdrop-blur-sm mb-2">
                  <View className="mr-4 h-14 w-14 items-center justify-center rounded-full bg-green-50">
                    <Ionicons name="heart" size={28} color="#10B981" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-lg font-semibold text-gray-800">Tim mạch</Text>
                    <Text className="mt-1 text-sm text-gray-500">Khám chuyên khoa tim mạch</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={22} color="#9CA3AF" />
                </TouchableOpacity>

                <TouchableOpacity className="flex-row items-center rounded-2xl border border-white/20 bg-white/80 p-4 shadow-lg backdrop-blur-sm mb-2">
                  <View className="mr-4 h-14 w-14 items-center justify-center rounded-full bg-blue-50">
                    <Ionicons name="eye" size={28} color="#3B82F6" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-lg font-semibold text-gray-800">Mắt</Text>
                    <Text className="mt-1 text-sm text-gray-500">Khám và điều trị mắt</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={22} color="#9CA3AF" />
                </TouchableOpacity>

                <TouchableOpacity className="flex-row items-center rounded-2xl border border-white/20 bg-white/80 p-4 shadow-lg backdrop-blur-sm mb-2">
                  <View className="mr-4 h-14 w-14 items-center justify-center rounded-full bg-green-50">
                    <Ionicons name="fitness" size={28} color="#10B981" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-lg font-semibold text-gray-800">Cơ xương khớp</Text>
                    <Text className="mt-1 text-sm text-gray-500">Điều trị xương khớp</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={22} color="#9CA3AF" />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View className="mb-8 px-6">
            <Text className="mb-4 text-xl font-bold text-gray-800">Lịch hẹn sắp tới</Text>
            <View className="rounded-2xl border border-white/20 bg-white/90 p-6 shadow-lg backdrop-blur-sm">
              <View className="mb-4 flex-row items-start">
                <View className="mr-4 items-center">
                  <View className="h-16 w-16 items-center justify-center rounded-2xl bg-blue-50">
                    <Text className="text-xl font-bold text-blue-600">15</Text>
                    <Text className="text-xs text-blue-600">Th1</Text>
                  </View>
                </View>
                <View className="flex-1">
                  <View className="mb-2 flex-row items-center">
                    <View className="mr-2 h-2 w-2 rounded-full bg-green-500" />
                    <Text className="text-sm font-medium text-green-600">09:00 - 10:00</Text>
                  </View>
                  <Text className="mb-2 text-lg font-semibold text-gray-800">Khám tổng quát</Text>
                  <View className="mb-2 flex-row items-center">
                    <Ionicons name="person-outline" size={16} color="#6B7280" />
                    <Text className="ml-2 text-sm text-gray-600">BS. Nguyễn Văn B</Text>
                  </View>
                  <View className="flex-row items-center">
                    <Ionicons name="location-outline" size={16} color="#6B7280" />
                    <Text className="ml-2 text-sm text-gray-500">Phòng 201 - Tầng 2</Text>
                  </View>
                </View>
              </View>
              <View className="flex-row space-x-3">
                <TouchableOpacity className="flex-1 rounded-xl bg-blue-600 py-4 shadow-lg">
                  <Text className="text-center text-base font-semibold text-white">Xác nhận</Text>
                </TouchableOpacity>
                <TouchableOpacity className="flex-1 rounded-xl bg-gray-100 py-4 shadow-lg">
                  <Text className="text-center text-base font-semibold text-gray-700">
                    Hủy lịch
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View className="mb-8 px-6">
            <TouchableOpacity className="rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 py-5 shadow-xl">
              <View className="flex-row items-center justify-center">
                <Ionicons name="add-circle-outline" size={28} color="white" />
                <Text className="ml-3 text-xl font-semibold text-white">Đặt lịch mới</Text>
              </View>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}
