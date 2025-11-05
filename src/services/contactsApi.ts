import axios from 'axios';

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
}

export interface UpdateContactData extends Partial<CreateContactData> {}

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
    // Remove baseURL setting to avoid duplication with Vite proxy
    axios.defaults.headers.common['Authorization'] = 'Bearer mock-token';
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
      const contacts = response.data?.data?.contacts || response.data?.data || [];
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
}

export const contactsApi = new ContactsApiService();
export default contactsApi;