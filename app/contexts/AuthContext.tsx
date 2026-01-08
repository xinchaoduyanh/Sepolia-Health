import { apiClient } from '@/lib/api-client';
import {
  authKeys,
  useCompleteRegister,
  useLogin,
  useLogout,
  useProfile,
  useRegister,
  useVerifyEmail,
} from '@/lib/api/auth';
import type {
  CompleteRegisterRequest,
  CompleteRegisterResponse,
  LoginResponse,
  RegisterResponse,
  User,
  VerifyEmailResponse,
} from '@/types/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQueryClient } from '@tanstack/react-query';
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasToken: boolean;
  login: (email: string, password: string) => Promise<LoginResponse>;
  register: (email: string) => Promise<RegisterResponse>;
  verifyEmail: (email: string, otp: string) => Promise<VerifyEmailResponse>;
  completeRegister: (userData: CompleteRegisterRequest) => Promise<CompleteRegisterResponse>;
  logout: () => Promise<boolean>;
  refreshProfile: () => Promise<void>;
  checkAuthStatus: () => Promise<boolean>;
  clearAuth: () => Promise<void>;

  // Mutation states
  isLoggingIn: boolean;
  isRegistering: boolean;
  isVerifyingEmail: boolean;
  isCompletingRegister: boolean;
  isLoggingOut: boolean;

  // Errors
  loginError: any;
  registerError: any;
  verifyEmailError: any;
  completeRegisterError: any;
  logoutError: any;
  profileError: any;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient();

  const loginMutation = useLogin();
  const registerMutation = useRegister();
  const verifyEmailMutation = useVerifyEmail();
  const completeRegisterMutation = useCompleteRegister();
  const logoutMutation = useLogout();

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

  const user = profileQuery.data || cachedUser;
  const isAuthenticated = !!user && hasToken;
  const isLoading = isLoadingAuth || (hasToken && !cachedUser && profileQuery.isLoading);

  const clearAuth = useCallback(async () => {
    queryClient.cancelQueries();
    await AsyncStorage.removeItem('auth_token');
    await AsyncStorage.removeItem('refresh_token');
    await AsyncStorage.removeItem('user_data');
    await AsyncStorage.removeItem('user_deactive');
    await AsyncStorage.removeItem('payment_data');
    await apiClient.clearToken();
    setCachedUser(null);
    setHasToken(false);
    queryClient.clear();
  }, [queryClient]);

  const logout = useCallback(async () => {
    try {
      setHasToken(false);
      setCachedUser(null);
      setIsLoadingAuth(false);
      queryClient.cancelQueries({ queryKey: authKeys.profile() });

      await clearAuth();

      logoutMutation.mutateAsync().catch((err) => {
        console.log('Background logout mutation failed:', err);
      });

      return true;
    } catch (error) {
      setHasToken(false);
      setCachedUser(null);
      setIsLoadingAuth(false);
      queryClient.cancelQueries({ queryKey: authKeys.profile() });
      await clearAuth();
      throw error;
    }
  }, [logoutMutation, queryClient, clearAuth]);

  const login = async (email: string, password: string) => {
    try {
      const result = await loginMutation.mutateAsync({ email, password });
      // Update apiClient internal token state
      await apiClient.setToken(result.accessToken);

      await AsyncStorage.setItem('refresh_token', result.refreshToken);
      setHasToken(true);
      setIsLoadingAuth(false);
      queryClient.invalidateQueries({ queryKey: authKeys.profile() });
      return result;
    } catch (error) {
      throw error;
    }
  };

  const register = async (email: string) => {
    return await registerMutation.mutateAsync({ email });
  };

  const verifyEmail = async (email: string, otp: string) => {
    return await verifyEmailMutation.mutateAsync({ email, otp });
  };

  const completeRegister = async (userData: CompleteRegisterRequest) => {
    const result = await completeRegisterMutation.mutateAsync(userData);
    queryClient.invalidateQueries({ queryKey: authKeys.profile() });
    return result;
  };

  const refreshProfile = async () => {
    await queryClient.invalidateQueries({ queryKey: authKeys.profile() });
    await queryClient.refetchQueries({ queryKey: authKeys.profile() });
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

  const checkAuthStatus = async () => {
    try {
      if (apiClient.hasToken()) {
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

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    hasToken,
    login,
    register,
    verifyEmail,
    completeRegister,
    logout,
    refreshProfile,
    checkAuthStatus,
    clearAuth,
    isLoggingIn: loginMutation.isPending,
    isRegistering: registerMutation.isPending,
    isVerifyingEmail: verifyEmailMutation.isPending,
    isCompletingRegister: completeRegisterMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
    loginError: loginMutation.error,
    registerError: registerMutation.error,
    verifyEmailError: verifyEmailMutation.error,
    completeRegisterError: completeRegisterMutation.error,
    logoutError: logoutMutation.error,
    profileError: profileQuery.error,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};
