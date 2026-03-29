export type TagFacet = {
  id: string;
  name: string;
  count?: number;
};

function normalizeTagValue(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

export function normalizeTags(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  const seen = new Set<string>();
  const result: string[] = [];

  for (const item of input) {
    if (typeof item !== 'string') continue;
    const normalized = normalizeTagValue(item);
    if (!normalized) continue;
    const key = normalized.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(normalized);
  }

  return result;
}

export function normalizeTagFilters(input: unknown): string[] {
  return normalizeTags(Array.isArray(input) ? input : []);
}

export function normalizeTagFiltersFromQuery(input: unknown): string[] {
  if (Array.isArray(input)) return normalizeTagFilters(input);
  if (typeof input !== 'string') return [];
  return normalizeTagFilters(
    input
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
  );
}
