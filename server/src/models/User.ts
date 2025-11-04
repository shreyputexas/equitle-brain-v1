export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  firm?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface JWTPayload {
  id: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}
