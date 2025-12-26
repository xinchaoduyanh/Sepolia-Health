// Appointment Types
export type AppointmentStatus = 'UPCOMING' | 'ON_GOING' | 'COMPLETED' | 'CANCELLED';
export type PaymentStatus = 'PENDING' | 'PAID' | 'REFUNDED';
export type AppointmentType = 'ONLINE' | 'OFFLINE';
// Billing information for appointments
export interface Billing {
  id: number;
  amount: number;
  status: PaymentStatus;
  paymentMethod?: string | null;
  notes?: string | null;
  createdAt: string;
}

// Feedback information for appointments
export interface Feedback {
  id: number;
  rating: number;
  comment?: string | null;
  createdAt: string;
}

// File attachment for appointment result
export interface AppointmentResultFile {
  id: number;
  fileUrl: string;
  fileType: string; // MIME type: image/jpeg, image/png, application/pdf
  fileName: string;
  fileSize: number; // in bytes
  createdAt: string;
}

// Appointment Result from doctor
export interface AppointmentResult {
  id: number;
  diagnosis?: string | null;
  notes?: string | null;
  prescription?: string | null;
  recommendations?: string | null;
  files?: AppointmentResultFile[]; // File attachments
  appointmentId: number;
  createdAt: string;
  updatedAt: string;
}

// Main Appointment interface matching backend response
export interface Appointment {
  id: number;
  startTime: string; // ISO datetime
  status: AppointmentStatus;
  notes: string | null;
  patient?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string | null;
    dateOfBirth?: string | null;
    gender?: string | null;
    relationship?: string | null;
  };
  // Alias for backward compatibility
  patientProfile?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string | null;
    dateOfBirth?: string | null;
    gender?: string | null;
    relationship?: string | null;
  };
  doctor: {
    id: number;
    firstName: string;
    lastName: string;
  };
  service: {
    id: number;
    name: string;
    price: number;
    duration: number;
    specialty?: {
      id: number;
      name: string;
      description?: string;
      icon?: string;
    };
  };
  clinic?: {
    id: number;
    name: string;
  } | null;
  doctorServiceId?: number;
  billing?: Billing | null;
  feedback?: Feedback | null;
  result?: AppointmentResult | null;
  type?: AppointmentType; // ONLINE or OFFLINE
  joinUrl?: string | null; // Zoom meeting link for patient (online appointments)
  createdAt: string;
  updatedAt: string;
}

// Request to create a new appointment
export interface CreateAppointmentRequest {
  doctorServiceId: number;
  patientProfileId: number;
  startTime: string; // ISO datetime
  endTime: string; // ISO datetime
  notes?: string;
  type?: AppointmentType; // ONLINE or OFFLINE (defaults to OFFLINE)
}

// Request to update an existing appointment
export interface UpdateAppointmentRequest {
  startTime: string; // ISO datetime
  endTime: string; // ISO datetime
  notes?: string;
}

// Filters for querying appointments
export interface AppointmentFilters {
  page?: number;
  limit?: number;
  status?: AppointmentStatus;
  billingStatus?: PaymentStatus;
  doctorId?: number;
  patientId?: number;
  patientProfileId?: number;
  dateFrom?: string; // ISO datetime
  dateTo?: string; // ISO datetime
  sortBy?: 'date' | 'status' | 'billingStatus';
  sortOrder?: 'asc' | 'desc';
}

// Request to create feedback
export interface CreateFeedbackRequest {
  rating: number; // 1-5
  comment?: string;
}
