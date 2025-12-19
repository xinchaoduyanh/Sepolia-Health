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

  // Enhanced Appointment Notifications
  APPOINTMENT_REMINDER_PATIENT = 'APPOINTMENT_REMINDER_PATIENT',      // 24h before
  APPOINTMENT_REMINDER_DOCTOR = 'APPOINTMENT_REMINDER_DOCTOR',       // 24h before
  APPOINTMENT_REMINDER_RECEPTIONIST = 'APPOINTMENT_REMINDER_RECEPTIONIST',
  APPOINTMENT_CONFIRMED_RECEPTIONIST = 'APPOINTMENT_CONFIRMED_RECEPTIONIST',
  APPOINTMENT_CANCELLED_RECEPTIONIST = 'APPOINTMENT_CANCELLED_RECEPTIONIST',
  APPOINTMENT_RESCHEDULED_PATIENT = 'APPOINTMENT_RESCHEDULED_PATIENT',
  APPOINTMENT_RESCHEDULED_DOCTOR = 'APPOINTMENT_RESCHEDULED_DOCTOR',
  APPOINTMENT_RESCHEDULED_RECEPTIONIST = 'APPOINTMENT_RESCHEDULED_RECEPTIONIST',
  APPOINTMENT_STATUS_CHANGE = 'APPOINTMENT_STATUS_CHANGE',

  // NEW - Appointment Result Notifications (for daily scanner)
  APPOINTMENT_RESULT_PENDING = 'APPOINTMENT_RESULT_PENDING',         // Daily reminder for doctors
  APPOINTMENT_RESULT_AVAILABLE = 'APPOINTMENT_RESULT_AVAILABLE',     // Result completed notification

  // Receptionist Notifications
  NEW_PATIENT_REGISTRATION = 'NEW_PATIENT_REGISTRATION',
  APPOINTMENT_PAYMENT_PENDING = 'APPOINTMENT_PAYMENT_PENDING',
  APPOINTMENT_PAYMENT_COMPLETED = 'APPOINTMENT_PAYMENT_COMPLETED',
  EMERGENCY_APPOINTMENT_REQUEST = 'EMERGENCY_APPOINTMENT_REQUEST',

  // Payment Notifications
  PAYMENT_SUCCESS = 'PAYMENT_SUCCESS',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  PAYMENT_INITIATED = 'PAYMENT_INITIATED',
  REFUND_PROCESSED = 'REFUND_PROCESSED',

  // Admin System Notifications
  SYSTEM_MAINTENANCE_SCHEDULED = 'SYSTEM_MAINTENANCE_SCHEDULED',
  SYSTEM_MAINTENANCE_COMPLETED = 'SYSTEM_MAINTENANCE_COMPLETED',
  NEW_DOCTOR_VERIFICATION_REQUEST = 'NEW_DOCTOR_VERIFICATION_REQUEST',
  CLINIC_CAPACITY_ALERT = 'CLINIC_CAPACITY_ALERT',

  // Admin Broadcast Notifications
  ADMIN_BROADCAST = 'ADMIN_BROADCAST',
  ADMIN_ANNOUNCEMENT = 'ADMIN_ANNOUNCEMENT',
  PROMOTION_NOTIFICATION = 'PROMOTION_NOTIFICATION',
  SERVICE_UPDATE = 'SERVICE_UPDATE',
  POLICY_CHANGE = 'POLICY_CHANGE',

  // Real-time Status Updates
  PAYMENT_STATUS_CHANGE = 'PAYMENT_STATUS_CHANGE',
  DOCTOR_AVAILABILITY_CHANGE = 'DOCTOR_AVAILABILITY_CHANGE',
  CLINIC_STATUS_CHANGE = 'CLINIC_STATUS_CHANGE',

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

// Enhanced notification interfaces for comprehensive system
export interface AdminDirectNotificationDTO {
  recipientId?: number;
  recipientRole?: Role;
  recipientIds?: number[];
  title: string;
  message: string;
  type: NotificationType;
  priority: NotificationPriority;
  scheduledFor?: Date;
  metadata?: Record<string, any>;
}

export interface AdminBroadcastDTO {
  title: string;
  message: string;
  targetRoles: Role[];
  targetUsers?: number[];
  targetClinics?: number[];
  scheduledFor?: Date;
  priority: NotificationPriority;
  templateId?: string;
}

export interface NotificationTemplate {
  id: string;
  name: string;
  type: NotificationType;
  title: string;
  message: string;
  variables: string[]; // Array of variable names like ["patientName", "appointmentDate"]
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTemplateDTO {
  name: string;
  type: NotificationType;
  title: string;
  message: string;
  createdBy: string;
}

export interface UpdateTemplateDTO {
  name?: string;
  title?: string;
  message?: string;
  isActive?: boolean;
  updatedBy?: string;
}

export interface EnhancedStreamMessage {
  id: string;
  text: string;
  type: NotificationType;
  priority: NotificationPriority;
  status: NotificationStatus;

  // Enhanced metadata
  metadata: {
    // Basic notification data
    title: string;
    recipientId: string;
    senderId?: string;

    // Targeting information
    targetType: 'individual' | 'role' | 'clinic' | 'broadcast';
    targetRoles?: Role[];
    targetClinicIds?: number[];
    targetUserIds?: number[];

    // Template information
    templateId?: string;
    templateVariables?: Record<string, any>;

    // Campaign information
    campaignId?: string;
    campaignName?: string;

    // Scheduling
    scheduledFor?: string;
    sentAt?: string;
    readAt?: string;

    // Business data
    appointmentId?: number;
    paymentId?: number;
    billingId?: number;
    doctorId?: number;
    patientId?: number;
    clinicId?: number;

    // Tracking
    deliveryAttempts?: number;
    deliveryStatus?: 'pending' | 'sent' | 'delivered' | 'failed';
    readReceipt?: boolean;

    // Original business data
    businessData?: Record<string, any>;
  };

  created_at: string;
  updated_at: string;
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

// Import Role from common types
import { Role } from '@prisma/client';
