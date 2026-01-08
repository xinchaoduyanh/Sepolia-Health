import { useAuthContext } from '@/contexts/AuthContext';

/**
 * Hook to use authentication context
 * This is now a simple wrapper around AuthContext to maintain backward compatibility
 * while ensuring global state synchronization across all components.
 */
export const useAuth = () => {
  return useAuthContext();
};
