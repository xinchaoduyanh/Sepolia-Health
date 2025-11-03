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
import { router } from 'expo-router';
import { useAppointment } from '@/contexts/AppointmentContext';
import { useDoctorServices } from '@/lib/api/appointments';

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
        const today = new Date().toISOString().split('T')[0];
        setSelectedDate(today);
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
    <SafeAreaView className="flex-1 bg-slate-50">
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {/* Header */}
      <View className="border-b border-slate-100 bg-white px-5 py-4">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color="#2563EB" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-slate-900">Chọn bác sĩ</Text>
          <TouchableOpacity onPress={handleBackToAppointments}>
            <Ionicons name="calendar-outline" size={24} color="#2563EB" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Selected Info */}
      {(selectedFacility || selectedService) && (
        <View className="mx-4 mt-4 rounded-xl bg-blue-50 p-3">
          {selectedFacility && (
            <View className="mb-1 flex-row items-center">
              <Ionicons name="location" size={16} color="#2563EB" />
              <Text className="ml-2 text-sm font-medium text-blue-800">
                Cơ sở: {selectedFacility.name}
              </Text>
            </View>
          )}
          {selectedService && (
            <View className="flex-row items-center">
              <Ionicons name="medical" size={16} color="#2563EB" />
              <Text className="ml-2 text-sm font-medium text-blue-800">
                Dịch vụ: {selectedService.name}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Search Bar */}
      <View className="mb-4 mt-4 px-4">
        <View className="flex-row items-center rounded-xl border border-slate-200 bg-white px-4 py-3">
          <Ionicons name="search" size={20} color="#2563EB" />
          <TextInput
            className="ml-3 flex-1 text-base text-slate-900"
            placeholder="Tìm bác sĩ"
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Doctors List */}
      <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={true}>
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
      </ScrollView>

      {/* Continue Button */}
      {selectedDoctor && (
        <View className="border-t border-slate-100 bg-white px-4 py-4">
          <TouchableOpacity
            onPress={handleContinue}
            className="items-center rounded-xl bg-blue-600 py-4"
            style={{
              shadowColor: '#2563EB',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.2,
              shadowRadius: 8,
              elevation: 4,
            }}>
            <Text className="text-base font-bold text-white">Tiếp tục</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}
