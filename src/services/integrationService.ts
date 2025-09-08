import axios from 'axios';

const API_BASE_URL = 'http://localhost:4001/api';

export interface Integration {
  id: string;
  provider: 'google';
  type: 'drive' | 'calendar' | 'profile';
  isActive: boolean;
  profile: {
    email: string;
    name: string;
    picture?: string;
  };
  scope: string[];
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
}

class IntegrationService {
  private getAuthToken() {
    return localStorage.getItem('token');
  }

  private getAuthHeaders() {
    const token = this.getAuthToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async getIntegrations(): Promise<Integration[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/integrations`, {
        headers: this.getAuthHeaders()
      });
      return (response.data as { data: Integration[] }).data;
    } catch (error) {
      console.error('Error fetching integrations:', error);
      throw error;
    }
  }

  async connectGoogle(types: string[]): Promise<{ authUrl: string }> {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/integrations/google/connect`,
        { types },
        { headers: this.getAuthHeaders() }
      );
      return (response.data as { data: { authUrl: string } }).data;
    } catch (error) {
      console.error('Error connecting to Google:', error);
      throw error;
    }
  }

  async disconnectIntegration(integrationId: string): Promise<void> {
    try {
      await axios.delete(`${API_BASE_URL}/integrations/${integrationId}`, {
        headers: this.getAuthHeaders()
      });
    } catch (error) {
      console.error('Error disconnecting integration:', error);
      throw error;
    }
  }

  async getDriveFiles(): Promise<DriveFile[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/integrations/google/drive/files`, {
        headers: this.getAuthHeaders()
      });
      return (response.data as { data: DriveFile[] }).data;
    } catch (error) {
      console.error('Error fetching Drive files:', error);
      throw error;
    }
  }

  async getCalendarEvents(timeMin?: string, timeMax?: string): Promise<CalendarEvent[]> {
    try {
      const params = new URLSearchParams();
      if (timeMin) params.append('timeMin', timeMin);
      if (timeMax) params.append('timeMax', timeMax);
      
      const response = await axios.get(
        `${API_BASE_URL}/integrations/google/calendar/events?${params}`,
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
  }): Promise<CalendarEvent> {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/integrations/google/calendar/events`,
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
}

export default new IntegrationService();