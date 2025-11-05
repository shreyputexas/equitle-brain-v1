import 'axios';

declare module 'axios' {
  // Make AxiosResponse generic default to any to avoid 'unknown' data warnings
  export interface AxiosResponse<T = any> extends Promise<T> {}
  export interface AxiosRequestConfig {
    // Allow custom config if needed later
    [key: string]: any;
  }
  export interface AxiosInstance {
    <T = any>(config: AxiosRequestConfig): Promise<T>;
    <T = any>(url: string, config?: AxiosRequestConfig): Promise<T>;
  }
}

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


