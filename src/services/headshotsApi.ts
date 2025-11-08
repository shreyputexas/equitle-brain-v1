import axios from '../lib/axios';

export interface HeadshotUploadResponse {
  success: boolean;
  imageUrl?: string;
  message?: string;
  error?: string;
}

class HeadshotsApi {
  private baseURL = '/api/headshots';

  private getAuthToken() {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication required. Please log in.');
    }
    return token;
  }

  async uploadHeadshot(searcherId: string, file: File): Promise<HeadshotUploadResponse> {
    try {
      const formData = new FormData();
      formData.append('headshot', file);

      const response = await axios.post<HeadshotUploadResponse>(`${this.baseURL}/upload/${searcherId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${this.getAuthToken()}`
        }
      });

      return response.data;
    } catch (error: any) {
      console.error('Error uploading headshot:', error);
      throw new Error(error.response?.data?.message || 'Failed to upload headshot');
    }
  }

  async deleteHeadshot(searcherId: string): Promise<HeadshotUploadResponse> {
    try {
      const response = await axios.delete<HeadshotUploadResponse>(`${this.baseURL}/${searcherId}`, {
        headers: {
          'Authorization': `Bearer ${this.getAuthToken()}`
        }
      });

      return response.data;
    } catch (error: any) {
      console.error('Error deleting headshot:', error);
      throw new Error(error.response?.data?.message || 'Failed to delete headshot');
    }
  }
}

export const headshotsApi = new HeadshotsApi();
