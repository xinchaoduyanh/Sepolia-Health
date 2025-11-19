// App terms types

export enum AppTermsType {
  USAGE_REGULATIONS = 'USAGE_REGULATIONS',
  DISPUTE_RESOLUTION = 'DISPUTE_RESOLUTION',
  PRIVACY_POLICY = 'PRIVACY_POLICY',
  APP_FAQ = 'APP_FAQ',
}

export interface AppTerms {
  id: number;
  type: AppTermsType;
  title: string;
  content: string;
  version: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AppTermsResponse {
  data: AppTerms[];
}
