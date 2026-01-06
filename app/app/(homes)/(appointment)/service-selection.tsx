import { ServiceSkeleton } from '@/components/SkeletonLoader';
import { useAppointment } from '@/contexts/AppointmentContext';
import { useServices } from '@/lib/api/appointments';
import { formatServiceNameWithConditions } from '@/lib/utils/serviceFormatter';
import { Service } from '@/types/doctor';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

export default function ServiceSelectionScreen() {
  const [selectedService, setSelectedService] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const {
    setSelectedService: setContextService,
    selectedFacility,
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

    // 2. Filter by Offline Availability (as this is Facility flow)
    if (service.isAvailableOffline === false) return false;

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
        router.push('./doctor-selection');
      }
    }
  };

  const handleBack = () => {
    router.push('./facility-selection');
  };

  const handleBackToAppointments = () => {
    router.push('/(homes)/(appointment)');
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
          <Text className="mt-2 text-center text-sm text-slate-600">
            Vui lòng kiểm tra kết nối mạng và thử lại
          </Text>
          <TouchableOpacity
            onPress={() => router.push('/(homes)/(appointment)')}
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
            <Pressable
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
            </Pressable>
            <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#FFFFFF', flex: 1 }}>
              Chọn dịch vụ
            </Text>
            <Pressable
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
            </Pressable>
          </View>
        </View>

        {/* Content */}
        <View style={{ paddingHorizontal: 24, marginTop: -80, marginBottom: 24 }}>
          {/* Selected Facility Info */}
          {selectedFacility && (
            <View
              style={{
                marginBottom: 16,
                backgroundColor: 'white',
                borderRadius: 12,
                padding: 12,
                borderWidth: 1,
                borderColor: '#E0F2FE',
              }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="location" size={16} color="#0284C7" />
                <Text style={{ marginLeft: 8, fontSize: 14, fontWeight: '600', color: '#0284C7' }}>
                  Cơ sở: {selectedFacility.name}
                </Text>
              </View>
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
                placeholder="Tìm dịch vụ"
                placeholderTextColor="#94A3B8"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
          </View>

          {/* Services List */}
          <View>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, index) => <ServiceSkeleton key={index} />)
            ) : filteredServices.length === 0 ? (
              <View className="mt-8 items-center">
                <Ionicons name="medical-outline" size={48} color="#94A3B8" />
                <Text className="mt-4 text-center text-base text-slate-600">
                  {searchQuery ? 'Không tìm thấy dịch vụ phù hợp' : 'Không có dịch vụ nào'}
                </Text>
              </View>
            ) : (
              filteredServices.map((service: Service) => (
                <Pressable
                  key={service.id}
                  onPress={() => handleServiceSelect(service.id)}
                  className={`mb-3 rounded-xl p-4 ${
                    selectedService === service.id
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
                      <View className="h-12 w-12 items-center justify-center rounded-full bg-purple-100">
                        <Ionicons name="medical" size={24} color="#8B5CF6" />
                      </View>
                    </View>

                    <View className="flex-1">
                      <View className="mb-1 flex-row items-center justify-between">
                        <Text className="text-base font-semibold text-slate-900">
                          {formatServiceNameWithConditions(service)}
                        </Text>
                        {selectedService === service.id && (
                          <View className="rounded-full bg-blue-600 p-1">
                            <Ionicons name="checkmark" size={16} color="white" />
                          </View>
                        )}
                      </View>

                      {service.description && (
                        <Text className="mb-2 text-sm text-slate-600">{service.description}</Text>
                      )}

                      <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center">
                          <Ionicons name="time-outline" size={16} color="#6B7280" />
                          <Text className="ml-1 text-sm text-slate-600">
                            {formatDuration(service.duration)}
                          </Text>
                        </View>

                        <View className="flex-row items-center">
                          <Ionicons name="cash-outline" size={16} color="#10B981" />
                          <Text className="ml-1 text-sm font-semibold text-green-600">
                            {formatPrice(service.price)}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                </Pressable>
              ))
            )}
          </View>
          {/* Continue Button */}
          {selectedService && (
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
                <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold' }}>Tiếp tục</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
