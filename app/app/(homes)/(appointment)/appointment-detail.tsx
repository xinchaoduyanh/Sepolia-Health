import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useAppointment } from '@/lib/api/appointments';
import { formatDate, formatTime } from '@/utils/datetime';

export default function AppointmentDetailScreen() {
  const { id } = useLocalSearchParams();
  const { data: appointment, isLoading } = useAppointment(Number(id));

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#E0F2FE' }}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <Text style={{ fontSize: 16, color: '#6B7280' }}>Đang tải...</Text>
      </View>
    );
  }

  if (!appointment) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#E0F2FE' }}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <Text style={{ fontSize: 16, color: '#6B7280' }}>Không tìm thấy lịch hẹn</Text>
      </View>
    );
  }

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
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: 'white' }}>Thông tin đặt hẹn</Text>
        </View>
      </LinearGradient>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 24 }}>
        {/* Customer Section */}
        <View style={{ backgroundColor: 'white', borderRadius: 16, padding: 16, marginBottom: 16 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1F2937', marginBottom: 12 }}>
            Khách hàng
          </Text>
          <View style={{ marginBottom: 8 }}>
            <Text style={{ fontSize: 14, color: '#6B7280' }}>Khách hàng</Text>
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#1F2937' }}>
              {appointment.patientProfile?.firstName} {appointment.patientProfile?.lastName}
            </Text>
          </View>
          <View style={{ marginBottom: 8 }}>
            <Text style={{ fontSize: 14, color: '#6B7280' }}>Lý do khám</Text>
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#1F2937' }}>
              {appointment.notes || 'Không có ghi chú'}
            </Text>
          </View>
        </View>

        {/* Doctor Section */}
        <View style={{ backgroundColor: 'white', borderRadius: 16, padding: 16, marginBottom: 16 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1F2937', marginBottom: 12 }}>
            Bác sĩ
          </Text>
          <View style={{ marginBottom: 8 }}>
            <Text style={{ fontSize: 14, color: '#6B7280' }}>Bác sĩ</Text>
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#1F2937' }}>
              BS. {appointment.doctor.firstName} {appointment.doctor.lastName}
            </Text>
          </View>
          <View style={{ marginBottom: 8 }}>
            <Text style={{ fontSize: 14, color: '#6B7280' }}>Thời gian khám</Text>
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#1F2937' }}>
              {formatTime(appointment.startTime)}, {formatDate(appointment.startTime)}
            </Text>
          </View>
          <View style={{ marginBottom: 8 }}>
            <Text style={{ fontSize: 14, color: '#6B7280' }}>Địa điểm</Text>
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#1F2937' }}>
              {appointment.clinic?.name || 'Bệnh viện'}
            </Text>
          </View>
          <View style={{ marginBottom: 8 }}>
            <Text style={{ fontSize: 14, color: '#6B7280' }}>Chuyên khoa</Text>
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#1F2937' }}>
              {appointment.service.name}
            </Text>
          </View>
          <View style={{ marginBottom: 8 }}>
            <Text style={{ fontSize: 14, color: '#6B7280' }}>Phí khám tạm ứng</Text>
            <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#0284C7' }}>
              {appointment.service.price.toLocaleString('vi-VN')} VNĐ
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
