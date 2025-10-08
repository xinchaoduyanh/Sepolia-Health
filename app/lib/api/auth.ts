import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/lib/config';
import type {
  LoginRequest,
  RegisterRequest,
  VerifyEmailRequest,
  CompleteRegisterRequest,
  RefreshTokenRequest,
  LoginResponse,
  RegisterResponse,
  VerifyEmailResponse,
  CompleteRegisterResponse,
  User,
} from '@/types/auth';

// Query Keys Factory (Đặt lên đầu để dễ sử dụng bên dưới)
export const authKeys = {
  all: ['auth'] as const,
  profile: () => [...authKeys.all, 'profile'] as const,
} as const;

// API Functions
export const authApi = {
  login: async (data: LoginRequest) => {
    const response = await apiClient.post<LoginResponse>(API_ENDPOINTS.AUTH.LOGIN, data);
    return response.data;
  },

  register: async (data: RegisterRequest) => {
    const response = await apiClient.post<RegisterResponse>(API_ENDPOINTS.AUTH.REGISTER, data);
    return response.data;
  },

  verifyEmail: async (data: VerifyEmailRequest) => {
    const response = await apiClient.post<VerifyEmailResponse>(
      API_ENDPOINTS.AUTH.VERIFY_EMAIL,
      data
    );
    return response.data;
  },

  completeRegister: async (data: CompleteRegisterRequest) => {
    const response = await apiClient.post<CompleteRegisterResponse>(
      API_ENDPOINTS.AUTH.COMPLETE_REGISTER,
      data
    );
    return response.data;
  },

  logout: async () => {
    const response = await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT);
    return response.data;
  },

  getProfile: async () => {
    const response = await apiClient.get<User>(API_ENDPOINTS.AUTH.PROFILE);
    return response.data;
  },

  refreshToken: async (data: RefreshTokenRequest) => {
    const response = await apiClient.post<LoginResponse>(API_ENDPOINTS.AUTH.REFRESH, data);
    return response.data;
  },
};

// React Query Hooks
export const useLogin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authApi.login,
    onSuccess: async (data) => {
      // Store token
      await apiClient.setToken(data.accessToken);

      // IMPROVEMENT: Dùng query key factory để đảm bảo tính nhất quán
      queryClient.invalidateQueries({ queryKey: authKeys.profile() });
    },
    onError: (error) => {
      console.error('Login error:', error);
    },
  });
};

export const useRegister = () => {
  return useMutation({
    mutationFn: authApi.register,
    onError: (error) => {
      console.error('Register error:', error);
    },
  });
};

export const useVerifyEmail = () => {
  return useMutation({
    mutationFn: authApi.verifyEmail,
    onError: (error) => {
      console.error('Verify email error:', error);
    },
  });
};

export const useCompleteRegister = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authApi.completeRegister,
    onSuccess: (data) => {
      // IMPROVEMENT: Dùng query key factory
      console.log('Registration complete for:', data.user.email);
      queryClient.invalidateQueries({ queryKey: authKeys.profile() });
    },
    onError: (error) => {
      console.error('Complete register error:', error);
    },
  });
};

export const useLogout = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authApi.logout,
    onSuccess: async () => {
      await apiClient.clearToken();

      // IMPROVEMENT: Thay vì queryClient.clear(), hãy cập nhật state một cách chính xác hơn
      // Set profile data về null để UI cập nhật ngay lập tức
      queryClient.setQueryData(authKeys.profile(), null);
      // Và/hoặc xóa các query liên quan đến auth
      queryClient.removeQueries({ queryKey: authKeys.all });
    },
    onError: (error) => {
      console.error('Logout error:', error);
    },
  });
};

export const useProfile = () => {
  // IMPROVEMENT: Chỉ fetch profile khi người dùng đã đăng nhập
  const isAuthenticated = apiClient.hasToken();

  return useQuery({
    // IMPROVEMENT: Dùng query key factory
    queryKey: authKeys.profile(),
    queryFn: authApi.getProfile,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
    // IMPROVEMENT: Chỉ chạy query này khi `isAuthenticated` là true
    enabled: isAuthenticated,
  });
};
