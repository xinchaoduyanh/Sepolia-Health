import { usePayment } from '@/contexts/PaymentContext';
import { useCancelAppointment, useMyAppointments } from '@/lib/api/appointments';
import { AppointmentStatus, PaymentStatus } from '@/types';
import { formatTime } from '@/utils/datetime';
import Colors from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  DimensionValue,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
  useWindowDimensions,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import Svg, { Path } from 'react-native-svg';

interface SkeletonProps {
  width?: DimensionValue;
  height?: DimensionValue;
  borderRadius?: number;
  style?: ViewStyle;
}

const useResponsive = () => {
  const { width: screenWidth } = useWindowDimensions();

  return {
    screenWidth,
    isSmall: screenWidth < 375,
    isMedium: screenWidth >= 375 && screenWidth < 768,
    isLarge: screenWidth >= 768,
    horizontalPadding: screenWidth < 375 ? 16 : 24,
    // Responsive font sizes
    fontSize: {
      xs: screenWidth < 375 ? 11 : 12,
      sm: screenWidth < 375 ? 12 : 14,
      base: screenWidth < 375 ? 14 : 16,
      lg: screenWidth < 375 ? 16 : 18,
      xl: screenWidth < 375 ? 18 : 20,
      xxl: screenWidth < 375 ? 20 : 22,
    },
    // Responsive spacing
    spacing: {
      xs: screenWidth < 375 ? 4 : 6,
      sm: screenWidth < 375 ? 8 : 12,
      base: screenWidth < 375 ? 12 : 16,
      lg: screenWidth < 375 ? 16 : 20,
      xl: screenWidth < 375 ? 24 : 32,
    },
  };
};

const Skeleton = ({ width, height, borderRadius, style }: SkeletonProps) => {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius: borderRadius || 4,
          backgroundColor: Colors.skeleton,
          opacity,
        },
        style,
      ]}
    />
  );
};

const AppointmentSkeleton = ({ responsive }: { responsive: ReturnType<typeof useResponsive> }) => (
  <View
    className="mb-4 rounded-xl bg-white p-4"
    style={{
      borderLeftWidth: 4,
      borderLeftColor: '#E5E7EB',
      marginBottom: responsive.spacing.base,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    }}>
    <View className="flex-row">
      {/* Date Block Skeleton */}
      <View
        className="mr-4 items-center justify-center rounded-lg px-3 py-2"
        style={{
          backgroundColor: '#F0FDFA',
          width: responsive.isSmall ? 55 : 60,
          height: responsive.isSmall ? 55 : 60,
          marginRight: responsive.spacing.sm,
        }}>
        <Skeleton
          width={responsive.isSmall ? 25 : 30}
          height={responsive.isSmall ? 10 : 12}
          style={{ marginBottom: responsive.spacing.xs }}
        />
        <Skeleton width={responsive.isSmall ? 35 : 40} height={responsive.isSmall ? 20 : 24} />
      </View>

      {/* Details Skeleton */}
      <View className="flex-1">
        <Skeleton
          width={100}
          height={responsive.fontSize.sm}
          style={{ marginBottom: responsive.spacing.sm, borderRadius: 10 }}
        />
        <Skeleton
          width="80%"
          height={responsive.fontSize.lg}
          style={{ marginBottom: responsive.spacing.sm }}
        />
        <Skeleton
          width="60%"
          height={responsive.fontSize.sm}
          style={{ marginBottom: responsive.spacing.xs }}
        />
        <Skeleton
          width="50%"
          height={responsive.fontSize.sm}
          style={{ marginBottom: responsive.spacing.base }}
        />
        <View className="flex-row items-center">
          <Skeleton
            width={16}
            height={16}
            borderRadius={8}
            style={{ marginRight: responsive.spacing.xs }}
          />
          <Skeleton width={120} height={responsive.fontSize.sm} />
        </View>
        <Skeleton
          width={80}
          height={responsive.fontSize.lg}
          borderRadius={10}
          style={{ marginTop: responsive.spacing.base }}
        />
      </View>
    </View>
  </View>
);

export default function AppointmentsListScreen() {
  const responsive = useResponsive();
  const [page, setPage] = useState(1);
  const [dateSortOrder, setDateSortOrder] = useState<'asc' | 'desc'>('desc');
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'PENDING' | 'PAID'>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [cancellingId, setCancellingId] = useState<number | null>(null);

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
  const cancelAppointmentMutation = useCancelAppointment();

  const appointments = appointmentsData?.data || [];
  const total = appointmentsData?.total || 0;
  const totalPages = Math.ceil(total / 10);

  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [qrAppointmentId, setQrAppointmentId] = useState<number | null>(null);

  // Modal states for dropdowns
  const [dateSortModalVisible, setDateSortModalVisible] = useState(false);
  const [paymentFilterModalVisible, setPaymentFilterModalVisible] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  // Reset to page 1 when sort or filter changes
  React.useEffect(() => {
    setPage(1);
  }, [sortOrder, paymentFilter]);

  const getDateParts = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    return { day, month, year };
  };

  const getStatusInfo = (
    status: AppointmentStatus,
    billingStatus: PaymentStatus | undefined,
    appointmentId: number
  ) => {
    // If already paid, don't check pending payment status
    if (billingStatus && billingStatus.toUpperCase() === 'PAID') {
      return { text: 'Đã thanh toán', color: Colors.secondary, bgColor: '#D1FAE5' };
    }

    // Check if this appointment has a pending payment
    if (isPendingPaymentForAppointment(appointmentId)) {
      return {
        text: 'Đang thanh toán',
        color: Colors.secondary,
        bgColor: '#D1FAE5',
      };
    }

    switch (status) {
      case 'UPCOMING':
        return { text: 'Chưa thanh toán', color: '#F59E0B', bgColor: '#FEF3C7' };
      case 'ON_GOING':
        return { text: 'Đang diễn ra', color: '#3B82F6', bgColor: '#DBEAFE' };
      case 'COMPLETED':
        return { text: 'Hoàn thành', color: Colors.textMuted, bgColor: '#F3F4F6' };
      case 'CANCELLED':
        return { text: 'Đã hủy', color: Colors.error, bgColor: '#FEE2E2' };
      default:
        return { text: 'Chờ xác nhận', color: Colors.textMuted, bgColor: '#F3F4F6' };
    }
  };

  const getCardBorderColor = (
    status: AppointmentStatus,
    billingStatus: PaymentStatus | undefined
  ) => {
    const normalizedBillingStatus = billingStatus?.toUpperCase();

    if (status === 'UPCOMING' && normalizedBillingStatus === 'PENDING') return '#F59E0B';
    if (status === 'UPCOMING' && normalizedBillingStatus === 'PAID') return Colors.secondary;
    if (status === 'ON_GOING') return '#3B82F6';
    if (status === 'COMPLETED') return Colors.textMuted;
    if (status === 'CANCELLED') return Colors.error;
    return '#E5E7EB';
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    setPage(1);
    setRefreshing(false);
  };

  const isWithin4Hours = (appointmentTime: string) => {
    const now = new Date();
    const apptTime = new Date(appointmentTime);
    const diffInHours = (apptTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    return diffInHours < 4;
  };

  const handleCancelAppointment = async (appointmentId: number) => {
    Alert.alert(
      'Xác nhận hủy lịch',
      'Bạn có chắc chắn muốn hủy lịch hẹn này? Hành động này không thể hoàn tác.',
      [
        {
          text: 'Không',
          style: 'cancel',
        },
        {
          text: 'Hủy lịch',
          style: 'destructive',
          onPress: async () => {
            try {
              setCancellingId(appointmentId);
              await cancelAppointmentMutation.mutateAsync(appointmentId);
              Alert.alert('Thành công', 'Đã hủy lịch hẹn thành công');
            } catch (error: any) {
              Alert.alert('Lỗi', error?.response?.data?.message || 'Không thể hủy lịch hẹn');
            } finally {
              setCancellingId(null);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
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
        <View
          style={{ height: responsive.isSmall ? 280 : 300, position: 'relative', marginTop: -60 }}>
          <LinearGradient
            colors={Colors.gradientPrimary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ flex: 1 }}
          />

          {/* Decorative circles */}
          <View
            style={{
              position: 'absolute',
              top: -60,
              right: -40,
              height: responsive.isSmall ? 150 : 180,
              width: responsive.isSmall ? 150 : 180,
              borderRadius: responsive.isSmall ? 75 : 90,
              backgroundColor: 'rgba(255,255,255,0.12)',
            }}
          />
          <View
            style={{
              position: 'absolute',
              top: 120,
              left: -50,
              height: responsive.isSmall ? 120 : 150,
              width: responsive.isSmall ? 120 : 150,
              borderRadius: responsive.isSmall ? 60 : 75,
              backgroundColor: 'rgba(255,255,255,0.08)',
            }}
          />

          {/* Header positioned within gradient */}
          <View
            style={{
              position: 'absolute',
              top: responsive.isSmall ? 90 : 120,
              left: responsive.horizontalPadding,
              right: responsive.horizontalPadding,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
            <Text
              style={{
                fontSize: responsive.fontSize.xxl,
                fontWeight: 'bold',
                color: Colors.white,
              }}>
              Lịch hẹn của tôi
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/(homes)/(appointment)/create')}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: 'rgba(255,255,255,0.25)',
                borderRadius: 999,
                paddingHorizontal: responsive.spacing.base,
                paddingVertical: responsive.spacing.sm,
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.3)',
              }}>
              <Ionicons
                name="add-circle"
                size={responsive.isSmall ? 16 : 18}
                color={Colors.white}
              />
              <Text
                style={{
                  marginLeft: responsive.spacing.sm,
                  fontSize: responsive.fontSize.sm,
                  fontWeight: '600',
                  color: Colors.white,
                }}>
                Đặt lịch ngay
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View
          style={{
            paddingHorizontal: responsive.horizontalPadding,
            marginTop: -100,
            marginBottom: responsive.spacing.lg,
          }}>
          {/* Sort Fields */}
          <View className="mb-4 flex-row gap-3" style={{ marginBottom: responsive.spacing.lg }}>
            {/* Date Sort Dropdown */}
            <View className="flex-1">
              <View
                className="mb-2 flex-row items-center"
                style={{ marginBottom: responsive.spacing.sm }}>
                <Ionicons
                  name="time-outline"
                  size={responsive.isSmall ? 14 : 16}
                  color={Colors.primary}
                />
                <Text
                  className="ml-1.5 text-sm font-semibold text-gray-700"
                  style={{ marginLeft: responsive.spacing.sm, fontSize: responsive.fontSize.sm }}>
                  Thời gian khám
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setDateSortModalVisible(true)}
                activeOpacity={0.7}
                className="flex-row items-center justify-between rounded-xl border-2 bg-white px-4 py-3.5"
                style={{
                  paddingHorizontal: responsive.spacing.base,
                  paddingVertical: responsive.spacing.sm,
                  borderColor: '#E5E7EB',
                  shadowColor: Colors.primary,
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                  elevation: 3,
                }}>
                <View className="flex-row items-center">
                  <Ionicons
                    name={dateSortOrder === 'asc' ? 'calendar-outline' : 'calendar'}
                    size={responsive.isSmall ? 16 : 18}
                    color={Colors.primary}
                  />
                  <Text
                    numberOfLines={1}
                    className="ml-2 text-sm font-semibold text-gray-900"
                    style={{ marginLeft: responsive.spacing.sm, fontSize: responsive.fontSize.sm }}>
                    {dateSortOrder === 'asc' ? 'Cũ nhất' : 'Sớm nhất'}
                  </Text>
                </View>
                <Ionicons
                  name="chevron-down"
                  size={responsive.isSmall ? 16 : 18}
                  color={Colors.primary}
                />
              </TouchableOpacity>
            </View>

            {/* Payment Status Filter Dropdown */}
            <View className="flex-1">
              <View
                className="mb-2 flex-row items-center"
                style={{ marginBottom: responsive.spacing.sm }}>
                <Ionicons
                  name="card-outline"
                  size={responsive.isSmall ? 14 : 16}
                  color={Colors.secondary}
                />
                <Text
                  className="ml-1.5 text-sm font-semibold text-gray-700"
                  style={{ marginLeft: responsive.spacing.sm, fontSize: responsive.fontSize.sm }}>
                  Thanh toán
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setPaymentFilterModalVisible(true)}
                activeOpacity={0.7}
                className="flex-row items-center justify-between rounded-xl border-2 bg-white px-4 py-3.5"
                style={{
                  paddingHorizontal: responsive.spacing.base,
                  paddingVertical: responsive.spacing.sm,
                  borderColor: '#E5E7EB',
                  shadowColor: Colors.secondary,
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
                    size={responsive.isSmall ? 16 : 18}
                    color={
                      paymentFilter === 'all'
                        ? Colors.textMuted
                        : paymentFilter === 'PENDING'
                          ? '#F59E0B'
                          : Colors.secondary
                    }
                  />
                  <Text
                    numberOfLines={1}
                    className="ml-2 text-sm font-semibold text-gray-900"
                    style={{ marginLeft: responsive.spacing.sm, fontSize: responsive.fontSize.sm }}>
                    {paymentFilter === 'all'
                      ? 'Tất cả'
                      : paymentFilter === 'PENDING'
                        ? 'Chưa thanh toán'
                        : 'Đã thanh toán'}
                  </Text>
                </View>
                <Ionicons
                  name="chevron-down"
                  size={responsive.isSmall ? 16 : 18}
                  color={Colors.secondary}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Appointments List */}
          {isLoading ? (
            <View>
              <AppointmentSkeleton responsive={responsive} />
            </View>
          ) : appointments.length === 0 ? (
            <View className="items-center py-20" style={{ paddingVertical: responsive.spacing.xl }}>
              <View
                className="items-center justify-center rounded-full bg-white p-6"
                style={{
                  padding: responsive.spacing.lg,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                  elevation: 3,
                }}>
                <Ionicons
                  name="calendar-outline"
                  size={responsive.isSmall ? 56 : 64}
                  color={Colors.primary}
                />
              </View>
              <Text
                className="mt-6 text-xl font-bold text-gray-900"
                style={{ marginTop: responsive.spacing.lg, fontSize: responsive.fontSize.lg }}>
                Chưa có lịch hẹn nào
              </Text>
              <Text
                className="mt-2 text-center text-base text-gray-500"
                style={{ marginTop: responsive.spacing.sm, fontSize: responsive.fontSize.base }}>
                Hãy đặt lịch khám để bắt đầu chăm sóc sức khỏe
              </Text>
              <TouchableOpacity
                onPress={() => {
                  if (isNavigating) return;
                  setIsNavigating(true);
                  router.push('/(homes)/(appointment)/create');
                  setTimeout(() => setIsNavigating(false), 1000);
                }}
                className="mt-6 flex-row items-center rounded-lg px-6 py-3"
                style={{
                  marginTop: responsive.spacing.lg,
                  paddingHorizontal: responsive.spacing.lg,
                  paddingVertical: responsive.spacing.base,
                  backgroundColor: Colors.primary,
                }}>
                <Ionicons
                  name="add-circle-outline"
                  size={responsive.isSmall ? 18 : 20}
                  color="white"
                />
                <Text
                  className="ml-2 text-base font-semibold text-white"
                  style={{ marginLeft: responsive.spacing.sm, fontSize: responsive.fontSize.base }}>
                  Đặt lịch ngay
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            appointments.map((appointment) => {
              const { day, month, year } = getDateParts(appointment.startTime);
              const startDate = new Date(appointment.startTime);
              const endDate = new Date(
                startDate.getTime() + appointment.service.duration * 60 * 1000
              );
              const timeRange = `${formatTime(appointment.startTime)} - ${formatTime(endDate.toISOString())}`;
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
                  activeOpacity={0.8}
                  onPress={() => {
                    if (isNavigating) return;
                    setIsNavigating(true);
                    router.push(`/(homes)/(appointment-detail)?id=${appointment.id}`);
                    setTimeout(() => setIsNavigating(false), 1000);
                  }}
                  className="mb-4 rounded-xl bg-white p-4"
                  style={{
                    marginTop: responsive.spacing.base,
                    paddingHorizontal: responsive.spacing.base,
                    paddingVertical: responsive.spacing.base,
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
                      style={{
                        backgroundColor: '#F0FDFA',
                        paddingHorizontal: responsive.spacing.sm,
                        paddingVertical: responsive.spacing.sm,
                      }}>
                      <Text
                        className="text-sm font-medium text-gray-600"
                        style={{ fontSize: responsive.fontSize.sm }}>
                        {month}/{year}
                      </Text>
                      <Text
                        className="text-2xl font-bold"
                        style={{ color: Colors.primary, fontSize: responsive.fontSize.xxl }}>
                        {day.toString().padStart(2, '0')}
                      </Text>
                    </View>

                    {/* Appointment Details */}
                    <View className="flex-1">
                      {/* Patient Info Badge - Move to top */}
                      <View className="mb-2" style={{ marginBottom: responsive.spacing.sm }}>
                        <View
                          className="self-start rounded-full bg-blue-50 px-3 py-1"
                          style={{
                            paddingHorizontal: responsive.spacing.sm,
                            paddingVertical: responsive.spacing.xs,
                          }}>
                          <Text
                            className="text-xs font-medium text-blue-600"
                            style={{ fontSize: responsive.fontSize.xs }}>
                            {(appointment as any).patientProfile?.relationship || 'Bản thân'}
                          </Text>
                        </View>
                      </View>

                      <Text
                        numberOfLines={2}
                        className="text-lg font-bold text-gray-900"
                        style={{ fontSize: responsive.fontSize.lg }}>
                        {appointment.service.name}
                      </Text>
                      <Text
                        numberOfLines={1}
                        className="mt-1 text-sm text-gray-600"
                        style={{
                          marginTop: responsive.spacing.xs,
                          fontSize: responsive.fontSize.sm,
                        }}>
                        BS. {appointment.doctor.lastName} {appointment.doctor.firstName}
                      </Text>
                      <Text
                        numberOfLines={1}
                        className="mt-1 text-sm text-gray-500"
                        style={{
                          marginTop: responsive.spacing.xs,
                          fontSize: responsive.fontSize.sm,
                        }}>
                        {appointment.clinic?.name || 'Bệnh viện'}
                      </Text>

                      <View
                        className="mt-2 flex-row items-center"
                        style={{ marginTop: responsive.spacing.sm }}>
                        <Ionicons
                          name="time-outline"
                          size={responsive.isSmall ? 14 : 16}
                          color={Colors.textMuted}
                        />
                        <Text
                          numberOfLines={1}
                          className="ml-1 text-sm text-gray-600"
                          style={{
                            marginLeft: responsive.spacing.xs,
                            fontSize: responsive.fontSize.sm,
                          }}>
                          {timeRange}
                        </Text>
                      </View>

                      <View className="mt-2" style={{ marginTop: responsive.spacing.sm }}>
                        <View
                          className="self-start rounded-full px-3 py-1"
                          style={{
                            backgroundColor: statusInfo.bgColor,
                            paddingHorizontal: responsive.spacing.sm,
                            paddingVertical: responsive.spacing.xs,
                          }}>
                          <Text
                            className="text-xs font-semibold"
                            style={{ color: statusInfo.color, fontSize: responsive.fontSize.xs }}>
                            {statusInfo.text}
                          </Text>
                        </View>
                      </View>

                      {/* Action Buttons - Only for UPCOMING appointments */}
                      {isUpcoming && (
                        <View className="mt-3" style={{ marginTop: responsive.spacing.base }}>
                          {/* Payment Button */}
                          {hasUnpaidBilling && (
                            <TouchableOpacity
                              onPress={() => {
                                if (canCreatePayment && !isNavigating) {
                                  setIsNavigating(true);
                                  router.push(`/(homes)/(payment)?id=${appointment.id}`);
                                  setTimeout(() => setIsNavigating(false), 1000);
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
                                paddingVertical: responsive.spacing.base,
                                shadowColor: '#000',
                                shadowOffset: { width: 0, height: 2 },
                                shadowOpacity: 0.2,
                                shadowRadius: 3,
                                elevation: 3,
                              }}>
                              <View className="flex-row items-center">
                                {isPaymentPending ? (
                                  <>
                                    <Ionicons
                                      name="qr-code"
                                      size={responsive.isSmall ? 16 : 18}
                                      color="white"
                                    />
                                    <Text
                                      className="ml-2 text-sm font-bold text-white"
                                      style={{
                                        marginLeft: responsive.spacing.sm,
                                        fontSize: responsive.fontSize.sm,
                                      }}>
                                      Xem QR thanh toán
                                    </Text>
                                  </>
                                ) : (
                                  <>
                                    <Ionicons
                                      name="card"
                                      size={responsive.isSmall ? 16 : 18}
                                      color="white"
                                    />
                                    <Text
                                      className="ml-2 text-sm font-bold text-white"
                                      style={{
                                        marginLeft: responsive.spacing.sm,
                                        fontSize: responsive.fontSize.sm,
                                      }}>
                                      Thanh toán
                                    </Text>
                                  </>
                                )}
                              </View>
                            </TouchableOpacity>
                          )}

                          {!canCreatePayment && !isPaymentPending && hasUnpaidBilling && (
                            <Text
                              className="mt-2 text-center text-xs text-red-500"
                              style={{
                                marginTop: responsive.spacing.sm,
                                fontSize: responsive.fontSize.xs,
                              }}>
                              Vui lòng hoàn tất giao dịch đang chờ trước
                            </Text>
                          )}

                          {/* Other Action Buttons */}
                          <View
                            className="mt-3 flex-row gap-2"
                            style={{
                              marginTop: responsive.spacing.base,
                              gap: responsive.spacing.sm,
                            }}>
                            <TouchableOpacity
                              className="flex-1 flex-row items-center justify-center rounded-lg border-2 bg-white py-2.5"
                              style={{
                                paddingVertical: responsive.spacing.sm,
                                borderColor: Colors.primary,
                                shadowColor: Colors.primary,
                                shadowOffset: { width: 0, height: 1 },
                                shadowOpacity: 0.1,
                                shadowRadius: 2,
                                elevation: 2,
                              }}
                              onPress={() => {
                                setQrAppointmentId(appointment.id);
                                setQrModalVisible(true);
                              }}>
                              <Ionicons
                                name="qr-code-outline"
                                size={responsive.isSmall ? 14 : 16}
                                color={Colors.primary}
                              />
                              <Text
                                className="ml-1.5 text-sm font-semibold"
                                style={{
                                  marginLeft: responsive.spacing.xs,
                                  fontSize: responsive.fontSize.sm,
                                  color: Colors.primary,
                                }}>
                                QR
                              </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              className="flex-1 flex-row items-center justify-center rounded-lg border-2 bg-white py-2.5"
                              style={{
                                paddingVertical: responsive.spacing.sm,
                                borderColor: isWithin4Hours(appointment.startTime)
                                  ? '#9CA3AF'
                                  : Colors.primary,
                                shadowColor: Colors.primary,
                                shadowOffset: { width: 0, height: 1 },
                                shadowOpacity: 0.1,
                                shadowRadius: 2,
                                elevation: 2,
                                opacity: isWithin4Hours(appointment.startTime) ? 0.5 : 1,
                              }}
                              disabled={isWithin4Hours(appointment.startTime)}
                              onPress={() => {
                                if (isNavigating) return;
                                setIsNavigating(true);
                                router.push(`/(homes)/(appointment)/update?id=${appointment.id}`);
                                setTimeout(() => setIsNavigating(false), 1000);
                              }}>
                              <Text
                                className="text-sm font-semibold"
                                style={{
                                  fontSize: responsive.fontSize.sm,
                                  color: isWithin4Hours(appointment.startTime)
                                    ? '#9CA3AF'
                                    : Colors.primary,
                                }}>
                                Đổi lịch
                              </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              className="flex-1 flex-row items-center justify-center rounded-lg border-2 bg-white py-2.5"
                              style={{
                                paddingVertical: responsive.spacing.sm,
                                borderColor: isWithin4Hours(appointment.startTime)
                                  ? '#9CA3AF'
                                  : Colors.error,
                                shadowColor: Colors.error,
                                shadowOffset: { width: 0, height: 1 },
                                shadowOpacity: 0.1,
                                shadowRadius: 2,
                                elevation: 2,
                                opacity:
                                  isWithin4Hours(appointment.startTime) ||
                                  cancellingId === appointment.id
                                    ? 0.5
                                    : 1,
                              }}
                              disabled={
                                isWithin4Hours(appointment.startTime) ||
                                cancellingId === appointment.id
                              }
                              onPress={() => handleCancelAppointment(appointment.id)}>
                              {cancellingId === appointment.id ? (
                                <ActivityIndicator size="small" color={Colors.error} />
                              ) : (
                                <>
                                  <Text
                                    className="text-sm font-semibold"
                                    style={{
                                      fontSize: responsive.fontSize.sm,
                                      color: isWithin4Hours(appointment.startTime)
                                        ? '#9CA3AF'
                                        : Colors.error,
                                    }}>
                                    Hủy lịch
                                  </Text>
                                </>
                              )}
                            </TouchableOpacity>
                          </View>

                          <Text
                            className="mt-2 text-xs text-gray-400"
                            style={{
                              marginTop: responsive.spacing.sm,
                              fontSize: responsive.fontSize.xs,
                            }}>
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
            <View
              className="mt-6 flex-row items-center justify-center gap-2"
              style={{ marginTop: responsive.spacing.lg, gap: responsive.spacing.sm }}>
              <TouchableOpacity
                onPress={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className={`rounded-lg border px-4 py-2 ${
                  page === 1 ? 'border-gray-300 bg-gray-100' : 'border-blue-500 bg-white'
                }`}
                style={{
                  paddingHorizontal: responsive.spacing.base,
                  paddingVertical: responsive.spacing.sm,
                }}>
                <Ionicons
                  name="chevron-back"
                  size={responsive.isSmall ? 18 : 20}
                  color={page === 1 ? '#9CA3AF' : Colors.primary}
                />
              </TouchableOpacity>

              <View className="flex-row items-center gap-1" style={{ gap: responsive.spacing.xs }}>
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
                      }`}
                      style={{
                        paddingHorizontal: responsive.spacing.base,
                        paddingVertical: responsive.spacing.sm,
                      }}>
                      <Text
                        className={`text-sm font-medium ${
                          page === pageNum ? 'text-white' : 'text-gray-700'
                        }`}
                        style={{ fontSize: responsive.fontSize.sm }}>
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
                }`}
                style={{
                  paddingHorizontal: responsive.spacing.base,
                  paddingVertical: responsive.spacing.sm,
                }}>
                <Ionicons
                  name="chevron-forward"
                  size={responsive.isSmall ? 18 : 20}
                  color={page === totalPages ? '#9CA3AF' : Colors.primary}
                />
              </TouchableOpacity>
            </View>
          )}

          {/* Page Info */}
          {!isLoading && appointments.length > 0 && (
            <Text
              className="mt-4 text-center text-sm text-gray-500"
              style={{ marginTop: responsive.spacing.lg, fontSize: responsive.fontSize.sm }}>
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
            padding: responsive.horizontalPadding,
          }}
          onPress={() => setDateSortModalVisible(false)}>
          <View
            style={{
              width: '100%',
              maxWidth: 320,
              backgroundColor: 'white',
              borderRadius: 20,
              overflow: 'hidden',
              shadowColor: Colors.primary,
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.3,
              shadowRadius: 16,
              elevation: 10,
            }}
            onStartShouldSetResponder={() => true}>
            {/* Header with Gradient */}
            <LinearGradient
              colors={[Colors.primary, Colors.accent]}
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
                        borderColor: Colors.primary,
                        shadowColor: Colors.primary,
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
                        borderColor: Colors.primary,
                        shadowColor: Colors.primary,
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
            padding: responsive.horizontalPadding,
          }}
          onPress={() => setPaymentFilterModalVisible(false)}>
          <View
            style={{
              width: '100%',
              maxWidth: responsive.isSmall ? 300 : 320,
              backgroundColor: 'white',
              borderRadius: 20,
              overflow: 'hidden',
              shadowColor: Colors.secondary,
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.3,
              shadowRadius: 16,
              elevation: 10,
            }}
            onStartShouldSetResponder={() => true}>
            {/* Header with Gradient */}
            <LinearGradient
              colors={[Colors.secondary, Colors.secondaryLight]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                paddingHorizontal: responsive.spacing.lg,
                paddingVertical: responsive.spacing.base,
              }}>
              <View className="flex-row items-center">
                <View
                  className="mr-3 rounded-full bg-white/20 p-2"
                  style={{ marginRight: responsive.spacing.base, padding: responsive.spacing.sm }}>
                  <Ionicons name="card" size={responsive.isSmall ? 18 : 20} color="white" />
                </View>
                <Text
                  className="flex-1 text-lg font-bold text-white"
                  style={{ fontSize: responsive.fontSize.lg }}>
                  Lọc theo thanh toán
                </Text>
              </View>
            </LinearGradient>

            {/* Options */}
            <View className="py-2" style={{ paddingVertical: responsive.spacing.sm }}>
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
                        borderColor: Colors.secondary,
                        shadowColor: Colors.secondary,
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
                        borderColor: Colors.warning,
                        shadowColor: Colors.warning,
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
                        borderColor: Colors.secondary,
                        shadowColor: Colors.secondary,
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
                      color={paymentFilter === 'PAID' ? Colors.secondary : Colors.textMuted}
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
            padding: responsive.horizontalPadding,
          }}>
          <View
            style={{
              width: '100%',
              maxWidth: responsive.isSmall ? 320 : 420,
              backgroundColor: 'white',
              borderRadius: 12,
              padding: responsive.spacing.lg,
              alignItems: 'center',
            }}>
            <Text
              style={{
                fontSize: responsive.fontSize.lg,
                fontWeight: '700',
                marginBottom: responsive.spacing.base,
              }}>
              Mã QR CheckIn
            </Text>

            <QRCode
              value={`${process.env.EXPO_PUBLIC_WEB_URL}/receptionist/appointment/${qrAppointmentId}`}
              size={responsive.isSmall ? 180 : 200}
              color="black"
              backgroundColor="white"
              logoSize={40}
              logoMargin={2}
              logoBorderRadius={8}
            />

            <Text
              style={{
                color: Colors.textMuted,
                marginBottom: responsive.spacing.base,
                marginTop: responsive.spacing.base,
                fontSize: responsive.fontSize.sm,
              }}>
              {qrAppointmentId ? `Lịch hẹn #${qrAppointmentId}` : ''}
            </Text>

            <Pressable
              onPress={() => setQrModalVisible(false)}
              style={{
                backgroundColor: '#0284C7',
                paddingVertical: responsive.spacing.sm,
                paddingHorizontal: responsive.spacing.lg,
                borderRadius: 8,
              }}>
              <Text style={{ color: 'white', fontWeight: '600', fontSize: responsive.fontSize.sm }}>
                Đóng
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}
