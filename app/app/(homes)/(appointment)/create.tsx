import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StatusBar,
  Modal,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAppointment } from '@/contexts/AppointmentContext';
import GenderSelector from '@/components/GenderSelector';
import BirthDatePicker from '@/components/BirthDatePicker';
import TimeSlotPicker from '@/components/TimeSlotPicker';
import { useAuth } from '@/lib/hooks/useAuth';
import { PatientProfile } from '@/types/auth';
import { getRelationshipLabel } from '@/utils/relationshipTranslator';
import { useDoctorAvailability, useCreateAppointment } from '@/lib/api/appointments';
import { createISODateTime, getTodayDateString } from '@/utils/datetime';
import { userApi } from '@/lib/api';
import { Relationship } from '@/constants/enum';

export default function AppointmentScreen() {
  const { user } = useAuth();
  
  // Get patient profiles
  const patientProfiles = user?.patientProfiles || [];
  const primaryProfile = patientProfiles.find((profile) => profile.relationship === 'SELF');
  const otherProfiles = patientProfiles.filter((profile) => profile.relationship !== 'SELF');
  
  const [selectedProfile, setSelectedProfile] = useState<PatientProfile>(primaryProfile!);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdAppointmentId, setCreatedAppointmentId] = useState<number | null>(null);
  const [selectedCustomDate, setSelectedCustomDate] = useState<Date | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const {
    selectedDoctor,
    selectedFacility,
    selectedService,
    selectedTimeSlot,
    setSelectedTimeSlot,
    selectedDoctorServiceId,
    // Patient form fields from context (for persistence across navigation)
    selectedCustomer,
    setSelectedCustomer,
    firstName,
    setFirstName,
    lastName,
    setLastName,
    dateOfBirth,
    setDateOfBirth,
    phoneNumber,
    setPhoneNumber,
    gender,
    setGender,
    patientDescription,
    setPatientDescription,
  } = useAppointment();

  // Auto-fill user info when component mounts (default to "Bản thân")
  useEffect(() => {
    if (user && selectedCustomer === 'me' && primaryProfile) {
      setSelectedProfile(primaryProfile); // Set profile ID for appointment
      setFirstName(primaryProfile.firstName);
      setLastName(primaryProfile.lastName);
      setDateOfBirth(new Date(primaryProfile.dateOfBirth));
      setPhoneNumber(primaryProfile.phone);
      setGender(primaryProfile.gender === 'OTHER' ? null : primaryProfile.gender);
    }
  }, [user, selectedCustomer, primaryProfile]);

  const { data: availabilityData, error: availabilityError } = useDoctorAvailability(
    selectedDoctorServiceId || 0,
    selectedDate || getTodayDateString()
  );

  // Check if doctor is not available (no time slots)
  const isDoctorNotAvailable = availabilityData && availabilityData.availableTimeSlots.length === 0;

  // API call để tạo appointment
  const createAppointmentMutation = useCreateAppointment();

  const handleCustomerSelect = (customerId: string, profile?: PatientProfile) => {
    setSelectedCustomer(customerId);

    if (profile) {
      // Auto-fill form with profile data
      setSelectedProfile(profile);
      setFirstName(profile.firstName);
      setLastName(profile.lastName);
      setDateOfBirth(new Date(profile.dateOfBirth));
      setPhoneNumber(profile.phone);
      setGender(profile.gender === 'OTHER' ? null : profile.gender);
    } else if (customerId === 'add') {
      // Clear form for new customer (profile will be created on booking)
      setSelectedProfile(primaryProfile!);
      setFirstName('');
      setLastName('');
      setDateOfBirth(null);
      setPhoneNumber('');
      setGender(null);
      setPatientDescription('');
    } else if (customerId === 'me' && primaryProfile) {
      // Set primary profile for "me"
      setSelectedProfile(primaryProfile);
      setPatientDescription('');
    }
  };

  const handleFacilitySelect = () => {
    router.push('./facility-selection');
  };

  const handleServiceSelect = () => {
    if (selectedFacility) {
      router.push('./service-selection');
    }
  };

  const handleDoctorSelect = () => {
    if (selectedFacility && selectedService) {
      router.push('./doctor-selection');
    }
  };

  const handleTimeSlotSelect = (time: string) => {
    setSelectedTimeSlot(time);
  };

  const handleCustomDateConfirm = (date: Date) => {
    setSelectedCustomDate(date);
    // Format ngày theo local timezone để tránh lùi 1 ngày
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    setSelectedDate(`${year}-${month}-${day}`);
    setShowDatePicker(false);
  };

  const handlePresetDateSelect = (date: any) => {
    // Clear custom date selection
    setSelectedCustomDate(null);
    // Set preset date
    setSelectedDate(date.fullDate);
  };

  const handleCustomDatePress = () => {
    if (selectedCustomDate) {
      // Nếu đã chọn custom date, hiển thị lại date picker để đổi
      setShowDatePicker(true);
    } else {
      // Nếu chưa chọn, mở date picker
      setShowDatePicker(true);
    }
  };

  const generateFutureDates = () => {
    const today = new Date();
    const dates = [];

    // Tạo 30 ngày bắt đầu từ hôm nay
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push({
        day: date.getDate(),
        month: date.getMonth() + 1,
        year: date.getFullYear(),
        dayName: date.toLocaleDateString('vi-VN', { weekday: 'long' }),
        fullDate: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`, // YYYY-MM-DD format
        isToday: i === 0,
      });
    }

    return dates;
  };

  const handleBookAppointment = async () => {
    // Validate required fields
    if (!selectedFacility || !selectedService || !selectedDoctor || !selectedTimeSlot || !selectedDate || !selectedDoctorServiceId) {
      alert('Vui lòng điền đầy đủ thông tin đặt hẹn');
      return;
    }

    if (!firstName || !lastName || !dateOfBirth || !phoneNumber || !gender) {
      alert('Vui lòng điền đầy đủ thông tin khách hàng');
      return;
    }

    if (selectedCustomer === 'add') {
      const profileData = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        dateOfBirth: dateOfBirth!.toISOString(),
        gender: gender!,
        phone: phoneNumber.trim(),
        relationship: Relationship.OTHER,
      };
      const res = await userApi.createPatientProfile(profileData);
      setSelectedProfile(res.profile);
      // Update selectedCustomer to prevent duplicate profile creation
      setSelectedCustomer(`profile-${res.profile.id}`);
    }

    try {
      // Create ISO datetime strings using utility function
      const appointmentDate = selectedDate;
      const startTime = createISODateTime(appointmentDate, selectedTimeSlot);
      
      // Calculate end datetime based on service duration (in minutes)
      const serviceDuration = selectedService.duration ;
      const startDateTime = new Date(startTime);
      const endDateTime = new Date(startDateTime.getTime() + serviceDuration * 60 * 1000);
      const endTime = endDateTime.toISOString();

      const appointmentData = {
        doctorServiceId: selectedDoctorServiceId,
        patientProfileId: selectedProfile.id,
        startTime,
        endTime,
        notes: patientDescription,
      };

      const result = await createAppointmentMutation.mutateAsync(appointmentData);

      // Lưu appointment ID để sử dụng trong modal
      setCreatedAppointmentId(result.id);

      // Hiển thị success modal
      setShowSuccessModal(true);
    } catch (error: any) {
      // Handle different error types
      let errorMessage = 'Có lỗi xảy ra khi đặt lịch. Vui lòng thử lại.';

      if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      }

      alert(errorMessage);
    }
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: '#E0F2FE' }}>
      <StatusBar barStyle="dark-content" backgroundColor="#E0F2FE" />

      {/* Header */}
      <View className="flex-row items-center px-4 py-3">
        <TouchableOpacity onPress={() => router.push('/(homes)/(appointment)')}>
          <Ionicons name="arrow-back" size={24} color="#0284C7" />
        </TouchableOpacity>
      </View>

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

            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
              <View className="flex-row space-x-4">
                {/* Primary Profile (Tôi) */}
                {primaryProfile && (
                  <View className="items-center">
                    <TouchableOpacity
                      onPress={() => handleCustomerSelect('me', primaryProfile)}
                      className={`h-16 w-16 items-center justify-center rounded-full border-2 ${
                        selectedCustomer === 'me' ? 'border-[#0284C7]' : 'border-[#06B6D4]'
                      }`}>
                      {primaryProfile.avatar ? (
                        <Image
                          source={{ uri: primaryProfile.avatar }}
                          className="h-full w-full rounded-full"
                        />
                      ) : (
                        <Ionicons
                          name="person"
                          size={32}
                          color={selectedCustomer === 'me' ? '#0284C7' : '#06B6D4'}
                        />
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleCustomerSelect('me', primaryProfile)}
                      className={`mt-2 rounded-full px-4 py-2 ${
                        selectedCustomer === 'me' ? 'bg-[#0284C7]' : 'bg-[#E0F2FE]'
                      }`}>
                      <View className="flex-row items-center">
                        <Text
                          className={`font-medium ${
                            selectedCustomer === 'me' ? 'text-white' : 'text-[#475569]'
                          }`}>
                          Bản thân
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
                )}

                {/* Other Patient Profiles */}
                {otherProfiles.map((profile) => (
                  <View key={profile.id} className="items-center">
                    <TouchableOpacity
                      onPress={() => handleCustomerSelect(`profile-${profile.id}`, profile)}
                      className={`h-16 w-16 items-center justify-center rounded-full border-2 ${
                        selectedCustomer === `profile-${profile.id}`
                          ? 'border-[#0284C7]'
                          : 'border-[#06B6D4]'
                      }`}>
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
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleCustomerSelect(`profile-${profile.id}`, profile)}
                      className={`mt-2 rounded-full px-4 py-2 ${
                        selectedCustomer === `profile-${profile.id}`
                          ? 'bg-[#0284C7]'
                          : 'bg-[#E0F2FE]'
                      }`}>
                      <View className="flex-row items-center">
                        <Text
                          className={`font-medium ${
                            selectedCustomer === `profile-${profile.id}`
                              ? 'text-white'
                              : 'text-[#475569]'
                          }`}>
                          {getRelationshipLabel(profile.relationship) || profile.firstName}
                        </Text>
                        {selectedCustomer === `profile-${profile.id}` && (
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
                ))}

                {/* Add New Profile */}
                <View className="items-center">
                  <TouchableOpacity
                    onPress={() => handleCustomerSelect('add')}
                    className={`h-16 w-16 items-center justify-center rounded-full border-2 ${
                      selectedCustomer === 'add' ? 'border-[#0284C7]' : 'border-[#06B6D4]'
                    }`}>
                    <Ionicons
                      name="person-add"
                      size={32}
                      color={selectedCustomer === 'add' ? '#0284C7' : '#06B6D4'}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleCustomerSelect('add')}
                    className={`mt-2 rounded-full px-4 py-2 ${
                      selectedCustomer === 'add' ? 'bg-[#0284C7]' : 'bg-[#E0F2FE]'
                    }`}>
                    <View className="flex-row items-center">
                      <Text
                        className={`font-medium ${
                          selectedCustomer === 'add' ? 'text-white' : 'text-[#475569]'
                        }`}>
                        Thêm mới
                      </Text>
                      {selectedCustomer === 'add' && (
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
              </View>
            </ScrollView>
          </View>

          {/* Thông tin người đặt lịch Section */}
          <View className="mb-8">
            <Text className="mb-4 text-lg font-bold" style={{ color: '#0F172A' }}>
              Thông tin người đặt lịch
            </Text>

            <View className="gap-3">
              <View>
                <View
                  className="flex-row items-center rounded-xl border px-5 py-4"
                  style={{ backgroundColor: '#F0FDFA', borderColor: '#E0F2FE' }}>
                  <Ionicons name="create" size={22} color="#0284C7" />
                  <TextInput
                    className="ml-4 flex-1 text-lg"
                    style={{
                      color: selectedCustomer === 'add' ? '#0F172A' : '#9CA3AF',
                    }}
                    placeholder="* Họ"
                    placeholderTextColor="#475569"
                    value={lastName}
                    onChangeText={setLastName}
                    editable={selectedCustomer === 'add'}
                  />
                </View>
              </View>

              <View>
                <View
                  className="flex-row items-center rounded-xl border px-5 py-4"
                  style={{ backgroundColor: '#F0FDFA', borderColor: '#E0F2FE' }}>
                  <Ionicons name="create" size={22} color="#0284C7" />
                  <TextInput
                    className="ml-4 flex-1 text-lg"
                    style={{
                      color: selectedCustomer === 'add' ? '#0F172A' : '#9CA3AF',
                    }}
                    placeholder="* Tên"
                    placeholderTextColor="#475569"
                    value={firstName}
                    onChangeText={setFirstName}
                    editable={selectedCustomer === 'add'}
                  />
                </View>
              </View>

              <View>
                <BirthDatePicker
                  selectedDate={dateOfBirth}
                  onDateSelect={setDateOfBirth}
                  placeholder="* Ngày sinh"
                  disabled={selectedCustomer !== 'add'}
                />
              </View>

              <View>
                <View
                  className="flex-row items-center rounded-xl border px-5 py-4"
                  style={{ backgroundColor: '#F0FDFA', borderColor: '#E0F2FE' }}>
                  <Ionicons name="call" size={22} color="#0284C7" />
                  <TextInput
                    className="ml-4 flex-1 text-lg"
                    style={{
                      color: selectedCustomer === 'add' ? '#0F172A' : '#9CA3AF',
                    }}
                    placeholder="* 0988659126"
                    placeholderTextColor="#475569"
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    keyboardType="phone-pad"
                    editable={selectedCustomer === 'add'}
                  />
                </View>
              </View>
            </View>

            {/* Gender Selection */}
            <View className="mt-8">
              <GenderSelector
                selectedGender={gender}
                onGenderSelect={setGender}
                disabled={selectedCustomer !== 'add'}
              />
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
                activeOpacity={0.7}
                onPress={handleFacilitySelect}
                className="flex-row items-center rounded-xl border px-5 py-4"
                style={{ backgroundColor: '#F0FDFA', borderColor: '#E0F2FE' }}>
                <Ionicons name="business" size={22} color="#0284C7" />
                <Text className="ml-4 text-lg" style={{ color: '#0F172A' }}>
                  {selectedFacility ? selectedFacility.name : '* Chọn cơ sở'}
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={22}
                  color="#06B6D4"
                  style={{ marginLeft: 'auto' }}
                />
              </TouchableOpacity>

              {/* Chọn dịch vụ */}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={handleServiceSelect}
                disabled={!selectedFacility}
                className={`flex-row items-center rounded-xl border px-5 py-4 ${
                  selectedFacility ? 'border-[#E0F2FE]' : 'border-[#D1D5DB]'
                }`}
                style={{
                  backgroundColor: selectedFacility ? '#F0FDFA' : '#F9FAFB',
                  opacity: selectedFacility ? 1 : 0.6,
                }}>
                <Ionicons
                  name="medical"
                  size={22}
                  color={selectedFacility ? '#0284C7' : '#9CA3AF'}
                />
                <Text
                  className={`ml-4 text-lg font-medium ${
                    selectedFacility ? 'text-[#0F172A]' : 'text-[#9CA3AF]'
                  }`}>
                  {selectedService ? selectedService.name : '* Chọn dịch vụ'}
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={22}
                  color={selectedFacility ? '#06B6D4' : '#9CA3AF'}
                  style={{ marginLeft: 'auto' }}
                />
              </TouchableOpacity>

              {/* Chọn bác sĩ */}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={handleDoctorSelect}
                disabled={!selectedFacility || !selectedService}
                className={`flex-row items-center rounded-xl border px-5 py-4 ${
                  selectedFacility && selectedService ? 'border-[#E0F2FE]' : 'border-[#D1D5DB]'
                }`}
                style={{
                  backgroundColor: selectedFacility && selectedService ? '#F0FDFA' : '#F9FAFB',
                  opacity: selectedFacility && selectedService ? 1 : 0.6,
                }}>
                <Ionicons
                  name="person"
                  size={22}
                  color={selectedFacility && selectedService ? '#0284C7' : '#9CA3AF'}
                />
                <Text
                  className={`ml-4 text-lg font-medium ${
                    selectedFacility && selectedService ? 'text-[#0F172A]' : 'text-[#9CA3AF]'
                  }`}>
                  {selectedDoctor ? selectedDoctor : '* Chọn bác sĩ'}
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={22}
                  color={selectedFacility && selectedService ? '#06B6D4' : '#9CA3AF'}
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
              {generateFutureDates()
                .slice(0, 3)
                .map((date, index) => (
                  <TouchableOpacity
                    key={index}
                    activeOpacity={0.7}
                    onPress={() => handlePresetDateSelect(date)}
                    className={`flex-1 rounded-xl px-4 py-4 ${
                      selectedDate === date.fullDate ? 'bg-[#0284C7]' : 'bg-[#F0FDFA]'
                    }`}
                    style={{
                      borderColor: selectedDate === date.fullDate ? '#0284C7' : '#E0F2FE',
                      borderWidth: selectedDate === date.fullDate ? 2 : 1,
                    }}>
                    <Text
                      className={`text-center text-base font-medium ${
                        selectedDate === date.fullDate ? 'text-white' : 'text-[#475569]'
                      }`}>
                      {date.dayName} {date.day}/{date.month}
                    </Text>
                    <Text
                      className={`mt-1 text-center text-sm ${
                        selectedDate === date.fullDate ? 'text-blue-100' : 'text-[#475569]'
                      }`}>
                      {index === 0
                        ? 'Hôm nay'
                        : index === 1
                          ? 'Ngày mai'
                          : index === 2
                            ? 'Ngày kia'
                            : ''}
                    </Text>
                  </TouchableOpacity>
                ))}

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={handleCustomDatePress}
                className="flex-1 items-center justify-center rounded-xl px-4 py-4"
                style={{
                  backgroundColor: selectedCustomDate ? '#0284C7' : '#F0FDFA',
                  borderColor: selectedCustomDate ? '#0284C7' : '#E0F2FE',
                  borderWidth: selectedCustomDate ? 2 : 1,
                }}>
                {selectedCustomDate ? (
                  <View className="items-center">
                    <Text className="text-xs font-medium text-white">
                      {selectedCustomDate.toLocaleDateString('vi-VN', { weekday: 'short' })}
                    </Text>
                    <Text className="text-lg font-bold text-white">
                      {selectedCustomDate.getDate()}
                    </Text>
                    <Text className="text-xs font-medium text-white">
                      {selectedCustomDate.toLocaleDateString('vi-VN', { month: 'short' })}
                    </Text>
                  </View>
                ) : (
                  <Ionicons name="add" size={24} color="#06B6D4" />
                )}
              </TouchableOpacity>
            </View>

            {/* Chọn thời gian - chỉ hiển thị khi đã chọn ngày */}
            {selectedDate && (
              <View>
                {/* Time Slots - chỉ hiển thị khi đã chọn đủ thông tin và có ngày */}
                { selectedFacility &&
                  selectedService &&
                  selectedDoctor &&
                  selectedDate && (
                    <View className="mb-4">
                      <Text className="mb-4 text-lg font-semibold mt-4" style={{ color: '#0F172A' }}>
                        Giờ khám mong muốn*
                      </Text>
                      
                      {isDoctorNotAvailable ? (
                        <View className="rounded-xl border border-blue-200 bg-blue-50 p-6">
                          <View className="mb-3 flex-row items-center justify-center space-x-3">
                            <Ionicons name="calendar-outline" size={24} color="#3B82F6" />
                            <Text className="text-lg font-semibold text-blue-800">
                              Không có lịch trống
                            </Text>
                          </View>
                          <Text className="text-center text-blue-700">
                            Bác sĩ không có lịch trống trong ngày này. Vui lòng chọn ngày khác.
                          </Text>
                        </View>
                      ) : availabilityData ? (
                        <TimeSlotPicker
                          availableTimeSlots={availabilityData.availableTimeSlots}
                          selectedTimeSlot={selectedTimeSlot}
                          onTimeSlotSelect={handleTimeSlotSelect}
                          isLoading={false}
                          error={null}
                        />
                      ) : availabilityError ? (
                        <View className="rounded-xl border border-red-200 bg-red-50 p-6">
                          <View className="mb-3 flex-row items-center justify-center space-x-3">
                            <Ionicons name="warning-outline" size={24} color="#EF4444" />
                            <Text className="text-lg font-semibold text-red-800">
                              Lỗi tải dữ liệu
                            </Text>
                          </View>
                          <Text className="text-center text-red-700">
                            Không thể tải khung giờ khả dụng. Vui lòng thử lại.
                          </Text>
                        </View>
                      ) : (
                        <View className="flex-row items-center justify-center py-8">
                          <Text className="text-gray-600">Đang tải...</Text>
                        </View>
                      )}
                    </View>
                  )}
              </View>
            )}

            {/* Lý do khám */}
            <View className="mt-8">
              <View className="mb-4 flex-row items-center">
                <View
                  className="mr-2 h-4 w-1 rounded-full"
                  style={{ backgroundColor: '#10B981' }}
                />
                <Text className="text-lg font-bold" style={{ color: '#0F172A' }}>
                  Mô tả tình trạng bệnh nhân
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
                    value={patientDescription}
                    onChangeText={setPatientDescription}
                    maxLength={120}
                  />
                </View>
                <View className="mt-3 flex-row justify-end">
                  <Text className="text-sm" style={{ color: '#0284C7' }}>
                    {patientDescription.length}/120
                  </Text>
                </View>
              </View>
            </View>

            {/* Book Appointment Button */}
            <View className="mt-8">
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={handleBookAppointment}
                disabled={createAppointmentMutation.isPending}
                className="items-center rounded-xl py-4"
                style={{
                  backgroundColor: createAppointmentMutation.isPending ? '#9CA3AF' : '#0284C7',
                  shadowColor: '#0284C7',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.2,
                  shadowRadius: 8,
                  elevation: 4,
                }}>
                <Text className="text-base font-bold text-white">
                  {createAppointmentMutation.isPending ? 'ĐANG XỬ LÝ...' : 'ĐẶT HẸN'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

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
                  activeOpacity={0.7}
                  onPress={() => setShowDatePicker(false)}
                  className="h-8 w-8 items-center justify-center rounded-full"
                  style={{ backgroundColor: '#E0F2FE' }}>
                  <Ionicons name="close" size={20} color="#06B6D4" />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                <View className="flex-row flex-wrap gap-3">
                  {generateFutureDates()
                    .slice(3)
                    .map((date, index) => (
                      <TouchableOpacity
                        key={index}
                        activeOpacity={0.7}
                        onPress={() => {
                          // Tạo Date object trực tiếp từ year, month, day để tránh timezone issue
                          const selectedDate = new Date(date.year, date.month - 1, date.day);
                          handleCustomDateConfirm(selectedDate);
                        }}
                        className={`w-20 rounded-xl border-2 px-2 py-3 ${
                          selectedCustomDate &&
                          selectedCustomDate.getDate() === date.day &&
                          selectedCustomDate.getMonth() === date.month - 1 &&
                          selectedCustomDate.getFullYear() === date.year
                            ? 'border-[#0284C7]'
                            : 'border-[#E0F2FE]'
                        }`}
                        style={{
                          backgroundColor:
                            selectedCustomDate &&
                            selectedCustomDate.getDate() === date.day &&
                            selectedCustomDate.getMonth() === date.month - 1 &&
                            selectedCustomDate.getFullYear() === date.year
                              ? '#E0F2FE'
                              : '#F9FAFB',
                        }}>
                        <Text
                          className={`text-center text-sm font-medium ${
                            selectedCustomDate &&
                            selectedCustomDate.getDate() === date.day &&
                            selectedCustomDate.getMonth() === date.month - 1 &&
                            selectedCustomDate.getFullYear() === date.year
                              ? 'text-[#0284C7]'
                              : 'text-[#475569]'
                          }`}>
                          {date.dayName}
                        </Text>
                        <Text
                          className={`mt-1 text-center text-lg font-bold ${
                            selectedCustomDate &&
                            selectedCustomDate.getDate() === date.day &&
                            selectedCustomDate.getMonth() === date.month - 1 &&
                            selectedCustomDate.getFullYear() === date.year
                              ? 'text-[#0284C7]'
                              : 'text-[#0F172A]'
                          }`}>
                          {date.day}
                        </Text>
                        <Text
                          className={`text-center text-xs ${
                            selectedCustomDate &&
                            selectedCustomDate.getDate() === date.day &&
                            selectedCustomDate.getMonth() === date.month - 1 &&
                            selectedCustomDate.getFullYear() === date.year
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

      {/* Success Modal */}
      {showSuccessModal && (
        <Modal
          transparent={true}
          animationType="fade"
          visible={showSuccessModal}
          onRequestClose={() => setShowSuccessModal(false)}>
          <View className="flex-1 items-center justify-center bg-black/50">
            <View className="mx-8 w-80 rounded-2xl bg-white p-6">
              <View className="items-center">
                <View className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-green-100">
                  <Ionicons name="checkmark-circle" size={48} color="#10B981" />
                </View>
                <Text className="mb-2 text-xl font-bold text-gray-900">Đặt lịch thành công!</Text>
                <Text className="mb-6 text-center text-gray-600">
                  Bạn đã đặt lịch khám thành công. Chúng tôi sẽ liên hệ với bạn để xác nhận.
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    setShowSuccessModal(false);
                    // Navigate to appointment detail
                    if (createdAppointmentId) {
                      router.push(`/appointment-detail?id=${createdAppointmentId}`);
                    } else {
                      // Fallback to appointments list
                      router.push('/(homes)/(appointment)/');
                    }
                    // Reset created appointment ID
                    setCreatedAppointmentId(null);
                  }}
                  className="w-full items-center rounded-xl py-3"
                  style={{ backgroundColor: '#0284C7' }}>
                  <Text className="text-base font-semibold text-white">Xem chi tiết lịch hẹn</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}
