import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  TextInput,
  StatusBar,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useAppointment } from '@/contexts/AppointmentContext';
import { useOnlineDoctorServices } from '@/lib/api/appointments';
import { getTodayDateString } from '@/utils/datetime';
import { DoctorSkeleton } from '@/components/SkeletonLoader';

export default function OnlineDoctorSelectionScreen() {
  const [selectedDoctor, setSelectedDoctor] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const {
    setSelectedDoctor: setContextDoctor,
    setSelectedDoctorServiceId,
    setSelectedDate,
    selectedService,
  } = useAppointment();

  const {
    data: doctorServicesData,
    isLoading,
    error,
  } = useOnlineDoctorServices(selectedService?.id || 0);

  const mapDoctorData = (apiData: any[]) => {
    return apiData.map((item: any) => ({
      id: item.id,
      doctorId: item.doctorId,
      firstName: item.doctor.firstName,
      lastName: item.doctor.lastName,
      specialty: item.doctor.specialty,
      experience: item.doctor.experience,
      avatar: item.doctor.avatar,
      rating: 4.5,
    }));
  };

  const doctors =
    doctorServicesData?.data && doctorServicesData.data.length > 0
      ? mapDoctorData(doctorServicesData.data)
      : [];

  const filteredDoctors = doctors.filter(
    (doctor: any) =>
      `${doctor.lastName || ''} ${doctor.firstName || ''}`
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
        setContextDoctor(`${doctor.lastName || ''} ${doctor.firstName || ''}`);
        setSelectedDoctorServiceId(doctor.id);
        setSelectedDate(getTodayDateString());
        router.push('/(homes)/(appointment)/create-online');
      }
    }
  };

  const handleBack = () => {
    router.push('/(homes)/(appointment)/online-service-selection');
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

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50">
        <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
        <View className="flex-1 items-center justify-center px-4">
          <Ionicons name="alert-circle" size={48} color="#EF4444" />
          <Text className="mt-4 text-center text-base font-semibold text-slate-900">
            Không thể tải danh sách bác sĩ
          </Text>
          <Pressable
            onPress={handleBack}
            className="mt-4 rounded-lg bg-emerald-500 px-6 py-3">
            <Text className="font-semibold text-white">Quay lại</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View className="flex-1 bg-emerald-50">
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Header */}
      <LinearGradient
        colors={['#10B981', '#06B6D4', '#0284C7']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ paddingTop: 60, paddingBottom: 24, paddingHorizontal: 24 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Pressable onPress={handleBack} style={{ marginRight: 16 }}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </Pressable>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="person" size={24} color="white" style={{ marginRight: 8 }} />
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: 'white' }}>Chọn bác sĩ</Text>
          </View>
        </View>
        <View className="mt-2 flex-row items-center">
          <Ionicons name="videocam" size={16} color="white" style={{ marginRight: 6 }} />
          <Text className="text-sm text-emerald-100">Khám trực tuyến</Text>
        </View>
      </LinearGradient>

      {/* Search Bar */}
      <View className="px-5 py-4">
        <View
          className="flex-row items-center rounded-xl border px-4 py-3"
          style={{ backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }}>
          <Ionicons name="search" size={20} color="#10B981" />
          <TextInput
            className="ml-3 flex-1 text-base"
            placeholder="Tìm kiếm bác sĩ..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
        {isLoading ? (
          // Show skeleton loaders while loading
          <>
            {Array.from({ length: 5 }).map((_, index) => (
              <DoctorSkeleton key={index} />
            ))}
          </>
        ) : (
          <>
            {filteredDoctors.length === 0 && !isLoading && (
              <View className="items-center py-12">
                <Ionicons name="person-outline" size={48} color="#9CA3AF" />
                <Text className="mt-4 text-center text-base text-slate-500">
                  Không có bác sĩ nào khả dụng cho dịch vụ này
                </Text>
              </View>
            )}

            {filteredDoctors.map((doctor: any) => (
              <Pressable
                key={doctor.id}
                onPress={() => handleDoctorSelect(doctor.id)}
                className={`mb-4 rounded-xl border-2 p-4 ${
                  selectedDoctor === doctor.id ? 'border-emerald-500' : 'border-emerald-200'
                }`}
                style={{
                  backgroundColor: selectedDoctor === doctor.id ? '#D1FAE5' : '#ECFDF5',
                }}>
                <View className="flex-row">
                  <View className="mr-4 h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-emerald-100">
                    {doctor.avatar ? (
                      <Image
                        source={{ uri: doctor.avatar }}
                        className="h-full w-full"
                        resizeMode="cover"
                      />
                    ) : (
                      <Ionicons name="person" size={32} color="#10B981" />
                    )}
                  </View>
                  <View className="flex-1">
                    <View className="flex-row items-start justify-between">
                      <Text className="text-lg font-semibold text-slate-900">
                        BS. {doctor.lastName} {doctor.firstName}
                      </Text>
                      {selectedDoctor === doctor.id && (
                        <View className="h-6 w-6 items-center justify-center rounded-full bg-emerald-500">
                          <Ionicons name="checkmark" size={16} color="white" />
                        </View>
                      )}
                    </View>
                    {doctor.specialty && (
                      <Text className="mt-1 text-sm text-emerald-600">{doctor.specialty}</Text>
                    )}
                    {doctor.experience && (
                      <Text className="mt-1 text-sm text-slate-500">
                        {new Date().getFullYear() - doctor.experience} năm kinh nghiệm
                      </Text>
                    )}
                    <View className="mt-2 flex-row items-center">{renderStars(doctor.rating)}</View>
                  </View>
                </View>
              </Pressable>
            ))}
          </>
        )}

        <View className="h-24" />
      </ScrollView>

      {/* Continue Button */}
      {selectedDoctor && (
        <View className="absolute bottom-0 left-0 right-0 bg-white px-5 py-4 shadow-lg">
          <Pressable
            onPress={handleContinue}
            className="items-center rounded-xl py-4"
            style={{ backgroundColor: '#10B981' }}>
            <View className="flex-row items-center">
              <Text className="text-base font-bold text-white">Tiếp tục đặt lịch</Text>
              <Ionicons name="arrow-forward" size={20} color="white" style={{ marginLeft: 8 }} />
            </View>
          </Pressable>
        </View>
      )}
    </View>
  );
}
