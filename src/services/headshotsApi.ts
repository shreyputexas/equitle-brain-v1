import axios from 'axios';

export interface HeadshotUploadResponse {
  success: boolean;
  imageUrl?: string;
  message?: string;
  error?: string;
}

class HeadshotsApi {
  private baseURL = '/api/headshots';

  async uploadHeadshot(searcherId: string, file: File): Promise<HeadshotUploadResponse> {
    try {
      const formData = new FormData();
      formData.append('headshot', file);

      const response = await axios.post(`${this.baseURL}/upload/${searcherId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': 'Bearer mock-token'
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
      const response = await axios.delete(`${this.baseURL}/${searcherId}`, {
        headers: {
          'Authorization': 'Bearer mock-token'
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
