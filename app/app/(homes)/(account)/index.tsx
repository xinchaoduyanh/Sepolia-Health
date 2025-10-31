'use client';

import { View, Text, TouchableOpacity, Alert, ScrollView, StatusBar, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
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
                  ? `${primaryProfile.firstName} ${primaryProfile.lastName}`
                  : user
                    ? `${user.firstName} ${user.lastName}`
                    : 'Người dùng'}
              </Text>
              <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.9)', lineHeight: 20 }}>
                {primaryProfile?.phone || user?.phone || 'Chưa cập nhật'} •{' '}
                {user?.email || 'Chưa cập nhật'}
              </Text>
            </View>
          </View>
        </View>

        {/* Main Content Area */}
        <View style={{ paddingHorizontal: 24, marginTop: -150, marginBottom: 24 }}>
          {/* Quản lý yêu cầu và ưu đãi */}
          <View style={{ marginBottom: 24 }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#0F172A', marginBottom: 16 }}>
              Quản lý yêu cầu và ưu đãi
            </Text>
            <View
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 16,
                overflow: 'hidden',
                shadowColor: '#0284C7',
                shadowOpacity: 0.1,
                shadowRadius: 8,
                elevation: 3,
              }}>
              <TouchableOpacity
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: 16,
                  borderBottomWidth: 1,
                  borderBottomColor: '#E0F2FE',
                }}>
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 8,
                    backgroundColor: '#E0F2FE',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 16,
                  }}>
                  <Ionicons name="cube-outline" size={20} color="#0284C7" />
                </View>
                <Text style={{ flex: 1, fontSize: 16, fontWeight: '500', color: '#0F172A' }}>
                  Yêu cầu giao thuốc
                </Text>
                <Ionicons name="chevron-forward" size={18} color="#06B6D4" />
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: 16,
                  borderBottomWidth: 1,
                  borderBottomColor: '#E0F2FE',
                }}>
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 8,
                    backgroundColor: '#A7F3D0',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 16,
                  }}>
                  <Ionicons name="chatbubbles-outline" size={20} color="#10B981" />
                </View>
                <Text style={{ flex: 1, fontSize: 16, fontWeight: '500', color: '#0F172A' }}>
                  Yêu cầu hỗ trợ CSKH
                </Text>
                <Ionicons name="chevron-forward" size={18} color="#06B6D4" />
              </TouchableOpacity>

              <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }}>
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 8,
                    backgroundColor: '#E0F2FE',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 16,
                  }}>
                  <Ionicons name="ticket-outline" size={20} color="#0284C7" />
                </View>
                <Text style={{ flex: 1, fontSize: 16, fontWeight: '500', color: '#0F172A' }}>
                  Ưu đãi của tôi
                </Text>
                <Ionicons name="chevron-forward" size={18} color="#06B6D4" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Cài đặt */}
          <View style={{ marginBottom: 24 }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#0F172A', marginBottom: 16 }}>
              Cài đặt
            </Text>
            <View
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 16,
                overflow: 'hidden',
                shadowColor: '#0284C7',
                shadowOpacity: 0.1,
                shadowRadius: 8,
                elevation: 3,
              }}>
              <TouchableOpacity
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: 16,
                  borderBottomWidth: 1,
                  borderBottomColor: '#E0F2FE',
                }}>
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 8,
                    backgroundColor: '#A7F3D0',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 16,
                  }}>
                  <Ionicons name="lock-closed-outline" size={20} color="#10B981" />
                </View>
                <Text style={{ flex: 1, fontSize: 16, fontWeight: '500', color: '#0F172A' }}>
                  Đổi mật khẩu
                </Text>
                <Ionicons name="chevron-forward" size={18} color="#06B6D4" />
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: 16,
                  borderBottomWidth: 1,
                  borderBottomColor: '#E0F2FE',
                }}>
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 8,
                    backgroundColor: '#E0F2FE',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 16,
                  }}>
                  <Ionicons name="globe-outline" size={20} color="#0284C7" />
                </View>
                <Text style={{ flex: 1, fontSize: 16, fontWeight: '500', color: '#0F172A' }}>
                  Ngôn ngữ
                </Text>
                <Text style={{ fontSize: 14, color: '#475569', marginRight: 8 }}>Tiếng Việt</Text>
                <Ionicons name="chevron-forward" size={18} color="#06B6D4" />
              </TouchableOpacity>

              <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }}>
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 8,
                    backgroundColor: '#E0F2FE',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 16,
                  }}>
                  <Ionicons name="shield-outline" size={20} color="#0284C7" />
                </View>
                <Text style={{ flex: 1, fontSize: 16, fontWeight: '500', color: '#0F172A' }}>
                  Bảo mật
                </Text>
                <Text style={{ fontSize: 14, color: '#475569', marginRight: 8 }}>
                  Chưa thiết lập
                </Text>
                <Ionicons name="chevron-forward" size={18} color="#06B6D4" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Điều khoản & quy định */}
          <View style={{ marginBottom: 24 }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#0F172A', marginBottom: 16 }}>
              Điều khoản & quy định
            </Text>
            <View
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 16,
                overflow: 'hidden',
                shadowColor: '#0284C7',
                shadowOpacity: 0.1,
                shadowRadius: 8,
                elevation: 3,
              }}>
              <TouchableOpacity
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: 16,
                  borderBottomWidth: 1,
                  borderBottomColor: '#E0F2FE',
                }}>
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 8,
                    backgroundColor: '#E0F2FE',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 16,
                  }}>
                  <Ionicons name="document-text-outline" size={20} color="#0284C7" />
                </View>
                <Text style={{ flex: 1, fontSize: 16, fontWeight: '500', color: '#0F172A' }}>
                  Quy định sử dụng
                </Text>
                <Ionicons name="chevron-forward" size={18} color="#06B6D4" />
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: 16,
                  borderBottomWidth: 1,
                  borderBottomColor: '#E0F2FE',
                }}>
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 8,
                    backgroundColor: '#A7F3D0',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 16,
                  }}>
                  <Ionicons name="warning-outline" size={20} color="#10B981" />
                </View>
                <Text style={{ flex: 1, fontSize: 16, fontWeight: '500', color: '#0F172A' }}>
                  Chính sách giải quyết khiếu nại, tranh chấp
                </Text>
                <Ionicons name="chevron-forward" size={18} color="#06B6D4" />
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: 16,
                  borderBottomWidth: 1,
                  borderBottomColor: '#E0F2FE',
                }}>
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 8,
                    backgroundColor: '#E0F2FE',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 16,
                  }}>
                  <Ionicons name="shield-checkmark-outline" size={20} color="#0284C7" />
                </View>
                <Text style={{ flex: 1, fontSize: 16, fontWeight: '500', color: '#0F172A' }}>
                  Chính sách bảo vệ dữ liệu cá nhân của Sepolia
                </Text>
                <Ionicons name="chevron-forward" size={18} color="#06B6D4" />
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: 16,
                  borderBottomWidth: 1,
                  borderBottomColor: '#E0F2FE',
                }}>
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 8,
                    backgroundColor: '#E0F2FE',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 16,
                  }}>
                  <Ionicons name="help-circle-outline" size={20} color="#0284C7" />
                </View>
                <Text style={{ flex: 1, fontSize: 16, fontWeight: '500', color: '#0F172A' }}>
                  Hỏi đáp về ứng dụng
                </Text>
                <Ionicons name="chevron-forward" size={18} color="#06B6D4" />
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: 16,
                  borderBottomWidth: 1,
                  borderBottomColor: '#E0F2FE',
                }}>
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 8,
                    backgroundColor: '#A7F3D0',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 16,
                  }}>
                  <Ionicons name="share-outline" size={20} color="#10B981" />
                </View>
                <Text style={{ flex: 1, fontSize: 16, fontWeight: '500', color: '#0F172A' }}>
                  Chia sẻ ứng dụng
                </Text>
                <Ionicons name="chevron-forward" size={18} color="#06B6D4" />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleLogout}
                style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }}>
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 8,
                    backgroundColor: '#FEE2E2',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 16,
                  }}>
                  <Ionicons name="log-out-outline" size={20} color="#EF4444" />
                </View>
                <Text style={{ flex: 1, fontSize: 16, fontWeight: '500', color: '#0F172A' }}>
                  Đăng xuất{' '}
                </Text>
                <Ionicons name="chevron-forward" size={18} color="#06B6D4" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Thông tin công ty */}
          <View style={{ alignItems: 'center', paddingVertical: 20 }}>
            <Text
              style={{
                fontSize: 12,
                color: '#475569',
                textAlign: 'center',
                lineHeight: 18,
                marginBottom: 8,
              }}>
              CÔNG TY CỔ PHẦN Y TẾ SEPOLIA HEALTH{'\n'}
              Lai Xá, Kim Chung, Hoài Đức, Hà Nội, Việt Nam{'\n'}
              Điện thoại: 0243.975.0028{'\n'}
              Email: info@sepoliahealth.com
            </Text>

            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: '#E0F2FE',
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 8,
                marginBottom: 8,
              }}>
              <View
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: 8,
                  backgroundColor: '#0284C7',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 8,
                }}>
                <Ionicons name="checkmark" size={10} color="white" />
              </View>
              <Text style={{ fontSize: 10, color: '#0284C7', fontWeight: '500' }}>
                ĐÃ THÔNG BÁO BỘ CÔNG THƯƠNG
              </Text>
            </View>

            <Text style={{ fontSize: 12, color: '#475569' }}>Sepolia Health v1.0.0</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
