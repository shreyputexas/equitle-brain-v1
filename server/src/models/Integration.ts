export interface Integration {
  id: string;
  userId: string;
  provider: 'google';
  type: 'drive' | 'calendar' | 'profile';
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  scope: string[];
  profile: {
    email: string;
    name: string;
    picture?: string;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface GoogleTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
}