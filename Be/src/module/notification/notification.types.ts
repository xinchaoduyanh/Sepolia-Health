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

  // Appointment Result Notifications
  APPOINTMENT_RESULT_PATIENT = 'APPOINTMENT_RESULT_PATIENT',
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
  data: BaseNotificationData;
  AppointmentNotificationData;
  PaymentNotificationData;
  timestamp: Date;
}

export interface AppointmentNotificationPatient {
  appointmentId: number;
  startTime: Date;
  doctorName: string;
  serviceName: string;
  clinicName: string;
  recipientId: string;
  notes?: string;
  joinUrl?: string | null;
}

export interface UpdateAppointmentNotificationPatient
  extends Partial<AppointmentNotificationPatient> {
  appointmentId: number;
  recipientId: string;
  changes?: Record<string, any>;
  notes?: string;
}

export interface DeleteAppointmentNotificationPatient {
  appointmentId: number;
  startTime: Date;
  doctorName: string;
  serviceName: string;
  recipientId: string;
  reason?: string;
}

export interface AppointmentNotificationDoctor {
  appointmentId: number;
  startTime: Date;
  patientName: string;
  serviceName: string;
  clinicName: string;
  recipientId: string;
  notes?: string;
  hostUrl?: string | null;
}
export interface UpdateAppointmentNotificationDoctor
  extends Partial<AppointmentNotificationDoctor> {
  appointmentId: number;
  recipientId: string;
  changes?: Record<string, any>;
  notes?: string;
}
export interface DeleteAppointmentNotificationDoctor {
  appointmentId: number;
  startTime: Date;
  patientName: string;
  serviceName: string;
  recipientId: string;
  reason?: string;
}

export interface PaymentSuccessNotificationPatient {
  appointmentId: number;
  billingId: number;
  amount: number;
  recipientId: string;
  serviceName?: string;
  doctorName?: string;
  transactionId?: string;
  paymentMethod?: string;
}

export interface AppointmentResultNotificationPatient {
  appointmentId: number;
  diagnosis: string;
  doctorName: string;
  recipientId: string;
  isUpdate?: boolean;
}

export interface NotificationResponse {
  id: string;
  type: NotificationType;
  priority: NotificationPriority;
  status: NotificationStatus;
  title: string;
  message: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  readAt?: Date;
}
