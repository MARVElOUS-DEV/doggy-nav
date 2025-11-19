export interface SeedAdminOptions {
  username?: string;
  email?: string;
  password?: string;
  nickName?: string;
}

export interface RoleData {
  slug: string;
  displayName: string;
  description?: string;
  permissions?: string[];
  isSystem?: boolean;
}

export interface GroupData {
  slug: string;
  displayName: string;
  description?: string;
}

export interface CategoryData {
  name: string;
  description?: string;
  icon?: string;
  createAt?: number; // Chrome time
}

export interface BookmarkData {
  name: string;
  href: string;
  desc?: string;
  detail?: string;
  logo?: string;
  createTime?: number; // Chrome time
}

export interface SeedWriters {
  // roles/groups/users
  ensureRole(role: RoleData): Promise<string>; // return role id
  ensureGroup(group: GroupData): Promise<string>; // return group id
  ensureUser(input: { username: string; email: string; passwordHash: string; nickName?: string }): Promise<string>; // return user id
  addUserToRole(userId: string, roleId: string): Promise<void>;
  addUserToGroup(userId: string, groupId: string): Promise<void>;

  // categories/bookmarks
  upsertTopCategory(cat: CategoryData & { parentVirtualId: string }): Promise<string>; // return category id
  bookmarkExists(catId: string, bookmark: { name: string; href: string }): Promise<boolean>;
  insertBookmark(catId: string, bookmark: BookmarkData): Promise<void>;
}
