import { Hono } from 'hono';
import {
  AiProviderError,
  AiService,
  buildRecommendationAutofillMessages,
  DEFAULT_RECOMMENDATION_AUTOFILL_PROMPT,
  parseRecommendationAutofillContent,
  prependSystemPrompt,
  RECOMMENDATION_AUTOFILL_PROMPT_CODE,
} from 'doggy-nav-core';
import type { AiProviderService, ChatMessage, PromptService } from 'doggy-nav-core';
import type { Env } from './index';
import { getDI } from '../ioc/helpers';
import { TOKENS } from '../ioc/tokens';

const aiRoutes = new Hono<{ Bindings: Env }>();

async function createAiConfig(c: any) {
  const svc = getDI(c).resolve(TOKENS.AiProviderService) as AiProviderService;
  const activeProvider = await svc.getActiveConfig();
  if (!activeProvider) {
    const err = new Error('No active AI provider configured');
    (err as any).status = 503;
    throw err;
  }
  return activeProvider;
}

function providerErrorResponse(c: any, e: AiProviderError) {
  console.warn('[ai] provider request failed', {
    provider: e.provider,
    status: e.status,
    request: e.request,
    responseBody: e.responseBody,
  });
  const includeDetails = c.env.NODE_ENV !== 'production';
  return c.json(
    {
      error: {
        message: e.message,
        provider: e.provider,
        status: e.status,
        ...(includeDetails && e.responseBody ? { providerResponse: e.responseBody } : {}),
      },
    },
    502
  );
}

aiRoutes.post('/api/ai/chat', async (c) => {
  try {
    const body = await c.req.json();
    if (!body || !Array.isArray(body.messages)) {
      return c.json({ error: { message: 'messages is required' } }, 400);
    }
    // Low-level chat only applies a backend prompt when callers explicitly request a prompt code.
    let messages: ChatMessage[] = (body.messages as any[]).map((m) => ({
      role: m.role as any,
      content: String(m.content ?? ''),
    }));
    const promptCode = String(body.promptCode || '').trim();
    if (promptCode) {
      try {
        const svc = getDI(c).resolve(TOKENS.PromptService) as PromptService;
        const active = await svc.getActiveByCode(promptCode);
        if (active?.content) messages = prependSystemPrompt(messages, active.content);
      } catch {}
    }
    const cfg = await createAiConfig(c);
    const ai = new AiService(cfg);
    const res = await ai.chatCompletions({
      model: body.model,
      messages,
      temperature: body.temperature,
      max_tokens: body.max_tokens,
      max_completion_tokens: body.max_completion_tokens,
      top_p: body.top_p,
      stop: body.stop,
      frequency_penalty: body.frequency_penalty,
      presence_penalty: body.presence_penalty,
      response_format: body.response_format,
      thinking: body.thinking,
      extra_body: body.extra_body,
      stream: false,
    });
    return c.json(res);
  } catch (e: any) {
    if (e instanceof AiProviderError) {
      return providerErrorResponse(c, e);
    }
    return c.json(
      { error: { message: e?.message || 'inference failed' } },
      e?.status === 503 ? 503 : 500
    );
  }
});

aiRoutes.post('/api/ai/tasks/recommendation-autofill', async (c) => {
  try {
    const body = await c.req.json();
    const url = String(body?.url || '').trim();
    if (!url) return c.json({ error: { message: 'url is required' } }, 400);

    let prompt = DEFAULT_RECOMMENDATION_AUTOFILL_PROMPT;
    try {
      const svc = getDI(c).resolve(TOKENS.PromptService) as PromptService;
      const active = await svc.getActiveByCode(RECOMMENDATION_AUTOFILL_PROMPT_CODE);
      if (active?.content) prompt = active.content;
    } catch {}

    const cfg = await createAiConfig(c);
    const ai = new AiService(cfg);
    const res = await ai.chatCompletions({
      messages: buildRecommendationAutofillMessages(
        {
          url,
        },
        prompt
      ),
      temperature: body.temperature,
      max_tokens: body.max_tokens || 2048,
      max_completion_tokens: body.max_completion_tokens,
      top_p: body.top_p,
      stream: false,
    });
    const values = parseRecommendationAutofillContent(res?.choices?.[0]?.message?.content);
    if (!values) {
      return c.json({ error: { message: 'AI returned invalid recommendation JSON' } }, 502);
    }
    return c.json(values);
  } catch (e: any) {
    if (e instanceof AiProviderError) return providerErrorResponse(c, e);
    return c.json(
      { error: { message: e?.message || 'recommendation autofill failed' } },
      e?.status === 503 ? 503 : 500
    );
  }
});

export default aiRoutes;
