import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Specialty } from '@/types';
import { useAppointment } from '@/contexts/AppointmentContext';

const specialties: Specialty[] = [
  {
    id: 1,
    name: 'Da liễu',
    description:
      'Khoa Da liễu là khoa chuyên điều trị các bệnh về da và những phần phụ của da (tóc, móng,...)',
    icon: 'medical',
  },
  {
    id: 2,
    name: 'Khám sàng lọc tiêu hóa',
    description: '',
    icon: 'restaurant',
  },
  {
    id: 3,
    name: 'Khám sàng lọc tim mạch',
    description: '',
    icon: 'heart',
  },
  {
    id: 4,
    name: 'Khám sức khỏe tổng quát - Trẻ em',
    description:
      'Khám sức khỏe tổng quát cho trẻ từ 0-16 tuổi tại Vinmec giúp theo dõi toàn diện sự phát...',
    icon: 'people',
  },
  {
    id: 5,
    name: 'Mắt',
    description:
      'Khám và điều trị các bệnh lý nội khoa về mắt cũng như các phẫu thuật mắt như: mộng thịt,...',
    icon: 'eye',
  },
  {
    id: 6,
    name: 'Ngoại chấn thương chỉnh hình',
    description:
      'Khám thực hiện phẫu thuật các vấn đề chấn thương và di chứng chấn thương xương khớp...',
    icon: 'fitness',
  },
  {
    id: 7,
    name: 'Ngoại Thận - Tiết niệu',
    description:
      'Thực hiện các phẫu thuật nội soi và phẫu thuật mở điều trị các bệnh ngoại khoa Tiết niệu:...',
    icon: 'water',
  },
  {
    id: 8,
    name: 'Ngoại Tiêu hoá',
    description:
      'Phẫu thuật nội soi, phẫu thuật robot điều trị ung thư dạ dày, ung thư đại trực tràng, gan m...',
    icon: 'restaurant',
  },
  {
    id: 9,
    name: 'Nhi',
    description: '',
    icon: 'people',
  },
];

export default function SpecialtySelectionScreen() {
  const [selectedSpecialty, setSelectedSpecialty] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { setSelectedSpecialty: setContextSpecialty } = useAppointment();

  const filteredSpecialties = specialties.filter((specialty) =>
    specialty.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSpecialtySelect = (specialtyId: string) => {
    setSelectedSpecialty(specialtyId);
  };

  const handleContinue = () => {
    if (selectedSpecialty) {
      const specialty = specialties.find((s) => s.id === selectedSpecialty);
      if (specialty) {
        setContextSpecialty(specialty.name);
        router.push('/appointment' as any);
      }
    }
  };

  const handleBack = () => {
    router.push('/appointment');
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
          <Text className="text-xl font-bold text-slate-900">Chọn chuyên khoa</Text>
          <View style={{ width: 24 }} />
        </View>
      </View>

      {/* Search Bar */}
      <View className="mb-4 mt-4 px-4">
        <View className="flex-row items-center rounded-xl border border-slate-200 bg-white px-4 py-3">
          <Ionicons name="search" size={20} color="#2563EB" />
          <TextInput
            className="ml-3 flex-1 text-base text-slate-900"
            placeholder="Tìm chuyên khoa"
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Specialties List */}
      <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={true}>
        {filteredSpecialties.map((specialty) => (
          <TouchableOpacity
            key={specialty.id}
            onPress={() => handleSpecialtySelect(specialty.id)}
            className={`mb-3 rounded-xl p-4 ${
              selectedSpecialty === specialty.id
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
            <View className="flex-row items-start justify-between">
              <View className="mr-3 flex-1">
                <Text className="mb-1 text-base font-semibold text-slate-900">
                  {specialty.name}
                </Text>
                {specialty.description && (
                  <Text className="text-sm leading-5 text-slate-600">{specialty.description}</Text>
                )}
              </View>
              <View className="items-center justify-center">
                {selectedSpecialty === specialty.id ? (
                  <View className="rounded-full bg-blue-600 p-1">
                    <Ionicons name="checkmark" size={16} color="white" />
                  </View>
                ) : (
                  <View className="h-6 w-6 items-center justify-center rounded-full bg-blue-100">
                    <Ionicons name="information" size={14} color="#2563EB" />
                  </View>
                )}
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Continue Button */}
      {selectedSpecialty && (
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
