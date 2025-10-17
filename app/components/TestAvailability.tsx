import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { useDoctorAvailability } from '@/lib/api/appointments';

interface TestAvailabilityProps {
  doctorServiceId: number;
  date: string;
}

export default function TestAvailability({ doctorServiceId, date }: TestAvailabilityProps) {
  const [isVisible, setIsVisible] = useState(false);

  const { data: availabilityData, isLoading, error } = useDoctorAvailability(doctorServiceId, date);

  const handleTest = () => {
    if (error) {
      Alert.alert('Lỗi', `Không thể tải dữ liệu: ${error.message}`);
      return;
    }

    if (!availabilityData) {
      Alert.alert('Thông báo', 'Không có dữ liệu');
      return;
    }

    const message = `
Bác sĩ: ${availabilityData.doctorName}
Chuyên khoa: ${availabilityData.specialty}
Dịch vụ: ${availabilityData.serviceName}
Thời gian: ${availabilityData.serviceDuration} phút
Ngày: ${availabilityData.date}
Giờ làm việc: ${availabilityData.workingHours.startTime} - ${availabilityData.workingHours.endTime}
Số khung giờ khả dụng: ${availabilityData.availableTimeSlots.length}

Các khung giờ khả dụng:
${availabilityData.availableTimeSlots.map((slot) => `• ${slot.displayTime}`).join('\n')}
    `;

    Alert.alert('Thông tin bác sĩ', message);
  };

  if (!isVisible) {
    return (
      <TouchableOpacity
        onPress={() => setIsVisible(true)}
        className="rounded-lg bg-blue-500 px-4 py-2">
        <Text className="font-medium text-white">Test API Availability</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View className="rounded-lg border border-gray-300 bg-gray-50 p-4">
      <View className="mb-2 flex-row items-center justify-between">
        <Text className="text-lg font-bold">Test API</Text>
        <TouchableOpacity
          onPress={() => setIsVisible(false)}
          className="rounded-full bg-gray-200 px-2 py-1">
          <Text className="text-xs">Đóng</Text>
        </TouchableOpacity>
      </View>

      <Text className="mb-2 text-sm text-gray-600">DoctorServiceId: {doctorServiceId}</Text>
      <Text className="mb-4 text-sm text-gray-600">Date: {date}</Text>

      {isLoading && <Text className="text-blue-600">Đang tải...</Text>}

      {error && <Text className="text-red-600">Lỗi: {error.message}</Text>}

      {availabilityData && (
        <View>
          <Text className="mb-2 font-medium text-green-600">✅ API hoạt động bình thường</Text>
          <Text className="text-sm">
            Có {availabilityData.availableTimeSlots.length} khung giờ khả dụng
          </Text>
        </View>
      )}

      <TouchableOpacity onPress={handleTest} className="mt-3 rounded-lg bg-green-500 px-4 py-2">
        <Text className="text-center font-medium text-white">Xem chi tiết</Text>
      </TouchableOpacity>
    </View>
  );
}
