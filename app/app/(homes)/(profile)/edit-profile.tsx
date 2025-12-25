'use client';

import BirthDatePicker from '@/components/BirthDatePicker';
import GenderSelector from '@/components/GenderSelector';
import { Relationship } from '@/constants/enum';
import { useUpdatePatientProfile, useUploadPatientProfileAvatar } from '@/lib/api/user';
import { validateName, validatePhone } from '@/lib/utils/validation';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';

interface EditProfileFormData {
  firstName: string;
  lastName: string;
  phone: string;
  relationship: Relationship;
  dateOfBirth: Date | null;
  gender: 'MALE' | 'FEMALE';
  avatar: string | null;
}

export default function EditProfileScreen() {
  const param = useLocalSearchParams();
  const profile = JSON.parse(param.profile as string);

  const updateProfileMutation = useUpdatePatientProfile();
  const uploadAvatarMutation = useUploadPatientProfileAvatar();

  const isUploading = uploadAvatarMutation.isPending;
  const isSubmitting = updateProfileMutation.isPending;

  // Initialize react-hook-form with default values from profile
  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<EditProfileFormData>({
    defaultValues: {
      firstName: profile.firstName || '',
      lastName: profile.lastName || '',
      phone: profile.phone || '',
      relationship: profile.relationship || 'CHILD',
      dateOfBirth: profile.dateOfBirth ? new Date(profile.dateOfBirth) : null,
      gender: profile.gender || null,
      avatar: profile.avatar || null,
    },
  });

  // Watch form values
  const watchedGender = watch('gender');
  const watchedRelationship = watch('relationship');
  const watchedAvatar = watch('avatar');

  // Relationship options
  const relationshipOptions = [
    { value: Relationship.CHILD, label: 'Con' },
    { value: Relationship.SPOUSE, label: 'Vợ/Chồng' },
    { value: Relationship.PARENT, label: 'Bố/Mẹ' },
    { value: Relationship.SIBLING, label: 'Anh/Chị/Em' },
    { value: Relationship.RELATIVE, label: 'Họ hàng' },
    { value: Relationship.FRIEND, label: 'Bạn bè' },
    { value: Relationship.OTHER, label: 'Khác' },
  ];

  // Handle avatar upload
  const handleUploadAvatar = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permissionResult.granted === false) {
        Alert.alert('Cần quyền truy cập', 'Cần quyền truy cập thư viện ảnh để upload avatar');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setValue('avatar', result.assets[0].uri);
      }
    } catch (error) {
      console.error('Upload avatar error:', error);
      Alert.alert('Lỗi', 'Không thể chọn ảnh. Vui lòng thử lại.');
    }
  };

  // Phone validation function (local override for react-hook-form)
  const validatePhoneLocal = (phone: string): boolean => {
    const validation = validatePhone(phone);
    return validation.isValid;
  };

  // Handle form submission with react-hook-form
  const onSubmit = async (data: EditProfileFormData) => {
    // Validate required fields
    if (!data.dateOfBirth) {
      Alert.alert('Lỗi', 'Vui lòng chọn ngày sinh');
      return;
    }
    if (!data.gender) {
      Alert.alert('Lỗi', 'Vui lòng chọn giới tính');
      return;
    }

    try {
      // Update patient profile
      const profileData = {
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        dateOfBirth: data.dateOfBirth.toISOString(),
        gender: data.gender,
        phone: data.phone.trim(),
        relationship: data.relationship as Relationship,
        occupation: profile.occupation || undefined,
        address: profile.address || '',
      };

      await updateProfileMutation.mutateAsync({ profileId: profile.id, data: profileData });

      // Upload avatar if changed
      if (data.avatar && data.avatar !== profile.avatar) {
        const formDataUpload = new FormData();
        formDataUpload.append('avatar', {
          uri: data.avatar,
          type: 'image/jpeg',
          name: 'avatar.jpg',
        } as any);

        try {
          await uploadAvatarMutation.mutateAsync({ profileId: profile.id, file: formDataUpload });
        } catch (uploadError) {
          console.error('Avatar upload error:', uploadError);
          // Don't fail the entire process if avatar upload fails
        }
      }

      Alert.alert('Thành công', 'Hồ sơ bệnh nhân đã được cập nhật thành công', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      console.error('Update profile error:', error);
      Alert.alert('Lỗi', 'Không thể cập nhật hồ sơ. Vui lòng thử lại.');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#E0F2FE' }}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
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
            <Pressable
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
            </Pressable>
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#FFFFFF', flex: 1 }}>
              Thông tin cá nhân
            </Text>
          </View>
        </View>

        <View className="px-4 pb-6" style={{ marginTop: -80 }}>
          <View className="rounded-3xl bg-white p-6 shadow-sm">
            {/* Header Section */}
            <View className="mb-8 items-center">
              <View className="mb-4 h-32 w-32 items-center justify-center rounded-full bg-gray-50">
                <Image
                  source={require('../../../assets/Medicine-bro.png')}
                  style={{
                    width: 120,
                    height: 120,
                    resizeMode: 'contain',
                  }}
                  fadeDuration={200}
                />
              </View>
              <Text className="mb-2 text-2xl font-bold text-gray-800">Cập nhật hồ sơ</Text>
              <Text className="text-center text-sm text-gray-500">
                Vui lòng điền đầy đủ thông tin bên dưới
              </Text>

              {/* Avatar Section */}
              <View className="mt-6">
                <Pressable onPress={handleUploadAvatar} disabled={isUploading} className="relative">
                  <View className="h-24 w-24 items-center justify-center rounded-full bg-gray-100 ring-4 ring-white">
                    {watchedAvatar ? (
                      <Image
                        source={{ uri: watchedAvatar }}
                        className="h-full w-full rounded-full"
                      />
                    ) : (
                      <Ionicons name="person" size={32} color="#9CA3AF" />
                    )}
                  </View>
                  <View className="0 absolute bottom-0 right-0 h-8 w-8 items-center justify-center rounded-full bg-cyan-500 ring-2 ring-white">
                    <Ionicons name="camera" size={16} color="white" />
                  </View>
                </Pressable>
              </View>
            </View>

            <View className="gap-5">
              {/* First Name */}
              <Controller
                control={control}
                name="firstName"
                rules={{
                  required: 'Vui lòng nhập tên',
                  validate: (value) => {
                    const validation = validateName(value);
                    return validation.isValid || validation.message || 'Tên không hợp lệ';
                  },
                }}
                render={({ field: { onChange, value }, fieldState: { error } }) => (
                  <View>
                    <View
                      className={`flex-row items-center rounded-lg px-4 py-4 ${error ? 'border border-red-200 bg-red-50' : 'bg-gray-100'}`}>
                      <Ionicons
                        name="person-outline"
                        size={20}
                        color={error ? '#EF4444' : '#000000'}
                      />
                      <TextInput
                        className="ml-3 flex-1 text-base text-gray-800"
                        placeholder="Tên"
                        placeholderTextColor="#9CA3AF"
                        value={value}
                        onChangeText={onChange}
                      />
                    </View>
                    {error && <Text className="mt-1 text-xs text-red-600">{error.message}</Text>}
                  </View>
                )}
              />

              {/* Last Name */}
              <Controller
                control={control}
                name="lastName"
                rules={{
                  required: 'Vui lòng nhập họ',
                  validate: (value) => {
                    const validation = validateName(value);
                    return validation.isValid || validation.message || 'Họ không hợp lệ';
                  },
                }}
                render={({ field: { onChange, value }, fieldState: { error } }) => (
                  <View>
                    <View
                      className={`flex-row items-center rounded-lg px-4 py-4 ${error ? 'border border-red-200 bg-red-50' : 'bg-gray-100'}`}>
                      <Ionicons
                        name="person-outline"
                        size={20}
                        color={error ? '#EF4444' : '#000000'}
                      />
                      <TextInput
                        className="ml-3 flex-1 text-base text-gray-800"
                        placeholder="Họ"
                        placeholderTextColor="#9CA3AF"
                        value={value}
                        onChangeText={onChange}
                      />
                    </View>
                    {error && <Text className="mt-1 text-xs text-red-600">{error.message}</Text>}
                  </View>
                )}
              />

              {/* Phone */}
              <Controller
                control={control}
                name="phone"
                rules={{
                  required: 'Vui lòng nhập số điện thoại',
                  validate: (value) => {
                    const validation = validatePhone(value.trim());
                    return validation.isValid || validation.message || 'Số điện thoại không hợp lệ';
                  },
                }}
                render={({ field: { onChange, value }, fieldState: { error } }) => (
                  <View>
                    <View
                      className={`flex-row items-center rounded-lg px-4 py-4 ${error ? 'border border-red-200 bg-red-50' : 'bg-gray-100'}`}>
                      <Ionicons
                        name="call-outline"
                        size={20}
                        color={error ? '#EF4444' : '#000000'}
                      />
                      <TextInput
                        className="ml-3 flex-1 text-base text-gray-800"
                        placeholder="Số điện thoại"
                        placeholderTextColor="#9CA3AF"
                        value={value}
                        onChangeText={onChange}
                        keyboardType="phone-pad"
                        maxLength={11}
                      />
                    </View>
                    {error && <Text className="mt-1 text-xs text-red-600">{error.message}</Text>}
                  </View>
                )}
              />

              {/* Date of Birth */}
              <Controller
                control={control}
                name="dateOfBirth"
                render={({ field: { onChange, value } }) => (
                  <View>
                    <BirthDatePicker
                      selectedDate={value}
                      onDateSelect={onChange}
                      placeholder="Chọn ngày sinh"
                    />
                  </View>
                )}
              />

              {/* Gender */}
              <Controller
                control={control}
                name="gender"
                render={({ field: { onChange, value } }) => (
                  <View>
                    <GenderSelector
                      selectedGender={value}
                      onGenderSelect={onChange}
                      error={errors.gender?.message}
                    />
                  </View>
                )}
              />

              {/* Relationship Selection */}
              {watchedRelationship !== Relationship.SELF && (
                <Controller
                  control={control}
                  name="relationship"
                  render={({ field: { onChange, value } }) => (
                    <View>
                      <Text className="mb-4 text-lg font-bold text-slate-900">
                        Đây là hồ sơ của <Text className="text-red-500">*</Text>
                      </Text>
                      <View className="gap-3">
                        <View className="flex-row gap-3">
                          {relationshipOptions.slice(0, 3).map((option) => (
                            <Pressable
                              key={option.value}
                              className={`flex-1 rounded-lg border-2 px-4 py-3 ${
                                value === option.value
                                  ? 'border-emerald-500 bg-emerald-100'
                                  : 'border-gray-200 bg-gray-50'
                              }`}
                              style={({ pressed }) => [
                                {
                                  opacity: pressed ? 0.7 : 1,
                                  backgroundColor: value === option.value ? '#D1FAE5' : '#F9FAFB',
                                },
                              ]}
                              onPress={() => onChange(option.value)}>
                              <Text
                                className={`text-center text-base font-semibold ${
                                  value === option.value ? 'text-emerald-700' : 'text-gray-600'
                                }`}>
                                {option.label}
                              </Text>
                              {value === option.value && (
                                <View className="absolute -right-1 -top-1 h-5 w-5 items-center justify-center rounded-full bg-emerald-500">
                                  <Ionicons name="checkmark" size={12} color="white" />
                                </View>
                              )}
                            </Pressable>
                          ))}
                        </View>
                        <View className="flex-row gap-3">
                          {relationshipOptions.slice(3, 6).map((option) => (
                            <Pressable
                              key={option.value}
                              className={`flex-1 rounded-lg border-2 px-4 py-3 ${
                                value === option.value
                                  ? 'border-emerald-500 bg-emerald-100'
                                  : 'border-gray-200 bg-gray-50'
                              }`}
                              style={({ pressed }) => [
                                {
                                  opacity: pressed ? 0.7 : 1,
                                  backgroundColor: value === option.value ? '#D1FAE5' : '#F9FAFB',
                                },
                              ]}
                              onPress={() => onChange(option.value)}>
                              <Text
                                className={`text-center text-base font-semibold ${
                                  value === option.value ? 'text-emerald-700' : 'text-gray-600'
                                }`}>
                                {option.label}
                              </Text>
                              {value === option.value && (
                                <View className="absolute -right-1 -top-1 h-5 w-5 items-center justify-center rounded-full bg-emerald-500">
                                  <Ionicons name="checkmark" size={12} color="white" />
                                </View>
                              )}
                            </Pressable>
                          ))}
                        </View>
                        <View className="flex-row space-x-3">
                          {relationshipOptions.slice(6).map((option) => (
                            <Pressable
                              key={option.value}
                              className={`rounded-lg border-2 px-4 py-3 ${
                                value === option.value
                                  ? 'border-emerald-500 bg-emerald-100'
                                  : 'border-gray-200 bg-gray-50'
                              }`}
                              style={({ pressed }) => [
                                { width: '100%', opacity: pressed ? 0.7 : 1 },
                                {
                                  backgroundColor: value === option.value ? '#D1FAE5' : '#F9FAFB',
                                },
                              ]}
                              onPress={() => onChange(option.value)}>
                              <Text
                                className={`text-center text-base font-semibold ${
                                  value === option.value ? 'text-emerald-700' : 'text-gray-600'
                                }`}>
                                {option.label}
                              </Text>
                              {value === option.value && (
                                <View className="absolute -right-1 -top-1 h-5 w-5 items-center justify-center rounded-full bg-emerald-500">
                                  <Ionicons name="checkmark" size={12} color="white" />
                                </View>
                              )}
                            </Pressable>
                          ))}
                        </View>
                      </View>
                    </View>
                  )}
                />
              )}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Submit Button */}
      <View className="px-6 pb-6">
        <Pressable
          className={`rounded-lg py-4 ${isSubmitting ? 'bg-gray-400' : 'bg-cyan-500'}`}
          onPress={handleSubmit(onSubmit)}
          disabled={isSubmitting}>
          <Text className="text-center text-lg font-bold text-white">
            {isSubmitting ? 'ĐANG CẬP NHẬT...' : 'HOÀN TẤT'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
