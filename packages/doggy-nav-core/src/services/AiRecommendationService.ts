import type { ChatMessage } from './AiService';

export interface RecommendationAutofillValues {
  name?: string;
  desc?: string;
  detail?: string;
  tags?: string[];
  logo?: string;
}

export interface RecommendationAutofillInput {
  url: string;
}

export const DEFAULT_RECOMMENDATION_AUTOFILL_PROMPT = `You help curate bookmark recommendations for a navigation website.

Return only strict JSON in this shape:
{
  "name": "Site name",
  "desc": "Short recommendation description, within 15 words",
  "detail": "Markdown details explaining what the site is useful for",
  "tags": ["tag-one", "tag-two"],
  "logo": "https://example.com/favicon.ico"
}

Rules:
- Do not wrap the JSON in markdown.
- Use the URL as the primary evidence.
- Keep tags short, lowercase where natural, and return no more than five tags.
- If logo is unknown, use a plausible favicon URL from the site origin.
- Always return chinese content if the website is primarily in Chinese, and return English content for other websites.
- Return only name, desc, detail, tags, and logo.`;

const TEXT_FIELDS = ['name', 'desc', 'detail', 'logo'] as const;

function normalizeText(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function normalizeTags(value: unknown) {
  if (!Array.isArray(value)) return undefined;
  const tags = Array.from(
    new Set(value.map((item) => (typeof item === 'string' ? item.trim() : '')).filter(Boolean))
  );
  return tags.length > 0 ? tags.slice(0, 5) : undefined;
}

function isHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export function normalizeRecommendationAutofillValue(
  value: unknown
): RecommendationAutofillValues | null {
  if (!value || typeof value !== 'object') return null;
  const source = value as Record<string, unknown>;
  const result: RecommendationAutofillValues = {};

  for (const field of TEXT_FIELDS) {
    const text = normalizeText(source[field]);
    if (!text) continue;
    if (field === 'logo' && !isHttpUrl(text)) continue;
    result[field] = text;
  }

  const tags = normalizeTags(source.tags);
  if (tags) result.tags = tags;

  return Object.keys(result).length > 0 ? result : null;
}

export function parseRecommendationAutofillContent(
  content?: string
): RecommendationAutofillValues | null {
  if (!content) return null;
  const trimmed = content.trim();
  const withoutFence = trimmed
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/```$/i, '')
    .trim();
  const candidates = [withoutFence];
  const firstBrace = withoutFence.indexOf('{');
  const lastBrace = withoutFence.lastIndexOf('}');
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    candidates.push(withoutFence.slice(firstBrace, lastBrace + 1));
  }

  for (const candidate of candidates) {
    try {
      return normalizeRecommendationAutofillValue(JSON.parse(candidate));
    } catch {}
  }

  return null;
}

export function buildRecommendationAutofillMessages(
  input: RecommendationAutofillInput,
  prompt = DEFAULT_RECOMMENDATION_AUTOFILL_PROMPT
): ChatMessage[] {
  return [
    {
      role: 'system',
      content: prompt,
    },
    {
      role: 'user',
      content: `Please help me autofill a bookmark recommendation for this website: ${input.url},I want a concise site name, a short recommendation description, useful markdown details, a few relevant tags, and a logo or favicon URL for this site.`,
    },
  ];
}
