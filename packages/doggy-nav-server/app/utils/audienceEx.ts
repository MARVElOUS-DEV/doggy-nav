import { buildAudienceFilter } from './audience';
import type { AuthUserContext } from '../../types/rbac';

function openPublicOnly(fieldPath = 'audience') {
  const fp = (key: string) => `${fieldPath}.${key}`;
  return {
    $or: [
      { [fp('visibility')]: { $exists: false } },
      {
        $and: [
          { [fp('visibility')]: 'public' },
          { $or: [ { [fp('allowRoles')]: { $exists: false } }, { [fp('allowRoles.0')]: { $exists: false } } ] },
          { $or: [ { [fp('allowGroups')]: { $exists: false } }, { [fp('allowGroups.0')]: { $exists: false } } ] },
        ],
      },
    ],
  } as any;
}

export function buildAudienceFilterEx(
  base: Record<string, any> = {},
  ctxUser?: AuthUserContext | null,
  fieldPath = 'audience',
) {
  const roles = Array.isArray(ctxUser?.effectiveRoles) && ctxUser!.effectiveRoles!.length > 0
    ? ctxUser!.effectiveRoles!
    : (Array.isArray(ctxUser?.roles) ? ctxUser!.roles! : []);
  const source = (ctxUser as any)?.source === 'admin' ? 'admin' : 'main';
  if (roles.includes('sysadmin')) return base && Object.keys(base).length ? base : {};
  if (source === 'main' && roles.includes('viewer')) {
    const open = openPublicOnly(fieldPath);
    return Object.keys(base).length ? { $and: [ base, open ] } : open;
  }
  return buildAudienceFilter(base, ctxUser);
}
