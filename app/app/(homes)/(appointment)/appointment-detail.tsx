import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Animated,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useAppointment } from '@/lib/api/appointments';
import { formatDate, formatTime } from '@/utils/datetime';
import { AppointmentStatus } from '@/constants/enum';
import { getRelationshipLabel } from '@/utils/relationshipTranslator';

// Skeleton Component
const SkeletonBox = ({
  width = '100%',
  height = 16,
  style = {},
}: {
  width?: string | number;
  height?: number;
  style?: any;
}) => {
  const animatedValue = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => {
      animation.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          backgroundColor: '#E5E7EB',
          borderRadius: 8,
          opacity,
        },
        style,
      ]}
    />
  );
};

const AppointmentDetailSkeleton = () => {
  return (
    <View style={{ flex: 1, backgroundColor: '#E0F2FE' }}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Header Skeleton */}
      <LinearGradient
        colors={['#0284C7', '#06B6D4', '#10B981']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ paddingTop: 60, paddingBottom: 24, paddingHorizontal: 24 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View
            style={{
              width: 24,
              height: 24,
              borderRadius: 12,
              backgroundColor: 'rgba(255,255,255,0.3)',
              marginRight: 16,
            }}
          />
          <SkeletonBox
            width={200}
            height={24}
            style={{ backgroundColor: 'rgba(255,255,255,0.3)' }}
          />
        </View>
      </LinearGradient>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 24 }}>
        {/* Customer Section Skeleton */}
        <View style={{ backgroundColor: 'white', borderRadius: 16, padding: 16, marginBottom: 16 }}>
          <SkeletonBox width={120} height={20} style={{ marginBottom: 16 }} />
          <View style={{ marginBottom: 12 }}>
            <SkeletonBox width={80} height={14} style={{ marginBottom: 8 }} />
            <SkeletonBox width="70%" height={16} />
          </View>
          <View>
            <SkeletonBox width={80} height={14} style={{ marginBottom: 8 }} />
            <SkeletonBox width="90%" height={16} />
          </View>
        </View>

        {/* Doctor Section Skeleton */}
        <View style={{ backgroundColor: 'white', borderRadius: 16, padding: 16, marginBottom: 16 }}>
          <SkeletonBox width={80} height={20} style={{ marginBottom: 16 }} />
          {[1, 2, 3, 4, 5].map((item) => (
            <View key={item} style={{ marginBottom: 12 }}>
              <SkeletonBox width={100} height={14} style={{ marginBottom: 8 }} />
              <SkeletonBox width={item === 5 ? '60%' : '80%'} height={16} />
            </View>
          ))}
        </View>

        {/* Result Section Skeleton */}
        <View style={{ backgroundColor: 'white', borderRadius: 16, padding: 16, marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <View
              style={{
                width: 24,
                height: 24,
                borderRadius: 12,
                backgroundColor: '#E5E7EB',
                marginRight: 8,
              }}
            />
            <SkeletonBox width={180} height={20} />
          </View>
          <View style={{ marginBottom: 12 }}>
            <SkeletonBox width={80} height={14} style={{ marginBottom: 8 }} />
            <SkeletonBox width="100%" height={16} />
          </View>
          <View>
            <SkeletonBox width={120} height={14} style={{ marginBottom: 8 }} />
            <SkeletonBox width="100%" height={60} />
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default function AppointmentDetailScreen() {
  const { id } = useLocalSearchParams();
  const { data: appointment, isLoading } = useAppointment(Number(id));

  if (isLoading) {
    return <AppointmentDetailSkeleton />;
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
            Thông tin bệnh nhân
          </Text>
          <View style={{ marginBottom: 8 }}>
            <Text style={{ fontSize: 14, color: '#6B7280' }}>Họ và tên</Text>
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#1F2937' }}>
              {appointment.patient?.firstName || appointment.patientProfile?.firstName}{' '}
              {appointment.patient?.lastName || appointment.patientProfile?.lastName}
            </Text>
          </View>
          {(appointment.patient?.dateOfBirth || appointment.patientProfile?.dateOfBirth) && (
            <View style={{ marginBottom: 8 }}>
              <Text style={{ fontSize: 14, color: '#6B7280' }}>Ngày sinh</Text>
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#1F2937' }}>
                {formatDate(
                  (appointment.patient?.dateOfBirth ||
                    appointment.patientProfile?.dateOfBirth ||
                    '') as string
                )}
              </Text>
            </View>
          )}
          {(appointment.patient?.gender || appointment.patientProfile?.gender) && (
            <View style={{ marginBottom: 8 }}>
              <Text style={{ fontSize: 14, color: '#6B7280' }}>Giới tính</Text>
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#1F2937' }}>
                {(appointment.patient?.gender || appointment.patientProfile?.gender) === 'MALE'
                  ? 'Nam'
                  : (appointment.patient?.gender || appointment.patientProfile?.gender) === 'FEMALE'
                    ? 'Nữ'
                    : 'Khác'}
              </Text>
            </View>
          )}
          {(appointment.patient?.phone || appointment.patientProfile?.phone) && (
            <View style={{ marginBottom: 8 }}>
              <Text style={{ fontSize: 14, color: '#6B7280' }}>Số điện thoại</Text>
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#1F2937' }}>
                {appointment.patient?.phone || appointment.patientProfile?.phone}
              </Text>
            </View>
          )}
          {(appointment.patient?.relationship || appointment.patientProfile?.relationship) && (
            <View style={{ marginBottom: 8 }}>
              <Text style={{ fontSize: 14, color: '#6B7280' }}>Mối quan hệ</Text>
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#1F2937' }}>
                {getRelationshipLabel(
                  (appointment.patient?.relationship ||
                    appointment.patientProfile?.relationship) as string | undefined
                )}
              </Text>
            </View>
          )}
          <View
            style={{ marginTop: 8, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#E5E7EB' }}>
            <Text style={{ fontSize: 14, color: '#6B7280', marginBottom: 4 }}>Lý do khám</Text>
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
            {appointment.type === 'ONLINE' ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
                <Ionicons name="videocam" size={18} color="#10B981" style={{ marginRight: 6 }} />
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#10B981' }}>
                  Khám trực tuyến (Online)
                </Text>
              </View>
            ) : (
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#1F2937' }}>
                {appointment.clinic?.name || 'Bệnh viện'}
              </Text>
            )}
          </View>
          {/* Zoom Meeting Link for Online Appointments */}
          {appointment.type === 'ONLINE' && appointment.joinUrl && (
            <View style={{ marginBottom: 8 }}>
              <Text style={{ fontSize: 14, color: '#6B7280' }}>Link tham gia cuộc họp</Text>
              <TouchableOpacity
                onPress={() => Linking.openURL(appointment.joinUrl!)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: '#ECFDF5',
                  borderRadius: 8,
                  padding: 12,
                  marginTop: 4,
                }}>
                <Ionicons name="videocam" size={20} color="#10B981" style={{ marginRight: 8 }} />
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '600',
                    color: '#10B981',
                    flex: 1,
                  }}
                  numberOfLines={1}
                  ellipsizeMode="middle">
                  {appointment.joinUrl}
                </Text>
                <Ionicons name="open-outline" size={16} color="#10B981" />
              </TouchableOpacity>
            </View>
          )}
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
