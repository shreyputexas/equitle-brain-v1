import axios from 'axios';

const API_BASE_URL = 'http://localhost:4000/api';

export interface Fund {
  id: string;
  userId: string;
  name: string;
  type: string;
  strategy?: string;
  targetSize: number;
  minimumCommitment?: number;
  managementFee?: number;
  carriedInterest?: number;
  currency: string;
  vintage?: number;
  investmentPeriod?: number;
  fundTerm?: number;
  geoFocus?: string;
  sectorFocus?: string;
  description?: string;
  status: string;
  raisedAmount: number;
  investorCount: number;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFundRequest {
  name: string;
  type: string;
  strategy?: string;
  targetSize: number;
  minimumCommitment?: number;
  managementFee?: number;
  carriedInterest?: number;
  currency?: string;
  vintage?: number;
  investmentPeriod?: number;
  fundTerm?: number;
  geoFocus?: string;
  sectorFocus?: string;
  description?: string;
  status?: string;
}

interface ApiResponse<T> {
  funds?: T[];
  fund?: T;
  message?: string;
}

class FundsApiService {
  private static getAuthToken() {
    return localStorage.getItem('token');
  }

  private static getAuthHeaders() {
    const token = this.getAuthToken();
    // For development, use mock token if no real token exists
    const authToken = token || 'mock-token';
    return { Authorization: `Bearer ${authToken}`, 'Content-Type': 'application/json' };
  }

  static async getFunds(): Promise<Fund[]> {
    try {
      const response = await axios.get<ApiResponse<Fund>>(`${API_BASE_URL}/firebase-funds`, {
        headers: this.getAuthHeaders()
      });
      // Firebase API returns { success: true, data: { funds: [] } }
      // but frontend expects { funds: [] }
      return response.data.data.funds || [];
    } catch (error) {
      console.error('Error fetching funds:', error);
      throw error;
    }
  }

  static async createFund(fundData: CreateFundRequest): Promise<Fund> {
    try {
      const response = await axios.post<ApiResponse<Fund>>(`${API_BASE_URL}/firebase-funds`, fundData, {
        headers: this.getAuthHeaders()
      });
      // Firebase API returns { success: true, data: { fund: {} } }
      // but frontend expects { fund: {} }
      return response.data.data.fund!;
    } catch (error) {
      console.error('Error creating fund:', error);
      throw error;
    }
  }

  static async getFund(id: string): Promise<Fund> {
    try {
      const response = await axios.get<ApiResponse<Fund>>(`${API_BASE_URL}/firebase-funds/${id}`, {
        headers: this.getAuthHeaders()
      });
      // Firebase API returns { success: true, data: { fund: {} } }
      // but frontend expects { fund: {} }
      return response.data.data.fund!;
    } catch (error) {
      console.error('Error fetching fund:', error);
      throw error;
    }
  }

  static async updateFund(id: string, fundData: Partial<CreateFundRequest>): Promise<Fund> {
    try {
      const response = await axios.put<ApiResponse<Fund>>(`${API_BASE_URL}/firebase-funds/${id}`, fundData, {
        headers: this.getAuthHeaders()
      });
      // Firebase API returns { success: true, data: { fund: {} } }
      // but frontend expects { fund: {} }
      return response.data.data.fund!;
    } catch (error) {
      console.error('Error updating fund:', error);
      throw error;
    }
  }

  static async deleteFund(id: string): Promise<void> {
    try {
      console.log('FundsApiService.deleteFund called with id:', id);
      console.log('Using headers:', this.getAuthHeaders());
      const response = await axios.delete(`${API_BASE_URL}/firebase-funds/${id}`, {
        headers: this.getAuthHeaders()
      });
      console.log('Delete response:', response);
    } catch (error) {
      console.error('Error deleting fund:', error);
      throw error;
    }
  }
}

export default FundsApiService;