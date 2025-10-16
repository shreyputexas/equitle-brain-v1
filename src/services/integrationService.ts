import axios from 'axios';

export interface Integration {
  id: string;
  provider: 'google';
  type: 'drive' | 'calendar' | 'profile' | 'gmail' | 'meet';
  isActive: boolean;
  profile: {
    email: string;
    name: string;
    picture?: string;
  };
  scope: string;
  createdAt: string;
  updatedAt: string;
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

class IntegrationService {
  private getAuthToken() {
    // Get token from localStorage (set by AuthContext)
    return localStorage.getItem('token') || '';
  }

  private getAuthHeaders() {
    const token = this.getAuthToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async getIntegrations(): Promise<Integration[]> {
    try {
      const response = await axios.get('/api/integrations', {
        headers: this.getAuthHeaders()
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
        { headers: this.getAuthHeaders() }
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

  async disconnectIntegration(integrationId: string): Promise<void> {
    try {
      await axios.delete(`/api/integrations/${integrationId}`, {
        headers: this.getAuthHeaders()
      });
    } catch (error) {
      console.error('Error disconnecting integration:', error);
      throw error;
    }
  }

  async getDriveFiles(): Promise<DriveFile[]> {
    try {
      const response = await axios.get(`/api/integrations/google/drive/files`, {
        headers: this.getAuthHeaders()
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
        headers: this.getAuthHeaders()
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
        { headers: this.getAuthHeaders() }
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
        { headers: this.getAuthHeaders() }
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
        { headers: this.getAuthHeaders() }
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
        { headers: this.getAuthHeaders() }
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
        { headers: this.getAuthHeaders() }
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
        { headers: this.getAuthHeaders() }
      );
    } catch (error) {
      console.error('Error marking Gmail message as read:', error);
      throw error;
    }
  }
}

export default new IntegrationService();