import type { Audience } from '../types/types';

export interface NavAdminCreateInput {
  name: string;
  href: string;
  desc?: string | null;
  logo?: string | null;
  categoryId?: string | null;
  tags?: string[];
  authorName?: string | null;
  authorUrl?: string | null;
  audience?: Audience;
}

export interface NavAdminUpdateInput {
  name?: string;
  href?: string;
  desc?: string | null;
  logo?: string | null;
  categoryId?: string | null;
  tags?: string[];
  authorName?: string | null;
  authorUrl?: string | null;
  audience?: Audience;
}

export interface NavAdminRepository {
  create(input: NavAdminCreateInput): Promise<{ id: string }>; 
  update(id: string, input: NavAdminUpdateInput): Promise<{ id: string } | null>;
  delete(id: string): Promise<boolean>;
  setAudit(id: string, status: number, reason?: string): Promise<boolean>;
}
