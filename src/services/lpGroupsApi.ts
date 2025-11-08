import axios from '../lib/axios';

// Base URL is set in AuthContext globally

export interface LPGroup {
  id: string;
  userId: string;
  name: string;
  description?: string;
  type: 'system' | 'custom';
  criteria?: {
    investorTypes?: string[];
    minCommitment?: number;
    maxCommitment?: number;
    regions?: string[];
  };
  autoAssign: boolean;
  emailPreferences?: {
    enableNotifications?: boolean;
    frequency?: string;
    types?: string[];
  };
  memberCount: number;
  members: Array<{
    id: string;
    investorId: string;
    groupId: string;
    autoAssigned: boolean;
    createdAt: string;
    investor: {
      id: string;
      name: string;
      type: string;
      totalCommitment?: number;
    };
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLPGroupRequest {
  name: string;
  description?: string;
  criteria?: {
    investorTypes?: string[];
    minCommitment?: number;
    maxCommitment?: number;
    regions?: string[];
  };
  autoAssign?: boolean;
  emailPreferences?: {
    enableNotifications?: boolean;
    frequency?: string;
    types?: string[];
  };
}

export interface UpdateLPGroupRequest extends Partial<CreateLPGroupRequest> {}

interface ApiResponse<T> {
  success: boolean;
  data: {
    groups?: T[];
    group?: T;
  };
  message?: string;
}

class LPGroupsApiService {
  private static getAuthToken() {
    return localStorage.getItem('token');
  }

  private static getAuthHeaders() {
    const token = this.getAuthToken();
    if (!token) {
      throw new Error('Authentication required. Please log in.');
    }
    return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  }

  static async getLPGroups(): Promise<LPGroup[]> {
    try {
      const response = await axios.get<ApiResponse<LPGroup>>(`/firebase-lp-groups`, {
        headers: this.getAuthHeaders()
      });
      // Firebase API returns { success: true, data: { groups: [] } }
      // but frontend expects { groups: [] }
      return response.data.data.groups || [];
    } catch (error) {
      console.error('Error fetching LP groups:', error);
      throw error;
    }
  }

  static async createLPGroup(groupData: CreateLPGroupRequest): Promise<LPGroup> {
    try {
      const response = await axios.post<ApiResponse<LPGroup>>(`/firebase-lp-groups`, groupData, {
        headers: this.getAuthHeaders()
      });
      // Firebase API returns { success: true, data: { group: {} } }
      // but frontend expects { group: {} }
      return response.data.data.group!;
    } catch (error) {
      console.error('Error creating LP group:', error);
      throw error;
    }
  }

  static async getLPGroup(id: string): Promise<LPGroup> {
    try {
      const response = await axios.get<ApiResponse<LPGroup>>(`/firebase-lp-groups/${id}`, {
        headers: this.getAuthHeaders()
      });
      // Firebase API returns { success: true, data: { group: {} } }
      // but frontend expects { group: {} }
      return response.data.data.group!;
    } catch (error) {
      console.error('Error fetching LP group:', error);
      throw error;
    }
  }

  static async updateLPGroup(id: string, groupData: UpdateLPGroupRequest): Promise<LPGroup> {
    try {
      const response = await axios.put<ApiResponse<LPGroup>>(`/firebase-lp-groups/${id}`, groupData, {
        headers: this.getAuthHeaders()
      });
      // Firebase API returns { success: true, data: { group: {} } }
      // but frontend expects { group: {} }
      return response.data.data.group!;
    } catch (error) {
      console.error('Error updating LP group:', error);
      throw error;
    }
  }

  static async deleteLPGroup(id: string): Promise<void> {
    try {
      await axios.delete(`/firebase-lp-groups/${id}`, {
        headers: this.getAuthHeaders()
      });
    } catch (error) {
      console.error('Error deleting LP group:', error);
      throw error;
    }
  }

  static async addInvestorToGroup(groupId: string, investorId: string): Promise<void> {
    try {
      await axios.post(`/firebase-lp-groups/${groupId}/members`,
        { investorId },
        {
          headers: this.getAuthHeaders()
        }
      );
    } catch (error) {
      console.error('Error adding investor to group:', error);
      throw error;
    }
  }

  static async removeInvestorFromGroup(groupId: string, investorId: string): Promise<void> {
    try {
      await axios.delete(`/firebase-lp-groups/${groupId}/members/${investorId}`, {
        headers: this.getAuthHeaders()
      });
    } catch (error) {
      console.error('Error removing investor from group:', error);
      throw error;
    }
  }
}

export default LPGroupsApiService;