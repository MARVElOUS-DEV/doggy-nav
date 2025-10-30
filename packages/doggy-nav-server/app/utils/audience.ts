import type { AuthUserContext } from '../../types/rbac';
import { Types } from 'mongoose';

export interface UserContextLike {
  roleIds?: string[];
  groupIds?: string[];
}

// Path-aware audience $or builder
export function buildAudienceOrFor(
  fieldPath = 'audience',
  userCtx?: UserContextLike | AuthUserContext | null
): any[] {
  const fp = (key: string) => `${fieldPath}.${key}`;
  const or: any[] = [];

  // Allow public (ignore allowRoles/allowGroups when not restricted)
  or.push({ [fp('visibility')]: 'public' });

  if (userCtx) {
    const isValidObjectIdString = (v: unknown): v is string =>
      typeof v === 'string' && /^[a-fA-F0-9]{24}$/.test(v);
    const toIdString = (v: unknown) =>
      typeof v === 'string' ? v : ((v as any)?.toString?.() ?? '');
    const roleIdsStr = (Array.isArray((userCtx as any).roleIds) ? (userCtx as any).roleIds : [])
      .map(toIdString)
      .filter(isValidObjectIdString);
    const groupIdsStr = (Array.isArray((userCtx as any).groupIds) ? (userCtx as any).groupIds : [])
      .map(toIdString)
      .filter(isValidObjectIdString);
    const roleIds = roleIdsStr.map((id) => new Types.ObjectId(id));
    const groupIds = groupIdsStr.map((id) => new Types.ObjectId(id));

    // Authenticated users see "authenticated" (ignore allow lists)
    or.push({ [fp('visibility')]: 'authenticated' });

    // Restricted requires membership by roles or groups
    const membershipOr: any[] = [];
    if (roleIds.length > 0) membershipOr.push({ [fp('allowRoles')]: { $in: roleIds } });
    if (groupIds.length > 0) membershipOr.push({ [fp('allowGroups')]: { $in: groupIds } });
    if (membershipOr.length > 0) {
      or.push({ $and: [{ [fp('visibility')]: 'restricted' }, { $or: membershipOr }] });
    } else {
      // If no roles/groups in context, restricted should not match anything for this user
      or.push({ $and: [{ [fp('visibility')]: 'restricted' }, { _id: { $exists: false } }] });
    }
  }

  return or;
}

// Backward compatibility wrapper (default path: 'audience')
export function buildAudienceOr(userCtx?: UserContextLike | AuthUserContext | null): any[] {
  return buildAudienceOrFor('audience', userCtx);
}

// Merge a base query with the audience $or clause
export function buildAudienceFilter(
  base: Record<string, any> = {},
  userCtx?: UserContextLike | AuthUserContext | null,
  fieldPath = 'audience'
): Record<string, any> {
  const or = buildAudienceOrFor(fieldPath, userCtx);
  return Object.keys(base).length > 0 ? { $and: [base, { $or: or }] } : { $or: or };
}

function openPublicOnly(fieldPath = 'audience') {
  const fp = (key: string) => `${fieldPath}.${key}`;
  return {
    $or: [{ [fp('visibility')]: 'public' }],
  } as any;
}

export function buildAudienceFilterEx(
  base: Record<string, any> = {},
  ctxUser?: AuthUserContext | null,
  fieldPath = 'audience'
) {
  const roles =
    Array.isArray(ctxUser?.effectiveRoles) && ctxUser!.effectiveRoles!.length > 0
      ? ctxUser!.effectiveRoles!
      : Array.isArray(ctxUser?.roles)
        ? ctxUser!.roles!
        : [];
  const source = ctxUser?.source === 'admin' ? 'admin' : 'main';
  // sysadmin can access everything (including visibility='hide')
  if (roles.includes('sysadmin')) return base && Object.keys(base).length ? base : {};

  // For non-sysadmin, always exclude visibility='hide'
  const notHide = { [`${fieldPath}.visibility`]: { $ne: 'hide' } } as Record<string, any>;

  if (source === 'main' && roles.includes('viewer')) {
    const open = openPublicOnly(fieldPath);
    const q = Object.keys(base).length ? { $and: [base, open] } : open;
    return { $and: [q, notHide] };
  }
  const q = buildAudienceFilter(base, ctxUser);
  return { $and: [q, notHide] };
}
