// @ts-nocheck
import axios from 'axios';
import logger from '../utils/logger';

export interface MicrosoftCalendarEvent {
  id: string;
  subject: string;
  body?: {
    contentType: string;
    content: string;
  };
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  location?: {
    displayName: string;
  };
  attendees?: Array<{
    emailAddress: {
      address: string;
      name?: string;
    };
    status: {
      response: string;
      time: string;
    };
  }>;
  organizer?: {
    emailAddress: {
      address: string;
      name?: string;
    };
  };
  isOnlineMeeting?: boolean;
  onlineMeeting?: {
    joinUrl: string;
  };
  createdDateTime: string;
  lastModifiedDateTime: string;
}

export interface CreateEventData {
  subject: string;
  body?: {
    contentType: 'HTML' | 'text';
    content: string;
  };
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  location?: {
    displayName: string;
  };
  attendees?: Array<{
    emailAddress: {
      address: string;
      name?: string;
    };
    type: 'required' | 'optional' | 'resource';
  }>;
  isOnlineMeeting?: boolean;
}

export interface ListEventsOptions {
  timeMin?: string;
  timeMax?: string;
  top?: number;
  filter?: string;
  orderby?: string;
}

export class MicrosoftCalendarService {
  private static readonly BASE_URL = 'https://graph.microsoft.com/v1.0/me';

  /**
   * List calendar events
   */
  static async listEvents(
    accessToken: string,
    options: ListEventsOptions = {}
  ): Promise<MicrosoftCalendarEvent[]> {
    try {
      const { timeMin, timeMax, top = 50, filter, orderby } = options;

      const params = new URLSearchParams();
      if (top) params.append('$top', top.toString());
      if (orderby) params.append('$orderby', orderby);

      // Build filter conditions
      const filters = [];
      if (timeMin) filters.push(`start/dateTime ge '${timeMin}'`);
      if (timeMax) filters.push(`end/dateTime le '${timeMax}'`);
      if (filter) filters.push(filter);

      if (filters.length > 0) {
        params.append('$filter', filters.join(' and '));
      }

      const url = `${this.BASE_URL}/events${params.toString() ? '?' + params.toString() : ''}`;

      const response = await axios.get(url, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data.value || [];
    } catch (error: any) {
      logger.error('Microsoft Calendar list events error:', error.response?.data || error);
      throw new Error('Failed to fetch calendar events from Microsoft Graph');
    }
  }

  /**
   * Get a specific calendar event
   */
  static async getEvent(accessToken: string, eventId: string): Promise<MicrosoftCalendarEvent> {
    try {
      const response = await axios.get(`${this.BASE_URL}/events/${eventId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data;
    } catch (error: any) {
      logger.error('Microsoft Calendar get event error:', error.response?.data || error);
      throw new Error('Failed to fetch calendar event from Microsoft Graph');
    }
  }

  /**
   * Create a new calendar event
   */
  static async createEvent(
    accessToken: string,
    eventData: CreateEventData
  ): Promise<MicrosoftCalendarEvent> {
    try {
      const response = await axios.post(`${this.BASE_URL}/events`, eventData, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data;
    } catch (error: any) {
      logger.error('Microsoft Calendar create event error:', error.response?.data || error);
      throw new Error('Failed to create calendar event in Microsoft Graph');
    }
  }

  /**
   * Update a calendar event
   */
  static async updateEvent(
    accessToken: string,
    eventId: string,
    eventData: Partial<CreateEventData>
  ): Promise<MicrosoftCalendarEvent> {
    try {
      const response = await axios.patch(`${this.BASE_URL}/events/${eventId}`, eventData, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data;
    } catch (error: any) {
      logger.error('Microsoft Calendar update event error:', error.response?.data || error);
      throw new Error('Failed to update calendar event in Microsoft Graph');
    }
  }

  /**
   * Delete a calendar event
   */
  static async deleteEvent(accessToken: string, eventId: string): Promise<void> {
    try {
      await axios.delete(`${this.BASE_URL}/events/${eventId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
    } catch (error: any) {
      logger.error('Microsoft Calendar delete event error:', error.response?.data || error);
      throw new Error('Failed to delete calendar event from Microsoft Graph');
    }
  }

  /**
   * List calendars
   */
  static async listCalendars(accessToken: string): Promise<any[]> {
    try {
      const response = await axios.get(`${this.BASE_URL}/calendars`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data.value || [];
    } catch (error: any) {
      logger.error('Microsoft Calendar list calendars error:', error.response?.data || error);
      throw new Error('Failed to fetch calendars from Microsoft Graph');
    }
  }
}

export default MicrosoftCalendarService;