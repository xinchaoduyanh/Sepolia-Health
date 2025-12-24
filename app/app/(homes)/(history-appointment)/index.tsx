import { useMyAppointments } from '@/lib/api/appointments';
import { usePatientProfiles } from '@/lib/api/user';
import { AppointmentStatus } from '@/types/appointment';
import { formatTime } from '@/utils/datetime';
import { getRelationshipLabel } from '@/utils/relationshipTranslator';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import { RefreshControl, ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

export default function AppointmentHistoryScreen() {
  const [page, setPage] = useState(1);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedProfileId, setSelectedProfileId] = useState<number | null>(null); // null = all profiles

  // Fetch patient profiles for filter
  const { data: patientProfiles, isLoading: profilesLoading } = usePatientProfiles();

  // Filter to only show completed and cancelled appointments
  // Note: Backend will return COMPLETED/CANCELLED appointments from history (past)
  // Use a high limit to fetch all history, then paginate client-side
  const filters = {
    page: 1, // Always fetch page 1 from backend
    limit: 1000, // Fetch all history at once
    sortBy: 'date' as const,
    sortOrder: 'desc' as const,
    ...(selectedProfileId ? { patientProfileId: selectedProfileId } : {}),
  };

  // Chỉ fetch COMPLETED appointments (không lấy CANCELLED)
  const { data: completedData, isLoading } = useMyAppointments({
    ...filters,
    status: 'COMPLETED' as AppointmentStatus,
  });

  // Sort by startTime descending (newest first) - already sorted by backend but ensure
  const allAppointments = [...(completedData?.data || [])];
  allAppointments.sort((a, b) => {
    return new Date(b.startTime).getTime() - new Date(a.startTime).getTime();
  });

  // Manual pagination on results
  const startIndex = (page - 1) * 10;
  const endIndex = startIndex + 10;
  const appointments = allAppointments.slice(startIndex, endIndex);
  const total = allAppointments.length;
  const totalPages = Math.ceil(total / 10);

  const handleRefresh = async () => {
    setRefreshing(true);
    setPage(1);
    setRefreshing(false);
  };

  // Handle profile filter change
  const handleProfileFilterChange = (profileId: number | null) => {
    setSelectedProfileId(profileId);
    setPage(1); // Reset to first page when filter changes
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

          {/* Header với Back Button */}
          <View
            style={{
              position: 'absolute',
              top: 120,
              left: 24,
              right: 24,
            }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <TouchableOpacity
                onPress={() => router.back()}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                <Ionicons name="arrow-back" size={24} color="white" />
              </TouchableOpacity>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#FFFFFF' }}>
                  Lịch sử khám bệnh
                </Text>
                <Text style={{ fontSize: 14, color: '#FFFFFF', opacity: 0.9, marginTop: 4 }}>
                  Xem lại các lịch khám đã hoàn thành
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={{ paddingHorizontal: 24, marginTop: -80, marginBottom: 24 }}>
          {/* Patient Profile Filter */}
          {!profilesLoading && patientProfiles && patientProfiles.length > 0 && (
            <View style={{ marginBottom: 20 }}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 10 }}>
                {/* "All" Filter Chip */}
                <TouchableOpacity
                  onPress={() => handleProfileFilterChange(null)}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    borderRadius: 20,
                    backgroundColor: selectedProfileId === null ? '#0284C7' : 'white',
                    borderWidth: 1,
                    borderColor: selectedProfileId === null ? '#0284C7' : '#E5E7EB',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.05,
                    shadowRadius: 2,
                    elevation: 2,
                  }}>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: '600',
                      color: selectedProfileId === null ? 'white' : '#374151',
                    }}>
                    Tất cả
                  </Text>
                </TouchableOpacity>

                {/* Individual Profile Chips */}
                {patientProfiles.map((profile) => (
                  <TouchableOpacity
                    key={profile.id}
                    onPress={() => handleProfileFilterChange(profile.id)}
                    style={{
                      paddingHorizontal: 16,
                      paddingVertical: 10,
                      borderRadius: 20,
                      backgroundColor: selectedProfileId === profile.id ? '#0284C7' : 'white',
                      borderWidth: 1,
                      borderColor: selectedProfileId === profile.id ? '#0284C7' : '#E5E7EB',
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.05,
                      shadowRadius: 2,
                      elevation: 2,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 6,
                    }}>
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: '600',
                        color: selectedProfileId === profile.id ? 'white' : '#374151',
                      }}>
                      {profile.firstName} {profile.lastName}
                    </Text>
                    <Text
                      style={{
                        fontSize: 11,
                        color: selectedProfileId === profile.id ? 'white' : '#6B7280',
                        fontWeight: '500',
                      }}>
                      ({getRelationshipLabel(profile.relationship)})
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Appointments List */}
          {isLoading ? (
            <View style={{ gap: 16 }}>
              {/* Skeleton Cards - giống structure thật */}
              {[1, 2, 3].map((i) => (
                <View
                  key={i}
                  style={{
                    backgroundColor: 'white',
                    borderRadius: 16,
                    padding: 16,
                    flexDirection: 'row',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                    elevation: 3,
                  }}>
                  {/* Date Block Skeleton */}
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
                    <View
                      style={{
                        width: 40,
                        height: 14,
                        backgroundColor: '#E5E7EB',
                        borderRadius: 4,
                        marginBottom: 4,
                      }}
                    />
                    <View
                      style={{
                        width: 40,
                        height: 28,
                        backgroundColor: '#E5E7EB',
                        borderRadius: 4,
                      }}
                    />
                  </View>

                  {/* Content Skeleton */}
                  <View style={{ flex: 1, gap: 8 }}>
                    <View
                      style={{
                        width: '70%',
                        height: 20,
                        backgroundColor: '#E5E7EB',
                        borderRadius: 4,
                      }}
                    />
                    <View
                      style={{
                        width: '50%',
                        height: 16,
                        backgroundColor: '#E5E7EB',
                        borderRadius: 4,
                      }}
                    />
                    <View
                      style={{
                        width: '60%',
                        height: 16,
                        backgroundColor: '#E5E7EB',
                        borderRadius: 4,
                      }}
                    />

                    {/* Status Badge Skeleton */}
                    <View
                      style={{
                        width: 100,
                        height: 24,
                        backgroundColor: '#E5E7EB',
                        borderRadius: 12,
                        marginTop: 4,
                      }}
                    />

                    {/* Result Box Skeleton */}
                    <View
                      style={{
                        marginTop: 12,
                        backgroundColor: '#EFF6FF',
                        borderRadius: 8,
                        padding: 12,
                        borderLeftWidth: 3,
                        borderLeftColor: '#E5E7EB',
                        gap: 8,
                      }}>
                      <View
                        style={{
                          width: '80%',
                          height: 14,
                          backgroundColor: '#E5E7EB',
                          borderRadius: 4,
                        }}
                      />
                      <View
                        style={{
                          width: '100%',
                          height: 14,
                          backgroundColor: '#E5E7EB',
                          borderRadius: 4,
                        }}
                      />
                    </View>
                  </View>
                </View>
              ))}
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
                {selectedProfileId ? 'Không có lịch sử khám bệnh' : 'Chưa có lịch sử khám bệnh'}
              </Text>
              <Text style={{ marginTop: 8, fontSize: 14, color: '#6B7280', textAlign: 'center' }}>
                {selectedProfileId
                  ? 'Người thân này chưa có lịch khám đã hoàn thành'
                  : 'Các lịch khám đã hoàn thành sẽ hiển thị tại đây'}
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
                  onPress={() => router.push(`/(homes)/(appointment-detail)?id=${appointment.id}`)}
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
                                  router.push(`/(homes)/(appointment-detail)?id=${appointment.id}`)
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
