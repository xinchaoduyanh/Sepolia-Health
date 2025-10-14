import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StatusBar,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAppointment } from '@/contexts/AppointmentContext';
import GenderSelector from '@/components/GenderSelector';
import BirthDatePicker from '@/components/BirthDatePicker';

export default function AppointmentScreen() {
  const [selectedCustomer, setSelectedCustomer] = useState<'me' | 'add'>('me');
  const [fullName, setFullName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState<Date | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('0988659126');
  const [gender, setGender] = useState<'MALE' | 'FEMALE' | 'OTHER' | null>(null);
  const [isForeigner, setIsForeigner] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<'morning' | 'afternoon'>('morning');
  const [reason, setReason] = useState('');
  const [characterCount, setCharacterCount] = useState(0);
  const [selectedDate, setSelectedDate] = useState<string>('05');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const { selectedSpecialty, selectedDoctor } = useAppointment();

  const handleSpecialtySelect = () => {
    router.push('/appointment/specialty-selection' as any);
  };

  const handleDoctorSelect = () => {
    if (selectedSpecialty) {
      router.push('/appointment/doctor-selection' as any);
    }
  };

  const handleReasonChange = (text: string) => {
    setReason(text);
    setCharacterCount(text.length);
  };

  const handleCustomDateSelect = () => {
    setShowDatePicker(true);
  };

  const handleDateSelect = (day: number) => {
    const dayStr = day.toString().padStart(2, '0');
    setSelectedDate(dayStr);
    setShowDatePicker(false);
  };

  const generateFutureDates = () => {
    const today = new Date();
    const dates = [];

    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push({
        day: date.getDate(),
        month: date.getMonth() + 1,
        year: date.getFullYear(),
        dayName: date.toLocaleDateString('vi-VN', { weekday: 'short' }),
      });
    }

    return dates;
  };

  const handleBookAppointment = () => {
    console.log('Booking appointment...');
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: '#F9FAFB' }}>
      <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Main Content */}
        <View className="px-5 py-6">
          {/* Chọn Khách hàng Section */}
          <View className="mb-8">
            <View className="mb-4 flex-row items-center">
              <View
                className="mr-2.5 h-5 w-1 rounded-full"
                style={{ backgroundColor: '#0284C7' }}
              />
              <Text className="text-lg font-bold" style={{ color: '#0F172A' }}>
                Chọn Khách hàng
              </Text>
            </View>

            <View className="flex-row space-x-6">
              <View className="items-center">
                <TouchableOpacity
                  onPress={() => setSelectedCustomer('me')}
                  className={`h-16 w-16 items-center justify-center rounded-full border-2 ${
                    selectedCustomer === 'me' ? 'border-[#0284C7]' : 'border-[#06B6D4]'
                  }`}>
                  <Ionicons
                    name="person"
                    size={32}
                    color={selectedCustomer === 'me' ? '#0284C7' : '#06B6D4'}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setSelectedCustomer('me')}
                  className={`mt-2 rounded-full px-4 py-2 ${
                    selectedCustomer === 'me' ? 'bg-[#0284C7]' : 'bg-[#E0F2FE]'
                  }`}>
                  <View className="flex-row items-center">
                    <Text
                      className={`font-medium ${
                        selectedCustomer === 'me' ? 'text-white' : 'text-[#475569]'
                      }`}>
                      Tôi
                    </Text>
                    {selectedCustomer === 'me' && (
                      <Ionicons
                        name="checkmark"
                        size={16}
                        color="white"
                        style={{ marginLeft: 4 }}
                      />
                    )}
                  </View>
                </TouchableOpacity>
              </View>

              <View className="items-center">
                <TouchableOpacity
                  onPress={() => setSelectedCustomer('add')}
                  className={`h-16 w-16 items-center justify-center rounded-full border-2 ${
                    selectedCustomer === 'add' ? 'border-[#0284C7]' : 'border-[#06B6D4]'
                  }`}>
                  <Ionicons
                    name="add"
                    size={32}
                    color={selectedCustomer === 'add' ? '#0284C7' : '#06B6D4'}
                  />
                </TouchableOpacity>
                <Text className="mt-2 text-sm" style={{ color: '#475569' }}>
                  Thêm
                </Text>
              </View>
            </View>
          </View>

          {/* Thông tin người đặt lịch Section */}
          <View className="mb-8">
            <Text className="mb-4 text-lg font-bold" style={{ color: '#0F172A' }}>
              Thông tin người đặt lịch
            </Text>

            <View className="space-y-6">
              <View>
                <View
                  className="flex-row items-center rounded-xl border px-5 py-4"
                  style={{ backgroundColor: '#F0FDFA', borderColor: '#E0F2FE' }}>
                  <Ionicons name="create" size={22} color="#0284C7" />
                  <TextInput
                    className="ml-4 flex-1 text-lg"
                    style={{ color: '#0F172A' }}
                    placeholder="* Họ tên đầy đủ"
                    placeholderTextColor="#475569"
                    value={fullName}
                    onChangeText={setFullName}
                  />
                </View>
              </View>

              <View>
                <BirthDatePicker
                  selectedDate={dateOfBirth}
                  onDateSelect={setDateOfBirth}
                  placeholder="* Ngày sinh"
                />
              </View>

              <View>
                <View
                  className="flex-row items-center rounded-xl border px-5 py-4"
                  style={{ backgroundColor: '#F0FDFA', borderColor: '#E0F2FE' }}>
                  <Ionicons name="call" size={22} color="#0284C7" />
                  <TextInput
                    className="ml-4 flex-1 text-lg"
                    style={{ color: '#0F172A' }}
                    placeholder="* 0988659126"
                    placeholderTextColor="#475569"
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    keyboardType="phone-pad"
                  />
                </View>
              </View>
            </View>

            {/* Gender Selection */}
            <View className="mt-8">
              <GenderSelector selectedGender={gender} onGenderSelect={setGender} />
            </View>
          </View>

          {/* Thông tin đặt hẹn Section */}
          <View className="mb-8">
            <View className="mb-4 flex-row items-center">
              <View
                className="mr-2.5 h-5 w-1 rounded-full"
                style={{ backgroundColor: '#10B981' }}
              />
              <Text className="text-lg font-bold" style={{ color: '#0F172A' }}>
                Thông tin đặt hẹn
              </Text>
            </View>

            <View className="space-y-6">
              <TouchableOpacity
                className="flex-row items-center rounded-xl border px-5 py-4"
                style={{ backgroundColor: '#F0FDFA', borderColor: '#E0F2FE' }}>
                <Ionicons name="business" size={22} color="#0284C7" />
                <Text className="ml-4 text-lg" style={{ color: '#0F172A' }}>
                  * Chọn địa điểm
                </Text>
                <Ionicons
                  name="chevron-down"
                  size={22}
                  color="#06B6D4"
                  style={{ marginLeft: 'auto' }}
                />
              </TouchableOpacity>

              {/* Chọn chuyên khoa */}
              <TouchableOpacity
                onPress={handleSpecialtySelect}
                className="flex-row items-center rounded-xl border px-5 py-4"
                style={{ backgroundColor: '#F0FDFA', borderColor: '#E0F2FE' }}>
                <Ionicons name="briefcase" size={22} color="#0284C7" />
                <Text className="ml-4 text-lg" style={{ color: '#0F172A' }}>
                  {selectedSpecialty ? selectedSpecialty : '* Chọn chuyên khoa'}
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={22}
                  color="#06B6D4"
                  style={{ marginLeft: 'auto' }}
                />
              </TouchableOpacity>

              {/* Chọn bác sĩ */}
              <TouchableOpacity
                onPress={handleDoctorSelect}
                disabled={!selectedSpecialty}
                className={`flex-row items-center rounded-xl border px-5 py-4 ${
                  selectedSpecialty ? 'border-[#E0F2FE]' : 'border-[#A7F3D0]'
                }`}
                style={{ backgroundColor: selectedSpecialty ? '#F0FDFA' : '#A7F3D0' }}>
                <Ionicons
                  name="person"
                  size={22}
                  color={selectedSpecialty ? '#0284C7' : '#06B6D4'}
                />
                <Text
                  className={`ml-4 text-lg ${
                    selectedSpecialty ? 'text-[#0F172A]' : 'text-[#475569]'
                  }`}>
                  {selectedDoctor ? selectedDoctor : '* Chọn bác sĩ'}
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={22}
                  color={selectedSpecialty ? '#06B6D4' : '#10B981'}
                  style={{ marginLeft: 'auto' }}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Lịch hẹn Section */}
          <View className="mb-8">
            <View className="mb-4 flex-row items-center">
              <View
                className="mr-2.5 h-5 w-1 rounded-full"
                style={{ backgroundColor: '#06B6D4' }}
              />
              <Text className="text-lg font-bold" style={{ color: '#0F172A' }}>
                Lịch hẹn
              </Text>
            </View>

            <Text className="mb-4 text-lg font-semibold" style={{ color: '#0F172A' }}>
              Ngày khám mong muốn*
            </Text>

            <View className="flex-row space-x-4">
              <TouchableOpacity
                onPress={() => setSelectedDate('04')}
                className={`flex-1 rounded-xl px-4 py-4 ${
                  selectedDate === '04' ? 'bg-[#0284C7]' : 'bg-[#F0FDFA]'
                }`}
                style={{
                  borderColor: selectedDate === '04' ? '#0284C7' : '#E0F2FE',
                  borderWidth: selectedDate === '04' ? 2 : 1,
                }}>
                <Text
                  className={`text-center text-base font-medium ${
                    selectedDate === '04' ? 'text-white' : 'text-[#475569]'
                  }`}>
                  Thg 10
                </Text>
                <Text
                  className={`mt-1 text-center text-sm ${
                    selectedDate === '04' ? 'text-blue-100' : 'text-[#475569]'
                  }`}>
                  04
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setSelectedDate('05')}
                className={`flex-1 rounded-xl px-4 py-4 ${
                  selectedDate === '05' ? 'bg-[#0284C7]' : 'bg-[#F0FDFA]'
                }`}
                style={{
                  borderColor: selectedDate === '05' ? '#0284C7' : '#E0F2FE',
                  borderWidth: selectedDate === '05' ? 2 : 1,
                }}>
                <Text
                  className={`text-center text-base font-medium ${
                    selectedDate === '05' ? 'text-white' : 'text-[#475569]'
                  }`}>
                  Thg 10
                </Text>
                <Text
                  className={`mt-1 text-center text-sm ${
                    selectedDate === '05' ? 'text-blue-100' : 'text-[#475569]'
                  }`}>
                  05
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setSelectedDate('06')}
                className={`flex-1 rounded-xl px-4 py-4 ${
                  selectedDate === '06' ? 'bg-[#0284C7]' : 'bg-[#F0FDFA]'
                }`}
                style={{
                  borderColor: selectedDate === '06' ? '#0284C7' : '#E0F2FE',
                  borderWidth: selectedDate === '06' ? 2 : 1,
                }}>
                <Text
                  className={`text-center text-base font-medium ${
                    selectedDate === '06' ? 'text-white' : 'text-[#475569]'
                  }`}>
                  Thg 10
                </Text>
                <Text
                  className={`mt-1 text-center text-sm ${
                    selectedDate === '06' ? 'text-blue-100' : 'text-[#475569]'
                  }`}>
                  06
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleCustomDateSelect}
                className="h-16 w-16 items-center justify-center rounded-xl"
                style={{ backgroundColor: '#F0FDFA', borderColor: '#E0F2FE', borderWidth: 1 }}>
                <Ionicons name="add" size={24} color="#06B6D4" />
              </TouchableOpacity>
            </View>

            {/* Thời gian khám */}
            <Text className="mb-4 mt-8 text-lg font-semibold" style={{ color: '#0F172A' }}>
              Thời gian khám*
            </Text>

            <View className="flex-row space-x-4">
              <TouchableOpacity
                onPress={() => setSelectedTimeSlot('morning')}
                className={`flex-1 rounded-xl border-2 px-5 py-4 ${
                  selectedTimeSlot === 'morning' ? 'border-[#0284C7]' : 'border-[#E0F2FE]'
                }`}
                style={{ backgroundColor: selectedTimeSlot === 'morning' ? '#E0F2FE' : '#F0FDFA' }}>
                <View className="flex-row items-center justify-center">
                  <Ionicons
                    name="sunny"
                    size={22}
                    color={selectedTimeSlot === 'morning' ? '#0284C7' : '#06B6D4'}
                  />
                  <Text
                    className={`ml-3 text-lg font-medium ${
                      selectedTimeSlot === 'morning' ? 'text-[#0284C7]' : 'text-[#475569]'
                    }`}>
                    Buổi sáng
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setSelectedTimeSlot('afternoon')}
                className={`flex-1 rounded-xl border-2 px-5 py-4 ${
                  selectedTimeSlot === 'afternoon' ? 'border-[#0284C7]' : 'border-[#E0F2FE]'
                }`}
                style={{
                  backgroundColor: selectedTimeSlot === 'afternoon' ? '#E0F2FE' : '#F0FDFA',
                }}>
                <View className="flex-row items-center justify-center">
                  <Ionicons
                    name="moon"
                    size={22}
                    color={selectedTimeSlot === 'afternoon' ? '#0284C7' : '#06B6D4'}
                  />
                  <Text
                    className={`ml-3 text-lg font-medium ${
                      selectedTimeSlot === 'afternoon' ? 'text-[#0284C7]' : 'text-[#475569]'
                    }`}>
                    Buổi chiều
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Lý do khám */}
            <View className="mt-8">
              <View className="mb-4 flex-row items-center">
                <View
                  className="mr-2 h-4 w-1 rounded-full"
                  style={{ backgroundColor: '#10B981' }}
                />
                <Text className="text-lg font-bold" style={{ color: '#0F172A' }}>
                  Lý do khám
                </Text>
              </View>

              <View
                className="rounded-xl border p-5"
                style={{ backgroundColor: '#F0FDFA', borderColor: '#E0F2FE' }}>
                <View className="flex-row items-start">
                  <Ionicons name="create" size={22} color="#0284C7" style={{ marginTop: 2 }} />
                  <TextInput
                    className="ml-4 flex-1 text-lg"
                    style={{ color: '#0F172A' }}
                    placeholder="* Vui lòng mô tả rõ triệu chứng của bạn và nhu cầu thăm khám"
                    placeholderTextColor="#475569"
                    multiline
                    numberOfLines={4}
                    value={reason}
                    onChangeText={handleReasonChange}
                    maxLength={120}
                  />
                </View>
                <View className="mt-3 flex-row justify-end">
                  <Text className="text-sm" style={{ color: '#0284C7' }}>
                    {characterCount}/120
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Book Appointment Button */}
      <View
        className="px-5 py-4"
        style={{ backgroundColor: '#F0FDFA', borderTopColor: '#E0F2FE', borderTopWidth: 1 }}>
        <TouchableOpacity
          onPress={handleBookAppointment}
          className="items-center rounded-xl py-4"
          style={{
            backgroundColor: '#0284C7',
            shadowColor: '#0284C7',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.2,
            shadowRadius: 8,
            elevation: 4,
          }}>
          <Text className="text-base font-bold text-white">ĐẶT HẸN</Text>
        </TouchableOpacity>
      </View>

      {/* Date Picker Modal */}
      {showDatePicker && (
        <Modal
          transparent={true}
          animationType="slide"
          visible={showDatePicker}
          onRequestClose={() => setShowDatePicker(false)}>
          <View className="flex-1 justify-end bg-black/50">
            <View className="max-h-96 rounded-t-3xl p-6" style={{ backgroundColor: '#F0FDFA' }}>
              <View className="mb-4 flex-row items-center justify-between">
                <Text className="text-lg font-bold" style={{ color: '#0F172A' }}>
                  Chọn ngày khám
                </Text>
                <TouchableOpacity
                  onPress={() => setShowDatePicker(false)}
                  className="h-8 w-8 items-center justify-center rounded-full"
                  style={{ backgroundColor: '#E0F2FE' }}>
                  <Ionicons name="close" size={20} color="#06B6D4" />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                <View className="flex-row flex-wrap gap-3">
                  {generateFutureDates().map((date, index) => (
                    <TouchableOpacity
                      key={index}
                      onPress={() => handleDateSelect(date.day)}
                      className={`w-20 rounded-xl border-2 px-2 py-3 ${
                        selectedDate === date.day.toString().padStart(2, '0')
                          ? 'border-[#0284C7]'
                          : 'border-[#E0F2FE]'
                      }`}
                      style={{
                        backgroundColor:
                          selectedDate === date.day.toString().padStart(2, '0')
                            ? '#E0F2FE'
                            : '#F9FAFB',
                      }}>
                      <Text
                        className={`text-center text-sm font-medium ${
                          selectedDate === date.day.toString().padStart(2, '0')
                            ? 'text-[#0284C7]'
                            : 'text-[#475569]'
                        }`}>
                        {date.dayName}
                      </Text>
                      <Text
                        className={`mt-1 text-center text-lg font-bold ${
                          selectedDate === date.day.toString().padStart(2, '0')
                            ? 'text-[#0284C7]'
                            : 'text-[#0F172A]'
                        }`}>
                        {date.day}
                      </Text>
                      <Text
                        className={`text-center text-xs ${
                          selectedDate === date.day.toString().padStart(2, '0')
                            ? 'text-[#0284C7]'
                            : 'text-[#475569]'
                        }`}>
                        Thg {date.month}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              <View className="mt-4 rounded-xl p-3" style={{ backgroundColor: '#E0F2FE' }}>
                <View className="flex-row items-center">
                  <Ionicons name="information-circle" size={20} color="#0284C7" />
                  <Text className="ml-2 text-sm" style={{ color: '#0284C7' }}>
                    Chỉ có thể chọn ngày trong tương lai
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}
