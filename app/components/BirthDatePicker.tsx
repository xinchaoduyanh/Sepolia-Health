import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface BirthDatePickerProps {
  selectedDate: Date | null;
  onDateSelect: (date: Date) => void;
  placeholder?: string;
  error?: string;
}

export default function BirthDatePicker({
  selectedDate,
  onDateSelect,
  placeholder = 'Chọn ngày sinh',
  error,
}: BirthDatePickerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [tempDate, setTempDate] = useState(selectedDate || new Date());

  const handleDateSelect = (date: Date) => {
    onDateSelect(date);
    setIsVisible(false);
  };

  const handleCancel = () => {
    setTempDate(selectedDate || new Date());
    setIsVisible(false);
  };

  const formatDate = (date: Date) => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const getAge = (date: Date) => {
    const today = new Date();
    let age = today.getFullYear() - date.getFullYear();
    const monthDiff = today.getMonth() - date.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) {
      age--;
    }

    return age;
  };

  // Generate year options (from 1900 to current year)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 1899 }, (_, i) => currentYear - i);

  // Generate month options
  const months = [
    { value: 1, label: 'Tháng 1' },
    { value: 2, label: 'Tháng 2' },
    { value: 3, label: 'Tháng 3' },
    { value: 4, label: 'Tháng 4' },
    { value: 5, label: 'Tháng 5' },
    { value: 6, label: 'Tháng 6' },
    { value: 7, label: 'Tháng 7' },
    { value: 8, label: 'Tháng 8' },
    { value: 9, label: 'Tháng 9' },
    { value: 10, label: 'Tháng 10' },
    { value: 11, label: 'Tháng 11' },
    { value: 12, label: 'Tháng 12' },
  ];

  // Generate day options based on selected month and year
  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month, 0).getDate();
  };

  const days = Array.from(
    { length: getDaysInMonth(tempDate.getMonth() + 1, tempDate.getFullYear()) },
    (_, i) => i + 1
  );

  const handleYearChange = (year: number) => {
    const newDate = new Date(
      year,
      tempDate.getMonth(),
      Math.min(tempDate.getDate(), getDaysInMonth(tempDate.getMonth() + 1, year))
    );
    setTempDate(newDate);
  };

  const handleMonthChange = (month: number) => {
    const newDate = new Date(
      tempDate.getFullYear(),
      month - 1,
      Math.min(tempDate.getDate(), getDaysInMonth(month, tempDate.getFullYear()))
    );
    setTempDate(newDate);
  };

  const handleDayChange = (day: number) => {
    const newDate = new Date(tempDate.getFullYear(), tempDate.getMonth(), day);
    setTempDate(newDate);
  };

  return (
    <>
      <TouchableOpacity
        onPress={() => setIsVisible(true)}
        className={`flex-row items-center rounded-xl border px-5 py-4 ${
          error ? 'border-red-200 bg-red-50' : 'border-cyan-100 bg-teal-50'
        }`}>
        <Ionicons name="calendar-outline" size={22} color={error ? '#EF4444' : '#0284C7'} />
        <View className="ml-4 flex-1">
          <Text className="text-lg text-slate-900">
            {selectedDate ? formatDate(selectedDate) : placeholder}
          </Text>
          {selectedDate && (
            <Text className="text-sm text-slate-500">{getAge(selectedDate)} tuổi</Text>
          )}
        </View>
        <Ionicons name="chevron-down" size={22} color="#06B6D4" />
      </TouchableOpacity>

      <Modal visible={isVisible} transparent animationType="slide" onRequestClose={handleCancel}>
        <View className="flex-1 justify-end bg-black/50">
          <View className="rounded-t-3xl bg-teal-50">
            <View className="flex-row items-center justify-between border-b border-cyan-100 p-6">
              <Text className="text-lg font-bold text-slate-900">Chọn ngày sinh</Text>
              <View className="flex-row space-x-4">
                <TouchableOpacity onPress={handleCancel}>
                  <Text className="text-base text-slate-500">Hủy</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDateSelect(tempDate)}>
                  <Text className="text-base font-bold text-sky-600">Xong</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View className="p-6">
              <View className="flex-row space-x-4">
                {/* Day Picker */}
                <View className="flex-1">
                  <Text className="mb-2 text-sm font-bold text-slate-700">Ngày</Text>
                  <ScrollView className="h-32" showsVerticalScrollIndicator={false}>
                    {days.map((day) => (
                      <TouchableOpacity
                        key={day}
                        onPress={() => handleDayChange(day)}
                        className={`rounded-lg p-2 ${
                          tempDate.getDate() === day ? 'bg-cyan-100' : 'bg-cyan-50'
                        }`}>
                        <Text
                          className={`text-center ${
                            tempDate.getDate() === day ? 'font-bold text-sky-600' : 'text-slate-600'
                          }`}>
                          {day}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                {/* Month Picker */}
                <View className="flex-1">
                  <Text className="mb-2 text-sm font-bold text-slate-700">Tháng</Text>
                  <ScrollView className="h-32" showsVerticalScrollIndicator={false}>
                    {months.map((month) => (
                      <TouchableOpacity
                        key={month.value}
                        onPress={() => handleMonthChange(month.value)}
                        className={`rounded-lg p-2 ${
                          tempDate.getMonth() + 1 === month.value ? 'bg-cyan-100' : 'bg-cyan-50'
                        }`}>
                        <Text
                          className={`text-center ${
                            tempDate.getMonth() + 1 === month.value
                              ? 'font-bold text-sky-600'
                              : 'text-slate-600'
                          }`}>
                          {month.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                {/* Year Picker */}
                <View className="flex-1">
                  <Text className="mb-2 text-sm font-bold text-slate-700">Năm</Text>
                  <ScrollView className="h-32" showsVerticalScrollIndicator={false}>
                    {years.map((year) => (
                      <TouchableOpacity
                        key={year}
                        onPress={() => handleYearChange(year)}
                        className={`rounded-lg p-2 ${
                          tempDate.getFullYear() === year ? 'bg-cyan-100' : 'bg-cyan-50'
                        }`}>
                        <Text
                          className={`text-center ${
                            tempDate.getFullYear() === year
                              ? 'font-bold text-sky-600'
                              : 'text-slate-600'
                          }`}>
                          {year}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>

              {tempDate && (
                <View className="mt-4 rounded-lg bg-cyan-100 p-3">
                  <Text className="text-center text-lg font-bold text-slate-900">
                    {formatDate(tempDate)}
                  </Text>
                  <Text className="text-center text-sm text-slate-500">
                    {getAge(tempDate)} tuổi
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}
