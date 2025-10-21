import type { AuthUserContext } from '../../types/rbac';

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

  // Allow public when allow lists are empty; also allow missing audience
  or.push({
    $and: [
      { [fp('visibility')]: 'public' },
      {
        $or: [
          { [fp('allowRoles')]: { $exists: false } },
          { [fp('allowRoles.0')]: { $exists: false } },
        ],
      },
      {
        $or: [
          { [fp('allowGroups')]: { $exists: false } },
          { [fp('allowGroups.0')]: { $exists: false } },
        ],
      },
    ],
  });
  or.push({ [fp('visibility')]: { $exists: false } });

  if (userCtx) {
    const isValidObjectIdString = (v: unknown): v is string =>
      typeof v === 'string' && /^[a-fA-F0-9]{24}$/.test(v);
    const toIdString = (v: unknown) =>
      typeof v === 'string' ? v : ((v as any)?.toString?.() ?? '');
    const roleIds = (Array.isArray((userCtx as any).roleIds) ? (userCtx as any).roleIds : [])
      .map(toIdString)
      .filter(isValidObjectIdString);
    const groupIds = (Array.isArray((userCtx as any).groupIds) ? (userCtx as any).groupIds : [])
      .map(toIdString)
      .filter(isValidObjectIdString);

    // Authenticated users also see "authenticated"
    or.push({ [fp('visibility')]: 'authenticated' });

    const membershipOr: any[] = [];
    if (roleIds.length > 0) membershipOr.push({ [fp('allowRoles')]: { $in: roleIds } });
    if (groupIds.length > 0) membershipOr.push({ [fp('allowGroups')]: { $in: groupIds } });
    if (membershipOr.length > 0) {
      or.push({
        $and: [
          {
            $or: [
              { [fp('visibility')]: 'restricted' },
              { [fp('allowRoles.0')]: { $exists: true } },
              { [fp('allowGroups.0')]: { $exists: true } },
            ],
          },
          { $or: membershipOr },
        ],
      });
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
    $or: [
      { [fp('visibility')]: { $exists: false } },
      {
        $and: [
          { [fp('visibility')]: 'public' },
          {
            $or: [
              { [fp('allowRoles')]: { $exists: false } },
              { [fp('allowRoles.0')]: { $exists: false } },
            ],
          },
          {
            $or: [
              { [fp('allowGroups')]: { $exists: false } },
              { [fp('allowGroups.0')]: { $exists: false } },
            ],
          },
        ],
      },
    ],
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
  const source = (ctxUser as any)?.source === 'admin' ? 'admin' : 'main';
  if (roles.includes('sysadmin')) return base && Object.keys(base).length ? base : {};
  if (source === 'main' && roles.includes('viewer')) {
    const open = openPublicOnly(fieldPath);
    return Object.keys(base).length ? { $and: [base, open] } : open;
  }
  return buildAudienceFilter(base, ctxUser);
}
