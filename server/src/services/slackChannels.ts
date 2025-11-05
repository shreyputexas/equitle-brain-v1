// @ts-nocheck
import axios from 'axios';
import logger from '../utils/logger';

export interface SlackChannel {
  id: string;
  name: string;
  is_channel: boolean;
  is_group: boolean;
  is_im: boolean;
  is_mpim: boolean;
  is_private: boolean;
  created: number;
  is_archived: boolean;
  is_general: boolean;
  unlinked: number;
  name_normalized: string;
  is_shared: boolean;
  is_org_shared: boolean;
  is_member: boolean;
  is_pending_ext_shared: boolean;
  pending_shared: string[];
  context_team_id: string;
  updated: number;
  parent_conversation?: string;
  creator: string;
  is_ext_shared: boolean;
  shared_team_ids: string[];
  pending_connected_team_ids: string[];
  is_pending_ext_shared_invite: boolean;
  topic: {
    value: string;
    creator: string;
    last_set: number;
  };
  purpose: {
    value: string;
    creator: string;
    last_set: number;
  };
  num_members?: number;
}

export interface SlackMessage {
  type: string;
  subtype?: string;
  text: string;
  user?: string;
  username?: string;
  bot_id?: string;
  ts: string;
  thread_ts?: string;
  reply_count?: number;
  reply_users_count?: number;
  latest_reply?: string;
  reply_users?: string[];
  subscribed?: boolean;
  last_read?: string;
  unread_count?: number;
  edited?: {
    user: string;
    ts: string;
  };
  attachments?: Array<{
    id: number;
    color?: string;
    fallback?: string;
    text?: string;
    title?: string;
    title_link?: string;
    fields?: Array<{
      title: string;
      value: string;
      short: boolean;
    }>;
  }>;
  files?: Array<{
    id: string;
    name: string;
    title: string;
    mimetype: string;
    filetype: string;
    pretty_type: string;
    user: string;
    url_private: string;
    url_private_download: string;
    permalink: string;
    permalink_public: string;
    is_external: boolean;
    external_type: string;
    is_public: boolean;
    public_url_shared: boolean;
    display_as_bot: boolean;
    size: number;
    timestamp: number;
  }>;
  reactions?: Array<{
    name: string;
    users: string[];
    count: number;
  }>;
}

export interface SlackUser {
  id: string;
  team_id: string;
  name: string;
  deleted: boolean;
  color: string;
  real_name: string;
  tz: string;
  tz_label: string;
  tz_offset: number;
  profile: {
    title: string;
    phone: string;
    skype: string;
    real_name: string;
    real_name_normalized: string;
    display_name: string;
    display_name_normalized: string;
    status_text: string;
    status_emoji: string;
    status_expiration: number;
    avatar_hash: string;
    email: string;
    image_24: string;
    image_32: string;
    image_48: string;
    image_72: string;
    image_192: string;
    image_512: string;
    team: string;
  };
  is_admin: boolean;
  is_owner: boolean;
  is_primary_owner: boolean;
  is_restricted: boolean;
  is_ultra_restricted: boolean;
  is_bot: boolean;
  updated: number;
  is_app_user: boolean;
  has_2fa: boolean;
}

export interface SendMessageData {
  text: string;
  channel: string;
  thread_ts?: string;
  reply_broadcast?: boolean;
  parse?: 'full' | 'none';
  link_names?: boolean;
  attachments?: string;
  blocks?: string;
  icon_emoji?: string;
  icon_url?: string;
  username?: string;
  as_user?: boolean;
  unfurl_links?: boolean;
  unfurl_media?: boolean;
}

export class SlackChannelsService {
  private static readonly BASE_URL = 'https://slack.com/api';

  /**
   * List channels (public and private)
   */
  static async listChannels(
    accessToken: string,
    types: string = 'public_channel,private_channel',
    limit: number = 100
  ): Promise<SlackChannel[]> {
    try {
      const response = await axios.get(`${this.BASE_URL}/conversations.list`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        params: {
          types,
          limit
        }
      });

      if (!response.data.ok) {
        throw new Error(response.data.error || 'Failed to fetch channels');
      }

      return response.data.channels || [];
    } catch (error: any) {
      logger.error('Slack list channels error:', error.response?.data || error);
      throw new Error('Failed to fetch channels from Slack');
    }
  }

  /**
   * Get channel info
   */
  static async getChannelInfo(accessToken: string, channelId: string): Promise<SlackChannel> {
    try {
      const response = await axios.get(`${this.BASE_URL}/conversations.info`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        params: {
          channel: channelId
        }
      });

      if (!response.data.ok) {
        throw new Error(response.data.error || 'Failed to fetch channel info');
      }

      return response.data.channel;
    } catch (error: any) {
      logger.error('Slack get channel info error:', error.response?.data || error);
      throw new Error('Failed to fetch channel info from Slack');
    }
  }

  /**
   * List messages in a channel
   */
  static async listChannelMessages(
    accessToken: string,
    channelId: string,
    limit: number = 100,
    oldest?: string,
    latest?: string
  ): Promise<SlackMessage[]> {
    try {
      const params: any = {
        channel: channelId,
        limit
      };

      if (oldest) params.oldest = oldest;
      if (latest) params.latest = latest;

      const response = await axios.get(`${this.BASE_URL}/conversations.history`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        params
      });

      if (!response.data.ok) {
        throw new Error(response.data.error || 'Failed to fetch messages');
      }

      return response.data.messages || [];
    } catch (error: any) {
      logger.error('Slack list channel messages error:', error.response?.data || error);
      throw new Error('Failed to fetch messages from Slack channel');
    }
  }

  /**
   * Send a message to a channel
   */
  static async sendMessage(accessToken: string, messageData: SendMessageData): Promise<SlackMessage> {
    try {
      const response = await axios.post(`${this.BASE_URL}/chat.postMessage`, messageData, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.data.ok) {
        throw new Error(response.data.error || 'Failed to send message');
      }

      return response.data.message;
    } catch (error: any) {
      logger.error('Slack send message error:', error.response?.data || error);
      throw new Error('Failed to send message to Slack channel');
    }
  }

  /**
   * Update a message
   */
  static async updateMessage(
    accessToken: string,
    channelId: string,
    messageTs: string,
    text: string
  ): Promise<SlackMessage> {
    try {
      const response = await axios.post(`${this.BASE_URL}/chat.update`, {
        channel: channelId,
        ts: messageTs,
        text
      }, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.data.ok) {
        throw new Error(response.data.error || 'Failed to update message');
      }

      return response.data.message;
    } catch (error: any) {
      logger.error('Slack update message error:', error.response?.data || error);
      throw new Error('Failed to update message in Slack channel');
    }
  }

  /**
   * Delete a message
   */
  static async deleteMessage(accessToken: string, channelId: string, messageTs: string): Promise<void> {
    try {
      const response = await axios.post(`${this.BASE_URL}/chat.delete`, {
        channel: channelId,
        ts: messageTs
      }, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.data.ok) {
        throw new Error(response.data.error || 'Failed to delete message');
      }
    } catch (error: any) {
      logger.error('Slack delete message error:', error.response?.data || error);
      throw new Error('Failed to delete message from Slack channel');
    }
  }

  /**
   * Join a channel
   */
  static async joinChannel(accessToken: string, channelId: string): Promise<SlackChannel> {
    try {
      const response = await axios.post(`${this.BASE_URL}/conversations.join`, {
        channel: channelId
      }, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.data.ok) {
        throw new Error(response.data.error || 'Failed to join channel');
      }

      return response.data.channel;
    } catch (error: any) {
      logger.error('Slack join channel error:', error.response?.data || error);
      throw new Error('Failed to join Slack channel');
    }
  }

  /**
   * Leave a channel
   */
  static async leaveChannel(accessToken: string, channelId: string): Promise<void> {
    try {
      const response = await axios.post(`${this.BASE_URL}/conversations.leave`, {
        channel: channelId
      }, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.data.ok) {
        throw new Error(response.data.error || 'Failed to leave channel');
      }
    } catch (error: any) {
      logger.error('Slack leave channel error:', error.response?.data || error);
      throw new Error('Failed to leave Slack channel');
    }
  }

  /**
   * Get users in workspace
   */
  static async listUsers(accessToken: string, limit: number = 100): Promise<SlackUser[]> {
    try {
      const response = await axios.get(`${this.BASE_URL}/users.list`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        params: {
          limit
        }
      });

      if (!response.data.ok) {
        throw new Error(response.data.error || 'Failed to fetch users');
      }

      return response.data.members || [];
    } catch (error: any) {
      logger.error('Slack list users error:', error.response?.data || error);
      throw new Error('Failed to fetch users from Slack');
    }
  }

  /**
   * Create a direct message channel
   */
  static async createDirectMessage(accessToken: string, userId: string): Promise<SlackChannel> {
    try {
      const response = await axios.post(`${this.BASE_URL}/conversations.open`, {
        users: userId
      }, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.data.ok) {
        throw new Error(response.data.error || 'Failed to create direct message');
      }

      return response.data.channel;
    } catch (error: any) {
      logger.error('Slack create DM error:', error.response?.data || error);
      throw new Error('Failed to create direct message in Slack');
    }
  }
}

export default SlackChannelsService;