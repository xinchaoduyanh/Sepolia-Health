import { useAuth } from '@/lib/hooks/useAuth';
import { PatientProfile } from '@/types/auth';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

export default function PersonalInfoScreen() {
  const { user } = useAuth();
  const params = useLocalSearchParams();

  // Parse profile data from params, fallback to user data
  const profileData: PatientProfile = params.profile
    ? JSON.parse(params.profile as string)
    : user?.patientProfiles?.find((p) => p.relationship === 'SELF') || (user as any);

  // Helper function to calculate age from date of birth
  const calculateAge = (dateOfBirth: string): number => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  };

  // Helper function to format date of birth
  const formatDateOfBirth = (dateOfBirth: string): string => {
    const date = new Date(dateOfBirth);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#E0F2FE' }}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <ScrollView
        showsVerticalScrollIndicator={false}
        bounces={false}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Background Gradient */}
        <View style={{ height: 280, position: 'relative', marginTop: -60 }}>
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
              top: -40,
              right: -40,
              height: 120,
              width: 120,
              borderRadius: 60,
              backgroundColor: 'rgba(255,255,255,0.12)',
            }}
          />
          <View
            style={{
              position: 'absolute',
              top: 80,
              left: -30,
              height: 100,
              width: 100,
              borderRadius: 50,
              backgroundColor: 'rgba(255,255,255,0.08)',
            }}
          />

          {/* Header positioned within gradient */}
          <View
            style={{
              position: 'absolute',
              top: 100,
              left: 24,
              right: 24,
              flexDirection: 'row',
              alignItems: 'center',
            }}>
            <TouchableOpacity
              onPress={() => router.push('/(profile)/' as any)}
              style={{
                height: 40,
                width: 40,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 20,
                backgroundColor: 'rgba(255,255,255,0.25)',
                marginRight: 12,
              }}>
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#FFFFFF', flex: 1 }}>
              Thông tin cá nhân
            </Text>
          </View>
        </View>

        {/* Content */}
        <View style={{ paddingHorizontal: 24, marginTop: -80, marginBottom: 24 }}>
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
                    color: '#0F172A',
                  }}>
                  Thông tin cơ bản
                </Text>
              </View>
              <TouchableOpacity
                onPress={() =>
                  router.push({
                    pathname: '/edit-profile',
                    params: { profile: JSON.stringify(profileData) },
                  })
                }>
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
                  {profileData ? `${profileData.lastName} ${profileData.firstName}` : 'Vũ Duy anh'}
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
                  {profileData?.dateOfBirth
                    ? `${formatDateOfBirth(profileData.dateOfBirth)} (${calculateAge(profileData.dateOfBirth)} tuổi)`
                    : 'Chưa cập nhật'}
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
                  {profileData?.phone || 'Chưa cập nhật'}
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
                  {profileData?.gender === 'MALE'
                    ? 'Nam'
                    : profileData?.gender === 'FEMALE'
                      ? 'Nữ'
                      : profileData?.gender === 'OTHER'
                        ? 'Khác'
                        : 'Chưa cập nhật'}
                </Text>
              </View>
            </View>

            {/*<View style={{ marginTop: 16 }}>
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
          Thông tin bổ sung
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
                    color: '#0F172A',
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
          </View> */}
            {/* Thông tin bảo hiểm */}
            {/* <View style={{ marginBottom: 24 }}>
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
                    color: '#0F172A',
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
          </View> */}
            {/* Thông tin công ty */}
            {/* <View style={{ marginBottom: 24 }}>
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
                    color: '#0F172A',
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
            </View>*/}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
