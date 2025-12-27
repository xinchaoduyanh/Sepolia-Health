import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import {
  useAppointment,
  useUpdateAppointment,
  useDoctorAvailability,
  useAvailableDates,
} from '@/lib/api/appointments';
import { formatTime, formatDate, createISODateTime, isWithin4Hours } from '@/utils/datetime';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function UpdateAppointmentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const appointmentId = parseInt(id);

  const { data: appointment, isLoading: isLoadingAppointment } = useAppointment(appointmentId);
  const updateAppointmentMutation = useUpdateAppointment();

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<{
    startTime: string;
    endTime: string;
  } | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [notes, setNotes] = useState('');

  // Calculate date range (today to 30 days from now) - memoized to prevent re-renders
  const { startDate, endDate } = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0); // Set to start of today
    
    const end = new Date();
    end.setDate(end.getDate() + 30);
    
    return {
      startDate: start.toISOString(),
      endDate: end.toISOString(),
    };
  }, []); // Empty dependency array - only calculate once

  // Fetch available dates for the calendar
  const { data: availableDatesData } = useAvailableDates(
    appointment?.doctorServiceId ?? 0,
    startDate,
    endDate
  );

  // Fetch available time slots for selected date
  const { data: availabilityData, isLoading: isLoadingSlots } = useDoctorAvailability(
    appointment?.doctorServiceId ?? 0,
    selectedDate ? selectedDate.toISOString().split('T')[0] : ''
  );

  useEffect(() => {
    if (appointment) {
      setNotes(appointment.notes || '');
    }
  }, [appointment]);

  const handleDateChange = (event: any, date?: Date) => {
    setShowDatePicker(false);
    if (date) {
      setSelectedDate(date);
      setSelectedTimeSlot(null); // Reset time slot when date changes
    }
  };

  const handleTimeSlotSelect = (slot: { startTime: string; endTime: string }) => {
    setSelectedTimeSlot(slot);
  };

  const handleSubmit = async () => {
    if (!selectedDate || !selectedTimeSlot) {
      Alert.alert('Lỗi', 'Vui lòng chọn ngày và thời gian khám');
      return;
    }

    try {
      // Create ISO datetime strings by combining selected date with time slots
      const startTimeISO = createISODateTime(selectedDate.toISOString().split('T')[0], selectedTimeSlot.startTime);
      const endTimeISO = createISODateTime(selectedDate.toISOString().split('T')[0], selectedTimeSlot.endTime);

      await updateAppointmentMutation.mutateAsync({
        id: appointmentId,
        data: {
          startTime: startTimeISO,
          endTime: endTimeISO,
          notes,
        },
      });

      Alert.alert('Thành công', 'Cập nhật lịch hẹn thành công', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error: any) {
      Alert.alert('Lỗi', error?.response?.data?.message || 'Không thể cập nhật lịch hẹn');
    }
  };

  if (isLoadingAppointment) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#E0F2FE' }}>
        <ActivityIndicator size="large" color="#0284C7" />
        <Text style={{ marginTop: 16, fontSize: 16, color: '#6B7280' }}>Đang tải...</Text>
      </View>
    );
  }

  if (!appointment) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#E0F2FE' }}>
        <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
        <Text style={{ marginTop: 16, fontSize: 18, fontWeight: 'bold', color: '#1F2937' }}>
          Không tìm thấy lịch hẹn
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ marginTop: 24, paddingHorizontal: 24, paddingVertical: 12, backgroundColor: '#0284C7', borderRadius: 8 }}>
          <Text style={{ color: 'white', fontWeight: '600' }}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Check if appointment can be updated
  if (isWithin4Hours(appointment.startTime)) {
    return (
      <View style={{ flex: 1, backgroundColor: '#E0F2FE' }}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        
        {/* Header */}
        <LinearGradient
          colors={['#0284C7', '#06B6D4', '#10B981']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ paddingTop: 60, paddingBottom: 24, paddingHorizontal: 24 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 16 }}>
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: 'white' }}>Đổi lịch hẹn</Text>
          </View>
        </LinearGradient>

        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 }}>
          <View style={{ backgroundColor: 'white', borderRadius: 16, padding: 24, alignItems: 'center' }}>
            <Ionicons name="time-outline" size={64} color="#F59E0B" />
            <Text style={{ marginTop: 16, fontSize: 18, fontWeight: 'bold', color: '#1F2937', textAlign: 'center' }}>
              Không thể đổi lịch
            </Text>
            <Text style={{ marginTop: 8, fontSize: 14, color: '#6B7280', textAlign: 'center' }}>
              Bạn chỉ có thể đổi lịch hẹn trước ít nhất 4 giờ
            </Text>
            <TouchableOpacity
              onPress={() => router.back()}
              style={{ marginTop: 24, paddingHorizontal: 24, paddingVertical: 12, backgroundColor: '#0284C7', borderRadius: 8 }}>
              <Text style={{ color: 'white', fontWeight: '600' }}>Quay lại</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  const currentStartTime = new Date(appointment.startTime);
  const currentEndTime = new Date(currentStartTime.getTime() + appointment.service.duration * 60 * 1000);

  return (
    <View style={{ flex: 1, backgroundColor: '#E0F2FE' }}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Header */}
      <LinearGradient
        colors={['#0284C7', '#06B6D4', '#10B981']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ paddingTop: 60, paddingBottom: 24, paddingHorizontal: 24 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 16 }}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: 'white' }}>Đổi lịch hẹn</Text>
        </View>
      </LinearGradient>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 24 }}>
        {/* Current Appointment Info */}
        <View style={{ backgroundColor: 'white', borderRadius: 16, padding: 16, marginBottom: 24 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1F2937', marginBottom: 12 }}>
            Thông tin lịch hẹn hiện tại
          </Text>
          <View style={{ marginBottom: 8 }}>
            <Text style={{ fontSize: 14, color: '#6B7280' }}>Khách hàng</Text>
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#1F2937' }}>
              {appointment.patientProfile?.lastName} {appointment.patientProfile?.firstName}
            </Text>
          </View>
          <View style={{ marginBottom: 8 }}>
            <Text style={{ fontSize: 14, color: '#6B7280' }}>Dịch vụ</Text>
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#1F2937' }}>{appointment.service.name}</Text>
          </View>
          <View style={{ marginBottom: 8 }}>
            <Text style={{ fontSize: 14, color: '#6B7280' }}>Bác sĩ</Text>
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#1F2937' }}>
              BS. {appointment.doctor.lastName} {appointment.doctor.firstName}
            </Text>
          </View>
          <View style={{ marginBottom: 8 }}>
            <Text style={{ fontSize: 14, color: '#6B7280' }}>Địa điểm</Text>
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#1F2937' }}>
              {appointment.clinic?.name || 'Bệnh viện'}
            </Text>
          </View>
          <View style={{ marginBottom: 8 }}>
            <Text style={{ fontSize: 18, color: '#6B7280' }}>Thời gian hiện tại</Text>
            <Text style={{ fontSize: 20, fontWeight: '600', color: '#1F2937' }}>
              {formatTime(appointment.startTime)} - {formatTime(currentEndTime.toISOString())}
            </Text>
            <Text style={{ fontSize: 20, color: '#6B7280' }}>
              {formatDate(appointment.startTime)}
            </Text>
          </View>
          <View style={{ marginBottom: 8 }}>
            <Text style={{ fontSize: 18, color: '#6B7280' }}>Phí khám</Text>
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#0284C7' }}>
              {appointment.service.price.toLocaleString('vi-VN')} VNĐ
            </Text>
          </View>
        </View>

        {/* Date Picker */}
        <View style={{ backgroundColor: 'white', borderRadius: 16, padding: 16, marginBottom: 24 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1F2937', marginBottom: 12 }}>
            Chọn ngày mới
          </Text>
          <TouchableOpacity
            onPress={() => setShowDatePicker(true)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderWidth: 1,
              borderColor: '#E5E7EB',
              borderRadius: 8,
              padding: 12,
            }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="calendar-outline" size={20} color="#0284C7" />
              <Text style={{ marginLeft: 8, fontSize: 16, color: selectedDate ? '#1F2937' : '#9CA3AF' }}>
                {selectedDate
                  ? formatDate(selectedDate.toISOString())
                  : 'Chọn ngày khám'}
              </Text>
            </View>
            <Ionicons name="chevron-down" size={20} color="#6B7280" />
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={selectedDate || new Date()}
              mode="date"
              display="default"
              onChange={handleDateChange}
              minimumDate={new Date()}
              maximumDate={(() => {
                const maxDate = new Date();
                maxDate.setDate(maxDate.getDate() + 30);
                return maxDate;
              })()}
            />
          )}
        </View>

        {/* Time Slots */}
        {selectedDate && (
          <View style={{ backgroundColor: 'white', borderRadius: 16, padding: 16, marginBottom: 24 }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1F2937', marginBottom: 12 }}>
              Chọn giờ khám
            </Text>

            {isLoadingSlots ? (
              <View style={{ padding: 24, alignItems: 'center' }}>
                <ActivityIndicator size="small" color="#0284C7" />
                <Text style={{ marginTop: 8, fontSize: 14, color: '#6B7280' }}>Đang tải khung giờ...</Text>
              </View>
            ) : availabilityData?.availableTimeSlots && availabilityData.availableTimeSlots.length > 0 ? (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {availabilityData.availableTimeSlots.map((slot: { startTime: string; endTime: string; displayTime: string }, index: number) => {
                  const isSelected =
                    selectedTimeSlot?.startTime === slot.startTime &&
                    selectedTimeSlot?.endTime === slot.endTime;

                  return (
                    <TouchableOpacity
                      key={index}
                      onPress={() => handleTimeSlotSelect(slot)}
                      style={{
                        paddingHorizontal: 16,
                        paddingVertical: 12,
                        borderRadius: 8,
                        borderWidth: 2,
                        borderColor: isSelected ? '#0284C7' : '#E5E7EB',
                        backgroundColor: isSelected ? '#DBEAFE' : 'white',
                      }}>
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: isSelected ? '600' : '400',
                          color: isSelected ? '#0284C7' : '#1F2937',
                        }}>
                        {slot.displayTime}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : (
              <View style={{ padding: 24, alignItems: 'center' }}>
                <Ionicons name="calendar-outline" size={48} color="#9CA3AF" />
                <Text style={{ marginTop: 8, fontSize: 14, color: '#6B7280', textAlign: 'center' }}>
                  Không có khung giờ trống trong ngày này
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Submit Button */}
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={!selectedTimeSlot || updateAppointmentMutation.isPending}
          style={{
            backgroundColor: selectedTimeSlot && !updateAppointmentMutation.isPending ? '#0284C7' : '#9CA3AF',
            borderRadius: 12,
            padding: 16,
            alignItems: 'center',
            marginBottom: 24,
          }}>
          {updateAppointmentMutation.isPending ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold' }}>Xác nhận đổi lịch</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
