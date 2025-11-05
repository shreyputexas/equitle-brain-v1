// @ts-nocheck
import axios from 'axios';
import logger from '../utils/logger';

export interface SalesforceTokenResponse {
  access_token: string;
  refresh_token?: string;
  signature: string;
  scope: string;
  id_token?: string;
  instance_url: string;
  id: string;
  token_type: string;
  issued_at: string;
}

export interface SalesforceUserInfo {
  id: string;
  email: string;
  name: string;
  given_name: string;
  family_name: string;
  picture?: string;
  locale: string;
  timezone: string;
  organization_id: string;
  username: string;
  nick_name: string;
  display_name: string;
  email_verified: boolean;
  mobile_phone?: string;
  mobile_phone_verified?: boolean;
  is_lightning_login_user: boolean;
  status: {
    created_date: string;
    body: string;
  };
  photos: {
    picture: string;
    thumbnail: string;
  };
  addresses: {
    country: string;
    state: string;
    city: string;
  };
  user_id: string;
  user_type: string;
  language: string;
  last_modified_date: string;
  is_app_installed: boolean;
  urls: {
    enterprise: string;
    metadata: string;
    partner: string;
    rest: string;
    sobjects: string;
    search: string;
    query: string;
    recent: string;
    profile: string;
    feeds: string;
    groups: string;
    users: string;
    feedback: string;
    logout: string;
    approvals: string;
    tooling_soap: string;
    tooling_rest: string;
    custom_domain?: string;
  };
}

export class SalesforceAuthService {
  private static readonly CLIENT_ID = process.env.SALESFORCE_CLIENT_ID;
  private static readonly CLIENT_SECRET = process.env.SALESFORCE_CLIENT_SECRET;
  private static readonly REDIRECT_URI = process.env.SALESFORCE_REDIRECT_URI || 'http://localhost:5000/api/integrations/salesforce/callback';
  private static readonly LOGIN_URL = process.env.SALESFORCE_LOGIN_URL || 'https://login.salesforce.com';

  // Salesforce OAuth scopes
  private static readonly SCOPES = {
    basic: ['id', 'profile', 'email', 'address', 'phone'],
    api: ['api'],
    refresh_token: ['refresh_token'],
    web: ['web'],
    full: ['full'],
    chatter: ['chatter_api'],
    custom_permissions: ['custom_permissions'],
    wave: ['wave_api'],
    eclair: ['eclair_api']
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

    // Always include basic scopes
    this.SCOPES.basic.forEach(scope => scopes.add(scope));
    scopes.add('refresh_token');

    return Array.from(scopes);
  }

  /**
   * Generate Salesforce OAuth authorization URL
   */
  static getAuthUrl(scopes: string[], userId: string): string {
    if (!this.CLIENT_ID) {
      throw new Error('Salesforce Client ID not configured');
    }

    const baseUrl = `${this.LOGIN_URL}/services/oauth2/authorize`;
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.CLIENT_ID,
      redirect_uri: this.REDIRECT_URI,
      scope: scopes.join(' '),
      state: userId,
      prompt: 'consent'
    });

    return `${baseUrl}?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  static async exchangeCodeForTokens(code: string): Promise<SalesforceTokenResponse> {
    if (!this.CLIENT_ID || !this.CLIENT_SECRET) {
      throw new Error('Salesforce OAuth credentials not configured');
    }

    try {
      const tokenUrl = `${this.LOGIN_URL}/services/oauth2/token`;

      const params = new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: this.CLIENT_ID,
        client_secret: this.CLIENT_SECRET,
        redirect_uri: this.REDIRECT_URI
      });

      const response = await axios.post(tokenUrl, params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        }
      });

      return response.data;
    } catch (error: any) {
      logger.error('Salesforce token exchange error:', error.response?.data || error);
      throw new Error('Failed to exchange authorization code for tokens');
    }
  }

  /**
   * Get user info from Salesforce
   */
  static async getUserInfo(accessToken: string, identityUrl: string): Promise<SalesforceUserInfo> {
    try {
      const response = await axios.get(identityUrl, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        }
      });

      return response.data;
    } catch (error: any) {
      logger.error('Salesforce user info fetch error:', error.response?.data || error);
      throw new Error('Failed to fetch user info from Salesforce');
    }
  }

  /**
   * Refresh access token
   */
  static async refreshAccessToken(refreshToken: string): Promise<SalesforceTokenResponse> {
    if (!this.CLIENT_ID || !this.CLIENT_SECRET) {
      throw new Error('Salesforce OAuth credentials not configured');
    }

    try {
      const tokenUrl = `${this.LOGIN_URL}/services/oauth2/token`;

      const params = new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: this.CLIENT_ID,
        client_secret: this.CLIENT_SECRET
      });

      const response = await axios.post(tokenUrl, params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        }
      });

      return response.data;
    } catch (error: any) {
      logger.error('Salesforce token refresh error:', error.response?.data || error);
      throw new Error('Failed to refresh Salesforce access token');
    }
  }

  /**
   * Revoke access token
   */
  static async revokeToken(accessToken: string): Promise<void> {
    try {
      const revokeUrl = `${this.LOGIN_URL}/services/oauth2/revoke`;

      await axios.post(revokeUrl, new URLSearchParams({
        token: accessToken
      }), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
    } catch (error: any) {
      logger.error('Salesforce token revoke error:', error.response?.data || error);
      // Don't throw error as this is not critical
    }
  }

  /**
   * Get Salesforce API version
   */
  static async getApiVersions(instanceUrl: string, accessToken: string): Promise<any[]> {
    try {
      const response = await axios.get(`${instanceUrl}/services/data/`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        }
      });

      return response.data;
    } catch (error: any) {
      logger.error('Salesforce API versions fetch error:', error.response?.data || error);
      throw new Error('Failed to fetch Salesforce API versions');
    }
  }

  /**
   * Test API connection
   */
  static async testConnection(instanceUrl: string, accessToken: string): Promise<boolean> {
    try {
      await this.getApiVersions(instanceUrl, accessToken);
      return true;
    } catch (error: any) {
      logger.error('Salesforce connection test error:', error);
      return false;
    }
  }
}

export default SalesforceAuthService;