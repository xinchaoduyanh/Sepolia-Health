import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TimePickerProps, TimeSlot } from '@/types';

export default function TimePicker({
  selectedTime,
  onTimeSelect,
  placeholder = 'Chọn giờ',
  availableTimes = [],
}: TimePickerProps) {
  const [isVisible, setIsVisible] = useState(false);

  // Generate time slots from 8:00 to 17:00
  const generateTimeSlots = (): TimeSlot[] => {
    const slots: TimeSlot[] = [];

    for (let hour = 8; hour <= 17; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const isAvailable = availableTimes.length === 0 || availableTimes.includes(timeString);

        slots.push({
          time: timeString,
          label: timeString,
          available: isAvailable,
        });
      }
    }

    return slots;
  };

  const timeSlots = generateTimeSlots();

  const handleTimeSelect = (time: string) => {
    onTimeSelect(time);
    setIsVisible(false);
  };

  return (
    <>
      <TouchableOpacity
        onPress={() => setIsVisible(true)}
        className="flex-row items-center rounded-lg border border-blue-200 bg-white px-3 py-3">
        <Ionicons name="time" size={20} color="#2563EB" />
        <Text className="ml-2 flex-1 text-base text-blue-900">{selectedTime || placeholder}</Text>
        <Ionicons name="chevron-down" size={20} color="#6B7280" />
      </TouchableOpacity>

      <Modal
        visible={isVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsVisible(false)}>
        <View className="flex-1 justify-end bg-black/50">
          <View className="max-h-96 rounded-t-3xl bg-white">
            <View className="flex-row items-center justify-between border-b border-gray-200 p-4">
              <Text className="text-lg font-semibold text-black">Chọn giờ</Text>
              <TouchableOpacity onPress={() => setIsVisible(false)}>
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            <ScrollView className="max-h-80">
              <View className="p-4">
                <View className="flex-row flex-wrap">
                  {timeSlots.map((timeSlot) => (
                    <TouchableOpacity
                      key={timeSlot.time}
                      onPress={() => timeSlot.available && handleTimeSelect(timeSlot.time)}
                      disabled={!timeSlot.available}
                      className={`mb-2 w-1/3 rounded-lg p-3 ${
                        selectedTime === timeSlot.time
                          ? 'bg-blue-600'
                          : timeSlot.available
                            ? 'bg-gray-100'
                            : 'bg-gray-200 opacity-50'
                      }`}>
                      <Text
                        className={`text-center font-medium ${
                          selectedTime === timeSlot.time
                            ? 'text-white'
                            : timeSlot.available
                              ? 'text-gray-600'
                              : 'text-gray-400'
                        }`}>
                        {timeSlot.label}
                      </Text>
                      {!timeSlot.available && (
                        <Text className="mt-1 text-center text-xs text-gray-400">Đã kín</Text>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}
