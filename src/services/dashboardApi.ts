import axios from 'axios';

const API_BASE_URL = 'http://localhost:5001/api';

export interface DashboardMetrics {
  totalPortfolioValue: string;
  totalPortfolioValueChange: string;
  activeDeals: number;
  activeDealsChange: number;
  portfolioCompanies: number;
  portfolioCompaniesChange: number;
  totalContacts: number;
  totalContactsChange: number;
}

export interface DealFlowData {
  month: string;
  deals: number;
  value: number;
}

export interface PortfolioDistribution {
  name: string;
  value: number;
  color: string;
}

export interface RecentDeal {
  id: string;
  company: string;
  stage: string;
  value: string;
  status: string;
  progress: number;
  createdAt: string;
}

export interface DashboardData {
  metrics: DashboardMetrics;
  dealFlow: DealFlowData[];
  portfolioDistribution: PortfolioDistribution[];
  recentDeals: RecentDeal[];
  userName: string;
}

interface ApiResponse<T> {
  data: T;
}

class DashboardApiService {
  static async getDashboardData(): Promise<DashboardData> {
    try {
      const response = await axios.get<ApiResponse<DashboardData>>(`${API_BASE_URL}/dashboard`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      throw error;
    }
  }

  static async getMetrics(): Promise<DashboardMetrics> {
    try {
      const response = await axios.get<ApiResponse<DashboardMetrics>>(`${API_BASE_URL}/dashboard/metrics`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching dashboard metrics:', error);
      throw error;
    }
  }

  static async getDealFlow(): Promise<DealFlowData[]> {
    try {
      const response = await axios.get<ApiResponse<DealFlowData[]>>(`${API_BASE_URL}/dashboard/deal-flow`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching deal flow data:', error);
      throw error;
    }
  }

  static async getPortfolioDistribution(): Promise<PortfolioDistribution[]> {
    try {
      const response = await axios.get<ApiResponse<PortfolioDistribution[]>>(`${API_BASE_URL}/dashboard/portfolio-distribution`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching portfolio distribution:', error);
      throw error;
    }
  }

  static async getRecentDeals(): Promise<RecentDeal[]> {
    try {
      const response = await axios.get<ApiResponse<RecentDeal[]>>(`${API_BASE_URL}/dashboard/recent-deals`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching recent deals:', error);
      throw error;
    }
  }
}

export default DashboardApiService;