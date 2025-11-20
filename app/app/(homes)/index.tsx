'use client';

import { View, Text, TouchableOpacity, ScrollView, StatusBar, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useAuth } from '@/lib/hooks/useAuth';
import { useNotificationContext } from '@/contexts/NotificationContext';
import { useClosestAppointment } from '@/lib/api/appointments';
import Svg, { Path } from 'react-native-svg';
import { formatTime } from '@/utils/datetime';

export default function HomeScreen() {
  const { user } = useAuth();
  const { unreadCount } = useNotificationContext();
  const { data: closestAppointment, isLoading: isLoadingAppointment } = useClosestAppointment();

  // Lấy patientProfiles từ user data
  const patientProfiles = user?.patientProfiles || [];

  // Lấy primary profile (hồ sơ chính)
  const primaryProfile = patientProfiles.find((profile) => profile.relationship === 'SELF');

  // Format date helper for appointment card
  const formatAppointmentDate = (isoDateString: string) => {
    const date = new Date(isoDateString);
    const day = date.getDate();
    const month = date.toLocaleDateString('vi-VN', { month: 'short' });
    return { day, month };
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
          {/* Curved bottom edge using SVG */}
          <Svg
            height="70"
            width="200%"
            viewBox="0 0 1440 120"
            style={{ position: 'absolute', bottom: -1, left: 0, right: 0 }}>
            <Path d="M0,0 Q720,120 1440,0 L1440,120 L0,120 Z" fill="#E0F2FE" />
          </Svg>

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

          {/* Notification button - positioned within gradient */}
          <TouchableOpacity
            onPress={() => router.push('/(homes)/(notification)')}
            style={{
              position: 'absolute',
              top: 120,
              right: 24,
              zIndex: 10,
              height: 48,
              width: 48,
              borderRadius: 24,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#FFFFFF',
              shadowColor: '#000000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 12,
              elevation: 6,
            }}>
            <Ionicons name="notifications-outline" size={24} color="#0284C7" />
            {unreadCount > 0 && (
              <View
                style={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  height: 20,
                  width: unreadCount > 99 ? 28 : 20,
                  borderRadius: 10,
                  backgroundColor: '#10B981',
                  borderWidth: 2,
                  borderColor: '#FFFFFF',
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingHorizontal: unreadCount > 99 ? 4 : 0,
                }}>
                <Text style={{ fontSize: 10, fontWeight: 'bold', color: 'white' }}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Avatar + Info - positioned within gradient */}
          <View
            style={{
              position: 'absolute',
              top: 120,
              left: 24,
              right: 24,
              flexDirection: 'row',
              alignItems: 'center',
              paddingRight: 60,
            }}>
            <View
              style={{
                height: 72,
                width: 72,
                borderRadius: 36,
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
                marginRight: 16,
              }}>
              {primaryProfile?.avatar ? (
                <Image
                  source={{ uri: primaryProfile.avatar }}
                  style={{
                    height: 66,
                    width: 66,
                    borderRadius: 33,
                  }}
                />
              ) : (
                <Text style={{ fontSize: 32, fontWeight: 'bold', color: '#FFFFFF' }}>
                  {primaryProfile
                    ? primaryProfile.firstName.charAt(0).toUpperCase()
                    : user?.firstName?.charAt(0).toUpperCase() || 'A'}
                </Text>
              )}
            </View>

            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 20, fontWeight: '700', color: '#FFFFFF', marginBottom: 6 }}>
                Xin chào,{' '}
                {primaryProfile
                  ? `${primaryProfile.firstName} ${primaryProfile.lastName}`
                  : user
                    ? `${user.firstName} ${user.lastName}`
                    : 'Nguyễn Văn A'}
              </Text>
              <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.9)', lineHeight: 20 }}>
                {primaryProfile?.phone || user?.phone || 'Chưa cập nhật'} •{' '}
                {user?.email || 'Chưa cập nhật'}
              </Text>
            </View>
          </View>
        </View>

        <View style={{ paddingHorizontal: 24, marginTop: -150, marginBottom: 24 }}>
          <LinearGradient
            colors={['#1E3A5F', '#2C5282']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              borderRadius: 24,
              padding: 24,
              shadowColor: '#000000',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.25,
              shadowRadius: 16,
              elevation: 8,
            }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
              <View style={{ flex: 1, paddingRight: 16 }}>
                <Text
                  style={{ fontSize: 22, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 8 }}>
                  Ưu đãi Giáng Sinh
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    color: 'rgba(255,255,255,0.9)',
                    lineHeight: 20,
                    marginBottom: 16,
                  }}>
                  Nhận ngay voucher 10% nhân dịp Giáng Sinh sắp tới
                </Text>
                <TouchableOpacity
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    alignSelf: 'flex-start',
                    borderRadius: 999,
                    paddingHorizontal: 20,
                    paddingVertical: 12,
                    backgroundColor: 'rgba(255,255,255,0.25)',
                    borderWidth: 2,
                    borderColor: 'rgba(255,255,255,0.4)',
                  }}>
                  <Text
                    style={{ fontSize: 14, fontWeight: '600', color: '#FFFFFF', marginRight: 8 }}>
                    Nhận ngay
                  </Text>
                  <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
              <View
                style={{
                  height: 80,
                  width: 80,
                  borderRadius: 40,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'rgba(255,255,255,0.2)',
                }}>
                <Ionicons name="gift-outline" size={40} color="#FFFFFF" />
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Lịch trình Section */}
        <View style={{ paddingHorizontal: 24, marginBottom: 24 }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 16,
            }}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#0F172A' }}>
              Lịch trình sắp tới
            </Text>
            <TouchableOpacity onPress={() => router.push('/(homes)/(appointment)')}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#0284C7' }}>Xem tất cả</Text>
            </TouchableOpacity>
          </View>
          {isLoadingAppointment ? (
            <View
              style={{
                borderRadius: 20,
                padding: 20,
                backgroundColor: '#FFFFFF',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 120,
              }}>
              <Text style={{ fontSize: 14, color: '#475569' }}>Đang tải...</Text>
            </View>
          ) : closestAppointment ? (
            <TouchableOpacity
              onPress={() =>
                router.push(`/(homes)/(appointment)/appointment-detail?id=${closestAppointment.id}`)
              }
              style={{
                borderRadius: 20,
                padding: 20,
                backgroundColor: '#FFFFFF',
              }}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                <View style={{ marginRight: 16, alignItems: 'center' }}>
                  <View
                    style={{
                      height: 56,
                      width: 56,
                      borderRadius: 16,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: '#E0F2FE',
                    }}>
                    <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#0284C7' }}>
                      {formatAppointmentDate(closestAppointment.startTime).day}
                    </Text>
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: '600',
                        color: '#0284C7',
                        marginTop: 2,
                      }}>
                      {formatAppointmentDate(closestAppointment.startTime).month}
                    </Text>
                  </View>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                    <View
                      style={{
                        height: 6,
                        width: 6,
                        borderRadius: 3,
                        backgroundColor: '#10B981',
                        marginRight: 8,
                      }}
                    />
                    <Text style={{ fontSize: 13, fontWeight: '600', color: '#10B981' }}>
                      {formatTime(closestAppointment.startTime)} -{' '}
                      {(() => {
                        const startDate = new Date(closestAppointment.startTime);
                        const endDate = new Date(startDate.getTime() + closestAppointment.service.duration * 60 * 1000);
                        return formatTime(endDate.toISOString());
                      })()}
                    </Text>
                  </View>
                  <Text
                    style={{ fontSize: 18, fontWeight: '600', color: '#0F172A', marginBottom: 12 }}>
                    {closestAppointment.service.name}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                    <Ionicons name="person-outline" size={16} color="#475569" />
                    <Text style={{ fontSize: 14, color: '#475569', marginLeft: 8 }}>
                      Bác sĩ {closestAppointment.doctor.firstName}{' '}
                      {closestAppointment.doctor.lastName}
                    </Text>
                  </View>
                  {closestAppointment.clinic && (
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Ionicons name="location-outline" size={16} color="#475569" />
                      <Text style={{ fontSize: 14, color: '#475569', marginLeft: 8 }}>
                        {closestAppointment.clinic.name}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          ) : (
            <View
              style={{
                borderRadius: 20,
                padding: 32,
                backgroundColor: '#FFFFFF',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 180,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.08,
                shadowRadius: 8,
                elevation: 3,
              }}>
              <View
                style={{
                  height: 80,
                  width: 80,
                  borderRadius: 40,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#E0F2FE',
                  marginBottom: 16,
                  shadowColor: '#0284C7',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.15,
                  shadowRadius: 8,
                  elevation: 4,
                }}>
                <Ionicons name="calendar-outline" size={40} color="#0284C7" />
              </View>
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: '600',
                  color: '#0F172A',
                  marginBottom: 8,
                  textAlign: 'center',
                }}>
                Chưa có lịch khám sắp tới
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: '#64748B',
                  textAlign: 'center',
                  marginBottom: 20,
                  lineHeight: 20,
                  paddingHorizontal: 8,
                }}>
                Hãy đặt lịch khám để chăm sóc sức khỏe của bạn
              </Text>
              <TouchableOpacity
                onPress={() => router.push('/(homes)/(appointment)/create')}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  borderRadius: 12,
                  paddingHorizontal: 20,
                  paddingVertical: 12,
                  backgroundColor: '#0284C7',
                  shadowColor: '#0284C7',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 4,
                }}>
                <Ionicons name="add-circle-outline" size={20} color="#FFFFFF" />
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '600',
                    color: '#FFFFFF',
                    marginLeft: 8,
                  }}>
                  Đặt lịch ngay
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Dịch vụ Section */}
        <View style={{ paddingHorizontal: 24, marginBottom: 24 }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 16,
            }}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#0F172A' }}>Dịch vụ</Text>
          </View>

          <View
            style={{
              borderRadius: 24,
              padding: 20,
              backgroundColor: '#FFFFFF',
            }}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
              <View style={{ width: '22%', alignItems: 'center' }}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={{ alignItems: 'center' }}
                  onPress={() => router.push('/(homes)/(appointment)/create')}>
                  <View
                    style={{
                      height: 56,
                      width: 56,
                      borderRadius: 16,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: '#E0F2FE',
                      marginBottom: 8,
                    }}>
                    <Ionicons name="calendar-outline" size={26} color="#0284C7" />
                  </View>
                  <Text style={{ fontSize: 12, color: '#0F172A', textAlign: 'center' }}>
                    Đặt lịch
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={{ width: '22%', alignItems: 'center' }}>
                <TouchableOpacity activeOpacity={0.7} style={{ alignItems: 'center' }}>
                  <View
                    style={{
                      height: 56,
                      width: 56,
                      borderRadius: 16,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: '#E0F2FE',
                      marginBottom: 8,
                    }}>
                    <Ionicons name="time-outline" size={26} color="#0284C7" />
                  </View>
                  <Text style={{ fontSize: 12, color: '#0F172A', textAlign: 'center' }}>
                    Lịch sử
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={{ width: '22%', alignItems: 'center' }}>
                <TouchableOpacity activeOpacity={0.7} style={{ alignItems: 'center' }}>
                  <View
                    style={{
                      height: 56,
                      width: 56,
                      borderRadius: 16,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: '#E0F2FE',
                      marginBottom: 8,
                    }}>
                    <Ionicons name="document-text-outline" size={26} color="#0284C7" />
                  </View>
                  <Text style={{ fontSize: 12, color: '#0F172A', textAlign: 'center' }}>
                    Đơn thuốc
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={{ width: '22%', alignItems: 'center' }}>
                <TouchableOpacity activeOpacity={0.7} style={{ alignItems: 'center' }}>
                  <View
                    style={{
                      height: 56,
                      width: 56,
                      borderRadius: 16,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: '#A7F3D0',
                      marginBottom: 8,
                    }}>
                    <Ionicons name="card-outline" size={26} color="#10B981" />
                  </View>
                  <Text style={{ fontSize: 12, color: '#0F172A', textAlign: 'center' }}>
                    Thanh toán
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={{ width: '22%', alignItems: 'center' }}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={{ alignItems: 'center' }}
                  onPress={() => router.push('/(homes)/(chat)/channels')}>
                  <View
                    style={{
                      height: 56,
                      width: 56,
                      borderRadius: 16,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: '#E0F2FE',
                      marginBottom: 8,
                    }}>
                    <Ionicons name="chatbubbles-outline" size={26} color="#0284C7" />
                  </View>
                  <Text style={{ fontSize: 12, color: '#0F172A', textAlign: 'center' }}>
                    Tin nhắn
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={{ width: '22%', alignItems: 'center' }}>
                <TouchableOpacity activeOpacity={0.7} style={{ alignItems: 'center' }}>
                  <View
                    style={{
                      height: 56,
                      width: 56,
                      borderRadius: 16,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: '#E0F2FE',
                      marginBottom: 8,
                    }}>
                    <Ionicons name="flask-outline" size={26} color="#0284C7" />
                  </View>
                  <Text style={{ fontSize: 12, color: '#0F172A', textAlign: 'center' }}>
                    Xét nghiệm
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={{ width: '22%', alignItems: 'center' }}>
                <TouchableOpacity activeOpacity={0.7} style={{ alignItems: 'center' }}>
                  <View
                    style={{
                      height: 56,
                      width: 56,
                      borderRadius: 16,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: '#A7F3D0',
                      marginBottom: 8,
                    }}>
                    <Ionicons name="heart-outline" size={26} color="#10B981" />
                  </View>
                  <Text style={{ fontSize: 12, color: '#0F172A', textAlign: 'center' }}>
                    Sức khỏe
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={{ width: '22%', alignItems: 'center' }}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={{ alignItems: 'center' }}
                  onPress={() => router.push('/(homes)/(qna)')}>
                  <View
                    style={{
                      height: 56,
                      width: 56,
                      borderRadius: 16,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: '#E0F2FE',
                      marginBottom: 8,
                    }}>
                    <Ionicons name="people-outline" size={26} color="#0284C7" />
                  </View>
                  <Text style={{ fontSize: 12, color: '#0F172A', textAlign: 'center' }}>
                    Cộng đồng
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {/* Mẹo sức khỏe Section */}
        <View style={{ paddingHorizontal: 24, marginBottom: 24 }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 16,
            }}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#0F172A' }}>Mẹo sức khỏe</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginHorizontal: -24, paddingHorizontal: 24 }}>
            <View
              style={{
                marginRight: 16,
                width: 260,
                borderRadius: 20,
                padding: 20,
                backgroundColor: '#FFFFFF',
              }}>
              <View
                style={{
                  height: 48,
                  width: 48,
                  borderRadius: 24,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#E0F2FE',
                  marginBottom: 12,
                }}>
                <Ionicons name="water-outline" size={24} color="#0284C7" />
              </View>
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#0F172A', marginBottom: 8 }}>
                Uống đủ nước
              </Text>
              <Text style={{ fontSize: 14, color: '#475569', lineHeight: 20 }}>
                Uống ít nhất 2 lít nước mỗi ngày để duy trì sức khỏe tốt
              </Text>
            </View>

            <View
              style={{
                marginRight: 16,
                width: 260,
                borderRadius: 20,
                padding: 20,
                backgroundColor: '#FFFFFF',
              }}>
              <View
                style={{
                  height: 48,
                  width: 48,
                  borderRadius: 24,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#A7F3D0',
                  marginBottom: 12,
                }}>
                <Ionicons name="sunny-outline" size={24} color="#10B981" />
              </View>
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#0F172A', marginBottom: 8 }}>
                Tắm nắng sáng
              </Text>
              <Text style={{ fontSize: 14, color: '#475569', lineHeight: 20 }}>
                15-20 phút tắm nắng buổi sáng giúp cơ thể tổng hợp vitamin D
              </Text>
            </View>

            <View
              style={{
                marginRight: 16,
                width: 260,
                borderRadius: 20,
                padding: 20,
                backgroundColor: '#FFFFFF',
              }}>
              <View
                style={{
                  height: 48,
                  width: 48,
                  borderRadius: 24,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#E0F2FE',
                  marginBottom: 12,
                }}>
                <Ionicons name="bed-outline" size={24} color="#0284C7" />
              </View>
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#0F172A', marginBottom: 8 }}>
                Ngủ đủ giấc
              </Text>
              <Text style={{ fontSize: 14, color: '#475569', lineHeight: 20 }}>
                7-8 tiếng ngủ mỗi đêm giúp cơ thể phục hồi và tái tạo năng lượng
              </Text>
            </View>
          </ScrollView>
        </View>

        {/* Tin tức & Sự kiện Section */}
        <View style={{ paddingHorizontal: 24, marginBottom: 24 }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 16,
            }}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#0F172A' }}>
              Tin tức & Sự kiện
            </Text>
            <TouchableOpacity>
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#0284C7' }}>Xem tất cả</Text>
            </TouchableOpacity>
          </View>

          <View style={{ gap: 12 }}>
            <TouchableOpacity
              style={{
                borderRadius: 20,
                backgroundColor: '#FFFFFF',
              }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }}>
                <View
                  style={{
                    height: 48,
                    width: 48,
                    borderRadius: 14,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#E0F2FE',
                    marginRight: 16,
                  }}>
                  <Ionicons name="newspaper-outline" size={24} color="#0284C7" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{ fontSize: 14, fontWeight: '600', color: '#0F172A', marginBottom: 4 }}>
                    Cập nhật quy trình khám bệnh mới
                  </Text>
                  <Text style={{ fontSize: 12, color: '#475569' }}>2 giờ trước</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#0284C7" />
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                borderRadius: 20,
                backgroundColor: '#FFFFFF',
              }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }}>
                <View
                  style={{
                    height: 48,
                    width: 48,
                    borderRadius: 14,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#A7F3D0',
                    marginRight: 16,
                  }}>
                  <Ionicons name="shield-checkmark-outline" size={24} color="#10B981" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{ fontSize: 14, fontWeight: '600', color: '#0F172A', marginBottom: 4 }}>
                    Hướng dẫn phòng chống COVID-19
                  </Text>
                  <Text style={{ fontSize: 12, color: '#475569' }}>1 ngày trước</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#0284C7" />
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                borderRadius: 20,
                backgroundColor: '#FFFFFF',
              }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }}>
                <View
                  style={{
                    height: 48,
                    width: 48,
                    borderRadius: 14,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#E0F2FE',
                    marginRight: 16,
                  }}>
                  <Ionicons name="gift-outline" size={24} color="#0284C7" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{ fontSize: 14, fontWeight: '600', color: '#0F172A', marginBottom: 4 }}>
                    Chương trình ưu đãi tháng 1
                  </Text>
                  <Text style={{ fontSize: 12, color: '#475569' }}>3 ngày trước</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#0284C7" />
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
            padding: 32,
            shadowColor: '#000000',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.25,
            shadowRadius: 20,
            elevation: 8,
          }}>
          <View style={{ alignItems: 'center' }}>
            <View
              style={{
                height: 140,
                width: 140,
                borderRadius: 70,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                marginBottom: 24,
                shadowColor: '#000000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 12,
              }}>
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
            <Text
              style={{
                fontSize: 22,
                fontWeight: 'bold',
                color: '#FFFFFF',
                textAlign: 'center',
                marginBottom: 8,
              }}>
              Trải nghiệm dịch vụ y tế tốt nhất
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: 'rgba(255,255,255,0.9)',
                textAlign: 'center',
                marginBottom: 20,
              }}>
              Chăm sóc sức khỏe toàn diện với công nghệ hiện đại
            </Text>
            <View
              style={{
                height: 1,
                width: 64,
                backgroundColor: 'rgba(255, 255, 255, 0.3)',
                marginBottom: 20,
              }}
            />
            {/* Sepolia Logo */}
            <View style={{ alignItems: 'center', marginBottom: 16 }}>
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
            <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)' }}>
              © 2025 DUYANH. All rights reserved.
            </Text>
          </View>
        </LinearGradient>
      </ScrollView>
    </View>
  );
}
