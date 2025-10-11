'use client';

import { View, Text, TouchableOpacity, ScrollView, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/lib/hooks/useAuth';
import { useRouter } from 'expo-router';

export default function PersonalInfoScreen() {
  const { user } = useAuth();
  const router = useRouter();

  return (
    <View style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
      <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />

      {/* Header */}
      <View
        style={{
          backgroundColor: '#F0FDFA',
          paddingTop: 60,
          paddingBottom: 20,
          paddingHorizontal: 24,
          borderBottomWidth: 1,
          borderBottomColor: '#E0F2FE',
        }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={() => router.push('/(profile)/' as any)}>
            <Ionicons name="arrow-back" size={24} color="#0F172A" />
          </TouchableOpacity>
          <Text
            style={{
              fontSize: 18,
              fontWeight: 'bold',
              color: '#0F172A',
              marginLeft: 16,
              flex: 1,
            }}>
            Thông tin cá nhân
          </Text>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <View style={{ padding: 24 }}>
          {/* Thông tin cơ bản */}
          <View style={{ marginBottom: 24 }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 16,
              }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: '#E0F2FE',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 12,
                  }}>
                  <Ionicons name="person-outline" size={18} color="#0284C7" />
                </View>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: 'bold',
                    color: '#10B981',
                  }}>
                  Thông tin cơ bản
                </Text>
              </View>
              <TouchableOpacity>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '500',
                    color: '#0284C7',
                  }}>
                  Chỉnh sửa
                </Text>
              </TouchableOpacity>
            </View>

            <View
              style={{
                backgroundColor: '#F0FDFA',
                borderRadius: 12,
                padding: 16,
                borderWidth: 1,
                borderColor: '#E0F2FE',
              }}>
              <View style={{ marginBottom: 12 }}>
                <Text
                  style={{
                    fontSize: 12,
                    color: '#475569',
                    marginBottom: 4,
                  }}>
                  Họ tên đầy đủ
                </Text>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: 'bold',
                    color: '#0F172A',
                  }}>
                  {user ? `${user.firstName} ${user.lastName}` : 'Vũ Duy anh'}
                </Text>
              </View>

              <View style={{ marginBottom: 12 }}>
                <Text
                  style={{
                    fontSize: 12,
                    color: '#475569',
                    marginBottom: 4,
                  }}>
                  Ngày sinh
                </Text>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: 'bold',
                    color: '#0F172A',
                  }}>
                  Chưa cập nhật
                </Text>
              </View>

              <View style={{ marginBottom: 12 }}>
                <Text
                  style={{
                    fontSize: 12,
                    color: '#475569',
                    marginBottom: 4,
                  }}>
                  Số điện thoại
                </Text>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: 'bold',
                    color: '#0F172A',
                  }}>
                  {user?.phone || 'Chưa cập nhật'}
                </Text>
              </View>

              <View style={{ marginBottom: 12 }}>
                <Text
                  style={{
                    fontSize: 12,
                    color: '#475569',
                    marginBottom: 4,
                  }}>
                  Email
                </Text>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: 'bold',
                    color: '#0F172A',
                  }}>
                  {user?.email || 'Chưa cập nhật'}
                </Text>
              </View>

              <View>
                <Text
                  style={{
                    fontSize: 12,
                    color: '#475569',
                    marginBottom: 4,
                  }}>
                  Giới tính
                </Text>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: 'bold',
                    color: '#0F172A',
                  }}>
                  Nam
                </Text>
              </View>
            </View>

            <View style={{ marginTop: 16 }}>
              <Text
                style={{
                  fontSize: 12,
                  color: '#475569',
                  lineHeight: 18,
                  marginBottom: 8,
                }}>
                Hồ sơ bệnh án Vinmec của bạn đã được kết nối thành công. Để cập nhật thông tin, vui
                lòng liên hệ hotline{' '}
                <Text style={{ color: '#0284C7', fontWeight: '500' }}>1900 1234</Text> hoặc truy cập
                website Vinmec.
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  color: '#475569',
                  lineHeight: 18,
                }}>
                Bạn có thể thêm hồ sơ người thân để quản lý thông tin sức khỏe của cả gia đình.
              </Text>
            </View>
          </View>

          {/* Thông tin bổ sung */}
          <View style={{ marginBottom: 24 }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 16,
              }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: '#FEE2E2',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 12,
                  }}>
                  <Ionicons name="star" size={18} color="#EF4444" />
                </View>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: 'bold',
                    color: '#10B981',
                  }}>
                  Thông tin bổ sung
                </Text>
              </View>
              <TouchableOpacity>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '500',
                    color: '#0284C7',
                  }}>
                  Thêm
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Thông tin bảo hiểm */}
          <View style={{ marginBottom: 24 }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 16,
              }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: '#A7F3D0',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 12,
                  }}>
                  <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                </View>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: 'bold',
                    color: '#10B981',
                  }}>
                  Thông tin bảo hiểm
                </Text>
              </View>
              <TouchableOpacity>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '500',
                    color: '#0284C7',
                  }}>
                  Thêm
                </Text>
              </TouchableOpacity>
            </View>

            <View
              style={{
                backgroundColor: '#F0FDFA',
                borderRadius: 12,
                padding: 16,
                borderWidth: 1,
                borderColor: '#E0F2FE',
              }}>
              <View style={{ marginBottom: 12 }}>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '500',
                    color: '#0F172A',
                    marginBottom: 8,
                  }}>
                  Bảo hiểm y tế
                </Text>
              </View>
              <View>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '500',
                    color: '#0F172A',
                    marginBottom: 8,
                  }}>
                  Bảo hiểm tư nhân
                </Text>
              </View>
            </View>
          </View>

          {/* Thông tin công ty */}
          <View style={{ marginBottom: 24 }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 16,
              }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: '#E0F2FE',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 12,
                  }}>
                  <Ionicons name="business" size={18} color="#0284C7" />
                </View>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: 'bold',
                    color: '#10B981',
                  }}>
                  Thông tin công ty
                </Text>
              </View>
              <TouchableOpacity>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '500',
                    color: '#0284C7',
                  }}>
                  Thêm
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
