export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

import 'axios';

declare module 'axios' {
  export interface AxiosResponse<T = any> {
    data: T;
  }
}


