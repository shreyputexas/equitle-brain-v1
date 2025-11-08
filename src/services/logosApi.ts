import axios from '../lib/axios';
import { getApiUrl } from '../config/api';

export interface LogoUploadResponse {
  success: boolean;
  imageUrl: string;
  message: string;
}

export interface LogoDeleteResponse {
  success: boolean;
  message: string;
}

const getAuthToken = () => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('Authentication required. Please log in.');
  }
  return token;
};

export const logosApi = {
  uploadLogo: async (file: File): Promise<LogoUploadResponse> => {
    const formData = new FormData();
    formData.append('logo', file);

    const response = await axios.post<LogoUploadResponse>(getApiUrl('logos/upload'), formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${getAuthToken()}`
      }
    });

    return response.data;
  },

  deleteLogo: async (): Promise<LogoDeleteResponse> => {
    const response = await axios.delete<LogoDeleteResponse>(getApiUrl('logos'), {
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`
      }
    });

    return response.data;
  }
};
