import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  Modal,
  Pressable,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { router } from 'expo-router';
import { useMyAppointments } from '@/lib/api/appointments';
import { usePayment } from '@/contexts/PaymentContext';
import QRCode from 'react-native-qrcode-svg';

type AppointmentStatus = 'UPCOMING' | 'ON_GOING' | 'COMPLETED' | 'CANCELLED';
type PaymentStatus = 'pending' | 'paid' | 'refunded' | 'PENDING' | 'PAID' | 'REFUNDED';

export default function AppointmentsListScreen() {
  const [page, setPage] = useState(1);
  const [dateSortOrder, setDateSortOrder] = useState<'asc' | 'desc'>('desc');
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'PENDING' | 'PAID'>('all');
  const [refreshing, setRefreshing] = useState(false);

  // Always sort by date (default: Sớm nhất)
  const sortBy = 'date';
  const sortOrder = dateSortOrder;

  const filters: {
    page: number;
    limit: number;
    sortBy: 'date' | 'status' | 'billingStatus';
    sortOrder: 'asc' | 'desc';
    billingStatus?: 'PENDING' | 'PAID' | 'REFUNDED';
  } = {
    page,
    limit: 10,
    sortBy,
    sortOrder,
    ...(paymentFilter !== 'all' && { billingStatus: paymentFilter }),
  };

  const { data: appointmentsData, isLoading } = useMyAppointments(filters);
  const { hasPendingPayment, isPendingPaymentForAppointment } = usePayment();

  const appointments = appointmentsData?.data || [];
  const total = appointmentsData?.total || 0;
  const totalPages = Math.ceil(total / 10);

  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [qrAppointmentId, setQrAppointmentId] = useState<number | null>(null);

  // Modal states for dropdowns
  const [dateSortModalVisible, setDateSortModalVisible] = useState(false);
  const [paymentFilterModalVisible, setPaymentFilterModalVisible] = useState(false);

  // Reset to page 1 when sort or filter changes
  React.useEffect(() => {
    setPage(1);
  }, [sortOrder, paymentFilter]);

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
    billingStatus: PaymentStatus | undefined,
    appointmentId: number
  ) => {
    // If already paid, don't check pending payment status
    if (billingStatus && billingStatus.toUpperCase() === 'PAID') {
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

  const getCardBorderColor = (
    status: AppointmentStatus,
    billingStatus: PaymentStatus | undefined
  ) => {
    const normalizedBillingStatus = billingStatus?.toUpperCase();

    if (status === 'UPCOMING' && normalizedBillingStatus === 'PENDING') return '#F59E0B';
    if (status === 'UPCOMING' && normalizedBillingStatus === 'PAID') return '#10B981';
    if (status === 'ON_GOING') return '#3B82F6';
    if (status === 'COMPLETED') return '#6B7280';
    if (status === 'CANCELLED') return '#EF4444';
    return '#E5E7EB';
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    setPage(1);
    setRefreshing(false);
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
        automaticallyAdjustContentInsets={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}>
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
          {/* Sort Fields */}
          <View className="mb-4 flex-row gap-3">
            {/* Date Sort Dropdown */}
            <View className="flex-1">
              <View className="mb-2 flex-row items-center">
                <Ionicons name="time-outline" size={16} color="#0284C7" />
                <Text className="ml-1.5 text-sm font-semibold text-gray-700">Thời gian khám</Text>
              </View>
              <TouchableOpacity
                onPress={() => setDateSortModalVisible(true)}
                activeOpacity={0.7}
                className="flex-row items-center justify-between rounded-xl border-2 bg-white px-4 py-3.5"
                style={{
                  borderColor: '#E5E7EB',
                  shadowColor: '#0284C7',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                  elevation: 3,
                }}>
                <View className="flex-row items-center">
                  <Ionicons
                    name={dateSortOrder === 'asc' ? 'calendar-outline' : 'calendar'}
                    size={18}
                    color="#0284C7"
                  />
                  <Text className="ml-2 text-sm font-semibold text-gray-900">
                    {dateSortOrder === 'asc' ? 'Cũ nhất' : 'Sớm nhất'}
                  </Text>
                </View>
                <Ionicons name="chevron-down" size={18} color="#0284C7" />
              </TouchableOpacity>
            </View>

            {/* Payment Status Filter Dropdown */}
            <View className="flex-1">
              <View className="mb-2 flex-row items-center">
                <Ionicons name="card-outline" size={16} color="#10B981" />
                <Text className="ml-1.5 text-sm font-semibold text-gray-700">Thanh toán</Text>
              </View>
              <TouchableOpacity
                onPress={() => setPaymentFilterModalVisible(true)}
                activeOpacity={0.7}
                className="flex-row items-center justify-between rounded-xl border-2 bg-white px-4 py-3.5"
                style={{
                  borderColor: '#E5E7EB',
                  shadowColor: '#10B981',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                  elevation: 3,
                }}>
                <View className="flex-row items-center">
                  <Ionicons
                    name={
                      paymentFilter === 'all'
                        ? 'wallet-outline'
                        : paymentFilter === 'PENDING'
                          ? 'time-outline'
                          : 'checkmark-circle-outline'
                    }
                    size={18}
                    color={
                      paymentFilter === 'all'
                        ? '#6B7280'
                        : paymentFilter === 'PENDING'
                          ? '#F59E0B'
                          : '#10B981'
                    }
                  />
                  <Text className="ml-2 text-sm font-semibold text-gray-900">
                    {paymentFilter === 'all'
                      ? 'Tất cả'
                      : paymentFilter === 'PENDING'
                        ? 'Chưa thanh toán'
                        : 'Đã thanh toán'}
                  </Text>
                </View>
                <Ionicons name="chevron-down" size={18} color="#10B981" />
              </TouchableOpacity>
            </View>
          </View>

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
              const { day, month, year } = formatDate(appointment.startTime);
              const timeRange = formatTimeRange(appointment.startTime, appointment.endTime);
              const billingStatus = appointment.billing?.status as PaymentStatus | undefined;
              const statusInfo = getStatusInfo(
                appointment.status as AppointmentStatus,
                billingStatus,
                appointment.id
              );
              const borderColor = getCardBorderColor(
                appointment.status as AppointmentStatus,
                billingStatus
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
                          <View className="mt-3 flex-row gap-2">
                            <TouchableOpacity
                              className="flex-1 flex-row items-center justify-center rounded-lg border-2 bg-white py-2.5"
                              style={{
                                borderColor: '#0284C7',
                                shadowColor: '#0284C7',
                                shadowOffset: { width: 0, height: 1 },
                                shadowOpacity: 0.1,
                                shadowRadius: 2,
                                elevation: 2,
                              }}
                              onPress={() => {
                                setQrAppointmentId(appointment.id);
                                setQrModalVisible(true);
                              }}>
                              <Ionicons name="qr-code-outline" size={16} color="#0284C7" />
                              <Text
                                className="ml-1.5 text-sm font-semibold"
                                style={{ color: '#0284C7' }}>
                                Mã QR
                              </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              className="flex-1 flex-row items-center justify-center rounded-lg border-2 bg-white py-2.5"
                              style={{
                                borderColor: '#0284C7',
                                shadowColor: '#0284C7',
                                shadowOffset: { width: 0, height: 1 },
                                shadowOpacity: 0.1,
                                shadowRadius: 2,
                                elevation: 2,
                              }}>
                              <Ionicons name="calendar-outline" size={16} color="#0284C7" />
                              <Text
                                className="ml-1.5 text-sm font-semibold"
                                style={{ color: '#0284C7' }}>
                                Đổi lịch
                              </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              className="flex-1 flex-row items-center justify-center rounded-lg border-2 bg-white py-2.5"
                              style={{
                                borderColor: '#EF4444',
                                shadowColor: '#EF4444',
                                shadowOffset: { width: 0, height: 1 },
                                shadowOpacity: 0.1,
                                shadowRadius: 2,
                                elevation: 2,
                              }}>
                              <Ionicons name="close-circle-outline" size={16} color="#EF4444" />
                              <Text className="ml-1.5 text-sm font-semibold text-red-500">
                                Hủy lịch
                              </Text>
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

          {/* Pagination */}
          {!isLoading && appointments.length > 0 && totalPages > 1 && (
            <View className="mt-6 flex-row items-center justify-center gap-2">
              <TouchableOpacity
                onPress={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className={`rounded-lg border px-4 py-2 ${
                  page === 1 ? 'border-gray-300 bg-gray-100' : 'border-blue-500 bg-white'
                }`}>
                <Ionicons
                  name="chevron-back"
                  size={20}
                  color={page === 1 ? '#9CA3AF' : '#0284C7'}
                />
              </TouchableOpacity>

              <View className="flex-row items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (page <= 3) {
                    pageNum = i + 1;
                  } else if (page >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = page - 2 + i;
                  }

                  return (
                    <TouchableOpacity
                      key={pageNum}
                      onPress={() => setPage(pageNum)}
                      className={`rounded-lg border px-4 py-2 ${
                        page === pageNum
                          ? 'border-blue-500 bg-blue-500'
                          : 'border-gray-300 bg-white'
                      }`}>
                      <Text
                        className={`text-sm font-medium ${
                          page === pageNum ? 'text-white' : 'text-gray-700'
                        }`}>
                        {pageNum}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TouchableOpacity
                onPress={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className={`rounded-lg border px-4 py-2 ${
                  page === totalPages ? 'border-gray-300 bg-gray-100' : 'border-blue-500 bg-white'
                }`}>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={page === totalPages ? '#9CA3AF' : '#0284C7'}
                />
              </TouchableOpacity>
            </View>
          )}

          {/* Page Info */}
          {!isLoading && appointments.length > 0 && (
            <Text className="mt-4 text-center text-sm text-gray-500">
              Trang {page} / {totalPages} ({total} lịch hẹn)
            </Text>
          )}
        </View>
      </ScrollView>

      {/* Date Sort Modal */}
      <Modal
        visible={dateSortModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDateSortModalVisible(false)}>
        <Pressable
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.6)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20,
          }}
          onPress={() => setDateSortModalVisible(false)}>
          <View
            style={{
              width: '100%',
              maxWidth: 320,
              backgroundColor: 'white',
              borderRadius: 20,
              overflow: 'hidden',
              shadowColor: '#0284C7',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.3,
              shadowRadius: 16,
              elevation: 10,
            }}
            onStartShouldSetResponder={() => true}>
            {/* Header with Gradient */}
            <LinearGradient
              colors={['#0284C7', '#06B6D4']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              className="px-5 py-4">
              <View className="flex-row items-center">
                <View className="mr-3 rounded-full bg-white/20 p-2">
                  <Ionicons name="time" size={20} color="white" />
                </View>
                <Text className="flex-1 text-lg font-bold text-white">Sắp xếp theo thời gian</Text>
              </View>
            </LinearGradient>

            {/* Options */}
            <View className="py-2">
              <TouchableOpacity
                onPress={() => {
                  setDateSortOrder('asc');
                  setDateSortModalVisible(false);
                }}
                activeOpacity={0.7}
                className={`mx-2 my-1 flex-row items-center justify-between rounded-xl px-4 py-4 ${
                  dateSortOrder === 'asc' ? 'bg-blue-50' : 'bg-white active:bg-gray-50'
                }`}
                style={
                  dateSortOrder === 'asc'
                    ? {
                        borderWidth: 2,
                        borderColor: '#0284C7',
                        shadowColor: '#0284C7',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.1,
                        shadowRadius: 4,
                        elevation: 2,
                      }
                    : {}
                }>
                <View className="flex-1 flex-row items-center">
                  <View
                    className={`mr-3 rounded-lg p-2 ${
                      dateSortOrder === 'asc' ? 'bg-blue-100' : 'bg-gray-100'
                    }`}>
                    <Ionicons
                      name="arrow-up"
                      size={22}
                      color={dateSortOrder === 'asc' ? '#0284C7' : '#6B7280'}
                    />
                  </View>
                  <View className="flex-1">
                    <Text
                      className={`text-base ${
                        dateSortOrder === 'asc'
                          ? 'font-bold text-blue-700'
                          : 'font-medium text-gray-700'
                      }`}>
                      Cũ nhất
                    </Text>
                    <Text className="mt-0.5 text-xs text-gray-500">Từ quá khứ đến hiện tại</Text>
                  </View>
                </View>
                {dateSortOrder === 'asc' && (
                  <View className="ml-2 rounded-full bg-blue-500 p-1">
                    <Ionicons name="checkmark" size={16} color="white" />
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setDateSortOrder('desc');
                  setDateSortModalVisible(false);
                }}
                activeOpacity={0.7}
                className={`mx-2 my-1 flex-row items-center justify-between rounded-xl px-4 py-4 ${
                  dateSortOrder === 'desc' ? 'bg-blue-50' : 'bg-white active:bg-gray-50'
                }`}
                style={
                  dateSortOrder === 'desc'
                    ? {
                        borderWidth: 2,
                        borderColor: '#0284C7',
                        shadowColor: '#0284C7',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.1,
                        shadowRadius: 4,
                        elevation: 2,
                      }
                    : {}
                }>
                <View className="flex-1 flex-row items-center">
                  <View
                    className={`mr-3 rounded-lg p-2 ${
                      dateSortOrder === 'desc' ? 'bg-blue-100' : 'bg-gray-100'
                    }`}>
                    <Ionicons
                      name="arrow-down"
                      size={22}
                      color={dateSortOrder === 'desc' ? '#0284C7' : '#6B7280'}
                    />
                  </View>
                  <View className="flex-1">
                    <Text
                      className={`text-base ${
                        dateSortOrder === 'desc'
                          ? 'font-bold text-blue-700'
                          : 'font-medium text-gray-700'
                      }`}>
                      Sớm nhất
                    </Text>
                    <Text className="mt-0.5 text-xs text-gray-500">Từ hiện tại đến tương lai</Text>
                  </View>
                </View>
                {dateSortOrder === 'desc' && (
                  <View className="ml-2 rounded-full bg-blue-500 p-1">
                    <Ionicons name="checkmark" size={16} color="white" />
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Modal>

      {/* Payment Filter Modal */}
      <Modal
        visible={paymentFilterModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPaymentFilterModalVisible(false)}>
        <Pressable
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.6)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20,
          }}
          onPress={() => setPaymentFilterModalVisible(false)}>
          <View
            style={{
              width: '100%',
              maxWidth: 320,
              backgroundColor: 'white',
              borderRadius: 20,
              overflow: 'hidden',
              shadowColor: '#10B981',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.3,
              shadowRadius: 16,
              elevation: 10,
            }}
            onStartShouldSetResponder={() => true}>
            {/* Header with Gradient */}
            <LinearGradient
              colors={['#10B981', '#059669']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              className="px-5 py-4">
              <View className="flex-row items-center">
                <View className="mr-3 rounded-full bg-white/20 p-2">
                  <Ionicons name="card" size={20} color="white" />
                </View>
                <Text className="flex-1 text-lg font-bold text-white">Lọc theo thanh toán</Text>
              </View>
            </LinearGradient>

            {/* Options */}
            <View className="py-2">
              <TouchableOpacity
                onPress={() => {
                  setPaymentFilter('all');
                  setPaymentFilterModalVisible(false);
                }}
                activeOpacity={0.7}
                className={`mx-2 my-1 flex-row items-center justify-between rounded-xl px-4 py-4 ${
                  paymentFilter === 'all' ? 'bg-green-50' : 'bg-white active:bg-gray-50'
                }`}
                style={
                  paymentFilter === 'all'
                    ? {
                        borderWidth: 2,
                        borderColor: '#10B981',
                        shadowColor: '#10B981',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.1,
                        shadowRadius: 4,
                        elevation: 2,
                      }
                    : {}
                }>
                <View className="flex-1 flex-row items-center">
                  <View
                    className={`mr-3 rounded-lg p-2 ${
                      paymentFilter === 'all' ? 'bg-green-100' : 'bg-gray-100'
                    }`}>
                    <Ionicons
                      name="wallet"
                      size={22}
                      color={paymentFilter === 'all' ? '#10B981' : '#6B7280'}
                    />
                  </View>
                  <View className="flex-1">
                    <Text
                      className={`text-base ${
                        paymentFilter === 'all'
                          ? 'font-bold text-green-700'
                          : 'font-medium text-gray-700'
                      }`}>
                      Tất cả
                    </Text>
                    <Text className="mt-0.5 text-xs text-gray-500">Hiển thị tất cả lịch hẹn</Text>
                  </View>
                </View>
                {paymentFilter === 'all' && (
                  <View className="ml-2 rounded-full bg-green-500 p-1">
                    <Ionicons name="checkmark" size={16} color="white" />
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setPaymentFilter('PENDING');
                  setPaymentFilterModalVisible(false);
                }}
                activeOpacity={0.7}
                className={`mx-2 my-1 flex-row items-center justify-between rounded-xl px-4 py-4 ${
                  paymentFilter === 'PENDING' ? 'bg-orange-50' : 'bg-white active:bg-gray-50'
                }`}
                style={
                  paymentFilter === 'PENDING'
                    ? {
                        borderWidth: 2,
                        borderColor: '#F59E0B',
                        shadowColor: '#F59E0B',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.1,
                        shadowRadius: 4,
                        elevation: 2,
                      }
                    : {}
                }>
                <View className="flex-1 flex-row items-center">
                  <View
                    className={`mr-3 rounded-lg p-2 ${
                      paymentFilter === 'PENDING' ? 'bg-orange-100' : 'bg-gray-100'
                    }`}>
                    <Ionicons
                      name="time"
                      size={22}
                      color={paymentFilter === 'PENDING' ? '#F59E0B' : '#6B7280'}
                    />
                  </View>
                  <View className="flex-1">
                    <Text
                      className={`text-base ${
                        paymentFilter === 'PENDING'
                          ? 'font-bold text-orange-700'
                          : 'font-medium text-gray-700'
                      }`}>
                      Chưa thanh toán
                    </Text>
                    <Text className="mt-0.5 text-xs text-gray-500">
                      Chỉ hiển thị chưa thanh toán
                    </Text>
                  </View>
                </View>
                {paymentFilter === 'PENDING' && (
                  <View className="ml-2 rounded-full bg-orange-500 p-1">
                    <Ionicons name="checkmark" size={16} color="white" />
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setPaymentFilter('PAID');
                  setPaymentFilterModalVisible(false);
                }}
                activeOpacity={0.7}
                className={`mx-2 my-1 flex-row items-center justify-between rounded-xl px-4 py-4 ${
                  paymentFilter === 'PAID' ? 'bg-green-50' : 'bg-white active:bg-gray-50'
                }`}
                style={
                  paymentFilter === 'PAID'
                    ? {
                        borderWidth: 2,
                        borderColor: '#10B981',
                        shadowColor: '#10B981',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.1,
                        shadowRadius: 4,
                        elevation: 2,
                      }
                    : {}
                }>
                <View className="flex-1 flex-row items-center">
                  <View
                    className={`mr-3 rounded-lg p-2 ${
                      paymentFilter === 'PAID' ? 'bg-green-100' : 'bg-gray-100'
                    }`}>
                    <Ionicons
                      name="checkmark-circle"
                      size={22}
                      color={paymentFilter === 'PAID' ? '#10B981' : '#6B7280'}
                    />
                  </View>
                  <View className="flex-1">
                    <Text
                      className={`text-base ${
                        paymentFilter === 'PAID'
                          ? 'font-bold text-green-700'
                          : 'font-medium text-gray-700'
                      }`}>
                      Đã thanh toán
                    </Text>
                    <Text className="mt-0.5 text-xs text-gray-500">Chỉ hiển thị đã thanh toán</Text>
                  </View>
                </View>
                {paymentFilter === 'PAID' && (
                  <View className="ml-2 rounded-full bg-green-500 p-1">
                    <Ionicons name="checkmark" size={16} color="white" />
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Modal>

      {/* QR Modal */}
      <Modal
        visible={qrModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setQrModalVisible(false)}>
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 24,
          }}>
          <View
            style={{
              width: '100%',
              maxWidth: 420,
              backgroundColor: 'white',
              borderRadius: 12,
              padding: 20,
              alignItems: 'center',
            }}>
            <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 12 }}>Mã QR CheckIn</Text>

            <QRCode
              value={`${process.env.EXPO_PUBLIC_WEB_URL}/appointment/${qrAppointmentId}`}
              size={200}
              color="black"
              backgroundColor="white"
              logoSize={40}
              logoMargin={2}
              logoBorderRadius={8}
            />

            <Text style={{ color: '#6B7280', marginBottom: 12, marginTop: 12 }}>
              {qrAppointmentId ? `Lịch hẹn #${qrAppointmentId}` : ''}
            </Text>

            <Pressable
              onPress={() => setQrModalVisible(false)}
              style={{
                backgroundColor: '#0284C7',
                paddingVertical: 10,
                paddingHorizontal: 18,
                borderRadius: 8,
              }}>
              <Text style={{ color: 'white', fontWeight: '600' }}>Đóng</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}
