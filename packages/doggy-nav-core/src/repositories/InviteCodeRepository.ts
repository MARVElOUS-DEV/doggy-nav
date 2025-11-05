import type { InviteCode } from '../types/types';
import type { PageQuery, PageResult } from '../dto/pagination';

export interface InviteCodeListOptions {
  page: PageQuery;
  filter?: {
    active?: boolean;
    codeSearch?: string;
  };
}

export interface InviteCodeCreateItem {
  code: string;
  usageLimit: number;
  expiresAt?: string | null;
  allowedEmailDomain?: string | null;
  note?: string | null;
  createdBy?: string | null;
}

export interface InviteCodeUpdatePatch {
  active?: boolean;
  usageLimit?: number;
  expiresAt?: string | null;
  note?: string | null;
  allowedEmailDomain?: string | null;
}

export interface InviteCodeRepository {
  list(options: InviteCodeListOptions): Promise<PageResult<InviteCode>>;
  createBulk(items: InviteCodeCreateItem[]): Promise<InviteCode[]>;
  getById(id: string): Promise<InviteCode | null>;
  update(id: string, patch: InviteCodeUpdatePatch): Promise<InviteCode | null>;
}
