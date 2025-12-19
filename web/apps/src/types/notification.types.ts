/**
 * Web App Notification Types
 * Copied from shared types for frontend use
 */

export enum NotificationType {
  // Appointment Notifications
  APPOINTMENT_REMINDER_PATIENT = 'APPOINTMENT_REMINDER_PATIENT',
  APPOINTMENT_REMINDER_DOCTOR = 'APPOINTMENT_REMINDER_DOCTOR',
  APPOINTMENT_REMINDER_RECEPTIONIST = 'APPOINTMENT_REMINDER_RECEPTIONIST',

  CREATE_APPOINTMENT_PATIENT = 'CREATE_APPOINTMENT_PATIENT',
  CREATE_APPOINTMENT_DOCTOR = 'CREATE_APPOINTMENT_DOCTOR',
  CREATE_APPOINTMENT_RECEPTIONIST = 'CREATE_APPOINTMENT_RECEPTIONIST',

  APPOINTMENT_STATUS_CHANGE = 'APPOINTMENT_STATUS_CHANGE',
  APPOINTMENT_RESCHEDULED_PATIENT = 'APPOINTMENT_RESCHEDULED_PATIENT',
  APPOINTMENT_RESCHEDULED_DOCTOR = 'APPOINTMENT_RESCHEDULED_DOCTOR',

  // NEW - Appointment Result Notifications (for your feature)
  APPOINTMENT_RESULT_PENDING = 'APPOINTMENT_RESULT_PENDING',
  APPOINTMENT_RESULT_AVAILABLE = 'APPOINTMENT_RESULT_AVAILABLE',

  // Payment Notifications
  PAYMENT_SUCCESS = 'PAYMENT_SUCCESS',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  PAYMENT_INITIATED = 'PAYMENT_INITIATED',
  APPOINTMENT_PAYMENT_COMPLETED = 'APPOINTMENT_PAYMENT_COMPLETED',
  REFUND_PROCESSED = 'REFUND_PROCESSED',

  // Admin System Notifications
  SYSTEM_MAINTENANCE_SCHEDULED = 'SYSTEM_MAINTENANCE_SCHEDULED',
  NEW_DOCTOR_VERIFICATION_REQUEST = 'NEW_DOCTOR_VERIFICATION_REQUEST',
  CLINIC_CAPACITY_ALERT = 'CLINIC_CAPACITY_ALERT',

  // Admin Broadcast Notifications
  ADMIN_BROADCAST = 'ADMIN_BROADCAST',
  ADMIN_ANNOUNCEMENT = 'ADMIN_ANNOUNCEMENT',
  PROMOTION_NOTIFICATION = 'PROMOTION_NOTIFICATION',
  SERVICE_UPDATE = 'SERVICE_UPDATE',
  POLICY_CHANGE = 'POLICY_CHANGE',

  // System Notifications
  SYSTEM_NOTIFICATION = 'SYSTEM_NOTIFICATION',
}

export enum NotificationPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export enum NotificationStatus {
  UNREAD = 'UNREAD',
  READ = 'READ',
  ARCHIVED = 'ARCHIVED',
}

// StreamChat message interface
export interface StreamChatNotification {
  id: string;
  type: NotificationType;
  user_id: string;
  created_at: string;
  text: string;
  title?: string;
  priority?: NotificationPriority;
  status?: NotificationStatus;
  metadata?: Record<string, any>;
}

// Local notification state
export interface NotificationState {
  notifications: NotificationListItem[];
  unreadCount: number;
  isLoading: boolean;
  isConnected: boolean;
  lastFetchTime?: Date;
}

// Notification list item for UI
export interface NotificationListItem {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  priority: NotificationPriority;
  status: NotificationStatus;
  createdAt: string;
  metadata?: Record<string, any>;
  isNew: boolean;
}

// Filter options
export interface NotificationFilters {
  type?: NotificationType;
  priority?: NotificationPriority;
  status?: NotificationStatus;
  dateRange?: {
    start: Date;
    end: Date;
  };
  searchTerm?: string;
}

// Notification component props
export interface NotificationBellProps {
  unreadCount: number;
  onClick?: () => void;
  className?: string;
}

export interface NotificationPanelProps {
  notifications: StreamChatNotification[];
  unreadCount: number;
  isLoading: boolean;
  onMarkAsRead: (notificationId: string) => void;
  onMarkAllAsRead: () => void;
  onArchive: (notificationId: string) => void;
  onFilterChange?: (filters: NotificationFilters) => void;
  onClose?: () => void;
}

// Helper function to format notification display
export function formatNotificationForDisplay(notification: StreamChatNotification): NotificationListItem {
  return {
    id: notification.id,
    type: notification.type,
    title: notification.title || 'Thông báo',
    message: notification.text,
    priority: notification.priority || NotificationPriority.MEDIUM,
    status: notification.status || NotificationStatus.UNREAD,
    createdAt: notification.created_at,
    metadata: notification.metadata,
    isNew: notification.status === NotificationStatus.UNREAD,
  };
}

// Helper function to get notification color by priority
export function getNotificationColor(priority: NotificationPriority): string {
  switch (priority) {
    case NotificationPriority.URGENT:
      return 'bg-red-500';
    case NotificationPriority.HIGH:
      return 'bg-orange-500';
    case NotificationPriority.MEDIUM:
      return 'bg-blue-500';
    case NotificationPriority.LOW:
      return 'bg-gray-500';
    default:
      return 'bg-gray-500';
  }
}

// Helper function to get notification icon by type
export function getNotificationIcon(type: NotificationType): string {
  switch (type) {
    case NotificationType.APPOINTMENT_RESULT_PENDING:
      return '📋';
    case NotificationType.APPOINTMENT_REMINDER_PATIENT:
    case NotificationType.APPOINTMENT_REMINDER_DOCTOR:
      return '📅';
    case NotificationType.PAYMENT_SUCCESS:
      return '💳';
    case NotificationType.ADMIN_BROADCAST:
      return '📢';
    case NotificationType.SYSTEM_MAINTENANCE_SCHEDULED:
      return '🔧';
    default:
      return '🔔';
  }
}