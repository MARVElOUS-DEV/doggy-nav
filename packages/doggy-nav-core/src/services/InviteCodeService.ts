import type { PageQuery, PageResult } from '../dto/pagination';
import type { InviteCode } from '../domain/types';
import type {
  InviteCodeRepository,
  InviteCodeListOptions,
  InviteCodeCreateItem,
  InviteCodeUpdatePatch,
} from '../repositories/InviteCodeRepository';

function normalizePage(page: PageQuery) {
  const pageSize = Math.min(Math.max(Number(page.pageSize) || 10, 1), 100);
  const pageNumber = Math.max(Number(page.pageNumber) || 1, 1);
  return { pageSize, pageNumber };
}

export class InviteCodeService {
  constructor(private readonly repo: InviteCodeRepository) {}

  async list(page: PageQuery, filter?: InviteCodeListOptions['filter']): Promise<PageResult<InviteCode>> {
    const { pageSize, pageNumber } = normalizePage(page);
    return this.repo.list({ page: { pageSize, pageNumber }, filter });
  }

  async createBulkByCount(params: {
    count: number;
    usageLimit: number;
    expiresAt?: string | null;
    note?: string | null;
    allowedEmailDomain?: string | null;
    createdBy?: string | null;
    codeLength?: number;
  }, gen?: (length: number) => string): Promise<{ codes: { id: string; code: string }[] }> {
    const count = Math.max(Math.min(Number(params.count) || 1, 100), 1);
    const usageLimit = Math.max(Math.min(Number(params.usageLimit) || 1, 1000), 1);
    const length = Math.max(Number(params.codeLength) || 12, 6);
    const codes = new Set<string>();
    const make = gen || ((len: number) => {
      const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let s = '';
      for (let i = 0; i < len; i++) s += alphabet[Math.floor(Math.random() * alphabet.length)];
      return s;
    });
    while (codes.size < count) {
      codes.add(make(length));
    }
    const items: InviteCodeCreateItem[] = Array.from(codes).map((code) => ({
      code,
      usageLimit,
      expiresAt: params.expiresAt ?? null,
      note: params.note ?? null,
      allowedEmailDomain: params.allowedEmailDomain ?? null,
      createdBy: params.createdBy ?? null,
    }));
    const created = await this.repo.createBulk(items);
    return { codes: created.map((c) => ({ id: c.id, code: c.code })) };
  }

  async update(id: string, patch: InviteCodeUpdatePatch): Promise<InviteCode | null> {
    // usageLimit cannot be set lower than usedCount; deactivate when usedCount >= usageLimit
    if (patch.usageLimit !== undefined) {
      const current = await this.repo.getById(id);
      if (!current) return null;
      if (patch.usageLimit < current.usedCount) {
        throw Object.assign(new Error('使用次数上限不能小于已使用次数'), { name: 'ValidationError' });
      }
      if (current.usedCount >= patch.usageLimit) {
        patch.active = false;
      }
    }
    if (typeof patch.allowedEmailDomain === 'string') {
      patch.allowedEmailDomain = patch.allowedEmailDomain.toLowerCase().replace(/^@/, '');
    }
    return this.repo.update(id, patch);
  }
}

export default InviteCodeService;
