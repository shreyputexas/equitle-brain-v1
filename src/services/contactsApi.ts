import axios from '../lib/axios';

export interface CreateContactData {
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  title?: string;
  role?: string;
  linkedinUrl?: string;
  notes?: string;
  tags?: string[];
  relationshipScore?: number;
  status?: string;
  isKeyContact?: boolean;
  dealId?: string;
  metadata?: Record<string, any>;
}

export interface UpdateContactData extends Partial<CreateContactData> {
  metadata?: Record<string, any>;
}

export interface ContactsResponse {
  contacts: any[];
  total: number;
}

export interface ContactResponse {
  contact: any;
}

export interface ContactFilters {
  search?: string;
  dealId?: string;
  status?: string;
  limit?: number;
  offset?: number;
}

export interface LogInteractionData {
  type: string;
  title: string;
  description?: string;
  content?: string;
  date?: Date;
  duration?: number;
  outcome?: string;
  nextSteps?: string;
}

class ContactsApiService {
  private baseURL = '/api';

  constructor() {
    // Auth headers are now set per-request, not globally
  }

  /**
   * Get all contacts with optional filters
   */
  async getContacts(filters: ContactFilters = {}): Promise<ContactsResponse> {
    try {
      const params = new URLSearchParams();

      if (filters.search) params.append('search', filters.search);
      if (filters.dealId) params.append('dealId', filters.dealId);
      if (filters.status) params.append('status', filters.status);
      if (filters.limit) params.append('limit', filters.limit.toString());
      if (filters.offset) params.append('offset', filters.offset.toString());

      const response = await axios.get<any>(`/api/firebase/contacts?${params.toString()}`);
      // Handle the nested response structure from firebase API
      const contacts = response.data?.data?.contacts || response.data?.data || response.data?.contacts || [];
      return {
        contacts,
        total: contacts.length
      };
    } catch (error) {
      console.error('Error fetching contacts:', error);
      throw error;
    }
  }

  /**
   * Get a single contact by ID
   */
  async getContact(id: string): Promise<ContactResponse> {
    try {
      const response = await axios.get<ContactResponse>(`/api/firebase/contacts/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching contact ${id}:`, error);
      throw error;
    }
  }

  /**
   * Create a new contact
   */
  async createContact(contactData: CreateContactData): Promise<ContactResponse> {
    try {
      const response = await axios.post<ContactResponse>('/api/firebase/contacts', contactData);
      return response.data;
    } catch (error) {
      console.error('Error creating contact:', error);
      throw error;
    }
  }

  /**
   * Update an existing contact
   */
  async updateContact(id: string, contactData: UpdateContactData): Promise<ContactResponse> {
    try {
      const response = await axios.put<ContactResponse>(`/api/firebase/contacts/${id}`, contactData);
      return response.data;
    } catch (error) {
      console.error(`Error updating contact ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete a contact
   */
  async deleteContact(id: string): Promise<void> {
    try {
      await axios.delete(`/api/firebase/contacts/${id}`);
    } catch (error) {
      console.error(`Error deleting contact ${id}:`, error);
      throw error;
    }
  }

  /**
   * Log an interaction with a contact
   */
  async logInteraction(contactId: string, interactionData: LogInteractionData): Promise<any> {
    try {
      const response = await axios.post<any>(`/api/firebase/contacts/${contactId}/interactions`, interactionData);
      return response.data;
    } catch (error) {
      console.error(`Error logging interaction for contact ${contactId}:`, error);
      throw error;
    }
  }

  /**
   * Associate an email thread with a contact (broker)
   */
  async associateEmailThread(contactId: string, emailData: { threadId: string; subject: string }): Promise<{ communicationId: string }> {
    try {
      const response = await axios.post<{ data?: { communicationId: string }; communicationId?: string }>(`/api/firebase/contacts/${contactId}/email-thread`, emailData);
      return response.data?.data || (response.data as { communicationId: string }) || { communicationId: '' };
    } catch (error) {
      console.error(`Error associating email thread to contact ${contactId}:`, error);
      throw error;
    }
  }
}

export const contactsApi = new ContactsApiService();
export default contactsApi;