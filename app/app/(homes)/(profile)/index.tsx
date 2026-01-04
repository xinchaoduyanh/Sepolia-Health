'use client';

import { useUploadPatientProfileAvatar, useUploadUserAvatar } from '@/lib/api/user';
import { useAuth } from '@/lib/hooks/useAuth';
import { PatientProfile } from '@/types/auth';
import { getRelationshipLabel } from '@/utils/relationshipTranslator';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Alert, Image, ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native';

const ProfileScreen = () => {
  const { user } = useAuth();
  const uploadPatientAvatarMutation = useUploadPatientProfileAvatar();
  const uploadUserAvatarMutation = useUploadUserAvatar();

  // Lấy patientProfiles từ user data
  const patientProfiles = user?.patientProfiles || [];

  // Lấy primary profile (hồ sơ chính)
  const primaryProfile = patientProfiles.find(
    (profile: PatientProfile) => profile.relationship === 'SELF'
  );

  // Lấy các profile khác (không phải primary)
  const otherProfiles = patientProfiles.filter(
    (profile: PatientProfile) => profile.relationship !== 'SELF'
  );

  const isUploading = uploadPatientAvatarMutation.isPending || uploadUserAvatarMutation.isPending;

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
        // Create FormData
        const formData = new FormData();
        formData.append('avatar', {
          uri: result.assets[0].uri,
          type: 'image/jpeg',
          name: 'avatar.jpg',
        } as any);

        // Upload avatar using React Query hooks with automatic cache updates
        if (profileId) {
          // Upload for specific patient profile
          await uploadPatientAvatarMutation.mutateAsync({ profileId, file: formData });
        } else {
          // Upload for primary profile - find primary profile ID
          const primaryProfileId = primaryProfile?.id;
          if (primaryProfileId) {
            await uploadPatientAvatarMutation.mutateAsync({
              profileId: primaryProfileId,
              file: formData,
            });
          } else {
            // Fallback to user avatar upload if no primary profile found
            await uploadUserAvatarMutation.mutateAsync(formData);
          }
        }

        Alert.alert('Thành công', 'Avatar đã được cập nhật');
      }
    } catch (error) {
      console.error('Upload avatar error:', error);
      Alert.alert('Lỗi', 'Không thể upload avatar. Vui lòng thử lại.');
    }
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
              Hồ sơ của tôi
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

              {/* Camera button */}
              <TouchableOpacity
                style={{
                  position: 'absolute',
                  bottom: 38,
                  right: 8,
                  height: 32,
                  width: 32,
                  borderRadius: 16,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#FFFFFF',
                  borderWidth: 2,
                  borderColor: 'rgba(255,255,255,0.8)',
                  shadowColor: '#000000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.2,
                  shadowRadius: 4,
                  elevation: 3,
                }}
                onPress={() => handleUploadAvatar(primaryProfile?.id)}
                disabled={isUploading}>
                {isUploading ? (
                  <Ionicons name="hourglass-outline" size={16} color="#0284C7" />
                ) : (
                  <Ionicons name="camera-outline" size={16} color="#0284C7" />
                )}
              </TouchableOpacity>

              <Text style={{ fontSize: 20, fontWeight: '700', color: '#FFFFFF', marginBottom: 6 }}>
                {primaryProfile
                  ? `${primaryProfile.lastName} ${primaryProfile.firstName}`
                  : user
                    ? `${user.lastName} ${user.firstName}`
                    : 'Người dùng'}
              </Text>
            </View>
          </View>
        </View>

        {/* Main Content Area */}
        <View style={{ paddingHorizontal: 24, marginTop: -150, marginBottom: 24 }}>
          {/* Thông tin chung Section */}
          <View className="mb-6 mt-20">
            <Text className="mb-4 text-lg font-bold text-slate-900">Thông tin chung </Text>
            <View className="overflow-hidden rounded-xl bg-white shadow-sm">
              <TouchableOpacity
                className="flex-row items-center border-b border-gray-100 p-4"
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
                    className="flex-row items-center rounded-xl border border-cyan-100 bg-white p-4 shadow-sm">
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
                        {profile.lastName} {profile.firstName}
                      </Text>
                      <Text className="text-sm text-slate-500">
                        {getRelationshipLabel(profile.relationship)}
                      </Text>
                    </TouchableOpacity>
                    <Ionicons name="chevron-forward" size={20} color="#06B6D4" />
                  </View>
                ))}
              </View>
            ) : (
              /* Hiển thị illustration khi chưa có PatientProfile */
              <View className="items-center rounded-2xl border border-cyan-100 bg-white p-6 shadow-sm">
                <View className="mb-5 h-32 w-32 items-center justify-center rounded-full bg-gray-50">
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

export default ProfileScreen;
