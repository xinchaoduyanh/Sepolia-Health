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
  specialty: string;
  experience?: string;
  contactInfo?: string;
  workingHours?: string;
  userId: number;
  user: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface DoctorProfile {
  id: number;
  specialty: string;
  experience?: string;
  contactInfo?: string;
  workingHours?: string;
  userId: number;
  createdAt: string;
  updatedAt: string;
}

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
