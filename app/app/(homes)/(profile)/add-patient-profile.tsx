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
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Gender, Relationship } from '@/types/auth';
import { userApi } from '@/lib/api';
import * as ImagePicker from 'expo-image-picker';

const AddPatientProfileScreen = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    phone: '',
    email: '',
    gender: '' as Gender | '',
    relationship: '' as Relationship | '',
  });
  const [avatar, setAvatar] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Gender options
  const genderOptions = [
    { value: 'MALE' as Gender, label: 'Nam', icon: 'male' },
    { value: 'FEMALE' as Gender, label: 'Nữ', icon: 'female' },
  ];

  // Relationship options
  const relationshipOptions = [
    { value: 'CHILD' as Relationship, label: 'Con' },
    { value: 'SPOUSE' as Relationship, label: 'Vợ' },
    { value: 'SPOUSE' as Relationship, label: 'Chồng' },
    { value: 'PARENT' as Relationship, label: 'Bố' },
    { value: 'PARENT' as Relationship, label: 'Mẹ' },
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

  // Handle form submission
  const handleSubmit = async () => {
    // Validation
    if (!formData.lastName.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập họ');
      return;
    }
    if (!formData.firstName.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tên');
      return;
    }
    if (!formData.dateOfBirth) {
      Alert.alert('Lỗi', 'Vui lòng chọn ngày sinh');
      return;
    }
    if (!formData.phone.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập số điện thoại');
      return;
    }
    if (!formData.gender) {
      Alert.alert('Lỗi', 'Vui lòng chọn giới tính');
      return;
    }
    if (!formData.relationship) {
      Alert.alert('Lỗi', 'Vui lòng chọn mối quan hệ');
      return;
    }

    try {
      setIsSubmitting(true);

      // Create patient profile first
      const profileData = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        dateOfBirth: new Date(formData.dateOfBirth).toISOString(),
        gender: formData.gender,
        phone: formData.phone.trim(),
        relationship: formData.relationship,
        avatar: '', // Will be updated after profile creation
        occupation: undefined,
        address: '',
        isPrimary: false,
      };

      const response = await userApi.createPatientProfile(profileData);
      const profileId = response.profile.id;

      // Upload avatar if selected
      if (avatar && profileId) {
        setIsUploading(true);
        const formDataUpload = new FormData();
        formDataUpload.append('avatar', {
          uri: avatar,
          type: 'image/jpeg',
          name: 'avatar.jpg',
        } as any);

        try {
          await userApi.uploadPatientProfileAvatar(profileId, formDataUpload);
        } catch (uploadError) {
          console.error('Avatar upload error:', uploadError);
          // Don't fail the entire process if avatar upload fails
        }
      }

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
      setIsUploading(false);
    }
  };

  return (
    <View className="flex-1 bg-white">
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
          {/* Profile Picture Section */}
          <View className="mb-8 items-center">
            <TouchableOpacity
              onPress={handleUploadAvatar}
              className="relative"
              disabled={isUploading}>
              <View className="h-32 w-32 items-center justify-center rounded-full bg-gray-100">
                {avatar ? (
                  <Image source={{ uri: avatar }} className="h-full w-full rounded-full" />
                ) : (
                  <Ionicons name="person" size={48} color="#9CA3AF" />
                )}
              </View>
              <View className="absolute -bottom-1 -right-1 h-8 w-8 items-center justify-center rounded-full bg-cyan-500">
                <Ionicons name="camera" size={16} color="white" />
              </View>
            </TouchableOpacity>
          </View>

          {/* Form Fields */}
          <View className="space-y-6">
            {/* Last Name */}
            <View>
              <View className="mb-2 flex-row items-center">
                <Ionicons name="create-outline" size={20} color="#6B7280" />
                <Text className="ml-2 text-base font-medium text-gray-700">
                  Họ <Text className="text-red-500">*</Text>
                </Text>
              </View>
              <TextInput
                className="border-b border-gray-300 pb-2 text-base text-gray-900"
                placeholder="Nhập họ"
                value={formData.lastName}
                onChangeText={(text) => setFormData((prev) => ({ ...prev, lastName: text }))}
              />
            </View>

            {/* First Name */}
            <View>
              <View className="mb-2 flex-row items-center">
                <Ionicons name="create-outline" size={20} color="#6B7280" />
                <Text className="ml-2 text-base font-medium text-gray-700">
                  Tên <Text className="text-red-500">*</Text>
                </Text>
              </View>
              <TextInput
                className="border-b border-gray-300 pb-2 text-base text-gray-900"
                placeholder="Nhập tên"
                value={formData.firstName}
                onChangeText={(text) => setFormData((prev) => ({ ...prev, firstName: text }))}
              />
            </View>

            {/* Date of Birth */}
            <View>
              <View className="mb-2 flex-row items-center">
                <Ionicons name="calendar-outline" size={20} color="#6B7280" />
                <Text className="ml-2 text-base font-medium text-gray-700">
                  Ngày sinh <Text className="text-red-500">*</Text>
                </Text>
              </View>
              <TextInput
                className="border-b border-gray-300 pb-2 text-base text-gray-900"
                placeholder="DD/MM/YYYY"
                value={formData.dateOfBirth}
                onChangeText={(text) => setFormData((prev) => ({ ...prev, dateOfBirth: text }))}
              />
            </View>

            {/* Phone Number */}
            <View>
              <View className="mb-2 flex-row items-center">
                <Ionicons name="call-outline" size={20} color="#6B7280" />
                <Text className="ml-2 text-base font-medium text-gray-700">
                  Số điện thoại <Text className="text-red-500">*</Text>
                </Text>
              </View>
              <TextInput
                className="border-b border-gray-300 pb-2 text-base text-gray-900"
                placeholder="Nhập số điện thoại"
                value={formData.phone}
                onChangeText={(text) => setFormData((prev) => ({ ...prev, phone: text }))}
                keyboardType="phone-pad"
              />
            </View>

            {/* Email */}
            <View>
              <View className="mb-2 flex-row items-center">
                <Ionicons name="mail-outline" size={20} color="#6B7280" />
                <Text className="ml-2 text-base font-medium text-gray-700">Email</Text>
              </View>
              <TextInput
                className="border-b border-gray-300 pb-2 text-base text-gray-900"
                placeholder="Nhập email"
                value={formData.email}
                onChangeText={(text) => setFormData((prev) => ({ ...prev, email: text }))}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            {/* Gender Selection */}
            <View>
              <Text className="mb-4 text-base font-medium text-gray-700">
                Giới tính <Text className="text-red-500">*</Text>
              </Text>
              <View className="flex-row space-x-4">
                {genderOptions.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    className={`flex-1 flex-row items-center justify-center rounded-lg border-2 px-4 py-3 ${
                      formData.gender === option.value
                        ? 'border-cyan-500 bg-cyan-50'
                        : 'border-gray-200 bg-white'
                    }`}
                    onPress={() => setFormData((prev) => ({ ...prev, gender: option.value }))}>
                    <Ionicons
                      name={option.icon as any}
                      size={20}
                      color={formData.gender === option.value ? '#0284C7' : '#9CA3AF'}
                    />
                    <Text
                      className={`ml-2 text-base font-medium ${
                        formData.gender === option.value ? 'text-cyan-600' : 'text-gray-500'
                      }`}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Relationship Selection */}
            <View>
              <Text className="mb-4 text-base font-medium text-gray-700">
                Đây là hồ sơ của <Text className="text-red-500">*</Text>
              </Text>
              <View className="space-y-3">
                <View className="flex-row space-x-3">
                  {relationshipOptions.slice(0, 3).map((option, index) => (
                    <TouchableOpacity
                      key={`${option.value}-${index}`}
                      className={`flex-1 rounded-lg border-2 px-4 py-3 ${
                        formData.relationship === option.value
                          ? 'border-cyan-500 bg-cyan-50'
                          : 'border-gray-200 bg-white'
                      }`}
                      onPress={() =>
                        setFormData((prev) => ({ ...prev, relationship: option.value }))
                      }>
                      <Text
                        className={`text-center text-base font-medium ${
                          formData.relationship === option.value ? 'text-cyan-600' : 'text-gray-500'
                        }`}>
                        {option.label}
                      </Text>
                      {formData.relationship === option.value && (
                        <View className="absolute -right-1 -top-1 h-5 w-5 items-center justify-center rounded-full bg-cyan-500">
                          <Ionicons name="checkmark" size={12} color="white" />
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
                <View className="flex-row space-x-3">
                  {relationshipOptions.slice(3).map((option, index) => (
                    <TouchableOpacity
                      key={`${option.value}-${index + 3}`}
                      className={`flex-1 rounded-lg border-2 px-4 py-3 ${
                        formData.relationship === option.value
                          ? 'border-cyan-500 bg-cyan-50'
                          : 'border-gray-200 bg-white'
                      }`}
                      onPress={() =>
                        setFormData((prev) => ({ ...prev, relationship: option.value }))
                      }>
                      <Text
                        className={`text-center text-base font-medium ${
                          formData.relationship === option.value ? 'text-cyan-600' : 'text-gray-500'
                        }`}>
                        {option.label}
                      </Text>
                      {formData.relationship === option.value && (
                        <View className="absolute -right-1 -top-1 h-5 w-5 items-center justify-center rounded-full bg-cyan-500">
                          <Ionicons name="checkmark" size={12} color="white" />
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
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

      {/* Floating Action Button */}
      <TouchableOpacity className="absolute bottom-6 right-6 h-14 w-14 items-center justify-center rounded-full bg-cyan-500 shadow-lg">
        <Ionicons name="chatbubbles-outline" size={24} color="white" />
      </TouchableOpacity>
    </View>
  );
};

export default AddPatientProfileScreen;
