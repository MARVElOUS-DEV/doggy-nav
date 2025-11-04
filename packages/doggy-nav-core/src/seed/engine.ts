import { DEFAULT_ROLES, DEFAULT_CATEGORIES, DEFAULT_WEBSITES, DEFAULT_GROUP_DESC, DEFAULT_GROUP_NAME, DEFAULT_GROUP_SLUG, GLOBAL_ROOT_CATEGORY_ID, nowChromeTime } from './defaults';
import type { SeedWriters, SeedAdminOptions } from './interfaces';

export async function seedDefaults(w: SeedWriters, admin: SeedAdminOptions = {}) {
  // roles
  const roleIds: Record<string, string> = {};
  for (const key of Object.keys(DEFAULT_ROLES)) {
    const role = (DEFAULT_ROLES as any)[key];
    roleIds[key] = await w.ensureRole({
      slug: role.slug,
      displayName: role.displayName,
      isSystem: !!role.isSystem,
      permissions: role.permissions || [],
      description: '',
    });
  }

  // group
  const groupId = await w.ensureGroup({ slug: DEFAULT_GROUP_SLUG, displayName: DEFAULT_GROUP_NAME, description: DEFAULT_GROUP_DESC });

  // admin user
  const username = admin.username || 'admin';
  const email = admin.email || 'admin@doggy-nav.cn';
  const passwordHash = admin.password!; // adapter provides hash already
  const nickName = admin.nickName || 'Administrator';
  const userId = await w.ensureUser({ username, email, passwordHash, nickName });

  await w.addUserToRole(userId, roleIds['sysadmin']);
  await w.addUserToGroup(userId, groupId);
}

export async function seedCategories(w: SeedWriters, { force = false }: { force?: boolean } = {}) {
  const baseTs = nowChromeTime();
  for (let i = 0; i < DEFAULT_CATEGORIES.length; i++) {
    const cat = DEFAULT_CATEGORIES[i];
    const id = await w.upsertTopCategory({
      name: cat.name,
      description: cat.description,
      icon: cat.icon,
      createAt: baseTs + i,
      parentVirtualId: GLOBAL_ROOT_CATEGORY_ID,
    });
    const sites = DEFAULT_WEBSITES[cat.name] || [];
    for (let j = 0; j < sites.length; j++) {
      const site = sites[j];
      const exists = await w.bookmarkExists(id, { name: site.name, href: site.href });
      if (!exists || force) {
        await w.insertBookmark(id, { name: site.name, href: site.href, desc: site.desc, logo: site.logo, createTime: baseTs + 1000 + j });
      }
    }
  }
}

export * from './defaults';
export * from './interfaces';
