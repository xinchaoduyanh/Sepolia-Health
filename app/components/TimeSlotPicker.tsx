import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface TimeSlot {
  startTime: string;
  endTime: string;
  displayTime: string;
  period: 'morning' | 'afternoon';
}

interface TimeSlotPickerProps {
  availableTimeSlots: TimeSlot[];
  selectedTimeSlot: string | null;
  onTimeSlotSelect: (timeSlot: string) => void;
  isLoading?: boolean;
  error?: string | null;
}

export default function TimeSlotPicker({
  availableTimeSlots,
  selectedTimeSlot,
  onTimeSlotSelect,
  isLoading = false,
  error = null,
}: TimeSlotPickerProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<'morning' | 'afternoon'>('morning');
  if (isLoading) {
    return (
      <View className="flex-row items-center justify-center space-x-4 py-8">
        <ActivityIndicator size="small" color="#0284C7" />
        <Text className="text-gray-600">Đang tải khung giờ khả dụng...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-row items-center justify-center space-x-4 py-8">
        <Ionicons name="warning" size={20} color="#EF4444" />
        <Text className="text-red-600">{error}</Text>
      </View>
    );
  }

  if (!availableTimeSlots || availableTimeSlots.length === 0) {
    return (
      <View className="flex-row items-center justify-center space-x-4 py-8">
        <Ionicons name="time-outline" size={20} color="#6B7280" />
        <Text className="text-gray-600">Bác sĩ không có khung giờ khả dụng trong ngày này</Text>
      </View>
    );
  }

  // Filter timeslots by selected period
  const filteredSlots = availableTimeSlots.filter((slot) => slot.period === selectedPeriod);

  return (
    <View className="gap-4">
      {/* Period Selection */}
      <View className="flex-row gap-4">
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setSelectedPeriod('morning')}
          className={`flex-1 rounded-xl border-2 px-5 py-4 ${
            selectedPeriod === 'morning' ? 'border-blue-500' : 'border-slate-200'
          }`}
          style={{
            backgroundColor: selectedPeriod === 'morning' ? '#E0F2FE' : '#F8FAFC',
          }}>
          <View className="flex-row items-center justify-center">
            <Ionicons
              name="sunny"
              size={20}
              color={selectedPeriod === 'morning' ? '#2563EB' : '#6B7280'}
            />
            <Text
              className={`ml-2 text-base font-medium ${
                selectedPeriod === 'morning' ? 'text-blue-600' : 'text-slate-600'
              }`}>
              Buổi sáng
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setSelectedPeriod('afternoon')}
          className={`flex-1 rounded-xl border-2 px-5 py-4 ${
            selectedPeriod === 'afternoon' ? 'border-blue-500' : 'border-slate-200'
          }`}
          style={{
            backgroundColor: selectedPeriod === 'afternoon' ? '#E0F2FE' : '#F8FAFC',
          }}>
          <View className="flex-row items-center justify-center">
            <Ionicons
              name="moon"
              size={20}
              color={selectedPeriod === 'afternoon' ? '#2563EB' : '#6B7280'}
            />
            <Text
              className={`ml-2 text-base font-medium ${
                selectedPeriod === 'afternoon' ? 'text-blue-600' : 'text-slate-600'
              }`}>
              Buổi chiều
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Time Slots */}
      {filteredSlots.length === 0 ? (
        <View className="rounded-xl border border-blue-200 bg-blue-50 p-1">
          <View className="mb-1 flex-row items-center justify-center">
            <Ionicons name="time-outline" size={20} color="#3B82F6" />
            <Text className="text-lg font-semibold text-blue-800">Không có lịch trống</Text>
          </View>
          <Text className="text-center text-blue-700">
            Không có khung giờ khả dụng trong buổi {selectedPeriod === 'morning' ? 'sáng' : 'chiều'}
            . Vui lòng chọn buổi khác.
          </Text>
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="gap-3"
          contentContainerStyle={{ paddingHorizontal: 4 }}>
          {filteredSlots.map((slot, index) => (
            <TouchableOpacity
              activeOpacity={1}
              key={index}
              onPress={() => onTimeSlotSelect(slot.startTime)}
              className={`min-w-[120px] rounded-xl px-4 py-3 ${
                selectedTimeSlot === slot.startTime
                  ? 'bg-[#0284C7]'
                  : 'border border-[#E0F2FE] bg-[#F0FDFA]'
              }`}
              style={{
                shadowColor: selectedTimeSlot === slot.startTime ? '#0284C7' : '#000',
                shadowOffset: {
                  width: 0,
                  height: selectedTimeSlot === slot.startTime ? 2 : 1,
                },
                shadowOpacity: selectedTimeSlot === slot.startTime ? 0.2 : 0.1,
                shadowRadius: selectedTimeSlot === slot.startTime ? 4 : 2,
                elevation: selectedTimeSlot === slot.startTime ? 3 : 1,
              }}>
              <View className="items-center">
                <Ionicons
                  name="time-outline"
                  size={20}
                  color={selectedTimeSlot === slot.startTime ? '#FFFFFF' : '#0284C7'}
                />
                <Text
                  className={`mt-1 text-sm font-medium ${
                    selectedTimeSlot === slot.startTime ? 'text-white' : 'text-[#0284C7]'
                  }`}>
                  {slot.displayTime}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
}
