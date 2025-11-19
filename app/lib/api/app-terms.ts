import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { AppTermsType, AppTerms, AppTermsResponse } from '@/types/app-terms';

class AppTermsApi {
  /**
   * Get all active app terms
   * GET /app-terms
   */
  async getAllActiveTerms(): Promise<AppTerms[]> {
    const response = await apiClient.get<AppTermsResponse>('/app-terms');
    // BE wraps response in { data, message, statusCode }
    if (response && response.data && Array.isArray(response.data)) {
      return response.data;
    }
    // Fallback: if response is already an array
    if (Array.isArray(response)) {
      return response;
    }
    return [];
  }

  /**
   * Get app terms by type (active version)
   * GET /app-terms/:type
   */
  async getTermsByType(type: AppTermsType): Promise<AppTerms> {
    const response = await apiClient.get<AppTerms>(`/app-terms/${type}`);
    // BE wraps response in { data, message, statusCode }
    if (response && response.data) {
      return response.data;
    }
    // Fallback: if response is already the object
    return response as unknown as AppTerms;
  }
}

export const appTermsApi = new AppTermsApi();

// Query keys
export const appTermsKeys = {
  all: ['app-terms'] as const,
  lists: () => [...appTermsKeys.all, 'list'] as const,
  list: () => [...appTermsKeys.lists()] as const,
  details: () => [...appTermsKeys.all, 'detail'] as const,
  detail: (type: AppTermsType) => [...appTermsKeys.details(), type] as const,
};

/**
 * Hook to get all active app terms
 */
export function useAppTerms() {
  return useQuery({
    queryKey: appTermsKeys.list(),
    queryFn: () => appTermsApi.getAllActiveTerms(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to get app terms by type
 */
export function useAppTermsByType(type: AppTermsType) {
  return useQuery({
    queryKey: appTermsKeys.detail(type),
    queryFn: () => appTermsApi.getTermsByType(type),
    enabled: !!type,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to prefetch all app terms in the background
 * This runs silently without blocking UI
 */
export function usePrefetchAppTerms() {
  const queryClient = useQueryClient();

  // Prefetch all app terms types in the background after a delay
  // This ensures it doesn't block initial app load
  React.useEffect(() => {
    // Delay prefetch to not interfere with initial app load
    const timeoutId = setTimeout(() => {
      // Prefetch all app terms types in parallel
      const prefetchPromises = Object.values(AppTermsType).map((type) =>
        queryClient
          .prefetchQuery({
            queryKey: appTermsKeys.detail(type),
            queryFn: () => appTermsApi.getTermsByType(type),
            staleTime: 5 * 60 * 1000, // 5 minutes
          })
          .catch((error) => {
            // Silently fail - don't show errors for background prefetch
            console.log(`Failed to prefetch app terms for ${type}:`, error);
          })
      );

      // Don't await - let it run in background
      Promise.all(prefetchPromises).catch(() => {
        // Silently handle any errors
      });
    }, 2000); // Wait 2 seconds after app load to start prefetching

    return () => {
      clearTimeout(timeoutId);
    };
  }, [queryClient]);
}
