import axios from 'axios';

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
  async getEmails(limit: number = 20): Promise<EmailAlert[]> {
    try {
      const response = await axios.get(`/firebase-emails?limit=${limit}`);
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching emails:', error);
      throw error;
    }
  }
}

export const emailsApi = new EmailsApiService();