// Appointment Types
export interface Appointment {
  id: number;
  date: string; // ISO date
  startTime: string;
  endTime: string;
  status: 'UPCOMING' | 'ON_GOING' | 'COMPLETED' | 'CANCELLED';
  paymentStatus: 'PENDING' | 'PAID' | 'REFUNDED';
  notes?: string;
  patientProfileId?: number;
  patientProfile?: {
    id: number;
    firstName: string;
    lastName: string;
    phone: string;
    relationship: string;
  };
  patientName: string;
  patientDob: string;
  patientPhone: string;
  patientGender: string;
  doctorId: number;
  doctor: {
    id: number;
    firstName: string;
    lastName: string;
    specialty: string;
    user: {
      id: number;
      firstName: string;
      lastName: string;
    };
  };
  serviceId: number;
  service: {
    id: number;
    name: string;
    price: number;
    duration: number;
  };
  clinicId?: number;
  clinic?: {
    id: number;
    name: string;
  };
  billing?: {
    id: number;
    amount: number;
    status: 'PENDING' | 'PAID' | 'REFUNDED';
    paymentMethod?: 'CASH' | 'BANK_TRANSFER' | 'CARD' | 'ONLINE';
    notes?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateAppointmentRequest {
  doctorServiceId: number;
  date: string; // ISO date
  startTime: string;
  notes?: string;
  // Patient information (required for all appointments)
  patientName: string;
  patientDob: string; // ISO date
  patientPhone: string;
  patientGender: 'MALE' | 'FEMALE' | 'OTHER';
  clinicId: number;
  patientProfileId?: number; // Optional if patient has profile
}

export interface UpdateAppointmentRequest {
  date?: string; // ISO date
  startTime?: string;
  endTime?: string;
  status?: 'UPCOMING' | 'ON_GOING' | 'COMPLETED' | 'CANCELLED';
  paymentStatus?: 'PENDING' | 'PAID' | 'REFUNDED';
  notes?: string;
}

export interface AppointmentFilters {
  page?: number;
  limit?: number;
  status?: 'UPCOMING' | 'ON_GOING' | 'COMPLETED' | 'CANCELLED';
  paymentStatus?: 'PENDING' | 'PAID' | 'REFUNDED';
  doctorId?: number;
  patientProfileId?: number;
  dateFrom?: string; // ISO date
  dateTo?: string; // ISO date
}
