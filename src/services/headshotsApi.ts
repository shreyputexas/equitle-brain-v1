import axios from '../lib/axios';

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

      // Auth headers are automatically added by axios interceptor
      const response = await axios.post<HeadshotUploadResponse>(`${this.baseURL}/upload/${searcherId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
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
      // Auth headers are automatically added by axios interceptor
      const response = await axios.delete<HeadshotUploadResponse>(`${this.baseURL}/${searcherId}`);

      return response.data;
    } catch (error: any) {
      console.error('Error deleting headshot:', error);
      throw new Error(error.response?.data?.message || 'Failed to delete headshot');
    }
  }
}

export const headshotsApi = new HeadshotsApi();
