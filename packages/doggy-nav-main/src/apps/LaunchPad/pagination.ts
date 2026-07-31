export function buildLaunchpadPages<TApp, TEntry>(
  apps: TApp[],
  entries: TEntry[],
  perPage: number
): ({ kind: 'app'; app: TApp } | TEntry)[][] {
  const allEntries = [...apps.map((app) => ({ kind: 'app' as const, app })), ...entries];
  return Array.from({ length: Math.max(1, Math.ceil(allEntries.length / perPage)) }, (_, page) =>
    allEntries.slice(page * perPage, (page + 1) * perPage)
  );
}
