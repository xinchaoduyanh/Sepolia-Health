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

  // Define colors based on period
  const isMorning = selectedPeriod === 'morning';

  // Morning Theme (Amber/Orange)
  const morningColors = {
    selectedBg: '#F59E0B', // amber-500
    selectedBorder: '#D97706', // amber-600
    unselectedBg: '#FFFBEB', // amber-50
    unselectedBorder: '#FDE68A', // amber-200
    selectedText: '#FFFFFF',
    unselectedText: '#B45309', // amber-700
    iconSelected: '#FFFFFF',
    iconUnselected: '#F59E0B', // amber-500
  };

  // Afternoon Theme (Blue/Indigo)
  const afternoonColors = {
    selectedBg: '#3B82F6', // blue-500
    selectedBorder: '#2563EB', // blue-600
    unselectedBg: '#EFF6FF', // blue-50
    unselectedBorder: '#BFDBFE', // blue-200
    selectedText: '#FFFFFF',
    unselectedText: '#1D4ED8', // blue-700
    iconSelected: '#FFFFFF',
    iconUnselected: '#3B82F6', // blue-500
  };

  return (
    <View className="gap-5">
      {/* Period Selection */}
      <View className="flex-row gap-4">
        {/* Morning Button */}
        <TouchableOpacity
          onPress={() => setSelectedPeriod('morning')}
          style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: 14,
            paddingHorizontal: 16,
            borderRadius: 12,
            backgroundColor: isMorning ? morningColors.selectedBg : morningColors.unselectedBg,
            borderColor: isMorning ? morningColors.selectedBorder : morningColors.unselectedBorder,
            borderWidth: 1,
            shadowColor: isMorning ? morningColors.selectedBg : '#000',
            shadowOffset: { width: 0, height: isMorning ? 2 : 1 },
            shadowOpacity: isMorning ? 0.3 : 0.05,
            shadowRadius: isMorning ? 4 : 2,
            elevation: isMorning ? 3 : 1,
          }}
        >
          <Ionicons
            name="sunny"
            size={20}
            color={isMorning ? morningColors.iconSelected : morningColors.iconUnselected}
          />
          <Text
            style={{
              marginLeft: 8,
              fontSize: 16,
              fontWeight: isMorning ? '600' : '500',
              color: isMorning ? morningColors.selectedText : morningColors.unselectedText,
            }}
          >
            Buổi sáng
          </Text>
        </TouchableOpacity>

        {/* Afternoon Button */}
        <TouchableOpacity
          onPress={() => setSelectedPeriod('afternoon')}
          style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: 14,
            paddingHorizontal: 16,
            borderRadius: 12,
            backgroundColor: !isMorning ? afternoonColors.selectedBg : afternoonColors.unselectedBg,
            borderColor: !isMorning ? afternoonColors.selectedBorder : afternoonColors.unselectedBorder,
            borderWidth: 1,
            shadowColor: !isMorning ? afternoonColors.selectedBg : '#000',
            shadowOffset: { width: 0, height: !isMorning ? 2 : 1 },
            shadowOpacity: !isMorning ? 0.3 : 0.05,
            shadowRadius: !isMorning ? 4 : 2,
            elevation: !isMorning ? 3 : 1,
          }}
        >
          <Ionicons
            name={!isMorning ? "moon" : "moon-outline"}
            size={20}
            color={!isMorning ? afternoonColors.iconSelected : afternoonColors.iconUnselected}
          />
          <Text
            style={{
              marginLeft: 8,
              fontSize: 16,
              fontWeight: !isMorning ? '600' : '500',
              color: !isMorning ? afternoonColors.selectedText : afternoonColors.unselectedText,
            }}
          >
            Buổi chiều
          </Text>
        </TouchableOpacity>
      </View>

      {/* Time Slots */}
      {filteredSlots.length === 0 ? (
        <View
          className="rounded-xl border p-6 items-center justify-center"
          style={{
            backgroundColor: isMorning ? '#FFFBEB' : '#EFF6FF',
            borderColor: isMorning ? '#FDE68A' : '#BFDBFE',
          }}
        >
          <View className="mb-2 flex-row items-center justify-center">
            <Ionicons
              name="time-outline"
              size={24}
              color={isMorning ? '#F59E0B' : '#3B82F6'}
            />
          </View>
          <Text
            className="text-lg font-semibold mb-1"
            style={{ color: isMorning ? '#B45309' : '#1D4ED8' }}
          >
            Không có lịch trống
          </Text>
          <Text
            className="text-center"
            style={{ color: isMorning ? '#D97706' : '#2563EB' }}
          >
            Bác sĩ không có lịch trống vào buổi {isMorning ? 'sáng' : 'chiều'}.
          </Text>
        </View>
      ) : (
        <View>
          <Text className="mb-3 text-sm font-medium text-slate-500">
            Các khung giờ khả dụng:
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingRight: 20, gap: 12 }}
          >
            {filteredSlots.map((slot, index) => {
              const isSelected = selectedTimeSlot === slot.startTime;

              // Determine colors for slots based on period
              const activeColors = isMorning ? morningColors : afternoonColors;

              return (
                <TouchableOpacity
                  key={index}
                  onPress={() => onTimeSlotSelect(slot.startTime)}
                  style={{
                    minWidth: 100,
                    paddingVertical: 12,
                    paddingHorizontal: 16,
                    borderRadius: 12,
                    backgroundColor: isSelected ? activeColors.selectedBg : '#FFFFFF',
                    borderColor: isSelected ? activeColors.selectedBorder : '#E2E8F0',
                    borderWidth: 1,
                    alignItems: 'center',
                    justifyContent: 'center',
                    shadowColor: isSelected ? activeColors.selectedBg : '#000',
                    shadowOffset: { width: 0, height: isSelected ? 2 : 1 },
                    shadowOpacity: isSelected ? 0.25 : 0.05,
                    shadowRadius: isSelected ? 4 : 2,
                    elevation: isSelected ? 3 : 1,
                  }}
                >
                  <Ionicons
                    name="time-outline"
                    size={18}
                    color={isSelected ? '#FFFFFF' : '#64748B'}
                    style={{ marginBottom: 4 }}
                  />
                  <Text
                    style={{
                      fontSize: 15,
                      fontWeight: isSelected ? '700' : '500',
                      color: isSelected ? '#FFFFFF' : '#334155',
                    }}
                  >
                    {slot.displayTime}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}
    </View>
  );
}
