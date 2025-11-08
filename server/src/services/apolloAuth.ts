// @ts-nocheck
import axios from 'axios';
import logger from '../utils/logger';

export interface ApolloTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
  created_at: number;
}

export interface ApolloUserProfile {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

export class ApolloAuthService {
  private static readonly CLIENT_ID = process.env.APOLLO_CLIENT_ID || 'APOLLO_CLIENT_ID_PLACEHOLDER';
  private static readonly CLIENT_SECRET = process.env.APOLLO_CLIENT_SECRET || 'APOLLO_CLIENT_SECRET_PLACEHOLDER';
  // Handle multiple redirect URIs (Apollo allows multiple in registration, but we use only the first one)
  private static readonly REDIRECT_URI = (process.env.APOLLO_REDIRECT_URI || 'https://neat-berries-dress.loca.lt/api/integrations/apollo/callback').split(',')[0].trim();
  private static readonly BASE_URL = 'https://app.apollo.io';
  private static readonly API_BASE_URL = 'https://app.apollo.io/api/v1';

  // Debug: Log what we loaded
  static {
    logger.info('🔧 Apollo Auth Service Initialized:', {
      CLIENT_ID: this.CLIENT_ID !== 'APOLLO_CLIENT_ID_PLACEHOLDER' ? `${this.CLIENT_ID.substring(0, 8)}...` : 'NOT SET - PLACEHOLDER',
      CLIENT_SECRET: this.CLIENT_SECRET !== 'APOLLO_CLIENT_SECRET_PLACEHOLDER' ? 'SET' : 'NOT SET - PLACEHOLDER',
      REDIRECT_URI: this.REDIRECT_URI
    });
  }

  /**
   * Get scopes for Apollo OAuth
   * Apollo uses scopes like: contacts_search, person_read, read_user_profile, app_scopes
   * According to Apollo docs: scopes should be space-separated and URL-encoded in the URL
   */
  static getScopes(requestedScopes: string[] = []): string {
    // Default scopes - read_user_profile and app_scopes are usually required
    const defaultScopes = ['read_user_profile', 'app_scopes'];
    
    // Add requested scopes
    const allScopes = [...defaultScopes, ...requestedScopes];
    
    // Remove duplicates and join with spaces (URLSearchParams will encode them)
    const uniqueScopes = Array.from(new Set(allScopes));
    
    return uniqueScopes.join(' '); // Space-separated (will be URL-encoded by URLSearchParams)
  }

  /**
   * Generate Apollo OAuth authorization URL
   * According to Apollo OAuth 2.0 documentation:
   * https://app.apollo.io/oauth/authorize?client_id=...&redirect_uri=...&response_type=code&scope=...&state=...
   * 
   * State parameter encoding: Using base64 URL-safe encoding to avoid issues with special characters
   */
  static getAuthUrl(userId: string, requestedScopes: string[] = [], includeState: boolean = true): string {
    if (!this.CLIENT_ID || this.CLIENT_ID === 'APOLLO_CLIENT_ID_PLACEHOLDER') {
      throw new Error('Apollo Client ID not configured. Please set APOLLO_CLIENT_ID in your .env file.');
    }

    if (!this.CLIENT_SECRET || this.CLIENT_SECRET === 'APOLLO_CLIENT_SECRET_PLACEHOLDER') {
      logger.warn('Apollo Client Secret not configured. OAuth flow will fail.');
    }

    // Get scopes (space-separated)
    const scopes = this.getScopes(requestedScopes);

    // Build authorization URL according to Apollo OAuth 2.0 documentation
    // Format: https://app.apollo.io/oauth/authorize?client_id=...&redirect_uri=...&response_type=code&scope=...&state=...
    const params = new URLSearchParams({
      client_id: this.CLIENT_ID,
      redirect_uri: this.REDIRECT_URI,
      response_type: 'code',
      scope: scopes // URLSearchParams will automatically URL-encode spaces as %20
    });

    // Generate state parameter with base64 URL-safe encoding
    // Format: base64({userId: "...", timestamp: ...})
    let state: string | undefined;
    if (includeState && userId) {
      const timestamp = Date.now();
      const stateData = {
        userId: userId,
        timestamp: timestamp
      };
      // Use base64 URL-safe encoding (replaces + with -, / with _, removes padding =)
      const stateJson = JSON.stringify(stateData);
      const stateBase64 = Buffer.from(stateJson).toString('base64');
      // Make URL-safe: replace + with -, / with _, remove padding =
      state = stateBase64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    }

    // Add state parameter if provided
    if (state) {
      params.append('state', state);
    }

    // Apollo OAuth authorization endpoint
    // Note: This endpoint will return 404 if the app is not registered in Apollo
    // Register your app at: Apollo Settings → Integrations → API → OAuth registration
    const authUrl = `${this.BASE_URL}/oauth/authorize?${params.toString()}`;

    // Log detailed information about the authorization URL
    const logData: any = {
      userId,
      scopes: requestedScopes,
      scopeString: scopes,
      hasState: !!state,
      stateFormat: state ? 'base64-json' : 'none',
      redirectUri: this.REDIRECT_URI,
      includeState: includeState,
      clientIdPrefix: this.CLIENT_ID.substring(0, 8) + '...',
      authUrlLength: authUrl.length
    };

    // Log the URL with sensitive data hidden
    const safeAuthUrl = authUrl
      .replace(this.CLIENT_ID, 'CLIENT_ID_HIDDEN')
      .replace(state || '', 'STATE_HIDDEN');
    logData.authUrl = safeAuthUrl;

    logger.info('Generated Apollo OAuth URL', logData);

    return authUrl;
  }

  /**
   * Generate Apollo OAuth authorization URL without state parameter (for testing)
   * This can help diagnose if state parameter is causing issues
   */
  static getAuthUrlWithoutState(requestedScopes: string[] = []): string {
    return this.getAuthUrl('', requestedScopes, false);
  }

  /**
   * Exchange authorization code for access and refresh tokens
   * According to Apollo OAuth 2.0 documentation
   * POST https://app.apollo.io/api/v1/oauth/token
   */
  static async exchangeCodeForTokens(code: string, redirectUri?: string): Promise<ApolloTokenResponse> {
    if (!this.CLIENT_ID || this.CLIENT_ID === 'APOLLO_CLIENT_ID_PLACEHOLDER') {
      throw new Error('Apollo Client ID not configured. Please set APOLLO_CLIENT_ID in your .env file.');
    }

    if (!this.CLIENT_SECRET || this.CLIENT_SECRET === 'APOLLO_CLIENT_SECRET_PLACEHOLDER') {
      throw new Error('Apollo Client Secret not configured. Please set APOLLO_CLIENT_SECRET in your .env file.');
    }

    try {
      // Apollo token endpoint: https://app.apollo.io/api/v1/oauth/token
      const tokenUrl = `${this.API_BASE_URL}/oauth/token`;

      // Build form data as per Apollo documentation
      // Required parameters: grant_type, code, client_id, client_secret, redirect_uri
      // Apollo requires redirect_uri to match the one used in authorization request
      const formData = new URLSearchParams();
      formData.append('grant_type', 'authorization_code');
      formData.append('code', code);
      formData.append('client_id', this.CLIENT_ID);
      formData.append('client_secret', this.CLIENT_SECRET);
      
      // Always include redirect_uri - use provided one or fall back to configured one
      const finalRedirectUri = redirectUri || this.REDIRECT_URI;
      formData.append('redirect_uri', finalRedirectUri);

      logger.info('Exchanging Apollo authorization code for tokens', {
        codeLength: code.length,
        redirectUri: finalRedirectUri,
        usingProvidedRedirectUri: !!redirectUri,
        clientIdPrefix: this.CLIENT_ID.substring(0, 8) + '...',
        tokenUrl: tokenUrl
      });

      // Send POST request with form data
      let response;
      try {
        response = await axios.post(tokenUrl, formData, {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        });
      } catch (error: any) {
        // Enhanced error logging for Apollo token exchange
        logger.error('Apollo token exchange request failed', {
          error: error.message,
          status: error.response?.status,
          statusText: error.response?.statusText,
          responseData: error.response?.data,
          requestUrl: tokenUrl,
          hasCode: !!code,
          redirectUri: finalRedirectUri
        });
        throw error;
      }

      const tokens = response.data as ApolloTokenResponse;

      // Validate response
      if (!tokens.access_token) {
        throw new Error('No access token received from Apollo');
      }

      // Log success with token details (without exposing secrets)
      logger.info('Successfully exchanged code for Apollo tokens', {
        hasAccessToken: !!tokens.access_token,
        hasRefreshToken: !!tokens.refresh_token,
        expiresIn: tokens.expires_in,
        expiresInDays: Math.floor(tokens.expires_in / 86400), // Convert seconds to days
        scope: tokens.scope,
        tokenType: tokens.token_type,
        createdAt: tokens.created_at
      });

      // Apollo tokens expire after 30 days (2592000 seconds)
      // Verify the expires_in matches expected value
      if (tokens.expires_in !== 2592000) {
        logger.warn('Unexpected token expiration time', {
          expiresIn: tokens.expires_in,
          expected: 2592000
        });
      }

      return tokens;
    } catch (error: any) {
      logger.error('Apollo token exchange error:', {
        error: error.message,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText
      });
      
      // Provide more detailed error message
      if (error.response?.data) {
        throw new Error(`Failed to exchange authorization code for tokens: ${JSON.stringify(error.response.data)}`);
      }
      
      throw new Error(`Failed to exchange authorization code for tokens: ${error.message}`);
    }
  }

  /**
   * Refresh access token using refresh token
   * According to Apollo OAuth 2.0 documentation - Step 5
   * POST https://app.apollo.io/api/v1/oauth/token
   */
  static async refreshAccessToken(refreshToken: string, requestedScopes?: string[], redirectUri?: string): Promise<ApolloTokenResponse> {
    if (!this.CLIENT_ID || this.CLIENT_ID === 'APOLLO_CLIENT_ID_PLACEHOLDER') {
      throw new Error('Apollo Client ID not configured. Please set APOLLO_CLIENT_ID in your .env file.');
    }

    if (!this.CLIENT_SECRET || this.CLIENT_SECRET === 'APOLLO_CLIENT_SECRET_PLACEHOLDER') {
      throw new Error('Apollo Client Secret not configured. Please set APOLLO_CLIENT_SECRET in your .env file.');
    }

    if (!refreshToken) {
      throw new Error('No refresh token provided');
    }

    try {
      // Apollo token endpoint: https://app.apollo.io/api/v1/oauth/token
      const tokenUrl = `${this.API_BASE_URL}/oauth/token`;

      // Build form data as per Apollo documentation
      // Required parameters: grant_type, refresh_token, client_id, client_secret
      // Optional: redirect_uri, scope
      const formData = new URLSearchParams();
      formData.append('grant_type', 'refresh_token');
      formData.append('refresh_token', refreshToken);
      formData.append('client_id', this.CLIENT_ID);
      formData.append('client_secret', this.CLIENT_SECRET);

      // Add redirect_uri if provided (optional)
      if (redirectUri) {
        formData.append('redirect_uri', redirectUri);
      }

      // Add scope if provided (optional - can reduce scopes, but must be included in original scopes)
      if (requestedScopes && requestedScopes.length > 0) {
        formData.append('scope', requestedScopes.join(' ')); // Space-separated, not URL-encoded
      }

      logger.info('Refreshing Apollo access token', {
        hasRequestedScopes: !!requestedScopes && requestedScopes.length > 0,
        hasRedirectUri: !!redirectUri
      });

      // Send POST request with form data
      const response = await axios.post(tokenUrl, formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      const tokens = response.data as ApolloTokenResponse;

      // Validate response
      if (!tokens.access_token) {
        throw new Error('No access token received during refresh');
      }

      // Log success with token details (without exposing secrets)
      logger.info('Successfully refreshed Apollo access token', {
        expiresIn: tokens.expires_in,
        expiresInDays: Math.floor(tokens.expires_in / 86400), // Convert seconds to days
        hasNewRefreshToken: !!tokens.refresh_token,
        scope: tokens.scope,
        tokenType: tokens.token_type,
        createdAt: tokens.created_at
      });

      // Note: When you use the refresh token to generate new tokens, 
      // the existing tokens are automatically revoked per Apollo docs
      logger.info('Previous Apollo tokens have been revoked (as per Apollo OAuth spec)');

      // Apollo tokens expire after 30 days (2592000 seconds)
      if (tokens.expires_in !== 2592000) {
        logger.warn('Unexpected token expiration time', {
          expiresIn: tokens.expires_in,
          expected: 2592000
        });
      }

      return tokens;
    } catch (error: any) {
      logger.error('Apollo token refresh error:', {
        error: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      throw new Error(`Failed to refresh access token: ${error.message}`);
    }
  }

  /**
   * Get user profile from Apollo API
   */
  static async getUserProfile(accessToken: string): Promise<ApolloUserProfile> {
    try {
      const profileUrl = `${this.API_BASE_URL}/users/api_profile`;

      logger.info('Fetching Apollo user profile');

      const response = await axios.get(profileUrl, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      const profile = response.data;

      // Apollo returns user data in their format, adapt to our interface
      const userProfile: ApolloUserProfile = {
        id: profile.id || profile.user_id || '',
        email: profile.email || profile.email_address || '',
        name: profile.name || `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Apollo User',
        picture: profile.picture_url || profile.photo_url || undefined
      };

      if (!userProfile.email) {
        throw new Error('Incomplete user profile data received - no email');
      }

      logger.info('Successfully fetched Apollo user profile', {
        email: userProfile.email,
        name: userProfile.name
      });

      return userProfile;
    } catch (error: any) {
      logger.error('Apollo profile fetch error:', {
        error: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      throw new Error(`Failed to fetch user profile: ${error.message}`);
    }
  }

  /**
   * Validate state parameter for CSRF protection
   * Supports both formats:
   * 1. Legacy: userId:timestamp (for backward compatibility)
   * 2. New: base64-encoded JSON {userId: "...", timestamp: ...}
   */
  static validateState(state: string, maxAgeMinutes: number = 10): { userId: string; isValid: boolean } {
    try {
      if (!state) {
        return { userId: '', isValid: false };
      }

      // Try to decode as base64 JSON first (new format)
      try {
        // Restore URL-safe base64 to standard base64
        const base64 = state.replace(/-/g, '+').replace(/_/g, '/');
        // Add padding if needed
        const paddedBase64 = base64 + '='.repeat((4 - base64.length % 4) % 4);
        const decoded = Buffer.from(paddedBase64, 'base64').toString('utf-8');
        const stateData = JSON.parse(decoded);

        if (stateData.userId && stateData.timestamp) {
          const timestamp = parseInt(stateData.timestamp);
          if (!isNaN(timestamp)) {
            const age = Date.now() - timestamp;
            const maxAge = maxAgeMinutes * 60 * 1000;

            logger.info('Validated state parameter (base64-json format)', {
              userId: stateData.userId,
              age,
              isValid: age <= maxAge
            });

            return {
              userId: stateData.userId,
              isValid: age <= maxAge
            };
          }
        }
      } catch (base64Error) {
        // Not base64 JSON, try legacy format
        logger.debug('State is not base64-json format, trying legacy format');
      }

      // Legacy format: userId:timestamp
      if (state.includes(':')) {
        const [userId, timestampStr] = state.split(':');
        const timestamp = parseInt(timestampStr);

        if (userId && !isNaN(timestamp)) {
          const age = Date.now() - timestamp;
          const maxAge = maxAgeMinutes * 60 * 1000;

          logger.info('Validated state parameter (legacy format)', {
            userId,
            age,
            isValid: age <= maxAge
          });

          return {
            userId,
            isValid: age <= maxAge
          };
        }
      }

      logger.warn('State parameter format not recognized', { state });
      return { userId: '', isValid: false };
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

  /**
   * Get the configured redirect URI
   */
  static getRedirectUri(): string {
    return this.REDIRECT_URI;
  }
}

export default ApolloAuthService;

