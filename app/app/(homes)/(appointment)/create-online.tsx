import BirthDatePicker from '@/components/BirthDatePicker';
import GenderSelector from '@/components/GenderSelector';
import TimeSlotPicker from '@/components/TimeSlotPicker';
import { Relationship } from '@/constants/enum';
import { useAppointment } from '@/contexts/AppointmentContext';
import { userApi } from '@/lib/api';
import { useCreateAppointment, useDoctorAvailability } from '@/lib/api/appointments';
import { useAuth } from '@/lib/hooks/useAuth';
import { PatientProfile } from '@/types/auth';
import { createISODateTime, getTodayDateString } from '@/utils/datetime';
import { getRelationshipLabel } from '@/utils/relationshipTranslator';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Image,
  Modal,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function OnlineAppointmentScreen() {
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
    selectedService,
    selectedTimeSlot,
    setSelectedTimeSlot,
    selectedDoctorServiceId,
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
      setSelectedProfile(primaryProfile);
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
      setSelectedProfile(profile);
      setFirstName(profile.firstName);
      setLastName(profile.lastName);
      setDateOfBirth(new Date(profile.dateOfBirth));
      setPhoneNumber(profile.phone);
      setGender(profile.gender === 'OTHER' ? null : profile.gender);
    } else if (customerId === 'add') {
      setSelectedProfile(primaryProfile!);
      setFirstName('');
      setLastName('');
      setDateOfBirth(null);
      setPhoneNumber('');
      setGender(null);
      setPatientDescription('');
    } else if (customerId === 'me' && primaryProfile) {
      setSelectedProfile(primaryProfile);
      setPatientDescription('');
    }
  };

  const handleServiceSelect = () => {
    router.push('./online-service-selection');
  };

  const handleDoctorSelect = () => {
    if (selectedService) {
      router.push('./online-doctor-selection');
    }
  };

  const handleTimeSlotSelect = (time: string) => {
    setSelectedTimeSlot(time);
  };

  const handleCustomDateConfirm = (date: Date) => {
    setSelectedCustomDate(date);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    setSelectedDate(`${year}-${month}-${day}`);
    setShowDatePicker(false);
  };

  const handlePresetDateSelect = (date: any) => {
    setSelectedCustomDate(null);
    setSelectedDate(date.fullDate);
  };

  const handleCustomDatePress = () => {
    setShowDatePicker(true);
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
        dayName: date.toLocaleDateString('vi-VN', { weekday: 'long' }),
        fullDate: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`,
        isToday: i === 0,
      });
    }

    return dates;
  };

  const handleBookAppointment = async () => {
    if (
      !selectedService ||
      !selectedDoctor ||
      !selectedTimeSlot ||
      !selectedDate ||
      !selectedDoctorServiceId
    ) {
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
      setSelectedCustomer(`profile-${res.profile.id}`);
    }

    try {
      const appointmentDate = selectedDate;
      const startTime = createISODateTime(appointmentDate, selectedTimeSlot);

      const serviceDuration = selectedService.duration;
      const startDateTime = new Date(startTime);
      const endDateTime = new Date(startDateTime.getTime() + serviceDuration * 60 * 1000);
      const endTime = endDateTime.toISOString();

      const appointmentData = {
        doctorServiceId: selectedDoctorServiceId,
        patientProfileId: selectedProfile.id,
        startTime,
        endTime,
        notes: patientDescription,
        type: 'ONLINE' as const,
      };

      const result = await createAppointmentMutation.mutateAsync(appointmentData);
      setCreatedAppointmentId(result.id);
      setShowSuccessModal(true);
    } catch (error: any) {
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
    <View style={{ flex: 1, backgroundColor: '#E0F2FE' }}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Header */}
      <LinearGradient
        colors={['#10B981', '#06B6D4', '#0284C7']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ paddingTop: 60, paddingBottom: 24, paddingHorizontal: 24 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity
            onPress={() => router.push('/(homes)/(appointment)')}
            style={{ marginRight: 16 }}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="videocam" size={24} color="white" style={{ marginRight: 8 }} />
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: 'white' }}>Khám Online</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Main Content */}
        <View className="px-5 py-6">
          {/* Online Badge */}
          <View className="mb-6 flex-row items-center rounded-xl bg-emerald-50 p-4">
            <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-emerald-500">
              <Ionicons name="videocam" size={20} color="white" />
            </View>
            <View className="flex-1">
              <Text className="text-base font-semibold text-emerald-800">Khám bệnh trực tuyến</Text>
              <Text className="text-sm text-emerald-600">Tư vấn với bác sĩ qua video call</Text>
            </View>
          </View>

          {/* Chọn Khách hàng Section */}
          <View className="mb-8">
            <View className="mb-4 flex-row items-center">
              <View
                className="mr-2.5 h-5 w-1 rounded-full"
                style={{ backgroundColor: '#10B981' }}
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
                        selectedCustomer === 'me' ? 'border-emerald-500' : 'border-emerald-300'
                      }`}>
                      {primaryProfile.avatar ? (
                        <Image
                          source={{ uri: primaryProfile.avatar }}
                          className="h-full w-full rounded-full"
                          resizeMode="cover"
                        />
                      ) : (
                        <View
                          className="h-full w-full items-center justify-center rounded-full"
                          style={{
                            backgroundColor: selectedCustomer === 'me' ? '#D1FAE5' : '#ECFDF5',
                          }}>
                          <Ionicons
                            name="person"
                            size={32}
                            color={selectedCustomer === 'me' ? '#10B981' : '#6EE7B7'}
                          />
                        </View>
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleCustomerSelect('me', primaryProfile)}
                      className={`mt-2 rounded-full px-4 py-2 ${
                        selectedCustomer === 'me' ? 'bg-emerald-500' : 'bg-emerald-50'
                      }`}>
                      <View className="flex-row items-center">
                        <Text
                          className={`font-medium ${
                            selectedCustomer === 'me' ? 'text-white' : 'text-gray-600'
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
                          ? 'border-emerald-500'
                          : 'border-emerald-300'
                      }`}>
                      {profile.avatar ? (
                        <Image
                          source={{ uri: profile.avatar }}
                          className="h-full w-full rounded-full"
                          resizeMode="cover"
                        />
                      ) : (
                        <View
                          className="h-full w-full items-center justify-center rounded-full"
                          style={{ backgroundColor: '#D1FAE5' }}>
                          <Text className="text-lg font-bold text-emerald-600">
                            {profile.firstName.charAt(0).toUpperCase()}
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleCustomerSelect(`profile-${profile.id}`, profile)}
                      className={`mt-2 rounded-full px-4 py-2 ${
                        selectedCustomer === `profile-${profile.id}`
                          ? 'bg-emerald-500'
                          : 'bg-emerald-50'
                      }`}>
                      <View className="flex-row items-center">
                        <Text
                          className={`font-medium ${
                            selectedCustomer === `profile-${profile.id}`
                              ? 'text-white'
                              : 'text-gray-600'
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
                      selectedCustomer === 'add' ? 'border-emerald-500' : 'border-emerald-300'
                    }`}>
                    <Ionicons
                      name="person-add"
                      size={32}
                      color={selectedCustomer === 'add' ? '#10B981' : '#6EE7B7'}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleCustomerSelect('add')}
                    className={`mt-2 rounded-full px-4 py-2 ${
                      selectedCustomer === 'add' ? 'bg-emerald-500' : 'bg-emerald-50'
                    }`}>
                    <View className="flex-row items-center">
                      <Text
                        className={`font-medium ${
                          selectedCustomer === 'add' ? 'text-white' : 'text-gray-600'
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
                  style={{
                    backgroundColor: selectedCustomer === 'add' ? '#ECFDF5' : '#FFFFFF',
                    borderColor: selectedCustomer === 'add' ? '#A7F3D0' : '#E5E7EB',
                  }}>
                  <Ionicons
                    name="create"
                    size={22}
                    color={selectedCustomer === 'add' ? '#10B981' : '#6B7280'}
                  />
                  <TextInput
                    className="ml-4 flex-1 text-lg"
                    style={{
                      color: selectedCustomer === 'add' ? '#0F172A' : '#374151',
                    }}
                    placeholder="* Họ"
                    placeholderTextColor={selectedCustomer === 'add' ? '#475569' : '#9CA3AF'}
                    value={lastName}
                    onChangeText={setLastName}
                    editable={selectedCustomer === 'add'}
                  />
                </View>
              </View>

              <View>
                <View
                  className="flex-row items-center rounded-xl border px-5 py-4"
                  style={{
                    backgroundColor: selectedCustomer === 'add' ? '#ECFDF5' : '#FFFFFF',
                    borderColor: selectedCustomer === 'add' ? '#A7F3D0' : '#E5E7EB',
                  }}>
                  <Ionicons
                    name="create"
                    size={22}
                    color={selectedCustomer === 'add' ? '#10B981' : '#6B7280'}
                  />
                  <TextInput
                    className="ml-4 flex-1 text-lg"
                    style={{
                      color: selectedCustomer === 'add' ? '#0F172A' : '#374151',
                    }}
                    placeholder="* Tên"
                    placeholderTextColor={selectedCustomer === 'add' ? '#475569' : '#9CA3AF'}
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
                  style={{
                    backgroundColor: selectedCustomer === 'add' ? '#ECFDF5' : '#FFFFFF',
                    borderColor: selectedCustomer === 'add' ? '#A7F3D0' : '#E5E7EB',
                  }}>
                  <Ionicons
                    name="call"
                    size={22}
                    color={selectedCustomer === 'add' ? '#10B981' : '#6B7280'}
                  />
                  <TextInput
                    className="ml-4 flex-1 text-lg"
                    style={{
                      color: selectedCustomer === 'add' ? '#0F172A' : '#374151',
                    }}
                    placeholder="* 0988659126"
                    placeholderTextColor={selectedCustomer === 'add' ? '#475569' : '#9CA3AF'}
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
              {/* Location - Fixed as Online */}
              <View
                className="flex-row items-center rounded-xl border px-5 py-4"
                style={{ backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }}>
                <Ionicons name="videocam" size={22} color="#10B981" />
                <Text className="ml-4 text-lg font-medium" style={{ color: '#10B981' }}>
                  Khám trực tuyến (Online)
                </Text>
                <View className="ml-auto rounded-full bg-emerald-500 px-3 py-1">
                  <Text className="text-xs font-medium text-white">Video Call</Text>
                </View>
              </View>

              {/* Chọn dịch vụ */}
              <TouchableOpacity
                onPress={handleServiceSelect}
                activeOpacity={0.7}
                className="flex-row items-center rounded-xl border px-5 py-4"
                style={{ backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }}>
                <Ionicons name="medical" size={22} color="#10B981" />
                <Text className="ml-4 text-lg font-medium" style={{ color: '#0F172A' }}>
                  {selectedService ? selectedService.name : '* Chọn dịch vụ'}
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={22}
                  color="#10B981"
                  style={{ marginLeft: 'auto' }}
                />
              </TouchableOpacity>

              {/* Chọn bác sĩ */}
              <TouchableOpacity
                onPress={handleDoctorSelect}
                disabled={!selectedService}
                activeOpacity={0.7}
                className={`flex-row items-center rounded-xl border px-5 py-4 ${
                  selectedService ? 'border-[#A7F3D0]' : 'border-[#D1D5DB]'
                }`}
                style={{
                  backgroundColor: selectedService ? '#ECFDF5' : '#F9FAFB',
                }}>
                <Ionicons name="person" size={22} color={selectedService ? '#10B981' : '#9CA3AF'} />
                <Text
                  className={`ml-4 text-lg font-medium ${
                    selectedService ? 'text-[#0F172A]' : 'text-[#9CA3AF]'
                  }`}>
                  {selectedDoctor ? selectedDoctor : '* Chọn bác sĩ'}
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={22}
                  color={selectedService ? '#10B981' : '#9CA3AF'}
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
                    onPress={() => handlePresetDateSelect(date)}
                    className={`flex-1 rounded-xl px-4 py-4 ${
                      selectedDate === date.fullDate ? 'bg-emerald-500' : 'bg-emerald-50'
                    }`}
                    style={{
                      borderColor: selectedDate === date.fullDate ? '#10B981' : '#A7F3D0',
                      borderWidth: selectedDate === date.fullDate ? 2 : 1,
                    }}>
                    <Text
                      className={`text-center text-base font-medium ${
                        selectedDate === date.fullDate ? 'text-white' : 'text-gray-600'
                      }`}>
                      {date.dayName} {date.day}/{date.month}
                    </Text>
                    <Text
                      className={`mt-1 text-center text-sm ${
                        selectedDate === date.fullDate ? 'text-emerald-100' : 'text-gray-500'
                      }`}>
                      {index === 0 ? 'Hôm nay' : index === 1 ? 'Ngày mai' : 'Ngày kia'}
                    </Text>
                  </TouchableOpacity>
                ))}

              <TouchableOpacity
                onPress={handleCustomDatePress}
                className="flex-1 items-center justify-center rounded-xl px-4 py-4"
                style={{
                  backgroundColor: selectedCustomDate ? '#10B981' : '#ECFDF5',
                  borderColor: selectedCustomDate ? '#10B981' : '#A7F3D0',
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
                  <Ionicons name="add" size={24} color="#10B981" />
                )}
              </TouchableOpacity>
            </View>

            {/* Time Slots */}
            {selectedDate && (
              <View>
                {selectedService && selectedDoctor && selectedDate && (
                  <View className="mb-4">
                    <Text className="mb-4 mt-4 text-lg font-semibold" style={{ color: '#0F172A' }}>
                      Giờ khám mong muốn*
                    </Text>

                    {isDoctorNotAvailable ? (
                      <View className="rounded-xl border border-emerald-200 bg-emerald-50 p-6">
                        <View className="mb-3 flex-row items-center justify-center space-x-3">
                          <Ionicons name="calendar-outline" size={24} color="#10B981" />
                          <Text className="text-lg font-semibold text-emerald-800">
                            Không có lịch trống
                          </Text>
                        </View>
                        <Text className="text-center text-emerald-700">
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
                style={{ backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }}>
                <View className="flex-row items-start">
                  <Ionicons name="create" size={22} color="#10B981" style={{ marginTop: 2 }} />
                  <TextInput
                    className="ml-4 flex-1 text-lg"
                    style={{ color: '#0F172A' }}
                    placeholder="* Mô tả triệu chứng của bạn"
                    placeholderTextColor="#475569"
                    multiline
                    numberOfLines={4}
                    value={patientDescription}
                    onChangeText={setPatientDescription}
                    maxLength={120}
                  />
                </View>
                <View className="mt-3 flex-row justify-end">
                  <Text className="text-sm" style={{ color: '#10B981' }}>
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
                  backgroundColor: createAppointmentMutation.isPending ? '#9CA3AF' : '#10B981',
                  shadowColor: '#10B981',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.2,
                  shadowRadius: 8,
                  elevation: 4,
                }}>
                <View className="flex-row items-center">
                  <Ionicons name="videocam" size={20} color="white" style={{ marginRight: 8 }} />
                  <Text className="text-base font-bold text-white">
                    {createAppointmentMutation.isPending ? 'ĐANG XỬ LÝ...' : 'ĐẶT LỊCH KHÁM ONLINE'}
                  </Text>
                </View>
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
            <View className="max-h-96 rounded-t-3xl p-6" style={{ backgroundColor: '#ECFDF5' }}>
              <View className="mb-4 flex-row items-center justify-between">
                <Text className="text-lg font-bold" style={{ color: '#0F172A' }}>
                  Chọn ngày khám
                </Text>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setShowDatePicker(false)}
                  className="h-8 w-8 items-center justify-center rounded-full"
                  style={{ backgroundColor: '#A7F3D0' }}>
                  <Ionicons name="close" size={20} color="#10B981" />
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
                          const selectedDate = new Date(date.year, date.month - 1, date.day);
                          handleCustomDateConfirm(selectedDate);
                        }}
                        className={`w-20 rounded-xl border-2 px-2 py-3 ${
                          selectedCustomDate &&
                          selectedCustomDate.getDate() === date.day &&
                          selectedCustomDate.getMonth() === date.month - 1 &&
                          selectedCustomDate.getFullYear() === date.year
                            ? 'border-emerald-500'
                            : 'border-emerald-200'
                        }`}
                        style={{
                          backgroundColor:
                            selectedCustomDate &&
                            selectedCustomDate.getDate() === date.day &&
                            selectedCustomDate.getMonth() === date.month - 1 &&
                            selectedCustomDate.getFullYear() === date.year
                              ? '#A7F3D0'
                              : '#F9FAFB',
                        }}>
                        <Text
                          className={`text-center text-sm font-medium ${
                            selectedCustomDate &&
                            selectedCustomDate.getDate() === date.day &&
                            selectedCustomDate.getMonth() === date.month - 1 &&
                            selectedCustomDate.getFullYear() === date.year
                              ? 'text-emerald-700'
                              : 'text-gray-600'
                          }`}>
                          {date.dayName}
                        </Text>
                        <Text
                          className={`mt-1 text-center text-lg font-bold ${
                            selectedCustomDate &&
                            selectedCustomDate.getDate() === date.day &&
                            selectedCustomDate.getMonth() === date.month - 1 &&
                            selectedCustomDate.getFullYear() === date.year
                              ? 'text-emerald-700'
                              : 'text-gray-900'
                          }`}>
                          {date.day}
                        </Text>
                        <Text
                          className={`text-center text-xs ${
                            selectedCustomDate &&
                            selectedCustomDate.getDate() === date.day &&
                            selectedCustomDate.getMonth() === date.month - 1 &&
                            selectedCustomDate.getFullYear() === date.year
                              ? 'text-emerald-700'
                              : 'text-gray-500'
                          }`}>
                          Thg {date.month}
                        </Text>
                      </TouchableOpacity>
                    ))}
                </View>
              </ScrollView>

              <View className="mt-4 rounded-xl p-3" style={{ backgroundColor: '#A7F3D0' }}>
                <View className="flex-row items-center">
                  <Ionicons name="information-circle" size={20} color="#10B981" />
                  <Text className="ml-2 text-sm" style={{ color: '#047857' }}>
                    Chỉ có thể chọn ngày trong tương lai
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSuccessModal(false)}>
        <View className="flex-1 items-center justify-center bg-black/50">
          <View
            className="mx-6 w-80 items-center rounded-3xl p-8"
            style={{ backgroundColor: '#ECFDF5' }}>
            <View className="mb-6 h-24 w-24 items-center justify-center rounded-full bg-emerald-100">
              <View className="h-16 w-16 items-center justify-center rounded-full bg-emerald-500">
                <Ionicons name="videocam" size={32} color="white" />
              </View>
            </View>

            <Text className="mb-2 text-center text-2xl font-bold" style={{ color: '#10B981' }}>
              Đặt lịch thành công!
            </Text>

            <Text className="mb-6 text-center text-base text-gray-600">
              Lịch khám online của bạn đã được đặt thành công. Bạn sẽ nhận được link tham gia cuộc
              gọi video trước giờ hẹn.
            </Text>

            <View className="w-full space-y-3">
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => {
                  setShowSuccessModal(false);
                  router.push(`/(homes)/(appointment-detail)?id=${createdAppointmentId}`);
                }}
                className="w-full items-center rounded-xl py-4"
                style={{ backgroundColor: '#10B981' }}>
                <Text className="text-base font-bold text-white">Xem chi tiết lịch hẹn</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => {
                  setShowSuccessModal(false);
                  router.push('/(homes)');
                }}
                className="w-full items-center rounded-xl border-2 py-4"
                style={{ borderColor: '#10B981', backgroundColor: 'white' }}>
                <Text className="text-base font-bold" style={{ color: '#10B981' }}>
                  Về trang chủ
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
