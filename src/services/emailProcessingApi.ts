import { ApiResponse } from '../types/api';

export interface ProcessedEmail {
  id: string;
  sentiment: 'RED' | 'YELLOW' | 'GREEN';
  prospect_email: string;
  prospect_name?: string;
  email_subject?: string;
  email_body?: string;
  received_date?: string;
  message_id?: string;
  thread_id?: string;
  status?: string;
  source?: string;
  category?: 'deal' | 'investor' | 'broker';
  subCategory?: string;
  confidence?: number;
  createdAt?: string;
  updatedAt?: string;
  associatedDealId?: string | null;
  associatedDealCompany?: string | null;
}

export interface EmailProcessingStatus {
  isRunning: boolean;
  message: string;
}

export interface EmailProcessingResponse {
  success: boolean;
  data?: {
    emails: ProcessedEmail[];
    total: number;
  };
  message?: string;
  error?: string;
}

class EmailProcessingApiService {
  private baseUrl = '/api/email-processing';

  // Get email processing status
  async getStatus(): Promise<ApiResponse<EmailProcessingStatus>> {
    try {
      const response = await fetch(`${this.baseUrl}/status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching email processing status:', error);
      throw error;
    }
  }

  // Manually trigger email processing
  async processEmailsNow(): Promise<ApiResponse<{ message: string }>> {
    try {
      const response = await fetch(`${this.baseUrl}/process-now`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error triggering email processing:', error);
      throw error;
    }
  }

  // Get processed emails with filtering
  async getProcessedEmails(options: {
    limit?: number;
    offset?: number;
    category?: 'deal' | 'investor' | 'broker';
    subCategory?: string;
    sentiment?: 'RED' | 'YELLOW' | 'GREEN';
  } = {}): Promise<ApiResponse<{ emails: ProcessedEmail[]; total: number }>> {
    try {
      const queryParams = new URLSearchParams();
      
      if (options.limit) queryParams.append('limit', options.limit.toString());
      if (options.offset) queryParams.append('offset', options.offset.toString());
      if (options.category) queryParams.append('category', options.category);
      if (options.subCategory) queryParams.append('subCategory', options.subCategory);
      if (options.sentiment) queryParams.append('sentiment', options.sentiment);

      const url = `${this.baseUrl}/processed-emails${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching processed emails:', error);
      throw error;
    }
  }

  // Get emails by category (Deal, Investor, Broker)
  async getEmailsByCategory(category: 'deal' | 'investor' | 'broker'): Promise<ProcessedEmail[]> {
    try {
      const response = await this.getProcessedEmails({ category });
      return response.data?.emails || [];
    } catch (error) {
      console.error(`Error fetching ${category} emails:`, error);
      return [];
    }
  }

  // Get emails by sub-category
  async getEmailsBySubCategory(
    category: 'deal' | 'investor' | 'broker',
    subCategory: string
  ): Promise<ProcessedEmail[]> {
    try {
      const response = await this.getProcessedEmails({ category, subCategory });
      return response.data?.emails || [];
    } catch (error) {
      console.error(`Error fetching ${category}/${subCategory} emails:`, error);
      return [];
    }
  }

  // Get all emails with sentiment filter
  async getAllEmails(sentiment?: 'RED' | 'YELLOW' | 'GREEN'): Promise<ProcessedEmail[]> {
    try {
      const response = await this.getProcessedEmails({ sentiment });
      return response.data?.emails || [];
    } catch (error) {
      console.error('Error fetching all emails:', error);
      return [];
    }
  }
}

export const emailProcessingApi = new EmailProcessingApiService();
export default emailProcessingApi;

