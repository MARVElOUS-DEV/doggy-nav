export type RequestSource = 'main' | 'admin';

export function computeEffectiveRoles(rawRoles: string[] = [], source: RequestSource): string[] {
  const set = new Set(Array.isArray(rawRoles) ? rawRoles : []);
  if (source === 'main') {
    if (set.has('sysadmin')) return ['sysadmin'];
    if (set.has('viewer')) return ['viewer'];
    return set.size ? ['user'] : [];
  }
  // admin source
  if (set.has('sysadmin')) return ['sysadmin'];
  if (set.has('admin')) return ['admin'];
  return [];
}
