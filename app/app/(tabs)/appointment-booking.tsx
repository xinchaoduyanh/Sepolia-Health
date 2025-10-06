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
import { router, useLocalSearchParams } from 'expo-router';
import DatePicker from '../../components/DatePicker';
import TimePicker from '../../components/TimePicker';
import { BookingType, Doctor } from '../../types';

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
    router.push('/doctor-selection');
  };

  const handleSpecialtySelect = () => {
    router.push('/specialty-selection');
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
              className={`flex-1 py-3 px-4 rounded-lg ${
                bookingType === 'doctor' ? 'bg-teal-500' : 'bg-gray-200'
              }`}
            >
              <Text className={`text-center font-medium ${
                bookingType === 'doctor' ? 'text-white' : 'text-gray-600'
              }`}>
                Đặt lịch theo bác sĩ
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleBookingTypeChange('specialty')}
              className={`flex-1 py-3 px-4 rounded-lg ${
                bookingType === 'specialty' ? 'bg-teal-500' : 'bg-gray-200'
              }`}
            >
              <View className="flex-row items-center justify-center">
                <Text className={`font-medium ${
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
              className={`flex-1 py-3 px-4 rounded-lg ${
                bookingType === 'symptom' ? 'bg-teal-500' : 'bg-gray-200'
              }`}
            >
              <Text className={`text-center font-medium ${
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
            className="flex-row items-center bg-gray-100 rounded-lg px-3 py-3"
          >
            <Ionicons name="briefcase" size={20} color="#000" />
            <Text className="ml-2 text-base text-black">* Da liễu</Text>
            <Ionicons name="close" size={20} color="#9CA3AF" style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleDoctorSelect}
            className="flex-row items-center bg-gray-100 rounded-lg px-3 py-3"
          >
            <Ionicons name="person" size={20} color="#000" />
            <Text className="ml-2 text-base text-black">Bác sĩ Lê Thị Thu Hằng</Text>
            <Ionicons name="close" size={20} color="#9CA3AF" style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>
        </View>

        {/* Appointment Section */}
        <View className="mb-6">
          <View className="flex-row items-center mb-4">
            <View className="w-1 h-4 bg-orange-500 rounded-full mr-2" />
            <Text className="text-lg font-bold text-black">Lịch hẹn</Text>
          </View>

          <Text className="text-base font-semibold text-black mb-3">Ngày khám mong muốn*</Text>

          <View className="flex-row space-x-3 mb-4">
            {dates.map((dateItem) => (
              <TouchableOpacity
                key={dateItem.date}
                onPress={() => handleDateSelect(dateItem.date)}
                className={`flex-1 py-3 px-3 rounded-lg ${
                  selectedDate === dateItem.date ? 'bg-teal-500' : 'bg-gray-100'
                }`}
              >
                <Text className={`text-center font-medium ${
                  selectedDate === dateItem.date ? 'text-white' : 'text-gray-600'
                }`}>
                  {dateItem.day}
                </Text>
                <Text className={`text-center text-xs mt-1 ${
                  selectedDate === dateItem.date ? 'text-white' : 'text-gray-500'
                }`}>
                  {dateItem.label}
                </Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity className="w-12 h-12 bg-gray-100 rounded-lg items-center justify-center">
              <Ionicons name="add" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          <Text className="text-xs text-gray-500 mb-2">Ngày khác</Text>
        </View>

        {/* Time Selection */}
        <View className="mb-6">
          <Text className="text-base font-semibold text-black mb-3">Giờ khám mong muốn*</Text>

          <TimePicker
            selectedTime={selectedTime}
            onTimeSelect={setSelectedTime}
            placeholder="Chọn giờ khám"
            availableTimes={['09:00', '10:00', '11:00', '14:00', '15:00', '16:00']}
          />

          {!selectedTime && (
            <View className="bg-gray-100 rounded-lg p-4 mt-3">
              <Text className="text-sm text-gray-600">
                Hiện tại không có lịch trống ngày {selectedDate}.
              </Text>
            </View>
          )}

          <TouchableOpacity className="mt-2">
            <Text className="text-teal-500 text-sm font-medium">
              Kiểm tra lịch 3 ngày tiếp theo
            </Text>
          </TouchableOpacity>
        </View>

        {/* Reason for Examination */}
        <View className="mb-8">
          <View className="flex-row items-center mb-4">
            <View className="w-1 h-4 bg-orange-500 rounded-full mr-2" />
            <Text className="text-lg font-bold text-black">Lý do khám</Text>
          </View>

          <View className="bg-gray-100 rounded-lg p-3">
            <View className="flex-row items-start">
              <Ionicons name="create" size={20} color="#000" style={{ marginTop: 2 }} />
              <TextInput
                className="flex-1 ml-2 text-base text-black"
                placeholder="* Vui lòng mô tả rõ triệu chứng của bạn và nhu cầu thăm khám"
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={4}
                value={reason}
                onChangeText={handleReasonChange}
                maxLength={120}
              />
            </View>
            <View className="flex-row justify-end mt-2">
              <Text className="text-xs text-gray-500">{characterCount}/120</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Book Appointment Button */}
      <View className="px-4 py-4 bg-white border-t border-gray-200">
        <TouchableOpacity
          onPress={handleBookAppointment}
          className="bg-teal-500 rounded-lg py-4 items-center"
        >
          <Text className="text-white text-base font-semibold">ĐẶT HẸN</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
