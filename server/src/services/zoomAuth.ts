// @ts-nocheck
import axios from 'axios';
import logger from '../utils/logger';

export interface ZoomTokenResponse {
  access_token: string;
  token_type: string;
  refresh_token: string;
  expires_in: number;
  scope: string;
}

export interface ZoomUserProfile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  type: number;
  role_name: string;
  pmi: number;
  use_pmi: boolean;
  personal_meeting_url: string;
  timezone: string;
  verified: number;
  dept: string;
  created_at: string;
  last_login_time: string;
  last_client_version: string;
  pic_url: string;
  host_key: string;
  jid: string;
  group_ids: string[];
  im_group_ids: string[];
  account_id: string;
  language: string;
  phone_country: string;
  phone_number: string;
  status: string;
  job_title: string;
  location: string;
  login_types: number[];
  role_id: string;
  user_created_at: string;
}

export class ZoomAuthService {
  private static readonly CLIENT_ID = process.env.ZOOM_CLIENT_ID;
  private static readonly CLIENT_SECRET = process.env.ZOOM_CLIENT_SECRET;
  private static readonly REDIRECT_URI = process.env.ZOOM_REDIRECT_URI || 'http://localhost:5000/api/integrations/zoom/callback';
  private static readonly BASE_URL = 'https://zoom.us';
  private static readonly API_BASE_URL = 'https://api.zoom.us/v2';

  // Zoom OAuth scopes
  private static readonly SCOPES = {
    meeting: ['meeting:write', 'meeting:read'],
    webinar: ['webinar:write', 'webinar:read'],
    recording: ['recording:write', 'recording:read'],
    user: ['user:read', 'user:write'],
    report: ['report:read'],
    dashboard: ['dashboard:read'],
    chat: ['chat_message:write', 'chat_message:read', 'chat_contact:read'],
    phone: ['phone:read', 'phone:write'],
    sip_phone: ['sip_phone:read', 'sip_phone:write']
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

    // Always include basic user scope
    scopes.add('user:read');

    return Array.from(scopes);
  }

  /**
   * Generate Zoom OAuth authorization URL
   */
  static getAuthUrl(scopes: string[], userId: string): string {
    if (!this.CLIENT_ID) {
      throw new Error('Zoom Client ID not configured');
    }

    const baseUrl = `${this.BASE_URL}/oauth/authorize`;
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.CLIENT_ID,
      redirect_uri: this.REDIRECT_URI,
      scope: scopes.join(' '),
      state: userId
    });

    return `${baseUrl}?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  static async exchangeCodeForTokens(code: string): Promise<ZoomTokenResponse> {
    if (!this.CLIENT_ID || !this.CLIENT_SECRET) {
      throw new Error('Zoom OAuth credentials not configured');
    }

    try {
      const tokenUrl = `${this.BASE_URL}/oauth/token`;

      const credentials = Buffer.from(`${this.CLIENT_ID}:${this.CLIENT_SECRET}`).toString('base64');

      const params = new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: this.REDIRECT_URI
      });

      const response = await axios.post(tokenUrl, params, {
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      return response.data;
    } catch (error: any) {
      logger.error('Zoom token exchange error:', error.response?.data || error);
      throw new Error('Failed to exchange authorization code for tokens');
    }
  }

  /**
   * Get user profile from Zoom API
   */
  static async getUserProfile(accessToken: string): Promise<ZoomUserProfile> {
    try {
      const response = await axios.get(`${this.API_BASE_URL}/users/me`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data;
    } catch (error: any) {
      logger.error('Zoom profile fetch error:', error.response?.data || error);
      throw new Error('Failed to fetch user profile from Zoom API');
    }
  }

  /**
   * Refresh access token
   */
  static async refreshAccessToken(refreshToken: string): Promise<ZoomTokenResponse> {
    if (!this.CLIENT_ID || !this.CLIENT_SECRET) {
      throw new Error('Zoom OAuth credentials not configured');
    }

    try {
      const tokenUrl = `${this.BASE_URL}/oauth/token`;

      const credentials = Buffer.from(`${this.CLIENT_ID}:${this.CLIENT_SECRET}`).toString('base64');

      const params = new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken
      });

      const response = await axios.post(tokenUrl, params, {
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      return response.data;
    } catch (error: any) {
      logger.error('Zoom token refresh error:', error.response?.data || error);
      throw new Error('Failed to refresh Zoom access token');
    }
  }

  /**
   * Revoke access token
   */
  static async revokeToken(accessToken: string): Promise<void> {
    if (!this.CLIENT_ID || !this.CLIENT_SECRET) {
      throw new Error('Zoom OAuth credentials not configured');
    }

    try {
      const revokeUrl = `${this.BASE_URL}/oauth/revoke`;

      const credentials = Buffer.from(`${this.CLIENT_ID}:${this.CLIENT_SECRET}`).toString('base64');

      const params = new URLSearchParams({
        token: accessToken
      });

      await axios.post(revokeUrl, params, {
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
    } catch (error: any) {
      logger.error('Zoom token revoke error:', error.response?.data || error);
      // Don't throw error as this is not critical
    }
  }

  /**
   * Test API connection
   */
  static async testConnection(accessToken: string): Promise<boolean> {
    try {
      await this.getUserProfile(accessToken);
      return true;
    } catch (error: any) {
      logger.error('Zoom connection test error:', error);
      return false;
    }
  }
}

export default ZoomAuthService;