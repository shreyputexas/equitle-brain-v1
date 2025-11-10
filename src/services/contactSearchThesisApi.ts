import axios from '../lib/axios';

export interface PeopleCriteria {
  industries: string;
  location: string;
  companySizeRange: string;
  fundingStage: string;
  technologies: string;
  jobDepartments: string;
}

export interface BrokerCriteria {
  industries: string;
  subindustries: string;
  location: string;
  experience: string;
  dealSize: string;
  keywords: string;
}

export interface InvestorCriteria {
  industries: string;
  subindustries: string;
  location: string;
  investmentStage: string;
  checkSize: string;
  keywords: string;
}

export interface ContactSearchThesis {
  id?: string;
  name: string;
  contactType: 'people' | 'brokers' | 'investors';
  peopleCriteria?: PeopleCriteria;
  brokerCriteria?: BrokerCriteria;
  investorCriteria?: InvestorCriteria;
  createdAt?: Date;
  updatedAt?: Date;
}

class ContactSearchThesisApiService {
  private baseURL = '/api/contact-search-theses';

  /**
   * Get all contact search theses with optional filtering by contact type
   */
  async getTheses(contactType?: 'people' | 'brokers' | 'investors'): Promise<ContactSearchThesis[]> {
    try {
      const params = contactType ? `?contactType=${contactType}` : '';
      const response = await axios.get<any>(`${this.baseURL}${params}`);
      return response.data?.data?.theses || [];
    } catch (error) {
      console.error('Error fetching contact search theses:', error);
      throw error;
    }
  }

  /**
   * Get a single contact search thesis by ID
   */
  async getThesis(id: string): Promise<ContactSearchThesis> {
    try {
      const response = await axios.get<any>(`${this.baseURL}/${id}`);
      return response.data?.data?.thesis;
    } catch (error) {
      console.error(`Error fetching contact search thesis ${id}:`, error);
      throw error;
    }
  }

  /**
   * Create a new contact search thesis
   */
  async createThesis(thesis: Omit<ContactSearchThesis, 'id' | 'createdAt' | 'updatedAt'>): Promise<ContactSearchThesis> {
    try {
      const response = await axios.post<any>(this.baseURL, thesis);
      return response.data?.data?.thesis;
    } catch (error) {
      console.error('Error creating contact search thesis:', error);
      throw error;
    }
  }

  /**
   * Update an existing contact search thesis
   */
  async updateThesis(id: string, thesis: Partial<Omit<ContactSearchThesis, 'id' | 'createdAt' | 'updatedAt'>>): Promise<ContactSearchThesis> {
    try {
      const response = await axios.put<any>(`${this.baseURL}/${id}`, thesis);
      return response.data?.data?.thesis;
    } catch (error) {
      console.error(`Error updating contact search thesis ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete a contact search thesis
   */
  async deleteThesis(id: string): Promise<void> {
    try {
      await axios.delete(`${this.baseURL}/${id}`);
    } catch (error) {
      console.error(`Error deleting contact search thesis ${id}:`, error);
      throw error;
    }
  }
}

export const contactSearchThesisApi = new ContactSearchThesisApiService();
export default contactSearchThesisApi;
