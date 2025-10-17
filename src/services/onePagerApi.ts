import axios from 'axios';

export interface SearcherProfile {
  id: string;
  name: string;
  title: string;
  bio: string;
  why: string;
  education: Array<{
    id: string;
    institution: string;
    degree: string;
    field: string;
    startDate: string;
    endDate: string;
    current: boolean;
    description: string;
  }>;
  experience: Array<{
    id: string;
    company: string;
    position: string;
    startDate: string;
    endDate: string;
    current: boolean;
    description: string;
    achievements: string;
  }>;
}

export interface InvestmentCriteria {
  id: string;
  category: string;
  field: string;
  value: string | number;
  operator: string;
  weight: number;
  valuationType?: string;
}

export interface ThesisData {
  name: string;
  criteria: InvestmentCriteria[];
}

export interface OnePagerRequest {
  searcherProfiles: SearcherProfile[];
  thesisData: ThesisData;
  teamConnection?: string;
}

export interface OnePagerContent {
  whyWorkWithUs: string;
  investmentCriteria: string;
  industriesWeServe: string;
  ourStories: string;
}

export interface OnePagerResponse {
  success: boolean;
  content?: OnePagerContent;
  message?: string;
}

class OnePagerApi {
  private baseURL = '/api/one-pager';

  async generateContent(request: OnePagerRequest): Promise<OnePagerResponse> {
    try {
      const response = await axios.post(`${this.baseURL}/content`, request, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error generating one-pager content:', error);
      throw new Error(error.response?.data?.message || 'Failed to generate one-pager content');
    }
  }

  async generateDocx(request: OnePagerRequest): Promise<Blob> {
    try {
      const response = await axios.post(`${this.baseURL}/generate`, request, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        responseType: 'blob'
      });
      return response.data;
    } catch (error: any) {
      console.error('Error generating one-pager DOCX:', error);
      throw new Error(error.response?.data?.message || 'Failed to generate one-pager DOCX');
    }
  }
}

export const onePagerApi = new OnePagerApi();
