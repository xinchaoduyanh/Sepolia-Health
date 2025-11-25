import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StatusBar,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { router } from 'expo-router';
import { useAppointment } from '@/contexts/AppointmentContext';
import { useDoctorServices } from '@/lib/api/appointments';
import { getTodayDateString } from '@/utils/datetime';

export default function DoctorSelectionScreen() {
  const [selectedDoctor, setSelectedDoctor] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const {
    setSelectedDoctor: setContextDoctor,
    setSelectedDoctorServiceId,
    setSelectedDate,
    selectedFacility,
    selectedService,
  } = useAppointment();

  const {
    data: doctorServicesData,
    isLoading,
    error,
  } = useDoctorServices(selectedFacility?.id || 0, selectedService?.id || 0);

  // Fallback data when API fails or returns empty
  const fallbackDoctors = [
    {
      id: 1,
      firstName: 'Nguyễn Văn',
      lastName: 'An',
      specialty: 'Tim mạch',
      experience: '15 năm kinh nghiệm',
      rating: 4.8,
    },
    {
      id: 2,
      firstName: 'Trần Thị',
      lastName: 'Bình',
      specialty: 'Da liễu',
      experience: '12 năm kinh nghiệm',
      rating: 4.6,
    },
    {
      id: 3,
      firstName: 'Lê Văn',
      lastName: 'Cường',
      specialty: 'Nội khoa',
      experience: '20 năm kinh nghiệm',
      rating: 4.9,
    },
  ];

  // Map API data to expected format
  const mapDoctorData = (apiData: any[]) => {
    return apiData.map((item: any) => ({
      id: item.id, // This is the doctorServiceId
      doctorId: item.doctorId,
      firstName: item.doctor.firstName,
      lastName: item.doctor.lastName,
      specialty: item.doctor.specialty,
      experience: item.doctor.experience,
      avatar: item.doctor.avatar,
      rating: 4.5, // Default rating since not provided in API
    }));
  };

  const doctors =
    doctorServicesData?.data && doctorServicesData.data.length > 0
      ? mapDoctorData(doctorServicesData.data)
      : fallbackDoctors;

  const filteredDoctors = doctors.filter(
    (doctor: any) =>
      `${doctor.firstName || ''} ${doctor.lastName || ''}`
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      (doctor.specialty && doctor.specialty.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleDoctorSelect = (doctorId: number) => {
    setSelectedDoctor(doctorId);
  };

  const handleContinue = () => {
    if (selectedDoctor) {
      const doctor = doctors.find((d: any) => d.id === selectedDoctor);
      if (doctor) {
        setContextDoctor(`${doctor.firstName || ''} ${doctor.lastName || ''}`);
        // Lưu doctorServiceId (id từ API response)
        setSelectedDoctorServiceId(doctor.id);
        // Set ngày mặc định là hôm nay (ISO date format)
        setSelectedDate(getTodayDateString());
        router.push('/(homes)/(appointment)/create');
      }
    }
  };

  const handleBack = () => {
    router.push('/(homes)/(appointment)/service-selection');
  };

  const handleBackToAppointments = () => {
    router.push('/(homes)/(appointment)');
  };

  const renderStars = (rating: number | undefined) => {
    if (!rating) return null;

    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<Ionicons key={i} name="star" size={14} color="#FCD34D" />);
    }

    if (hasHalfStar) {
      stars.push(<Ionicons key="half" name="star-half" size={14} color="#FCD34D" />);
    }

    const remainingStars = 5 - Math.ceil(rating);
    for (let i = 0; i < remainingStars; i++) {
      stars.push(<Ionicons key={`empty-${i}`} name="star-outline" size={14} color="#D1D5DB" />);
    }

    return stars;
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50">
        <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#2563EB" />
          <Text className="mt-4 text-base text-slate-600">Đang tải danh sách bác sĩ...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50">
        <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
        <View className="flex-1 items-center justify-center px-4">
          <Ionicons name="alert-circle" size={48} color="#EF4444" />
          <Text className="mt-4 text-center text-base font-semibold text-slate-900">
            Không thể tải danh sách bác sĩ
          </Text>
          <Text className="mt-2 text-center text-sm text-slate-600">
            Vui lòng kiểm tra kết nối mạng và thử lại
          </Text>
          <TouchableOpacity
            onPress={() => router.push('/(homes)/(appointment)/service-selection')}
            className="mt-6 rounded-xl bg-blue-600 px-6 py-3">
            <Text className="text-base font-semibold text-white">Quay lại</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#E0F2FE' }}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <ScrollView
        showsVerticalScrollIndicator={false}
        bounces={false}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 100 }}>
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
            <TouchableOpacity
              onPress={handleBack}
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
            </TouchableOpacity>
            <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#FFFFFF', flex: 1 }}>
              Chọn bác sĩ
            </Text>
            <TouchableOpacity
              onPress={handleBackToAppointments}
              style={{
                height: 40,
                width: 40,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 20,
                backgroundColor: 'rgba(255,255,255,0.25)',
              }}>
              <Ionicons name="calendar-outline" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Content */}
        <View style={{ paddingHorizontal: 24, marginTop: -80, marginBottom: 24 }}>
          {/* Selected Info */}
          {(selectedFacility || selectedService) && (
            <View
              style={{
                marginBottom: 16,
                backgroundColor: 'white',
                borderRadius: 12,
                padding: 12,
                borderWidth: 1,
                borderColor: '#E0F2FE',
              }}>
              {selectedFacility && (
                <View style={{ marginBottom: 8, flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="location" size={16} color="#0284C7" />
                  <Text style={{ marginLeft: 8, fontSize: 14, fontWeight: '600', color: '#0284C7' }}>
                    Cơ sở: {selectedFacility.name}
                  </Text>
                </View>
              )}
              {selectedService && (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="medical" size={16} color="#0284C7" />
                  <Text style={{ marginLeft: 8, fontSize: 14, fontWeight: '600', color: '#0284C7' }}>
                    Dịch vụ: {selectedService.name}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Search Bar */}
          <View style={{ marginBottom: 16 }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: 'white',
                borderRadius: 12,
                borderWidth: 1,
                borderColor: '#E0F2FE',
                paddingHorizontal: 16,
                paddingVertical: 12,
              }}>
              <Ionicons name="search" size={20} color="#0284C7" />
              <TextInput
                style={{
                  flex: 1,
                  marginLeft: 12,
                  fontSize: 16,
                  color: '#0F172A',
                }}
                placeholder="Tìm bác sĩ"
                placeholderTextColor="#94A3B8"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
          </View>

          {/* Doctors List */}
          <View>
        {filteredDoctors.length === 0 ? (
          <View className="mt-8 items-center">
            <Ionicons name="person-outline" size={48} color="#94A3B8" />
            <Text className="mt-4 text-center text-base text-slate-600">
              {searchQuery ? 'Không tìm thấy bác sĩ phù hợp' : 'Không có bác sĩ nào'}
            </Text>
          </View>
        ) : (
          filteredDoctors.map((doctor: any) => (
            <TouchableOpacity
              key={doctor.id}
              onPress={() => handleDoctorSelect(doctor.id)}
              className={`mb-3 rounded-xl p-4 ${
                selectedDoctor === doctor.id
                  ? 'border-2 border-blue-500 bg-blue-50'
                  : 'border border-slate-200 bg-white'
              }`}
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 3,
                elevation: 1,
              }}>
              <View className="flex-row items-start">
                <View className="mr-4">
                  <View className="h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-blue-100">
                    {doctor.avatar ? (
                      <Image
                        source={{ uri: doctor.avatar }}
                        className="h-full w-full rounded-full"
                        style={{ width: 48, height: 48 }}
                      />
                    ) : (
                      <Ionicons name="person" size={24} color="#3B82F6" />
                    )}
                  </View>
                </View>

                <View className="flex-1">
                  <View className="mb-1 flex-row items-center justify-between">
                    <Text className="text-base font-semibold text-slate-900">
                      Bác sĩ {doctor.firstName || ''} {doctor.lastName || ''}
                    </Text>
                    {selectedDoctor === doctor.id && (
                      <View className="rounded-full bg-blue-600 p-1">
                        <Ionicons name="checkmark" size={16} color="white" />
                      </View>
                    )}
                  </View>

                  {doctor.specialty && (
                    <Text className="mb-1 text-sm font-medium text-blue-600">
                      {doctor.specialty}
                    </Text>
                  )}

                  {doctor.experience && (
                    <Text className="mb-2 text-sm text-slate-600">{doctor.experience}</Text>
                  )}

                  <View className="flex-row items-center">
                    <View className="mr-3 flex-row items-center">
                      {renderStars(doctor.rating || 4.5)}
                    </View>
                    <Text className="text-sm text-slate-600">{doctor.rating || 4.5}/5</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
            ))
          )}

          {/* Continue Button */}
          {selectedDoctor && (
            <View style={{ marginTop: 24 }}>
              <TouchableOpacity
                onPress={handleContinue}
                style={{
                  backgroundColor: '#0284C7',
                  paddingVertical: 16,
                  borderRadius: 12,
                  alignItems: 'center',
                  shadowColor: '#0284C7',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 4,
                }}>
                <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold' }}>
                  Tiếp tục
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
