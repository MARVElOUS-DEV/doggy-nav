import { Hono } from 'hono';
import { AiService, createAiConfigFromEnv, prependSystemPrompt } from 'doggy-nav-core';
import type { ChatMessage, PromptService } from 'doggy-nav-core';
import type { Env } from './index';
import { getDI } from '../ioc/helpers';
import { TOKENS } from '../ioc/tokens';

const aiRoutes = new Hono<{ Bindings: Env }>();

aiRoutes.post('/api/ai/chat', async (c) => {
  try {
    const body = await c.req.json();
    if (!body || !Array.isArray(body.messages)) {
      return c.json({ error: { message: 'messages is required' } }, 400);
    }
    // Prepend active system prompt when available
    let messages: ChatMessage[] = (body.messages as any[]).map((m) => ({
      role: m.role as any,
      content: String(m.content ?? ''),
    }));
    try {
      const svc = getDI(c).resolve(TOKENS.PromptService) as PromptService;
      const active = await svc.getActive();
      if (active?.content) messages = prependSystemPrompt(messages, active.content);
    } catch {}
    const cfg = createAiConfigFromEnv({
      AI_PROVIDER: c.env.AI_PROVIDER,
      AI_API_KEY: c.env.AI_API_KEY,
      AI_BASE_URL: c.env.AI_BASE_URL,
      AI_MODEL: c.env.AI_MODEL,
    } as any);
    const ai = new AiService(cfg);
    const res = await ai.chatCompletions({
      model: body.model,
      messages,
      temperature: body.temperature,
      max_tokens: body.max_tokens,
      stream: false,
    });
    return c.json(res);
  } catch (e: any) {
    return c.json({ error: { message: e?.message || 'inference failed' } }, 500);
  }
});

export default aiRoutes;
