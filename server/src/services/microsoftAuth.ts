import axios from 'axios';
import logger from '../utils/logger';

export interface MicrosoftTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope: string;
  token_type: string;
}

export interface MicrosoftUserProfile {
  id: string;
  displayName: string;
  userPrincipalName: string;
  mail?: string;
  mobilePhone?: string;
  businessPhones?: string[];
  jobTitle?: string;
  officeLocation?: string;
}

export class MicrosoftAuthService {
  private static readonly CLIENT_ID = process.env.MICROSOFT_CLIENT_ID;
  private static readonly CLIENT_SECRET = process.env.MICROSOFT_CLIENT_SECRET;
  private static readonly REDIRECT_URI = process.env.MICROSOFT_REDIRECT_URI || 'http://localhost:5000/api/integrations/microsoft/callback';
  private static readonly TENANT_ID = process.env.MICROSOFT_TENANT_ID || 'common';

  // Microsoft Graph API scopes
  private static readonly SCOPES = {
    profile: ['openid', 'User.Read'],
    onedrive: ['openid', 'User.Read', 'Files.ReadWrite'],
    outlook: ['openid', 'User.Read', 'Mail.ReadWrite', 'Mail.Send'],
    teams: ['openid', 'User.Read', 'OnlineMeetings.ReadWrite'],
    calendar: ['openid', 'User.Read', 'Calendars.ReadWrite']
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
   * Generate Microsoft OAuth authorization URL
   */
  static getAuthUrl(types: string[], userId: string): string {
    if (!this.CLIENT_ID) {
      throw new Error('Microsoft Client ID not configured');
    }

    // Get scopes for the requested types
    const scopes = this.getScopes(types);
    console.log('Microsoft getAuthUrl - Requested types:', types);
    console.log('Microsoft getAuthUrl - Generated scopes:', scopes);
    
    if (scopes.length === 0) {
      throw new Error('No valid scopes generated for Microsoft OAuth');
    }

    const baseUrl = `https://login.microsoftonline.com/${this.TENANT_ID}/oauth2/v2.0/authorize`;
    const params = new URLSearchParams({
      client_id: this.CLIENT_ID,
      response_type: 'code',
      redirect_uri: this.REDIRECT_URI,
      scope: scopes.join(' '),
      state: `${userId}:${Date.now()}`,
      response_mode: 'query',
      prompt: 'consent',
      access_type: 'offline'
    });

    const authUrl = `${baseUrl}?${params.toString()}`;
    console.log('Microsoft OAuth URL generated:', authUrl);
    return authUrl;
  }

  /**
   * Exchange authorization code for access token
   */
  static async exchangeCodeForTokens(code: string, requestedScopes?: string[]): Promise<MicrosoftTokenResponse> {
    if (!this.CLIENT_ID || !this.CLIENT_SECRET) {
      throw new Error('Microsoft OAuth credentials not configured');
    }

    try {
      const tokenUrl = `https://login.microsoftonline.com/${this.TENANT_ID}/oauth2/v2.0/token`;

      const params = new URLSearchParams({
        client_id: this.CLIENT_ID,
        client_secret: this.CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
        redirect_uri: this.REDIRECT_URI
      });

      // Add scope if provided
      if (requestedScopes && requestedScopes.length > 0) {
        params.append('scope', requestedScopes.join(' '));
      }

      const response = await axios.post(tokenUrl, params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      return response.data;
    } catch (error: any) {
      logger.error('Microsoft token exchange error:', error.response?.data || error);
      throw new Error('Failed to exchange authorization code for tokens');
    }
  }

  /**
   * Get user profile from Microsoft Graph
   */
  static async getUserProfile(accessToken: string): Promise<MicrosoftUserProfile> {
    try {
      const response = await axios.get('https://graph.microsoft.com/v1.0/me', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data;
    } catch (error: any) {
      logger.error('Microsoft profile fetch error:', error.response?.data || error);
      throw new Error('Failed to fetch user profile from Microsoft Graph');
    }
  }

  /**
   * Refresh access token
   */
  static async refreshAccessToken(refreshToken: string): Promise<MicrosoftTokenResponse> {
    if (!this.CLIENT_ID || !this.CLIENT_SECRET) {
      throw new Error('Microsoft OAuth credentials not configured');
    }

    try {
      const tokenUrl = `https://login.microsoftonline.com/${this.TENANT_ID}/oauth2/v2.0/token`;

      const params = new URLSearchParams({
        client_id: this.CLIENT_ID,
        client_secret: this.CLIENT_SECRET,
        refresh_token: refreshToken,
        grant_type: 'refresh_token'
      });

      const response = await axios.post(tokenUrl, params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      return response.data;
    } catch (error: any) {
      logger.error('Microsoft token refresh error:', error.response?.data || error);
      throw new Error('Failed to refresh Microsoft access token');
    }
  }

  /**
   * Revoke access token
   */
  static async revokeToken(accessToken: string): Promise<void> {
    try {
      // Microsoft doesn't have a specific revoke endpoint, but we can sign out
      await axios.post(`https://login.microsoftonline.com/${this.TENANT_ID}/oauth2/v2.0/logout`, {}, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
    } catch (error: any) {
      logger.error('Microsoft token revoke error:', error.response?.data || error);
      // Don't throw error as this is not critical
    }
  }
}

export default MicrosoftAuthService;