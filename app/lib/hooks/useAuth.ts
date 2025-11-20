import { useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useRef, useCallback } from 'react';
import { router } from 'expo-router';
import { Alert } from 'react-native';
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
import type { User, CompleteRegisterRequest } from '@/types/auth';

export const useAuth = () => {
  const queryClient = useQueryClient();

  const loginMutation = useLogin();
  const registerMutation = useRegister();
  const verifyEmailMutation = useVerifyEmail();
  const completeRegisterMutation = useCompleteRegister();
  const logoutMutation = useLogout();

  // Check if we have a token to determine if we should fetch profile
  const [hasToken, setHasToken] = useState(false);
  const [cachedUser, setCachedUser] = useState<User | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const hasCheckedDeactiveRef = useRef(false);

  // Load token and user data on mount
  useEffect(() => {
    const loadAuthData = async () => {
      try {
        const tokenExists = await apiClient.hasTokenAsync();
        setHasToken(tokenExists);

        // Load cached user data if available
        const userData = await AsyncStorage.getItem('user_data');
        if (userData) {
          const parsedUser = JSON.parse(userData);
          setCachedUser(parsedUser);
        }
      } catch (error) {
        console.log('Failed to load auth data:', error);
      } finally {
        setIsLoadingAuth(false);
      }
    };
    loadAuthData();
  }, []);

  const profileQuery = useProfile(hasToken && !cachedUser);

  // Ưu tiên cached user data, fallback về profileQuery data
  const user = profileQuery.data || cachedUser;
  const isAuthenticated = !!user && hasToken;
  const isLoading = isLoadingAuth || (hasToken && !cachedUser && profileQuery.isLoading);

  // Login function
  const login = async (email: string, password: string) => {
    try {
      const result = await loginMutation.mutateAsync({ email, password });

      // Store both tokens
      await AsyncStorage.setItem('auth_token', result.accessToken);
      await AsyncStorage.setItem('refresh_token', result.refreshToken);

      // Update hasToken state
      setHasToken(true);
      setIsLoadingAuth(false);

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
  const completeRegister = async (userData: CompleteRegisterRequest) => {
    try {
      const result = await completeRegisterMutation.mutateAsync(userData);

      // IMPROVEMENT: Dùng query key factory để đảm bảo tính nhất quán
      queryClient.invalidateQueries({ queryKey: authKeys.profile() });

      return result;
    } catch (error) {
      throw error;
    }
  };

  // Clear all auth data
  const clearAuth = useCallback(async () => {
    // Cancel all ongoing queries first
    queryClient.cancelQueries({ queryKey: authKeys.all });

    await AsyncStorage.removeItem('auth_token');
    await AsyncStorage.removeItem('refresh_token');
    await AsyncStorage.removeItem('user_data');

    // Clear token from apiClient memory
    await apiClient.clearToken();

    // Clear cached user data
    setCachedUser(null);

    // Set profile data về null để UI cập nhật ngay lập tức
    queryClient.setQueryData(authKeys.profile(), null);
    // Remove all auth-related queries
    queryClient.removeQueries({ queryKey: authKeys.all });
  }, [queryClient]);

  // Logout function
  const logout = useCallback(async () => {
    try {
      // Set hasToken to false FIRST to stop any ongoing profile queries
      setHasToken(false);
      setIsLoadingAuth(false);

      // Cancel any ongoing profile queries
      queryClient.cancelQueries({ queryKey: authKeys.profile() });

      await logoutMutation.mutateAsync();
      await clearAuth();

      // Auto redirect to login after logout
      router.replace('/(auth)/login');
      return true;
    } catch (error) {
      // Even if logout fails on server, clear local data
      setHasToken(false);
      setIsLoadingAuth(false);
      queryClient.cancelQueries({ queryKey: authKeys.profile() });
      await clearAuth();

      // Auto redirect to login after logout
      router.replace('/(auth)/login');
      throw error;
    }
  }, [logoutMutation, queryClient, clearAuth]);

  // Refresh profile function - improved to refetch immediately
  const refreshProfile = async () => {
    // IMPROVEMENT: Dùng query key factory và refetch ngay lập tức
    await queryClient.invalidateQueries({ queryKey: authKeys.profile() });
    await queryClient.refetchQueries({ queryKey: authKeys.profile() });

    // Also update cached user data in AsyncStorage
    try {
      const profileData = queryClient.getQueryData(authKeys.profile());
      if (profileData) {
        await AsyncStorage.setItem('user_data', JSON.stringify(profileData));
        setCachedUser(profileData as User);
      }
    } catch (error) {
      console.log('Failed to update cached user data:', error);
    }
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
    } catch {
      return false;
    }
  };

  // Check DEACTIVE status after profile is fetched
  useEffect(() => {
    const currentUser = profileQuery.data || cachedUser;

    // Only check if we have user data and haven't checked yet for this user
    if (currentUser && currentUser.status === 'DEACTIVE' && !hasCheckedDeactiveRef.current) {
      hasCheckedDeactiveRef.current = true;

      // Show alert and logout when user clicks OK
      Alert.alert(
        'Tài khoản bị khóa',
        'Tài khoản bạn bị khóa. Vui lòng liên hệ quản trị viên để được hỗ trợ.',
        [
          {
            text: 'Ok tôi hiểu',
            onPress: async () => {
              // Reset the ref so it can check again if user logs in again
              hasCheckedDeactiveRef.current = false;
              // Clear DEACTIVE flag
              await AsyncStorage.removeItem('user_deactive');
              // Logout and redirect to login
              await logout();
            },
          },
        ],
        { cancelable: false }
      );
    }

    // Reset the ref when user changes (e.g., after logout/login)
    if (!currentUser) {
      hasCheckedDeactiveRef.current = false;
    }
  }, [profileQuery.data, cachedUser, logout]);

  // Check for DEACTIVE flag from API errors
  useEffect(() => {
    const checkDeactiveFlag = async () => {
      try {
        const deactiveFlag = await AsyncStorage.getItem('user_deactive');
        if (deactiveFlag === 'true' && !hasCheckedDeactiveRef.current) {
          hasCheckedDeactiveRef.current = true;

          // Show alert and logout when user clicks OK
          Alert.alert(
            'Tài khoản bị khóa',
            'Tài khoản bạn bị khóa. Vui lòng liên hệ quản trị viên để được hỗ trợ.',
            [
              {
                text: 'Ok tôi hiểu',
                onPress: async () => {
                  // Reset the ref so it can check again if user logs in again
                  hasCheckedDeactiveRef.current = false;
                  // Clear DEACTIVE flag
                  await AsyncStorage.removeItem('user_deactive');
                  // Logout and redirect to login
                  await logout();
                },
              },
            ],
            { cancelable: false }
          );
        }
      } catch (error) {
        console.log('Failed to check DEACTIVE flag:', error);
      }
    };

    // Check immediately and then periodically
    checkDeactiveFlag();
    const interval = setInterval(checkDeactiveFlag, 2000); // Check every 2 seconds

    return () => clearInterval(interval);
  }, [logout]);

  // Auto redirect on logout - removed to prevent navigation before mount

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
