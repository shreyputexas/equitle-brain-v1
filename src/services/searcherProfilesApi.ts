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
      const response = await axios.get<{ success?: boolean; data?: { searcherProfiles?: SearcherProfile[] }; message?: string }>(API_BASE_URL, {
        headers: getAuthHeaders(),
        validateStatus: (status) => status < 500 // Don't throw on 4xx errors, let us handle them
      });
      
      // Check for HTTP error status codes (4xx)
      if (response.status >= 400 && response.status < 500) {
        console.warn('API returned client error status:', response.status, response.data);
        return [];
      }
      
      // Check if response structure is valid
      if (!response.data) {
        console.warn('API returned no data:', response);
        return [];
      }
      
      // Handle error response structures
      if (response.data.success === false) {
        console.warn('API returned unsuccessful response:', response.data);
        return [];
      }
      
      // Safely access nested properties - check each level before accessing
      const responseData = response.data;
      if (!responseData || typeof responseData !== 'object') {
        console.warn('API response.data is not an object:', responseData);
        return [];
      }
      
      const dataField = (responseData as any).data;
      if (!dataField || typeof dataField !== 'object') {
        console.warn('API response missing or invalid data field:', responseData);
        return [];
      }
      
      // Ensure searcherProfiles exists and is an array
      const profiles = dataField.searcherProfiles;
      if (profiles === undefined || profiles === null) {
        console.warn('API response missing searcherProfiles field:', dataField);
        return [];
      }
      
      if (!Array.isArray(profiles)) {
        console.warn('API response searcherProfiles is not an array:', profiles);
        return [];
      }
      
      return profiles;
    } catch (error: any) {
      console.error('Error fetching searcher profiles:', error);
      // Log more details for debugging
      if (error.response) {
        console.error('Error response status:', error.response.status);
        console.error('Error response data:', error.response.data);
      } else if (error.request) {
        console.error('No response received:', error.request);
      } else {
        console.error('Error setting up request:', error.message);
      }
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
