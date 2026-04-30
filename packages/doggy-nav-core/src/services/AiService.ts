export type ChatRole = 'system' | 'user' | 'assistant' | 'tool' | 'function';

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface ChatCompletionRequest {
  model?: string;
  promptCode?: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  max_completion_tokens?: number;
  top_p?: number;
  stop?: string | string[] | null;
  frequency_penalty?: number;
  presence_penalty?: number;
  response_format?: unknown;
  thinking?: Record<string, unknown>;
  extra_body?: Record<string, unknown>;
  stream?: boolean;
}

export interface ChatCompletionChoice {
  index: number;
  message: ChatMessage;
  finish_reason?: string | null;
}

export interface ChatCompletionResponse {
  id: string;
  object: 'chat.completion';
  created: number;
  model: string;
  choices: ChatCompletionChoice[];
}

export interface AiConfig {
  provider?: string; // e.g., 'openai', 'azure-openai', 'groq', 'mimo'
  apiKey: string;
  baseURL: string; // may be a provider origin, /v1 base URL, or full chat-completions URL
  model: string;
}

type ProviderProfile = {
  name: string;
  apiKeyHeader: string;
  authScheme?: string;
  maxTokensParam: 'max_tokens' | 'max_completion_tokens';
  defaultBody?: Record<string, unknown>;
  normalizeBody?: (body: Record<string, unknown>) => void;
  allowedBodyKeys?: string[];
};

const DEFAULT_TIMEOUT_MS = 30_000;
const DEFAULT_MAX_RETRIES = 1;
const RETRIABLE_STATUS = new Set([408, 409, 425, 429, 500, 502, 503, 504]);

const OPENAI_COMPATIBLE_PROFILE: ProviderProfile = {
  name: 'openai-compatible',
  apiKeyHeader: 'authorization',
  authScheme: 'Bearer',
  maxTokensParam: 'max_tokens',
};

const MIMO_PROFILE: ProviderProfile = {
  name: 'mimo',
  apiKeyHeader: 'api-key',
  maxTokensParam: 'max_completion_tokens',
  defaultBody: {
    max_completion_tokens: 2048,
    temperature: 1.0,
    top_p: 0.95,
    stop: null,
    frequency_penalty: 0,
    presence_penalty: 0,
    thinking: { type: 'disabled' },
  },
  normalizeBody: (body) => {
    if (typeof body.model === 'string') {
      body.model = body.model.toLowerCase();
    }
    if (typeof body.temperature === 'number' && body.temperature < 1) {
      body.temperature = 1.0;
    }
  },
  allowedBodyKeys: [
    'model',
    'messages',
    'max_completion_tokens',
    'temperature',
    'top_p',
    'stream',
    'stop',
    'frequency_penalty',
    'presence_penalty',
    'thinking',
  ],
};

const normalizeProviderName = (provider?: string) => (provider || '').trim().toLowerCase();

function getProviderProfile(provider?: string): ProviderProfile {
  const normalized = normalizeProviderName(provider);
  if (normalized === 'mimo') {
    return MIMO_PROFILE;
  }
  return OPENAI_COMPATIBLE_PROFILE;
}

function stripTrailingSlash(value: string) {
  return value.replace(/\/+$/, '');
}

function resolveChatCompletionsUrl(cfg: AiConfig) {
  const baseURL = stripTrailingSlash(cfg.baseURL.trim());
  if (/\/chat\/completions$/i.test(baseURL)) return baseURL;
  if (/\/v\d+$/i.test(baseURL)) return `${baseURL}/chat/completions`;
  return `${baseURL}/v1/chat/completions`;
}

function buildAuthHeaders(cfg: AiConfig, profile: ProviderProfile): Record<string, string> {
  const headerName = profile.apiKeyHeader;
  if (!headerName) return {};

  const normalizedHeaderName = headerName.toLowerCase();
  if (normalizedHeaderName === 'authorization') {
    const scheme = profile.authScheme ?? 'Bearer';
    return { [headerName]: `${scheme} ${cfg.apiKey}` };
  }

  return { [headerName]: cfg.apiKey };
}

function buildHeaders(cfg: AiConfig, profile: ProviderProfile): Record<string, string> {
  return {
    accept: 'application/json',
    'content-type': 'application/json',
    ...buildAuthHeaders(cfg, profile),
  };
}

function copyDefined(
  target: Record<string, unknown>,
  source: Record<string, unknown>,
  keys: string[]
) {
  for (const key of keys) {
    if (source[key] !== undefined) target[key] = source[key];
  }
}

function buildRequestBody(
  req: ChatCompletionRequest,
  cfg: AiConfig,
  profile: ProviderProfile
): Record<string, unknown> {
  const maxTokens = req.max_completion_tokens ?? req.max_tokens;
  const body: Record<string, unknown> = {
    ...(profile.defaultBody || {}),
    model: req.model || cfg.model,
    messages: req.messages,
    stream: false,
  };

  copyDefined(body, req as unknown as Record<string, unknown>, [
    'temperature',
    'top_p',
    'stop',
    'frequency_penalty',
    'presence_penalty',
    'response_format',
    'thinking',
  ]);
  if (maxTokens !== undefined) body[profile.maxTokensParam] = maxTokens;
  if (req.extra_body) Object.assign(body, req.extra_body);
  profile.normalizeBody?.(body);
  if (profile.allowedBodyKeys) {
    const allowed = new Set(profile.allowedBodyKeys);
    for (const key of Object.keys(body)) {
      if (!allowed.has(key)) delete body[key];
    }
  }

  return body;
}

function truncateProviderBody(text: string) {
  return text.length > 1200 ? `${text.slice(0, 1200)}...` : text;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getRetryDelayMs(resp: Response | undefined, attempt: number) {
  const retryAfter = resp?.headers.get('retry-after');
  if (retryAfter) {
    const retrySeconds = Number(retryAfter);
    if (Number.isFinite(retrySeconds)) return Math.min(retrySeconds * 1000, 5000);
  }
  return Math.min(250 * 2 ** attempt, 2000);
}

export class AiProviderError extends Error {
  readonly provider: string;
  readonly status?: number;
  readonly responseBody?: string;
  readonly request?: AiProviderRequestDebug;

  constructor(params: {
    message: string;
    provider: string;
    status?: number;
    responseBody?: string;
    request?: AiProviderRequestDebug;
  }) {
    super(params.message);
    this.name = 'AiProviderError';
    this.provider = params.provider;
    this.status = params.status;
    this.responseBody = params.responseBody;
    this.request = params.request;
  }
}

export interface AiProviderRequestDebug {
  url: string;
  headers: Record<string, string>;
  body: Record<string, unknown>;
}

function redactHeaders(headers: Record<string, string>) {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(headers)) {
    if (['authorization', 'api-key', 'x-api-key'].includes(key.toLowerCase())) {
      result[key] = value ? '[redacted]' : value;
    } else {
      result[key] = value;
    }
  }
  return result;
}

export class AiService {
  constructor(private readonly cfg: AiConfig) {}

  async chatCompletions(req: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    if (!this.cfg.apiKey || !this.cfg.baseURL || !this.cfg.model) {
      throw new Error('AI configuration is incomplete');
    }
    if (!Array.isArray(req.messages) || req.messages.length === 0) {
      throw new Error('AI messages are required');
    }

    const profile = getProviderProfile(this.cfg.provider);
    const provider = this.cfg.provider || profile.name;
    const url = resolveChatCompletionsUrl(this.cfg);
    const requestBody = buildRequestBody(req, this.cfg, profile);
    const body = JSON.stringify(requestBody);
    const headers = buildHeaders(this.cfg, profile);
    const debugRequest: AiProviderRequestDebug = {
      url,
      headers: redactHeaders(headers),
      body: requestBody,
    };

    let lastError: unknown;
    for (let attempt = 0; attempt <= DEFAULT_MAX_RETRIES; attempt += 1) {
      const abortController = new AbortController();
      const timeout = setTimeout(() => abortController.abort(), DEFAULT_TIMEOUT_MS);
      let resp: Response | undefined;
      try {
        resp = await fetch(url, {
          method: 'POST',
          headers,
          body,
          signal: abortController.signal,
        });
        if (!resp.ok) {
          const text = await resp.text().catch(() => '');
          const error = new AiProviderError({
            provider,
            status: resp.status,
            responseBody: truncateProviderBody(text),
            request: debugRequest,
            message: `AI provider ${provider} error: ${resp.status} ${resp.statusText}`,
          });
          if (attempt < DEFAULT_MAX_RETRIES && RETRIABLE_STATUS.has(resp.status)) {
            await sleep(getRetryDelayMs(resp, attempt));
            continue;
          }
          throw error;
        }

        const json = (await resp.json()) as ChatCompletionResponse;
        if (!json || !Array.isArray(json.choices)) {
          throw new AiProviderError({
            provider,
            request: debugRequest,
            message: `AI provider ${provider} returned an invalid chat completion response`,
          });
        }
        return json;
      } catch (e) {
        lastError = e;
        const isAbort = e instanceof Error && e.name === 'AbortError';
        const canRetryProviderError =
          e instanceof AiProviderError && e.status !== undefined && RETRIABLE_STATUS.has(e.status);
        const canRetry = isAbort || !(e instanceof AiProviderError) || canRetryProviderError;
        if (attempt < DEFAULT_MAX_RETRIES && canRetry) {
          await sleep(getRetryDelayMs(resp, attempt));
          continue;
        }
        throw e;
      } finally {
        clearTimeout(timeout);
      }
    }

    throw lastError;
  }
}

export function prependSystemPrompt(
  messages: ChatMessage[],
  prompt?: string | null
): ChatMessage[] {
  const content = prompt?.trim();
  if (!content) return messages;

  const [first, ...rest] = messages;
  if (first?.role === 'system') {
    return [
      {
        ...first,
        content: [content, first.content?.trim()].filter(Boolean).join('\n\n'),
      },
      ...rest,
    ];
  }

  return [{ role: 'system', content }, ...messages];
}

export function createAiConfigFromEnv(env: Record<string, string | undefined>): AiConfig {
  return {
    provider: env.AI_PROVIDER,
    apiKey: env.AI_API_KEY || '',
    baseURL: env.AI_BASE_URL || '',
    model: env.AI_MODEL || '',
  };
}

export default AiService;
