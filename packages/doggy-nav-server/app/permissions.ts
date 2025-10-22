// Central permissions catalog
// Format: <resource>:<action>

export const PERMISSIONS = {
  // nav
  NAV_LIST: 'nav:list',
  NAV_READ: 'nav:read',
  NAV_CREATE: 'nav:create',
  NAV_UPDATE: 'nav:update',
  NAV_DELETE: 'nav:delete',
  NAV_AUDIT: 'nav:audit',

  // category
  CATEGORY_LIST: 'category:list',
  CATEGORY_READ: 'category:read',
  CATEGORY_CREATE: 'category:create',
  CATEGORY_UPDATE: 'category:update',
  CATEGORY_DELETE: 'category:delete',

  // tag
  TAG_LIST: 'tag:list',
  TAG_READ: 'tag:read',
  TAG_CREATE: 'tag:create',
  TAG_UPDATE: 'tag:update',
  TAG_DELETE: 'tag:delete',

  // favorites
  FAV_LIST: 'favorites:list',
  FAV_READ: 'favorites:read',
  FAV_CREATE: 'favorites:create',
  FAV_UPDATE: 'favorites:update',
  FAV_DELETE: 'favorites:delete',

  // user
  USER_LIST: 'user:list',
  USER_READ: 'user:read',
  USER_UPDATE: 'user:update',
  USER_MANAGE: 'user:manage',

  // application
  APP_READ: 'application:read',
  APP_MANAGE: 'application:manage',

  // invite code
  INVITE_READ: 'inviteCode:read',
  INVITE_MANAGE: 'inviteCode:manage',

  // url checker
  URLCHECK_READ: 'urlChecker:read',
  URLCHECK_MANAGE: 'urlChecker:manage',

  // group
  GROUP_LIST: 'group:list',
  GROUP_READ: 'group:read',
  GROUP_CREATE: 'group:create',
  GROUP_UPDATE: 'group:update',
  GROUP_DELETE: 'group:delete',
} as const;

export type PermissionCode = typeof PERMISSIONS[keyof typeof PERMISSIONS] | '*';

export const DEFAULT_ROLES = {
  sysadmin: {
    slug: 'sysadmin',
    displayName: 'Super Admin',
    isSystem: true,
    permissions: ['*'] as PermissionCode[],
  },
  admin: {
    slug: 'admin',
    displayName: 'Admin',
    isSystem: true,
    permissions: [
      PERMISSIONS.NAV_LIST, PERMISSIONS.NAV_READ, PERMISSIONS.NAV_CREATE, PERMISSIONS.NAV_UPDATE, PERMISSIONS.NAV_DELETE,
      PERMISSIONS.CATEGORY_LIST, PERMISSIONS.CATEGORY_READ, PERMISSIONS.CATEGORY_CREATE, PERMISSIONS.CATEGORY_UPDATE, PERMISSIONS.CATEGORY_DELETE,
      PERMISSIONS.TAG_LIST, PERMISSIONS.TAG_READ, PERMISSIONS.TAG_CREATE, PERMISSIONS.TAG_UPDATE, PERMISSIONS.TAG_DELETE,
      PERMISSIONS.URLCHECK_READ, PERMISSIONS.URLCHECK_MANAGE,
      PERMISSIONS.INVITE_READ, PERMISSIONS.INVITE_MANAGE,
      PERMISSIONS.USER_LIST, PERMISSIONS.USER_READ,
      PERMISSIONS.APP_READ,
    ] as PermissionCode[],
  },
  editor: {
    slug: 'editor',
    displayName: 'Editor',
    isSystem: false,
    permissions: [
      PERMISSIONS.NAV_CREATE, PERMISSIONS.NAV_UPDATE,
      PERMISSIONS.CATEGORY_CREATE, PERMISSIONS.CATEGORY_UPDATE,
      PERMISSIONS.TAG_CREATE, PERMISSIONS.TAG_UPDATE,
      PERMISSIONS.NAV_LIST, PERMISSIONS.NAV_READ,
      PERMISSIONS.CATEGORY_LIST, PERMISSIONS.CATEGORY_READ,
      PERMISSIONS.TAG_LIST, PERMISSIONS.TAG_READ,
    ] as PermissionCode[],
  },
  moderator: {
    slug: 'moderator',
    displayName: 'Moderator',
    isSystem: false,
    permissions: [ PERMISSIONS.NAV_AUDIT, PERMISSIONS.NAV_LIST, PERMISSIONS.NAV_READ ] as PermissionCode[],
  },
  user: {
    slug: 'user',
    displayName: 'User',
    isSystem: true,
    permissions: [
      PERMISSIONS.FAV_LIST, PERMISSIONS.FAV_READ, PERMISSIONS.FAV_CREATE, PERMISSIONS.FAV_UPDATE, PERMISSIONS.FAV_DELETE,
      PERMISSIONS.NAV_LIST, PERMISSIONS.NAV_READ,
      PERMISSIONS.CATEGORY_LIST, PERMISSIONS.CATEGORY_READ,
    ] as PermissionCode[],
  },
  viewer: {
    slug: 'viewer',
    displayName: 'Viewer',
    isSystem: true,
    permissions: [ PERMISSIONS.NAV_LIST, PERMISSIONS.NAV_READ, PERMISSIONS.CATEGORY_LIST, PERMISSIONS.CATEGORY_READ ] as PermissionCode[],
  },
} as const;
