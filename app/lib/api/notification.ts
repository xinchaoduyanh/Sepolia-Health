import api from '../api-client';

export interface NotificationData {
  id: string;
  type: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'UNREAD' | 'READ' | 'ARCHIVED';
  title: string;
  message: string;
  metadata?: Record<string, any>;
  createdAt: string;
  readAt?: string;
}

export interface GetNotificationsParams {
  userId: string;
  limit?: number;
  offset?: number;
}

export interface NotificationCountResponse {
  count: number;
}

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
