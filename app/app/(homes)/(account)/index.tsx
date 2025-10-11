'use client';

import { View, Text, TouchableOpacity, Alert, ScrollView, StatusBar, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/lib/hooks/useAuth';
import { Svg, Defs, Stop, Path, LinearGradient as SvgLinearGradient } from 'react-native-svg';
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
    <View style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {/* Header gradient với hiệu ứng sóng */}
        <View style={{ flex: 1 }}>
          {/* Header Gradient */}
          <LinearGradient
            colors={['#00BFA6', '#0288D1']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 180,
              borderBottomLeftRadius: 24,
              borderBottomRightRadius: 24,
            }}
          />

          {/* Scrollable content */}
          <ScrollView
            contentContainerStyle={{ paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}>
            {/* Greeting & Avatar Section */}
            <View style={{ paddingHorizontal: 20, marginTop: 60 }}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}>
                {/* Left text */}
                <View>
                  <Text style={{ fontSize: 18, color: '#fff', opacity: 0.9 }}>Xin chào,</Text>
                  <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#fff' }}>
                    {user ? `${user.firstName} ${user.lastName}` : 'Người dùng'} 👋
                  </Text>
                </View>

                {/* Avatar Wrapper */}
                <View style={{ position: 'relative', width: 70, height: 70 }}>
                  {/* SVG background (ví dụ blob hoặc wave) */}
                  <Svg
                    width="100%"
                    height="100%"
                    viewBox="0 0 120 120"
                    style={{ position: 'absolute', top: 0, left: 0 }}>
                    <Defs>
                      <SvgLinearGradient id="avatarBg" x1="0" y1="0" x2="1" y2="1">
                        <Stop offset="0%" stopColor="#A7FFEB" />
                        <Stop offset="100%" stopColor="#64B5F6" />
                      </SvgLinearGradient>
                    </Defs>
                    <Path
                      d="M60 0 C90 0, 120 30, 120 60 C120 90, 90 120, 60 120 C30 120, 0 90, 0 60 C0 30, 30 0, 60 0 Z"
                      fill="url(#avatarBg)"
                    />
                  </Svg>

                  {/* Avatar image */}
                  <Image
                    source={{ uri: 'https://i.pravatar.cc/300' }}
                    style={{
                      width: 60,
                      height: 60,
                      borderRadius: 30,
                      borderWidth: 2,
                      borderColor: '#fff',
                      position: 'absolute',
                      top: 5,
                      left: 5,
                    }}
                  />
                </View>
              </View>
            </View>

            {/* Content Section */}
            <View style={{ paddingHorizontal: 20, marginTop: 30 }}>
              {/* Ví dụ: Mẹo sức khỏe */}
              <View style={{ gap: 16 }}></View>
            </View>
          </ScrollView>
        </View>

        <View style={{ padding: 24 }}>
          {/* Quản lý yêu cầu và ưu đãi */}
          <View style={{ marginBottom: 24 }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#0F172A', marginBottom: 16 }}>
              Quản lý yêu cầu và ưu đãi
            </Text>
            <View
              style={{
                backgroundColor: '#F0FDFA',
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
                backgroundColor: '#F0FDFA',
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
                backgroundColor: '#F0FDFA',
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
