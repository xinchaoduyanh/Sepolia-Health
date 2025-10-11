'use client';

import { View, Text, TouchableOpacity, ScrollView, StatusBar, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/lib/hooks/useAuth';

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
          source={require('@/assets/1.png')}
          style={{
            height: '100%',
            resizeMode: 'cover',
          }}
        />

        {/* Overlay Gradient - Lighter for better text visibility */}
        <LinearGradient
          colors={[
            'transparent', // giữ rõ ở đầu
            'rgba(2,132,199,0.3)', // Blue-Green primary - giảm opacity
            'rgba(240,253,250,0.8)', // Cloud background
            '#F9FAFB', // Ice White background
          ]}
          locations={[0.2, 0.5, 0.8, 1]} // bắt đầu mờ từ 20% chiều cao
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '100%',
          }}
        />
      </View>

      {/* Background extension - Gray layer */}
      <View
        style={{
          position: 'absolute',
          top: '55%',
          left: 0,
          right: 0,
          height: '45%',
          backgroundColor: '#E5E7EB', // Gray background
        }}
      />

      {/* Main content container with subtle gradient */}
      <LinearGradient
        colors={['#F9FAFB', '#F0FDFA', '#E0F2FE']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
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
          <View style={{ paddingTop: 70, paddingHorizontal: 24, paddingBottom: 40 }}>
            <LinearGradient
              colors={['#0284C7', '#10B981']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                borderRadius: 28,
                padding: 20,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                shadowColor: '#0284C7',
                shadowOpacity: 0.25,
                shadowRadius: 12,
                elevation: 6,
              }}>
              {/* Avatar + Info */}
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <View
                  style={{
                    height: 64,
                    width: 64,
                    borderRadius: 999,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#F0FDFA',
                    shadowColor: '#0284C7',
                    shadowOpacity: 0.25,
                    shadowRadius: 8,
                    marginRight: 16,
                  }}>
                  <Text style={{ fontSize: 26, fontWeight: 'bold', color: '#0284C7' }}>
                    {user?.firstName?.charAt(0).toUpperCase() || 'A'}
                  </Text>
                </View>

                <View style={{ flexShrink: 1 }}>
                  <Text style={{ fontSize: 18, fontWeight: '700', color: '#F0FDFA' }}>
                    Xin chào, {user ? `${user.firstName} ${user.lastName}` : 'Nguyễn Văn A'}
                  </Text>
                  <Text style={{ fontSize: 13, color: '#A7F3D0', marginTop: 4 }}>
                    {user?.phone || 'Chưa cập nhật'} • {user?.email || 'Chưa cập nhật'}
                  </Text>
                </View>
              </View>

              {/* Notification button */}
              <TouchableOpacity
                style={{
                  position: 'relative',
                  height: 48,
                  width: 48,
                  borderRadius: 14,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.3)',
                }}>
                <Ionicons name="notifications-outline" size={22} color="#FFFFFF" />
                <View
                  style={{
                    position: 'absolute',
                    top: 5,
                    right: 5,
                    height: 18,
                    width: 18,
                    borderRadius: 9,
                    backgroundColor: '#10B981',
                    borderWidth: 2,
                    borderColor: '#F0FDFA',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  <Text style={{ fontSize: 10, fontWeight: 'bold', color: 'white' }}>3</Text>
                </View>
              </TouchableOpacity>
            </LinearGradient>
          </View>

          {/* Ưu đãi Section */}
          <View className="-mt-6 mb-6 px-6">
            <View className="rounded-3xl p-6 shadow-lg" style={{ backgroundColor: '#F0FDFA' }}>
              <View className="flex-row items-center justify-between">
                <View className="flex-1 pr-4">
                  <Text className="mb-2 text-xl font-bold" style={{ color: '#0F172A' }}>
                    Ưu đãi Giáng Sinh
                  </Text>
                  <Text className="mb-4 text-sm leading-5" style={{ color: '#475569' }}>
                    Nhận ngay voucher 10% nhân dịp Giáng Sinh sắp tới
                  </Text>
                  <TouchableOpacity
                    className="flex-row items-center self-start rounded-full px-5 py-2.5"
                    style={{ backgroundColor: '#0284C7' }}>
                    <Text className="mr-2 text-sm font-semibold text-white">Nhận ngay</Text>
                    <Ionicons name="arrow-forward" size={16} color="white" />
                  </TouchableOpacity>
                </View>
                <View
                  className="h-24 w-24 items-center justify-center rounded-full"
                  style={{ backgroundColor: '#E0F2FE' }}>
                  <Ionicons name="gift-outline" size={48} color="#0284C7" />
                </View>
              </View>
            </View>
          </View>

          {/* Lịch trình Section */}
          <View className="mb-6 px-6">
            <View className="mb-3 flex-row items-center justify-between">
              <Text className="text-lg font-bold" style={{ color: '#0F172A' }}>
                Lịch trình sắp tới
              </Text>
              <TouchableOpacity>
                <Text className="text-sm font-medium" style={{ color: '#0284C7' }}>
                  Xem tất cả
                </Text>
              </TouchableOpacity>
            </View>
            <View
              className="rounded-2xl border p-4 shadow-lg backdrop-blur-sm"
              style={{ borderColor: '#E0F2FE', backgroundColor: '#F0FDFA' }}>
              <View className="flex-row items-start">
                <View className="mr-3 items-center">
                  <View
                    className="h-12 w-12 items-center justify-center rounded-xl"
                    style={{ backgroundColor: '#E0F2FE' }}>
                    <Text className="text-base font-bold" style={{ color: '#0284C7' }}>
                      15
                    </Text>
                    <Text className="text-[10px]" style={{ color: '#0284C7' }}>
                      Th1
                    </Text>
                  </View>
                </View>
                <View className="flex-1">
                  <View className="mb-1 flex-row items-center">
                    <View
                      className="mr-2 h-1.5 w-1.5 rounded-full"
                      style={{ backgroundColor: '#10B981' }}
                    />
                    <Text className="text-xs font-medium" style={{ color: '#10B981' }}>
                      09:00 - 14:00
                    </Text>
                  </View>
                  <Text className="mb-1 text-base font-semibold" style={{ color: '#0F172A' }}>
                    Khám tổng quát
                  </Text>
                  <View className="mb-1 flex-row items-center">
                    <Ionicons name="person-outline" size={14} color="#475569" />
                    <Text className="ml-1 text-xs" style={{ color: '#475569' }}>
                      Bác sĩ Nguyễn Văn B
                    </Text>
                  </View>
                  <View className="flex-row items-center">
                    <Ionicons name="location-outline" size={14} color="#475569" />
                    <Text className="ml-1 text-xs" style={{ color: '#475569' }}>
                      Phòng 201 - Tầng 2
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  className="h-8 w-8 items-center justify-center rounded-full"
                  style={{ backgroundColor: '#E0F2FE' }}>
                  <Ionicons name="chevron-forward" size={18} color="#06B6D4" />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Dịch vụ Section */}
          <View className="mb-6 px-6">
            <View className="mb-3 flex-row items-center justify-between">
              <Text className="text-lg font-bold" style={{ color: '#0F172A' }}>
                Dịch vụ
              </Text>
            </View>

            <View
              className="rounded-3xl border p-4 shadow-lg backdrop-blur-sm"
              style={{ borderColor: '#E0F2FE', backgroundColor: '#F0FDFA' }}>
              <View className="flex-row flex-wrap gap-3">
                <View className="w-[22%]">
                  <TouchableOpacity className="items-center">
                    <View
                      className="mb-2 h-14 w-14 items-center justify-center rounded-xl shadow-sm"
                      style={{ backgroundColor: '#0284C7' }}>
                      <Ionicons name="calendar-outline" size={24} color="white" />
                    </View>
                    <Text className="text-center text-xs" style={{ color: '#0F172A' }}>
                      Đặt lịch
                    </Text>
                  </TouchableOpacity>
                </View>

                <View className="w-[22%]">
                  <TouchableOpacity className="items-center">
                    <View
                      className="mb-2 h-14 w-14 items-center justify-center rounded-xl shadow-sm"
                      style={{ backgroundColor: '#0284C7' }}>
                      <Ionicons name="time-outline" size={24} color="white" />
                    </View>
                    <Text className="text-center text-xs" style={{ color: '#0F172A' }}>
                      Lịch sử
                    </Text>
                  </TouchableOpacity>
                </View>

                <View className="w-[22%]">
                  <TouchableOpacity className="items-center">
                    <View
                      className="mb-2 h-14 w-14 items-center justify-center rounded-xl shadow-sm"
                      style={{ backgroundColor: '#0284C7' }}>
                      <Ionicons name="document-text-outline" size={24} color="white" />
                    </View>
                    <Text className="text-center text-xs" style={{ color: '#0F172A' }}>
                      Đơn thuốc
                    </Text>
                  </TouchableOpacity>
                </View>

                <View className="w-[22%]">
                  <TouchableOpacity className="items-center">
                    <View
                      className="mb-2 h-14 w-14 items-center justify-center rounded-xl shadow-sm"
                      style={{ backgroundColor: '#10B981' }}>
                      <Ionicons name="card-outline" size={24} color="white" />
                    </View>
                    <Text className="text-center text-xs" style={{ color: '#0F172A' }}>
                      Thanh toán
                    </Text>
                  </TouchableOpacity>
                </View>

                <View className="w-[22%]">
                  <TouchableOpacity className="items-center">
                    <View
                      className="mb-2 h-14 w-14 items-center justify-center rounded-xl shadow-sm"
                      style={{ backgroundColor: '#06B6D4' }}>
                      <Ionicons name="chatbubbles-outline" size={24} color="white" />
                    </View>
                    <Text className="text-center text-xs" style={{ color: '#0F172A' }}>
                      Tư vấn
                    </Text>
                  </TouchableOpacity>
                </View>

                <View className="w-[22%]">
                  <TouchableOpacity className="items-center">
                    <View
                      className="mb-2 h-14 w-14 items-center justify-center rounded-xl shadow-sm"
                      style={{ backgroundColor: '#0284C7' }}>
                      <Ionicons name="flask-outline" size={24} color="white" />
                    </View>
                    <Text className="text-center text-xs" style={{ color: '#0F172A' }}>
                      Xét nghiệm
                    </Text>
                  </TouchableOpacity>
                </View>

                <View className="w-[22%]">
                  <TouchableOpacity className="items-center">
                    <View
                      className="mb-2 h-14 w-14 items-center justify-center rounded-xl shadow-sm"
                      style={{ backgroundColor: '#10B981' }}>
                      <Ionicons name="heart-outline" size={24} color="white" />
                    </View>
                    <Text className="text-center text-xs" style={{ color: '#0F172A' }}>
                      Sức khỏe
                    </Text>
                  </TouchableOpacity>
                </View>

                <View className="w-[22%]">
                  <TouchableOpacity className="items-center">
                    <View
                      className="mb-2 h-14 w-14 items-center justify-center rounded-xl shadow-sm"
                      style={{ backgroundColor: '#0284C7' }}>
                      <Ionicons name="people-outline" size={24} color="white" />
                    </View>
                    <Text className="text-center text-xs" style={{ color: '#0F172A' }}>
                      Cộng đồng
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>

          {/* Mẹo sức khỏe Section */}
          <View className="mb-6 px-6">
            <View className="mb-3 flex-row items-center justify-between">
              <Text className="text-lg font-bold" style={{ color: '#0F172A' }}>
                Mẹo sức khỏe
              </Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-6 px-6">
              <View
                className="mr-3 w-64 overflow-hidden rounded-2xl border p-4 shadow-lg backdrop-blur-sm "
                style={{ borderColor: '#E0F2FE', backgroundColor: '#F0FDFA' }}>
                <View
                  className="mb-2 h-10 w-10 items-center justify-center rounded-full"
                  style={{ backgroundColor: '#E0F2FE' }}>
                  <Ionicons name="water-outline" size={20} color="#0284C7" />
                </View>
                <Text className="mb-1 text-base font-semibold" style={{ color: '#0F172A' }}>
                  Uống đủ nước
                </Text>
                <Text className="text-sm" style={{ color: '#475569' }}>
                  Uống ít nhất 2 lít nước mỗi ngày để duy trì sức khỏe tốt
                </Text>
              </View>

              <View
                className="mr-3 w-64 overflow-hidden rounded-2xl border p-4 shadow-lg backdrop-blur-sm"
                style={{ borderColor: '#E0F2FE', backgroundColor: '#F0FDFA' }}>
                <View
                  className="mb-2 h-10 w-10 items-center justify-center rounded-full"
                  style={{ backgroundColor: '#A7F3D0' }}>
                  <Ionicons name="sunny-outline" size={20} color="#10B981" />
                </View>
                <Text className="mb-1 text-base font-semibold" style={{ color: '#0F172A' }}>
                  Tắm nắng sáng
                </Text>
                <Text className="text-sm" style={{ color: '#475569' }}>
                  15-20 phút tắm nắng buổi sáng giúp cơ thể tổng hợp vitamin D
                </Text>
              </View>

              <View
                className="mr-3 w-64 overflow-hidden rounded-2xl border p-4 shadow-lg backdrop-blur-sm"
                style={{ borderColor: '#E0F2FE', backgroundColor: '#F0FDFA' }}>
                <View
                  className="mb-2 h-10 w-10 items-center justify-center rounded-full"
                  style={{ backgroundColor: '#E0F2FE' }}>
                  <Ionicons name="bed-outline" size={20} color="#0284C7" />
                </View>
                <Text className="mb-1 text-base font-semibold" style={{ color: '#0F172A' }}>
                  Ngủ đủ giấc
                </Text>
                <Text className="text-sm" style={{ color: '#475569' }}>
                  7-8 tiếng ngủ mỗi đêm giúp cơ thể phục hồi và tái tạo năng lượng
                </Text>
              </View>
            </ScrollView>
          </View>

          {/* Tin tức & Sự kiện Section */}
          <View className="mb-6 px-6">
            <View className="mb-3 flex-row items-center justify-between">
              <Text className="text-lg font-bold" style={{ color: '#0F172A' }}>
                Tin tức & Sự kiện
              </Text>
              <TouchableOpacity>
                <Text className="text-sm font-medium" style={{ color: '#0284C7' }}>
                  Xem tất cả
                </Text>
              </TouchableOpacity>
            </View>

            <View className="space-y-2">
              <TouchableOpacity
                className="mt-2 overflow-hidden rounded-2xl border shadow-sm"
                style={{ borderColor: '#E0F2FE', backgroundColor: '#F0FDFA' }}>
                <View className="flex-row items-center p-4">
                  <View
                    className="mr-3 h-12 w-12 items-center justify-center rounded-lg"
                    style={{ backgroundColor: '#E0F2FE' }}>
                    <Ionicons name="newspaper-outline" size={22} color="#0284C7" />
                  </View>
                  <View className="flex-1">
                    <Text className="mb-0.5 text-sm font-semibold" style={{ color: '#0F172A' }}>
                      Cập nhật quy trình khám bệnh mới
                    </Text>
                    <Text className="text-xs" style={{ color: '#475569' }}>
                      2 giờ trước
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#06B6D4" />
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                className="mt-2 overflow-hidden rounded-2xl border shadow-sm"
                style={{ borderColor: '#E0F2FE', backgroundColor: '#F0FDFA' }}>
                <View className="flex-row items-center p-4">
                  <View
                    className="mr-3 h-12 w-12 items-center justify-center rounded-lg"
                    style={{ backgroundColor: '#A7F3D0' }}>
                    <Ionicons name="shield-checkmark-outline" size={22} color="#10B981" />
                  </View>
                  <View className="flex-1">
                    <Text className="mb-0.5 text-sm font-semibold" style={{ color: '#0F172A' }}>
                      Hướng dẫn phòng chống COVID-19
                    </Text>
                    <Text className="text-xs" style={{ color: '#475569' }}>
                      1 ngày trước
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#06B6D4" />
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                className="mt-2 overflow-hidden rounded-2xl border"
                style={{ borderColor: '#E0F2FE', backgroundColor: '#F0FDFA' }}>
                <View className="flex-row items-center p-4">
                  <View
                    className="mr-3 h-12 w-12 items-center justify-center rounded-lg"
                    style={{ backgroundColor: '#E0F2FE' }}>
                    <Ionicons name="gift-outline" size={22} color="#0284C7" />
                  </View>
                  <View className="flex-1">
                    <Text className="mb-0.5 text-sm font-semibold" style={{ color: '#0F172A' }}>
                      Chương trình ưu đãi tháng 1
                    </Text>
                    <Text className="text-xs" style={{ color: '#475569' }}>
                      3 ngày trước
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#06B6D4" />
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* Footer Section with Gradient Background */}
          <LinearGradient
            colors={['#0284C7', '#10B981']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              marginHorizontal: 24,
              marginBottom: 32,
              borderRadius: 24,
              padding: 24,
              shadowColor: '#0284C7',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.3,
              shadowRadius: 16,
              elevation: 8,
            }}>
            <View className="items-center">
              <View
                className="mb-6 h-32 w-32 items-center justify-center rounded-full shadow-lg"
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}>
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
              <Text className="mb-2 text-center text-xl font-bold text-white">
                Trải nghiệm dịch vụ y tế tốt nhất
              </Text>
              <Text className="mb-4 text-center text-sm text-white/90">
                Chăm sóc sức khỏe toàn diện với công nghệ hiện đại
              </Text>
              <View
                className="mb-4 h-px w-16"
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.3)' }}
              />
              {/* Sepolia Logo */}
              <View className="mb-4 items-center">
                <Image
                  source={require('../../assets/sepolia-icon.png')}
                  style={{
                    width: 140,
                    height: 50,
                    resizeMode: 'contain',
                  }}
                  fadeDuration={200}
                />
              </View>
              <Text className="text-xs text-white/80">© 2025 DUYANH. All rights reserved.</Text>
            </View>
          </LinearGradient>

          <View className="h-20" />
        </ScrollView>
      </LinearGradient>
    </View>
  );
}
