import { google } from 'googleapis';
import GoogleAuthService from './googleAuth';
import logger from '../utils/logger';

export interface CalendarEvent {
  conferenceData: any;
  id: string;
  summary: string;
  description?: string | null;
  start: {
    dateTime?: string | null;
    date?: string | null;
    timeZone?: string | null;
  };
  end: {
    dateTime?: string | null;
    date?: string | null;
    timeZone?: string | null;
  };
  attendees?: Array<{
    email: string;
    displayName?: string | null;
    responseStatus?: string | null;
  }>;
  location?: string | null;
  status: string;
  created: string;
  updated: string;
  htmlLink: string;
  organizer: {
    email: string;
    displayName?: string | null;
  };
}

export interface CreateEventData {
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
  attendees?: Array<{
    email: string;
  }>;
  location?: string;
  reminders?: {
    useDefault: boolean;
    overrides?: Array<{
      method: 'email' | 'popup';
      minutes: number;
    }>;
  };
  conferenceData?: {
    createRequest?: {
      requestId: string;
      conferenceSolutionKey?: {
        type: 'hangoutsMeet';
      };
    };
  };
}

export interface Calendar {
  id: string;
  summary: string;
  description?: string | null;
  primary?: boolean | null;
  accessRole: string;
  backgroundColor?: string | null;
}

export class GoogleCalendarService {
  static async listCalendars(accessToken: string): Promise<Calendar[]> {
    try {
      const auth = GoogleAuthService.createAuthenticatedClient(accessToken);
      const calendar = google.calendar({ version: 'v3', auth });

      const response = await calendar.calendarList.list();

      return response.data.items?.map(cal => ({
        id: cal.id!,
        summary: cal.summary!,
        description: cal.description,
        primary: cal.primary,
        accessRole: cal.accessRole!,
        backgroundColor: cal.backgroundColor
      })) || [];
    } catch (error) {
      logger.error('Error listing calendars:', error);
      throw new Error('Failed to list calendars');
    }
  }

  static async listEvents(accessToken: string, options: {
    calendarId?: string;
    timeMin?: string;
    timeMax?: string;
    maxResults?: number;
    orderBy?: string;
  } = {}): Promise<CalendarEvent[]> {
    try {
      const auth = GoogleAuthService.createAuthenticatedClient(accessToken);
      const calendar = google.calendar({ version: 'v3', auth });

      const {
        calendarId = 'primary',
        timeMin = new Date().toISOString(),
        timeMax,
        maxResults = 50,
        orderBy = 'startTime'
      } = options;

      const response = await calendar.events.list({
        calendarId,
        timeMin,
        timeMax,
        maxResults,
        singleEvents: true,
        orderBy,
      });

      return response.data.items?.map(event => ({
        id: event.id!,
        summary: event.summary || 'No title',
        description: event.description,
        conferenceData: event.conferenceData,
        start: {
          dateTime: event.start?.dateTime,
          date: event.start?.date,
          timeZone: event.start?.timeZone
        },
        end: {
          dateTime: event.end?.dateTime,
          date: event.end?.date,
          timeZone: event.end?.timeZone
        },
        attendees: event.attendees?.map(attendee => ({
          email: attendee.email!,
          displayName: attendee.displayName,
          responseStatus: attendee.responseStatus
        })),
        location: event.location,
        status: event.status!,
        created: event.created!,
        updated: event.updated!,
        htmlLink: event.htmlLink!,
        organizer: {
          email: event.organizer?.email!,
          displayName: event.organizer?.displayName
        }
      })) || [];
    } catch (error) {
      logger.error('Error listing calendar events:', error);
      throw new Error('Failed to list calendar events');
    }
  }

  static async createEvent(accessToken: string, eventData: CreateEventData, calendarId: string = 'primary'): Promise<CalendarEvent> {
    try {
      const auth = GoogleAuthService.createAuthenticatedClient(accessToken);
      const calendar = google.calendar({ version: 'v3', auth });

      const response = await calendar.events.insert({
        calendarId,
        conferenceDataVersion: eventData.conferenceData ? 1 : 0,
        requestBody: eventData,
      });
      const event = response.data;
      return {
        id: event.id!,
        summary: event.summary || 'No title',
        description: event.description,
        conferenceData: event.conferenceData,
        start: {
          date: event.start?.date,
          timeZone: event.start?.timeZone
        },
        end: {
          dateTime: event.end?.dateTime,
          date: event.end?.date,
          timeZone: event.end?.timeZone
        },
        attendees: event.attendees?.map(attendee => ({
          email: attendee.email!,
          displayName: attendee.displayName,
          responseStatus: attendee.responseStatus
        })),
        location: event.location,
        status: event.status!,
        created: event.created!,
        updated: event.updated!,
        htmlLink: event.htmlLink!,
        organizer: {
          email: event.organizer?.email!,
          displayName: event.organizer?.displayName
        }
      };
    } catch (error) {
      logger.error('Error creating calendar event:', error);
      throw new Error('Failed to create calendar event');
    }
  }

  static async updateEvent(accessToken: string, eventId: string, eventData: Partial<CreateEventData>, calendarId: string = 'primary'): Promise<CalendarEvent> {
    try {
      const auth = GoogleAuthService.createAuthenticatedClient(accessToken);
      const calendar = google.calendar({ version: 'v3', auth });

      const response = await calendar.events.patch({
        calendarId,
        eventId,
        requestBody: eventData,
      });
      const event = response.data;
      return {
        id: event.id!,
        summary: event.summary || 'No title',
        description: event.description,
        conferenceData: event.conferenceData,
        start: {
          dateTime: event.start?.dateTime,
          date: event.start?.date,
          timeZone: event.start?.timeZone
        },
        end: {
          dateTime: event.end?.dateTime,
          date: event.end?.date,
          timeZone: event.end?.timeZone
        },
        attendees: event.attendees?.map(attendee => ({
          email: attendee.email!,
          displayName: attendee.displayName,
          responseStatus: attendee.responseStatus
        })),
        location: event.location,
        status: event.status!,
        created: event.created!,
        updated: event.updated!,
        htmlLink: event.htmlLink!,
        organizer: {
          email: event.organizer?.email!,
          displayName: event.organizer?.displayName
        }
      };
    } catch (error) {
      logger.error('Error updating calendar event:', error);
      throw new Error('Failed to update calendar event');
    }
  }

  static async deleteEvent(accessToken: string, eventId: string, calendarId: string = 'primary'): Promise<void> {
    try {
      const auth = GoogleAuthService.createAuthenticatedClient(accessToken);
      const calendar = google.calendar({ version: 'v3', auth });

      await calendar.events.delete({
        calendarId,
        eventId,
      });
    } catch (error) {
      logger.error('Error deleting calendar event:', error);
      throw new Error('Failed to delete calendar event');
    }
  }

  static async getTodaysEvents(accessToken: string): Promise<CalendarEvent[]> {
    const today = new Date();
    const timeMin = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
    const timeMax = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString();

    return this.listEvents(accessToken, { timeMin, timeMax });
  }

  static async getUpcomingEvents(accessToken: string, days: number = 7): Promise<CalendarEvent[]> {
    const timeMin = new Date().toISOString();
    const timeMax = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

    return this.listEvents(accessToken, { timeMin, timeMax });
  }

  static formatEventTime(event: CalendarEvent): string {
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

export default GoogleCalendarService;