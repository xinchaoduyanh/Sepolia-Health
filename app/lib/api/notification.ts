import api from '../api-client';
import {
  NotificationData,
  GetNotificationsParams,
  NotificationCountResponse,
} from '@/types/notification';

/**
 * Get notifications for a user
 */
export const getNotifications = async (
  params: GetNotificationsParams
): Promise<NotificationData[]> => {
  const { userId, limit = 20, offset = 0 } = params;
  const response = await api.get(`/notifications/${userId}`, {
    params: { limit, offset },
  });
  return response.data;
};

/**
 * Mark notification as read
 */
export const markNotificationAsRead = async (userId: string, messageId: string): Promise<void> => {
  await api.patch(`/notifications/${userId}/${messageId}/read`);
};

/**
 * Get unread notification count
 */
export const getUnreadNotificationCount = async (userId: string): Promise<number> => {
  const response = await api.get<NotificationCountResponse>(
    `/notifications/${userId}/unread/count`
  );
  return response.data.count;
};
