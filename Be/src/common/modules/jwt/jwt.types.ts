export interface JwtTokens {
  accessToken: string;
  refreshToken: string;
}

export interface TokenPayload {
  userId: number;
  role: string;
  exp: number;
  iat: number;
}

export interface GenerateTokenOptions {
  userId: number;
  role: string;
  type?: 'access' | 'refresh';
}

export interface VerifyTokenResult {
  valid: boolean;
  payload?: TokenPayload;
  error?: string;
}
