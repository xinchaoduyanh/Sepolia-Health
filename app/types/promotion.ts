// Promotion types for mobile app

export interface Promotion {
  id: number;
  title: string;
  code: string;
  description?: string;
  discountPercent: number;
  maxDiscountAmount: number;
  validFrom: string;
  validTo: string;
}

export interface PromotionDisplay {
  backgroundColor: string;
  textColor: string;
  buttonColor: string;
  buttonTextColor: string;
  imageUrl?: string;
}

export interface FeaturedPromotionResponse {
  promotion: Promotion;
  display: PromotionDisplay;
}

export interface UserPromotion {
  id: number;
  promotion: Promotion;
  claimedAt: string;
  isUsed: boolean;
  usedAt?: string;
}

export interface ClaimPromotionResponse {
  success: boolean;
  message: string;
}
