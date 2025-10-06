import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import DatePicker from '../../components/DatePicker';
import { Gender, CustomerType } from '../../types';

export default function CustomerInfoScreen() {
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerType>('me');
  const [fullName, setFullName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('0988659126');
  const [gender, setGender] = useState<Gender>('male');
  const [isForeigner, setIsForeigner] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');

  const handleCustomerSelect = (type: CustomerType) => {
    setSelectedCustomer(type);
  };

  const handleGenderSelect = (selectedGender: Gender) => {
    setGender(selectedGender);
  };

  const handleContinue = () => {
    // Navigate to appointment booking screen
    router.push('/appointment-booking');
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="white" />

      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3">
        <TouchableOpacity onPress={handleBack}>
          <Ionicons name="close" size={24} color="#000" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-black">Thông tin khách hàng</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
        {/* Customer Selection */}
        <View className="mb-6">
          <View className="flex-row items-center mb-4">
            <View className="w-1 h-4 bg-orange-500 rounded-full mr-2" />
            <Text className="text-lg font-bold text-black">Chọn Khách hàng</Text>
          </View>

          <View className="flex-row space-x-6">
            <View className="items-center">
              <TouchableOpacity
                onPress={() => handleCustomerSelect('me')}
                className={`w-16 h-16 rounded-full border-2 items-center justify-center ${
                  selectedCustomer === 'me' ? 'border-teal-500' : 'border-blue-300'
                }`}
              >
                <Ionicons
                  name="person"
                  size={32}
                  color={selectedCustomer === 'me' ? '#14B8A6' : '#93C5FD'}
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleCustomerSelect('me')}
                className={`mt-2 px-4 py-2 rounded-full ${
                  selectedCustomer === 'me' ? 'bg-teal-500' : 'bg-gray-200'
                }`}
              >
                <View className="flex-row items-center">
                  <Text className={`font-medium ${
                    selectedCustomer === 'me' ? 'text-white' : 'text-gray-600'
                  }`}>
                    Tôi
                  </Text>
                  {selectedCustomer === 'me' && (
                    <Ionicons name="checkmark" size={16} color="white" style={{ marginLeft: 4 }} />
                  )}
                </View>
              </TouchableOpacity>
            </View>

            <View className="items-center">
              <TouchableOpacity
                onPress={() => handleCustomerSelect('add')}
                className={`w-16 h-16 rounded-full border-2 items-center justify-center ${
                  selectedCustomer === 'add' ? 'border-teal-500' : 'border-blue-300'
                }`}
              >
                <Ionicons
                  name="add"
                  size={32}
                  color={selectedCustomer === 'add' ? '#14B8A6' : '#93C5FD'}
                />
              </TouchableOpacity>
              <Text className="mt-2 text-sm text-gray-600">Thêm</Text>
            </View>
          </View>
        </View>

        {/* Appointment Booker Information */}
        <View className="mb-6">
          <Text className="text-lg font-bold text-black mb-4">Thông tin người đặt lịch</Text>

          <View className="space-y-4">
            <View>
              <View className="flex-row items-center bg-gray-100 rounded-lg px-3 py-3">
                <Ionicons name="create" size={20} color="#000" />
                <TextInput
                  className="flex-1 ml-2 text-base text-black"
                  placeholder="* Họ tên đầy đủ"
                  placeholderTextColor="#9CA3AF"
                  value={fullName}
                  onChangeText={setFullName}
                />
              </View>
            </View>

            <View>
              <DatePicker
                selectedDate={dateOfBirth}
                onDateSelect={setDateOfBirth}
                placeholder="* Ngày sinh"
              />
            </View>

            <View>
              <View className="flex-row items-center bg-gray-100 rounded-lg px-3 py-3">
                <Ionicons name="call" size={20} color="#000" />
                <TextInput
                  className="flex-1 ml-2 text-base text-black"
                  placeholder="* 0988659126"
                  placeholderTextColor="#9CA3AF"
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  keyboardType="phone-pad"
                />
              </View>
            </View>
          </View>
        </View>

        {/* Gender Selection */}
        <View className="mb-6">
          <Text className="text-base font-bold text-black mb-3">Giới tính *</Text>

          <View className="flex-row space-x-4">
            <TouchableOpacity
              onPress={() => handleGenderSelect('male')}
              className={`flex-1 flex-row items-center justify-center py-3 px-4 rounded-lg border-2 ${
                gender === 'male' ? 'border-teal-500 bg-teal-50' : 'border-gray-300'
              }`}
            >
              <Ionicons
                name="male"
                size={20}
                color={gender === 'male' ? '#14B8A6' : '#9CA3AF'}
              />
              <Text className={`ml-2 font-medium ${
                gender === 'male' ? 'text-teal-600' : 'text-gray-600'
              }`}>
                Nam
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleGenderSelect('female')}
              className={`flex-1 flex-row items-center justify-center py-3 px-4 rounded-lg border-2 ${
                gender === 'female' ? 'border-teal-500 bg-teal-50' : 'border-gray-300'
              }`}
            >
              <Ionicons
                name="female"
                size={20}
                color={gender === 'female' ? '#14B8A6' : '#9CA3AF'}
              />
              <Text className={`ml-2 font-medium ${
                gender === 'female' ? 'text-teal-600' : 'text-gray-600'
              }`}>
                Nữ
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Foreigner Checkbox */}
        <View className="mb-6">
          <TouchableOpacity
            onPress={() => setIsForeigner(!isForeigner)}
            className="flex-row items-center"
          >
            <View className={`w-5 h-5 rounded border-2 items-center justify-center mr-3 ${
              isForeigner ? 'border-teal-500 bg-teal-500' : 'border-gray-300'
            }`}>
              {isForeigner && (
                <Ionicons name="checkmark" size={14} color="white" />
              )}
            </View>
            <Text className="text-base text-black">Đặt hẹn cho người nước ngoài</Text>
          </TouchableOpacity>
        </View>

        {/* Appointment Information */}
        <View className="mb-6">
          <View className="flex-row items-center mb-4">
            <View className="w-1 h-4 bg-orange-500 rounded-full mr-2" />
            <Text className="text-lg font-bold text-black">Thông tin đặt hẹn</Text>
          </View>

          <TouchableOpacity className="flex-row items-center bg-gray-100 rounded-lg px-3 py-3">
            <Ionicons name="business" size={20} color="#000" />
            <Text className="ml-2 text-base text-black">* Chọn địa điểm</Text>
            <Ionicons name="chevron-down" size={20} color="#9CA3AF" style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>
        </View>

        {/* Appointment Schedule */}
        <View className="mb-8">
          <View className="flex-row items-center mb-4">
            <View className="w-1 h-4 bg-orange-500 rounded-full mr-2" />
            <Text className="text-lg font-bold text-black">Lịch hẹn</Text>
          </View>

          <Text className="text-base font-semibold text-black mb-3">Ngày khám mong muốn*</Text>

          <DatePicker
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
            placeholder="Chọn ngày khám"
          />
        </View>
      </ScrollView>

      {/* Continue Button */}
      <View className="px-4 py-4 bg-white border-t border-gray-200">
        <TouchableOpacity
          onPress={handleContinue}
          className="bg-teal-500 rounded-lg py-4 items-center"
        >
          <Text className="text-white text-base font-semibold">Tiếp tục</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
