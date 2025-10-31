export interface Integration {
  id: string;
  userId: string;
  provider: 'google' | 'microsoft' | 'slack' | 'salesforce' | 'zoom' | 'apollo';
  type: 'drive' | 'calendar' | 'profile' | 'gmail' | 'mail' | 'teams' | 'workspace' | 'crm' | 'video' | 'apollo';
  accessToken: string;
  refreshToken: string | undefined;
  expiresAt: Date | undefined;
  scope: string[];
  profile: {
    email: string;
    name: string;
    picture?: string;
    id?: string;
    instance_url?: string;
    username?: string;
    pmi?: string;
    team_id?: string;
    team_name?: string;
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