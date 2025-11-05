import axios from 'axios';

const API_BASE_URL = 'http://localhost:4001/api';

export interface LogoUploadResponse {
  success: boolean;
  imageUrl: string;
  message: string;
}

export interface LogoDeleteResponse {
  success: boolean;
  message: string;
}

export const logosApi = {
  uploadLogo: async (file: File): Promise<LogoUploadResponse> => {
    const formData = new FormData();
    formData.append('logo', file);

    const response = await axios.post<LogoUploadResponse>(`${API_BASE_URL}/logos/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': 'Bearer mock-token'
      }
    });

    return response.data;
  },

  deleteLogo: async (): Promise<LogoDeleteResponse> => {
    const response = await axios.delete<LogoDeleteResponse>(`${API_BASE_URL}/logos`, {
      headers: {
        'Authorization': 'Bearer mock-token'
      }
    });

    return response.data;
  }
};
