import type {
  UserRepository,
  UserProfile,
  UpdateProfileInput,
  AdminUserListFilter,
  AdminUserListItem,
  AdminGetUserResponse,
  AdminCreateUserInput,
  AdminUpdateUserInput,
} from 'doggy-nav-core';
import * as bcrypt from 'bcrypt';

function toISO(d: any): string | undefined {
  if (!d) return undefined;
  try { return new Date(d).toISOString(); } catch { return undefined; }
}

export class MongooseUserRepository implements UserRepository {
  constructor(private readonly ctx: any) {}
  private get User() { return this.ctx.model.User; }
  private get Role() { return this.ctx.model.Role; }
  private get Group() { return this.ctx.model.Group; }

  private async computePermissions(roleSlugs: string[]): Promise<string[]> {
    const roles = await this.Role.find({ slug: { $in: roleSlugs } }).lean();
    const perms = new Set<string>();
    for (const r of roles) for (const p of (r as any).permissions || []) perms.add(p);
    return Array.from(perms);
  }

  async getProfile(userId: string): Promise<UserProfile> {
    const user = await this.User.findById(userId).select('-password -resetPasswordToken').populate('roles').populate('groups').lean();
    if (!user) throw new Error('用户不存在');
    const roleSlugs = Array.isArray((user as any).roles) ? (user as any).roles.map((r: any) => r?.slug || r).filter(Boolean) : [];
    const groupSlugs = Array.isArray((user as any).groups) ? (user as any).groups.map((g: any) => g?.slug || g).filter(Boolean) : [];
    const permissions = await this.computePermissions(roleSlugs);
    return {
      id: (user as any)._id?.toString?.() ?? (user as any).id,
      username: (user as any).username,
      email: (user as any).email,
      avatar: (user as any).avatar,
      roles: roleSlugs,
      groups: groupSlugs,
      permissions,
      createdAt: toISO((user as any).createdAt),
      updatedAt: toISO((user as any).updatedAt),
    };
  }

  async updateProfile(userId: string, input: UpdateProfileInput): Promise<UserProfile> {
    const user = await this.User.findById(userId);
    if (!user) throw new Error('用户不存在');
    const update: any = {};
    if (input.email && input.email !== (user as any).email) {
      const dup = await this.User.findOne({ email: input.email.toLowerCase().trim(), _id: { $ne: userId } });
      if (dup) throw new Error('邮箱已存在');
      update.email = input.email.toLowerCase().trim();
    }
    if (input.avatar !== undefined) update.avatar = input.avatar;
    const updated = await this.User.findByIdAndUpdate(userId, update, { new: true }).select('-password -resetPasswordToken').populate('roles').populate('groups').lean();
    const roleSlugs = Array.isArray((updated as any).roles) ? (updated as any).roles.map((r: any) => r?.slug || r).filter(Boolean) : [];
    const groupSlugs = Array.isArray((updated as any).groups) ? (updated as any).groups.map((g: any) => g?.slug || g).filter(Boolean) : [];
    const permissions = await this.computePermissions(roleSlugs);
    return {
      id: (updated as any)._id?.toString?.() ?? (updated as any).id,
      username: (updated as any).username,
      email: (updated as any).email,
      avatar: (updated as any).avatar,
      roles: roleSlugs,
      groups: groupSlugs,
      permissions,
      createdAt: toISO((updated as any).createdAt),
      updatedAt: toISO((updated as any).updatedAt),
    };
  }

  async adminList(filter: AdminUserListFilter, page: { pageSize: number; pageNumber: number; }): Promise<{ list: AdminUserListItem[]; total: number; }> {
    const where: any = {};
    if (filter.account) where.username = new RegExp(filter.account, 'i');
    if (filter.email) where.email = new RegExp(filter.email, 'i');
    if (typeof filter.status === 'boolean') where.isActive = filter.status;
    const skip = page.pageSize * page.pageNumber - page.pageSize;
    const [users, total] = await Promise.all([
      this.User.find(where).skip(skip).limit(page.pageSize).sort({ _id: -1 }).select('-__v').populate('groups', 'slug displayName').lean(),
      this.User.countDocuments(where),
    ]);
    const list: AdminUserListItem[] = (users as any[]).map((u: any) => ({
      id: u._id?.toString?.() || u.id,
      account: u.username,
      nickName: u.nickName || u.username,
      avatar: u.avatar || '',
      email: u.email,
      role: Array.isArray(u.roles) && u.roles.length > 0 ? 'admin' : 'default',
      groups: Array.isArray(u.groups) ? (u.groups as any[]).map((g: any) => g?.displayName || g?.slug || '').filter(Boolean) : [],
      status: u.isActive ? 1 : 0,
      createdAt: toISO(u.createdAt),
      updatedAt: toISO(u.updatedAt),
    }));
    return { list, total };
  }

  async adminGetOne(id: string): Promise<AdminGetUserResponse | null> {
    const u: any = await this.User.findById(id).lean();
    if (!u) return null;
    return {
      id: u._id?.toString?.() || u.id,
      account: u.username,
      nickName: u.nickName || u.username,
      email: u.email,
      phone: u.phone || '',
      status: !!u.isActive,
      role: Array.isArray(u.roles) && u.roles.length > 0 ? 'admin' : 'default',
      roles: Array.isArray(u.roles) ? (u.roles as any[]).map((r) => (typeof r === 'string' ? r : r?.toString?.() || '')) : [],
      groups: Array.isArray(u.groups) ? (u.groups as any[]).map((g) => (typeof g === 'string' ? g : g?.toString?.() || '')) : [],
    };
  }

  private async resolveRoleIds(roleIds?: string[], roleSlug?: 'admin' | 'user') {
    if (Array.isArray(roleIds) && roleIds.length) {
      const docs = await this.Role.find({ _id: { $in: roleIds } }, { _id: 1 }).lean();
      return docs.map((d: any) => d._id);
    }
    const slug = roleSlug === 'admin' ? 'admin' : 'user';
    const doc = await this.Role.findOne({ slug }, { _id: 1 }).lean();
    return doc ? [doc._id] : [];
  }

  private async resolveGroupIds(groupIds?: string[]) {
    const ids = Array.isArray(groupIds) ? groupIds.filter((v: any) => typeof v === 'string') : [];
    if (!ids.length) return [] as any[];
    const docs = await this.Group.find({ _id: { $in: ids } }, { _id: 1 }).lean();
    return docs.map((d: any) => d._id);
  }

  async adminCreate(input: AdminCreateUserInput): Promise<{ id: string; }> {
    const username = String(input.account).trim();
    const email = String(input.email).trim().toLowerCase();
    const exists = await this.User.findOne({ $or: [{ username }, { email }] });
    if (exists) throw new Error('账号或邮箱已存在');
    const password = await bcrypt.hash(String(input.password), 12);
    const roles = await this.resolveRoleIds(input.roles, input.role);
    const groups = await this.resolveGroupIds(input.groups);
    const created = await this.User.create({
      username,
      email,
      password,
      isActive: !!input.status,
      nickName: input.nickName || username,
      phone: input.phone || '',
      roles,
      groups,
    });
    return { id: created._id?.toString?.() } as any;
  }

  async adminUpdate(id: string, input: AdminUpdateUserInput): Promise<boolean> {
    const update: any = {};
    if (input.account) update.username = String(input.account).trim();
    if (input.email) update.email = String(input.email).toLowerCase().trim();
    if (typeof input.status !== 'undefined') update.isActive = !!input.status;
    if (typeof input.nickName !== 'undefined') update.nickName = input.nickName;
    if (typeof input.phone !== 'undefined') update.phone = input.phone;
    if (input.password) update.password = await bcrypt.hash(String(input.password), 12);
    if ('roles' in input || 'role' in input) {
      update.roles = await this.resolveRoleIds(input.roles, input.role);
    }
    if ('groups' in input) {
      update.groups = await this.resolveGroupIds(input.groups);
    }
    if (update.username || update.email) {
      const or: any[] = [];
      if (update.username) or.push({ username: update.username });
      if (update.email) or.push({ email: update.email });
      if (or.length) {
        const dup = await this.User.findOne({ _id: { $ne: id }, $or: or });
        if (dup) throw new Error('账号或邮箱已存在');
      }
    }
    await this.User.updateOne({ _id: id }, update);
    return true;
  }

  async adminDelete(ids: string[]): Promise<boolean> {
    await this.User.deleteMany({ _id: { $in: ids } });
    return true;
  }
}

export default MongooseUserRepository;
