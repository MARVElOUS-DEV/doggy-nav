export type ChatRole = 'system' | 'user' | 'assistant' | 'tool' | 'function';

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface ChatCompletionRequest {
  model?: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
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
  provider?: string; // e.g., 'openai', 'azure-openai', 'groq' (OpenAI-compatible)
  apiKey: string;
  baseURL: string; // must point to an OpenAI-compatible endpoint
  model: string;
}

export class AiService {
  constructor(private readonly cfg: AiConfig) {}

  async chatCompletions(req: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    if (!this.cfg.apiKey || !this.cfg.baseURL || !this.cfg.model) {
      throw new Error('AI configuration is incomplete');
    }
    const body = {
      model: req.model || this.cfg.model,
      messages: req.messages,
      temperature: req.temperature,
      max_tokens: req.max_tokens,
      stream: false, // non-streaming minimal implementation
    };

    const url = this.cfg.baseURL.replace(/\/$/, '') + '/v1/chat/completions';
    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${this.cfg.apiKey}`,
      },
      body: JSON.stringify(body),
    });
    if (!resp.ok) {
      const text = await resp.text().catch(() => '');
      throw new Error(`AI provider error: ${resp.status} ${resp.statusText} ${text}`);
    }
    const json = (await resp.json()) as ChatCompletionResponse;
    return json;
  }
}

export function prependSystemPrompt(messages: ChatMessage[], prompt?: string | null): ChatMessage[] {
  if (!prompt) return messages;
  return [{ role: 'system', content: prompt }, ...messages];
}

export function createAiConfigFromEnv(env: Record<string, string | undefined>): AiConfig {
  // Standardize variable names
  const provider = env.AI_PROVIDER || env.PROVIDER || env.OPENAI_PROVIDER;
  const apiKey = env.AI_API_KEY || env.AI_SECRET || env.SECRET || '';
  const baseURL = env.AI_BASE_URL || env.BASE_URL || '';
  const model = env.AI_MODEL || env.MODEL || env.MODEL_NAME || '';
  return { provider, apiKey, baseURL, model } as AiConfig;
}

export default AiService;
