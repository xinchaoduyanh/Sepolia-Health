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
import { useLocations } from '@/lib/api/appointments';
import { Facility } from '@/types/doctor';

export default function FacilitySelectionScreen() {
  const [selectedFacility, setSelectedFacility] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { setSelectedFacility: setContextFacility } = useAppointment();

  const { data: locationsData, isLoading, error } = useLocations();

  const facilities = locationsData?.data || [];

  const filteredFacilities = facilities.filter(
    (facility: Facility) =>
      facility.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      facility.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleFacilitySelect = (facilityId: number) => {
    setSelectedFacility(facilityId);
  };

  const handleContinue = () => {
    if (selectedFacility) {
      const facility = facilities.find((f: Facility) => f.id === selectedFacility);
      if (facility) {
        setContextFacility({ id: facility.id, name: facility.name });
        router.push('./service-selection');
      }
    }
  };

  const handleBack = () => {
    router.push('/(homes)/(appointment)');
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50">
        <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#2563EB" />
          <Text className="mt-4 text-base text-slate-600">Đang tải danh sách cơ sở...</Text>
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
            Không thể tải danh sách cơ sở
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
    <SafeAreaView className="flex-1 bg-slate-50">
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {/* Header */}
      <View className="border-b border-slate-100 bg-white px-5 py-4">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color="#2563EB" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-slate-900">Chọn cơ sở</Text>
          <View style={{ width: 24 }} />
        </View>
      </View>

      {/* Search Bar */}
      <View className="mb-4 mt-4 px-4">
        <View className="flex-row items-center rounded-xl border border-slate-200 bg-white px-4 py-3">
          <Ionicons name="search" size={20} color="#2563EB" />
          <TextInput
            className="ml-3 flex-1 text-base text-slate-900"
            placeholder="Tìm cơ sở"
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Facilities List */}
      <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={true}>
        {filteredFacilities.length === 0 ? (
          <View className="mt-8 items-center">
            <Ionicons name="location-outline" size={48} color="#94A3B8" />
            <Text className="mt-4 text-center text-base text-slate-600">
              {searchQuery ? 'Không tìm thấy cơ sở phù hợp' : 'Không có cơ sở nào'}
            </Text>
          </View>
        ) : (
          filteredFacilities.map((facility: Facility) => (
            <TouchableOpacity
              key={facility.id}
              onPress={() => handleFacilitySelect(facility.id)}
              className={`mb-3 rounded-xl p-4 ${
                selectedFacility === facility.id
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
                  <View className="h-12 w-12 items-center justify-center rounded-full bg-green-100">
                    <Ionicons name="location" size={24} color="#10B981" />
                  </View>
                </View>

                <View className="flex-1">
                  <View className="mb-1 flex-row items-center justify-between">
                    <Text className="text-base font-semibold text-slate-900">{facility.name}</Text>
                    {selectedFacility === facility.id && (
                      <View className="rounded-full bg-blue-600 p-1">
                        <Ionicons name="checkmark" size={16} color="white" />
                      </View>
                    )}
                  </View>

                  <View className="mb-2 flex-row items-center">
                    <Ionicons name="location-outline" size={16} color="#6B7280" />
                    <Text className="ml-1 flex-1 text-sm text-slate-600">{facility.address}</Text>
                  </View>

                  {facility.phone && (
                    <View className="flex-row items-center">
                      <Ionicons name="call-outline" size={16} color="#6B7280" />
                      <Text className="ml-1 text-sm text-slate-600">{facility.phone}</Text>
                    </View>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Continue Button */}
      {selectedFacility && (
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
