import axios from 'axios';
import { auth } from '../lib/firebase';

export interface Integration {
  id: string;
  provider: 'google' | 'microsoft' | 'apollo';
  type: 'drive' | 'calendar' | 'profile' | 'gmail' | 'meet' | 'onedrive' | 'outlook' | 'teams' | 'apollo';
  isActive: boolean;
  profile: {
    email: string;
    name: string;
    picture?: string;
  };
  scope: string | string[];
  createdAt: string;
  updatedAt: string;
  services?: string[]; // For Microsoft integrations
}

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  modifiedTime: string;
  webViewLink?: string;
  thumbnailLink?: string;
}

export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  location?: string;
  htmlLink: string;
  status: string;
  created: string;
  updated: string;
  attendees?: Array<{
    email: string;
    displayName?: string;
    responseStatus?: string;
  }>;
  organizer: {
    email: string;
    displayName?: string;
  };
}

export interface GmailMessage {
  id: string;
  threadId: string;
  labelIds?: string[];
  snippet: string;
  historyId: string;
  internalDate: string;
  sizeEstimate: number;
  payload?: {
    headers: Array<{
      name: string;
      value: string;
    }>;
    body?: {
      size: number;
      data?: string;
    };
  };
}

export interface GmailLabel {
  id: string;
  name: string;
  type: string;
  messagesTotal?: number;
  messagesUnread?: number;
  threadsTotal?: number;
  threadsUnread?: number;
}

// Microsoft-specific interfaces
export interface OneDriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: number;
  lastModifiedDateTime: string;
  webUrl?: string;
  downloadUrl?: string;
}

export interface OutlookMessage {
  id: string;
  subject: string;
  body: {
    content: string;
    contentType: string;
  };
  from: {
    emailAddress: {
      address: string;
      name: string;
    };
  };
  receivedDateTime: string;
  isRead: boolean;
  hasAttachments: boolean;
}

export interface TeamsMeeting {
  id: string;
  subject: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  joinUrl?: string;
  organizer: {
    emailAddress: {
      address: string;
      name: string;
    };
  };
}

class IntegrationService {
  private async getAuthToken() {
    try {
      // Get current Firebase user
      const user = auth.currentUser;
      if (user) {
        // Get fresh token (automatically refreshes if expired)
        const freshToken = await user.getIdToken();
        localStorage.setItem('token', freshToken);
        return freshToken;
      }

      // Fallback to stored token
      return localStorage.getItem('token') || '';
    } catch (error) {
      console.error('Error getting auth token:', error);
      return localStorage.getItem('token') || '';
    }
  }

  private async getAuthHeaders() {
    const token = await this.getAuthToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async getIntegrations(): Promise<Integration[]> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await axios.get('/api/integrations', {
        headers
      });
      // Handle both response formats
      const data = response.data as any;
      if (data.success && data.data) {
        return data.data;
      }
      return data;
    } catch (error) {
      console.error('Error fetching integrations:', error);
      throw error;
    }
  }

  async connectGoogle(types: string[]): Promise<{ authUrl: string }> {
    try {
      const response = await axios.post(
        '/api/integrations/google/connect',
        { types },
        { headers: await this.getAuthHeaders() }
      );
      // Handle both response formats
      const data = response.data as any;
      if (data.success && data.data) {
        return data.data;
      }
      return data;
    } catch (error) {
      console.error('Error connecting to Google:', error);
      throw error;
    }
  }

  async connectMicrosoft(types: string[]): Promise<{ authUrl: string }> {
    try {
      const response = await axios.post(
        '/api/integrations/microsoft/connect',
        { types },
        { headers: await this.getAuthHeaders() }
      );
      // Handle both response formats
      const data = response.data as any;
      if (data.success && data.data) {
        return data.data;
      }
      return data;
    } catch (error) {
      console.error('Error connecting to Microsoft:', error);
      throw error;
    }
  }

  async connectApollo(scopes?: string[]): Promise<{ authUrl: string }> {
    try {
      const response = await axios.post(
        '/api/integrations/apollo/connect',
        { scopes },
        { headers: await this.getAuthHeaders() }
      );
      // Handle both response formats
      const data = response.data as any;
      if (data.success && data.data) {
        return data.data;
      }
      return data;
    } catch (error) {
      console.error('Error connecting to Apollo:', error);
      throw error;
    }
  }

  async disconnectIntegration(integrationId: string): Promise<void> {
    try {
      await axios.delete(`/api/integrations/${integrationId}`, {
        headers: await this.getAuthHeaders()
      });
    } catch (error) {
      console.error('Error disconnecting integration:', error);
      throw error;
    }
  }

  async getDriveFiles(): Promise<DriveFile[]> {
    try {
      const response = await axios.get(`/api/integrations/google/drive/files`, {
        headers: await this.getAuthHeaders()
      });
      return (response.data as { data: DriveFile[] }).data;
    } catch (error) {
      console.error('Error fetching Drive files:', error);
      throw error;
    }
  }

  async getDriveFolders(): Promise<DriveFile[]> {
    try {
      const response = await axios.get(`/api/integrations/google/drive/folders`, {
        headers: await this.getAuthHeaders()
      });
      return (response.data as { data: DriveFile[] }).data;
    } catch (error) {
      console.error('Error fetching Drive folders:', error);
      throw error;
    }
  }

  async getCalendarEvents(timeMin?: string, timeMax?: string): Promise<CalendarEvent[]> {
    try {
      const params = new URLSearchParams();
      if (timeMin) params.append('timeMin', timeMin);
      if (timeMax) params.append('timeMax', timeMax);
      
      const response = await axios.get(
        `/api/integrations/google/calendar/events?${params}`,
        { headers: await this.getAuthHeaders() }
      );
      return (response.data as { data: CalendarEvent[] }).data;
    } catch (error) {
      console.error('Error fetching Calendar events:', error);
      throw error;
    }
  }

  async createCalendarEvent(eventData: {
    summary: string;
    description?: string;
    start: {
      dateTime: string;
      timeZone?: string;
    };
    end: {
      dateTime: string;
      timeZone?: string;
    };
    attendees?: Array<{ email: string }>;
    location?: string;
    createMeetLink?: boolean;
  }): Promise<CalendarEvent> {
    try {
      const response = await axios.post(
        `/api/integrations/google/calendar/events`,
        eventData,
        { headers: await this.getAuthHeaders() }
      );
      return (response.data as { data: CalendarEvent }).data;
    } catch (error) {
      console.error('Error creating Calendar event:', error);
      throw error;
    }
  }

  getFileIcon(mimeType: string): string {
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

    return '📄';
  }

  formatFileSize(bytes?: string): string {
    if (!bytes) return '';
    
    const size = parseInt(bytes);
    const units = ['B', 'KB', 'MB', 'GB'];
    let unitIndex = 0;
    let fileSize = size;

    while (fileSize >= 1024 && unitIndex < units.length - 1) {
      fileSize /= 1024;
      unitIndex++;
    }

    return `${fileSize.toFixed(1)} ${units[unitIndex]}`;
  }

  formatEventTime(event: CalendarEvent): string {
    if (event.start.dateTime) {
      const start = new Date(event.start.dateTime);
      const end = new Date(event.end.dateTime!);
      return `${start.toLocaleTimeString()} - ${end.toLocaleTimeString()}`;
    } else if (event.start.date) {
      return 'All day';
    }
    return 'Time not specified';
  }

  // Gmail methods
  async getGmailMessages(options: {
    q?: string;
    labelIds?: string;
    maxResults?: number;
    pageToken?: string;
  } = {}): Promise<{ messages: GmailMessage[]; nextPageToken?: string; resultSizeEstimate: number }> {
    try {
      const params = new URLSearchParams();
      if (options.q) params.append('q', options.q);
      if (options.labelIds) params.append('labelIds', options.labelIds);
      if (options.maxResults) params.append('maxResults', options.maxResults.toString());
      if (options.pageToken) params.append('pageToken', options.pageToken);

      const response = await axios.get(
        `/api/integrations/google/gmail/messages?${params}`,
        { headers: await this.getAuthHeaders() }
      );
      return (response.data as { data: { messages: GmailMessage[]; nextPageToken?: string; resultSizeEstimate: number } }).data;
    } catch (error) {
      console.error('Error fetching Gmail messages:', error);
      throw error;
    }
  }

  async sendGmailEmail(emailData: {
    to: string | string[];
    cc?: string | string[];
    bcc?: string | string[];
    subject: string;
    body: string;
    isHtml?: boolean;
    replyTo?: string;
    threadId?: string;
  }): Promise<GmailMessage> {
    try {
      const response = await axios.post(
        `/api/integrations/google/gmail/send`,
        emailData,
        { headers: await this.getAuthHeaders() }
      );
      return (response.data as { data: GmailMessage }).data;
    } catch (error) {
      console.error('Error sending Gmail email:', error);
      throw error;
    }
  }

  async getGmailLabels(): Promise<GmailLabel[]> {
    try {
      const response = await axios.get(
        `/api/integrations/google/gmail/labels`,
        { headers: await this.getAuthHeaders() }
      );
      return (response.data as { data: GmailLabel[] }).data;
    } catch (error) {
      console.error('Error fetching Gmail labels:', error);
      throw error;
    }
  }

  async markGmailAsRead(messageId: string): Promise<void> {
    try {
      await axios.post(
        `/api/integrations/google/gmail/messages/${messageId}/read`,
        {},
        { headers: await this.getAuthHeaders() }
      );
    } catch (error) {
      console.error('Error marking Gmail message as read:', error);
      throw error;
    }
  }

  // Microsoft-specific methods
  async getOneDriveFiles(): Promise<OneDriveFile[]> {
    try {
      const response = await axios.get('/api/integrations/microsoft/onedrive/files', {
        headers: await this.getAuthHeaders()
      });
      return (response.data as { data: OneDriveFile[] }).data;
    } catch (error) {
      console.error('Error fetching OneDrive files:', error);
      throw error;
    }
  }

  async getOneDriveFolders(): Promise<OneDriveFile[]> {
    try {
      const response = await axios.get('/api/integrations/microsoft/onedrive/folders', {
        headers: await this.getAuthHeaders()
      });
      return (response.data as { data: OneDriveFile[] }).data;
    } catch (error) {
      console.error('Error fetching OneDrive folders:', error);
      throw error;
    }
  }

  async getOutlookMessages(options: {
    maxResults?: number;
    filter?: string;
  } = {}): Promise<OutlookMessage[]> {
    try {
      const params = new URLSearchParams();
      if (options.maxResults) params.append('maxResults', options.maxResults.toString());
      if (options.filter) params.append('filter', options.filter);

      const response = await axios.get(
        `/api/integrations/microsoft/outlook/messages?${params}`,
        { headers: await this.getAuthHeaders() }
      );
      return (response.data as { data: OutlookMessage[] }).data;
    } catch (error) {
      console.error('Error fetching Outlook messages:', error);
      throw error;
    }
  }

  async sendOutlookEmail(emailData: {
    to: string | string[];
    cc?: string | string[];
    bcc?: string | string[];
    subject: string;
    body: string;
    isHtml?: boolean;
  }): Promise<OutlookMessage> {
    try {
      const response = await axios.post(
        '/api/integrations/microsoft/outlook/send',
        emailData,
        { headers: await this.getAuthHeaders() }
      );
      return (response.data as { data: OutlookMessage }).data;
    } catch (error) {
      console.error('Error sending Outlook email:', error);
      throw error;
    }
  }

  async markOutlookAsRead(messageId: string): Promise<void> {
    try {
      await axios.post(
        `/api/integrations/microsoft/outlook/messages/${messageId}/read`,
        {},
        { headers: await this.getAuthHeaders() }
      );
    } catch (error) {
      console.error('Error marking Outlook message as read:', error);
      throw error;
    }
  }

  async getTeamsMeetings(options: {
    startTime?: string;
    endTime?: string;
  } = {}): Promise<TeamsMeeting[]> {
    try {
      const params = new URLSearchParams();
      if (options.startTime) params.append('startTime', options.startTime);
      if (options.endTime) params.append('endTime', options.endTime);

      const response = await axios.get(
        `/api/integrations/microsoft/teams/meetings?${params}`,
        { headers: await this.getAuthHeaders() }
      );
      return (response.data as { data: TeamsMeeting[] }).data;
    } catch (error) {
      console.error('Error fetching Teams meetings:', error);
      throw error;
    }
  }

  async createTeamsMeeting(meetingData: {
    subject: string;
    start: {
      dateTime: string;
      timeZone: string;
    };
    end: {
      dateTime: string;
      timeZone: string;
    };
    attendees?: Array<{ email: string }>;
  }): Promise<TeamsMeeting> {
    try {
      const response = await axios.post(
        '/api/integrations/microsoft/teams/meetings',
        meetingData,
        { headers: await this.getAuthHeaders() }
      );
      return (response.data as { data: TeamsMeeting }).data;
    } catch (error) {
      console.error('Error creating Teams meeting:', error);
      throw error;
    }
  }

  // Utility methods for Microsoft
  getMicrosoftFileIcon(mimeType: string): string {
    const iconMap: { [key: string]: string } = {
      'application/vnd.ms-excel': '📊',
      'application/vnd.ms-powerpoint': '📽️',
      'application/vnd.ms-word': '📄',
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

    return '📄';
  }

  formatMicrosoftFileSize(bytes?: number): string {
    if (!bytes) return '';
    
    const units = ['B', 'KB', 'MB', 'GB'];
    let unitIndex = 0;
    let fileSize = bytes;

    while (fileSize >= 1024 && unitIndex < units.length - 1) {
      fileSize /= 1024;
      unitIndex++;
    }

    return `${fileSize.toFixed(1)} ${units[unitIndex]}`;
  }

  formatTeamsMeetingTime(meeting: TeamsMeeting): string {
    const start = new Date(meeting.start.dateTime);
    const end = new Date(meeting.end.dateTime);
    return `${start.toLocaleTimeString()} - ${end.toLocaleTimeString()}`;
  }

  // Get deal-related Outlook emails
  async getDealRelatedOutlookEmails(maxResults: number = 50): Promise<any[]> {
    try {
      const response = await axios.get(
        `/api/integrations/microsoft/outlook/deals?maxResults=${maxResults}`,
        { headers: await this.getAuthHeaders() }
      );
      return (response.data as { data: { emails: any[] } }).data.emails || [];
    } catch (error) {
      console.error('Error fetching deal-related Outlook emails:', error);
      throw error;
    }
  }
}

export default new IntegrationService();