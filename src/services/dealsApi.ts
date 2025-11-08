import axios from '../lib/axios';
import { getApiUrl } from '../config/api';

// Types
export interface Deal {
  id: string;
  company: string;
  description?: string;
  sector?: string;
  stage: string;
  status: string;
  value?: number;
  probability?: number;
  leadPartner?: string;
  team?: string[];
  tags?: string[];
  priority: string;
  targetClose?: Date;
  nextStep?: string;
  source?: string;
  geography?: string;
  dealSize?: string;
  lastActivity?: Date;
  createdAt: Date;
  updatedAt: Date;
  contacts?: Contact[];
  activities?: Activity[];
  communications?: Communication[];
  _count?: {
    contacts: number;
    activities: number;
    communications: number;
    documents: number;
  };
}

export interface Contact {
  id: string;
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
  status: string;
  isKeyContact: boolean;
  lastContact?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Activity {
  id: string;
  type: string;
  title: string;
  description?: string;
  content?: string;
  date: Date;
  duration?: number;
  location?: string;
  attendees?: string[];
  status: string;
  priority: string;
  outcome?: string;
  nextSteps?: string;
  createdAt: Date;
}

export interface Communication {
  id: string;
  type: string;
  subject?: string;
  content?: string;
  htmlContent?: string;
  fromEmail?: string;
  toEmails: string[];
  ccEmails?: string[];
  status: string;
  direction: string;
  sentAt?: Date;
  createdAt: Date;
}

export interface CreateDealData {
  company: string;
  description?: string;
  sector?: string;
  stage?: string;
  status?: string;
  value?: number;
  probability?: number;
  leadPartner?: string;
  team?: string[];
  tags?: string[];
  priority?: string;
  targetClose?: Date;
  nextStep?: string;
  source?: string;
  geography?: string;
  dealSize?: string;
}

export interface UpdateDealData extends Partial<CreateDealData> {}

export interface DealsResponse {
  deals: Deal[];
  total: number;
}

export interface DealResponse {
  deal: Deal;
}

export interface SearchFilters {
  search?: string;
  sector?: string;
  stage?: string;
  status?: string;
  limit?: number;
  offset?: number;
}

class DealsApiService {
  // Base URL is set in AuthContext globally
// FORCE CACHE REFRESH - 2025-09-26T01:30

  constructor() {
    // No need to configure axios defaults since we're using full URLs
  }

  private getAuthToken() {
    return localStorage.getItem('token');
  }

  private getAuthHeaders() {
    const token = this.getAuthToken();
    if (!token) {
      console.warn('dealsApi: No auth token available');
      throw new Error('Authentication required. Please log in.');
    }
    return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  }

  /**
   * Get all deals with optional filters
   */
  async getDeals(filters: SearchFilters = {}): Promise<DealsResponse> {
    try {
      const params = new URLSearchParams();

      if (filters.search) params.append('search', filters.search);
      if (filters.sector) params.append('sector', filters.sector);
      if (filters.stage) params.append('stage', filters.stage);
      if (filters.status) params.append('status', filters.status);
      if (filters.limit) params.append('limit', filters.limit.toString());
      if (filters.offset) params.append('offset', filters.offset.toString());

      const url = getApiUrl(`firebase-deals${params.toString() ? '?' + params.toString() : ''}`);
      console.log('dealsApi.getDeals: Requesting URL:', url);
      console.log('dealsApi.getDeals: Headers:', this.getAuthHeaders());
      
      const response = await axios.get<{ data?: DealsResponse; success?: boolean }>(url, {
        headers: this.getAuthHeaders()
      });
      
      // Firebase API returns { success: true, data: { deals: [], total: 0 } }
      // but frontend expects { deals: [], total: 0 }
      console.log('dealsApi.getDeals: Full axios response:', response);
      console.log('dealsApi.getDeals: response.status:', response.status);
      console.log('dealsApi.getDeals: response.data:', JSON.stringify(response.data, null, 2));
      
      if (!response.data) {
        console.error('dealsApi.getDeals: No response.data:', response);
        throw new Error('No response data received');
      }
      
      // Try multiple ways to extract deals
      let deals: any[] = [];
      let total = 0;
      
      // Method 1: response.data.data.deals (expected structure)
      if ((response.data as any).data?.deals) {
        console.log('dealsApi.getDeals: Found deals via response.data.data.deals');
        deals = (response.data as any).data.deals;
        total = (response.data as any).data.total || deals.length;
      }
      // Method 2: response.data.deals (direct structure)
      else if ((response.data as any).deals) {
        console.log('dealsApi.getDeals: Found deals via response.data.deals');
        deals = (response.data as any).deals;
        total = (response.data as any).total || deals.length;
      }
      // Method 3: response.data.data is the deals array directly
      else if (Array.isArray((response.data as any).data)) {
        console.log('dealsApi.getDeals: Found deals via response.data.data (array)');
        deals = (response.data as any).data;
        total = deals.length;
      }
      else {
        console.error('dealsApi.getDeals: Could not find deals in response!');
        console.error('dealsApi.getDeals: response.data structure:', Object.keys(response.data));
        console.error('dealsApi.getDeals: response.data.data:', (response.data as any).data);
        throw new Error('Invalid API response structure: could not find deals array');
      }
      
      console.log('dealsApi.getDeals: Extracted deals:', deals);
      console.log('dealsApi.getDeals: Extracted deals length:', deals.length);
      console.log('dealsApi.getDeals: Extracted total:', total);
      
      // Ensure deals is always an array
      if (!Array.isArray(deals)) {
        console.error('dealsApi.getDeals: deals is not an array!', deals);
        return { deals: [], total: total || 0 };
      }
      
      const result: DealsResponse = { deals, total };
      console.log('dealsApi.getDeals: Returning result:', result);
      return result;
    } catch (error: any) {
      console.error('dealsApi.getDeals: ERROR caught:', error);
      console.error('dealsApi.getDeals: Error message:', error.message);
      console.error('dealsApi.getDeals: Error response:', error.response);
      console.error('dealsApi.getDeals: Error response data:', error.response?.data);
      console.error('dealsApi.getDeals: Error response status:', error.response?.status);
      throw error;
    }
  }

  /**
   * Get a single deal by ID
   */
  async getDeal(id: string): Promise<DealResponse> {
    try {
      const response = await axios.get<{ data: DealResponse }>(getApiUrl(`firebase-deals/${id}`), {
        headers: this.getAuthHeaders()
      });
      // Firebase API returns { success: true, data: { deal: {} } }
      // but frontend expects { deal: {} }
      return response.data.data;
    } catch (error) {
      console.error(`Error fetching deal ${id}:`, error);
      throw error;
    }
  }

  /**
   * Create a new deal
   */
  async createDeal(dealData: CreateDealData): Promise<DealResponse> {
    try {
      const response = await axios.post<{ data: DealResponse }>(getApiUrl('firebase-deals'), dealData, {
        headers: this.getAuthHeaders()
      });
      // Firebase API returns { success: true, data: { deal: {} } }
      // but frontend expects { deal: {} }
      return response.data.data;
    } catch (error) {
      console.error('Error creating deal:', error);
      throw error;
    }
  }

  /**
   * Update an existing deal
   */
  async updateDeal(id: string, dealData: UpdateDealData): Promise<DealResponse> {
    try {
      const response = await axios.put<{ data: DealResponse }>(getApiUrl(`firebase-deals/${id}`), dealData, {
        headers: this.getAuthHeaders()
      });
      // Firebase API returns { success: true, data: { deal: {} } }
      // but frontend expects { deal: {} }
      return response.data.data;
    } catch (error) {
      console.error(`Error updating deal ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete (archive) a deal
   */
  async deleteDeal(id: string): Promise<void> {
    try {
      await axios.delete(getApiUrl(`firebase-deals/${id}`), {
        headers: this.getAuthHeaders()
      });
    } catch (error) {
      console.error(`Error deleting deal ${id}:`, error);
      throw error;
    }
  }

  /**
   * Add a contact to a deal
   */
  async addContactToDeal(dealId: string, contactId: string): Promise<void> {
    try {
      await axios.post(getApiUrl(`firebase-deals/${dealId}/contacts`), { contactId }, {
        headers: this.getAuthHeaders()
      });
    } catch (error) {
      console.error(`Error adding contact to deal ${dealId}:`, error);
      throw error;
    }
  }

  /**
   * Remove a contact from a deal
   */
  async removeContactFromDeal(dealId: string, contactId: string): Promise<void> {
    try {
      await axios.delete(getApiUrl(`firebase-deals/${dealId}/contacts/${contactId}`), {
        headers: this.getAuthHeaders()
      });
    } catch (error) {
      console.error(`Error removing contact from deal ${dealId}:`, error);
      throw error;
    }
  }

  /**
   * Associate an email thread with a deal
   */
  async associateEmailThread(dealId: string, emailData: { threadId: string; subject: string }): Promise<void> {
    try {
      await axios.post(getApiUrl(`firebase-deals/${dealId}/email-thread`), emailData, {
        headers: this.getAuthHeaders()
      });
    } catch (error) {
      console.error(`Error associating email thread to deal ${dealId}:`, error);
      throw error;
    }
  }
}

export const dealsApi = new DealsApiService();
export default dealsApi;