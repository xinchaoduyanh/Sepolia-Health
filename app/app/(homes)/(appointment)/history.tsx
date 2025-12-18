import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { router } from 'expo-router';
import { useMyAppointments } from '@/lib/api/appointments';
import { formatTime } from '@/utils/datetime';
import { AppointmentStatus } from '@/types/appointment';
import { getRelationshipLabel } from '@/utils/relationshipTranslator';

export default function AppointmentHistoryScreen() {
  const [page, setPage] = useState(1);
  const [refreshing, setRefreshing] = useState(false);

  // Filter to only show completed and cancelled appointments
  const filters = {
    page,
    limit: 10,
    status: 'COMPLETED' as AppointmentStatus, // We'll filter manually to include CANCELLED too
    sortBy: 'date' as const,
    sortOrder: 'desc' as const,
  };

  const { data: appointmentsData, isLoading } = useMyAppointments({
    ...filters,
    status: undefined, // Get all, then filter
  });

  const appointments = (appointmentsData?.data || []).filter(
    (apt) => apt.status === 'COMPLETED' || apt.status === 'CANCELLED'
  );
  const total = appointments.length;
  const totalPages = Math.ceil(total / 10);

  const handleRefresh = async () => {
    setRefreshing(true);
    setPage(1);
    setRefreshing(false);
  };

  const getDateParts = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    return { day, month, year };
  };

  const getStatusInfo = (status: AppointmentStatus) => {
    switch (status) {
      case 'COMPLETED':
        return { text: 'Đã hoàn thành', color: '#10B981', bgColor: '#D1FAE5' };
      case 'CANCELLED':
        return { text: 'Đã hủy', color: '#EF4444', bgColor: '#FEE2E2' };
      default:
        return { text: status, color: '#6B7280', bgColor: '#F3F4F6' };
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#E0F2FE' }}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <ScrollView
        showsVerticalScrollIndicator={false}
        bounces={false}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}>
        {/* Background Gradient */}
        <View style={{ height: 280, position: 'relative', marginTop: -60 }}>
          <LinearGradient
            colors={['#0284C7', '#06B6D4', '#10B981']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ flex: 1 }}
          />
          {/* Curved bottom edge */}
          <Svg
            height="70"
            width="200%"
            viewBox="0 0 1440 120"
            style={{ position: 'absolute', bottom: -1, left: 0, right: 0 }}>
            <Path d="M0,0 Q720,120 1440,0 L1440,120 L0,120 Z" fill="#E0F2FE" />
          </Svg>

          {/* Header */}
          <View
            style={{
              position: 'absolute',
              top: 120,
              left: 24,
              right: 24,
            }}>
            <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#FFFFFF' }}>
              Lịch sử khám bệnh
            </Text>
            <Text style={{ fontSize: 14, color: '#FFFFFF', opacity: 0.9, marginTop: 4 }}>
              Xem lại các lịch khám đã hoàn thành
            </Text>
          </View>
        </View>

        <View style={{ paddingHorizontal: 24, marginTop: -80, marginBottom: 24 }}>
          {/* Appointments List */}
          {isLoading ? (
            <View style={{ alignItems: 'center', paddingVertical: 40 }}>
              <ActivityIndicator size="large" color="#0284C7" />
              <Text style={{ marginTop: 16, fontSize: 16, color: '#6B7280' }}>
                Đang tải lịch sử...
              </Text>
            </View>
          ) : appointments.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 40 }}>
              <View
                style={{
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 999,
                  backgroundColor: 'white',
                  padding: 24,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                  elevation: 3,
                }}>
                <Ionicons name="time-outline" size={64} color="#0284C7" />
              </View>
              <Text style={{ marginTop: 24, fontSize: 20, fontWeight: 'bold', color: '#1F2937' }}>
                Chưa có lịch sử khám bệnh
              </Text>
              <Text style={{ marginTop: 8, fontSize: 14, color: '#6B7280', textAlign: 'center' }}>
                Các lịch khám đã hoàn thành sẽ hiển thị tại đây
              </Text>
            </View>
          ) : (
            appointments.map((appointment) => {
              const { day, month, year } = getDateParts(appointment.startTime);
              const startDate = new Date(appointment.startTime);
              const endDate = new Date(
                startDate.getTime() + appointment.service.duration * 60 * 1000
              );
              const timeRange = `${formatTime(appointment.startTime)} - ${formatTime(
                endDate.toISOString()
              )}`;
              const statusInfo = getStatusInfo(appointment.status as AppointmentStatus);
              const isCompleted = appointment.status === 'COMPLETED';
              const hasResult = !!appointment.result;
              const hasFeedback = !!appointment.feedback;

              return (
                <TouchableOpacity
                  key={appointment.id}
                  onPress={() =>
                    router.push(`/(homes)/appointment-detail?id=${appointment.id}`)
                  }
                  style={{
                    backgroundColor: 'white',
                    borderRadius: 16,
                    padding: 16,
                    marginBottom: 16,
                    borderLeftWidth: 4,
                    borderLeftColor: statusInfo.color,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                    elevation: 3,
                  }}>
                  <View style={{ flexDirection: 'row' }}>
                    {/* Date Block */}
                    <View
                      style={{
                        marginRight: 16,
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: 12,
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        backgroundColor: '#F0FDFA',
                      }}>
                      <Text style={{ fontSize: 12, fontWeight: '600', color: '#6B7280' }}>
                        {month}/{year}
                      </Text>
                      <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#0284C7' }}>
                        {day.toString().padStart(2, '0')}
                      </Text>
                    </View>

                    {/* Appointment Details */}
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1F2937' }}>
                        {appointment.service.name}
                      </Text>
                      {(appointment.patient || appointment.patientProfile) && (
                        <Text
                          style={{
                            marginTop: 4,
                            fontSize: 14,
                            color: '#0284C7',
                            fontWeight: '600',
                          }}>
                          {appointment.patient?.firstName || appointment.patientProfile?.firstName}{' '}
                          {appointment.patient?.lastName || appointment.patientProfile?.lastName}
                          {(appointment.patient?.relationship ||
                            appointment.patientProfile?.relationship) && (
                            <Text style={{ fontSize: 12, color: '#6B7280', fontWeight: '400' }}>
                              {' '}
                              (
                              {getRelationshipLabel(
                                (appointment.patient?.relationship ||
                                  appointment.patientProfile?.relationship) as string | undefined
                              )}
                              )
                            </Text>
                          )}
                        </Text>
                      )}
                      <Text style={{ marginTop: 4, fontSize: 14, color: '#6B7280' }}>
                        BS. {appointment.doctor.firstName} {appointment.doctor.lastName}
                      </Text>
                      <Text style={{ marginTop: 2, fontSize: 13, color: '#9CA3AF' }}>
                        {appointment.clinic?.name || 'Bệnh viện'}
                      </Text>

                      <View style={{ marginTop: 8, flexDirection: 'row', alignItems: 'center' }}>
                        <Ionicons name="time-outline" size={16} color="#6B7280" />
                        <Text style={{ marginLeft: 4, fontSize: 13, color: '#6B7280' }}>
                          {timeRange}
                        </Text>
                      </View>

                      {/* Status Badge */}
                      <View style={{ marginTop: 8 }}>
                        <View
                          style={{
                            alignSelf: 'flex-start',
                            borderRadius: 999,
                            paddingHorizontal: 12,
                            paddingVertical: 4,
                            backgroundColor: statusInfo.bgColor,
                          }}>
                          <Text
                            style={{
                              fontSize: 12,
                              fontWeight: '600',
                              color: statusInfo.color,
                            }}>
                            {statusInfo.text}
                          </Text>
                        </View>
                      </View>

                      {/* Result from Doctor - Only for COMPLETED */}
                      {isCompleted && (
                        <View style={{ marginTop: 12 }}>
                          {hasResult ? (
                            <View
                              style={{
                                backgroundColor: '#EFF6FF',
                                borderRadius: 8,
                                padding: 12,
                                borderLeftWidth: 3,
                                borderLeftColor: '#3B82F6',
                              }}>
                              <View
                                style={{
                                  flexDirection: 'row',
                                  alignItems: 'center',
                                  marginBottom: 8,
                                }}>
                                <Ionicons name="document-text" size={18} color="#3B82F6" />
                                <Text
                                  style={{
                                    marginLeft: 6,
                                    fontSize: 14,
                                    fontWeight: '600',
                                    color: '#1F2937',
                                  }}>
                                  Kết quả khám từ bác sĩ
                                </Text>
                              </View>
                              {appointment.result?.diagnosis && (
                                <Text
                                  style={{
                                    fontSize: 13,
                                    color: '#374151',
                                    marginTop: 4,
                                  }}
                                  numberOfLines={2}>
                                  <Text style={{ fontWeight: '600' }}>Chẩn đoán: </Text>
                                  {appointment.result.diagnosis}
                                </Text>
                              )}
                              <TouchableOpacity
                                onPress={() =>
                                  router.push(
                                    `/(homes)/appointment-detail?id=${appointment.id}`
                                  )
                                }
                                style={{ marginTop: 8 }}>
                                <Text
                                  style={{
                                    fontSize: 12,
                                    color: '#3B82F6',
                                    fontWeight: '600',
                                  }}>
                                  Xem chi tiết kết quả →
                                </Text>
                              </TouchableOpacity>
                            </View>
                          ) : (
                            <View
                              style={{
                                backgroundColor: '#FEF3C7',
                                borderRadius: 8,
                                padding: 12,
                                borderLeftWidth: 3,
                                borderLeftColor: '#F59E0B',
                                flexDirection: 'row',
                                alignItems: 'center',
                              }}>
                              <Ionicons name="time-outline" size={18} color="#F59E0B" />
                              <Text
                                style={{
                                  marginLeft: 8,
                                  fontSize: 13,
                                  color: '#92400E',
                                  flex: 1,
                                }}>
                                Chờ kết quả từ bác sĩ
                              </Text>
                            </View>
                          )}
                        </View>
                      )}

                      {/* Feedback Button - Only for COMPLETED without feedback */}
                      {isCompleted && !hasFeedback && (
                        <TouchableOpacity
                          onPress={(e) => {
                            e.stopPropagation();
                            router.push(`/(homes)/(appointment)/feedback?id=${appointment.id}`);
                          }}
                          style={{
                            marginTop: 12,
                            backgroundColor: '#0284C7',
                            borderRadius: 8,
                            padding: 12,
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}>
                          <Ionicons name="star-outline" size={18} color="white" />
                          <Text
                            style={{
                              marginLeft: 6,
                              fontSize: 14,
                              fontWeight: '600',
                              color: 'white',
                            }}>
                            Đánh giá bác sĩ
                          </Text>
                        </TouchableOpacity>
                      )}

                      {/* Feedback Status - If already rated */}
                      {isCompleted && hasFeedback && (
                        <View
                          style={{
                            marginTop: 12,
                            backgroundColor: '#D1FAE5',
                            borderRadius: 8,
                            padding: 12,
                            flexDirection: 'row',
                            alignItems: 'center',
                          }}>
                          <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                          <Text
                            style={{
                              marginLeft: 8,
                              fontSize: 13,
                              color: '#065F46',
                              flex: 1,
                            }}>
                            Đã đánh giá ({appointment.feedback?.rating}/5 sao)
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
              style={{
                marginTop: 24,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}>
              <TouchableOpacity
                onPress={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                style={{
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: page === 1 ? '#D1D5DB' : '#0284C7',
                  backgroundColor: page === 1 ? '#F3F4F6' : 'white',
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                }}>
                <Ionicons
                  name="chevron-back"
                  size={20}
                  color={page === 1 ? '#9CA3AF' : '#0284C7'}
                />
              </TouchableOpacity>

              <Text style={{ fontSize: 14, color: '#6B7280' }}>
                Trang {page} / {totalPages}
              </Text>

              <TouchableOpacity
                onPress={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                style={{
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: page === totalPages ? '#D1D5DB' : '#0284C7',
                  backgroundColor: page === totalPages ? '#F3F4F6' : 'white',
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                }}>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={page === totalPages ? '#9CA3AF' : '#0284C7'}
                />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
