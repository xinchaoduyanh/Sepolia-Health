import { useQueryClient } from '@tanstack/react-query';
import {
  useLogin,
  useRegister,
  useVerifyEmail,
  useCompleteRegister,
  useLogout,
  useProfile,
  authKeys,
} from '@/lib/api/auth';
import { apiClient } from '@/lib/api-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useAuth = () => {
  const queryClient = useQueryClient();

  const loginMutation = useLogin();
  const registerMutation = useRegister();
  const verifyEmailMutation = useVerifyEmail();
  const completeRegisterMutation = useCompleteRegister();
  const logoutMutation = useLogout();
  const profileQuery = useProfile();

  const isAuthenticated = !!profileQuery.data;
  const isLoading = profileQuery.isLoading;
  const user = profileQuery.data;

  // Login function
  const login = async (email: string, password: string) => {
    try {
      const result = await loginMutation.mutateAsync({ email, password });

      // Store both tokens
      await AsyncStorage.setItem('auth_token', result.accessToken);
      await AsyncStorage.setItem('refresh_token', result.refreshToken);

      // IMPROVEMENT: Dùng query key factory để đảm bảo tính nhất quán
      queryClient.invalidateQueries({ queryKey: authKeys.profile() });

      return result;
    } catch (error) {
      throw error;
    }
  };

  // Register function - Step 1: Send email
  const register = async (email: string) => {
    try {
      const result = await registerMutation.mutateAsync({ email });
      return result;
    } catch (error) {
      throw error;
    }
  };

  // Verify email function - Step 2: Verify OTP
  const verifyEmail = async (email: string, otp: string) => {
    try {
      const result = await verifyEmailMutation.mutateAsync({ email, otp });
      return result;
    } catch (error) {
      throw error;
    }
  };

  // Complete register function - Step 3: Complete registration
  const completeRegister = async (userData: {
    email: string;
    otp: string;
    firstName: string;
    lastName: string;
    phone: string;
    password: string;
    role?: 'PATIENT' | 'DOCTOR' | 'ADMIN';
  }) => {
    try {
      const result = await completeRegisterMutation.mutateAsync(userData);

      // IMPROVEMENT: Dùng query key factory để đảm bảo tính nhất quán
      queryClient.invalidateQueries({ queryKey: authKeys.profile() });

      return result;
    } catch (error) {
      throw error;
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await logoutMutation.mutateAsync();
      return true;
    } catch (error) {
      // Even if logout fails on server, clear local data
      await clearAuth();
      throw error;
    }
  };

  // Refresh profile function
  const refreshProfile = () => {
    // IMPROVEMENT: Dùng query key factory
    queryClient.invalidateQueries({ queryKey: authKeys.profile() });
  };

  // Check if user has valid tokens
  const checkAuthStatus = async () => {
    try {
      // IMPROVEMENT: Sử dụng apiClient.hasToken() thay vì kiểm tra AsyncStorage
      if (apiClient.hasToken()) {
        // Try to fetch profile to validate token
        await queryClient.fetchQuery({
          queryKey: authKeys.profile(),
          queryFn: () => profileQuery.refetch(),
        });
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  };

  // Clear all auth data
  const clearAuth = async () => {
    await AsyncStorage.removeItem('auth_token');
    await AsyncStorage.removeItem('refresh_token');

    // IMPROVEMENT: Thay vì queryClient.clear(), hãy cập nhật state một cách chính xác hơn
    // Set profile data về null để UI cập nhật ngay lập tức
    queryClient.setQueryData(authKeys.profile(), null);
    // Và/hoặc xóa các query liên quan đến auth
    queryClient.removeQueries({ queryKey: authKeys.all });
  };

  return {
    // State
    isAuthenticated,
    isLoading,
    user,

    // Actions
    login,
    register,
    verifyEmail,
    completeRegister,
    logout,
    refreshProfile,
    checkAuthStatus,
    clearAuth,

    // Mutation states
    isLoggingIn: loginMutation.isPending,
    isRegistering: registerMutation.isPending,
    isVerifyingEmail: verifyEmailMutation.isPending,
    isCompletingRegister: completeRegisterMutation.isPending,
    isLoggingOut: logoutMutation.isPending,

    // Errors
    loginError: loginMutation.error,
    registerError: registerMutation.error,
    verifyEmailError: verifyEmailMutation.error,
    completeRegisterError: completeRegisterMutation.error,
    logoutError: logoutMutation.error,
    profileError: profileQuery.error,
  };
};
