import type { ID } from './types';

export interface Application {
  id: ID;
  name: string;
  description?: string;
  clientSecret: string;
  isActive: boolean;
  allowedOrigins: string[];
  createdAt?: string;
  updatedAt?: string;
}
