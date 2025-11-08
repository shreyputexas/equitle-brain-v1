import axios from '../lib/axios';

export interface EmailAlert {
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
  createdAt?: Date;
  updatedAt?: Date;
  associatedDealId?: string | null;
  associatedDealCompany?: string | null;
}

class EmailsApiService {
  private getAuthToken() {
    return localStorage.getItem('token');
  }

  private getAuthHeaders() {
    const token = this.getAuthToken();
    if (!token) {
      throw new Error('Authentication required. Please log in.');
    }
    return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  }

  async getEmails(limit: number = 20): Promise<EmailAlert[]> {
    try {
      console.log('Making API call to /firebase-emails with limit:', limit);
      const response = await axios.get<{ data: EmailAlert[] }>(`/firebase-emails?limit=${limit}`, {
        headers: this.getAuthHeaders()
      });
      console.log('API response:', response.data);
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching emails:', error);
      throw error;
    }
  }
}

export const emailsApi = new EmailsApiService();