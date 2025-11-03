import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/constants/api';
import { Facility, Service, DoctorAvailability } from '@/types/doctor';
import { CreateAppointmentRequest } from '@/types/appointment';

// Types - Matching Backend DTOs
export interface Billing {
  id: number;
  amount: number;
  status: 'PENDING' | 'PAID' | 'REFUNDED';
  paymentMethod: string | null;
  notes: string | null;
  createdAt: string;
}

export interface Appointment {
  id: number;
  date: string; // ISO datetime
  startTime: string;
  endTime: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'refunded';
  notes: string | null;
  patientProfile?: {
    id: number;
    firstName: string;
    lastName: string;
    phone: string | null;
  };
  patientName?: string;
  patientDob?: string;
  patientPhone?: string;
  patientGender?: string;
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
  };
  billing?: Billing;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateAppointmentRequest {
  date?: string; // ISO datetime
  status?: 'scheduled' | 'completed' | 'cancelled';
  paymentStatus?: 'pending' | 'paid' | 'refunded';
  notes?: string;
}

export interface AppointmentFilters {
  page?: number;
  limit?: number;
  status?: 'scheduled' | 'completed' | 'cancelled';
  paymentStatus?: 'pending' | 'paid' | 'refunded';
  doctorId?: number;
  patientId?: number;
  dateFrom?: string; // ISO datetime
  dateTo?: string; // ISO datetime
}

// API Functions
export const appointmentApi = {
  getAppointments: async (filters?: AppointmentFilters) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });
    }

    const response = await apiClient.get<{
      data: Appointment[];
      total: number;
      page: number;
      limit: number;
    }>(`${API_ENDPOINTS.APPOINTMENTS.BASE}?${params.toString()}`);
    return response.data;
  },

  getAppointment: async (id: number) => {
    const response = await apiClient.get<Appointment>(`${API_ENDPOINTS.APPOINTMENTS.BASE}/${id}`);
    return response.data;
  },

  createAppointment: async (data: CreateAppointmentRequest) => {
    const response = await apiClient.post<Appointment>(
      `${API_ENDPOINTS.APPOINTMENTS.BASE}/booking/create`,
      data
    );
    return response.data;
  },

  updateAppointment: async (id: number, data: UpdateAppointmentRequest) => {
    const response = await apiClient.put<Appointment>(
      `${API_ENDPOINTS.APPOINTMENTS.BASE}/${id}`,
      data
    );
    return response.data;
  },

  deleteAppointment: async (id: number) => {
    const response = await apiClient.delete<{ message: string }>(
      `${API_ENDPOINTS.APPOINTMENTS.BASE}/${id}`
    );
    return response.data;
  },

  getMyAppointments: async (filters?: AppointmentFilters) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });
    }

    const response = await apiClient.get<{
      data: Appointment[];
      total: number;
      page: number;
      limit: number;
    }>(`${API_ENDPOINTS.APPOINTMENTS.MY_APPOINTMENTS}?${params.toString()}`);
    return response.data;
  },

  getDoctorAppointments: async (filters?: AppointmentFilters) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });
    }

    const response = await apiClient.get<{
      data: Appointment[];
      total: number;
      page: number;
      limit: number;
    }>(`${API_ENDPOINTS.APPOINTMENTS.DOCTOR_APPOINTMENTS}?${params.toString()}`);
    return response.data;
  },

  getLocations: async () => {
    const response = await apiClient.get<{
      data: Facility[];
      total: number;
    }>(API_ENDPOINTS.APPOINTMENTS.LOCATIONS);
    return response.data;
  },

  getServices: async () => {
    const response = await apiClient.get<{
      data: Service[];
      total: number;
    }>(API_ENDPOINTS.APPOINTMENTS.SERVICES);
    return response.data;
  },

  getDoctorServices: async (locationId: number, serviceId: number) => {
    const response = await apiClient.get<{
      data: any[];
      total: number;
    }>(
      `${API_ENDPOINTS.APPOINTMENTS.DOCTOR_SERVICES}?locationId=${locationId}&serviceId=${serviceId}`
    );
    return response.data;
  },

  getAvailableDates: async (doctorServiceId: number, startDate: string, endDate: string) => {
    const response = await apiClient.get<{
      doctorId: number;
      doctorName: string;
      specialty: string;
      serviceName: string;
      serviceDuration: number;
      availableDates: {
        date: string;
        dayOfWeek: string;
        workingHours: {
          startTime: string;
          endTime: string;
        };
      }[];
    }>(
      `${API_ENDPOINTS.APPOINTMENTS.AVAILABLE_DATES}?doctorServiceId=${doctorServiceId}&startDate=${startDate}&endDate=${endDate}`
    );
    return response.data;
  },

  getDoctorAvailability: async (doctorServiceId: number, date: string) => {
    const response = await apiClient.get<DoctorAvailability>(
      `${API_ENDPOINTS.APPOINTMENTS.DOCTOR_AVAILABILITY}?doctorServiceId=${doctorServiceId}&date=${date}`
    );
    return response.data;
  },
};

// React Query Hooks
export const useAppointments = (filters?: AppointmentFilters) => {
  return useQuery({
    queryKey: ['appointments', 'list', filters],
    queryFn: () => appointmentApi.getAppointments(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useAppointment = (id: number) => {
  return useQuery({
    queryKey: ['appointments', 'detail', id],
    queryFn: () => appointmentApi.getAppointment(id),
    enabled: !!id,
  });
};

export const useCreateAppointment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: appointmentApi.createAppointment,
    onSuccess: () => {
      // Invalidate appointments list
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
    onError: (error) => {
      console.error('Create appointment error:', error);
    },
  });
};

export const useUpdateAppointment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateAppointmentRequest }) =>
      appointmentApi.updateAppointment(id, data),
    onSuccess: () => {
      // Invalidate appointments list
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
    onError: (error) => {
      console.error('Update appointment error:', error);
    },
  });
};

export const useDeleteAppointment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: appointmentApi.deleteAppointment,
    onSuccess: () => {
      // Invalidate appointments list
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
    onError: (error) => {
      console.error('Delete appointment error:', error);
    },
  });
};

export const useMyAppointments = (filters?: AppointmentFilters) => {
  return useQuery({
    queryKey: ['appointments', 'my', filters],
    queryFn: () => appointmentApi.getMyAppointments(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useDoctorAppointments = (filters?: AppointmentFilters) => {
  return useQuery({
    queryKey: ['appointments', 'doctor', filters],
    queryFn: () => appointmentApi.getDoctorAppointments(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useLocations = () => {
  return useQuery({
    queryKey: ['appointments', 'locations'],
    queryFn: appointmentApi.getLocations,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useServices = () => {
  return useQuery({
    queryKey: ['appointments', 'services'],
    queryFn: appointmentApi.getServices,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useDoctorServices = (locationId: number, serviceId: number) => {
  return useQuery({
    queryKey: ['appointments', 'doctor-services', locationId, serviceId],
    queryFn: () => appointmentApi.getDoctorServices(locationId, serviceId),
    enabled: !!locationId && !!serviceId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useAvailableDates = (doctorServiceId: number, startDate: string, endDate: string) => {
  return useQuery({
    queryKey: ['appointments', 'available-dates', doctorServiceId, startDate, endDate],
    queryFn: () => appointmentApi.getAvailableDates(doctorServiceId, startDate, endDate),
    enabled: !!doctorServiceId && !!startDate && !!endDate,
    staleTime: 5 * 60 * 1000, // 5 minutes (less frequently changes)
  });
};

export const useDoctorAvailability = (doctorServiceId: number, date: string) => {
  return useQuery({
    queryKey: ['appointments', 'doctor-availability', doctorServiceId, date],
    queryFn: () => appointmentApi.getDoctorAvailability(doctorServiceId, date),
    enabled: !!doctorServiceId && !!date,
    staleTime: 1 * 60 * 1000, // 1 minute (frequently changes)
  });
};

// Query Keys
export const appointmentKeys = {
  all: ['appointments'] as const,
  lists: () => [...appointmentKeys.all, 'list'] as const,
  list: (filters?: AppointmentFilters) => [...appointmentKeys.lists(), filters] as const,
  details: () => [...appointmentKeys.all, 'detail'] as const,
  detail: (id: number) => [...appointmentKeys.details(), id] as const,
  my: (filters?: AppointmentFilters) => [...appointmentKeys.all, 'my', filters] as const,
  doctor: (filters?: AppointmentFilters) => [...appointmentKeys.all, 'doctor', filters] as const,
} as const;
