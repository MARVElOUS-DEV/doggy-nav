export interface UserContextLike {
  roleIds?: any[];
  groupIds?: any[];
}

/**
 * Build a Mongo $or clause for audience visibility checks with optional legacy `hide` compatibility.
 * Legacy compatibility rules:
 * - If audience missing and hide is false or missing => treat as public
 * - If audience missing and hide is true => treat as authenticated-only
 */
export function buildAudienceOr(userCtx?: UserContextLike | null, legacyHideCompat = true): any[] {
  const or: any[] = [];

  // Public audience
  or.push({ 'audience.visibility': 'public' });

  // Missing audience treated as public, with optional legacy hide=false filter
  if (legacyHideCompat) {
    or.push({ $and: [
      { 'audience.visibility': { $exists: false } },
      { $or: [ { hide: { $exists: false } }, { hide: false } ] },
    ]});
  } else {
    or.push({ 'audience.visibility': { $exists: false } });
  }

  if (userCtx) {
    // Authenticated audience
    or.push({ 'audience.visibility': 'authenticated' });

    // Legacy: hide=true is visible to authenticated users
    if (legacyHideCompat) {
      or.push({ $and: [ { 'audience.visibility': { $exists: false } }, { hide: true } ] });
    }

    // Restricted audience by role/group membership
    if (Array.isArray(userCtx.roleIds) || Array.isArray(userCtx.groupIds)) {
      or.push({ 'audience.visibility': 'restricted', $or: [
        { 'audience.allowRoles': { $in: userCtx.roleIds || [] } },
        { 'audience.allowGroups': { $in: userCtx.groupIds || [] } },
      ]});
    }
  }

  return or;
}
