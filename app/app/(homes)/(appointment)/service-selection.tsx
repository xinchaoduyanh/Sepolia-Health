import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAppointment } from '@/contexts/AppointmentContext';
import { useServices } from '@/lib/api/appointments';
import { Service } from '@/types/doctor';

export default function ServiceSelectionScreen() {
  const [selectedService, setSelectedService] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { setSelectedService: setContextService, selectedFacility } = useAppointment();

  const { data: servicesData, isLoading, error } = useServices();

  const services = servicesData?.data || [];

  const filteredServices = services.filter(
    (service: Service) =>
      service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (service.description && service.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

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
        });
        router.push('./doctor-selection' as any);
      }
    }
  };

  const handleBack = () => {
    router.push('/(homes)/(appointment)/' as any);
  };

  const handleBackToAppointments = () => {
    router.push('/(homes)/(appointment)/' as any);
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

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50">
        <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#2563EB" />
          <Text className="mt-4 text-base text-slate-600">Đang tải danh sách dịch vụ...</Text>
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
            Không thể tải danh sách dịch vụ
          </Text>
          <Text className="mt-2 text-center text-sm text-slate-600">
            Vui lòng kiểm tra kết nối mạng và thử lại
          </Text>
          <TouchableOpacity
            onPress={() => router.push('/(homes)/(appointment)/' as any)}
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
          <Text className="text-xl font-bold text-slate-900">Chọn dịch vụ</Text>
          <TouchableOpacity onPress={handleBackToAppointments}>
            <Ionicons name="calendar-outline" size={24} color="#2563EB" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Selected Facility Info */}
      {selectedFacility && (
        <View className="mx-4 mt-4 rounded-xl bg-blue-50 p-3">
          <View className="flex-row items-center">
            <Ionicons name="location" size={16} color="#2563EB" />
            <Text className="ml-2 text-sm font-medium text-blue-800">
              Cơ sở: {selectedFacility.name}
            </Text>
          </View>
        </View>
      )}

      {/* Search Bar */}
      <View className="mb-4 mt-4 px-4">
        <View className="flex-row items-center rounded-xl border border-slate-200 bg-white px-4 py-3">
          <Ionicons name="search" size={20} color="#2563EB" />
          <TextInput
            className="ml-3 flex-1 text-base text-slate-900"
            placeholder="Tìm dịch vụ"
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Services List */}
      <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={true}>
        {filteredServices.length === 0 ? (
          <View className="mt-8 items-center">
            <Ionicons name="medical-outline" size={48} color="#94A3B8" />
            <Text className="mt-4 text-center text-base text-slate-600">
              {searchQuery ? 'Không tìm thấy dịch vụ phù hợp' : 'Không có dịch vụ nào'}
            </Text>
          </View>
        ) : (
          filteredServices.map((service: Service) => (
            <TouchableOpacity
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
                    <Text className="text-base font-semibold text-slate-900">{service.name}</Text>
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
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Continue Button */}
      {selectedService && (
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
