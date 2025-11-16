import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/lib/config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  ChangePasswordRequest,
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
  ForgotPasswordRequest,
  VerifyForgotPasswordOtpRequest,
  ResetPasswordRequest,
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
    // Get refresh token from storage
    const refreshToken = await AsyncStorage.getItem('refresh_token');

    const response = await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT, {
      refreshToken: refreshToken || '',
    });
    return response.data;
  },

  getProfile: async () => {
    const response = await apiClient.get<User>(API_ENDPOINTS.AUTH.PROFILE);
    const userData = response.data;

    // Lưu user data vào AsyncStorage
    await AsyncStorage.setItem('user_data', JSON.stringify(userData));

    return userData;
  },

  refreshToken: async (data: RefreshTokenRequest) => {
    const response = await apiClient.post<LoginResponse>(API_ENDPOINTS.AUTH.REFRESH, data);
    return response.data;
  },

  forgotPassword: async (data: ForgotPasswordRequest) => {
    const response = await apiClient.post(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, data);
    return response.data;
  },

  verifyForgotPasswordOtp: async (data: VerifyForgotPasswordOtpRequest) => {
    const response = await apiClient.post(API_ENDPOINTS.AUTH.VERIFY_FORGOT_PASSWORD_OTP, data);
    return response.data;
  },

  resetPassword: async (data: ResetPasswordRequest) => {
    const response = await apiClient.post(API_ENDPOINTS.AUTH.RESET_PASSWORD, data);
    return response.data;
  },

  changePassword: async (data: ChangePasswordRequest) => {
    const response = await apiClient.post(API_ENDPOINTS.AUTH.CHANGE_PASSWORD, data);
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
      // Error is handled by UI
    },
  });
};

export const useRegister = () => {
  return useMutation({
    mutationFn: authApi.register,
    onError: (error) => {
      // Error is handled by UI
    },
  });
};

export const useVerifyEmail = () => {
  return useMutation({
    mutationFn: authApi.verifyEmail,
    onError: (error) => {
      // Error is handled by UI
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
      // Error is handled by UI
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
      // Error is handled by UI
    },
  });
};

export const useProfile = (enabled: boolean = false) => {
  return useQuery({
    // IMPROVEMENT: Dùng query key factory
    queryKey: authKeys.profile(),
    queryFn: authApi.getProfile,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: enabled ? 1 : false, // Don't retry when disabled
    // Only run when enabled
    enabled,
  });
};

export const useForgotPassword = () => {
  return useMutation({
    mutationFn: authApi.forgotPassword,
    onError: (error) => {
      // Error is handled by UI
    },
  });
};

export const useVerifyForgotPasswordOtp = () => {
  return useMutation({
    mutationFn: authApi.verifyForgotPasswordOtp,
    onError: (error) => {
      // Error is handled by UI
    },
  });
};

export const useResetPassword = () => {
  return useMutation({
    mutationFn: authApi.resetPassword,
    onError: (error) => {
      // Error is handled by UI
    },
  });
};

export const useChangePassword = () => {
  return useMutation({
    mutationFn: authApi.changePassword,
    onError: (error) => {
      // Error is handled by UI
    },
  });
};
