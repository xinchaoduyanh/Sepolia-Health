'use client';

import { NotificationData, useNotificationContext } from '@/contexts/NotificationContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function NotificationScreen() {
  const { notifications, unreadCount, isReady, markAsRead, refreshNotifications } =
    useNotificationContext();
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  // Refresh handler
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshNotifications();
    setRefreshing(false);
  }, [refreshNotifications]);

  // Handle notification press
  const handleNotificationPress = async (notification: NotificationData) => {
    const appointmentId = notification.metadata?.appointmentId || notification.metadata?.id;

    if (appointmentId) {
      // Mark as read if not already read
      if (notification.status !== 'READ') {
        try {
          await markAsRead(notification.id);
        } catch (error) {
          console.error('Error marking notification as read:', error);
        }
      }

      router.push({
        pathname: '/(homes)/(appointment-detail)',
        params: { id: appointmentId },
      });
    } else {
      // Show alert if no detail is available
      Alert.alert('Thông báo', 'Không có thông tin chi tiết cho thông báo này');
    }
  };

  // Filter notifications
  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'unread') {
      return n.status === 'UNREAD';
    }
    return true;
  });

  // Get notification icon and color based on type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'CREATE_APPOINTMENT_PATIENT':
        return { icon: 'calendar', color: '#10B981' };
      case 'UPDATE_APPOINTMENT_PATIENT':
        return { icon: 'create-outline', color: '#0284C7' };
      case 'DELETE_APPOINTMENT_PATIENT':
        return { icon: 'close-circle-outline', color: '#EF4444' };
      case 'PAYMENT_SUCCESS':
        return { icon: 'checkmark-circle', color: '#10B981' };
      case 'PAYMENT_FAILED':
        return { icon: 'alert-circle-outline', color: '#EF4444' };
      default:
        return { icon: 'notifications', color: '#0284C7' };
    }
  };

  // Get priority badge color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return '#EF4444';
      case 'HIGH':
        return '#F59E0B';
      case 'MEDIUM':
        return '#0284C7';
      case 'LOW':
        return '#6B7280';
      default:
        return '#0284C7';
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;

    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Header */}
      <LinearGradient
        colors={['#0284C7', '#06B6D4']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          paddingTop: 60,
          paddingBottom: 24,
          paddingHorizontal: 24,
        }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              height: 40,
              width: 40,
              borderRadius: 20,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(255,255,255,0.2)',
              marginRight: 16,
            }}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#FFFFFF' }}>Thông báo</Text>
            {unreadCount > 0 && (
              <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.9)', marginTop: 4 }}>
                {unreadCount} thông báo chưa đọc
              </Text>
            )}
          </View>
        </View>

        {/* Filter Tabs */}
        <View
          style={{
            flexDirection: 'row',
            backgroundColor: 'rgba(255,255,255,0.15)',
            borderRadius: 12,
            padding: 4,
          }}>
          <TouchableOpacity
            onPress={() => setFilter('all')}
            style={{
              flex: 1,
              paddingVertical: 10,
              borderRadius: 8,
              alignItems: 'center',
              backgroundColor: filter === 'all' ? '#FFFFFF' : 'transparent',
            }}>
            <Text
              style={{
                fontSize: 14,
                fontWeight: '600',
                color: filter === 'all' ? '#0284C7' : '#FFFFFF',
              }}>
              Tất cả ({notifications.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setFilter('unread')}
            style={{
              flex: 1,
              paddingVertical: 10,
              borderRadius: 8,
              alignItems: 'center',
              backgroundColor: filter === 'unread' ? '#FFFFFF' : 'transparent',
            }}>
            <Text
              style={{
                fontSize: 14,
                fontWeight: '600',
                color: filter === 'unread' ? '#0284C7' : '#FFFFFF',
              }}>
              Chưa đọc ({unreadCount})
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Notifications List */}
      {!isReady ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color="#0284C7" />
          <Text style={{ marginTop: 16, fontSize: 14, color: '#64748B' }}>
            Đang kết nối thông báo...
          </Text>
        </View>
      ) : filteredNotifications.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 }}>
          <View
            style={{
              height: 120,
              width: 120,
              borderRadius: 60,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#E0F2FE',
              marginBottom: 20,
            }}>
            <Ionicons name="notifications-off-outline" size={60} color="#0284C7" />
          </View>
          <Text
            style={{
              fontSize: 18,
              fontWeight: '600',
              color: '#1E293B',
              marginBottom: 8,
              textAlign: 'center',
            }}>
            {filter === 'unread' ? 'Không có thông báo chưa đọc' : 'Chưa có thông báo'}
          </Text>
          <Text style={{ fontSize: 14, color: '#64748B', textAlign: 'center' }}>
            {filter === 'unread'
              ? 'Tất cả thông báo đã được đọc'
              : 'Các thông báo sẽ hiển thị ở đây'}
          </Text>
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
          {filteredNotifications.map((notification) => {
            const { icon, color } = getNotificationIcon(notification.type);
            const isUnread = notification.status === 'UNREAD';

            return (
              <TouchableOpacity
                key={notification.id}
                onPress={() => handleNotificationPress(notification)}
                style={{
                  marginBottom: 12,
                  borderRadius: 16,
                  backgroundColor: isUnread ? '#FFFFFF' : '#F8FAFC',
                  borderWidth: isUnread ? 2 : 1,
                  borderColor: isUnread ? '#0284C7' : '#E2E8F0',
                  overflow: 'hidden',
                  shadowColor: isUnread ? '#0284C7' : '#000000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: isUnread ? 0.1 : 0.05,
                  shadowRadius: 8,
                  elevation: isUnread ? 3 : 1,
                }}>
                {/* Priority Badge */}
                {notification.priority !== 'MEDIUM' && (
                  <View
                    style={{
                      position: 'absolute',
                      top: 0,
                      right: 0,
                      paddingHorizontal: 12,
                      paddingVertical: 4,
                      backgroundColor: getPriorityColor(notification.priority),
                      borderBottomLeftRadius: 8,
                    }}>
                    <Text style={{ fontSize: 10, fontWeight: '700', color: '#FFFFFF' }}>
                      {notification.priority === 'URGENT'
                        ? 'KHẨN CẤP'
                        : notification.priority === 'HIGH'
                          ? 'CAO'
                          : 'THẤP'}
                    </Text>
                  </View>
                )}

                <View style={{ flexDirection: 'row', padding: 16 }}>
                  {/* Icon */}
                  <View
                    style={{
                      height: 48,
                      width: 48,
                      borderRadius: 24,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: `${color}15`,
                      marginRight: 12,
                    }}>
                    <Ionicons name={icon as any} size={24} color={color} />
                  </View>

                  {/* Content */}
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: isUnread ? '700' : '600',
                        color: '#0F172A',
                        marginBottom: 6,
                      }}>
                      {notification.title}
                    </Text>
                    <Text
                      style={{
                        fontSize: 14,
                        color: '#475569',
                        lineHeight: 20,
                        marginBottom: 8,
                      }}>
                      {notification.message}
                    </Text>

                    {/* Footer */}
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Ionicons name="time-outline" size={14} color="#94A3B8" />
                        <Text style={{ fontSize: 12, color: '#94A3B8', marginLeft: 4 }}>
                          {formatDate(notification.createdAt)}
                        </Text>
                      </View>
                      {isUnread && (
                        <View
                          style={{
                            height: 8,
                            width: 8,
                            borderRadius: 4,
                            backgroundColor: '#10B981',
                          }}
                        />
                      )}
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}
