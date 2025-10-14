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
