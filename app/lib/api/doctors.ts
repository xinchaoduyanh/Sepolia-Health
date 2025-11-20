import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/lib/config';
import {
  Service,
  Doctor,
  Timeslot,
  ServiceFilters,
} from '@/types/doctor';

// API Functions
export const doctorApi = {
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
