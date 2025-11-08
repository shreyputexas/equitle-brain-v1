import axios from '../lib/axios';

const API_BASE_URL = '/api/searcher-profiles';

export interface Education {
  id: string;
  institution: string;
  degree: string;
  field: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description?: string;
}

export interface Experience {
  id: string;
  company: string;
  position: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string;
  achievements?: string;
}

export interface SearcherProfile {
  id: string;
  name: string;
  title: string;
  bio: string;
  why: string;
  education: Education[];
  experience: Experience[];
  avatar?: string;
  headshotUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateSearcherProfileRequest {
  name: string;
  title: string;
  bio: string;
  why: string;
  education: Education[];
  experience: Experience[];
  avatar?: string;
}

export interface UpdateSearcherProfileRequest {
  name?: string;
  title?: string;
  bio?: string;
  why?: string;
  education?: Education[];
  experience?: Experience[];
  avatar?: string;
}

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('Authentication required. Please log in.');
  }
  const userId = localStorage.getItem('userId');

  console.log('🔐 Auth Debug:', {
    hasToken: !!localStorage.getItem('token'),
    userId: userId,
    message: '✅ Using authenticated token'
  });

  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

export const searcherProfilesApi = {
  // Get all searcher profiles
  async getSearcherProfiles(): Promise<SearcherProfile[]> {
    try {
      console.log('🚀 API Call: GET', API_BASE_URL);
      const response = await axios.get<{ success?: boolean; data?: { searcherProfiles: SearcherProfile[] } }>(API_BASE_URL, {
        headers: getAuthHeaders()
      });

      console.log('📥 API Response:', {
        status: response.status,
        success: response.data.success,
        hasData: !!response.data.data,
        profileCount: response.data.data?.searcherProfiles?.length || 0
      });

      // Handle both success and error response structures
      if (response.data.success === false || !response.data.data) {
        console.warn('⚠️ API returned unsuccessful response or missing data:', response.data);
        return [];
      }

      const profiles = response.data.data.searcherProfiles || [];
      console.log(`✅ Successfully fetched ${profiles.length} searcher profiles:`, profiles.map(p => ({ id: p.id, name: p.name })));
      return profiles;
    } catch (error: any) {
      console.error('❌ Error fetching searcher profiles:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: API_BASE_URL,
        fullError: error
      });
      // Return empty array instead of throwing to prevent page crashes
      return [];
    }
  },

  // Get a specific searcher profile
  async getSearcherProfile(searcherId: string): Promise<SearcherProfile> {
    try {
      const response = await axios.get<{ data: { searcherProfile: SearcherProfile } }>(`${API_BASE_URL}/${searcherId}`, {
        headers: getAuthHeaders()
      });
      return response.data.data.searcherProfile;
    } catch (error) {
      console.error('Error fetching searcher profile:', error);
      throw error;
    }
  },

  // Create a new searcher profile
  async createSearcherProfile(searcherData: CreateSearcherProfileRequest): Promise<SearcherProfile> {
    try {
      const response = await axios.post<{ data: { searcherProfile: SearcherProfile } }>(API_BASE_URL, searcherData, {
        headers: getAuthHeaders()
      });
      return response.data.data.searcherProfile;
    } catch (error) {
      console.error('Error creating searcher profile:', error);
      throw error;
    }
  },

  // Update a searcher profile
  async updateSearcherProfile(searcherId: string, updateData: UpdateSearcherProfileRequest): Promise<SearcherProfile> {
    try {
      console.log('🌐 API Call - Updating searcher profile:', {
        url: `${API_BASE_URL}/${searcherId}`,
        searcherId,
        updateData,
        headers: getAuthHeaders()
      });
      
      const response = await axios.put<{ data: { searcherProfile: SearcherProfile } }>(`${API_BASE_URL}/${searcherId}`, updateData, {
        headers: getAuthHeaders()
      });
      
      console.log('🌐 API Response - Updated searcher profile:', {
        status: response.status,
        data: response.data
      });
      
      return response.data.data.searcherProfile;
    } catch (error) {
      console.error('Error updating searcher profile:', error);
      throw error;
    }
  },

  // Delete a searcher profile
  async deleteSearcherProfile(searcherId: string): Promise<void> {
    try {
      await axios.delete(`${API_BASE_URL}/${searcherId}`, {
        headers: getAuthHeaders()
      });
    } catch (error) {
      console.error('Error deleting searcher profile:', error);
      throw error;
    }
  }
};
