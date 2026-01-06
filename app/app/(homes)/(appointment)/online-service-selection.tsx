import { ServiceSkeleton } from '@/components/SkeletonLoader';
import { useAppointment } from '@/contexts/AppointmentContext';
import { useServices } from '@/lib/api/appointments';
import { formatServiceNameWithConditions } from '@/lib/utils/serviceFormatter';
import { Service } from '@/types/doctor';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StatusBar, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function OnlineServiceSelectionScreen() {
  const [selectedService, setSelectedService] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const {
    setSelectedService: setContextService,
    gender: patientGender,
    dateOfBirth: patientDOB,
  } = useAppointment();

  const { data: servicesData, isLoading, error } = useServices();

  const services = servicesData?.data || [];

  const filteredServices = services.filter((service: Service) => {
    // 1. Filter by Search Query
    const matchesSearch =
      service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (service.description &&
        service.description.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    // 2. Filter by Online Availability
    if (service.isAvailableOnline === false) return false;

    // 3. Filter by Gender if selected
    if (patientGender && service.targetGender && service.targetGender !== patientGender) {
      return false;
    }

    // 4. Filter by Age if selected
    if (patientDOB) {
      const currentYear = new Date().getFullYear();
      const birthYear = new Date(patientDOB).getFullYear();
      const age = currentYear - birthYear;

      if (service.minAge !== null && service.minAge !== undefined && age < service.minAge)
        return false;
      if (service.maxAge !== null && service.maxAge !== undefined && age > service.maxAge)
        return false;
    }

    return true;
  });

  const handleServiceSelect = (serviceId: number) => {
    setSelectedService(serviceId);
  };

  const handleContinue = () => {
    if (selectedService) {
      const service = services.find((s: Service) => s.id === selectedService);
      if (service) {
        setContextService({
          id: service.id,
          name: service.name,
          price: service.price,
          duration: service.duration,
        });
        router.push('./online-doctor-selection');
      }
    }
  };

  const handleBack = () => {
    router.push('/(homes)/(appointment)/create-online');
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  const formatDuration = (duration: number) => {
    if (duration < 60) {
      return `${duration} phút`;
    }
    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;
    return minutes > 0 ? `${hours}h ${minutes}p` : `${hours}h`;
  };

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50">
        <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
        <View className="flex-1 items-center justify-center px-4">
          <Ionicons name="alert-circle" size={48} color="#EF4444" />
          <Text className="mt-4 text-center text-base font-semibold text-slate-900">
            Không thể tải danh sách dịch vụ
          </Text>
          <Pressable onPress={handleBack} className="mt-4 rounded-lg bg-emerald-500 px-6 py-3">
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
            <Ionicons name="medical" size={24} color="white" style={{ marginRight: 8 }} />
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: 'white' }}>Chọn dịch vụ</Text>
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
            placeholder="Tìm kiếm dịch vụ..."
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
              <ServiceSkeleton key={index} />
            ))}
          </>
        ) : (
          <>
            {filteredServices.map((service: Service) => (
              <Pressable
                key={service.id}
                onPress={() => handleServiceSelect(service.id)}
                className={`mb-4 rounded-xl border-2 p-4 ${
                  selectedService === service.id ? 'border-emerald-500' : 'border-emerald-200'
                }`}
                style={{
                  backgroundColor: selectedService === service.id ? '#D1FAE5' : '#ECFDF5',
                }}>
                <View className="flex-row items-start justify-between">
                  <View className="flex-1">
                    <Text className="text-lg font-semibold text-slate-900">{formatServiceNameWithConditions(service)}</Text>
                    {service.description && (
                      <Text className="mt-1 text-sm text-slate-600" numberOfLines={2}>
                        {service.description}
                      </Text>
                    )}
                  </View>
                  {selectedService === service.id && (
                    <View className="h-6 w-6 items-center justify-center rounded-full bg-emerald-500">
                      <Ionicons name="checkmark" size={16} color="white" />
                    </View>
                  )}
                </View>
                <View className="mt-3 flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <Ionicons name="time-outline" size={16} color="#10B981" />
                    <Text className="ml-1 text-sm text-emerald-600">
                      {formatDuration(service.duration)}
                    </Text>
                  </View>
                  <Text className="text-base font-bold text-emerald-600">
                    {formatPrice(service.price)}
                  </Text>
                </View>
              </Pressable>
            ))}

            {filteredServices.length === 0 && !isLoading && (
              <View className="items-center py-12">
                <Ionicons name="search-outline" size={48} color="#9CA3AF" />
                <Text className="mt-4 text-base text-slate-500">
                  Không tìm thấy dịch vụ phù hợp
                </Text>
              </View>
            )}
          </>
        )}

        <View className="h-24" />
      </ScrollView>

      {/* Continue Button */}
      {selectedService && (
        <View className="absolute bottom-0 left-0 right-0 bg-white px-5 py-4 shadow-lg">
          <Pressable
            onPress={handleContinue}
            className="items-center rounded-xl py-4"
            style={{ backgroundColor: '#10B981' }}>
            <View className="flex-row items-center">
              <Text className="text-base font-bold text-white">Tiếp tục chọn bác sĩ</Text>
              <Ionicons name="arrow-forward" size={20} color="white" style={{ marginLeft: 8 }} />
            </View>
          </Pressable>
        </View>
      )}
    </View>
  );
}
