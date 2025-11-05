// @ts-nocheck
import axios from 'axios';
import logger from '../utils/logger';

export interface ZoomMeeting {
  uuid: string;
  id: number;
  host_id: string;
  host_email: string;
  topic: string;
  type: number;
  status: string;
  start_time: string;
  duration: number;
  timezone: string;
  agenda: string;
  created_at: string;
  start_url: string;
  join_url: string;
  password: string;
  h323_password: string;
  pstn_password: string;
  encrypted_password: string;
  settings: {
    host_video: boolean;
    participant_video: boolean;
    cn_meeting: boolean;
    in_meeting: boolean;
    join_before_host: boolean;
    jbh_time: number;
    mute_upon_entry: boolean;
    watermark: boolean;
    use_pmi: boolean;
    approval_type: number;
    audio: string;
    auto_recording: string;
    enforce_login: boolean;
    enforce_login_domains: string;
    alternative_hosts: string;
    close_registration: boolean;
    show_share_button: boolean;
    allow_multiple_devices: boolean;
    registrants_confirmation_email: boolean;
    waiting_room: boolean;
    request_permission_to_unmute_participants: boolean;
    global_dial_in_countries: string[];
    global_dial_in_numbers: Array<{
      country: string;
      country_name: string;
      city: string;
      number: string;
      type: string;
    }>;
    registrants_email_notification: boolean;
    meeting_authentication: boolean;
    encryption_type: string;
    approved_or_denied_countries_or_regions: {
      enable: boolean;
      method: string;
      approved_list: string[];
      denied_list: string[];
    };
    breakout_room: {
      enable: boolean;
      rooms: Array<{
        name: string;
        participants: string[];
      }>;
    };
    device_testing: boolean;
    focus_mode: boolean;
    private_meeting: boolean;
    email_notification: boolean;
    host_save_video_order: boolean;
    sign_language_interpretation: {
      enable: boolean;
      interpreters: Array<{
        email: string;
        languages: string;
      }>;
    };
    email_in_attendee_report: boolean;
  };
  pre_schedule: boolean;
}

export interface CreateMeetingData {
  topic: string;
  type?: number;
  start_time?: string;
  duration?: number;
  timezone?: string;
  password?: string;
  agenda?: string;
  recurrence?: {
    type: number;
    repeat_interval: number;
    weekly_days?: string;
    monthly_day?: number;
    monthly_week?: number;
    monthly_week_day?: number;
    end_times?: number;
    end_date_time?: string;
  };
  settings?: {
    host_video?: boolean;
    participant_video?: boolean;
    cn_meeting?: boolean;
    in_meeting?: boolean;
    join_before_host?: boolean;
    mute_upon_entry?: boolean;
    watermark?: boolean;
    use_pmi?: boolean;
    approval_type?: number;
    audio?: string;
    auto_recording?: string;
    enforce_login?: boolean;
    enforce_login_domains?: string;
    alternative_hosts?: string;
    close_registration?: boolean;
    show_share_button?: boolean;
    allow_multiple_devices?: boolean;
    registrants_confirmation_email?: boolean;
    waiting_room?: boolean;
    request_permission_to_unmute_participants?: boolean;
    registrants_email_notification?: boolean;
    meeting_authentication?: boolean;
    encryption_type?: string;
  };
}

export interface ZoomRecording {
  uuid: string;
  id: number;
  account_id: string;
  host_id: string;
  topic: string;
  type: number;
  start_time: string;
  timezone: string;
  duration: number;
  total_size: number;
  recording_count: number;
  share_url: string;
  recording_files: Array<{
    id: string;
    meeting_id: string;
    recording_start: string;
    recording_end: string;
    file_type: string;
    file_extension: string;
    file_size: number;
    play_url: string;
    download_url: string;
    status: string;
    deleted_time: string;
    recording_type: string;
  }>;
  password: string;
  recording_play_passcode: string;
}

export interface ZoomParticipant {
  id: string;
  user_id: string;
  name: string;
  user_email: string;
  join_time: string;
  leave_time: string;
  duration: number;
  attentiveness_score: string;
  failover: boolean;
  status: string;
  customer_key: string;
  registrant_id: string;
}

export interface ListMeetingsOptions {
  type?: 'scheduled' | 'live' | 'upcoming' | 'upcoming_meetings' | 'previous_meetings';
  page_size?: number;
  next_page_token?: string;
  from?: string;
  to?: string;
}

export class ZoomMeetingsService {
  private static readonly API_BASE_URL = 'https://api.zoom.us/v2';

  /**
   * List user's meetings
   */
  static async listMeetings(
    accessToken: string,
    userId: string = 'me',
    options: ListMeetingsOptions = {}
  ): Promise<{ meetings: ZoomMeeting[]; next_page_token?: string; page_count: number; page_size: number; total_records: number }> {
    try {
      const { type = 'scheduled', page_size = 30, next_page_token, from, to } = options;

      const params: any = {
        type,
        page_size
      };

      if (next_page_token) params.next_page_token = next_page_token;
      if (from) params.from = from;
      if (to) params.to = to;

      const response = await axios.get(`${this.API_BASE_URL}/users/${userId}/meetings`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        params
      });

      return response.data;
    } catch (error: any) {
      logger.error('Zoom list meetings error:', error.response?.data || error);
      throw new Error('Failed to fetch meetings from Zoom');
    }
  }

  /**
   * Get meeting details
   */
  static async getMeeting(accessToken: string, meetingId: string): Promise<ZoomMeeting> {
    try {
      const response = await axios.get(`${this.API_BASE_URL}/meetings/${meetingId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data;
    } catch (error: any) {
      logger.error('Zoom get meeting error:', error.response?.data || error);
      throw new Error('Failed to fetch meeting from Zoom');
    }
  }

  /**
   * Create a new meeting
   */
  static async createMeeting(
    accessToken: string,
    meetingData: CreateMeetingData,
    userId: string = 'me'
  ): Promise<ZoomMeeting> {
    try {
      const response = await axios.post(`${this.API_BASE_URL}/users/${userId}/meetings`, meetingData, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data;
    } catch (error: any) {
      logger.error('Zoom create meeting error:', error.response?.data || error);
      throw new Error('Failed to create meeting in Zoom');
    }
  }

  /**
   * Update a meeting
   */
  static async updateMeeting(
    accessToken: string,
    meetingId: string,
    meetingData: Partial<CreateMeetingData>
  ): Promise<void> {
    try {
      await axios.patch(`${this.API_BASE_URL}/meetings/${meetingId}`, meetingData, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
    } catch (error: any) {
      logger.error('Zoom update meeting error:', error.response?.data || error);
      throw new Error('Failed to update meeting in Zoom');
    }
  }

  /**
   * Delete a meeting
   */
  static async deleteMeeting(accessToken: string, meetingId: string): Promise<void> {
    try {
      await axios.delete(`${this.API_BASE_URL}/meetings/${meetingId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
    } catch (error: any) {
      logger.error('Zoom delete meeting error:', error.response?.data || error);
      throw new Error('Failed to delete meeting from Zoom');
    }
  }

  /**
   * Get meeting participants
   */
  static async getMeetingParticipants(
    accessToken: string,
    meetingUuid: string,
    page_size: number = 30,
    next_page_token?: string
  ): Promise<{ participants: ZoomParticipant[]; next_page_token?: string; page_count: number; page_size: number; total_records: number }> {
    try {
      const params: any = { page_size };
      if (next_page_token) params.next_page_token = next_page_token;

      const response = await axios.get(`${this.API_BASE_URL}/report/meetings/${meetingUuid}/participants`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        params
      });

      return response.data;
    } catch (error: any) {
      logger.error('Zoom get meeting participants error:', error.response?.data || error);
      throw new Error('Failed to fetch meeting participants from Zoom');
    }
  }

  /**
   * List recordings
   */
  static async listRecordings(
    accessToken: string,
    userId: string = 'me',
    from?: string,
    to?: string,
    page_size: number = 30,
    next_page_token?: string
  ): Promise<{ meetings: ZoomRecording[]; next_page_token?: string; page_count: number; page_size: number; total_records: number }> {
    try {
      const params: any = { page_size };
      if (from) params.from = from;
      if (to) params.to = to;
      if (next_page_token) params.next_page_token = next_page_token;

      const response = await axios.get(`${this.API_BASE_URL}/users/${userId}/recordings`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        params
      });

      return response.data;
    } catch (error: any) {
      logger.error('Zoom list recordings error:', error.response?.data || error);
      throw new Error('Failed to fetch recordings from Zoom');
    }
  }

  /**
   * Get recording details
   */
  static async getRecording(accessToken: string, meetingId: string): Promise<ZoomRecording> {
    try {
      const response = await axios.get(`${this.API_BASE_URL}/meetings/${meetingId}/recordings`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data;
    } catch (error: any) {
      logger.error('Zoom get recording error:', error.response?.data || error);
      throw new Error('Failed to fetch recording from Zoom');
    }
  }

  /**
   * Delete recording
   */
  static async deleteRecording(accessToken: string, meetingId: string): Promise<void> {
    try {
      await axios.delete(`${this.API_BASE_URL}/meetings/${meetingId}/recordings`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
    } catch (error: any) {
      logger.error('Zoom delete recording error:', error.response?.data || error);
      throw new Error('Failed to delete recording from Zoom');
    }
  }

  /**
   * Start meeting recording
   */
  static async startRecording(accessToken: string, meetingId: string): Promise<void> {
    try {
      await axios.patch(`${this.API_BASE_URL}/meetings/${meetingId}/recordings/status`, {
        action: 'start'
      }, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
    } catch (error: any) {
      logger.error('Zoom start recording error:', error.response?.data || error);
      throw new Error('Failed to start recording in Zoom');
    }
  }

  /**
   * Stop meeting recording
   */
  static async stopRecording(accessToken: string, meetingId: string): Promise<void> {
    try {
      await axios.patch(`${this.API_BASE_URL}/meetings/${meetingId}/recordings/status`, {
        action: 'stop'
      }, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
    } catch (error: any) {
      logger.error('Zoom stop recording error:', error.response?.data || error);
      throw new Error('Failed to stop recording in Zoom');
    }
  }
}

export default ZoomMeetingsService;