import axios from '../lib/axios';

// Base URL is set in AuthContext globally

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
  success?: boolean;
  data?: {
    funds?: T[];
    fund?: T;
  };
  funds?: T[];
  fund?: T;
  message?: string;
}

class FundsApiService {
  static async getFunds(): Promise<Fund[]> {
    try {
      // Auth headers automatically added by axios interceptor
      const response = await axios.get<ApiResponse<Fund>>(`/firebase-funds`);
      // Firebase API returns { success: true, data: { funds: [] } }
      // but frontend expects { funds: [] }
      return response.data.data?.funds || response.data.funds || [];
    } catch (error) {
      console.error('Error fetching funds:', error);
      throw error;
    }
  }

  static async createFund(fundData: CreateFundRequest): Promise<Fund> {
    try {
      const response = await axios.post<ApiResponse<Fund>>(`/firebase-funds`, fundData, {
        // Auth headers automatically added by axios interceptor
      });
      // Firebase API returns { success: true, data: { fund: {} } }
      // but frontend expects { fund: {} }
      return response.data.data?.fund || response.data.fund!;
    } catch (error) {
      console.error('Error creating fund:', error);
      throw error;
    }
  }

  static async getFund(id: string): Promise<Fund> {
    try {
      const response = await axios.get<ApiResponse<Fund>>(`/firebase-funds/${id}`, {
        // Auth headers automatically added by axios interceptor
      });
      // Firebase API returns { success: true, data: { fund: {} } }
      // but frontend expects { fund: {} }
      return response.data.data?.fund || response.data.fund!;
    } catch (error) {
      console.error('Error fetching fund:', error);
      throw error;
    }
  }

  static async updateFund(id: string, fundData: Partial<CreateFundRequest>): Promise<Fund> {
    try {
      const response = await axios.put<ApiResponse<Fund>>(`/firebase-funds/${id}`, fundData, {
        // Auth headers automatically added by axios interceptor
      });
      // Firebase API returns { success: true, data: { fund: {} } }
      // but frontend expects { fund: {} }
      return response.data.data?.fund || response.data.fund!;
    } catch (error) {
      console.error('Error updating fund:', error);
      throw error;
    }
  }

  static async deleteFund(id: string): Promise<void> {
    try {
      console.log('FundsApiService.deleteFund called with id:', id);
      const response = await axios.delete(`/firebase-funds/${id}`, {
        // Auth headers automatically added by axios interceptor
      });
      console.log('Delete response:', response);
    } catch (error) {
      console.error('Error deleting fund:', error);
      throw error;
    }
  }
}

export default FundsApiService;