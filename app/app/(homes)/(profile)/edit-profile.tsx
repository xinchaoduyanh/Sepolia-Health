'use client';

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Image,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
// import { Relationship } from '@/types/auth';
import { useUpdatePatientProfile, useUploadPatientProfileAvatar } from '@/lib/api/user';
import BirthDatePicker from '@/components/BirthDatePicker';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '@/lib/hooks/useAuth';
import { useForm, Controller } from 'react-hook-form';
import { Relationship } from '@/constants/enum';

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

  // Phone validation function
  const validatePhone = (phone: string): boolean => {
    const phoneRegex = /^[0-9]{10,11}$/;
    return phoneRegex.test(phone);
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
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="white" />

      {/* Header */}
      <View className="flex-row items-center justify-between border-b border-gray-200 px-4 py-3">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-gray-900">Thông tin cơ bản</Text>
        <View className="w-6" />
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-6 py-6">
          {/* Header Section */}
          <View className="mb-8 items-center">
            <View className="mb-4 h-32 w-32 items-center justify-center rounded-full bg-gray-100">
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
            <Text className="mb-3 text-3xl font-bold text-gray-800">Thông tin cá nhân</Text>
            <Text className="text-center text-base leading-6 text-gray-500">
              Hoàn tất thông tin để tạo hồ sơ bệnh nhân
            </Text>

            {/* Avatar Section */}
            <View className="mt-6">
              <TouchableOpacity
                onPress={handleUploadAvatar}
                disabled={isUploading}
                className="relative">
                <View className="h-24 w-24 items-center justify-center rounded-full bg-gray-100">
                  {watchedAvatar ? (
                    <Image source={{ uri: watchedAvatar }} className="h-full w-full rounded-full" />
                  ) : (
                    <Ionicons name="person" size={32} color="#9CA3AF" />
                  )}
                </View>
                <View className="absolute -bottom-1 -right-1 h-8 w-8 items-center justify-center rounded-full bg-cyan-500">
                  <Ionicons name="camera" size={16} color="white" />
                </View>
              </TouchableOpacity>
            </View>
          </View>

          <View className="gap-5">
            {/* First Name */}
            <Controller
              control={control}
              name="firstName"
              rules={{
                required: 'Vui lòng nhập tên',
                validate: (value) => value.trim() !== '' || 'Tên không được để trống',
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
                validate: (value) => value.trim() !== '' || 'Họ không được để trống',
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
                validate: (value) =>
                  validatePhone(value.trim()) || 'Số điện thoại phải có 10-11 chữ số',
              }}
              render={({ field: { onChange, value }, fieldState: { error } }) => (
                <View>
                  <View
                    className={`flex-row items-center rounded-lg px-4 py-4 ${error ? 'border border-red-200 bg-red-50' : 'bg-gray-100'}`}>
                    <Ionicons name="call-outline" size={20} color={error ? '#EF4444' : '#000000'} />
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
                  <Text className="mb-4 text-lg font-bold text-slate-900">Giới tính *</Text>
                  <View className="flex-row gap-5">
                    <TouchableOpacity
                      activeOpacity={1}
                      onPress={() => onChange('MALE')}
                      className={`flex-1 flex-row items-center justify-center rounded-xl border-2 px-5 py-4 ${
                        value === 'MALE' ? 'border-blue-600' : 'border-gray-200'
                      }`}
                      style={{
                        backgroundColor: value === 'MALE' ? '#DBEAFE' : '#F9FAFB',
                      }}>
                      <Ionicons
                        name="male"
                        size={22}
                        color={value === 'MALE' ? '#2563EB' : '#9CA3AF'}
                      />
                      <Text
                        className={`ml-3 text-lg font-medium ${
                          value === 'MALE' ? 'text-blue-600' : 'text-gray-400'
                        }`}>
                        Nam
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      activeOpacity={1}
                      onPress={() => onChange('FEMALE')}
                      className={`flex-1 flex-row items-center justify-center rounded-xl border-2 px-5 py-4 ${
                        value === 'FEMALE' ? 'border-pink-600' : 'border-gray-200'
                      }`}
                      style={{
                        backgroundColor: value === 'FEMALE' ? '#FCE7F3' : '#F9FAFB',
                      }}>
                      <Ionicons
                        name="female"
                        size={22}
                        color={value === 'FEMALE' ? '#DB2777' : '#9CA3AF'}
                      />
                      <Text
                        className={`ml-3 text-lg font-medium ${
                          value === 'FEMALE' ? 'text-pink-600' : 'text-gray-400'
                        }`}>
                        Nữ
                      </Text>
                    </TouchableOpacity>
                  </View>
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
                          <TouchableOpacity
                            activeOpacity={1}
                            key={option.value}
                            className={`flex-1 rounded-lg border-2 px-4 py-3 ${
                              value === option.value
                                ? 'border-emerald-500 bg-emerald-100'
                                : 'border-gray-200 bg-gray-50'
                            }`}
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
                          </TouchableOpacity>
                        ))}
                      </View>
                      <View className="flex-row gap-3">
                        {relationshipOptions.slice(3, 6).map((option) => (
                          <TouchableOpacity
                            key={option.value}
                            className={`flex-1 rounded-lg border-2 px-4 py-3 ${
                              value === option.value
                                ? 'border-emerald-500 bg-emerald-100'
                                : 'border-gray-200 bg-gray-50'
                            }`}
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
                          </TouchableOpacity>
                        ))}
                      </View>
                      <View className="flex-row space-x-3">
                        {relationshipOptions.slice(6).map((option) => (
                          <TouchableOpacity
                            key={option.value}
                            className={`rounded-lg border-2 px-4 py-3 ${
                              value === option.value
                                ? 'border-emerald-500 bg-emerald-100'
                                : 'border-gray-200 bg-gray-50'
                            }`}
                            style={{ width: '100%' }}
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
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  </View>
                )}
              />
            )}
          </View>
        </View>
      </ScrollView>

      {/* Submit Button */}
      <View className="px-6 pb-6">
        <TouchableOpacity
          className={`rounded-lg py-4 ${isSubmitting ? 'bg-gray-400' : 'bg-cyan-500'}`}
          onPress={handleSubmit(onSubmit)}
          disabled={isSubmitting}>
          <Text className="text-center text-lg font-bold text-white">
            {isSubmitting ? 'ĐANG CẬP NHẬT...' : 'HOÀN TẤT'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
