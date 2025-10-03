'use client';

import { View, Text, TouchableOpacity, ScrollView, StatusBar, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../contexts/AuthContext';

export default function HomeScreen() {
  const { user } = useAuth();

  return (
    <View style={{ flex: 1 }}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '55%', // Tăng từ 45% lên 55%
          backgroundColor: 'white',
        }}>
        <Image
          source={require('../../assets/1.png')}
          style={{
            height: '100%',
            resizeMode: 'cover',
          }}
        />

        {/* Overlay Gradient */}
        <LinearGradient
          colors={[
            'transparent', // giữ rõ ở đầu
            'rgba(37,99,255,0.7)', // xanh lam đậm hơn ở giữa
            '#fff', // cuối blend hẳn vào nền trắng
            '#fff', // lặp trắng thêm để "ăn" hết chân ảnh
          ]}
          locations={[0.3, 0.6, 0.9, 1]} // bắt đầu mờ từ 30% chiều cao
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '100%',
          }}
        />
      </View>

      {/* White background extension */}
      <View
        style={{
          position: 'absolute',
          top: '55%',
          left: 0,
          right: 0,
          height: '55%',
          backgroundColor: 'white',
        }}
      />

      {/* Gradient Overlay - mờ dần thực sự */}
      <LinearGradient
        colors={[
          'transparent',
          'rgba(255, 255, 255, 0.1)',
          'rgba(255, 255, 255, 0.3)',
          'rgba(255, 255, 255, 0.6)',
          '#fff',
        ]}
        locations={[0, 0.4, 0.6, 0.8, 1]}
        style={{ flex: 1 }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          style={{ flex: 1 }}
          bounces={false}
          scrollEventThrottle={16}
          onScroll={(event) => {
            const offsetY = event.nativeEvent.contentOffset.y;
            if (offsetY < 0) {
              // Ngăn scroll lên trên
              event.nativeEvent.contentOffset.y = 0;
            }
          }}>
          {/* Header Section */}
          <View style={{ paddingTop: 60, paddingHorizontal: 24, paddingBottom: 32 }}>
            <View className="flex-row items-center justify-between">
              <View className="flex-1 flex-row items-center">
                <View className="mr-4 h-16 w-16 items-center justify-center rounded-full bg-white shadow-lg">
                  <Text className="text-2xl font-bold text-blue-600">
                    {user?.name?.charAt(0).toUpperCase() || 'A'}
                  </Text>
                </View>
                <View className="flex-1">
                  <Text className="text-lg font-semibold text-white">
                    Xin chào, {user?.name || 'Nguyễn Văn A'}
                  </Text>
                  <Text className="mt-0.5 text-sm italic text-blue-100">
                    {/* {user?.age || 22} tuổi • {user?.phone || "0123 456 789"}
                     */}
                    22 tuổi • 0123 456 789
                  </Text>
                </View>
              </View>
              <TouchableOpacity className="relative">
                <View className="h-11 w-11 items-center justify-center rounded-xl bg-white/20 active:bg-white/30">
                  <Ionicons name="notifications-outline" size={22} color="white" />
                </View>
                <View className="absolute -right-1 -top-1 h-5 w-5 items-center justify-center rounded-full border-2 border-blue-600 bg-green-500">
                  <Text className="text-[10px] font-bold text-white">3</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
          <View className="-mt-6 mb-6 px-6">
            <View className="rounded-3xl bg-white p-6 shadow-lg">
              <View className="flex-row items-center justify-between">
                <View className="flex-1 pr-4">
                  <Text className="mb-2 text-xl font-bold text-gray-800">Ưu đãi Giáng Sinh</Text>
                  <Text className="mb-4 text-sm leading-5 text-gray-600">
                    Nhận ngay voucher 10% nhân dịp Giáng Sinh sắp tới
                  </Text>
                  <TouchableOpacity className="flex-row items-center self-start rounded-full bg-blue-500 px-5 py-2.5">
                    <Text className="mr-2 text-sm font-semibold text-white">Nhận ngay</Text>
                    <Ionicons name="arrow-forward" size={16} color="white" />
                  </TouchableOpacity>
                </View>
                <View className="h-24 w-24 items-center justify-center rounded-full bg-blue-50">
                  <Ionicons name="gift-outline" size={48} color="#3B82F6" />
                </View>
              </View>
            </View>
          </View>

          <View className="mb-6 px-6">
            <View className="mb-3 flex-row items-center justify-between">
              <Text className="text-lg font-bold text-gray-800">Lịch trình sắp tới</Text>
              <TouchableOpacity>
                <Text className="text-sm font-medium text-blue-600">Xem tất cả</Text>
              </TouchableOpacity>
            </View>
            <View className="rounded-2xl border border-white/20 bg-white/90 p-4 shadow-lg backdrop-blur-sm">
              <View className="flex-row items-start">
                <View className="mr-3 items-center">
                  <View className="h-12 w-12 items-center justify-center rounded-xl bg-blue-50">
                    <Text className="text-base font-bold text-blue-600">15</Text>
                    <Text className="text-[10px] text-blue-600">Th1</Text>
                  </View>
                </View>
                <View className="flex-1">
                  <View className="mb-1 flex-row items-center">
                    <View className="mr-2 h-1.5 w-1.5 rounded-full bg-green-500" />
                    <Text className="text-xs font-medium text-green-600">09:00 - 14:00</Text>
                  </View>
                  <Text className="mb-1 text-base font-semibold text-gray-800">Khám tổng quát</Text>
                  <View className="mb-1 flex-row items-center">
                    <Ionicons name="person-outline" size={14} color="#6B7280" />
                    <Text className="ml-1 text-xs text-gray-600">Bác sĩ Nguyễn Văn B</Text>
                  </View>
                  <View className="flex-row items-center">
                    <Ionicons name="location-outline" size={14} color="#6B7280" />
                    <Text className="ml-1 text-xs text-gray-500">Phòng 201 - Tầng 2</Text>
                  </View>
                </View>
                <TouchableOpacity className="h-8 w-8 items-center justify-center rounded-full bg-gray-50">
                  <Ionicons name="chevron-forward" size={18} color="#6B7280" />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View className="mb-6 px-6">
            <View className="mb-3 flex-row items-center justify-between">
              <Text className="text-lg font-bold text-gray-800">Dịch vụ</Text>
            </View>

            <View className="rounded-3xl border border-white/20 bg-white/90 p-4 shadow-lg backdrop-blur-sm">
              <View className="flex-row flex-wrap gap-3">
                <View className="w-[22%]">
                  <TouchableOpacity className="items-center">
                    <View className="mb-2 h-14 w-14 items-center justify-center rounded-xl bg-blue-500 shadow-sm">
                      <Ionicons name="calendar-outline" size={24} color="white" />
                    </View>
                    <Text className="text-center text-xs text-gray-700">Đặt lịch</Text>
                  </TouchableOpacity>
                </View>

                <View className="w-[22%]">
                  <TouchableOpacity className="items-center">
                    <View className="mb-2 h-14 w-14 items-center justify-center rounded-xl bg-blue-500 shadow-sm">
                      <Ionicons name="time-outline" size={24} color="white" />
                    </View>
                    <Text className="text-center text-xs text-gray-700">Lịch sử</Text>
                  </TouchableOpacity>
                </View>

                <View className="w-[22%]">
                  <TouchableOpacity className="items-center">
                    <View className="mb-2 h-14 w-14 items-center justify-center rounded-xl bg-blue-500 shadow-sm">
                      <Ionicons name="document-text-outline" size={24} color="white" />
                    </View>
                    <Text className="text-center text-xs text-gray-700">Đơn thuốc</Text>
                  </TouchableOpacity>
                </View>

                <View className="w-[22%]">
                  <TouchableOpacity className="items-center">
                    <View className="mb-2 h-14 w-14 items-center justify-center rounded-xl bg-green-500 shadow-sm">
                      <Ionicons name="card-outline" size={24} color="white" />
                    </View>
                    <Text className="text-center text-xs text-gray-700">Thanh toán</Text>
                  </TouchableOpacity>
                </View>

                <View className="w-[22%]">
                  <TouchableOpacity className="items-center">
                    <View className="mb-2 h-14 w-14 items-center justify-center rounded-xl bg-blue-500 shadow-sm">
                      <Ionicons name="chatbubbles-outline" size={24} color="white" />
                    </View>
                    <Text className="text-center text-xs text-gray-700">Tư vấn</Text>
                  </TouchableOpacity>
                </View>

                <View className="w-[22%]">
                  <TouchableOpacity className="items-center">
                    <View className="mb-2 h-14 w-14 items-center justify-center rounded-xl bg-blue-500 shadow-sm">
                      <Ionicons name="flask-outline" size={24} color="white" />
                    </View>
                    <Text className="text-center text-xs text-gray-700">Xét nghiệm</Text>
                  </TouchableOpacity>
                </View>

                <View className="w-[22%]">
                  <TouchableOpacity className="items-center">
                    <View className="mb-2 h-14 w-14 items-center justify-center rounded-xl bg-green-500 shadow-sm">
                      <Ionicons name="heart-outline" size={24} color="white" />
                    </View>
                    <Text className="text-center text-xs text-gray-700">Sức khỏe</Text>
                  </TouchableOpacity>
                </View>

                <View className="w-[22%]">
                  <TouchableOpacity className="items-center">
                    <View className="mb-2 h-14 w-14 items-center justify-center rounded-xl bg-blue-500 shadow-sm">
                      <Ionicons name="people-outline" size={24} color="white" />
                    </View>
                    <Text className="text-center text-xs text-gray-700">Cộng đồng</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>

          <View className="mb-6 px-6">
            <View className="mb-3 flex-row items-center justify-between">
              <Text className="text-lg font-bold text-gray-800">Mẹo sức khỏe</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-6 px-6">
              <View className="mr-3 w-64 overflow-hidden rounded-2xl border border-white/20 bg-white p-4 shadow-lg backdrop-blur-sm">
                <View className="mb-2 h-10 w-10 items-center justify-center rounded-full bg-blue-50">
                  <Ionicons name="water-outline" size={20} color="#3B82F6" />
                </View>
                <Text className="mb-1 text-base font-semibold text-gray-800">Uống đủ nước</Text>
                <Text className="text-sm text-gray-600">
                  Uống ít nhất 2 lít nước mỗi ngày để duy trì sức khỏe tốt
                </Text>
              </View>

              <View className="mr-3 w-64 overflow-hidden rounded-2xl border border-white/20 bg-white p-4 shadow-lg backdrop-blur-sm">
                <View className="mb-2 h-10 w-10 items-center justify-center rounded-full bg-green-50">
                  <Ionicons name="sunny-outline" size={20} color="#10B981" />
                </View>
                <Text className="mb-1 text-base font-semibold text-gray-800">Tắm nắng sáng</Text>
                <Text className="text-sm text-gray-600">
                  15-20 phút tắm nắng buổi sáng giúp cơ thể tổng hợp vitamin D
                </Text>
              </View>

              <View className="mr-3 w-64 overflow-hidden rounded-2xl border border-white/20 bg-white p-4 shadow-lg backdrop-blur-sm">
                <View className="mb-2 h-10 w-10 items-center justify-center rounded-full bg-blue-50">
                  <Ionicons name="bed-outline" size={20} color="#3B82F6" />
                </View>
                <Text className="mb-1 text-base font-semibold text-gray-800">Ngủ đủ giấc</Text>
                <Text className="text-sm text-gray-600">
                  7-8 tiếng ngủ mỗi đêm giúp cơ thể phục hồi và tái tạo năng lượng
                </Text>
              </View>
            </ScrollView>
          </View>

          <View className="mb-6 px-6">
            <View className="mb-3 flex-row items-center justify-between">
              <Text className="text-lg font-bold text-gray-800">Tin tức & Sự kiện</Text>
              <TouchableOpacity>
                <Text className="text-sm font-medium text-blue-600">Xem tất cả</Text>
              </TouchableOpacity>
            </View>

            <View className="space-y-2">
              <TouchableOpacity className="mt-2 overflow-hidden rounded-2xl border border-white/20 bg-white shadow-sm">
                <View className="flex-row items-center p-4">
                  <View className="mr-3 h-12 w-12 items-center justify-center rounded-lg bg-blue-50">
                    <Ionicons name="newspaper-outline" size={22} color="#3B82F6" />
                  </View>
                  <View className="flex-1">
                    <Text className="mb-0.5 text-sm font-semibold text-gray-800">
                      Cập nhật quy trình khám bệnh mới
                    </Text>
                    <Text className="text-xs text-gray-500">2 giờ trước</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
                </View>
              </TouchableOpacity>

              <TouchableOpacity className="mt-2 overflow-hidden rounded-2xl border border-white/20 bg-white shadow-sm">
                <View className="flex-row items-center p-4">
                  <View className="mr-3 h-12 w-12 items-center justify-center rounded-lg bg-green-50">
                    <Ionicons name="shield-checkmark-outline" size={22} color="#10B981" />
                  </View>
                  <View className="flex-1">
                    <Text className="mb-0.5 text-sm font-semibold text-gray-800">
                      Hướng dẫn phòng chống COVID-19
                    </Text>
                    <Text className="text-xs text-gray-500">1 ngày trước</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
                </View>
              </TouchableOpacity>

              <TouchableOpacity className="mt-2 overflow-hidden rounded-2xl border border-white/20 bg-white ">
                <View className="flex-row items-center p-4 ">
                  <View className="mr-3 h-12 w-12 items-center justify-center rounded-lg bg-blue-50 ">
                    <Ionicons name="gift-outline" size={22} color="#3B82F6" />
                  </View>
                  <View className="flex-1">
                    <Text className="mb-0.5 text-sm font-semibold text-gray-800">
                      Chương trình ưu đãi tháng 1
                    </Text>
                    <Text className="text-xs text-gray-500">3 ngày trước</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
                </View>
              </TouchableOpacity>
            </View>
          </View>

          <View className="mb-8 items-center px-6">
            <View className="mb-6 h-32 w-32 items-center justify-center rounded-full bg-white shadow-sm">
              <Image
                source={require('../../assets/Hospital building-rafiki.png')}
                style={{
                  width: 120,
                  height: 120,
                  resizeMode: 'contain',
                }}
                fadeDuration={200}
              />
            </View>
            <Text className="mb-2 text-center text-lg font-semibold text-gray-700">
              Trải nghiệm dịch vụ y tế tốt nhất
            </Text>
            <View className="mb-4 h-px w-full bg-gray-200" />
            <Text className="text-xs text-gray-400">© 2025 DUYANH. All rights reserved.</Text>
          </View>

          <View className="h-20" />
        </ScrollView>
      </LinearGradient>
    </View>
  );
}
