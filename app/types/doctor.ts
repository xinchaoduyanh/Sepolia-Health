// Doctor Types
export interface Service {
  id: number;
  name: string;
  description?: string;
  price: number;
  duration: number;
  createdAt: string;
  updatedAt: string;
}

export interface Facility {
  id: number;
  name: string;
  address: string;
  phone?: string;
  email?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Doctor {
  id: number;
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  avatar?: string;
  specialty: string;
  experience?: string;
  contactInfo?: string;
  userId: number;
  clinicId?: number;
  clinic?: {
    id: number;
    name: string;
    address: string;
  };
  createdAt: string;
  updatedAt: string;
}

// DoctorProfile is now exported from auth.ts to avoid duplication

export interface Timeslot {
  id: number;
  doctorId: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  morningSlot: number;
  afternoonSlot: number;
}

export interface DoctorFilters {
  page?: number;
  limit?: number;
  serviceId?: number;
}

export interface ServiceFilters {
  page?: number;
  limit?: number;
}

export interface DoctorAvailability {
  doctorId: number;
  doctorName: string;
  specialty: string;
  serviceName: string;
  serviceDuration: number;
  date: string;
  workingHours: {
    startTime: string;
    endTime: string;
  };
  bookedAppointments: {
    startTime: string;
    endTime: string;
    patientName: string;
    status: string;
  }[];
}

export interface TimeSlot {
  time: string;
  displayTime: string;
  isAvailable: boolean;
  isMorning: boolean;
}
