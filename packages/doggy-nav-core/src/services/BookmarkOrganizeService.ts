import type { AiService, ChatMessage } from './AiService';

export const BOOKMARK_ORGANIZE_PROMPT_CODE = 'bookmark.organize.v2';
export const BOOKMARK_ORGANIZE_MAX_ITEMS = 500;
const BOOKMARK_ORGANIZE_MAX_TARGET_ITEMS = BOOKMARK_ORGANIZE_MAX_ITEMS + 100;
export const DEFAULT_BOOKMARK_ORGANIZE_PROMPT = `You reorganize an entire bookmark hierarchy.
Return JSON only in the requested compact tree schema. Every bookmark ID from the catalog must appear
exactly once. Never create, omit, or alter bookmark IDs. Existing folders may be renamed, moved, or
omitted. Reuse an existing folder ID when retaining that folder; every new folder ID must start with
ai-folder-. Keep folder titles concise and use the user's optional instruction when provided.`;

export interface BookmarkOrganizeBookmark {
  id: string;
  title: string;
  url: string;
}

export interface BookmarkOrganizeFolder {
  id: string;
  title: string;
  children: BookmarkOrganizeTree;
}

/** Bookmark IDs are strings; folders are nested objects. Array position is sibling order. */
export type BookmarkOrganizeTree = Array<string | BookmarkOrganizeFolder>;

export interface BookmarkOrganizeRequest {
  instruction?: string;
  bookmarks: BookmarkOrganizeBookmark[];
  tree: BookmarkOrganizeTree;
}

export interface BookmarkOrganizeResponse {
  tree: BookmarkOrganizeTree;
}

export interface BookmarkOrganizeValidation<T> {
  value: T | null;
  errors: string[];
}

const ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
const NEW_FOLDER_ID_PATTERN = /^ai-folder-[A-Za-z0-9][A-Za-z0-9._:-]{0,117}$/;

function text(value: unknown, max: number): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function identifier(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

interface TreeReadOptions {
  bookmarkIds: Set<string>;
  allowedExistingFolderIds?: Set<string>;
  enforceTargetFolderIds: boolean;
  maxItems: number;
}

interface TreeReadResult {
  tree: BookmarkOrganizeTree | null;
  folderIds: Set<string>;
  bookmarkOccurrences: Map<string, number>;
  errors: string[];
  itemCount: number;
}

function readTree(value: unknown, options: TreeReadOptions): TreeReadResult {
  const folderIds = new Set<string>();
  const bookmarkOccurrences = new Map<string, number>();
  const errors: string[] = [];
  let itemCount = 0;

  const visit = (raw: unknown, path: string): BookmarkOrganizeTree => {
    if (!Array.isArray(raw)) {
      errors.push(`${path} must be an array`);
      return [];
    }
    const result: BookmarkOrganizeTree = [];
    raw.forEach((entry, index) => {
      const entryPath = `${path}[${index}]`;
      itemCount += 1;
      if (itemCount > options.maxItems) return;
      if (typeof entry === 'string') {
        const id = identifier(entry);
        if (!ID_PATTERN.test(id) || !options.bookmarkIds.has(id)) {
          errors.push(`${entryPath} contains an unknown bookmark ID`);
          return;
        }
        bookmarkOccurrences.set(id, (bookmarkOccurrences.get(id) || 0) + 1);
        result.push(id);
        return;
      }
      if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
        errors.push(`${entryPath} must be a bookmark ID or folder object`);
        return;
      }
      const folder = entry as Record<string, unknown>;
      const id = identifier(folder.id);
      const title = text(folder.title, 300);
      if (!ID_PATTERN.test(id) || !title || folderIds.has(id) || options.bookmarkIds.has(id)) {
        errors.push(`${entryPath} has an invalid or duplicate folder ID/title`);
        return;
      }
      if (
        options.enforceTargetFolderIds &&
        !options.allowedExistingFolderIds?.has(id) &&
        !NEW_FOLDER_ID_PATTERN.test(id)
      ) {
        errors.push(`${entryPath} uses an invalid new folder ID`);
        return;
      }
      folderIds.add(id);
      result.push({ id, title, children: visit(folder.children, `${entryPath}.children`) });
    });
    return result;
  };

  const tree = visit(value, 'tree');
  if (itemCount > options.maxItems) {
    errors.push(`tree exceeds the ${options.maxItems}-item limit`);
  }
  for (const id of options.bookmarkIds) {
    const count = bookmarkOccurrences.get(id) || 0;
    if (count === 0) errors.push(`bookmark ${id} is missing`);
    if (count > 1) errors.push(`bookmark ${id} appears ${count} times`);
  }
  return {
    tree: errors.length ? null : tree,
    folderIds,
    bookmarkOccurrences,
    errors,
    itemCount,
  };
}

export function normalizeBookmarkOrganizeRequest(value: unknown): BookmarkOrganizeRequest | null {
  if (!value || typeof value !== 'object') return null;
  const body = value as Record<string, unknown>;
  if (
    !Array.isArray(body.bookmarks) ||
    body.bookmarks.length === 0 ||
    body.bookmarks.length > BOOKMARK_ORGANIZE_MAX_ITEMS
  ) {
    return null;
  }

  const seen = new Set<string>();
  const bookmarks: BookmarkOrganizeBookmark[] = [];
  for (const raw of body.bookmarks) {
    const bookmark = raw as Record<string, unknown> | null;
    const id = identifier(bookmark?.id);
    const title = text(bookmark?.title, 300);
    const url = text(bookmark?.url, 8192);
    if (!ID_PATTERN.test(id) || seen.has(id) || !title || !url) return null;
    seen.add(id);
    bookmarks.push({ id, title, url });
  }

  const parsed = readTree(body.tree, {
    bookmarkIds: seen,
    enforceTargetFolderIds: false,
    maxItems: BOOKMARK_ORGANIZE_MAX_ITEMS,
  });
  if (!parsed.tree || parsed.itemCount > BOOKMARK_ORGANIZE_MAX_ITEMS) return null;
  return {
    ...(text(body.instruction, 1000) ? { instruction: text(body.instruction, 1000) } : {}),
    bookmarks,
    tree: parsed.tree,
  };
}

function existingFolderIds(tree: BookmarkOrganizeTree): Set<string> {
  const ids = new Set<string>();
  const visit = (children: BookmarkOrganizeTree) => {
    children.forEach((entry) => {
      if (typeof entry === 'string') return;
      ids.add(entry.id);
      visit(entry.children);
    });
  };
  visit(tree);
  return ids;
}

export function validateBookmarkOrganizeResponse(
  value: unknown,
  request: BookmarkOrganizeRequest
): BookmarkOrganizeValidation<BookmarkOrganizeResponse> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { value: null, errors: ['response must be an object containing tree'] };
  }
  const parsed = readTree((value as Record<string, unknown>).tree, {
    bookmarkIds: new Set(request.bookmarks.map((bookmark) => bookmark.id)),
    allowedExistingFolderIds: existingFolderIds(request.tree),
    enforceTargetFolderIds: true,
    maxItems: BOOKMARK_ORGANIZE_MAX_TARGET_ITEMS,
  });
  return {
    value: parsed.tree ? { tree: parsed.tree } : null,
    errors: parsed.errors,
  };
}

function jsonFromContent(content: unknown): BookmarkOrganizeValidation<unknown> {
  if (typeof content !== 'string') return { value: null, errors: ['response content is missing'] };
  const cleaned = content
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '');
  try {
    return { value: JSON.parse(cleaned), errors: [] };
  } catch (error) {
    return {
      value: null,
      errors: [`response is not valid JSON: ${(error as Error).message}`],
    };
  }
}

function organizationMessages(request: BookmarkOrganizeRequest, prompt: string): ChatMessage[] {
  return [
    { role: 'system', content: prompt },
    {
      role: 'user',
      content: JSON.stringify({
        task: 'Transform the complete hierarchy and return the complete target hierarchy.',
        schema: {
          tree: [
            'bookmark-id',
            { id: 'existing-id-or-ai-folder-stable-slug', title: 'Folder', children: [] },
          ],
        },
        instruction: request.instruction || '',
        bookmarks: request.bookmarks,
        tree: request.tree,
      }),
    },
  ];
}

function repairMessages(
  request: BookmarkOrganizeRequest,
  prompt: string,
  invalidContent: unknown,
  errors: string[]
): ChatMessage[] {
  return [
    { role: 'system', content: prompt },
    {
      role: 'user',
      content: JSON.stringify({
        task: 'Repair the invalid response. Return only a complete corrected response object.',
        schema: {
          tree: [
            'bookmark-id',
            { id: 'existing-id-or-ai-folder-stable-slug', title: 'Folder', children: [] },
          ],
        },
        validationErrors: errors,
        invalidResponse:
          typeof invalidContent === 'string' ? invalidContent : (invalidContent ?? null),
        originalRequest: request,
      }),
    },
  ];
}

function parseAndValidate(
  content: unknown,
  request: BookmarkOrganizeRequest
): BookmarkOrganizeValidation<BookmarkOrganizeResponse> {
  const parsed = jsonFromContent(content);
  if (!parsed.value) return { value: null, errors: parsed.errors };
  return validateBookmarkOrganizeResponse(parsed.value, request);
}

export async function organizeBookmarksWithAi(
  ai: AiService,
  request: BookmarkOrganizeRequest,
  prompt = DEFAULT_BOOKMARK_ORGANIZE_PROMPT,
  debug?: (stage: string, payload: unknown) => void
): Promise<BookmarkOrganizeResponse | null> {
  const firstRequest = {
    messages: organizationMessages(request, prompt),
    temperature: 0.2,
    max_tokens: 8000,
    response_format: { type: 'json_object' as const },
    stream: false,
  };
  debug?.('organization.request', firstRequest);
  const firstResponse = await ai.chatCompletions(firstRequest, {
    timeoutMs: 120_000,
    maxRetries: 0,
  });
  debug?.('organization.response', firstResponse);
  const firstContent = firstResponse?.choices?.[0]?.message?.content;
  const firstResult = parseAndValidate(firstContent, request);
  if (firstResult.value) return firstResult.value;

  debug?.('organization.validation_failed', { errors: firstResult.errors });
  const repairRequest = {
    messages: repairMessages(request, prompt, firstContent, firstResult.errors),
    temperature: 0,
    max_tokens: 8000,
    response_format: { type: 'json_object' as const },
    stream: false,
  };
  debug?.('repair.request', repairRequest);
  const repairResponse = await ai.chatCompletions(repairRequest, {
    timeoutMs: 120_000,
    maxRetries: 0,
  });
  debug?.('repair.response', repairResponse);
  const repaired = parseAndValidate(repairResponse?.choices?.[0]?.message?.content, request);
  if (!repaired.value) debug?.('repair.validation_failed', { errors: repaired.errors });
  return repaired.value;
}
