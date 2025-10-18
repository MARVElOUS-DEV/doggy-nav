import type { AuthUserContext } from '../../types/rbac';

export interface UserContextLike {
  roleIds?: string[];
  groupIds?: string[];
}

/**
 * Build a Mongo $or clause for audience visibility checks with optional legacy `hide` compatibility.
 * Legacy compatibility rules:
 * - If audience missing and hide is false or missing => treat as public
 * - If audience missing and hide is true => treat as authenticated-only
 */
export function buildAudienceOr(userCtx?: UserContextLike | AuthUserContext | null): any[] {
  const or: any[] = [];

  // Always allow public or missing audience
  or.push({ 'audience.visibility': 'public' });
  or.push({ 'audience.visibility': { $exists: false } });

  if (userCtx) {
    const isValidObjectIdString = (v: unknown): v is string => typeof v === 'string' && /^[a-fA-F0-9]{24}$/.test(v);
    const toIdString = (v: unknown) => (typeof v === 'string' ? v : (v as any)?.toString?.() ?? '');
    const roleIds = (Array.isArray((userCtx as any).roleIds) ? (userCtx as any).roleIds : [])
      .map(toIdString)
      .filter(isValidObjectIdString);
    const groupIds = (Array.isArray((userCtx as any).groupIds) ? (userCtx as any).groupIds : [])
      .map(toIdString)
      .filter(isValidObjectIdString);

    // Authenticated users can also see "authenticated" audience
    or.push({ 'audience.visibility': 'authenticated' });

    // Restricted audience by role/group membership — only include valid ObjectId strings
    if (roleIds.length > 0 || groupIds.length > 0) {
      or.push({
        'audience.visibility': 'restricted',
        $or: [
          ...(roleIds.length > 0 ? [{ 'audience.allowRoles': { $in: roleIds } }] : []),
          ...(groupIds.length > 0 ? [{ 'audience.allowGroups': { $in: groupIds } }] : []),
        ],
      });
    }
  }

  return or;
}
