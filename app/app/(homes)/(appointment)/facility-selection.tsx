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
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
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
              Chọn cơ sở
            </Text>
          </View>
        </View>

        {/* Content */}
        <View style={{ paddingHorizontal: 24, marginTop: -80, marginBottom: 24 }}>
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
                placeholder="Tìm cơ sở"
                placeholderTextColor="#94A3B8"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
          </View>

          {/* Facilities List */}
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
                      <Text className="text-base font-semibold text-slate-900">
                        {facility.name}
                      </Text>
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

          {/* Continue Button */}
          {selectedFacility && (
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
