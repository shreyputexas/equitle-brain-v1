import axios from '../lib/axios';

export interface Broker {
  id: string;
  name: string;
  type?: string;
  dealSize?: string;
  specialization?: string;
  status: 'active' | 'paused' | 'closed' | 'not-interested';
  stage: 'all' | 'response-received' | 'closing';
  notes?: string;
  website?: string;
  location?: string;
  aum?: string;
  firmName?: string;
  brokerType?: 'firm' | 'individual';
  priority?: 'low' | 'medium' | 'high';
  nextStep?: string;
  lastActivity?: Date;
  createdAt?: Date;
  updatedAt?: Date;
  contactCount?: number;
  communicationCount?: number;
  // Relationships
  contacts?: any[];
  communications?: any[];
  people?: Person[];
}

export interface Person {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  title?: string;
  company?: string;
  linkedinUrl?: string;
  relationshipScore?: number;
  status?: 'hot' | 'warm' | 'cold' | 'inactive';
  isKeyContact?: boolean;
  lastContact?: Date;
  notes?: string;
  tags?: string[];
}

export interface Communication {
  id: string;
  type: 'email' | 'call' | 'meeting' | 'sms';
  subject?: string;
  content?: string;
  direction: 'inbound' | 'outbound';
  status?: string;
  date?: Date;
  threadId?: string;
  messageId?: string;
  fromEmail?: string;
  toEmails?: string[];
  snippet?: string;
}

export interface CreateBrokerData {
  name: string;
  type?: string;
  dealSize?: string;
  specialization?: string;
  status?: 'active' | 'paused' | 'closed' | 'not-interested';
  stage?: 'all' | 'response-received' | 'closing';
  notes?: string;
  website?: string;
  location?: string;
  aum?: string;
  firmName?: string;
  brokerType?: 'firm' | 'individual';
  priority?: 'low' | 'medium' | 'high';
  nextStep?: string;
  contactIds?: string[];
}

export interface UpdateBrokerData extends Partial<CreateBrokerData> {}

export interface BrokersFilters {
  search?: string;
  stage?: string;
  status?: string;
  limit?: number;
  offset?: number;
  include?: string;
}

class BrokersApiService {
  private baseURL = '/api/firebase-brokers';

  /**
   * Get all brokers with optional filters
   */
  async getBrokers(filters: BrokersFilters = {}): Promise<{ brokers: Broker[]; total: number }> {
    try {
      const params = new URLSearchParams();

      if (filters.search) params.append('search', filters.search);
      if (filters.stage) params.append('stage', filters.stage);
      if (filters.status) params.append('status', filters.status);
      if (filters.limit) params.append('limit', filters.limit.toString());
      if (filters.offset) params.append('offset', filters.offset.toString());
      if (filters.include) params.append('include', filters.include);

      const response = await axios.get<any>(`${this.baseURL}/brokers?${params.toString()}`);
      const data = response.data?.data || response.data;

      return {
        brokers: data.brokers || [],
        total: data.total || 0
      };
    } catch (error) {
      console.error('Error fetching brokers:', error);
      throw error;
    }
  }

  /**
   * Get a single broker by ID
   */
  async getBroker(id: string, include?: string): Promise<Broker> {
    try {
      const params = include ? `?include=${include}` : '';
      const response = await axios.get<any>(`${this.baseURL}/brokers/${id}${params}`);
      return response.data?.data?.broker || response.data?.broker;
    } catch (error) {
      console.error(`Error fetching broker ${id}:`, error);
      throw error;
    }
  }

  /**
   * Create a new broker
   */
  async createBroker(brokerData: CreateBrokerData): Promise<Broker> {
    try {
      const response = await axios.post<any>(`${this.baseURL}/brokers`, brokerData);
      return response.data?.data?.broker || response.data?.broker;
    } catch (error) {
      console.error('Error creating broker:', error);
      throw error;
    }
  }

  /**
   * Update an existing broker
   */
  async updateBroker(id: string, brokerData: UpdateBrokerData): Promise<Broker> {
    try {
      const response = await axios.put<any>(`${this.baseURL}/brokers/${id}`, brokerData);
      return response.data?.data?.broker || response.data?.broker;
    } catch (error) {
      console.error(`Error updating broker ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete a broker
   */
  async deleteBroker(id: string): Promise<void> {
    try {
      await axios.delete(`${this.baseURL}/brokers/${id}`);
    } catch (error) {
      console.error(`Error deleting broker ${id}:`, error);
      throw error;
    }
  }

  /**
   * Associate a contact with a broker
   */
  async associateContact(brokerId: string, contactId: string): Promise<void> {
    try {
      await axios.post(`${this.baseURL}/brokers/${brokerId}/contacts/${contactId}`);
    } catch (error) {
      console.error(`Error associating contact ${contactId} with broker ${brokerId}:`, error);
      throw error;
    }
  }

  /**
   * Associate a communication with a broker
   */
  async associateCommunication(brokerId: string, communicationId: string): Promise<void> {
    try {
      await axios.post(`${this.baseURL}/brokers/${brokerId}/communications/${communicationId}`);
    } catch (error) {
      console.error(`Error associating communication ${communicationId} with broker ${brokerId}:`, error);
      throw error;
    }
  }
}

export const brokersApi = new BrokersApiService();
export default brokersApi;
