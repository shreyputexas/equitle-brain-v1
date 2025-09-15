import { google } from 'googleapis';
import { Integration, GoogleTokens } from '../models/Integration';
import logger from '../utils/logger';

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

export class GoogleAuthService {
  static getAuthUrl(scopes: string[], userId: string) {
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      state: userId, // Pass userId in state for security
      prompt: 'consent' // Force consent to get refresh token
    });
    
    return authUrl;
  }

  static async exchangeCodeForTokens(code: string): Promise<GoogleTokens> {
    try {
      const { tokens } = await oauth2Client.getToken(code);
      
      return {
        access_token: tokens.access_token!,
        refresh_token: tokens.refresh_token!,
        expires_in: tokens.expiry_date! - Date.now(),
        token_type: 'Bearer',
        scope: tokens.scope!
      };
    } catch (error) {
      logger.error('Error exchanging code for tokens:', error);
      throw new Error('Failed to exchange authorization code');
    }
  }

  static async refreshAccessToken(refreshToken: string): Promise<GoogleTokens> {
    try {
      oauth2Client.setCredentials({
        refresh_token: refreshToken
      });

      const { credentials } = await oauth2Client.refreshAccessToken();
      
      return {
        access_token: credentials.access_token!,
        refresh_token: credentials.refresh_token || refreshToken,
        expires_in: credentials.expiry_date! - Date.now(),
        token_type: 'Bearer',
        scope: credentials.scope!
      };
    } catch (error) {
      logger.error('Error refreshing access token:', error);
      throw new Error('Failed to refresh access token');
    }
  }

  static async getUserProfile(accessToken: string) {
    try {
      oauth2Client.setCredentials({
        access_token: accessToken
      });

      const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
      const { data } = await oauth2.userinfo.get();

      return {
        id: data.id!,
        email: data.email!,
        name: data.name!,
        picture: data.picture
      };
    } catch (error) {
      logger.error('Error getting user profile:', error);
      throw new Error('Failed to get user profile');
    }
  }

  static createAuthenticatedClient(accessToken: string) {
    const client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    client.setCredentials({
      access_token: accessToken
    });

    return client;
  }

  static getScopes(types: string[]) {
    const scopeMap = {
      'profile': [
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile'
      ],
      'drive': [
        'https://www.googleapis.com/auth/drive.readonly',
        'https://www.googleapis.com/auth/drive.file'
      ],
      'calendar': [
        'https://www.googleapis.com/auth/calendar.readonly',
        'https://www.googleapis.com/auth/calendar.events'
      ],
      'gmail': [
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/gmail.send',
        'https://www.googleapis.com/auth/gmail.compose',
        'https://www.googleapis.com/auth/gmail.modify'
      ]
    };

    return types.reduce((scopes, type) => {
      return [...scopes, ...(scopeMap[type as keyof typeof scopeMap] || [])];
    }, [] as string[]);
  }
}

export default GoogleAuthService;