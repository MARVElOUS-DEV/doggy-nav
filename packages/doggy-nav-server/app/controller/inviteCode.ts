import CommonController from '../core/base_controller';
import { ValidationError } from '../core/errors';

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
    const skip = pageSize * (pageNumber - 1);

    const filters: any = {};
    // Only apply filters when values are truly provided, not string 'undefined' or empty
    if (rawQuery.active !== undefined && rawQuery.active !== '' && rawQuery.active !== 'undefined') {
      filters.active = String(query.active) === 'true';
    }
    if (rawQuery.code !== undefined && rawQuery.code !== '' && rawQuery.code !== 'undefined') {
      const codeStr = String(query.code || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filters.code = { $regex: new RegExp(codeStr, 'i') };
    }

    const [ data, total ] = await Promise.all([
      ctx.model.InviteCode.find(filters)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize),
      ctx.model.InviteCode.countDocuments(filters),
    ]);

    this.success({
      data,
      total,
      pageNumber: Math.ceil(total / pageSize),
    });
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

    const generatedCodes: any[] = [];
    for (let i = 0; i < count; i++) {
      let code = ctx.service.inviteCode.generateCode();
      while (generatedCodes.some(item => item.code === code)) {
        code = ctx.service.inviteCode.generateCode();
      }
      generatedCodes.push({
        code,
        usageLimit,
        expiresAt,
        note,
        allowedEmailDomain,
        createdBy: this.getUserInfo()?.userId || null,
      });
    }

    const created = await ctx.model.InviteCode.insertMany(generatedCodes);
    this.success({
      codes: created.map(c => ({ code: c.code, id: c._id?.toString?.() ?? c.id })),
    });
  }

  async update() {
    const { ctx } = this;
    const { id } = ctx.params;
    if (!id) {
      this.error('ID is required');
      return;
    }

    const existing = await ctx.model.InviteCode.findById(id);
    if (!existing) {
      this.error('邀请码不存在');
      return;
    }

    const body = this.getSanitizedBody();
    const update: any = {};
    if (body.active !== undefined) {
      update.active = !!body.active;
    }
    if (body.usageLimit !== undefined) {
      const limit = Number(body.usageLimit);
      if (!Number.isFinite(limit) || limit < existing.usedCount) {
        throw new ValidationError('使用次数上限不能小于已使用次数');
      }
      update.usageLimit = limit;
      if (existing.usedCount >= limit) {
        update.active = false;
      }
    }
    if (body.expiresAt !== undefined) {
      const expires = body.expiresAt ? new Date(body.expiresAt) : null;
      if (expires && Number.isNaN(expires.getTime())) {
        throw new ValidationError('过期时间格式不正确');
      }
      update.expiresAt = expires;
    }
    if (body.note !== undefined) {
      update.note = body.note;
    }
    if (body.allowedEmailDomain !== undefined) {
      update.allowedEmailDomain = body.allowedEmailDomain ? String(body.allowedEmailDomain).toLowerCase().replace(/^@/, '') : null;
    }

    if (Object.keys(update).length === 0) {
      this.success(existing);
      return;
    }

    const updated = await ctx.model.InviteCode.findByIdAndUpdate(id, update, { new: true });
    this.success(updated);
  }

  async revoke() {
    const { ctx } = this;
    const { id } = ctx.params;
    if (!id) {
      this.error('ID is required');
      return;
    }

    const updated = await ctx.model.InviteCode.findByIdAndUpdate(id, {
      active: false,
    }, { new: true });

    if (!updated) {
      this.error('邀请码不存在');
      return;
    }

    this.success(updated);
  }
}
