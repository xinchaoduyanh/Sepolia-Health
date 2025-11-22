import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/constants/api';
import {
  FeaturedPromotionResponse,
  UserPromotion,
  ClaimPromotionResponse,
} from '@/types/promotion';

// Query Keys
export const promotionKeys = {
  all: ['promotions'] as const,
  featured: () => [...promotionKeys.all, 'featured'] as const,
  myVouchers: () => [...promotionKeys.all, 'my-vouchers'] as const,
};

// API Functions
export const promotionApi = {
  // Get featured promotion (active display)
  getFeaturedPromotion: async (): Promise<FeaturedPromotionResponse | null> => {
    const response = await apiClient.get<FeaturedPromotionResponse | null>(
      API_ENDPOINTS.PROMOTIONS.FEATURED
    );
    return response.data;
  },

  // Get user's vouchers
  getMyVouchers: async (status?: 'available' | 'used' | 'expired'): Promise<UserPromotion[]> => {
    const params = status ? `?status=${status}` : '';
    const response = await apiClient.get<UserPromotion[]>(
      `${API_ENDPOINTS.PROMOTIONS.MY_VOUCHERS}${params}`
    );
    return response.data;
  },

  // Claim promotion
  claimPromotion: async (promotionId: number): Promise<ClaimPromotionResponse> => {
    const response = await apiClient.post<ClaimPromotionResponse>(
      API_ENDPOINTS.PROMOTIONS.CLAIM(promotionId)
    );
    return response.data;
  },
};

// React Query Hooks
export const useFeaturedPromotion = () => {
  return useQuery({
    queryKey: promotionKeys.featured(),
    queryFn: promotionApi.getFeaturedPromotion,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
};

export const useMyVouchers = (status?: 'available' | 'used' | 'expired') => {
  return useQuery({
    queryKey: [...promotionKeys.myVouchers(), status],
    queryFn: () => promotionApi.getMyVouchers(status),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
};

export const useClaimPromotion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: promotionApi.claimPromotion,
    onSuccess: () => {
      // Invalidate vouchers list after claiming
      queryClient.invalidateQueries({
        queryKey: promotionKeys.myVouchers(),
      });
    },
  });
};
