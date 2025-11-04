import { google } from 'googleapis';
import { Integration, GoogleTokens } from '../models/Integration';
import logger from '../utils/logger';

// Initialize OAuth2 client once with fallback values
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID || 'demo-client-id',
  process.env.GOOGLE_CLIENT_SECRET || 'demo-client-secret',
  process.env.GOOGLE_REDIRECT_URI || 'http://localhost:4001/api/integrations/google/callback'
);

export class GoogleAuthService {
  /**
   * Generate OAuth authorization URL with proper security measures
   */
  static getAuthUrl(serviceTypes: string[], userId: string): string {
    try {
      // Debug: Log environment variables
      logger.info('Google OAuth Debug', {
        GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? 'SET' : 'NOT SET',
        GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ? 'SET' : 'NOT SET',
        GOOGLE_REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI || 'NOT SET'
      });

      // Validate required environment variables
      if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
        throw new Error('Google OAuth credentials not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in your .env file.');
      }

      // Generate secure state parameter with user ID and timestamp
      const timestamp = Date.now();
      const state = `${userId}:${timestamp}`;

      // Get required scopes for requested services
      const scopes = this.getScopes(serviceTypes);

      if (scopes.length === 0) {
        throw new Error('No valid service types provided');
      }

      const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',           // Required for refresh tokens
        scope: scopes,
        state: state,                     // CSRF protection
        prompt: 'consent',                // Force consent screen for refresh token
        include_granted_scopes: true,     // Incremental authorization
        response_type: 'code'             // Authorization code flow
      });

      logger.info('Generated Google OAuth URL', {
        userId,
        serviceTypes,
        scopeCount: scopes.length,
        scopes: scopes.join(', '),
        timestamp
      });

      return authUrl;

    } catch (error) {
      logger.error('Failed to generate OAuth URL', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId,
        serviceTypes
      });
      throw new Error('Failed to generate OAuth authorization URL');
    }
  }

  /**
   * Exchange authorization code for access and refresh tokens
   */
  static async exchangeCodeForTokens(code: string): Promise<GoogleTokens> {
    try {
      logger.info('Exchanging authorization code for tokens', {
        codeLength: code.length
      });

      const { tokens } = await oauth2Client.getToken(code);

      if (!tokens.access_token) {
        throw new Error('No access token received from Google');
      }

      if (!tokens.refresh_token) {
        logger.warn('No refresh token received - user may have already granted permissions');
      }

      const expiresIn = tokens.expiry_date ? Math.floor((tokens.expiry_date - Date.now()) / 1000) : 3600;

      const result: GoogleTokens = {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token || '',
        expires_in: expiresIn,
        token_type: 'Bearer',
        scope: tokens.scope || ''
      };

      logger.info('Successfully exchanged code for tokens', {
        hasAccessToken: !!result.access_token,
        hasRefreshToken: !!result.refresh_token,
        expiresIn: result.expires_in,
        scopeCount: result.scope.split(' ').length
      });

      return result;

    } catch (error) {
      logger.error('Failed to exchange authorization code', {
        error: error instanceof Error ? error.message : 'Unknown error',
        codeLength: code.length
      });
      throw new Error('Failed to exchange authorization code for tokens');
    }
  }

  /**
   * Refresh access token using refresh token
   */
  static async refreshAccessToken(refreshToken: string): Promise<GoogleTokens> {
    try {
      logger.info('Refreshing access token');

      if (!refreshToken) {
        throw new Error('No refresh token provided');
      }

      // Set refresh token for the client
      oauth2Client.setCredentials({
        refresh_token: refreshToken
      });

      const { credentials } = await oauth2Client.refreshAccessToken();

      if (!credentials.access_token) {
        throw new Error('No access token received during refresh');
      }

      const expiresIn = credentials.expiry_date ?
        Math.floor((credentials.expiry_date - Date.now()) / 1000) : 3600;

      const result: GoogleTokens = {
        access_token: credentials.access_token,
        refresh_token: credentials.refresh_token || refreshToken, // Keep original if not provided
        expires_in: expiresIn,
        token_type: 'Bearer',
        scope: credentials.scope || ''
      };

      logger.info('Successfully refreshed access token', {
        expiresIn: result.expires_in,
        hasNewRefreshToken: !!credentials.refresh_token
      });

      return result;

    } catch (error) {
      logger.error('Failed to refresh access token', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw new Error('Failed to refresh access token - may need to re-authenticate');
    }
  }

  /**
   * Get user profile information
   */
  static async getUserProfile(accessToken: string) {
    try {
      logger.info('Fetching user profile');

      const client = new google.auth.OAuth2();
      client.setCredentials({ access_token: accessToken });

      const oauth2 = google.oauth2({ version: 'v2', auth: client });
      const { data } = await oauth2.userinfo.get();

      if (!data.email || !data.name) {
        throw new Error('Incomplete user profile data received');
      }

      const profile = {
        id: data.id!,
        email: data.email,
        name: data.name,
        picture: data.picture || undefined
      };

      logger.info('Successfully fetched user profile', {
        email: profile.email,
        name: profile.name,
        hasPicture: !!profile.picture
      });

      return profile;

    } catch (error) {
      logger.error('Failed to get user profile', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw new Error('Failed to retrieve user profile');
    }
  }

  /**
   * Create authenticated Google API client
   */
  static createAuthenticatedClient(accessToken: string, refreshToken?: string) {
    const client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    const credentials: any = { access_token: accessToken };
    if (refreshToken) {
      credentials.refresh_token = refreshToken;
    }

    client.setCredentials(credentials);
    return client;
  }

  /**
   * Get OAuth scopes for requested service types
   */
  static getScopes(serviceTypes: string[]): string[] {
    const scopeMap = {
      'profile': [
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile'
      ],
      'gmail': [
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/gmail.send',
        'https://www.googleapis.com/auth/gmail.compose',
        'https://www.googleapis.com/auth/gmail.modify',
        'https://www.googleapis.com/auth/gmail.labels'
      ],
      'calendar': [
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/calendar.events'
      ],
      'meet': [
        'https://www.googleapis.com/auth/calendar',           // Meet requires calendar access
        'https://www.googleapis.com/auth/calendar.events'     // For creating meetings
      ],
      'drive': [
        'https://www.googleapis.com/auth/drive.readonly',
        'https://www.googleapis.com/auth/drive.file'
      ]
    };

    // Always include profile scopes
    const allScopes = new Set(['profile']);
    serviceTypes.forEach(type => allScopes.add(type));

    const scopes: string[] = [];
    Array.from(allScopes).forEach(type => {
      const typeScopes = scopeMap[type as keyof typeof scopeMap];
      if (typeScopes) {
        scopes.push(...typeScopes);
      }
    });

    // Remove duplicates and return
    return Array.from(new Set(scopes));
  }

  /**
   * Validate state parameter for CSRF protection
   */
  static validateState(state: string, maxAgeMinutes: number = 10): { userId: string; isValid: boolean } {
    try {
      if (!state || !state.includes(':')) {
        return { userId: '', isValid: false };
      }

      const [userId, timestampStr] = state.split(':');
      const timestamp = parseInt(timestampStr);

      if (!userId || isNaN(timestamp)) {
        return { userId: '', isValid: false };
      }

      const age = Date.now() - timestamp;
      const maxAge = maxAgeMinutes * 60 * 1000;

      return {
        userId,
        isValid: age <= maxAge
      };

    } catch (error) {
      logger.error('Failed to validate state parameter', {
        error: error instanceof Error ? error.message : 'Unknown error',
        state
      });
      return { userId: '', isValid: false };
    }
  }

  /**
   * Check if a token is about to expire (within 5 minutes)
   */
  static isTokenExpiringSoon(expiresAt: Date): boolean {
    const fiveMinutes = 5 * 60 * 1000;
    return (expiresAt.getTime() - Date.now()) <= fiveMinutes;
  }
}

export default GoogleAuthService;