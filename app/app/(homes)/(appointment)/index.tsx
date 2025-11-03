import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { router } from 'expo-router';
import { useMyAppointments } from '@/lib/api/appointments';
import { usePayment } from '@/contexts/PaymentContext';

type AppointmentStatus = 'UPCOMING' | 'ON_GOING' | 'COMPLETED' | 'CANCELLED';
type PaymentStatus = 'pending' | 'paid' | 'refunded' | 'PENDING' | 'PAID' | 'REFUNDED';

export default function AppointmentsListScreen() {
  const { data: appointmentsData, isLoading } = useMyAppointments();
  const { hasPendingPayment, isPendingPaymentForAppointment } = usePayment();

  const appointments = appointmentsData?.data || [];

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    return { day, month, year };
  };

  const formatTimeRange = (startTime: string, endTime: string) => {
    return `${startTime} - ${endTime}`;
  };

  const getStatusInfo = (
    status: AppointmentStatus,
    paymentStatus: PaymentStatus,
    appointmentId: number
  ) => {
    // If already paid, don't check pending payment status
    if (paymentStatus.toUpperCase() === 'PAID') {
      return { text: 'Đã thanh toán', color: '#10B981', bgColor: '#D1FAE5' };
    }

    // Check if this appointment has a pending payment
    if (isPendingPaymentForAppointment(appointmentId)) {
      return {
        text: 'Đang thanh toán',
        color: '#10B981',
        bgColor: '#D1FAE5',
      };
    }

    switch (status) {
      case 'UPCOMING':
        return { text: 'Chưa thanh toán', color: '#F59E0B', bgColor: '#FEF3C7' };
      case 'ON_GOING':
        return { text: 'Đang diễn ra', color: '#3B82F6', bgColor: '#DBEAFE' };
      case 'COMPLETED':
        return { text: 'Hoàn thành', color: '#6B7280', bgColor: '#F3F4F6' };
      case 'CANCELLED':
        return { text: 'Đã hủy', color: '#EF4444', bgColor: '#FEE2E2' };
      default:
        return { text: 'Chờ xác nhận', color: '#6B7280', bgColor: '#F3F4F6' };
    }
  };

  const getCardBorderColor = (status: AppointmentStatus, paymentStatus: PaymentStatus) => {
    const normalizedPaymentStatus = paymentStatus.toUpperCase();

    if (status === 'UPCOMING' && normalizedPaymentStatus === 'PENDING') return '#F59E0B';
    if (status === 'UPCOMING' && normalizedPaymentStatus === 'PAID') return '#10B981';
    if (status === 'ON_GOING') return '#3B82F6';
    if (status === 'COMPLETED') return '#6B7280';
    if (status === 'CANCELLED') return '#EF4444';
    return '#E5E7EB';
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#E0F2FE' }}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <ScrollView
        showsVerticalScrollIndicator={false}
        bounces={false}
        alwaysBounceVertical={false}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 100 }}
        scrollEventThrottle={16}
        contentInsetAdjustmentBehavior="never"
        automaticallyAdjustContentInsets={false}>
        {/* Background Gradient - now scrollable and extends to top */}
        <View style={{ height: 320, position: 'relative', marginTop: -60 }}>
          <LinearGradient
            colors={['#0284C7', '#06B6D4', '#10B981']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ flex: 1 }}
          />
          {/* Curved bottom edge using SVG */}
          <Svg
            height="70"
            width="200%"
            viewBox="0 0 1440 120"
            style={{ position: 'absolute', bottom: -1, left: 0, right: 0 }}>
            <Path d="M0,0 Q720,120 1440,0 L1440,120 L0,120 Z" fill="#E0F2FE" />
          </Svg>

          {/* Decorative circles */}
          <View
            style={{
              position: 'absolute',
              top: -60,
              right: -40,
              height: 180,
              width: 180,
              borderRadius: 90,
              backgroundColor: 'rgba(255,255,255,0.12)',
            }}
          />
          <View
            style={{
              position: 'absolute',
              top: 120,
              left: -50,
              height: 150,
              width: 150,
              borderRadius: 75,
              backgroundColor: 'rgba(255,255,255,0.08)',
            }}
          />

          {/* Header positioned within gradient */}
          <View
            style={{
              position: 'absolute',
              top: 120,
              left: 24,
              right: 24,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
            <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#FFFFFF' }}>
              Lịch hẹn của tôi
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/(homes)/(appointment)/create')}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: 'rgba(255,255,255,0.25)',
                borderRadius: 999,
                paddingHorizontal: 16,
                paddingVertical: 10,
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.3)',
              }}>
              <Ionicons name="add-circle" size={18} color="#FFFFFF" />
              <Text style={{ marginLeft: 6, fontSize: 14, fontWeight: '600', color: '#FFFFFF' }}>
                Đặt lịch ngay
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ paddingHorizontal: 24, marginTop: -100, marginBottom: 24 }}>
          {/* Appointments List */}
          {isLoading ? (
            <View className="items-center py-20">
              <ActivityIndicator size="large" color="#0284C7" />
              <Text className="mt-4 text-base text-gray-600">Đang tải lịch hẹn...</Text>
            </View>
          ) : appointments.length === 0 ? (
            <View className="items-center py-20">
              <View
                className="items-center justify-center rounded-full bg-white p-6"
                style={{
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                  elevation: 3,
                }}>
                <Ionicons name="calendar-outline" size={64} color="#0284C7" />
              </View>
              <Text className="mt-6 text-xl font-bold text-gray-900">Chưa có lịch hẹn nào</Text>
              <Text className="mt-2 text-center text-base text-gray-500">
                Hãy đặt lịch khám để bắt đầu chăm sóc sức khỏe
              </Text>
              <TouchableOpacity
                onPress={() => router.push('/(homes)/(appointment)/create')}
                className="mt-6 flex-row items-center rounded-lg px-6 py-3"
                style={{ backgroundColor: '#0284C7' }}>
                <Ionicons name="add-circle-outline" size={20} color="white" />
                <Text className="ml-2 text-base font-semibold text-white">Đặt lịch ngay</Text>
              </TouchableOpacity>
            </View>
          ) : (
            appointments.map((appointment) => {
              const { day, month, year } = formatDate(appointment.date);
              const timeRange = formatTimeRange(appointment.startTime, appointment.endTime);
              const statusInfo = getStatusInfo(
                appointment.status as AppointmentStatus,
                appointment.paymentStatus as PaymentStatus,
                appointment.id
              );
              const borderColor = getCardBorderColor(
                appointment.status as AppointmentStatus,
                appointment.paymentStatus as PaymentStatus
              );
              const isPaymentPending = isPendingPaymentForAppointment(appointment.id);
              const canCreatePayment = !hasPendingPayment || isPaymentPending;
              const isUpcoming = (appointment.status as AppointmentStatus) === 'UPCOMING';
              const hasUnpaidBilling =
                appointment.billing && appointment.billing.status.toUpperCase() === 'PENDING';

              return (
                <TouchableOpacity
                  key={appointment.id}
                  onPress={() =>
                    router.push(`/(homes)/(appointment)/appointment-detail?id=${appointment.id}`)
                  }
                  className="mb-4 rounded-xl bg-white p-4"
                  style={{
                    borderLeftWidth: 4,
                    borderLeftColor: borderColor,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                    elevation: 3,
                  }}>
                  <View className="flex-row">
                    {/* Date Block */}
                    <View
                      className="mr-4 items-center justify-center rounded-lg px-3 py-2"
                      style={{ backgroundColor: '#F0FDFA' }}>
                      <Text className="text-sm font-medium text-gray-600">
                        {month}/{year}
                      </Text>
                      <Text className="text-2xl font-bold" style={{ color: '#0284C7' }}>
                        {day.toString().padStart(2, '0')}
                      </Text>
                    </View>

                    {/* Appointment Details */}
                    <View className="flex-1">
                      {/* Patient Info Badge - Move to top */}
                      <View className="mb-2">
                        <View className="self-start rounded-full bg-blue-50 px-3 py-1">
                          <Text className="text-xs font-medium text-blue-600">
                            {(appointment as any).patientProfile?.relationship || 'Bản thân'}
                          </Text>
                        </View>
                      </View>

                      <Text className="text-lg font-bold text-gray-900">
                        {appointment.service.name}
                      </Text>
                      <Text className="mt-1 text-sm text-gray-600">
                        BS. {appointment.doctor.firstName} {appointment.doctor.lastName}
                      </Text>
                      <Text className="mt-1 text-sm text-gray-500">
                        {appointment.clinic?.name || 'Bệnh viện'}
                      </Text>

                      <View className="mt-2 flex-row items-center">
                        <Ionicons name="time-outline" size={16} color="#6B7280" />
                        <Text className="ml-1 text-sm text-gray-600">{timeRange}</Text>
                      </View>

                      <View className="mt-2">
                        <View
                          className="self-start rounded-full px-3 py-1"
                          style={{ backgroundColor: statusInfo.bgColor }}>
                          <Text
                            className="text-xs font-semibold"
                            style={{ color: statusInfo.color }}>
                            {statusInfo.text}
                          </Text>
                        </View>
                      </View>

                      {/* Action Buttons - Only for UPCOMING appointments */}
                      {isUpcoming && (
                        <View className="mt-3">
                          {/* Payment Button */}
                          {hasUnpaidBilling && (
                            <TouchableOpacity
                              onPress={() => {
                                if (canCreatePayment) {
                                  router.push(`/(homes)/(payment)?id=${appointment.id}` as any);
                                }
                              }}
                              disabled={!canCreatePayment}
                              className={`w-full items-center rounded-lg py-3 ${
                                isPaymentPending
                                  ? 'bg-green-500'
                                  : canCreatePayment
                                    ? 'bg-green-600'
                                    : 'bg-gray-400'
                              }`}
                              style={{
                                shadowColor: '#000',
                                shadowOffset: { width: 0, height: 2 },
                                shadowOpacity: 0.2,
                                shadowRadius: 3,
                                elevation: 3,
                              }}>
                              <View className="flex-row items-center">
                                {isPaymentPending ? (
                                  <>
                                    <Ionicons name="qr-code" size={18} color="white" />
                                    <Text className="ml-2 text-sm font-bold text-white">
                                      Xem QR thanh toán
                                    </Text>
                                  </>
                                ) : (
                                  <>
                                    <Ionicons name="card" size={18} color="white" />
                                    <Text className="ml-2 text-sm font-bold text-white">
                                      Thanh toán
                                    </Text>
                                  </>
                                )}
                              </View>
                            </TouchableOpacity>
                          )}

                          {!canCreatePayment && !isPaymentPending && hasUnpaidBilling && (
                            <Text className="mt-2 text-center text-xs text-red-500">
                              Vui lòng hoàn tất giao dịch đang chờ trước
                            </Text>
                          )}

                          {/* Other Action Buttons */}
                          <View className="mt-3 flex-row gap-3">
                            <TouchableOpacity
                              className="flex-1 items-center rounded-lg border py-2"
                              style={{ borderColor: '#0284C7' }}>
                              <Text className="text-sm font-medium" style={{ color: '#0284C7' }}>
                                Đổi lịch
                              </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              className="flex-1 items-center rounded-lg border py-2"
                              style={{ borderColor: '#EF4444' }}>
                              <Text className="text-sm font-medium text-red-500">Hủy lịch</Text>
                            </TouchableOpacity>
                          </View>

                          <Text className="mt-2 text-xs text-gray-400">
                            (Quý khách chỉ được đổi/hủy lịch 1 lần)
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>
    </View>
  );
}
