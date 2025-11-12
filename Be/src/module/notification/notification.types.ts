/**
 * Notification Types for different actions
 */
export enum NotificationType {
  // Patient Appointment Notifications
  CREATE_APPOINTMENT_PATIENT = 'CREATE_APPOINTMENT_PATIENT',
  UPDATE_APPOINTMENT_PATIENT = 'UPDATE_APPOINTMENT_PATIENT',
  DELETE_APPOINTMENT_PATIENT = 'DELETE_APPOINTMENT_PATIENT',

  // Doctor Appointment Notifications
  CREATE_APPOINTMENT_DOCTOR = 'CREATE_APPOINTMENT_DOCTOR',
  UPDATE_APPOINTMENT_DOCTOR = 'UPDATE_APPOINTMENT_DOCTOR',
  DELETE_APPOINTMENT_DOCTOR = 'DELETE_APPOINTMENT_DOCTOR',

  // Payment Notifications
  PAYMENT_SUCCESS = 'PAYMENT_SUCCESS',
  PAYMENT_FAILED = 'PAYMENT_FAILED',

  // General System Notifications
  SYSTEM_NOTIFICATION = 'SYSTEM_NOTIFICATION',
}

/**
 * Notification Priority
 */
export enum NotificationPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

/**
 * Notification Status
 */
export enum NotificationStatus {
  UNREAD = 'UNREAD',
  READ = 'READ',
  ARCHIVED = 'ARCHIVED',
}

/**
 * Base Notification Data interface
 */
export interface BaseNotificationData {
  title: string;
  message: string;
  type: NotificationType;
  priority: NotificationPriority;
  recipientId: string; // Stream Chat user ID
  senderId?: string; // Stream Chat user ID (optional for system notifications)
  metadata?: Record<string, any>;
  createdAt?: Date;
}

/**
 * Appointment Notification Data interface
 */
export interface AppointmentNotificationData extends BaseNotificationData {
  appointmentId: number;
  appointmentDate: string;
  appointmentTime: string;
  doctorName?: string;
  patientName?: string;
  serviceName?: string;
  clinicName?: string;
}

/**
 * Payment Notification Data interface
 */
export interface PaymentNotificationData extends BaseNotificationData {
  billingId: number;
  appointmentId: number;
  amount: number;
  paymentMethod?: string;
  transactionId?: string;
}

/**
 * Stream Chat Notification Message Type
 */
export interface StreamNotificationMessage {
  type: NotificationType;
  priority: NotificationPriority;
  status: NotificationStatus;
  data:
    | BaseNotificationData
    | AppointmentNotificationData
    | PaymentNotificationData;
  timestamp: Date;
}
