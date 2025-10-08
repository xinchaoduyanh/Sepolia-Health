import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/lib/config';

// Types - Matching Backend DTOs
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

// API Functions
export const doctorApi = {
  getServices: async (filters?: ServiceFilters) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });
    }

    const response = await apiClient.get<{
      data: Service[];
      total: number;
      page: number;
      limit: number;
    }>(`${API_ENDPOINTS.DOCTORS.SERVICES}?${params.toString()}`);
    return response.data;
  },

  getDoctorsByService: async (serviceId: number) => {
    const response = await apiClient.get<Doctor[]>(
      `${API_ENDPOINTS.DOCTORS.BY_SERVICE}?serviceId=${serviceId}`
    );
    return response.data;
  },

  getDoctorTimeslots: async (doctorId: number) => {
    const response = await apiClient.get<Timeslot[]>(
      `${API_ENDPOINTS.DOCTORS.TIMESLOTS}/${doctorId}`
    );
    return response.data;
  },
};

// React Query Hooks
export const useServices = (filters?: ServiceFilters) => {
  return useQuery({
    queryKey: ['services', 'list', filters],
    queryFn: () => doctorApi.getServices(filters),
    staleTime: 30 * 60 * 1000, // 30 minutes (rarely changes)
  });
};

export const useDoctorsByService = (serviceId: number) => {
  return useQuery({
    queryKey: ['doctors', 'by-service', serviceId],
    queryFn: () => doctorApi.getDoctorsByService(serviceId),
    enabled: !!serviceId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useDoctorTimeslots = (doctorId: number) => {
  return useQuery({
    queryKey: ['doctors', 'timeslots', doctorId],
    queryFn: () => doctorApi.getDoctorTimeslots(doctorId),
    enabled: !!doctorId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Query Keys
export const doctorKeys = {
  all: ['doctors'] as const,
  byService: (serviceId: number) => [...doctorKeys.all, 'by-service', serviceId] as const,
  timeslots: (doctorId: number) => [...doctorKeys.all, 'timeslots', doctorId] as const,
} as const;

export const serviceKeys = {
  all: ['services'] as const,
  lists: () => [...serviceKeys.all, 'list'] as const,
  list: (filters?: ServiceFilters) => [...serviceKeys.lists(), filters] as const,
} as const;
