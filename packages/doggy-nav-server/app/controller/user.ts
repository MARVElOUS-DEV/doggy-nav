import CommonController from '../core/base_controller';
import { AuthenticationError } from '../core/errors';
import { EnforceAdminOnAdminSource } from '../utils/decorators';

export default class UserController extends CommonController {
  tableName(): string {
    return 'User';
  }

  public async register() {
    const { ctx } = this;
    const res = await ctx.service.user.register();
    this.success(res);
  }

  @EnforceAdminOnAdminSource()
  public async login() {
    const { ctx } = this;
    const res = await ctx.service.user.login();
    return res;
  }

  public async profile() {
    const { ctx } = this;
    const userId = ctx.state.userinfo?.userId;
    if (!userId) {
      throw new AuthenticationError('用户未认证');
    }
    const res = await ctx.service.user.getUserProfile(userId);
    this.success(res);
  }

  public async updateProfile() {
    const { ctx } = this;
    const userId = ctx.state.userinfo?.userId;
    if (!userId) {
      throw new AuthenticationError('用户未认证');
    }
    const res = await ctx.service.user.updateProfile(userId);
    this.success(res);
  }

  // ===== Admin user management =====
  public async adminList() {
    const { ctx } = this;
    const query = this.getSanitizedQuery();
    const pageSize = Math.min(Math.max(Number(query.pageSize || query.page_size || 10), 1), 100);
    const current = Math.max(Number(query.pageNumber || query.current || 1), 1);
    const skipNumber = pageSize * current - pageSize;

    const where: any = {};
    if (query.account) where.username = new RegExp(query.account as string, 'i');
    if (query.email) where.email = new RegExp(query.email as string, 'i');
    if (query.status !== undefined && query.status !== '') {
      const s = String(query.status);
      where.isActive = s === '1' || s === 'true';
    }

    const [ users, total ] = await Promise.all([
      ctx.model.User
        .find(where)
        .skip(skipNumber)
        .limit(pageSize)
        .sort({ _id: -1 })
        .select('-__v')
        .populate('groups', 'slug displayName')
        .lean(),
      ctx.model.User.countDocuments(where),
    ]);

    const list = (users as any[]).map((u: any) => ({
      id: u._id?.toString?.() || u.id,
      account: u.username,
      nickName: u.nickName || u.username,
      avatar: u.avatar || '',
      email: u.email,
      role: Array.isArray(u.roles) && u.roles.length > 0 ? 'admin' : 'default',
      groups: Array.isArray(u.groups) ? (u.groups as any[]).map((g: any) => g?.displayName || g?.slug || '').filter(Boolean) : [],
      status: u.isActive ? 1 : 0,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
    }));

    this.success({ list, total });
  }

  public async adminGetOne() {
    const { ctx } = this;
    const { id } = ctx.params;
    const u: any = await ctx.model.User.findById(id).lean();
    if (!u) return this.success(null);
    this.success({
      id: u._id?.toString?.() || u.id,
      account: u.username,
      nickName: u.nickName || u.username,
      email: u.email,
      phone: u.phone || '',
      status: !!u.isActive,
      role: Array.isArray(u.roles) && u.roles.length > 0 ? 'admin' : 'default',
      // return actual role ids for admin edit form (multi-role assignment)
      roles: Array.isArray(u.roles) ? (u.roles as any[]).map((r) => (typeof r === 'string' ? r : r?.toString?.() || '')) : [],
      // return group ids for edit form
      groups: Array.isArray(u.groups) ? (u.groups as any[]).map((g) => (typeof g === 'string' ? g : g?.toString?.() || '')) : [],
    });
  }

  public async adminCreate() {
    const { ctx } = this;
    const body = this.getSanitizedBody();
    const username = String(body.account || '').trim();
    const email = String(body.email || '').trim().toLowerCase();
    const plainPassword = String(body.password || '');
    if (!username || !email) return this.error('账号和邮箱必填');
    if (!plainPassword) return this.error('密码必填');

    const exists = await ctx.model.User.findOne({ $or: [ { username }, { email } ] });
    if (exists) return this.error('账号或邮箱已存在');

    const validationErrors = ctx.service.user.validateUserInput(username, email, plainPassword);
    if (validationErrors && validationErrors.length) return this.error(validationErrors.join(', '));

    const password = await ctx.service.user.hashPassword(plainPassword);

    // Prefer explicit roles[] of ObjectId strings; fallback to aggregated role slug
    let finalRoleIds: any[] = [];
    if (Array.isArray(body.roles)) {
      const ids = body.roles.filter((v: any) => typeof v === 'string');
      if (ids.length) {
        const docs = await ctx.model.Role.find({ _id: { $in: ids } }, { _id: 1 }).lean();
        finalRoleIds = docs.map((d: any) => d._id);
      }
    }
    if (!finalRoleIds.length) {
      const roleSlug = body.role === 'admin' ? 'admin' : 'user';
      finalRoleIds = await this.resolveRoleIds([ roleSlug ]);
    }

    const created = await ctx.model.User.create({
      username,
      email,
      password,
      isActive: !!body.status,
      nickName: body.nickName || username,
      phone: body.phone || '',
      roles: finalRoleIds,
      // optional groups
      groups: await this.resolveGroupIds(Array.isArray(body.groups) ? body.groups : []),
    });
    this.success({ id: created._id?.toString?.() });
  }

  public async adminUpdate() {
    const { ctx } = this;
    const { id } = ctx.params;
    const body = this.getSanitizedBody();
    const update: any = {};
    if (body.account) update.username = String(body.account).trim();
    if (body.email) update.email = String(body.email).toLowerCase().trim();
    if (typeof body.status !== 'undefined') update.isActive = !!body.status;
    if (typeof body.nickName !== 'undefined') update.nickName = body.nickName;
    if (typeof body.phone !== 'undefined') update.phone = body.phone;
    if (body.password) {
      const pw = String(body.password);
      const errs = ctx.service.user.validateUserInput(update.username || '', update.email || '', pw);
      // Only validate password complexity here; if username/email not provided in update, skip those checks
      if (pw.length < 6 || !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(pw)) {
        return this.error('密码至少6位且包含大小写字母和数字');
      }
      if (errs.length) {
        return this.error(errs.join());
      }
      update.password = await ctx.service.user.hashPassword(pw);
    }
    // Prefer explicit roles[] of ObjectId strings; allow clearing by passing []
    if ('roles' in body) {
      const ids = Array.isArray(body.roles) ? body.roles.filter((v: any) => typeof v === 'string') : [];
      if (ids.length > 0) {
        const docs = await ctx.model.Role.find({ _id: { $in: ids } }, { _id: 1 }).lean();
        update.roles = docs.map((d: any) => d._id);
      } else {
        update.roles = [];
      }
    } else if (typeof body.role !== 'undefined') {
      // Backward compatibility with aggregated role
      const roleSlug = body.role === 'admin' ? 'admin' : 'user';
      update.roles = await this.resolveRoleIds([ roleSlug ]);
    }

    // Optional groups update; allow clearing by []
    if ('groups' in body) {
      const ids = Array.isArray(body.groups) ? body.groups.filter((v: any) => typeof v === 'string') : [];
      if (ids.length > 0) {
        const docs = await ctx.model.Group.find({ _id: { $in: ids } }, { _id: 1 }).lean();
        update.groups = docs.map((d: any) => d._id);
      } else {
        update.groups = [];
      }
    }

    if (update.username || update.email) {
      const or: any[] = [];
      if (update.username) or.push({ username: update.username });
      if (update.email) or.push({ email: update.email });
      if (or.length) {
        const dup = await ctx.model.User.findOne({ _id: { $ne: id }, $or: or });
        if (dup) return this.error('账号或邮箱已存在');
      }
    }

    await ctx.model.User.updateOne({ _id: id }, update);
    this.success(true);
  }

  public async adminDelete() {
    const { ctx } = this;
    const ids: string[] = Array.isArray(ctx.request.body?.ids) ? ctx.request.body.ids : [];
    if (!ids.length) return this.error('缺少ids');
    await ctx.model.User.deleteMany({ _id: { $in: ids } });
    this.success(true);
  }

  private async resolveRoleIds(slugs: string[]) {
    const { ctx } = this;
    const roles = await ctx.model.Role.find({ slug: { $in: slugs } }, { _id: 1 }).lean();
    return roles.map(r => r._id);
  }

  private async resolveGroupIds(ids: string[]) {
    const { ctx } = this;
    const validIds = Array.isArray(ids) ? ids.filter((v: any) => typeof v === 'string') : [];
    if (!validIds.length) return [] as any[];
    const groups = await ctx.model.Group.find({ _id: { $in: validIds } }, { _id: 1 }).lean();
    return groups.map((g: any) => g._id);
  }
}
