import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Doctor } from '@/types';
import { useAppointment } from '@/contexts/AppointmentContext';

const doctors: Doctor[] = [
  {
    id: '1',
    name: 'Bác sĩ Lê Thị Thu Hằng',
    specialty: 'Da liễu',
    experience: '15 năm kinh nghiệm',
    rating: 4.8,
    avatar: '👩‍⚕️',
    available: true,
  },
  {
    id: '2',
    name: 'Bác sĩ Nguyễn Văn A',
    specialty: 'Tim mạch',
    experience: '12 năm kinh nghiệm',
    rating: 4.9,
    avatar: '👨‍⚕️',
    available: true,
  },
  {
    id: '3',
    name: 'Bác sĩ Trần Thị B',
    specialty: 'Mắt',
    experience: '10 năm kinh nghiệm',
    rating: 4.7,
    avatar: '👩‍⚕️',
    available: false,
  },
  {
    id: '4',
    name: 'Bác sĩ Phạm Văn C',
    specialty: 'Ngoại chấn thương chỉnh hình',
    experience: '18 năm kinh nghiệm',
    rating: 4.9,
    avatar: '👨‍⚕️',
    available: true,
  },
  {
    id: '5',
    name: 'Bác sĩ Hoàng Thị D',
    specialty: 'Nhi',
    experience: '8 năm kinh nghiệm',
    rating: 4.6,
    avatar: '👩‍⚕️',
    available: true,
  },
];

export default function DoctorSelectionScreen() {
  const [selectedDoctor, setSelectedDoctor] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { setSelectedDoctor: setContextDoctor } = useAppointment();

  const filteredDoctors = doctors.filter(
    (doctor) =>
      doctor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doctor.specialty.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDoctorSelect = (doctorId: string) => {
    setSelectedDoctor(doctorId);
  };

  const handleContinue = () => {
    if (selectedDoctor) {
      const doctor = doctors.find((d) => d.id === selectedDoctor);
      if (doctor) {
        setContextDoctor(doctor.name);
        router.push('/appointment');
      }
    }
  };

  const handleBack = () => {
    router.push('/appointment');
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
          <View style={{ width: 24 }} />
        </View>
      </View>

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
        {filteredDoctors.map((doctor) => (
          <TouchableOpacity
            key={doctor.id}
            onPress={() => handleDoctorSelect(doctor.id)}
            className={`mb-3 rounded-xl p-4 ${
              selectedDoctor === doctor.id
                ? 'border-2 border-blue-500 bg-blue-50'
                : 'border border-slate-200 bg-white'
            } ${!doctor.available ? 'opacity-50' : ''}`}
            disabled={!doctor.available}
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 3,
              elevation: 1,
            }}>
            <View className="flex-row items-start">
              <View className="mr-4">
                <Text className="text-3xl">{doctor.avatar}</Text>
                {!doctor.available && (
                  <View className="absolute -right-1 -top-1 h-4 w-4 items-center justify-center rounded-full bg-red-500">
                    <Text className="text-xs font-bold text-white">!</Text>
                  </View>
                )}
              </View>

              <View className="flex-1">
                <View className="mb-1 flex-row items-center justify-between">
                  <Text className="text-base font-semibold text-slate-900">{doctor.name}</Text>
                  {selectedDoctor === doctor.id && (
                    <View className="rounded-full bg-blue-600 p-1">
                      <Ionicons name="checkmark" size={16} color="white" />
                    </View>
                  )}
                </View>

                <Text className="mb-1 text-sm font-medium text-blue-600">{doctor.specialty}</Text>

                <Text className="mb-2 text-sm text-slate-600">{doctor.experience}</Text>

                <View className="flex-row items-center">
                  <View className="mr-3 flex-row items-center">{renderStars(doctor.rating)}</View>
                  <Text className="text-sm text-slate-600">{doctor.rating || 0}/5</Text>
                </View>

                {!doctor.available && (
                  <Text className="mt-2 text-sm font-medium text-red-500">Không có lịch trống</Text>
                )}
              </View>
            </View>
          </TouchableOpacity>
        ))}
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
