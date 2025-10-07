import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DatePickerProps, DateOption } from '@/types';

export default function DatePicker({
  selectedDate,
  onDateSelect,
  placeholder = 'Chọn ngày',
}: DatePickerProps) {
  const [isVisible, setIsVisible] = useState(false);

  // Generate dates for the next 30 days
  const generateDates = (): DateOption[] => {
    const dates: DateOption[] = [];
    const today = new Date();

    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);

      const day = date.getDate();
      const month = date.getMonth() + 1;
      const year = date.getFullYear();

      let label = '';
      if (i === 0) label = 'Hôm nay';
      else if (i === 1) label = 'Ngày mai';
      else if (i === 2) label = 'Ngày kia';
      else label = `${day}/${month}`;

      dates.push({
        date: `${day}/${month}/${year}`,
        label,
        day: `Thg ${month} ${day.toString().padStart(2, '0')}`,
        isToday: i === 0,
        isTomorrow: i === 1,
        isDayAfter: i === 2,
      });
    }

    return dates;
  };

  const dates = generateDates();

  const handleDateSelect = (date: string) => {
    onDateSelect(date);
    setIsVisible(false);
  };

  const selectedDateOption = dates.find((d) => d.date === selectedDate);

  return (
    <>
      <TouchableOpacity
        onPress={() => setIsVisible(true)}
        className="flex-row items-center rounded-lg border border-blue-200 bg-white px-3 py-3">
        <Ionicons name="calendar" size={20} color="#2563EB" />
        <Text className="ml-2 flex-1 text-base text-blue-900">
          {selectedDateOption ? selectedDateOption.day : placeholder}
        </Text>
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
              <Text className="text-lg font-semibold text-black">Chọn ngày</Text>
              <TouchableOpacity onPress={() => setIsVisible(false)}>
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            <ScrollView className="max-h-80">
              <View className="p-4">
                <View className="flex-row flex-wrap">
                  {dates.map((dateOption, index) => (
                    <TouchableOpacity
                      key={dateOption.date}
                      onPress={() => handleDateSelect(dateOption.date)}
                      className={`mb-2 w-1/3 p-2 ${
                        selectedDate === dateOption.date ? 'bg-blue-600' : 'bg-gray-100'
                      } rounded-lg`}>
                      <Text
                        className={`text-center font-medium ${
                          selectedDate === dateOption.date ? 'text-white' : 'text-gray-600'
                        }`}>
                        {dateOption.day}
                      </Text>
                      <Text
                        className={`mt-1 text-center text-xs ${
                          selectedDate === dateOption.date ? 'text-white' : 'text-gray-500'
                        }`}>
                        {dateOption.label}
                      </Text>
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
