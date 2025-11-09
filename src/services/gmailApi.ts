import axios from '../lib/axios';

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
    mimeType?: string;
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
  private baseURL = '/api';

  constructor() {
    // Don't set axios.defaults.baseURL globally - it affects ALL axios requests
    // Auth headers are now set per-request, not globally
  }

  /**
   * Send an email through Gmail
   */
  async sendEmail(emailData: SendEmailData): Promise<SendEmailResponse> {
    try {
      const response = await axios.post<SendEmailResponse>(`${this.baseURL}/gmail/send`, emailData);
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
      const response = await axios.post<SendEmailResponse>(`${this.baseURL}/gmail/reply/${messageId}`, replyData);
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

      const response = await axios.get<MessagesResponse>(`${this.baseURL}/gmail/messages?${params.toString()}`);
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
      const response = await axios.get<{ message: GmailMessage }>(`${this.baseURL}/firebase-gmail/messages/${messageId}`);
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
   * Get a specific Gmail thread by ID
   */
  async getThread(threadId: string): Promise<{ thread: GmailThread }> {
    try {
      const response = await axios.get<{ thread: GmailThread }>(`${this.baseURL}/firebase-gmail/threads/${threadId}`);
      return response.data;
    } catch (error: any) {
      console.error(`Error fetching Gmail thread ${threadId}:`, error);

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
      // Always set maxResults, default to 100 if not provided
      const maxResults = filters.maxResults || 100;
      params.append('maxResults', maxResults.toString());
      if (filters.pageToken) params.append('pageToken', filters.pageToken);
      // Add cache-busting parameter
      params.append('_t', Date.now().toString());

      const url = `${this.baseURL}/firebase-gmail/threads?${params.toString()}`;
      console.log('🌐 Gmail API request URL:', url);
      console.log('🌐 Gmail API request params:', { maxResults, labelIds: filters.labelIds, q: filters.q });

      const response = await axios.get<ThreadsResponse>(url, {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      console.log('🌐 Gmail API response data:', {
        threadsCount: response.data.threads?.length || 0,
        resultSizeEstimate: response.data.resultSizeEstimate,
        hasNextPageToken: !!response.data.nextPageToken
      });
      
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
      const response = await axios.get<LabelsResponse>(`${this.baseURL}/gmail/labels`);
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
      await axios.post(`${this.baseURL}/gmail/messages/${messageId}/read`);
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
      await axios.delete(`${this.baseURL}/gmail/messages/${messageId}`);
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