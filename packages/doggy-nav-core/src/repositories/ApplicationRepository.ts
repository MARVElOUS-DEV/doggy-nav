import type { Application } from '../types/application';
import type { PageQuery } from '../dto/pagination';

export interface ApplicationCreateInput {
  name: string;
  description?: string;
  clientSecret: string;
  allowedOrigins?: string[];
}

export interface ApplicationUpdateInput {
  name?: string;
  description?: string;
  allowedOrigins?: string[];
  isActive?: boolean;
}

export interface ApplicationRepository {
  create(input: ApplicationCreateInput): Promise<Application>;
  update(id: string, updates: ApplicationUpdateInput): Promise<Application | null>;
  list(page: PageQuery): Promise<{ applications: Application[]; total: number }>;
  getById(id: string): Promise<Application | null>;
  getByClientSecret(secret: string): Promise<Application | null>;
  setClientSecret(id: string, secret: string): Promise<void>;
  revoke(id: string): Promise<boolean>;
}
