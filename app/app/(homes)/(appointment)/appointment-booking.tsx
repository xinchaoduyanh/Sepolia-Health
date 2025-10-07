import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import DatePicker from '@/components/DatePicker';
import TimePicker from '@/components/TimePicker';
import { BookingType, Doctor } from '@/types';

const doctors: Doctor[] = [
  { id: '1', name: 'Bác sĩ Lê Thị Thu Hằng', specialty: 'Da liễu' },
  { id: '2', name: 'Bác sĩ Nguyễn Văn A', specialty: 'Tim mạch' },
  { id: '3', name: 'Bác sĩ Trần Thị B', specialty: 'Mắt' },
];

export default function AppointmentBookingScreen() {
  const { specialtyId } = useLocalSearchParams();
  const [bookingType, setBookingType] = useState<BookingType>('specialty');
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('05/10/2025');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [reason, setReason] = useState('');
  const [characterCount, setCharacterCount] = useState(0);

  const handleBookingTypeChange = (type: BookingType) => {
    setBookingType(type);
  };

  const handleDoctorSelect = () => {
    // Navigate to doctor selection screen
    router.push('/appointment/doctor-selection' as any);
  };

  const handleSpecialtySelect = () => {
    router.push('/appointment/specialty-selection' as any);
  };

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
  };

  const handleReasonChange = (text: string) => {
    setReason(text);
    setCharacterCount(text.length);
  };

  const handleBookAppointment = () => {
    // Handle booking logic
    console.log('Booking appointment...');
  };

  const handleBack = () => {
    router.back();
  };

  const dates = [
    { date: '04/10/2025', label: 'Hôm nay', day: 'Thg 10 04' },
    { date: '05/10/2025', label: 'Ngày mai', day: 'Thg 10 05' },
    { date: '06/10/2025', label: 'Ngày kia', day: 'Thg 10 06' },
  ];

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="white" />

      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3">
        <TouchableOpacity onPress={handleBack}>
          <Ionicons name="close" size={24} color="#000" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-black">Đặt lịch hẹn</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
        {/* Booking Type Selection */}
        <View className="mb-6">
          <View className="flex-row space-x-2">
            <TouchableOpacity
              onPress={() => handleBookingTypeChange('doctor')}
              className={`flex-1 rounded-lg px-4 py-3 ${
                bookingType === 'doctor' ? 'bg-teal-500' : 'bg-gray-200'
              }`}>
              <Text
                className={`text-center font-medium ${
                  bookingType === 'doctor' ? 'text-white' : 'text-gray-600'
                }`}>
                Đặt lịch theo bác sĩ
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleBookingTypeChange('specialty')}
              className={`flex-1 rounded-lg px-4 py-3 ${
                bookingType === 'specialty' ? 'bg-teal-500' : 'bg-gray-200'
              }`}>
              <View className="flex-row items-center justify-center">
                <Text
                  className={`font-medium ${
                    bookingType === 'specialty' ? 'text-white' : 'text-gray-600'
                  }`}>
                  Đặt lịch theo chuyên khoa
                </Text>
                {bookingType === 'specialty' && (
                  <Ionicons name="checkmark" size={16} color="white" style={{ marginLeft: 4 }} />
                )}
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleBookingTypeChange('symptom')}
              className={`flex-1 rounded-lg px-4 py-3 ${
                bookingType === 'symptom' ? 'bg-teal-500' : 'bg-gray-200'
              }`}>
              <Text
                className={`text-center font-medium ${
                  bookingType === 'symptom' ? 'text-white' : 'text-gray-600'
                }`}>
                Đặt lịch theo triệu chứng
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Selected Filters */}
        <View className="mb-6 space-y-2">
          <TouchableOpacity
            onPress={handleSpecialtySelect}
            className="flex-row items-center rounded-lg bg-gray-100 px-3 py-3">
            <Ionicons name="briefcase" size={20} color="#000" />
            <Text className="ml-2 text-base text-black">* Da liễu</Text>
            <Ionicons name="close" size={20} color="#9CA3AF" style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleDoctorSelect}
            className="flex-row items-center rounded-lg bg-gray-100 px-3 py-3">
            <Ionicons name="person" size={20} color="#000" />
            <Text className="ml-2 text-base text-black">Bác sĩ Lê Thị Thu Hằng</Text>
            <Ionicons name="close" size={20} color="#9CA3AF" style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>
        </View>

        {/* Appointment Section */}
        <View className="mb-6">
          <View className="mb-4 flex-row items-center">
            <View className="mr-2 h-4 w-1 rounded-full bg-orange-500" />
            <Text className="text-lg font-bold text-black">Lịch hẹn</Text>
          </View>

          <Text className="mb-3 text-base font-semibold text-black">Ngày khám mong muốn*</Text>

          <View className="mb-4 flex-row space-x-3">
            {dates.map((dateItem) => (
              <TouchableOpacity
                key={dateItem.date}
                onPress={() => handleDateSelect(dateItem.date)}
                className={`flex-1 rounded-lg px-3 py-3 ${
                  selectedDate === dateItem.date ? 'bg-teal-500' : 'bg-gray-100'
                }`}>
                <Text
                  className={`text-center font-medium ${
                    selectedDate === dateItem.date ? 'text-white' : 'text-gray-600'
                  }`}>
                  {dateItem.day}
                </Text>
                <Text
                  className={`mt-1 text-center text-xs ${
                    selectedDate === dateItem.date ? 'text-white' : 'text-gray-500'
                  }`}>
                  {dateItem.label}
                </Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity className="h-12 w-12 items-center justify-center rounded-lg bg-gray-100">
              <Ionicons name="add" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          <Text className="mb-2 text-xs text-gray-500">Ngày khác</Text>
        </View>

        {/* Time Selection */}
        <View className="mb-6">
          <Text className="mb-3 text-base font-semibold text-black">Giờ khám mong muốn*</Text>

          <TimePicker
            selectedTime={selectedTime}
            onTimeSelect={setSelectedTime}
            placeholder="Chọn giờ khám"
            availableTimes={['09:00', '10:00', '11:00', '14:00', '15:00', '16:00']}
          />

          {!selectedTime && (
            <View className="mt-3 rounded-lg bg-gray-100 p-4">
              <Text className="text-sm text-gray-600">
                Hiện tại không có lịch trống ngày {selectedDate}.
              </Text>
            </View>
          )}

          <TouchableOpacity className="mt-2">
            <Text className="text-sm font-medium text-teal-500">
              Kiểm tra lịch 3 ngày tiếp theo
            </Text>
          </TouchableOpacity>
        </View>

        {/* Reason for Examination */}
        <View className="mb-8">
          <View className="mb-4 flex-row items-center">
            <View className="mr-2 h-4 w-1 rounded-full bg-orange-500" />
            <Text className="text-lg font-bold text-black">Lý do khám</Text>
          </View>

          <View className="rounded-lg bg-gray-100 p-3">
            <View className="flex-row items-start">
              <Ionicons name="create" size={20} color="#000" style={{ marginTop: 2 }} />
              <TextInput
                className="ml-2 flex-1 text-base text-black"
                placeholder="* Vui lòng mô tả rõ triệu chứng của bạn và nhu cầu thăm khám"
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={4}
                value={reason}
                onChangeText={handleReasonChange}
                maxLength={120}
              />
            </View>
            <View className="mt-2 flex-row justify-end">
              <Text className="text-xs text-gray-500">{characterCount}/120</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Book Appointment Button */}
      <View className="border-t border-gray-200 bg-white px-4 py-4">
        <TouchableOpacity
          onPress={handleBookAppointment}
          className="items-center rounded-lg bg-teal-500 py-4">
          <Text className="text-base font-semibold text-white">ĐẶT HẸN</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
