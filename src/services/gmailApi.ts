import axios from 'axios';

export interface SendEmailData {
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject: string;
  body: string;
  isHtml?: boolean;
  replyTo?: string;
  threadId?: string;
  dealId?: string;
  contactId?: string;
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
    parts?: any[];
  };
}

export interface GmailThread {
  id: string;
  historyId: string;
  messages: GmailMessage[];
}

export interface GmailLabel {
  id: string;
  name: string;
  type: string;
  messagesTotal?: number;
  messagesUnread?: number;
}

export interface SendEmailResponse {
  message: string;
  messageId: string;
  threadId?: string;
  communication: any;
}

export interface MessagesResponse {
  messages: GmailMessage[];
  nextPageToken?: string;
  resultSizeEstimate: number;
}

export interface ThreadsResponse {
  threads: GmailThread[];
  nextPageToken?: string;
  resultSizeEstimate: number;
}

export interface LabelsResponse {
  labels: GmailLabel[];
}

export interface MessageFilters {
  q?: string;
  labelIds?: string[];
  maxResults?: number;
  pageToken?: string;
}

class GmailApiService {
  private baseURL = 'http://localhost:4000/api';

  constructor() {
    axios.defaults.baseURL = this.baseURL;
    axios.defaults.headers.common['Authorization'] = 'Bearer mock-token';
  }

  /**
   * Send an email through Gmail
   */
  async sendEmail(emailData: SendEmailData): Promise<SendEmailResponse> {
    try {
      const response = await axios.post('/gmail/send', emailData);
      return response.data;
    } catch (error: any) {
      console.error('Error sending email:', error);

      if (error.response?.status === 400 && error.response?.data?.message?.includes('Gmail integration required')) {
        throw new Error('Gmail integration required. Please connect your Gmail account in settings.');
      }

      throw error;
    }
  }

  /**
   * Reply to an email
   */
  async replyToEmail(messageId: string, replyData: {
    subject: string;
    body: string;
    isHtml?: boolean;
    dealId?: string;
    contactId?: string;
  }): Promise<SendEmailResponse> {
    try {
      const response = await axios.post(`/gmail/reply/${messageId}`, replyData);
      return response.data;
    } catch (error: any) {
      console.error('Error replying to email:', error);

      if (error.response?.status === 400 && error.response?.data?.message?.includes('Gmail integration required')) {
        throw new Error('Gmail integration required. Please connect your Gmail account in settings.');
      }

      throw error;
    }
  }

  /**
   * Get Gmail messages
   */
  async getMessages(filters: MessageFilters = {}): Promise<MessagesResponse> {
    try {
      const params = new URLSearchParams();

      if (filters.q) params.append('q', filters.q);
      if (filters.labelIds) {
        filters.labelIds.forEach(labelId => params.append('labelIds', labelId));
      }
      if (filters.maxResults) params.append('maxResults', filters.maxResults.toString());
      if (filters.pageToken) params.append('pageToken', filters.pageToken);

      const response = await axios.get(`/gmail/messages?${params.toString()}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching Gmail messages:', error);

      if (error.response?.status === 400 && error.response?.data?.message?.includes('Gmail integration required')) {
        throw new Error('Gmail integration required. Please connect your Gmail account in settings.');
      }

      throw error;
    }
  }

  /**
   * Get a specific Gmail message
   */
  async getMessage(messageId: string): Promise<{ message: GmailMessage }> {
    try {
      const response = await axios.get(`/gmail/messages/${messageId}`);
      return response.data;
    } catch (error: any) {
      console.error(`Error fetching Gmail message ${messageId}:`, error);

      if (error.response?.status === 400 && error.response?.data?.message?.includes('Gmail integration required')) {
        throw new Error('Gmail integration required. Please connect your Gmail account in settings.');
      }

      throw error;
    }
  }

  /**
   * Get Gmail threads
   */
  async getThreads(filters: MessageFilters = {}): Promise<ThreadsResponse> {
    try {
      const params = new URLSearchParams();

      if (filters.q) params.append('q', filters.q);
      if (filters.labelIds) {
        filters.labelIds.forEach(labelId => params.append('labelIds', labelId));
      }
      if (filters.maxResults) params.append('maxResults', filters.maxResults.toString());
      if (filters.pageToken) params.append('pageToken', filters.pageToken);

      const response = await axios.get(`/gmail/threads?${params.toString()}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching Gmail threads:', error);

      if (error.response?.status === 400 && error.response?.data?.message?.includes('Gmail integration required')) {
        throw new Error('Gmail integration required. Please connect your Gmail account in settings.');
      }

      throw error;
    }
  }

  /**
   * Get Gmail labels
   */
  async getLabels(): Promise<LabelsResponse> {
    try {
      const response = await axios.get('/gmail/labels');
      return response.data;
    } catch (error: any) {
      console.error('Error fetching Gmail labels:', error);

      if (error.response?.status === 400 && error.response?.data?.message?.includes('Gmail integration required')) {
        throw new Error('Gmail integration required. Please connect your Gmail account in settings.');
      }

      throw error;
    }
  }

  /**
   * Mark Gmail message as read
   */
  async markAsRead(messageId: string): Promise<void> {
    try {
      await axios.post(`/gmail/messages/${messageId}/read`);
    } catch (error: any) {
      console.error(`Error marking message ${messageId} as read:`, error);

      if (error.response?.status === 400 && error.response?.data?.message?.includes('Gmail integration required')) {
        throw new Error('Gmail integration required. Please connect your Gmail account in settings.');
      }

      throw error;
    }
  }

  /**
   * Delete Gmail message
   */
  async deleteMessage(messageId: string): Promise<void> {
    try {
      await axios.delete(`/gmail/messages/${messageId}`);
    } catch (error: any) {
      console.error(`Error deleting message ${messageId}:`, error);

      if (error.response?.status === 400 && error.response?.data?.message?.includes('Gmail integration required')) {
        throw new Error('Gmail integration required. Please connect your Gmail account in settings.');
      }

      throw error;
    }
  }
}

export const gmailApi = new GmailApiService();
export default gmailApi;