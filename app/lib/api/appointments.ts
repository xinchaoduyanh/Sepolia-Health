import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/lib/config';

// Types - Matching Backend DTOs
export interface Appointment {
  id: number;
  date: string; // ISO datetime
  status: 'scheduled' | 'completed' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'refunded';
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
    const response = await apiClient.post<Appointment>(API_ENDPOINTS.APPOINTMENTS.BASE, data);
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
