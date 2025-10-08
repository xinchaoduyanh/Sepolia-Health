// Appointment Types
export interface Appointment {
  id: number;
  date: string; // ISO datetime
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
  paymentStatus: 'PENDING' | 'PAID' | 'REFUNDED';
  notes: string | null;
  patient: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
  };
  doctor: {
    id: number;
    specialty: string;
    user: {
      id: number;
      firstName: string;
      lastName: string;
    };
  };
  service: {
    id: number;
    name: string;
    price: number;
    duration: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateAppointmentRequest {
  doctorId: number;
  serviceId: number;
  date: string; // ISO datetime
  notes?: string;
  // Patient information (required for all appointments)
  patientName: string;
  patientDob: string; // ISO datetime
  patientPhone: string;
  patientGender: 'MALE' | 'FEMALE' | 'OTHER';
  clinicId?: number;
}

export interface UpdateAppointmentRequest {
  date?: string; // ISO datetime
  status?: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
  paymentStatus?: 'PENDING' | 'PAID' | 'REFUNDED';
  notes?: string;
}

export interface AppointmentFilters {
  page?: number;
  limit?: number;
  status?: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
  paymentStatus?: 'PENDING' | 'PAID' | 'REFUNDED';
  doctorId?: number;
  patientId?: number;
  dateFrom?: string; // ISO datetime
  dateTo?: string; // ISO datetime
}
