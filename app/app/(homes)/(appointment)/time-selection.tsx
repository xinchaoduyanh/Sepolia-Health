import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAppointment } from '@/contexts/AppointmentContext';
import { useDoctorAvailability } from '@/lib/api/appointments';
import { TimeSlot } from '@/types/doctor';

export default function TimeSelectionScreen() {
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'morning' | 'afternoon'>('morning');
  const {
    selectedDoctorServiceId,
    selectedDate,
    setSelectedTimeSlot: setContextTimeSlot,
    selectedFacility,
    selectedService,
    selectedDoctor,
  } = useAppointment();

  const {
    data: availabilityData,
    isLoading,
    error,
  } = useDoctorAvailability(selectedDoctorServiceId || 0, selectedDate || '');

  // Format thời gian hiển thị (7:00 -> 7h, 7:30 -> 7r)
  const formatTimeForDisplay = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const minute = parseInt(minutes);

    if (minute === 0) {
      return `${hour}h`;
    } else {
      return `${hour}r`;
    }
  };

  // Kiểm tra slot có available không
  const isTimeSlotAvailable = (time: string, bookedAppointments: any[]) => {
    const slotTime = new Date(`2000-01-01T${time}`);
    const slotEndTime = new Date(slotTime.getTime() + 30 * 60 * 1000); // +30 phút

    // Kiểm tra xem có appointment nào conflict không
    for (const appointment of bookedAppointments) {
      const appointmentStart = new Date(`2000-01-01T${appointment.startTime}`);
      const appointmentEnd = new Date(`2000-01-01T${appointment.endTime}`);

      // Nếu slot bị overlap với appointment thì không available
      if (
        (slotTime >= appointmentStart && slotTime < appointmentEnd) ||
        (slotEndTime > appointmentStart && slotEndTime <= appointmentEnd) ||
        (slotTime <= appointmentStart && slotEndTime >= appointmentEnd)
      ) {
        return false;
      }
    }

    return true;
  };

  // Tạo các slot thời gian 30 phút
  const timeSlots = useMemo(() => {
    if (!availabilityData) return { morning: [], afternoon: [] };

    const { workingHours, bookedAppointments } = availabilityData;
    const slots: { morning: TimeSlot[]; afternoon: TimeSlot[] } = {
      morning: [],
      afternoon: [],
    };

    // Parse thời gian làm việc
    const startTime = new Date(`2000-01-01T${workingHours.startTime}`);
    const endTime = new Date(`2000-01-01T${workingHours.endTime}`);

    // Tạo slot buổi sáng (từ startTime đến 12:30)
    const morningEnd = new Date(`2000-01-01T12:30:00`);
    let currentTime = new Date(startTime);

    while (currentTime < morningEnd && currentTime < endTime) {
      const timeString = currentTime.toTimeString().slice(0, 5);
      const displayTime = formatTimeForDisplay(timeString);
      const isAvailable = isTimeSlotAvailable(timeString, bookedAppointments);

      slots.morning.push({
        time: timeString,
        displayTime,
        isAvailable,
        isMorning: true,
      });

      // Tăng 30 phút
      currentTime.setMinutes(currentTime.getMinutes() + 30);
    }

    // Tạo slot buổi chiều (từ 13:00 đến endTime)
    const afternoonStart = new Date(`2000-01-01T13:00:00`);
    currentTime = new Date(afternoonStart);

    while (currentTime < endTime) {
      const timeString = currentTime.toTimeString().slice(0, 5);
      const displayTime = formatTimeForDisplay(timeString);
      const isAvailable = isTimeSlotAvailable(timeString, bookedAppointments);

      slots.afternoon.push({
        time: timeString,
        displayTime,
        isAvailable,
        isMorning: false,
      });

      // Tăng 30 phút
      currentTime.setMinutes(currentTime.getMinutes() + 30);
    }

    return slots;
  }, [availabilityData]);

  const handleTimeSelect = (time: string) => {
    setSelectedTimeSlot(time);
  };

  const handleContinue = () => {
    if (selectedTimeSlot) {
      setContextTimeSlot(selectedTimeSlot);
      router.push('./appointment-booking' as any);
    }
  };

  const handleBack = () => {
    router.push('./index' as any);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50">
        <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#2563EB" />
          <Text className="mt-4 text-base text-slate-600">Đang tải lịch khám...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !availabilityData) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50">
        <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
        <View className="flex-1 items-center justify-center px-4">
          <Ionicons name="alert-circle" size={48} color="#EF4444" />
          <Text className="mt-4 text-center text-base font-semibold text-slate-900">
            Không thể tải lịch khám
          </Text>
          <Text className="mt-2 text-center text-sm text-slate-600">
            Vui lòng kiểm tra kết nối mạng và thử lại
          </Text>
          <TouchableOpacity
            onPress={() => router.push('./index' as any)}
            className="mt-6 rounded-xl bg-blue-600 px-6 py-3">
            <Text className="text-base font-semibold text-white">Quay lại</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const currentSlots = selectedPeriod === 'morning' ? timeSlots.morning : timeSlots.afternoon;

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {/* Header */}
      <View className="border-b border-slate-100 bg-white px-5 py-4">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color="#2563EB" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-slate-900">Chọn thời gian</Text>
          <View style={{ width: 24 }} />
        </View>
      </View>

      {/* Selected Info */}
      <View className="mx-4 mt-4 rounded-xl bg-blue-50 p-4">
        <View className="mb-2 flex-row items-center">
          <Ionicons name="person" size={16} color="#2563EB" />
          <Text className="ml-2 text-sm font-medium text-blue-800">Bác sĩ: {selectedDoctor}</Text>
        </View>
        <View className="mb-2 flex-row items-center">
          <Ionicons name="medical" size={16} color="#2563EB" />
          <Text className="ml-2 text-sm font-medium text-blue-800">
            Dịch vụ: {selectedService?.name}
          </Text>
        </View>
        <View className="flex-row items-center">
          <Ionicons name="calendar" size={16} color="#2563EB" />
          <Text className="ml-2 text-sm font-medium text-blue-800">
            Ngày: {selectedDate && formatDate(selectedDate)}
          </Text>
        </View>
      </View>

      {/* Period Selection */}
      <View className="mx-4 mt-6 flex-row space-x-4">
        <TouchableOpacity
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
      <ScrollView className="flex-1 px-4 py-6" showsVerticalScrollIndicator={false}>
        {currentSlots.length === 0 ? (
          <View className="mt-8 items-center">
            <Ionicons name="time-outline" size={48} color="#94A3B8" />
            <Text className="mt-4 text-center text-base text-slate-600">
              Không có slot thời gian nào trong{' '}
              {selectedPeriod === 'morning' ? 'buổi sáng' : 'buổi chiều'}
            </Text>
          </View>
        ) : (
          <View className="flex-row flex-wrap gap-3">
            {currentSlots.map((slot, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => slot.isAvailable && handleTimeSelect(slot.time)}
                disabled={!slot.isAvailable}
                className={`w-20 rounded-xl border-2 px-3 py-4 ${
                  selectedTimeSlot === slot.time
                    ? 'border-blue-500 bg-blue-50'
                    : slot.isAvailable
                      ? 'border-slate-200 bg-white'
                      : 'border-slate-100 bg-slate-100'
                }`}
                style={{
                  shadowColor: slot.isAvailable ? '#000' : 'transparent',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: slot.isAvailable ? 0.05 : 0,
                  shadowRadius: 3,
                  elevation: slot.isAvailable ? 1 : 0,
                }}>
                <Text
                  className={`text-center text-lg font-semibold ${
                    selectedTimeSlot === slot.time
                      ? 'text-blue-600'
                      : slot.isAvailable
                        ? 'text-slate-900'
                        : 'text-slate-400'
                  }`}>
                  {slot.displayTime}
                </Text>
                {!slot.isAvailable && (
                  <View className="mt-1 flex-row justify-center">
                    <Ionicons name="close-circle" size={16} color="#94A3B8" />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Continue Button */}
      {selectedTimeSlot && (
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
