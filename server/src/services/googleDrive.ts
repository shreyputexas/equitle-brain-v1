import { google } from 'googleapis';
import GoogleAuthService from './googleAuth';
import logger from '../utils/logger';

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string | null;
  modifiedTime: string;
  webViewLink?: string | null;
  webContentLink?: string | null;
  thumbnailLink?: string | null;
  parents?: string[] | null;
}

export class GoogleDriveService {
  static async listFiles(accessToken: string, options: {
    pageSize?: number;
    query?: string;
    orderBy?: string;
  } = {}): Promise<DriveFile[]> {
    try {
      const auth = GoogleAuthService.createAuthenticatedClient(accessToken);
      const drive = google.drive({ version: 'v3', auth });

      const {
        pageSize = 50,
        query = "trashed = false",
        orderBy = "modifiedTime desc"
      } = options;

      const response = await drive.files.list({
        pageSize,
        q: query,
        orderBy,
        fields: 'files(id,name,mimeType,size,modifiedTime,webViewLink,webContentLink,thumbnailLink,parents)',
      });

      return response.data.files?.map(file => ({
        id: file.id!,
        name: file.name!,
        mimeType: file.mimeType!,
        size: file.size,
        modifiedTime: file.modifiedTime!,
        webViewLink: file.webViewLink,
        webContentLink: file.webContentLink,
        thumbnailLink: file.thumbnailLink,
        parents: file.parents
      })) || [];
    } catch (error) {
      logger.error('Error listing Drive files:', error);
      throw new Error('Failed to list Drive files');
    }
  }

  static async getFile(accessToken: string, fileId: string): Promise<DriveFile | null> {
    try {
      const auth = GoogleAuthService.createAuthenticatedClient(accessToken);
      const drive = google.drive({ version: 'v3', auth });

      const response = await drive.files.get({
        fileId,
        fields: 'id,name,mimeType,size,modifiedTime,webViewLink,webContentLink,thumbnailLink,parents',
      });

      const file = response.data;
      return {
        id: file.id!,
        name: file.name!,
        mimeType: file.mimeType!,
        size: file.size,
        modifiedTime: file.modifiedTime!,
        webViewLink: file.webViewLink,
        webContentLink: file.webContentLink,
        thumbnailLink: file.thumbnailLink,
        parents: file.parents
      };
    } catch (error) {
      logger.error('Error getting Drive file:', error);
      return null;
    }
  }

  static async searchFiles(accessToken: string, searchTerm: string): Promise<DriveFile[]> {
    const query = `name contains '${searchTerm}' and trashed = false`;
    return this.listFiles(accessToken, { query });
  }

  static async getFolders(accessToken: string): Promise<DriveFile[]> {
    const query = "mimeType = 'application/vnd.google-apps.folder' and trashed = false";
    return this.listFiles(accessToken, { query });
  }

  static async getRecentFiles(accessToken: string, days: number = 7): Promise<DriveFile[]> {
    const date = new Date();
    date.setDate(date.getDate() - days);
    const isoDate = date.toISOString();
    
    const query = `modifiedTime >= '${isoDate}' and trashed = false`;
    return this.listFiles(accessToken, { query });
  }

  static async getFilesByType(accessToken: string, mimeType: string): Promise<DriveFile[]> {
    const query = `mimeType contains '${mimeType}' and trashed = false`;
    return this.listFiles(accessToken, { query });
  }

  static async createFolder(accessToken: string, name: string, parentId?: string): Promise<DriveFile> {
    try {
      const auth = GoogleAuthService.createAuthenticatedClient(accessToken);
      const drive = google.drive({ version: 'v3', auth });

      const fileMetadata = {
        name,
        mimeType: 'application/vnd.google-apps.folder',
        parents: parentId ? [parentId] : undefined
      };

      const response = await drive.files.create({
        requestBody: fileMetadata,
        fields: 'id,name,mimeType,modifiedTime',
      });

      const file = response.data;
      return {
        id: file.id!,
        name: file.name!,
        mimeType: file.mimeType!,
        modifiedTime: file.modifiedTime!
      };
    } catch (error) {
      logger.error('Error creating Drive folder:', error);
      throw new Error('Failed to create Drive folder');
    }
  }

  static getFileIcon(mimeType: string): string {
    const iconMap: { [key: string]: string } = {
      'application/vnd.google-apps.folder': '📁',
      'application/vnd.google-apps.document': '📄',
      'application/vnd.google-apps.spreadsheet': '📊',
      'application/vnd.google-apps.presentation': '📽️',
      'application/pdf': '📋',
      'image/': '🖼️',
      'video/': '🎥',
      'audio/': '🎵',
      'application/zip': '🗜️',
      'text/': '📝'
    };

    for (const [type, icon] of Object.entries(iconMap)) {
      if (mimeType.startsWith(type)) {
        return icon;
      }
    }

    return '📄'; // Default file icon
  }
}

export default GoogleDriveService;