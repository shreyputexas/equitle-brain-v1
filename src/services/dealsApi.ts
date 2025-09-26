import axios from 'axios';

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
    // For development, use mock token if no real token exists
    const authToken = token || 'mock-token';
    return { Authorization: `Bearer ${authToken}`, 'Content-Type': 'application/json' };
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

      const response = await axios.get(`/firebase-deals?${params.toString()}`, {
        headers: this.getAuthHeaders()
      });
      // Firebase API returns { success: true, data: { deals: [], total: 0 } }
      // but frontend expects { deals: [], total: 0 }
      console.log('Deals API full response:', response);
      console.log('Deals API response.data:', response.data);
      console.log('Deals API response.data.data:', response.data?.data);
      
      if (!response.data || !response.data.data) {
        console.error('Invalid API response structure:', response.data);
        throw new Error('Invalid API response structure');
      }
      
      return response.data.data;
    } catch (error) {
      console.error('Error fetching deals:', error);
      throw error;
    }
  }

  /**
   * Get a single deal by ID
   */
  async getDeal(id: string): Promise<DealResponse> {
    try {
      const response = await axios.get(`/firebase-deals/${id}`, {
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
      const response = await axios.post(`/firebase-deals`, dealData, {
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
      const response = await axios.put(`/firebase-deals/${id}`, dealData, {
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
      await axios.delete(`/firebase-deals/${id}`, {
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
      await axios.post(`/firebase-deals/${dealId}/contacts`, { contactId }, {
        headers: this.getAuthHeaders()
      });
    } catch (error) {
      console.error(`Error adding contact to deal ${dealId}:`, error);
      throw error;
    }
  }
}

export const dealsApi = new DealsApiService();
export default dealsApi;