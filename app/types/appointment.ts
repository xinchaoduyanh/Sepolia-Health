// Appointment Types
export type AppointmentStatus = 'UPCOMING' | 'ON_GOING' | 'COMPLETED' | 'CANCELLED';
export type PaymentStatus = 'PENDING' | 'PAID' | 'REFUNDED';
// Billing information for appointments
export interface Billing {
  id: number;
  amount: number;
  status: PaymentStatus;
  paymentMethod?: string | null;
  notes?: string | null;
  createdAt: string;
}

// Main Appointment interface matching backend response
export interface Appointment {
  id: number;
  startTime: string; // ISO datetime
  status: AppointmentStatus;
  notes: string | null;
  patientProfile?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
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
  };
  clinic?: {
    id: number;
    name: string;
  } | null;
  doctorServiceId?: number;
  billing?: Billing | null;
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
