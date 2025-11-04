import axios from 'axios';
import logger from '../utils/logger';

export interface SlackTokenResponse {
  ok: boolean;
  access_token: string;
  token_type: string;
  scope: string;
  bot_user_id?: string;
  app_id: string;
  team: {
    id: string;
    name: string;
  };
  enterprise?: {
    id: string;
    name: string;
  };
  authed_user: {
    id: string;
    scope: string;
    access_token: string;
    token_type: string;
  };
}

export interface SlackUserProfile {
  id: string;
  name: string;
  real_name: string;
  email?: string;
  image_24?: string;
  image_32?: string;
  image_48?: string;
  image_72?: string;
  image_192?: string;
  image_512?: string;
  team_id: string;
  is_admin?: boolean;
  is_owner?: boolean;
  is_primary_owner?: boolean;
  is_restricted?: boolean;
  is_ultra_restricted?: boolean;
  is_bot?: boolean;
  updated: number;
  profile: {
    title?: string;
    phone?: string;
    skype?: string;
    real_name?: string;
    real_name_normalized?: string;
    display_name?: string;
    display_name_normalized?: string;
    status_text?: string;
    status_emoji?: string;
    email?: string;
    image_24?: string;
    image_32?: string;
    image_48?: string;
    image_72?: string;
    image_192?: string;
    image_512?: string;
  };
}

export class SlackAuthService {
  private static readonly CLIENT_ID = process.env.SLACK_CLIENT_ID;
  private static readonly CLIENT_SECRET = process.env.SLACK_CLIENT_SECRET;
  private static readonly REDIRECT_URI = process.env.SLACK_REDIRECT_URI || 'http://localhost:5000/api/integrations/slack/callback';

  // Slack OAuth scopes
  private static readonly SCOPES = {
    basic: ['identify', 'users:read', 'users:read.email'],
    channels: ['channels:read', 'channels:history', 'channels:write'],
    messages: ['chat:write', 'im:read', 'im:write', 'mpim:read', 'mpim:write'],
    files: ['files:read', 'files:write'],
    teams: ['team:read', 'usergroups:read'],
    admin: ['admin']
  };

  /**
   * Get scopes for integration types
   */
  static getScopes(types: string[]): string[] {
    const scopes = new Set<string>();

    types.forEach(type => {
      const typeScopes = this.SCOPES[type as keyof typeof this.SCOPES];
      if (typeScopes) {
        typeScopes.forEach(scope => scopes.add(scope));
      }
    });

    return Array.from(scopes);
  }

  /**
   * Generate Slack OAuth authorization URL
   */
  static getAuthUrl(scopes: string[], userId: string): string {
    if (!this.CLIENT_ID) {
      throw new Error('Slack Client ID not configured');
    }

    const baseUrl = 'https://slack.com/oauth/v2/authorize';
    const params = new URLSearchParams({
      client_id: this.CLIENT_ID,
      scope: scopes.join(','),
      redirect_uri: this.REDIRECT_URI,
      state: userId,
      user_scope: 'identify,users:read,users:read.email'
    });

    return `${baseUrl}?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  static async exchangeCodeForTokens(code: string): Promise<SlackTokenResponse> {
    if (!this.CLIENT_ID || !this.CLIENT_SECRET) {
      throw new Error('Slack OAuth credentials not configured');
    }

    try {
      const response = await axios.post('https://slack.com/api/oauth.v2.access', {
        client_id: this.CLIENT_ID,
        client_secret: this.CLIENT_SECRET,
        code,
        redirect_uri: this.REDIRECT_URI
      }, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      if (!response.data.ok) {
        throw new Error(response.data.error || 'Token exchange failed');
      }

      return response.data;
    } catch (error: any) {
      logger.error('Slack token exchange error:', error.response?.data || error);
      throw new Error('Failed to exchange authorization code for tokens');
    }
  }

  /**
   * Get user profile from Slack API
   */
  static async getUserProfile(accessToken: string): Promise<SlackUserProfile> {
    try {
      const response = await axios.get('https://slack.com/api/users.profile.get', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.data.ok) {
        throw new Error(response.data.error || 'Failed to fetch user profile');
      }

      // Also get basic user info
      const userResponse = await axios.get('https://slack.com/api/users.info', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        params: {
          user: response.data.profile.id || 'me'
        }
      });

      return userResponse.data.ok ? userResponse.data.user : response.data.profile;
    } catch (error: any) {
      logger.error('Slack profile fetch error:', error.response?.data || error);
      throw new Error('Failed to fetch user profile from Slack API');
    }
  }

  /**
   * Test API connection
   */
  static async testConnection(accessToken: string): Promise<boolean> {
    try {
      const response = await axios.get('https://slack.com/api/auth.test', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data.ok === true;
    } catch (error: any) {
      logger.error('Slack connection test error:', error.response?.data || error);
      return false;
    }
  }

  /**
   * Revoke access token
   */
  static async revokeToken(accessToken: string): Promise<void> {
    try {
      await axios.post('https://slack.com/api/auth.revoke', {
        token: accessToken
      }, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
    } catch (error: any) {
      logger.error('Slack token revoke error:', error.response?.data || error);
      // Don't throw error as this is not critical
    }
  }
}

export default SlackAuthService;