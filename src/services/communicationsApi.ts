import axios from '../lib/axios';
import { getApiUrl } from '../config/api';

export interface Communication {
  id: string;
  dealId?: string;
  contactId?: string;
  type: string; // 'email', 'sms', 'call', 'meeting'
  subject?: string;
  content?: string;
  snippet?: string; // Gmail snippet/preview text
  htmlContent?: string;
  fromEmail?: string;
  toEmails?: string[];
  ccEmails?: string[];
  bccEmails?: string[];
  threadId?: string; // Gmail thread ID
  messageId?: string; // Gmail message ID
  status: string; // 'draft', 'sent', 'received', 'failed'
  direction: string; // 'inbound', 'outbound'
  isRead: boolean;
  isImportant: boolean;
  labels?: string[];
  attachments?: Record<string, any>;
  metadata?: Record<string, any>;
  sentAt?: Date;
  receivedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CommunicationsResponse {
  communications: Communication[];
  total: number;
}

export interface CommunicationFilters {
  dealId?: string;
  contactId?: string;
  type?: string;
  limit?: number;
  offset?: number;
}

class CommunicationsApiService {
  /**
   * Get all communications with optional filters
   */
  async getCommunications(filters: CommunicationFilters = {}): Promise<CommunicationsResponse> {
    try {
      const params = new URLSearchParams();

      if (filters.dealId) params.append('dealId', filters.dealId);
      if (filters.contactId) params.append('contactId', filters.contactId);
      if (filters.type) params.append('type', filters.type);
      if (filters.limit) params.append('limit', filters.limit.toString());
      if (filters.offset) params.append('offset', filters.offset.toString());

      const url = getApiUrl(`firebase${params.toString() ? '/communications?' + params.toString() : '/communications'}`);
      console.log('Communications API URL:', url);
      console.log('Communications API filters:', filters);

      // Auth headers are automatically added by axios interceptor
      const response = await axios.get<{ success: boolean; data: CommunicationsResponse }>(url);

      console.log('Communications API raw response:', response.data);

      // Handle the nested response structure from firebase API
      if (response.data.success && response.data.data) {
        console.log('Communications API returning data:', response.data.data);
        return response.data.data;
      }

      console.log('Communications API returning empty array');
      return {
        communications: [],
        total: 0
      };
    } catch (error) {
      console.error('Error fetching communications:', error);
      throw error;
    }
  }
}

export const communicationsApi = new CommunicationsApiService();
export default communicationsApi;

