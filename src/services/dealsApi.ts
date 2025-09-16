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
  private baseURL = 'http://localhost:4000/api';

  constructor() {
    // Configure axios defaults
    axios.defaults.baseURL = this.baseURL;
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

      const response = await axios.get(`/deals?${params.toString()}`, {
        headers: this.getAuthHeaders()
      });
      return response.data;
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
      const response = await axios.get(`/deals/${id}`, {
        headers: this.getAuthHeaders()
      });
      return response.data;
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
      const response = await axios.post('/deals', dealData, {
        headers: this.getAuthHeaders()
      });
      return response.data;
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
      const response = await axios.put(`/deals/${id}`, dealData, {
        headers: this.getAuthHeaders()
      });
      return response.data;
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
      await axios.delete(`/deals/${id}`, {
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
      await axios.post(`/deals/${dealId}/contacts`, { contactId }, {
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