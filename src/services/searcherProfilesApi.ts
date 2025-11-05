import axios from 'axios';

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

const getAuthHeaders = () => ({
  'Authorization': `Bearer ${localStorage.getItem('token') || 'mock-token'}`,
  'Content-Type': 'application/json'
});

export const searcherProfilesApi = {
  // Get all searcher profiles
  async getSearcherProfiles(): Promise<SearcherProfile[]> {
    try {
      const response = await axios.get<{ data: { searcherProfiles: SearcherProfile[] } }>(API_BASE_URL, {
        headers: getAuthHeaders()
      });
      return response.data.data.searcherProfiles;
    } catch (error) {
      console.error('Error fetching searcher profiles:', error);
      throw error;
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
