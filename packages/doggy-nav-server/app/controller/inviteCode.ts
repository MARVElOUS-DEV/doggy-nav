import CommonController from '../core/base_controller';
import { ValidationError } from '../core/errors';
import { TOKENS } from '../core/ioc';
import { randomBytes } from 'crypto';

export default class InviteCodeController extends CommonController {
  tableName(): string {
    return 'InviteCode';
  }

  async list() {
    const { ctx } = this;
    const rawQuery = ctx.query;
    const query = this.getSanitizedQuery();
    let { pageSize = 10, pageNumber = 1 } = query;
    pageSize = Math.min(Math.max(Number(pageSize) || 10, 1), 100);
    pageNumber = Math.max(Number(pageNumber) || 1, 1);
    const service = ctx.di.resolve(TOKENS.InviteCodeService);
    const filter: any = {};
    if (rawQuery.active !== undefined && rawQuery.active !== '' && rawQuery.active !== 'undefined') {
      filter.active = String(query.active) === 'true';
    }
    if (rawQuery.code !== undefined && rawQuery.code !== '' && rawQuery.code !== 'undefined') {
      filter.codeSearch = String(query.code || '');
    }
    const res = await service.list({ pageSize, pageNumber }, filter);
    this.success(res);
  }

  async create() {
    const { ctx } = this;
    const body = this.getSanitizedBody();
    const count = Number(body.count);
    const usageLimit = Number(body.usageLimit);
    if (!Number.isFinite(count) || count < 1 || count > 100) {
      throw new ValidationError('生成数量需在 1-100 之间');
    }
    if (!Number.isFinite(usageLimit) || usageLimit < 1 || usageLimit > 1000) {
      throw new ValidationError('使用次数需在 1-1000 之间');
    }
    const expiresAt = body.expiresAt ? new Date(body.expiresAt) : null;
    if (expiresAt && Number.isNaN(expiresAt.getTime())) {
      throw new ValidationError('过期时间格式不正确');
    }
    const note = body.note || '';
    const allowedEmailDomain = body.allowedEmailDomain ? String(body.allowedEmailDomain).toLowerCase().replace(/^@/, '') : null;

    const service = ctx.di.resolve(TOKENS.InviteCodeService);
    const codeLength = Number(ctx.app.config?.invite?.codeLength || 12);
    const gen = (len: number) => randomBytes(Math.ceil(len / 2)).toString('hex').slice(0, len).toUpperCase();
    const res = await service.createBulkByCount({
      count,
      usageLimit,
      expiresAt: expiresAt ? expiresAt.toISOString() : null,
      note,
      allowedEmailDomain,
      createdBy: (this.getUserInfo()?.userId as any) || null,
      codeLength,
    }, gen);
    this.success(res);
  }

  async update() {
    const { ctx } = this;
    const { id } = ctx.params;
    if (!id) {
      this.error('ID is required');
      return;
    }
    const body = this.getSanitizedBody();
    const service = ctx.di.resolve(TOKENS.InviteCodeService);
    const patch: any = {};
    if (body.active !== undefined) patch.active = !!body.active;
    if (body.usageLimit !== undefined) patch.usageLimit = Number(body.usageLimit);
    if (body.expiresAt !== undefined) {
      const expires = body.expiresAt ? new Date(body.expiresAt) : null;
      if (expires && Number.isNaN(expires.getTime())) throw new ValidationError('过期时间格式不正确');
      patch.expiresAt = expires ? expires.toISOString() : null;
    }
    if (body.note !== undefined) patch.note = body.note;
    if (body.allowedEmailDomain !== undefined) patch.allowedEmailDomain = body.allowedEmailDomain ?? null;
    const updated = await service.update(String(id), patch);
    if (!updated) return this.error('邀请码不存在');
    this.success(updated);
  }

  async revoke() {
    const { ctx } = this;
    const { id } = ctx.params;
    if (!id) {
      this.error('ID is required');
      return;
    }
    const repo = new MongooseInviteCodeRepository(ctx);
    const service = new InviteCodeService(repo);
    const updated = await service.update(String(id), { active: false });
    if (!updated) return this.error('邀请码不存在');
    this.success(updated);
  }
}
