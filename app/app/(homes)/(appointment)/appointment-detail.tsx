import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useAppointment } from '@/lib/api/appointments';
import { formatDate, formatTime } from '@/utils/datetime';
import { AppointmentStatus } from '@/types/appointment';

export default function AppointmentDetailScreen() {
  const { id } = useLocalSearchParams();
  const { data: appointment, isLoading } = useAppointment(Number(id));

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#E0F2FE',
        }}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <Text style={{ fontSize: 16, color: '#6B7280' }}>Đang tải...</Text>
      </View>
    );
  }

  if (!appointment) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#E0F2FE',
        }}>
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
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: 'white' }}>
            Thông tin đặt hẹn
          </Text>
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

        {/* Result from Doctor Section - Only for COMPLETED */}
        {appointment.status === AppointmentStatus.COMPLETED && (
          <View
            style={{ backgroundColor: 'white', borderRadius: 16, padding: 16, marginBottom: 16 }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 12,
              }}>
              <Ionicons name="document-text" size={24} color="#3B82F6" style={{ marginRight: 8 }} />
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1F2937' }}>
                Kết quả khám từ bác sĩ
              </Text>
            </View>
            {appointment.result ? (
              <View>
                {appointment.result.diagnosis && (
                  <View style={{ marginBottom: 16 }}>
                    <Text style={{ fontSize: 14, color: '#6B7280', marginBottom: 4 }}>
                      Chẩn đoán
                    </Text>
                    <Text style={{ fontSize: 16, fontWeight: '600', color: '#1F2937' }}>
                      {appointment.result.diagnosis}
                    </Text>
                  </View>
                )}
                {appointment.result.notes && (
                  <View style={{ marginBottom: 16 }}>
                    <Text style={{ fontSize: 14, color: '#6B7280', marginBottom: 4 }}>
                      Ghi chú của bác sĩ
                    </Text>
                    <Text style={{ fontSize: 16, color: '#1F2937' }}>
                      {appointment.result.notes}
                    </Text>
                  </View>
                )}
                {appointment.result.prescription && (
                  <View style={{ marginBottom: 16 }}>
                    <Text style={{ fontSize: 14, color: '#6B7280', marginBottom: 4 }}>
                      Đơn thuốc
                    </Text>
                    <Text style={{ fontSize: 16, color: '#1F2937' }}>
                      {appointment.result.prescription}
                    </Text>
                  </View>
                )}
                {appointment.result.recommendations && (
                  <View style={{ marginBottom: 16 }}>
                    <Text style={{ fontSize: 14, color: '#6B7280', marginBottom: 4 }}>
                      Khuyến nghị, lời dặn
                    </Text>
                    <Text style={{ fontSize: 16, color: '#1F2937' }}>
                      {appointment.result.recommendations}
                    </Text>
                  </View>
                )}
                <Text style={{ fontSize: 12, color: '#9CA3AF', marginTop: 8 }}>
                  Cập nhật lần cuối: {formatDate(appointment.result.updatedAt)}
                </Text>
              </View>
            ) : (
              <View
                style={{
                  backgroundColor: '#FEF3C7',
                  borderRadius: 8,
                  padding: 16,
                  flexDirection: 'row',
                  alignItems: 'center',
                }}>
                <Ionicons
                  name="time-outline"
                  size={24}
                  color="#F59E0B"
                  style={{ marginRight: 12 }}
                />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#92400E' }}>
                    Chờ kết quả từ bác sĩ
                  </Text>
                  <Text style={{ fontSize: 12, color: '#78350F', marginTop: 4 }}>
                    Bác sĩ sẽ cập nhật kết quả khám sau khi hoàn thành
                  </Text>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Feedback Section */}
        {appointment.status === AppointmentStatus.COMPLETED && (
          <View
            style={{ backgroundColor: 'white', borderRadius: 16, padding: 16, marginBottom: 16 }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 12,
              }}>
              <Ionicons name="star" size={24} color="#FBBF24" style={{ marginRight: 8 }} />
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1F2937' }}>
                Đánh giá của bạn
              </Text>
            </View>
            {appointment.feedback ? (
              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Ionicons
                      key={star}
                      name={star <= appointment.feedback!.rating ? 'star' : 'star-outline'}
                      size={20}
                      color={star <= appointment.feedback!.rating ? '#FBBF24' : '#D1D5DB'}
                      style={{ marginRight: 4 }}
                    />
                  ))}
                  <Text style={{ marginLeft: 8, fontSize: 14, color: '#6B7280' }}>
                    ({appointment.feedback.rating}/5)
                  </Text>
                </View>
                {appointment.feedback.comment && (
                  <View
                    style={{
                      backgroundColor: '#F9FAFB',
                      borderRadius: 8,
                      padding: 12,
                      marginTop: 8,
                    }}>
                    <Text style={{ fontSize: 14, color: '#1F2937' }}>
                      {appointment.feedback.comment}
                    </Text>
                  </View>
                )}
                <Text style={{ fontSize: 12, color: '#9CA3AF', marginTop: 8 }}>
                  Đánh giá vào: {formatDate(appointment.feedback.createdAt)}
                </Text>
              </View>
            ) : (
              <TouchableOpacity
                onPress={() => router.push(`/(homes)/(appointment)/feedback?id=${appointment.id}`)}
                style={{
                  backgroundColor: '#0284C7',
                  borderRadius: 8,
                  padding: 12,
                  alignItems: 'center',
                  flexDirection: 'row',
                  justifyContent: 'center',
                }}>
                <Ionicons name="star-outline" size={20} color="white" style={{ marginRight: 8 }} />
                <Text style={{ fontSize: 16, fontWeight: '600', color: 'white' }}>
                  Đánh giá bác sĩ
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
