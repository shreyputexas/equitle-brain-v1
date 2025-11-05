import 'axios';

declare module 'axios' {
  // Default AxiosResponse<T> generic to any to avoid 'unknown' in untyped calls
  // This keeps backward-compatible behavior for existing code paths
  // You can still provide precise generics per call to get strict typing
  export interface AxiosResponse<T = any> {
    data: T;
  }
}


