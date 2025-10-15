'use client';

import { View, Text, TouchableOpacity, ScrollView, StatusBar, Image, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/lib/hooks/useAuth';
import { router } from 'expo-router';
import { PatientProfile, Relationship } from '@/types/auth';
import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { userApi } from '@/lib/api';

// Helper function để chuyển đổi relationship enum sang text tiếng Việt
const getRelationshipText = (relationship: Relationship): string => {
  const relationshipMap: Record<Relationship, string> = {
    SELF: 'Bản thân',
    SPOUSE: 'Vợ/Chồng',
    CHILD: 'Con',
    PARENT: 'Bố/Mẹ',
    SIBLING: 'Anh/Chị/Em',
    RELATIVE: 'Họ hàng',
    FRIEND: 'Bạn bè',
    OTHER: 'Khác',
  };
  return relationshipMap[relationship] || 'Khác';
};

// ================== Main Screen Component ==================

const ProfileScreen = () => {
  const { user, refreshProfile } = useAuth();
  const [isUploading, setIsUploading] = useState(false);

  // Lấy patientProfiles từ user data
  const patientProfiles = user?.patientProfiles || [];

  // Lấy primary profile (hồ sơ chính)
  const primaryProfile = patientProfiles.find((profile: PatientProfile) => profile.isPrimary);

  // Lấy các profile khác (không phải primary)
  const otherProfiles = patientProfiles.filter((profile: PatientProfile) => !profile.isPrimary);

  // Function để chọn và upload avatar
  const handleUploadAvatar = async (profileId?: number) => {
    try {
      // Request permission
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permissionResult.granted === false) {
        Alert.alert('Cần quyền truy cập', 'Cần quyền truy cập thư viện ảnh để upload avatar');
        return;
      }

      // Pick image
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setIsUploading(true);

        // Create FormData
        const formData = new FormData();
        formData.append('avatar', {
          uri: result.assets[0].uri,
          type: 'image/jpeg',
          name: 'avatar.jpg',
        } as any);

        // Upload avatar
        if (profileId) {
          // Upload for specific patient profile
          await userApi.uploadPatientProfileAvatar(profileId, formData);
        } else {
          // Upload for primary profile - find primary profile ID
          const primaryProfileId = primaryProfile?.id;
          if (primaryProfileId) {
            await userApi.uploadPatientProfileAvatar(primaryProfileId, formData);
          } else {
            // Fallback to user avatar upload if no primary profile found
            await userApi.uploadUserAvatar(formData);
          }
        }

        // Refresh user data to get updated profiles
        refreshProfile();

        Alert.alert('Thành công', 'Avatar đã được cập nhật');
      }
    } catch (error) {
      console.error('Upload avatar error:', error);
      Alert.alert('Lỗi', 'Không thể upload avatar. Vui lòng thử lại.');
    } finally {
      setIsUploading(false);
    }
  };

  // TODO: Thêm API call để lấy danh sách PatientProfile
  // useEffect(() => {
  //   fetchPatientProfiles();
  // }, []);

  return (
    <View className="flex-1" style={{ backgroundColor: '#E0F2FE' }}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* ScrollView chứa toàn bộ nội dung */}
      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        {/* Background Image Section */}
        <View className="relative h-60">
          <Image
            source={require('../../../assets/1.png')}
            className="h-full w-full"
            resizeMode="cover"
          />
          {/* Overlay để làm tối background một chút */}
          <View className="absolute inset-0 bg-black/20" />
        </View>

        {/* Avatar & Tên được kéo lên trên với 3 layers */}
        <View className="z-20 -mt-20 items-center px-6">
          <View className="relative items-center">
            {/* Layer 2: Hình tròn xanh nhạt dày bao quanh avatar */}
            <View
              className="h-32 w-32 items-center justify-center rounded-full"
              style={{ backgroundColor: '#E0F2FE' }}>
              {/* Layer 3: Avatar bên trong */}
              <View className="h-28 w-28 rounded-full bg-white p-1">
                {primaryProfile?.avatar ? (
                  <Image
                    source={{ uri: primaryProfile.avatar }}
                    className="h-full w-full rounded-full"
                  />
                ) : (
                  <View className="h-full w-full items-center justify-center rounded-full bg-slate-100">
                    <Text className="text-3xl font-bold text-slate-600">
                      {primaryProfile ? primaryProfile.firstName.charAt(0).toUpperCase() : 'U'}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Camera button ở layer 3 */}
            <TouchableOpacity
              className="absolute bottom-1 right-1 h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-slate-100"
              onPress={() => handleUploadAvatar(primaryProfile?.id)}
              disabled={isUploading}>
              {isUploading ? (
                <Ionicons name="hourglass-outline" size={20} color="#334155" />
              ) : (
                <Ionicons name="camera-outline" size={20} color="#334155" />
              )}
            </TouchableOpacity>
          </View>

          <Text className="mt-3 text-2xl font-bold" style={{ color: '#1E40AF' }}>
            {primaryProfile
              ? `${primaryProfile.firstName} ${primaryProfile.lastName}`
              : user
                ? `${user.firstName} ${user.lastName}`
                : 'Vũ Duy Anh'}
          </Text>
        </View>

        {/* Main Content Area */}
        <View className="z-10 mt-6 px-6 pb-8">
          {/* Thông tin chung Section */}
          <View className="mb-6">
            <Text className="mb-4 text-lg font-bold text-slate-900">Thông tin chung </Text>
            <View className="overflow-hidden rounded-xl bg-teal-50">
              <TouchableOpacity
                className="flex-row items-center border-b border-cyan-100 p-4"
                onPress={() => {
                  if (primaryProfile) {
                    router.push({
                      pathname: '/(homes)/(profile)/personal-info',
                      params: { profile: JSON.stringify(primaryProfile) },
                    });
                  } else {
                    router.push('/(homes)/(profile)/personal-info' as any);
                  }
                }}>
                <View className="mr-4 h-10 w-10 items-center justify-center rounded-full bg-cyan-100">
                  <Ionicons name="person-outline" size={20} color="#0284C7" />
                </View>
                <Text className="flex-1 text-base font-medium text-slate-900">
                  Thông tin cá nhân
                </Text>
                <Ionicons name="chevron-forward" size={20} color="#06B6D4" />
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-row items-center border-b border-cyan-100 p-4"
                onPress={() => router.push('/(profile)/additional-info' as any)}>
                <View className="mr-4 h-10 w-10 items-center justify-center rounded-full bg-cyan-100">
                  <Ionicons name="add-circle-outline" size={20} color="#0284C7" />
                </View>
                <Text className="flex-1 text-base font-medium text-slate-900">
                  Thông tin bổ sung
                </Text>
                <Ionicons name="chevron-forward" size={20} color="#06B6D4" />
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-row items-center p-4"
                onPress={() => router.push('/(profile)/health-info' as any)}>
                <View className="mr-4 h-10 w-10 items-center justify-center rounded-full bg-cyan-100">
                  <Ionicons name="heart-outline" size={20} color="#0284C7" />
                </View>
                <Text className="flex-1 text-base font-medium text-slate-900">
                  Thông tin sức khỏe
                </Text>
                <Ionicons name="chevron-forward" size={20} color="#06B6D4" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Hồ sơ người thân Section */}
          <View className="mb-6">
            <View className="mb-4 flex-row items-center justify-between">
              <Text className="text-lg font-bold text-slate-900">Hồ sơ người thân</Text>
              <TouchableOpacity
                className="flex-row items-center"
                onPress={() => router.push('/(profile)/add-patient-profile' as any)}>
                <Ionicons name="add" size={20} color="#0284C7" />
                <Text className="ml-1 text-base font-medium text-sky-600">Thêm hồ sơ</Text>
              </TouchableOpacity>
            </View>

            {otherProfiles.length > 0 ? (
              /* Hiển thị danh sách PatientProfile */
              <View className="space-y-3">
                {otherProfiles.map((profile: PatientProfile) => (
                  <View
                    key={profile.id}
                    className="flex-row items-center rounded-xl border border-cyan-100 bg-teal-50 p-4">
                    <TouchableOpacity
                      className="mr-4 h-12 w-12 items-center justify-center rounded-full bg-cyan-100"
                      onPress={() => handleUploadAvatar(profile.id)}
                      disabled={isUploading}>
                      {profile.avatar ? (
                        <Image
                          source={{ uri: profile.avatar }}
                          className="h-full w-full rounded-full"
                        />
                      ) : (
                        <Text className="text-lg font-bold text-sky-600">
                          {profile.firstName.charAt(0).toUpperCase()}
                        </Text>
                      )}
                      {/* Small camera icon overlay */}
                      <View className="absolute -bottom-1 -right-1 h-6 w-6 items-center justify-center rounded-full border border-cyan-200 bg-white">
                        <Ionicons name="camera" size={12} color="#0284C7" />
                      </View>
                    </TouchableOpacity>
                    <TouchableOpacity
                      className="flex-1"
                      onPress={() => {
                        router.push({
                          pathname: '/(homes)/(profile)/personal-info',
                          params: { profile: JSON.stringify(profile) },
                        });
                      }}>
                      <Text className="text-base font-medium text-slate-900">
                        {profile.firstName} {profile.lastName}
                      </Text>
                      <Text className="text-sm text-slate-500">
                        {getRelationshipText(profile.relationship)}
                      </Text>
                    </TouchableOpacity>
                    <Ionicons name="chevron-forward" size={20} color="#06B6D4" />
                  </View>
                ))}
              </View>
            ) : (
              /* Hiển thị illustration khi chưa có PatientProfile */
              <View className="items-center rounded-2xl border border-cyan-100 bg-teal-50 p-6">
                <View className="mb-5 h-32 w-32 items-center justify-center rounded-full bg-white/50">
                  <Image
                    source={require('../../../assets/profile-bg1.png')}
                    className="h-24 w-24"
                    resizeMode="contain"
                  />
                </View>
                <Text className="mb-4 text-center text-base font-medium text-slate-600">
                  Bạn chưa có Hồ sơ Người thân nào{'\n'}hãy cập nhật nhé
                </Text>
                <TouchableOpacity
                  className="rounded-full bg-sky-600 px-8 py-3 shadow-lg shadow-sky-600/30"
                  onPress={() => router.push('/(profile)/add-patient-profile' as any)}>
                  <Text className="text-center text-base font-bold text-white">THÊM HỒ SƠ</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

// Thay đổi cuối cùng: Tách riêng export default để đảm bảo tính ổn định
export default ProfileScreen;
