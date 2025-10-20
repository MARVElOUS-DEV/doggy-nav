import type { PermissionCode } from '../app/permissions';

// Minimal role/group references used in JWT payload composition
export interface RoleRef {
  _id?: string;
  slug: string;
}

export interface GroupRef {
  _id?: string;
  slug: string;
  roles?: Array<string> | Array<{ _id?: string }>;
}

// Snapshot embedded in JWT access token
export interface AuthJwtPayload {
  userId: string;
  username: string;
  isSysAdmin: boolean;
  roles: string[];     // role slugs
  roleIds: string[];   // role ids as strings
  groups: string[];    // group slugs
  groupIds: string[];  // group ids as strings
  permissions: PermissionCode[];
}

// Context object stored on ctx.state.userinfo during requests
export interface AuthUserContext extends AuthJwtPayload {
  authType?: 'jwt' | 'client_secret';
}
