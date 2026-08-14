import { D1UserRepository, type User } from '../adapters/d1UserRepository';

export type UserAccessContext = {
  user: User;
  roles: string[];
  roleIds: string[];
  groups: string[];
  groupIds: string[];
  permissions: string[];
};

async function aggregatePermissions(db: D1Database, roles: string[], extra: string[]): Promise<string[]> {
  try {
    if (!roles || roles.length === 0) return Array.isArray(extra) ? [...extra] : [];
    const placeholders = roles.map(() => '?').join(',');
    const rs = await db
      .prepare(`SELECT permissions FROM roles WHERE slug IN (${placeholders})`)
      .bind(...roles)
      .all();
    const set = new Set<string>();
    for (const row of (rs as any).results || []) {
      try {
        const arr = JSON.parse((row as any).permissions || '[]');
        if (Array.isArray(arr)) arr.forEach((p) => typeof p === 'string' && set.add(p));
      } catch {}
    }
    for (const p of extra || []) set.add(p);
    return Array.from(set);
  } catch {
    return Array.isArray(extra) ? [...extra] : [];
  }
}

export async function getUserAccessContext(
  db: D1Database,
  userRepo: D1UserRepository,
  userId: string
): Promise<UserAccessContext | null> {
  const user = await userRepo.getById(userId);
  if (!user || !user.isActive) return null;
  const [roleRefs, groupRefs] = await Promise.all([
    userRepo.getUserRoleRefs(user.id),
    userRepo.getUserGroupRefs(user.id),
  ]);
  const roles = roleRefs.map((role) => role.slug);
  const roleIds = roleRefs.map((role) => role.id);
  const groups = groupRefs.map((group) => group.slug);
  const groupIds = groupRefs.map((group) => group.id);
  const permissions = await aggregatePermissions(db, roles, user.extraPermissions || []);
  return { user, roles, roleIds, groups, groupIds, permissions };
}
