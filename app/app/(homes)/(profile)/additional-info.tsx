import { useUpdatePatientProfile } from '@/lib/api/user';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';

export default function AdditionalInfoScreen() {
  const params = useLocalSearchParams();
  const profile = params.profile ? JSON.parse(params.profile as string) : null;

  const [idCardNumber, setIdCardNumber] = useState(profile?.idCardNumber || '');
  const [occupation, setOccupation] = useState(profile?.occupation || '');
  const [address, setAddress] = useState(profile?.address || '');
  const [nationality, setNationality] = useState(profile?.nationality || '');
  const [ethnicity, setEthnicity] = useState(profile?.additionalInfo?.ethnicity || '');

  const updateProfileMutation = useUpdatePatientProfile();
  const isSubmitting = updateProfileMutation.isPending;

  const handleSave = async () => {
    if (!profile?.id) {
      Alert.alert('Lỗi', 'Không tìm thấy thông tin hồ sơ.');
      return;
    }

    try {
      const additionalInfo = {
        ...profile.additionalInfo,
        ethnicity: ethnicity.trim() || undefined,
      };

      const updateData = {
        idCardNumber: idCardNumber.trim() || undefined,
        occupation: occupation.trim() || undefined,
        address: address.trim() || undefined,
        nationality: nationality.trim() || undefined,
        additionalInfo: additionalInfo,
      };

      await updateProfileMutation.mutateAsync({
        profileId: profile.id,
        data: updateData,
      });

      Alert.alert('Thành công', 'Cập nhật thông tin bổ sung thành công', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      console.error('Update additional info error:', error);
      Alert.alert('Lỗi', 'Không thể cập nhật thông tin. Vui lòng thử lại.');
    }
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
              onPress={() => router.back()}
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
              Thông tin bổ sung
            </Text>
          </View>
        </View>

        {/* Content */}
        <View style={{ paddingHorizontal: 24, marginTop: -80, marginBottom: 24 }}>
          {/* Form Input Fields */}
          <View style={{ marginBottom: 24 }}>
            <View
              style={{
                backgroundColor: '#F0FDFA',
                borderRadius: 12,
                borderWidth: 1,
                borderColor: '#E0F2FE',
                overflow: 'hidden',
              }}>
              {/* Số CMT/Hộ chiếu */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: 16,
                  borderBottomWidth: 1,
                  borderBottomColor: '#E0F2FE',
                }}>
                <Ionicons name="create-outline" size={20} color="#0284C7" />
                <TextInput
                  style={{
                    flex: 1,
                    marginLeft: 12,
                    fontSize: 16,
                    color: '#0F172A',
                  }}
                  placeholder="Số CMT/Hộ chiếu"
                  placeholderTextColor="#475569"
                  value={idCardNumber}
                  onChangeText={setIdCardNumber}
                />
              </View>

              {/* Nghề nghiệp */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: 16,
                  borderBottomWidth: 1,
                  borderBottomColor: '#E0F2FE',
                }}>
                <Ionicons name="briefcase-outline" size={20} color="#0284C7" />
                <TextInput
                  style={{
                    flex: 1,
                    marginLeft: 12,
                    fontSize: 16,
                    color: '#0F172A',
                  }}
                  placeholder="Nghề nghiệp"
                  placeholderTextColor="#475569"
                  value={occupation}
                  onChangeText={setOccupation}
                />
              </View>

              {/* Địa chỉ */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: 16,
                  borderBottomWidth: 1,
                  borderBottomColor: '#E0F2FE',
                }}>
                <Ionicons name="location-outline" size={20} color="#0284C7" />
                <TextInput
                  style={{
                    flex: 1,
                    marginLeft: 12,
                    fontSize: 16,
                    color: '#0F172A',
                  }}
                  placeholder="Địa chỉ"
                  placeholderTextColor="#475569"
                  value={address}
                  onChangeText={setAddress}
                />
              </View>

              {/* Quốc tịch */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: 16,
                  borderBottomWidth: 1,
                  borderBottomColor: '#E0F2FE',
                }}>
                <Ionicons name="globe-outline" size={20} color="#0284C7" />
                <TextInput
                  style={{
                    flex: 1,
                    marginLeft: 12,
                    fontSize: 16,
                    color: '#0F172A',
                  }}
                  placeholder="Quốc tịch"
                  placeholderTextColor="#475569"
                  value={nationality}
                  onChangeText={setNationality}
                />
              </View>

              {/* Dân tộc */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: 16,
                }}>
                <Ionicons name="people-outline" size={20} color="#0284C7" />
                <TextInput
                  style={{
                    flex: 1,
                    marginLeft: 12,
                    fontSize: 16,
                    color: '#0F172A',
                  }}
                  placeholder="Dân tộc"
                  placeholderTextColor="#475569"
                  value={ethnicity}
                  onChangeText={setEthnicity}
                />
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Save Button */}
      <View style={{ paddingHorizontal: 24, paddingBottom: 24 }}>
        <TouchableOpacity
          onPress={handleSave}
          disabled={isSubmitting}
          style={{
            backgroundColor: isSubmitting ? '#94A3B8' : '#0284C7',
            paddingVertical: 16,
            borderRadius: 12,
            alignItems: 'center',
            shadowColor: '#0284C7',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 4,
          }}>
          {isSubmitting ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text
              style={{
                color: 'white',
                fontSize: 16,
                fontWeight: 'bold',
              }}>
              LƯU
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
