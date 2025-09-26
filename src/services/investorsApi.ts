import axios from 'axios';

// Base URL is set in AuthContext globally
// Cache bust: 2025-09-26T01:22

export interface InvestorEntity {
  id: string;
  investorId: string;
  name: string;
  type: string;
  investmentType: string;
  commitment?: number;
  called?: number;
  status: string;
  documents?: any;
  fundInvestments?: any;
  createdAt: string;
  updatedAt: string;
}

export interface Investor {
  id: string;
  userId: string;
  name: string;
  type: string;
  status: string;
  totalCommitment?: number;
  totalCalled?: number;
  description?: string;
  website?: string;
  location?: string;
  founded?: string;
  aum?: number;
  tags: string[];
  metadata?: {
    contactName?: string;
    contactEmail?: string;
    contactPhone?: string;
    address?: string;
    currency?: string;
    isQualifiedInvestor?: boolean;
    requiresReporting?: boolean;
    taxExempt?: boolean;
    onboardingDate?: string;
  };
  createdAt: string;
  updatedAt: string;
  entities: InvestorEntity[];
}

export interface CreateInvestorRequest {
  name: string;
  type: string;
  region?: string;
  commitment: number;
  called?: number;
  currency?: string;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  address?: string;
  website?: string;
  description?: string;
  investmentPreferences?: string[];
  isQualifiedInvestor?: boolean;
  requiresReporting?: boolean;
  taxExempt?: boolean;
  status?: string;
  onboardingDate?: string;
  entities?: any[];
}

interface ApiResponse<T> {
  investors?: T[];
  investor?: T;
  message?: string;
}

class InvestorsApiService {
  private static getAuthToken() {
    return localStorage.getItem('token');
  }

  private static getAuthHeaders() {
    const token = this.getAuthToken();
    // For development, use mock token if no real token exists
    const authToken = token || 'mock-token';
    return { Authorization: `Bearer ${authToken}`, 'Content-Type': 'application/json' };
  }

  static async getInvestors(): Promise<Investor[]> {
    try {
      const response = await axios.get<ApiResponse<Investor>>(`/firebase-investors`, {
        headers: this.getAuthHeaders()
      });
      // Firebase API returns { success: true, data: { investors: [] } }
      // but frontend expects { investors: [] }
      return response.data.data.investors || [];
    } catch (error) {
      console.error('Error fetching investors:', error);
      throw error;
    }
  }

  static async createInvestor(investorData: CreateInvestorRequest): Promise<Investor> {
    try {
      const response = await axios.post<ApiResponse<Investor>>(`/firebase-investors`, investorData, {
        headers: this.getAuthHeaders()
      });
      // Firebase API returns { success: true, data: { investor: {} } }
      // but frontend expects { investor: {} }
      return response.data.data.investor!;
    } catch (error) {
      console.error('Error creating investor:', error);
      throw error;
    }
  }

  static async getInvestor(id: string): Promise<Investor> {
    try {
      const response = await axios.get<ApiResponse<Investor>>(`/firebase-investors/${id}`, {
        headers: this.getAuthHeaders()
      });
      // Firebase API returns { success: true, data: { investor: {} } }
      // but frontend expects { investor: {} }
      return response.data.data.investor!;
    } catch (error) {
      console.error('Error fetching investor:', error);
      throw error;
    }
  }

  static async updateInvestor(id: string, investorData: Partial<CreateInvestorRequest>): Promise<Investor> {
    try {
      const response = await axios.put<ApiResponse<Investor>>(`/firebase-investors/${id}`, investorData, {
        headers: this.getAuthHeaders()
      });
      // Firebase API returns { success: true, data: { investor: {} } }
      // but frontend expects { investor: {} }
      return response.data.data.investor!;
    } catch (error) {
      console.error('Error updating investor:', error);
      throw error;
    }
  }

  static async deleteInvestor(id: string): Promise<void> {
    try {
      await axios.delete(`/firebase-investors/${id}`, {
        headers: this.getAuthHeaders()
      });
    } catch (error) {
      console.error('Error deleting investor:', error);
      throw error;
    }
  }
}

export default InvestorsApiService;