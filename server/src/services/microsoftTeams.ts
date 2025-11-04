import axios from 'axios';
import logger from '../utils/logger';

export interface TeamsChat {
  id: string;
  topic?: string;
  chatType: 'oneOnOne' | 'group' | 'meeting';
  createdDateTime: string;
  lastUpdatedDateTime: string;
  members?: Array<{
    id: string;
    displayName: string;
    email?: string;
    roles: string[];
  }>;
}

export interface TeamsMessage {
  id: string;
  messageType: 'message' | 'chatEvent' | 'typing';
  createdDateTime: string;
  lastModifiedDateTime?: string;
  deletedDateTime?: string;
  subject?: string;
  summary?: string;
  body: {
    contentType: 'text' | 'html';
    content: string;
  };
  from: {
    user?: {
      id: string;
      displayName: string;
      userIdentityType: string;
    };
  };
  attachments?: Array<{
    id: string;
    contentType: string;
    contentUrl?: string;
    content?: string;
    name?: string;
    thumbnailUrl?: string;
  }>;
  mentions?: Array<{
    id: number;
    mentionText: string;
    mentioned: {
      user: {
        id: string;
        displayName: string;
        userIdentityType: string;
      };
    };
  }>;
  reactions?: Array<{
    reactionType: string;
    createdDateTime: string;
    user: {
      id: string;
      displayName: string;
    };
  }>;
}

export interface Team {
  id: string;
  displayName: string;
  description?: string;
  internalId: string;
  createdDateTime: string;
  webUrl: string;
  isArchived: boolean;
}

export interface TeamsChannel {
  id: string;
  displayName: string;
  description?: string;
  isFavoriteByDefault?: boolean;
  email?: string;
  webUrl: string;
  membershipType: 'standard' | 'private' | 'unknownFutureValue';
  createdDateTime: string;
}

export interface SendMessageData {
  body: {
    contentType: 'text' | 'html';
    content: string;
  };
  attachments?: Array<{
    id: string;
    contentType: string;
    contentUrl?: string;
    name?: string;
  }>;
}

export class MicrosoftTeamsService {
  private static readonly BASE_URL = 'https://graph.microsoft.com/v1.0';

  /**
   * List user's chats
   */
  static async listChats(accessToken: string, top: number = 50): Promise<TeamsChat[]> {
    try {
      const response = await axios.get(`${this.BASE_URL}/me/chats?$top=${top}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data.value || [];
    } catch (error: any) {
      logger.error('Microsoft Teams list chats error:', error.response?.data || error);
      throw new Error('Failed to fetch chats from Microsoft Teams');
    }
  }

  /**
   * Get chat details
   */
  static async getChat(accessToken: string, chatId: string): Promise<TeamsChat> {
    try {
      const response = await axios.get(`${this.BASE_URL}/chats/${chatId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data;
    } catch (error: any) {
      logger.error('Microsoft Teams get chat error:', error.response?.data || error);
      throw new Error('Failed to fetch chat from Microsoft Teams');
    }
  }

  /**
   * List messages in a chat
   */
  static async listChatMessages(
    accessToken: string,
    chatId: string,
    top: number = 50
  ): Promise<TeamsMessage[]> {
    try {
      const response = await axios.get(`${this.BASE_URL}/chats/${chatId}/messages?$top=${top}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data.value || [];
    } catch (error: any) {
      logger.error('Microsoft Teams list chat messages error:', error.response?.data || error);
      throw new Error('Failed to fetch chat messages from Microsoft Teams');
    }
  }

  /**
   * Send a message to a chat
   */
  static async sendChatMessage(
    accessToken: string,
    chatId: string,
    messageData: SendMessageData
  ): Promise<TeamsMessage> {
    try {
      const response = await axios.post(`${this.BASE_URL}/chats/${chatId}/messages`, messageData, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data;
    } catch (error: any) {
      logger.error('Microsoft Teams send chat message error:', error.response?.data || error);
      throw new Error('Failed to send message to Microsoft Teams chat');
    }
  }

  /**
   * List user's teams
   */
  static async listTeams(accessToken: string): Promise<Team[]> {
    try {
      const response = await axios.get(`${this.BASE_URL}/me/joinedTeams`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data.value || [];
    } catch (error: any) {
      logger.error('Microsoft Teams list teams error:', error.response?.data || error);
      throw new Error('Failed to fetch teams from Microsoft Teams');
    }
  }

  /**
   * List channels in a team
   */
  static async listTeamChannels(accessToken: string, teamId: string): Promise<TeamsChannel[]> {
    try {
      const response = await axios.get(`${this.BASE_URL}/teams/${teamId}/channels`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data.value || [];
    } catch (error: any) {
      logger.error('Microsoft Teams list team channels error:', error.response?.data || error);
      throw new Error('Failed to fetch team channels from Microsoft Teams');
    }
  }

  /**
   * List messages in a team channel
   */
  static async listChannelMessages(
    accessToken: string,
    teamId: string,
    channelId: string,
    top: number = 50
  ): Promise<TeamsMessage[]> {
    try {
      const response = await axios.get(
        `${this.BASE_URL}/teams/${teamId}/channels/${channelId}/messages?$top=${top}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data.value || [];
    } catch (error: any) {
      logger.error('Microsoft Teams list channel messages error:', error.response?.data || error);
      throw new Error('Failed to fetch channel messages from Microsoft Teams');
    }
  }

  /**
   * Send a message to a team channel
   */
  static async sendChannelMessage(
    accessToken: string,
    teamId: string,
    channelId: string,
    messageData: SendMessageData
  ): Promise<TeamsMessage> {
    try {
      const response = await axios.post(
        `${this.BASE_URL}/teams/${teamId}/channels/${channelId}/messages`,
        messageData,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error: any) {
      logger.error('Microsoft Teams send channel message error:', error.response?.data || error);
      throw new Error('Failed to send message to Microsoft Teams channel');
    }
  }

  /**
   * Create a chat with one or more users
   */
  static async createChat(
    accessToken: string,
    members: Array<{ email: string; displayName?: string }>,
    topic?: string
  ): Promise<TeamsChat> {
    try {
      const chatData = {
        chatType: members.length === 1 ? 'oneOnOne' : 'group',
        topic: topic,
        members: members.map((member, index) => ({
          '@odata.type': '#microsoft.graph.aadUserConversationMember',
          userId: member.email,
          roles: index === 0 ? ['owner'] : ['member']
        }))
      };

      const response = await axios.post(`${this.BASE_URL}/chats`, chatData, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data;
    } catch (error: any) {
      logger.error('Microsoft Teams create chat error:', error.response?.data || error);
      throw new Error('Failed to create chat in Microsoft Teams');
    }
  }

  /**
   * Get user presence information
   */
  static async getUserPresence(accessToken: string, userId?: string): Promise<any> {
    try {
      const endpoint = userId ? `/users/${userId}/presence` : '/me/presence';
      const response = await axios.get(`${this.BASE_URL}${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data;
    } catch (error: any) {
      logger.error('Microsoft Teams get user presence error:', error.response?.data || error);
      throw new Error('Failed to fetch user presence from Microsoft Teams');
    }
  }
}

export default MicrosoftTeamsService;