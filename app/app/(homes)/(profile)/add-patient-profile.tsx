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
import { router } from 'expo-router';
import { Relationship } from '@/types/auth';
import { userApi } from '@/lib/api';
import { useUploadPatientProfileAvatar } from '@/lib/api/user';
import BirthDatePicker from '@/components/BirthDatePicker';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '@/lib/hooks/useAuth';

const AddPatientProfileScreen = () => {
  const { refreshProfile } = useAuth();
  const uploadAvatarMutation = useUploadPatientProfileAvatar();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    relationship: '' as Relationship | '',
  });
  const [dateOfBirth, setDateOfBirth] = useState<Date | null>(null);
  const [gender, setGender] = useState<'MALE' | 'FEMALE' | 'OTHER' | null>(null);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isUploading = uploadAvatarMutation.isPending;

  // Validation errors
  const [firstNameError, setFirstNameError] = useState('');
  const [lastNameError, setLastNameError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [dateOfBirthError, setDateOfBirthError] = useState('');
  const [genderError, setGenderError] = useState('');
  const [relationshipError, setRelationshipError] = useState('');

  // Relationship options
  const relationshipOptions = [
    { value: 'CHILD' as Relationship, label: 'Con' },
    { value: 'SPOUSE' as Relationship, label: 'Vợ/Chồng' },
    { value: 'PARENT' as Relationship, label: 'Bố/Mẹ' },
    { value: 'SIBLING' as Relationship, label: 'Anh/Chị/Em' },
    { value: 'RELATIVE' as Relationship, label: 'Họ hàng' },
    { value: 'FRIEND' as Relationship, label: 'Bạn bè' },
    { value: 'OTHER' as Relationship, label: 'Khác' },
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
        setAvatar(result.assets[0].uri);
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

  // Handle form submission
  const handleSubmit = async () => {
    // Clear previous errors
    setFirstNameError('');
    setLastNameError('');
    setPhoneError('');
    setDateOfBirthError('');
    setGenderError('');
    setRelationshipError('');

    let hasError = false;

    // Validation
    if (!formData.lastName.trim()) {
      setLastNameError('Vui lòng nhập họ');
      hasError = true;
    }
    if (!formData.firstName.trim()) {
      setFirstNameError('Vui lòng nhập tên');
      hasError = true;
    }
    if (!formData.phone.trim()) {
      setPhoneError('Vui lòng nhập số điện thoại');
      hasError = true;
    } else if (!validatePhone(formData.phone.trim())) {
      setPhoneError('Số điện thoại phải có 10-11 chữ số');
      hasError = true;
    }
    if (!dateOfBirth) {
      setDateOfBirthError('Vui lòng chọn ngày sinh');
      hasError = true;
    }
    if (!gender) {
      setGenderError('Vui lòng chọn giới tính');
      hasError = true;
    }
    if (!formData.relationship) {
      setRelationshipError('Vui lòng chọn mối quan hệ');
      hasError = true;
    }

    if (hasError) return;

    try {
      setIsSubmitting(true);

      // Create patient profile first
      const profileData = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        dateOfBirth: dateOfBirth!.toISOString(),
        gender: gender!,
        phone: formData.phone.trim(),
        relationship: formData.relationship as Relationship,
        // Don't include avatar if not selected
        ...(avatar && { avatar: avatar }),
        occupation: undefined,
        address: '',
      };

      const response = await userApi.createPatientProfile(profileData);
      const profileId = response.profile.id;

      // Upload avatar if selected using React Query hook with automatic cache updates
      if (avatar && profileId) {
        const formDataUpload = new FormData();
        formDataUpload.append('avatar', {
          uri: avatar,
          type: 'image/jpeg',
          name: 'avatar.jpg',
        } as any);

        try {
          await uploadAvatarMutation.mutateAsync({ profileId, file: formDataUpload });
        } catch (uploadError) {
          console.error('Avatar upload error:', uploadError);
          // Don't fail the entire process if avatar upload fails
        }
      }

      // Refresh user data to get updated profiles (hook already handles cache, but refresh to be safe)
      await refreshProfile();

      Alert.alert('Thành công', 'Hồ sơ bệnh nhân đã được tạo thành công', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      console.error('Create profile error:', error);
      Alert.alert('Lỗi', 'Không thể tạo hồ sơ. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
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
                  {avatar ? (
                    <Image source={{ uri: avatar }} className="h-full w-full rounded-full" />
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
            <View>
              <View
                className={`flex-row items-center rounded-lg px-4 py-4 ${firstNameError ? 'border border-red-200 bg-red-50' : 'bg-gray-100'}`}>
                <Ionicons
                  name="person-outline"
                  size={20}
                  color={firstNameError ? '#EF4444' : '#000000'}
                />
                <TextInput
                  className="ml-3 flex-1 text-base text-gray-800"
                  placeholder="Tên"
                  placeholderTextColor="#9CA3AF"
                  value={formData.firstName}
                  onChangeText={(text) => {
                    setFormData((prev) => ({ ...prev, firstName: text }));
                    if (firstNameError) setFirstNameError(''); // Clear error when user types
                  }}
                />
              </View>
              {firstNameError && (
                <Text className="mt-1 text-xs text-red-600">{firstNameError}</Text>
              )}
            </View>

            {/* Last Name */}
            <View>
              <View
                className={`flex-row items-center rounded-lg px-4 py-4 ${lastNameError ? 'border border-red-200 bg-red-50' : 'bg-gray-100'}`}>
                <Ionicons
                  name="person-outline"
                  size={20}
                  color={lastNameError ? '#EF4444' : '#000000'}
                />
                <TextInput
                  className="ml-3 flex-1 text-base text-gray-800"
                  placeholder="Họ"
                  placeholderTextColor="#9CA3AF"
                  value={formData.lastName}
                  onChangeText={(text) => {
                    setFormData((prev) => ({ ...prev, lastName: text }));
                    if (lastNameError) setLastNameError(''); // Clear error when user types
                  }}
                />
              </View>
              {lastNameError && <Text className="mt-1 text-xs text-red-600">{lastNameError}</Text>}
            </View>

            {/* Phone */}
            <View>
              <View
                className={`flex-row items-center rounded-lg px-4 py-4 ${phoneError ? 'border border-red-200 bg-red-50' : 'bg-gray-100'}`}>
                <Ionicons
                  name="call-outline"
                  size={20}
                  color={phoneError ? '#EF4444' : '#000000'}
                />
                <TextInput
                  className="ml-3 flex-1 text-base text-gray-800"
                  placeholder="Số điện thoại"
                  placeholderTextColor="#9CA3AF"
                  value={formData.phone}
                  onChangeText={(text) => {
                    setFormData((prev) => ({ ...prev, phone: text }));
                    if (phoneError) setPhoneError(''); // Clear error when user types
                  }}
                  keyboardType="phone-pad"
                  maxLength={11}
                />
              </View>
              {phoneError && <Text className="mt-1 text-xs text-red-600">{phoneError}</Text>}
            </View>

            {/* Date of Birth */}
            <View>
              <BirthDatePicker
                selectedDate={dateOfBirth}
                onDateSelect={setDateOfBirth}
                placeholder="Chọn ngày sinh"
                error={dateOfBirthError}
              />
            </View>

            {/* Gender */}
            <View>
              <Text className="mb-4 text-lg font-bold text-slate-900">Giới tính *</Text>
              <View className="flex-row space-x-4">
                <TouchableOpacity
                  onPress={() => {
                    setGender('MALE');
                    if (genderError) setGenderError('');
                  }}
                  className={`flex-1 flex-row items-center justify-center rounded-xl border-2 px-5 py-4 ${
                    gender === 'MALE'
                      ? 'border-blue-600'
                      : genderError
                        ? 'border-red-200'
                        : 'border-gray-200'
                  }`}
                  style={{
                    backgroundColor:
                      gender === 'MALE' ? '#DBEAFE' : genderError ? '#FEF2F2' : '#F9FAFB',
                  }}>
                  <Ionicons
                    name="male"
                    size={22}
                    color={gender === 'MALE' ? '#2563EB' : genderError ? '#EF4444' : '#9CA3AF'}
                  />
                  <Text
                    className={`ml-3 text-lg font-medium ${
                      gender === 'MALE'
                        ? 'text-blue-600'
                        : genderError
                          ? 'text-red-600'
                          : 'text-gray-400'
                    }`}>
                    Nam
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    setGender('FEMALE');
                    if (genderError) setGenderError('');
                  }}
                  className={`flex-1 flex-row items-center justify-center rounded-xl border-2 px-5 py-4 ${
                    gender === 'FEMALE'
                      ? 'border-pink-600'
                      : genderError
                        ? 'border-red-200'
                        : 'border-gray-200'
                  }`}
                  style={{
                    backgroundColor:
                      gender === 'FEMALE' ? '#FCE7F3' : genderError ? '#FEF2F2' : '#F9FAFB',
                  }}>
                  <Ionicons
                    name="female"
                    size={22}
                    color={gender === 'FEMALE' ? '#DB2777' : genderError ? '#EF4444' : '#9CA3AF'}
                  />
                  <Text
                    className={`ml-3 text-lg font-medium ${
                      gender === 'FEMALE'
                        ? 'text-pink-600'
                        : genderError
                          ? 'text-red-600'
                          : 'text-gray-400'
                    }`}>
                    Nữ
                  </Text>
                </TouchableOpacity>
              </View>
              {genderError && <Text className="mt-1 text-xs text-red-600">{genderError}</Text>}
            </View>

            {/* Relationship Selection */}
            <View>
              <Text className="mb-4 text-lg font-bold text-slate-900">
                Đây là hồ sơ của <Text className="text-red-500">*</Text>
              </Text>
              <View className="space-y-3">
                <View className="flex-row space-x-3">
                  {relationshipOptions.slice(0, 3).map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      className={`flex-1 rounded-lg border-2 px-4 py-3 ${
                        formData.relationship === option.value
                          ? 'border-emerald-500 bg-emerald-100'
                          : relationshipError
                            ? 'border-red-200 bg-red-50'
                            : 'border-gray-200 bg-gray-50'
                      }`}
                      onPress={() => {
                        setFormData((prev) => ({ ...prev, relationship: option.value }));
                        if (relationshipError) setRelationshipError('');
                      }}>
                      <Text
                        className={`text-center text-base font-semibold ${
                          formData.relationship === option.value
                            ? 'text-emerald-700'
                            : relationshipError
                              ? 'text-red-600'
                              : 'text-gray-600'
                        }`}>
                        {option.label}
                      </Text>
                      {formData.relationship === option.value && (
                        <View className="absolute -right-1 -top-1 h-5 w-5 items-center justify-center rounded-full bg-emerald-500">
                          <Ionicons name="checkmark" size={12} color="white" />
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
                <View className="flex-row space-x-3">
                  {relationshipOptions.slice(3, 6).map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      className={`flex-1 rounded-lg border-2 px-4 py-3 ${
                        formData.relationship === option.value
                          ? 'border-emerald-500 bg-emerald-100'
                          : relationshipError
                            ? 'border-red-200 bg-red-50'
                            : 'border-gray-200 bg-gray-50'
                      }`}
                      onPress={() => {
                        setFormData((prev) => ({ ...prev, relationship: option.value }));
                        if (relationshipError) setRelationshipError('');
                      }}>
                      <Text
                        className={`text-center text-base font-semibold ${
                          formData.relationship === option.value
                            ? 'text-emerald-700'
                            : relationshipError
                              ? 'text-red-600'
                              : 'text-gray-600'
                        }`}>
                        {option.label}
                      </Text>
                      {formData.relationship === option.value && (
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
                        formData.relationship === option.value
                          ? 'border-emerald-500 bg-emerald-100'
                          : relationshipError
                            ? 'border-red-200 bg-red-50'
                            : 'border-gray-200 bg-gray-50'
                      }`}
                      style={{ width: '100%' }}
                      onPress={() => {
                        setFormData((prev) => ({ ...prev, relationship: option.value }));
                        if (relationshipError) setRelationshipError('');
                      }}>
                      <Text
                        className={`text-center text-base font-semibold ${
                          formData.relationship === option.value
                            ? 'text-emerald-700'
                            : relationshipError
                              ? 'text-red-600'
                              : 'text-gray-600'
                        }`}>
                        {option.label}
                      </Text>
                      {formData.relationship === option.value && (
                        <View className="absolute -right-1 -top-1 h-5 w-5 items-center justify-center rounded-full bg-emerald-500">
                          <Ionicons name="checkmark" size={12} color="white" />
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              {relationshipError && (
                <Text className="mt-1 text-xs text-red-600">{relationshipError}</Text>
              )}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Submit Button */}
      <View className="px-6 pb-6">
        <TouchableOpacity
          className={`rounded-lg py-4 ${isSubmitting ? 'bg-gray-400' : 'bg-cyan-500'}`}
          onPress={handleSubmit}
          disabled={isSubmitting}>
          <Text className="text-center text-lg font-bold text-white">
            {isSubmitting ? 'ĐANG TẠO...' : 'HOÀN TẤT'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default AddPatientProfileScreen;
