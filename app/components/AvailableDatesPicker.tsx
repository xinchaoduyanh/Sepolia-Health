import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAvailableDates } from '@/lib/api/appointments';

interface AvailableDatesPickerProps {
  doctorServiceId: number | null;
  selectedDate: string | null;
  onDateSelect: (date: string) => void;
  onError?: (error: string) => void;
}

export default function AvailableDatesPicker({
  doctorServiceId,
  selectedDate,
  onDateSelect,
  onError,
}: AvailableDatesPickerProps) {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string>('');

  // Calculate date range (next 30 days)
  const today = new Date();
  const endDate = new Date(today);
  endDate.setDate(today.getDate() + 30);

  const startDateStr = today.toISOString().split('T')[0];
  const endDateStr = endDate.toISOString().split('T')[0];

  const {
    data: availableDatesData,
    isLoading,
    error,
  } = useAvailableDates(doctorServiceId || 0, startDateStr, endDateStr);

  useEffect(() => {
    if (error && onError) {
      onError('Không thể tải danh sách ngày khả dụng');
    }
  }, [error, onError]);

  const handleDateSelect = (date: string) => {
    onDateSelect(date);
    setShowDatePicker(false);
  };

  const handleCustomDatePress = () => {
    setSelectedDay('');
    setShowDatePicker(true);
  };

  const formatDateDisplay = (dateStr: string) => {
    const date = new Date(dateStr);
    const dayName = date.toLocaleDateString('vi-VN', { weekday: 'short' });
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const isToday = dateStr === startDateStr;

    return {
      dayName,
      day,
      month,
      isToday,
      fullDate: dateStr,
    };
  };

  const getAvailableDates = () => {
    if (!availableDatesData?.availableDates) return [];
    return availableDatesData.availableDates.slice(0, 30); // Limit to 30 days
  };

  const availableDates = getAvailableDates();

  if (isLoading) {
    return (
      <View className="flex-row items-center justify-center space-x-4">
        <ActivityIndicator size="small" color="#0284C7" />
        <Text className="text-gray-600">Đang tải ngày khả dụng...</Text>
      </View>
    );
  }

  if (error || !availableDates.length) {
    return (
      <View className="flex-row items-center justify-center space-x-4">
        <Ionicons name="warning" size={20} color="#EF4444" />
        <Text className="text-red-600">Không có ngày khả dụng</Text>
      </View>
    );
  }

  return (
    <>
      <View className="flex-row space-x-4">
        {/* Show first 3 available dates */}
        {availableDates.slice(0, 3).map((dateInfo, index) => {
          const displayInfo = formatDateDisplay(dateInfo.date);
          return (
            <TouchableOpacity
              key={index}
              onPress={() => handleDateSelect(dateInfo.date)}
              className={`flex-1 rounded-xl px-4 py-4 ${
                selectedDate === dateInfo.date ? 'bg-[#0284C7]' : 'bg-[#F0FDFA]'
              }`}
              style={{
                borderColor: selectedDate === dateInfo.date ? '#0284C7' : '#E0F2FE',
                borderWidth: selectedDate === dateInfo.date ? 2 : 1,
              }}>
              <Text
                className={`text-center text-base font-medium ${
                  selectedDate === dateInfo.date ? 'text-white' : 'text-[#475569]'
                }`}>
                {displayInfo.dayName} {displayInfo.day}/{displayInfo.month}
              </Text>
              <Text
                className={`mt-1 text-center text-sm ${
                  selectedDate === dateInfo.date ? 'text-blue-100' : 'text-[#475569]'
                }`}>
                {displayInfo.isToday ? 'Hôm nay' : ''}
              </Text>
            </TouchableOpacity>
          );
        })}

        {/* "Ngày Khác" button */}
        <TouchableOpacity
          onPress={handleCustomDatePress}
          className="flex-1 items-center justify-center rounded-xl px-4 py-4"
          style={{
            backgroundColor:
              selectedDate && !availableDates.slice(0, 3).some((d) => d.date === selectedDate)
                ? '#0284C7'
                : '#F0FDFA',
            borderColor:
              selectedDate && !availableDates.slice(0, 3).some((d) => d.date === selectedDate)
                ? '#0284C7'
                : '#E0F2FE',
            borderWidth:
              selectedDate && !availableDates.slice(0, 3).some((d) => d.date === selectedDate)
                ? 2
                : 1,
          }}>
          {selectedDate && !availableDates.slice(0, 3).some((d) => d.date === selectedDate) ? (
            <View className="items-center">
              <Text className="text-xs font-medium text-white">
                {formatDateDisplay(selectedDate).dayName}
              </Text>
              <Text className="text-lg font-bold text-white">
                {formatDateDisplay(selectedDate).day}
              </Text>
              <Text className="text-xs font-medium text-white">
                Thg {formatDateDisplay(selectedDate).month}
              </Text>
            </View>
          ) : (
            <View className="items-center">
              <Ionicons name="calendar-outline" size={24} color="#0284C7" />
              <Text className="mt-1 text-sm font-medium text-[#0284C7]">Ngày Khác</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Date Picker Modal */}
      {showDatePicker && (
        <View className="absolute inset-0 z-50 flex-1 justify-end bg-black/50">
          <View className="max-h-96 rounded-t-3xl p-6" style={{ backgroundColor: '#F0FDFA' }}>
            <View className="mb-4 flex-row items-center justify-between">
              <Text className="text-lg font-bold" style={{ color: '#0F172A' }}>
                Chọn ngày khám
              </Text>
              <TouchableOpacity
                onPress={() => setShowDatePicker(false)}
                className="h-8 w-8 items-center justify-center rounded-full"
                style={{ backgroundColor: '#E0F2FE' }}>
                <Ionicons name="close" size={20} color="#06B6D4" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View className="flex-row flex-wrap gap-3">
                {availableDates.map((dateInfo, index) => {
                  const displayInfo = formatDateDisplay(dateInfo.date);
                  return (
                    <TouchableOpacity
                      key={index}
                      onPress={() => handleDateSelect(dateInfo.date)}
                      className={`w-20 rounded-xl border-2 px-2 py-3 ${
                        selectedDay === displayInfo.day.toString().padStart(2, '0')
                          ? 'border-[#0284C7]'
                          : 'border-[#E0F2FE]'
                      }`}
                      style={{
                        backgroundColor:
                          selectedDay === displayInfo.day.toString().padStart(2, '0')
                            ? '#E0F2FE'
                            : '#F9FAFB',
                      }}>
                      <Text
                        className={`text-center text-sm font-medium ${
                          selectedDay === displayInfo.day.toString().padStart(2, '0')
                            ? 'text-[#0284C7]'
                            : 'text-[#475569]'
                        }`}>
                        {displayInfo.dayName}
                      </Text>
                      <Text
                        className={`mt-1 text-center text-lg font-bold ${
                          selectedDay === displayInfo.day.toString().padStart(2, '0')
                            ? 'text-[#0284C7]'
                            : 'text-[#0F172A]'
                        }`}>
                        {displayInfo.day}
                      </Text>
                      <Text
                        className={`text-center text-xs ${
                          selectedDay === displayInfo.day.toString().padStart(2, '0')
                            ? 'text-[#0284C7]'
                            : 'text-[#475569]'
                        }`}>
                        Thg {displayInfo.month}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            <View className="mt-4 rounded-xl p-3" style={{ backgroundColor: '#E0F2FE' }}>
              <View className="flex-row items-center">
                <Ionicons name="information-circle" size={20} color="#0284C7" />
                <Text className="ml-2 text-sm" style={{ color: '#0284C7' }}>
                  Chỉ hiển thị những ngày bác sĩ có thể làm việc
                </Text>
              </View>
            </View>
          </View>
        </View>
      )}
    </>
  );
}
