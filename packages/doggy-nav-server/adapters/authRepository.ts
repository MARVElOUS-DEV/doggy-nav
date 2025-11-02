import type { AuthRepository, AuthUser } from 'doggy-nav-core';
import * as bcrypt from 'bcrypt';

export class MongooseAuthRepository implements AuthRepository {
  constructor(private readonly ctx: any) {}
  private get User() { return this.ctx.model.User; }
  private get Role() { return this.ctx.model.Role; }
  private get Group() { return this.ctx.model.Group; }

  async verifyCredentials(identifier: string, password: string): Promise<{ userId: string } | null> {
    const user = await this.User.findOne({
      $or: [{ username: identifier }, { email: identifier.toLowerCase() }],
      isActive: true,
    }).lean();
    if (!user) return null;
    const ok = await bcrypt.compare(password, (user as any).password);
    if (!ok) return null;
    return { userId: (user as any)._id?.toString?.() ?? (user as any).id };
  }

  async recordSuccessfulLogin(userId: string): Promise<void> {
    try {
      await this.User.findByIdAndUpdate(userId, { lastLoginAt: new Date() }, { useFindAndModify: false });
    } catch { /* ignore */ return; }
  }

  async loadAuthUser(userId: string): Promise<AuthUser> {
    const user = await this.User.findById(userId).lean();
    if (!user) throw new Error('用户不存在');
    const rawRoles = Array.isArray((user as any).roles) ? (user as any).roles : [];
    const rawGroups = Array.isArray((user as any).groups) ? (user as any).groups : [];

    const roleIds: any[] = rawRoles.filter((r: any) => typeof r !== 'string');
    const roleSlugs: string[] = rawRoles.map((r: any) => (typeof r === 'string' ? r : r?.slug)).filter(Boolean);
    const groupIds: any[] = rawGroups.filter((g: any) => typeof g !== 'string');
    const groupSlugs: string[] = rawGroups.map((g: any) => (typeof g === 'string' ? g : g?.slug)).filter(Boolean);

    const [rolesById, rolesBySlug, groupsById, groupsBySlug] = await Promise.all([
      roleIds.length ? this.Role.find({ _id: { $in: roleIds.map((r: any) => r?._id || r) } }, { slug: 1, permissions: 1 }).lean() : Promise.resolve([]),
      roleSlugs.length ? this.Role.find({ slug: { $in: roleSlugs } }, { slug: 1, permissions: 1 }).lean() : Promise.resolve([]),
      groupIds.length ? this.Group.find({ _id: { $in: groupIds.map((g: any) => g?._id || g) } }, { slug: 1 }).lean() : Promise.resolve([]),
      groupSlugs.length ? this.Group.find({ slug: { $in: groupSlugs } }, { slug: 1 }).lean() : Promise.resolve([]),
    ]);

    const roles = [...(rolesById as any[]), ...(rolesBySlug as any[])];
    const groups = [...(groupsById as any[]), ...(groupsBySlug as any[])];
    const roleSlugList = roles.map((r: any) => r.slug).filter(Boolean);
    const groupSlugList = groups.map((g: any) => g.slug).filter(Boolean);
    const permissions = Array.from(new Set<string>(roles.flatMap((r: any) => r.permissions || [])));

    return {
      id: (user as any)._id?.toString?.() ?? (user as any).id,
      username: (user as any).username,
      email: (user as any).email,
      avatar: (user as any).avatar,
      roles: roleSlugList,
      groups: groupSlugList,
      permissions,
    };
  }
}

export default MongooseAuthRepository;
