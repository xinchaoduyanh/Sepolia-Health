/**
 * Shared Notification Types
 * Location: /shared/notification-types.ts
 * Purpose: Centralized notification types to avoid hardcoded strings
 * Usage: Backend, Web Dashboard, Mobile App
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

// Appointment Result Pending - NEW INTERFACE FOR YOUR FEATURE
export interface AppointmentResultPendingNotification {
  type: NotificationType.APPOINTMENT_RESULT_PENDING;
  priority: NotificationPriority.HIGH;
  title: string;
  message: string;
  metadata: {
    doctorId: number;
    doctorUserId: number;
    patientCount: number;
    appointmentIds: number[];
    patientNames?: string[];
    clinicId?: number;
    scanDate: string;
  };
}

// Generic notification interface
export interface BaseNotification {
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  metadata?: Record<string, any>;
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

// Notification template interface
export interface NotificationTemplate {
  id: string;
  name: string;
  type: NotificationType;
  title: string;
  message: string;
  variables?: string[];
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// Campaign interface
export interface NotificationCampaign {
  id: string;
  name: string;
  title: string;
  message: string;
  targetRoles?: string[];
  targetClinics?: number[];
  scheduledFor?: string;
  status: 'DRAFT' | 'SCHEDULED' | 'SENT' | 'CANCELLED';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// Analytics interface
export interface NotificationAnalytics {
  totalSent: number;
  totalDelivered: number;
  totalRead: number;
  deliveryRate: number;
  readRate: number;
  byType: Record<string, number>;
  byPriority: Record<NotificationPriority, number>;
  dateRange: {
    start: string;
    end: string;
  };
}

// Queue statistics for BullMQ
export interface QueueStats {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
}

// Scanner statistics for appointment result scanner
export interface AppointmentScannerStats {
  lastScanTime: Date | null;
  nextScanTime: Date | null;
  totalDoctorsNotified: number;
  totalPendingAppointments: number;
  averageProcessingTime: number;
}

// Helper function to validate notification type
export function isValidNotificationType(type: string): type is NotificationType {
  return Object.values(NotificationType).includes(type as NotificationType);
}

// Helper function to validate priority
export function isValidNotificationPriority(priority: string): priority is NotificationPriority {
  return Object.values(NotificationPriority).includes(priority as NotificationPriority);
}

// Helper function to validate status
export function isValidNotificationStatus(status: string): status is NotificationStatus {
  return Object.values(NotificationStatus).includes(status as NotificationStatus);
}

// Helper function to create appointment result pending notification
export function createAppointmentResultPendingNotification(
  doctorId: number,
  doctorUserId: number,
  pendingCount: number,
  appointmentIds: number[],
  patientNames?: string[]
): AppointmentResultPendingNotification {
  return {
    type: NotificationType.APPOINTMENT_RESULT_PENDING,
    priority: NotificationPriority.HIGH,
    title: `Bạn có ${pendingCount} cuộc khám chưa trả kết quả`,
    message: `Vui lòng hoàn thành kết quả cho ${pendingCount} bệnh nhân trong hôm nay.${
      patientNames && patientNames.length > 0
        ? `\n\nBệnh nhân cần kết quả: ${patientNames.slice(0, 3).join(', ')}${
            patientNames.length > 3 ? ` và ${pendingCount - 3} bệnh nhân khác.` : ''
          }`
        : ''
    }`,
    metadata: {
      doctorId,
      doctorUserId,
      patientCount: pendingCount,
      appointmentIds,
      patientNames,
      scanDate: new Date().toISOString(),
    },
  };
}

export default NotificationType;